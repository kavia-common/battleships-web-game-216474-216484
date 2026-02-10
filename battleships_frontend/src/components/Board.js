import React, { useMemo } from "react";
import { placementOverlayGrid } from "../game/fleet";

/**
 * Board component supports:
 * - variant="own": shows ships/hits/misses
 * - variant="target": shows unknown/hit/miss and allows clicking to fire
 */
export default function Board({ variant, grid, placements, onCellClick, disabled }) {
  const overlay = useMemo(() => {
    if (!placements || placements.length === 0) return null;
    return placementOverlayGrid(placements);
  }, [placements]);

  const effective = useMemo(() => {
    // Prefer backend grid if provided; otherwise use overlay for placement preview.
    if (grid && Array.isArray(grid) && grid.length === 10) return grid;
    if (overlay) return overlay;
    return Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => "unknown"));
  }, [grid, overlay]);

  return (
    <div className={`board ${variant === "target" ? "boardTarget" : "boardOwn"}`}>
      {effective.map((row, r) => (
        <div className="boardRow" key={`r-${r}`}>
          {row.map((cell, c) => {
            const value = typeof cell === "string" ? cell : "unknown";
            const cls = `cell cell-${value}`;
            const clickable = variant === "target" && typeof onCellClick === "function" && !disabled;
            return (
              <button
                type="button"
                key={`c-${r}-${c}`}
                className={cls}
                onClick={() => clickable && onCellClick(r, c)}
                disabled={!clickable}
                aria-label={`${variant === "target" ? "Fire" : "Cell"} at row ${r} col ${c}: ${value}`}
                title={`${r},${c}`}
              >
                <span className="cellGlyph" aria-hidden="true">
                  {value === "unknown" && "·"}
                  {value === "miss" && "○"}
                  {value === "hit" && "×"}
                  {value === "ship" && (variant === "target" ? "·" : "■")}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
