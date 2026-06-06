// ============================================================================
// SafeDrive — Event Timeline Component
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrivingEvent } from '../types';
import { Colors } from '../constants/colors';
import { EVENT_ICONS, EVENT_COLORS } from '../constants/scoring';
import { formatElapsedTime, formatTime } from '../utils/formatters';

interface EventTimelineProps {
  events: DrivingEvent[];
  maxHeight?: number;
}

export default function EventTimeline({ events, maxHeight = 400 }: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
        <Text style={styles.emptyTitle}>No Events Detected</Text>
        <Text style={styles.emptySubtitle}>You're driving safely!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Event Timeline</Text>
      <ScrollView
        style={[styles.scrollView, { maxHeight }]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {events.map((event, index) => {
          const color = EVENT_COLORS[event.type];
          const iconName = EVENT_ICONS[event.type] as any;
          const isLast = index === events.length - 1;

          return (
            <View key={event.id} style={styles.timelineItem}>
              {/* Timeline line */}
              <View style={styles.timelineLine}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                {!isLast && <View style={[styles.line, { backgroundColor: Colors.border }]} />}
              </View>

              {/* Content */}
              <View style={styles.content}>
                <View style={styles.eventHeader}>
                  <View style={[styles.iconBadge, { backgroundColor: color + '20' }]}>
                    <Ionicons name={iconName} size={14} color={color} />
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventName}>{event.description}</Text>
                    <Text style={styles.eventTime}>
                      {formatElapsedTime(event.elapsedTime)} • {formatTime(event.timestamp)}
                    </Text>
                  </View>
                  <View style={[styles.penaltyBadge, { backgroundColor: color + '15' }]}>
                    <Text style={[styles.penaltyText, { color }]}>-{event.penalty}</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  scrollView: {
    overflow: 'hidden',
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 56,
  },
  timelineLine: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    zIndex: 1,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 2,
    marginBottom: 2,
  },
  content: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  eventTime: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  penaltyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  penaltyText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
});
