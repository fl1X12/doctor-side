// utils.js

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the custom color palette
export const colors = {
 lightBlue: '#A2D2FF',
 veryLightBlue: '#BDE0FE',
 lightPink: '#FFAFCC',
 veryLightPink: '#FFC8DD',
 lightPurple: '#CDB4DB',
 darkSlateText: '#1a202c',
 mediumSlateText: '#2D3748',
 mainBackgroundFrom: '#f8fafc',
 mainBackgroundTo: '#f1f5f9',
 headerBackground: '#e2e8f0',
 greenStatus: '#28a745',
 yellowStatus: '#ffc107',
 redStatus: '#dc3545',
 adminPrimary: '#2c3e7d',
 adminAccent: '#A2D2FF',
 adminDanger: '#ff4757',
 adminSuccess: '#28a745',
 adminWarning: '#ffc107',
 adminText: '#333',
 adminLightText: '#fff',
 adminBorder: '#e0e0e0',
 adminBackground: '#f5f7fa',
 adminCardBackground: '#ffffff',
};

export const API_BASE_URL = 'http://10.164.255.159:5501/api';

// Create and export the Axios instance to attach the token automatically
export const authAxios = axios.create({
 baseURL: API_BASE_URL,
});

authAxios.interceptors.request.use(
 async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
   config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
 },
 (error) => {
     return Promise.reject(error);
 }
);