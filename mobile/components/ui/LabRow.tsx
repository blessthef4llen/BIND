// components/ui/LabRow.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSize } from '../../constants/theme';
import Badge, { BadgeVariant } from './Badge';

type LabStatus = 'normal' | 'borderline' | 'flagged';

interface LabRowProps {
  name: string;
  subtitle?: string;
  value: string;
  refRange: string;
  refMin: number;
  refMax: number;
  actualValue: number;
  status: LabStatus;
  isLast?: boolean;
}

const statusConfig: Record<LabStatus, { color: string; badgeVariant: BadgeVariant; badgeLabel: string }> = {
  normal:     { color: Colors.teal,  badgeVariant: 'teal',  badgeLabel: 'Normal' },
  borderline: { color: Colors.amber, badgeVariant: 'amber', badgeLabel: 'Borderline' },
  flagged:    { color: Colors.red,   badgeVariant: 'red',   badgeLabel: 'Flag' },
};

export default function LabRow({
  name, subtitle, value, refRange, refMin, refMax, actualValue, status, isLast,
}: LabRowProps) {
  const { color, badgeVariant, badgeLabel } = statusConfig[status];
  const range = refMax - refMin;
  const pct = Math.min(Math.max((actualValue - refMin) / range, 0), 1);

  return (
    <View style={[styles.row, !isLast && styles.border]}>
      <View style={styles.topRow}>
        <View style={styles.nameCol}>
          <Text style={styles.name}>{name}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.valueCol}>
          <Text style={[styles.value, { color }]}>{value}</Text>
          <Text style={styles.ref}>Ref: {refRange}</Text>
        </View>
      </View>
      {/* Visual range bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.max(pct * 100, 3)}%`, backgroundColor: color }]} />
        <View style={[styles.marker, { left: '12%' }]} />
      </View>
      <View style={styles.barLabels}>
        <Text style={styles.barLabel}>{refMin}</Text>
        <Text style={styles.barLabel}>{refMax}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 10,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameCol: { flex: 1 },
  valueCol: { alignItems: 'flex-end' },
  name: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSize.body,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.tiny,
    color: Colors.textMuted,
    marginTop: 2,
  },
  value: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
  },
  ref: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.textFaint,
  },
  barTrack: {
    height: 6,
    backgroundColor: Colors.surface2,
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  barFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 3,
  },
  marker: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 1,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  barLabel: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    color: Colors.textFaint,
  },
});
