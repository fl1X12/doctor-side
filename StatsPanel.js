// StatsPanel.js - Responsive version

import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors } from '../../lib/utils';

export default function StatsPanel({ waitingCount, completedCount }) {
 const { width: screenWidth } = useWindowDimensions();
 const isSmallScreen = screenWidth < 768;
 const isPhone = screenWidth < 600;

 return (
  <View style={[styles.rightPanel, isSmallScreen && styles.rightPanelSmall]}>
   {/* Patients Card */}
   <View style={[styles.card, isSmallScreen && styles.cardSmall]}>
    <View style={[styles.cardHeader, isSmallScreen && styles.cardHeaderSmall]}>
     <Text style={[styles.cardHeaderText, isSmallScreen && styles.cardHeaderTextSmall]}>Patients</Text>
    </View>
    <View style={[styles.cardContent, isSmallScreen && styles.cardContentSmall]}>
     <View style={[styles.patientRow, isSmallScreen && styles.patientRowSmall]}>
      <View style={[styles.patientSection, isSmallScreen && styles.patientSectionSmall]}>
       <Text style={[styles.sectionLabel, isSmallScreen && styles.sectionLabelSmall]}>OPD</Text>
       <View style={[styles.statRow, isSmallScreen && styles.statRowSmall]}>
        <Text style={[styles.statLabel, isSmallScreen && styles.statLabelSmall]}>Waiting</Text>
        <Text style={[styles.statValue, isSmallScreen && styles.statValueSmall]}>{waitingCount}</Text>
       </View>
       <View style={[styles.statRow, isSmallScreen && styles.statRowSmall]}>
        <Text style={[styles.statLabel, isSmallScreen && styles.statLabelSmall]}>Completed</Text>
        <Text style={[styles.statValue, isSmallScreen && styles.statValueSmall]}>{completedCount}</Text>
       </View>
      </View>
      {!isPhone && (
        <>
         <View style={[styles.divider, isSmallScreen && styles.dividerSmall]} />
         <View style={[styles.patientSection, isSmallScreen && styles.patientSectionSmall]}>
          <Text style={[styles.sectionLabel, isSmallScreen && styles.sectionLabelSmall]}>IPD</Text>
          <View style={[styles.statRow, isSmallScreen && styles.statRowSmall]}>
           <Text style={[styles.statLabel, isSmallScreen && styles.statLabelSmall]}>Total</Text>
           <Text style={[styles.statValue, isSmallScreen && styles.statValueSmall]}>0</Text>
          </View>
         </View>
        </>
      )}
     </View>
    </View>
   </View>

   {/* Referrals Cards (can be further componentized if needed) */}
   {!isPhone && (
     <View style={[styles.card, isSmallScreen && styles.cardSmall]}>
      <View style={[styles.cardHeader, isSmallScreen && styles.cardHeaderSmall]}>
       <Text style={[styles.cardHeaderText, isSmallScreen && styles.cardHeaderTextSmall]}>Referrals</Text>
      </View>
      <View style={[styles.cardContent, isSmallScreen && styles.cardContentSmall]}>
       {/* ... content ... */}
      </View>
     </View>
   )}
  </View>
 );
}

const styles = StyleSheet.create({
 rightPanel: {
  flex: 1,
  gap: 15,
 },
 
 rightPanelSmall: {
  gap: 10,
 },
 
 card: {
  backgroundColor: colors.adminCardBackground,
  borderRadius: 8,
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  overflow: 'hidden',
 },
 
 cardSmall: {
  borderRadius: 6,
  elevation: 1,
  shadowRadius: 2,
 },
 
 cardHeader: {
  backgroundColor: colors.lightPink,
  paddingVertical: 8,
  paddingHorizontal: 12,
 },
 
 cardHeaderSmall: {
  paddingVertical: 6,
  paddingHorizontal: 10,
 },
 
 cardHeaderText: {
  color: colors.adminText,
  fontWeight: '600',
  textAlign: 'center',
  fontSize: 14,
 },
 
 cardHeaderTextSmall: {
  fontSize: 12,
 },
 
 cardContent: {
  padding: 12,
 },
 
 cardContentSmall: {
  padding: 8,
 },
 
 patientRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
 },
 
 patientRowSmall: {
  flexDirection: 'column',
  alignItems: 'center',
 },
 
 patientSection: {
  flex: 1,
  alignItems: 'center',
 },
 
 patientSectionSmall: {
  marginBottom: 8,
 },
 
 divider: {
  width: 1,
  height: 60,
  backgroundColor: colors.adminBorder,
  marginHorizontal: 10,
 },
 
 dividerSmall: {
  height: 1,
  width: '80%',
  marginVertical: 8,
  marginHorizontal: 0,
 },
 
 sectionLabel: {
  fontSize: 12,
  fontWeight: '600',
  color: colors.mediumSlateText,
  marginBottom: 8,
 },
 
 sectionLabelSmall: {
  fontSize: 11,
  marginBottom: 6,
 },
 
 statRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '100%',
  marginBottom: 4,
 },
 
 statRowSmall: {
  justifyContent: 'center',
  gap: 10,
 },
 
 statLabel: {
  fontSize: 11,
  color: colors.mediumSlateText,
 },
 
 statLabelSmall: {
  fontSize: 10,
 },
 
 statValue: {
  fontSize: 11,
  fontWeight: '600',
  color: colors.adminText,
 },
 
 statValueSmall: {
  fontSize: 10,
 },
});
