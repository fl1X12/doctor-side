require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // For request logging
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// ===== Environment Variables =====
const PORT = process.env.PORT || 5000;
const LOCAL_IP = process.env.LOCAL_IP || '127.0.0.1';

// ===== Middleware =====
app.use(express.json());

// Log every incoming request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Body:', req.body);
  next();
});


// Allow all CORS requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Request logging
app.use(morgan('dev'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB error:', err));

// --- Schema Definitions ---

const parameterValueSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  value: mongoose.Schema.Types.Mixed, // Keep Mixed for BP object and numbers
  unit: String // Added unit to parameterValueSchema as it's now sent from frontend
});

const parameterSchema = new mongoose.Schema({
  type: String,
  values: [parameterValueSchema]
});

const patientSchema = new mongoose.Schema({
  uhiNo: { type: String, required: true, unique: true },
  patientName: { type: String, required: true },
  redirection: { type: String, default: 'obstetrics' },
  status: { type: String, default: 'waiting' },
  createdAt: { type: Date, default: Date.now },
  details: {
    age: Number,
    gender: { type: String, enum: ['Male', 'Female', 'Other', null] }, // Changed to enum
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null] }, // Changed to enum
    phone: String,
    lmp: Date, // Changed to Date type
    opIpNo: String
  },
  analysis: {
    stomachPain: { type: String, enum: ['Yes', 'No', null] }, // Changed to enum
    legSwelling: { type: String, enum: ['Yes', 'No', null] }, // Changed to enum
    backPain: { type: String, enum: ['Yes', 'No', null] }, // Changed to enum
    babyMovement: { type: String, enum: ['Good', 'Reduced', 'Absent', null] }, // Changed to enum
    nausea: { type: String, enum: ['Yes', 'No', null] }, // Changed to enum
    sleepCycle: String,
    urinationFrequency: String
  },
  maternalHealth: {
    ttCompleted: Number,
    thyroidHistory: { type: String, enum: ['Yes', 'No', null] }, // Changed to enum
    gestationalAge: Number,
    dueDate: Date, // Changed to Date type
    placentaPosition: { type: String, enum: ['Anterior', 'Posterior', 'Fundal', 'Lateral', 'Previa', 'Not Recorded', null] } // Changed to enum
  },
  previousBaby: {
    gender: { type: String, enum: ['Male', 'Female', 'NA', null] }, // Changed to enum
    age: Number, // Assuming age is a number
    birthWeight: Number,
    birthLength: Number,
    deliveryType: { type: String, enum: ['Normal', 'C-Section', 'Other', null] }, // Changed to enum
    vitalsSummary: String
  },
  familyHistory: {
    thyroid: { type: String, enum: ['Yes', 'No', 'Unknown', null] }, // Changed to enum
    hypertension: { type: String, enum: ['Yes', 'No', 'Unknown', null] }, // Changed to enum
    fibroids: { type: String, enum: ['Yes', 'No', 'Unknown', null] }, // Changed to enum
    diabetes: { type: String, enum: ['Yes', 'No', 'Unknown', null] } // Changed to enum
  },
  parameters: [parameterSchema],
  notes: [{
    date: { type: Date, default: Date.now },
    content: String,
    importantPoints: [String]
  }],
  summary: String,
  // New fields for vital info (already present from previous update)
  temperature: String,
  respiratoryRate: String,
  oxygenSaturation: String,
  jaundice: { type: String, enum: ['absent', 'mild', 'severe'], default: 'absent' },
  feet: { type: String, enum: ['absent', 'mild', 'severe'], default: 'absent' },
  weight: String,
  visitDate: { type: Date, default: Date.now } // Date of the vital info entry
});

const DoctorSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true }
});

// Hash password before saving
DoctorSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const Patient = mongoose.model('Patient', patientSchema);
const Doctor = mongoose.model('Doctor', DoctorSchema);

// --- Middleware for JWT authentication ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401); // No token provided

  jwt.verify(token, process.env.JWT_SECRET, (err, doctor) => {
    if (err) return res.sendStatus(403); // Invalid or expired token
    req.doctor = doctor; // Attach doctor info to request
    next();
  });
};

// --- Doctor Authentication Endpoints ---

// Doctor Signup
app.post('/api/doctors/signup', async (req, res) => {
  try {
    const { username, password, name } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Please enter all required fields.' });
    }

    const existingDoctor = await Doctor.findOne({ username });
    if (existingDoctor) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    const doctor = new Doctor({ username, password, name });
    await doctor.save();
    res.status(201).json({ message: 'Doctor registered successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Doctor Login
app.post('/api/doctors/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const doctor = await Doctor.findOne({ username });
    if (!doctor) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { id: doctor._id, username: doctor.username, name: doctor.name },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    res.json({ token, doctor: { id: doctor._id, username: doctor.username, name: doctor.name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Patient API Endpoints (Protected by authenticateToken middleware) ---

app.post('/api/patients/bulk', authenticateToken, async (req, res) => {
  try {
    const data = req.body.map((row, index) => ({
      ...row,
      uhiNo: String(row.uhiNo || '').trim(),
      patientName: String(row.patientName || '').trim(),
      redirection: row.redirection || 'obstetrics',
      status: row.status || 'waiting',
      createdAt: new Date()
    }));

    const filteredData = data.filter(p => p.uhiNo && p.patientName);

    const result = await Patient.insertMany(filteredData, { ordered: false })
      .catch(err => {
        if (err.writeErrors) {
          const insertedCount = err.result.nInserted;
          const failedCount = err.writeErrors.length;
          const errors = err.writeErrors.map(e => ({
            index: e.index,
            message: e.errmsg
          }));
          return { insertedCount, failedCount, errors };
        }
        throw err;
      });

    if (result.errors) {
      return res.status(207).json({
        message: 'Some entries failed to insert.',
        insertedCount: result.insertedCount,
        failedCount: result.failedCount,
        errors: result.errors
      });
    }

    res.status(201).json({ insertedCount: result.length });
  } catch (err) {
    console.error('Bulk upload error:', err);
    res.status(500).json({ error: 'An unexpected error occurred during bulk upload.' });
  }
});


app.post('/api/patients', authenticateToken, async (req, res) => {
  try {
    const patient = new Patient({ ...req.body, status: 'waiting', createdAt: new Date() });
    await patient.save();
    res.status(201).json(patient);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'UHI Number already exists' });
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/patients/waiting', authenticateToken, async (req, res) => {
  try {
    const patients = await Patient.find({ status: 'waiting' }).sort({ createdAt: 1 });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/patients/completed', authenticateToken, async (req, res) => {
  try {
    const patients = await Patient.find({ status: 'completed' }).sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/patients/:id/complete', authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, { status: 'completed' }, { new: true });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// This endpoint is used by patient.js to fetch a patient by name or UHI No
app.get('/api/patients/:identifier', authenticateToken, async (req, res) => {
  try {
    const identifier = decodeURIComponent(req.params.identifier);
    const patient = await Patient.findOne({
      $or: [
        { patientName: identifier },
        { uhiNo: identifier }
      ]
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    // Construct the update object carefully to handle nested fields
    const update = {
      'details.age': req.body.details?.age,
      'details.gender': req.body.details?.gender,
      'details.bloodGroup': req.body.details?.bloodGroup,
      'details.phone': req.body.details?.phone,
      'details.lmp': req.body.details?.lmp ? new Date(req.body.details.lmp) : null, // Convert to Date
      'details.opIpNo': req.body.details?.opIpNo,

      'analysis.stomachPain': req.body.analysis?.stomachPain,
      'analysis.legSwelling': req.body.analysis?.legSwelling,
      'analysis.backPain': req.body.analysis?.backPain,
      'analysis.babyMovement': req.body.analysis?.babyMovement,
      'analysis.nausea': req.body.analysis?.nausea,
      'analysis.sleepCycle': req.body.analysis?.sleepCycle,
      'analysis.urinationFrequency': req.body.analysis?.urinationFrequency,

      'maternalHealth.ttCompleted': req.body.maternalHealth?.ttCompleted,
      'maternalHealth.thyroidHistory': req.body.maternalHealth?.thyroidHistory,
      'maternalHealth.gestationalAge': req.body.maternalHealth?.gestationalAge,
      'maternalHealth.dueDate': req.body.maternalHealth?.dueDate ? new Date(req.body.maternalHealth.dueDate) : null, // Convert to Date
      'maternalHealth.placentaPosition': req.body.maternalHealth?.placentaPosition,

      'previousBaby.gender': req.body.previousBaby?.gender,
      'previousBaby.age': req.body.previousBaby?.age,
      'previousBaby.birthWeight': req.body.previousBaby?.birthWeight,
      'previousBaby.birthLength': req.body.previousBaby?.birthLength,
      'previousBaby.deliveryType': req.body.previousBaby?.deliveryType,
      'previousBaby.vitalsSummary': req.body.previousBaby?.vitalsSummary,

      'familyHistory.thyroid': req.body.familyHistory?.thyroid,
      'familyHistory.hypertension': req.body.familyHistory?.hypertension,
      'familyHistory.fibroids': req.body.familyHistory?.fibroids,
      'familyHistory.diabetes': req.body.familyHistory?.diabetes,

      notes: req.body.notes, // notes are handled by ProjectBNavigator, but ensure consistency
      summary: req.body.summary,
    };

    // Remove undefined values to avoid setting fields to undefined in MongoDB
    Object.keys(update).forEach(key => (update[key] === undefined || update[key] === '') && delete update[key]);

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: update }, // Use $set to update specific nested fields
      { new: true, runValidators: true, upsert: false } // upsert: false means don't create if not found
    );

    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    console.error("Error updating patient:", err); // Log the full error
    res.status(400).json({ error: err.message || 'Failed to update patient data' });
  }
});


// Update vital information (already present, ensuring it works with new schema)
app.put('/api/patients/:id/vitals', authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          temperature: req.body.temperature,
          respiratoryRate: req.body.respiratoryRate,
          oxygenSaturation: req.body.oxygenSaturation,
          jaundice: req.body.jaundice,
          feet: req.body.feet,
          weight: req.body.weight,
          visitDate: req.body.visitDate ? new Date(req.body.visitDate) : new Date()
        }
      },
      { new: true, runValidators: true }
    );
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get patient by UHI No or Name for chatbot
app.get('/api/chatbot/:identifier', async (req, res) => {
  try {
    const identifier = decodeURIComponent(req.params.identifier);
    const patient = await Patient.findOne({
      $or: [
        { patientName: identifier },
        { uhiNo: identifier }
      ]
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add or update parameter
app.post('/api/patients/:id/parameters', authenticateToken, async (req, res) => {
  try {
    const { parameterType, value, unit, date, appointmentDate } = req.body;
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const param = patient.parameters.find(p => p.type === parameterType);
    const newEntry = { value, unit, date: new Date(date), appointmentDate: appointmentDate ? new Date(appointmentDate) : undefined }; // Ensure dates are Date objects

    if (param) {
      param.values.push(newEntry);
    } else {
      patient.parameters.push({ type: parameterType, values: [newEntry] });
    }

    await patient.save();
    res.json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Get parameter data
app.get('/api/patients/:id/parameters/:type', authenticateToken, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const param = patient.parameters.find(p => p.type === req.params.type);
    res.json(param?.values || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  console.log('Health check API called');
  res.json({ status: 'ok', timestamp: new Date() });
});

app.post('/api/echo', (req, res) => {
  console.log('Echo API called with body:', req.body);
  res.json({ youSent: req.body });
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`✅ Server running at http://${LOCAL_IP}:${PORT}`);
});