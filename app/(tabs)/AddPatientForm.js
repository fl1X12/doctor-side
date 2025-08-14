// AddPatientForm.js

import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../../lib/utils';

export default function AddPatientForm({
 newPatient,
 setNewPatient,
 handleSavePatient,
 handleCancelAddPatient,
 handleLogout,
 isLoading,
}) {
 return (
  <ScrollView style={styles.container}>
   <View style={styles.detailsContainer}>
    <View style={styles.detailsHeader}>
     <TouchableOpacity style={styles.backButton} onPress={handleCancelAddPatient}>
      <Text style={styles.backButtonText}> Back to Dashboard</Text>
     </TouchableOpacity>
     <TouchableOpacity style={styles.logoutButtonSmall} onPress={handleLogout}>
      <Text style={styles.logoutButtonText}>Logout</Text>
     </TouchableOpacity>
    </View>

    <View style={styles.detailsCard}>
     <Text style={styles.detailsTitle}>Add Patient Details</Text>
     <View style={styles.formContainer}>
      {/* UHI Number Input */}
      <View style={styles.inputContainer}>
       <Text style={styles.inputLabel}>UHI Number *</Text>
       <TextInput
        style={styles.input}
        placeholder="Enter UHI Number"
        value={newPatient.uhiNo}
        onChangeText={(text) => setNewPatient((prev) => ({ ...prev, uhiNo: text }))}
        autoCapitalize="characters"
       />
      </View>

      {/* Department Radio Buttons */}
      <View style={styles.inputContainer}>
       <Text style={styles.inputLabel}>Department *</Text>
       <View style={styles.dropdownContainer}>
        {/* Obstetrics */}
        <TouchableOpacity
         style={[ styles.dropdownButton, newPatient.redirection === 'obstetrics' && styles.dropdownSelected, ]}
         onPress={() => setNewPatient((prev) => ({ ...prev, redirection: 'obstetrics' }))}
        >
         <View style={styles.radioOption}>
          <View style={[ styles.radioButton, newPatient.redirection === 'obstetrics' && styles.radioButtonSelected, ]}>
           {newPatient.redirection === 'obstetrics' && <View style={styles.radioButtonInner} />}
          </View>
          <Text style={styles.radioText}>Obstetrics</Text>
         </View>
        </TouchableOpacity>
        {/* Gynecology */}
        <TouchableOpacity
         style={[ styles.dropdownButton, newPatient.redirection === 'gynecology' && styles.dropdownSelected, ]}
         onPress={() => setNewPatient((prev) => ({ ...prev, redirection: 'gynecology' }))}
        >
         <View style={styles.radioOption}>
          <View style={[ styles.radioButton, newPatient.redirection === 'gynecology' && styles.radioButtonSelected, ]}>
           {newPatient.redirection === 'gynecology' && <View style={styles.radioButtonInner} />}
          </View>
          <Text style={styles.radioText}>Gynecology</Text>
         </View>
        </TouchableOpacity>
       </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
       <TouchableOpacity style={styles.cancelButton} onPress={handleCancelAddPatient}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
       </TouchableOpacity>
       <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.buttonDisabled]}
        onPress={handleSavePatient}
        disabled={isLoading}
       >
        {isLoading ? (
         <ActivityIndicator color={colors.adminLightText} />
        ) : (
         <Text style={styles.saveButtonText}>Save Patient</Text>
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
 /* === Copied Styles from original file === */
 container: { flex: 1, backgroundColor: colors.mainBackgroundFrom },
 detailsContainer: { padding: 20 },
 detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
 backButton: { backgroundColor: colors.adminPrimary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 6 },
 backButtonText: { color: colors.adminLightText, fontSize: 14, fontWeight: '600' },
 logoutButtonSmall: { backgroundColor: colors.adminDanger, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
 logoutButtonText: { color: colors.adminLightText, fontSize: 12, fontWeight: '600' },
 detailsCard: { backgroundColor: colors.adminCardBackground, borderRadius: 8, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
 detailsTitle: { fontSize: 20, fontWeight: '700', color: colors.adminText, marginBottom: 20, textAlign: 'center' },
 formContainer: { gap: 20 },
 inputContainer: { marginBottom: 0 }, // Removed default margin
 inputLabel: { fontSize: 14, fontWeight: '600', color: colors.adminText, marginBottom: 8 },
 input: { backgroundColor: colors.mainBackgroundFrom, paddingHorizontal: 15, paddingVertical: 15, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: colors.adminBorder },
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