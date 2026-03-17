// components/ui/QuestionItem.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Fonts, FontSize } from '../../constants/theme';

interface QuestionItemProps {
  number: number;
  text: string;
  isLast?: boolean;
}

export default function QuestionItem({ number, text, isLast }: QuestionItemProps) {
  return (
    <View style={[styles.row, !isLast && styles.border]}>
      <View style={styles.numCircle}>
        <Text style={styles.numText}>{number}</Text>
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  numCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  numText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10,
    color: Colors.tealDark,
  },
  text: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: FontSize.small + 1,
    color: Colors.text,
    lineHeight: 20,
  },
});
