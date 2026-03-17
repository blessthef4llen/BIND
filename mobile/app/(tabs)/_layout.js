/**
 * app/(tabs)/_layout.js — Tab navigation layout
 *
 * Tabs (4):
 *   1. Home     — dashboard
 *   2. Log      — pre-visit concern logging
 *   3. Records  — post-appointment reports (timeline + FAB to add new)
 *   4. Demo     — AI agent chain demo (IBM Granite)
 *
 * Hidden (navigable but no tab icon):
 *   - after-visit  (kept as route, no longer a tab)
 *   - edit-concern
 *   - timeline     (now called "records" in UI but route stays timeline)
 */

import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';
import { C } from '../../constants/colors';

// ─── Icons ───────────────────────────────────────────────────────────────────

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
      <Path d="M10 3v14M3 10h14" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function RecordsIcon({ color }) {
  // Clipboard with a heart — post-appointment health records
  return (
    <Svg width={22} height={22} viewBox="0 0 20 20">
      <Rect x={4} y={4} width={12} height={14} rx={1.5} stroke={color} strokeWidth={1.5} fill="none" />
      <Rect x={7} y={2} width={6} height={3} rx={1} stroke={color} strokeWidth={1.5} fill="none" />
      <Path
        d="M8 11 C8 9.5 9 8.5 10 9.5 C11 8.5 12 9.5 12 11 C12 12.5 10 14 10 14 C10 14 8 12.5 8 11 Z"
        stroke={color} strokeWidth={1.3} fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function DemoIcon({ color }) {
  // ECG pulse wave — the AI agent chain
  return (
    <Svg width={22} height={22} viewBox="0 0 20 20">
      <Polyline
        points="2,10 5,10 7,10 8,5 9,15 10,3 11,15 12,10 15,10 18,10"
        stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </Svg>
  );
}

// ─── Layout constants ─────────────────────────────────────────────────────────
const NAV_HEIGHT         = Platform.OS === 'ios' ? 82 : 62;
const NAV_PADDING_BOTTOM = Platform.OS === 'ios' ? 28 : 8;

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
      {/* ── Visible tabs ──────────────────────────────────────────────── */}
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <HomeIcon color={color} /> }}
      />
      <Tabs.Screen
        name="log"
        options={{ title: 'Log', tabBarIcon: ({ color }) => <LogIcon color={color} /> }}
      />
      <Tabs.Screen
        name="timeline"
        options={{ title: 'Records', tabBarIcon: ({ color }) => <RecordsIcon color={color} /> }}
      />
      <Tabs.Screen
        name="demo"
        options={{ title: 'AI Demo', tabBarIcon: ({ color }) => <DemoIcon color={color} /> }}
      />

      {/* ── Hidden routes (navigable, no tab icon) ─────────────────── */}
      <Tabs.Screen name="after-visit"   options={{ href: null }} />
      <Tabs.Screen name="edit-concern"  options={{ href: null }} />
    </Tabs>
  );
}