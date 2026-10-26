import React, { useMemo } from 'react';
import { View } from 'react-native';

interface PixelArtProps {
  /** Equal-length rows; each character is one cell ('.' or an unmapped character = empty). */
  rows: readonly string[];
  /** Cell character → color. */
  palette: Readonly<Record<string, string>>;
  /** Cell size in points. */
  cell: number;
}

interface Run {
  x: number;
  y: number;
  length: number;
  color: string;
}

/**
 * Draws small pixel art from a character grid with plain Views (one View per
 * horizontal run of same-colored cells), for crisp hard-edged icons without
 * an image asset. Decorative: hidden from screen readers.
 */
export function PixelArt({ rows, palette, cell }: PixelArtProps) {
  const runs = useMemo(() => {
    const result: Run[] = [];
    rows.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const color = palette[row[x]];
        if (!color) { x += 1; continue; }
        let end = x + 1;
        while (end < row.length && palette[row[end]] === color) end += 1;
        result.push({ x, y, length: end - x, color });
        x = end;
      }
    });
    return result;
  }, [palette, rows]);

  const width = (rows[0]?.length ?? 0) * cell;
  const height = rows.length * cell;

  return (
    <View
      style={{ width, height }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      {runs.map((run) => (
        <View
          key={`${run.x}-${run.y}`}
          style={{
            position: 'absolute',
            left: run.x * cell,
            top: run.y * cell,
            width: run.length * cell,
            height: cell,
            backgroundColor: run.color,
          }}
        />
      ))}
    </View>
  );
}
