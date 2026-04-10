"use client";

interface Props {
  title: string;
  bgImagePath: string;
  streak: number;
  buttonLabel: string;
  onLog: () => void;
  onReset: () => void;
  onDelete: () => void;
  logging: boolean;
  missedYesterday: boolean;
}

export default function HabitWorldCard({
  title, bgImagePath,
  streak, buttonLabel, onLog, onReset, onDelete, logging, missedYesterday
}: Props) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">habit world</h1>
      </div>

      {/* World Card */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-square bg-[var(--cream-dark)]">

        {/* Background */}
        <img
          src={bgImagePath}
          alt="Habit world"
          className="w-full h-full object-cover"
        />

        {/* Streak counter — top left */}
        <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md">
          <span
            className="text-2xl font-bold text-[var(--accent)]"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            {streak}
          </span>
          <span className="text-xs text-[var(--ink-light)] font-medium ml-1">
            day streak
          </span>
        </div>

        {/* Title overlay — bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 to-transparent px-5 pt-10 pb-5">
          <p
            className="text-xl font-semibold text-white italic"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            {title}
          </p>
        </div>
      </div>

      {/* Recovery message */}
      {missedYesterday && (
        <div className="bg-[var(--accent-soft)] rounded-2xl px-4 py-3 text-sm text-center text-[var(--ink)]">
          Welcome back — every restart counts. 🌱
        </div>
      )}

      {/* Log button */}
      <button
        onClick={onLog}
        disabled={logging}
        className="w-full py-5 rounded-2xl text-base font-semibold transition-all duration-200 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
        style={{
          background: logging ? "var(--accent-soft)" : "var(--accent)",
          color: "white",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        {logging ? "Updating your world…" : buttonLabel}
      </button>

      {/* Reset button */}
      <button
        onClick={onReset}
        disabled={logging}
        className="w-full py-3 rounded-2xl text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed hover:opacity-80 active:scale-[0.98]"
        style={{
          background: "transparent",
          color: "var(--ink-light)",
          border: "1.5px solid var(--cream-dark)",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        Reset streak
      </button>

      {/* Delete button */}
      <button
        onClick={onDelete}
        disabled={logging}
        className="w-full py-3 rounded-2xl text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed hover:opacity-80 active:scale-[0.98]"
        style={{
          background: "transparent",
          color: "var(--ink-light)",
          border: "1.5px solid var(--cream-dark)",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        Delete habit
      </button>
    </div>
  );
}
