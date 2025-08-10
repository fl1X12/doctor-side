import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Searchbar } from 'react-native-paper';
import colors from '../constants/colors';
import { scanReports } from '../data/reportsData';

const ScanReportList = ({ onSelect, searchQuery, setSearchQuery }) => {
  const filteredScans = scanReports.filter(scan =>
    scan.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (report) => {
  console.log("Tapped:", report.name);
  if (!report.available) {
    Alert.alert("Report Not Available", "This report is not yet available. Please check back later.");
    return;
  }
  onSelect(report);
};


  return (
    <View style={styles.container}>
      <Text style={styles.header}>SCANS AND REPORTS</Text>
      <Searchbar
        placeholder="Search scans"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchBar}
      />
      {filteredScans.map((scan, index) => (
        <TouchableOpacity key={index} onPress={() => handleSelect(scan)}>
          <Text style={styles.item}>{scan.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
  },
  header: {
    backgroundColor: colors.softPink,
    padding: 6,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    borderRadius: 4,
  },
  searchBar: {
    marginBottom: 10,
    height: 40,
    borderRadius: 4,
  },
  item: {
    paddingVertical: 6,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    fontSize: 14,
  },
});

export default ScanReportList;
