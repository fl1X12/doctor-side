import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Button } from 'react-native-paper';

import NoteEditor from '../../components/note-editor/NoteEditor';
import colors from '../../constants/Colors';


const API_BASE_URL = 'http://10.226.222.219:5000/api';

// Create an Axios instance
const authAxios = axios.create({
  baseURL: API_BASE_URL,
});

// Use a separate function to get the router instance for the interceptor
let appRouter;
const setAppRouter = (router) => {
  appRouter = router;
};

// Request Interceptor: Attaches the JWT token to every outgoing request
authAxios.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handles global errors, like session expiry
authAxios.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    // Check if the error is an authentication error
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      Alert.alert('Session Expired', 'Please log in again.');
      // Use the globally set router to navigate
      if (appRouter) {
        appRouter.replace('/(tabs)/admin');
      }
    }
    // Reject the promise to allow local catch blocks to handle other errors
    return Promise.reject(error);
  }
);


export default function PatientPage() {
  const { name, uhiNo } = useLocalSearchParams();
  const router = useRouter();

  // Set the global router instance when the component mounts
  useEffect(() => {
    setAppRouter(router);
  }, [router]);

  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth >= 768;

  const [selectedParameter, setSelectedParameter] = useState('Blood Pressure');
  const [currentValue, setCurrentValue] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [parameterData, setParameterData] = useState([]);
  const [formData, setFormData] = useState({
    details: {},
    analysis: {},
    maternalHealth: {},
    previousBaby: {},
    familyHistory: {},
    notes: '',
    summary: '',
  });

  // State for DatePickers visibility
  const [showLMPDatePicker, setShowLMPDatePicker] = useState(false);
  const [showDueDateDatePicker, setShowDueDateDatePicker] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');

  const parameters = ['Blood Pressure', 'Hemoglobin', 'AFI', 'Weight', 'Glucose', 'Heart Rate'];

  // Helper function to format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    if (Platform.OS === 'web') {
      return date.toISOString().split('T')[0];
    }
    return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // --- Date Picker onChange Handlers ---
  const onLMPChange = (event, selectedDate) => {
    setShowLMPDatePicker(false);
    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        details: { ...prev.details, lmp: selectedDate.toISOString() },
      }));
    }
  };

  const onDueDateChange = (event, selectedDate) => {
    setShowDueDateDatePicker(false);
    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        maternalHealth: { ...prev.maternalHealth, dueDate: selectedDate.toISOString() },
      }));
    }
  };

  // Fetch patient data
  useEffect(() => {
    const fetchPatientData = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get(`/patients/${name}`);
        setPatientData(response.data);
        setFormData({
          details: response.data.details || {},
          analysis: response.data.analysis || {},
          maternalHealth: response.data.maternalHealth || {},
          previousBaby: response.data.previousBaby || {},
          familyHistory: response.data.familyHistory || {},
          notes: response.data.notes || '',
          summary: response.data.summary || '',
        });
      } catch (error) {
        // Auth errors are handled by the interceptor. Only handle other errors here.
        if (!error.response || (error.response.status !== 401 && error.response.status !== 403)) {
          console.error('Error fetching patient data:', error);
          Alert.alert('Error', 'Failed to load patient data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [name]);


  // Fetch parameter data whenever selectedParameter changes
  useEffect(() => {
    if (patientData) {
      fetchParameterData();
    }
  }, [selectedParameter, patientData]);

  // Fetch parameter data for selected parameter
  const fetchParameterData = async () => {
    if (!patientData) return;
    try {
      const response = await authAxios.get(`/patients/${patientData._id}/parameters/${selectedParameter}`);
      setParameterData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      if (!error.response || (error.response.status !== 401 && error.response.status !== 403)) {
        console.error('Error fetching parameter data:', error);
        setParameterData([]);
      }
    }
  };

  const handleTranscriptionComplete = (text) => {
    const newText = text.replace(/^Transcription:\n\n/, '');
    setTranscribedText((prevText) => (prevText ? `${prevText}\n${newText}`.trim() : newText.trim()));
  };

  // Save patient data to database
  const handleSubmit = async () => {
    if (!patientData) {
      await createNewPatient();
    } else {
      await savePatientData();
    }
  };

  const savePatientData = async () => {
    try {
      const response = await authAxios.put(`/patients/${patientData._id}`, formData);
      setPatientData(response.data);
      Alert.alert('Success', 'Patient data saved successfully');
    } catch (error) {
      if (!error.response || (error.response.status !== 401 && error.response.status !== 403)) {
        console.error('Error saving patient data:', error);
        Alert.alert('Error', 'Failed to save patient data');
      }
    }
  };

  // Create new patient
  const createNewPatient = async () => {
    try {
      const response = await authAxios.post(`/patients`, { ...formData, patientName: name, uhiNo });
      setPatientData(response.data);
      Alert.alert('Success', 'New patient created successfully');
    } catch (error) {
      if (!error.response || (error.response.status !== 401 && error.response.status !== 403)) {
        console.error('Error creating patient:', error);
        Alert.alert('Error', error.response?.data?.error || 'Failed to create patient');
      }
    }
  };


  // Add parameter measurement
  const addParameterMeasurement = async () => {
    if (!currentValue.trim()) return Alert.alert('Error', 'Please enter a value');
    if (!patientData) return Alert.alert('Error', 'Please save patient data first');

    try {
      let value;
      let unit = '';

      switch (selectedParameter) {
        case 'Blood Pressure':
          const bpParts = currentValue.split('/');
          if (bpParts.length !== 2) throw new Error('Invalid blood pressure format. Use "120/80"');
          const systolic = parseInt(bpParts[0], 10);
          const diastolic = parseInt(bpParts[1], 10);
          if (isNaN(systolic) || isNaN(diastolic)) throw new Error('Invalid blood pressure values');
          value = { systolic, diastolic };
          unit = 'mmHg';
          break;
        case 'Hemoglobin':
        case 'AFI':
        case 'Weight':
        case 'Glucose':
          value = parseFloat(currentValue);
          if (isNaN(value)) throw new Error('Please enter a valid number');
          if (selectedParameter === 'Hemoglobin') unit = 'g/dL';
          if (selectedParameter === 'AFI') unit = 'cm';
          if (selectedParameter === 'Weight') unit = 'kg';
          if (selectedParameter === 'Glucose') unit = 'mg/dL';
          break;
        case 'Heart Rate':
          value = parseInt(currentValue, 10);
          if (isNaN(value)) throw new Error('Please enter a valid number');
          unit = 'bpm';
          break;
        default:
          value = parseFloat(currentValue);
          if (isNaN(value)) throw new Error('Please enter a valid number');
      }

      await authAxios.post(`/patients/${patientData._id}/parameters`, {
        parameterType: selectedParameter,
        value,
        unit,
        date: new Date().toISOString(),
        appointmentDate: new Date().toISOString(),
      });

      setCurrentValue('');
      await fetchParameterData();
      Alert.alert('Success', 'Measurement added successfully');
    } catch (error) {
      if (!error.response || (error.response.status !== 401 && error.response.status !== 403)) {
        console.error('Error adding parameter:', error);
        Alert.alert('Error', error.message || 'Failed to add measurement');
      }
    }
  };

  // Prepare chart data
  const getChartData = () => {
    if (!Array.isArray(parameterData) || parameterData.length === 0) return null;
    const sortedData = [...parameterData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sortedData.map((item) => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    let chartValues = selectedParameter === 'Blood Pressure'
      ? sortedData.map((item) => item.value?.systolic || 0)
      : sortedData.map((item) => (typeof item.value === 'number' ? item.value : 0));
    return {
      labels: labels.length > 6 ? labels.slice(-6) : labels,
      datasets: [{ data: chartValues.length > 6 ? chartValues.slice(-6) : chartValues }],
    };
  };

  // Render chart
  const renderChart = () => {
  const chartData = getChartData();

  if (!chartData) {
    return (
      <View style={styles.chartPlaceholder}>
        <Text style={styles.placeholderText}>No data available for {selectedParameter}</Text>
        <Text style={styles.placeholderSubtext}>Add measurements to see trends</Text>
      </View>
    );
  }

  return (
    <View style={styles.chartWrapper}>
      <LineChart
        data={chartData}
        width={screenWidth - 60}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chartStyle}
      />

      {/* Values Table */}
      <View style={styles.valuesTable}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Date</Text>
          <Text style={styles.tableHeaderText}>Value</Text>
          {selectedParameter === 'Blood Pressure' && (
            <Text style={styles.tableHeaderText}>Diastolic</Text>
          )}
          <Text style={styles.tableHeaderText}>Unit</Text>
        </View>

        {parameterData.slice(-5).reverse().map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCell}>
              {new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: '2-digit',
              })}
            </Text>
            
            {/* ==================== THE FIX IS HERE ==================== */}
            <Text style={styles.tableCell}>
              {/*
                Check if the value is an object (for Blood Pressure) before rendering.
                This prevents the race condition.
              */}
              {typeof item.value === 'object' && item.value !== null
                ? item.value.systolic
                : item.value}
            </Text>
            {/* ========================================================= */}

            {selectedParameter === 'Blood Pressure' && (
              <Text style={styles.tableCell}>{item.value.diastolic}</Text>
            )}
            <Text style={styles.tableCell}>{item.unit || ''}</Text>
          </View>
        ))}
      </View>
    </View>
  );
  };

  // Reusable Input Components
  const LabeledInput = ({ label, section, field, placeholder = '', keyboardType = 'default', multiline = false, numberOfLines = 1 }) => {
    const value = formData?.[section]?.[field]?.toString() || '';
    return (
      <View style={styles.labeledInputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          style={[styles.labeledInput, multiline && styles.multilineInput]}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={(text) => setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: text } }))}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    );
  };
  const RadioButtonInput = ({ label, section, field, options }) => {
    const selectedOption = formData?.[section]?.[field];
    return (
      <View style={styles.labeledInputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.radioGroup}>
          {options.map((option) => (
            <TouchableOpacity key={option.value} style={styles.radioOption} onPress={() => setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: option.value } }))}>
              <View style={styles.radioButton}>{selectedOption === option.value && <View style={styles.radioButtonInner} />}</View>
              <Text style={styles.radioText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };
  const DropdownInput = ({ label, section, field, options, placeholder }) => {
    const selectedValue = formData?.[section]?.[field];
    const [isPickerVisible, setPickerVisible] = useState(false);
    const handleValueChange = (itemValue) => {
      setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: itemValue } }));
      setPickerVisible(false);
    };
    if (Platform.OS === 'web') {
      return (
        <View style={styles.labeledInputContainer}>
          <Text style={styles.inputLabel}>{label}</Text>
          <select style={styles.webSelect} value={selectedValue || ''} onChange={(e) => handleValueChange(e.target.value)}>
            <option value="" disabled>{placeholder}</option>
            {options.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
          </select>
        </View>
      );
    }
    return (
      <View style={styles.labeledInputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={() => setPickerVisible(!isPickerVisible)}>
          <Text style={styles.dropdownButtonText}>{selectedValue || placeholder}</Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
        {isPickerVisible && (
          <View style={styles.dropdownOptionsContainer}>
            {options.map((option) => (
              <TouchableOpacity key={option.value} style={styles.dropdownOption} onPress={() => handleValueChange(option.value)}>
                <Text style={styles.dropdownOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.darkBlue} />
        <Text style={styles.loadingText}>Loading patient data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.topBar}>
        <Button mode="contained" style={styles.leftPinkBox} onPress={() => router.push('/(tabs)/admin')}>ADMIN</Button>
        <TextInput style={styles.searchBar} placeholder="Search patient..." placeholderTextColor="#999" />
        <TouchableOpacity style={styles.reportButton} onPress={() => router.push(`/patient-report?name=${name}&uhiNo=${uhiNo}`)}>
          <Text style={styles.reportButtonText}>View Full Report</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {/* Patient Details, General Analysis, Maternal Health */}
        <View style={[styles.topRow, isTablet && styles.tabletTopRow]}>
          <View style={styles.topBox}>
            <Text style={styles.sectionTitle}>Patient Details</Text>
            <View style={styles.inputContainer}>
              <View style={styles.labeledInputContainer}><Text style={styles.inputLabel}>Name:</Text><Text style={styles.staticText}>{name}</Text></View>
              <LabeledInput label="Age:" section="details" field="age" placeholder="Enter age" keyboardType="numeric" />
              <RadioButtonInput label="Gender:" section="details" field="gender" options={[{ label: 'Male', value: 'Male' }, { label: 'Female', value: 'Female' }, { label: 'Other', value: 'Other' }]} />
              <DropdownInput label="Blood Group:" section="details" field="bloodGroup" placeholder="Select Blood Group" options={[{ label: 'A+', value: 'A+' }, { label: 'A-', value: 'A-' }, { label: 'B+', value: 'B+' }, { label: 'B-', value: 'B-' }, { label: 'AB+', value: 'AB+' }, { label: 'AB-', value: 'AB-' }, { label: 'O+', value: 'O+' }, { label: 'O-', value: 'O-' }]} />
              <LabeledInput label="Phone:" section="details" field="phone" placeholder="Enter phone number" keyboardType="phone-pad" />
              <View style={styles.labeledInputContainer}>
                <Text style={styles.inputLabel}>LMP:</Text>
                <TouchableOpacity style={styles.labeledInput} onPress={() => setShowLMPDatePicker(true)}><Text>{formatDateForDisplay(formData.details.lmp) || 'Select Date'}</Text></TouchableOpacity>
              </View>
              {showLMPDatePicker && <DateTimePicker value={formData.details.lmp ? new Date(formData.details.lmp) : new Date()} mode="date" display="default" onChange={onLMPChange} maximumDate={new Date()} />}
              <LabeledInput label="OP/IP no:" section="details" field="opIpNo" placeholder="Patient ID number" />
            </View>
          </View>
          <View style={styles.topBox}>
            <Text style={styles.sectionTitle}>General Analysis</Text>
            <View style={styles.inputContainer}>
              <RadioButtonInput label="Stomach Pain:" section="analysis" field="stomachPain" options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }]} />
              <RadioButtonInput label="Leg Swelling:" section="analysis" field="legSwelling" options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }]} />
              <RadioButtonInput label="Back Pain:" section="analysis" field="backPain" options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }]} />
              <RadioButtonInput label="Baby Movement:" section="analysis" field="babyMovement" options={[{ label: 'Good', value: 'Good' }, { label: 'Reduced', value: 'Reduced' }, { label: 'Absent', value: 'Absent' }]} />
              <RadioButtonInput label="Nausea:" section="analysis" field="nausea" options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }]} />
              <LabeledInput label="Sleep Cycle:" section="analysis" field="sleepCycle" placeholder="e.g., 8 hours" />
              <LabeledInput label="Urination:" section="analysis" field="urinationFrequency" placeholder="e.g., normal" />
            </View>
          </View>
          <View style={styles.topBox}>
            <Text style={styles.sectionTitle}>Maternal Health</Text>
            <View style={styles.inputContainer}>
              <LabeledInput label="TT Completed:" section="maternalHealth" field="ttCompleted" placeholder="e.g., 2" keyboardType="numeric" />
              <RadioButtonInput label="Thyroid History:" section="maternalHealth" field="thyroidHistory" options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }]} />
              <LabeledInput label="Gestational Age:" section="maternalHealth" field="gestationalAge" placeholder="e.g., 32 weeks" keyboardType="numeric" />
              <View style={styles.labeledInputContainer}>
                <Text style={styles.inputLabel}>Due Date:</Text>
                <TouchableOpacity style={styles.labeledInput} onPress={() => setShowDueDateDatePicker(true)}><Text>{formatDateForDisplay(formData.maternalHealth.dueDate) || 'Select Date'}</Text></TouchableOpacity>
              </View>
              {showDueDateDatePicker && <DateTimePicker value={formData.maternalHealth.dueDate ? new Date(formData.maternalHealth.dueDate) : new Date()} mode="date" display="default" onChange={onDueDateChange} minimumDate={new Date()} />}
              <DropdownInput label="Placenta Position:" section="maternalHealth" field="placentaPosition" placeholder="Select position" options={[{ label: 'Anterior', value: 'Anterior' }, { label: 'Posterior', value: 'Posterior' }, { label: 'Fundal', value: 'Fundal' }, { label: 'Lateral', value: 'Lateral' }, { label: 'Previa', value: 'Previa' }, { label: 'Not Recorded', value: 'Not Recorded' }]} />
            </View>
          </View>
        </View>

        {/* Health Parameters & Trends */}
        <View style={styles.trendsSection}>
          <Text style={styles.trendsSectionTitle}>Health Parameters & Trends</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.parameterTabs}>
            {parameters.map((param) => (
              <TouchableOpacity key={param} style={[styles.parameterTab, selectedParameter === param && styles.activeParameterTab]} onPress={() => setSelectedParameter(param)}>
                <Text style={[styles.parameterTabText, selectedParameter === param && styles.activeParameterTabText]}>{param}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.currentValueContainer}>
            <Text style={styles.currentValueLabel}>Add New {selectedParameter} Reading:</Text>
            <View style={styles.inputWithButton}>
              <TextInput style={styles.currentValueInput} value={currentValue} onChangeText={setCurrentValue} placeholder={selectedParameter === 'Blood Pressure' ? '120/80' : 'Enter value'} keyboardType={selectedParameter === 'Blood Pressure' ? 'default' : 'numeric'} />
              <TouchableOpacity style={styles.addValueButton} onPress={addParameterMeasurement}><Text style={styles.addValueButtonText}>Add</Text></TouchableOpacity>
            </View>
          </View>
          <View style={styles.chartContainer}>{renderChart()}</View>
        </View>

        {/* Notes and Summary */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>DOCTOR's NOTES / PRESCRIPTION</Text>
        </View>
        {transcribedText ? (
          <View style={styles.transcriptionCard}>
            <Text style={styles.cardTitle}>Transcription</Text>
            <TextInput style={styles.transcriptionInput} multiline value={transcribedText} onChangeText={setTranscribedText} />
          </View>
        ) : null}

        <NoteEditor onTranscriptionComplete={handleTranscriptionComplete} />
        
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>SUMMARY OF PREVIOUS DOCTOR NOTES</Text>
          <TextInput style={[styles.labeledInput, styles.multilineInput, { minHeight: 120 }]} placeholder="Summary of notes..." multiline value={formData.summary} onChangeText={(text) => setFormData(prev => ({ ...prev, summary: text }))} />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button mode="contained" style={styles.saveButton} onPress={handleSubmit}>Save Patient Data</Button>
          <Button mode="contained" style={styles.navigateButton} onPress={() => router.push(`/(tabs)/reports?name=${name}&uhiNo=${uhiNo}`)}>View Reports →</Button>
        </View>
      </ScrollView>
    </View>
  );
}

// Chart configuration is moved outside for cleanliness
const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: '6', strokeWidth: '2', stroke: '#8641F4' },
};

const styles = StyleSheet.create({
  // All original styles remain the same
  container: { flex: 1, backgroundColor: colors.lightPink || '#f8f4f6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.lightPink },
  topBar: { backgroundColor: '#1B286B', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, height: 60 },
  leftPinkBox: { backgroundColor: colors.softPink || '#f8d7da', marginRight: 15 },
  searchBar: { flex: 1, backgroundColor: colors.white || '#ffffff', height: 36, borderRadius: 6, paddingHorizontal: 12, fontSize: 14, marginRight: 15 },
  reportButton: { backgroundColor: colors.darkBlue, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  reportButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  scrollContainer: { flex: 1 },
  contentContainer: { padding: 16 },
  topRow: { flexDirection: 'column', gap: 16, marginBottom: 20 },
  tabletTopRow: { flexDirection: 'row' },
  topBox: { flex: 1, backgroundColor: colors.white || '#ffffff', borderRadius: 8, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', backgroundColor: colors.softPink || '#f8d7da', padding: 12, color: '#333' },
  inputContainer: { padding: 12, gap: 10 },
  labeledInputContainer: { flexDirection: 'row', alignItems: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#333', width: 90, marginRight: 8 },
  labeledInput: { flex: 1, borderWidth: 1, borderColor: colors.border || '#e0e0e0', borderRadius: 4, padding: 8, backgroundColor: '#ffffff', fontSize: 12, height: 36, justifyContent: 'center' },
  multilineInput: { height: 'auto', minHeight: 80, textAlignVertical: 'top' },
  staticText: { fontSize: 12, paddingVertical: 8, flex: 1 },
  radioGroup: { flexDirection: 'row', flexWrap: 'wrap', flex: 1, gap: 15 },
  radioOption: { flexDirection: 'row', alignItems: 'center' },
  radioButton: { height: 18, width: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#007AFF', alignItems: 'center', justifyContent: 'center', marginRight: 5 },
  radioButtonInner: { height: 10, width: 10, borderRadius: 5, backgroundColor: '#007AFF' },
  radioText: { fontSize: 12 },
  dropdownButton: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border || '#e0e0e0', borderRadius: 4, padding: 8, backgroundColor: '#ffffff', height: 36 },
  dropdownButtonText: { fontSize: 12 },
  dropdownArrow: { fontSize: 10 },
  dropdownOptionsContainer: { position: 'absolute', top: '100%', left: 98, right: 0, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#ccc', borderRadius: 4, zIndex: 10, maxHeight: 150 },
  dropdownOption: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  webSelect: { flex: 1, height: 36, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 4, paddingHorizontal: 8, backgroundColor: '#fff' },
  trendsSection: { backgroundColor: colors.white || '#ffffff', borderRadius: 8, padding: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  trendsSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  parameterTabs: { marginBottom: 16 },
  parameterTab: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 12, borderRadius: 20, backgroundColor: colors.lightPink || '#f8f4f6', borderWidth: 1, borderColor: colors.softPink || '#f8d7da' },
  activeParameterTab: { backgroundColor: colors.darkBlue, borderColor: colors.darkBlue },
  parameterTabText: { fontSize: 12, color: '#666' },
  activeParameterTabText: { color: 'white', fontWeight: 'bold' },
  currentValueContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  currentValueLabel: { fontSize: 14, fontWeight: '600', marginRight: 8, flexShrink: 1 },
  inputWithButton: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  currentValueInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginRight: 8, height: 36, fontSize: 12 },
  addValueButton: { backgroundColor: '#1B286B', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 4, justifyContent: 'center' },
  addValueButtonText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  chartContainer: { backgroundColor: '#f9f9f9', borderRadius: 8, paddingVertical: 16 },
  chartTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#333', paddingHorizontal: 16 },
  chartWrapper: { alignItems: 'center' },
  chartStyle: { marginVertical: 8, borderRadius: 16 },
  chartPlaceholder: { height: 220, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8 },
  placeholderText: { fontSize: 16, color: '#666' },
  placeholderSubtext: { fontSize: 12, color: '#999' },
  valuesTable: { marginTop: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 4, width: '95%' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f5', padding: 8, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  tableHeaderText: { flex: 1, fontWeight: 'bold', textAlign: 'center', fontSize: 11 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tableCell: { flex: 1, textAlign: 'center', fontSize: 11 },
  bottomRow: { flexDirection: 'column', gap: 16, marginBottom: 20 },
  tabletBottomRow: { flexDirection: 'row' },
  bottomBox: { flex: 1, backgroundColor: colors.white || '#ffffff', borderRadius: 8, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.softPink, padding: 12, marginTop: 10 },
  transcriptionCard: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginVertical: 10 },
  cardTitle: { fontWeight: 'bold', marginBottom: 5 },
  transcriptionInput: { height: 100, textAlignVertical: 'top' },
  summarySection: { backgroundColor: '#fff', borderRadius: 8, marginTop: 10 },
  summaryTitle: { fontSize: 14, fontWeight: 'bold', backgroundColor: colors.softPink, padding: 12 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 20, paddingBottom: 20 },
  saveButton: { backgroundColor: colors.darkBlue },
  navigateButton: { backgroundColor: '#6c757d' },
});