const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', '..', 'data', 'database.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial Database Schema
const initialSchema = {
  users: [],
  medications: [],
  schedules: [],
  doseLogs: [],
  caregiverLinks: [],
  emergencyContacts: [],
  refillLogs: []
};

class Database {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return { ...initialSchema, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.error('Error loading database, resetting to clean state:', err);
    }
    this.save(initialSchema);
    return JSON.parse(JSON.stringify(initialSchema));
  }

  save(data = this.data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
      this.data = data;
    } catch (err) {
      console.error('Error saving database:', err);
      throw err;
    }
  }

  // --- Collection Query Helpers ---

  // Users
  findUserById(id) {
    return this.data.users.find(u => u.id === id) || null;
  }

  findUserByEmail(email) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  findUserByCaregiverCode(code) {
    return this.data.users.find(u => u.caregiverCode === code) || null;
  }

  createUser(user) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id, updates) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.users[idx];
  }

  // Medications
  getMedicationsByUserId(userId) {
    return this.data.medications.filter(m => m.userId === userId && m.active !== false);
  }

  getMedicationById(id) {
    return this.data.medications.find(m => m.id === id) || null;
  }

  createMedication(med) {
    this.data.medications.push(med);
    this.save();
    return med;
  }

  updateMedication(id, updates) {
    const idx = this.data.medications.findIndex(m => m.id === id);
    if (idx === -1) return null;
    this.data.medications[idx] = { ...this.data.medications[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.medications[idx];
  }

  deleteMedication(id) {
    const idx = this.data.medications.findIndex(m => m.id === id);
    if (idx === -1) return false;
    // Soft delete
    this.data.medications[idx].active = false;
    this.data.medications[idx].updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  // Schedules
  getSchedulesByMedicationId(medicationId) {
    return this.data.schedules.filter(s => s.medicationId === medicationId);
  }

  getSchedulesByUserId(userId) {
    const userMeds = this.getMedicationsByUserId(userId).map(m => m.id);
    return this.data.schedules.filter(s => userMeds.includes(s.medicationId));
  }

  createSchedule(schedule) {
    this.data.schedules.push(schedule);
    this.save();
    return schedule;
  }

  deleteSchedulesByMedicationId(medicationId) {
    this.data.schedules = this.data.schedules.filter(s => s.medicationId !== medicationId);
    this.save();
  }

  // Dose Logs
  getDoseLogsByDate(userId, dateStr) {
    const userMeds = this.getMedicationsByUserId(userId).map(m => m.id);
    return this.data.doseLogs.filter(
      log => userMeds.includes(log.medicationId) && log.scheduledDate === dateStr
    );
  }

  getAllDoseLogsByUser(userId) {
    const userMeds = this.getMedicationsByUserId(userId).map(m => m.id);
    return this.data.doseLogs.filter(log => userMeds.includes(log.medicationId));
  }

  findDoseLog(medicationId, scheduleId, scheduledDate) {
    return this.data.doseLogs.find(
      l => l.medicationId === medicationId && l.scheduleId === scheduleId && l.scheduledDate === scheduledDate
    ) || null;
  }

  createOrUpdateDoseLog(logEntry) {
    const idx = this.data.doseLogs.findIndex(
      l => l.medicationId === logEntry.medicationId &&
           l.scheduleId === logEntry.scheduleId &&
           l.scheduledDate === logEntry.scheduledDate
    );

    if (idx >= 0) {
      this.data.doseLogs[idx] = { ...this.data.doseLogs[idx], ...logEntry, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.doseLogs[idx];
    } else {
      this.data.doseLogs.push(logEntry);
      this.save();
      return logEntry;
    }
  }

  // Emergency Contacts
  getEmergencyContacts(userId) {
    return this.data.emergencyContacts.filter(c => c.userId === userId);
  }

  createEmergencyContact(contact) {
    this.data.emergencyContacts.push(contact);
    this.save();
    return contact;
  }

  deleteEmergencyContact(id, userId) {
    const initialLen = this.data.emergencyContacts.length;
    this.data.emergencyContacts = this.data.emergencyContacts.filter(c => !(c.id === id && c.userId === userId));
    this.save();
    return this.data.emergencyContacts.length < initialLen;
  }

  // Caregiver Links
  getCaregiverLinksForPatient(patientId) {
    return this.data.caregiverLinks.filter(l => l.patientId === patientId);
  }

  getPatientsForCaregiver(caregiverId) {
    const links = this.data.caregiverLinks.filter(l => l.caregiverId === caregiverId && l.status === 'active');
    return links.map(l => {
      const patient = this.findUserById(l.patientId);
      if (!patient) return null;
      const { password, ...safePatient } = patient;
      return safePatient;
    }).filter(Boolean);
  }

  linkCaregiverToPatient(caregiverId, patientId) {
    const existing = this.data.caregiverLinks.find(
      l => l.caregiverId === caregiverId && l.patientId === patientId
    );
    if (existing) {
      existing.status = 'active';
      this.save();
      return existing;
    }
    const link = {
      id: 'link_' + Date.now(),
      caregiverId,
      patientId,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    this.data.caregiverLinks.push(link);
    this.save();
    return link;
  }

  // Refills
  addRefillLog(refill) {
    this.data.refillLogs.push(refill);
    // Also increase medication stock
    const med = this.getMedicationById(refill.medicationId);
    if (med) {
      med.currentStock = (med.currentStock || 0) + refill.quantity;
      this.updateMedication(med.id, { currentStock: med.currentStock });
    }
    this.save();
    return refill;
  }

  getRefillLogs(medicationId) {
    return this.data.refillLogs.filter(r => r.medicationId === medicationId);
  }
}

const db = new Database();
module.exports = db;
