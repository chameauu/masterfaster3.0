import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

/**
 * Voice Assistant Screen
 * Real-time voice conversation with AI
 */
export default function VoiceScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');

  const scale = useSharedValue(1);

  useEffect(() => {
    if (isRecording) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1);
    }
  }, [isRecording]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Microphone access is required for voice features');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setTranscript('Listening...');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();

    // Mock transcription
    setTranscript('Search my documents for photosynthesis');
    
    // Mock AI response
    setTimeout(() => {
      setResponse('I found 3 documents about photosynthesis. The first one is from your biology textbook...');
      setIsPlaying(true);
      
      // Mock TTS playback
      setTimeout(() => {
        setIsPlaying(false);
      }, 3000);
    }, 1000);

    setRecording(null);
  };

  const clearConversation = () => {
    setTranscript('');
    setResponse('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Voice Assistant</Text>
        <TouchableOpacity
          onPress={clearConversation}
          accessibilityLabel="Clear conversation"
        >
          <Ionicons name="refresh" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.statusContainer}>
          {isRecording && (
            <View style={styles.statusBadge}>
              <View style={styles.recordingDot} />
              <Text style={styles.statusText}>Recording</Text>
            </View>
          )}
          {isPlaying && (
            <View style={styles.statusBadge}>
              <Ionicons name="volume-high" size={16} color="#4CAF50" />
              <Text style={styles.statusText}>Playing</Text>
            </View>
          )}
        </View>

        {transcript && (
          <View style={styles.transcriptContainer}>
            <Text style={styles.label}>You said:</Text>
            <Text style={styles.transcript}>{transcript}</Text>
          </View>
        )}

        {response && (
          <View style={styles.responseContainer}>
            <Text style={styles.label}>Assistant:</Text>
            <Text style={styles.response}>{response}</Text>
          </View>
        )}

        <View style={styles.micContainer}>
          <Animated.View style={[styles.micButtonOuter, animatedStyle]}>
            <TouchableOpacity
              style={[
                styles.micButton,
                isRecording && styles.micButtonRecording,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
              accessibilityRole="button"
              accessibilityHint="Tap to start or stop voice recording"
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={48}
                color="#fff"
              />
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.micLabel}>
            {isRecording ? 'Tap to stop' : 'Tap to speak'}
          </Text>
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Try saying:</Text>
          <Text style={styles.tip}>• "Search my documents for..."</Text>
          <Text style={styles.tip}>• "Summarize chapter 3"</Text>
          <Text style={styles.tip}>• "Quiz me on biology"</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f44336',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transcriptContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  responseContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  transcript: {
    fontSize: 16,
    color: '#000',
  },
  response: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },
  micContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  micButtonOuter: {
    marginBottom: 16,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonRecording: {
    backgroundColor: '#f44336',
  },
  micLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  tips: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tip: {
    fontSize: 14,
    color: '#666',
  },
});
