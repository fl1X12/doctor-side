import { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export const LabeledInput = ({
  label,
  section,
  field,
  formData,
  setFormData,
  placeholder = '',
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
}) => {
  const value = formData?.[section]?.[field]?.toString() || '';
  const handleChange = (text) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: text },
    }));
  };
  return (
    <View style={styles.labeledInputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.labeledInput, multiline && styles.multilineInput]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={handleChange}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
};

export const RadioButtonInput = ({ label, section, field, options, formData, setFormData }) => {
  const selectedOption = formData?.[section]?.[field];
  const handleSelect = (value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };
  return (
    <View style={styles.labeledInputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.radioGroup}>
        {options.map((option) => (
          <TouchableOpacity key={option.value} style={styles.radioOption} onPress={() => handleSelect(option.value)}>
            <View style={styles.radioButton}>
              {selectedOption === option.value && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={styles.radioText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export const DropdownInput = ({ label, section, field, options, placeholder, formData, setFormData }) => {
  const selectedValue = formData?.[section]?.[field];
  const [isPickerVisible, setPickerVisible] = useState(false);
  const handleValueChange = (itemValue) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: itemValue },
    }));
    setPickerVisible(false);
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.labeledInputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <select
          style={styles.webSelect}
          value={selectedValue || ''}
          onChange={(e) => handleValueChange(e.target.value)}>
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </View>
    );
  }

  return (
    <View style={styles.labeledInputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity style={styles.dropdownButton} onPress={() => setPickerVisible(!isPickerVisible)}>
        <Text style={styles.dropdownButtonText}>{selectedValue || placeholder}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      {isPickerVisible && (
        <View style={styles.dropdownOptionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.dropdownOption}
              onPress={() => handleValueChange(option.value)}>
              <Text style={styles.dropdownOptionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// NOTE: A StyleSheet definition is required for the `styles.` references to work.
const styles = StyleSheet.create({
  // Styles for all components
  labeledInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  inputLabel: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#333', 
    width: 90, 
    marginRight: 8 
  },

  // Styles for LabeledInput
  labeledInput: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#e0e0e0', // Assuming colors.border is '#e0e0e0'
    borderRadius: 4, 
    padding: 8, 
    backgroundColor: '#ffffff', 
    fontSize: 12, 
    height: 36, 
    justifyContent: 'center' 
  },
  multilineInput: { 
    height: 'auto', 
    minHeight: 80, 
    textAlignVertical: 'top' 
  },

  // Styles for RadioButtonInput
  radioGroup: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    flex: 1, 
    gap: 15 
  },
  radioOption: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  radioButton: { 
    height: 18, 
    width: 18, 
    borderRadius: 9, 
    borderWidth: 1.5, 
    borderColor: '#007AFF', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 5 
  },
  radioButtonInner: { 
    height: 10, 
    width: 10, 
    borderRadius: 5, 
    backgroundColor: '#007AFF' 
  },
  radioText: { 
    fontSize: 12 
  },

  // Styles for DropdownInput
  dropdownButton: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#e0e0e0', // Assuming colors.border is '#e0e0e0'
    borderRadius: 4, 
    padding: 8, 
    backgroundColor: '#ffffff', 
    height: 36 
  },
  dropdownButtonText: { 
    fontSize: 12 
  },
  dropdownArrow: { 
    fontSize: 10 
  },
  dropdownOptionsContainer: { 
    position: 'absolute', 
    top: '100%', 
    left: 98, 
    right: 0, 
    backgroundColor: '#ffffff', 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 4, 
    zIndex: 10, 
    maxHeight: 150 
  },
  dropdownOption: { 
    padding: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  dropdownOptionText: { 
    fontSize: 12 
  },
  webSelect: { 
    flex: 1, 
    height: 36, 
    borderWidth: 1, 
    borderColor: '#e0e0e0', 
    borderRadius: 4, 
    paddingHorizontal: 8, 
    backgroundColor: '#fff' 
  },
});