// ============================================================================
// SafeDrive — Event Detection Thresholds
// ============================================================================
// 
// These thresholds are calibrated based on telematics industry standards.
// Professional fleet systems typically use 0.4-0.6g for harsh events.
// We use slightly lower thresholds for smartphone-based detection since
// phone mounting introduces additional noise.
//
// Each threshold has three components:
//   - value: The sensor reading that must be exceeded (g-force or rad/s)
//   - duration: Minimum time the threshold must be exceeded (prevents false positives from bumps)
//   - cooldown: Minimum time between consecutive same-type events (prevents duplicates)
//
// ============================================================================

import { EventType, ThresholdConfig } from '../types';

/**
 * Event detection thresholds.
 * 
 * Rationale for each threshold:
 * 
 * HARSH_BRAKING (0.45g, 200ms):
 *   - Normal braking: 0.1-0.3g
 *   - Hard braking: 0.3-0.5g  
 *   - Emergency braking: 0.6-1.0g
 *   - We use 0.45g as the trigger point for "harsh" braking
 *   - 200ms duration gate filters out potholes and speed bumps
 * 
 * HARSH_ACCELERATION (0.40g, 200ms):
 *   - Normal acceleration: 0.1-0.2g
 *   - Aggressive acceleration: 0.3-0.5g
 *   - 0.40g captures aggressive but not extreme acceleration
 * 
 * SHARP_TURN (1.5 rad/s, 300ms):
 *   - Normal turn: 0.2-0.8 rad/s
 *   - Sharp turn: 1.0-2.0 rad/s
 *   - 300ms duration ensures sustained turn, not momentary rotation
 * 
 * AGGRESSIVE_STEERING (2.0 rad/s, 150ms):
 *   - Rapid back-and-forth steering or swerving
 *   - Higher threshold but shorter duration than sharp turns
 *   - Captures erratic steering behavior
 * 
 * EXCESSIVE_MOVEMENT (0.3g variance, 2000ms):
 *   - Measures acceleration variance over a 2-second window
 *   - High variance indicates unstable device or rough driving
 * 
 * PHONE_HANDLING (combined: rotation > 1.0 rad/s AND accel > 0.5g, 500ms):
 *   - Detects when the phone is picked up and rotated during driving
 *   - Requires BOTH rotation and acceleration to trigger (reduces false positives)
 *   - 500ms ensures deliberate handling, not incidental vibration
 *   - Highest penalty (-10) as phone usage is the most dangerous behavior
 */
export const EVENT_THRESHOLDS: Record<EventType, ThresholdConfig> = {
  [EventType.HARSH_BRAKING]: {
    value: 0.45,         // g-force
    duration: 200,       // ms
    cooldown: 2000,      // ms
    penalty: 5,
  },
  [EventType.HARSH_ACCELERATION]: {
    value: 0.40,         // g-force
    duration: 200,       // ms
    cooldown: 2000,      // ms
    penalty: 5,
  },
  [EventType.SHARP_TURN]: {
    value: 1.5,          // rad/s
    duration: 300,       // ms
    cooldown: 2000,      // ms
    penalty: 3,
  },
  [EventType.AGGRESSIVE_STEERING]: {
    value: 2.0,          // rad/s
    duration: 150,       // ms
    cooldown: 2000,      // ms
    penalty: 4,
  },
  [EventType.EXCESSIVE_MOVEMENT]: {
    value: 0.3,          // g-force standard deviation
    duration: 2000,      // ms (window size)
    cooldown: 5000,      // ms
    penalty: 2,
  },
  [EventType.PHONE_HANDLING]: {
    value: 1.0,          // combined: rotation threshold (rad/s)
    duration: 500,       // ms
    cooldown: 5000,      // ms
    penalty: 10,
  },
};

/**
 * Sensor update intervals in milliseconds.
 * 10Hz (100ms) provides good detection while being battery-efficient.
 * Magnetometer runs at 2Hz (500ms) since heading changes slowly.
 */
export const SENSOR_INTERVALS = {
  ACCELEROMETER: 100,    // 10Hz
  GYROSCOPE: 100,        // 10Hz
  DEVICE_MOTION: 100,    // 10Hz
  MAGNETOMETER: 500,     // 2Hz
};

/**
 * Low-pass filter coefficient.
 * Higher values = less smoothing (more responsive, more noise).
 * Lower values = more smoothing (less responsive, less noise).
 * 0.8 is a good balance for driving event detection.
 */
export const LOW_PASS_ALPHA = 0.8;

/**
 * Phone handling detection requires both rotation AND acceleration
 * to exceed their respective thresholds simultaneously.
 */
export const PHONE_HANDLING_ACCEL_THRESHOLD = 0.5; // g-force
