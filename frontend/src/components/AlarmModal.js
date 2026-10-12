import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getTypography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { useMedication } from '../context/MedicationContext';
import PillVisualizer from './PillVisualizer';

export const AlarmModal = () => {
  const { isSeniorMode } = useAuth();
  const { alarmDose, dismissAlarmModal, logDoseStatus, speakDose } = useMedication();
  const typography = getTypography(isSeniorMode);

  if (!alarmDose) return null;

  const handleTake = async () => {
    await logDoseStatus(alarmDose.medicationId, alarmDose.scheduleId, 'taken');
  };

  const handleSnooze = async () => {
    await logDoseStatus(alarmDose.medicationId, alarmDose.scheduleId, 'snoozed', 15);
  };

  const handleSkip = async () => {
    await logDoseStatus(alarmDose.medicationId, alarmDose.scheduleId, 'skipped');
  };

  return (
    <Modal
      visible={!!alarmDose}
      animationType="slide"
      transparent={false}
      onRequestClose={dismissAlarmModal}
    >
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.alarmBadge}>
            <Ionicons name="notifications" size={32} color="#DC2626" />
            <Text style={styles.alarmBadgeText}>MEDICATION ALARM</Text>
          </View>
          <Text style={styles.timeLabel}>{alarmDose.scheduledTime || 'Due Now'}</Text>
        </View>

        {/* Content Card */}
        <View style={styles.contentBox}>
          <PillVisualizer form={alarmDose.form || 'pill'} color={alarmDose.color || '#3B82F6'} size={72} />

          <Text style={styles.medName}>{alarmDose.medicationName}</Text>
          <Text style={styles.dosage}>{alarmDose.dosage}</Text>

          {alarmDose.instructions ? (
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsText}>💡 {alarmDose.instructions}</Text>
            </View>
          ) : null}

          {/* Voice Speaking Indicator & Replay */}
          <TouchableOpacity
            style={styles.speechBtn}
            onPress={() => speakDose(alarmDose)}
            activeOpacity={0.8}
          >
            <Ionicons name="volume-high" size={24} color={colors.primary} />
            <Text style={styles.speechBtnText}>🔊 Repeat Voice Announcement</Text>
          </TouchableOpacity>
        </View>

        {/* Massive Action Buttons for Elderly Accessibility */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.takeNowBtn}
            onPress={handleTake}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={36} color="#FFFFFF" />
            <Text style={styles.takeNowText}>TAKE MEDICATION NOW</Text>
          </TouchableOpacity>

          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={styles.snoozeBtn}
              onPress={handleSnooze}
              activeOpacity={0.85}
            >
              <Ionicons name="time" size={24} color="#B45309" />
              <Text style={styles.snoozeText}>Snooze 15m</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkip}
              activeOpacity={0.85}
            >
              <Ionicons name="close-circle-outline" size={24} color="#64748B" />
              <Text style={styles.skipText}>Skip Dose</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={dismissAlarmModal}
            activeOpacity={0.7}
          >
            <Text style={styles.closeText}>Silence / Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 16 : 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  alarmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  alarmBadgeText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  timeLabel: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  contentBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FCA5A5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  medName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
    textAlign: 'center',
  },
  dosage: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3B82F6',
    marginTop: 4,
    textAlign: 'center',
  },
  instructionsContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  speechBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  speechBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  buttonContainer: {
    gap: 12,
  },
  takeNowBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 18,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#047857',
  },
  takeNowText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  snoozeBtn: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  snoozeText: {
    color: '#B45309',
    fontSize: 16,
    fontWeight: '800',
  },
  skipBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  skipText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  }
});

export default AlarmModal;
