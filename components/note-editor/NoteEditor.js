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
    loadState, // ✅ 1. Destructure the new function from your hook
  } = useNoteState();

  const [activeMode, setActiveMode] = useState('draw');
  const [isErasing, setIsErasing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);
  const [settings, setSettings] = useState({ color: '#000000', size: 4, highlightColor: '#FFFF00', eraserSize: 20 });

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const onCanvasLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    //console.log('Canvas layout:', { width, height }); // Add this debug
    setCanvasSize({ width, height });
  };

  useImperativeHandle(ref, () => ({
    clear() {
      clearState();
    },
    // ✅ 2. Add the loadDrawing method for the parent to call
    loadDrawing(drawingData) {
      
      try {
        if (drawingData) {
          // Handle different data structures that might be passed
          const dataToLoad = {
            drawings: drawingData.drawings || [],
            highlights: drawingData.highlights || [],
            textBoxes: drawingData.textBoxes || [], // Keep existing textBoxes if any
          };
          
          // This will replace the canvas content with the historical data
          loadState(dataToLoad);
          console.log("Successfully loaded historical drawing data");
        } else {
          console.warn("No drawing data provided to loadDrawing");
        }
      } catch (error) {
        console.error("Error loading drawing data:", error);
      }
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
  onMoveShouldSetPanResponder: () => true,

  onPanResponderGrant: (evt) => {
    const { locationX, locationY, timestamp } = evt.nativeEvent;

    if (isErasing) {
      handleErase(locationX, locationY);
      return;
    }

    if (canvasSize.width === 0 || canvasSize.height === 0) {
      return;
    }

    const normalizedX = Math.max(0, Math.min(1, locationX / canvasSize.width));
    const normalizedY = Math.max(0, Math.min(1, locationY / canvasSize.height));

    const newPath = {
      id: Date.now().toString(),
      points: [{ 
        x: normalizedX, 
        y: normalizedY,
        t: timestamp || Date.now()
      }],
      color: activeMode === 'highlight' ? settings.highlightColor : settings.color,
      strokeWidth: activeMode === 'highlight' ? 20 : settings.size,
      opacity: activeMode === 'highlight' ? 0.4 : 1,
    };

    setCurrentPath(newPath);
  },

  onPanResponderMove: (evt) => {
    const { locationX, locationY, timestamp } = evt.nativeEvent;

    if (isErasing) {
      handleErase(locationX, locationY);
      return;
    }

    if (!currentPath) return;

    const normalizedX = Math.max(0, Math.min(1, locationX / canvasSize.width));
    const normalizedY = Math.max(0, Math.min(1, locationY / canvasSize.height));
    const currentTime = timestamp || Date.now();
    
    const lastPoint = currentPath.points[currentPath.points.length - 1];
    
    // Much smaller minimum distance for fast writing
    const distance = Math.sqrt(
      Math.pow(normalizedX - lastPoint.x, 2) + 
      Math.pow(normalizedY - lastPoint.y, 2)
    );
    
    // Capture more points for fast movements
    const minDistance = 0.001; // Reduced from 0.002
    
    if (distance > minDistance) {
      setCurrentPath(prev => ({ 
        ...prev, 
        points: [...prev.points, { 
          x: normalizedX, 
          y: normalizedY,
          t: currentTime
        }] 
      }));
    }
  },

  onPanResponderRelease: () => {
    if (!isErasing && currentPath && currentPath.points && currentPath.points.length > 0) {
      // For single points, create a small dot
      let finalPath = currentPath;
      
      if (currentPath.points.length === 1) {
        const point = currentPath.points[0];
        finalPath = {
          ...currentPath,
          points: [
            point,
            { x: point.x + 0.001, y: point.y }, // Create tiny line for dot
          ]
        };
      }
      
      // Remove timing data for storage
      const cleanedPath = {
        ...finalPath,
        points: finalPath.points.map(({ x, y }) => ({ x, y }))
      };
      
      addElement(activeMode === 'highlight' ? 'highlight' : 'drawing', cleanedPath);
    }
    setCurrentPath(null);
  },
});

// Keep the same enhanced eraser function

// Enhanced eraser with visual feedback
const handleErase = (x, y) => {
  const idsToErase = new Set();
  const eraserRadius = settings.eraserSize;
  
  // Convert touch coordinates to normalized coordinates
  const normalizedX = x / canvasSize.width;
  const normalizedY = y / canvasSize.height;
  
  // Check drawings
  drawings.forEach(path => {
    path.points.forEach(point => {
      const distance = Math.sqrt(
        Math.pow((point.x - normalizedX) * canvasSize.width, 2) + 
        Math.pow((point.y - normalizedY) * canvasSize.height, 2)
      );
      if (distance < eraserRadius) {
        idsToErase.add(path.id);
      }
    });
  });

  // Check highlights
  highlights.forEach(path => {
    path.points.forEach(point => {
      const distance = Math.sqrt(
        Math.pow((point.x - normalizedX) * canvasSize.width, 2) + 
        Math.pow((point.y - normalizedY) * canvasSize.height, 2)
      );
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
      <View style={styles.canvasContainer}
      onLayout={onCanvasLayout}
      {...panResponder.panHandlers}>
        <DrawingCanvas
          drawings={drawings}
          highlights={highlights}
          currentPath={currentPath}
          size={canvasSize}
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