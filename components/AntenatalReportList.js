import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Searchbar } from 'react-native-paper';

const AntenatalReportList = ({ reports, onSelect, searchQuery, setSearchQuery }) => {
  const filteredReports = useMemo(() => {
    if (!searchQuery) {
      return reports;
    }
    return reports.filter(report =>
      report.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, reports]);

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => onSelect(item)} style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>ANTENATAL TESTS</Text>
      <Searchbar
        placeholder="Search reports"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchBar}
      />
      <FlatList
        data={filteredReports}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    width: '100%',
  },
  header: {
    backgroundColor: '#ffc9de',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    borderRadius: 4,
    color: '#333',
    textAlign: 'center',
  },
  searchBar: {
    marginBottom: 10,
    height: 40,
    borderRadius: 8,
  },
  itemContainer: {
    paddingVertical: 12,
  },
  itemText: {
    fontSize: 15,
    color: '#444',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
});

export default AntenatalReportList;
