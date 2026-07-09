// keel_web/src/modules/timeline/pages/TimelinePlansPage.tsx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { IconPlusButton } from "../../../components/buttons/IconPlusButton";
import { RouteNoticeBanner } from "../../../components/RouteNoticeBanner";
import { ListPageLayout } from "../../../views/list/ListPageLayout";
import { TimelinePlansListView } from "../components/plans/TimelinePlansListView";
import { deleteTimelinePlan, fetchTimelinePlans, timelineQueryKeys } from "../api";

export function TimelinePlansPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const plansQuery = useQuery({
    queryKey: timelineQueryKeys.plans(),
    queryFn: () => fetchTimelinePlans(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTimelinePlan,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineQueryKeys.all });
    },
  });

  return (
    <ListPageLayout
      title="Plan"
      recordCount={plansQuery.data?.length}
      subtitle="Forward-looking schedules for upcoming days and weeks."
      actions={
        <IconPlusButton
          onClick={() => navigate("/timeline/plan/new")}
          ariaLabel="New timeline plan"
        />
      }
    >
      <RouteNoticeBanner />
      {plansQuery.isLoading ? (
        <p className="text-sm text-stone-500">Loading plans…</p>
      ) : null}
      {plansQuery.isError ? (
        <p className="text-sm text-red-400">Failed to load plans.</p>
      ) : null}
      {plansQuery.data ? (
        <TimelinePlansListView
          plans={plansQuery.data}
          onDelete={(planId) => deleteMutation.mutate(planId)}
          deleteDisabled={deleteMutation.isPending}
        />
      ) : null}
    </ListPageLayout>
  );
}
