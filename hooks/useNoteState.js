import { useCallback, useState } from 'react';

//==============================================================================
// --- Custom Hook for Note State ---
// This version includes the 'loadState' function to replace the canvas 
// content with historical data.
//==============================================================================
export const useNoteState = () => {
  // The initial state of a single note entry
  const initialState = { drawings: [], highlights: [], textBoxes: [] };

  // The history array is now the single source of truth.
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // DERIVED STATE: Get the current drawings/highlights directly from the history.
  const currentState = history[currentIndex];
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // This internal function handles creating a new history entry
  const recordNewState = (newState) => {
    const newHistory = history.slice(0, currentIndex + 1);
    setHistory([...newHistory, newState]);
    setCurrentIndex(newHistory.length);
  };

  const addElement = (type, element) => {
    // Creates a mutable copy of the current state arrays
    const newState = {
      drawings: [...currentState.drawings],
      highlights: [...currentState.highlights],
      textBoxes: [...currentState.textBoxes],
    };

    if (type === 'drawing') {
      newState.drawings.push(element);
    } else if (type === 'highlight') {
      newState.highlights.push(element);
    } else if (type === 'textBox') {
      newState.textBoxes.push(element);
    }

    recordNewState(newState);
  };
  
  // ✅ ADDED: The loadState function to overwrite the history
  const loadState = useCallback((newState) => {
    const loadedData = {
      drawings: newState.drawings || [],
      highlights: newState.highlights || [],
      textBoxes: newState.textBoxes || [],
    };
    // Reset the history with the loaded data as the new starting point.
    // This correctly discards the old undo/redo history.
    setHistory([loadedData]);
    setCurrentIndex(0);
  }, []);
  
  const removeElementsByIds = (idsToRemove) => {
    const idSet = new Set(idsToRemove);
    const newDrawings = currentState.drawings.filter(d => !idSet.has(d.id));
    const newHighlights = currentState.highlights.filter(h => !idSet.has(h.id));
    
    if (newDrawings.length !== currentState.drawings.length || newHighlights.length !== currentState.highlights.length) {
      recordNewState({ ...currentState, drawings: newDrawings, highlights: newHighlights });
    }
  };

  const undo = () => {
    if (canUndo) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const redo = () => {
    if (canRedo) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const updateTextBoxPosition = (id, newX, newY) => {
    // This function would also be modified to update the history state if needed
  };

  const clearState = () => {
    setHistory([initialState]);
    setCurrentIndex(0);
  };

  return { 
    ...currentState, // Directly returns drawings, highlights, textBoxes
    addElement,
    updateTextBoxPosition, 
    removeElementsByIds,
    undo, 
    redo, 
    canUndo, 
    canRedo,
    clearState,
    loadState, // ✅ EXPORTED: Make the function available to your components
  };
};