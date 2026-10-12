import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getTypography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { useMedication } from '../context/MedicationContext';
import Header from '../components/Header';
import DoseCard from '../components/DoseCard';

export const HomeScreen = ({ navigation }) => {
  const { isSeniorMode } = useAuth();
  const {
    todayDoses,
    medications,
    summary,
    isLoading,
    fetchTodayDoses,
    logDoseStatus,
    testAlarmClock,
    deleteMedication
  } = useMedication();
  const typography = getTypography(isSeniorMode);

  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'morning', 'afternoon', 'evening', 'night'

  const filters = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'morning', label: 'Morning', icon: 'sunny-outline' },
    { key: 'afternoon', label: 'Afternoon', icon: 'partly-sunny-outline' },
    { key: 'evening', label: 'Evening', icon: 'cloudy-night-outline' },
    { key: 'night', label: 'Night', icon: 'moon-outline' },
  ];

  const filteredDoses = todayDoses.filter(d => {
    if (activeFilter === 'all') return true;
    return d.period === activeFilter;
  });

  const handleTake = async (dose, status) => {
    await logDoseStatus(dose.medicationId, dose.scheduleId, status);
  };

  const handleSnooze = async (dose) => {
    await logDoseStatus(dose.medicationId, dose.scheduleId, 'snoozed', 15);
  };

  const handleSkip = async (dose) => {
    await logDoseStatus(dose.medicationId, dose.scheduleId, 'skipped');
  };

  const handleEdit = (dose) => {
    const foundMed = (medications || []).find(m => m.id === dose.medicationId);
    const medToEdit = foundMed || {
      id: dose.medicationId,
      name: dose.medicationName,
      genericName: dose.genericName,
      dosage: dose.dosage,
      form: dose.form,
      color: dose.color,
      foodInstruction: dose.foodInstruction,
      instructions: dose.instructions,
      currentStock: dose.currentStock,
      schedules: [{ reminderTime: dose.scheduledTime }]
    };
    navigation.navigate('AddMedication', { medication: medToEdit });
  };

  const handleDelete = (dose) => {
    Alert.alert(
      'Delete Medication',
      `Are you sure you want to delete ${dose.medicationName}? All doses and reminder alarms for this medication will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteMedication(dose.medicationId);
            if (res.success) {
              Alert.alert('Medication Deleted', `${dose.medicationName} has been removed.`);
            } else {
              Alert.alert('Error', res.message || 'Failed to delete medication.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />

      {/* Period Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map(f => {
            const isSelected = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={f.icon}
                  size={16}
                  color={isSelected ? '#FFFFFF' : '#475569'}
                />
                <Text style={[styles.filterLabel, isSelected && styles.filterLabelActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Doses List */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchTodayDoses} tintColor={colors.primary} />
        }
      >
        {filteredDoses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle" size={72} color="#10B981" />
            <Text style={[styles.emptyTitle, { fontSize: typography.title.fontSize }]}>
              {summary.total > 0 && summary.taken === summary.total
                ? 'All Done for Today!'
                : 'No Medications in this Period'}
            </Text>
            <Text style={[styles.emptySubtitle, { fontSize: typography.bodyMedium.fontSize }]}>
              {summary.total > 0 && summary.taken === summary.total
                ? 'You have taken all your doses on time. Keep up the great health streak!'
                : 'Enjoy your day or add a new reminder schedule.'}
            </Text>
          </View>
        ) : (
          filteredDoses.map(dose => (
            <DoseCard
              key={dose.doseId}
              dose={dose}
              onTake={handleTake}
              onSnooze={handleSnooze}
              onSkip={handleSkip}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}

        {/* Quick Add Medication Banner */}
        <TouchableOpacity
          style={styles.addMedBanner}
          onPress={() => navigation.navigate('AddMedication')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={28} color={colors.primary} />
          <Text style={styles.addMedBannerText}>+ Add New Prescription or Supplement</Text>
        </TouchableOpacity>

        {/* Test Voice Alarm Clock Button */}
        <TouchableOpacity
          style={styles.testAlarmBanner}
          onPress={() => testAlarmClock()}
          activeOpacity={0.8}
        >
          <Ionicons name="alarm" size={24} color="#B45309" />
          <Text style={styles.testAlarmText}>🔔 Test Voice Alarm Clock</Text>
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
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 14,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 22,
  },
  addMedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  addMedBannerText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  testAlarmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    gap: 8,
  },
  testAlarmText: {
    color: '#B45309',
    fontSize: 15,
    fontWeight: '800',
  }
});

export default HomeScreen;
