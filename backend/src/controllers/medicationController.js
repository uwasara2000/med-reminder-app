const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const scannerService = require('../services/medicationScannerService');

const determinePeriod = (timeStr) => {
  if (!timeStr) return 'morning';
  const hour = parseInt(timeStr.split(':')[0], 10);
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

exports.getMedications = async (req, res) => {
  try {
    const targetUserId = req.query.patientId || req.user.id;
    const medications = db.getMedicationsByUserId(targetUserId);

    // Attach schedules and stock warning to each medication
    const enriched = medications.map(med => {
      const schedules = db.getSchedulesByMedicationId(med.id);
      const isLowStock = med.currentStock <= (med.refillThreshold || 5);
      return {
        ...med,
        schedules,
        isLowStock
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      medications: enriched
    });
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ success: false, message: 'Server error fetching medications.' });
  }
};

exports.getMedicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const med = db.getMedicationById(id);

    if (!med || !med.active) {
      return res.status(404).json({ success: false, message: 'Medication not found.' });
    }

    const schedules = db.getSchedulesByMedicationId(med.id);
    const refills = db.getRefillLogs(med.id);
    const isLowStock = med.currentStock <= (med.refillThreshold || 5);

    res.json({
      success: true,
      medication: {
        ...med,
        schedules,
        refills,
        isLowStock
      }
    });
  } catch (error) {
    console.error('Error fetching medication by id:', error);
    res.status(500).json({ success: false, message: 'Server error fetching medication details.' });
  }
};

exports.createMedication = async (req, res) => {
  try {
    const {
      name,
      genericName = '',
      dosage = '1 tablet',
      form = 'pill', // 'pill', 'capsule', 'syrup', 'injection', 'inhaler', 'drops', 'patch'
      color = '#3B82F6', // Hex color for pill badge
      icon = 'pill',
      foodInstruction = 'with_meal', // 'before_meal', 'with_meal', 'after_meal', 'empty_stomach', 'anytime'
      instructions = 'Take with a full glass of water',
      currentStock = 30,
      totalQuantity = 30,
      refillThreshold = 5,
      notes = '',
      times = ['08:00'], // array of strings e.g. ["08:00", "20:00"]
      daysOfWeek = 'ALL' // 'ALL' or 'MON,TUE,WED'
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Medication name is required.' });
    }

    const newMedId = 'med_' + uuidv4().substring(0, 8);
    const newMed = {
      id: newMedId,
      userId: req.user.id,
      name: name.trim(),
      genericName: genericName.trim(),
      dosage: dosage.trim(),
      form,
      color,
      icon,
      foodInstruction,
      instructions: instructions.trim(),
      currentStock: Number(currentStock) || 0,
      totalQuantity: Number(totalQuantity) || 30,
      refillThreshold: Number(refillThreshold) || 5,
      notes: notes.trim(),
      active: true,
      createdAt: new Date().toISOString()
    };

    db.createMedication(newMed);

    // Create Schedules for the reminder times
    const createdSchedules = [];
    const validTimes = Array.isArray(times) && times.length > 0 ? times : ['08:00'];

    for (const timeStr of validTimes) {
      const schedule = {
        id: 'sch_' + uuidv4().substring(0, 8),
        medicationId: newMedId,
        reminderTime: timeStr,
        period: determinePeriod(timeStr),
        daysOfWeek: daysOfWeek || 'ALL',
        createdAt: new Date().toISOString()
      };
      db.createSchedule(schedule);
      createdSchedules.push(schedule);
    }

    res.status(201).json({
      success: true,
      message: 'Medication and reminder schedule created successfully.',
      medication: {
        ...newMed,
        schedules: createdSchedules,
        isLowStock: newMed.currentStock <= newMed.refillThreshold
      }
    });
  } catch (error) {
    console.error('Error creating medication:', error);
    res.status(500).json({ success: false, message: 'Server error creating medication.' });
  }
};

exports.updateMedication = async (req, res) => {
  try {
    const { id } = req.params;
    const med = db.getMedicationById(id);

    if (!med || !med.active) {
      return res.status(404).json({ success: false, message: 'Medication not found.' });
    }

    const {
      name,
      genericName,
      dosage,
      form,
      color,
      icon,
      foodInstruction,
      instructions,
      currentStock,
      totalQuantity,
      refillThreshold,
      notes,
      times,
      daysOfWeek
    } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (genericName !== undefined) updates.genericName = genericName.trim();
    if (dosage !== undefined) updates.dosage = dosage.trim();
    if (form !== undefined) updates.form = form;
    if (color !== undefined) updates.color = color;
    if (icon !== undefined) updates.icon = icon;
    if (foodInstruction !== undefined) updates.foodInstruction = foodInstruction;
    if (instructions !== undefined) updates.instructions = instructions.trim();
    if (currentStock !== undefined) updates.currentStock = Number(currentStock);
    if (totalQuantity !== undefined) updates.totalQuantity = Number(totalQuantity);
    if (refillThreshold !== undefined) updates.refillThreshold = Number(refillThreshold);
    if (notes !== undefined) updates.notes = notes.trim();

    const updatedMed = db.updateMedication(id, updates);

    // Update schedules if times provided
    if (Array.isArray(times) && times.length > 0) {
      db.deleteSchedulesByMedicationId(id);
      for (const timeStr of times) {
        db.createSchedule({
          id: 'sch_' + uuidv4().substring(0, 8),
          medicationId: id,
          reminderTime: timeStr,
          period: determinePeriod(timeStr),
          daysOfWeek: daysOfWeek || 'ALL',
          createdAt: new Date().toISOString()
        });
      }
    }

    const schedules = db.getSchedulesByMedicationId(id);

    res.json({
      success: true,
      message: 'Medication updated successfully.',
      medication: {
        ...updatedMed,
        schedules,
        isLowStock: updatedMed.currentStock <= updatedMed.refillThreshold
      }
    });
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({ success: false, message: 'Server error updating medication.' });
  }
};

exports.deleteMedication = async (req, res) => {
  try {
    const { id } = req.params;
    const med = db.getMedicationById(id);
    if (!med) {
      return res.status(404).json({ success: false, message: 'Medication not found.' });
    }

    db.deleteMedication(id);
    db.deleteSchedulesByMedicationId(id);

    res.json({
      success: true,
      message: 'Medication deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ success: false, message: 'Server error deleting medication.' });
  }
};

exports.addRefill = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, pharmacy = '', notes = '' } = req.body;

    const med = db.getMedicationById(id);
    if (!med || !med.active) {
      return res.status(404).json({ success: false, message: 'Medication not found.' });
    }

    const refillQuantity = Number(quantity);
    if (!refillQuantity || refillQuantity <= 0) {
      return res.status(400).json({ success: false, message: 'Valid refill quantity is required.' });
    }

    const refillLog = {
      id: 'ref_' + uuidv4().substring(0, 8),
      medicationId: id,
      quantity: refillQuantity,
      pharmacy: pharmacy.trim(),
      notes: notes.trim(),
      date: new Date().toISOString()
    };

    db.addRefillLog(refillLog);
    const updatedMed = db.getMedicationById(id);

    res.json({
      success: true,
      message: `Successfully added ${refillQuantity} to medication stock.`,
      currentStock: updatedMed.currentStock,
      refill: refillLog
    });
  } catch (error) {
    console.error('Error recording refill:', error);
    res.status(500).json({ success: false, message: 'Server error recording refill.' });
  }
};

exports.scanMedicationImage = async (req, res) => {
  try {
    const { imageBase64, image } = req.body;
    const imageData = imageBase64 || image;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Image data (base64) is required.'
      });
    }

    const details = await scannerService.scanMedication(imageData);

    res.json({
      success: true,
      message: 'Medication image analyzed successfully.',
      details
    });
  } catch (error) {
    console.error('Error scanning medication image:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to scan medication image.'
    });
  }
};

