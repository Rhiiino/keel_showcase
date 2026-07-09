// keel_web/src/modules/media/components/pickers/MediaImagePickerDialog.tsx

// Searchable modal for choosing one or more existing image media objects.

import type { MediaObject } from "../../api";
import { isImageMimeType } from "../../lib/media";
import { MediaObjectPickerDialog } from "./MediaObjectPickerDialog";

type MediaImagePickerDialogBaseProps = {
  open: boolean;
  title: string;
  selectLabel?: string;
  disabled?: boolean;
  onClose: () => void;
};

type MediaImagePickerDialogSingleProps = MediaImagePickerDialogBaseProps & {
  multiSelect?: false;
  onSelect: (media: MediaObject) => void;
};

type MediaImagePickerDialogMultiProps = MediaImagePickerDialogBaseProps & {
  multiSelect: true;
  onSelect: (media: MediaObject[]) => void;
};

export type MediaImagePickerDialogProps =
  | MediaImagePickerDialogSingleProps
  | MediaImagePickerDialogMultiProps;

function isPickerImageMedia(media: MediaObject): boolean {
  return media.media_kind === "image" || isImageMimeType(media.mime_type);
}

const IMAGE_PICKER_SEARCH_PLACEHOLDER = "Search images and folders…";
const IMAGE_PICKER_EMPTY_MESSAGE = "No matching images or folders.";

export function MediaImagePickerDialog(props: MediaImagePickerDialogProps) {
  const multiSelect = props.multiSelect === true;
  const description = multiSelect
    ? "Browse folders, select one or more images, then confirm."
    : "Browse folders and choose an image from Media.";
  const sharedProps = {
    open: props.open,
    title: props.title,
    selectLabel: props.selectLabel ?? "Select",
    disabled: props.disabled,
    onClose: props.onClose,
    mediaFilter: isPickerImageMedia,
    description,
    searchPlaceholder: IMAGE_PICKER_SEARCH_PLACEHOLDER,
    emptyMessage: IMAGE_PICKER_EMPTY_MESSAGE,
  };

  if (multiSelect) {
    return (
      <MediaObjectPickerDialog
        {...sharedProps}
        multiSelect
        onSelect={props.onSelect}
      />
    );
  }

  return <MediaObjectPickerDialog {...sharedProps} onSelect={props.onSelect} />;
}
