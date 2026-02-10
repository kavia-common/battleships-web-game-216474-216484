const BASE_URL = "http://localhost:3001";

/**
 * Convert non-2xx responses into readable errors (FastAPI uses JSON {detail: ...}).
 */
async function readError(res) {
  try {
    const data = await res.json();
    if (data && typeof data.detail === "string") return data.detail;
    return JSON.stringify(data);
  } catch {
    return await res.text();
  }
}

async function httpJson(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const msg = await readError(res);
    throw new Error(msg || `Request failed: ${res.status}`);
  }

  // Some endpoints might return empty responses; handle safely.
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// PUBLIC_INTERFACE
export async function apiCreateGame(mode) {
  /** Create a game in pve or pvp mode. */
  return httpJson("/games", {
    method: "POST",
    body: JSON.stringify({ mode, board_size: 10 }),
  });
}

// PUBLIC_INTERFACE
export async function apiPlaceShips(gameId, payload) {
  /** Submit a player's fleet placement. */
  return httpJson(`/games/${gameId}/place-ships`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// PUBLIC_INTERFACE
export async function apiGetState(gameId, playerId) {
  /** Fetch player-specific game state. */
  const qp = new URLSearchParams({ player_id: playerId }).toString();
  return httpJson(`/games/${gameId}/state?${qp}`, { method: "GET" });
}

// PUBLIC_INTERFACE
export async function apiFire(gameId, payload) {
  /** Fire at a coordinate. */
  return httpJson(`/games/${gameId}/fire`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
