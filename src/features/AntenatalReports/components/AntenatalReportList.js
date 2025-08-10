import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Searchbar } from 'react-native-paper';
import colors from '../constants/colors';
import { antenatalReports } from '../data/reportsData';

const AntenatalReportList = ({ onSelect, searchQuery, setSearchQuery }) => {
  const filteredReports = antenatalReports.filter(report =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase())
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
      <Text style={styles.header}>ANTENATAL TESTS</Text>
      <Searchbar
        placeholder="Search antenatal reports"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchBar}
      />
      {filteredReports.map((report, index) => (
        <TouchableOpacity key={index} onPress={() => handleSelect(report)}>
          <Text style={styles.item}>{report.name}</Text>
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
    marginBottom: 20,
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

export default AntenatalReportList;
