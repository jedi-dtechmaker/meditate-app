import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, PanResponder, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { router, usePathname } from 'expo-router';
import { MessageCircle, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SIZE = 56;
const MARGIN = 12;
type Point = { x: number; y: number };
type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

function clamp(point: Point, bounds: Bounds): Point {
  return {
    x: Math.max(bounds.minX, Math.min(point.x, bounds.maxX)),
    y: Math.max(bounds.minY, Math.min(point.y, bounds.maxY)),
  };
}

/** A movable shortcut that stays above the navigation bar and system insets. */
export function FloatingCompanion() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [position, setPosition] = useState<Point | null>(null);
  const positionRef = useRef<Point | null>(null);
  const startRef = useRef<Point>({ x: 0, y: 0 });
  const boundsRef = useRef<Bounds>({ minX: MARGIN, maxX: MARGIN, minY: MARGIN, maxY: MARGIN });

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const beginDrag = useCallback(() => {
    startRef.current = positionRef.current ?? { x: MARGIN, y: MARGIN };
  }, []);
  const moveDrag = useCallback((dx: number, dy: number) => {
    const next = clamp({ x: startRef.current.x + dx, y: startRef.current.y + dy }, boundsRef.current);
    positionRef.current = next;
    setPosition(next);
  }, []);
  // PanResponder only invokes these callbacks for touch events, never while creating the responder.
  // eslint-disable-next-line react-hooks/refs
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
    onPanResponderGrant: beginDrag,
    onPanResponderMove: (_, gesture) => moveDrag(gesture.dx, gesture.dy),
    onPanResponderTerminationRequest: () => false,
  }), [beginDrag, moveDrag]);

  function updateBounds(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    if (!width || !height) return;
    const minY = insets.top + MARGIN;
    const bounds = {
      minX: MARGIN,
      maxX: Math.max(MARGIN, width - SIZE - MARGIN),
      minY,
      maxY: Math.max(minY, height - SIZE - insets.bottom - 82),
    };
    boundsRef.current = bounds;
    const next = clamp(positionRef.current ?? { x: bounds.maxX, y: height * 0.58 }, bounds);
    positionRef.current = next;
    setPosition((current) => current?.x === next.x && current?.y === next.y ? current : next);
  }

  const visible = !keyboardOpen && pathname !== '/companion' && pathname !== '/entry' && pathname !== '/onboarding';
  return <View pointerEvents="box-none" style={StyleSheet.absoluteFill} onLayout={updateBounds}>
    {visible && position && <View {...pan.panHandlers} style={[styles.widget, { left: position.x, top: position.y }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open Sanctuary Companion"
        accessibilityHint="Drag to move this shortcut" onPress={() => router.push('/(app)/(tabs)/companion')}
        style={({ pressed }) => [styles.button, { opacity: pressed ? 0.8 : 1 }]}>
        <MessageCircle color="#fff" size={25} strokeWidth={2.2} />
        <View style={styles.sparkle}><Sparkles color="#067b51" size={12} strokeWidth={2.5} /></View>
      </Pressable>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  widget: { position: 'absolute', width: SIZE, height: SIZE, zIndex: 10, elevation: 8 },
  button: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: '#008c5b', borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#153b2d', shadowOpacity: 0.2, shadowRadius: 9, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
  sparkle: { position: 'absolute', top: 3, right: 2, width: 19, height: 19, borderRadius: 10, backgroundColor: '#d9f8e9', alignItems: 'center', justifyContent: 'center' },
});
