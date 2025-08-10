import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';

// --- Constants (can be moved to a separate constants file) ---
const COLORS = ['#000000', '#FF0000', '#0000FF', '#00FF00', '#800080', '#FFA500'];
const HIGHLIGHT_COLORS = ['#FFFF00', '#00FF00', '#FF00FF', '#FFA500'];
const DRAWING_SIZES = [2, 4, 6, 10, 15];
const ERASER_SIZES = [10, 20, 40, 60];

//==============================================================================
// --- Note Editor Component: Settings Modal ---
// File Path: src/components/note-editor/SettingsModal.js
//==============================================================================
export default function SettingsModal({ visible, onClose, settings, setSettings }) {
  const { mode, isErasing, color, size, highlightColor, eraserSize } = settings;

  const onColorSelect = (c) => {
    if (mode === 'highlight') setSettings(s => ({ ...s, highlightColor: c }));
    else setSettings(s => ({ ...s, color: c }));
    onClose();
  };

  const onSizeSelect = (s) => {
    if (isErasing) setSettings(p => ({ ...p, eraserSize: s }));
    else setSettings(p => ({ ...p, size: s }));
    onClose();
  };

  const currentColors = mode === 'highlight' ? HIGHLIGHT_COLORS : COLORS;
  const currentSizes = isErasing ? ERASER_SIZES : DRAWING_SIZES;
  const currentColor = mode === 'highlight' ? highlightColor : color;
  const currentSize = isErasing ? eraserSize : size;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={noteStyles.modalOverlay} onPress={onClose} activeOpacity={1}>
        <View style={noteStyles.modalContent} onStartShouldSetResponder={() => true}>
          <Text style={noteStyles.modalTitle}>Settings</Text>
          <Text style={noteStyles.modalSectionTitle}>Color</Text>
          <View style={noteStyles.colorGrid}>
            {currentColors.map(c => (
              <TouchableOpacity key={c} style={[noteStyles.colorButton, { backgroundColor: c }, currentColor === c && noteStyles.selectedColor]} onPress={() => onColorSelect(c)} />
            ))}
          </View>
          <Text style={noteStyles.modalSectionTitle}>Size</Text>
          <View style={noteStyles.sizeGrid}>
            {currentSizes.map(s => (
              <TouchableOpacity key={s} style={[noteStyles.sizeButton, currentSize === s && noteStyles.selectedSize]} onPress={() => onSizeSelect(s)}>
                <View style={[noteStyles.sizePreview, { width: s, height: s, borderRadius: s / 2, backgroundColor: isErasing ? '#ccc' : currentColor }]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const noteStyles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 10, padding: 20, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  modalSectionTitle: { fontSize: 16, fontWeight: '500', marginTop: 10, marginBottom: 10 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  colorButton: { width: 40, height: 40, borderRadius: 20, margin: 5, borderWidth: 2, borderColor: 'transparent' },
  selectedColor: { borderColor: '#3498db' },
  sizeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
  sizeButton: { width: 40, height: 40, borderRadius: 20, margin: 5, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  selectedSize: { borderColor: '#3498db' },
  sizePreview: { backgroundColor: 'black' },
});
