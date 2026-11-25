import { Tabs } from 'expo-router';
import { BookOpen, ChartNoAxesColumn, Compass, Home, Settings } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDesign } from '@/components/ui';

export default function TabLayout() {
  const { colors } = useDesign();
  const insets = useSafeAreaInsets();

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.green,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: {
        backgroundColor: colors.card,
        borderTopColor: colors.line,
        height: 62 + insets.bottom,
        paddingBottom: insets.bottom,
        paddingTop: 5,
        overflow: 'visible',
      },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="bible" options={{ title: 'Bible', tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} /> }} />
      <Tabs.Screen name="discover" options={{
        title: 'Explore',
        tabBarButton: ({ onPress, onLongPress, accessibilityState, accessibilityLabel, testID }) => {
          const color = accessibilityState?.selected ? colors.green : colors.muted;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel={accessibilityLabel ?? 'Explore'}
              accessibilityState={accessibilityState}
              testID={testID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start', marginTop: -22 }}>
              <View style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.card,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                elevation: 5,
                shadowColor: '#213d31',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.12,
                shadowRadius: 10,
              }}>
                <Compass color={color} size={24} />
                <Text style={{ color, fontSize: 10, fontWeight: '600' }}>Explore</Text>
              </View>
            </Pressable>
          );
        },
      }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: ({ color, size }) => <ChartNoAxesColumn color={color} size={size} /> }} />
      <Tabs.Screen name="preferences" options={{ title: 'Settings', tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }} />
      {/* Keep these routes navigable: href: null redirects hidden tabs in this Router version. */}
      <Tabs.Screen name="companion" options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
      <Tabs.Screen name="journal" options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }} />
    </Tabs>
  );
}
