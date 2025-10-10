import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

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

// Speedometer Graph Component
const SpeedometerGraph = ({ title, value = 0, maxValue = 100, size = 160 }) => {
  const radius = (size - 40) / 2;
  const strokeWidth = 8;
  const circumference = Math.PI * radius;
  const center = size / 2;

  // Calculate percentage and determine color/status
  const percentage = Math.min(Math.max(value / maxValue, 0), 1);
  let statusColor, statusText;

  if (percentage <= 0.33) {
    statusColor = colors.greenStatus; // Good
    statusText = 'Good';
  } else if (percentage <= 0.66) {
    statusColor = colors.yellowStatus; // OK
    statusText = 'OK';
  } else {
    statusColor = colors.redStatus; // Bad
    statusText = 'Bad';
  }

  // Calculate arc path for the meter
  const angle = percentage * 180; // Half circle (180 degrees)
  const startAngle = 180; // Start from left
  const endAngle = startAngle + angle;

  const startX = center + radius * Math.cos((startAngle * Math.PI) / 180);
  const startY = center + radius * Math.sin((startAngle * Math.PI) / 180);
  const endX = center + radius * Math.cos((endAngle * Math.PI) / 180);
  const endY = center + radius * Math.sin((endAngle * Math.PI) / 180);

  const largeArcFlag = angle > 180 ? 1 : 0;

  const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;

  return (
    <View style={styles.speedometerContainer}>
      <Text style={styles.speedometerTitle}>{title}</Text>
      <View style={styles.speedometerWrapper}>
        <Svg width={size} height={size / 2 + 40}>
          {/* Background arc */}
          <Path
            d={`M ${center + radius * Math.cos(Math.PI)} ${center + radius * Math.sin(Math.PI)} A ${radius} ${radius} 0 0 1 ${center + radius * Math.cos(0)} ${center + radius * Math.sin(0)}`}
            stroke="#e0e0e0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress arc */}
          <Path
            d={pathData}
            stroke={statusColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          {/* Center value text */}
          <SvgText
            x={center}
            y={center - 10}
            textAnchor="middle"
            fontSize="18"
            fontWeight="bold"
            fill={colors.darkSlateText}
          >
            {value}
          </SvgText>
          <SvgText
            x={center}
            y={center + 10}
            textAnchor="middle"
            fontSize="12"
            fill={colors.mediumSlateText}
          >
            {statusText}
          </SvgText>
        </Svg>
      </View>
    </View>
  );
};

export default function PatientOverviewScreen() {
  const router = useRouter();
  const { name, uhiNo } = useLocalSearchParams();

  const [patientData, setPatientData] = useState(null);
  const [examData, setExamData] = useState({});
  const [vitalsData, setVitalsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [selectedTimeframe, setSelectedTimeframe] = useState('1 week');
  const [showPillModal, setShowPillModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const timeframeOptions = ['1 week', '2 weeks', '1 Month', '2 Months'];

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
        const response = await fetch(`http://10.72.198.159:5501/api/patients/by/${identifier}`, {
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
          const vitalsResponse = await fetch(`http://10.72.198.159:5501/api/patients/${data.session.id}/vitals`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (vitalsResponse.ok) {
            vitals = await vitalsResponse.json();
          }
        }

        // Step 3: Fetch vitals summary using the user ID
        if (data.user && data.user.id) {
          const vitalsSummaryResponse = await fetch(`http://10.72.198.159:5501/api/patients/${data.user.id}/vitals-summary`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (vitalsSummaryResponse.ok) {
            const vitalsSummary = await vitalsSummaryResponse.json();
            setVitalsData(vitalsSummary);
          }
        }

        // Step 4: Map data for UI
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

        {/* Timeframe Dropdown */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() => setDropdownOpen(!dropdownOpen)}
          >
            <View style={styles.dropdownHeaderLeft}>
              <Text style={styles.dropdownIcon}>📅</Text>
              <View style={styles.dropdownTextContainer}>
                <Text style={styles.dropdownLabel}>Time Period</Text>
                <Text style={styles.dropdownSelected}>{selectedTimeframe}</Text>
              </View>
            </View>
            <Text style={styles.dropdownArrow}>{dropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {dropdownOpen && (
            <View style={styles.dropdownOptions}>
              {timeframeOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dropdownOption,
                    selectedTimeframe === option && styles.selectedDropdownOption
                  ]}
                  onPress={() => {
                    setSelectedTimeframe(option);
                    setDropdownOpen(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    selectedTimeframe === option && styles.selectedDropdownOptionText
                  ]}>
                    {option}
                  </Text>
                  {selectedTimeframe === option && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Speedometer Graphs Grid */}
        <View style={styles.speedometerGrid}>
          <SpeedometerGraph
            title="Heart Rate"
            value={examData?.pulse || 0}
            maxValue={120}
          />
          <SpeedometerGraph
            title="Blood Pressure"
            value={vitalsData?.bloodPressure?.systolic || 0}
            maxValue={180}
          />
          <SpeedometerGraph
            title="Temperature"
            value={examData?.temperature || 0}
            maxValue={42}
          />
          <SpeedometerGraph
            title="Respiratory Rate"
            value={examData?.respiratoryRate || 0}
            maxValue={30}
          />
          <SpeedometerGraph
            title="Oxygen Saturation"
            value={examData?.oxygenSaturation || 0}
            maxValue={100}
          />
          <SpeedometerGraph
            title="Weight"
            value={vitalsData?.weight || examData?.weight || 0}
            maxValue={150}
          />
        </View>

      </ScrollView>

      {/* Fixed Pill Button */}
      <View style={styles.pillButtonContainer}>
        <TouchableOpacity
          style={styles.pillButton}
          onPress={() => setShowPillModal(true)}
        >
          <Text style={styles.pillIcon}>💊</Text>
        </TouchableOpacity>
      </View>

      {/* Pill Modal */}
      <Modal
        visible={showPillModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPillModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.miniWindow}>
            <View style={styles.miniWindowHeader}>
              <Text style={styles.miniWindowTitle}>Additional Information</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPillModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.miniWindowContent}>
              <Text style={styles.contentTitle}>Quick Actions</Text>

              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>📊 View Trends</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>📋 Export Data</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>⚙️ Settings</Text>
              </TouchableOpacity>

              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Patient Status</Text>
                <Text style={styles.infoText}>Last updated: {currentTime}</Text>
                <Text style={styles.infoText}>Data range: {selectedTimeframe}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
    speedometerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        padding: 15,
        gap: 20,
    },
    speedometerContainer: {
        width: '45%',
        backgroundColor: colors.veryLightBlue,
        borderRadius: 15,
        padding: 18,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: colors.lightBlue,
        elevation: 4,
        shadowColor: colors.lightBlue,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        alignItems: 'center',
    },
    speedometerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.mediumSlateText,
        marginBottom: 15,
        textAlign: 'center',
    },
    speedometerWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Pill Button Styles
    pillButtonContainer: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        zIndex: 1000,
    },
    pillButton: {
        backgroundColor: colors.lightBlue,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    pillIcon: {
        fontSize: 24,
    },

    // Dropdown Styles
    dropdownContainer: {
        backgroundColor: 'white',
        marginHorizontal: 15,
        marginTop: 10,
        marginBottom: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.lightBlue,
        elevation: 3,
        shadowColor: colors.lightBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 56,
        position: 'relative',
    },
    dropdownHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    dropdownIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    dropdownTextContainer: {
        alignItems: 'center',
    },
    dropdownLabel: {
        fontSize: 12,
        color: colors.mediumSlateText,
        fontWeight: '500',
        marginBottom: 2,
        textAlign: 'center',
    },
    dropdownSelected: {
        fontSize: 16,
        color: colors.darkSlateText,
        fontWeight: '600',
        textAlign: 'center',
    },
    dropdownArrow: {
        fontSize: 14,
        color: colors.lightBlue,
        fontWeight: 'bold',
        position: 'absolute',
        right: 16,
    },
    dropdownOptions: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: 'white',
    },
    dropdownOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f8f8',
    },
    selectedDropdownOption: {
        backgroundColor: colors.veryLightBlue,
    },
    dropdownOptionText: {
        fontSize: 15,
        color: colors.darkSlateText,
        fontWeight: '500',
    },
    selectedDropdownOptionText: {
        color: colors.darkSlateText,
        fontWeight: '600',
    },
    checkIcon: {
        fontSize: 16,
        color: colors.lightBlue,
        fontWeight: 'bold',
    },

    // Modal and Mini Window Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    miniWindow: {
        backgroundColor: colors.veryLightBlue,
        borderRadius: 25,
        width: '90%',
        maxWidth: 420,
        maxHeight: '75%',
        elevation: 15,
        shadowColor: colors.lightBlue,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        borderWidth: 3,
        borderColor: colors.lightBlue,
        overflow: 'hidden',
    },
    miniWindowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingVertical: 20,
        backgroundColor: colors.lightBlue,
    },
    miniWindowTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
    },
    closeButton: {
        width: 35,
        height: 35,
        borderRadius: 18,
        backgroundColor: colors.mediumSlateText,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    closeButtonText: {
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold',
    },
    miniWindowContent: {
        padding: 25,
    },
    contentTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.darkSlateText,
        marginBottom: 20,
        textAlign: 'center',
    },
    actionButton: {
        backgroundColor: 'white',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 15,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: colors.lightBlue,
        elevation: 3,
        shadowColor: colors.lightBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    actionButtonText: {
        fontSize: 16,
        color: colors.darkSlateText,
        fontWeight: '600',
        textAlign: 'center',
    },
    infoSection: {
        marginTop: 25,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 18,
        borderWidth: 2,
        borderColor: colors.lightBlue,
        elevation: 2,
        shadowColor: colors.lightBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.darkSlateText,
        marginBottom: 12,
        textAlign: 'center',
    },
    infoText: {
        fontSize: 15,
        color: colors.mediumSlateText,
        marginBottom: 8,
        textAlign: 'center',
        fontWeight: '500',
    },
});
