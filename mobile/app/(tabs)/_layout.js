import { Tabs } from 'expo-router';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { C } from '../../constants/colors';

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

function DemoIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 20 20">
      <Circle cx={10} cy={10} r={7} stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M8 7l5 3-5 3V7z" fill={color} />
    </Svg>
  );
}

function TimelineIcon({ color }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 20 20">
      <Circle cx={10} cy={10} r={7} stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M10 7v4l2 2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.red,
        tabBarInactiveTintColor: C.gray400,
        tabBarStyle: {
          backgroundColor: C.white,
          borderTopColor: C.gray200,
          borderTopWidth: 1.5,
          paddingTop: 6,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'DMSans_500Medium',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ color }) => <LogIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="demo"
        options={{
          title: 'Demo',
          tabBarIcon: ({ color }) => <DemoIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Timeline',
          tabBarIcon: ({ color }) => <TimelineIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
