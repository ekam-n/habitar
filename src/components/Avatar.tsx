"use client";

export type SkinToneKey = "light" | "lightMedium" | "medium" | "mediumDark" | "dark";
export type BodyType = "A" | "B";

interface Props {
  bodyType: BodyType;
  skinTone: SkinToneKey;
  animate?: boolean;
}

export const skinTones: Record<SkinToneKey, { label: string; skin: string; mid: string }> = {
  light:       { label: "Light",        skin: "#FDDBB4", mid: "#EEC59A" },
  lightMedium: { label: "Light Medium", skin: "#EDB98A", mid: "#D49A65" },
  medium:      { label: "Medium",       skin: "#C68642", mid: "#A86C2C" },
  mediumDark:  { label: "Medium Dark",  skin: "#8D5524", mid: "#6A3A14" },
  dark:        { label: "Dark",         skin: "#4A2912", mid: "#2E1608" },
};

const SHIRT = "#C17F4A";
const PANTS = "#4A3728";
const SHOE  = "#2A1F18";
const HAIR  = "#2A1A0E";

function BodyA({ skin, mid }: { skin: string; mid: string }) {
  return (
    <svg viewBox="0 0 100 190" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <ellipse cx="50" cy="187" rx="20" ry="5" fill="rgba(0,0,0,0.12)" />
      {/* Shoes */}
      <ellipse cx="37" cy="181" rx="11" ry="6" fill={SHOE} />
      <ellipse cx="63" cy="181" rx="11" ry="6" fill={SHOE} />
      {/* Legs */}
      <rect x="31" y="133" width="15" height="50" rx="7" fill={PANTS} />
      <rect x="54" y="133" width="15" height="50" rx="7" fill={PANTS} />
      {/* Body */}
      <rect x="21" y="82" width="58" height="56" rx="14" fill={SHIRT} />
      {/* Arms */}
      <rect x="5"  y="84" width="18" height="13" rx="6" fill={SHIRT} />
      <rect x="77" y="84" width="18" height="13" rx="6" fill={SHIRT} />
      {/* Hands */}
      <circle cx="6"  cy="91" r="7" fill={skin} />
      <circle cx="94" cy="91" r="7" fill={skin} />
      {/* Neck */}
      <rect x="42" y="67" width="16" height="18" rx="6" fill={skin} />
      {/* Head */}
      <circle cx="50" cy="47" r="30" fill={skin} />
      {/* Ears */}
      <circle cx="20" cy="49" r="5" fill={mid} />
      <circle cx="80" cy="49" r="5" fill={mid} />
      {/* Hair — short */}
      <path d="M22 41 Q24 13 50 11 Q76 13 78 41 Q70 23 50 21 Q30 23 22 41Z" fill={HAIR} />
      <rect x="20" y="35" width="8" height="18" rx="4" fill={HAIR} />
      <rect x="72" y="35" width="8" height="18" rx="4" fill={HAIR} />
      {/* Eyebrows */}
      <path d="M35 38 Q40 35 45 38" stroke={HAIR} strokeWidth="2"   fill="none" strokeLinecap="round" />
      <path d="M55 38 Q60 35 65 38" stroke={HAIR} strokeWidth="2"   fill="none" strokeLinecap="round" />
      {/* Eyes */}
      <circle cx="40" cy="45" r="5.5" fill={HAIR} />
      <circle cx="60" cy="45" r="5.5" fill={HAIR} />
      <circle cx="41.5" cy="43.5" r="2" fill="white" />
      <circle cx="61.5" cy="43.5" r="2" fill="white" />
      {/* Smile */}
      <path d="M40 59 Q50 68 60 59" stroke={HAIR} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <circle cx="31" cy="55" r="7" fill="#F09070" opacity="0.28" />
      <circle cx="69" cy="55" r="7" fill="#F09070" opacity="0.28" />
    </svg>
  );
}

function BodyB({ skin, mid }: { skin: string; mid: string }) {
  return (
    <svg viewBox="0 0 100 190" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <ellipse cx="50" cy="187" rx="20" ry="5" fill="rgba(0,0,0,0.12)" />
      {/* Shoes */}
      <ellipse cx="37" cy="181" rx="10" ry="6" fill={SHOE} />
      <ellipse cx="63" cy="181" rx="10" ry="6" fill={SHOE} />
      {/* Legs */}
      <rect x="32" y="133" width="14" height="50" rx="7" fill={PANTS} />
      <rect x="54" y="133" width="14" height="50" rx="7" fill={PANTS} />
      {/* Body */}
      <rect x="23" y="82" width="54" height="56" rx="14" fill={SHIRT} />
      {/* Arms — slightly slimmer */}
      <rect x="7"  y="85" width="18" height="12" rx="6" fill={SHIRT} />
      <rect x="75" y="85" width="18" height="12" rx="6" fill={SHIRT} />
      {/* Hands */}
      <circle cx="8"  cy="91" r="6.5" fill={skin} />
      <circle cx="92" cy="91" r="6.5" fill={skin} />
      {/* Neck */}
      <rect x="43" y="67" width="14" height="18" rx="5" fill={skin} />
      {/* Head */}
      <circle cx="50" cy="46" r="29" fill={skin} />
      {/* Ears */}
      <circle cx="21" cy="48" r="4.5" fill={mid} />
      <circle cx="79" cy="48" r="4.5" fill={mid} />
      {/* Hair — long strands down sides */}
      <path d="M23 39 Q24 12 50 10 Q76 12 77 39 Q70 21 50 19 Q30 21 23 39Z" fill={HAIR} />
      <rect x="19" y="34" width="10" height="55" rx="5" fill={HAIR} />
      <rect x="71" y="34" width="10" height="55" rx="5" fill={HAIR} />
      {/* Eyebrows — softer arch */}
      <path d="M35 36 Q40 33 45 36" stroke={HAIR} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M55 36 Q60 33 65 36" stroke={HAIR} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Eyes — slightly bigger */}
      <circle cx="40" cy="44" r="6"   fill={HAIR} />
      <circle cx="60" cy="44" r="6"   fill={HAIR} />
      <circle cx="41.5" cy="42.5" r="2.2" fill="white" />
      <circle cx="61.5" cy="42.5" r="2.2" fill="white" />
      {/* Smile */}
      <path d="M41 58 Q50 67 59 58" stroke={HAIR} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <circle cx="31" cy="53" r="7" fill="#F09070" opacity="0.28" />
      <circle cx="69" cy="53" r="7" fill="#F09070" opacity="0.28" />
    </svg>
  );
}

export default function Avatar({ bodyType, skinTone, animate = false }: Props) {
  const { skin, mid } = skinTones[skinTone];
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        animation: animate ? "habitar-float 3s ease-in-out infinite" : "none",
      }}
    >
      {bodyType === "A" ? <BodyA skin={skin} mid={mid} /> : <BodyB skin={skin} mid={mid} />}
    </div>
  );
}