import React, { useCallback, useState, useRef } from 'react';
import { 
  Platform, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Image,
  TouchableOpacity,
} from 'react-native';
import { FlatList } from 'react-native'; 
// Import WebView
import { WebView } from 'react-native-webview';

const isWeb = Platform.OS === 'web';

const ViewerPanel = ({ selectedItem }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const pdfContainerRef = useRef(null);

  // No changes to these functions
  const renderSlider = useCallback(() => (
    <View style={styles.sliderContainer}>
      <FlatList
        horizontal
        pagingEnabled
        data={selectedItem.uris}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <ScrollView
            style={[styles.imageScrollContainer, { width: containerWidth }]}
            contentContainerStyle={styles.imageScrollContent}
            maximumZoomScale={3}
            minimumZoomScale={1}
          >
            <Image
              source={{ uri: item }}
              style={[styles.sliderImage, { width: containerWidth }]}
              resizeMode="contain"
            />
          </ScrollView>
        )}
      />
    </View>
  ), [selectedItem, containerWidth]);

  const renderScrollableImage = useCallback(() => (
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

  // Main changes are in the renderPDF function for mobile
  const renderPDF = useCallback(() => {
    // --- WEB SOLUTION (Unchanged) ---
    const handleDownload = () => { /* ... download logic ... */ };
    const handleFullScreen = () => { /* ... fullscreen logic ... */ };

    if (isWeb) {
      return (
        <View style={styles.pdfContainer} ref={pdfContainerRef}>
          <iframe 
            src={`${selectedItem.uri}#toolbar=0&navpanes=0`}
            style={styles.webPdf} 
            title={selectedItem.name || 'PDF Viewer'}
            frameBorder="0"
          />
          <View style={styles.controlsContainer}>
            <TouchableOpacity onPress={handleFullScreen} style={styles.controlButton}>
              <Text style={styles.controlButtonText}>Full Screen</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDownload} style={styles.controlButton}>
              <Text style={styles.controlButtonText}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } 
    
    // --- MOBILE SOLUTION SWITCHED TO WEBVIEW ---
    else {
      // We wrap the PDF's URL in the Google Docs viewer to force it to be displayed
      const googleDocsUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(selectedItem.uri)}`;
      
      return (
        <View style={styles.pdfContainer}>
          <WebView 
            source={{ uri: googleDocsUrl }} 
            style={styles.mobilePdf}
            startInLoadingState={true}
          />
        </View>
      );
    }
  }, [selectedItem]);

  const onLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  if (!selectedItem) {
    return (
      <View style={styles.viewer}>
        <Text style={styles.text}>Select a report or scan to view here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.viewer} onLayout={onLayout}>
      <Text style={styles.title}>{selectedItem.name}</Text>
      {selectedItem.type === 'pdf' ? (
        renderPDF()
      ) : selectedItem.type === 'slider' ? (
        renderSlider()
      ) : (
        renderScrollableImage()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  viewer: {
    backgroundColor: '#C0C7E2',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    flex: 1, 
    minHeight: 500, // Ensures a good default size
  },

  title: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2B2B84',
    fontSize: 16,
  },

  text: {
    color: '#2B2B84',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },

  sliderContainer: {
    flex: 1,
  },
  imageScrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    minHeight: 400, // Ensures small images are still viewable
    borderRadius: 4,
  },

  
  sliderImage: {
    height: '100%',
    borderRadius: 4,
  },

  
  pdfContainer: {
    flex: 1,
    position: 'relative', // Crucial for overlaying controls on web
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    overflow: 'hidden', // Ensures children (WebView/iframe) respect the border radius
  },

  
  mobilePdf: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  
  webPdf: {
    width: '100%',
    height: '100%',
    borderWidth: 0, // Removes the default iframe border
  },
  
  
  controlsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 6,
  },

  
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    backgroundColor: '#2B2B84',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  controlButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default ViewerPanel;