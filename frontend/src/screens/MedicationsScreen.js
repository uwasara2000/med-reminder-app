import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getTypography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { useMedication } from '../context/MedicationContext';
import PillVisualizer from '../components/PillVisualizer';

export const MedicationsScreen = ({ navigation }) => {
  const { isSeniorMode } = useAuth();
  const { medications, deleteMedication, addRefill, fetchMedications } = useMedication();
  const typography = getTypography(isSeniorMode);

  const [refillModalMed, setRefillModalMed] = useState(null);
  const [refillQuantity, setRefillQuantity] = useState('30');
  const [pharmacy, setPharmacy] = useState('');

  const handleDelete = (med) => {
    Alert.alert(
      'Remove Medication',
      `Are you sure you want to stop taking and remove ${med.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteMedication(med.id);
          }
        }
      ]
    );
  };

  const handleOpenRefill = (med) => {
    setRefillModalMed(med);
    setRefillQuantity('30');
    setPharmacy('');
  };

  const handleSaveRefill = async () => {
    if (!refillModalMed) return;
    const qty = parseInt(refillQuantity, 10);
    if (!qty || qty <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid refill quantity.');
      return;
    }

    const res = await addRefill(refillModalMed.id, qty, pharmacy);
    if (res.success) {
      Alert.alert('Refill Added! 📦', `Added ${qty} pills to ${refillModalMed.name}. New total: ${res.currentStock}`);
      setRefillModalMed(null);
    } else {
      Alert.alert('Error', res.message || 'Failed to record refill.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={[styles.screenTitle, { fontSize: typography.header.fontSize }]}>
          My Prescriptions
        </Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddMedication')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {medications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="medical" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No medications saved yet.</Text>
            <TouchableOpacity
              style={styles.firstAddBtn}
              onPress={() => navigation.navigate('AddMedication')}
            >
              <Text style={styles.firstAddBtnText}>Add First Medication</Text>
            </TouchableOpacity>
          </View>
        ) : (
          medications.map(med => {
            const isLow = med.currentStock <= (med.refillThreshold || 5);
            return (
              <View key={med.id} style={[styles.medCard, isLow && styles.medCardLow]}>
                {/* Header */}
                <View style={styles.medCardHeader}>
                  <TouchableOpacity
                    style={styles.medTitleRow}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('AddMedication', { medication: med })}
                  >
                    <PillVisualizer form={med.form} color={med.color} size={40} />
                    <View style={styles.medTitleInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.medName, { fontSize: typography.title.fontSize }]}>
                          {med.name}
                        </Text>
                        <Ionicons name="pencil-outline" size={14} color="#94A3B8" style={{ marginLeft: 6 }} />
                      </View>
                      <Text style={[styles.dosageText, { fontSize: typography.bodyMedium.fontSize }]}>
                        {med.dosage}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.medActionsRow}>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => navigation.navigate('AddMedication', { medication: med })}
                      accessibilityLabel="Edit prescription"
                    >
                      <Ionicons name="pencil" size={18} color="#2563EB" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionIconBtn, styles.deleteIconBtn]}
                      onPress={() => handleDelete(med)}
                      accessibilityLabel="Delete prescription"
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Stock Level Bar */}
                <View style={styles.stockContainer}>
                  <View style={styles.stockLabelRow}>
                    <Text style={styles.stockLabel}>Remaining Supply</Text>
                    <Text style={[styles.stockValue, isLow && styles.stockValueLow]}>
                      {med.currentStock} doses remaining {isLow ? '(⚠️ Refill Needed)' : ''}
                    </Text>
                  </View>
                  <View style={styles.stockBarBg}>
                    <View
                      style={[
                        styles.stockBarFill,
                        {
                          width: `${Math.min(100, (med.currentStock / (med.totalQuantity || 30)) * 100)}%`,
                          backgroundColor: isLow ? '#EF4444' : '#10B981'
                        }
                      ]}
                    />
                  </View>
                </View>

                {/* Reminder Times list */}
                {med.schedules && med.schedules.length > 0 && (
                  <View style={styles.schedulesRow}>
                    <Text style={styles.schedulesLabel}>Reminders:</Text>
                    {med.schedules.map(s => (
                      <View key={s.id} style={styles.timeBadge}>
                        <Ionicons name="time" size={14} color="#1E3A8A" />
                        <Text style={styles.timeBadgeText}>{s.reminderTime}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Refill Button */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.refillBtn, { minHeight: typography.minTouchHeight - 8 }]}
                    onPress={() => handleOpenRefill(med)}
                  >
                    <Ionicons name="refresh" size={18} color="#1D4ED8" />
                    <Text style={styles.refillBtnText}>+ Log Refill / Restock</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Refill Modal */}
      {refillModalMed && (
        <Modal visible={!!refillModalMed} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Refill {refillModalMed.name}</Text>
              <Text style={styles.modalSubtitle}>Current stock: {refillModalMed.currentStock} pills</Text>

              <Text style={styles.inputLabel}>Number of Pills/Doses to Add:</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="number-pad"
                value={refillQuantity}
                onChangeText={setRefillQuantity}
              />

              <Text style={styles.inputLabel}>Pharmacy Name (Optional):</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Walgreens, St. Mary's"
                value={pharmacy}
                onChangeText={setPharmacy}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setRefillModalMed(null)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSaveRefill}
                >
                  <Text style={styles.modalSaveText}>Save Refill</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 36,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 30,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 12,
  },
  firstAddBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 16,
  },
  firstAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  medCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  medCardLow: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  medCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  medTitleInfo: {
    flex: 1,
  },
  medActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconBtn: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  medName: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  dosageText: {
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  stockContainer: {
    marginTop: 14,
  },
  stockLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stockLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  stockValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  stockValueLow: {
    color: '#DC2626',
  },
  stockBarBg: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  stockBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  schedulesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  schedulesLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  timeBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  cardActions: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  refillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    gap: 6,
  },
  refillBtnText: {
    color: '#1D4ED8',
    fontWeight: '800',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  modalCancelText: {
    fontWeight: '700',
    color: '#64748B',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  modalSaveText: {
    fontWeight: '800',
    color: '#FFFFFF',
  }
});

export default MedicationsScreen;
