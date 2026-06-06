// ============================================================================
// SafeDrive — Signal Processing Utilities
// ============================================================================

/**
 * Low-pass filter to smooth sensor noise.
 * 
 * The low-pass filter removes high-frequency noise (vibrations, road bumps)
 * while preserving the lower-frequency signals we care about (braking, turning).
 * 
 * Formula: filtered = alpha * current + (1 - alpha) * previous
 * 
 * @param current - Current sensor reading
 * @param previous - Previous filtered value
 * @param alpha - Smoothing factor (0-1). Higher = less smoothing.
 * @returns Filtered value
 */
export function lowPassFilter(
  current: number,
  previous: number,
  alpha: number = 0.8
): number {
  return alpha * current + (1 - alpha) * previous;
}

/**
 * Apply low-pass filter to a 3D vector (x, y, z).
 */
export function lowPassFilter3D(
  current: { x: number; y: number; z: number },
  previous: { x: number; y: number; z: number },
  alpha: number = 0.8
): { x: number; y: number; z: number } {
  return {
    x: lowPassFilter(current.x, previous.x, alpha),
    y: lowPassFilter(current.y, previous.y, alpha),
    z: lowPassFilter(current.z, previous.z, alpha),
  };
}

/**
 * High-pass filter to isolate dynamic acceleration (remove gravity).
 * 
 * This is essential for accelerometer data because the sensor always
 * reports ~1g due to gravity. We subtract the slowly-changing gravity
 * component to get only the dynamic acceleration from vehicle movement.
 * 
 * @param current - Current accelerometer reading
 * @param gravity - Current estimated gravity vector
 * @param alpha - Gravity estimation factor (0.8 = slow adaptation)
 */
export function highPassFilter3D(
  current: { x: number; y: number; z: number },
  gravity: { x: number; y: number; z: number },
  alpha: number = 0.8
): {
  filtered: { x: number; y: number; z: number };
  newGravity: { x: number; y: number; z: number };
} {
  // Update gravity estimate (low-pass filtered version of accelerometer)
  const newGravity = {
    x: alpha * gravity.x + (1 - alpha) * current.x,
    y: alpha * gravity.y + (1 - alpha) * current.y,
    z: alpha * gravity.z + (1 - alpha) * current.z,
  };

  // Remove gravity to get dynamic acceleration
  const filtered = {
    x: current.x - newGravity.x,
    y: current.y - newGravity.y,
    z: current.z - newGravity.z,
  };

  return { filtered, newGravity };
}

/**
 * Calculate the magnitude of a 3D vector.
 * Used to get orientation-independent acceleration magnitude.
 * 
 * √(x² + y² + z²)
 */
export function magnitude3D(v: { x: number; y: number; z: number }): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * Calculate standard deviation of an array of numbers.
 * Used for detecting excessive device movement (high variance = unstable).
 */
export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => (v - mean) ** 2);
  const avgSquaredDiff = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Moving average filter.
 * Returns the average of the last N values in the buffer.
 */
export function movingAverage(buffer: number[], windowSize: number): number {
  if (buffer.length === 0) return 0;
  const window = buffer.slice(-windowSize);
  return window.reduce((sum, v) => sum + v, 0) / window.length;
}
