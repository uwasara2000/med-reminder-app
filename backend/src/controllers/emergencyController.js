const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

exports.getContacts = async (req, res) => {
  try {
    const targetUserId = req.query.patientId || req.user.id;
    const contacts = db.getEmergencyContacts(targetUserId);

    res.json({
      success: true,
      contacts
    });
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    res.status(500).json({ success: false, message: 'Server error fetching emergency contacts.' });
  }
};

exports.createContact = async (req, res) => {
  try {
    const { name, relation = 'Caregiver', phone, isDoctor = false } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone number are required.' });
    }

    const newContact = {
      id: 'contact_' + uuidv4().substring(0, 8),
      userId: req.user.id,
      name: name.trim(),
      relation: relation.trim(),
      phone: phone.trim(),
      isDoctor: Boolean(isDoctor),
      createdAt: new Date().toISOString()
    };

    db.createEmergencyContact(newContact);

    res.status(201).json({
      success: true,
      message: 'Emergency contact added successfully.',
      contact: newContact
    });
  } catch (error) {
    console.error('Error creating emergency contact:', error);
    res.status(500).json({ success: false, message: 'Server error adding emergency contact.' });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteEmergencyContact(id, req.user.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }

    res.json({
      success: true,
      message: 'Emergency contact removed successfully.'
    });
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    res.status(500).json({ success: false, message: 'Server error removing contact.' });
  }
};
