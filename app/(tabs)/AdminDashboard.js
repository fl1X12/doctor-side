// AdminDashboard.js

import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../../lib/utils';
import PatientTable from './PatientTable'; // Import child component
import StatsPanel from './StatsPanel'; // Import child component

export default function AdminDashboard({
 doctorName,
 handleLogout,
 appointmentData,
 completedPatients,
 showCompleted,
 toggleCompletedView,
 handleAddPatient,
 handleWebExcelUpload,
 markPatientCompleted,
 setVitalInfo,
 setCurrentPage,
}) {
 const router = useRouter();
 const [selectedDepartment, setSelectedDepartment] = useState('obstetrics');

 return (
  <ScrollView style={styles.container}>
   {/* Top Bar */}
   <View style={styles.topBar}>
    <View style={styles.leftPinkBox} />
    <TextInput style={styles.searchBarSmall} placeholder="Search..." placeholderTextColor={colors.mediumSlateText} />
    
    {/* Header Radio Buttons for Department */}
    <View style={styles.headerRadioContainer}>
     {/* Obstetrics */}
     <TouchableOpacity style={styles.headerRadioOption} onPress={() => setSelectedDepartment('obstetrics')}>
      <View style={[styles.headerRadioButton, selectedDepartment === 'obstetrics' && styles.headerRadioButtonSelected]}>
       {selectedDepartment === 'obstetrics' && <View style={styles.headerRadioButtonInner} />}
      </View>
      <Text style={styles.headerRadioText}>Obstetrics</Text>
     </TouchableOpacity>
     {/* Gynecology */}
     <TouchableOpacity style={styles.headerRadioOption} onPress={() => setSelectedDepartment('gynecology')}>
      <View style={[styles.headerRadioButton, selectedDepartment === 'gynecology' && styles.headerRadioButtonSelected]}>
       {selectedDepartment === 'gynecology' && <View style={styles.headerRadioButtonInner} />}
      </View>
      <Text style={styles.headerRadioText}>Gynecology</Text>
     </TouchableOpacity>
    </View>

    <View style={styles.iconGroup}>
     <Text style={styles.welcomeText}>Dr. {doctorName}</Text>
     <TouchableOpacity style={styles.logoutButtonSmall} onPress={handleLogout}>
      <Text style={styles.logoutButtonText}>Logout</Text>
     </TouchableOpacity>
    </View>
   </View>

   {/* White Center Box */}
   <View style={styles.centerWhiteBox} />

   {/* Content Area */}
   <View style={styles.contentArea}>
    {/* Left Panel: Appointments */}
    <View style={styles.leftPanel}>
     <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
       {showCompleted ? 'Completed Appointments' : 'Current Appointments'}
      </Text>
      <View style={styles.buttonGroup}>
       <TouchableOpacity style={styles.toggleButton} onPress={toggleCompletedView}>
        <Text style={styles.toggleButtonText}>
         {showCompleted ? 'Show Waiting' : 'Show Completed'}
        </Text>
       </TouchableOpacity>
       {!showCompleted && (
        <>
         <TouchableOpacity style={styles.addPatientButton} onPress={handleAddPatient}>
          <Text style={styles.addPatientButtonText}>+ Add Patient</Text>
         </TouchableOpacity>
         {Platform.OS === 'web' && (
          <label htmlFor="excel-upload" style={styles.uploadExcelLabel}>
            Upload Excel
           <input
            id="excel-upload"
            type="file"
            accept=".xlsx, .xls"
            onChange={handleWebExcelUpload}
            style={{ display: 'none' }}
           />
          </label>
         )}
        </>
       )}
      </View>
     </View>
     
     <PatientTable
      patients={showCompleted ? completedPatients : appointmentData}
      isCompletedView={showCompleted}
      router={router}
      onMarkComplete={markPatientCompleted}
      onViewVitals={(patient) => {
       setVitalInfo({
        patientId: patient._id,
        uhiNo: patient.uhiNo,
        patientName: patient.patientName,
        visitDate: patient.visitDate ? new Date(patient.visitDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        temperature: patient.temperature || '',
        respiratoryRate: patient.respiratoryRate || '',
        oxygenSaturation: patient.oxygenSaturation || '',
        jaundice: patient.jaundice || 'absent',
        feet: patient.feet || 'absent',
        weight: patient.weight || '',
       });
       setCurrentPage('vitalInfo');
      }}
     />
    </View>

    {/* Right Panel: Stats */}
    <StatsPanel
     waitingCount={appointmentData.length}
     completedCount={completedPatients.length}
    />
   </View>
  </ScrollView>
 );
}

const styles = StyleSheet.create({
 /* === Copied Styles from original file === */
 container: { flex: 1, backgroundColor: colors.mainBackgroundFrom },
 topBar: { backgroundColor: colors.adminPrimary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, height: 60 },
 leftPinkBox: { width: 70, height: 28, backgroundColor: colors.lightPink, borderRadius: 4, marginRight: 15 },
 searchBarSmall: { width: 180, backgroundColor: colors.adminCardBackground, height: 36, borderRadius: 6, paddingHorizontal: 12, fontSize: 14, marginRight: 15 },
 iconGroup: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 'auto' },
 welcomeText: { color: colors.adminLightText, fontSize: 14, fontWeight: '600' },
 logoutButtonSmall: { backgroundColor: colors.adminDanger, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
 logoutButtonText: { color: colors.adminLightText, fontSize: 12, fontWeight: '600' },
 centerWhiteBox: { height: 80, backgroundColor: colors.adminCardBackground, margin: 20, borderRadius: 8, borderWidth: 2, borderColor: colors.veryLightBlue },
 contentArea: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 20, gap: 20 },
 leftPanel: { flex: 3, backgroundColor: colors.adminCardBackground, borderRadius: 8, padding: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
 sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
 buttonGroup: { flexDirection: 'row', gap: 10, alignItems: 'center' },
 sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.adminText },
 addPatientButton: { backgroundColor: "#2D3748", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
 addPatientButtonText: { color: colors.adminLightText, fontSize: 14, fontWeight: '600' },
 toggleButton: { backgroundColor: colors.mediumSlateText, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
 toggleButtonText: { color: colors.adminLightText, fontSize: 12, fontWeight: '600' },
 headerRadioContainer: { flexDirection: 'row', gap: 20, marginRight: 15 },
 headerRadioOption: { flexDirection: 'row', alignItems: 'center', gap: 6 },
 headerRadioButton: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.adminLightText, alignItems: 'center', justifyContent: 'center' },
 headerRadioButtonSelected: { borderColor: colors.adminLightText },
 headerRadioButtonInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.adminLightText },
 headerRadioText: { fontSize: 12, color: colors.adminLightText, fontWeight: '500' },
 uploadExcelLabel: { backgroundColor: "#2D3748", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, marginLeft: 10, fontSize: 14, fontWeight: 'bold', color: colors.adminLightText, cursor: 'pointer', display: 'inline-block', textAlign: 'center', userSelect: 'none' },
});