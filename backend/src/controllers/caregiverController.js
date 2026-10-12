const db = require('../db/database');

exports.linkPatientByCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a 6-character patient link code.' });
    }

    const patient = db.findUserByCaregiverCode(code.trim().toUpperCase());
    if (!patient) {
      return res.status(404).json({ success: false, message: 'No patient found with this link code. Please verify the code.' });
    }

    if (patient.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot link your own account as caregiver.' });
    }

    const link = db.linkCaregiverToPatient(req.user.id, patient.id);

    const { password, ...safePatient } = patient;
    res.json({
      success: true,
      message: `Successfully linked with patient ${patient.name}.`,
      link,
      patient: safePatient
    });
  } catch (error) {
    console.error('Error linking patient:', error);
    res.status(500).json({ success: false, message: 'Server error linking patient.' });
  }
};

exports.getMonitoredPatients = async (req, res) => {
  try {
    const patients = db.getPatientsForCaregiver(req.user.id);
    const todayStr = new Date().toISOString().split('T')[0];

    const patientSummaries = patients.map(patient => {
      const meds = db.getMedicationsByUserId(patient.id);
      const doseLogs = db.getDoseLogsByDate(patient.id, todayStr);

      const totalMeds = meds.length;
      const lowStockMeds = meds.filter(m => m.currentStock <= (m.refillThreshold || 5));

      let totalTodayDoses = 0;
      for (const m of meds) {
        totalTodayDoses += db.getSchedulesByMedicationId(m.id).length;
      }

      const takenToday = doseLogs.filter(l => l.status === 'taken').length;
      const missedToday = doseLogs.filter(l => l.status === 'missed').length;

      return {
        ...patient,
        medicationCount: totalMeds,
        lowStockCount: lowStockMeds.length,
        lowStockMedications: lowStockMeds.map(m => ({ id: m.id, name: m.name, currentStock: m.currentStock })),
        todayDoses: {
          total: totalTodayDoses,
          taken: takenToday,
          missed: missedToday,
          adherenceRate: totalTodayDoses > 0 ? Math.round((takenToday / totalTodayDoses) * 100) : 100
        }
      };
    });

    res.json({
      success: true,
      count: patientSummaries.length,
      patients: patientSummaries
    });
  } catch (error) {
    console.error('Error fetching monitored patients:', error);
    res.status(500).json({ success: false, message: 'Server error fetching monitored patients.' });
  }
};
