import AsyncStorage from '@react-native-async-storage/async-storage'; // Make sure this is installed: npx expo install @react-native-async-storage/async-storage
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Define the custom color palette using the provided hex codes and derived shades
const colors = {
  lightBlue: '#A2D2FF',        // Main light blue
  veryLightBlue: '#BDE0FE',  // Very light blue for subtle accents
  lightPink: '#FFAFCC',        // Main light pink
  veryLightPink: '#FFC8DD',  // Very light pink for subtle accents
  lightPurple: '#CDB4DB',    // Light purple for accents/health score

  // Derived darker shades for text and icons based on user's latest code
  darkSlateText: '#1a202c',  // Similar to slate-800/900 for main text
  mediumSlateText: '#2D3748', // Similar to slate-700/600 for secondary text

  // Backgrounds from user's latest code
  mainBackgroundFrom: '#f8fafc', // from-slate-50
  mainBackgroundTo: '#f1f5f9',      // to-slate-100
  headerBackground: '#e2e8f0',      // A light grey for header (similar to slate-200)

  // Status indicators
  greenStatus: '#28a745', // Green for normal/absent
  yellowStatus: '#ffc107', // Yellow for mild/present (pallor)
  redStatus: '#dc3545',      // Red for severe/present (jaundice, edema)
};

// Placeholder for icons.
const Icon = ({ name, color, size = 24 }) => {
  return <Text style={{ color, fontSize: size, marginRight: 8 }}>{name}</Text>;
};

export default function PatientOverviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { name, uhiNo } = params; // Extract name and uhiNo directly

  const [patientData, setPatientData] = useState(null); // Will store full patient object
  const [examData, setExamData] = useState({}); // To hold the latest examination parameters
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Effect to update the current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Effect to fetch patient data from the backend
  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (!uhiNo && !name) {
        setError("Missing patient identifier (UHI No or Name).");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const identifier = uhiNo || name;
        const encodedIdentifier = encodeURIComponent(identifier);

        // --- IMPORTANT: Retrieve the JWT token using the correct key 'token' ---
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          // If no token is found, redirect to the login screen
          Alert.alert("Authentication Required", "Please log in to view patient data.");
          router.replace('/admin'); // Assuming '/admin' is your login route
          setLoading(false);
          return;
        }

        // For development with Expo Go on a physical device, replace 'localhost' with your machine's IP address.
        const response = await fetch(`http://10.226.222.219:5000/api/patients/${encodedIdentifier}`, {
          headers: {
            'Authorization': `Bearer ${token}`, // Include the JWT in the Authorization header
            'Content-Type': 'application/json', // Ensure content type is set
          },
        });

        if (!response.ok) {
          // Handle specific authentication errors
          if (response.status === 401 || response.status === 403) {
            await AsyncStorage.removeItem('token'); // Clear invalid token
            await AsyncStorage.removeItem('doctorInfo');
            Alert.alert("Session Expired", "Your session has expired or you are unauthorized. Please log in again.");
            router.replace('/admin'); // Redirect to login
            setLoading(false);
            return;
          }

          // Try to parse error message if it's JSON, otherwise use a generic message
          const contentType = response.headers.get('content-type');
          let errorMessage = 'Failed to fetch patient data.';
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            // If it's not JSON, get the text directly to avoid SyntaxError
            errorMessage = await response.text() || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        setPatientData(data);

        // Initialize examData with direct vital fields from patientData
        const latestExamData = {
          temperature: data.temperature || null,
          respiratoryRate: data.respiratoryRate || null,
          oxygenSaturation: data.oxygenSaturation || null,
          jaundice: data.jaundice || 'absent', // Use 'absent' as default based on schema
          feetEdema: data.feet || 'absent', // Use 'absent' as default based on schema, renamed for clarity
          weight: data.weight || null,
          visitDate: data.visitDate ? new Date(data.visitDate).toLocaleDateString() : 'N/A', // Format date
        };

        // Process parameters array to get the latest value for each type
        data.parameters.forEach(param => {
          if (param.values && param.values.length > 0) {
            // Sort values by date to ensure the latest is truly picked
            const sortedValues = [...param.values].sort((a, b) => new Date(a.date) - new Date(b.date));
            const latestValue = sortedValues[sortedValues.length - 1].value;

            // Special handling for blood pressure if it's an object {systolic, diastolic}
            if (param.type === 'bloodPressure' && typeof latestValue === 'object' && latestValue !== null) {
              latestExamData.systolicBP = latestValue.systolic || null;
              latestExamData.diastolicBP = latestValue.diastolic || null;
            } else {
              latestExamData[param.type] = latestValue;
            }
          }
        });

        // Map parameter types to examData keys for display consistency
        // Prioritize direct patientData fields, then parameters
        latestExamData.pulse = latestExamData.heartRate || null; // 'heartRate' from parameters
        // systolicBP and diastolicBP are handled above if 'bloodPressure' is an object parameter
        // If they come as separate params, ensure their mapping logic matches
        // e.g., latestExamData.systolicBP = latestExamData.bloodPressureSystolic || latestExamData.systolicBP || null;

        latestExamData.fetalLie = latestExamData.fetalLie || null; // From parameters
        latestExamData.eyePallor = latestExamData.eyePallor || 'Absent'; // From parameters
        latestExamData.nailCondition = latestExamData.nailCondition || 'Normal'; // From parameters
        latestExamData.pregnancyWeeks = latestExamData.gestationalAge || data.maternalHealth?.gestationalAge || null;
        latestExamData.fundalHeight = latestExamData.fundalHeight || null; // From parameters
        latestExamData.generalHealth = latestExamData.generalHealth || 'N/A'; // From parameters or to be added

        // Abdominal Assessment specific parameters (from parameters)
        latestExamData.abdominalTenderness = latestExamData.abdominalTenderness || 'Absent';
        latestExamData.fetalHeartRate = latestExamData.fetalHeartRate || null;

        // Derive pedemaPresent from feetEdema for UI compatibility
        latestExamData.pedemaPresent = latestExamData.feetEdema === 'mild' || latestExamData.feetEdema === 'severe';

        setExamData(latestExamData);

      } catch (err) {
        console.error("Error fetching patient details:", err);
        setError(`Failed to load patient data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDetails();
  }, [uhiNo, name, router]); // Re-run when uhiNo or name changes

  // Removed getHealthScore function as requested.

  // Calculate pregnancy progress percentage
  // Assuming full term is 40 weeks for a simple linear progress
  const getPregnancyProgress = (data) => {
    return Math.min(((data?.pregnancyWeeks || 0) / 40) * 100, 100);
  };

  // Data for charts (using internal sample for demonstration) - these should ideally come from parameters history
  // For actual implementation, you'd fetch the historical 'heartRate' and 'bloodPressure' parameters
  const pulseTrendData = [72, 75, 78, 76, 80, 78, 77]; // Example pulse readings, replace with patientData.parameters history
  const bpTrendData = [
    { systolic: 118, diastolic: 78 },
    { systolic: 122, diastolic: 80 },
    { systolic: 120, diastolic: 79 },
    { systolic: 121, diastolic: 80 },
    { systolic: 119, diastolic: 78 }
  ]; // Example BP readings, replace with patientData.parameters history

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

  if (!patientData) {
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
          <View style={styles.backAdminButtonsContainer}> {/* New container for spacing */}
            <TouchableOpacity onPress={() => router.push(`/(tabs)/patient?name=${encodeURIComponent(name)}&uhiNo=${encodeURIComponent(uhiNo)}`)} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace('/admin')} style={styles.backButton}> {/* Redirect to /admin (login) */}
              <Text style={styles.backButtonText}>← ADMIN</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Clinical Examination Dashboard</Text>
            <Text style={styles.headerSubtitle}>Patient Assessment Overview • {currentTime}</Text>
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>{patientData.patientName || 'N/A'}</Text>
            <Text style={styles.patientID}>UHI: {patientData.uhiNo || 'N/A'}</Text>
          </View>
        </View>

        {/* Patient Details Bar - Updated */}
        <View style={styles.patientInfoBar}>
          {/* Age, Gender, Last Visit moved to a new card */}
          <Text style={styles.currentDate}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Main Content Grid */}
        <View style={styles.gridContainer}>
          {/* Heart Rate & BP Card (Pink Theme) */}
          

          {/* NEW Patient Info Card (replacing the original patientInfoBar items) */}
          {/* MOVED to be next to Heart Rate & BP Card */}
          <View style={[styles.card, { backgroundColor: `${colors.veryLightBlue}22`, borderColor: `${colors.lightBlue}55` }]}>
            <Text style={styles.sectionTitle}>
              <Icon name="👤" color={colors.lightBlue} size={16} />Patient Demographics
            </Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Age:</Text>
              <Text style={styles.detailValue}>{patientData.details?.age || 'N/A'} years</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gender:</Text>
              <Text style={styles.detailValue}>{patientData.details?.gender || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Visit:</Text>
              <Text style={styles.detailValue}>{new Date(patientData.createdAt).toLocaleDateString() || 'N/A'}</Text>
            </View>
          </View>
          <View style={[styles.card, { backgroundColor: `${colors.veryLightPink}22`, borderColor: `${colors.lightPink}55` }]}>
            <View style={styles.cardHeaderRow}>
              <Icon name="❤️" color={colors.lightPink} size={32} />
              <View style={[styles.statusIndicator, { backgroundColor: examData.pulse && (examData.pulse < 60 || examData.pulse > 100) ? colors.yellowStatus : colors.greenStatus }]} />
            </View>
            <Text style={styles.kpiValue}>{examData.pulse || 'N/A'}</Text>
            <Text style={styles.kpiLabel}>Heart Rate (BPM)</Text>
            <View style={[styles.innerCard, { backgroundColor: `${colors.veryLightPink}44` }]}>
              <Text style={styles.innerCardText}>BP: {examData.systolicBP || 'N/A'}/{examData.diastolicBP || 'N/A'} mmHg</Text>
              <Text style={styles.innerCardSubText}>Cardio: {patientData.analysis?.cardiovascularStatus || 'N/A'}</Text> {/* Assuming this is in analysis or add as parameter */}
            </View>
          </View>

          {/* Vital Signs Card (Blue Theme) */}
          <View style={[styles.card, { backgroundColor: `${colors.veryLightBlue}22`, borderColor: `${colors.lightBlue}55` }]}>
            <Text style={styles.sectionTitle}>
              <Icon name="🩺" color={colors.lightBlue} size={16} />Vital Signs
            </Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Temperature</Text>
              <Text style={styles.detailValue}>{examData.temperature || 'N/A'}°F</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Respiratory Rate</Text>
              <Text style={styles.detailValue}>{examData.respiratoryRate || 'N/A'} breaths/min</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Oxygen Saturation</Text>
              <Text style={styles.detailValue}>{examData.oxygenSaturation || 'N/A'}%</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fetal Lie</Text>
              <Text style={styles.detailValue}>{examData.fetalLie || 'N/A'}</Text>
            </View>
          </View>

          {/* Pregnancy Gestation Card with Progress Bar (Purple Theme) */}
          <View style={[styles.card, { backgroundColor: `${colors.lightPurple}22`, borderColor: `${colors.lightPurple}55` }]}>
            <View style={styles.cardHeaderRow}>
              {/* Using emoji as a placeholder. For a graphic icon, integrate a library like @expo/vector-icons. */}
              <Icon name="👶" color={colors.lightPurple} size={32} />
              <View style={[styles.statusIndicator, { backgroundColor: colors.lightPink }]} />
            </View>
            <Text style={styles.kpiValue}>{examData.pregnancyWeeks || 'N/A'}</Text>
            <Text style={styles.kpiLabel}>Weeks Gestation</Text>
            {/* Linear Progress Bar for Pregnancy Progress */}
            <View style={[styles.progressBarBackground, { backgroundColor: `${colors.lightPurple}55` }]}>
              <View
                style={[styles.progressBarFill, { width: `${getPregnancyProgress(examData)}%`, backgroundColor: colors.lightPink }]}
              />
            </View>
            <Text style={styles.innerCardText}>Fundal: {examData.fundalHeight || 'N/A'}cm</Text>
          </View>

          {/* Pulse Trend Chart (Blue Theme) */}
          <View style={[styles.card, { flex: 1, backgroundColor: `${colors.veryLightPink}22`, borderColor: `${colors.lightBlue}55` }]}>
            <Text style={styles.chartTitle}>
              <Icon name="📈" color={colors.lightBlue} size={16} />Pulse Trend (Last 7 readings)
            </Text>
            <View style={styles.chartContainer}>
              <View style={styles.chartYAxis}>
                <Text style={styles.chartYAxisLabel}>100</Text>
                <Text style={styles.chartYAxisLabel}>80</Text>
                <Text style={styles.chartYAxisLabel}>60</Text>
              </View>
              <View style={styles.chartBarsContainer}>
                {/* Dynamically generate from patientData.parameters of type 'heartRate' */}
                {pulseTrendData.map((value, index) => (
                  <View key={index} style={styles.chartBarWrapper}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: (value - 60) * 3, // Scale to show variation
                          backgroundColor: value > 80 ? colors.lightPink : colors.lightBlue
                        }
                      ]}
                    />
                    <Text style={styles.chartBarLabel}>{index === 0 ? 'Now' : `-${pulseTrendData.length - 1 - index}d`}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Blood Pressure Trend Chart (Pink Theme) */}
          <View style={[styles.card, { flex: 1, backgroundColor: `${colors.veryLightBlue}22`, borderColor: `${colors.lightPink}55` }]}>
            <Text style={styles.chartTitle}>
              <Icon name="📊" color={colors.lightPink} size={16} />Blood Pressure Trend
            </Text>
            <View style={styles.chartContainer}>
              <View style={styles.chartYAxis}>
                <Text style={styles.chartYAxisLabel}>140/90</Text>
                <Text style={styles.chartYAxisLabel}>120/80</Text>
                <Text style={styles.chartYAxisLabel}>100/70</Text>
              </View>
              <View style={styles.chartBarsContainer}>
                {/* Dynamically generate from patientData.parameters of type 'bloodPressure' */}
                {bpTrendData.map((reading, index) => (
                  <View key={index} style={styles.chartBarWrapper}>
                    <View style={styles.bpBarGroup}>
                      <View
                        style={[
                          styles.bpBarSystolic,
                          {
                            height: (reading.systolic - 100) * 1.5, // Scale
                            backgroundColor: colors.lightPink
                          }
                        ]}
                      />
                      <View
                        style={[
                          styles.bpBarDiastolic,
                          {
                            height: (reading.diastolic - 60) * 1.5, // Scale
                            backgroundColor: colors.lightBlue
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.chartBarLabel}>{index === 0 ? 'Now' : `-${bpTrendData.length - 1 - index}d`}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Abdominal Assessment Card (Purple Theme) - MODIFIED */}
          <View style={[styles.card, { backgroundColor: `${colors.lightPurple}22`, borderColor: `${colors.lightPurple}55` }]}>
            <Text style={styles.sectionTitle}>
              <Icon name="🤰" color={colors.lightPurple} size={16} />Abdominal Assessment
            </Text>
            <View style={styles.abdominalBoxesContainer}>
              {/* Fundal Height Box */}
              <View style={[styles.abdominalBox, { backgroundColor: `${colors.lightPink}44` }]}>
                <Text style={styles.abdominalBoxValue}>{examData.fundalHeight || 'N/A'}</Text>
                <Text style={styles.abdominalBoxLabel}>cm</Text>
                <Text style={styles.abdominalBoxSubLabel}>Fundal Height</Text>
              </View>
              {/* Fetal Heart Rate Box */}
              <View style={[styles.abdominalBox, { backgroundColor: `${colors.lightBlue}44` }]}>
                <Text style={styles.abdominalBoxValue}>{examData.fetalHeartRate || 'N/A'}</Text> {/* Changed to fetalHeartRate */}
                <Text style={styles.abdominalBoxLabel}>bpm</Text>
                <Text style={styles.abdominalBoxSubLabel}>Fetal Heart Rate</Text> {/* Changed label */}
              </View>
              {/* Removed Fetal Lie box */}
            </View>
          </View>

          {/* Eye Examination Card (Pink Theme) - Also contains Physical Examination */}
          <View style={[styles.card, { backgroundColor: `${colors.lightBlue}22`, borderColor: `${colors.lightPink}55` }]}>
            <Text style={styles.sectionTitle}>
              <Icon name="👁️" color={colors.lightPink} size={16} />Eye Examination
            </Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pallor (Anaemia)</Text>
              <View style={styles.detailValueContainer}>
                <Text style={[styles.detailValue, { color: examData.eyePallor === 'Absent' ? colors.greenStatus : colors.yellowStatus }]}>{examData.eyePallor || 'N/A'}</Text>
                <View style={[styles.statusDot, { backgroundColor: examData.eyePallor === 'Absent' ? colors.greenStatus : colors.yellowStatus }]} />
              </View>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Jaundice</Text>
              <View style={styles.detailValueContainer}>
                <Text style={[styles.detailValue, {
                  color:
                    examData.jaundice === 'absent' ? colors.greenStatus :
                      examData.jaundice === 'mild' ? colors.yellowStatus :
                        colors.redStatus
                }]}>{examData.jaundice ? examData.jaundice.charAt(0).toUpperCase() + examData.jaundice.slice(1) : 'N/A'}</Text>
                <View style={[styles.statusDot, {
                  backgroundColor:
                    examData.jaundice === 'absent' ? colors.greenStatus :
                      examData.jaundice === 'mild' ? colors.yellowStatus :
                        colors.redStatus
                }]} />
              </View>
            </View>
            <Text style={styles.sectionTitle}>
              <Icon name="🧪" color={colors.lightPurple} size={16} />Physical Examination
            </Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nails</Text>
              <View style={styles.detailValueContainer}>
                <Text style={[styles.detailValue, { color: examData.nailCondition === 'Normal' ? colors.greenStatus : colors.yellowStatus }]}>{examData.nailCondition || 'N/A'}</Text>
                <View style={[styles.statusDot, { backgroundColor: examData.nailCondition === 'Normal' ? colors.greenStatus : colors.yellowStatus }]} />
              </View>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Feet Edema</Text>
              <View style={styles.detailValueContainer}>
                <Text style={[styles.detailValue, {
                  color:
                    examData.feetEdema === 'absent' ? colors.greenStatus :
                      examData.feetEdema === 'mild' ? colors.yellowStatus :
                        colors.redStatus
                }]}>{examData.feetEdema ? examData.feetEdema.charAt(0).toUpperCase() + examData.feetEdema.slice(1) : 'N/A'}</Text>
                <View style={[styles.statusDot, {
                  backgroundColor:
                    examData.feetEdema === 'absent' ? colors.greenStatus :
                      examData.feetEdema === 'mild' ? colors.yellowStatus :
                        colors.redStatus
                }]} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.mainBackgroundFrom, // Base background
  },
  scrollViewContent: {
    flexGrow: 1, // Allows content to grow and fill space
    paddingBottom: 20, // Add some padding at the bottom
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.mainBackgroundFrom,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.darkSlateText,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.redStatus,
    textAlign: 'center',
    marginBottom: 20,
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
    // Add shadow for Android
    elevation: 3,
    // Add shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  // New style for the container of the back and admin buttons
  backAdminButtonsContainer: {
    flexDirection: 'row',
    gap: 10, // Adds 10 units of space between the children (buttons)
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
    flex: 1, // Allows title to take available space
    marginLeft: 15,
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
  patientInfoBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align date to the right
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.5)', // White with opacity
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  patientInfoItem: { // This style is no longer explicitly used for Age/Gender/Last Visit in patientInfoBar
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientInfoLabel: {
    fontSize: 12,
    color: colors.mediumSlateText,
    marginRight: 4,
  },
  patientInfoValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.darkSlateText,
  },
  currentDate: {
    fontSize: 12,
    color: colors.mediumSlateText,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Distributes items evenly
    padding: 15,
    gap: 15, // React Native 0.71+ supports gap directly
  },
  card: {
    // Adjusted width to allow for two columns with gap
    width: '23.5%', // Adjusted to allow 2 items per row, accounting for gap
    marginBottom: 10, // For older RN versions that don't support gap (though gap is used now)
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    // Shadows for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.darkSlateText,
    marginBottom: 5,
  },
  kpiLabel: {
    fontSize: 14,
    color: colors.mediumSlateText,
    marginBottom: 10,
  },
  innerCard: {
    borderRadius: 8,
    padding: 10,
  },
  innerCardText: {
    fontSize: 12,
    color: colors.darkSlateText,
  },
  innerCardSubText: {
    fontSize: 10,
    color: colors.mediumSlateText,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    marginTop: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mediumSlateText,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    height: 120, // Fixed height for charts
    alignItems: 'flex-end',
  },
  chartYAxis: {
    justifyContent: 'space-between',
    height: '100%',
    paddingRight: 5,
    alignItems: 'flex-end',
  },
  chartYAxisLabel: {
    fontSize: 10,
    color: colors.mediumSlateText,
  },
  chartBarsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 5,
  },
  chartBarWrapper: {
    alignItems: 'center',
    width: '12%', // Adjust width for bars
  },
  chartBar: {
    width: 15,
    borderRadius: 3,
    marginBottom: 5,
  },
  chartBarLabel: {
    fontSize: 9,
    color: colors.mediumSlateText,
  },
  bpBarGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 5,
  },
  bpBarSystolic: {
    width: 10,
    borderRadius: 3,
    marginRight: 2,
  },
  bpBarDiastolic: {
    width: 10,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 14,
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
    fontSize: 12,
    fontWeight: '500',
    color: colors.darkSlateText,
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  abdominalBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Changed to space-between for 2 boxes
    marginBottom: 10,
    flexWrap: 'wrap', // Allow wrapping if more boxes are added later
  },
  abdominalBox: {
    width: '48%', // Adjusted to fit 2 boxes per row with some space
    marginVertical: 4, // Added vertical margin for spacing if they wrap
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  abdominalBoxValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.darkSlateText,
  },
  abdominalBoxLabel: {
    fontSize: 10,
    color: colors.mediumSlateText,
  },
  abdominalBoxSubLabel: {
    fontSize: 9,
    color: colors.mediumSlateText,
    textAlign: 'center',
    marginTop: 2,
  },
});