// ============================================================================
// SafeDrive — Safety Badge Component
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafetyRating } from '../types';
import { Colors, getRatingColor } from '../constants/colors';

interface SafetyBadgeProps {
  rating: SafetyRating;
  size?: 'small' | 'medium' | 'large';
}

const RATING_CONFIG: Record<
  SafetyRating,
  { icon: string; emoji: string; tagline: string }
> = {
  [SafetyRating.EXCELLENT]: {
    icon: 'shield-checkmark',
    emoji: '🏆',
    tagline: 'Outstanding driving!',
  },
  [SafetyRating.GOOD]: {
    icon: 'thumbs-up',
    emoji: '👍',
    tagline: 'Keep it up!',
  },
  [SafetyRating.FAIR]: {
    icon: 'alert-circle',
    emoji: '⚡',
    tagline: 'Room for improvement',
  },
  [SafetyRating.POOR]: {
    icon: 'warning',
    emoji: '⚠️',
    tagline: 'Needs attention',
  },
  [SafetyRating.DANGEROUS]: {
    icon: 'skull',
    emoji: '🚨',
    tagline: 'Drive safely!',
  },
};

export default function SafetyBadge({ rating, size = 'medium' }: SafetyBadgeProps) {
  const color = getRatingColor(rating);
  const config = RATING_CONFIG[rating];
  
  const sizeConfig = {
    small: { padding: 8, fontSize: 12, iconSize: 16 },
    medium: { padding: 14, fontSize: 16, iconSize: 22 },
    large: { padding: 20, fontSize: 22, iconSize: 32 },
  }[size];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: color + '15',
          borderColor: color + '40',
          padding: sizeConfig.padding,
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: color + '25' }]}>
        <Ionicons name={config.icon as any} size={sizeConfig.iconSize} color={color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.rating, { color, fontSize: sizeConfig.fontSize }]}>
          {config.emoji} {rating}
        </Text>
        {size !== 'small' && (
          <Text style={[styles.tagline, { color: color + 'CC' }]}>
            {config.tagline}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  rating: {
    fontWeight: '800',
  },
  tagline: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
});
