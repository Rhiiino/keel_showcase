// keel_web/src/modules/finance/pages/FinanceTagsPage.tsx

import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { ModuleTabBar } from "../../../components/ModuleTabBar";

const TAG_TABS = [
  { id: "transactions", label: "Transaction tags", href: "/finance/tags/transactions" },
  { id: "obligations", label: "Obligation tags", href: "/finance/tags/obligations" },
] as const;

export function FinanceTagsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeId = location.pathname.includes("/obligations") ? "obligations" : "transactions";

  return (
    <div>
      <ModuleTabBar
        tabs={TAG_TABS.map(({ id, label }) => ({ id, label }))}
        activeId={activeId}
        onSelect={(id) => {
          const tab = TAG_TABS.find((entry) => entry.id === id);
          if (tab) {
            navigate(tab.href);
          }
        }}
        ariaLabel="Finance tag catalogs"
      />
      <Outlet />
    </div>
  );
}
