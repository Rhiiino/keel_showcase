// keel_web/src/modules/services/pages/ServicesPage.tsx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { IconPlusButton } from "../../../components/buttons/IconPlusButton";
import { RouteNoticeBanner } from "../../../components/RouteNoticeBanner";
import { ListPageLayout } from "../../../views/list/ListPageLayout";
import { ApiError } from "../../../lib/api";
import {
  checkServiceNow,
  deleteService,
  fetchServices,
  servicesQueryKeys,
} from "../api";
import { ServicesListView } from "../components/ServicesListView";

export function ServicesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [checkingServiceId, setCheckingServiceId] = useState<number | null>(null);

  const servicesQuery = useQuery({
    queryKey: servicesQueryKeys.list(),
    queryFn: fetchServices,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.all });
    },
  });

  const checkMutation = useMutation({
    mutationFn: (serviceId: number) => checkServiceNow(serviceId),
    onMutate: (serviceId) => {
      setCheckingServiceId(serviceId);
    },
    onSettled: () => {
      setCheckingServiceId(null);
      void queryClient.invalidateQueries({ queryKey: servicesQueryKeys.all });
    },
  });

  const services = servicesQuery.data ?? [];

  const actionError =
    deleteMutation.isError || checkMutation.isError
      ? (() => {
          const error = deleteMutation.error ?? checkMutation.error;
          if (error instanceof ApiError) {
            return error.message;
          }
          if (error instanceof Error) {
            return error.message;
          }
          return "Something went wrong.";
        })()
      : null;

  return (
    <ListPageLayout
      title="Services"
      recordCount={services.length}
      subtitle="Monitor application URLs and track up, caution, and down status."
      actions={
        <IconPlusButton
          ariaLabel="Add service"
          onClick={() => navigate("/services/new")}
        />
      }
    >
      <RouteNoticeBanner />
      {servicesQuery.isLoading ? (
        <p className="text-sm text-stone-500">Loading services…</p>
      ) : null}
      {servicesQuery.isError ? (
        <p className="text-sm text-red-400">
          {servicesQuery.error instanceof ApiError
            ? servicesQuery.error.message
            : "Failed to load services."}
        </p>
      ) : null}
      {actionError ? <p className="text-sm text-red-400">{actionError}</p> : null}

      {servicesQuery.data ? (
        <ServicesListView
          services={services}
          onDelete={(serviceId) => deleteMutation.mutate(serviceId)}
          onCheckNow={(serviceId) => checkMutation.mutate(serviceId)}
          deleteDisabled={deleteMutation.isPending}
          checkDisabled={checkMutation.isPending}
          checkingServiceId={checkingServiceId}
          paginationResetKey={services.length}
        />
      ) : null}
    </ListPageLayout>
  );
}
