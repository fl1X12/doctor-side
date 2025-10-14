import React, { useEffect, useState } from "react";
import Constants from "expo-constants";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
import { Appbar } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { PieChart, ProgressChart } from "react-native-chart-kit"; // For pie and progress charts
import { authAxios } from "../../lib/utils";

const { width } = Dimensions.get("window");

const MedicineStats = () => {
  const router = useRouter();
  const { userId, uhiNo, name } = useLocalSearchParams();
  const [medicines, setMedicines] = useState([]);
  const [vitals, setVitals] = useState({});
  const [loading, setLoading] = useState(true);
  const [periodStats, setPeriodStats] = useState({});
  const [overallStats, setOverallStats] = useState({ total: 0, taken: 0, notTaken: 0, consistency: 0 });

  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        fetchMedicines();
        fetchVitals();
        fetchStats();
      }
    }, [userId])
  );

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await authAxios.get(`/medicines/${userId}`);
      setMedicines(response.data);
      // Calculate period stats if needed, but for overall pie chart, use the new API
      calculatePeriodStats(response.data);
    } catch (error) {
      console.error("Error fetching medicines:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await authAxios.get(`/medicines/${userId}/stats`);
      const stats = response.data;
      setOverallStats({
        total: stats.total,
        taken: stats.taken,
        notTaken: stats.notTaken,
        consistency: stats.consistency
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchVitals = async () => {
    try {
      const response = await authAxios.get(`/patients/${userId}/vitals-summary`);
      setVitals(response.data);
    } catch (error) {
      console.error("Error fetching vitals:", error);
      // Set default vitals if fetch fails
      setVitals({
        bloodPressure: { systolic: null, diastolic: null },
        afi: null,
        glucose: null,
        weight: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePeriodStats = (medicines) => {
    const now = new Date();
    const periods = {
      "1 Week": 7,
      "2 Weeks": 14,
      "1 Month": 30,
      "2 Months": 60,
    };
    
    const stats = {};
    Object.keys(periods).forEach((period) => {
      const days = periods[period];
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - days);
      
      let total = 0;
      let taken = 0;
      medicines.forEach(med => {
        const medStart = new Date(med.start_date);
        med.schedule.forEach(s => {
          const scheduleDate = new Date(medStart);
          scheduleDate.setDate(medStart.getDate() + (s.day - 1));
          if (scheduleDate >= startDate && scheduleDate <= now) {
            total++;
            if (s.taken) taken++;
          }
        });
      });
      stats[period] = { total, taken, notTaken: total - taken };
    });
    setPeriodStats(stats);
  };

  const renderPieChart = (period, data) => {
    const pieData = data.total > 0 ? [
      { name: "Taken", count: data.taken, color: "#4CAF50", legendFontColor: "#333", legendFontSize: 15 },
      { name: "Not Taken", count: data.notTaken, color: "#F44336", legendFontColor: "#333", legendFontSize: 15 },
    ] : [];
    
    return (
      <View style={styles.chartContainer} key={period}>
        <Text style={styles.chartTitle}>{period} Adherence</Text>
        {pieData.length > 0 ? (
          <PieChart
            data={pieData}
            width={width - 40}
            height={150}
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
        ) : (
          <Text style={styles.noDataText}>No data for {period}</Text>
        )}
      </View>
    );
  };

  const renderGauge = (label, value, maxValue = 100, key) => {
    const progress = value ? Math.min(value / maxValue, 1) : 0;
    const data = { data: [progress] };
    
    return (
      <View style={styles.gaugeContainer} key={key}>
        <Text style={styles.gaugeLabel}>{label}: {value || "N/A"}</Text>
        <ProgressChart
          data={data}
          width={width / 2 - 20}
          height={100}
          strokeWidth={10}
          radius={40}
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          }}
          hideLegend={true}
        />
      </View>
    );
  };

  const overallPieData = overallStats.total > 0 ? [
    { name: "Taken", count: overallStats.taken, color: "#4CAF50", legendFontColor: "#333", legendFontSize: 15 },
    { name: "Not Taken", count: overallStats.notTaken, color: "#F44336", legendFontColor: "#333", legendFontSize: 15 },
  ] : [];

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-left" size={28} color="white" style={{ marginLeft: 15 }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medicine Statistics for {name}</Text>
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#6DA5FA" style={{ marginTop: 50 }} />
        ) : (
          <>
            {/* Overall Pie Chart */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Overall Adherence</Text>
              {overallPieData.length > 0 ? (
                <PieChart
                  data={overallPieData}
                  width={width - 40}
                  height={150}
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
              ) : (
                <Text style={styles.noDataText}>No overall data available</Text>
              )}
            </View>

            {/* Vitals Gauges */}
            <View style={styles.vitalsContainer}>
              <Text style={styles.sectionTitle}>Vitals</Text>
              <View style={styles.gaugesRow}>
                {renderGauge("Blood Pressure Systolic", vitals.bloodPressure?.systolic, 200, "systolic")}
                {renderGauge("Blood Pressure Diastolic", vitals.bloodPressure?.diastolic, 120, "diastolic")}
              </View>
              <View style={styles.gaugesRow}>
                {renderGauge("AFI", vitals.afi, 20, "afi")}
                {renderGauge("Glucose", vitals.glucose, 200, "glucose")}
              </View>
              <View style={styles.gaugesRow}>
                {renderGauge("Weight", vitals.weight, 100, "weight")}
              </View>
            </View>

            {/* Pie Charts for Periods */}
            <Text style={styles.sectionTitle}>Adherence Over Time</Text>
            {Object.keys(periodStats).map((period) => renderPieChart(period, periodStats[period]))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F8FF" },
  header: { backgroundColor: "#0256A3" },
  headerTitle: { color: "white", fontWeight: "bold", fontSize: 20, marginLeft: 20 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 10, textAlign: "center" },
  vitalsContainer: { marginBottom: 20 },
  gaugesRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 10 },
  gaugeContainer: { alignItems: "center" },
  gaugeLabel: { fontSize: 14, fontWeight: "bold", color: "#0256A3", marginBottom: 5 },
  chartContainer: { alignItems: "center", marginBottom: 20 },
  chartTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 10 },
  noDataText: { fontSize: 14, color: "#666", textAlign: "center" },
});

export default MedicineStats;