import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Document {
  id: string;
  title: string;
  source: string;
  date: string;
  size: string;
}

interface DocumentCardProps {
  document: Document;
  onPress: () => void;
}

export function DocumentCard({ document, onPress }: DocumentCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      accessibilityLabel={`Document: ${document.title}`}
      accessibilityRole="button"
    >
      <View style={styles.iconContainer}>
        <Ionicons name="document-text" size={32} color="#2196F3" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {document.title}
        </Text>
        <View style={styles.meta}>
          <Ionicons name="cloud" size={14} color="#666" />
          <Text style={styles.metaText}>{document.source}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.metaText}>{document.date}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.metaText}>{document.size}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  dot: {
    fontSize: 12,
    color: '#ccc',
  },
});
