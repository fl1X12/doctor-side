import axios from 'axios';
import { Audio } from 'expo-av';

export async function recordAndRecognizeSpeech(language = "en") {
  // Request permissions
  const { status } = await Audio.requestPermissionsAsync();
  if (status !== 'granted') throw new Error('Permission not granted');

  // Start recording
  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
  await recording.startAsync();

  // Wait for user to finish speaking (implement your own UI for this)
  // For demo: record for 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));
  await recording.stopAndUnloadAsync();

  const uri = recording.getURI();
  const formData = new FormData();
  formData.append('audio', {
    uri,
    name: 'audio.wav',
    type: 'audio/wav'
  });
  formData.append('language', language); // Pass language to backend

  // Send to backend
  const response = await axios.post('http://110.45.225.1:5050/voice-to-text', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.text;
}

export function handleVoiceCommand(command, navigation) {
  const cmd = command.toLowerCase();
  console.log("Recognized command:", cmd);

   if (
    cmd.includes('appointment') || 
    cmd.includes('appointments') || 
    cmd.includes('अपॉइंटमेंट') || 
    cmd.includes('अपॉइंटमेंट्स')
  ) {
    navigation.navigate('Appointment');
  }
   else if (cmd.includes('prescription')) {
    navigation.navigate('SchedulePage');
  } else if (cmd.includes('home')|| cmd.includes('होम')) {
    navigation.navigate('Home');
  }  else if (
    cmd.includes('digital twin') || 
    cmd.includes('dt') || 
    cmd.includes('डिजिटल ट्विन')
  ){
    navigation.navigate('DT');
  }
  else if (
    cmd.includes('add medicine') || 
    cmd.includes('medicine') || 
    cmd.includes('दवा') || 
    cmd.includes('मेडिसिन')
  ) {
    navigation.navigate('AddMedicine');
  }
  else if (
    cmd.includes('qr') || 
    cmd.includes('qr login') || 
    cmd.includes('क्यूआर')
  ) {
    navigation.navigate('QRLogin');
  }
  else if (cmd.includes('history')) {
    navigation.navigate('History');
  } else {
    alert('Command not recognized: ' + command);
  }
}