import { View, Text, Pressable, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Polyline, Path } from 'react-native-svg';
import { C, FONTS } from '../constants/colors';

const FEATURES = [
  'Tap your body to log where it hurts',
  'IBM Granite detects patterns over time',
  'Autonomous agents prep your doctor visit',
];

function EcgLogo() {
  return (
    <Svg viewBox="0 0 340 120" width={220} height={78} style={styles.ecgLogo}>
      <Polyline
        points="0,60 30,60 40,60 50,30 60,90 70,10 80,90 90,60 110,60"
        stroke={C.red} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      <Path
        d="M145,45 C145,38 152,32 160,36 C162,37 164,39 165,42 C166,39 168,37 170,36 C178,32 185,38 185,45 C185,52 178,60 165,70 C152,60 145,52 145,45Z"
        stroke={C.red} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      <Polyline
        points="190,60 210,60 220,30 230,90 240,20 250,80 260,60 280,60 310,60 340,60"
        stroke={C.red} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </Svg>
  );
}

export default function SplashScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />

      <EcgLogo />

      <Text style={styles.title}>PULSE</Text>
      <Text style={styles.subtitle}>
        Powered by IBM watsonx{'\n'}Your health, remembered.
      </Text>

      <View style={styles.features}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featRow}>
            <View style={styles.featDot} />
            <Text style={styles.featText}>{f}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        onPress={() => router.replace('/(tabs)')}
      >
        <Text style={styles.btnText}>GET STARTED</Text>
      </Pressable>

      <Text style={styles.badge}>
        IBM watsonx Orchestrate · IBM Granite · BIND Team
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.black,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 48,
  },
  ecgLogo: {
    marginBottom: 24,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 80,
    letterSpacing: 6,
    color: C.white,
    lineHeight: 80,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: C.gray400,
    textAlign: 'center',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 40,
    lineHeight: 22,
  },
  features: {
    width: '100%',
    gap: 8,
    marginBottom: 32,
  },
  featRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
  },
  featDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.red,
  },
  featText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: FONTS.body,
  },
  btn: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: C.red,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnPressed: {
    backgroundColor: C.redDark,
    transform: [{ scale: 0.98 }],
  },
  btnText: {
    fontFamily: FONTS.display,
    fontSize: 22,
    letterSpacing: 2,
    color: C.white,
  },
  badge: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
