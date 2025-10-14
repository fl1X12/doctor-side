import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PieChart } from "react-native-chart-kit"; // For pie chart
import { Appbar } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { authAxios } from "../../lib/utils";

const { width } = Dimensions.get("window");

export default function PrescriptionScreen() {
  const { patientId, uhiNo, name, doctorId } = useLocalSearchParams();
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, taken: 0, notTaken: 0, consistency: 0 });
  const [doctorNames, setDoctorNames] = useState({}); // Store doctor names by ID

  useEffect(() => {
    const fetchPrescriptions = async () => {
      setLoading(true);
      try {
        const response = await authAxios.get(`/medicines/${patientId}`);
        setPrescriptions(response.data);
        calculateStats(response.data);
        console.log('Prescription data:', response.data);
        // Fetch doctor name from AsyncStorage
        await fetchDoctorName();
      } catch (error) {
        Alert.alert("Error", error.message || "Could not load prescriptions");
        setPrescriptions([]);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) fetchPrescriptions();
  }, [patientId]);

  const fetchDoctorName = async () => {
    try {
      const doctorInfoString = await AsyncStorage.getItem('doctorInfo');
      if (doctorInfoString) {
        const doctorInfo = JSON.parse(doctorInfoString);
        setDoctorNames({ [doctorId]: doctorInfo.name || 'Unknown Doctor' });
      } else {
        setDoctorNames({ [doctorId]: 'Unknown Doctor' });
      }
    } catch (error) {
      console.error('Error fetching doctor name from storage:', error);
      setDoctorNames({ [doctorId]: 'Unknown Doctor' });
    }
  };

  const calculateStats = (medicines) => {
    let total = 0;
    let taken = 0;
    medicines.forEach(med => {
      med.schedule.forEach(s => {
        total++;
        if (s.taken) taken++;
      });
    });
    const notTaken = total - taken;
    const consistency = total > 0 ? Math.round((taken / total) * 100) : 0;
    setStats({ total, taken, notTaken, consistency });
  };

  const pieData = stats.total > 0 ? [
    {
      name: "Taken",
      count: stats.taken,
      color: "#4CAF50", // Green
      legendFontColor: "#333",
      legendFontSize: 15,
    },
    {
      name: "Not Taken",
      count: stats.notTaken,
      color: "#F44336", // Red
      legendFontColor: "#333",
      legendFontSize: 15,
    },
  ] : []; // Empty if no data

  const getSuggestion = () => {
    if (stats.consistency >= 90) return "Excellent adherence! Keep it up.";
    if (stats.consistency >= 70) return "Good job! Try to improve consistency.";
    if (stats.consistency >= 50) return "Fair adherence. Consider setting reminders.";
    return "Low adherence. Consult your doctor for support.";
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-left" size={28} color="white" style={{ marginLeft: 15 }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prescription for {name}</Text>
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#0256A3" />
        ) : (
          <>
            {/* Two-Column Layout */}
            <View style={styles.rowContainer}>
              {/* Left Column: Prescriptions */}
              <View style={styles.leftColumn}>
                <Text style={styles.sectionTitle}>Prescriptions</Text>
                {prescriptions.length === 0 ? (
                  <Text style={styles.noDataText}>No prescriptions found.</Text>
                ) : (
                  prescriptions.map((item, idx) => {
                    // Extract unique time slots and meal preference
                    const timeSlots = [...new Set(item.schedule?.map(s => s.time) || [])].join(', ');
                    const mealPreference = item.schedule?.[0]?.beforeMeal ? 'Before Meal' : 'After Meal';
                    
                    return (
                      <View key={idx} style={styles.prescriptionCard}>
                        <Text style={styles.medicineName}>{item.name}</Text>
                        <Text>Dosage: {item.dosage}</Text>
                        <Text>Duration: {item.schedule?.length ? `${item.schedule.length} days` : 'N/A'}</Text>
                        <Text>Time Slots: {timeSlots}</Text>
                        <Text>Meal Preference: {mealPreference}</Text>
                        <Text>Prescribed by: {doctorNames[doctorId] || 'Loading...'}</Text>
                        
                      </View>
                    );
                  })
                )}
              </View>

              {/* Right Column: Medicine Stats */}
              <View style={styles.rightColumn}>
                <Text style={styles.sectionTitle}>Medicine Statistics</Text>
                <View style={styles.summary}>
                  <Text style={styles.summaryText}>Total Schedules: {stats.total}</Text>
                  <Text style={styles.summaryText}>Taken: {stats.taken} | Not Taken: {stats.notTaken}</Text>
                  <Text style={styles.consistencyText}>Consistency: {stats.consistency}%</Text>
                  <Text style={styles.suggestionText}>{getSuggestion()}</Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <Text style={styles.progressLabel}>Adherence Progress</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${stats.consistency}%` }]} />
                  </View>
                </View>

                {/* Pie Chart */}
                {pieData.length > 0 ? (
                  <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>Taken vs Not Taken</Text>
                    <PieChart
                      data={pieData}
                      width={width / 2 - 40} // Adjust width for column
                      height={220}
                      chartConfig={{
                        backgroundColor: "#fff",
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      }}
                      accessor="count"
                      backgroundColor="transparent"
                      paddingLeft="15"
                      absolute
                    />
                  </View>
                ) : (
                  <Text style={styles.noDataText}>No data available for chart</Text>
                )}
              </View>
            </View>

            {/* Add Medicine Button Below */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/AddMedicine",
                  params: { uhiNo, doctorId }
                })
              }
            >
              <Text style={styles.addButtonText}>Add Medicine</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4FF" },
  header: { backgroundColor: "#0256A3" },
  headerTitle: { color: "white", fontWeight: "bold", fontSize: 20, marginLeft: 20 },
  scrollContent: { flexGrow: 1, padding: 20 },
  rowContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 30 },
  leftColumn: { flex: 1, minWidth: 300, marginRight: 10 },
  rightColumn: { flex: 1, minWidth: 300, marginLeft: 10 },
  sectionTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 16, color: "#0256A3" },
  prescriptionCard: { backgroundColor: "#fff", borderRadius: 10, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#ddd" },
  medicineName: { fontWeight: "bold", fontSize: 16 },
  noDataText: { color: "#888", fontStyle: "italic" },
  summary: { marginBottom: 20, alignItems: "center" },
  summaryText: { fontSize: 16, color: "#333", marginBottom: 5 },
  consistencyText: { fontSize: 18, fontWeight: "bold", color: "#0256A3", marginBottom: 10 },
  suggestionText: { fontSize: 14, color: "#666", textAlign: "center" },
  progressContainer: { width: "100%", marginBottom: 20 },
  progressLabel: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 10 },
  progressBar: { height: 20, backgroundColor: "#E0E0E0", borderRadius: 10, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#4CAF50", borderRadius: 10 },
  chartContainer: { alignItems: "center", marginTop: 20 },
  chartTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 10 },
  addButton: { backgroundColor: "#0256A3", paddingVertical: 15, borderRadius: 10, alignItems: "center", marginTop: 20 },
  addButtonText: { color: "white", fontWeight: "bold", fontSize: 18 },
});