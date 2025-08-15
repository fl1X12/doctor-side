// VitalsForm.js - Fixed version

import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import colors from '../../constants/Colors'; // Using the same colors constant

// A reusable radio button group component, refactored to match the source style.
const FormRadioButtonGroup = ({ label, options, selectedValue, onSelect }) => (
  <View style={styles.labeledInputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.radioGroup}>
      {options.map((option) => (
        <TouchableOpacity key={option.value} style={styles.radioOption} onPress={() => onSelect(option.value)}>
          <View style={styles.radioButton}>
            {selectedValue === option.value && <View style={styles.radioButtonInner} />}
          </View>
          <Text style={styles.radioText}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

// A reusable text input component, created to enforce the source style.
const FormLabeledInput = ({ label, value, onChangeText, placeholder, keyboardType = 'default' }) => (
  <View style={styles.labeledInputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.labeledInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#999"
      keyboardType={keyboardType}
    />
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

  // Helper function to validate required fields
  const validateForm = () => {
    const requiredFields = ['visitDate', 'temperature', 'respiratoryRate', 'oxygenSaturation', 'weight'];
    const missingFields = requiredFields.filter(field => !vitalInfo[field] || vitalInfo[field].toString().trim() === '');
    
    if (missingFields.length > 0) {
      return { isValid: false, missingFields };
    }
    return { isValid: true, missingFields: [] };
  };

  const handleSaveWithValidation = () => {
    const validation = validateForm();
    if (!validation.isValid) {
      // You might want to show an alert here
      console.warn('Missing required fields:', validation.missingFields);
      return;
    }
    handleSaveVitalInfo();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header section can be kept separate or moved to a parent layout */}
        <View style={styles.detailsHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentPage('dashboard')}>
                <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButtonSmall} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
        </View>

      {/* Main form card, adopting the 'topBox' style from PreConsultation */}
      <View style={styles.topBox}>
        <Text style={styles.sectionTitle}>Vital Information</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.patientInfo}>{vitalInfo.patientName} (UHI: {vitalInfo.uhiNo})</Text>

          <FormLabeledInput
            label="Visit Date*"
            value={vitalInfo.visitDate}
            onChangeText={(text) => setVitalInfo(prev => ({ ...prev, visitDate: text }))}
            placeholder="YYYY-MM-DD"
          />
          <FormLabeledInput
            label="Temperature (°F)*"
            value={vitalInfo.temperature}
            onChangeText={(text) => setVitalInfo(prev => ({ ...prev, temperature: text }))}
            placeholder="e.g., 98.6"
            keyboardType="numeric"
          />
          <FormLabeledInput
            label="Resp. Rate*"
            value={vitalInfo.respiratoryRate}
            onChangeText={(text) => setVitalInfo(prev => ({ ...prev, respiratoryRate: text }))}
            placeholder="breaths/min"
            keyboardType="numeric"
          />
          <FormLabeledInput
            label="Oxygen Sat.*"
            value={vitalInfo.oxygenSaturation}
            onChangeText={(text) => setVitalInfo(prev => ({ ...prev, oxygenSaturation: text }))}
            placeholder="e.g., 99 %"
            keyboardType="numeric"
          />
          <FormLabeledInput
            label="Weight (kg)*"
            value={vitalInfo.weight}
            onChangeText={(text) => setVitalInfo(prev => ({ ...prev, weight: text }))}
            placeholder="Enter weight"
            keyboardType="numeric"
          />

          {/* Radio buttons refactored to new component */}
          <FormRadioButtonGroup
            label="Jaundice*"
            options={jaundiceOptions}
            selectedValue={vitalInfo.jaundice}
            onSelect={(value) => setVitalInfo(prev => ({ ...prev, jaundice: value }))}
          />
          <FormRadioButtonGroup
            label="Feet (Edema)*"
            options={feetOptions}
            selectedValue={vitalInfo.feet}
            onSelect={(value) => setVitalInfo(prev => ({ ...prev, feet: value }))}
          />

        </View>
      </View>
      
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setCurrentPage('dashboard')}>
                <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.buttonDisabled]}
                onPress={handleSaveWithValidation}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Save Vitals</Text>
                )}
            </TouchableOpacity>
        </View>

    </ScrollView>
  );
}

// Stylesheet refactored to match the design of PreConsultation.js
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.lightPink || '#f8f4f6' 
  },
  contentContainer: {
    padding: 16,
  },
  // Header styles (can be adjusted or moved)
  detailsHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  backButton: { 
    backgroundColor: colors.darkBlue, 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 6 
  },
  backButtonText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  logoutButtonSmall: { 
    backgroundColor: '#dc3545', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 6 
  },
  logoutButtonText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  // Card layout from reference
  topBox: { 
    flex: 1, 
    backgroundColor: colors.white || '#ffffff', 
    borderRadius: 8, 
    overflow: 'hidden', 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2 
  },
  sectionTitle: { 
    fontSize: 16, // Made title slightly larger
    fontWeight: 'bold', 
    backgroundColor: colors.softPink || '#f8d7da', 
    padding: 12, 
    color: '#333' 
  },
  inputContainer: { 
    padding: 16, // Increased padding
    gap: 16 // Increased gap
  },
  patientInfo: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkBlue,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  // Unified input layout styles
  labeledInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  inputLabel: { 
    fontSize: 14, // Made label slightly larger
    fontWeight: '600', 
    color: '#333', 
    width: 110, // Increased width for longer labels
    marginRight: 8 
  },
  labeledInput: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: colors.border || '#e0e0e0', 
    borderRadius: 4, 
    padding: 10, // Adjusted padding
    backgroundColor: '#ffffff', 
    fontSize: 14, 
    height: 40, // Adjusted height
  },
  // Unified radio button styles from reference
  radioGroup: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    flex: 1, 
    gap: 20 // Increased gap
  },
  radioOption: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  radioButton: { 
    height: 20, // Slightly larger
    width: 20, 
    borderRadius: 10, 
    borderWidth: 2, // Thicker border
    borderColor: colors.darkBlue, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 6 
  },
  radioButtonInner: { 
    height: 10, 
    width: 10, 
    borderRadius: 5, 
    backgroundColor: colors.darkBlue 
  },
  radioText: { 
    fontSize: 14 
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 6,
  },
  saveButton: {
    backgroundColor: colors.darkBlue,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  }
});