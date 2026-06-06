// ============================================================================
// SafeDrive — Event Detector Service
// ============================================================================
//
// This service analyzes filtered sensor data and detects driving events
// based on calibrated thresholds. It implements:
//   - Duration gating: Events only trigger if threshold exceeded for minimum time
//   - Cooldown periods: Prevents duplicate events from the same incident
//   - Gravity compensation: Removes static gravity from accelerometer data
//   - Orientation independence: Uses vector magnitude for detection
//
// ============================================================================

import { EventType, DrivingEvent } from '../types';
import { EVENT_THRESHOLDS, PHONE_HANDLING_ACCEL_THRESHOLD } from '../constants/thresholds';
import { EVENT_DESCRIPTIONS } from '../constants/scoring';
import { magnitude3D, standardDeviation } from '../utils/filters';
import { generateId } from '../utils/formatters';

interface EventDetectorState {
  /** Timestamps when each threshold was first exceeded */
  thresholdStartTimes: Record<EventType, number | null>;
  /** Timestamps of last detected event of each type (for cooldown) */
  lastEventTimes: Record<EventType, number>;
  /** Buffer of recent acceleration magnitudes for variance calculation */
  accelMagnitudeBuffer: number[];
  /** Drive session start time */
  driveStartTime: number;
}

/**
 * EventDetector analyzes sensor data and emits driving events.
 * 
 * Detection strategy:
 * 1. Each sensor reading is checked against thresholds
 * 2. If threshold is exceeded, a timer starts
 * 3. If threshold remains exceeded for the required duration, event fires
 * 4. After firing, a cooldown prevents the same event type from firing again
 * 5. Special handling for phone handling (requires combined rotation + acceleration)
 */
export class EventDetector {
  private state: EventDetectorState;
  private onEventDetected: ((event: DrivingEvent) => void) | null = null;

  constructor(driveStartTime: number) {
    this.state = {
      thresholdStartTimes: {
        [EventType.HARSH_BRAKING]: null,
        [EventType.HARSH_ACCELERATION]: null,
        [EventType.SHARP_TURN]: null,
        [EventType.AGGRESSIVE_STEERING]: null,
        [EventType.EXCESSIVE_MOVEMENT]: null,
        [EventType.PHONE_HANDLING]: null,
      },
      lastEventTimes: {
        [EventType.HARSH_BRAKING]: 0,
        [EventType.HARSH_ACCELERATION]: 0,
        [EventType.SHARP_TURN]: 0,
        [EventType.AGGRESSIVE_STEERING]: 0,
        [EventType.EXCESSIVE_MOVEMENT]: 0,
        [EventType.PHONE_HANDLING]: 0,
      },
      accelMagnitudeBuffer: [],
      driveStartTime,
    };
  }

  /**
   * Set callback for when an event is detected.
   */
  setEventCallback(callback: (event: DrivingEvent) => void): void {
    this.onEventDetected = callback;
  }

  /**
   * Process accelerometer data for harsh braking and acceleration detection.
   * 
   * After gravity compensation (done by caller), the dynamic acceleration
   * magnitude indicates how forcefully the vehicle is braking or accelerating.
   * 
   * @param dynamicAccel - Gravity-compensated acceleration vector (in g-force)
   * @param timestamp - Current timestamp
   */
  processAccelerometer(
    dynamicAccel: { x: number; y: number; z: number },
    timestamp: number
  ): void {
    const mag = magnitude3D(dynamicAccel);

    // Buffer magnitudes for excessive movement detection
    this.state.accelMagnitudeBuffer.push(mag);
    // Keep buffer to ~2 seconds (at 10Hz = 20 samples)
    if (this.state.accelMagnitudeBuffer.length > 20) {
      this.state.accelMagnitudeBuffer.shift();
    }

    // Check harsh braking (high deceleration)
    this.checkThreshold(
      EventType.HARSH_BRAKING,
      mag,
      timestamp
    );

    // Check harsh acceleration (high positive acceleration)
    // We use the same magnitude since we can't reliably determine
    // direction without knowing vehicle orientation
    this.checkThreshold(
      EventType.HARSH_ACCELERATION,
      mag,
      timestamp
    );

    // Check excessive device movement (high variance in acceleration)
    if (this.state.accelMagnitudeBuffer.length >= 20) {
      const variance = standardDeviation(this.state.accelMagnitudeBuffer);
      this.checkThreshold(
        EventType.EXCESSIVE_MOVEMENT,
        variance,
        timestamp
      );
    }
  }

  /**
   * Process gyroscope data for turn and steering detection.
   * 
   * The rotation rate magnitude indicates how quickly the device (and vehicle)
   * is turning. High rotation rates indicate sharp turns or aggressive steering.
   * 
   * @param rotationRate - Rotation rate vector (in rad/s)
   * @param timestamp - Current timestamp
   */
  processGyroscope(
    rotationRate: { x: number; y: number; z: number },
    timestamp: number
  ): void {
    const rotMag = magnitude3D(rotationRate);

    // Check sharp turn
    this.checkThreshold(
      EventType.SHARP_TURN,
      rotMag,
      timestamp
    );

    // Check aggressive steering (higher threshold, shorter duration)
    this.checkThreshold(
      EventType.AGGRESSIVE_STEERING,
      rotMag,
      timestamp
    );
  }

  /**
   * Process device motion data for phone handling detection.
   * 
   * Phone handling is detected when BOTH:
   * - Rotation rate exceeds threshold (phone being rotated/picked up)
   * - Acceleration exceeds threshold (phone being moved)
   * 
   * This dual requirement significantly reduces false positives from
   * normal driving vibrations.
   * 
   * @param acceleration - Dynamic acceleration (gravity removed)
   * @param rotationRate - Rotation rate
   * @param timestamp - Current timestamp
   */
  processDeviceMotion(
    acceleration: { x: number; y: number; z: number } | null,
    rotationRate: { x: number; y: number; z: number } | null,
    timestamp: number
  ): void {
    if (!acceleration || !rotationRate) return;

    const accelMag = magnitude3D(acceleration);
    const rotMag = magnitude3D(rotationRate);

    // Phone handling requires BOTH rotation and acceleration thresholds
    const threshold = EVENT_THRESHOLDS[EventType.PHONE_HANDLING];
    const isPhoneBeingHandled =
      rotMag > threshold.value &&
      accelMag > PHONE_HANDLING_ACCEL_THRESHOLD;

    if (isPhoneBeingHandled) {
      this.checkThreshold(
        EventType.PHONE_HANDLING,
        Math.max(rotMag, accelMag), // Use higher value for magnitude record
        timestamp
      );
    } else {
      // Reset the threshold timer if conditions aren't met
      this.state.thresholdStartTimes[EventType.PHONE_HANDLING] = null;
    }
  }

  /**
   * Core threshold checking logic with duration gating and cooldown.
   * 
   * @param eventType - The type of event to check
   * @param currentValue - The current sensor value
   * @param timestamp - Current timestamp
   */
  private checkThreshold(
    eventType: EventType,
    currentValue: number,
    timestamp: number
  ): void {
    const threshold = EVENT_THRESHOLDS[eventType];

    // Check if we're in cooldown period
    const timeSinceLastEvent = timestamp - this.state.lastEventTimes[eventType];
    if (timeSinceLastEvent < threshold.cooldown) {
      return;
    }

    if (currentValue > threshold.value) {
      // Threshold exceeded - start or continue timing
      if (this.state.thresholdStartTimes[eventType] === null) {
        // First time exceeding threshold
        this.state.thresholdStartTimes[eventType] = timestamp;
      } else {
        // Check if duration requirement is met
        const duration = timestamp - this.state.thresholdStartTimes[eventType]!;
        if (duration >= threshold.duration) {
          // Event detected!
          this.emitEvent(eventType, currentValue, timestamp);
          // Reset and start cooldown
          this.state.thresholdStartTimes[eventType] = null;
          this.state.lastEventTimes[eventType] = timestamp;
        }
      }
    } else {
      // Below threshold - reset timer
      this.state.thresholdStartTimes[eventType] = null;
    }
  }

  /**
   * Emit a detected event via the callback.
   */
  private emitEvent(
    type: EventType,
    magnitude: number,
    timestamp: number
  ): void {
    if (!this.onEventDetected) return;

    const threshold = EVENT_THRESHOLDS[type];
    const event: DrivingEvent = {
      id: generateId(),
      type,
      timestamp,
      elapsedTime: timestamp - this.state.driveStartTime,
      magnitude,
      penalty: threshold.penalty,
      description: EVENT_DESCRIPTIONS[type],
    };

    this.onEventDetected(event);
  }

  /**
   * Reset all state. Called when starting a new drive.
   */
  reset(driveStartTime: number): void {
    this.state.driveStartTime = driveStartTime;
    this.state.accelMagnitudeBuffer = [];
    Object.keys(this.state.thresholdStartTimes).forEach((key) => {
      this.state.thresholdStartTimes[key as EventType] = null;
    });
    Object.keys(this.state.lastEventTimes).forEach((key) => {
      this.state.lastEventTimes[key as EventType] = 0;
    });
  }
}
