// StatsPanel.js

import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../lib/utils';

export default function StatsPanel({ waitingCount, completedCount }) {
 return (
  <View style={styles.rightPanel}>
   {/* Patients Card */}
   <View style={styles.card}>
    <View style={styles.cardHeader}>
     <Text style={styles.cardHeaderText}>Patients</Text>
    </View>
    <View style={styles.cardContent}>
     <View style={styles.patientRow}>
      <View style={styles.patientSection}>
       <Text style={styles.sectionLabel}>OPD</Text>
       <View style={styles.statRow}>
        <Text style={styles.statLabel}>Waiting</Text>
        <Text style={styles.statValue}>{waitingCount}</Text>
       </View>
       <View style={styles.statRow}>
        <Text style={styles.statLabel}>Completed</Text>
        <Text style={styles.statValue}>{completedCount}</Text>
       </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.patientSection}>
       <Text style={styles.sectionLabel}>IPD</Text>
       <View style={styles.statRow}>
        <Text style={styles.statLabel}>Total</Text>
        <Text style={styles.statValue}>0</Text>
       </View>
      </View>
     </View>
    </View>
   </View>

   {/* Referrals Cards (can be further componentized if needed) */}
   <View style={styles.card}>
    <View style={styles.cardHeader}>
     <Text style={styles.cardHeaderText}>Referrals</Text>
    </View>
    <View style={styles.cardContent}>
     {/* ... content ... */}
    </View>
   </View>
  </View>
 );
}

const styles = StyleSheet.create({
 /* === Copied Styles from original file === */
 rightPanel: { flex: 1, gap: 15 },
 card: { backgroundColor: colors.adminCardBackground, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, overflow: 'hidden' },
 cardHeader: { backgroundColor: colors.lightPink, paddingVertical: 8, paddingHorizontal: 12 },
 cardHeaderText: { color: colors.adminText, fontWeight: '600', textAlign: 'center', fontSize: 14 },
 cardContent: { padding: 12 },
 patientRow: { flexDirection: 'row', alignItems: 'flex-start' },
 patientSection: { flex: 1, alignItems: 'center' },
 divider: { width: 1, height: 60, backgroundColor: colors.adminBorder, marginHorizontal: 10 },
 sectionLabel: { fontSize: 12, fontWeight: '600', color: colors.mediumSlateText, marginBottom: 8 },
 statRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 4 },
 statLabel: { fontSize: 11, color: colors.mediumSlateText },
 statValue: { fontSize: 11, fontWeight: '600', color: colors.adminText },
});