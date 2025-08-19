import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";

const IP_ADDRESS = Constants.expoConfig?.extra?.IP_ADDRESS || "10.164.255.159";

export default function PrescriptionScreen() {
  const { uhiNo, name, doctorId } = useLocalSearchParams();
  console.log("PrescriptionScreen params:", { uhiNo, name, doctorId }); // Add this line for debugging
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      setLoading(true);
      try {
        // Step 1: Get patient data by UHI number
        const patientRes = await fetch(`http://${IP_ADDRESS}:5501/api/chatbot/${uhiNo}`);
        if (!patientRes.ok) throw new Error("Failed to fetch patient info");
        const patientData = await patientRes.json();
        const user_id = patientData?.user?.id;
        if (!user_id) throw new Error("User ID not found for this patient");

        // Step 2: Get prescriptions by user_id
        const response = await fetch(`http://${IP_ADDRESS}:5501/medicines/${user_id}`);
        if (!response.ok) throw new Error("Failed to fetch prescriptions");
        const data = await response.json();
        setPrescriptions(data);
      } catch (error) {
        Alert.alert("Error", error.message || "Could not load prescriptions");
        setPrescriptions([]);
      } finally {
        setLoading(false);
      }
    };
    if (uhiNo) fetchPrescriptions();
  }, [uhiNo]);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, backgroundColor: "#F0F4FF" }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 16, color: "#0256A3" }}>
        Prescription for {name}
      </Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0256A3" />
      ) : prescriptions.length === 0 ? (
        <Text style={{ color: "#888", fontStyle: "italic" }}>No prescriptions found.</Text>
      ) : (
        prescriptions.map((item, idx) => (
          <View key={idx} style={{ backgroundColor: "#fff", borderRadius: 10, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#ddd" }}>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>{item.name}</Text>
            <Text>Dosage: {item.dosage}</Text>
            <Text>Schedule: {item.schedule?.map(s => `${s.day} ${s.time} (${s.beforeMeal ? "Before" : "After"} Meal)`).join(", ")}</Text>
            <Text>Prescribed by: {item.doctor_id}</Text>
            <Text>
              Status: {item.taken === true ? "Taken" : item.taken === false ? "Not Taken" : "Unknown"}
            </Text>
          </View>
        ))
      )}
      <TouchableOpacity
        style={{ backgroundColor: "#0256A3", paddingVertical: 15, borderRadius: 10, alignItems: "center", marginTop: 20 }}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/AddMedicine",
            params: { uhiNo, doctorId } // forward doctorId
          })
        }
      >
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>Add Medicine</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}