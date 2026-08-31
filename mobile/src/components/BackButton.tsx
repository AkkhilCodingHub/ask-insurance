import { TouchableOpacity, StyleSheet, ViewStyle, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from './Icon';
import { useThemeColors } from '@/context/agent';

interface BackButtonProps {
  onPress?: () => void;
  color?: string;
  style?: ViewStyle;
}

export function BackButton({ onPress, color, style }: BackButtonProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const iconColor = color ?? colors.text;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      BackHandler.exitApp();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.btn, style]}
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Icon name="arrow-back-outline" size={22} color={iconColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
