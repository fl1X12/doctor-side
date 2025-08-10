// admin.js (No major changes needed, just confirming existing good practices)

import axios from 'axios';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage'; // For storing JWT
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import * as XLSX from 'xlsx';

// Define the custom color palette using the provided hex codes and derived shades
const colors = {
  lightBlue: '#A2D2FF',       // Main light blue
  veryLightBlue: '#BDE0FE',   // Very light blue for subtle accents
  lightPink: '#FFAFCC',       // Main light pink
  veryLightPink: '#FFC8DD',   // Very light pink for subtle accents
  lightPurple: '#CDB4DB',     // Light purple for accents/health score

  // Derived darker shades for text and icons based on user's latest code
  darkSlateText: '#1a202c',   // Similar to slate-800/900 for main text
  mediumSlateText: '#2D3748', // Similar to slate-700/600 for secondary text

  // Backgrounds from user's latest code
  mainBackgroundFrom: '#f8fafc', // from-slate-50
  mainBackgroundTo: '#f1f5f9',      // to-slate-100
  headerBackground: '#e2e8f0',      // A light grey for header (similar to slate-200)

  // Status indicators
  greenStatus: '#28a745', // Green for normal/absent
  yellowStatus: '#ffc107', // Yellow for mild/present (pallor)
  redStatus: '#dc3545',    // Red for severe/present (jaundice, edema)

  // Admin specific colors derived from patient-report scheme
  adminPrimary: '#2c3e7d', // A darker blue for primary actions/background
  adminAccent: '#A2D2FF', // Light blue for highlights
  adminDanger: '#ff4757', // Red for logout/destructive actions
  adminSuccess: '#28a745', // Green for success
  adminWarning: '#ffc107', // Yellow for warnings (e.g., in buttons)
  adminText: '#333', // General text color
  adminLightText: '#fff', // Light text for dark backgrounds
  adminBorder: '#e0e0e0', // Light border color
  adminBackground: '#f5f7fa', // Light background for login/forms
  adminCardBackground: '#ffffff', // White background for cards
};

const API_BASE_URL = 'http://10.226.222.219:5000/api';

// Create an Axios instance to attach the token automatically
const authAxios = axios.create({
  baseURL: API_BASE_URL,
});

authAxios.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token'); // << This correctly retrieves the token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // << This correctly attaches the token
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default function App() {
  const router = useRouter();

  // Admin login/signup state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [doctorName, setDoctorName] = useState(''); // Store logged in doctor's name
  const [isLoading, setIsLoading] = useState(false);
  const [isSignupMode, setIsSignupMode] = useState(false); // To toggle between login/signup
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorUsername, setNewDoctorUsername] = useState('');
  const [newDoctorPassword, setNewDoctorPassword] = useState('');


  // Hospital dashboard state
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedDepartment, setSelectedDepartment] = useState('obstetrics');
  const [vitalInfo, setVitalInfo] = useState({
    patientId: '',
    uhiNo: '',
    patientName: '',
    visitDate: new Date().toISOString().split('T')[0], // Default to today
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    jaundice: 'absent',
    feet: 'absent',
    weight: ''
  });

  // Patient data state
  const [appointmentData, setAppointmentData] = useState([]);
  const [completedPatients, setCompletedPatients] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);

  // Add patient form state
  const [newPatient, setNewPatient] = useState({
    uhiNo: '',
    patientName: '',
    redirection: 'obstetrics'
  });

  // Check login status on app load
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedDoctor = await AsyncStorage.getItem('doctorInfo');
        if (storedToken && storedDoctor) {
          const doctorInfo = JSON.parse(storedDoctor);
          // Optional: You might want to verify the token with the backend here
          // to ensure it's still valid, but for simplicity, we'll assume it is.
          setDoctorName(doctorInfo.name);
          setIsLoggedIn(true);
          // Call fetchPatients only after login status is confirmed and token loaded
          // The authAxios interceptor will handle providing the token.
          fetchPatients();
        }
      } catch (e) {
        console.error('Failed to load token or doctor info from storage', e);
      }
    };
    checkLoginStatus();
  }, []); // Dependency array is empty, so it runs once on mount.

  // Fetch patients from database
  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const response = await authAxios.get(`/patients/waiting`);
      setAppointmentData(response.data.map((patient, index) => ({
        ...patient,
        slNo: index + 1
      })));
    } catch (error) {
      console.error('Error fetching patients:', error);
      // If unauthorized, log out
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert('Session Expired', 'Please log in again.');
        handleLogout();
      } else {
        Alert.alert('Error', 'Failed to fetch patients');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch completed patients
  const fetchCompletedPatients = async () => {
    setIsLoading(true);
    try {
      const response = await authAxios.get(`/patients/completed`);
      setCompletedPatients(response.data.map((patient, index) => ({
        ...patient,
        slNo: index + 1
      })));
    } catch (error) {
      console.error('Error fetching completed patients:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert('Session Expired', 'Please log in again.');
        handleLogout();
      } else {
        Alert.alert('Error', 'Failed to fetch completed patients');
      }
    } finally {
      setIsLoading(false);
    }
  };


  // Admin login functions
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setIsLoading(true);

    try {
      // Use axios directly here as it's the login endpoint and doesn't need the token yet
      const response = await axios.post(`${API_BASE_URL}/doctors/login`, { username, password });
      const { token, doctor } = response.data;
      await AsyncStorage.setItem('token', token); // Store the token here
      await AsyncStorage.setItem('doctorInfo', JSON.stringify(doctor));
      setDoctorName(doctor.name);
      setIsLoggedIn(true);
      Alert.alert('Success', `Welcome ${doctor.name}!`);
      fetchPatients(); // Fetch patients immediately after login
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
      Alert.alert('Login Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!newDoctorUsername || !newDoctorPassword || !newDoctorName) {
      Alert.alert('Error', 'Please fill in all fields for registration.');
      return;
    }

    setIsLoading(true);

    try {
      // Use axios directly here as it's the signup endpoint and doesn't need the token yet
      await axios.post(`${API_BASE_URL}/doctors/signup`, {
        username: newDoctorUsername,
        password: newDoctorPassword,
        name: newDoctorName,
      });
      Alert.alert('Success', 'Doctor registered successfully! You can now log in.');
      setIsSignupMode(false); // Switch back to login mode
      setNewDoctorUsername('');
      setNewDoctorPassword('');
      setNewDoctorName('');
      setUsername(newDoctorUsername); // Pre-fill username for convenience
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
      Alert.alert('Registration Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('doctorInfo');
      setIsLoggedIn(false);
      setUsername('');
      setPassword('');
      setDoctorName('');
      setCurrentPage('dashboard'); // Reset page
      setAppointmentData([]); // Clear patient data
      setCompletedPatients([]); // Clear completed patient data
      setShowCompleted(false); // Reset view
    } catch (e) {
      console.error('Failed to clear storage on logout', e);
    }
  };

  // Add patient functions
  const handleAddPatient = () => {
    setCurrentPage('addPatient');
    setNewPatient({
      uhiNo: '',
      patientName: '',
      redirection: 'obstetrics'
    });
  };

  const handleUploadExcel = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true
      });

      if (result.canceled || !result.assets?.length) return;

      const fileUri = result.assets[0].uri;
      const b64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });

      const workbook = XLSX.read(b64, { type: 'base64' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      if (jsonData.length === 0) {
        Alert.alert('No data', 'The uploaded file is empty.');
        return;
      }

      const bulkData = jsonData
        .map(row => ({
          uhiNo: String(row.uhino || '').trim(),
          patientName: String(row.name || '').trim(),
          redirection: row.department?.toLowerCase() === 'gynecology' ? 'gynecology' : 'obstetrics',
          status: 'waiting'
        }))
        .filter(p => p.uhiNo && p.patientName);

      if (bulkData.length === 0) {
        Alert.alert('No Valid Data', 'No valid patient entries found in the Excel file.');
        return;
      }

      setIsLoading(true);

      const res = await authAxios.post(`/patients/bulk`, bulkData);

      if (res.status === 207) { // Partial success
        Alert.alert(
          'Upload Complete (with issues)',
          `✔️ ${res.data.insertedCount} added\n❌ ${res.data.failedCount} failed\nCheck console for details.`
        );
        console.warn('Bulk upload partial success details:', res.data.errors);
      } else {
        Alert.alert('Upload Complete', `✔️ ${res.data.insertedCount} patients added successfully!`);
      }
      fetchPatients();
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.error || 'An error occurred during upload.';
      Alert.alert('Upload Error', errorMessage);
      if (err.response?.status === 401 || err.response?.status === 403) {
        Alert.alert('Session Expired', 'Please log in again.');
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };


  // Save patient to database
  const handleSavePatient = async () => {
    if (!newPatient.uhiNo.trim() || !newPatient.patientName.trim()) {
      Alert.alert('Error', 'Please fill in UHI Number and Patient Name');
      return;
    }

    setIsLoading(true);

    try {
      await authAxios.post(`/patients`, {
        ...newPatient,
        uhiNo: newPatient.uhiNo.trim(),
        patientName: newPatient.patientName.trim(),
        status: 'waiting'
      });

      await fetchPatients();
      Alert.alert('Success', 'Patient added successfully!', [
        { text: 'OK', onPress: () => setCurrentPage('dashboard') }
      ]);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Something went wrong';
      Alert.alert('Error', errorMessage);
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert('Session Expired', 'Please log in again.');
        handleLogout();
      }
    } finally {
      setIsLoading(false);
      setNewPatient({
        uhiNo: '',
        patientName: '',
        redirection: 'obstetrics'
      });
    }
  };

  // Mark patient as completed
  const markPatientCompleted = async (patientId) => {
    try {
      await authAxios.put(`/patients/${patientId}/complete`);
      await fetchPatients();
      if (showCompleted) {
        await fetchCompletedPatients();
      }
      Alert.alert('Success', 'Patient marked as completed');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark patient as completed');
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert('Session Expired', 'Please log in again.');
        handleLogout();
      }
    }
  };

  const handleWebExcelUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) {
          Alert.alert('No data', 'The uploaded file is empty.');
          return;
        }

        const bulkData = jsonData
          .map(row => ({
            uhiNo: String(row.uhino || '').trim(),
            patientName: String(row.name || '').trim(),
            redirection: row.department?.toLowerCase() === 'gynecology' ? 'gynecology' : 'obstetrics',
            status: 'waiting'
          }))
          .filter(p => p.uhiNo && p.patientName);

        if (bulkData.length === 0) {
          Alert.alert('No Valid Data', 'No valid patient entries found in the Excel file.');
          return;
        }

        setIsLoading(true);

        const res = await authAxios.post(`/patients/bulk`, bulkData);

        if (res.status === 207) { // Partial success
          Alert.alert(
            'Upload Complete (with issues)',
            `✔️ ${res.data.insertedCount} added\n❌ ${res.data.failedCount} failed\nCheck console for details.`
          );
          console.warn('Bulk upload partial success details:', res.data.errors);
        } else {
          Alert.alert('Upload Complete', `✔️ ${res.data.insertedCount} patients added successfully!`);
        }
        fetchPatients();
      } catch (err) {
        console.error('Excel parsing/upload failed:', err);
        const errorMessage = err.response?.data?.error || 'Failed to read or upload Excel file';
        Alert.alert('Error', errorMessage);
        if (err.response?.status === 401 || err.response?.status === 403) {
          Alert.alert('Session Expired', 'Please log in again.');
          handleLogout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };


  const handleCancelAddPatient = () => {
    setCurrentPage('dashboard');
    setNewPatient({
      uhiNo: '',
      patientName: '',
      redirection: 'obstetrics'
    });
  };

  // Toggle between waiting and completed patients
  const toggleCompletedView = () => {
    setShowCompleted(!showCompleted);
    if (!showCompleted) {
      fetchCompletedPatients();
    } else {
      fetchPatients(); // Go back to waiting patients
    }
  };

  const handleSaveVitalInfo = async () => {
    if (!vitalInfo.temperature || !vitalInfo.respiratoryRate ||
      !vitalInfo.oxygenSaturation || !vitalInfo.weight) {
      Alert.alert('Error', 'Please fill in all vital information fields');
      return;
    }

    setIsLoading(true);

    try {
      await authAxios.put(`/patients/${vitalInfo.patientId}/vitals`, vitalInfo);

      // Show success alert and navigate to dashboard when OK is pressed
      Alert.alert('Success', 'Vital information saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setCurrentPage('dashboard');
            fetchPatients();
          }
        }
      ]);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to save vital information';
      Alert.alert('Error', errorMessage);
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert('Session Expired', 'Please log in again.');
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Admin Login/Signup Screen
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <View style={styles.loginBox}>
          <Text style={styles.loginTitle}>{isSignupMode ? 'Doctor Signup' : 'Admin Login'}</Text>
          <Text style={styles.loginSubtitle}>
            {isSignupMode ? 'Create a new doctor account' : 'Enter your credentials'}
          </Text>

          {isSignupMode && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                value={newDoctorName}
                onChangeText={setNewDoctorName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={isSignupMode ? newDoctorUsername : username}
              onChangeText={isSignupMode ? setNewDoctorUsername : setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={isSignupMode ? newDoctorPassword : password}
              onChangeText={isSignupMode ? setNewDoctorPassword : setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={isSignupMode ? handleSignup : handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.adminLightText} />
            ) : (
              <Text style={styles.loginButtonText}>{isSignupMode ? 'Sign Up' : 'Login'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleAuthModeButton}
            onPress={() => setIsSignupMode(!isSignupMode)}
            disabled={isLoading}
          >
            <Text style={styles.toggleAuthModeButtonText}>
              {isSignupMode ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Add Patient Page
  if (currentPage === 'addPatient') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.detailsContainer}>
          <View style={styles.detailsHeader}>
            <TouchableOpacity style={styles.backButton} onPress={handleCancelAddPatient}>
              <Text style={styles.backButtonText}>← Back to Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButtonSmall} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Add Patient Details</Text>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>UHI Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter UHI Number"
                  value={newPatient.uhiNo}
                  onChangeText={(text) => setNewPatient(prev => ({ ...prev, uhiNo: text }))}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Patient Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Patient Name"
                  value={newPatient.patientName}
                  onChangeText={(text) => setNewPatient(prev => ({ ...prev, patientName: text }))}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Department *</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={[styles.dropdownButton, newPatient.redirection === 'obstetrics' && styles.dropdownSelected]}
                    onPress={() => setNewPatient(prev => ({ ...prev, redirection: 'obstetrics' }))}
                  >
                    <View style={styles.radioOption}>
                      <View style={[styles.radioButton, newPatient.redirection === 'obstetrics' && styles.radioButtonSelected]}>
                        {newPatient.redirection === 'obstetrics' && <View style={styles.radioButtonInner} />}
                      </View>
                      <Text style={styles.radioText}>Obstetrics</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.dropdownButton, newPatient.redirection === 'gynecology' && styles.dropdownSelected]}
                    onPress={() => setNewPatient(prev => ({ ...prev, redirection: 'gynecology' }))}
                  >
                    <View style={styles.radioOption}>
                      <View style={[styles.radioButton, newPatient.redirection === 'gynecology' && styles.radioButtonSelected]}>
                        {newPatient.redirection === 'gynecology' && <View style={styles.radioButtonInner} />}
                      </View>
                      <Text style={styles.radioText}>Gynecology</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancelAddPatient}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveButton, isLoading && styles.buttonDisabled]}
                  onPress={handleSavePatient}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.adminLightText} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Patient</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Vital Info Page
  if (currentPage === 'vitalInfo') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.detailsContainer}>
          <View style={styles.detailsHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentPage('dashboard')}>
              <Text style={styles.backButtonText}>← Back to Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButtonSmall} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Vital Information</Text>
            <Text style={styles.patientInfo}>{vitalInfo.patientName} (UHI: {vitalInfo.uhiNo})</Text>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Visit Date *</Text>
                <TextInput
                  style={styles.input}
                  value={vitalInfo.visitDate}
                  onChangeText={(text) => setVitalInfo(prev => ({ ...prev, visitDate: text }))}
                  placeholder="YYYY-MM-DD"
                  // You might want to use a DatePicker component for better UX
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Temperature (°F) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter temperature"
                  value={vitalInfo.temperature}
                  onChangeText={(text) => setVitalInfo(prev => ({ ...prev, temperature: text }))}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Respiratory Rate (breaths/min) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter respiratory rate"
                  value={vitalInfo.respiratoryRate}
                  onChangeText={(text) => setVitalInfo(prev => ({ ...prev, respiratoryRate: text }))}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Oxygen Saturation (%) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter oxygen saturation"
                  value={vitalInfo.oxygenSaturation}
                  onChangeText={(text) => setVitalInfo(prev => ({ ...prev, oxygenSaturation: text }))}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Jaundice *</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={[styles.dropdownButton, vitalInfo.jaundice === 'absent' && styles.dropdownSelected]}
                    onPress={() => setVitalInfo(prev => ({ ...prev, jaundice: 'absent' }))}
                  >
                    <View style={styles.radioOption}>
                      <View style={[styles.radioButton, vitalInfo.jaundice === 'absent' && styles.radioButtonSelected]}>
                        {vitalInfo.jaundice === 'absent' && <View style={styles.radioButtonInner} />}
                      </View>
                      <Text style={styles.radioText}>Absent</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.dropdownButton, vitalInfo.jaundice === 'mild' && styles.dropdownSelected]}
                    onPress={() => setVitalInfo(prev => ({ ...prev, jaundice: 'mild' }))}
                  >
                    <View style={styles.radioOption}>
                      <View style={[styles.radioButton, vitalInfo.jaundice === 'mild' && styles.radioButtonSelected]}>
                        {vitalInfo.jaundice === 'mild' && <View style={styles.radioButtonInner} />}
                      </View>
                      <Text style={styles.radioText}>Mild</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.dropdownButton, vitalInfo.jaundice === 'severe' && styles.dropdownSelected]}
                    onPress={() => setVitalInfo(prev => ({ ...prev, jaundice: 'severe' }))}
                  >
                    <View style={styles.radioOption}>
                      <View style={[styles.radioButton, vitalInfo.jaundice === 'severe' && styles.radioButtonSelected]}>
                        {vitalInfo.jaundice === 'severe' && <View style={styles.radioButtonInner} />}
                      </View>
                      <Text style={styles.radioText}>Severe</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Feet (Edema) *</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={[styles.dropdownButton, vitalInfo.feet === 'absent' && styles.dropdownSelected]}
                    onPress={() => setVitalInfo(prev => ({ ...prev, feet: 'absent' }))}
                  >
                    <View style={styles.radioOption}>
                      <View style={[styles.radioButton, vitalInfo.feet === 'absent' && styles.radioButtonSelected]}>
                        {vitalInfo.feet === 'absent' && <View style={styles.radioButtonInner} />}
                      </View>
                      <Text style={styles.radioText}>Absent</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.dropdownButton, vitalInfo.feet === 'mild' && styles.dropdownSelected]}
                    onPress={() => setVitalInfo(prev => ({ ...prev, feet: 'mild' }))}
                  >
                    <View style={styles.radioOption}>
                      <View style={[styles.radioButton, vitalInfo.feet === 'mild' && styles.radioButtonSelected]}>
                        {vitalInfo.feet === 'mild' && <View style={styles.radioButtonInner} />}
                      </View>
                      <Text style={styles.radioText}>Mild</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.dropdownButton, vitalInfo.feet === 'severe' && styles.dropdownSelected]}
                    onPress={() => setVitalInfo(prev => ({ ...prev, feet: 'severe' }))}
                  >
                    <View style={styles.radioOption}>
                      <View style={[styles.radioButton, vitalInfo.feet === 'severe' && styles.radioButtonSelected]}>
                        {vitalInfo.feet === 'severe' && <View style={styles.radioButtonInner} />}
                      </View>
                      <Text style={styles.radioText}>Severe</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Weight (kg) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter weight"
                  value={vitalInfo.weight}
                  onChangeText={(text) => setVitalInfo(prev => ({ ...prev, weight: text }))}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setCurrentPage('dashboard')}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveButton, isLoading && styles.buttonDisabled]}
                  onPress={handleSaveVitalInfo}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.adminLightText} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Vital Info</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }


  // Hospital Dashboard
  return (
    <ScrollView style={styles.container}>
      {/* Top Bar with Logout */}
      <View style={styles.topBar}>
        <View style={styles.leftPinkBox} />
        <TextInput
          style={styles.searchBarSmall}
          placeholder="Search..."
          placeholderTextColor={colors.mediumSlateText}
        />

        {/* Radio Buttons in Header */}
        <View style={styles.headerRadioContainer}>
          <TouchableOpacity
            style={styles.headerRadioOption}
            onPress={() => setSelectedDepartment('obstetrics')}
          >
            <View style={[styles.headerRadioButton, selectedDepartment === 'obstetrics' && styles.headerRadioButtonSelected]}>
              {selectedDepartment === 'obstetrics' && <View style={styles.headerRadioButtonInner} />}
            </View>
            <Text style={styles.headerRadioText}>Obstetrics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerRadioOption}
            onPress={() => setSelectedDepartment('gynecology')}
          >
            <View style={[styles.headerRadioButton, selectedDepartment === 'gynecology' && styles.headerRadioButtonSelected]}>
              {selectedDepartment === 'gynecology' && <View style={styles.headerRadioButtonInner} />}
            </View>
            <Text style={styles.headerRadioText}>Gynecology</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.iconGroup}>
          <Text style={styles.welcomeText}>Dr. {doctorName}</Text>
          <TouchableOpacity style={styles.logoutButtonSmall} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* White Center Box */}
      <View style={styles.centerWhiteBox} />

      {/* Content Area */}
      <View style={styles.contentArea}>
        {/* Left: Appointments Table */}
        <View style={styles.leftPanel}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {showCompleted ? 'Completed Appointments' : 'Current Appointments'}
            </Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={toggleCompletedView}
              >
                <Text style={styles.toggleButtonText}>
                  {showCompleted ? 'Show Waiting' : 'Show Completed'}
                </Text>
              </TouchableOpacity>

              {!showCompleted && (
                <>
                  <TouchableOpacity style={styles.addPatientButton} onPress={handleAddPatient}>
                    <Text style={styles.addPatientButtonText}>+ Add Patient</Text>
                  </TouchableOpacity>

                  {/* 📁 Upload Excel (Web only) */}
                  {Platform.OS === 'web' && (
                    <label htmlFor="excel-upload" style={styles.uploadExcelLabel}>
                      📁 Upload Excel
                      <input
                        id="excel-upload"
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleWebExcelUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </>
              )}
            </View>

          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Sl.No</Text>
              <Text style={styles.headerCell}>UHI No</Text>
              <Text style={styles.headerCell}>Patient Name</Text>
              <Text style={styles.headerCell}>Redirection</Text>
              {!showCompleted && <Text style={styles.headerCell}>Action</Text>}
            </View>

            {showCompleted ? (
              completedPatients.length === 0 ? (
                <View style={styles.emptyTableRow}>
                  <Text style={styles.emptyTableText}>No completed patients found.</Text>
                </View>
              ) : (
                completedPatients.map((rowData, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.tableRow}
                    onPress={() => router.push({
                      pathname: '/patient-report', // Route to the new patient report screen
                      params: { uhiNo: rowData.uhiNo, name: rowData.patientName }, // Pass UHI No and Name
                    })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.tableCell}>{rowData.slNo}</Text>
                    <Text style={styles.tableCell}>{rowData.uhiNo}</Text>
                    <Text style={styles.tableCell}>{rowData.patientName}</Text>
                    <Text style={styles.tableCell}>{rowData.redirection || '-'}</Text>
                  </TouchableOpacity>
                ))
              )
            ) : appointmentData.length === 0 ? (
              <View style={styles.emptyTableRow}>
                <Text style={styles.emptyTableText}>No patients added yet. Click Add Patient to get started.</Text>
              </View>
            ) : (
              appointmentData.map((rowData, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tableRow}
                  onPress={() => router.push({
                    pathname: '/patient', // Route to the new patient report screen
                    params: { uhiNo: rowData.uhiNo, name: rowData.patientName }, // Pass UHI No and Name
                  })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tableCell}>{rowData.slNo}</Text>
                  <Text style={styles.tableCell}>{rowData.uhiNo}</Text>
                  <Text style={styles.tableCell}>{rowData.patientName}</Text>
                  <Text style={styles.tableCell}>{rowData.redirection || '-'}</Text>
                  <View style={styles.actionButtonsContainer}> {/* New container for action buttons */}
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        markPatientCompleted(rowData._id);
                      }}
                    >
                      <Text style={styles.completeButtonText}>Complete</Text>
                    </TouchableOpacity>
                    {/* NEW OVERVIEW BUTTON */}
                    <TouchableOpacity
                      style={styles.overviewButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push({
                          pathname: '/patient-report', // This should match your new screen's route
                          params: {
                            uhiNo: rowData.uhiNo, // Pass UHI No
                            name: rowData.patientName // Pass Patient Name
                          },
                        });
                      }}
                    >
                      <Text style={styles.overviewButtonText}>Overview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.vitalButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        setVitalInfo({
                          patientId: rowData._id,
                          uhiNo: rowData.uhiNo,
                          patientName: rowData.patientName,
                          visitDate: rowData.visitDate ? new Date(rowData.visitDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], // Pre-fill if exists
                          temperature: rowData.temperature || '',
                          respiratoryRate: rowData.respiratoryRate || '',
                          oxygenSaturation: rowData.oxygenSaturation || '',
                          jaundice: rowData.jaundice || 'absent',
                          feet: rowData.feet || 'absent',
                          weight: rowData.weight || ''
                        });
                        setCurrentPage('vitalInfo');
                      }}
                    >
                      <Text style={styles.vitalButtonText}>Vital Info</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Right: Stats Cards */}
        <View style={styles.rightPanel}>
          {/* Patients Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderText}>Patients</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.patientRow}>
                <View style={styles.patientSection}>
                  <Text style={styles.sectionLabel}>OPD</Text>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Waiting</Text>
                    <Text style={styles.statValue}>{appointmentData.length}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Completed</Text>
                    <Text style={styles.statValue}>{completedPatients.length}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.patientSection}>
                  <Text style={styles.sectionLabel}>IPD</Text>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Total</Text>
                    <Text style={styles.statValue}>0</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Referrals Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderText}>Referrals</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.referralRow}>
                <View style={styles.referralSection}>
                  <Text style={styles.sectionLabel}>OPD</Text>
                  <Text style={styles.referralValue}>0</Text>
                  <Text style={styles.referralLabel}>New</Text>
                </View>
                <View style={styles.referralSection}>
                  <Text style={styles.sectionLabel}>IPD</Text>
                  <Text style={styles.referralValue}>0</Text>
                  <Text style={styles.referralLabel}>Received</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Critical Referrals Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderText}>Critical Referrals</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.criticalRow}>
                <Text style={styles.criticalValue}>0</Text>
                <Text style={styles.criticalValue}>0</Text>
              </View>
              <View style={styles.criticalRow}>
                <Text style={styles.criticalLabel}>Sent</Text>
                <Text style={styles.criticalLabel}>Received</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  uploadExcelLabel: {
    backgroundColor: "#2D3748",
    paddingHorizontal: 16,
    paddingVertical: 8, // Adjusted to match other buttons
    borderRadius: 6,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.adminLightText,
    // These styles are for web, will be ignored by native
    cursor: 'pointer',
    display: 'inline-block',
    textAlign: 'center',
    userSelect: 'none'
  },
  // Login Styles
  uploadLabel: {
    backgroundColor: colors.lightBlue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    color: colors.adminLightText,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
    // These styles are for web, will be ignored by native
    cursor: 'pointer',
    display: 'inline-block'
  },
  excelUploadButton: {
    backgroundColor: colors.greenStatus,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  excelUploadButtonText: {
    color: colors.adminLightText,
    fontSize: 14,
    fontWeight: '500',
  },
  loginContainer: {
    flex: 1,
    backgroundColor: colors.adminBackground,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  loginBox: {
    backgroundColor: colors.adminCardBackground,
    padding: 30,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: colors.adminPrimary,
  },
  loginSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: colors.mediumSlateText,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: colors.mainBackgroundFrom,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.adminBorder,
  },
  inputDisabled: {
    backgroundColor: '#e9ecef',
    color: colors.mediumSlateText,
  },
  loginButton: {
    backgroundColor: colors.adminPrimary,
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  loginButtonText: {
    color: colors.adminLightText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  demoText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    color: colors.mediumSlateText,
  },
  toggleAuthModeButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleAuthModeButtonText: {
    color: colors.adminPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Hospital Dashboard Styles
  container: {
    flex: 1,
    backgroundColor: colors.mainBackgroundFrom,
  },
  topBar: {
    backgroundColor: colors.adminPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    height: 60,
  },
  leftPinkBox: {
    width: 70,
    height: 28,
    backgroundColor: colors.lightPink,
    borderRadius: 4,
    marginRight: 15,
  },
  searchBarSmall: {
    width: 180,
    backgroundColor: colors.adminCardBackground,
    height: 36,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 14,
    marginRight: 15,
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 'auto',
  },
  welcomeText: {
    color: colors.adminLightText,
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButtonSmall: {
    backgroundColor: colors.adminDanger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  logoutButtonText: {
    color: colors.adminLightText,
    fontSize: 12,
    fontWeight: '600',
  },
  centerWhiteBox: {
    height: 80,
    backgroundColor: colors.adminCardBackground,
    margin: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.veryLightBlue,
  },
  contentArea: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 20,
  },
  leftPanel: {
    flex: 3,
    backgroundColor: colors.adminCardBackground,
    borderRadius: 8,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.adminText,
  },
  addPatientButton: {
    backgroundColor: "#2D3748",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addPatientButtonText: {
    color: colors.adminLightText,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButton: {
    backgroundColor: colors.mediumSlateText,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  toggleButtonText: {
    color: colors.adminLightText,
    fontSize: 12,
    fontWeight: '600',
  },
  table: {
    borderWidth: 1,
    borderColor: colors.adminBorder,
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.mainBackgroundTo,
    borderBottomWidth: 1,
    borderBottomColor: colors.adminBorder,
    paddingVertical: 10,
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 12,
    color: colors.mediumSlateText,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
    backgroundColor: colors.adminCardBackground,
    alignItems: 'center',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: colors.adminText,
  },
  patientNameLink: {
    color: colors.adminPrimary,
    textDecorationLine: 'underline',
  },
  emptyTableRow: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableText: {
    fontSize: 14,
    color: colors.mediumSlateText,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  rightPanel: {
    flex: 1,
    gap: 15,
  },
  card: {
    backgroundColor: colors.adminCardBackground,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: colors.lightPink, // Using lightPink for card headers
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cardHeaderText: {
    color: colors.adminText,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  cardContent: {
    padding: 12,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  patientSection: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: colors.adminBorder,
    marginHorizontal: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mediumSlateText,
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.mediumSlateText,
  },
  statValue: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.adminText,
  },
  referralSection: {
    alignItems: 'center',
    flex: 1,
  },
  referralRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  referralValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.adminText,
    marginVertical: 4,
  },
  referralLabel: {
    fontSize: 11,
    color: colors.mediumSlateText,
  },
  criticalRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  criticalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.adminText,
    textAlign: 'center',
  },
  criticalLabel: {
    fontSize: 11,
    color: colors.mediumSlateText,
    textAlign: 'center',
  },
  // Details page styles
  detailsContainer: {
    padding: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.adminPrimary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
  },
  backButtonText: {
    color: colors.adminLightText,
    fontSize: 14,
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: colors.adminCardBackground,
    borderRadius: 8,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.adminText,
    marginBottom: 20,
    textAlign: 'center',
  },
  detailsContent: {
    gap: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mediumSlateText,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: colors.adminText,
    flex: 1,
    textAlign: 'right',
  },
  // Radio button styles
  headerRadioContainer: {
    flexDirection: 'row',
    gap: 20,
    marginRight: 15,
  },
  headerRadioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerRadioButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.adminLightText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRadioButtonSelected: {
    borderColor: colors.adminLightText,
  },
  headerRadioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.adminLightText,
  },
  headerRadioText: {
    fontSize: 12,
    color: colors.adminLightText,
    fontWeight: '500',
  },
  // Add Patient Form Styles
  formContainer: {
    gap: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.adminText,
    marginBottom: 8,
  },
  dropdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dropdownButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.adminBorder,
    borderRadius: 8,
  },
  dropdownSelected: {
    borderColor: colors.adminPrimary,
    backgroundColor: colors.veryLightBlue,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.mediumSlateText,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.adminPrimary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.adminPrimary,
  },
  radioText: {
    fontSize: 14,
    color: colors.adminText,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.mediumSlateText,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.adminLightText,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.adminSuccess,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.adminLightText,
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: colors.adminSuccess,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  completeButtonText: {
    color: colors.adminLightText,
    fontSize: 12,
  },
  // NEW STYLES FOR OVERVIEW BUTTON AND ACTION BUTTONS CONTAINER
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // Align buttons to the right
    flex: 1, // Allow this container to take available space
    paddingRight: 10, // Add some padding to the right
    gap: 5, // Space between buttons
  },
  overviewButton: {
    backgroundColor: colors.lightBlue, // A standard blue for overview
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  overviewButtonText: {
    color: colors.adminLightText,
    fontSize: 12,
  },
  vitalButton: {
    backgroundColor: colors.lightPurple,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  vitalButtonText: {
    color: colors.adminLightText,
    fontSize: 12,
  },

  // Add patient info style for vital page
  patientInfo: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.adminText,
    textAlign: 'center',
    marginBottom: 20,
  },
});