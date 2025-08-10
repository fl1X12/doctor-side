import { useState } from 'react';

//==============================================================================
// --- Custom Hook for Note State ---
// File Path: src/hooks/useNoteState.js
//
// This version correctly defines and exports the functions for adding
// and removing elements.
//==============================================================================
export const useNoteState = () => {
  const [drawings, setDrawings] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [textBoxes, setTextBoxes] = useState([]);
  const [history, setHistory] = useState([{ drawings: [], highlights: [], textBoxes: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const recordState = (newState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      const prevState = history[newIndex];
      setDrawings(prevState.drawings || []);
      setHighlights(prevState.highlights || []);
      setTextBoxes(prevState.textBoxes || []);
      setHistoryIndex(newIndex);
    }
  };

  const redo = () => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      setDrawings(nextState.drawings || []);
      setHighlights(nextState.highlights || []);
      setTextBoxes(nextState.textBoxes || []);
      setHistoryIndex(newIndex);
    }
  };

  const addElement = (type, element) => {
    let newState;
    const currentState = { drawings, highlights, textBoxes };

    if (type === 'drawing') {
      newState = { ...currentState, drawings: [...drawings, element] };
    } else if (type === 'highlight') {
      newState = { ...currentState, highlights: [...highlights, element] };
    } else if (type === 'textBox') {
      newState = { ...currentState, textBoxes: [...textBoxes, element] };
    } else {
      return; // Do nothing if the type is unknown
    }

    setDrawings(newState.drawings);
    setHighlights(newState.highlights);
    setTextBoxes(newState.textBoxes);
    recordState(newState);
  };

  const updateTextBoxPosition = (id, newX, newY) => {
    const newTextBoxes = textBoxes.map(tb => tb.id === id ? { ...tb, x: newX, y: newY } : tb);
    setTextBoxes(newTextBoxes);
    // Note: For simplicity, this doesn't create a new history state on every drag move.
    // To add drag to undo/redo, you could call recordState on drag release.
  };

  // --- FIX for Erase Tool ---
  // This function handles removing elements by their IDs.
  const removeElementsByIds = (idsToRemove) => {
    const idSet = new Set(idsToRemove);
    const newDrawings = drawings.filter(d => !idSet.has(d.id));
    const newHighlights = highlights.filter(h => !idSet.has(h.id));
    
    // Only update state if something actually changed
    if (newDrawings.length !== drawings.length || newHighlights.length !== highlights.length) {
        const newState = { drawings: newDrawings, highlights: newHighlights, textBoxes };
        setDrawings(newDrawings);
        setHighlights(newHighlights);
        recordState(newState);
    }
  };

  // Ensure all functions are returned so they can be destructured in NoteEditor.js
  return { 
    drawings, 
    highlights, 
    textBoxes, 
    addElement,
    updateTextBoxPosition, 
    removeElementsByIds, // Now correctly exported
    undo, 
    redo, 
    canUndo, 
    canRedo 
  };
};
