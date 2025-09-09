// reports.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  SafeAreaView,
  Platform,
  Image,
  TouchableOpacity,
  FlatList
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Searchbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ViewerPanel from '../../components/ViewerPanel';
import AntenatalReportList from '../../components/AntenatalReportList';
import { authAxios, colors } from '../../lib/utils';

const isWeb = Platform.OS === 'web';

// --- Main Component: ReportsPage ---
const ReportsPage = () => {
  const params = useLocalSearchParams();
  const uhiNo = Array.isArray(params.uhiNo) ? params.uhiNo[0] : params.uhiNo;

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    const loadToken = async () => {
      try {
        let token;
        const tokenKey = 'token'; // IMPORTANT: Change this if your key is different

        if (isWeb) {
          token = localStorage.getItem(tokenKey);
        } else {
          token = await AsyncStorage.getItem(tokenKey);
        }
        setAuthToken(token);
      } catch (e) {
        console.error("Failed to load auth token from storage", e);
      }
    };
    loadToken();
  }, []);

  const fetchReports = useCallback(async () => {
    if (!uhiNo) {
      setError("Patient UHI number is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authAxios.get(`/reports/${uhiNo}`);
      
      const formattedReports = response.data.map(report => ({
        id: report.id,
        name: report.filename,
        uri: `${authAxios.defaults.baseURL}/reports/view/${report.id}`,
        downloadUri: `${authAxios.defaults.baseURL}/reports/download/${report.id}`,
        type: report.file_type,
        available: true,
      }));

      setReports(formattedReports);
    } catch (err) {
      console.error('Error fetching reports:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch reports';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [uhiNo]);

  useEffect(() => {
    if (uhiNo) {
        fetchReports();
    }
  }, [uhiNo, fetchReports]);

  const handleItemSelect = (item) => {
    setSelectedItem(item);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerStatus}>
          <ActivityIndicator size="large" color={colors.adminPrimary} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centerStatus}>
          <Text style={styles.errorText}>Error fetching reports: {error}</Text>
        </View>
      );
    }
    if (reports.length === 0) {
      return (
        <View style={styles.centerStatus}>
          <Text style={styles.centerStatusText}>No reports found for this patient.</Text>
        </View>
      );
    }
    return (
      <AntenatalReportList
        reports={reports}
        onSelect={handleItemSelect}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.leftColumn}>
          {renderContent()}
        </View>
        <View style={styles.rightColumn}>
          <ViewerPanel selectedItem={selectedItem} authToken={authToken} />
        </View>
      </View>
    </SafeAreaView>
  );
};

// --- Combined Stylesheet ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.mainBackgroundFrom,
    },
    container: {
        flex: 1,
        flexDirection: 'row',
        padding: 16,
    },
    leftColumn: {
        flex: 1,
        marginRight: 8,
    },
    rightColumn: {
        flex: 1,
        marginLeft: 8,
    },
    centerStatus: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.adminCardBackground,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.adminBorder,
    },
    centerStatusText: {
        color: colors.mediumSlateText,
        textAlign: 'center',
        fontSize: 16,
    },
    errorText: {
        color: colors.adminDanger,
        textAlign: 'center',
        fontSize: 16,
        padding: 10,
    },
    listContainer: {
      flex: 1,
      backgroundColor: colors.adminCardBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.adminBorder,
    },
    flatListContent: {
      padding: 10,
    },
    header: {
      backgroundColor: colors.veryLightPink,
      padding: 8,
      fontWeight: 'bold',
      fontSize: 16,
      marginBottom: 10,
      borderRadius: 4,
      color: colors.adminText,
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
      color: colors.mediumSlateText,
    },
    separator: {
      height: 1,
      backgroundColor: colors.adminBorder,
    },
    viewer: {
      flex: 1,
      backgroundColor: colors.veryLightBlue,
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.adminBorder,
    },
    viewerTitle: {
      fontWeight: 'bold',
      marginBottom: 10,
      color: colors.adminPrimary,
      fontSize: 16,
    },
    viewerText: {
      color: colors.adminPrimary,
      textAlign: 'center',
      marginTop: 50,
    },
    pdfContainer: {
      flex: 1,
      position: 'relative',
      backgroundColor: colors.adminBackground,
      borderRadius: 4,
      overflow: 'hidden',
    },
    imageContainer: {
      flex: 1,
      backgroundColor: colors.adminBackground,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    singleImage: {
      width: '100%',
      height: '100%',
      minHeight: 400,
    },
    mobilePdf: {
      flex: 1,
    },
    webPdf: {
      width: '100%',
      height: '100%',
      borderWidth: 0,
    },
    controlsContainer: {
      position: 'absolute',
      top: 10,
      right: 10,
      flexDirection: 'row',
    },
    controlButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.adminPrimary,
      borderRadius: 15,
    },
    controlButtonText: {
      color: colors.adminLightText,
      fontWeight: '500',
    },
});

export default ReportsPage;