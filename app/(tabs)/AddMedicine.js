
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { authAxios } from "../../lib/utils";

const DAYS = [
  { label: "Monday", value: "Mon" },
  { label: "Tuesday", value: "Tue" },
  { label: "Wednesday", value: "Wed" },
  { label: "Thursday", value: "Thu" },
  { label: "Friday", value: "Fri" },
  { label: "Saturday", value: "Sat" },
  { label: "Sunday", value: "Sun" },
  { label: "Weekdays", value: "Weekdays" },
  { label: "Weekends", value: "Weekends" },
  { label: "Everyday", value: "Everyday" },
];

const TIMES = [
  { label: "Morning", value: "Morning" },
  { label: "Afternoon", value: "Afternoon" },
  { label: "Evening", value: "Evening" },
  { label: "Night", value: "Night" },
];

const MEALS = [
  { label: "Before Meal", value: "Before" },
  { label: "After Meal", value: "After" },
];

const AddMedicinePage = () => {
  const { uhiNo: uhiNoParam, doctorId: doctorIdParam } = useLocalSearchParams();
  const router = useRouter();
  const [uhiNo, setUhiNo] = useState(uhiNoParam || "");
  const [doctorId, setDoctorId] = useState(doctorIdParam || "");
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [mealPreference, setMealPreference] = useState("Before");
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!doctorId || !uhiNo) {
      Alert.alert(
        "Warning",
        "Doctor ID or UHI No not available. Please navigate back and try again.",
        [{ text: "OK" }]
      );
    }
  }, [doctorId, uhiNo]);

  const toggleDay = (value) => {
    setSelectedDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    );
  };

  const toggleTime = (value) => {
    setSelectedTimes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const handleAddMedicine = async () => {
    if (!doctorId) {
      Alert.alert("Error", "Doctor ID is missing. Please navigate back and try again.");
      return;
    }
    if (!uhiNo?.trim()) {
      Alert.alert("Error", "Please enter a UHI Number");
      return;
    }
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a medicine name");
      return;
    }
    if (!dosage.trim()) {
      Alert.alert("Error", "Please enter a dosage");
      return;
    }
    if (selectedDays.length === 0) {
      Alert.alert("Error", "Please select at least one day");
      return;
    }
    if (selectedTimes.length === 0) {
      Alert.alert("Error", "Please select at least one time slot");
      return;
    }

    setLoading(true);
    try {
      // Build schedule array for all combinations
      const schedule = [];
      selectedDays.forEach((day) => {
        selectedTimes.forEach((time) => {
          schedule.push({
            day,
            time,
            beforeMeal: mealPreference === "Before",
          });
        });
      });

      const payload = {
        name,
        dosage,
        schedule,
        uhi_no: uhiNo,
        doctor_id: Number(doctorId),
      };
      const { data } = await authAxios.post(`/medicines/add`, payload);
      if (data) {
        Alert.alert("Success", "Medicine added successfully!", [
          { text: "OK", onPress: () => router.replace("/(tabs)/admin") }
        ]);
      } else {
        Alert.alert("Error", "Failed to add medicine");
      }
    } catch (error) {
      console.error("Error adding medicine:", error);
      Alert.alert("Error", error.response?.data?.error || "An error occurred while adding the medicine. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Add New Medicine</Text>
        <View style={styles.doctorIdContainer}>
          <Text style={styles.doctorIdLabel}>Doctor ID:</Text>
          <Text style={styles.doctorIdValue}>{doctorId || "Not available"}</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Enter UHI Number"
          value={uhiNo}
          onChangeText={setUhiNo}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter medicine name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter dosage (e.g., 500mg)"
          value={dosage}
          onChangeText={setDosage}
        />

        {/* Multi-select Days */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Select Days</Text>
          <View style={styles.multiSelectRow}>
            {DAYS.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[
                  styles.selectButton,
                  selectedDays.includes(d.value) && styles.selectedButton,
                ]}
                onPress={() => toggleDay(d.value)}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    selectedDays.includes(d.value) && styles.selectedButtonText,
                  ]}
                >
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Multi-select Times */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Select Time Slots</Text>
          <View style={styles.multiSelectRow}>
            {TIMES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.selectButton,
                  selectedTimes.includes(t.value) && styles.selectedButton,
                ]}
                onPress={() => toggleTime(t.value)}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    selectedTimes.includes(t.value) && styles.selectedButtonText,
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Meal Preference */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Meal Preference</Text>
          <View style={styles.multiSelectRow}>
            {MEALS.map((m) => (
              <TouchableOpacity
                key={m.value}
                style={[
                  styles.selectButton,
                  mealPreference === m.value && styles.selectedButton,
                ]}
                onPress={() => setMealPreference(m.value)}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    mealPreference === m.value && styles.selectedButtonText,
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addButton, loading ? styles.buttonDisabled : {}]}
          onPress={handleAddMedicine}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Adding Medicine..." : "Add Medicine"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F4FF",
    padding: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: "black",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold", 
    marginBottom: 20,
    textAlign: "center",
    color: "#0256A3",
  },
  doctorIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#E8F0FE",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#0256A3",
  },
  doctorIdLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0256A3",
    marginRight: 10,
  },
  doctorIdValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  pickerContainer: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
    marginBottom: 8,
    color: "#0256A3",
  },
  multiSelectRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  selectButton: {
    backgroundColor: "#E8F0FE",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: "#0256A3",
  },
  selectedButton: {
    backgroundColor: "#0256A3",
  },
  selectButtonText: {
    color: "#0256A3",
    fontWeight: "bold",
  },
  selectedButtonText: {
    color: "white",
  },
  addButton: {
    backgroundColor: "#0256A3",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: "#A0BFE0",
  },
  buttonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },
});

export default AddMedicinePage;