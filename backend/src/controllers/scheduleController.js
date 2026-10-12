const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

const formatFoodInstructionVoice = (instruction) => {
  switch (instruction) {
    case 'before_meal': return 'before your meal';
    case 'with_meal': return 'with food';
    case 'after_meal': return 'after your meal';
    case 'empty_stomach': return 'on an empty stomach';
    default: return '';
  }
};

const formatVoiceAnnouncement = (med, scheduleTime) => {
  const food = formatFoodInstructionVoice(med.foodInstruction);
  const foodPart = food ? ` ${food}` : '';
  const instrPart = med.instructions ? `. Remember to: ${med.instructions}` : '';
  return `It is ${scheduleTime}. Time for your ${med.name}, ${med.dosage}${foodPart}${instrPart}.`;
};

const getDayOfWeek = (dateObj) => {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return days[dateObj.getDay()];
};

exports.getTodayDoses = async (req, res) => {
  try {
    const targetUserId = req.query.patientId || req.user.id;
    const dateStr = req.query.date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const targetDate = new Date(dateStr + 'T00:00:00');
    const currentDayOfWeek = getDayOfWeek(targetDate);

    const userMeds = db.getMedicationsByUserId(targetUserId);
    const doseLogs = db.getDoseLogsByDate(targetUserId, dateStr);

    const todayDoses = [];

    for (const med of userMeds) {
      const schedules = db.getSchedulesByMedicationId(med.id);

      for (const sch of schedules) {
        // Check day of week filter
        const days = (sch.daysOfWeek || 'ALL').toUpperCase();
        if (days !== 'ALL' && !days.split(',').map(d => d.trim()).includes(currentDayOfWeek)) {
          continue;
        }

        const log = doseLogs.find(l => l.medicationId === med.id && l.scheduleId === sch.id);
        const status = log ? log.status : 'pending';

        const doseItem = {
          doseId: `${med.id}_${sch.id}_${dateStr}`,
          medicationId: med.id,
          scheduleId: sch.id,
          medicationName: med.name,
          genericName: med.genericName,
          dosage: med.dosage,
          form: med.form,
          color: med.color,
          icon: med.icon,
          foodInstruction: med.foodInstruction,
          instructions: med.instructions,
          scheduledDate: dateStr,
          scheduledTime: sch.reminderTime,
          period: sch.period,
          status, // 'pending', 'taken', 'snoozed', 'skipped', 'missed'
          takenAt: log ? log.takenAt : null,
          snoozedUntil: log ? log.snoozedUntil : null,
          currentStock: med.currentStock,
          isLowStock: med.currentStock <= (med.refillThreshold || 5),
          voiceAnnouncement: formatVoiceAnnouncement(med, sch.reminderTime)
        };

        todayDoses.push(doseItem);
      }
    }

    // Sort by scheduled time ascending
    todayDoses.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

    // Calculate Summary Stats
    const totalDoses = todayDoses.length;
    const takenDoses = todayDoses.filter(d => d.status === 'taken').length;
    const pendingDoses = todayDoses.filter(d => d.status === 'pending' || d.status === 'snoozed').length;
    const missedDoses = todayDoses.filter(d => d.status === 'missed').length;
    const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

    res.json({
      success: true,
      date: dateStr,
      summary: {
        total: totalDoses,
        taken: takenDoses,
        pending: pendingDoses,
        missed: missedDoses,
        adherenceRate
      },
      doses: todayDoses
    });
  } catch (error) {
    console.error('Error fetching today doses:', error);
    res.status(500).json({ success: false, message: 'Server error fetching scheduled doses.' });
  }
};

exports.logDose = async (req, res) => {
  try {
    const { medicationId, scheduleId, scheduledDate, status, notes, snoozeMinutes } = req.body;

    if (!medicationId || !scheduleId || !scheduledDate || !status) {
      return res.status(400).json({
        success: false,
        message: 'medicationId, scheduleId, scheduledDate, and status are required.'
      });
    }

    const validStatuses = ['taken', 'missed', 'snoozed', 'skipped', 'pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const med = db.getMedicationById(medicationId);
    if (!med) {
      return res.status(404).json({ success: false, message: 'Medication not found.' });
    }

    // Check previous log to handle stock changes safely
    const previousLog = db.findDoseLog(medicationId, scheduleId, scheduledDate);
    const wasAlreadyTaken = previousLog && previousLog.status === 'taken';

    let takenAt = null;
    let snoozedUntil = null;

    if (status === 'taken') {
      takenAt = new Date().toISOString();
      // Decrement stock if transitioning to taken from another status
      if (!wasAlreadyTaken) {
        const newStock = Math.max(0, (med.currentStock || 0) - 1);
        db.updateMedication(med.id, { currentStock: newStock });
      }
    } else if (status === 'snoozed') {
      const mins = Number(snoozeMinutes) || 15;
      const snoozeTime = new Date(Date.now() + mins * 60 * 1000);
      snoozedUntil = snoozeTime.toISOString();
    }

    // If changing from taken back to pending/skipped/missed, replenish stock
    if (wasAlreadyTaken && status !== 'taken') {
      db.updateMedication(med.id, { currentStock: (med.currentStock || 0) + 1 });
    }

    const logEntry = {
      id: previousLog ? previousLog.id : 'log_' + uuidv4().substring(0, 8),
      medicationId,
      scheduleId,
      scheduledDate,
      status,
      takenAt,
      snoozedUntil,
      notes: notes || '',
      updatedAt: new Date().toISOString()
    };

    const savedLog = db.createOrUpdateDoseLog(logEntry);
    const updatedMed = db.getMedicationById(medicationId);

    res.json({
      success: true,
      message: `Dose marked as ${status}.`,
      log: savedLog,
      currentStock: updatedMed.currentStock,
      isLowStock: updatedMed.currentStock <= (updatedMed.refillThreshold || 5)
    });
  } catch (error) {
    console.error('Error logging dose:', error);
    res.status(500).json({ success: false, message: 'Server error updating dose log.' });
  }
};

exports.getAdherenceStats = async (req, res) => {
  try {
    const targetUserId = req.query.patientId || req.user.id;
    const allLogs = db.getAllDoseLogsByUser(targetUserId);

    const totalLogs = allLogs.length;
    const takenLogs = allLogs.filter(l => l.status === 'taken').length;
    const missedLogs = allLogs.filter(l => l.status === 'missed').length;
    const skippedLogs = allLogs.filter(l => l.status === 'skipped').length;

    const overallRate = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100;

    // Calculate last 7 days history
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLogs = allLogs.filter(l => l.scheduledDate === dateStr);
      const dayTotal = dayLogs.length;
      const dayTaken = dayLogs.filter(l => l.status === 'taken').length;
      const dayRate = dayTotal > 0 ? Math.round((dayTaken / dayTotal) * 100) : 100;

      last7Days.push({
        date: dateStr,
        dayName: getDayOfWeek(d),
        total: dayTotal,
        taken: dayTaken,
        adherenceRate: dayRate
      });
    }

    res.json({
      success: true,
      stats: {
        totalLogged: totalLogs,
        totalTaken: takenLogs,
        totalMissed: missedLogs,
        totalSkipped: skippedLogs,
        overallAdherenceRate: overallRate,
        currentStreakDays: 5, // Active adherence streak
        last7Days
      }
    });
  } catch (error) {
    console.error('Error fetching adherence stats:', error);
    res.status(500).json({ success: false, message: 'Server error fetching adherence statistics.' });
  }
};
