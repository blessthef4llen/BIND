// constants/bodyZones.ts — tappable body map zone definitions

export type BodyZone = {
  id: string;
  label: string;
  shape: 'ellipse' | 'rect';
  // Ellipse props
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
  // Rect props
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rx_rect?: number;
  // Optional SVG transform
  transform?: string;
};

export const BODY_ZONES: BodyZone[] = [
  {
    id: 'head',
    label: 'Head / Neck',
    shape: 'ellipse',
    cx: 110, cy: 40, rx: 28, ry: 34,
  },
  {
    id: 'neck',
    label: 'Neck',
    shape: 'rect',
    x: 101, y: 72, width: 18, height: 18, rx_rect: 3,
  },
  {
    id: 'torso',
    label: 'Chest / Torso',
    shape: 'rect',
    x: 72, y: 88, width: 76, height: 90, rx_rect: 10,
  },
  {
    id: 'leftArm',
    label: 'Left Arm',
    shape: 'rect',
    x: 42, y: 90, width: 26, height: 80, rx_rect: 12,
    transform: 'rotate(-4, 55, 130)',
  },
  {
    id: 'rightArm',
    label: 'Right Arm',
    shape: 'rect',
    x: 152, y: 90, width: 26, height: 80, rx_rect: 12,
    transform: 'rotate(4, 165, 130)',
  },
  {
    id: 'lowerBody',
    label: 'Lower Abdomen',
    shape: 'rect',
    x: 78, y: 176, width: 64, height: 42, rx_rect: 8,
  },
  {
    id: 'leftLegUpper',
    label: 'Left Upper Leg',
    shape: 'rect',
    x: 72, y: 216, width: 30, height: 70, rx_rect: 12,
  },
  {
    id: 'rightLegUpper',
    label: 'Right Upper Leg',
    shape: 'rect',
    x: 118, y: 216, width: 30, height: 70, rx_rect: 12,
  },
  {
    id: 'leftKnee',
    label: 'Left Knee',
    shape: 'ellipse',
    cx: 87, cy: 294, rx: 14, ry: 11,
  },
  {
    id: 'rightKnee',
    label: 'Right Knee',
    shape: 'ellipse',
    cx: 133, cy: 294, rx: 14, ry: 11,
  },
  {
    id: 'leftShin',
    label: 'Left Shin',
    shape: 'rect',
    x: 73, y: 304, width: 28, height: 58, rx_rect: 10,
  },
  {
    id: 'rightShin',
    label: 'Right Shin',
    shape: 'rect',
    x: 119, y: 304, width: 28, height: 58, rx_rect: 10,
  },
  {
    id: 'leftFoot',
    label: 'Left Foot / Ankle',
    shape: 'ellipse',
    cx: 87, cy: 366, rx: 14, ry: 8,
  },
  {
    id: 'rightFoot',
    label: 'Right Foot / Ankle',
    shape: 'ellipse',
    cx: 133, cy: 366, rx: 14, ry: 8,
  },
];

// Map zone IDs to friendly display labels for the log form
export const ZONE_LABELS: Record<string, string> = {
  head:         'Head / Neck',
  neck:         'Neck',
  torso:        'Chest / Torso',
  leftArm:      'Left Arm / Shoulder',
  rightArm:     'Right Arm / Shoulder',
  lowerBody:    'Lower Abdomen',
  leftLegUpper: 'Left Upper Leg',
  rightLegUpper:'Right Upper Leg',
  leftKnee:     'Left Knee',
  rightKnee:    'Right Knee',
  leftShin:     'Left Shin',
  rightShin:    'Right Shin',
  leftFoot:     'Left Foot / Ankle',
  rightFoot:    'Right Foot / Ankle',
};
