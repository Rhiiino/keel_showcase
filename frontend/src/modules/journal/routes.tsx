// keel_web/src/modules/journal/routes.tsx

import { Route } from "react-router-dom";

import { JournalModuleLayout } from "./JournalModuleLayout";
import { JournalCreatePage } from "./pages/JournalCreatePage";
import { JournalEntryPage } from "./pages/JournalEntryPage";
import { JournalPage } from "./pages/JournalPage";
import { JournalTagsPage } from "./pages/JournalTagsPage";

export const journalShellRoutes = (
  <Route path="journal" element={<JournalModuleLayout />}>
    <Route path="tags" element={<JournalTagsPage />} />
    <Route path="new" element={<JournalCreatePage />} />
    <Route path=":entryId" element={<JournalEntryPage />} />
    <Route index element={<JournalPage />} />
  </Route>
);
