import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { useNoteState } from '../../hooks/useNoteState';
import useVoiceRecorder from '../../hooks/useVoiceRecorder';
import DrawingCanvas from './DrawingCanvas';
import Toolbar from './Toolbar';
// import SettingsModal from './SettingsModal';

const NoteEditor = forwardRef(function NoteEditor({ onTranscriptionComplete, onDrawingsChange }, ref) {
  const {
    drawings,
    highlights,
    textBoxes,
    addElement,
    updateTextBoxPosition,
    removeElementsByIds,
    undo,
    redo,
    canUndo,
    canRedo,
    clearState,
  } = useNoteState();

  const [activeMode, setActiveMode] = useState('draw');
  const [isErasing, setIsErasing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);
  const [settings, setSettings] = useState({ color: '#000000', size: 4, highlightColor: '#FFFF00', eraserSize: 20 });

  useImperativeHandle(ref, () => ({
    clear() {
      clearState();
    },
  }));

  useEffect(() => {
    if (onDrawingsChange) {
      onDrawingsChange({ drawings, highlights });
    }
  }, [drawings, highlights, onDrawingsChange]);

  const handleTranscriptionResult = (text) => {
    console.log("Transcription Result:", text);
    if (onTranscriptionComplete) {
      onTranscriptionComplete(text);
    }
  };

  const { start, stop, isRecording, loading: isTranscribing } = useVoiceRecorder({
    onResult: handleTranscriptionResult,
  });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => activeMode === 'draw' || activeMode === 'highlight' || isErasing,

    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;

      if (isErasing) {
        handleErase(locationX, locationY);
        return;
      }

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
        handleErase(locationX, locationY);
        return;
      }

      if (currentPath) {
        setCurrentPath(prev => ({ ...prev, points: [...prev.points, { x: locationX, y: locationY }] }));
      }
    },

    onPanResponderRelease: () => {
      if (!isErasing && currentPath && currentPath.points.length > 1) {
        addElement(activeMode === 'highlight' ? 'highlight' : 'drawing', currentPath);
      }
      setCurrentPath(null);
    },
  });

  const handleErase = (x, y) => {
    const idsToErase = new Set();
    const eraserRadius = settings.eraserSize / 2;

    drawings.forEach(path => {
      path.points.forEach(point => {
        const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
        if (distance < eraserRadius) {
          idsToErase.add(path.id);
        }
      });
    });

    highlights.forEach(path => {
      path.points.forEach(point => {
        const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
        if (distance < eraserRadius) {
          idsToErase.add(path.id);
        }
      });
    });

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
          currentPath={currentPath}
        />
      </View>
      {/* <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} settings={settings} setSettings={setSettings} /> */}
    </View>
  );
});

export default NoteEditor;

const styles = StyleSheet.create({
  editorContainer: { height: 350, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, overflow: 'hidden' },
  canvasContainer: { flex: 1, position: 'relative' },
});