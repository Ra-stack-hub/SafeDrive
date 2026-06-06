// ============================================================================
// SafeDrive — Scoring System Constants
// ============================================================================

import { EventType, SafetyRating } from '../types';

/**
 * Starting score for each drive session.
 */
export const STARTING_SCORE = 100;

/**
 * Minimum possible score (clamped).
 */
export const MINIMUM_SCORE = 0;

/**
 * Point penalties for each event type.
 * These match the threshold penalties for consistency.
 */
export const EVENT_PENALTIES: Record<EventType, number> = {
  [EventType.HARSH_BRAKING]: 5,
  [EventType.HARSH_ACCELERATION]: 5,
  [EventType.SHARP_TURN]: 3,
  [EventType.AGGRESSIVE_STEERING]: 4,
  [EventType.EXCESSIVE_MOVEMENT]: 2,
  [EventType.PHONE_HANDLING]: 10,
};

/**
 * Safety rating thresholds.
 * Score ranges mapped to human-readable ratings.
 */
export const SAFETY_RATING_THRESHOLDS: { min: number; max: number; rating: SafetyRating }[] = [
  { min: 90, max: 100, rating: SafetyRating.EXCELLENT },
  { min: 75, max: 89, rating: SafetyRating.GOOD },
  { min: 60, max: 74, rating: SafetyRating.FAIR },
  { min: 40, max: 59, rating: SafetyRating.POOR },
  { min: 0, max: 39, rating: SafetyRating.DANGEROUS },
];

/**
 * Human-readable descriptions for event types.
 */
export const EVENT_DESCRIPTIONS: Record<EventType, string> = {
  [EventType.HARSH_BRAKING]: 'Harsh Braking',
  [EventType.HARSH_ACCELERATION]: 'Harsh Acceleration',
  [EventType.SHARP_TURN]: 'Sharp Turn',
  [EventType.AGGRESSIVE_STEERING]: 'Aggressive Steering',
  [EventType.EXCESSIVE_MOVEMENT]: 'Excessive Movement',
  [EventType.PHONE_HANDLING]: 'Phone Handling',
};

/**
 * Icons for each event type (Ionicons names).
 */
export const EVENT_ICONS: Record<EventType, string> = {
  [EventType.HARSH_BRAKING]: 'warning',
  [EventType.HARSH_ACCELERATION]: 'speedometer',
  [EventType.SHARP_TURN]: 'git-branch',
  [EventType.AGGRESSIVE_STEERING]: 'swap-horizontal',
  [EventType.EXCESSIVE_MOVEMENT]: 'phone-portrait',
  [EventType.PHONE_HANDLING]: 'hand-left',
};

/**
 * Colors for each event type severity.
 */
export const EVENT_COLORS: Record<EventType, string> = {
  [EventType.HARSH_BRAKING]: '#FF5252',
  [EventType.HARSH_ACCELERATION]: '#FF7043',
  [EventType.SHARP_TURN]: '#FFB300',
  [EventType.AGGRESSIVE_STEERING]: '#FF7043',
  [EventType.EXCESSIVE_MOVEMENT]: '#FFD54F',
  [EventType.PHONE_HANDLING]: '#FF1744',
};
