import { useCallback } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { authAxios, colors } from '../lib/utils';

const isWeb = Platform.OS === 'web';

const ViewerPanel = ({ selectedItem }) => {

  const renderPDF = useCallback(() => {
    // Handler for the Download button on the WEB
    const handleDownload = () => {
      if (!isWeb || !selectedItem) return;
      // Use the downloadUri that was constructed with the auth utility base URL
      const downloadUrl = selectedItem.downloadUri || 
        `${authAxios.defaults.baseURL}/reports/download/${selectedItem.id}`;
      // A simple way to trigger download on the web
      window.open(downloadUrl, '_blank');
    };

    if (isWeb) {
      return (
        <View style={styles.pdfContainer}>
          <iframe 
            src={`${selectedItem.uri}#toolbar=0&navpanes=0`}
            style={styles.webPdf} 
            title={selectedItem.name || 'PDF Viewer'}
            frameBorder="0"
          />
          <View style={styles.controlsContainer}>
            <TouchableOpacity onPress={handleDownload} style={styles.controlButton}>
              <Text style={styles.controlButtonText}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else {
      // For mobile, we use the Google Docs viewer to prevent auto-downloading
      const googleDocsUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(selectedItem.uri)}`;
      return (
        <View style={styles.pdfContainer}>
          <WebView 
            source={{ uri: googleDocsUrl,
              headers: {
                    'ngrok-skip-browser-warning': 'true' 
                }
             }} 
            style={styles.mobilePdf}
            startInLoadingState={true}
          />
        </View>
      );
    }
  }, [selectedItem]);

  const renderImage = useCallback(() => (
    <ScrollView
      style={styles.imageScrollContainer}
      contentContainerStyle={styles.imageScrollContent}
      maximumZoomScale={3}
      minimumZoomScale={1}
    >
      <Image
        source={{ uri: selectedItem.uri }}
        style={styles.singleImage}
        resizeMode="contain"
      />
    </ScrollView>
  ), [selectedItem]);
  
  if (!selectedItem) {
    return (
      <View style={styles.viewer}>
        <Text style={styles.text}>Select a report or scan to view here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.viewer}>
      <Text style={styles.title}>{selectedItem.name}</Text>
      {selectedItem.type === 'pdf' ? renderPDF() : renderImage()}
    </View>
  );
};

// Updated stylesheet using the color utility
const styles = StyleSheet.create({
  viewer: {
    backgroundColor: colors.veryLightBlue,
    padding: 16,
    borderRadius: 8,
    width: '100%',
    minHeight: 500,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.adminBorder,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.adminPrimary,
    fontSize: 16,
  },
  text: {
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
  imageScrollContainer: {
    flex: 1,
    backgroundColor: colors.adminBackground,
    borderRadius: 4,
  },
  imageScrollContent: {
    flexGrow: 1,
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

export default ViewerPanel;