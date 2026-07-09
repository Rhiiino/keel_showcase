// keel_web/src/modules/email/routes.tsx

import { Route } from "react-router-dom";

import { EmailModuleLayout } from "./EmailModuleLayout";
import { EmailAccountCreatePage } from "./pages/EmailAccountCreatePage";
import { EmailAccountDetailPage } from "./pages/EmailAccountDetailPage";
import { EmailAccountsPage } from "./pages/EmailAccountsPage";

export const emailShellRoutes = (
  <Route path="email" element={<EmailModuleLayout />}>
    <Route index element={<EmailAccountsPage />} />
    <Route path="new" element={<EmailAccountCreatePage />} />
    <Route path=":accountId" element={<EmailAccountDetailPage />} />
  </Route>
);
