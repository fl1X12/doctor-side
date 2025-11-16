import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { authAxios } from '../../lib/utils';

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

// FINAL REVISED Speedometer Graph Component
const SpeedometerGraph = ({ title, value = 0, maxValue = 100, size = 160, showPercentage = false, thresholds = null, units = '' }) => {
  const radius = (size - 40) / 2;
  const strokeWidth = 8;
  const center = size / 2;

  const percentage = Math.min(Math.max(value / maxValue, 0), 1);
  let statusColor, statusText;

  // Determine color based on custom or default thresholds
  if (thresholds) {
    const isInRange = (ranges) => {
      return ranges.some(range => {
        const min = range.min !== undefined ? range.min : -Infinity;
        const max = range.max !== undefined ? range.max : Infinity;
        return value >= min && value <= max;
      });
    };

    if (thresholds.good && isInRange(thresholds.good)) { statusColor = colors.greenStatus; statusText = 'Good'; }
    else if (thresholds.ok && isInRange(thresholds.ok)) { statusColor = colors.yellowStatus; statusText = 'OK'; }
    else if (thresholds.bad && isInRange(thresholds.bad)) { statusColor = colors.redStatus; statusText = 'Bad'; }
    else { statusColor = colors.mediumSlateText; statusText = 'N/A'; }
  } else {
    if (percentage > 0.66) { statusColor = colors.greenStatus; statusText = 'Good'; }
    else if (percentage >= 0.33) { statusColor = colors.yellowStatus; statusText = 'OK'; }
    else { statusColor = colors.redStatus; statusText = 'Bad'; }
  }

  // Calculate arc path
  const angle = percentage * 180;
  const startAngle = 180;
  const endAngle = startAngle + angle;
  const startX = center + radius * Math.cos((startAngle * Math.PI) / 180);
  const startY = center + radius * Math.sin((startAngle * Math.PI) / 180);
  const endX = center + radius * Math.cos((endAngle * Math.PI) / 180);
  const endY = center + radius * Math.sin((endAngle * Math.PI) / 180);
  const largeArcFlag = angle > 180 ? 1 : 0;
  const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  const unitString = showPercentage ? '%' : (units ? `${units}` : '');

  // --- DYNAMIC POSITIONING LOGIC ---
  // This approach uses a single text block with multiple text anchors for robust alignment.
  const combinedText = `${value} ${unitString}`;

  return (
    <View style={styles.speedometerContainer}>
      <Text style={styles.speedometerTitle}>{title}</Text>
      <View style={styles.speedometerWrapper}>
        <Svg width={size} height={size / 2 + 40}>
          <Path
            d={`M ${center + radius * Math.cos(Math.PI)} ${center + radius * Math.sin(Math.PI)} A ${radius} ${radius} 0 0 1 ${center + radius * Math.cos(0)} ${center + radius * Math.sin(0)}`}
            stroke="#e0e0e0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Path d={pathData} stroke={statusColor} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />

          {/* Value and Unit displayed together in a single group to handle centering */}
          <SvgText
            x={center}
            y={center - 10}
            textAnchor="end" // Anchor to the right of the value
            fontSize={20}
            fontWeight="bold"
            fill={colors.darkSlateText}
          >
            {value}
          </SvgText>
          <SvgText
            x={center + 4} // Add a small gap
            y={center - 10}
            textAnchor="start" // Anchor to the left of the unit
            fontSize={14}
            fontWeight="600"
            fill={colors.mediumSlateText}
          >
            {unitString}
          </SvgText>

          <SvgText x={center} y={center + 10} textAnchor="middle" fontSize={12} fill={colors.mediumSlateText}>
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
  const [complianceData, setComplianceData] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [selectedTimeframe, setSelectedTimeframe] = useState('1 week');
  const [showPillModal, setShowPillModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const timeframeOptions = ['1 week', '2 weeks', '1 Month', '2 Months'];

  const getTimeframePeriodKey = (timeframe) => {
    const mapping = {
      '1 week': '1-week',
      '2 weeks': '2-weeks',
      '1 Month': '1-month',
      '2 Months': '2-months'
    };
    return mapping[timeframe] || '1-week';
  };

  const getCurrentPeriodVitalsData = () => {
    if (!vitalsData) return null;
    const periodKey = getTimeframePeriodKey(selectedTimeframe);
    return vitalsData[periodKey] || null;
  };

  const currentPeriodVitals = getCurrentPeriodVitalsData();

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

        const response = await authAxios.get(`/patients/by/${identifier}`);
        const data = response.data;
        setPatientData(data);

        let vitals = {};
        if (data.session && data.session.id) {
          try {
            const vitalsResponse = await authAxios.get(`/patients/${data.session.id}/vitals`);
            vitals = vitalsResponse.data;
            console.log(vitals);
          } catch (err) { console.warn("Failed to fetch vitals:", err); }
        }

        if (data.user && data.user.id) {
          try {
            const vitalsSummaryResponse = await authAxios.get(`/patients/${data.user.id}/vitals-summary`);
            setVitalsData(vitalsSummaryResponse.data);
          } catch (err) { console.warn("Failed to fetch vitals summary:", err); }

          try {
            const complianceResponse = await authAxios.get(`/medicines/${data.user.id}/stats`);
            setComplianceData(complianceResponse.data);
          } catch (err) { console.warn("Failed to fetch compliance stats:", err); }

          try {
            const medicinesResponse = await authAxios.get(`/medicines/${data.user.id}`);
            setMedicines(medicinesResponse.data);
          } catch (err) { console.warn("Failed to fetch medicines:", err); }
        }

        const latestExamData = {
          temperature: vitals.temperature ?? data.session?.temperature,
          respiratoryRate: vitals.respiratoryRate ?? data.session?.respiratoryRate,
          oxygenSaturation: vitals.oxygenSaturation ?? data.session?.oxygenSaturation,
          jaundice: (vitals.jaundice ?? data.session?.jaundice) || 'absent',
          feetEdema: (vitals.feet_swelling ?? data.session?.feet_swelling) || 'absent',
          weight: vitals.weight ?? data.session?.weight,
          visitDate: vitals.visitDate ? new Date(vitals.visitDate).toLocaleDateString() : (data.session?.visitDate ? new Date(data.session.visitDate).toLocaleDateString() : 'N/A'),
          age: data.user?.age,
          gender: data.user?.gender,
          pregnancyWeeks: data.maternal_health?.gestational_age,
          pulse: vitals.heartRate ?? null,
        };
        setExamData(latestExamData);

      } catch (err) {
        console.error("Error fetching patient details:", err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          Alert.alert("Session Expired", "Please log in again.");
          router.replace('/admin');
        } else {
          setError(`Failed to load data: ${err.response?.data?.error || err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPatientDetails();
  }, [uhiNo, name, router]);

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

  if (!patientData || !patientData.user) {
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

        <View style={styles.dropdownContainer}>
          <TouchableOpacity style={styles.dropdownHeader} onPress={() => setDropdownOpen(!dropdownOpen)}>
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
                  style={[styles.dropdownOption, selectedTimeframe === option && styles.selectedDropdownOption]}
                  onPress={() => { setSelectedTimeframe(option); setDropdownOpen(false); }}
                >
                  <Text style={[styles.dropdownOptionText, selectedTimeframe === option && styles.selectedDropdownOptionText]}>
                    {option}
                  </Text>
                  {selectedTimeframe === option && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.speedometerGrid}>
          <SpeedometerGraph
            title="Heart Rate"
            value={examData?.pulse || 0}
            maxValue={120}
            units="bpm"
            thresholds={{ good: [{min: 60, max: 100}], ok: [{min: 50, max: 59}, {min: 101, max: 110}], bad: [{min: 0, max: 49}, {min: 111, max: 120}] }}
          />
          <SpeedometerGraph
            title="Medicine Compliance"
            value={complianceData?.consistency || 0}
            maxValue={100}
            showPercentage={true}
            thresholds={{ good: [{min: 67, max: 100}], ok: [{min: 33, max: 66}], bad: [{min: 0, max: 32}] }}
          />
          <SpeedometerGraph
            title="Blood Pressure"
            value={currentPeriodVitals?.bloodPressure?.systolic || 0}
            maxValue={180}
            units="mmHg"
            thresholds={{ good: [{min: 90, max: 120}], ok: [{min: 121, max: 139}], bad: [{min: 0, max: 89}, {min: 140, max: 180}] }}
          />
          <SpeedometerGraph
            title="Temperature"
            value={examData?.temperature || 0}
            maxValue={42}
            units="°C"
            thresholds={{ good: [{min: 36.1, max: 37.2}], ok: [{min: 35.5, max: 36.0}, {min: 37.3, max: 38.0}], bad: [{min: 0, max: 35.4}, {min: 38.1, max: 42}] }}
          />
          <SpeedometerGraph
            title="Oxygen Saturation"
            value={examData?.oxygenSaturation || 0}
            maxValue={100}
            units="%"
            thresholds={{ good: [{min: 95, max: 100}], ok: [{min: 90, max: 94}], bad: [{min: 0, max: 89}] }}
          />
          <SpeedometerGraph
            title="AFI"
            value={currentPeriodVitals?.afi || examData?.afi || 0}
            maxValue={30}
            units="cm"
            thresholds={{ good: [{min: 8, max: 18}], ok: [{min: 5, max: 7.9}, {min: 18.1, max: 24}], bad: [{min: 0, max: 4.9}, {min: 24.1, max: 30}] }}
          />
        </View>
      </ScrollView>

      <View style={styles.pillButtonContainer}>
        <TouchableOpacity style={styles.pillButton} onPress={() => setShowPillModal(true)}>
          <Text style={styles.pillIcon}>💊</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showPillModal} transparent={true} animationType="slide" onRequestClose={() => setShowPillModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.miniWindow}>
            <View style={styles.miniWindowHeader}>
              <Text style={styles.miniWindowTitle}>Additional Information</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowPillModal(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.miniWindowContent}>
              <Text style={styles.prescriptionHeading}>Prescription for {patientData.user.name || 'Patient'}</Text>
              {medicines.length > 0 ? (
                medicines.map((medicine, index) => (
                  <View key={index} style={styles.prescriptionCard}>
                    <Text style={styles.medicineName}>{medicine.name}</Text>
                    <View style={styles.medicineDetail}>
                      <Text style={styles.medicineLabel}>Dosage: </Text>
                      <Text style={styles.medicineValue}>{medicine.dosage}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noMedicinesText}>No prescriptions available</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.mainBackgroundFrom },
    scrollViewContent: { flexGrow: 1, paddingBottom: 80 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, fontSize: 16, color: colors.darkSlateText },
    errorText: { fontSize: 16, color: colors.redStatus, textAlign: 'center', padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: colors.headerBackground, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
    backAdminButtonsContainer: { flexDirection: 'row', gap: 10 },
    backButton: { padding: 8, borderRadius: 5, backgroundColor: colors.lightBlue },
    backButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    headerTitleContainer: { flex: 1, marginLeft: 15, alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.darkSlateText },
    headerSubtitle: { fontSize: 12, color: colors.mediumSlateText },
    patientDetails: { alignItems: 'flex-end' },
    patientName: { fontSize: 16, fontWeight: 'bold', color: colors.darkSlateText },
    patientID: { fontSize: 12, color: colors.mediumSlateText },
    speedometerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', padding: 15, gap: 20 },
    speedometerContainer: { width: '45%', backgroundColor: colors.veryLightBlue, borderRadius: 15, padding: 18, marginBottom: 20, borderWidth: 2, borderColor: colors.lightBlue, elevation: 4, shadowColor: colors.lightBlue, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, alignItems: 'center' },
    speedometerTitle: { fontSize: 16, fontWeight: '600', color: colors.mediumSlateText, marginBottom: 15, textAlign: 'center' },
    speedometerWrapper: { alignItems: 'center', justifyContent: 'center' },
    pillButtonContainer: { position: 'absolute', bottom: 30, right: 30, zIndex: 1000 },
    pillButton: { backgroundColor: colors.lightBlue, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5 },
    pillIcon: { fontSize: 24 },
    dropdownContainer: { backgroundColor: 'white', marginHorizontal: 15, marginTop: 10, marginBottom: 20, borderRadius: 12, borderWidth: 1, borderColor: colors.lightBlue, elevation: 3, shadowColor: colors.lightBlue, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    dropdownHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, minHeight: 56, position: 'relative' },
    dropdownHeaderLeft: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 },
    dropdownIcon: { fontSize: 20, marginRight: 12 },
    dropdownTextContainer: { alignItems: 'center' },
    dropdownLabel: { fontSize: 12, color: colors.mediumSlateText, fontWeight: '500', marginBottom: 2, textAlign: 'center' },
    dropdownSelected: { fontSize: 16, color: colors.darkSlateText, fontWeight: '600', textAlign: 'center' },
    dropdownArrow: { fontSize: 14, color: colors.lightBlue, fontWeight: 'bold', position: 'absolute', right: 16 },
    dropdownOptions: { borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: 'white' },
    dropdownOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8f8f8' },
    selectedDropdownOption: { backgroundColor: colors.veryLightBlue },
    dropdownOptionText: { fontSize: 15, color: colors.darkSlateText, fontWeight: '500' },
    selectedDropdownOptionText: { color: colors.darkSlateText, fontWeight: '600' },
    checkIcon: { fontSize: 16, color: colors.lightBlue, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    miniWindow: { backgroundColor: colors.veryLightBlue, borderRadius: 25, width: '90%', maxWidth: 420, maxHeight: '75%', elevation: 15, shadowColor: colors.lightBlue, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, borderWidth: 3, borderColor: colors.lightBlue, overflow: 'hidden' },
    miniWindowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 20, backgroundColor: colors.lightBlue },
    miniWindowTitle: { fontSize: 20, fontWeight: '700', color: 'white' },
    closeButton: { width: 35, height: 35, borderRadius: 18, backgroundColor: colors.mediumSlateText, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
    closeButtonText: { fontSize: 18, color: 'white', fontWeight: 'bold' },
    miniWindowContent: { padding: 25 },
    prescriptionHeading: { fontSize: 22, fontWeight: '700', color: colors.darkSlateText, marginBottom: 20, textAlign: 'center' },
    prescriptionCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: colors.lightBlue, shadowColor: colors.lightBlue, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
    medicineName: { fontSize: 18, fontWeight: '700', color: colors.darkSlateText, marginBottom: 10 },
    medicineDetail: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    medicineLabel: { fontSize: 14, fontWeight: '600', color: colors.mediumSlateText },
    medicineValue: { fontSize: 14, color: colors.darkSlateText },
    noMedicinesText: { fontSize: 16, color: colors.mediumSlateText, textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
});