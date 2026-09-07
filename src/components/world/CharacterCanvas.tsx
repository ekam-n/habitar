"use client";

import { Canvas } from "@react-three/fiber";

/*
 * CAMERA AND SIZING CONTRACT — read this before changing the container.
 *
 * The canvas lives in HabitWorldCard at:
 *   absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-2/3
 * inside a card that is `w-full max-w-md aspect-square` (so at most 448px
 * square, fluid below that).
 *
 * The key property that makes this stable: BOTH container dimensions are
 * fractions of the SAME square card, so the canvas aspect ratio is a constant
 *
 *     (1/3) / (2/3) = 0.5
 *
 * regardless of how wide the card actually renders. The canvas only ever
 * scales uniformly; it never changes shape.
 *
 * That matters because a perspective camera's visible world extent depends
 * only on fov, distance and aspect — never on pixel size:
 *
 *     visibleHeight = 2 * distance * tan(fov / 2)
 *     visibleWidth  = visibleHeight * aspect
 *
 * With aspect pinned at 0.5, the visible world box is identical at 448px and
 * at 200px. The same world content simply maps to fewer pixels, so the
 * character scales in exact lockstep with the background image behind it.
 * No drift, and no viewport-dependent fudge factors.
 *
 * Concrete numbers, at fov 35 and distance 5:
 *     visibleHeight = 2 * 5 * tan(17.5°) = 3.15 world units
 *     visibleWidth  = 3.15 * 0.5         = 1.58 world units
 *
 * fov is deliberately narrow (35 rather than the 75 default). A long lens
 * flattens perspective distortion, which keeps a small character readable and
 * avoids the wide-angle bulge you get filling a tall thin frame up close.
 *
 * IF YOU CHANGE THE CONTAINER, the aspect constant changes with it:
 *   - Changing w-1/3 or h-2/3 changes aspect, which changes visibleWidth.
 *     Vertical fov is fixed, so the frame gets wider or narrower, not taller.
 *   - Making the CARD non-square breaks the constant-aspect property
 *     entirely, and apparent size will start drifting with viewport width.
 *     That is the case to avoid.
 * Recompute with the formulas above rather than nudging numbers until it
 * looks right.
 */
const CAMERA_FOV = 35;
const CAMERA_POSITION: [number, number, number] = [0, 0, 5];

export default function CharacterCanvas() {
  return (
    <Canvas
      // Cap DPR: retina would otherwise render 4x the pixels of a 1x display
      // for a ~149x299 CSS box, which is pure waste on a laptop GPU.
      dpr={[1, 2]}
      camera={{ fov: CAMERA_FOV, position: CAMERA_POSITION, near: 0.1, far: 100 }}
      // alpha:true plus no scene background keeps the canvas transparent so
      // the AI background image composites through behind the character.
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 4, 3]} intensity={1.6} />

      <mesh>
        <capsuleGeometry args={[0.38, 0.85, 8, 24]} />
        <meshStandardMaterial color="#c17f4a" roughness={0.55} metalness={0.05} />
      </mesh>
    </Canvas>
  );
}
