import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/authStyles';

interface BackButtonProps {
  onPress: () => void;
}

export default function BackButton({ onPress }: BackButtonProps) {
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[styles.container, { paddingTop: insets.top + spacing.md }]}
      onPress={onPress}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
    >
      <Text style={styles.icon}>←</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  icon: {
    color: colors.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
});
