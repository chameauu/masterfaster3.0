import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

/**
 * Home Screen
 * Quick access to main features
 */
export default function HomeScreen() {
  const router = useRouter();

  const features = [
    {
      icon: 'mic',
      title: 'Voice Assistant',
      description: 'Start a voice conversation',
      route: '/(tabs)/voice',
      color: '#4CAF50',
    },
    {
      icon: 'chatbubbles',
      title: 'Text Chat',
      description: 'Chat with AI assistant',
      route: '/(tabs)/chat',
      color: '#2196F3',
    },
    {
      icon: 'document-text',
      title: 'My Documents',
      description: 'Browse your documents',
      route: '/(tabs)/documents',
      color: '#FF9800',
    },
    {
      icon: 'search',
      title: 'Search',
      description: 'Search your knowledge base',
      route: '/(tabs)/chat',
      color: '#9C27B0',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>VocalAIze</Text>
        <Text style={styles.subtitle}>Your Voice-First Research Assistant</Text>
      </View>

      <View style={styles.grid}>
        {features.map((feature, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { borderLeftColor: feature.color }]}
            onPress={() => router.push(feature.route as any)}
            accessibilityLabel={`${feature.title}: ${feature.description}`}
            accessibilityRole="button"
          >
            <View style={[styles.iconContainer, { backgroundColor: feature.color }]}>
              <Ionicons name={feature.icon as any} size={32} color="#fff" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{feature.title}</Text>
              <Text style={styles.cardDescription}>{feature.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No recent activity</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  grid: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
