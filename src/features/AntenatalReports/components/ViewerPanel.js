import { Dimensions, Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { WebView } from 'react-native-webview';
import colors from '../constants/colors';

const isWeb = Platform.OS === 'web';

const ViewerPanel = ({ selectedItem }) => {
  if (!selectedItem) {
    return (
      <View style={styles.viewer}>
        <Text style={styles.text}>Select a report or scan to view here.</Text>
      </View>
    );
  }

  const renderSlider = () => (
    <View style={styles.sliderContainer}>
      <FlatList
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={true}
        data={selectedItem.uris}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <ScrollView
            style={styles.imageScrollContainer}
            contentContainerStyle={styles.imageScrollContent}
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsVerticalScrollIndicator={true}
            showsHorizontalScrollIndicator={true}
          >
            <Image
              source={{ uri: item }}
              style={styles.sliderImage}
              resizeMode="contain"
            />
          </ScrollView>
        )}
      />
    </View>
  );

  const renderScrollableImage = () => (
    <ScrollView
      style={styles.imageScrollContainer}
      contentContainerStyle={styles.imageScrollContent}
      maximumZoomScale={3}
      minimumZoomScale={1}
      showsVerticalScrollIndicator={true}
      showsHorizontalScrollIndicator={true}
    >
      <Image
        source={{ uri: selectedItem.uri }}
        style={styles.singleImage}
        resizeMode="contain"
      />
    </ScrollView>
  );

  const renderPDF = () => {
    if (isWeb) {
      return (
        <ScrollView style={styles.pdfScrollContainer}>
          <iframe 
            src={selectedItem.uri} 
            style={styles.webPdf} 
            title="pdf"
            frameBorder="0"
          />
        </ScrollView>
      );
    } else {
      return (
        <View style={styles.webViewContainer}>
          <WebView 
            source={{ uri: selectedItem.uri }} 
            style={styles.mobilePdf}
            scalesPageToFit={true}
            startInLoadingState={true}
          />
        </View>
      );
    }
  };

  return (
    <View style={styles.viewer}>
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
    backgroundColor: colors.viewerBlue,
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    height: 500,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.text,
    fontSize: 16,
  },
  text: {
    color: colors.text,
    textAlign: 'center',
    marginTop: 50,
  },
  sliderContainer: {
    flex: 1,
    height: 400,
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
    minHeight: 400,
  },
  sliderImage: {
    width: Dimensions.get('window').width * 0.35,
    height: 350,
    borderRadius: 4,
  },
  singleImage: {
    width: '100%',
    height: 400,
    borderRadius: 4,
  },
  pdfScrollContainer: {
    flex: 1,
    maxHeight: 420,
  },
  webViewContainer: {
    flex: 1,
    height: 420,
    borderRadius: 4,
    overflow: 'hidden',
  },
  webPdf: {
    width: '100%',
    height: 420,
    border: 'none',
    borderRadius: 4,
  },
  mobilePdf: {
    flex: 1,
    borderRadius: 4,
  },
});

export default ViewerPanel;