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
  const [role, setRole] = useState('patient');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Server IP setup modal
  const [showIpModal, setShowIpModal] = useState(false);
  const [currentApiUrl, setCurrentApiUrl] = useState(getAutoDetectedApiUrl());
  const [customIpInput, setCustomIpInput] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('@custom_api_url').then(val => {
      if (val) {
        setCurrentApiUrl(val);
        setCustomIpInput(val);
      } else {
        const auto = getAutoDetectedApiUrl();
        setCurrentApiUrl(auto);
        setCustomIpInput(auto);
      }
    });
  }, []);

  const handleSaveCustomIp = async () => {
    if (customIpInput.trim()) {
      await AsyncStorage.setItem('@custom_api_url', customIpInput.trim());
      setCurrentApiUrl(customIpInput.trim());
      Alert.alert('Server IP Updated', `API target set to:\n${customIpInput.trim()}`);
    } else {
      await AsyncStorage.removeItem('@custom_api_url');
      const auto = getAutoDetectedApiUrl();
      setCurrentApiUrl(auto);
      setCustomIpInput(auto);
      Alert.alert('Reset', 'API target reset to auto-detect.');
    }
    setShowIpModal(false);
  };

  const handleSubmit = async () => {
    if (isRegister && !name.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    let res;
    if (isRegister) {
      res = await register({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
        phone: phone.trim(),
        seniorMode: role === 'patient'
      });
    } else {
      res = await login(email.trim(), password.trim());
    }

    setIsLoading(false);

    if (!res.success) {
      Alert.alert('Authentication Error', res.message || 'Please check your credentials.');
    }
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
            onChangeText={setEmail}
          />

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

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
            onPress={() => setIsRegister(!isRegister)}
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
    marginBottom: 28,
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
