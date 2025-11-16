import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Button } from 'react-native-paper';
import colors from '../../constants/Colors';

// remove hardcoded RECOMMENDER_BASE; compute at runtime with sensible defaults
const DEFAULT_PORT = 5501;
//const envHost = process.env.RECOMMENDER_URL || Constants.expoConfig?.extra?.RECOMMENDER_HOST;
let RECOMMENDER_BASE = `http://192.168.1.4:${DEFAULT_PORT}/api/ai`; // default to local network IP

// On Android emulators 127.0.0.1 is device, use emulator host
if (Platform.OS === 'android') {
  // Android Studio emulator
  RECOMMENDER_BASE = `http://192.168.1.4:5501/api/ai`;
}

// If you run on a physical device override via Constants.expoConfig.extra.RECOMMENDER_HOST
// (example: "http://192.168.1.42:8000")
const LOAD_SESSION_URL = `${RECOMMENDER_BASE}/session/load`;
const RECOMMEND_URL = `${RECOMMENDER_BASE}/session/recommend`;
const CLEAR_SESSION_URL = `${RECOMMENDER_BASE}/session/clear`;

const API_BASE_URL = 'http://192.168.1.4:5501/api';

export default function RecommendationEngine() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const uhiNo = Array.isArray(params.uhiNo) ? params.uhiNo[0] : params.uhiNo;
  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const patientIdParam = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;

  const [patient, setPatient] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [loadingRec, setLoadingRec] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);
  const [lastSessionId, setLastSessionId] = useState(null);

  useEffect(() => {
    (async function fetchPatient() {
      setLoadingPatient(true);
      try {
        const token = await AsyncStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        let patientData = null;
        if (uhiNo) {
          const res = await axios.get(`${API_BASE_URL}/patients/by/${uhiNo}`, { headers });
          patientData = res.data;
        } else if (patientIdParam) {
           // Fallback for different param name, e.g. internal ID from a list
           // Note: This assumes /patients/by/ can handle internal IDs as well, if not, adjust endpoint
          const res = await axios.get(`${API_BASE_URL}/patients/by/${patientIdParam}`, { headers });
          patientData = res.data;
        }
        setPatient(patientData);
        
      } catch (err) {
        console.error('Failed to fetch patient for recommendation:', err?.response?.data || err.message || err);
        setPatient(null);
      } finally {
        setLoadingPatient(false);
      }
    })();
  }, [uhiNo, patientIdParam]);

  const fetchRecommendation = async () => {
    setLoadingRec(true);
    setRecommendation(null);
    setError(null);

    try {
      // --- THIS IS THE FIX ---
      // We must use the UHI No for the AI service, as that's what the backend expects.
      const patientUhiNo = patient?.user?.uhiNo || uhiNo;
      console.log("Using UHI No for AI session:", patientUhiNo);

      if (!patientUhiNo) {
        setError('Missing patient UHI No');
        setLoadingRec(false);
        return;
      }
      // --- END OF FIX ---

      const token = await AsyncStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Load/create session on recommender
      const loadRes = await axios.post(
        LOAD_SESSION_URL,
        // --- THIS IS THE FIX ---
        // The backend API expects the key "uhi_no"
        { uhi_no: patientUhiNo },
        // --- END OF FIX ---
        { headers: { 'Content-Type': 'application/json', ...headers }, timeout: 20000 }
      );

      const sessionId = loadRes.data?.session_id;
      if (!sessionId) {
        setError('Failed to create session on recommendation server');
        setLoadingRec(false);
        return;
      }

      // persist session id for reuse
      setLastSessionId(sessionId);
      await AsyncStorage.setItem('@recommender_session_id', sessionId);

      // Fetch clinical notes (transcript) from your main backend using session id (backendSessionId)
      const backendSessionId =
        patient?.session?.id ?? patient?.session_id ?? patient?.sessionId ?? null;

      let consultationTranscript = '';
      if (backendSessionId) {
        try {
          const notesRes = await axios.get(`${API_BASE_URL}/patients/${backendSessionId}/notes`, { headers, timeout: 15000 });
          const notes = Array.isArray(notesRes.data) ? notesRes.data : (notesRes.data?.notes ?? []);
          consultationTranscript = notes.map(n => n.content || '').filter(Boolean).join('\n\n');
        } catch (e) {
          console.warn('Failed to load clinical notes, falling back:', e?.message || e);
        }
      }

      if (!consultationTranscript) {
        // Corrected: This is the realistic, minimal transcript you wanted.
        consultationTranscript = "Patient is at 32 weeks gestation. She's presenting with a severe, persistent headache and flashing lights. Her BP is dangerously high at 170/110 mmHg. I suspect severe pre-eclampsia.";
      }

      const recRes = await axios.post(
        RECOMMEND_URL,
        { session_id: sessionId, consultation_transcript: consultationTranscript },
        { headers: { 'Content-Type': 'application/json', ...headers }, timeout: 60000 }
      );

      // Handle both string and JSON object responses
      const recData = recRes.data?.recommendation ?? recRes.data;
      
      // Check if recData is the JSON object we expect
      if (typeof recData === 'object' && recData.recommended_medication) {
         // Format it nicely for the <Text> component
         setRecommendation(JSON.stringify(recData, null, 2));
      } else {
         // Otherwise, just show the string (likely an error or old format)
         setRecommendation(String(recData));
      }

    } catch (err) {
      console.error('Recommendation API error:', err?.response?.data || err.message || err);
      const message =
        err?.response?.data?.detail ??
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        'Failed to fetch recommendation';
      setError(String(message));
    } finally {
      setLoadingRec(false);
    }
  };

  const clearSession = async () => {
    if (!lastSessionId) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(CLEAR_SESSION_URL, { session_id: lastSessionId }, { headers });
      setLastSessionId(null);
    } catch (err) {
      console.warn('Failed to clear session:', err?.message || err);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Button
          mode="contained"
          style={styles.backButtonAbsolute}
          labelStyle={styles.backButtonLabel}
          onPress={() => router.back()}>
          ←
        </Button>

        <Text style={styles.title}>Recommendation Engine</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Details</Text>

          {loadingPatient ? (
            <ActivityIndicator size="small" color={colors.darkBlue} />
          ) : patient ? (
            <View style={styles.patientRow}>
              <View style={styles.patientCol}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{patient.user?.name || name || 'N/A'}</Text>
              </View>
              <View style={styles.patientCol}>
                <Text style={styles.label}>UHI</Text>
                <Text style={styles.value}>{patient.user?.uhiNo || uhiNo || 'N/A'}</Text>
              </View>
              <View style={styles.patientCol}>
                <Text style={styles.label}>Age</Text>
                <Text style={styles.value}>{patient.user?.age ?? 'N/A'}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.placeholder}>No patient info available</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendation</Text>

          <Button
            mode="contained"
            style={styles.runButton}
            labelStyle={styles.runButtonLabel}
            loading={loadingRec}
            onPress={fetchRecommendation}>
            Run Recommendation
          </Button>

          <View style={styles.responseBox}>
            {loadingRec ? (
              <ActivityIndicator />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : recommendation ? (
              <Text style={styles.responseText}>{recommendation}</Text>
            ) : (
              <Text style={styles.placeholder}>No recommendation yet. Tap Run Recommendation.</Text>
            )}
          </View>

          {lastSessionId ? (
            <View style={{ marginTop: 8 }}>
              <Button mode="text" onPress={clearSession} labelStyle={{ color: colors.adminPrimary }}>
                Clear Session
              </Button>
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.lightPink || '#f8f4f6',
    flexGrow: 1,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 1200,
    backgroundColor: colors.adminCardBackground || '#fff',
    padding: 24,
    paddingTop: 72,
    borderRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.adminPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  section: { marginTop: 12 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.mediumSlateText,
    marginBottom: 8,
  },
  patientRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  patientCol: { flex: 1, padding: 10, backgroundColor: '#fbfdff', borderRadius: 8, borderWidth: 1, borderColor: '#eef6ff' },
  label: { fontSize: 12, color: '#666' },
  value: { fontSize: 14, fontWeight: '600', marginTop: 6, color: '#111' },
  placeholder: { color: '#777', fontStyle: 'italic' },
  runButton: {
    marginTop: 6,
    backgroundColor: colors.adminPrimary,
    borderRadius: 8,
    paddingVertical: 10,
  },
  runButtonLabel: { color: '#fff', fontWeight: '700' },
  responseBox: {
    marginTop: 12,
    minHeight: 140,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    padding: 12,
    backgroundColor: '#fafafa',
  },
  responseText: { color: '#111', lineHeight: 20 },
  errorText: { color: colors.redStatus, fontWeight: '600' },
  backButtonAbsolute: {
    position: 'absolute',
    left: 16,
    top: 16,
    backgroundColor: colors.softPink || '#FFC8DD',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.adminPrimary,
    zIndex: 10,
  },
  backButtonLabel: {
    color: colors.adminPrimary,
    fontWeight: '700',
  },
});