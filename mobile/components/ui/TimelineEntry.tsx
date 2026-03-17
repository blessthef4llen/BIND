// components/ui/TimelineEntry.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Fonts, FontSize } from '../../constants/theme';
import Card from './Card';
import Badge, { BadgeVariant } from './Badge';

interface Tag {
  label: string;
  variant?: 'default' | 'teal';
}

interface TimelineEntryProps {
  doctorName: string;
  specialty: string;
  diagnosis: string;
  dateLabel: string;
  badgeVariant?: BadgeVariant;
  tags?: Tag[];
  isActive?: boolean;
}

export default function TimelineEntry({
  doctorName,
  specialty,
  diagnosis,
  dateLabel,
  badgeVariant = 'teal',
  tags = [],
  isActive = false,
}: TimelineEntryProps) {
  return (
    <View style={styles.wrapper}>
      {/* Timeline dot */}
      <View style={[styles.dot, isActive ? styles.dotActive : styles.dotMuted]}>
        {isActive && <View style={styles.dotRing} />}
      </View>
      <Card style={styles.card}>
        <View style={styles.cardInner}>
          <View style={styles.headerRow}>
            <Text style={styles.doctorName} numberOfLines={1}>{doctorName} – {specialty}</Text>
            <Badge label={dateLabel} variant={badgeVariant} />
          </View>
          <Text style={styles.diagnosis}>{diagnosis}</Text>
          {tags.length > 0 && (
            <View style={styles.tagRow}>
              {tags.map((tag, i) => (
                <View
                  key={i}
                  style={[styles.tag, tag.variant === 'teal' && styles.tagTeal]}
                >
                  <Text style={[styles.tagText, tag.variant === 'teal' && styles.tagTextTeal]}>
                    {tag.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: 14,
    paddingLeft: 0,
  },
  dot: {
    position: 'absolute',
    left: -26,
    top: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.bg,
    zIndex: 1,
  },
  dotActive: {
    backgroundColor: Colors.teal,
  },
  dotMuted: {
    backgroundColor: Colors.textFaint,
  },
  dotRing: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: Colors.tealLight,
  },
  card: {},
  cardInner: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  doctorName: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
    fontSize: FontSize.body,
    color: Colors.text,
  },
  diagnosis: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.small,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  tag: {
    backgroundColor: Colors.surface2,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  tagTeal: {
    backgroundColor: Colors.tealLight,
  },
  tagText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.textMuted,
  },
  tagTextTeal: {
    color: Colors.tealDark,
  },
});
