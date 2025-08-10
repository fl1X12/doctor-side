// VitalsForm.js

import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../../lib/utils'; // Assuming utils.js is in the same directory

// A reusable radio button group component for this form
const RadioButtonGroup = ({ label, options, selectedValue, onSelect }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label} *</Text>
        <View style={styles.dropdownContainer}>
            {options.map((option) => (
                <TouchableOpacity
                    key={option.value}
                    style={[
                        styles.dropdownButton,
                        selectedValue === option.value && styles.dropdownSelected,
                    ]}
                    onPress={() => onSelect(option.value)}
                >
                    <View style={styles.radioOption}>
                        <View style={[ styles.radioButton, selectedValue === option.value && styles.radioButtonSelected, ]}>
                            {selectedValue === option.value && <View style={styles.radioButtonInner} />}
                        </View>
                        <Text style={styles.radioText}>{option.label}</Text>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);


export default function VitalsForm({
    vitalInfo,
    setVitalInfo,
    handleSaveVitalInfo,
    setCurrentPage,
    handleLogout,
    isLoading,
}) {
    const jaundiceOptions = [
        { label: 'Absent', value: 'absent' },
        { label: 'Mild', value: 'mild' },
        { label: 'Severe', value: 'severe' },
    ];

    const feetOptions = [
        { label: 'Absent', value: 'absent' },
        { label: 'Mild', value: 'mild' },
        { label: 'Severe', value: 'severe' },
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.detailsContainer}>
                <View style={styles.detailsHeader}>
                    <TouchableOpacity style={styles.backButton} onPress={() => setCurrentPage('dashboard')}>
                        <Text style={styles.backButtonText}>← Back to Dashboard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutButtonSmall} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.detailsCard}>
                    <Text style={styles.detailsTitle}>Vital Information</Text>
                    <Text style={styles.patientInfo}>{vitalInfo.patientName} (UHI: {vitalInfo.uhiNo})</Text>

                    <View style={styles.formContainer}>
                        {/* Visit Date */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Visit Date *</Text>
                            <TextInput
                                style={styles.input}
                                value={vitalInfo.visitDate}
                                onChangeText={(text) => setVitalInfo(prev => ({ ...prev, visitDate: text }))}
                                placeholder="YYYY-MM-DD"
                            />
                        </View>

                        {/* Temperature */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Temperature (°F) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter temperature"
                                value={vitalInfo.temperature}
                                onChangeText={(text) => setVitalInfo(prev => ({ ...prev, temperature: text }))}
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Respiratory Rate */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Respiratory Rate (breaths/min) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter respiratory rate"
                                value={vitalInfo.respiratoryRate}
                                onChangeText={(text) => setVitalInfo(prev => ({ ...prev, respiratoryRate: text }))}
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Oxygen Saturation */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Oxygen Saturation (%) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter oxygen saturation"
                                value={vitalInfo.oxygenSaturation}
                                onChangeText={(text) => setVitalInfo(prev => ({ ...prev, oxygenSaturation: text }))}
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Jaundice */}
                        <RadioButtonGroup
                            label="Jaundice"
                            options={jaundiceOptions}
                            selectedValue={vitalInfo.jaundice}
                            onSelect={(value) => setVitalInfo(prev => ({ ...prev, jaundice: value }))}
                        />

                        {/* Feet (Edema) */}
                        <RadioButtonGroup
                            label="Feet (Edema)"
                            options={feetOptions}
                            selectedValue={vitalInfo.feet}
                            onSelect={(value) => setVitalInfo(prev => ({ ...prev, feet: value }))}
                        />

                        {/* Weight */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Weight (kg) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter weight"
                                value={vitalInfo.weight}
                                onChangeText={(text) => setVitalInfo(prev => ({ ...prev, weight: text }))}
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setCurrentPage('dashboard')}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveButton, isLoading && styles.buttonDisabled]}
                                onPress={handleSaveVitalInfo}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color={colors.adminLightText} />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save Vital Info</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.mainBackgroundFrom },
    detailsContainer: { padding: 20 },
    detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    backButton: { backgroundColor: colors.adminPrimary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 6 },
    backButtonText: { color: colors.adminLightText, fontSize: 14, fontWeight: '600' },
    logoutButtonSmall: { backgroundColor: colors.adminDanger, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
    logoutButtonText: { color: colors.adminLightText, fontSize: 12, fontWeight: '600' },
    detailsCard: { backgroundColor: colors.adminCardBackground, borderRadius: 8, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    detailsTitle: { fontSize: 20, fontWeight: '700', color: colors.adminText, marginBottom: 10, textAlign: 'center' },
    patientInfo: { fontSize: 16, fontWeight: '600', color: colors.adminText, textAlign: 'center', marginBottom: 20 },
    formContainer: { gap: 15 },
    inputContainer: {},
    inputLabel: { fontSize: 14, fontWeight: '600', color: colors.adminText, marginBottom: 8 },
    input: { backgroundColor: colors.mainBackgroundFrom, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: colors.adminBorder },
    dropdownContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    dropdownButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: colors.adminBorder, borderRadius: 8 },
    dropdownSelected: { borderColor: colors.adminPrimary, backgroundColor: colors.veryLightBlue },
    radioOption: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    radioButton: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.mediumSlateText, justifyContent: 'center', alignItems: 'center' },
    radioButtonSelected: { borderColor: colors.adminPrimary },
    radioButtonInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.adminPrimary },
    radioText: { fontSize: 14, color: colors.adminText },
    buttonContainer: { flexDirection: 'row', gap: 15, marginTop: 20 },
    cancelButton: { flex: 1, backgroundColor: colors.mediumSlateText, paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
    cancelButtonText: { color: colors.adminLightText, fontSize: 16, fontWeight: '600' },
    saveButton: { flex: 1, backgroundColor: colors.adminSuccess, paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
    saveButtonText: { color: colors.adminLightText, fontSize: 16, fontWeight: '600' },
    buttonDisabled: { backgroundColor: '#ccc' },
});
