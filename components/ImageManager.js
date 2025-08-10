import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, Trash2, Plus } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ImageManager({ images, onImagesUpdate }) {
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to add images.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImage = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
          type: result.assets[0].type,
        };
        onImagesUpdate([...images, newImage]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImage = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
          type: result.assets[0].type,
        };
        onImagesUpdate([...images, newImage]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteImage = (imageId) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedImages = images.filter(img => img.id !== imageId);
            onImagesUpdate(updatedImages);
          }
        }
      ]
    );
  };

  const addSampleImages = () => {
    const sampleImages = [
      {
        id: Date.now().toString() + '_1',
        uri: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
        width: 800,
        height: 600,
        type: 'image',
      },
      {
        id: Date.now().toString() + '_2',
        uri: 'https://images.pexels.com/photos/1547971/pexels-photo-1547971.jpeg',
        width: 800,
        height: 600,
        type: 'image',
      }
    ];
    onImagesUpdate([...images, ...sampleImages]);
  };

  const calculateImageSize = (originalWidth, originalHeight) => {
    const maxWidth = width - 80;
    const maxHeight = 300;
    
    const aspectRatio = originalWidth / originalHeight;
    
    let displayWidth = originalWidth;
    let displayHeight = originalHeight;
    
    if (displayWidth > maxWidth) {
      displayWidth = maxWidth;
      displayHeight = displayWidth / aspectRatio;
    }
    
    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = displayHeight * aspectRatio;
    }
    
    return { width: displayWidth, height: displayHeight };
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={pickImage}
          disabled={isLoading}
        >
          <ImageIcon size={18} color="#007AFF" />
          <Text style={styles.actionButtonText}>Gallery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={takePhoto}
          disabled={isLoading}
        >
          <Camera size={18} color="#007AFF" />
          <Text style={styles.actionButtonText}>Camera</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={addSampleImages}
          disabled={isLoading}
        >
          <Plus size={18} color="#34C759" />
          <Text style={[styles.actionButtonText, { color: '#34C759' }]}>Samples</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.imagesList} showsVerticalScrollIndicator={false}>
        {images.length === 0 ? (
          <View style={styles.emptyState}>
            <ImageIcon size={64} color="#C7C7CC" />
            <Text style={styles.emptyStateTitle}>No Images Added</Text>
            <Text style={styles.emptyStateText}>
              Tap the buttons above to add images from your gallery, take a photo, or add sample images
            </Text>
          </View>
        ) : (
          <View style={styles.imagesGrid}>
            {images.map((image) => {
              const { width: displayWidth, height: displayHeight } = calculateImageSize(
                image.width, 
                image.height
              );
              
              return (
                <View key={image.id} style={styles.imageContainer}>
                  <Image
                    source={{ uri: image.uri }}
                    style={[
                      styles.image,
                      { width: displayWidth, height: displayHeight }
                    ]}
                    contentFit="cover"
                    transition={200}
                  />
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteImage(image.id)}
                  >
                    <Trash2 size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f2f2f7',
    borderRadius: 20,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  imagesList: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },
  imagesGrid: {
    gap: 16,
  },
  imageContainer: {
    position: 'relative',
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    borderRadius: 12,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
});