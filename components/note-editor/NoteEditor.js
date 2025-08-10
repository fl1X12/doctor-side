import { useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { useNoteState } from '../../hooks/useNoteState';
import useVoiceRecorder from '../../hooks/useVoiceRecorder';
import DrawingCanvas from './DrawingCanvas';
import Toolbar from './Toolbar';
// import SettingsModal from './SettingsModal';

//==============================================================================
// --- Main Note Editor Container Component ---
// File Path: src/components/note-editor/NoteEditor.js
//
// This version implements the full logic for the eraser tool.
//==============================================================================
export default function NoteEditor({ onTranscriptionComplete }) {
  // --- FIX 1: Import the 'removeElementsByIds' function ---
  const {
    drawings,
    highlights,
    textBoxes,
    addElement,
    updateTextBoxPosition,
    removeElementsByIds, // Now imported
    undo,
    redo,
    canUndo,
    canRedo,
  } = useNoteState();

  const [activeMode, setActiveMode] = useState('draw');
  const [isErasing, setIsErasing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);
  const [settings, setSettings] = useState({ color: '#000000', size: 4, highlightColor: '#FFFF00', eraserSize: 20 });

  const handleTranscriptionResult = (text) => {
    console.log("Transcription Result:", text);
    if (onTranscriptionComplete) {
      onTranscriptionComplete(text);
    }
  };

  const { start, stop, isRecording, loading: isTranscribing } = useVoiceRecorder({
    onResult: handleTranscriptionResult,
  });

  // --- FIX 2: Implement the full PanResponder logic for erasing ---
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => activeMode === 'draw' || activeMode === 'highlight' || isErasing,

    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;

      if (isErasing) {
        // When erasing starts, check for initial collision immediately
        handleErase(locationX, locationY);
        return;
      }

      // Drawing/Highlighting logic (unchanged)
      setCurrentPath({
        id: Date.now().toString(),
        points: [{ x: locationX, y: locationY }],
        color: activeMode === 'highlight' ? settings.highlightColor : settings.color,
        strokeWidth: activeMode === 'highlight' ? 20 : settings.size,
        opacity: activeMode === 'highlight' ? 0.4 : 1,
      });
    },

    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;

      if (isErasing) {
        // Continuously check for collisions as the eraser moves
        handleErase(locationX, locationY);
        return;
      }

      // Drawing/Highlighting logic (unchanged)
      if (currentPath) {
        setCurrentPath(prev => ({ ...prev, points: [...prev.points, { x: locationX, y: locationY }] }));
      }
    },

    onPanResponderRelease: () => {
      // Finalize the drawing/highlighting action
      if (!isErasing && currentPath && currentPath.points.length > 1) {
        addElement(activeMode === 'highlight' ? 'highlight' : 'drawing', currentPath);
      }
      // Reset the current path for both drawing and erasing
      setCurrentPath(null);
    },
  });

  // --- FIX 3: Create the collision detection and erasing handler ---
  const handleErase = (x, y) => {
    const idsToErase = new Set();
    const eraserRadius = settings.eraserSize / 2;

    // Check for collisions with drawings
    drawings.forEach(path => {
      path.points.forEach(point => {
        const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
        if (distance < eraserRadius) {
          idsToErase.add(path.id);
        }
      });
    });

    // Check for collisions with highlights
    highlights.forEach(path => {
      path.points.forEach(point => {
        const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
        if (distance < eraserRadius) {
          idsToErase.add(path.id);
        }
      });
    });

    // If any paths were hit, call the remove function from the hook
    if (idsToErase.size > 0) {
      removeElementsByIds(Array.from(idsToErase));
    }
  };

  return (
    <View style={styles.editorContainer}>
      <Toolbar
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        isErasing={isErasing}
        setIsErasing={setIsErasing}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onSettingsPress={() => setShowSettings(true)}
        onMicPress={() => isRecording ? stop() : start()}
        isRecording={isRecording}
        isTranscribing={isTranscribing}
      />
      <View style={styles.canvasContainer} {...panResponder.panHandlers}>
        <DrawingCanvas
          drawings={drawings}
          highlights={highlights}
          // textBoxes={textBoxes}  // Assuming no text boxes on this canvas for now
          currentPath={currentPath}
          // onUpdateTextBoxPosition={updateTextBoxPosition}
        />
      </View>
      {/* <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} settings={settings} setSettings={setSettings} /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  editorContainer: { height: 350, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, overflow: 'hidden' },
  canvasContainer: { flex: 1, position: 'relative' },
});