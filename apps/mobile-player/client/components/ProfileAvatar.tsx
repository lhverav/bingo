import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ProfileAvatarProps {
  name: string;
  size?: number;
  onPress: () => void;
}

export default function ProfileAvatar({ name, size = 40, onPress }: ProfileAvatarProps) {
  // Get first letter of name, uppercase
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.initial, { fontSize: size * 0.45 }]}>
        {initial}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: '#1a1a2e',
    fontWeight: 'bold',
  },
});
