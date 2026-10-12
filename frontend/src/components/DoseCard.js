import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getTypography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { useMedication } from '../context/MedicationContext';
import PillVisualizer from './PillVisualizer';

export const DoseCard = ({ dose, onTake, onSnooze, onSkip, onEdit, onDelete }) => {
  const { isSeniorMode } = useAuth();
  const { speakDose, triggerAlarmModal } = useMedication();
  const typography = getTypography(isSeniorMode);

  const isTaken = dose.status === 'taken';
  const isSnoozed = dose.status === 'snoozed';
  const isSkipped = dose.status === 'skipped';
  const isPending = dose.status === 'pending';

  const formatFoodBadge = (instruction) => {
    switch (instruction) {
      case 'before_meal': return { text: '🍽️ Before Meal', bg: '#EFF6FF', color: '#1D4ED8' };
      case 'with_meal': return { text: '🍲 With Meal', bg: '#FEF3C7', color: '#92400E' };
      case 'after_meal': return { text: '☕ After Meal', bg: '#ECFDF5', color: '#065F46' };
      case 'empty_stomach': return { text: '💧 Empty Stomach', bg: '#FDF2F8', color: '#9D174D' };
      default: return null;
    }
  };

  const foodBadge = formatFoodBadge(dose.foodInstruction);

  return (
    <View style={[
      styles.card,
      isTaken && styles.cardTaken,
      isSnoozed && styles.cardSnoozed,
      isSeniorMode && styles.seniorCard
    ]}>
      {/* Header: Time & Status / Audio & Action Buttons */}
      <View style={styles.topRow}>
        <View style={styles.timeBadge}>
          <Ionicons name="time-outline" size={isSeniorMode ? 22 : 18} color="#1E3A8A" />
          <Text style={[styles.timeText, { fontSize: typography.timeDisplay.fontSize }]}>
            {dose.scheduledTime}
          </Text>
        </View>

        <View style={styles.topRightActions}>
          {/* TTS Audio Speak Button */}
          <TouchableOpacity
            accessibilityLabel="Speak medication details out loud"
            style={styles.speakerButton}
            onPress={() => speakDose(dose)}
          >
            <Ionicons name="volume-high" size={isSeniorMode ? 24 : 20} color={colors.primary} />
          </TouchableOpacity>

          {/* Test Alarm Trigger */}
          <TouchableOpacity
            accessibilityLabel="Trigger full alarm"
            style={styles.bellButton}
            onPress={() => triggerAlarmModal(dose)}
          >
            <Ionicons name="notifications" size={isSeniorMode ? 22 : 18} color="#D97706" />
          </TouchableOpacity>

          {/* Edit Medication Button */}
          {onEdit && (
            <TouchableOpacity
              accessibilityLabel="Edit medication"
              style={styles.editButton}
              onPress={() => onEdit(dose)}
            >
              <Ionicons name="pencil" size={isSeniorMode ? 22 : 18} color="#2563EB" />
            </TouchableOpacity>
          )}

          {/* Delete Medication Button */}
          {onDelete && (
            <TouchableOpacity
              accessibilityLabel="Delete medication"
              style={styles.deleteButton}
              onPress={() => onDelete(dose)}
            >
              <Ionicons name="trash-outline" size={isSeniorMode ? 22 : 18} color="#DC2626" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Medication Details */}
      <TouchableOpacity
        style={styles.medRow}
        activeOpacity={onEdit ? 0.75 : 1}
        onPress={() => onEdit && onEdit(dose)}
      >
        <PillVisualizer form={dose.form} color={dose.color} size={isSeniorMode ? 44 : 36} />

        <View style={styles.medInfo}>
          <View style={styles.medNameRow}>
            <Text style={[styles.medName, { fontSize: typography.title.fontSize }]}>
              {dose.medicationName}
            </Text>
            {onEdit && (
              <Ionicons name="pencil-outline" size={14} color="#94A3B8" style={{ marginLeft: 6 }} />
            )}
          </View>
          <Text style={[styles.dosageText, { fontSize: typography.bodyLarge.fontSize }]}>
            {dose.dosage}
          </Text>
          {dose.genericName ? (
            <Text style={[styles.genericText, { fontSize: typography.bodySmall.fontSize }]}>
              {dose.genericName}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>

      {/* Badges: Food & Low Stock */}
      <View style={styles.badgesRow}>
        {foodBadge && (
          <View style={[styles.badge, { backgroundColor: foodBadge.bg }]}>
            <Text style={[styles.badgeText, { color: foodBadge.color, fontSize: typography.bodySmall.fontSize }]}>
              {foodBadge.text}
            </Text>
          </View>
        )}

        {dose.isLowStock && (
          <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.badgeText, { color: '#B91C1C', fontSize: typography.bodySmall.fontSize }]}>
              ⚠️ Low Stock: {dose.currentStock} left
            </Text>
          </View>
        )}
      </View>

      {/* Instructions Note */}
      {dose.instructions ? (
        <View style={styles.instructionBox}>
          <Text style={[styles.instructionText, { fontSize: typography.bodyMedium.fontSize }]}>
            💡 {dose.instructions}
          </Text>
        </View>
      ) : null}

      {/* Action Area */}
      {isTaken ? (
        <View style={styles.takenContainer}>
          <View style={styles.takenBadge}>
            <Ionicons name="checkmark-circle" size={isSeniorMode ? 28 : 24} color="#059669" />
            <Text style={[styles.takenText, { fontSize: typography.bodyLarge.fontSize }]}>
              Taken {dose.takenAt ? `at ${new Date(dose.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.undoButton}
            onPress={() => onTake(dose, 'pending')}
          >
            <Text style={styles.undoText}>Undo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actionsRow}>
          {/* TAKE NOW Primary Button */}
          <TouchableOpacity
            style={[styles.takeButton, { minHeight: typography.minTouchHeight }]}
            onPress={() => onTake(dose, 'taken')}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={isSeniorMode ? 28 : 22} color="#FFFFFF" />
            <Text style={[styles.takeButtonText, { fontSize: typography.buttonText.fontSize }]}>
              TAKE NOW
            </Text>
          </TouchableOpacity>

          {/* SNOOZE Button */}
          <TouchableOpacity
            style={[styles.snoozeButton, { minHeight: typography.minTouchHeight }]}
            onPress={() => onSnooze(dose)}
            activeOpacity={0.8}
          >
            <Ionicons name="alarm-outline" size={isSeniorMode ? 22 : 18} color="#B45309" />
            <Text style={[styles.snoozeButtonText, { fontSize: typography.buttonText.fontSize - 2 }]}>
              Snooze 15m
            </Text>
          </TouchableOpacity>

          {/* SKIP Button */}
          <TouchableOpacity
            style={[styles.skipButton, { minHeight: typography.minTouchHeight }]}
            onPress={() => onSkip(dose)}
            activeOpacity={0.8}
          >
            <Text style={[styles.skipButtonText, { fontSize: typography.buttonText.fontSize - 2 }]}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  seniorCard: {
    padding: 22,
    borderWidth: 2.5,
    borderColor: '#CBD5E1',
    marginVertical: 12,
  },
  cardTaken: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  cardSnoozed: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FDE047',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  timeText: {
    color: '#1E3A8A',
    fontWeight: '800',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speakerButton: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellButton: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#EEF2FF',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  medNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  dosageText: {
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  genericText: {
    color: colors.textMuted,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontWeight: '700',
  },
  instructionBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: 16,
  },
  instructionText: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  takeButton: {
    flex: 2,
    backgroundColor: colors.statusTaken,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    elevation: 2,
  },
  takeButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  snoozeButton: {
    flex: 1.2,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  snoozeButtonText: {
    color: '#B45309',
    fontWeight: '700',
  },
  skipButton: {
    flex: 0.8,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  skipButtonText: {
    color: '#64748B',
    fontWeight: '600',
  },
  takenContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 14,
  },
  takenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  takenText: {
    color: '#15803D',
    fontWeight: '700',
  },
  undoText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  }
});

export default DoseCard;
