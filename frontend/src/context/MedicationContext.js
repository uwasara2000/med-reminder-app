import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { medicationApi, scheduleApi } from '../services/api';
import speechService from '../services/speechService';
import notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';

const MedicationContext = createContext();

export const MedicationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const [todayDoses, setTodayDoses] = useState([]);
  const [summary, setSummary] = useState({ total: 0, taken: 0, pending: 0, missed: 0, adherenceRate: 100 });
  const [medications, setMedications] = useState([]);
  const [adherenceStats, setAdherenceStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [alarmDose, setAlarmDose] = useState(null); // Active dose for high-contrast fullscreen alert

  // Keep track of which doses have already sounded the alarm this minute
  const triggeredAlarmsRef = useRef(new Set());

  const fetchTodayDoses = useCallback(async (dateStr = activeDate, patientId = null) => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const res = await scheduleApi.getTodayDoses(dateStr, patientId);
      if (res.data && res.data.success) {
        setTodayDoses(res.data.doses || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (e) {
      console.log('Error loading doses:', e?.message || e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, activeDate]);

  const fetchMedications = useCallback(async (patientId = null) => {
    if (!isAuthenticated) return;
    try {
      const res = await medicationApi.getMedications(patientId);
      if (res.data && res.data.success) {
        setMedications(res.data.medications || []);
      }
    } catch (e) {
      console.log('Error loading medications list:', e?.message || e);
    }
  }, [isAuthenticated]);

  const fetchAdherence = useCallback(async (patientId = null) => {
    if (!isAuthenticated) return;
    try {
      const res = await scheduleApi.getAdherenceStats(patientId);
      if (res.data && res.data.success) {
        setAdherenceStats(res.data.stats);
      }
    } catch (e) {
      console.log('Error loading adherence stats:', e?.message || e);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodayDoses();
      fetchMedications();
      fetchAdherence();
      notificationService.requestPermissions();
    }
  }, [isAuthenticated, fetchTodayDoses, fetchMedications, fetchAdherence]);

  // ⏰ Continuous Active Alarm Clock Monitor (Checks every 8 seconds)
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkAlarms = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayStr = now.toISOString().split('T')[0];

      // If user already has an active alarm modal ringing, don't interrupt
      if (alarmDose) return;

      todayDoses.forEach(dose => {
        const isPending = dose.status === 'pending' || dose.status === 'snoozed';
        const doseKey = `${dose.medicationId}_${dose.scheduleId}_${currentTimeStr}_${todayStr}`;

        if (isPending && dose.scheduledTime === currentTimeStr) {
          if (!triggeredAlarmsRef.current.has(doseKey)) {
            triggeredAlarmsRef.current.add(doseKey);
            triggerAlarmModal(dose);
          }
        }
      });
    };

    const intervalId = setInterval(checkAlarms, 8000);
    // Run an immediate check on mount/update
    checkAlarms();

    return () => clearInterval(intervalId);
  }, [isAuthenticated, todayDoses, alarmDose]);

  const logDoseStatus = async (medicationId, scheduleId, status, snoozeMinutes = 15) => {
    try {
      dismissAlarmModal();

      const res = await scheduleApi.logDose({
        medicationId,
        scheduleId,
        scheduledDate: activeDate,
        status,
        snoozeMinutes
      });

      if (res.data && res.data.success) {
        // Update local state immediately
        setTodayDoses(prev =>
          prev.map(d => {
            if (d.medicationId === medicationId && d.scheduleId === scheduleId) {
              return {
                ...d,
                status,
                currentStock: res.data.currentStock,
                isLowStock: res.data.isLowStock,
                takenAt: status === 'taken' ? new Date().toISOString() : d.takenAt
              };
            }
            return d;
          })
        );

        // Refresh calculations
        fetchTodayDoses(activeDate);
        fetchMedications();
        fetchAdherence();

        // Audio feedback on dose marked taken
        if (status === 'taken') {
          speechService.speakText("Dose recorded as taken. Great job staying healthy!");
        } else if (status === 'snoozed') {
          speechService.speakText(`Alarm snoozed for ${snoozeMinutes} minutes.`);
        }

        return { success: true };
      }
      return { success: false, message: res.data?.message };
    } catch (e) {
      console.log('Failed to log dose:', e?.message || e);
      return { success: false, message: 'Could not record dose.' };
    }
  };

  const addMedication = async (medData) => {
    try {
      setIsLoading(true);
      const res = await medicationApi.createMedication(medData);
      if (res.data && res.data.success) {
        await fetchMedications();
        await fetchTodayDoses();
        return { success: true, medication: res.data.medication };
      }
      return { success: false, message: res.data?.message };
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to create medication.';
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMedication = async (id) => {
    try {
      const res = await medicationApi.deleteMedication(id);
      if (res.data && res.data.success) {
        setMedications(prev => prev.filter(m => m.id !== id));
        await fetchTodayDoses();
        return { success: true };
      }
      return { success: false };
    } catch (e) {
      return { success: false, message: 'Failed to delete.' };
    }
  };

  const updateMedication = async (id, medData) => {
    try {
      setIsLoading(true);
      const res = await medicationApi.updateMedication(id, medData);
      if (res.data && res.data.success) {
        await fetchMedications();
        await fetchTodayDoses();
        return { success: true, medication: res.data.medication };
      }
      return { success: false, message: res.data?.message };
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to update medication.';
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const addRefill = async (id, quantity, pharmacy) => {
    try {
      const res = await medicationApi.addRefill(id, { quantity, pharmacy });
      if (res.data && res.data.success) {
        await fetchMedications();
        await fetchTodayDoses();
        return { success: true, currentStock: res.data.currentStock };
      }
      return { success: false, message: res.data?.message };
    } catch (e) {
      return { success: false, message: 'Refill logging failed.' };
    }
  };

  const speakDose = (dose) => {
    speechService.speakDoseReminder(dose);
  };

  const speakAllPending = () => {
    speechService.speakAllDoses(todayDoses);
  };

  // Triggers the audible alarm loop and full screen modal
  const triggerAlarmModal = (dose) => {
    setAlarmDose(dose);
    speechService.startAlarmLoop(dose);
  };

  const dismissAlarmModal = () => {
    speechService.stopAlarmLoop();
    setAlarmDose(null);
  };

  const scanMedicationImage = async (imageBase64) => {
    try {
      const res = await medicationApi.scanMedicationImage(imageBase64);
      if (res.data && res.data.success) {
        return { success: true, details: res.data.details };
      }
      return { success: false, message: res.data?.message || 'Could not recognize medication.' };
    } catch (e) {
      const msg = e.response?.data?.message || e?.message || 'Failed to analyze medication image.';
      return { success: false, message: msg };
    }
  };

  // Instant test of the voice alarm clock
  const testAlarmClock = (customDose = null) => {
    const sample = customDose || todayDoses[0] || {
      medicationName: 'Piriton',
      dosage: '1 tablet',
      scheduledTime: 'Now',
      instructions: 'Take with a full glass of water after meal',
      form: 'pill',
      color: '#3B82F6'
    };
    triggerAlarmModal(sample);
  };

  return (
    <MedicationContext.Provider
      value={{
        todayDoses,
        summary,
        medications,
        adherenceStats,
        isLoading,
        activeDate,
        setActiveDate,
        alarmDose,
        triggerAlarmModal,
        dismissAlarmModal,
        testAlarmClock,
        fetchTodayDoses,
        fetchMedications,
        fetchAdherence,
        logDoseStatus,
        addMedication,
        updateMedication,
        deleteMedication,
        addRefill,
        scanMedicationImage,
        speakDose,
        speakAllPending
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
};

export const useMedication = () => useContext(MedicationContext);
