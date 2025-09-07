import { Picker } from "@react-native-picker/picker";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { authAxios } from "../../lib/utils";

const AddMedicinePage = () => {
  const { uhiNo: uhiNoParam, doctorId: doctorIdParam } = useLocalSearchParams();
  const router = useRouter();
  const [uhiNo, setUhiNo] = useState(uhiNoParam || "");
  const [doctorId, setDoctorId] = useState(doctorIdParam || "");
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [day, setDay] = useState("Mon");
  const [timeSlot, setTimeSlot] = useState("Morning");
  const [mealPreference, setMealPreference] = useState("Before");
  const [loading, setLoading] = useState(false);
  const IP_ADDRESS = Constants.expoConfig?.extra?.IP_ADDRESS || "110.45.225.1";

  useEffect(() => {
    if (!doctorId || !uhiNo) {
      Alert.alert(
        "Warning",
        "Doctor ID or UHI No not available. Please navigate back and try again.",
        [{ text: "OK" }]
      );
    }

    
  }, [doctorId, uhiNo]);

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

    setLoading(true);
    try {
      const payload = {
        name,
        dosage,
        schedule: [{ day, time: timeSlot, beforeMeal: mealPreference === "Before" }],
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
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Select Day</Text>
          <Picker selectedValue={day} style={styles.picker} onValueChange={(itemValue) => setDay(itemValue)}>
            <Picker.Item label="Monday" value="Mon" />
            <Picker.Item label="Tuesday" value="Tue" />
            <Picker.Item label="Wednesday" value="Wed" />
            <Picker.Item label="Thursday" value="Thu" />
            <Picker.Item label="Friday" value="Fri" />
            <Picker.Item label="Saturday" value="Sat" />
            <Picker.Item label="Sunday" value="Sun" />
            <Picker.Item label="Weekdays" value="Weekdays" />
            <Picker.Item label="Weekends" value="Weekends" />
            <Picker.Item label="Everyday" value="Everyday" />
          </Picker>
        </View>
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Select Time</Text>
          <Picker selectedValue={timeSlot} style={styles.picker} onValueChange={(itemValue) => setTimeSlot(itemValue)}>
            <Picker.Item label="Morning" value="Morning" />
            <Picker.Item label="Afternoon" value="Afternoon" />
            <Picker.Item label="Evening" value="Evening" />
            <Picker.Item label="Night" value="Night" />
          </Picker>
        </View>
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Meal Preference</Text>
          <Picker selectedValue={mealPreference} style={styles.picker} onValueChange={(itemValue) => setMealPreference(itemValue)}>
            <Picker.Item label="Before Meal" value="Before" />
            <Picker.Item label="After Meal" value="After" />
          </Picker>
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
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 15,
    marginTop: 10,
    color: "#0256A3",
  },
  picker: {
    width: "100%",
    height: 50,
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