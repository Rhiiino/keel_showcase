// keel_web/src/app/shell/globalMediaPasteRoutes.ts

// Route helpers for the app-wide media paste upload dialog.

export function isProjectWorkspacePath(pathname: string): boolean {
  return /^\/projects\/\d+\/workspace(?:\/\d+)?$/.test(pathname);
}

/** Pages that register their own window paste handler instead of the global dialog. */
export function shouldUseGlobalMediaPaste(pathname: string): boolean {
  return !isProjectWorkspacePath(pathname);
}

/** Whether the route is inside the media module (`/media` and nested paths). */
export function isMediaModulePath(pathname: string): boolean {
  return pathname === "/media" || pathname.startsWith("/media/");
}

/** Current media library folder from `/media/folders/:folderId`, or null at root. */
export function mediaFolderIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/media\/folders\/([^/]+)/);
  return match?.[1] ?? null;
}
