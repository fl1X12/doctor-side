const mongoose = require('mongoose');

const parameterValueSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  value: mongoose.Schema.Types.Mixed, // Can be number or {systolic: Number, diastolic: Number}
  note: String
});

const parameterSchema = new mongoose.Schema({
  type: String, // Blood Pressure, Hemoglobin, etc.
  values: [parameterValueSchema]
});

const patientSchema = new mongoose.Schema({
  // Basic info
  slNo: Number,
  uhiNo: { type: String, required: true, unique: true },
  patientName: { type: String, required: true },
  redirection: { type: String, default: 'obstetrics' },
  status: { type: String, default: 'waiting' }, // waiting | completed
  createdAt: { type: Date, default: Date.now },

  // Patient Details
  details: {
    age: Number,
    gender: String,
    bloodGroup: String,
    phone: String,
    lmp: Date, // Last menstrual period
    opIpNo: String // OP/IP number
  },

  // General Analysis
  analysis: {
    stomachPain: String,
    legSwelling: String,
    backPain: String,
    babyMovement: String,
    nausea: String,
    sleepCycle: String,
    urinationFrequency: String
  },

  // Maternal Health
  maternalHealth: {
    ttCompleted: Number, // Number of tetanus shots
    thyroidHistory: String,
    gestationalAge: Number, // Weeks of pregnancy
    dueDate: Date,
    placentaPosition: String
  },

  // Previous Baby Records
  previousBaby: {
    gender: String,
    age: String,
    birthWeight: Number,
    birthLength: Number,
    deliveryType: String, // Normal/C-Section
    vitalsSummary: String
  },

  // Family History
  familyHistory: {
    thyroid: String,
    hypertension: String,
    fibroids: String,
    diabetes: String
  },

  // Medical Parameters
  parameters: [parameterSchema],

  // Doctor's Notes
  notes: [{
    date: { type: Date, default: Date.now },
    content: String,
    importantPoints: [String] // For red highlighted points
  }],

  // Summary
  summary: String
});

// Add index for better query performance
patientSchema.index({ patientName: 1 });
patientSchema.index({ uhiNo: 1 });
patientSchema.index({ status: 1 });

module.exports = mongoose.model('Patient', patientSchema);