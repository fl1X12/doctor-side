import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

// Make sure these imports are present
import { DropdownInput, LabeledInput, RadioButtonInput } from '../../components/forms/ReusableComponents';
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

function PatientHistoryView({ userId, onHistoryItemClick }) {
    const [historyData, setHistoryData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!userId) return;
            try {
                setIsLoading(true);
                const response = await authAxios.get(`/patients/${userId}/drawing-history`);
                setHistoryData(response.data);
            } catch (err) {
                console.error('Failed to fetch drawing history:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [userId]);

    if (isLoading) {
        return (
            <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.darkBlue} />
            </View>
        );
    }

    if (historyData.length === 0) {
        return <Text style={{ padding: 20, color: '#888', textAlign: 'center' }}>No previous drawings found.</Text>;
    }

    return (
        <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Drawing History</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyList}>
                {historyData.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.historyItem}
                        onPress={() => onHistoryItemClick(item.drawingNote)}
                    >
                        <Text style={styles.historyItemType}>{item.type}</Text>
                        <Text style={styles.historyItemDate}>
                            {new Date(item.recordedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </Text>
                        <Text style={styles.historyItemTime}>
                            {new Date(item.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

// --- Main Page Component ---
export default function PatientPage() {
    const { name, uhiNo } = useLocalSearchParams();
    const router = useRouter();

    const [doctorId, setDoctorId] = useState(null);

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
    const [drawingNote, setDrawingNote] = useState({ drawings: [], highlights: [] });
    const noteEditorRef = useRef(null);
    const [formData, setFormData] = useState({
        details: {},
        analysis: {},
        maternalHealth: {},
        previousBaby: {},
        familyHistory: {},
        notes: [],
        summary: '',
    });

    const [showLMPDatePicker, setShowLMPDatePicker] = useState(false);
    const [showDueDateDatePicker, setShowDueDateDatePicker] = useState(false);

    const parameters = ['Blood Pressure', 'Hemoglobin', 'AFI', 'Weight', 'Glucose', 'Heart Rate'];

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        if (Platform.OS === 'web') {
            return date.toISOString().split('T')[0];
        }
        return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

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

    // ✅ CORRECTED: This function now returns data instead of setting state
    const fetchSummary = async (sessionId) => {
        if (!sessionId) return '';
        try {
            const notesResponse = await authAxios.get(`/patients/${sessionId}/notes`);
            if (notesResponse.data?.length > 0) {
                const mostRecentNote = notesResponse.data[notesResponse.data.length - 1];
                if (mostRecentNote.important_points?.length > 0) {
                    return mostRecentNote.important_points.join('\n');
                }
            }
            return '';
        } catch (error) {
            console.error('Could not fetch previous summary notes:', error);
            return '';
        }
    };
    
    // ✅ CORRECTED: This useEffect now fetches all data and sets state once
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!uhiNo) return;
            setLoading(true);
            try {
                const patientResponse = await authAxios.get(`/patients/by/${uhiNo}`);
                const patientDataPayload = patientResponse.data;
                setPatientData(patientDataPayload);

                const summaryText = await fetchSummary(patientDataPayload.session?.id);

                setFormData({
                    details: patientDataPayload.user || {},
                    analysis: patientDataPayload.analysis || {},
                    maternalHealth: patientDataPayload.maternalHealth || {},
                    previousBaby: patientDataPayload.previousBaby || {},
                    familyHistory: patientDataPayload.familyHistory || {},
                    notes: [], // Intentionally empty for new session notes
                    summary: summaryText,
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
        fetchInitialData();
    }, [uhiNo]);

    useEffect(() => {
        if (patientData?.session?.id) {
            fetchParameterData();
        }
    }, [selectedParameter, patientData]);

    useEffect(() => {
        const fetchDoctorId = async () => {
            try {
                const doctorInfoString = await AsyncStorage.getItem('doctorInfo');
                if (doctorInfoString) {
                    const doctorInfoObject = JSON.parse(doctorInfoString);
                    setDoctorId(doctorInfoObject.id); // Save the ID to state
                    console.log(`Doctor ID loaded: ${doctorInfoObject.id}`);
                } else {
                    console.warn('Doctor info not found in storage.');
                }
            } catch (error) {
                console.error('Failed to fetch doctor ID from storage.', error);
                Alert.alert('Error', 'Could not load doctor information.');
            }
        };

        fetchDoctorId();
    }, []);

    const fetchParameterData = async () => {
        if (!patientData?.session?.id) return;
        try {
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
    };
    
    // ✅ CORRECTED: handleSubmit now uses the new fetchSummary function
    const handleSubmit = async () => {
        if (!patientData?.session?.id) {
            return Alert.alert('Error', 'Cannot save data. Patient session not found.');
        }

        const payload = {
            ...formData,
            drawingNote: drawingNote,
        };

        if (transcribedText.trim()) {
            payload.notes = [{ content: transcribedText.trim() }];
        } else {
            payload.notes = [];
        }

        try {
            await authAxios.put(`/patients/${patientData.session.id}`, payload);
            Alert.alert('Success', 'Patient data saved successfully');

            const newSummary = await fetchSummary(patientData.session.id);
            setFormData((prev) => ({ ...prev, summary: newSummary, notes: [] }));

            setTranscribedText('');

            if (noteEditorRef.current) {
                noteEditorRef.current.clear();
            }
        } catch (error) {
            if (!error.response || (error.response.status !== 401 && error.response.status !== 403)) {
                console.error('Error saving patient data:', error);
                Alert.alert('Error', 'Failed to save patient data');
            }
        }
    };

    const addParameterMeasurement = async () => {
        if (!currentValue.trim()) return Alert.alert('Error', 'Please enter a value');
        if (!patientData?.session?.id) return Alert.alert('Error', 'Cannot add measurement. Patient session not found.');

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

            await authAxios.post(`/patients/${patientData.session.id}/parameters`, {
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

    const getChartData = () => {
        if (!Array.isArray(parameterData) || parameterData.length === 0) return null;
        const sortedData = [...parameterData].sort((a, b) => new Date(a.date) - new Date(b.date));
        const labels = sortedData.map((item) =>
            new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );
        let chartValues;
        if (selectedParameter === 'Blood Pressure') {
            chartValues = sortedData.map((item) => item.value?.systolic || 0);
        } else {
            // For all other parameters (Hemoglobin, AFI, Weight, Glucose, Heart Rate)
            chartValues = sortedData.map((item) => {
                if (typeof item.value === 'number') {
                    return item.value;
                } else if (typeof item.value === 'string') {
                    const numValue = parseFloat(item.value);
                    return isNaN(numValue) ? 0 : numValue;
                } else {
                    return 0;
                }
            });
        }
        return {
            labels: labels.length > 6 ? labels.slice(-6) : labels,
            datasets: [{ data: chartValues.length > 6 ? chartValues.slice(-6) : chartValues }],
        };
    };

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
                <View style={styles.valuesTable}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.tableHeaderText}>Date</Text>
                        <Text style={styles.tableHeaderText}>Value</Text>
                        {selectedParameter === 'Blood Pressure' && <Text style={styles.tableHeaderText}>Diastolic</Text>}
                        <Text style={styles.tableHeaderText}>Unit</Text>
                    </View>
                    {parameterData
                        .slice(-5)
                        .reverse()
                        .map((item, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={styles.tableCell}>
                                    {new Date(item.date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: '2-digit',
                                    })}
                                </Text>
                                <Text style={styles.tableCell}>
                                    {typeof item.value === 'object' && item.value !== null ? item.value.systolic : item.value}
                                </Text>
                                {selectedParameter === 'Blood Pressure' && <Text style={styles.tableCell}>{item.value.diastolic}</Text>}
                                <Text style={styles.tableCell}>{item.unit || ''}</Text>
                            </View>
                        ))}
                </View>
            </View>
        );
    };

    const handleHistoryItemClick = (drawingNote) => {
        if (noteEditorRef.current && drawingNote) {
            Alert.alert(
                'Load Previous Drawing?',
                'This will replace any content in the editor. Do you want to continue?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Load',
                        onPress: () => noteEditorRef.current.loadDrawing(drawingNote),
                    },
                ]
            );
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
                    onPress={() => router.push(`/patient-report?name=${name}&uhiNo=${uhiNo}`)}
                >
                    <Text style={styles.reportButtonText}>View Full Report</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
                {/* ✅ FORMS RESTORED BELOW ✅ */}
                <View style={[styles.topRow, isTablet && styles.tabletTopRow]}>
                    <View style={styles.topBox}>
                        <Text style={styles.sectionTitle}>Patient Details</Text>
                        <View style={styles.inputContainer}>
                            <View style={styles.labeledInputContainer}>
                                <Text style={styles.inputLabel}>Name:</Text>
                                <Text style={styles.staticText}>{name}</Text>
                            </View>
                            <LabeledInput
                                label="Age:"
                                section="details"
                                field="age"
                                formData={formData}
                                setFormData={setFormData}
                                placeholder="Enter age"
                                keyboardType="numeric"
                            />
                            <RadioButtonInput
                                label="Gender:"
                                section="details"
                                field="gender"
                                options={[
                                    { label: 'Male', value: 'Male' },
                                    { label: 'Female', value: 'Female' },
                                    { label: 'Other', value: 'Other' },
                                ]}
                                formData={formData}
                                setFormData={setFormData}
                            />
                            <DropdownInput
                                label="Blood Group:"
                                section="details"
                                field="bg"
                                placeholder="Select Blood Group"
                                options={[
                                    { label: 'A+', value: 'A+' }, { label: 'A-', value: 'A-' },
                                    { label: 'B+', value: 'B+' }, { label: 'B-', value: 'B-' },
                                    { label: 'AB+', value: 'AB+' }, { label: 'AB-', value: 'AB-' },
                                    { label: 'O+', value: 'O+' }, { label: 'O-', value: 'O-' },
                                ]}
                                formData={formData}
                                setFormData={setFormData}
                            />
                            <LabeledInput
                                label="Phone:"
                                section="details"
                                field="phone"
                                formData={formData}
                                setFormData={setFormData}
                                placeholder="Enter phone number"
                                keyboardType="phone-pad"
                            />
                            <View style={styles.labeledInputContainer}>
                                <Text style={styles.inputLabel}>LMP:</Text>
                                <TouchableOpacity style={styles.labeledInput} onPress={() => setShowLMPDatePicker(true)}>
                                    <Text>{formatDateForDisplay(formData.details.lmp) || 'Select Date'}</Text>
                                </TouchableOpacity>
                            </View>
                            {showLMPDatePicker && (
                                <DateTimePicker
                                    value={formData.details.lmp ? new Date(formData.details.lmp) : new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={onLMPChange}
                                    maximumDate={new Date()}
                                />
                            )}
                            <LabeledInput
                                label="OP/IP no:"
                                section="details"
                                field="opIpNo"
                                formData={formData}
                                setFormData={setFormData}
                                placeholder="Patient ID number"
                            />
                        </View>
                    </View>
                    <View style={styles.topBox}>
                        <Text style={styles.sectionTitle}>General Analysis</Text>
                        <View style={styles.inputContainer}>
                            <RadioButtonInput
                                label="Stomach Pain:"
                                section="analysis"
                                field="stomachPain"
                                options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }]}
                                formData={formData}
                                setFormData={setFormData}
                            />
                            <RadioButtonInput
                                label="Leg Swelling:"
                                section="analysis"
                                field="legSwelling"
                                options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }]}
                                formData={formData}
                                setFormData={setFormData}
                            />
                            <RadioButtonInput
                                label="Back Pain:"
                                section="analysis"
                                field="backPain"
                                options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }]}
                                formData={formData}
                                setFormData={setFormData}
                            />
                            <RadioButtonInput
                                label="Baby Movement:"
                                section="analysis"
                                field="babyMovement"
                                options={[
                                    { label: 'Good', value: 'Good' },
                                    { label: 'Reduced', value: 'Reduced' },
                                    { label: 'Absent', value: 'Absent' },
                                ]}
                                formData={formData}
                                setFormData={setFormData}
                            />
                            <RadioButtonInput
                                label="Nausea:"
                                section="analysis"
                                field="nausea"
                                options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }]}
                                formData={formData}
                                setFormData={setFormData}
                            />
                            <LabeledInput
                                label="Sleep Cycle:"
                                section="analysis"
                                field="sleepCycle"
                                formData={formData}
                                setFormData={setFormData}
                                placeholder="e.g., 8 hours"
                            />
                            <LabeledInput
                                label="Urination:"
                                section="analysis"
                                field="urinationFrequency"
                                formData={formData}
                                setFormData={setFormData}
                                placeholder="e.g., normal"
                            />
                        </View>
                    </View>
                    <View style={styles.topBox}>
                        <Text style={styles.sectionTitle}>Maternal Health</Text>
                        <View style={styles.inputContainer}>
                            <LabeledInput
                                label="TT Completed:"
                                section="maternalHealth"
                                field="ttCompleted"
                                formData={formData}
                                setFormData={setFormData}
                                placeholder="e.g., 2"
                                keyboardType="numeric"
                            />
                            <RadioButtonInput
                                label="Thyroid History:"
                                section="maternalHealth"
                                field="thyroidHistory"
                                options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }]}
                                formData={formData}
                                setFormData={setFormData}
                            />
                            <LabeledInput
                                label="Gestational Age:"
                                section="maternalHealth"
                                field="gestationalAge"
                                formData={formData}
                                setFormData={setFormData}
                                placeholder="e.g., 32 weeks"
                            />
                            <View style={styles.labeledInputContainer}>
                                <Text style={styles.inputLabel}>Due Date:</Text>
                                <TouchableOpacity style={styles.labeledInput} onPress={() => setShowDueDateDatePicker(true)}>
                                    <Text>{formatDateForDisplay(formData.maternalHealth.dueDate) || 'Select Date'}</Text>
                                </TouchableOpacity>
                            </View>
                            {showDueDateDatePicker && (
                                <DateTimePicker
                                    value={formData.maternalHealth.dueDate ? new Date(formData.maternalHealth.dueDate) : new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={onDueDateChange}
                                    minimumDate={new Date()}
                                />
                            )}
                            <DropdownInput
                                label="Placenta Position:"
                                section="maternalHealth"
                                field="placentaPosition"
                                placeholder="Select position"
                                options={[
                                    { label: 'Anterior', value: 'Anterior' }, { label: 'Posterior', value: 'Posterior' },
                                    { label: 'Fundal', value: 'Fundal' }, { label: 'Lateral', value: 'Lateral' },
                                    { label: 'Previa', value: 'Previa' }, { label: 'Not Recorded', value: 'Not Recorded' },
                                ]}
                                formData={formData}
                                setFormData={setFormData}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.trendsSection}>
                    <Text style={styles.trendsSectionTitle}>Health Parameters & Trends</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.parameterTabs}>
                        {parameters.map((param) => (
                            <TouchableOpacity
                                key={param}
                                style={[styles.parameterTab, selectedParameter === param && styles.activeParameterTab]}
                                onPress={() => setSelectedParameter(param)}
                            >
                                <Text style={[styles.parameterTabText, selectedParameter === param && styles.activeParameterTabText]}>
                                    {param}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <View style={styles.currentValueContainer}>
                        <Text style={styles.currentValueLabel}>Add New {selectedParameter} Reading:</Text>
                        <View style={styles.inputWithButton}>
                            <TextInput
                                style={styles.currentValueInput}
                                value={currentValue}
                                onChangeText={setCurrentValue}
                                placeholder={selectedParameter === 'Blood Pressure' ? '120/80' : 'Enter value'}
                                keyboardType={selectedParameter === 'Blood Pressure' ? 'default' : 'numeric'}
                            />
                            <TouchableOpacity style={styles.addValueButton} onPress={addParameterMeasurement}>
                                <Text style={styles.addValueButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.chartContainer}>{renderChart()}</View>
                </View>

                <View style={styles.historySection}>
                    {patientData?.user?.id && (
                        <PatientHistoryView
                            userId={patientData.user.id}
                            onHistoryItemClick={handleHistoryItemClick}
                        />
                    )}
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>DOCTOR's NOTES / PRESCRIPTION</Text>
                </View>

                {transcribedText ? (
                    <View style={styles.transcriptionCard}>
                        <Text style={styles.cardTitle}>Last Note Added</Text>
                        <TextInput
                            style={styles.transcriptionInput}
                            multiline
                            value={transcribedText}
                            editable={true}
                            onChangeText={setTranscribedText}
                        />
                    </View>
                ) : null}

                <NoteEditor
                    ref={noteEditorRef}
                    onTranscriptionComplete={handleTranscriptionComplete}
                    onDrawingsChange={setDrawingNote}
                />

                <View style={styles.summarySection}>
                    <Text style={styles.summaryTitle}>AI SUMMARY OF LATEST NOTES</Text>
                    <TextInput
                        style={[styles.labeledInput, styles.multilineInput, { minHeight: 120, color: '#333' }]}
                        placeholder="No summary available. Add new notes to generate a summary."
                        multiline
                        value={formData.summary}
                        editable={false}
                    />
                </View>

                <View style={styles.actionButtons}>
                    <Button mode="contained" style={styles.saveButton} onPress={handleSubmit}>
                        Save Patient Data
                    </Button>
                    <Button
                        mode="contained"
                        style={[styles.navigateButton, { backgroundColor: '#0256A3' }]}
                        onPress={() =>{
                          console.log(patientData);
                          router.push({
                            pathname: '/(tabs)/PrescriptionScreen',
                            params: {
                              patientId:patientData.user.id,
                              uhiNo,
                              name,
                              doctorId: doctorId,
                            },
                          })
                        }
                        }
                    >
                        Prescription
                    </Button>
                    <Button
                        mode="contained"
                        style={styles.navigateButton}
                        onPress={() => router.push(`/(tabs)/reports?name=${name}&uhiNo=${uhiNo}`)}
                    >
                        View Reports →
                    </Button>
                </View>
            </ScrollView>
        </View>
    );
}

// --- Chart Config & Styles ---
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
    transcriptionInput: { height: 100, textAlignVertical: 'top', color: '#333' },
    summarySection: { backgroundColor: '#fff', borderRadius: 8, marginTop: 10 },
    summaryTitle: { fontSize: 14, fontWeight: 'bold', backgroundColor: colors.softPink, padding: 12 },
    actionButtons: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 20, paddingBottom: 20 },
    saveButton: { backgroundColor: colors.darkBlue },
    navigateButton: { backgroundColor: '#6c757d' },

    historySection: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginTop: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        overflow: 'hidden',
    },
    historyContainer: {
        // container styles
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    historyList: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    historyItem: {
        backgroundColor: '#f8f4f6',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.softPink,
        padding: 12,
        marginRight: 12,
        alignItems: 'center',
        minWidth: 120,
    },
    historyItemType: {
        fontWeight: 'bold',
        color: colors.darkBlue,
        fontSize: 13,
    },
    historyItemDate: {
        fontSize: 12,
        color: '#555',
        marginTop: 6,
    },
    historyItemTime: {
        fontSize: 11,
        color: '#777',
        marginTop: 2,
    },
});