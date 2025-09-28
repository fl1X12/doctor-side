// consultation page  NOT IN USE - CONSISTS OF THE DOCTOR'S NOTES SECTION OF THE PATIENT PAGE

import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { Button } from 'react-native-paper';

import NoteEditor from '../../components/note-editor/NoteEditor';
import colors from '../../constants/Colors';

const API_BASE_URL = 'http://10.5.41.120:5501/api';

// --- Axios Instance & Interceptors ---
const authAxios = axios.create({
  baseURL: API_BASE_URL,
});

let appRouter;
const setAppRouter = (router) => {
  appRouter = router;
};

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

authAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      Alert.alert('Session Expired', 'Please log in again.');
      if (appRouter) {
        appRouter.replace('/(tabs)/admin');
      }
    }
    return Promise.reject(error);
  }
);

export default function Consultation() {
    const { name, uhiNo } = useLocalSearchParams();
    const router = useRouter();

    useEffect(() => {
        setAppRouter(router);
    }, [router]);

    const screenWidth = Dimensions.get('window').width;
    const isTablet = screenWidth >= 768;

    const [selectedParameter, setSelectedParameter] = useState('Blood Pressure');
    const [currentValue, setCurrentValue] = useState('');
    const [transcribedText, setTranscribedText] = useState('');
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

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        if (Platform.OS === 'web') {
        return date.toISOString().split('T')[0];
        }
        return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    useEffect(() => {
        const fetchPatientData = async () => {
          if (!uhiNo) return; // Don't fetch if uhiNo isn't available
          setLoading(true);
          try {
            // CHANGED: Fetch using the uhiNo via the correct 'by' endpoint
            const response = await authAxios.get(`/patients/by/${uhiNo}`);
            const data = response.data;
    
            // CHANGED: Set the entire response to patientData state
            setPatientData(data);
    
            // CHANGED: Populate formData from the new nested structure
            setFormData({
              details: data.user || {},
              analysis: data.analysis || {}, // Assuming these details are returned
              maternalHealth: data.maternalHealth || {},
              previousBaby: data.previousBaby || {},
              familyHistory: data.familyHistory || {},
              notes: data.notes || '',
              summary: data.summary || '',
            });
          } catch (error) {
            if (!error.response || (error.response.status !== 401 && error.response.status !== 403)) {
              console.error('Error fetching patient data:', error);
              Alert.alert('Error', 'Failed to load patient data');
            }
          } finally {
            setLoading(false);
          }
        };
        fetchPatientData();
      }, [uhiNo]);

    useEffect(() => {
        if (patientData) {
        fetchParameterData();
        }
    }, [selectedParameter, patientData]);

    const fetchParameterData = async () => {
        // IMPORTANT: Ensure patientData and its session property exist
        if (!patientData?.session?.id) return;
        try {
        // CHANGED: Use the session ID for the API call
        const response = await authAxios.get(`/patients/${patientData.session.id}/parameters/${selectedParameter}`);
        setParameterData(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
        if (!error.response || (error.response.status !== 401 && error.response.status !== 403)) {
            console.error('Error fetching parameter data:', error);
            setParameterData([]);
        }
        }
    };

    const handleTranscriptionComplete = (text) => {
        const newText = text.replace(/^Transcription:\n\n/, '').trim();
        setTranscribedText(newText);
        const newNote = {
        content: newText,
        importantPoints: [],
        };
        setFormData((prev) => ({
        ...prev,
        notes: [...prev.notes, newNote],
        }));
    };

    const handleSubmit = async () => {
        if (!patientData) {
        await fetchPatient();
        } else {
        await savePatientData();
        }
    };

    const savePatientData = async () => {
        // IMPORTANT: Ensure patientData and its session property exist
        if (!patientData?.session?.id) {
          return Alert.alert('Error', 'Cannot save data. Patient session not found.');
        }
        try {
          // CHANGED: Use the session ID for the PUT request
          const response = await authAxios.put(`/patients/${patientData.session.id}`, formData);
    
          // The backend might return the updated session, you can update state if needed
          //setPatientData(prev => ({ ...prev, ...response.data }));
          Alert.alert('Success', 'Patient data saved successfully');
        } catch (error) {
          if (!error.response || (error.response.status !== 401 && error.response.status !== 403)) {
            console.error('Error saving patient data:', error);
            Alert.alert('Error', 'Failed to save patient data');
          }
        }
    };

    const fetchPatient = async () => {
      try {
        // CHANGED: Use a GET request to the correct endpoint.
        // The uhiNo is now part of the URL, not the request body.
        const response = await authAxios.get(`/patients/by/${uhiNo}`);
    
        // This remains the same, as you want to update your state with the fetched data.
        setPatientData(response.data);
    
        // REMOVED: An alert on success is usually not needed when the UI updates with data.
        // If you want feedback, you could use a brief, non-blocking toast message.
    
      } catch (error) {
        // This is a standard check for network errors vs. HTTP errors.
        if (!error.response || (error.response.status !== 401 && error.response.status !== 403)) {
          console.error('Error fetching patient:', error);
    
          // CHANGED: The error message is updated to reflect the new action.
          Alert.alert('Error', error.response?.data?.error || 'Failed to fetch patient details');
        }
      }
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
            <View style={styles.topBar}>
                <Button mode="contained" style={styles.leftPinkBox} onPress={() => router.push('/(tabs)/admin')}>
                    ADMIN
                </Button>
                <TextInput style={styles.searchBar} placeholder="Search patient..." placeholderTextColor="#999" />
                <TouchableOpacity
                    style={styles.reportButton}
                    onPress={() => router.push(`/patient-report?name=${name}&uhiNo=${uhiNo}`)}>
                    <Text style={styles.reportButtonText}>View Full Report</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        
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
                    <TextInput
                        style={[styles.labeledInput, styles.multilineInput, { minHeight: 120 }]}
                        placeholder="Summary of notes..."
                        multiline
                        value={formData.summary}
                        onChangeText={(text) => setFormData((prev) => ({ ...prev, summary: text }))}
                    />
                    </View>
            
                    <View style={styles.actionButtons}>
                    <Button mode="contained" style={styles.saveButton} onPress={handleSubmit}>
                        Save Patient Data
                    </Button>
                    <Button
                        mode="contained"
                        style={styles.navigateButton}
                        onPress={() => router.push(`/(tabs)/reports?name=${name}&uhiNo=${uhiNo}`)}>
                        View Reports →
                    </Button>
                </View>
            </ScrollView>
        </View>
    )

}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.lightPink || '#f8f4f6' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.lightPink },
    loadingText: { marginTop: 10, fontSize: 16, color: colors.darkBlue },
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
    dropdownOptionText: { fontSize: 12 },
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