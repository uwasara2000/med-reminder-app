import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Modal,
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { getTypography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { useMedication } from '../context/MedicationContext';
import speechService from '../services/speechService';
import PillVisualizer from '../components/PillVisualizer';

export const AddMedicationScreen = ({ navigation, route }) => {
  const editingMedication = route?.params?.medication;
  const isEditing = Boolean(editingMedication);

  const { isSeniorMode } = useAuth();
  const { addMedication, updateMedication, deleteMedication, scanMedicationImage } = useMedication();
  const typography = getTypography(isSeniorMode);

  const getInitialTimes = () => {
    if (editingMedication?.schedules && Array.isArray(editingMedication.schedules) && editingMedication.schedules.length > 0) {
      return editingMedication.schedules.map(s => s.reminderTime).filter(Boolean);
    }
    if (Array.isArray(editingMedication?.times) && editingMedication.times.length > 0) {
      return editingMedication.times;
    }
    if (editingMedication?.scheduledTime) {
      return [editingMedication.scheduledTime];
    }
    return ['08:00'];
  };

  const [name, setName] = useState(editingMedication?.name || editingMedication?.medicationName || '');
  const [genericName, setGenericName] = useState(editingMedication?.genericName || '');
  const [dosage, setDosage] = useState(editingMedication?.dosage || '1 tablet');
  const [form, setForm] = useState(editingMedication?.form || 'pill');
  const [color, setColor] = useState(editingMedication?.color || '#3B82F6');
  const [foodInstruction, setFoodInstruction] = useState(editingMedication?.foodInstruction || 'with_meal');
  const [instructions, setInstructions] = useState(
    editingMedication?.instructions !== undefined
      ? editingMedication.instructions
      : 'Take with a full glass of water'
  );
  const [currentStock, setCurrentStock] = useState(
    editingMedication?.currentStock !== undefined ? String(editingMedication.currentStock) : '30'
  );
  const [refillThreshold, setRefillThreshold] = useState(
    editingMedication?.refillThreshold !== undefined ? String(editingMedication.refillThreshold) : '5'
  );
  const [times, setTimes] = useState(getInitialTimes());
  const [newTimeInput, setNewTimeInput] = useState('20:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 📸 Camera & Image Scanner States
  const [scannedImageUri, setScannedImageUri] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // ⏰ Clock / Time Picker Modal States
  const [isClockModalVisible, setIsClockModalVisible] = useState(false);
  const [pickerHour, setPickerHour] = useState(8);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [pickerPeriod, setPickerPeriod] = useState('PM');
  const [pickerTab, setPickerTab] = useState('hour'); // 'hour' | 'minute'

  const forms = [
    { key: 'pill', label: 'Tablet / Pill' },
    { key: 'capsule', label: 'Capsule' },
    { key: 'syrup', label: 'Liquid Syrup' },
    { key: 'inhaler', label: 'Inhaler' },
    { key: 'drops', label: 'Eye/Ear Drops' },
    { key: 'injection', label: 'Injection' },
  ];

  const foodOptions = [
    { key: 'before_meal', label: '🍽️ Before Meal' },
    { key: 'with_meal', label: '🍲 With Meal' },
    { key: 'after_meal', label: '☕ After Meal' },
    { key: 'empty_stomach', label: '💧 Empty Stomach' },
    { key: 'anytime', label: '⏰ Any Time' },
  ];

  const getFormatted24Hour = (hour, minute, period) => {
    let h = hour;
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    const hh = String(h).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const openClockPicker = () => {
    if (newTimeInput && newTimeInput.includes(':')) {
      const [hStr, mStr] = newTimeInput.split(':');
      let h = parseInt(hStr, 10);
      let m = parseInt(mStr, 10);
      if (!isNaN(h) && !isNaN(m)) {
        let p = 'AM';
        if (h >= 12) {
          p = 'PM';
          if (h > 12) h -= 12;
        } else if (h === 0) {
          h = 12;
        }
        setPickerHour(h);
        setPickerMinute(m);
        setPickerPeriod(p);
      }
    }
    setPickerTab('hour');
    setIsClockModalVisible(true);
  };

  const handleConfirmClockTime = () => {
    const formatted = getFormatted24Hour(pickerHour, pickerMinute, pickerPeriod);
    if (!times.includes(formatted)) {
      setTimes([...times, formatted].sort());
    }
    setNewTimeInput(formatted);
    setIsClockModalVisible(false);
  };

  const handleAddTime = () => {
    openClockPicker();
  };

  const handleRemoveTime = (timeToRemove) => {
    if (times.length <= 1) {
      Alert.alert('Reminder Time', 'At least one reminder time is required.');
      return;
    }
    setTimes(times.filter(t => t !== timeToRemove));
  };

  const processScannedImage = async (asset) => {
    try {
      if (!asset || !asset.base64) {
        Alert.alert('Scan Error', 'Could not read image data from camera.');
        return;
      }

      setScannedImageUri(asset.uri);
      setIsScanning(true);

      const base64Data = `data:image/jpeg;base64,${asset.base64}`;
      const res = await scanMedicationImage(base64Data);

      setIsScanning(false);

      if (res.success && res.details) {
        const d = res.details;
        if (d.name) setName(d.name);
        if (d.genericName) setGenericName(d.genericName);
        if (d.dosage) setDosage(d.dosage);
        if (d.form) setForm(d.form);
        if (d.color) setColor(d.color);
        if (d.foodInstruction) setFoodInstruction(d.foodInstruction);
        if (d.instructions) setInstructions(d.instructions);
        if (d.currentStock) setCurrentStock(String(d.currentStock));
        if (d.times && Array.isArray(d.times) && d.times.length > 0) {
          setTimes(d.times);
        }

        try {
          speechService.speakText(`Identified ${d.name}. Medication details have been automatically filled.`);
        } catch (e) {}

        Alert.alert(
          '✨ Details Auto-Filled!',
          `Identified: ${d.name}\nDosage: ${d.dosage || 'Standard'}\nForm: ${d.form}\n\nAll details have been automatically filled in below! You can review or adjust anything before saving.`,
          [{ text: 'Review Details' }]
        );
      } else {
        Alert.alert(
          'Could Not Read Label',
          res.message || 'Could not detect clear medication text from this photo. Please make sure the medication name is clearly visible and well-lit, or enter details manually.'
        );
      }
    } catch (err) {
      setIsScanning(false);
      Alert.alert('Scan Failed', 'An error occurred while analyzing the image. Please try again.');
    }
  };

  const handlePickImageFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission in your settings so you can photograph your medication packaging.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processScannedImage(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('Camera Error', 'Could not open camera on this device.');
    }
  };

  const handlePickImageFromLibrary = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo Library Permission Required',
          'Please grant photo library access so you can pick an existing photo of your medicine.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processScannedImage(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('Gallery Error', 'Could not open photo library.');
    }
  };

  const handleScanOptions = () => {
    Alert.alert(
      '📸 Scan Medication',
      'Choose how you want to capture the medication packaging or prescription label:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Choose from Gallery 🖼️', onPress: handlePickImageFromLibrary },
        { text: 'Take Photo 📷', onPress: handlePickImageFromCamera }
      ]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Field', 'Please enter the medication name.');
      return;
    }

    if (times.length === 0) {
      Alert.alert('Missing Schedule', 'Please set at least one reminder time.');
      return;
    }

    setIsSubmitting(true);
    const medData = {
      name: name.trim(),
      genericName: genericName.trim(),
      dosage: dosage.trim(),
      form,
      color,
      foodInstruction,
      instructions: instructions.trim(),
      currentStock: parseInt(currentStock, 10) || 0,
      totalQuantity: parseInt(currentStock, 10) || 30,
      refillThreshold: parseInt(refillThreshold, 10) || 5,
      times,
      daysOfWeek: 'ALL'
    };

    const targetId = editingMedication?.id || editingMedication?.medicationId;
    let res;
    if (isEditing && targetId) {
      res = await updateMedication(targetId, medData);
    } else {
      res = await addMedication(medData);
    }

    setIsSubmitting(false);

    if (res.success) {
      Alert.alert(
        'Success! 💊',
        isEditing
          ? `${name} has been updated successfully.`
          : `${name} has been added to your daily schedule.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert('Error', res.message || 'Failed to save medication.');
    }
  };

  const handleDeleteFromEdit = () => {
    const targetId = editingMedication?.id || editingMedication?.medicationId;
    if (!targetId) return;

    Alert.alert(
      'Delete Medication',
      `Are you sure you want to delete ${name}? All scheduled doses will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            const res = await deleteMedication(targetId);
            setIsSubmitting(false);
            if (res.success) {
              Alert.alert('Deleted', `${name} has been removed.`, [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
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
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { fontSize: typography.header.fontSize }]}>
          {isEditing ? 'Edit Medication' : 'Add Medication'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <View style={styles.header}>
          <Text style={[styles.title, { fontSize: typography.header.fontSize }]}>
            {isEditing ? 'Edit Prescription' : 'Add New Medication'}
          </Text>
          <Text style={styles.subtitle}>
            {isEditing
              ? 'Update dosage, reminder times, and instructions'
              : 'Set up dosage, reminder alarms, and instructions'}
          </Text>
        </View>

        {/* Live Pill Preview */}
        <View style={styles.previewContainer}>
          <PillVisualizer form={form} color={color} size={48} />
          <View style={styles.previewInfo}>
            <Text style={styles.previewName}>{name || 'Medication Name'}</Text>
            <Text style={styles.previewDosage}>{dosage || 'Dosage'}</Text>
          </View>
        </View>

        {/* 📸 AI Camera Scanner Card */}
        <View style={styles.scannerCard}>
          <View style={styles.scannerHeaderRow}>
            <View style={styles.scannerIconWrap}>
              <Ionicons name="camera" size={26} color="#2563EB" />
            </View>
            <View style={styles.scannerTextWrap}>
              <View style={styles.scannerBadgeRow}>
                <Text style={styles.scannerBadge}>✨ AUTO-FILL DETAILS</Text>
              </View>
              <Text style={styles.scannerTitle}>Scan Medication with Camera</Text>
              <Text style={styles.scannerSubtitle}>
                Snap a photo of the box or bottle to automatically fill medicine name, dose & times
              </Text>
            </View>
          </View>

          {scannedImageUri ? (
            <View style={styles.scannedPreviewRow}>
              <Image source={{ uri: scannedImageUri }} style={styles.scannedThumb} />
              <View style={styles.scannedSuccessInfo}>
                <View style={styles.scannedSuccessTag}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.scannedSuccessTagText}>Photo Analyzed</Text>
                </View>
                <TouchableOpacity
                  style={styles.rescanBtn}
                  onPress={handleScanOptions}
                  disabled={isScanning}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={15} color="#2563EB" />
                  <Text style={styles.rescanBtnText}>Scan Another Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.scannerActionsRow}>
              <TouchableOpacity
                style={styles.scanCameraBtn}
                onPress={handlePickImageFromCamera}
                disabled={isScanning}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" />
                <Text style={styles.scanCameraBtnText}>Take Photo 📷</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scanGalleryBtn}
                onPress={handlePickImageFromLibrary}
                disabled={isScanning}
                activeOpacity={0.8}
              >
                <Ionicons name="images-outline" size={20} color="#1E3A8A" />
                <Text style={styles.scanGalleryBtnText}>From Gallery 🖼️</Text>
              </TouchableOpacity>
            </View>
          )}

          {isScanning && (
            <View style={styles.scanningOverlay}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.scanningText}>Analyzing medicine label...</Text>
              <Text style={styles.scanningSubtext}>Reading name, dosage, schedule & food instructions</Text>
            </View>
          )}
        </View>

        {/* Form: Medication Name */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { fontSize: typography.bodyLarge.fontSize }]}>
            1. Medication Name *
          </Text>
          <TextInput
            style={[styles.input, { minHeight: typography.minTouchHeight, fontSize: typography.bodyLarge.fontSize }]}
            placeholder="e.g. Lisinopril, Metformin"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Form: Form Type */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { fontSize: typography.bodyLarge.fontSize }]}>
            2. Medicine Type / Form
          </Text>
          <View style={styles.chipGrid}>
            {forms.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, form === f.key && styles.chipActive]}
                onPress={() => setForm(f.key)}
              >
                <Text style={[styles.chipText, form === f.key && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form: Pill Color */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { fontSize: typography.bodyLarge.fontSize }]}>
            3. Pill Color Badge
          </Text>
          <View style={styles.colorRow}>
            {colors.pillColors.map(c => (
              <TouchableOpacity
                key={c.hex}
                style={[
                  styles.colorCircle,
                  { backgroundColor: c.hex },
                  color === c.hex && styles.colorCircleActive
                ]}
                onPress={() => setColor(c.hex)}
              >
                {color === c.hex && (
                  <Ionicons name="checkmark" size={18} color={c.hex === '#E2E8F0' ? '#000' : '#FFF'} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form: Dosage */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { fontSize: typography.bodyLarge.fontSize }]}>
            4. Dosage & Amount
          </Text>
          <TextInput
            style={[styles.input, { minHeight: typography.minTouchHeight, fontSize: typography.bodyLarge.fontSize }]}
            placeholder="e.g. 10mg (1 tablet), 2 drops"
            placeholderTextColor="#94A3B8"
            value={dosage}
            onChangeText={setDosage}
          />
        </View>

        {/* Form: Food Instructions */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { fontSize: typography.bodyLarge.fontSize }]}>
            5. Food & Meal Timing
          </Text>
          <View style={styles.chipGrid}>
            {foodOptions.map(o => (
              <TouchableOpacity
                key={o.key}
                style={[styles.chip, foodInstruction === o.key && styles.chipActive]}
                onPress={() => setFoodInstruction(o.key)}
              >
                <Text style={[styles.chipText, foodInstruction === o.key && styles.chipTextActive]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form: Reminder Times */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { fontSize: typography.bodyLarge.fontSize }]}>
            6. Reminder Time(s)
          </Text>
          <View style={styles.timesContainer}>
            {times.map(t => (
              <View key={t} style={styles.timeTag}>
                <Ionicons name="alarm-outline" size={18} color={colors.primary} />
                <Text style={styles.timeTagText}>{t}</Text>
                <TouchableOpacity onPress={() => handleRemoveTime(t)}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.addTimeRow}>
            <TouchableOpacity
              style={styles.timePickerDisplayBtn}
              onPress={openClockPicker}
              activeOpacity={0.8}
            >
              <Ionicons name="time" size={22} color={colors.primary} />
              <Text style={styles.timePickerDisplayText}>
                {newTimeInput ? `${newTimeInput} (Tap for clock)` : 'Tap for clock'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addTimeBtn} onPress={openClockPicker} activeOpacity={0.8}>
              <Ionicons name="alarm" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.addTimeBtnText}>+ Add Time</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form: Stock & Refill Alert */}
        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Pills in Bottle</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={currentStock}
              onChangeText={setCurrentStock}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Refill Alert at</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={refillThreshold}
              onChangeText={setRefillThreshold}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { minHeight: typography.minTouchHeight }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <Ionicons name="save" size={24} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>
            {isSubmitting
              ? 'SAVING...'
              : isEditing
              ? 'SAVE CHANGES'
              : 'SAVE MEDICATION'}
          </Text>
        </TouchableOpacity>

        {/* Delete Button (If Editing) */}
        {isEditing && (
          <TouchableOpacity
            style={[styles.deleteMedButton, { minHeight: typography.minTouchHeight }]}
            onPress={handleDeleteFromEdit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={22} color="#DC2626" />
            <Text style={styles.deleteMedButtonText}>DELETE MEDICATION</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ⏰ Interactive Clock / Time Picker Modal */}
      <Modal
        visible={isClockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsClockModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.clockModalCard}>
            {/* Header */}
            <View style={styles.clockModalHeader}>
              <View style={styles.clockModalHeaderTitleRow}>
                <Ionicons name="alarm" size={26} color={colors.primary} />
                <Text style={styles.clockModalTitle}>Set Reminder Time</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsClockModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close-circle" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Big Interactive Digital Display */}
            <View style={styles.digitalClockWrap}>
              <TouchableOpacity
                style={[styles.digitalBox, pickerTab === 'hour' && styles.digitalBoxActive]}
                onPress={() => setPickerTab('hour')}
                activeOpacity={0.85}
              >
                <Text style={[styles.digitalNum, pickerTab === 'hour' && styles.digitalNumActive]}>
                  {String(pickerHour).padStart(2, '0')}
                </Text>
                <Text style={styles.digitalUnitLabel}>HOUR</Text>
              </TouchableOpacity>

              <Text style={styles.digitalColon}>:</Text>

              <TouchableOpacity
                style={[styles.digitalBox, pickerTab === 'minute' && styles.digitalBoxActive]}
                onPress={() => setPickerTab('minute')}
                activeOpacity={0.85}
              >
                <Text style={[styles.digitalNum, pickerTab === 'minute' && styles.digitalNumActive]}>
                  {String(pickerMinute).padStart(2, '0')}
                </Text>
                <Text style={styles.digitalUnitLabel}>MIN</Text>
              </TouchableOpacity>

              <View style={styles.periodCol}>
                <TouchableOpacity
                  style={[styles.periodBtn, pickerPeriod === 'AM' && styles.periodBtnActive]}
                  onPress={() => setPickerPeriod('AM')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.periodText, pickerPeriod === 'AM' && styles.periodTextActive]}>
                    AM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.periodBtn, pickerPeriod === 'PM' && styles.periodBtnActive]}
                  onPress={() => setPickerPeriod('PM')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.periodText, pickerPeriod === 'PM' && styles.periodTextActive]}>
                    PM
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.preview24hText}>
              24h equivalent: {getFormatted24Hour(pickerHour, pickerMinute, pickerPeriod)}
            </Text>

            {/* Quick Presets */}
            <View style={styles.quickPresetsWrap}>
              <Text style={styles.quickPresetTitle}>Quick Presets:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
                {[
                  { label: '🌅 Morning (8 AM)', h: 8, m: 0, p: 'AM' },
                  { label: '☀️ Noon (12 PM)', h: 12, m: 0, p: 'PM' },
                  { label: '🌆 Evening (6 PM)', h: 6, m: 0, p: 'PM' },
                  { label: '🌙 Night (9 PM)', h: 9, m: 0, p: 'PM' },
                ].map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.presetChip}
                    onPress={() => {
                      setPickerHour(item.h);
                      setPickerMinute(item.m);
                      setPickerPeriod(item.p);
                    }}
                  >
                    <Text style={styles.presetChipText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Mode Switcher Tabs */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabBtn, pickerTab === 'hour' && styles.tabBtnActive]}
                onPress={() => setPickerTab('hour')}
              >
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={pickerTab === 'hour' ? '#FFFFFF' : '#64748B'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.tabBtnText, pickerTab === 'hour' && styles.tabBtnTextActive]}>
                  Select Hour (1 - 12)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, pickerTab === 'minute' && styles.tabBtnActive]}
                onPress={() => setPickerTab('minute')}
              >
                <Ionicons
                  name="stopwatch-outline"
                  size={18}
                  color={pickerTab === 'minute' ? '#FFFFFF' : '#64748B'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.tabBtnText, pickerTab === 'minute' && styles.tabBtnTextActive]}>
                  Select Minute
                </Text>
              </TouchableOpacity>
            </View>

            {/* Hour Grid (1 - 12) */}
            {pickerTab === 'hour' ? (
              <View style={styles.gridWrap}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.gridCell, pickerHour === h && styles.gridCellActive]}
                    onPress={() => {
                      setPickerHour(h);
                      setPickerTab('minute'); // Auto-advance smoothly to minutes
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.gridCellText, pickerHour === h && styles.gridCellTextActive]}>
                      {h}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              /* Minute Grid & Stepper */
              <View>
                <View style={styles.gridWrap}>
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.gridCell, pickerMinute === m && styles.gridCellActive]}
                      onPress={() => setPickerMinute(m)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.gridCellText, pickerMinute === m && styles.gridCellTextActive]}>
                        :{String(m).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Stepper for precision minute */}
                <View style={styles.minuteStepperRow}>
                  <TouchableOpacity
                    style={styles.minuteStepBtn}
                    onPress={() => setPickerMinute(prev => (prev > 0 ? prev - 1 : 59))}
                  >
                    <Ionicons name="remove" size={16} color="#1E293B" />
                    <Text style={styles.minuteStepBtnText}>1 min</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperCurrentText}>
                    Selected: {String(pickerMinute).padStart(2, '0')} min
                  </Text>
                  <TouchableOpacity
                    style={styles.minuteStepBtn}
                    onPress={() => setPickerMinute(prev => (prev < 59 ? prev + 1 : 0))}
                  >
                    <Ionicons name="add" size={16} color="#1E293B" />
                    <Text style={styles.minuteStepBtnText}>1 min</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Confirm & Cancel Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsClockModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmClockTime}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                <Text style={styles.modalConfirmBtnText}>
                  Add {String(pickerHour).padStart(2, '0')}:{String(pickerMinute).padStart(2, '0')} {pickerPeriod}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 14 : 14,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontWeight: '900',
    color: colors.textPrimary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontWeight: '900',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    gap: 16,
    marginBottom: 20,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  previewDosage: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 22,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: '#0F172A',
    transform: [{ scale: 1.15 }],
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  timeTagText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  addTimeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timeInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
  },
  addTimeBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 14,
  },
  addTimeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  timePickerDisplayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#93C5FD',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  timePickerDisplayText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  clockModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  clockModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  clockModalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clockModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  digitalClockWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
  },
  digitalBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 72,
  },
  digitalBoxActive: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },
  digitalNum: {
    fontSize: 34,
    fontWeight: '900',
    color: '#334155',
  },
  digitalNumActive: {
    color: colors.primary,
  },
  digitalUnitLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
  },
  digitalColon: {
    fontSize: 32,
    fontWeight: '900',
    color: '#94A3B8',
  },
  periodCol: {
    marginLeft: 6,
    gap: 6,
  },
  periodBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  periodBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  preview24hText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 8,
    marginBottom: 12,
  },
  quickPresetsWrap: {
    marginBottom: 12,
  },
  quickPresetTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
  },
  presetScroll: {
    gap: 8,
  },
  presetChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  gridCell: {
    width: '22%',
    aspectRatio: 1.3,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCellActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  gridCellText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1E293B',
  },
  gridCellTextActive: {
    color: '#FFFFFF',
  },
  minuteStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 8,
    marginBottom: 12,
  },
  minuteStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  minuteStepBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  stepperCurrentText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#64748B',
  },
  modalConfirmBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.statusTaken,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalConfirmBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  // 📸 Scanner Card Styles
  scannerCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  scannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scannerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTextWrap: {
    flex: 1,
  },
  scannerBadgeRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  scannerBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1D4ED8',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  scannerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  scannerSubtitle: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  scannerActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  scanCameraBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    elevation: 2,
  },
  scanCameraBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  scanGalleryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  scanGalleryBtnText: {
    color: '#1E3A8A',
    fontWeight: '800',
    fontSize: 14,
  },
  scannedPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 12,
  },
  scannedThumb: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  scannedSuccessInfo: {
    flex: 1,
    gap: 6,
  },
  scannedSuccessTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scannedSuccessTagText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rescanBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(239, 246, 255, 0.95)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 10,
  },
  scanningText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E3A8A',
    marginTop: 10,
  },
  scanningSubtext: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: colors.statusTaken,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  deleteMedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    gap: 8,
  },
  deleteMedButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  }
});

export default AddMedicationScreen;
