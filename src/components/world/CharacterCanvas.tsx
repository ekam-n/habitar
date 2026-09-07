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
 *
 * MEASURED (headless Chrome, WebGL2, production build, six viewport widths
 * from 900px down to 320px, which drives the card from 448px to 224px):
 *
 *   viewport  card  canvas css     aspect  char/canvasW  char/canvasH
 *   900       448   149.3x298.7    0.4998  0.4956        0.5223
 *   640       448   149.3x298.7    0.4998  0.4956        0.5223
 *   480       384   128  x256      0.5000  0.4922        0.5156
 *   400       304   101.3x202.7    0.4998  0.4936        0.5229
 *   360       264    88  x176      0.5000  0.5114        0.5227
 *   320       224    74.7x149.3    0.5003  0.5087        0.5157
 *
 * Aspect holds at 0.5 throughout. Apparent size spread is 3.8% on width and
 * 1.4% on height across a 2x range of card sizes — and that residue is pixel
 * quantisation, not drift: at a 74.7px-wide canvas the character is 38px, so
 * a single antialiased edge pixel is already 2.6%.
 *
 * R3F's ResizeObserver was confirmed to work inside this specific container
 * rather than assumed: the drawing buffer tracks the CSS box at every width.
 *
 * Two further properties, both verified rather than reasoned about:
 *   - dpr={[1,2]} genuinely caps. At devicePixelRatio 3 the buffer stays at
 *     2x (298x597 for a 149.3x298.7 box) instead of going to 3x.
 *   - The canvas paints nothing outside its slot (0 pixels), and the card's
 *     rounded-3xl corners stay clipped. Note the slot spans x 149..299 of
 *     448 while the corner radius is 24px, so the canvas never reaches a
 *     rounded corner in the first place — corner bleed is structurally
 *     impossible here, not merely absent.
 *
 * One thing that is NOT a sizing bug but looks like one when measuring: the
 * title gradient at z-20 occludes the character's lower body, so the
 * character's *visible* extent is smaller than its *rendered* extent, and
 * the two diverge as the card shrinks (the gradient is text-sized and does
 * not scale with the card). Measure with the z-20 chrome hidden.
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
