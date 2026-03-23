"use client";
import { useState } from "react";
import HabitForm from "@/components/HabitForm";
import HabitWorldCard from "@/components/HabitWorldCard";

interface WorldState {
  habitId: number;
  title: string;
  buttonLabel: string;
  bgImagePath: string;
  accessoryImagePath: string;
  streak: number;
  missedYesterday: boolean;
}

export default function Home() {
  const [world, setWorld] = useState<WorldState | null>(null);
  const [loading, setLoading] = useState(false);
  const [logging, setLogging] = useState(false);
  const [alreadyLogged, setAlreadyLogged] = useState(false);

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
        accessoryImagePath: data.accessoryImagePath,
        streak:             0,
        missedYesterday:    false,
      });
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
        body: JSON.stringify({ habitId: world.habitId }),
      });
      const data = await res.json();

      if (data.alreadyLogged) {
        setAlreadyLogged(true);
        return;
      }

      setWorld((prev) => prev ? {
        ...prev,
        title:           data.title,
        bgImagePath:     data.bgImagePath ?? prev.bgImagePath,
        accessoryImagePath: data.accessoryImagePath ?? prev.accessoryImagePath,
        streak:          data.streak,
        missedYesterday: data.missedYesterday,
      } : null);
      setAlreadyLogged(true);
    } finally {
      setLogging(false);
    }
  }

  return (
    <main style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "24px",
    }}>
      {world ? (
        <HabitWorldCard
          title={world.title}
          bgImagePath={world.bgImagePath}
          accessoryImagePath={world.accessoryImagePath}
          streak={world.streak}
          buttonLabel={world.buttonLabel}
          onLog={handleLog}
          logging={logging}
          alreadyLogged={alreadyLogged}
          missedYesterday={world.missedYesterday}
        />
      ) : (
        <HabitForm onSubmit={handleCreate} loading={loading} />
      )}
    </main>
  );
}