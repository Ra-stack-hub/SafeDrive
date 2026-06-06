// ============================================================================
// SafeDrive — Animated Score Gauge Component
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, getScoreColor } from '../constants/colors';

interface ScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  animated?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ScoreGauge({
  score,
  size = 200,
  strokeWidth = 12,
  label = 'Driving Score',
  animated = true,
}: ScoreGaugeProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const displayValue = useRef(new Animated.Value(score)).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const color = getScoreColor(score);

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: score / 100,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      Animated.timing(displayValue, {
        toValue: score,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(score / 100);
      displayValue.setValue(score);
    }
  }, [score, animated]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const displayScore = displayValue.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 100],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </LinearGradient>
        </Defs>

        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={Colors.surfaceLight}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />

        {/* Score arc */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${center} ${center})`}
        />

        {/* Glow effect */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth + 6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          opacity={0.15}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      <View style={styles.valueContainer}>
        <Animated.Text
          style={[
            styles.scoreText,
            { color, fontSize: size * 0.22 },
          ]}
        >
          {animated
            ? displayScore.interpolate({
                inputRange: [0, 100],
                outputRange: ['0', '100'],
                extrapolate: 'clamp',
              })
            : Math.round(score).toString()
          }
        </Animated.Text>
        <Text style={[styles.labelText, { fontSize: size * 0.065 }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontWeight: '800',
    letterSpacing: -1,
  },
  labelText: {
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
