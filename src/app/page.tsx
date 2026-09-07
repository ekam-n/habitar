"use client";
import { useState, useEffect } from "react";
import HabitForm from "@/components/HabitForm";
import HabitWorldCard, { PLACEHOLDER_BG } from "@/components/HabitWorldCard";
import type { StreakState } from "@/lib/rules/titles";

type Step = "form" | "world";

interface WorldState {
  habitId: number;
  title: string;
  buttonLabel: string;
  bgImagePath: string;
  streak: number;
  missedYesterday: boolean;
  /** Streak-derived. Drives which growth stage the world/character shows. */
  stage: StreakState;
  /** User-chosen appearance. Null until onboarding picks one. */
  characterId: string | null;
  characterVariant: string | null;
}

const DEV_WORLD: WorldState = {
  habitId: -1,
  title: "Dev Mode — Morning Run",
  buttonLabel: "Log Today's Run",
  bgImagePath: PLACEHOLDER_BG,
  streak: 0,
  missedYesterday: false,
  stage: "start",
  characterId: null,
  characterVariant: null,
};

export default function Home() {
  const [step, setStep] = useState<Step>("form");
  const [world, setWorld] = useState<WorldState | null>(null);
  const [loading, setLoading] = useState(false);
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Pull the server's error message out of a failed response, with a fallback. */
  async function readError(res: Response, fallback: string): Promise<string> {
    try {
      const data = await res.json();
      return typeof data?.error === "string" ? data.error : fallback;
    } catch {
      return fallback;
    }
  }

  useEffect(() => {
    const savedId = localStorage.getItem("habitId");
    if (!savedId) return;
    fetch(`/api/habit?id=${savedId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) {
          // Stale id (habit deleted, or a fresh database). Drop it and show
          // the form rather than sitting on an empty world.
          localStorage.removeItem("habitId");
          return;
        }
        setWorld({
          habitId:          data.habitId,
          title:            data.title,
          buttonLabel:      data.buttonLabel,
          bgImagePath:      data.bgImagePath ?? PLACEHOLDER_BG,
          streak:           data.streak,
          missedYesterday:  data.missedYesterday,
          stage:            data.stage,
          characterId:      data.characterId ?? null,
          characterVariant: data.characterVariant ?? null,
        });
        setStep("world");
      })
      .catch(() => setError("Could not load your saved habit."));
  }, []);

  async function handleDevMode() {
    setError(null);
    const res = await fetch("/api/dev/seed");
    if (!res.ok) {
      setError(await readError(res, "Could not start dev mode."));
      return;
    }
    const { habitId } = await res.json();
    localStorage.setItem("habitId", String(habitId));
    setWorld({ ...DEV_WORLD, habitId });
    setStep("world");
  }

  async function handleReset() {
    if (!world) return;
    setError(null);
    const res = await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId: world.habitId }),
    });
    if (!res.ok) {
      setError(await readError(res, "Could not reset your streak."));
      return;
    }
    const data = await res.json();
    setWorld(prev => prev ? {
      ...prev,
      streak:          0,
      title:           data.title,
      stage:           data.stage,
      missedYesterday: false,
    } : null);
  }

  async function handleDelete() {
    if (!world) return;
    setError(null);
    const res = await fetch(`/api/habit?id=${world.habitId}`, { method: "DELETE" });
    if (!res.ok) {
      setError(await readError(res, "Could not delete this habit."));
      return;
    }
    localStorage.removeItem("habitId");
    setWorld(null);
    setStep("form");
  }

  async function handleCreate(habitInput: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitInput }),
      });
      if (!res.ok) {
        // The loudest real-world case: ComfyUI is not running, so generation
        // fails and the user was previously left staring at the form with no
        // explanation at all.
        setError(await readError(res, "Could not generate your world."));
        return;
      }
      const data = await res.json();
      localStorage.setItem("habitId", String(data.habitId));
      setWorld({
        habitId:          data.habitId,
        title:            data.title,
        buttonLabel:      data.buttonLabel,
        bgImagePath:      data.bgImagePath ?? PLACEHOLDER_BG,
        streak:           0,
        missedYesterday:  false,
        stage:            data.stage,
        characterId:      data.characterId ?? null,
        characterVariant: data.characterVariant ?? null,
      });
      setStep("world");
    } catch {
      setError("Could not reach the server. Is the app still running?");
    } finally {
      setLoading(false);
    }
  }

  async function handleLog() {
    if (!world) return;
    setLogging(true);
    setError(null);
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitId: world.habitId,
          // `force` bypasses the once-a-day guard and the consecutive-day
          // check, which also pins missedYesterday to 0 and makes `recovery`
          // unreachable. Dev mode only; real logs run the real date logic.
          ...(process.env.NEXT_PUBLIC_DEV_MODE === "true" && { force: true }),
        }),
      });
      if (!res.ok) {
        setError(await readError(res, "Could not log your habit."));
        return;
      }
      const data = await res.json();
      if (data.alreadyLogged) {
        // Reachable again now that force:true is dev-only. Not an error, but
        // it shares the one notice slot rather than going silent.
        setError("Already logged today — see you tomorrow.");
        return;
      }

      setWorld(prev => prev ? {
        ...prev,
        title:           data.title,
        bgImagePath:     data.bgImagePath ?? prev.bgImagePath,
        streak:          data.streak,
        missedYesterday: data.missedYesterday,
        stage:           data.stage,
      } : null);
    } catch {
      setError("Could not reach the server. Is the app still running?");
    } finally {
      setLogging(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 gap-4">
      {error && (
        <div
          role="status"
          className="w-full max-w-md rounded-2xl px-4 py-3 text-sm text-center bg-white border-2 border-[var(--accent-soft)] text-[var(--ink)]"
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            aria-label="Dismiss"
            className="ml-3 text-xs underline text-[var(--ink-light)] hover:opacity-70"
          >
            dismiss
          </button>
        </div>
      )}
      {process.env.NEXT_PUBLIC_DEV_MODE === "true" && (
        <>
          <button
            onClick={handleDevMode}
            className="fixed top-3 right-3 text-xs bg-black/40 text-white px-2 py-1 rounded z-50"
          >
            dev
          </button>
          <button
            onClick={handleReset}
            className="fixed top-9 right-3 text-xs bg-black/40 text-white px-2 py-1 rounded z-50"
          >
            reset streak
          </button>
        </>
      )}
      {step === "form" && (
        <HabitForm onSubmit={handleCreate} loading={loading} />
      )}
      {step === "world" && world && (
        <HabitWorldCard
          title={world.title}
          bgImagePath={world.bgImagePath}
          streak={world.streak}
          buttonLabel={world.buttonLabel}
          onLog={handleLog}
          onReset={handleReset}
          onDelete={handleDelete}
          logging={logging}
          missedYesterday={world.missedYesterday}
          stage={world.stage}
          characterId={world.characterId}
          characterVariant={world.characterVariant}
        />
      )}
    </main>
  );
}
