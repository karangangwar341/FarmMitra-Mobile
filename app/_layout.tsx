import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import { useLedgerStore } from '../lib/store';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';

export default function RootLayout() {
  const initialize = useLedgerStore(state => state.initialize);
  const isInitialized = useLedgerStore(state => state.isInitialized);

  useEffect(() => {
    initialize();
  }, []);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>FarmMitra लोड हो रहा है...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <>
      <Slot />
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
});
