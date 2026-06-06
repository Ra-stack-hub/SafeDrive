// ============================================================================
// SafeDrive — Live Sensor Readout Component
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { SensorStatus } from '../types';

interface SensorReadoutProps {
  accelerometer: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
  magnetometer: { x: number; y: number; z: number };
  sensorStatus: SensorStatus;
}

function SensorRow({
  label,
  icon,
  data,
  active,
  unit,
  color,
}: {
  label: string;
  icon: string;
  data: { x: number; y: number; z: number };
  active: boolean;
  unit: string;
  color: string;
}) {
  const maxVal = Math.max(Math.abs(data.x), Math.abs(data.y), Math.abs(data.z));
  const barWidth = Math.min(maxVal * 50, 100); // Scale for visual bar

  return (
    <View style={styles.sensorRow}>
      <View style={styles.sensorHeader}>
        <View style={[styles.sensorIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={14} color={color} />
        </View>
        <Text style={styles.sensorLabel}>{label}</Text>
        <View style={[styles.statusDot, { backgroundColor: active ? Colors.success : Colors.textTertiary }]} />
      </View>
      
      <View style={styles.axisContainer}>
        <View style={styles.axisRow}>
          <Text style={styles.axisLabel}>X</Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(Math.abs(data.x) * 50, 100)}%`,
                  backgroundColor: data.x >= 0 ? color : Colors.danger,
                },
              ]}
            />
          </View>
          <Text style={styles.axisValue}>{data.x.toFixed(2)}</Text>
        </View>
        <View style={styles.axisRow}>
          <Text style={styles.axisLabel}>Y</Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(Math.abs(data.y) * 50, 100)}%`,
                  backgroundColor: data.y >= 0 ? color : Colors.danger,
                },
              ]}
            />
          </View>
          <Text style={styles.axisValue}>{data.y.toFixed(2)}</Text>
        </View>
        <View style={styles.axisRow}>
          <Text style={styles.axisLabel}>Z</Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(Math.abs(data.z) * 50, 100)}%`,
                  backgroundColor: data.z >= 0 ? color : Colors.danger,
                },
              ]}
            />
          </View>
          <Text style={styles.axisValue}>{data.z.toFixed(2)}</Text>
        </View>
      </View>
      
      <Text style={styles.unitText}>Unit: {unit}</Text>
    </View>
  );
}

export default function SensorReadout({
  accelerometer,
  gyroscope,
  magnetometer,
  sensorStatus,
}: SensorReadoutProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Sensor Data</Text>
      
      <SensorRow
        label="Accelerometer"
        icon="speedometer-outline"
        data={accelerometer}
        active={sensorStatus.accelerometer}
        unit="g-force"
        color={Colors.accent}
      />
      
      <SensorRow
        label="Gyroscope"
        icon="sync-outline"
        data={gyroscope}
        active={sensorStatus.gyroscope}
        unit="rad/s"
        color={Colors.primary}
      />
      
      <SensorRow
        label="Magnetometer"
        icon="compass-outline"
        data={magnetometer}
        active={sensorStatus.magnetometer}
        unit="μT"
        color={Colors.warning}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  sensorRow: {
    marginBottom: 14,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sensorIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sensorLabel: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  axisContainer: {
    gap: 4,
  },
  axisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 18,
  },
  axisLabel: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    width: 16,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 2,
  },
  axisValue: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  unitText: {
    color: Colors.textTertiary,
    fontSize: 10,
    marginTop: 6,
    textAlign: 'right',
  },
});
