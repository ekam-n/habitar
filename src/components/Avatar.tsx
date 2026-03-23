"use client";

export type SkinToneKey = "light" | "lightMedium" | "medium" | "mediumDark" | "dark";
export type BodyType = "A" | "B";

interface PoseProps {
  headRot?: number;
  torsoRot?: number;

  leftUpperArmRot?: number;
  leftLowerArmRot?: number;
  leftHandRot?: number;

  rightUpperArmRot?: number;
  rightLowerArmRot?: number;
  rightHandRot?: number;

  leftUpperLegRot?: number;
  leftLowerLegRot?: number;
  leftFootRot?: number;

  rightUpperLegRot?: number;
  rightLowerLegRot?: number;
  rightFootRot?: number;
}

interface Props extends PoseProps {
  bodyType: BodyType;
  skinTone: SkinToneKey;
  animate?: boolean;
}

export const skinTones: Record<SkinToneKey, { label: string; skin: string }> = {
  light: { label: "Light", skin: "#FDDBB4" },
  lightMedium: { label: "Light Medium", skin: "#E8A97E" },
  medium: { label: "Medium", skin: "#C07D52" },
  mediumDark: { label: "Medium Dark", skin: "#8D5130" },
  dark: { label: "Dark", skin: "#4A2410" },
};

const STROKE = "#000000";
const SHIRT = "#000000";
const PANTS = "#FFFFFF";
const SHOES = "#000000";
const HAIR = "#000000";

function rotateTransform(angle = 0, cx = 0, cy = 0) {
  return `rotate(${angle} ${cx} ${cy})`;
}

// ── Body Type A: short hair ─────────────────────────────────────────────────

function HeadA({ skin, rotation = 0 }: { skin: string; rotation?: number }) {
  return (
    <g transform={rotateTransform(rotation, 90, 44)}>
      <ellipse cx="90" cy="44" rx="28" ry="29" fill={skin} stroke={STROKE} strokeWidth="1.6" />

      <ellipse cx="62" cy="49" rx="4.8" ry="8" fill={skin} stroke={STROKE} strokeWidth="1.4" />
      <ellipse cx="118" cy="49" rx="4.8" ry="8" fill={skin} stroke={STROKE} strokeWidth="1.4" />

      <path
        d="M63 40 C64 22,78 15,94 15 C108 15,117 21,119 31 L119 43 C112 38,104 36,95 35 C84 34,74 35,66 40 Z"
        fill={HAIR}
        stroke={STROKE}
        strokeWidth="1.4"
      />

      <circle cx="79" cy="47" r="2.2" fill="#000" />
      <circle cx="101" cy="47" r="2.2" fill="#000" />

      <path d="M84 59 Q90 60.5 96 59" fill="none" stroke={STROKE} strokeWidth="1.4" strokeLinecap="round" />
      {/* <path d="M83 69 Q90 71.5 97 69" fill="none" stroke={STROKE} strokeWidth="1.4" strokeLinecap="round" /> */}
    </g>
  );
}

// ── Body Type B: longer hair flowing past shoulders ─────────────────────────

function HeadB({ skin, rotation = 0 }: { skin: string; rotation?: number }) {
  return (
    <g transform={rotateTransform(rotation, 90, 44)}>
      {/* Long hair behind head (rendered first so face sits on top) */}
      <path
        d="M63 38 C57 48,54 64,55 82 C56 95,58 108,60 118 C64 112,66 102,67 90 L69 75"
        fill={HAIR}
        stroke={STROKE}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M117 38 C123 48,126 64,125 82 C124 95,122 108,120 118 C116 112,114 102,113 90 L111 75"
        fill={HAIR}
        stroke={STROKE}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      <ellipse cx="90" cy="44" rx="28" ry="29" fill={skin} stroke={STROKE} strokeWidth="1.6" />

      <ellipse cx="62" cy="49" rx="4.8" ry="8" fill={skin} stroke={STROKE} strokeWidth="1.4" />
      <ellipse cx="118" cy="49" rx="4.8" ry="8" fill={skin} stroke={STROKE} strokeWidth="1.4" />

      {/* Hair crown — slightly rounder and fuller than Type A */}
      <path
        d="M63 40 C63 20,76 13,90 13 C104 13,117 20,117 40 L117 43 C110 38,102 36,90 35 C78 34,70 35,63 40 Z"
        fill={HAIR}
        stroke={STROKE}
        strokeWidth="1.4"
      />

      <circle cx="79" cy="47" r="2.2" fill="#000" />
      <circle cx="101" cy="47" r="2.2" fill="#000" />

      {/* Slightly longer lashes */}
      <path d="M74 42 Q79 39 84 42" fill="none" stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M96 42 Q101 39 106 42" fill="none" stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" />

      <path d="M84 59 Q90 61 96 59" fill="none" stroke={STROKE} strokeWidth="1.4" strokeLinecap="round" />
      {/* <path d="M83 69 Q90 71.5 97 69" fill="none" stroke={STROKE} strokeWidth="1.4" strokeLinecap="round" /> */}
    </g>
  );
}

function Neck({ skin }: { skin: string }) {
  return (
    <g>
      <rect x="81" y="71" width="18" height="14" rx="2" fill={skin} stroke={STROKE} strokeWidth="1.4" />
    </g>
  );
}

// ── Body Type A torso: straight/boxy ────────────────────────────────────────

function TorsoA({ rotation = 0 }: { rotation?: number }) {
  return (
    <g transform={rotateTransform(rotation, 90, 132)}>
      <path
        d="M61 86 L119 86 C126 86 131 89 135 95 L143 116 L128 121 L121 104 C119 100 115 98 111 98 L69 98 C65 98 61 100 59 104 L52 121 L37 116 L45 95 C49 89 54 86 61 86 Z"
        fill={SHIRT}
        stroke={STROKE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <rect x="54" y="97" width="72" height="92" fill={SHIRT} stroke={STROKE} strokeWidth="1.6" />
    </g>
  );
}

// ── Body Type B torso: narrower shoulders, defined waist, wider hips ─────────

function TorsoB({ rotation = 0 }: { rotation?: number }) {
  return (
    <g transform={rotateTransform(rotation, 90, 132)}>
      {/* Shoulder yoke — slightly narrower than Type A */}
      <path
        d="M65 86 L115 86 C121 86 126 89 130 95 L137 114 L123 119 L117 104 C115 100 112 98 108 98 L72 98 C68 98 65 100 63 104 L57 119 L43 114 L50 95 C54 89 59 86 65 86 Z"
        fill={SHIRT}
        stroke={STROKE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Hourglass torso: wider at chest (~108px), narrows at waist (~84px), widens at hips (~118px) */}
      <path
        d="M57 98 C55 110,53 124,56 140 C58 150,60 158,57 170 C54 178,52 184,52 189
           L128 189 C128 184,126 178,123 170 C120 158,122 150,124 140
           C127 124,125 110,123 98 Z"
        fill={SHIRT}
        stroke={STROKE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </g>
  );
}

function UpperArm({
  side,
  skin,
  rotation = 0,
}: {
  side: "left" | "right";
  skin: string;
  rotation?: number;
}) {
  if (side === "left") {
    return (
      <g transform={rotateTransform(rotation, 53, 103)}>
        <path
          d="M53 103 C47 118,43 136,41 157 C40 169,39 183,39 193"
          fill="none"
          stroke={STROKE}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </g>
    );
  }

  return (
    <g transform={rotateTransform(rotation, 127, 103)}>
      <path
        d="M127 103 C133 118,137 136,139 157 C140 169,141 183,141 193"
        fill="none"
        stroke={STROKE}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </g>
  );
}

function LowerArm({
  side,
  rotation = 0,
}: {
  side: "left" | "right";
  rotation?: number;
}) {
  if (side === "left") {
    return (
      <g transform={rotateTransform(rotation, 39, 193)}>
        <path
          d="M39 193 C39 206,38 218,35 229 L30 243"
          fill="none"
          stroke={STROKE}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </g>
    );
  }

  return (
    <g transform={rotateTransform(rotation, 141, 193)}>
      <path
        d="M141 193 C141 206,142 218,145 229 L150 243"
        fill="none"
        stroke={STROKE}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </g>
  );
}

function Hand({
  side,
  skin,
  rotation = 0,
}: {
  side: "left" | "right";
  skin: string;
  rotation?: number;
}) {
  if (side === "left") {
    return (
      <g transform={rotateTransform(rotation, 30, 243)}>
        <path
          d="M30 243
             C27 249,28 254,32 254
             C34 254,35 252,35 249
             L35 257
             C35 261,37 263,40 263
             C42 263,43 261,43 257
             L43 249
             L43 260
             C43 264,45 266,48 266
             C50 266,51 264,51 260
             L51 249
             L51 258
             C51 262,53 264,56 264
             C59 264,60 261,60 257
             L60 246
             C61 249,63 251,66 251
             C69 251,70 246,67 242
             L60 229
             Z"
          fill={skin}
          stroke={STROKE}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </g>
    );
  }

  return (
    <g transform={rotateTransform(rotation, 150, 243)}>
      <path
        d="M150 243
           C153 249,152 254,148 254
           C146 254,145 252,145 249
           L145 257
           C145 261,143 263,140 263
           C138 263,137 261,137 257
           L137 249
           L137 260
           C137 264,135 266,132 266
           C130 266,129 264,129 260
           L129 249
           L129 258
           C129 262,127 264,124 264
           C121 264,120 261,120 257
           L120 246
           C119 249,117 251,114 251
           C111 251,110 246,113 242
           L120 229
           Z"
        fill={skin}
        stroke={STROKE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </g>
  );
}

// ── Pelvis A: standard ───────────────────────────────────────────────────────

function PelvisA({ rotation = 0 }: { rotation?: number }) {
  return (
    <g transform={rotateTransform(rotation, 90, 188)}>
      <path d="M55 188 L125 188" fill="none" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

// ── Pelvis B: wider hip curve ────────────────────────────────────────────────

function PelvisB({ rotation = 0 }: { rotation?: number }) {
  return (
    <g transform={rotateTransform(rotation, 90, 189)}>
      <path
        d="M52 189 Q90 196 128 189"
        fill="none"
        stroke={STROKE}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </g>
  );
}

function UpperLeg({
  side,
  rotation = 0,
}: {
  side: "left" | "right";
  rotation?: number;
}) {
  if (side === "left") {
    return (
      <g transform={rotateTransform(rotation, 74, 188)}>
        <path
          d="M55 188 L82 188 L79 210 L75 270 L46 270 L47 244 C48 224,50 206,55 188 Z"
          fill={PANTS}
          stroke={STROKE}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </g>
    );
  }

  return (
    <g transform={rotateTransform(rotation, 106, 188)}>
      <path
        d="M98 188 L125 188 C130 206,132 224,133 244 L134 270 L105 270 L101 210 Z"
        fill={PANTS}
        stroke={STROKE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </g>
  );
}

function LowerLeg({
  side,
  rotation = 0,
}: {
  side: "left" | "right";
  rotation?: number;
}) {
  if (side === "left") {
    return (
      <g transform={rotateTransform(rotation, 60, 270)}>
        <path
          d="M46 270 L75 270 L72 350 L38 350 Z"
          fill={PANTS}
          stroke={STROKE}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </g>
    );
  }

  return (
    <g transform={rotateTransform(rotation, 120, 270)}>
      <path
        d="M105 270 L134 270 L142 350 L108 350 Z"
        fill={PANTS}
        stroke={STROKE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </g>
  );
}

function Foot({
  side,
  rotation = 0,
}: {
  side: "left" | "right";
  rotation?: number;
}) {
  if (side === "left") {
    return (
      <g transform={rotateTransform(rotation, 55, 350)}>
        <path
          d="M35 350 L71 350 C75 350,78 352,78 356 L78 360 L22 360 L22 356 C22 352,26 350.5,35 350 Z"
          fill={SHOES}
          stroke={STROKE}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </g>
    );
  }

  return (
    <g transform={rotateTransform(rotation, 125, 350)}>
      <path
        d="M109 350 L145 350 C154 350.5,158 352,158 356 L158 360 L102 360 L102 356 C102 352,105 350,109 350 Z"
        fill={SHOES}
        stroke={STROKE}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </g>
  );
}

function RiggableAvatarSVG({
  skin,
  pose,
  bodyType,
}: {
  skin: string;
  pose: PoseProps;
  bodyType: BodyType;
}) {
  const Head = bodyType === "B" ? HeadB : HeadA;
  const Torso = bodyType === "B" ? TorsoB : TorsoA;
  const Pelvis = bodyType === "B" ? PelvisB : PelvisA;

  return (
    <svg
      viewBox="0 0 180 375"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%" }}
    >
      <Neck skin={skin} />

      <Head skin={skin} rotation={pose.headRot ?? 0} />
      <Torso rotation={pose.torsoRot ?? 0} />

      <UpperArm side="left" skin={skin} rotation={pose.leftUpperArmRot ?? 0} />
      <LowerArm side="left" rotation={pose.leftLowerArmRot ?? 0} />
      <Hand side="left" skin={skin} rotation={pose.leftHandRot ?? 0} />

      <UpperArm side="right" skin={skin} rotation={pose.rightUpperArmRot ?? 0} />
      <LowerArm side="right" rotation={pose.rightLowerArmRot ?? 0} />
      <Hand side="right" skin={skin} rotation={pose.rightHandRot ?? 0} />

      <Pelvis rotation={pose.torsoRot ?? 0} />

      <UpperLeg side="left" rotation={pose.leftUpperLegRot ?? 0} />
      <LowerLeg side="left" rotation={pose.leftLowerLegRot ?? 0} />
      <Foot side="left" rotation={pose.leftFootRot ?? 0} />

      <UpperLeg side="right" rotation={pose.rightUpperLegRot ?? 0} />
      <LowerLeg side="right" rotation={pose.rightLowerLegRot ?? 0} />
      <Foot side="right" rotation={pose.rightFootRot ?? 0} />
    </svg>
  );
}

export default function Avatar({
  bodyType,
  skinTone,
  animate = false,

  headRot = 0,
  torsoRot = 0,

  leftUpperArmRot = 0,
  leftLowerArmRot = 0,
  leftHandRot = 0,

  rightUpperArmRot = 0,
  rightLowerArmRot = 0,
  rightHandRot = 0,

  leftUpperLegRot = 0,
  leftLowerLegRot = 0,
  leftFootRot = 0,

  rightUpperLegRot = 0,
  rightLowerLegRot = 0,
  rightFootRot = 0,
}: Props) {
  const { skin } = skinTones[skinTone];

  const pose: PoseProps = {
    headRot,
    torsoRot,
    leftUpperArmRot,
    leftLowerArmRot,
    leftHandRot,
    rightUpperArmRot,
    rightLowerArmRot,
    rightHandRot,
    leftUpperLegRot,
    leftLowerLegRot,
    leftFootRot,
    rightUpperLegRot,
    rightLowerLegRot,
    rightFootRot,
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        animation: animate ? "habitar-float 3s ease-in-out infinite" : "none",
      }}
      data-body-type={bodyType}
    >
      <RiggableAvatarSVG skin={skin} pose={pose} bodyType={bodyType} />
    </div>
  );
}