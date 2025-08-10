const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');

// GET all patients
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new patient
router.post('/', async (req, res) => {
  const { uhiNo, patientName, redirection } = req.body;
  try {
    const existing = await Patient.findOne({ uhiNo });
    if (existing) return res.status(400).json({ message: 'UHI Number already exists' });

    const count = await Patient.countDocuments();
    const newPatient = new Patient({
      slNo: count + 1,
      uhiNo,
      patientName,
      redirection,
    });

    await newPatient.save();
    res.status(201).json({ message: 'Patient added successfully', patient: newPatient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Mark patient as completed
router.put('/:uhiNo/complete', async (req, res) => {
  try {
    const updated = await Patient.findOneAndUpdate(
      { uhiNo: req.params.uhiNo },
      { status: 'completed' },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient marked as completed', patient: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
