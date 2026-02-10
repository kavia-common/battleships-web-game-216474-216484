const BOARD_SIZE = 10;
const FLEET_LENGTHS = [5, 4, 3, 3, 2];

function coordsForShip(startRow, startCol, orientation, length) {
  const coords = [];
  for (let i = 0; i < length; i++) {
    const r = startRow + (orientation === "V" ? i : 0);
    const c = startCol + (orientation === "H" ? i : 0);
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return null;
    coords.push([r, c]);
  }
  return coords;
}

// PUBLIC_INTERFACE
export function buildDefaultFleetDraft() {
  /** Build a default fleet draft with non-overlapping starting suggestions. */
  // Pre-fill a simple valid layout users can tweak.
  return [
    { id: "s5", length: 5, startRow: 0, startCol: 0, orientation: "H" },
    { id: "s4", length: 4, startRow: 2, startCol: 0, orientation: "H" },
    { id: "s3a", length: 3, startRow: 4, startCol: 0, orientation: "H" },
    { id: "s3b", length: 3, startRow: 6, startCol: 0, orientation: "H" },
    { id: "s2", length: 2, startRow: 8, startCol: 0, orientation: "H" },
  ];
}

// PUBLIC_INTERFACE
export function validateFleetDraft(fleet) {
  /** Validate fleet: correct lengths, in bounds, and no overlap. */
  const lengths = fleet.map((s) => s.length).slice().sort((a, b) => a - b);
  const expected = FLEET_LENGTHS.slice().sort((a, b) => a - b);
  if (lengths.join(",") !== expected.join(",")) {
    return { ok: false, error: `Fleet must have lengths ${FLEET_LENGTHS.join(",")}.` };
  }

  const used = new Set();
  for (const s of fleet) {
    const coords = coordsForShip(s.startRow, s.startCol, s.orientation, s.length);
    if (!coords) return { ok: false, error: "A ship is out of bounds." };
    for (const [r, c] of coords) {
      const key = `${r},${c}`;
      if (used.has(key)) return { ok: false, error: "Ships cannot overlap." };
      used.add(key);
    }
  }

  return { ok: true };
}

// PUBLIC_INTERFACE
export function placementOverlayGrid(fleet) {
  /** Create a 10x10 grid showing ship placement preview (ship/unknown). */
  const grid = Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => "unknown"));
  for (const s of fleet) {
    const coords = coordsForShip(s.startRow, s.startCol, s.orientation, s.length);
    if (!coords) continue;
    for (const [r, c] of coords) grid[r][c] = "ship";
  }
  return grid;
}
