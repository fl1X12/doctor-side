// admin.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as XLSX from 'xlsx';

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

    // Auth state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSignupMode, setIsSignupMode] = useState(false);
    const [newDoctorName, setNewDoctorName] = useState('');
    const [newDoctorUsername, setNewDoctorUsername] = useState('');
    const [newDoctorPassword, setNewDoctorPassword] = useState('');

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
            setAppointmentData(response.data.map((patient, index) => ({
                ...patient,
                slNo: index + 1
            })));
        } catch (error) {
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

    // --- AUTHENTICATION HANDLERS ---

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please enter both username and password');
            return;
        }
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/doctors/login`, { username, password });
            const { token, doctor } = response.data;
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('doctorInfo', JSON.stringify(doctor));
            setDoctorName(doctor.name);
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
        if (!newDoctorUsername || !newDoctorPassword || !newDoctorName) {
            Alert.alert('Error', 'Please fill in all fields for registration.');
            return;
        }
        setIsLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/doctors/signup`, {
                username: newDoctorUsername,
                password: newDoctorPassword,
                name: newDoctorName,
            });
            Alert.alert('Success', 'Doctor registered successfully! You can now log in.');
            setIsSignupMode(false);
            setNewDoctorUsername('');
            setNewDoctorPassword('');
            setNewDoctorName('');
            setUsername(newDoctorUsername); // Pre-fill for convenience
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
            setCurrentPage('dashboard');
            setAppointmentData([]);
            setCompletedPatients([]);
            setShowCompleted(false);
        } catch (e) {
            console.error('Failed to clear storage on logout', e);
        }
    };

    // --- PATIENT MANAGEMENT HANDLERS ---

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
                handleLogout();
            }
        } finally {
            setIsLoading(false);
            setNewPatient({ uhiNo: '', patientName: '', redirection: 'obstetrics' });
        }
    };

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
                handleLogout();
            }
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

    // --- EXCEL UPLOAD HANDLERS ---

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
                await processExcelData(jsonData);
            } catch (err) {
                console.error('Excel parsing failed:', err);
                Alert.alert('Error', 'Failed to read Excel file');
            }
        };
        reader.readAsArrayBuffer(file);
    };
    
    const processExcelData = async (jsonData) => {
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
        try {
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
                handleLogout();
            }
        } finally {
            setIsLoading(false);
        }
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
                newDoctorName={newDoctorName}
                setNewDoctorName={setNewDoctorName}
                newDoctorUsername={newDoctorUsername}
                setNewDoctorUsername={setNewDoctorUsername}
                newDoctorPassword={newDoctorPassword}
                setNewDoctorPassword={setNewDoctorPassword}
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
                />
            );
    }
}
