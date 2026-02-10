import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { apiCreateGame, apiFire, apiGetState, apiPlaceShips } from "./api/client";
import { buildDefaultFleetDraft, validateFleetDraft } from "./game/fleet";
import Board from "./components/Board";
import FleetBuilder from "./components/FleetBuilder";
import StatusPill from "./components/StatusPill";

// PUBLIC_INTERFACE
function App() {
  /**
   * Minimal single-page flow:
   * 1) Choose mode (PvE or PvP)
   * 2) Create game and show Placement screen (enter placements)
   * 3) Once placed, show Battle screen with two boards + fire actions
   */
  const [screen, setScreen] = useState("home"); // home | placement | battle
  const [mode, setMode] = useState("pve"); // pve | pvp

  const [gameId, setGameId] = useState(null);
  const [playerId, setPlayerId] = useState(null);

  const [fleetDraft, setFleetDraft] = useState(() => buildDefaultFleetDraft());
  const [state, setState] = useState(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const canPlace = useMemo(() => {
    const v = validateFleetDraft(fleetDraft);
    return v.ok;
  }, [fleetDraft]);

  const loadState = async (gid = gameId, pid = playerId) => {
    if (!gid || !pid) return;
    const s = await apiGetState(gid, pid);
    setState(s);
    if (s.phase === "battle" || s.phase === "finished") setScreen("battle");
  };

  useEffect(() => {
    // Auto-refresh state during battle to keep PvP reasonably current (polling).
    if (screen !== "battle" || !gameId || !playerId) return;

    const t = setInterval(() => {
      loadState().catch(() => {
        // Ignore transient polling errors in preview.
      });
    }, 1200);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, gameId, playerId]);

  const onCreateGame = async (nextMode) => {
    setError(null);
    setBusy(true);
    try {
      setMode(nextMode);
      const res = await apiCreateGame(nextMode);
      setGameId(res.game_id);
      setPlayerId(res.player1_id); // MVP: frontend is Player1
      setFleetDraft(buildDefaultFleetDraft());
      setState(null);
      setScreen("placement");
    } catch (e) {
      setError(e.message || "Failed to create game.");
    } finally {
      setBusy(false);
    }
  };

  const onSubmitPlacement = async () => {
    setError(null);
    setBusy(true);
    try {
      const v = validateFleetDraft(fleetDraft);
      if (!v.ok) {
        setError(v.error);
        return;
      }

      const ships = fleetDraft.map((s) => ({
        start: { row: s.startRow, col: s.startCol },
        orientation: s.orientation,
        length: s.length,
      }));

      const resState = await apiPlaceShips(gameId, {
        player_id: playerId,
        ships,
      });
      setState(resState);
      setScreen(resState.phase === "battle" ? "battle" : "placement");
    } catch (e) {
      setError(e.message || "Failed to place ships.");
    } finally {
      setBusy(false);
    }
  };

  const onFire = async (row, col) => {
    if (!state || !state.your_turn || state.phase !== "battle") return;
    setError(null);
    setBusy(true);
    try {
      await apiFire(gameId, {
        player_id: playerId,
        coord: { row, col },
      });
      await loadState();
    } catch (e) {
      setError(e.message || "Failed to fire.");
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <div className="appHeader">
      <div className="brand">
        <div className="brandMark" aria-hidden="true">
          ▦
        </div>
        <div>
          <div className="brandTitle">Battleships</div>
          <div className="brandSubtitle">Retro tactical naval combat</div>
        </div>
      </div>

      <div className="headerRight">
        {gameId && (
          <div className="meta">
            <div className="metaLabel">Game</div>
            <div className="metaValue mono">{gameId}</div>
          </div>
        )}
        {playerId && (
          <div className="meta">
            <div className="metaLabel">You</div>
            <div className="metaValue mono">{playerId}</div>
          </div>
        )}
        {state && (
          <StatusPill
            tone={state.phase === "finished" ? "neutral" : state.your_turn ? "success" : "info"}
            text={
              state.phase === "finished"
                ? state.message || "Finished"
                : state.your_turn
                  ? "Your turn"
                  : "Opponent turn"
            }
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="App">
      {header}

      <main className="container">
        {error && (
          <div className="alert" role="alert">
            <div className="alertTitle">Action needed</div>
            <div className="alertBody">{error}</div>
          </div>
        )}

        {screen === "home" && (
          <section className="panel">
            <h1 className="title">Choose a mode</h1>
            <p className="description">
              Place your fleet, then take turns firing at coordinates. First to sink all enemy ships
              wins.
            </p>

            <div className="actions">
              <button className="btn btnPrimary" onClick={() => onCreateGame("pve")} disabled={busy}>
                Play vs AI
              </button>
              <button className="btn btnSecondary" onClick={() => onCreateGame("pvp")} disabled={busy}>
                Play PvP (same browser for now)
              </button>
            </div>

            <div className="hint">
              Backend API: <span className="mono">http://localhost:3001</span>
            </div>
          </section>
        )}

        {screen === "placement" && (
          <section className="grid2">
            <div className="panel">
              <h2 className="title">Place your ships</h2>
              <p className="description">
                Enter a start coordinate and orientation for each ship. Coordinates are 0-indexed.
              </p>

              <FleetBuilder fleet={fleetDraft} onChange={setFleetDraft} />

              <div className="actions">
                <button className="btn btnPrimary" onClick={onSubmitPlacement} disabled={busy || !canPlace}>
                  Confirm placement
                </button>
                <button
                  className="btn btnGhost"
                  onClick={() => setFleetDraft(buildDefaultFleetDraft())}
                  disabled={busy}
                >
                  Reset
                </button>
                <button
                  className="btn btnSecondary"
                  onClick={() => {
                    setScreen("home");
                    setGameId(null);
                    setPlayerId(null);
                    setState(null);
                    setError(null);
                  }}
                  disabled={busy}
                >
                  New game
                </button>
              </div>

              {!canPlace && (
                <div className="subtle">
                  Fix placements: ships must fit the board and not overlap, and lengths must be
                  5,4,3,3,2.
                </div>
              )}
            </div>

            <div className="panel">
              <h2 className="title">Preview</h2>
              <p className="description">This is your board preview with ships visible.</p>
              <Board
                variant="own"
                grid={state?.your_board}
                placements={fleetDraft}
                onCellClick={null}
              />
              <div className="subtle">
                Tip: You can also place visually by clicking cells (coming next). This MVP uses the
                form controls.
              </div>
            </div>
          </section>
        )}

        {screen === "battle" && (
          <section className="grid2">
            <div className="panel">
              <div className="panelHeader">
                <h2 className="title">Your fleet</h2>
                {state && (
                  <StatusPill
                    tone="neutral"
                    text={`Ships remaining: ${state.remaining_ships_you}`}
                    compact
                  />
                )}
              </div>

              <Board variant="own" grid={state?.your_board} placements={[]} onCellClick={null} />
            </div>

            <div className="panel">
              <div className="panelHeader">
                <h2 className="title">Enemy waters</h2>
                {state && (
                  <StatusPill
                    tone="neutral"
                    text={`Ships remaining: ${state.remaining_ships_opponent}`}
                    compact
                  />
                )}
              </div>

              <Board
                variant="target"
                grid={state?.opponent_board}
                placements={[]}
                onCellClick={(r, c) => onFire(r, c)}
                disabled={!state || !state.your_turn || busy || state.phase !== "battle"}
              />

              <div className="actions">
                <button className="btn btnSecondary" onClick={() => loadState()} disabled={busy}>
                  Refresh
                </button>
                <button
                  className="btn btnGhost"
                  onClick={() => {
                    setScreen("home");
                    setGameId(null);
                    setPlayerId(null);
                    setState(null);
                    setError(null);
                  }}
                  disabled={busy}
                >
                  Exit
                </button>
              </div>

              {state?.phase === "finished" && (
                <div className="alert" role="status">
                  <div className="alertTitle">Game Over</div>
                  <div className="alertBody">{state.message || "Finished."}</div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <span className="mono">10×10</span> • Fleet <span className="mono">5,4,3,3,2</span> • Retro
        light theme (<span className="swatch primary" /> <span className="swatch accent" />)
      </footer>
    </div>
  );
}

export default App;
