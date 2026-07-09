// keel_web/src/modules/auth/components/login/scatter/LoginScatterSpot.tsx

import { useEffect, useMemo } from "react";

import { KeelPersonaPlayer } from "../../../../../components/keelPersona";
import { useKeelClipMediaReady } from "../../../../../hooks/keelPersona";
import {
  LOGIN_SCATTER_PERSONA_SIZE_PX,
  LOGIN_SCATTER_TELEPORT_MS,
  type LoginScatterQuadrant,
} from "../../../lib/loginScatterPlacement";
import { LoginScatterClipDescriptor } from "./LoginScatterClipDescriptor";

export type LoginScatterSpotPhase = "entering" | "playing" | "teleporting-out";

export type LoginScatterSpotState = {
  key: number;
  clipId: string;
  quadrant: LoginScatterQuadrant;
  x: number;
  y: number;
  phase: LoginScatterSpotPhase;
};

type LoginScatterSpotProps = {
  spot: LoginScatterSpotState;
  viewportWidth: number;
  onEnterComplete: (key: number) => void;
  onPlayStart: (key: number) => void;
};

export function LoginScatterSpot({
  spot,
  viewportWidth,
  onEnterComplete,
  onPlayStart,
}: LoginScatterSpotProps) {
  const mediaReady = useKeelClipMediaReady(spot.clipId, true);
  const captionOnLeft = spot.x > viewportWidth / 2;

  const clusterClassName = useMemo(
    () =>
      [
        "login-scatter-spot-cluster flex items-center gap-3",
        captionOnLeft ? "flex-row-reverse" : "flex-row",
      ].join(" "),
    [captionOnLeft],
  );

  useEffect(() => {
    if (spot.phase !== "entering") {
      return;
    }

    const timerId = window.setTimeout(() => {
      onEnterComplete(spot.key);
    }, LOGIN_SCATTER_TELEPORT_MS);

    return () => window.clearTimeout(timerId);
  }, [onEnterComplete, spot.key, spot.phase]);

  useEffect(() => {
    if (spot.phase !== "playing" || !mediaReady) {
      return;
    }

    onPlayStart(spot.key);
  }, [mediaReady, onPlayStart, spot.key, spot.phase]);

  const spotPhaseClass =
    spot.phase === "entering"
      ? "login-scatter-spot--entering"
      : spot.phase === "teleporting-out"
        ? "login-scatter-spot--teleporting-out"
        : "login-scatter-spot--playing";

  return (
    <div
      className={`login-scatter-spot pointer-events-none absolute ${spotPhaseClass}`}
      style={{ left: spot.x, top: spot.y }}
      aria-hidden
    >
      <div className={clusterClassName}>
        {mediaReady ? (
          <KeelPersonaPlayer
            clipId={spot.clipId}
            size={LOGIN_SCATTER_PERSONA_SIZE_PX}
            waitForMedia
            mediaReady={mediaReady}
            loadingPlayback={true}
            showCaption={false}
          />
        ) : null}
        {mediaReady ? <LoginScatterClipDescriptor clipId={spot.clipId} /> : null}
      </div>
    </div>
  );
}
