// ============================================================================
// SafeDrive — Storage Service
// ============================================================================
// Handles persistent storage of drive sessions using AsyncStorage.
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DriveSessionData, DriveHistoryItem } from '../types';

const STORAGE_KEYS = {
  SESSIONS: '@safedrive_sessions',
  LAST_SESSION: '@safedrive_last_session',
};

/**
 * StorageService manages persistent storage of drive sessions.
 */
export class StorageService {
  /**
   * Save a completed drive session.
   */
  static async saveSession(session: DriveSessionData): Promise<void> {
    try {
      // Save as last session for quick access
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_SESSION,
        JSON.stringify(session)
      );

      // Add to sessions list
      const existing = await StorageService.getAllSessions();
      existing.unshift(session); // Most recent first
      
      // Keep only last 50 sessions to save storage
      const trimmed = existing.slice(0, 50);
      await AsyncStorage.setItem(
        STORAGE_KEYS.SESSIONS,
        JSON.stringify(trimmed)
      );
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  /**
   * Get the most recent completed drive session.
   */
  static async getLastSession(): Promise<DriveSessionData | null> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SESSION);
      if (json) {
        return JSON.parse(json) as DriveSessionData;
      }
      return null;
    } catch (error) {
      console.error('Error loading last session:', error);
      return null;
    }
  }

  /**
   * Get all saved drive sessions.
   */
  static async getAllSessions(): Promise<DriveSessionData[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (json) {
        return JSON.parse(json) as DriveSessionData[];
      }
      return [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  /**
   * Get drive history summaries for the history screen.
   */
  static async getHistorySummaries(): Promise<DriveHistoryItem[]> {
    const sessions = await StorageService.getAllSessions();
    return sessions.map(session => ({
      id: session.id,
      date: new Date(session.startTime).toLocaleDateString(),
      duration: session.duration,
      score: session.score,
      safetyRating: session.safetyRating,
      totalEvents: session.totalEvents,
      distance: session.distance,
    }));
  }

  /**
   * Get a specific session by ID.
   */
  static async getSessionById(id: string): Promise<DriveSessionData | null> {
    const sessions = await StorageService.getAllSessions();
    return sessions.find(s => s.id === id) || null;
  }

  /**
   * Get statistics across all drives.
   */
  static async getOverallStats(): Promise<{
    totalDrives: number;
    averageScore: number;
    totalDistance: number;
    totalDuration: number;
    bestScore: number;
    worstScore: number;
  }> {
    const sessions = await StorageService.getAllSessions();
    
    if (sessions.length === 0) {
      return {
        totalDrives: 0,
        averageScore: 0,
        totalDistance: 0,
        totalDuration: 0,
        bestScore: 0,
        worstScore: 0,
      };
    }

    const scores = sessions.map(s => s.score);
    return {
      totalDrives: sessions.length,
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      totalDistance: sessions.reduce((sum, s) => sum + s.distance, 0),
      totalDuration: sessions.reduce((sum, s) => sum + s.duration, 0),
      bestScore: Math.max(...scores),
      worstScore: Math.min(...scores),
    };
  }

  /**
   * Clear all stored data.
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SESSIONS,
        STORAGE_KEYS.LAST_SESSION,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}
