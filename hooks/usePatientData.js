import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

const API_BASE_URL = 'http://10.226.222.219:5501/api';

// Create one instance to be used across the app
export const authAxios = axios.create({
  baseURL: API_BASE_URL,
});

// Setup interceptors once
let appRouter;
const setAppRouter = (router) => {
  appRouter = router;
};

authAxios.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

authAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      Alert.alert('Session Expired', 'Please log in again.');
      if (appRouter) {
        appRouter.replace('/(tabs)/admin');
      }
    }
    return Promise.reject(error);
  }
);

// The Custom Hook
export const usePatientData = () => {
  const { uhiNo, name } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    setAppRouter(router);
  }, [router]);

  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    details: {},
    analysis: {},
    maternalHealth: {},
    previousBaby: {},
    familyHistory: {},
    notes: [], // Assuming notes is an array of objects
    summary: '',
  });

  const fetchPatientData = useCallback(async () => {
    if (!uhiNo) return;
    setLoading(true);
    try {
      const response = await authAxios.get(`/patients/by/${uhiNo}`);
      const data = response.data;
      setPatientData(data);
      setFormData({
        details: data.user || {},
        analysis: data.analysis || {},
        maternalHealth: data.maternalHealth || {},
        previousBaby: data.previousBaby || {},
        familyHistory: data.familyHistory || {},
        notes: data.notes || [],
        summary: data.summary || '',
      });
    } catch (error) {
      if (!error.response || (error.response.status !== 401 && error.response.status !== 403)) {
        console.error('Error fetching patient data:', error);
        Alert.alert('Error', 'Failed to load patient data');
      }
    } finally {
      setLoading(false);
    }
  }, [uhiNo]);

  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  const savePatientData = async (dataToSave) => {
    if (!patientData?.session?.id) {
      return Alert.alert('Error', 'Cannot save data. Patient session not found.');
    }
    try {
      // We pass only the data that needs to be updated
      await authAxios.put(`/patients/${patientData.session.id}`, dataToSave);
      Alert.alert('Success', 'Patient data saved successfully');
      // Optionally, refetch data to ensure UI is in sync
      await fetchPatientData();
    } catch (error) {
      if (!error.response || (error.response.status !== 401 && error.response.status !== 403)) {
        console.error('Error saving patient data:', error);
        Alert.alert('Error', 'Failed to save patient data');
      }
    }
  };

  return {
    uhiNo,
    name,
    loading,
    patientData,
    formData,
    setFormData,
    savePatientData,
    router,
  };
};