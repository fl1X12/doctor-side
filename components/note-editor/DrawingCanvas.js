// 🚫 No need for a separate View or StyleSheet from 'react-native'
import Svg, { Path } from 'react-native-svg';

//==============================================================================
// --- Note Editor Component: Drawing Canvas ---
// File Path: src/components/note-editor/DrawingCanvas.js
//
// This version is updated with fixes for the "black canvas" rendering bug.
//==============================================================================

export default function DrawingCanvas({ drawings = [], highlights = [], currentPath, size }) {

  if (!size || size.width === 0 || size.height === 0) {
    return null;
  }

  // ✅ FAST WRITING: Optimized for rapid text capture
  const pointsToPath = (points, canvasSize) => {
    if (!points || points.length === 0) return '';
    
    if (points.length === 1) {
      // Single point - create a small dot
      const point = points[0];
      const x = (point.x * canvasSize.width).toFixed(2);
      const y = (point.y * canvasSize.height).toFixed(2);
      return `M ${x} ${y} L ${x} ${y}`;
    }

    if (points.length === 2) {
      // Two points - simple line
      const start = points[0];
      const end = points[1];
      return `M ${(start.x * canvasSize.width).toFixed(2)} ${(start.y * canvasSize.height).toFixed(2)} L ${(end.x * canvasSize.width).toFixed(2)} ${(end.y * canvasSize.height).toFixed(2)}`;
    }

    // Multiple points - use simplified smoothing for speed
    const first = points[0];
    let path = `M ${(first.x * canvasSize.width).toFixed(2)} ${(first.y * canvasSize.height).toFixed(2)}`;

    // Use quadratic curves for speed (faster than cubic bezier)
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      // Control point is the current point
      const controlX = (current.x * canvasSize.width).toFixed(2);
      const controlY = (current.y * canvasSize.height).toFixed(2);
      
      // End point is halfway to next point for smoothness
      const endX = ((current.x + next.x) / 2 * canvasSize.width).toFixed(2);
      const endY = ((current.y + next.y) / 2 * canvasSize.height).toFixed(2);
      
      path += ` Q ${controlX} ${controlY}, ${endX} ${endY}`;
    }

    // End with the last point
    const last = points[points.length - 1];
    path += ` L ${(last.x * canvasSize.width).toFixed(2)} ${(last.y * canvasSize.height).toFixed(2)}`;

    return path;
  };

  // ✅ FIX: Updated stroke width calculation
  // The issue was that strokeWidth values like 4, 20 were being treated as normalized
  // values and multiplied by canvas size, creating huge strokes
  const getStrokeWidth = (strokeWidth) => {
    // If strokeWidth is already a pixel value (like 4, 20), use it directly
    // If it's a normalized value (like 0.005), convert it
    if (strokeWidth <= 1) {
      // Normalized value - convert to pixels
      return strokeWidth * Math.min(size.width, size.height);
    } else {
      // Already a pixel value - use as is, but clamp to reasonable range
      return Math.min(strokeWidth, 50); // Max stroke width of 50px
    }
  };

  // ✅ FIX #2: Apply styling directly to the Svg component.
  // This removes the need for a wrapping View.
  return (
    <Svg height="100%" width="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
      {(highlights || []).map(p => (
        <Path
          key={p.id}
          d={pointsToPath(p.points, size)}
          stroke={p.color}
          strokeWidth={getStrokeWidth(p.strokeWidth)}
          // ✅ FIX #1: Use 'transparent' instead of 'none' for better reliability.
          fill="transparent"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={p.opacity}
        />
      ))}
      {(drawings || []).map(p => (
        <Path
          key={p.id}
          d={pointsToPath(p.points, size)}
          stroke={p.color}
          strokeWidth={getStrokeWidth(p.strokeWidth)}
          fill="transparent" // Apply fix here too
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={p.opacity}
        />
      ))}
      {currentPath && (
        <Path
          d={pointsToPath(currentPath.points, size)}
          stroke={currentPath.color}
          strokeWidth={getStrokeWidth(currentPath.strokeWidth)}
          fill="transparent" // And here
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={currentPath.opacity}
        />
      )}
    </Svg>
  );
}