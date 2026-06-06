// ============================================================================
// SafeDrive — Drive Session Hook
// ============================================================================
// 
// Central hook that orchestrates the entire driving session:
// - Manages sensor subscriptions via refs (avoids re-renders)
// - Routes sensor data to EventDetector for analysis
// - Updates score via ScoreCalculator
// - Tracks drive duration and statistics
// - Handles session lifecycle (start/end)
//
// Performance Strategy:
// - Sensor data stored in useRef (no re-renders per reading)
// - UI state updated at 1Hz via setInterval (not per sensor event)
// - Event detection runs in the processing callback (no separate thread)
// - Clean subscription cleanup on unmount
//
// ============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { Accelerometer, Gyroscope, DeviceMotion, Magnetometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import {
  DriveSessionData,
  DrivingEvent,
  EventType,
  SafetyRating,
  SensorStatus,
  RoutePoint,
} from '../types';
import { EventDetector } from '../services/EventDetector';
import { ScoreCalculator } from '../services/ScoreCalculator';
import { StorageService } from '../services/StorageService';
import { highPassFilter3D, lowPassFilter3D, magnitude3D } from '../utils/filters';
import { SENSOR_INTERVALS, LOW_PASS_ALPHA } from '../constants/thresholds';
import { generateId } from '../utils/formatters';

interface SensorReadings {
  accelerometer: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
  deviceMotion: {
    acceleration: { x: number; y: number; z: number } | null;
    rotationRate: { x: number; y: number; z: number } | null;
  };
  magnetometer: { x: number; y: number; z: number };
}

interface UseDriveSessionReturn {
  // Session state
  isActive: boolean;
  session: DriveSessionData | null;
  
  // Live data (updated at 1Hz for UI)
  currentScore: number;
  safetyRating: SafetyRating;
  events: DrivingEvent[];
  duration: number;
  totalEvents: number;
  eventCounts: Record<EventType, number>;
  
  // Sensor readings (updated at 1Hz for UI display)
  sensorReadings: SensorReadings;
  sensorStatus: SensorStatus;
  
  // Actions
  startDrive: () => Promise<void>;
  endDrive: () => Promise<DriveSessionData>;
}

export function useDriveSession(): UseDriveSessionReturn {
  // ---- UI State (updated at 1Hz) ----
  const [isActive, setIsActive] = useState(false);
  const [currentScore, setCurrentScore] = useState(100);
  const [safetyRating, setSafetyRating] = useState<SafetyRating>(SafetyRating.EXCELLENT);
  const [events, setEvents] = useState<DrivingEvent[]>([]);
  const [duration, setDuration] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [eventCounts, setEventCounts] = useState<Record<EventType, number>>({
    [EventType.HARSH_BRAKING]: 0,
    [EventType.HARSH_ACCELERATION]: 0,
    [EventType.SHARP_TURN]: 0,
    [EventType.AGGRESSIVE_STEERING]: 0,
    [EventType.EXCESSIVE_MOVEMENT]: 0,
    [EventType.PHONE_HANDLING]: 0,
  });
  const [sensorReadings, setSensorReadings] = useState<SensorReadings>({
    accelerometer: { x: 0, y: 0, z: 0 },
    gyroscope: { x: 0, y: 0, z: 0 },
    deviceMotion: { acceleration: null, rotationRate: null },
    magnetometer: { x: 0, y: 0, z: 0 },
  });
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>({
    accelerometer: false,
    gyroscope: false,
    deviceMotion: false,
    magnetometer: false,
  });
  const [session, setSession] = useState<DriveSessionData | null>(null);

  // ---- Refs for high-frequency data (no re-renders) ----
  const subscriptionsRef = useRef<any[]>([]);
  const eventDetectorRef = useRef<EventDetector | null>(null);
  const scoreCalculatorRef = useRef<ScoreCalculator>(new ScoreCalculator());
  const startTimeRef = useRef<number>(0);
  const uiUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isActiveRef = useRef(false);

  // Live sensor data refs (updated at sensor rate, read at UI rate)
  const accelRef = useRef({ x: 0, y: 0, z: 0 });
  const gyroRef = useRef({ x: 0, y: 0, z: 0 });
  const deviceMotionRef = useRef<{
    acceleration: { x: number; y: number; z: number } | null;
    rotationRate: { x: number; y: number; z: number } | null;
  }>({ acceleration: null, rotationRate: null });
  const magnetRef = useRef({ x: 0, y: 0, z: 0 });

  // Gravity estimate for high-pass filtering
  const gravityRef = useRef({ x: 0, y: 0, z: 0 });
  
  // Previous filtered values for low-pass filtering
  const prevAccelRef = useRef({ x: 0, y: 0, z: 0 });
  const prevGyroRef = useRef({ x: 0, y: 0, z: 0 });

  // Score and events refs for fast access
  const scoreRef = useRef(100);
  const eventsRef = useRef<DrivingEvent[]>([]);
  const eventCountsRef = useRef<Record<EventType, number>>({
    [EventType.HARSH_BRAKING]: 0,
    [EventType.HARSH_ACCELERATION]: 0,
    [EventType.SHARP_TURN]: 0,
    [EventType.AGGRESSIVE_STEERING]: 0,
    [EventType.EXCESSIVE_MOVEMENT]: 0,
    [EventType.PHONE_HANDLING]: 0,
  });

  /**
   * Handle a newly detected event.
   * Updates score, adds to events list, triggers haptic feedback.
   */
  const handleEventDetected = useCallback((event: DrivingEvent) => {
    // Apply penalty
    const newScore = scoreCalculatorRef.current.applyPenalty(event);
    scoreRef.current = newScore;

    // Add to events
    eventsRef.current = [...eventsRef.current, event];

    // Update counts
    eventCountsRef.current = {
      ...eventCountsRef.current,
      [event.type]: (eventCountsRef.current[event.type] || 0) + 1,
    };

    // Trigger haptic feedback for event detection
    try {
      if (event.type === EventType.PHONE_HANDLING) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (e) {
      // Haptics may not be available on all devices
    }
  }, []);

  /**
   * Start all sensor subscriptions.
   */
  const subscribeSensors = useCallback(() => {
    const subs: any[] = [];
    const newStatus: SensorStatus = {
      accelerometer: false,
      gyroscope: false,
      deviceMotion: false,
      magnetometer: false,
    };

    try {
      // Accelerometer
      Accelerometer.setUpdateInterval(SENSOR_INTERVALS.ACCELEROMETER);
      const accelSub = Accelerometer.addListener((data) => {
        if (!isActiveRef.current) return;
        
        // Low-pass filter to smooth noise
        const filtered = lowPassFilter3D(data, prevAccelRef.current, LOW_PASS_ALPHA);
        prevAccelRef.current = filtered;
        
        // High-pass filter to remove gravity
        const { filtered: dynamic, newGravity } = highPassFilter3D(
          filtered,
          gravityRef.current,
          0.8
        );
        gravityRef.current = newGravity;
        
        accelRef.current = filtered;
        
        // Send to event detector (with gravity-compensated values)
        eventDetectorRef.current?.processAccelerometer(dynamic, Date.now());
      });
      subs.push(accelSub);
      newStatus.accelerometer = true;
    } catch (e) {
      console.warn('Accelerometer not available:', e);
    }

    try {
      // Gyroscope
      Gyroscope.setUpdateInterval(SENSOR_INTERVALS.GYROSCOPE);
      const gyroSub = Gyroscope.addListener((data) => {
        if (!isActiveRef.current) return;
        
        // Low-pass filter
        const filtered = lowPassFilter3D(data, prevGyroRef.current, LOW_PASS_ALPHA);
        prevGyroRef.current = filtered;
        
        gyroRef.current = filtered;
        
        // Send to event detector
        eventDetectorRef.current?.processGyroscope(filtered, Date.now());
      });
      subs.push(gyroSub);
      newStatus.gyroscope = true;
    } catch (e) {
      console.warn('Gyroscope not available:', e);
    }

    try {
      // DeviceMotion
      DeviceMotion.setUpdateInterval(SENSOR_INTERVALS.DEVICE_MOTION);
      const dmSub = DeviceMotion.addListener((data) => {
        if (!isActiveRef.current) return;
        
        const acceleration = data.acceleration || null;
        const rotationRate = data.rotationRate || null;
        
        deviceMotionRef.current = {
          acceleration: acceleration ? { x: acceleration.x, y: acceleration.y, z: acceleration.z } : null,
          rotationRate: rotationRate ? {
            x: rotationRate.alpha || 0,
            y: rotationRate.beta || 0,
            z: rotationRate.gamma || 0,
          } : null,
        };
        
        // Send to event detector for phone handling detection
        eventDetectorRef.current?.processDeviceMotion(
          acceleration ? { x: acceleration.x, y: acceleration.y, z: acceleration.z } : null,
          rotationRate ? {
            x: rotationRate.alpha || 0,
            y: rotationRate.beta || 0,
            z: rotationRate.gamma || 0,
          } : null,
          Date.now()
        );
      });
      subs.push(dmSub);
      newStatus.deviceMotion = true;
    } catch (e) {
      console.warn('DeviceMotion not available:', e);
    }

    try {
      // Magnetometer (optional, lower frequency)
      Magnetometer.setUpdateInterval(SENSOR_INTERVALS.MAGNETOMETER);
      const magSub = Magnetometer.addListener((data) => {
        if (!isActiveRef.current) return;
        magnetRef.current = data;
      });
      subs.push(magSub);
      newStatus.magnetometer = true;
    } catch (e) {
      console.warn('Magnetometer not available:', e);
    }

    subscriptionsRef.current = subs;
    setSensorStatus(newStatus);
  }, []);

  /**
   * Unsubscribe all sensors and clean up.
   */
  const unsubscribeSensors = useCallback(() => {
    subscriptionsRef.current.forEach(sub => {
      try {
        sub.remove();
      } catch (e) {
        // Ignore cleanup errors
      }
    });
    subscriptionsRef.current = [];
    setSensorStatus({
      accelerometer: false,
      gyroscope: false,
      deviceMotion: false,
      magnetometer: false,
    });
  }, []);

  /**
   * Start a new driving session.
   */
  const startDrive = useCallback(async () => {
    const now = Date.now();
    startTimeRef.current = now;
    isActiveRef.current = true;

    // Reset services
    const detector = new EventDetector(now);
    detector.setEventCallback(handleEventDetected);
    eventDetectorRef.current = detector;
    
    scoreCalculatorRef.current.reset();
    scoreRef.current = 100;
    eventsRef.current = [];
    eventCountsRef.current = {
      [EventType.HARSH_BRAKING]: 0,
      [EventType.HARSH_ACCELERATION]: 0,
      [EventType.SHARP_TURN]: 0,
      [EventType.AGGRESSIVE_STEERING]: 0,
      [EventType.EXCESSIVE_MOVEMENT]: 0,
      [EventType.PHONE_HANDLING]: 0,
    };

    // Reset filter states
    gravityRef.current = { x: 0, y: 0, z: 0 };
    prevAccelRef.current = { x: 0, y: 0, z: 0 };
    prevGyroRef.current = { x: 0, y: 0, z: 0 };

    // Reset UI state
    setCurrentScore(100);
    setSafetyRating(SafetyRating.EXCELLENT);
    setEvents([]);
    setDuration(0);
    setTotalEvents(0);
    setEventCounts({
      [EventType.HARSH_BRAKING]: 0,
      [EventType.HARSH_ACCELERATION]: 0,
      [EventType.SHARP_TURN]: 0,
      [EventType.AGGRESSIVE_STEERING]: 0,
      [EventType.EXCESSIVE_MOVEMENT]: 0,
      [EventType.PHONE_HANDLING]: 0,
    });

    // Subscribe to sensors
    subscribeSensors();

    // Start UI update interval (1Hz - battery efficient)
    uiUpdateIntervalRef.current = setInterval(() => {
      if (!isActiveRef.current) return;

      const elapsed = Date.now() - startTimeRef.current;
      setDuration(elapsed);
      setCurrentScore(scoreRef.current);
      setSafetyRating(ScoreCalculator.getRatingForScore(scoreRef.current));
      setEvents([...eventsRef.current]);
      setTotalEvents(eventsRef.current.length);
      setEventCounts({ ...eventCountsRef.current });
      setSensorReadings({
        accelerometer: { ...accelRef.current },
        gyroscope: { ...gyroRef.current },
        deviceMotion: { ...deviceMotionRef.current },
        magnetometer: { ...magnetRef.current },
      });
    }, 1000);

    setIsActive(true);

    // Haptic feedback for drive start
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {
      // Haptics may not be available
    }
  }, [handleEventDetected, subscribeSensors]);

  /**
   * End the current driving session.
   * Returns the complete session data.
   */
  const endDrive = useCallback(async (): Promise<DriveSessionData> => {
    const endTime = Date.now();
    isActiveRef.current = false;

    // Stop UI updates
    if (uiUpdateIntervalRef.current) {
      clearInterval(uiUpdateIntervalRef.current);
      uiUpdateIntervalRef.current = null;
    }

    // Unsubscribe sensors
    unsubscribeSensors();

    // Build session data
    const sessionData: DriveSessionData = {
      id: generateId(),
      startTime: startTimeRef.current,
      endTime,
      duration: endTime - startTimeRef.current,
      score: scoreRef.current,
      safetyRating: ScoreCalculator.getRatingForScore(scoreRef.current),
      events: eventsRef.current,
      eventCounts: { ...eventCountsRef.current },
      totalEvents: eventsRef.current.length,
      route: [],
      isActive: false,
      distance: 0,
      maxSpeed: 0,
      avgSpeed: 0,
    };

    // Save to storage
    await StorageService.saveSession(sessionData);

    // Update UI state
    setIsActive(false);
    setSession(sessionData);
    setCurrentScore(scoreRef.current);
    setSafetyRating(sessionData.safetyRating);
    setDuration(sessionData.duration);
    setEvents([...eventsRef.current]);
    setTotalEvents(eventsRef.current.length);
    setEventCounts({ ...eventCountsRef.current });

    // Haptic feedback for drive end
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // Haptics may not be available
    }

    return sessionData;
  }, [unsubscribeSensors]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isActiveRef.current) {
        unsubscribeSensors();
      }
      if (uiUpdateIntervalRef.current) {
        clearInterval(uiUpdateIntervalRef.current);
      }
    };
  }, [unsubscribeSensors]);

  return {
    isActive,
    session,
    currentScore,
    safetyRating,
    events,
    duration,
    totalEvents,
    eventCounts,
    sensorReadings,
    sensorStatus,
    startDrive,
    endDrive,
  };
}
