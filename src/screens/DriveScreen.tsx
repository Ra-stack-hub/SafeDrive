// ============================================================================
// SafeDrive — Active Drive Screen
// ============================================================================
// Shows real-time sensor data, live score, event feed, and drive timer
// during an active driving session. Optimized for minimal UI overhead
// during sensor processing.
// ============================================================================

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getScoreColor } from '../constants/colors';
import { EventType, DrivingEvent, SafetyRating, SensorStatus } from '../types';
import { formatTimer } from '../utils/formatters';
import ScoreGauge from '../components/ScoreGauge';
import EventCard from '../components/EventCard';
import SensorReadout from '../components/SensorReadout';

interface DriveScreenProps {
  currentScore: number;
  safetyRating: SafetyRating;
  events: DrivingEvent[];
  duration: number;
  totalEvents: number;
  eventCounts: Record<EventType, number>;
  sensorReadings: {
    accelerometer: { x: number; y: number; z: number };
    gyroscope: { x: number; y: number; z: number };
    deviceMotion: {
      acceleration: { x: number; y: number; z: number } | null;
      rotationRate: { x: number; y: number; z: number } | null;
    };
    magnetometer: { x: number; y: number; z: number };
  };
  sensorStatus: SensorStatus;
  onEndDrive: () => void;
}

export default function DriveScreen({
  currentScore,
  safetyRating,
  events,
  duration,
  totalEvents,
  eventCounts,
  sensorReadings,
  sensorStatus,
  onEndDrive,
}: DriveScreenProps) {
  const recordingAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Recording indicator pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(recordingAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(recordingAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleEndDrive = () => {
    Alert.alert(
      'End Drive',
      'Are you sure you want to end this driving session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Drive', style: 'destructive', onPress: onEndDrive },
      ]
    );
  };

  const activeSensors = Object.values(sensorStatus).filter(Boolean).length;
  const scoreColor = getScoreColor(currentScore);

  // Show only last 5 events for the feed
  const recentEvents = events.slice(-5).reverse();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Recording Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.recordingIndicator}>
            <Animated.View
              style={[
                styles.recordingDot,
                { opacity: recordingAnim },
              ]}
            />
            <Text style={styles.recordingText}>RECORDING</Text>
          </View>
          <View style={styles.sensorStatusContainer}>
            <Ionicons name="hardware-chip-outline" size={16} color={Colors.accent} />
            <Text style={styles.sensorStatusText}>{activeSensors}/4 sensors</Text>
          </View>
        </Animated.View>

        {/* Timer */}
        <Animated.View style={[styles.timerSection, { opacity: fadeAnim }]}>
          <Text style={styles.timerText}>{formatTimer(duration)}</Text>
          <Text style={styles.timerLabel}>Drive Duration</Text>
        </Animated.View>

        {/* Score Gauge */}
        <Animated.View style={[styles.gaugeSection, { opacity: fadeAnim }]}>
          <ScoreGauge score={currentScore} size={180} animated={false} />
        </Animated.View>

        {/* Quick Stats Row */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <Text style={[styles.quickStatValue, { color: Colors.warning }]}>
              {totalEvents}
            </Text>
            <Text style={styles.quickStatLabel}>Events</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={[styles.quickStatValue, { color: scoreColor }]}>
              {currentScore}
            </Text>
            <Text style={styles.quickStatLabel}>Score</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={[styles.quickStatValue, { color: Colors.accent }]}>
              {safetyRating}
            </Text>
            <Text style={styles.quickStatLabel}>Rating</Text>
          </View>
        </View>

        {/* Sensor Readout */}
        <SensorReadout
          accelerometer={sensorReadings.accelerometer}
          gyroscope={sensorReadings.gyroscope}
          magnetometer={sensorReadings.magnetometer}
          sensorStatus={sensorStatus}
        />

        {/* Recent Events Feed */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.eventsSectionTitle}>Live Event Feed</Text>
            <Text style={styles.eventsCount}>{totalEvents} total</Text>
          </View>
          
          {recentEvents.length === 0 ? (
            <View style={styles.noEvents}>
              <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
              <Text style={styles.noEventsText}>Driving safely</Text>
              <Text style={styles.noEventsSubtext}>No events detected yet</Text>
            </View>
          ) : (
            recentEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} compact />
            ))
          )}
        </View>

        {/* End Drive Button */}
        <TouchableOpacity
          style={styles.endButton}
          onPress={handleEndDrive}
          activeOpacity={0.8}
        >
          <Ionicons name="stop-circle" size={24} color={Colors.textPrimary} />
          <Text style={styles.endButtonText}>End Drive</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.danger + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    marginRight: 6,
  },
  recordingText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sensorStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sensorStatusText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  timerText: {
    color: Colors.textPrimary,
    fontSize: 48,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: 4,
  },
  timerLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  gaugeSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  quickStatLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  quickStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  eventsSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventsSectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  eventsCount: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  noEvents: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noEventsText: {
    color: Colors.success,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  noEventsSubtext: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.danger,
    borderRadius: 16,
    paddingVertical: 18,
    gap: 8,
  },
  endButtonText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 20,
  },
});
