// keel_web/src/modules/media/components/forms/MediaFormVideoPreview.tsx

// Form preview for video files with play, pause, and timeline controls.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { useMediaBlobObjectUrl } from "../../hooks/useMediaBlobObjectUrl";

type MediaFormVideoPreviewProps = {
  localSrcUrl?: string | null;
  remoteMediaId?: string;
  mimeType: string;
  alt: string;
  copyButton?: ReactNode;
  replaceInteractive?: {
    onReplace: () => void;
    label: string;
    hasContent: boolean;
  };
};

function formatPlaybackTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return "0:00";
  }

  const rounded = Math.floor(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  const paddedSeconds = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`;
  }

  return `${minutes}:${paddedSeconds}`;
}

function PlayIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10.04-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

function PauseIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M7 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7Zm8 0a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2Z" />
    </svg>
  );
}

function PlusIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CameraIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 13a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
  );
}



// ----- Playback controls
function MediaFormVideoControls({
  isPlaying,
  currentTime,
  duration,
  disabled,
  onTogglePlay,
  onSeek,
  onScrubStart,
  onScrubEnd,
}: {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  disabled: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
}) {
  const sliderMax = duration > 0 ? duration : 0;
  const sliderValue = duration > 0 ? Math.min(currentTime, duration) : 0;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
      <button
        type="button"
        disabled={disabled}
        onClick={onTogglePlay}
        aria-label={isPlaying ? "Pause video" : "Play video"}
        title={isPlaying ? "Pause" : "Play"}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/[0.12] bg-white/[0.06] text-stone-100 transition hover:border-sky-400/35 hover:bg-white/[0.1] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <input
        type="range"
        min={0}
        max={sliderMax}
        step={0.1}
        value={sliderValue}
        disabled={disabled || duration <= 0}
        onChange={(event) => onSeek(Number.parseFloat(event.target.value))}
        onPointerDown={onScrubStart}
        onPointerUp={onScrubEnd}
        onPointerCancel={onScrubEnd}
        aria-label="Video timeline"
        className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-stone-800 accent-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
      />

      <span className="w-[5.5rem] shrink-0 text-right text-[11px] tabular-nums text-stone-400">
        {formatPlaybackTime(currentTime)} / {formatPlaybackTime(duration)}
      </span>
    </div>
  );
}



// ----- Form video preview
export function MediaFormVideoPreview({
  localSrcUrl = null,
  remoteMediaId,
  mimeType,
  alt,
  copyButton,
  replaceInteractive,
}: MediaFormVideoPreviewProps) {
  const { srcUrl, isLoading, isError } = useMediaBlobObjectUrl(
    remoteMediaId,
    mimeType,
    localSrcUrl,
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const isScrubbingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const playbackDisabled = loadFailed || isError;
  const showLoading = isLoading && !localSrcUrl;

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    isScrubbingRef.current = false;
    setLoadFailed(false);
  }, [srcUrl]);

  const handleTogglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || playbackDisabled || !srcUrl) {
      return;
    }

    if (video.paused) {
      try {
        await video.play();
      } catch {
        // Ignore play interruptions from browser autoplay policies.
      }
      return;
    }

    video.pause();
  }, [playbackDisabled, srcUrl]);

  const handleSeek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.currentTime = time;
    setCurrentTime(time);
  }, []);

  const previewFrame = (
    <div className="overflow-hidden aspect-[16/10] w-full rounded-2xl bg-stone-900/70 ring-1 ring-white/[0.08]">
      {showLoading ? (
        <div className="flex h-full items-center justify-center text-sm text-stone-500">
          Loading video…
        </div>
      ) : playbackDisabled || !srcUrl ? (
        <div className="flex h-full items-center justify-center text-sm text-stone-500">
          Could not load video
        </div>
      ) : (
        <video
          ref={videoRef}
          src={srcUrl}
          aria-label={alt}
          playsInline
          preload="metadata"
          className="h-full w-full object-contain bg-black"
          onLoadedMetadata={(event) => {
            setDuration(event.currentTarget.duration);
            setCurrentTime(event.currentTarget.currentTime);
          }}
          onTimeUpdate={(event) => {
            if (!isScrubbingRef.current) {
              setCurrentTime(event.currentTarget.currentTime);
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onError={() => setLoadFailed(true)}
        />
      )}
    </div>
  );

  const previewWithReplace = replaceInteractive ? (
    <div
      role="button"
      tabIndex={0}
      onClick={replaceInteractive.onReplace}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          replaceInteractive.onReplace();
        }
      }}
      aria-label={replaceInteractive.label}
      title={replaceInteractive.label}
      className={[
        "group relative block w-full rounded-2xl text-left transition duration-200",
        "cursor-pointer hover:ring-2 hover:ring-sky-300/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/50",
      ].join(" ")}
    >
      <div
        className={[
          "transition duration-200",
          replaceInteractive.hasContent ? "group-hover:brightness-[0.72]" : "",
        ].join(" ")}
      >
        {previewFrame}
      </div>

      <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-stone-950/35 text-white opacity-0 transition duration-200 group-hover:opacity-100">
        {replaceInteractive.hasContent ? (
          <CameraIcon className="h-8 w-8 drop-shadow-sm" />
        ) : (
          <PlusIcon className="h-9 w-9 drop-shadow-sm" />
        )}
      </span>
    </div>
  ) : (
    previewFrame
  );

  return (
    <div className="max-w-xl space-y-2">
      <MediaFormVideoControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        disabled={playbackDisabled || showLoading || !srcUrl}
        onTogglePlay={() => void handleTogglePlay()}
        onSeek={handleSeek}
        onScrubStart={() => {
          isScrubbingRef.current = true;
        }}
        onScrubEnd={() => {
          isScrubbingRef.current = false;
        }}
      />

      <div className="relative">
        {previewWithReplace}
        {copyButton}
      </div>
    </div>
  );
}
