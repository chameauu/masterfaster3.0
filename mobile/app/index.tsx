import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Entry point - redirects to auth or tabs based on authentication status
 * TODO: Implement actual auth check
 */
export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Mock: Check if user is authenticated
    const isAuthenticated = false; // TODO: Replace with actual auth check

    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#000" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
