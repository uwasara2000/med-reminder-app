import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { getAutoDetectedApiUrl } from '../services/api';

export const LoginScreen = () => {
  const { login, register } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('patient');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  // Server IP setup modal
  const [showIpModal, setShowIpModal] = useState(false);
  const [currentApiUrl, setCurrentApiUrl] = useState(getAutoDetectedApiUrl());
  const [customIpInput, setCustomIpInput] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('@custom_api_url').then(val => {
      if (val) {
        const cleaned = val.replace(/\\/g, '/');
        if (cleaned !== val) {
          AsyncStorage.setItem('@custom_api_url', cleaned);
        }
        setCurrentApiUrl(cleaned);
        setCustomIpInput(cleaned);
      } else {
        const auto = getAutoDetectedApiUrl();
        setCurrentApiUrl(auto);
        setCustomIpInput(auto);
      }
    });
  }, []);

  const handleSaveCustomIp = async () => {
    let sanitized = customIpInput.trim().replace(/\\/g, '/');
    if (sanitized) {
      if (!sanitized.startsWith('http://') && !sanitized.startsWith('https://')) {
        sanitized = `http://${sanitized}`;
      }
      if (!sanitized.endsWith('/api')) {
        sanitized = `${sanitized.replace(/\/+$/, '')}/api`;
      }
      await AsyncStorage.setItem('@custom_api_url', sanitized);
      setCurrentApiUrl(sanitized);
      setCustomIpInput(sanitized);
      Alert.alert('Server IP Updated', `API target set to:\n${sanitized}`);
    } else {
      await AsyncStorage.removeItem('@custom_api_url');
      const auto = getAutoDetectedApiUrl();
      setCurrentApiUrl(auto);
      setCustomIpInput(auto);
      Alert.alert('Reset', 'API target reset to auto-detect.');
    }
    setShowIpModal(false);
  };

  // Password Strength Criteria
  const passwordCriteria = {
    hasMinLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
  };

  const passedCriteriaCount = Object.values(passwordCriteria).filter(Boolean).length;
  const isStrongPassword = passedCriteriaCount === 5;

  const getPasswordStrength = () => {
    if (!password) return { label: '', color: '#CBD5E1', percent: 0, text: '' };
    if (passedCriteriaCount <= 2) return { label: 'Weak', color: '#EF4444', percent: 33, text: 'Needs upper, lower, number & symbol' };
    if (passedCriteriaCount <= 4) return { label: 'Medium', color: '#F59E0B', percent: 66, text: 'Almost there, add missing types' };
    return { label: 'Strong', color: '#10B981', percent: 100, text: 'Strong password criteria met!' };
  };

  const strength = getPasswordStrength();
  const doPasswordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async () => {
    if (isRegister) {
      if (!name.trim()) {
        Alert.alert('Required Field', 'Please enter your full name.');
        return;
      }
      if (!email.trim()) {
        Alert.alert('Required Field', 'Please enter your email address.');
        return;
      }
      if (!password) {
        Alert.alert('Required Field', 'Please enter a password.');
        return;
      }
      if (!isStrongPassword) {
        Alert.alert(
          'Strong Password Required',
          'Your password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special symbols (!@#$...).'
        );
        return;
      }
      if (!confirmPassword) {
        Alert.alert('Required Field', 'Please confirm your password.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Password Mismatch', 'The passwords you entered do not match. Please re-enter them.');
        return;
      }

      setIsLoading(true);
      const res = await register(
        {
          name: name.trim(),
          email: email.trim(),
          password: password,
          role,
          phone: phone.trim(),
          seniorMode: role === 'patient'
        },
        false // Do not auto-login directly; return to sign-in page
      );
      setIsLoading(false);

      if (res.success) {
        // Clear confirm password, keep email & password pre-filled for auto sign-in
        setConfirmPassword('');
        setShowPassword(false);
        setShowConfirmPassword(false);
        setIsRegister(false);
        setSuccessBanner(`Account created for ${name.trim()}! Your credentials are ready below. Tap SIGN IN to continue.`);

        Alert.alert(
          'Account Created Successfully! 🎉',
          `Welcome to DoseCare, ${name.trim()}!\n\nYour account is ready. Please tap SIGN IN to start using the app.`
        );
      } else {
        Alert.alert('Registration Error', res.message || 'Could not register. Please try again.');
      }
    } else {
      if (!email.trim() || !password.trim()) {
        Alert.alert('Required', 'Please enter your email and password.');
        return;
      }

      setIsLoading(true);
      const res = await login(email.trim(), password.trim());
      setIsLoading(false);

      if (!res.success) {
        Alert.alert('Authentication Error', res.message || 'Please check your credentials.');
      }
    }
  };

  const handleToggleRegister = () => {
    setIsRegister(!isRegister);
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSuccessBanner('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="medical" size={46} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>DoseCare</Text>
          <Text style={styles.brandSub}>Accessible Medication Reminders for Everyone</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {isRegister ? 'Create Your Account' : 'Account Sign In'}
          </Text>

          {/* Success Banner when returning to Sign In */}
          {!isRegister && !!successBanner && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <View style={styles.successBannerContent}>
                <Text style={styles.successBannerTitle}>Registration Successful!</Text>
                <Text style={styles.successBannerText}>{successBanner}</Text>
              </View>
            </View>
          )}

          {isRegister && (
            <>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. John Doe"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.inputLabel}>I am a:</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.roleChip, role === 'patient' && styles.roleChipActive]}
                  onPress={() => setRole('patient')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleText, role === 'patient' && styles.roleTextActive]}>
                    👴 Patient
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleChip, role === 'caregiver' && styles.roleChipActive]}
                  onPress={() => setRole('caregiver')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleText, role === 'caregiver' && styles.roleTextActive]}>
                    👩‍⚕️ Caregiver / Family
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="+1-555-010-4491"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </>
          )}

          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="user@example.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (successBanner) setSuccessBanner('');
            }}
          />

          {/* Password Input with Eye Visibility Toggle */}
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputWithIconContainer}>
            <TextInput
              style={styles.inputWithIcon}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (successBanner) setSuccessBanner('');
              }}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          {/* Password Strength Checklist (Register Mode) */}
          {isRegister && password.length > 0 && (
            <View style={styles.strengthBox}>
              <View style={styles.strengthHeader}>
                <Text style={styles.strengthLabel}>Password Strength:</Text>
                <View style={[styles.strengthBadge, { backgroundColor: `${strength.color}20` }]}>
                  <Text style={[styles.strengthBadgeText, { color: strength.color }]}>
                    {strength.label}
                  </Text>
                </View>
              </View>

              {/* Strength Meter Bar */}
              <View style={styles.meterTrack}>
                <View
                  style={[
                    styles.meterFill,
                    { width: `${strength.percent}%`, backgroundColor: strength.color }
                  ]}
                />
              </View>

              {/* Requirement Criteria Chips */}
              <View style={styles.criteriaGrid}>
                <View style={styles.criteriaItem}>
                  <Ionicons
                    name={passwordCriteria.hasMinLength ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={passwordCriteria.hasMinLength ? '#10B981' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.criteriaText,
                      passwordCriteria.hasMinLength && styles.criteriaTextDone
                    ]}
                  >
                    8+ chars
                  </Text>
                </View>

                <View style={styles.criteriaItem}>
                  <Ionicons
                    name={
                      passwordCriteria.hasUpper && passwordCriteria.hasLower
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={16}
                    color={
                      passwordCriteria.hasUpper && passwordCriteria.hasLower
                        ? '#10B981'
                        : '#94A3B8'
                    }
                  />
                  <Text
                    style={[
                      styles.criteriaText,
                      passwordCriteria.hasUpper && passwordCriteria.hasLower && styles.criteriaTextDone
                    ]}
                  >
                    Upper & lower
                  </Text>
                </View>

                <View style={styles.criteriaItem}>
                  <Ionicons
                    name={passwordCriteria.hasNumber ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={passwordCriteria.hasNumber ? '#10B981' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.criteriaText,
                      passwordCriteria.hasNumber && styles.criteriaTextDone
                    ]}
                  >
                    1+ number
                  </Text>
                </View>

                <View style={styles.criteriaItem}>
                  <Ionicons
                    name={passwordCriteria.hasSpecial ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={passwordCriteria.hasSpecial ? '#10B981' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.criteriaText,
                      passwordCriteria.hasSpecial && styles.criteriaTextDone
                    ]}
                  >
                    1+ symbol (!@#$)
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Confirm Password (Register Mode) */}
          {isRegister && (
            <>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputWithIconContainer}>
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              {/* Password Match Indicator */}
              {confirmPassword.length > 0 && (
                <View
                  style={[
                    styles.matchBadge,
                    {
                      backgroundColor: doPasswordsMatch ? '#ECFDF5' : '#FEF2F2',
                      borderColor: doPasswordsMatch ? '#A7F3D0' : '#FECACA'
                    }
                  ]}
                >
                  <Ionicons
                    name={doPasswordsMatch ? 'checkmark-circle' : 'close-circle'}
                    size={18}
                    color={doPasswordsMatch ? '#10B981' : '#EF4444'}
                  />
                  <Text
                    style={[
                      styles.matchBadgeText,
                      { color: doPasswordsMatch ? '#065F46' : '#991B1B' }
                    ]}
                  >
                    {doPasswordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </Text>
                </View>
              )}
            </>
          )}

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isRegister ? 'CREATE ACCOUNT' : 'SIGN IN'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleRegisterBtn}
            onPress={handleToggleRegister}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleRegisterText}>
              {isRegister
                ? 'Already have an account? Sign in here'
                : "Don't have an account yet? Register here"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Server Connection Badge */}
        <TouchableOpacity
          style={styles.serverStatusBadge}
          onPress={() => setShowIpModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="globe-outline" size={16} color="#64748B" />
          <Text style={styles.serverStatusText}>
            Backend: {currentApiUrl} (Tap to edit)
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Server IP Setup Modal */}
      <Modal visible={showIpModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Backend Server Address</Text>
            <Text style={styles.modalSub}>
              Enter your computer's LAN IP address if testing on a phone via Wi-Fi:
            </Text>

            <TextInput
              style={styles.modalInput}
              value={customIpInput}
              onChangeText={setCustomIpInput}
              placeholder="http://192.168.1.6:5001/api"
              autoCapitalize="none"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowIpModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveCustomIp}
              >
                <Text style={styles.modalSaveText}>Save IP</Text>
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
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 16 : 30,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 14,
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 18,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    gap: 10,
  },
  successBannerContent: {
    flex: 1,
  },
  successBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 2,
  },
  successBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  inputWithIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    marginBottom: 14,
  },
  inputWithIcon: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  strengthBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  strengthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  strengthBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  meterTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  meterFill: {
    height: '100%',
    borderRadius: 3,
  },
  criteriaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    gap: 5,
  },
  criteriaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  criteriaTextDone: {
    color: '#0F172A',
    fontWeight: '700',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 16,
  },
  matchBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    alignItems: 'center',
  },
  roleChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  roleTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  toggleRegisterBtn: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggleRegisterText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  serverStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 8,
    gap: 6,
  },
  serverStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
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
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
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

export default LoginScreen;
