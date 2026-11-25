import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View, type TextInputProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { Profile } from '@shared/domain';

const light = { bg: '#f5f7f2', card: '#ffffff', text: '#17382e', muted: '#63776d', line: '#dee8de', green: '#256b4c', soft: '#e8f0e5', danger: '#a73535', white: '#ffffff' };
const dark = { bg: '#10241d', card: '#193228', text: '#edf4e8', muted: '#b1c2b5', line: '#345042', green: '#91cfa2', soft: '#233e2f', danger: '#ffaaa1', white: '#10241d' };
const DesignContext = createContext<{ mode: Profile['theme']; setMode: (mode: Profile['theme']) => void }>({ mode: 'system', setMode: () => {} });
export function DesignProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<Profile['theme']>('system');
  return <DesignContext.Provider value={{ mode, setMode }}>{children}</DesignContext.Provider>;
}
export function useDesign() {
  const state = useContext(DesignContext);
  const system = useColorScheme();
  const isDark = state.mode === 'system' ? system === 'dark' : state.mode === 'dark';
  return { ...state, colors: isDark ? dark : light, isDark };
}
export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stack: { gap: 16 }, smallGap: { gap: 8 },
  serif: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
});
export function Page({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const { colors, isDark } = useDesign();
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
    <StatusBar style={isDark ? 'light' : 'dark'} />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, padding: 24, gap: 22, width: '100%', maxWidth: 740, alignSelf: 'center' }}>
        {children}
      </ScrollView> : <View style={{ flex: 1, padding: 24, gap: 18, width: '100%', maxWidth: 740, alignSelf: 'center' }}>{children}</View>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export function Copy({ children, muted = false, small = false, style }: PropsWithChildren<{ muted?: boolean; small?: boolean; style?: object }>) {
  const { colors } = useDesign();
  return <Text style={[{ color: muted ? colors.muted : colors.text, fontSize: small ? 13 : 16, lineHeight: small ? 20 : 25 }, style]}>{children}</Text>;
}
export function Title({ children, eyebrow }: PropsWithChildren<{ eyebrow?: string }>) {
  const { colors } = useDesign();
  return <View style={{ gap: 8 }}>{eyebrow && <Text style={{ color: colors.green, fontSize: 11, fontWeight: '700', letterSpacing: 2 }}>{eyebrow.toUpperCase()}</Text>}
    <Text accessibilityRole="header" style={[styles.serif, { color: colors.text, fontSize: 32, lineHeight: 40 }]}>{children}</Text></View>;
}
export function SectionTitle({ children }: PropsWithChildren) {
  const { colors } = useDesign();
  return <Text accessibilityRole="header" style={{ fontSize: 19, fontWeight: '600', color: colors.text }}>{children}</Text>;
}
export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  const { colors } = useDesign();
  return <View style={[{ padding: 20, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, gap: 12 }, style]}>{children}</View>;
}
export function Button({ title, onPress, busy = false, disabled = false, secondary = false, danger = false }: {
  title: string; onPress: () => void; busy?: boolean; disabled?: boolean; secondary?: boolean; danger?: boolean;
}) {
  const { colors } = useDesign();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || busy, busy }}
    onPress={onPress} disabled={disabled || busy} style={({ pressed }) => ({
      minHeight: 52, borderRadius: 15, paddingHorizontal: 18, paddingVertical: 14,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: secondary ? colors.soft : danger ? colors.danger : colors.green,
      opacity: disabled || busy ? 0.5 : pressed ? 0.75 : 1,
    })}>{busy && <ActivityIndicator color={secondary ? colors.green : colors.white} />}
    <Text style={{ color: secondary ? colors.text : colors.white, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>{title}</Text>
  </Pressable>;
}
export function Chip({ title, selected, onPress }: { title: string; selected?: boolean; onPress: () => void }) {
  const { colors } = useDesign();
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: Boolean(selected) }} onPress={onPress}
    style={{ minHeight: 44, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 14, borderWidth: 1, borderColor: selected ? colors.green : colors.line, backgroundColor: selected ? colors.soft : colors.card }}>
    <Text style={{ color: selected ? colors.green : colors.muted, fontWeight: selected ? '700' : '500', fontSize: 14 }}>{title}</Text>
  </Pressable>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { colors } = useDesign();
  return <View style={{ gap: 8 }}><Copy small>{label}</Copy><TextInput {...props} accessibilityLabel={label}
    placeholderTextColor={colors.muted} style={[{ color: colors.text, backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, borderRadius: 14, minHeight: 54, padding: 15, fontSize: 16, textAlignVertical: props.multiline ? 'top' : 'center' }, props.style]} /></View>;
}
export function Notice({ message, error = false }: { message: string | null; error?: boolean }) {
  const { colors } = useDesign();
  if (!message) return null;
  return <Text accessibilityLiveRegion="polite" style={{ color: error ? colors.danger : colors.green, fontSize: 14, lineHeight: 22 }}>{message}</Text>;
}
export function Loading({ message = 'Opening your sanctuary…' }: { message?: string }) {
  const { colors } = useDesign();
  return <Page><View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 }}><ActivityIndicator color={colors.green} /><Copy muted>{message}</Copy></View></Page>;
}

/** App-owned loading screen, shown after the JavaScript bundle has started. */
export function BrandLoading({ message = 'Preparing your quiet space…' }: { message?: string }) {
  const { colors, isDark } = useDesign();
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}><StatusBar style={isDark ? 'light' : 'dark'} />
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
      <Image source={require('../../assets/images/temporary-logo.png')} accessibilityLabel="Meditate on the Word" resizeMode="contain" style={{ width: 140, height: 140, borderRadius: 28 }} />
      <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 25, fontWeight: '700', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>Meditate on the Word</Text>
      <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>{message}</Text><ActivityIndicator color={colors.green} />
    </View></SafeAreaView>;
}
