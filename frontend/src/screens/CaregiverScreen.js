import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  RefreshControl,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getTypography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { caregiverApi, emergencyApi } from '../services/api';

export const CaregiverScreen = () => {
  const { user, isSeniorMode, isCaregiver } = useAuth();
  const typography = getTypography(isSeniorMode);

  const [patients, setPatients] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [linkCodeInput, setLinkCodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // New emergency contact form state
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('Doctor');
  const [isDoctor, setIsDoctor] = useState(false);

  useEffect(() => {
    loadData();
  }, [isCaregiver]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      if (isCaregiver) {
        const res = await caregiverApi.getMonitoredPatients();
        if (res.data && res.data.success) {
          setPatients(res.data.patients || []);
        }
      } else {
        const res = await emergencyApi.getContacts();
        if (res.data && res.data.success) {
          setContacts(res.data.contacts || []);
        }
      }
    } catch (e) {
      console.log('Error loading caregiver/emergency data:', e?.message || e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkPatient = async () => {
    if (!linkCodeInput.trim()) {
      Alert.alert('Missing Code', 'Please enter a 6-character patient link code.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await caregiverApi.linkPatient(linkCodeInput.trim());
      if (res.data && res.data.success) {
        Alert.alert('Linked! 🤝', res.data.message);
        setLinkCodeInput('');
        loadData();
      } else {
        Alert.alert('Failed', res.data?.message || 'Could not link patient.');
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Invalid link code.';
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Call Error', `Unable to initiate call to ${phoneNumber}`);
    });
  };

  const handleAddContact = async () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert('Required Fields', 'Please enter a name and phone number.');
      return;
    }

    try {
      const res = await emergencyApi.createContact({
        name: contactName.trim(),
        phone: contactPhone.trim(),
        relation: contactRelation.trim(),
        isDoctor
      });

      if (res.data && res.data.success) {
        setShowAddContact(false);
        setContactName('');
        setContactPhone('');
        loadData();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to save contact.');
    }
  };

  const handleDeleteContact = (contact) => {
    Alert.alert('Remove Contact', `Remove ${contact.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await emergencyApi.deleteContact(contact.id);
          loadData();
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <Text style={[styles.screenTitle, { fontSize: typography.header.fontSize }]}>
          {isCaregiver ? 'Caregiver Dashboard' : 'Family & Caregiver Sync'}
        </Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={colors.primary} />
        }
      >
        {isCaregiver ? (
          /* CAREGIVER VIEW */
          <View>
            {/* Link New Patient Card */}
            <View style={styles.card}>
              <Text style={[styles.cardTitle, { fontSize: typography.title.fontSize }]}>
                ➕ Link a Family Member / Patient
              </Text>
              <Text style={styles.cardSub}>
                Enter the 6-character Caregiver Code displayed on the patient's phone.
              </Text>

              <View style={styles.linkRow}>
                <TextInput
                  style={styles.codeInput}
                  placeholder="e.g. CARE88"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  value={linkCodeInput}
                  onChangeText={setLinkCodeInput}
                />
                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={handleLinkPatient}
                  activeOpacity={0.8}
                >
                  <Text style={styles.linkBtnText}>Link</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Monitored Patients List */}
            <Text style={[styles.sectionHeading, { fontSize: typography.title.fontSize }]}>
              Monitored Patients ({patients.length})
            </Text>

            {patients.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="people-outline" size={60} color="#94A3B8" />
                <Text style={styles.emptyText}>No linked patients yet.</Text>
                <Text style={styles.emptySubText}>Enter a patient's code above to start monitoring their doses.</Text>
              </View>
            ) : (
              patients.map(p => (
                <View key={p.id} style={styles.patientCard}>
                  <View style={styles.patientHeader}>
                    <View style={styles.patientAvatar}>
                      <Text style={styles.patientInitial}>{p.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.patientMeta}>
                      <Text style={[styles.patientName, { fontSize: typography.title.fontSize }]}>
                        {p.name}
                      </Text>
                      <Text style={styles.patientPhone}>{p.phone || p.email}</Text>
                    </View>
                    <View style={styles.adherenceTag}>
                      <Text style={styles.adherenceTagText}>
                        {p.todayDoses?.adherenceRate || 100}% Today
                      </Text>
                    </View>
                  </View>

                  {/* Today Progress */}
                  <View style={styles.progressRow}>
                    <View style={styles.progressItem}>
                      <Text style={styles.progressNumber}>{p.todayDoses?.taken || 0}/{p.todayDoses?.total || 0}</Text>
                      <Text style={styles.progressLabel}>Doses Taken</Text>
                    </View>
                    <View style={styles.progressItem}>
                      <Text style={[styles.progressNumber, { color: p.todayDoses?.missed > 0 ? '#DC2626' : '#10B981' }]}>
                        {p.todayDoses?.missed || 0}
                      </Text>
                      <Text style={styles.progressLabel}>Missed</Text>
                    </View>
                    <View style={styles.progressItem}>
                      <Text style={[styles.progressNumber, { color: p.lowStockCount > 0 ? '#D97706' : '#10B981' }]}>
                        {p.lowStockCount}
                      </Text>
                      <Text style={styles.progressLabel}>Low Stock</Text>
                    </View>
                  </View>

                  {/* Low stock alerts */}
                  {p.lowStockCount > 0 && (
                    <View style={styles.alertNotice}>
                      <Ionicons name="warning" size={18} color="#B45309" />
                      <Text style={styles.alertNoticeText}>
                        Refill needed for: {p.lowStockMedications?.map(m => `${m.name} (${m.currentStock} left)`).join(', ')}
                      </Text>
                    </View>
                  )}

                  {/* Contact Patient */}
                  {p.phone ? (
                    <TouchableOpacity
                      style={styles.callPatientBtn}
                      onPress={() => handleCall(p.phone)}
                    >
                      <Ionicons name="call" size={18} color="#FFFFFF" />
                      <Text style={styles.callPatientBtnText}>Call {p.name.split(' ')[0]}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))
            )}
          </View>
        ) : (
          /* PATIENT VIEW */
          <View>
            {/* Share Caregiver Code Card */}
            <View style={styles.codeCard}>
              <View style={styles.codeHeader}>
                <Ionicons name="key" size={28} color="#2563EB" />
                <Text style={styles.codeCardTitle}>Your Caregiver Pairing Code</Text>
              </View>
              <Text style={styles.codeCardSub}>
                Share this code with your son, daughter, nurse, or caregiver so they can keep you safe and monitor missed doses.
              </Text>
              <View style={styles.codeDisplayBox}>
                <Text style={styles.codeDisplayText}>{user?.caregiverCode || 'CARE88'}</Text>
              </View>
            </View>

            {/* Emergency & Doctor Quick Dial */}
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionHeading, { fontSize: typography.title.fontSize }]}>
                🚨 Quick Dial Contacts & Doctors
              </Text>
              <TouchableOpacity onPress={() => setShowAddContact(!showAddContact)}>
                <Text style={styles.addContactLink}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {showAddContact && (
              <View style={styles.addContactBox}>
                <Text style={styles.addContactTitle}>Add New Quick Dial Contact</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Full Name (e.g. Dr. Robert Williams)"
                  value={contactName}
                  onChangeText={setContactName}
                />
                <TextInput
                  style={styles.formInput}
                  placeholder="Phone Number (e.g. +1-555-019-2834)"
                  keyboardType="phone-pad"
                  value={contactPhone}
                  onChangeText={setContactPhone}
                />
                <TextInput
                  style={styles.formInput}
                  placeholder="Relation (e.g. Cardiologist, Son)"
                  value={contactRelation}
                  onChangeText={setContactRelation}
                />
                <View style={styles.formBtnRow}>
                  <TouchableOpacity
                    style={styles.saveContactBtn}
                    onPress={handleAddContact}
                  >
                    <Text style={styles.saveContactBtnText}>Save Contact</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelContactBtn}
                    onPress={() => setShowAddContact(false)}
                  >
                    <Text style={styles.cancelContactBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {contacts.map(c => (
              <View key={c.id} style={styles.contactCard}>
                <View style={styles.contactIconWrap}>
                  <Ionicons
                    name={c.isDoctor ? 'medkit' : 'person'}
                    size={28}
                    color={c.isDoctor ? '#2563EB' : '#059669'}
                  />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { fontSize: typography.title.fontSize - 2 }]}>
                    {c.name}
                  </Text>
                  <Text style={styles.contactRelation}>{c.relation}</Text>
                  <Text style={styles.contactPhone}>{c.phone}</Text>
                </View>

                <View style={styles.contactActions}>
                  <TouchableOpacity
                    style={[styles.quickCallBtn, { minHeight: typography.minTouchHeight - 6 }]}
                    onPress={() => handleCall(c.phone)}
                  >
                    <Ionicons name="call" size={22} color="#FFFFFF" />
                    <Text style={styles.quickCallBtnText}>CALL</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteContactBtn}
                    onPress={() => handleDeleteContact(c)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  cardTitle: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cardSub: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 20,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 10,
  },
  codeInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    color: '#1E293B',
  },
  linkBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    justifyContent: 'center',
    borderRadius: 14,
  },
  linkBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHeading: {
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInitial: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1D4ED8',
  },
  patientMeta: {
    flex: 1,
  },
  patientName: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  patientPhone: {
    fontSize: 13,
    color: colors.textMuted,
  },
  adherenceTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  adherenceTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 2,
  },
  alertNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginTop: 12,
  },
  alertNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  callPatientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
    gap: 8,
  },
  callPatientBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  codeCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 22,
    padding: 22,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    marginBottom: 20,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeCardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  codeCardSub: {
    fontSize: 14,
    color: '#334155',
    marginTop: 6,
    lineHeight: 20,
  },
  codeDisplayBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  codeDisplayText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 6,
    color: '#1D4ED8',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addContactLink: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  addContactBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginBottom: 14,
  },
  addContactTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    fontSize: 15,
  },
  formBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  saveContactBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveContactBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  cancelContactBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelContactBtnText: {
    color: '#64748B',
    fontWeight: '700',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  contactIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  contactRelation: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  contactPhone: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  quickCallBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  deleteContactBtn: {
    padding: 6,
  }
});

export default CaregiverScreen;
