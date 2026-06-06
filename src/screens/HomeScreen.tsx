// ============================================================================
// SafeDrive — Home Screen
// ============================================================================
// Landing screen with Start Drive button, previous drive stats, and overall
// statistics. Features a premium dark design with animated elements.
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, getScoreColor } from '../constants/colors';
import { StorageService } from '../services/StorageService';
import { DriveSessionData, SafetyRating } from '../types';
import { formatDuration, formatDistance, formatRelativeTime } from '../utils/formatters';
import SafetyBadge from '../components/SafetyBadge';

interface HomeScreenProps {
  onStartDrive: () => void;
  onViewHistory: () => void;
  onViewSummary: (session: DriveSessionData) => void;
}

export default function HomeScreen({ onStartDrive, onViewHistory, onViewSummary }: HomeScreenProps) {
  const [lastSession, setLastSession] = useState<DriveSessionData | null>(null);
  const [stats, setStats] = useState<{
    totalDrives: number;
    averageScore: number;
    totalDistance: number;
    totalDuration: number;
    bestScore: number;
    worstScore: number;
  } | null>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadData();
    startAnimations();
  }, []);

  const loadData = async () => {
    const session = await StorageService.getLastSession();
    setLastSession(session);
    const overallStats = await StorageService.getOverallStats();
    setStats(overallStats);
  };

  const startAnimations = () => {
    // Fade and slide in
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

    // Pulse animation for start button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
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
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="shield-checkmark" size={28} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.appName}>SafeDrive</Text>
              <Text style={styles.tagline}>Drive smarter. Drive safer.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.historyButton} onPress={onViewHistory}>
            <Ionicons name="time-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Start Drive Button */}
        <Animated.View
          style={[
            styles.startSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: pulseAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.startButton}
            onPress={onStartDrive}
            activeOpacity={0.8}
          >
            <View style={styles.startButtonInner}>
              <View style={styles.startButtonGlow} />
              <Ionicons name="car-sport" size={48} color={Colors.textPrimary} />
              <Text style={styles.startButtonText}>Start Drive</Text>
              <Text style={styles.startButtonSubtext}>Tap to begin your driving session</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Stats */}
        {stats && stats.totalDrives > 0 && (
          <Animated.View
            style={[
              styles.statsSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.sectionTitle}>Your Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="speedometer-outline" size={22} color={Colors.accent} />
                <Text style={styles.statValue}>{stats.totalDrives}</Text>
                <Text style={styles.statLabel}>Total Drives</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="trophy-outline" size={22} color={Colors.success} />
                <Text style={[styles.statValue, { color: getScoreColor(stats.averageScore) }]}>
                  {stats.averageScore}
                </Text>
                <Text style={styles.statLabel}>Avg Score</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="star-outline" size={22} color={Colors.warning} />
                <Text style={[styles.statValue, { color: getScoreColor(stats.bestScore) }]}>
                  {stats.bestScore}
                </Text>
                <Text style={styles.statLabel}>Best Score</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="time-outline" size={22} color={Colors.primaryLight} />
                <Text style={styles.statValue}>
                  {formatDuration(stats.totalDuration)}
                </Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Last Drive Card */}
        {lastSession && (
          <Animated.View
            style={[
              styles.lastDriveSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.sectionTitle}>Last Drive</Text>
            <TouchableOpacity
              style={styles.lastDriveCard}
              onPress={() => onViewSummary(lastSession)}
              activeOpacity={0.7}
            >
              <View style={styles.lastDriveHeader}>
                <View>
                  <Text style={styles.lastDriveDate}>
                    {formatRelativeTime(lastSession.startTime)}
                  </Text>
                  <Text style={styles.lastDriveDuration}>
                    {formatDuration(lastSession.duration)}
                  </Text>
                </View>
                <View style={styles.lastDriveScore}>
                  <Text
                    style={[
                      styles.lastDriveScoreText,
                      { color: getScoreColor(lastSession.score) },
                    ]}
                  >
                    {lastSession.score}
                  </Text>
                  <Text style={styles.lastDriveScoreLabel}>score</Text>
                </View>
              </View>

              <SafetyBadge rating={lastSession.safetyRating} size="small" />

              <View style={styles.lastDriveStats}>
                <View style={styles.lastDriveStat}>
                  <Ionicons name="alert-circle" size={16} color={Colors.warning} />
                  <Text style={styles.lastDriveStatText}>
                    {lastSession.totalEvents} events
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Empty State */}
        {!lastSession && (
          <Animated.View
            style={[
              styles.emptyState,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Ionicons name="analytics-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No drives yet</Text>
            <Text style={styles.emptySubtitle}>
              Start your first drive to see your driving analytics and safety score
            </Text>
          </Animated.View>
        )}

        {/* Features Info */}
        <Animated.View
          style={[
            styles.featuresSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.sectionTitle}>What We Detect</Text>
          <View style={styles.featuresList}>
            {[
              { icon: 'warning', color: Colors.danger, label: 'Harsh Braking', penalty: '-5' },
              { icon: 'speedometer', color: Colors.warning, label: 'Harsh Acceleration', penalty: '-5' },
              { icon: 'git-branch', color: Colors.accent, label: 'Sharp Turns', penalty: '-3' },
              { icon: 'swap-horizontal', color: Colors.primaryLight, label: 'Aggressive Steering', penalty: '-4' },
              { icon: 'hand-left', color: '#FF1744', label: 'Phone Handling', penalty: '-10' },
              { icon: 'phone-portrait', color: Colors.warning, label: 'Excessive Movement', penalty: '-2' },
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                  <Ionicons name={feature.icon as any} size={18} color={feature.color} />
                </View>
                <Text style={styles.featureLabel}>{feature.label}</Text>
                <Text style={[styles.featurePenalty, { color: feature.color }]}>
                  {feature.penalty}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

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
    marginBottom: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appName: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 1,
  },
  historyButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  startButton: {
    width: width - 60,
    borderRadius: 24,
    overflow: 'hidden',
  },
  startButtonInner: {
    backgroundColor: Colors.primary,
    paddingVertical: 40,
    alignItems: 'center',
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  startButtonGlow: {
    position: 'absolute',
    top: -50,
    left: '30%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.accent,
    opacity: 0.15,
  },
  startButtonText: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 12,
    letterSpacing: -0.5,
  },
  startButtonSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 60) / 2 - 5,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  lastDriveSection: {
    marginBottom: 24,
  },
  lastDriveCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
  },
  lastDriveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  lastDriveDate: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  lastDriveDuration: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  lastDriveScore: {
    alignItems: 'center',
  },
  lastDriveScoreText: {
    fontSize: 36,
    fontWeight: '800',
  },
  lastDriveScoreLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: -2,
  },
  lastDriveStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  lastDriveStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastDriveStatText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 24,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureLabel: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  featurePenalty: {
    fontSize: 15,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 20,
  },
});
