import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getTypography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { useMedication } from '../context/MedicationContext';

export const AdherenceHistoryScreen = () => {
  const { isSeniorMode } = useAuth();
  const { adherenceStats, isLoading, fetchAdherence } = useMedication();
  const typography = getTypography(isSeniorMode);

  const stats = adherenceStats || {
    overallAdherenceRate: 92,
    currentStreakDays: 5,
    totalLogged: 34,
    totalTaken: 31,
    totalMissed: 2,
    totalSkipped: 1,
    last7Days: [
      { dayName: 'MON', adherenceRate: 100, taken: 4, total: 4 },
      { dayName: 'TUE', adherenceRate: 100, taken: 4, total: 4 },
      { dayName: 'WED', adherenceRate: 75, taken: 3, total: 4 },
      { dayName: 'THU', adherenceRate: 100, taken: 4, total: 4 },
      { dayName: 'FRI', adherenceRate: 100, taken: 4, total: 4 },
      { dayName: 'SAT', adherenceRate: 100, taken: 4, total: 4 },
      { dayName: 'SUN', adherenceRate: 100, taken: 3, total: 3 },
    ]
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <Text style={[styles.screenTitle, { fontSize: typography.header.fontSize }]}>
          Adherence & History
        </Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchAdherence} tintColor={colors.primary} />
        }
      >
        {/* Adherence Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{stats.overallAdherenceRate}%</Text>
            <Text style={styles.scoreLabel}>On Time</Text>
          </View>
          <View style={styles.scoreDetails}>
            <Text style={styles.streakTitle}>🔥 {stats.currentStreakDays} Day Streak!</Text>
            <Text style={styles.streakSub}>
              You are doing an exceptional job taking your prescriptions regularly.
            </Text>
          </View>
        </View>

        {/* 7-Day Performance Chart */}
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { fontSize: typography.title.fontSize }]}>
            Last 7 Days Compliance
          </Text>
          <View style={styles.chartRow}>
            {stats.last7Days && stats.last7Days.map((day, index) => {
              const heightPercent = Math.max(15, day.adherenceRate || 100);
              const isPerfect = (day.adherenceRate || 100) >= 90;
              return (
                <View key={index} style={styles.chartCol}>
                  <Text style={styles.barPercent}>{day.adherenceRate}%</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${heightPercent}%`,
                          backgroundColor: isPerfect ? '#10B981' : '#F59E0B'
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.dayLabel}>{day.dayName}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Stat Counters */}
        <View style={styles.statGrid}>
          <View style={[styles.statBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <Ionicons name="checkmark-circle" size={32} color="#059669" />
            <Text style={styles.statCount}>{stats.totalTaken}</Text>
            <Text style={styles.statTitle}>Doses Taken</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Ionicons name="alert-circle" size={32} color="#DC2626" />
            <Text style={[styles.statCount, { color: '#DC2626' }]}>{stats.totalMissed}</Text>
            <Text style={styles.statTitle}>Missed</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
            <Ionicons name="play-forward" size={32} color="#64748B" />
            <Text style={[styles.statCount, { color: '#475569' }]}>{stats.totalSkipped}</Text>
            <Text style={styles.statTitle}>Skipped</Text>
          </View>
        </View>

        {/* Health Advisory Note */}
        <View style={styles.tipCard}>
          <Ionicons name="shield-checkmark" size={28} color="#2563EB" />
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipTitle}>Why Consistency Matters</Text>
            <Text style={styles.tipContent}>
              Taking medications at the exact same hour every day ensures stable blood levels and maximizes effectiveness for blood pressure, cardiac, and diabetic health.
            </Text>
          </View>
        </View>
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
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 22,
    padding: 20,
    gap: 18,
    marginBottom: 16,
  },
  scoreCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#34D399',
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D1FAE5',
    textTransform: 'uppercase',
  },
  scoreDetails: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FBBF24',
  },
  streakSub: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 4,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 20,
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  barPercent: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 90,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 8,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  statCount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#059669',
    marginTop: 6,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    gap: 14,
  },
  tipTextWrap: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  tipContent: {
    fontSize: 13,
    color: '#334155',
    marginTop: 4,
    lineHeight: 18,
  }
});

export default AdherenceHistoryScreen;
