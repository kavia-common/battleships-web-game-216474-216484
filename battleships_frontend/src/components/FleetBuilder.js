import React from "react";

function clampInt(v, min, max) {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export default function FleetBuilder({ fleet, onChange }) {
  const update = (id, patch) => {
    onChange(
      fleet.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  return (
    <div className="fleet">
      {fleet.map((s) => (
        <div className="fleetRow" key={s.id}>
          <div className="fleetShip">
            <div className="fleetLen mono">{s.length}</div>
            <div className="fleetLabel">Ship</div>
          </div>

          <label className="field">
            <span className="fieldLabel">Row</span>
            <input
              className="input mono"
              type="number"
              min={0}
              max={9}
              value={s.startRow}
              onChange={(e) => update(s.id, { startRow: clampInt(e.target.value, 0, 9) })}
            />
          </label>

          <label className="field">
            <span className="fieldLabel">Col</span>
            <input
              className="input mono"
              type="number"
              min={0}
              max={9}
              value={s.startCol}
              onChange={(e) => update(s.id, { startCol: clampInt(e.target.value, 0, 9) })}
            />
          </label>

          <label className="field">
            <span className="fieldLabel">Dir</span>
            <select
              className="input mono"
              value={s.orientation}
              onChange={(e) => update(s.id, { orientation: e.target.value })}
            >
              <option value="H">H</option>
              <option value="V">V</option>
            </select>
          </label>
        </div>
      ))}
    </div>
  );
}
