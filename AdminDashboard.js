// AdminDashboard.js - Responsive version

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
    Dimensions,
    useWindowDimensions,
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
 const { width: screenWidth } = useWindowDimensions();
 
 const isSmallScreen = screenWidth < 768;
 const isPhone = screenWidth < 600;

 return (
  <ScrollView 
    style={styles.container}
    contentContainerStyle={styles.contentContainer}
  >
   {/* Responsive Top Bar */}
   <View style={[styles.topBar, isSmallScreen && styles.topBarSmall]}>
    <View style={[styles.leftPinkBox, isSmallScreen && styles.leftPinkBoxSmall]} />
    
    {!isPhone && (
      <TextInput 
        style={[styles.searchBarSmall, isSmallScreen && styles.searchBarSmallScreen]} 
        placeholder="Search..." 
        placeholderTextColor={colors.mediumSlateText} 
      />
    )}
    
    {/* Header Radio Buttons for Department */}
    <View style={[styles.headerRadioContainer, isSmallScreen && styles.headerRadioContainerSmall]}>
     <TouchableOpacity 
      style={[styles.headerRadioOption, isSmallScreen && styles.headerRadioOptionSmall]} 
      onPress={() => setSelectedDepartment('obstetrics')}
     >
      <View style={[styles.headerRadioButton, selectedDepartment === 'obstetrics' && styles.headerRadioButtonSelected]}>
       {selectedDepartment === 'obstetrics' && <View style={styles.headerRadioButtonInner} />}
      </View>
      <Text style={[styles.headerRadioText, isSmallScreen && styles.headerRadioTextSmall]}>Obstetrics</Text>
     </TouchableOpacity>
     
     <TouchableOpacity 
      style={[styles.headerRadioOption, isSmallScreen && styles.headerRadioOptionSmall]} 
      onPress={() => setSelectedDepartment('gynecology')}
     >
      <View style={[styles.headerRadioButton, selectedDepartment === 'gynecology' && styles.headerRadioButtonSelected]}>
       {selectedDepartment === 'gynecology' && <View style={styles.headerRadioButtonInner} />}
      </View>
      <Text style={[styles.headerRadioText, isSmallScreen && styles.headerRadioTextSmall]}>Gynecology</Text>
     </TouchableOpacity>
    </View>

    <View style={[styles.iconGroup, isSmallScreen && styles.iconGroupSmall]}>
     <Text style={[styles.welcomeText, isSmallScreen && styles.welcomeTextSmall]}>Dr. {doctorName}</Text>
     <TouchableOpacity 
      style={[styles.logoutButtonSmall, isSmallScreen && styles.logoutButtonSmallScreen]} 
      onPress={handleLogout}
     >
      <Text style={[styles.logoutButtonText, isSmallScreen && styles.logoutButtonTextSmall]}>Logout</Text>
     </TouchableOpacity>
    </View>
   </View>

   {/* White Center Box */}
   <View style={[styles.centerWhiteBox, isSmallScreen && styles.centerWhiteBoxSmall]} />

   {/* Responsive Content Area */}
   <View style={[styles.contentArea, isSmallScreen && styles.contentAreaSmall]}>
    {/* Left Panel: Appointments */}
    <View style={[styles.leftPanel, isSmallScreen && styles.leftPanelSmall]}>
     <View style={[styles.sectionHeader, isSmallScreen && styles.sectionHeaderSmall]}>
      <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>
       {showCompleted ? 'Completed Appointments' : 'Current Appointments'}
      </Text>
      
      <View style={[styles.buttonGroup, isSmallScreen && styles.buttonGroupSmall]}>
       <TouchableOpacity 
        style={[styles.toggleButton, isSmallScreen && styles.toggleButtonSmall]} 
        onPress={toggleCompletedView}
       >
        <Text style={[styles.toggleButtonText, isSmallScreen && styles.toggleButtonTextSmall]}>
         {showCompleted ? 'Show Waiting' : 'Show Completed'}
        </Text>
       </TouchableOpacity>
       
       {!showCompleted && (
        <>
         <TouchableOpacity 
          style={[styles.addPatientButton, isSmallScreen && styles.addPatientButtonSmall]} 
          onPress={handleAddPatient}
         >
          <Text style={[styles.addPatientButtonText, isSmallScreen && styles.addPatientButtonTextSmall]}>+ Add Patient</Text>
         </TouchableOpacity>
         
         {Platform.OS === 'web' && (
          <label htmlFor="excel-upload" style={[styles.uploadExcelLabel, isSmallScreen && styles.uploadExcelLabelSmall]}>
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
    {!isPhone && (
      <StatsPanel
       waitingCount={appointmentData.length}
       completedCount={completedPatients.length}
      />
    )}
   </View>
  </ScrollView>
 );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
 container: {
  flex: 1,
  backgroundColor: colors.mainBackgroundFrom,
 },
 
 contentContainer: {
  paddingBottom: 20,
 },
 
 // Responsive Top Bar
 topBar: {
  backgroundColor: colors.adminPrimary,
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 20,
  paddingVertical: 12,
  minHeight: 60,
  flexWrap: 'wrap',
 },
 
 topBarSmall: {
  flexDirection: 'column',
  alignItems: 'flex-start',
  paddingVertical: 8,
  paddingHorizontal: 15,
  minHeight: 80,
 },
 
 leftPinkBox: {
  width: 70,
  height: 28,
  backgroundColor: colors.lightPink,
  borderRadius: 4,
  marginRight: 15,
 },
 
 leftPinkBoxSmall: {
  width: 50,
  height: 20,
  marginRight: 10,
  marginBottom: 5,
 },
 
 searchBarSmall: {
  width: 180,
  backgroundColor: colors.adminCardBackground,
  height: 36,
  borderRadius: 6,
  paddingHorizontal: 12,
  fontSize: 14,
  marginRight: 15,
 },
 
 searchBarSmallScreen: {
  width: '100%',
  marginRight: 0,
  marginVertical: 5,
 },
 
 headerRadioContainer: {
  flexDirection: 'row',
  gap: 20,
  marginRight: 15,
 },
 
 headerRadioContainerSmall: {
  flexDirection: 'row',
  gap: 15,
  marginRight: 10,
  marginVertical: 5,
  flexWrap: 'wrap',
 },
 
 headerRadioOption: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
 },
 
 headerRadioOptionSmall: {
  gap: 4,
 },
 
 headerRadioButton: {
  width: 16,
  height: 16,
  borderRadius: 8,
  borderWidth: 2,
  borderColor: colors.adminLightText,
  alignItems: 'center',
  justifyContent: 'center',
 },
 
 headerRadioButtonSelected: {
  borderColor: colors.adminLightText,
 },
 
 headerRadioButtonInner: {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.adminLightText,
 },
 
 headerRadioText: {
  fontSize: 12,
  color: colors.adminLightText,
  fontWeight: '500',
 },
 
 headerRadioTextSmall: {
  fontSize: 11,
 },
 
 iconGroup: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  marginLeft: 'auto',
 },
 
 iconGroupSmall: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginLeft: 0,
  marginTop: 5,
 },
 
 welcomeText: {
  color: colors.adminLightText,
  fontSize: 14,
  fontWeight: '600',
 },
 
 welcomeTextSmall: {
  fontSize: 12,
 },
 
 logoutButtonSmall: {
  backgroundColor: colors.adminDanger,
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 4,
 },
 
 logoutButtonSmallScreen: {
  paddingHorizontal: 10,
  paddingVertical: 4,
 },
 
 logoutButtonText: {
  color: colors.adminLightText,
  fontSize: 12,
  fontWeight: '600',
 },
 
 logoutButtonTextSmall: {
  fontSize: 11,
 },
 
 centerWhiteBox: {
  height: 80,
  backgroundColor: colors.adminCardBackground,
  margin: 20,
  borderRadius: 8,
  borderWidth: 2,
  borderColor: colors.veryLightBlue,
 },
 
 centerWhiteBoxSmall: {
  height: 60,
  margin: 15,
  marginVertical: 10,
 },
 
 contentArea: {
  flexDirection: 'row',
  paddingHorizontal: 20,
  paddingBottom: 20,
  gap: 20,
 },
 
 contentAreaSmall: {
  flexDirection: 'column',
  paddingHorizontal: 15,
  gap: 15,
 },
 
 leftPanel: {
  flex: 3,
  backgroundColor: colors.adminCardBackground,
  borderRadius: 8,
  padding: 15,
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
 },
 
 leftPanelSmall: {
  flex: 1,
  padding: 12,
 },
 
 sectionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 15,
 },
 
 sectionHeaderSmall: {
  flexDirection: 'column',
  alignItems: 'flex-start',
  marginBottom: 10,
 },
 
 sectionTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: colors.adminText,
 },
 
 sectionTitleSmall: {
  fontSize: 14,
  marginBottom: 10,
 },
 
 buttonGroup: {
  flexDirection: 'row',
  gap: 10,
  alignItems: 'center',
 },
 
 buttonGroupSmall: {
  flexDirection: 'row',
  gap: 8,
  alignItems: 'center',
  flexWrap: 'wrap',
  marginTop: 5,
 },
 
 addPatientButton: {
  backgroundColor: "#2D3748",
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 6,
 },
 
 addPatientButtonSmall: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 4,
 },
 
 addPatientButtonText: {
  color: colors.adminLightText,
  fontSize: 14,
  fontWeight: '600',
 },
 
 addPatientButtonTextSmall: {
  fontSize: 12,
 },
 
 toggleButton: {
  backgroundColor: colors.mediumSlateText,
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 4,
 },
 
 toggleButtonSmall: {
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 3,
 },
 
 toggleButtonText: {
  color: colors.adminLightText,
  fontSize: 12,
  fontWeight: '600',
 },
 
 toggleButtonTextSmall: {
  fontSize: 11,
 },
 
 uploadExcelLabel: {
  backgroundColor: "#2D3748",
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 6,
  marginLeft: 10,
  fontSize: 14,
  fontWeight: 'bold',
  color: colors.adminLightText,
  cursor: 'pointer',
  display: 'inline-block',
  textAlign: 'center',
  userSelect: 'none',
 },
 
 uploadExcelLabelSmall: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  fontSize: 12,
  marginLeft: 0,
  marginTop: 5,
 },
});
