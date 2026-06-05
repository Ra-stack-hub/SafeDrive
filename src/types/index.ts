// ============================================================================
// SafeDrive — Type Definitions
// ============================================================================

/**
 * Raw sensor data from device sensors.
 * All values are in SI units (g-force for accelerometer, rad/s for gyroscope).
 */
export interface SensorData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

/**
 * Device motion data combining accelerometer, gyroscope, and orientation.
 */
export interface DeviceMotionData {
  acceleration: { x: number; y: number; z: number } | null;
  accelerationIncludingGravity: { x: number; y: number; z: number } | null;
  rotation: { alpha: number; beta: number; gamma: number } | null;
  rotationRate: { alpha: number; beta: number; gamma: number } | null;
  orientation: number;
  timestamp: number;
}

/**
 * Types of driving events that can be detected.
 */
export enum EventType {
  HARSH_BRAKING = 'HARSH_BRAKING',
  HARSH_ACCELERATION = 'HARSH_ACCELERATION',
  SHARP_TURN = 'SHARP_TURN',
  AGGRESSIVE_STEERING = 'AGGRESSIVE_STEERING',
  EXCESSIVE_MOVEMENT = 'EXCESSIVE_MOVEMENT',
  PHONE_HANDLING = 'PHONE_HANDLING',
}

/**
 * A detected driving event with metadata.
 */
export interface DrivingEvent {
  id: string;
  type: EventType;
  timestamp: number;
  /** Time since drive session started, in milliseconds */
  elapsedTime: number;
  /** Measured value that triggered the event (e.g., g-force magnitude) */
  magnitude: number;
  /** Points deducted for this event */
  penalty: number;
  /** Human-readable description */
  description: string;
  /** GPS coordinates at time of event, if available */
  location?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Safety rating categories based on final score.
 */
export enum SafetyRating {
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  FAIR = 'Fair',
  POOR = 'Poor',
  DANGEROUS = 'Dangerous',
}

/**
 * Complete driving session record.
 */
export interface DriveSessionData {
  id: string;
  startTime: number;
  endTime: number | null;
  /** Duration in milliseconds */
  duration: number;
  /** Current driving score (starts at 100) */
  score: number;
  /** Safety rating derived from score */
  safetyRating: SafetyRating;
  /** All detected events during the session */
  events: DrivingEvent[];
  /** Event counts by type */
  eventCounts: Record<EventType, number>;
  /** Total number of events */
  totalEvents: number;
  /** GPS route coordinates */
  route: RoutePoint[];
  /** Whether the session is currently active */
  isActive: boolean;
  /** Distance traveled in meters */
  distance: number;
  /** Maximum speed detected in m/s */
  maxSpeed: number;
  /** Average speed in m/s */
  avgSpeed: number;
}

/**
 * GPS route point for route replay.
 */
export interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number | null;
  /** Events that occurred at this point */
  events: string[];
}

/**
 * Sensor subscription status.
 */
export interface SensorStatus {
  accelerometer: boolean;
  gyroscope: boolean;
  deviceMotion: boolean;
  magnetometer: boolean;
}

/**
 * Threshold configuration for event detection.
 */
export interface ThresholdConfig {
  /** Value threshold in sensor units (g-force or rad/s) */
  value: number;
  /** Minimum duration in ms for threshold to be exceeded */
  duration: number;
  /** Cooldown period in ms before same event can trigger again */
  cooldown: number;
  /** Points deducted when event is detected */
  penalty: number;
}

/**
 * AI-generated driving feedback.
 */
export interface DrivingFeedback {
  overallMessage: string;
  tips: string[];
  strengths: string[];
  improvements: string[];
}

/**
 * Historical drive summary for the history screen.
 */
export interface DriveHistoryItem {
  id: string;
  date: string;
  duration: number;
  score: number;
  safetyRating: SafetyRating;
  totalEvents: number;
  distance: number;
}
