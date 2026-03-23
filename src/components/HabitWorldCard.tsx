"use client";

interface Props {
  title: string;
  bgImagePath: string;
  accessoryImagePath: string;
  streak: number;
  buttonLabel: string;
  onLog: () => void;
  logging: boolean;
  alreadyLogged: boolean;
  missedYesterday: boolean;
}

export default function HabitWorldCard({
  title, bgImagePath, accessoryImagePath,
  streak, buttonLabel, onLog, logging, alreadyLogged, missedYesterday
}: Props) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">habitar</h1>
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
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md">
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

        {/* Accessory badge — top right */}
        <div className="absolute top-4 right-4 w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md">
          <img
            src={accessoryImagePath}
            alt="Accessory"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Title overlay — bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-5 pt-10 pb-5">
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
        disabled={logging || alreadyLogged}
        className="w-full py-5 rounded-2xl text-base font-semibold transition-all duration-200 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
        style={{
          background: alreadyLogged
            ? "var(--cream-dark)"
            : logging
            ? "var(--accent-soft)"
            : "var(--accent)",
          color: alreadyLogged ? "var(--ink-light)" : "white",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        {alreadyLogged
          ? "✓ Logged for today"
          : logging
          ? "Updating your world…"
          : buttonLabel}
      </button>
    </div>
  );
}