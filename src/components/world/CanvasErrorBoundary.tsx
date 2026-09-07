"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  /** Reported once, on the first failure. Routed to page.tsx's error state. */
  onError?: (message: string) => void;
}

interface State {
  failed: boolean;
}

/**
 * Error boundary around the 3D canvas. Used TWICE in CharacterCanvas, once in
 * the DOM tree outside <Canvas> and once inside it — see below for why.
 *
 * It deliberately renders NOTHING on failure. The card keeps its background
 * image and its chrome; the character is simply absent. A missing character is
 * a much better outcome than a blank page, since the background carries the
 * whole 2.5D composite on its own.
 *
 * WHAT IT CATCHES: render-phase throws from the React tree below it. In
 * practice that means a throw while building the scene graph, and in phase 2 a
 * model that fails to load and rethrows out of Suspense.
 *
 * WHAT IT DOES NOT CATCH — all three verified in a real browser, not assumed:
 *
 *   1. WebGL being unavailable. three.js throws "Error creating WebGL context"
 *      from R3F's renderer setup, which runs in an effect, not the render
 *      phase, so getDerivedStateFromError never fires. Observed: the page
 *      survived but produced two uncaught errors and no message. This is why
 *      CharacterCanvas probes for WebGL support up front instead of relying
 *      on this boundary.
 *
 *   2. Scene-graph throws, if the boundary is only placed OUTSIDE <Canvas>.
 *      R3F renders Canvas children into its own reconciler root, so a
 *      DOM-side boundary cannot see them. Observed: a scene throw unmounted
 *      the entire card. Hence the second, inner instance.
 *
 *   3. WebGL context loss after a successful mount, which fires a
 *      `webglcontextlost` DOM event rather than throwing. CharacterCanvas
 *      listens for that separately.
 *
 * Note that React 19 still re-reports a caught error to window.onerror for
 * observability, so seeing the error in the console does not mean the boundary
 * failed to handle it.
 */
export default class CanvasErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("[CharacterCanvas]", error);
    this.props.onError?.(
      "The 3D character could not be displayed, so your world is showing without it.",
    );
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
