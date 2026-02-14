import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useAuthFlow } from '../contexts/AuthFlowContext';
import { ScreenRenderer } from './ScreenRenderer';
import { colors } from '../styles/theme';

export function AuthFlowNavigator() {
  const { currentScreen, getRootScreen } = useAuthFlow();

  // Use current screen or fall back to root
  const screen = currentScreen || getRootScreen();

  if (!screen) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenRenderer screen={screen} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
