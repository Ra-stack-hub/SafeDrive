// ============================================================================
// SafeDrive — Event Card Component
// ============================================================================

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrivingEvent, EventType } from '../types';
import { Colors } from '../constants/colors';
import { EVENT_ICONS, EVENT_COLORS } from '../constants/scoring';
import { formatElapsedTime } from '../utils/formatters';

interface EventCardProps {
  event: DrivingEvent;
  index?: number;
  compact?: boolean;
}

export default function EventCard({ event, index = 0, compact = false }: EventCardProps) {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const color = EVENT_COLORS[event.type];
  const iconName = EVENT_ICONS[event.type] as any;

  if (compact) {
    return (
      <Animated.View
        style={[
          styles.compactContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
            borderLeftColor: color,
          },
        ]}
      >
        <View style={[styles.compactIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={iconName} size={16} color={color} />
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle}>{event.description}</Text>
          <Text style={styles.compactTime}>{formatElapsedTime(event.elapsedTime)}</Text>
        </View>
        <View style={[styles.penaltyBadge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.penaltyText, { color }]}>-{event.penalty}</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          borderLeftColor: color,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={iconName} size={22} color={color} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{event.description}</Text>
          <Text style={styles.timestamp}>{formatElapsedTime(event.elapsedTime)}</Text>
        </View>
        <View style={[styles.penaltyContainer, { backgroundColor: color + '15' }]}>
          <Text style={[styles.penalty, { color }]}>-{event.penalty}</Text>
          <Text style={[styles.penaltyLabel, { color: color + 'AA' }]}>pts</Text>
        </View>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Magnitude</Text>
          <Text style={styles.detailValue}>{event.magnitude.toFixed(2)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Severity</Text>
          <View style={[styles.severityDot, { backgroundColor: color }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  penaltyContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  penalty: {
    fontSize: 18,
    fontWeight: '800',
  },
  penaltyLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: -2,
  },
  details: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  detailLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginRight: 6,
  },
  detailValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
  },
  compactIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  compactTime: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  penaltyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  penaltyText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
