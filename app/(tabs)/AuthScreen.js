// AuthScreen.js

import {
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../../lib/utils'; // Import colors

export default function AuthScreen({
 isSignupMode,
 setIsSignupMode,
 username,
 setUsername,
 password,
 setPassword,
 newDoctorName,
 setNewDoctorName,
 newDoctorUsername,
 setNewDoctorUsername,
 newDoctorPassword,
 setNewDoctorPassword,
 handleLogin,
 handleSignup,
 isLoading,
}) {
 return (
  <SafeAreaView style={styles.loginContainer}>
   <View style={styles.loginBox}>
    <Text style={styles.loginTitle}>{isSignupMode ? 'Doctor Signup' : 'Admin Login'}</Text>
    <Text style={styles.loginSubtitle}>
     {isSignupMode ? 'Create a new doctor account' : 'Enter your credentials'}
    </Text>

    {isSignupMode && (
     <View style={styles.inputContainer}>
      <TextInput
       style={styles.input}
       placeholder="Your Name"
       value={newDoctorName}
       onChangeText={setNewDoctorName}
       autoCapitalize="words"
      />
     </View>
    )}

    <View style={styles.inputContainer}>
     <TextInput
      style={styles.input}
      placeholder="Username"
      value={isSignupMode ? newDoctorUsername : username}
      onChangeText={isSignupMode ? setNewDoctorUsername : setUsername}
      autoCapitalize="none"
     />
    </View>

    <View style={styles.inputContainer}>
     <TextInput
      style={styles.input}
      placeholder="Password"
      value={isSignupMode ? newDoctorPassword : password}
      onChangeText={isSignupMode ? setNewDoctorPassword : setPassword}
      secureTextEntry
      autoCapitalize="none"
     />
    </View>

    <TouchableOpacity
     style={[styles.loginButton, isLoading && styles.buttonDisabled]}
     onPress={isSignupMode ? handleSignup : handleLogin}
     disabled={isLoading}
    >
     {isLoading ? (
      <ActivityIndicator color={colors.adminLightText} />
     ) : (
      <Text style={styles.loginButtonText}>{isSignupMode ? 'Sign Up' : 'Login'}</Text>
     )}
    </TouchableOpacity>

    <TouchableOpacity
     style={styles.toggleAuthModeButton}
     onPress={() => setIsSignupMode(!isSignupMode)}
     disabled={isLoading}
    >
     <Text style={styles.toggleAuthModeButtonText}>
      {isSignupMode ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
     </Text>
    </TouchableOpacity>
   </View>
  </SafeAreaView>
 );
}

const styles = StyleSheet.create({
 loginContainer: {
  flex: 1,
  backgroundColor: colors.adminBackground,
  justifyContent: 'center',
  paddingHorizontal: 30,
 },
 loginBox: {
  backgroundColor: colors.adminCardBackground,
  padding: 30,
  borderRadius: 15,
  elevation: 5,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
 },
 loginTitle: {
  fontSize: 28,
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: 10,
  color: colors.adminPrimary,
 },
 loginSubtitle: {
  fontSize: 16,
  textAlign: 'center',
  marginBottom: 30,
  color: colors.mediumSlateText,
 },
 inputContainer: {
  marginBottom: 20,
 },
 input: {
  backgroundColor: colors.mainBackgroundFrom,
  paddingHorizontal: 15,
  paddingVertical: 15,
  borderRadius: 10,
  fontSize: 16,
  borderWidth: 1,
  borderColor: colors.adminBorder,
 },
 loginButton: {
  backgroundColor: colors.adminPrimary,
  paddingVertical: 15,
  borderRadius: 10,
  marginTop: 10,
  alignItems: 'center',
 },
 loginButtonText: {
  color: colors.adminLightText,
  fontSize: 16,
  fontWeight: 'bold',
 },
 buttonDisabled: {
  backgroundColor: '#ccc',
 },
 toggleAuthModeButton: {
  marginTop: 20,
  alignItems: 'center',
 },
 toggleAuthModeButtonText: {
  color: colors.adminPrimary,
  fontSize: 14,
  fontWeight: 'bold',
 },
});