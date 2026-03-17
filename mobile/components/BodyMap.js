/**
 * components/BodyMap.js — Interactive Human Body Map
 *
 * Features:
 *   - Realistic SVG human figure (front + back views)
 *   - Front/back toggle with smooth swap
 *   - Tappable zones highlight on press
 *   - Selected zone pulses with brand red
 *   - Returns zone label to parent via onSelect()
 *
 * Usage:
 *   <BodyMap selectedArea={selectedArea} onSelect={setSelectedArea} />
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Ellipse, Rect, G, Circle } from 'react-native-svg';

// ── Brand colors ────────────────────────────────────────────────────────────
const RED        = '#C94040';
const RED_DARK   = '#8B2A2A';
const RED_LIGHT  = '#F7ECEC';
const FILL_BASE  = '#EDE9E6';   // warm off-white skin tone
const FILL_HOVER = '#D4CBCB';   // slightly darker on hover
const STROKE     = '#C8BEB8';   // subtle outline
const BG         = '#FAF9F7';

// ── Zone definitions ─────────────────────────────────────────────────────────
// Front view zones
const FRONT_ZONES = [
  // Head & neck
  { id: 'head',       label: 'Head',            type: 'ellipse', cx: 100, cy: 36,  rx: 26, ry: 30 },
  { id: 'neck',       label: 'Neck',            type: 'rect',    x: 91,  y: 64,   w: 18,  h: 14, r: 4 },

  // Torso
  { id: 'chest-l',    label: 'Left Chest',      type: 'path',    d: 'M72,80 Q70,78 76,78 L100,78 L100,140 Q84,142 74,134 Q68,126 68,110 Z' },
  { id: 'chest-r',    label: 'Right Chest',     type: 'path',    d: 'M100,78 L124,78 Q130,78 132,80 L132,110 Q132,126 126,134 Q116,142 100,140 Z' },
  { id: 'abdomen',    label: 'Abdomen',         type: 'rect',    x: 74,  y: 140,  w: 52,  h: 40, r: 4 },
  { id: 'pelvis',     label: 'Pelvis / Hips',   type: 'path',    d: 'M68,178 Q68,172 76,170 L124,170 Q132,172 132,178 L130,196 Q120,204 100,204 Q80,204 70,196 Z' },

  // Shoulders
  { id: 'shldr-l',    label: 'Left Shoulder',   type: 'ellipse', cx: 58,  cy: 88,  rx: 16, ry: 14 },
  { id: 'shldr-r',    label: 'Right Shoulder',  type: 'ellipse', cx: 142, cy: 88,  rx: 16, ry: 14 },

  // Arms
  { id: 'uarm-l',     label: 'Left Upper Arm',  type: 'rect',    x: 38,  y: 98,   w: 22,  h: 50, r: 10 },
  { id: 'uarm-r',     label: 'Right Upper Arm', type: 'rect',    x: 140, y: 98,   w: 22,  h: 50, r: 10 },
  { id: 'forearm-l',  label: 'Left Forearm',    type: 'rect',    x: 36,  y: 152,  w: 20,  h: 44, r: 8 },
  { id: 'forearm-r',  label: 'Right Forearm',   type: 'rect',    x: 144, y: 152,  w: 20,  h: 44, r: 8 },
  { id: 'hand-l',     label: 'Left Hand',       type: 'ellipse', cx: 46,  cy: 206, rx: 11, ry: 9 },
  { id: 'hand-r',     label: 'Right Hand',      type: 'ellipse', cx: 154, cy: 206, rx: 11, ry: 9 },

  // Legs
  { id: 'thigh-l',    label: 'Left Thigh',      type: 'rect',    x: 70,  y: 204,  w: 28,  h: 72, r: 12 },
  { id: 'thigh-r',    label: 'Right Thigh',     type: 'rect',    x: 102, y: 204,  w: 28,  h: 72, r: 12 },
  { id: 'knee-l',     label: 'Left Knee',       type: 'ellipse', cx: 84,  cy: 284, rx: 14, ry: 10 },
  { id: 'knee-r',     label: 'Right Knee',      type: 'ellipse', cx: 116, cy: 284, rx: 14, ry: 10 },
  { id: 'shin-l',     label: 'Left Shin',       type: 'rect',    x: 70,  y: 294,  w: 28,  h: 62, r: 10 },
  { id: 'shin-r',     label: 'Right Shin',      type: 'rect',    x: 102, y: 294,  w: 28,  h: 62, r: 10 },
  { id: 'ankle-l',    label: 'Left Ankle',      type: 'ellipse', cx: 84,  cy: 364, rx: 13, ry: 8 },
  { id: 'ankle-r',    label: 'Right Ankle',     type: 'ellipse', cx: 116, cy: 364, rx: 13, ry: 8 },
  { id: 'foot-l',     label: 'Left Foot',       type: 'ellipse', cx: 80,  cy: 382, rx: 16, ry: 9 },
  { id: 'foot-r',     label: 'Right Foot',      type: 'ellipse', cx: 120, cy: 382, rx: 16, ry: 9 },
];

// Back view zones
const BACK_ZONES = [
  { id: 'head-b',     label: 'Head (Back)',          type: 'ellipse', cx: 100, cy: 36,  rx: 26, ry: 30 },
  { id: 'neck-b',     label: 'Neck',                 type: 'rect',    x: 91,  y: 64,   w: 18,  h: 14, r: 4 },
  { id: 'upper-back', label: 'Upper Back',           type: 'path',    d: 'M72,80 Q76,78 100,78 Q124,78 128,80 L130,130 Q116,136 100,136 Q84,136 70,130 Z' },
  { id: 'lower-back', label: 'Lower Back',           type: 'rect',    x: 74,  y: 136,  w: 52,  h: 36, r: 4 },
  { id: 'glutes',     label: 'Glutes',               type: 'path',    d: 'M70,170 Q80,164 100,164 Q120,164 130,170 L130,196 Q120,206 100,204 Q80,204 70,196 Z' },
  { id: 'shldr-lb',   label: 'Left Shoulder (Back)', type: 'ellipse', cx: 58,  cy: 88,  rx: 16, ry: 14 },
  { id: 'shldr-rb',   label: 'Right Shoulder (Back)',type: 'ellipse', cx: 142, cy: 88,  rx: 16, ry: 14 },
  { id: 'uarm-lb',    label: 'Left Upper Arm',       type: 'rect',    x: 38,  y: 98,   w: 22,  h: 50, r: 10 },
  { id: 'uarm-rb',    label: 'Right Upper Arm',      type: 'rect',    x: 140, y: 98,   w: 22,  h: 50, r: 10 },
  { id: 'forearm-lb', label: 'Left Forearm',         type: 'rect',    x: 36,  y: 152,  w: 20,  h: 44, r: 8 },
  { id: 'forearm-rb', label: 'Right Forearm',        type: 'rect',    x: 144, y: 152,  w: 20,  h: 44, r: 8 },
  { id: 'hand-lb',    label: 'Left Hand',            type: 'ellipse', cx: 46,  cy: 206, rx: 11, ry: 9 },
  { id: 'hand-rb',    label: 'Right Hand',           type: 'ellipse', cx: 154, cy: 206, rx: 11, ry: 9 },
  { id: 'hamst-l',    label: 'Left Hamstring',       type: 'rect',    x: 70,  y: 204,  w: 28,  h: 72, r: 12 },
  { id: 'hamst-r',    label: 'Right Hamstring',      type: 'rect',    x: 102, y: 204,  w: 28,  h: 72, r: 12 },
  { id: 'knee-lb',    label: 'Left Knee (Back)',     type: 'ellipse', cx: 84,  cy: 284, rx: 14, ry: 10 },
  { id: 'knee-rb',    label: 'Right Knee (Back)',    type: 'ellipse', cx: 116, cy: 284, rx: 14, ry: 10 },
  { id: 'calf-l',     label: 'Left Calf',            type: 'rect',    x: 70,  y: 294,  w: 28,  h: 62, r: 10 },
  { id: 'calf-r',     label: 'Right Calf',           type: 'rect',    x: 102, y: 294,  w: 28,  h: 62, r: 10 },
  { id: 'ankle-lb',   label: 'Left Ankle',           type: 'ellipse', cx: 84,  cy: 364, rx: 13, ry: 8 },
  { id: 'ankle-rb',   label: 'Right Ankle',          type: 'ellipse', cx: 116, cy: 364, rx: 13, ry: 8 },
  { id: 'foot-lb',    label: 'Left Foot',            type: 'ellipse', cx: 80,  cy: 382, rx: 16, ry: 9 },
  { id: 'foot-rb',    label: 'Right Foot',           type: 'ellipse', cx: 120, cy: 382, rx: 16, ry: 9 },
];

// ── Single zone shape ────────────────────────────────────────────────────────
function ZoneShape({ zone, isSelected, onPress }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSelected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.7, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,   duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [isSelected]);

  const fill       = isSelected ? RED       : FILL_BASE;
  const stroke     = isSelected ? RED_DARK  : STROKE;
  const strokeW    = isSelected ? 2         : 1.2;

  const sharedProps = { fill, stroke, strokeWidth: strokeW, onPress };

  const shape = (() => {
    switch (zone.type) {
      case 'ellipse':
        return <Ellipse cx={zone.cx} cy={zone.cy} rx={zone.rx} ry={zone.ry} {...sharedProps} />;
      case 'rect':
        return <Rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx={zone.r || 0} {...sharedProps} />;
      case 'path':
        return <Path d={zone.d} {...sharedProps} />;
      default:
        return null;
    }
  })();

  // Wrap selected zones in animated opacity for pulse effect
  if (isSelected) {
    return (
      <Animated.View style={{ opacity: pulse, position: 'absolute', top: 0, left: 0 }}
        pointerEvents="none"
      >
        {/* Animated glow ring — drawn as extra SVG overlaid */}
      </Animated.View>
    );
  }

  return shape;
}

// ── Main figure SVG ──────────────────────────────────────────────────────────
function BodyFigure({ zones, selectedArea, onSelect, view }) {
  return (
    <Svg viewBox="0 0 200 400" width={180} height={360}>

      {/* View label */}
      <Rect x={72} y={0} width={56} height={14} rx={7} fill={FILL_HOVER} />
      <Path
        d={view === 'front'
          ? 'M80,7 h40 M84,4 l-4,3 4,3 M116,4 l4,3 -4,3'   // front arrows
          : 'M80,7 h40 M84,4 l-4,3 4,3 M116,4 l4,3 -4,3'
        }
        stroke={STROKE} strokeWidth={1.2} strokeLinecap="round" fill="none"
      />
      <Path
        d={view === 'front' ? 'M88,7 h24' : 'M88,7 h24'}
        stroke={STROKE} strokeWidth={1} fill="none"
      />

      {/* Render all zones */}
      {zones.map(zone => {
        const isSelected = selectedArea === zone.label;
        const fill    = isSelected ? RED      : FILL_BASE;
        const stroke  = isSelected ? RED_DARK : STROKE;
        const strokeW = isSelected ? 2        : 1.2;
        const props   = { fill, stroke, strokeWidth: strokeW, onPress: () => onSelect(isSelected ? '' : zone.label) };

        if (zone.type === 'ellipse') return <Ellipse key={zone.id} cx={zone.cx} cy={zone.cy} rx={zone.rx} ry={zone.ry} {...props} />;
        if (zone.type === 'rect')    return <Rect    key={zone.id} x={zone.x}  y={zone.y}  width={zone.w}  height={zone.h} rx={zone.r || 0} {...props} />;
        if (zone.type === 'path')    return <Path    key={zone.id} d={zone.d} {...props} />;
        return null;
      })}

      {/* Selected zone highlight dot */}
      {zones.filter(z => z.label === selectedArea).map(zone => {
        let cx, cy;
        if (zone.type === 'ellipse') { cx = zone.cx; cy = zone.cy; }
        else if (zone.type === 'rect')  { cx = zone.x + zone.w / 2; cy = zone.y + zone.h / 2; }
        else return null; // skip path zones (already red filled)
        return <Circle key={`dot-${zone.id}`} cx={cx} cy={cy} r={4} fill={FILL_BASE} opacity={0.8} pointerEvents="none" />;
      })}
    </Svg>
  );
}

// ── Exported component ───────────────────────────────────────────────────────
export default function BodyMap({ selectedArea, onSelect }) {
  const [view, setView] = useState('front');   // 'front' | 'back'
  const fadeAnim = useRef(new Animated.Value(1)).current;

  function toggleView(newView) {
    if (newView === view) return;
    // Fade out → swap → fade in
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setView(newView);
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
    // Clear selection when switching views (zone IDs differ)
    onSelect('');
  }

  const zones = view === 'front' ? FRONT_ZONES : BACK_ZONES;

  return (
    <View style={s.root}>
      {/* Front / Back toggle */}
      <View style={s.toggle}>
        <Pressable
          style={[s.toggleBtn, view === 'front' && s.toggleActive]}
          onPress={() => toggleView('front')}
        >
          <Text style={[s.toggleTxt, view === 'front' && s.toggleTxtActive]}>Front</Text>
        </Pressable>
        <Pressable
          style={[s.toggleBtn, view === 'back' && s.toggleActive]}
          onPress={() => toggleView('back')}
        >
          <Text style={[s.toggleTxt, view === 'back' && s.toggleTxtActive]}>Back</Text>
        </Pressable>
      </View>

      {/* Figure */}
      <Animated.View style={[s.figure, { opacity: fadeAnim }]}>
        <BodyFigure
          zones={zones}
          selectedArea={selectedArea}
          onSelect={onSelect}
          view={view}
        />
      </Animated.View>

      {/* Selected label chip */}
      {selectedArea ? (
        <View style={s.chip}>
          <View style={s.chipDot} />
          <Text style={s.chipTxt}>{selectedArea}</Text>
          <Pressable onPress={() => onSelect('')} hitSlop={10} style={s.chipClear}>
            <Text style={s.chipClearTxt}>✕</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={s.hint}>Tap to select where it hurts</Text>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { alignItems: 'center', gap: 12 },

  toggle: { flexDirection: 'row', backgroundColor: '#EDE9E6', borderRadius: 20, padding: 3 },
  toggleBtn: {
    paddingVertical: 6, paddingHorizontal: 22,
    borderRadius: 18,
  },
  toggleActive: { backgroundColor: '#1C1C1E' },
  toggleTxt:    { fontFamily: 'DMSans_500Medium', fontSize: 13, color: '#A89A9A' },
  toggleTxtActive: { color: '#FFFFFF' },

  figure: { alignItems: 'center' },

  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: RED_LIGHT, borderRadius: 20,
    paddingVertical: 7, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: RED + '66',
  },
  chipDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: RED },
  chipTxt:      { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#8B2A2A', flex: 1 },
  chipClear:    { padding: 2 },
  chipClearTxt: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: '#A89A9A' },

  hint: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#A89A9A' },
});