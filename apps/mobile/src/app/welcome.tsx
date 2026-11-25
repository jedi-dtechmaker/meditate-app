import { useMemo, useState } from 'react';
import { ImageBackground, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const scenes = [
  { image: require('../../assets/images/welcome/mountains.jpg'), message: 'Take a moment with God’s Word daily.' },
  { image: require('../../assets/images/welcome/forest.jpg'), message: 'Be still, and know that I am God.\nPsalm 46:10' },
  { image: require('../../assets/images/welcome/lake.jpg'), message: 'Let your heart find rest in His presence.' },
  { image: require('../../assets/images/welcome/sea.jpg'), message: 'His mercies are new every morning.\nLamentations 3:23' },
  { image: require('../../assets/images/welcome/sunrise.jpg'), message: 'Make space for peace, prayer, and Scripture.' },
];

export default function Welcome() {
  const [scene, setScene] = useState(() => Math.floor(Math.random() * scenes.length));
  const changeScene = () => setScene(current => {
    const offset = 1 + Math.floor(Math.random() * (scenes.length - 1));
    return (current + offset) % scenes.length;
  });
  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 30 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderRelease: (_, gesture) => { if (Math.abs(gesture.dx) > 50) changeScene(); },
  }), []);

  return <View style={styles.root}>
    <StatusBar style="light" />
    <ImageBackground source={scenes[scene].image} resizeMode="cover" style={StyleSheet.absoluteFill} />
    <LinearGradient colors={['rgba(7, 18, 31, 0.66)', 'rgba(7, 18, 31, 0.32)', 'rgba(4, 14, 20, 0.87)']} locations={[0, 0.48, 1]} style={StyleSheet.absoluteFill} />
    <SafeAreaView style={styles.safe} {...swipe.panHandlers}>
      <View style={styles.top}>
        <View style={styles.badge}><Sparkles size={13} color="#95e4ba" /><Text style={styles.badgeText}>A moment of stillness</Text></View>
        <View style={styles.icon}><BookOpen size={26} color="#fff" strokeWidth={1.6} /></View>
        <Text style={styles.title}>Meditate{'\n'}on the Word</Text>
        <Text style={styles.subtitle}>{scenes[scene].message}</Text>
      </View>
      <View style={styles.middle}>
        <Pressable accessibilityRole="button" accessibilityLabel="Choose another background" onPress={changeScene} style={styles.arrow}><ChevronLeft color="#fff" size={21} /></Pressable>
        <View style={styles.hint}><Text style={styles.hintText}>Swipe left or right{'\n'}to discover more</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Choose another background" onPress={changeScene} style={styles.arrow}><ChevronRight color="#fff" size={21} /></Pressable>
      </View>
      <View style={styles.bottom}>
        <View style={styles.dots}>{scenes.map((_, index) => <View key={index} style={[styles.dot, index === scene && styles.activeDot]} />)}</View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/sign-in')} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>Get Started</Text><ArrowRight size={18} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#142a32' },
  safe: { flex: 1, paddingHorizontal: 24, paddingBottom: 28 },
  top: { alignItems: 'center', paddingTop: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 12, paddingVertical: 7 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '500' },
  icon: { marginTop: 26, width: 51, height: 51, borderRadius: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  title: { marginTop: 20, color: '#fff', textAlign: 'center', fontFamily: 'serif', fontSize: 38, lineHeight: 43, letterSpacing: -0.8 },
  subtitle: { marginTop: 18, minHeight: 46, maxWidth: 280, color: 'rgba(255,255,255,0.9)', textAlign: 'center', fontSize: 15, lineHeight: 22 },
  middle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  hint: { paddingHorizontal: 13, paddingVertical: 11, borderRadius: 12, backgroundColor: 'rgba(12,24,28,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  hintText: { color: 'rgba(255,255,255,0.83)', textAlign: 'center', fontSize: 10, lineHeight: 15 },
  bottom: { gap: 26 },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  activeDot: { width: 23, backgroundColor: '#fff' },
  button: { minHeight: 58, borderRadius: 14, backgroundColor: '#00ad58', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.85 },
});
