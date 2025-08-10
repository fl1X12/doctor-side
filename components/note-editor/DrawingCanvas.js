import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

//==============================================================================
// --- Note Editor Component: Drawing Canvas ---
// File Path: src/components/note-editor/DrawingCanvas.js
//
// This component is now only responsible for rendering SVG paths.
// It no longer contains PanResponder logic.
//==============================================================================

export default function DrawingCanvas({ drawings = [], highlights = [], currentPath }) {

  const pointsToPath = (points) => {
    if (!points || points.length < 2) return '';
    let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 1; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      path += ` Q ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}, ${(p1.x + p2.x) / 2} ${(p1.y + p2.y) / 2}`;
    }
    path += ` L ${points[points.length - 1].x.toFixed(2)} ${points[points.length - 1].y.toFixed(2)}`;
    return path;
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg height="100%" width="100%">
        {(highlights || []).map(p => (
          <Path
            key={p.id}
            d={pointsToPath(p.points)}
            stroke={p.color}
            strokeWidth={p.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={p.opacity}
          />
        ))}
        {(drawings || []).map(p => (
          <Path
            key={p.id}
            d={pointsToPath(p.points)}
            stroke={p.color}
            strokeWidth={p.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {currentPath && (
          <Path
            d={pointsToPath(currentPath.points)}
            stroke={currentPath.color}
            strokeWidth={currentPath.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={currentPath.opacity}
          />
        )}
      </Svg>
    </View>
  );
}
