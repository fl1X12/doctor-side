// PatientTable.js

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../lib/utils';

export default function PatientTable({
 patients,
 isCompletedView,
 router,
 onMarkComplete,
 onViewVitals,
}) {
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
  <View style={styles.table}>
   <View style={styles.tableHeader}>
    <Text style={styles.headerCell}>Sl.No</Text>
    <Text style={styles.headerCell}>UHI No</Text>
    <Text style={styles.headerCell}>Patient Name</Text>
    <Text style={styles.headerCell}>Redirection</Text>
    {!isCompletedView && <Text style={styles.headerCell}>Action</Text>}
   </View>

   {patients.map((rowData, index) => (
    <TouchableOpacity
     key={index}
     style={styles.tableRow}
     onPress={() => handleRowPress(rowData)}
     activeOpacity={0.7}
    >
     <Text style={styles.tableCell}>{rowData.slNo}</Text>
     <Text style={styles.tableCell}>{rowData.uhiNo}</Text>
     <Text style={styles.tableCell}>{rowData.patientName}</Text>
     <Text style={styles.tableCell}>{rowData.redirection || '-'}</Text>
     {!isCompletedView && (
      <View style={styles.actionButtonsContainer}>
       <TouchableOpacity style={styles.completeButton} onPress={(e) => { e.stopPropagation(); onMarkComplete(rowData._id); }}>
        <Text style={styles.completeButtonText}>Complete</Text>
       </TouchableOpacity>
       <TouchableOpacity style={styles.overviewButton} onPress={(e) => handleOverviewPress(e, rowData)}>
        <Text style={styles.overviewButtonText}>Overview</Text>
       </TouchableOpacity>
       <TouchableOpacity style={styles.vitalButton} onPress={(e) => { e.stopPropagation(); onViewVitals(rowData); }}>
        <Text style={styles.vitalButtonText}>Vital Info</Text>
       </TouchableOpacity>
      </View>
     )}
    </TouchableOpacity>
   ))}
  </View>
 );
}


const styles = StyleSheet.create({
 /* === Copied Styles from original file === */
 table: { borderWidth: 1, borderColor: colors.adminBorder, borderRadius: 4 },
 tableHeader: { flexDirection: 'row', backgroundColor: colors.mainBackgroundTo, borderBottomWidth: 1, borderBottomColor: colors.adminBorder, paddingVertical: 10 },
 headerCell: { flex: 1, textAlign: 'center', fontWeight: '600', fontSize: 12, color: colors.mediumSlateText },
 tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingVertical: 12, backgroundColor: colors.adminCardBackground, alignItems: 'center' },
 tableCell: { flex: 1, textAlign: 'center', fontSize: 12, color: colors.adminText },
 emptyTableRow: { padding: 40, alignItems: 'center', justifyContent: 'center' },
 emptyTableText: { fontSize: 14, color: colors.mediumSlateText, textAlign: 'center', fontStyle: 'italic' },
 actionButtonsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flex: 1, paddingRight: 10, gap: 5 },
 completeButton: { backgroundColor: colors.adminSuccess, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
 completeButtonText: { color: colors.adminLightText, fontSize: 12 },
 overviewButton: { backgroundColor: colors.lightBlue, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
 overviewButtonText: { color: colors.adminLightText, fontSize: 12 },
 vitalButton: { backgroundColor: colors.lightPurple, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
 vitalButtonText: { color: colors.adminLightText, fontSize: 12 },
});