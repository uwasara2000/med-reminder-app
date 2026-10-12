import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getTypography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { useMedication } from '../context/MedicationContext';

export const Header = () => {
  const { user, isSeniorMode, toggleSeniorMode, isCaregiver } = useAuth();
  const { speakAllPending, summary } = useMedication();
  const typography = getTypography(isSeniorMode);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <View style={styles.container}>
      {/* Top Row: User name & Mode Switcher */}
      <View style={styles.topRow}>
        <View style={styles.userInfo}>
          <Text style={[styles.greeting, { fontSize: typography.header.fontSize }]}>
            {user ? `Hi, ${user.name.split(' ')[0]}` : 'DoseCare'}
          </Text>
          <Text style={styles.subGreeting}>
            {isCaregiver ? '👩‍⚕️ Caregiver Mode' : `📅 Today, ${todayFormatted}`}
          </Text>
        </View>

        {/* Accessibility Senior Mode Toggle */}
        <TouchableOpacity
          style={[styles.modeBadge, isSeniorMode ? styles.modeBadgeActive : styles.modeBadgeStandard]}
          onPress={toggleSeniorMode}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isSeniorMode ? 'glasses' : 'text'}
            size={18}
            color={isSeniorMode ? '#0284C7' : '#64748B'}
          />
          <Text style={[styles.modeText, { color: isSeniorMode ? '#0369A1' : '#475569' }]}>
            {isSeniorMode ? 'Senior Mode' : 'Standard'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Bar: Voice Readout & Adherence Counter */}
      {!isCaregiver && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.voiceAllBtn}
            onPress={speakAllPending}
            activeOpacity={0.8}
          >
            <Ionicons name="volume-high" size={24} color="#FFFFFF" />
            <Text style={styles.voiceAllText}>Read Today's Doses</Text>
          </TouchableOpacity>

          <View style={styles.adherencePill}>
            <Text style={styles.adherenceLabel}>Taken Today</Text>
            <Text style={styles.adherenceCount}>
              {summary.taken}/{summary.total}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 14 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontWeight: '900',
    color: colors.textPrimary,
  },
  subGreeting: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1.5,
  },
  modeBadgeActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#38BDF8',
  },
  modeBadgeStandard: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  modeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 12,
  },
  voiceAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    elevation: 2,
  },
  voiceAllText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  adherencePill: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
  },
  adherenceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    textTransform: 'uppercase',
  },
  adherenceCount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#166534',
  }
});

export default Header;
