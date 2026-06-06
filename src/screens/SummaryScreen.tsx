// ============================================================================
// SafeDrive — Summary / Dashboard Screen
// ============================================================================
// Post-drive analytics dashboard showing final score, event breakdown,
// timeline, and AI-generated driving feedback.
// ============================================================================

import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getScoreColor, getRatingColor } from '../constants/colors';
import { DriveSessionData, EventType, DrivingFeedback } from '../types';
import { EVENT_DESCRIPTIONS, EVENT_COLORS, EVENT_ICONS } from '../constants/scoring';
import { formatDuration, formatTime, formatDate } from '../utils/formatters';
import { ScoreCalculator } from '../services/ScoreCalculator';
import ScoreGauge from '../components/ScoreGauge';
import SafetyBadge from '../components/SafetyBadge';
import EventTimeline from '../components/EventTimeline';

interface SummaryScreenProps {
  session: DriveSessionData;
  onGoHome: () => void;
}

export default function SummaryScreen({ session, onGoHome }: SummaryScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Generate AI feedback
  const feedback = useMemo((): DrivingFeedback => {
    const calc = new ScoreCalculator();
    session.events.forEach(e => calc.applyPenalty(e));
    return calc.generateFeedback();
  }, [session]);

  const scoreColor = getScoreColor(session.score);
  const ratingColor = getRatingColor(session.safetyRating);

  // Event breakdown data
  const eventBreakdown = Object.values(EventType)
    .map(type => ({
      type,
      count: session.eventCounts[type] || 0,
      label: EVENT_DESCRIPTIONS[type],
      color: EVENT_COLORS[type],
      icon: EVENT_ICONS[type],
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const maxEventCount = Math.max(...eventBreakdown.map(e => e.count), 1);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🚗 SafeDrive Report\n\nScore: ${session.score}/100 (${session.safetyRating})\nDuration: ${formatDuration(session.duration)}\nEvents: ${session.totalEvents}\n\nDrive safer with SafeDrive!`,
      });
    } catch (e) {
      // Ignore share errors
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity style={styles.backButton} onPress={onGoHome}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Drive Summary</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Score Section */}
        <Animated.View
          style={[
            styles.scoreSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <ScoreGauge score={session.score} size={220} animated />
          <View style={styles.badgeContainer}>
            <SafetyBadge rating={session.safetyRating} size="medium" />
          </View>
        </Animated.View>

        {/* Drive Info */}
        <Animated.View
          style={[
            styles.infoCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={18} color={Colors.accent} />
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formatDate(session.startTime)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{formatDuration(session.duration)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.warning} />
              <Text style={styles.infoLabel}>Total Events</Text>
              <Text style={[styles.infoValue, { color: Colors.warning }]}>
                {session.totalEvents}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="trending-down-outline" size={18} color={Colors.danger} />
              <Text style={styles.infoLabel}>Points Lost</Text>
              <Text style={[styles.infoValue, { color: Colors.danger }]}>
                -{100 - session.score}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Event Breakdown */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.sectionTitle}>Event Breakdown</Text>
          <View style={styles.breakdownCard}>
            {eventBreakdown.length === 0 ? (
              <View style={styles.noEventsContainer}>
                <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
                <Text style={styles.noEventsText}>Perfect drive! No events detected.</Text>
              </View>
            ) : (
              eventBreakdown.map((item, index) => (
                <View key={item.type} style={styles.breakdownRow}>
                  <View style={[styles.breakdownIcon, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon as any} size={16} color={item.color} />
                  </View>
                  <Text style={styles.breakdownLabel}>{item.label}</Text>
                  <View style={styles.breakdownBar}>
                    <View
                      style={[
                        styles.breakdownBarFill,
                        {
                          width: `${(item.count / maxEventCount) * 100}%`,
                          backgroundColor: item.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.breakdownCount, { color: item.color }]}>
                    {item.count}
                  </Text>
                </View>
              ))
            )}
          </View>
        </Animated.View>

        {/* Event Timeline */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <EventTimeline events={session.events} maxHeight={300} />
        </Animated.View>

        {/* AI Feedback */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.sectionTitle}>
            <Ionicons name="bulb-outline" size={18} color={Colors.warning} /> AI Driving Feedback
          </Text>
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackOverall}>{feedback.overallMessage}</Text>

            {feedback.strengths.length > 0 && (
              <View style={styles.feedbackSection}>
                <Text style={[styles.feedbackSectionTitle, { color: Colors.success }]}>
                  ✅ Strengths
                </Text>
                {feedback.strengths.map((s, i) => (
                  <Text key={i} style={styles.feedbackItem}>• {s}</Text>
                ))}
              </View>
            )}

            {feedback.improvements.length > 0 && (
              <View style={styles.feedbackSection}>
                <Text style={[styles.feedbackSectionTitle, { color: Colors.warning }]}>
                  💡 Areas to Improve
                </Text>
                {feedback.improvements.map((s, i) => (
                  <Text key={i} style={styles.feedbackItem}>• {s}</Text>
                ))}
              </View>
            )}

            {feedback.tips.length > 0 && (
              <View style={styles.feedbackSection}>
                <Text style={[styles.feedbackSectionTitle, { color: Colors.accent }]}>
                  📋 Detailed Tips
                </Text>
                {feedback.tips.map((s, i) => (
                  <Text key={i} style={styles.feedbackItem}>• {s}</Text>
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        {/* Done Button */}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={onGoHome}
          activeOpacity={0.8}
        >
          <Text style={styles.doneButtonText}>Back to Home</Text>
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
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeContainer: {
    marginTop: 16,
    width: '100%',
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  breakdownCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  breakdownIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  breakdownLabel: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    width: 100,
  },
  breakdownBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 4,
  },
  breakdownCount: {
    fontSize: 16,
    fontWeight: '800',
    width: 30,
    textAlign: 'right',
  },
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noEventsText: {
    color: Colors.success,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
  },
  feedbackCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
  },
  feedbackOverall: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 16,
  },
  feedbackSection: {
    marginBottom: 14,
  },
  feedbackSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  feedbackItem: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
    paddingLeft: 4,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 20,
  },
});
