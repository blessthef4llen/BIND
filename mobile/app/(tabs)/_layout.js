/**
 * app/(tabs)/_layout.js — Tab navigation layout
 *
 * Visible tabs (in order):
 *   1. Home        (index)
 *   2. Log         (log)        — pre-visit concern form → POST /api/prep
 *   3. After Visit (after-visit) — re-export to doctor-notes / notes-extracted
 *   4. Timeline    (timeline)   — GET /api/timeline, post-appointment records only
 *
 * Hidden (not in tab bar, still navigable by route):
 *   - demo
 *   - edit-concern
 */

import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import { C } from '../../constants/colors';

// ─── Icon components ──────────────────────────────────────────────────────

function HomeIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 20 20">
      <Path d="M3 10L10 3l7 7" stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Rect x={5} y={10} width={10} height={8} rx={1} stroke={color} strokeWidth={1.5} fill="none" />
    </Svg>
  );
}

function LogIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 20 20">
      <Path d="M10 3v14M3 10h14" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function AfterVisitIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 20 20">
      <Path
        d="M5 2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
      />
      <Path
        d="M10 7v6M7 10l3-3 3 3"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * ClipboardIcon — used for the Timeline tab.
 * A clipboard with horizontal lines represents post-visit records,
 * replacing the old clock icon which implied a history of tracked logs.
 */
function ClipboardIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 20 20">
      {/* Clipboard body */}
      <Rect x={4} y={4} width={12} height={14} rx={1.5} stroke={color} strokeWidth={1.5} fill="none" />
      {/* Clip at top */}
      <Rect x={7} y={2} width={6} height={3} rx={1} stroke={color} strokeWidth={1.5} fill="none" />
      {/* Content lines */}
      <Line x1={7} y1={9}  x2={13} y2={9}  stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Line x1={7} y1={12} x2={13} y2={12} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Line x1={7} y1={15} x2={11} y2={15} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

// ─── Layout constants (platform-aware) ───────────────────────────────────

const NAV_HEIGHT         = Platform.OS === 'ios' ? 82 : 62;
const NAV_PADDING_BOTTOM = Platform.OS === 'ios' ? 28 : 8;

// ─── Layout ───────────────────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   C.red,
        tabBarInactiveTintColor: C.gray400,
        tabBarStyle: {
          backgroundColor: C.white,
          borderTopColor:  C.gray200,
          borderTopWidth:  1.5,
          paddingTop:      8,
          paddingBottom:   NAV_PADDING_BOTTOM,
          height:          NAV_HEIGHT,
        },
        tabBarLabelStyle: {
          fontSize:   10,
          fontFamily: 'DMSans_500Medium',
          marginTop:  2,
        },
      }}
    >
      {/* ── Visible tabs ─────────────────────────────────────── */}
      <Tabs.Screen
        name="index"
        options={{
          title:        'Home',
          tabBarIcon:   ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title:        'Log',
          tabBarIcon:   ({ color }) => <LogIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="after-visit"
        options={{
          title:        'After Visit',
          tabBarIcon:   ({ color }) => <AfterVisitIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title:        'Timeline',
          tabBarIcon:   ({ color }) => <ClipboardIcon color={color} />,
        }}
      />

      {/* ── Hidden routes — reachable by navigation, not shown in tab bar ── */}
      <Tabs.Screen name="demo"         options={{ href: null }} />
      <Tabs.Screen name="edit-concern" options={{ href: null }} />
    </Tabs>
  );
}
