"use client";
import { useState, useEffect } from "react";
import HabitForm from "@/components/HabitForm";
import HabitWorldCard from "@/components/HabitWorldCard";
import type { StreakState } from "@/lib/rules/titles";

type Step = "form" | "world";

/** Committed fallback; public/generated/ is gitignored and empty on a clone. */
const PLACEHOLDER_BG = "/placeholder-world.svg";

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

  useEffect(() => {
    const savedId = localStorage.getItem("habitId");
    if (!savedId) return;
    fetch(`/api/habit?id=${savedId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
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
      });
  }, []);

  async function handleDevMode() {
    const res = await fetch("/api/dev/seed");
    const { habitId } = await res.json();
    localStorage.setItem("habitId", String(habitId));
    setWorld({ ...DEV_WORLD, habitId });
    setStep("world");
  }

  async function handleReset() {
    if (!world) return;
    const res = await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId: world.habitId }),
    });
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
    await fetch(`/api/habit?id=${world.habitId}`, { method: "DELETE" });
    localStorage.removeItem("habitId");
    setWorld(null);
    setStep("form");
  }

  async function handleCreate(habitInput: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitInput }),
      });
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
    } finally {
      setLoading(false);
    }
  }

  async function handleLog() {
    if (!world) return;
    setLogging(true);
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
      if (!res.ok) return;
      const data = await res.json();
      if (data.alreadyLogged) return;

      setWorld(prev => prev ? {
        ...prev,
        title:           data.title,
        bgImagePath:     data.bgImagePath ?? prev.bgImagePath,
        streak:          data.streak,
        missedYesterday: data.missedYesterday,
        stage:           data.stage,
      } : null);
    } finally {
      setLogging(false);
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-6">
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
