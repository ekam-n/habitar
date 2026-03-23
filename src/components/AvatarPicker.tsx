"use client";
import { useState } from "react";
import Avatar, { BodyType, SkinToneKey, skinTones } from "./Avatar";

interface Props {
  onComplete: (bodyType: BodyType, skinTone: SkinToneKey) => void;
}

const skinToneKeys: SkinToneKey[] = ["light", "lightMedium", "medium", "mediumDark", "dark"];
const bodyOptions: { type: BodyType; label: string }[] = [
  { type: "A", label: "Style A" },
  { type: "B", label: "Style B" },
];

export default function AvatarPicker({ onComplete }: Props) {
  const [selectedBody, setSelectedBody] = useState<BodyType | null>(null);
  const [selectedTone, setSelectedTone] = useState<SkinToneKey | null>(null);

  const canContinue = selectedBody !== null && selectedTone !== null;
  const previewTone: SkinToneKey = selectedTone ?? "medium";

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-2">habitar</h1>
        <p
          className="text-[var(--ink-light)] italic text-lg"
          style={{ fontFamily: "Fraunces, serif" }}
        >
          first, create your character
        </p>
      </div>

      {/* Body type */}
      <div className="w-full bg-white rounded-3xl p-6 shadow-lg">
        <p className="text-xs font-semibold tracking-widest uppercase text-[var(--ink-light)] mb-4">
          Choose your style
        </p>
        <div className="flex gap-4">
          {bodyOptions.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setSelectedBody(type)}
              className={`flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-2xl border-2 transition-all duration-200 ${
                selectedBody === type
                  ? "border-[var(--accent)] bg-[var(--cream)]"
                  : "border-transparent bg-[var(--cream-dark)] hover:border-[var(--accent-soft)]"
              }`}
            >
              <div style={{ width: "72px", height: "120px" }}>
                <Avatar bodyType={type} skinTone={previewTone} animate={false} />
              </div>
              <span className="text-sm font-medium text-[var(--ink-light)]">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Skin tone */}
      <div className="w-full bg-white rounded-3xl p-6 shadow-lg">
        <p className="text-xs font-semibold tracking-widest uppercase text-[var(--ink-light)] mb-4">
          Skin tone
        </p>
        <div className="flex gap-3 justify-center">
          {skinToneKeys.map((key) => (
            <button
              key={key}
              onClick={() => setSelectedTone(key)}
              title={skinTones[key].label}
              className={`w-10 h-10 rounded-full transition-all duration-150 ${
                selectedTone === key
                  ? "ring-2 ring-offset-2 ring-[var(--accent)] scale-110"
                  : "hover:scale-105"
              }`}
              style={{ background: skinTones[key].skin }}
            />
          ))}
        </div>
      </div>

      {/* Continue */}
      <button
        onClick={() => canContinue && onComplete(selectedBody!, selectedTone!)}
        disabled={!canContinue}
        className="w-full py-5 rounded-2xl text-base font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
        style={{
          background: "var(--accent)",
          color: "white",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        Build My World →
      </button>
    </div>
  );
}