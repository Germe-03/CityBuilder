import { Clock3, Database, Download, Save, Trash2, Users, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  createManualSave,
  deleteSaveGame,
  listSaveGames,
  loadSaveGame,
  type SaveGameSummary,
} from "../persistence/savegameRepository";
import type { GameState } from "../simulation/cityMap";

interface SaveGameDialogProps {
  state: GameState;
  onClose: () => void;
  onLoad: (state: GameState) => void;
  onFeedback: (message: string, tone?: "success" | "warning" | "info") => void;
}

const dateFormatter = new Intl.DateTimeFormat("de-CH", {
  dateStyle: "short",
  timeStyle: "short",
});

export function SaveGameDialog({
  state,
  onClose,
  onLoad,
  onFeedback,
}: SaveGameDialogProps) {
  const [saveName, setSaveName] = useState(state.cityName);
  const [savegames, setSavegames] = useState<SaveGameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSavegames(await listSaveGames());
      setProblem(null);
    } catch {
      setProblem("Der Browserspeicher ist momentan nicht verfuegbar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void listSaveGames()
      .then((rows) => {
        if (!active) return;
        setSavegames(rows);
        setProblem(null);
      })
      .catch(() => {
        if (active) setProblem("Der Browserspeicher ist momentan nicht verfuegbar.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const saveCurrentGame = async () => {
    setBusyId("new");
    try {
      await createManualSave(state, saveName);
      await refresh();
      onFeedback("Spielstand gespeichert.", "success");
    } catch {
      setProblem(
        "Der Spielstand konnte nicht gespeichert werden. Bitte erneut versuchen.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const loadSelectedGame = async (id: string) => {
    setBusyId(id);
    try {
      const loadedState = await loadSaveGame(id);
      onLoad(loadedState);
      onFeedback("Spielstand geladen.", "success");
      onClose();
    } catch {
      setProblem("Der Spielstand ist unvollstaendig oder nicht mehr lesbar.");
      setBusyId(null);
    }
  };

  const removeSelectedGame = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }

    setBusyId(id);
    try {
      await deleteSaveGame(id);
      setConfirmDeleteId(null);
      await refresh();
      onFeedback("Spielstand geloescht.", "info");
    } catch {
      setProblem("Der Spielstand konnte nicht geloescht werden.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation">
      <section
        className="savegame-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="savegame-title"
      >
        <header className="savegame-header">
          <span className="dialog-icon">
            <Database aria-hidden="true" />
          </span>
          <div>
            <small>Stadtverwaltung</small>
            <h2 id="savegame-title">Speicherstaende</h2>
          </div>
          <button
            type="button"
            className="icon-button dialog-close"
            onClick={onClose}
            aria-label="Speicherstaende schliessen"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="savegame-create">
          <label htmlFor="savegame-name">Name des Spielstands</label>
          <div>
            <input
              id="savegame-name"
              value={saveName}
              onChange={(event) => setSaveName(event.target.value)}
              maxLength={60}
              autoComplete="off"
            />
            <button
              type="button"
              className="primary-button"
              onClick={() => void saveCurrentGame()}
              disabled={busyId !== null || saveName.trim().length === 0}
            >
              <Save aria-hidden="true" />
              {busyId === "new" ? "Speichert..." : "Spielstand speichern"}
            </button>
          </div>
          <small>
            Die Stadt wird zusaetzlich regelmaessig automatisch gespeichert.
          </small>
        </div>

        {problem && <div className="savegame-problem">{problem}</div>}

        <div className="savegame-list-heading">
          <strong>Vorhandene Spielstaende</strong>
          <small>{savegames.length}</small>
        </div>

        <div className="savegame-list" aria-live="polite">
          {loading ? (
            <p className="savegame-empty">Spielstaende werden geladen...</p>
          ) : savegames.length === 0 ? (
            <p className="savegame-empty">Noch kein Spielstand vorhanden.</p>
          ) : (
            savegames.map((savegame) => (
              <article className="savegame-item" key={savegame.id}>
                <div className="savegame-summary">
                  <span className="savegame-kind">
                    {savegame.kind === "autosave" ? "Automatisch" : "Manuell"}
                  </span>
                  <strong>{savegame.name}</strong>
                  <div>
                    <span>
                      <Clock3 aria-hidden="true" />
                      {dateFormatter.format(savegame.savedAt)}
                    </span>
                    <span>
                      <Users aria-hidden="true" />
                      {savegame.population.toLocaleString("de-CH")} Einwohner
                    </span>
                    <span>Tag {savegame.day}</span>
                  </div>
                </div>
                <div className="savegame-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void loadSelectedGame(savegame.id)}
                    disabled={busyId !== null}
                    aria-label={`${savegame.name} laden`}
                  >
                    <Download aria-hidden="true" />
                    Laden
                  </button>
                  {savegame.kind === "manual" && (
                    <button
                      type="button"
                      className={`delete-save-button${confirmDeleteId === savegame.id ? " is-confirming" : ""}`}
                      onClick={() => void removeSelectedGame(savegame.id)}
                      disabled={busyId !== null}
                      aria-label={
                        confirmDeleteId === savegame.id
                          ? `${savegame.name} wirklich loeschen`
                          : `${savegame.name} loeschen`
                      }
                    >
                      <Trash2 aria-hidden="true" />
                      {confirmDeleteId === savegame.id ? "Bestaetigen" : "Loeschen"}
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
