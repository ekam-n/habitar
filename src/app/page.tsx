"use client";
import { useState } from "react";
import HabitForm from "@/components/HabitForm";
import HabitWorldCard from "@/components/HabitWorldCard";

type Step = "form" | "world";

interface WorldState {
  habitId: number;
  title: string;
  buttonLabel: string;
  bgImagePath: string;
  streak: number;
  missedYesterday: boolean;
}

const DEV_WORLD: WorldState = {
  habitId: -1,
  title: "Dev Mode — Morning Run",
  buttonLabel: "Log Today's Run",
  bgImagePath: "/generated/bg_3_1_1774247204509.png",
  streak: 0,
  missedYesterday: false,
};

export default function Home() {
  const [step, setStep] = useState<Step>("form");
  const [world, setWorld] = useState<WorldState | null>(null);
  const [loading, setLoading] = useState(false);
  const [logging, setLogging] = useState(false);
  const [alreadyLogged, setAlreadyLogged] = useState(false);
  const [devGeneration, setDevGeneration] = useState(true);

  async function handleDevMode() {
    const res = await fetch("/api/dev/seed");
    const { habitId } = await res.json();
    setWorld({ ...DEV_WORLD, habitId });
    setStep("world");
  }

  async function handleResetStreak() {
    if (!world) return;
    await fetch("/api/dev/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId: world.habitId }),
    });
    setWorld(prev => prev ? { ...prev, streak: 0 } : null);
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
      setWorld({
        habitId:            data.habitId,
        title:              data.title,
        buttonLabel:        data.buttonLabel,
        bgImagePath:        data.bgImagePath,
        streak:             0,
        missedYesterday:    false,
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
          ...(process.env.NEXT_PUBLIC_DEV_MODE === "true" && { force: true }),
          ...(process.env.NEXT_PUBLIC_DEV_MODE === "true" && !devGeneration && { skipGeneration: true }),
        }),
      });
      if (!res.ok) return;
      const data = await res.json();

      if (data.alreadyLogged && process.env.NEXT_PUBLIC_DEV_MODE !== "true") {
        setAlreadyLogged(true);
        return;
      }

      setWorld(prev => prev ? {
        ...prev,
        title:              data.title,
        bgImagePath:        data.bgImagePath ?? prev.bgImagePath,
        streak:             data.streak,
        missedYesterday:    data.missedYesterday,
      } : null);
      if (process.env.NEXT_PUBLIC_DEV_MODE !== "true") setAlreadyLogged(true);
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
            onClick={() => setDevGeneration(v => !v)}
            className="fixed top-9 right-3 text-xs bg-black/40 text-white px-2 py-1 rounded z-50"
          >
            comfy: {devGeneration ? "on" : "off"}
          </button>
          <button
            onClick={handleResetStreak}
            className="fixed top-15 right-3 text-xs bg-black/40 text-white px-2 py-1 rounded z-50"
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
          logging={logging}
          alreadyLogged={alreadyLogged}
          missedYesterday={world.missedYesterday}
        />
      )}
    </main>
  );
}
