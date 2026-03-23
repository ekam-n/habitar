"use client";
import { useState } from "react";

interface Props {
  onSubmit: (habitInput: string) => void;
  loading: boolean;
}

export default function HabitForm({ onSubmit, loading }: Props) {
  const [value, setValue] = useState("");

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-6xl font-bold leading-tight mb-3">habitar</h1>
        <p className="text-[var(--ink-light)] text-lg italic" style={{ fontFamily: "Fraunces, serif" }}>
          build your habits, grow your world
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl p-8 w-full shadow-lg">
        <label className="block text-xs font-semibold tracking-widest uppercase text-[var(--ink-light)] mb-3">
          What habit do you want to build?
        </label>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. go to the gym every morning"
          rows={3}
          className="w-full px-4 py-3 rounded-2xl text-base resize-none outline-none border-2 border-[var(--cream-dark)] bg-[var(--cream)] text-[var(--ink)] focus:border-[var(--accent)] transition-colors duration-200"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        />
        <button
          onClick={() => value.trim() && onSubmit(value.trim())}
          disabled={loading || !value.trim()}
          className="mt-4 w-full py-4 rounded-2xl text-base font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
          style={{
            background: loading ? "var(--accent-soft)" : "var(--accent)",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          {loading ? "Generating your world…" : "Start My Habit →"}
        </button>
      </div>
    </div>
  );
}