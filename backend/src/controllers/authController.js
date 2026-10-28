const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { hashPassword, comparePassword, generateToken, generateCaregiverCode } = require('../utils/auth');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'patient', phone, seniorMode = true } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      });
    }

    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await hashPassword(password);
    const caregiverCode = role === 'patient' ? generateCaregiverCode() : null;

    const newUser = {
      id: 'usr_' + uuidv4().substring(0, 8),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role, // 'patient' or 'caregiver'
      phone: phone || '',
      caregiverCode,
      seniorMode: seniorMode !== false,
      voiceAnnouncements: true,
      highContrast: false,
      createdAt: new Date().toISOString()
    };

    db.createUser(newUser);

    const token = generateToken({ userId: newUser.id, role: newUser.role });
    const { password: _, ...safeUser } = newUser;

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken({ userId: user.id, role: user.role });
    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { password, ...safeUser } = user;

    let linkedCaregivers = [];
    let linkedPatients = [];

    if (user.role === 'patient') {
      const links = db.getCaregiverLinksForPatient(user.id);
      linkedCaregivers = links.map(l => {
        const cg = db.findUserById(l.caregiverId);
        return cg ? { id: cg.id, name: cg.name, phone: cg.phone, email: cg.email } : null;
      }).filter(Boolean);
    } else {
      linkedPatients = db.getPatientsForCaregiver(user.id);
    }

    res.json({
      success: true,
      user: {
        ...safeUser,
        linkedCaregivers,
        linkedPatients
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, seniorMode, voiceAnnouncements, highContrast } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (seniorMode !== undefined) updates.seniorMode = seniorMode;
    if (voiceAnnouncements !== undefined) updates.voiceAnnouncements = voiceAnnouncements;
    if (highContrast !== undefined) updates.highContrast = highContrast;

    const updatedUser = db.updateUser(req.user.id, updates);
    const { password, ...safeUser } = updatedUser;

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: safeUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
};
