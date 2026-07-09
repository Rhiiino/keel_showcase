// keel_web/src/modules/projects/lib/workspace/note/workspaceNoteRefRemark.ts

// Markdown preprocessing for workspace note wiki-link tokens.

export {
  preprocessWorkspaceNoteRefs as applyWorkspaceNoteRefMarkdown,
  isWorkspaceNoteRefHref,
  noteIdFromRefHref,
  WORKSPACE_NOTE_REF_HREF_PREFIX,
} from "./workspaceNoteRefSyntax";
