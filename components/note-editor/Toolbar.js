import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Pen, Highlighter, Eraser, Undo, Redo, Palette, Mic } from 'lucide-react-native';

//==============================================================================
// --- Toolbar Component ---
// File Path: src/components/note-editor/Toolbar.js
//==============================================================================
export default function Toolbar({ onMicPress, isRecording, isTranscribing, ...props }) {
  return (
    <View style={styles.toolbar}>
      <TouchableOpacity style={[styles.toolButton, props.activeMode === 'draw' && !props.isErasing && styles.activeToolButton]} onPress={() => props.setActiveMode('draw')}>
        <Pen size={20} color={props.activeMode === 'draw' && !props.isErasing ? '#fff' : '#333'} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.toolButton, props.activeMode === 'highlight' && !props.isErasing && styles.activeToolButton]} onPress={() => props.setActiveMode('highlight')}>
        <Highlighter size={20} color={props.activeMode === 'highlight' && !props.isErasing ? '#fff' : '#333'} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.toolButton, props.isErasing && styles.activeToolButton]} onPress={() => props.setIsErasing(!props.isErasing)}>
        <Eraser size={20} color={props.isErasing ? '#fff' : '#333'} />
      </TouchableOpacity>
      <View style={styles.separator} />
      <TouchableOpacity style={[styles.toolButton, isTranscribing && styles.disabledButton]} onPress={onMicPress} disabled={isTranscribing}>
        {isTranscribing ? <ActivityIndicator size="small" color="#333" /> : <Mic size={20} color={isRecording ? '#e74c3c' : '#333'} />}
      </TouchableOpacity>
      <View style={styles.separator} />
      <TouchableOpacity style={[styles.toolButton, !props.canUndo && styles.disabledButton]} onPress={props.onUndo} disabled={!props.canUndo}>
        <Undo size={20} color={props.canUndo ? '#333' : '#ccc'} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.toolButton, !props.canRedo && styles.disabledButton]} onPress={props.onRedo} disabled={!props.canRedo}>
        <Redo size={20} color={props.canRedo ? '#333' : '#ccc'} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.toolButton} onPress={props.onSettingsPress}>
        <Palette size={20} color="#333" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', padding: 8, backgroundColor: '#f1f1f1', borderBottomWidth: 1, borderColor: '#ddd', alignItems: 'center', flexWrap: 'wrap' },
  toolButton: { padding: 8, borderRadius: 6, margin: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc' },
  activeToolButton: { backgroundColor: '#3498db', borderColor: '#3498db' },
  disabledButton: { opacity: 0.5 },
  separator: { width: 1, height: 24, backgroundColor: '#ccc', marginHorizontal: 6 },
});
