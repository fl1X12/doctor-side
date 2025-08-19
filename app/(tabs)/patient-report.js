import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Define the custom color palette
const colors = {
  lightBlue: '#A2D2FF',
  veryLightBlue: '#BDE0FE',
  lightPink: '#FFAFCC',
  veryLightPink: '#FFC8DD',
  lightPurple: '#CDB4DB',
  darkSlateText: '#1a202c',
  mediumSlateText: '#2D3748',
  mainBackgroundFrom: '#f8fafc',
  headerBackground: '#e2e8f0',
  greenStatus: '#28a745',
  yellowStatus: '#ffc107',
  redStatus: '#dc3545',
};

// Placeholder for icons
const Icon = ({ name, color, size = 24 }) => (
  <Text style={{ color, fontSize: size, marginRight: 8 }}>{name}</Text>
);

export default function PatientOverviewScreen() {
  const router = useRouter();
  const { name, uhiNo } = useLocalSearchParams();

  const [patientData, setPatientData] = useState(null);
  const [examData, setExamData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (!uhiNo && !name) {
        setError("Missing patient identifier.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const identifier = uhiNo || name;
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert("Authentication Required", "Please log in.");
          router.replace('/admin');
          return;
        }

        // Step 1: Fetch patient and session info
        const response = await fetch(`http://10.164.255.159:5501/api/patients/by/${identifier}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            Alert.alert("Session Expired", "Please log in again.");
            router.replace('/admin');
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch data');
          }
          return;
        }

        const data = await response.json();
        setPatientData(data); // data is { user: {...}, session: {...} }

        // Step 2: Fetch vitals using the session ID
        let vitals = {};
        if (data.session && data.session.id) {
          const vitalsResponse = await fetch(`http://10.164.255.159:5501/api/patients/${data.session.id}/vitals`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (vitalsResponse.ok) {
            vitals = await vitalsResponse.json();
          }
        }

        // Step 3: Map data for UI
        const latestExamData = {
          // From the vitals/session object
          temperature: vitals.temperature ?? data.session?.temperature,
          respiratoryRate: vitals.respiratoryRate ?? data.session?.respiratoryRate,
          oxygenSaturation: vitals.oxygenSaturation ?? data.session?.oxygenSaturation,
          jaundice: (vitals.jaundice ?? data.session?.jaundice) || 'absent',
          feetEdema: (vitals.feet_swelling ?? data.session?.feet_swelling) || 'absent',
          weight: vitals.weight ?? data.session?.weight,
          visitDate: vitals.visitDate
            ? new Date(vitals.visitDate).toLocaleDateString()
            : (data.session?.visitDate ? new Date(data.session.visitDate).toLocaleDateString() : 'N/A'),

          // From the user object
          age: data.user?.age,
          gender: data.user?.gender,

          // From related models (if they were included in the response)
          pregnancyWeeks: data.maternal_health?.gestational_age,
          pulse: vitals.heartRate ?? null,
          systolicBP: vitals.bloodPressure.systolic ?? null,
          diastolicBP: vitals.bloodPressure.diastolic ?? null,
        };

        setExamData(latestExamData);

      } catch (err) {
        console.error("Error fetching patient details:", err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDetails();
  }, [uhiNo, name, router]);

  const getPregnancyProgress = (data) => {
    return Math.min(((data?.pregnancyWeeks || 0) / 40) * 100, 100);
  };

  // --- UI RENDERING FIXES ---
  // The rest of the component now reads from the corrected `patientData` and `examData` state.

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.lightBlue} />
        <Text style={styles.loadingText}>Loading patient data...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!patientData || !patientData.user) { // Check for patientData.user
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>No patient data available.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Header */}
        <View style={styles.header}>
            <View style={styles.backAdminButtonsContainer}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.replace('/(tabs)/admin')} style={styles.backButton}>
                    <Text style={styles.backButtonText}>ADMIN</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Clinical Dashboard</Text>
                <Text style={styles.headerSubtitle}>Assessment Overview • {currentTime}</Text>
            </View>
            <View style={styles.patientDetails}>
                <Text style={styles.patientName}>{patientData.user.name || 'N/A'}</Text>
                <Text style={styles.patientID}>UHI: {patientData.user.uhiNo || 'N/A'}</Text>
            </View>
        </View>

        {/* Main Content Grid */}
        <View style={styles.gridContainer}>
            {/* Patient Demographics Card */}
            <View style={[styles.card, { backgroundColor: `${colors.veryLightBlue}22`, borderColor: `${colors.lightBlue}55` }]}>
                <Text style={styles.sectionTitle}>
                    <Icon name="👤" color={colors.lightBlue} size={16} />Patient Demographics
                </Text>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Age:</Text>
                    <Text style={styles.detailValue}>{examData.age || 'N/A'} years</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Gender:</Text>
                    <Text style={styles.detailValue}>{examData.gender || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Last Visit:</Text>
                    <Text style={styles.detailValue}>{examData.visitDate}</Text>
                </View>
            </View>

            {/* Heart Rate & BP Card */}
            <View style={[styles.card, { backgroundColor: `${colors.veryLightPink}22`, borderColor: `${colors.lightPink}55` }]}>
                <Text style={styles.sectionTitle}>
                    <Icon name="❤️" color={colors.lightPink} size={16} />Cardiovascular
                </Text>
                 <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Heart Rate:</Text>
                    <Text style={styles.detailValue}>{examData.pulse || 'N/A'} BPM</Text>
                </View>
                 <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Blood Pressure:</Text>
                    <Text style={styles.detailValue}>{examData.systolicBP || 'N/A'} / {examData.diastolicBP || 'N/A'} mmHg</Text>
                </View>
            </View>

            {/* Vital Signs Card */}
            <View style={[styles.card, { backgroundColor: `${colors.veryLightBlue}22`, borderColor: `${colors.lightBlue}55` }]}>
                <Text style={styles.sectionTitle}>
                    <Icon name="🩺" color={colors.lightBlue} size={16} />Vital Signs
                </Text>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Temperature:</Text>
                    <Text style={styles.detailValue}>{examData.temperature || 'N/A'}°F</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Resp. Rate:</Text>
                    <Text style={styles.detailValue}>{examData.respiratoryRate || 'N/A'} breaths/min</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>O₂ Saturation:</Text>
                    <Text style={styles.detailValue}>{examData.oxygenSaturation || 'N/A'}%</Text>
                </View>
            </View>

            {/* Physical Examination Card */}
            <View style={[styles.card, { backgroundColor: `${colors.lightPurple}22`, borderColor: `${colors.lightPurple}55` }]}>
                <Text style={styles.sectionTitle}>
                    <Icon name="🧪" color={colors.lightPurple} size={16} />Physical Examination
                </Text>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Jaundice:</Text>
                    <Text style={styles.detailValue}>{examData.jaundice}</Text>
                </View>
                 <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Feet Edema:</Text>
                    <Text style={styles.detailValue}>{examData.feetEdema}</Text>
                </View>
            </View>
            
            {/* ... Other cards can be added here ... */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


// Styles (simplified for clarity, use your full stylesheet)
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.mainBackgroundFrom,
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: colors.darkSlateText,
    },
    errorText: {
        fontSize: 16,
        color: colors.redStatus,
        textAlign: 'center',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: colors.headerBackground,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backAdminButtonsContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    backButton: {
        padding: 8,
        borderRadius: 5,
        backgroundColor: colors.lightBlue,
    },
    backButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 15,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.darkSlateText,
    },
    headerSubtitle: {
        fontSize: 12,
        color: colors.mediumSlateText,
    },
    patientDetails: {
        alignItems: 'flex-end',
    },
    patientName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.darkSlateText,
    },
    patientID: {
        fontSize: 12,
        color: colors.mediumSlateText,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        padding: 10,
    },
    card: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.mediumSlateText,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    detailLabel: {
        fontSize: 14,
        color: colors.darkSlateText,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
});
