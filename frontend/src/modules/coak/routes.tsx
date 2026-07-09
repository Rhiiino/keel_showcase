// keel_web/src/modules/coak/routes.tsx

import { Route } from "react-router-dom";

import { CoakRecordPage } from "./pages/CoakRecordPage";
import { CoakRecordsPage } from "./pages/CoakRecordsPage";

export const coakShellRoutes = (
  <>
    <Route path="coak" element={<CoakRecordsPage />} />
    <Route path="coak/:recordId" element={<CoakRecordPage />} />
  </>
);
