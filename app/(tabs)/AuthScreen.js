// AuthScreen.js
import {
    ActivityIndicator, // Import ScrollView
    KeyboardAvoidingView, // Import KeyboardAvoidingView
    Platform,
    SafeAreaView,
    ScrollView,
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
    newDoctor,
    setNewDoctor,
    handleLogin,
    handleSignup,
    isLoading,
}) {
    // Helper function to handle input changes for the newDoctor state object
    const handleNewDoctorChange = (key, value) => {
        setNewDoctor((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Adjust behavior based on OS
        >
            <SafeAreaView style={styles.loginContainer}>
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled" // Ensures taps work even when keyboard is up
                >
                    <View style={styles.loginBox}>
                        <Text style={styles.loginTitle}>
                            {isSignupMode ? 'Doctor Signup' : 'Admin Login'}
                        </Text>
                        <Text style={styles.loginSubtitle}>
                            {isSignupMode
                                ? 'Create a new doctor account'
                                : 'Enter your credentials'}
                        </Text>

                        {isSignupMode ? (
                            <>
                                {/* Signup Fields */}
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Your Name"
                                        value={newDoctor.name}
                                        onChangeText={(text) => handleNewDoctorChange('name', text)}
                                        autoCapitalize="words"
                                    />
                                </View>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Username"
                                        value={newDoctor.username}
                                        onChangeText={(text) => handleNewDoctorChange('username', text)}
                                        autoCapitalize="none"
                                    />
                                </View>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Password"
                                        value={newDoctor.password}
                                        onChangeText={(text) => handleNewDoctorChange('password', text)}
                                        secureTextEntry
                                        autoCapitalize="none"
                                    />
                                </View>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Age"
                                        value={newDoctor.age}
                                        onChangeText={(text) => handleNewDoctorChange('age', text)}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Gender"
                                        value={newDoctor.gender}
                                        onChangeText={(text) => handleNewDoctorChange('gender', text)}
                                    />
                                </View>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Phone Number"
                                        value={newDoctor.phone}
                                        onChangeText={(text) => handleNewDoctorChange('phone', text)}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Specialization"
                                        value={newDoctor.specialization}
                                        onChangeText={(text) => handleNewDoctorChange('specialization', text)}
                                    />
                                </View>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Experience (in years)"
                                        value={newDoctor.experience}
                                        onChangeText={(text) => handleNewDoctorChange('experience', text)}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="License Number"
                                        value={newDoctor.license}
                                        onChangeText={(text) => handleNewDoctorChange('license', text)}
                                    />
                                </View>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Hospital"
                                        value={newDoctor.hospital}
                                        onChangeText={(text) => handleNewDoctorChange('hospital', text)}
                                    />
                                </View>
                            </>
                        ) : (
                            <>
                                {/* Login Fields */}
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Username"
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                    />
                                </View>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Password"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        autoCapitalize="none"
                                    />
                                </View>
                            </>
                        )}

                        <TouchableOpacity
                            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                            onPress={isSignupMode ? handleSignup : handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={colors.adminLightText} />
                            ) : (
                                <Text style={styles.loginButtonText}>
                                    {isSignupMode ? 'Sign Up' : 'Login'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.toggleAuthModeButton}
                            onPress={() => setIsSignupMode(!isSignupMode)}
                            disabled={isLoading}
                        >
                            <Text style={styles.toggleAuthModeButtonText}>
                                {isSignupMode
                                    ? 'Already have an account? Login'
                                    : "Don't have an account? Sign Up"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    loginContainer: {
        flex: 1,
        backgroundColor: colors.adminBackground,
    },
    // New style for the ScrollView's content
    scrollContainer: {
        flexGrow: 1, // Ensures the container can grow to fit content
        justifyContent: 'center', // Centers the content vertically
        paddingHorizontal: 30, // Keeps the horizontal padding
        paddingVertical: 20, // Adds some vertical padding
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
        marginBottom: 15, // Slightly reduced margin for smaller screens
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
