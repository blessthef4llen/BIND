/**
 * app/(tabs)/_layout.js — 4-tab navigation
 *
 * Tabs: Home · Log · After Visit · Timeline
 * Brand: soft red active, warm charcoal inactive
 */

import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';
import { Colors } from '../../constants/theme';

// ─── Icons ───────────────────────────────────────────────────────────────────

const s = 1.6; // stroke width

function HomeIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M3 11L11 4l8 7" stroke={color} strokeWidth={s} fill="none" strokeLinecap="round" />
      <Rect x={6} y={11} width={10} height={8} rx={1.5} stroke={color} strokeWidth={s} fill="none" />
    </Svg>
  );
}

function LogIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      {/* Clipboard */}
      <Rect x={4} y={5} width={14} height={15} rx={2} stroke={color} strokeWidth={s} fill="none" />
      <Path d="M8 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke={color} strokeWidth={s} strokeLinecap="round" fill="none" />
      {/* Plus */}
      <Path d="M11 9v6M8 12h6" stroke={color} strokeWidth={s} strokeLinecap="round" />
    </Svg>
  );
}

function AfterVisitIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      {/* Document */}
      <Rect x={4} y={2} width={14} height={18} rx={2} stroke={color} strokeWidth={s} fill="none" />
      {/* Upload arrow */}
      <Path d="M11 7v7M8 10l3-3 3 3" stroke={color} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Bottom line */}
      <Line x1={7} y1={17} x2={15} y2={17} stroke={color} strokeWidth={s} strokeLinecap="round" />
    </Svg>
  );
}

function TimelineIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      {/* Vertical line */}
      <Line x1={8} y1={3} x2={8} y2={19} stroke={color} strokeWidth={s} strokeLinecap="round" />
      {/* Timeline dots */}
      <Circle cx={8} cy={7}  r={2.5} stroke={color} strokeWidth={s} fill="none" />
      <Circle cx={8} cy={15} r={2.5} stroke={color} strokeWidth={s} fill="none" />
      {/* Label lines */}
      <Line x1={13} y1={7}  x2={19} y2={7}  stroke={color} strokeWidth={s} strokeLinecap="round" />
      <Line x1={13} y1={11} x2={17} y2={11} stroke={color} strokeWidth={s} strokeLinecap="round" />
      <Line x1={13} y1={15} x2={19} y2={15} stroke={color} strokeWidth={s} strokeLinecap="round" />
    </Svg>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const NAV_H      = Platform.OS === 'ios' ? 82 : 62;
const NAV_PAD_B  = Platform.OS === 'ios' ? 28 : 8;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   Colors.red,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor:  Colors.white,
          borderTopColor:   Colors.border,
          borderTopWidth:   1,
          paddingTop:       8,
          paddingBottom:    NAV_PAD_B,
          height:           NAV_H,
        },
        tabBarLabelStyle: {
          fontSize:   10,
          fontFamily: 'DMSans_500Medium',
          marginTop:  2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <HomeIcon color={color} /> }}
      />
      <Tabs.Screen
        name="log"
        options={{ title: 'Log', tabBarIcon: ({ color }) => <LogIcon color={color} /> }}
      />
      <Tabs.Screen
        name="after-visit"
        options={{ title: 'After Visit', tabBarIcon: ({ color }) => <AfterVisitIcon color={color} /> }}
      />
      <Tabs.Screen
        name="timeline"
        options={{ title: 'Timeline', tabBarIcon: ({ color }) => <TimelineIcon color={color} /> }}
      />

      {/* Hidden — accessible via push, not shown in tab bar */}
      <Tabs.Screen name="demo"         options={{ href: null }} />
      <Tabs.Screen name="edit-concern" options={{ href: null }} />
    </Tabs>
  );
}