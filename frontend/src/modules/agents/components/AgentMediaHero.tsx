// stack_sandbox/frontend_web/src/modules/agents/components/AgentMediaHero.tsx

// Clickable agent portrait or 3D model preview with media library / device upload.

import { useRef, useState } from "react";

import {
  fetchMediaBlob,
  type MediaObject,
} from "../../media/api";
import {
  MediaImagePickerDialog,
  MediaObjectPickerDialog,
  MediaSourceChoiceDialog,
  type MediaSourceChoiceAnchor,
} from "../../media/components/pickers";
import type { AgentSummary } from "../api";
import {
  orchestratorPortraitSrc,
  subagentModelSrc,
  subagentPortraitSrc,
} from "../lib/agentDisplay";
import { AgentModelViewer } from "./AgentModelViewer";

const TILE_IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
const MODEL_3D_ACCEPT = ".glb,model/gltf-binary";

type AgentMediaHeroProps = {
  agent: AgentSummary;
  editable: boolean;
  tilePreviewUrl?: string | null;
  model3dPreviewUrl?: string | null;
  onTileImageChange?: (file: File | null) => void;
  onModel3dChange?: (file: File | null) => void;
};

function isGlbMedia(media: MediaObject): boolean {
  if (media.media_kind === "model_3d") {
    return true;
  }
  const filename = media.original_filename.toLowerCase();
  return filename.endsWith(".glb");
}

async function mediaObjectToFile(media: MediaObject): Promise<File> {
  const blob = await fetchMediaBlob(media.id);
  const filename = media.original_filename.trim() || "media";
  return new File([blob], filename, {
    type: media.mime_type || blob.type || "application/octet-stream",
  });
}

function StaticPortrait({
  agent,
  portraitSrc,
}: {
  agent: AgentSummary;
  portraitSrc: string;
}) {
  return (
    <div
      className="flex h-64 w-56 shrink-0 items-center justify-center"
      aria-hidden
    >
      <div
        className={[
          "flex h-44 w-44 items-center justify-center rounded-2xl",
          agent.is_orchestrator
            ? "border border-lime-400/20 bg-stone-950/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.35)]"
            : "border border-stone-700/60 bg-stone-950/50 shadow-[0_8px_24px_rgba(0,0,0,0.35)]",
        ].join(" ")}
      >
        <img
          src={portraitSrc}
          alt=""
          className="h-32 w-32 object-contain drop-shadow-md"
        />
      </div>
    </div>
  );
}

export function AgentMediaHero({
  agent,
  editable,
  tilePreviewUrl = null,
  model3dPreviewUrl = null,
  onTileImageChange,
  onModel3dChange,
}: AgentMediaHeroProps) {
  const tileInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [sourceDialogAnchor, setSourceDialogAnchor] =
    useState<MediaSourceChoiceAnchor | null>(null);
  const [sourceTarget, setSourceTarget] = useState<"tile" | "model">("tile");
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);

  const portraitSrc =
    tilePreviewUrl ??
    (agent.is_orchestrator
      ? orchestratorPortraitSrc(agent)
      : subagentPortraitSrc(agent.id, agent.media));

  const modelSrc =
    model3dPreviewUrl ?? subagentModelSrc(agent.id, agent.media);

  const openSourceMenu = (
    event: React.MouseEvent<HTMLElement>,
    target: "tile" | "model",
  ) => {
    if (!editable) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setSourceTarget(target);
    setSourceDialogAnchor({ x: rect.left, y: rect.bottom + 4 });
    setSourceDialogOpen(true);
  };

  const openFilePicker = () => {
    setSourceDialogOpen(false);
    if (sourceTarget === "tile") {
      tileInputRef.current?.click();
    } else {
      modelInputRef.current?.click();
    }
  };

  const openMediaPicker = () => {
    setSourceDialogOpen(false);
    if (sourceTarget === "tile") {
      setImagePickerOpen(true);
    } else {
      setModelPickerOpen(true);
    }
  };

  const handleTileFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    onTileImageChange?.(file);
  };

  const handleModelFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    onModel3dChange?.(file);
  };

  const handleImageMediaSelected = async (media: MediaObject) => {
    setImagePickerOpen(false);
    try {
      const file = await mediaObjectToFile(media);
      onTileImageChange?.(file);
    } catch {
      // Ignore — parent save flow surfaces API errors.
    }
  };

  const handleModelMediaSelected = async (media: MediaObject) => {
    setModelPickerOpen(false);
    try {
      const file = await mediaObjectToFile(media);
      onModel3dChange?.(file);
    } catch {
      // Ignore — parent save flow surfaces API errors.
    }
  };

  const chooseLabel =
    sourceTarget === "tile" ? "Update portrait" : "Update 3D model";

  if (modelSrc) {
    return (
      <>
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            disabled={!editable}
            onClick={(event) => openSourceMenu(event, "model")}
            title={editable ? chooseLabel : undefined}
            aria-label={editable ? chooseLabel : undefined}
            className={[
              "relative shrink-0 rounded-2xl transition",
              editable
                ? "cursor-pointer hover:ring-2 hover:ring-lime-400/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400/40"
                : "cursor-default",
            ].join(" ")}
          >
            <AgentModelViewer
              agentId={agent.id}
              src={modelSrc}
              placeholderSrc={portraitSrc}
              className="h-64 w-56"
            />
          </button>
          {editable ? (
            <button
              type="button"
              onClick={(event) => openSourceMenu(event, "tile")}
              className="text-xs text-stone-500 transition hover:text-stone-300"
            >
              Update portrait
            </button>
          ) : null}
        </div>

        <input
          ref={tileInputRef}
          type="file"
          accept={TILE_IMAGE_ACCEPT}
          className="hidden"
          onChange={handleTileFileChange}
        />
        <input
          ref={modelInputRef}
          type="file"
          accept={MODEL_3D_ACCEPT}
          className="hidden"
          onChange={handleModelFileChange}
        />

        <MediaSourceChoiceDialog
          open={sourceDialogOpen}
          title={chooseLabel}
          anchor={sourceDialogAnchor}
          onSelectFromMedia={openMediaPicker}
          onUpload={openFilePicker}
          onClose={() => setSourceDialogOpen(false)}
        />
        <MediaImagePickerDialog
          open={imagePickerOpen}
          title="Choose portrait"
          onClose={() => setImagePickerOpen(false)}
          onSelect={handleImageMediaSelected}
        />
        <MediaObjectPickerDialog
          open={modelPickerOpen}
          title="Choose 3D model"
          description="Browse folders and choose a GLB model from Media."
          searchPlaceholder="Search models and folders…"
          emptyMessage="No matching GLB files or folders."
          mediaFilter={isGlbMedia}
          onClose={() => setModelPickerOpen(false)}
          onSelect={handleModelMediaSelected}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          disabled={!editable}
          onClick={(event) => openSourceMenu(event, "tile")}
          title={editable ? "Update portrait" : undefined}
          aria-label={editable ? "Update portrait" : undefined}
          className={[
            "relative shrink-0 transition",
            editable
              ? "cursor-pointer rounded-2xl hover:ring-2 hover:ring-lime-400/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400/40"
              : "cursor-default",
          ].join(" ")}
        >
          <StaticPortrait agent={agent} portraitSrc={portraitSrc} />
        </button>
        {editable ? (
          <button
            type="button"
            onClick={(event) => openSourceMenu(event, "model")}
            className="text-xs text-stone-500 transition hover:text-stone-300"
          >
            Add 3D model
          </button>
        ) : null}
      </div>

      <input
        ref={tileInputRef}
        type="file"
        accept={TILE_IMAGE_ACCEPT}
        className="hidden"
        onChange={handleTileFileChange}
      />
      <input
        ref={modelInputRef}
        type="file"
        accept={MODEL_3D_ACCEPT}
        className="hidden"
        onChange={handleModelFileChange}
      />

      <MediaSourceChoiceDialog
        open={sourceDialogOpen}
        title={chooseLabel}
        anchor={sourceDialogAnchor}
        onSelectFromMedia={openMediaPicker}
        onUpload={openFilePicker}
        onClose={() => setSourceDialogOpen(false)}
      />
      <MediaImagePickerDialog
        open={imagePickerOpen}
        title="Choose portrait"
        onClose={() => setImagePickerOpen(false)}
        onSelect={handleImageMediaSelected}
      />
      <MediaObjectPickerDialog
        open={modelPickerOpen}
        title="Choose 3D model"
        description="Browse folders and choose a GLB model from Media."
        searchPlaceholder="Search models and folders…"
        emptyMessage="No matching GLB files or folders."
        mediaFilter={isGlbMedia}
        onClose={() => setModelPickerOpen(false)}
        onSelect={handleModelMediaSelected}
      />
    </>
  );
}
