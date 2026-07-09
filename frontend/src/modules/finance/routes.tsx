// keel_web/src/modules/finance/routes.tsx

// Finance module routes rendered inside AppShell. Composed in app/routes.tsx.

import { Navigate, Route } from "react-router-dom";

import { FinanceModuleLayout } from "./FinanceModuleLayout";
import { FinanceAccountCreatePage } from "./pages/FinanceAccountCreatePage";
import { FinanceAccountPage } from "./pages/FinanceAccountPage";
import { FinanceAccountsPage } from "./pages/FinanceAccountsPage";
import { FinanceObligationTagsPage } from "./pages/FinanceObligationTagsPage";
import { FinanceSubscriptionCreatePage } from "./pages/FinanceSubscriptionCreatePage";
import { FinanceSubscriptionPage } from "./pages/FinanceSubscriptionPage";
import { FinanceSubscriptionsPage } from "./pages/FinanceSubscriptionsPage";
import { FinanceTagsPage } from "./pages/FinanceTagsPage";
import { FinanceTransactionCreatePage } from "./pages/FinanceTransactionCreatePage";
import { FinanceTransactionPage } from "./pages/FinanceTransactionPage";
import { FinanceTransactionTagsPage } from "./pages/FinanceTransactionTagsPage";
import { FinanceTransactionsPage } from "./pages/FinanceTransactionsPage";
import { FinanceVendorCreatePage } from "./pages/FinanceVendorCreatePage";
import { FinanceVendorPage } from "./pages/FinanceVendorPage";
import { FinanceVendorsPage } from "./pages/FinanceVendorsPage";

export const financeShellRoutes = (
  <Route path="finance" element={<FinanceModuleLayout />}>
    <Route index element={<Navigate to="transactions" replace />} />
    <Route path="transactions/new" element={<FinanceTransactionCreatePage />} />
    <Route path="transactions/:transactionId" element={<FinanceTransactionPage />} />
    <Route path="transactions" element={<FinanceTransactionsPage />} />
    <Route path="subscriptions/new" element={<FinanceSubscriptionCreatePage />} />
    <Route path="subscriptions/:obligationId" element={<FinanceSubscriptionPage />} />
    <Route path="subscriptions" element={<FinanceSubscriptionsPage />} />
    <Route path="vendors/new" element={<FinanceVendorCreatePage />} />
    <Route path="vendors/:vendorId" element={<FinanceVendorPage />} />
    <Route path="vendors" element={<FinanceVendorsPage />} />
    <Route path="accounts/new" element={<FinanceAccountCreatePage />} />
    <Route path="accounts/:paymentMethodId" element={<FinanceAccountPage />} />
    <Route path="accounts" element={<FinanceAccountsPage />} />
    <Route path="tags" element={<FinanceTagsPage />}>
      <Route index element={<Navigate to="transactions" replace />} />
      <Route path="transactions" element={<FinanceTransactionTagsPage />} />
      <Route path="obligations" element={<FinanceObligationTagsPage />} />
    </Route>
  </Route>
);
