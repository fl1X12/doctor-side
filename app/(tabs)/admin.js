// admin.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

// Import local components and utils
import { API_BASE_URL, authAxios } from '../../lib/utils';
import AddPatientForm from './AddPatientForm';
import AdminDashboard from './AdminDashboard';
import AuthScreen from './AuthScreen';
import VitalsForm from './VitalsForm'; // Import the new component

export default function App() {
    // State remains centralized here
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [doctorName, setDoctorName] = useState('');
    const [doctorId, setDoctorId] = useState(null);

    // Auth state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSignupMode, setIsSignupMode] = useState(false);
    
    // --- KEY CHANGE: Consolidated state for the signup form ---
    const [newDoctor, setNewDoctor] = useState({
        name: '',
        username: '',
        password: '',
        age: '',
        gender: '',
        phone: '',
        specialization: '',
        experience: '',
        license: '',
        hospital: '',
    });

    // Data state
    const [appointmentData, setAppointmentData] = useState([]);
    const [completedPatients, setCompletedPatients] = useState([]);
    const [showCompleted, setShowCompleted] = useState(false);

    // Form state
    const [newPatient, setNewPatient] = useState({ uhiNo: '', patientName: '', redirection: 'obstetrics' });
    const [vitalInfo, setVitalInfo] = useState({
        patientId: '',
        uhiNo: '',
        patientName: '',
        visitDate: new Date().toISOString().split('T')[0],
        temperature: '',
        respiratoryRate: '',
        oxygenSaturation: '',
        jaundice: 'absent',
        feet: 'absent',
        weight: ''
    });

    // Check login status on app load
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('token');
                const storedDoctor = await AsyncStorage.getItem('doctorInfo');
                if (storedToken && storedDoctor) {
                    const doctorInfo = JSON.parse(storedDoctor);
                    setDoctorName(doctorInfo.name);
                    setDoctorId(doctorInfo.id || doctorInfo._id || null);
                    setIsLoggedIn(true);
                    fetchPatients(); // Fetch initial data
                }
            } catch (e) {
                console.error('Failed to load token or doctor info from storage', e);
            }
        };
        checkLoginStatus();
    }, []); // Empty dependency array ensures this runs only once on mount

    // --- DATA FETCHING FUNCTIONS ---

    const fetchPatients = async () => {
        setIsLoading(true);
        try {
            const response = await authAxios.get(`/patients/waiting`);
            // CHANGED: Simplified the mapping to match the backend's response structure
            setAppointmentData(response.data.map((session, index) => ({
                ...session,
                _id: session.id, // Use session.id for the key
                slNo: index + 1
            })));
        } catch (error) {
            // ... (error handling remains the same)
            console.error('Error fetching patients:', error);
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

    const fetchCompletedPatients = async () => {
        setIsLoading(true);
        try {
            // FIX: The endpoint should be /patients/completed
            const response = await authAxios.get(`/patients/completed`);

            // FIX: Simplified the mapping to handle the flat data structure
            setCompletedPatients(response.data.map((session, index) => ({
                ...session, // This copies all properties like id, uhiNo, patientName
                _id: session.id, // Keep this for unique keys in React
                slNo: index + 1
            })));

        } catch (error) {
            console.error('Error fetching completed patients:', error);
            // Your existing error handling...
        } finally {
            setIsLoading(false);
        }  
    };

    // --- AUTHENTICATION HANDLERS ---

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please enter both username and password');
            return;
        }
        setIsLoading(true);
        try {
            // Using the Flask login route
            const response = await axios.post(`${API_BASE_URL}/doctors/login`, { username, password });
            const { token, doctor } = response.data;
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('doctorInfo', JSON.stringify(doctor));
            setDoctorName(doctor.name);
            setDoctorId(doctor.id || doctor._id || null);
            setIsLoggedIn(true);
            Alert.alert('Success', `Welcome ${doctor.name}!`);
            fetchPatients();
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
            Alert.alert('Login Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async () => {
        // --- KEY CHANGE: Validate fields from the newDoctor object ---
        const requiredFields = ['name', 'username', 'password', 'age', 'gender', 'phone', 'specialization', 'experience', 'license', 'hospital'];
        for (const field of requiredFields) {
            if (!newDoctor[field]) {
                Alert.alert('Error', `Please fill in all fields. Missing: ${field}`);
                return;
            }
        }
        
        setIsLoading(true);
        try {
            // --- KEY CHANGE: Send the entire newDoctor object ---
            await axios.post(`${API_BASE_URL}/doctors/signup`, newDoctor);
            Alert.alert('Success', 'Doctor registered successfully! You can now log in.');
            setIsSignupMode(false);
            // --- KEY CHANGE: Reset the newDoctor object ---
            setNewDoctor({
                name: '', username: '', password: '', age: '', gender: '',
                phone: '', specialization: '', experience: '', license: '', hospital: ''
            });
            setUsername(newDoctor.username); // Pre-fill for convenience
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
            setDoctorId(null);
            setCurrentPage('dashboard');
            setAppointmentData([]);
            setCompletedPatients([]);
            setShowCompleted(false);
        } catch (e) {
            console.error('Failed to clear storage on logout', e);
        }
    };

    // --- PATIENT MANAGEMENT HANDLERS (Will need adjustment for MySQL backend) ---
    // NOTE: These functions will need to be adapted to work with `session_id` instead of `patientId`
    // and the new data structures from your Flask API.

    const handleSavePatient = async () => {
        // This function will likely need to create a User and a PatientMonitoringSession
        if (!newPatient.uhiNo.trim()) {
            Alert.alert('Error', 'Please provide the patient\'s UHI Number.');
            return;
        }

        setIsLoading(true);

        try {
            // CHANGED: The request body now only sends the uhiNo, which is all the backend needs.
            await authAxios.post(`/patients`, {
                uhiNo: newPatient.uhiNo.trim(),
            });

            // NOTE: This flow is good. You refresh the list and then navigate back.
            await fetchPatients(); // Refreshes the patient list on the dashboard.
            Alert.alert('Success', 'Patient has been added to the waiting room!', [
                { text: 'OK', onPress: () => setCurrentPage('dashboard') } // Returns to the dashboard view.
            ]);

        } catch (error) {
            const errorMessage = error.response?.data?.error || 'An error occurred. Please check the UHI Number and try again.';
            Alert.alert('Error', errorMessage);
            if (error.response?.status === 401 || error.response?.status === 403) {
                handleLogout();    
        }

        } finally {
            setIsLoading(false);
            // Resets the form for the next entry.
            setNewPatient({ uhiNo: '', patientName: '', redirection: 'obstetrics' });
        }
    };

    const markPatientCompleted = async (sessionId) => {
        Alert.alert(
            "Mark as Complete",
            "Are you sure you want to mark this patient as completed?",
            [
                //cancel button
                {
                    text:'Cancel',
                    onPress: () => console.log("Complete action cancelled "),
                    style: 'cancel'
                },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            await authAxios.put(`/patients/${sessionId}/complete`);
                            await fetchPatients();
                            if (showCompleted) {
                                await fetchCompletedPatients();
                            }
                            Alert.alert('Success', 'Patient marked as completed');
                        }catch (error) {
                            Alert.alert('Error', 'Failed to mark patient as completed');
                            if (error.response?.status === 401 || error.response?.status === 403) {
                                handleLogout();
                            }
                        }
                    },
                }
            ],
            { cancelable: false } // prevents dismiss by tapping outside the alert
        );

        
    };
    
    // Updated handleSaveVitalInfo function for admin.js

    const handleSaveVitalInfo = async () => {
        // This will now use a session_id
        const sessionId = vitalInfo.patientId; // Assuming patientId is now sessionId
        
        // Validate required fields
        if (!vitalInfo.temperature || !vitalInfo.respiratoryRate ||
            !vitalInfo.oxygenSaturation || !vitalInfo.weight) {
            Alert.alert('Error', 'Please fill in all vital information fields');
            return;
        }

        // Validate numeric fields
        const numericFields = ['temperature', 'respiratoryRate', 'oxygenSaturation', 'weight'];
        for (const field of numericFields) {
            const value = parseFloat(vitalInfo[field]);
            if (isNaN(value) || value <= 0) {
                Alert.alert('Error', `Please enter a valid ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                return;
            }
        }

        setIsLoading(true);
        try {
            // Prepare the data payload with correct field mapping
            const vitalsData = {
                visitDate: vitalInfo.visitDate,
                temperature: parseFloat(vitalInfo.temperature),
                respiratoryRate: parseInt(vitalInfo.respiratoryRate), // Convert to integer for respiratory rate
                oxygenSaturation: parseFloat(vitalInfo.oxygenSaturation),
                jaundice: vitalInfo.jaundice,
                // Map 'feet' to 'feetSwelling' for backend compatibility
                feetSwelling: vitalInfo.feet,
                weight: parseFloat(vitalInfo.weight)
            };

            console.log('Sending vitals data:', vitalsData); // Debug log

            await authAxios.put(`/patients/${sessionId}/vitals`, vitalsData);
            
            Alert.alert('Success', 'Vital information saved successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        setCurrentPage('dashboard');
                        fetchPatients(); // Refresh the patient list
                    }
                }
            ]);
        } catch (error) {
            console.error('Error saving vitals:', error);
            const errorMessage = error.response?.data?.error || 'Failed to save vital information';
            Alert.alert('Error', errorMessage);
            if (error.response?.status === 401 || error.response?.status === 403) {
                handleLogout();
            }
        } finally {
            setIsLoading(false);
        }
    };

    // --- UI/VIEW HANDLERS ---

    const toggleCompletedView = () => {
        setShowCompleted(!showCompleted);
        if (!showCompleted) {
            fetchCompletedPatients();
        } else {
            fetchPatients();
        }
    };

    const handleCancelAddPatient = () => {
        setCurrentPage('dashboard');
        setNewPatient({ uhiNo: '', patientName: '', redirection: 'obstetrics' });
    };

    // --- EXCEL UPLOAD HANDLERS (May need adjustment) ---
    const handleWebExcelUpload = async (event) => {
        Alert.alert("Note", "Excel upload logic may need adjustments for the new backend.");
    };
    
    const processExcelData = async (jsonData) => {
        Alert.alert("Note", "Excel processing logic may need adjustments for the new backend.");
    };


    // --- RENDER LOGIC ---

    if (!isLoggedIn) {
        return (
            <AuthScreen
                isSignupMode={isSignupMode}
                setIsSignupMode={setIsSignupMode}
                username={username}
                setUsername={setUsername}
                password={password}
                setPassword={setPassword}
                // --- KEY CHANGE: Pass the new state object and its setter ---
                newDoctor={newDoctor}
                setNewDoctor={setNewDoctor}
                handleLogin={handleLogin}
                handleSignup={handleSignup}
                isLoading={isLoading}
            />
        );
    }

    switch (currentPage) {
        case 'addPatient':
            return (
                <AddPatientForm
                    newPatient={newPatient}
                    setNewPatient={setNewPatient}
                    handleSavePatient={handleSavePatient}
                    handleCancelAddPatient={handleCancelAddPatient}
                    handleLogout={handleLogout}
                    isLoading={isLoading}
                />
            );
        case 'vitalInfo':
            return (
                <VitalsForm
                    vitalInfo={vitalInfo}
                    setVitalInfo={setVitalInfo}
                    handleSaveVitalInfo={handleSaveVitalInfo}
                    setCurrentPage={setCurrentPage}
                    handleLogout={handleLogout}
                    isLoading={isLoading}
                />
            );
        case 'dashboard':
        default:
            return (
                <AdminDashboard
                    doctorName={doctorName}
                    handleLogout={handleLogout}
                    appointmentData={appointmentData}
                    completedPatients={completedPatients}
                    showCompleted={showCompleted}
                    toggleCompletedView={toggleCompletedView}
                    handleAddPatient={() => setCurrentPage('addPatient')}
                    handleWebExcelUpload={handleWebExcelUpload}
                    markPatientCompleted={markPatientCompleted}
                    setVitalInfo={setVitalInfo}
                    setCurrentPage={setCurrentPage}
                    doctorId={doctorId}
                />
            );
    }
}

