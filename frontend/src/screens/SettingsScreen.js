import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getTypography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { useMedication } from '../context/MedicationContext';
import speechService from '../services/speechService';

export const SettingsScreen = () => {
  const { user, isSeniorMode, toggleSeniorMode, logout } = useAuth();
  const { testAlarmClock } = useMedication();
  const typography = getTypography(isSeniorMode);

  const [isVoiceTesting, setIsVoiceTesting] = useState(false);

  const handleTestVoice = () => {
    setIsVoiceTesting(true);
    const greeting = user?.name ? `Hello ${user.name}!` : 'Hello!';
    speechService.speakText(
      `${greeting} This is your medication reminder voice. It is loud, clear, and easy to understand.`,
      {
        onDone: () => setIsVoiceTesting(false)
      }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <Text style={[styles.screenTitle, { fontSize: typography.header.fontSize }]}>
          App Settings
        </Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { fontSize: typography.title.fontSize }]}>
              {user?.name || 'User'}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>
                {user?.role === 'caregiver' ? '👩‍⚕️ Caregiver Account' : '👴 Patient Account'}
              </Text>
            </View>
          </View>
        </View>

        {/* Accessibility & Voice Alarm Section */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { fontSize: typography.title.fontSize }]}>
            🔊 Voice Reminders & Alarm Clock
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingLabel}>Senior Friendly Mode</Text>
              <Text style={styles.settingSub}>
                Enlarges all buttons, text, touch targets, and high contrast colors.
              </Text>
            </View>
            <Switch
              value={isSeniorMode}
              onValueChange={toggleSeniorMode}
              trackColor={{ false: '#CBD5E1', true: colors.primary }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingLabel}>Test Voice Announcement</Text>
              <Text style={styles.settingSub}>
                Hear sample audio announcement tailored for senior hearing.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.testVoiceBtn}
              onPress={handleTestVoice}
              activeOpacity={0.8}
            >
              <Ionicons name="volume-high" size={20} color="#FFFFFF" />
              <Text style={styles.testVoiceBtnText}>Play Voice</Text>
            </TouchableOpacity>
          </View>

          {/* Test Alarm Clock Live Trigger */}
          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingLabel}>Test Live Alarm Clock</Text>
              <Text style={styles.settingSub}>
                Triggers the full-screen audible alarm and spoken reminder.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.testVoiceBtn, { backgroundColor: '#D97706' }]}
              onPress={() => testAlarmClock()}
              activeOpacity={0.8}
            >
              <Ionicons name="alarm" size={20} color="#FFFFFF" />
              <Text style={styles.testVoiceBtnText}>Test Alarm</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={22} color="#DC2626" />
          <Text style={styles.logoutBtnText}>Sign Out of DoseCare</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 14 : 14,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
  },
  screenTitle: {
    fontWeight: '900',
    color: colors.textPrimary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 16,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  roleTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
  roleTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  settingSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  testVoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  testVoiceBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 10,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 17,
    fontWeight: '800',
  }
});

export default SettingsScreen;
