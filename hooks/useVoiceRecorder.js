import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useState } from 'react';
import { Alert } from 'react-native';

//==============================================================================
// --- Custom Hook for Voice Recording & Transcription ---
// File Path: src/hooks/useVoiceRecorder.js
//
// This hook has been updated to send the recorded audio to your local Python
// backend server for transcription.
//==============================================================================
const useVoiceRecorder = ({ onResult }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- IMPORTANT ---
  // Replace this with your computer's Local IP Address.
  // Your phone and computer must be on the same Wi-Fi network.
  const YOUR_BACKEND_URL = 'http://10.5.41.120:5001/transcribe';

  const startRecording = async () => {
    try {
      if (YOUR_BACKEND_URL.includes('YOUR_LOCAL_IP_ADDRESS')) {
        Alert.alert('Backend URL Missing', 'Please add your computer\'s local IP address to useVoiceRecorder.js');
        return;
      }
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Microphone permission is required.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingOptions = {
        isMeteringEnabled: true,
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.WAV,
          audioEncoder: Audio.AndroidAudioEncoder.PCM,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Start recording error:', error);
      Alert.alert('Error', 'Could not start recording.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      setIsRecording(false);
      setLoading(true);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      await sendAudioToServer(uri);
    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert('Error', 'Failed to stop recording.');
      setLoading(false);
    }
  };

  // --- This function now sends the audio to your Python server ---
  const sendAudioToServer = async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Audio file not found.');
      }

      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        name: 'recording.wav',
        type: 'audio/wav',
      });

      const response = await fetch(YOUR_BACKEND_URL, {
        method: 'POST',
        headers: {
          // Content-Type is automatically set to 'multipart/form-data'
          // when you use FormData in the body.
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        // Use the error message from the server if available
        throw new Error(result.error || 'Failed to transcribe audio.');
      }
      
      const transcript = result.transcription || "No text was transcribed.";
      onResult?.(transcript);

    } catch (err) {
      console.error('Backend Server Error:', err);
      Alert.alert('Transcription Error', `Could not connect to the server or an error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    isRecording,
    loading,
    start: startRecording,
    stop: stopRecording,
  };
};

export default useVoiceRecorder;
