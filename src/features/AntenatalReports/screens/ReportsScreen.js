// import { useLocalSearchParams, useRouter } from 'expo-router';

// import { useState } from 'react';
// import { Alert, Dimensions, ScrollView, StyleSheet, TextInput, View } from 'react-native';
// import { Button, Text } from 'react-native-paper';
// import AntenatalReportList from '../components/AntenatalReportList';
// import ScanReportList from '../components/ScanReportList';
// import ViewerPanel from '../components/ViewerPanel';
// import colors from '../constants/colors';


// const ReportsScreen = () => {
//   const params = useLocalSearchParams();
    
//     // Extract and ensure parameters are strings
//     const name = Array.isArray(params.name) ? params.name[0] : params.name;
//     const uhiNo = Array.isArray(params.uhiNo) ? params.uhiNo[0] : params.uhiNo;
//   const router = useRouter();
  

//   const [selectedItem, setSelectedItem] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [antenatalSearchQuery, setAntenatalSearchQuery] = useState('');
  
//   const screenWidth = Dimensions.get('window').width;
//   const isTabletOrLarger = screenWidth >= 768;

//   const handleItemSelect = (item) => {
//     if (!item.available) {
//       Alert.alert(
//         'Not Available',
//         'Scan not yet done/reports not available. Please check later.',
//         [{ text: 'OK' }]
//       );
//       return;
//     }
//     setSelectedItem(item);
//   };

//   return (
//     <>
//       {/* Top Header Bar */}
//       <View style={styles.topBar}>
//         <View style={styles.leftPinkBox} />
//         <TextInput
//           style={styles.searchBar}
//           placeholder="Hinted search text"
//           placeholderTextColor="#999"
//         />
//         <View style={styles.iconGroup}>
//           <View style={styles.eyeIcon} />
//           <View style={styles.bellIcon} />
//           <View style={styles.bookIcon} />
//           <View style={styles.settingsIcon} />
//         </View>
//       </View>

//       {/* Title Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerText}>Reports and Scans</Text>
//       </View>

//       <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
//         <View style={styles.leftColumn}>
//           <AntenatalReportList 
//             onSelect={handleItemSelect} 
//             searchQuery={antenatalSearchQuery}
//             setSearchQuery={setAntenatalSearchQuery}
//           />
//           <ScanReportList 
//             onSelect={handleItemSelect} 
//             searchQuery={searchQuery} 
//             setSearchQuery={setSearchQuery} 
//           />
//           <Button mode="contained" style={styles.button} onPress={() => router.push(`/(tabs)/patient?name=${encodeURIComponent(name)}&uhiNo=${encodeURIComponent(uhiNo)}`)}>
                     
//             Doctors notes
//           </Button>
//         </View>
        
        
//         <View style={[styles.rightColumn, isTabletOrLarger && styles.rightTablet]}>
//           <ViewerPanel selectedItem={selectedItem} />
//         </View>
//       </ScrollView>
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   topBar: {
//     backgroundColor: '#1B286B',
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     height: 60,
//   }, 
//   leftPinkBox: {
//     width: 70,
//     height: 28,
//     backgroundColor: colors.softPink,
//     borderRadius: 4,
//     marginRight: 15,
//   },
//   searchBar: {
//     flex: 1,
//     backgroundColor: colors.white,
//     height: 36,
//     borderRadius: 6,
//     paddingHorizontal: 12,
//     fontSize: 14,
//     marginRight: 15,
//   },
//   iconGroup: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//   },
//   eyeIcon: {
//     width: 20,
//     height: 20,
//     backgroundColor: colors.white,
//     borderRadius: 10,
//     marginHorizontal: 4,
//   },
//   bellIcon: {
//     width: 18,
//     height: 18,
//     backgroundColor: colors.white,
//     borderRadius: 2,
//     marginHorizontal: 4,
//   },
//   bookIcon: {
//     width: 18,
//     height: 18,
//     backgroundColor: '#4a90e2',
//     borderRadius: 2,
//     marginHorizontal: 4,
//   },
//   settingsIcon: {
//     width: 18,
//     height: 18,
//     backgroundColor: colors.white,
//     borderRadius: 2,
//     marginHorizontal: 4,
//   },
//   header: {
//     width: '100%',
//     backgroundColor: '#1B286B',
//     paddingVertical: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 10,
//     borderBottomLeftRadius: 12,
//     borderBottomRightRadius: 12,
//   },
//   headerText: {
//     color: colors.white,
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   container: {
//     backgroundColor: colors.lightPink,
//   },
//   inner: {
//     padding: 16,
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   leftColumn: {
//     width: '100%',
//     maxWidth: 500,
//   },
//   rightColumn: {
//     width: '100%',
//   },
//   rightTablet: {
//     width: '45%',
//     marginTop: 0,
//   },
//   button: {
//     marginTop: 10,
//     backgroundColor: colors.darkBlue,
//   },
// });

// export default ReportsScreen;