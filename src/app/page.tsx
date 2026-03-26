"use client";
import { useState } from "react";
import AvatarPicker from "@/components/AvatarPicker";
import HabitForm from "@/components/HabitForm";
import HabitWorldCard from "@/components/HabitWorldCard";
import { BodyType, SkinToneKey } from "@/components/Avatar";

type Step = "avatar" | "form" | "world";

const DEV_AVATAR: AvatarConfig = { bodyType: "A", skinTone: "medium" };
const DEV_WORLD: WorldState = {
  habitId: 0,
  title: "Dev Mode — Morning Run",
  buttonLabel: "Log Today's Run",
  bgImagePath: "/generated/bg_3_1_1774247204509.png",
  accessoryImagePath: "/generated/acc_3_1774247225628.png",
  streak: 5,
  missedYesterday: false,
};

interface AvatarConfig {
  bodyType: BodyType;
  skinTone: SkinToneKey;
}

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
  const [step, setStep] = useState<Step>("avatar");
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null);
  const [world, setWorld] = useState<WorldState | null>(null);
  const [loading, setLoading] = useState(false);
  const [logging, setLogging] = useState(false);
  const [alreadyLogged, setAlreadyLogged] = useState(false);

  function handleDevMode() {
    setAvatarConfig(DEV_AVATAR);
    setWorld(DEV_WORLD);
    setStep("world");
  }

  function handleAvatarComplete(bodyType: BodyType, skinTone: SkinToneKey) {
    setAvatarConfig({ bodyType, skinTone });
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
      setWorld({
        habitId:            data.habitId,
        title:              data.title,
        buttonLabel:        data.buttonLabel,
        bgImagePath:        data.bgImagePath,
        accessoryImagePath: data.accessoryImagePath,
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
        body: JSON.stringify({ habitId: world.habitId }),
      });
      const data = await res.json();

      if (data.alreadyLogged) {
        setAlreadyLogged(true);
        return;
      }

      setWorld(prev => prev ? {
        ...prev,
        title:              data.title,
        bgImagePath:        data.bgImagePath ?? prev.bgImagePath,
        accessoryImagePath: data.accessoryImagePath ?? prev.accessoryImagePath,
        streak:             data.streak,
        missedYesterday:    data.missedYesterday,
      } : null);
      setAlreadyLogged(true);
    } finally {
      setLogging(false);
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-6">
      {process.env.NEXT_PUBLIC_DEV_MODE === "true" && (
        <button
          onClick={handleDevMode}
          className="fixed top-3 right-3 text-xs bg-black/40 text-white px-2 py-1 rounded z-50"
        >
          dev
        </button>
      )}
      {step === "avatar" && (
        <AvatarPicker onComplete={handleAvatarComplete} />
      )}
      {step === "form" && (
        <HabitForm onSubmit={handleCreate} loading={loading} />
      )}
      {step === "world" && world && avatarConfig && (
        <HabitWorldCard
          title={world.title}
          bgImagePath={world.bgImagePath}
          accessoryImagePath={world.accessoryImagePath}
          avatarBodyType={avatarConfig.bodyType}
          avatarSkinTone={avatarConfig.skinTone}
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