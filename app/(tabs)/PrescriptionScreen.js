import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { authAxios } from "../../lib/utils";

const IP_ADDRESS = Constants.expoConfig?.extra?.IP_ADDRESS || "110.216.207.219";

export default function PrescriptionScreen() {
  const { patientId,uhiNo, name, doctorId } = useLocalSearchParams();
  console.log("PrescriptionScreen params:", { uhiNo, name, doctorId,patientId }); // Add this line for debugging
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      // The Axios response object is stored in 'response'
      const response = await authAxios.get(`/medicines/${patientId}`);
      
      // With Axios, the actual data from the server is in the `.data` property
      // This is the only change you need!
      setPrescriptions(response.data);

    } catch (error) {
      // Axios will automatically jump to this catch block for network errors or bad statuses (4xx, 5xx)
      Alert.alert("Error", error.message || "Could not load prescriptions");
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  // It's good practice to ensure patientId exists as well before fetching
  if (uhiNo && patientId) fetchPrescriptions();
}, [uhiNo, patientId]); // Add patientId to the dependency array

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