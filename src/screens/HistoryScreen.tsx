// ============================================================================
// SafeDrive — History Screen
// ============================================================================
// Shows past driving sessions with scores, trends, and comparison data.
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
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors, getScoreColor, getRatingColor } from '../constants/colors';
import { DriveSessionData, DriveHistoryItem } from '../types';
import { StorageService } from '../services/StorageService';
import { formatDuration, formatDate } from '../utils/formatters';

interface HistoryScreenProps {
  onGoBack: () => void;
  onViewSession: (session: DriveSessionData) => void;
}

export default function HistoryScreen({ onGoBack, onViewSession }: HistoryScreenProps) {
  const [sessions, setSessions] = useState<DriveSessionData[]>([]);
  const [stats, setStats] = useState<{
    totalDrives: number;
    averageScore: number;
    totalDistance: number;
    totalDuration: number;
    bestScore: number;
    worstScore: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadData();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadData = async () => {
    const allSessions = await StorageService.getAllSessions();
    const overallStats = await StorageService.getOverallStats();
    setSessions(allSessions);
    setStats(overallStats);
    setLoading(false);
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all drive history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearAll();
            setSessions([]);
            setStats(null);
          },
        },
      ]
    );
  };

  // Score trend data (last 10 drives)
  const trendData = sessions.slice(0, 10).reverse().map(s => s.score);

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
          <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Drive History</Text>
          {sessions.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearHistory}>
              <Ionicons name="trash-outline" size={20} color={Colors.danger} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Overall Stats */}
        {stats && stats.totalDrives > 0 && (
          <Animated.View
            style={[
              styles.statsCard,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.statsTitle}>Overall Performance</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalDrives}</Text>
                <Text style={styles.statLabel}>Drives</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: getScoreColor(stats.averageScore) }]}>
                  {stats.averageScore}
                </Text>
                <Text style={styles.statLabel}>Avg Score</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors.success }]}>
                  {stats.bestScore}
                </Text>
                <Text style={styles.statLabel}>Best</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatDuration(stats.totalDuration)}
                </Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Score Trend */}
        {trendData.length >= 2 && (
          <Animated.View
            style={[
              styles.trendCard,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.sectionTitle}>Score Trend</Text>
            <View style={styles.trendChart}>
              {trendData.map((score, index) => {
                const height = (score / 100) * 80;
                return (
                  <View key={index} style={styles.trendBarContainer}>
                    <View
                      style={[
                        styles.trendBar,
                        {
                          height,
                          backgroundColor: getScoreColor(score),
                        },
                      ]}
                    />
                    <Text style={styles.trendBarLabel}>{score}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.trendLabels}>
              <Text style={styles.trendLabelText}>Oldest</Text>
              <Text style={styles.trendLabelText}>Latest</Text>
            </View>
          </Animated.View>
        )}

        {/* Sessions List */}
        <Animated.View
          style={[
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.sectionTitle}>All Drives</Text>
          
          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={64} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No drives yet</Text>
              <Text style={styles.emptySubtitle}>
                Complete your first drive to see it here
              </Text>
            </View>
          ) : (
            sessions.map((session, index) => {
              const scoreColor = getScoreColor(session.score);
              return (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionCard}
                  onPress={() => onViewSession(session)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sessionLeft}>
                    <View style={[styles.scoreBadge, { borderColor: scoreColor }]}>
                      <Text style={[styles.scoreBadgeText, { color: scoreColor }]}>
                        {session.score}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.sessionCenter}>
                    <Text style={styles.sessionDate}>
                      {formatDate(session.startTime)}
                    </Text>
                    <View style={styles.sessionMeta}>
                      <View style={styles.sessionMetaItem}>
                        <Ionicons name="time-outline" size={13} color={Colors.textTertiary} />
                        <Text style={styles.sessionMetaText}>
                          {formatDuration(session.duration)}
                        </Text>
                      </View>
                      <View style={styles.sessionMetaItem}>
                        <Ionicons name="alert-circle" size={13} color={Colors.textTertiary} />
                        <Text style={styles.sessionMetaText}>
                          {session.totalEvents} events
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.ratingPill, { backgroundColor: getRatingColor(session.safetyRating) + '20' }]}>
                      <Text style={[styles.ratingPillText, { color: getRatingColor(session.safetyRating) }]}>
                        {session.safetyRating}
                      </Text>
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
                </TouchableOpacity>
              );
            })
          )}
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
    marginRight: 12,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.danger + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  statsTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  trendCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 100,
    paddingHorizontal: 8,
  },
  trendBarContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  trendBar: {
    width: '80%',
    maxWidth: 28,
    borderRadius: 6,
    minHeight: 4,
  },
  trendBarLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  trendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  trendLabelText: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '500',
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  sessionLeft: {
    marginRight: 14,
  },
  scoreBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreBadgeText: {
    fontSize: 18,
    fontWeight: '800',
  },
  sessionCenter: {
    flex: 1,
  },
  sessionDate: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  sessionMeta: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 12,
  },
  sessionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sessionMetaText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  ratingPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  ratingPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: Colors.surface,
    borderRadius: 16,
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
    marginTop: 8,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 20,
  },
});
