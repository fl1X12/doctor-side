import { useState } from 'react';

//==============================================================================
// --- Custom Hook for Note State ---
// This refactored version uses a single source of truth for state management
// and includes the missing `clearState` function.
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
    let newDrawings = currentState.drawings;
    let newHighlights = currentState.highlights;
    let newTextBoxes = currentState.textBoxes;

    if (type === 'drawing') {
      newDrawings = [...currentState.drawings, element];
    } else if (type === 'highlight') {
      newHighlights = [...currentState.highlights, element];
    } else if (type === 'textBox') {
      newTextBoxes = [...currentState.textBoxes, element];
    }

    recordNewState({
      drawings: newDrawings,
      highlights: newHighlights,
      textBoxes: newTextBoxes,
    });
  };
  
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

  // ✅ ADDED: The missing clearState function
  const clearState = () => {
    setHistory([initialState]);
    setCurrentIndex(0);
  };

  // ✅ MODIFIED: The return object now includes clearState and the derived state
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
  };
};