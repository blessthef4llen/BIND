import React from 'react';
import Svg, { Ellipse, Rect, Path, Text as SvgText } from 'react-native-svg';

const RED      = '#D42B2B';
const RED_DARK = '#A01E1E';
const FILL_DEF = '#F5F5F5';
const STK_DEF  = '#E5E5E5';

// All 22 SVG shapes mapping to 18 unique tappable labels
const ZONES = [
  { id: 'head',      type: 'ellipse', cx: 100, cy: 38,  rx: 28, ry: 34, label: 'Head / Neck' },
  { id: 'neck',      type: 'rect',    x: 91,  y: 70,   width: 18, height: 16, rx: 3, label: 'Head / Neck' },
  { id: 'chest-l',   type: 'path',    d: 'M72,88 Q72,86 78,86 L100,86 L100,148 Q80,148 72,140 Z', label: 'Chest (Left)' },
  { id: 'chest-r',   type: 'path',    d: 'M100,86 L122,86 Q128,86 128,88 L128,140 Q120,148 100,148 Z', label: 'Chest (Right)' },
  { id: 'abdomen',   type: 'rect',    x: 76,  y: 148,  width: 48, height: 44, rx: 6, label: 'Abdomen' },
  { id: 'shldr-l',   type: 'ellipse', cx: 58,  cy: 95,  rx: 16, ry: 14, label: 'Left Shoulder' },
  { id: 'shldr-r',   type: 'ellipse', cx: 142, cy: 95,  rx: 16, ry: 14, label: 'Right Shoulder' },
  { id: 'arm-l',     type: 'rect',    x: 38,  y: 106,  width: 22, height: 52, rx: 10, label: 'Left Arm' },
  { id: 'arm-r',     type: 'rect',    x: 140, y: 106,  width: 22, height: 52, rx: 10, label: 'Right Arm' },
  { id: 'forearm-l', type: 'rect',    x: 36,  y: 162,  width: 20, height: 44, rx: 8,  label: 'Left Forearm' },
  { id: 'forearm-r', type: 'rect',    x: 144, y: 162,  width: 20, height: 44, rx: 8,  label: 'Right Forearm' },
  { id: 'pelvis',    type: 'rect',    x: 78,  y: 190,  width: 44, height: 36, rx: 8,  label: 'Pelvis / Hips' },
  { id: 'thigh-l',   type: 'rect',    x: 70,  y: 224,  width: 28, height: 72, rx: 12, label: 'Left Thigh' },
  { id: 'thigh-r',   type: 'rect',    x: 102, y: 224,  width: 28, height: 72, rx: 12, label: 'Right Thigh' },
  { id: 'knee-l',    type: 'ellipse', cx: 84,  cy: 303, rx: 14, ry: 10, label: 'Left Knee' },
  { id: 'knee-r',    type: 'ellipse', cx: 116, cy: 303, rx: 14, ry: 10, label: 'Right Knee' },
  { id: 'shin-l',    type: 'rect',    x: 70,  y: 312,  width: 28, height: 62, rx: 10, label: 'Left Shin' },
  { id: 'shin-r',    type: 'rect',    x: 102, y: 312,  width: 28, height: 62, rx: 10, label: 'Right Shin' },
  { id: 'ankle-l',   type: 'ellipse', cx: 84,  cy: 380, rx: 14, ry: 9,  label: 'Left Ankle' },
  { id: 'ankle-r',   type: 'ellipse', cx: 116, cy: 380, rx: 14, ry: 9,  label: 'Right Ankle' },
  { id: 'foot-l',    type: 'ellipse', cx: 80,  cy: 398, rx: 16, ry: 9,  label: 'Left Foot' },
  { id: 'foot-r',    type: 'ellipse', cx: 120, cy: 398, rx: 16, ry: 9,  label: 'Right Foot' },
];

function ZoneShape({ zone, selected, onPress }) {
  const isActive = selected === zone.label;
  const fill     = isActive ? RED      : FILL_DEF;
  const stroke   = isActive ? RED_DARK : STK_DEF;

  const props = {
    fill,
    stroke,
    strokeWidth: 1.5,
    onPress,
  };

  if (zone.type === 'ellipse') {
    return (
      <Ellipse
        cx={zone.cx} cy={zone.cy} rx={zone.rx} ry={zone.ry}
        {...props}
      />
    );
  }
  if (zone.type === 'rect') {
    return (
      <Rect
        x={zone.x} y={zone.y} width={zone.width} height={zone.height} rx={zone.rx}
        {...props}
      />
    );
  }
  if (zone.type === 'path') {
    return (
      <Path d={zone.d} {...props} />
    );
  }
  return null;
}

export default function BodyMap({ selectedArea, onSelect }) {
  function handlePress(label) {
    // tap same label → deselect
    onSelect(selectedArea === label ? '' : label);
  }

  return (
    <Svg viewBox="0 0 200 460" width={200} height={460}>
      {ZONES.map((zone) => (
        <ZoneShape
          key={zone.id}
          zone={zone}
          selected={selectedArea}
          onPress={() => handlePress(zone.label)}
        />
      ))}
      <SvgText
        x={100} y={120}
        textAnchor="middle"
        fontSize={7}
        fill="#BBBBBB"
        fontFamily="System"
      >
        FRONT
      </SvgText>
    </Svg>
  );
}
