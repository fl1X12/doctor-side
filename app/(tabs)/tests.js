import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Button } from 'react-native-paper';
import colors from '../../constants/Colors';

const API_BASE_URL = 'http://10.5.41.120:5501/api';

export default function TestsPage() {
  const params = useLocalSearchParams();
  
  // Extract and ensure parameters are strings
  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const uhiNo = Array.isArray(params.uhiNo) ? params.uhiNo[0] : params.uhiNo;
  
  console.log('Received params:', { name, uhiNo });
  console.log('Individual values:', name, uhiNo);
  console.log('Types:', typeof name, typeof uhiNo);
  
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth >= 768;

  const [selectedTests, setSelectedTests] = useState({});
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState(null);

  // Test categories structure
  const testCategories = {
    haematology: {
      title: 'HAEMATOLOGY',
      tests: [
        { id: 'complete_haemogram', name: 'Complete Haemogram' },
        { id: 'complete_blood_counts', name: 'Complete Blood Counts' },
        { id: 'haemoglobin_manual', name: 'Haemoglobin (manual)' },
        { id: 'esr', name: 'ESR' },
        { id: 'pt_pct', name: 'PT/PCT' },
        { id: 'bleeding_time', name: 'Bleeding Time' },
        { id: 'absolute_eosinophil', name: 'Absolute Eosinophil Count' },
        { id: 'sickle_cells', name: 'Sickle Cells' },
        { id: 'osmotic_fragility', name: 'Osmotic Fragility Test' },
        { id: 'pt_test', name: 'PT Test' },
        { id: 'aptt_test', name: 'APTT Test' }
      ]
    },
    clinicalPathology: {
      title: 'Clinical Pathology',
      tests: [
        { id: 'urine_routine', name: 'Urine Routine' },
        { id: 'complete_urine_analysis', name: 'Complete Urine Analysis' },
        { id: 'stool_occult_blood', name: 'Stool for Occult Blood' },
        { id: 'semen_analysis', name: 'Semen Analysis' },
        { id: 'body_fluid_analysis', name: 'Body Fluid Analysis Pleural / Peritoneal / Ascites / Joint / Synovial / CSF / Amniotic Specific' }
      ]
    },
    microbiology: {
      title: 'MICROBIOLOGY',
      tests: [
        { id: 'direct_examination', name: 'Direct Examination' },
        { id: 'gram_stain', name: 'Gram Stain' },
        { id: 'zn_stain', name: 'Z-N Stain' },
        { id: 'alberts_stain', name: 'Alberts Stain' },
        { id: 'hansens_stain', name: 'Hansens Stain' },
        { id: 'stool_microscopy', name: 'Stool Microscopy for Ova / Cyst / Parasites / Larvae / Amoeba / Bacteria / Egd Food particles' },
        { id: 'malarial_parasites', name: 'P.S for Malarial Parasites' },
        { id: 'microfilaria', name: 'P.S for Microfilaria' },
        { id: 'koh_preparation', name: 'KOH Preparation' },
        { id: 'slit_skin_smear', name: 'Slit Skin Smear' },
        { id: 'wuchereria_preparation', name: 'Wuchereria Preparation for Filarial' }
      ]
    },
    cultureSensitivity: {
      title: 'Cultural Sensitivity',
      tests: [
        { id: 'blood_culture', name: 'Blood Culture' },
        { id: 'sputum_culture', name: 'Sputum Culture' },
        { id: 'urine_culture', name: 'Urine Culture' },
        { id: 'stool_culture', name: 'Stool Culture' },
        { id: 'swab_culture', name: 'Swab Culture' },
        { id: 'wound_culture', name: 'Wound Culture' },
        { id: 'pus_culture', name: 'Pus Culture' },
        { id: 'anaerobic_culture', name: 'Anaerobic Culture' },
        { id: 'tb_culture', name: 'TB Culture' },
        { id: 'fungal_culture', name: 'Fungal Culture' }
      ]
    },
    biochemistry: {
      title: 'BIOCHEMISTRY',
      tests: [
        { id: 'blood_glucose_diabetic', name: 'Blood Glucose & Diabetic Profile' },
        { id: 'fbs', name: 'FBS' },
        { id: 'ppbs', name: 'PPBS' },
        { id: 'rbs', name: 'RBS' },
        { id: 'gtt', name: 'GTT' },
        { id: 'gct', name: 'GCT' },
        { id: 'hbaic', name: 'HbA1C' },
        { id: 'net_urine_protein', name: 'Net Urine Protein' },
        { id: 'urine_microalbumin', name: 'Urine Microalbumin' },
        { id: 'arterial_blood_gas', name: 'Arterial Blood Gas Analysis' }
      ]
    },
    electrolytes: {
      title: 'Electrolytes',
      tests: [
        { id: 'sodium', name: 'Sodium' },
        { id: 'potassium', name: 'Potassium' },
        { id: 'chloride', name: 'Chloride' },
        { id: 'measured_bicarbonate', name: 'Measured Bicarbonate' },
        { id: 'magnesium', name: 'Magnesium' }
      ]
    },
    serology: {
      title: 'Serology',
      tests: [
        { id: 'widal', name: 'Widal' },
        { id: 'ra_factor', name: 'RA Factor' },
        { id: 'crp', name: 'CRP' },
        { id: 'aslo', name: 'ASLO' },
        { id: 'vdrl_rpr', name: 'VDRL / RPR' },
        { id: 'hiv_spot_test', name: 'HIV / Spot Test' },
        { id: 'hbsag_spot_test', name: 'HBsAg Spot Test' },
        { id: 'hcv_spot_test', name: 'HCV Spot Test' }
      ]
    }
  };

  // Load patient data and existing test results
  useEffect(() => {
    const fetchPatientData = async () => {
      // Add validation for required parameters
      if (!uhiNo || uhiNo === 'undefined' || uhiNo === 'null') {
        console.log('No valid UHI number provided:', uhiNo);
        Alert.alert('Error', 'No valid UHI number provided');
        return;
      }
      
      setLoading(true);
      try {
        console.log('Fetching patient data for UHI:', uhiNo);
        console.log('Full URL:', `${API_BASE_URL}/patients/${uhiNo}`);
        
        // Use string concatenation to avoid template literal issues
        const url = API_BASE_URL + '/patients/' + uhiNo;
        console.log('Constructed URL:', url);
        
        const response = await axios.get(url);
        console.log('Patient data fetched successfully:', response.data);
        setPatientData(response.data);
        
        // Load existing test results if available
        if (response.data.testResults) {
          setTestResults(response.data.testResults);
          
          // Set selected tests based on existing results
          const selected = {};
          Object.keys(response.data.testResults).forEach(testId => {
            selected[testId] = true;
          });
          setSelectedTests(selected);
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
        console.error('Error details:', error.response?.data || error.message);
        Alert.alert('Error', `Failed to load patient data: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [uhiNo]);

  // Toggle test selection
  const toggleTest = (testId) => {
    setSelectedTests(prev => ({
      ...prev,
      [testId]: !prev[testId]
    }));
  };

  // Update test result
  const updateTestResult = (testId, result) => {
    setTestResults(prev => ({
      ...prev,
      [testId]: result
    }));
  };

  // Save test results
  const saveTestResults = async () => {
    if (!patientData) {
      Alert.alert('Error', 'Patient data not loaded');
      return;
    }

    try {
      setLoading(true);
      
      // Filter results to only include selected tests
      const filteredResults = {};
      Object.keys(selectedTests).forEach(testId => {
        if (selectedTests[testId] && testResults[testId]) {
          filteredResults[testId] = testResults[testId];
        }
      });

      console.log('Saving test results for patient ID:', patientData._id);
      
      // Use string concatenation here too
      const url = API_BASE_URL + '/patients/' + patientData._id;
      
      await axios.put(url, {
        ...patientData,
        testResults: filteredResults,
        selectedTests: selectedTests
      });

      Alert.alert('Success', 'Test results saved successfully');
    } catch (error) {
      console.error('Error saving test results:', error);
      Alert.alert('Error', 'Failed to save test results');
    } finally {
      setLoading(false);
    }
  };

  // Render test category
  const renderTestCategory = (categoryKey, category) => (
    <View key={categoryKey} style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{category.title}</Text>
      <View style={styles.testsContainer}>
        {category.tests.map((test) => (
          <View key={test.id} style={styles.testItem}>
            <View style={styles.testHeader}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => toggleTest(test.id)}
              >
                {selectedTests[test.id] && <View style={styles.checkmark} />}
              </TouchableOpacity>
              <Text style={styles.testName}>{test.name}</Text>
            </View>
            
           
          </View>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.darkBlue} />
        <Text style={styles.loadingText}>Loading tests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <Button
          mode="contained"
          style={styles.leftPinkBox}
          onPress={() => router.push('/(tabs)/admin')}
        >
          ADMIN
        </Button>
        
        <TextInput
          style={styles.searchBar}
          placeholder="Search tests..."
          placeholderTextColor="#999"
        />
        
        <TouchableOpacity 
          style={styles.patientButton}
          onPress={() => router.push(`/(tabs)/patient?name=${encodeURIComponent(name)}&uhiNo=${encodeURIComponent(uhiNo)}`)}
        >
          <Text style={styles.patientButtonText}>Back to Patient</Text>
        </TouchableOpacity>
        
        <View style={styles.iconGroup}>
          <View style={styles.eyeIcon} />
          <View style={styles.bellIcon} />
          <View style={styles.bookIcon} />
          <View style={styles.settingsIcon} />
        </View>
      </View>

      {/* Patient Info Header */}
      <View style={styles.patientHeader}>
        <Text style={styles.patientName}>Patient: {name}</Text>
        <Text style={styles.patientUhi}>UHI No: {uhiNo}</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          <Text style={styles.pageTitle}>Laboratory Tests</Text>
          
          {/* Test Categories */}
          <View style={[styles.testsGrid, isTablet && styles.tabletGrid]}>
            {Object.entries(testCategories).map(([key, category]) => 
              renderTestCategory(key, category)
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              style={styles.saveButton}
              onPress={saveTestResults}
              loading={loading}
            >
              Save Test Results
            </Button>
            
            <Button
              mode="contained"
              style={styles.reportsButton}
              onPress={() => router.push(`/(tabs)/reports?name=${encodeURIComponent(name)}&uhiNo=${encodeURIComponent(uhiNo)}`)}
            >
              View Reports →
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightPink || '#f8f4f6',
  },
  topBar: {
    backgroundColor: '#1B286B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    height: 60,
  },
  leftPinkBox: {
    width: 70,
    height: 28,
    backgroundColor: colors.softPink || '#f8d7da',
    borderRadius: 4,
    marginRight: 15,
  },
  searchBar: {
    flex: 1,
    backgroundColor: colors.white || '#ffffff',
    height: 36,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 14,
    marginRight: 15,
  },
  patientButton: {
    backgroundColor: colors.darkBlue,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
  },
  patientButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eyeIcon: {
    width: 20,
    height: 20,
    backgroundColor: colors.white || '#ffffff',
    borderRadius: 10,
    marginHorizontal: 4,
  },
  bellIcon: {
    width: 18,
    height: 18,
    backgroundColor: colors.white || '#ffffff',
    borderRadius: 2,
    marginHorizontal: 4,
  },
  bookIcon: {
    width: 18,
    height: 18,
    backgroundColor: '#4a90e2',
    borderRadius: 2,
    marginHorizontal: 4,
  },
  settingsIcon: {
    width: 18,
    height: 18,
    backgroundColor: colors.white || '#ffffff',
    borderRadius: 2,
    marginHorizontal: 4,
  },
  patientHeader: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  patientUhi: {
    fontSize: 14,
    color: '#666',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  testsGrid: {
    flexDirection: 'column',
    gap: 16,
  },
  tabletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flex: 1,
    minWidth: 300,
    margin: 4,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: colors.softPink || '#f8d7da',
    padding: 12,
    color: '#333',
    textAlign: 'center',
  },
  testsContainer: {
    padding: 12,
  },
  testItem: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.darkBlue,
    borderRadius: 3,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 12,
    height: 12,
    backgroundColor: colors.darkBlue,
    borderRadius: 2,
  },
  testName: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  resultInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 8,
    fontSize: 12,
    backgroundColor: '#fafafa',
    minHeight: 40,
    textAlignVertical: 'top',
  },
  actionButtons: {
    marginTop: 20,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
  },
  reportsButton: {
    backgroundColor: colors.darkBlue,
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightPink,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});