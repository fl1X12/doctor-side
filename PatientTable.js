// PatientTable.js - Responsive version

import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Dimensions, useWindowDimensions } from 'react-native';
import { colors } from '../../lib/utils';

export default function PatientTable({
 patients,
 isCompletedView,
 router,
 onMarkComplete,
 onViewVitals,
}) {
 const { width: screenWidth } = useWindowDimensions();
 const isSmallScreen = screenWidth < 768;
 const isPhone = screenWidth < 600;

 const handleRowPress = (rowData) => {
  const pathname = isCompletedView ? '/patient-report' : '/patient';
  router.push({
   pathname,
   params: { uhiNo: rowData.uhiNo, name: rowData.patientName },
  });
 };

 const handleOverviewPress = (e, rowData) => {
  e.stopPropagation();
  router.push({
   pathname: '/patient-report',
   params: { uhiNo: rowData.uhiNo, name: rowData.patientName },
  });
 };

 if (patients.length === 0) {
  return (
   <View style={styles.emptyTableRow}>
    <Text style={styles.emptyTableText}>
     {isCompletedView ? 'No completed patients found.' : 'No patients added yet. Click Add Patient to get started.'}
    </Text>
   </View>
  );
 }

 return (
  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={true}
    contentContainerStyle={styles.scrollContainer}
  >
   <View style={[styles.table, isSmallScreen && styles.tableSmall]}>
    <View style={[styles.tableHeader, isSmallScreen && styles.tableHeaderSmall]}>
     <Text style={[styles.headerCell, isSmallScreen && styles.headerCellSmall]}>Sl.No</Text>
     <Text style={[styles.headerCell, isSmallScreen && styles.headerCellSmall]}>UHI No</Text>
     <Text style={[styles.headerCell, isSmallScreen && styles.headerCellSmall]}>Patient Name</Text>
     <Text style={[styles.headerCell, isSmallScreen && styles.headerCellSmall]}>Redirection</Text>
     {!isCompletedView && <Text style={[styles.headerCell, isSmallScreen && styles.headerCellSmall]}>Action</Text>}
    </View>

    {patients.map((rowData, index) => (
     <TouchableOpacity
      key={index}
      style={[styles.tableRow, isSmallScreen && styles.tableRowSmall]}
      onPress={() => handleRowPress(rowData)}
      activeOpacity={0.7}
     >
      <Text style={[styles.tableCell, isSmallScreen && styles.tableCellSmall]}>{rowData.slNo}</Text>
      <Text style={[styles.tableCell, isSmallScreen && styles.tableCellSmall]}>{rowData.uhiNo}</Text>
      <Text style={[styles.tableCell, isSmallScreen && styles.tableCellSmall]}>{rowData.patientName}</Text>
      <Text style={[styles.tableCell, isSmallScreen && styles.tableCellSmall]}>{rowData.redirection || '-'}</Text>
      
      {!isCompletedView && (
       <View style={[styles.tableCell, isSmallScreen && styles.tableCellSmall]}>
        <View style={[styles.actionButtonsContainer, isSmallScreen && styles.actionButtonsContainerSmall]}>
         <TouchableOpacity 
          style={[styles.completeButton, isSmallScreen && styles.completeButtonSmall]} 
          onPress={(e) => { e.stopPropagation(); onMarkComplete(rowData._id); }}
         >
          <Text style={[styles.completeButtonText, isSmallScreen && styles.completeButtonTextSmall]}>Complete</Text>
         </TouchableOpacity>
         
         <TouchableOpacity 
          style={[styles.overviewButton, isSmallScreen && styles.overviewButtonSmall]} 
          onPress={(e) => { e.stopPropagation(); handleOverviewPress(e, rowData); }}
         >
          <Text style={[styles.overviewButtonText, isSmallScreen && styles.overviewButtonTextSmall]}>Overview</Text>
         </TouchableOpacity>
         
         <TouchableOpacity 
          style={[styles.vitalButton, isSmallScreen && styles.vitalButtonSmall]} 
          onPress={(e) => { e.stopPropagation(); onViewVitals(rowData); }}
         >
          <Text style={[styles.vitalButtonText, isSmallScreen && styles.vitalButtonTextSmall]}>Vital Info</Text>
         </TouchableOpacity>
        </View>
       </View>
      )}
     </TouchableOpacity>
    ))}
   </View>
  </ScrollView>
 );
}

const styles = StyleSheet.create({
 scrollContainer: {
  flexGrow: 1,
  paddingHorizontal: 10,
 },
 
 table: {
  minWidth: 600,
  backgroundColor: '#fff',
  borderRadius: 4,
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: colors.adminBorder,
 },
 
 tableSmall: {
  minWidth: 400,
  borderRadius: 3,
 },
 
 tableHeader: {
  flexDirection: 'row',
  paddingVertical: 10,
  paddingHorizontal: 8,
  backgroundColor: colors.mainBackgroundTo,
  borderBottomWidth: 1,
  borderBottomColor: colors.adminBorder,
 },
 
 tableHeaderSmall: {
  paddingVertical: 8,
  paddingHorizontal: 6,
 },
 
 headerCell: {
  flex: 1,
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: 12,
  color: colors.adminText,
  paddingHorizontal: 4,
 },
 
 headerCellSmall: {
  fontSize: 10,
  paddingHorizontal: 2,
 },
 
 tableRow: {
  flexDirection: 'row',
  paddingVertical: 12,
  paddingHorizontal: 8,
  borderBottomWidth: 1,
  borderBottomColor: '#e0e0e0',
  backgroundColor: colors.adminCardBackground,
  alignItems: 'center',
 },
 
 tableRowSmall: {
  paddingVertical: 8,
  paddingHorizontal: 4,
 },
 
 tableCell: {
  flex: 1,
  textAlign: 'center',
  fontSize: 12,
  color: colors.adminText,
  paddingHorizontal: 2,
 },
 
 tableCellSmall: {
  fontSize: 10,
  paddingHorizontal: 1,
 },
 
 emptyTableRow: {
  padding: 40,
  alignItems: 'center',
  justifyContent: 'center',
 },
 
 emptyTableText: {
  fontSize: 14,
  color: colors.mediumSlateText,
  textAlign: 'center',
  fontStyle: 'italic',
 },
 
 actionButtonsContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
  flexWrap: 'wrap',
 },
 
 actionButtonsContainerSmall: {
  flexDirection: 'column',
  gap: 2,
 },
 
 completeButton: {
  backgroundColor: colors.adminSuccess,
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 4,
 },
 
 completeButtonSmall: {
  paddingHorizontal: 4,
  paddingVertical: 2,
  borderRadius: 2,
 },
 
 completeButtonText: {
  color: colors.adminLightText,
  fontSize: 12,
 },
 
 completeButtonTextSmall: {
  fontSize: 9,
 },
 
 overviewButton: {
  backgroundColor: colors.lightBlue,
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 4,
 },
 
 overviewButtonSmall: {
  paddingHorizontal: 4,
  paddingVertical: 2,
  borderRadius: 2,
 },
 
 overviewButtonText: {
  color: colors.adminLightText,
  fontSize: 12,
 },
 
 overviewButtonTextSmall: {
  fontSize: 9,
 },
 
 vitalButton: {
  backgroundColor: colors.lightPurple,
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 4,
 },
 
 vitalButtonSmall: {
  paddingHorizontal: 4,
  paddingVertical: 2,
  borderRadius: 2,
 },
 
 vitalButtonText: {
  color: colors.adminLightText,
  fontSize: 12,
 },
 
 vitalButtonTextSmall: {
  fontSize: 9,
 },
});
