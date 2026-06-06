// ============================================================================
// SafeDrive — Score Calculator Service
// ============================================================================

import { SafetyRating, DrivingEvent, DrivingFeedback, EventType } from '../types';
import { STARTING_SCORE, MINIMUM_SCORE, SAFETY_RATING_THRESHOLDS, EVENT_DESCRIPTIONS } from '../constants/scoring';

/**
 * ScoreCalculator manages the driving score throughout a session.
 * 
 * Scoring Logic:
 * - Score starts at 100 (perfect driving)
 * - Each detected event deducts points based on severity
 * - Score is clamped to a minimum of 0
 * - Safety rating is derived from the final score
 * 
 * The score is designed to be intuitive:
 * - Most drivers should finish between 70-100 for normal driving
 * - Aggressive driving typically results in 40-70
 * - Extremely dangerous driving would be below 40
 */
export class ScoreCalculator {
  private score: number;
  private events: DrivingEvent[];

  constructor() {
    this.score = STARTING_SCORE;
    this.events = [];
  }

  /**
   * Apply a penalty for a detected event.
   * Returns the new score after deduction.
   */
  applyPenalty(event: DrivingEvent): number {
    this.events.push(event);
    this.score = Math.max(MINIMUM_SCORE, this.score - event.penalty);
    return this.score;
  }

  /**
   * Get the current score.
   */
  getScore(): number {
    return this.score;
  }

  /**
   * Get the safety rating for the current score.
   */
  getSafetyRating(): SafetyRating {
    return ScoreCalculator.getRatingForScore(this.score);
  }

  /**
   * Static helper to get safety rating for any score value.
   */
  static getRatingForScore(score: number): SafetyRating {
    for (const threshold of SAFETY_RATING_THRESHOLDS) {
      if (score >= threshold.min && score <= threshold.max) {
        return threshold.rating;
      }
    }
    return SafetyRating.DANGEROUS;
  }

  /**
   * Get event counts by type.
   */
  getEventCounts(): Record<EventType, number> {
    const counts: Record<EventType, number> = {
      [EventType.HARSH_BRAKING]: 0,
      [EventType.HARSH_ACCELERATION]: 0,
      [EventType.SHARP_TURN]: 0,
      [EventType.AGGRESSIVE_STEERING]: 0,
      [EventType.EXCESSIVE_MOVEMENT]: 0,
      [EventType.PHONE_HANDLING]: 0,
    };

    this.events.forEach(event => {
      counts[event.type]++;
    });

    return counts;
  }

  /**
   * Get total penalty points deducted.
   */
  getTotalPenalties(): number {
    return STARTING_SCORE - this.score;
  }

  /**
   * Generate AI-based driving feedback.
   * 
   * This uses rule-based analysis of detected events to provide
   * personalized driving feedback. In a production app, this could
   * be enhanced with actual ML models.
   */
  generateFeedback(): DrivingFeedback {
    const counts = this.getEventCounts();
    const tips: string[] = [];
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Analyze each event type
    if (counts[EventType.HARSH_BRAKING] > 0) {
      improvements.push('Work on smoother braking by anticipating stops earlier');
      tips.push(`You had ${counts[EventType.HARSH_BRAKING]} harsh braking event(s). Try maintaining a larger following distance.`);
    } else {
      strengths.push('Excellent braking control — smooth and predictable');
    }

    if (counts[EventType.HARSH_ACCELERATION] > 0) {
      improvements.push('Accelerate more gradually when starting from stops');
      tips.push(`${counts[EventType.HARSH_ACCELERATION]} harsh acceleration event(s) detected. Gentle acceleration saves fuel and reduces wear.`);
    } else {
      strengths.push('Great acceleration control — gentle and efficient');
    }

    if (counts[EventType.SHARP_TURN] > 0) {
      improvements.push('Slow down before entering turns, not during them');
      tips.push(`${counts[EventType.SHARP_TURN]} sharp turn(s) detected. Reducing speed before turns is safer.`);
    } else {
      strengths.push('Smooth cornering technique');
    }

    if (counts[EventType.AGGRESSIVE_STEERING] > 0) {
      improvements.push('Maintain a steady grip and avoid sudden steering corrections');
      tips.push(`${counts[EventType.AGGRESSIVE_STEERING]} aggressive steering movement(s). Stay focused on the road ahead.`);
    } else {
      strengths.push('Steady and controlled steering');
    }

    if (counts[EventType.PHONE_HANDLING] > 0) {
      improvements.push('⚠️ CRITICAL: Keep your phone secured and avoid touching it while driving');
      tips.push(`${counts[EventType.PHONE_HANDLING]} phone handling event(s) detected. Phone use while driving is extremely dangerous.`);
    } else {
      strengths.push('No phone handling detected — great discipline!');
    }

    if (counts[EventType.EXCESSIVE_MOVEMENT] > 0) {
      tips.push('Consider securing your phone in a stable mount to reduce movement-related false positives.');
    }

    // Generate overall message based on rating
    const rating = this.getSafetyRating();
    let overallMessage = '';
    switch (rating) {
      case SafetyRating.EXCELLENT:
        overallMessage = '🏆 Outstanding driving! You demonstrated excellent control and awareness throughout this trip. Keep up the great work!';
        break;
      case SafetyRating.GOOD:
        overallMessage = '👍 Good driving overall! A few areas could use improvement, but you showed solid driving habits.';
        break;
      case SafetyRating.FAIR:
        overallMessage = '⚡ Fair driving performance. There are some concerning patterns that should be addressed for safer driving.';
        break;
      case SafetyRating.POOR:
        overallMessage = '⚠️ Your driving needs significant improvement. Multiple unsafe behaviors were detected during this trip.';
        break;
      case SafetyRating.DANGEROUS:
        overallMessage = '🚨 Dangerous driving detected! Please focus on safety. Multiple high-risk behaviors put you and others at serious risk.';
        break;
    }

    return {
      overallMessage,
      tips,
      strengths,
      improvements,
    };
  }

  /**
   * Reset the calculator for a new session.
   */
  reset(): void {
    this.score = STARTING_SCORE;
    this.events = [];
  }
}
