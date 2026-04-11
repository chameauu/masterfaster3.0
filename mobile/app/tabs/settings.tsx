import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

/**
 * Settings Screen
 * App configuration and preferences
 */
export default function SettingsScreen() {
  const router = useRouter();
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      accessibilityRole="button"
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={24} color="#000" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && <Ionicons name="chevron-forward" size={24} color="#ccc" />}
    </TouchableOpacity>
  );

  const SettingToggle = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={24} color="#000" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={`Toggle ${title}`}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <SettingItem
            icon="person"
            title="Profile"
            subtitle="Manage your account"
            onPress={() => Alert.alert('Profile', 'Profile settings coming soon')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="key"
            title="Change Password"
            subtitle="Update your password"
            onPress={() => Alert.alert('Password', 'Change password coming soon')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Voice & Audio</Text>
        <View style={styles.card}>
          <SettingToggle
            icon="mic"
            title="Voice Assistant"
            subtitle="Enable voice commands"
            value={voiceEnabled}
            onValueChange={setVoiceEnabled}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="volume-high"
            title="Voice Settings"
            subtitle="Adjust voice speed and volume"
            onPress={() => Alert.alert('Voice', 'Voice settings coming soon')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Security</Text>
        <View style={styles.card}>
          <SettingToggle
            icon="finger-print"
            title="Biometric Login"
            subtitle="Use Face ID / Touch ID"
            value={biometricsEnabled}
            onValueChange={setBiometricsEnabled}
          />
          <View style={styles.divider} />
          <SettingToggle
            icon="notifications"
            title="Notifications"
            subtitle="Enable push notifications"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          <SettingToggle
            icon="moon"
            title="Dark Mode"
            subtitle="Use dark theme"
            value={darkMode}
            onValueChange={setDarkMode}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Sources</Text>
        <View style={styles.card}>
          <SettingItem
            icon="logo-google"
            title="Google Drive"
            subtitle="Connected"
            onPress={() => Alert.alert('Google Drive', 'Manage connection')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="mail"
            title="Gmail"
            subtitle="Connected"
            onPress={() => Alert.alert('Gmail', 'Manage connection')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="add-circle"
            title="Add Data Source"
            subtitle="Connect more sources"
            onPress={() => Alert.alert('Add Source', 'Add data source coming soon')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <SettingItem
            icon="information-circle"
            title="About VocalAIze"
            subtitle="Version 0.0.1"
            onPress={() => Alert.alert('About', 'VocalAIze v0.0.1\nVoice-First Research Assistant')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="document-text"
            title="Privacy Policy"
            onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="shield-checkmark"
            title="Terms of Service"
            onPress={() => Alert.alert('Terms', 'Terms of service coming soon')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityLabel="Logout"
          accessibilityRole="button"
        >
          <Ionicons name="log-out" size={24} color="#f44336" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ for accessibility</Text>
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
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginLeft: 68,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});
