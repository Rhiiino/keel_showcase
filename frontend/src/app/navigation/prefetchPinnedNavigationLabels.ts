// keel_web/src/app/navigation/prefetchPinnedNavigationLabels.ts

// Prefetches record data for pinned breadcrumb paths so labels can resolve after
// a full page refresh even when the user is on a different route.

import type { QueryClient } from "@tanstack/react-query";

import { agentsQueryKeys, fetchAgents } from "../../modules/agents/api";
import { coakQueryKeys, fetchCoakRecord } from "../../modules/coak/api";
import {
  contactsQueryKeys,
  fetchContact,
  fetchFamilyGroup,
} from "../../modules/people/contacts/api";
import { fetchFigure, figuresQueryKeys } from "../../modules/people/figures/api";
import { emailQueryKeys, fetchEmailAccount } from "../../modules/email/api";
import { fetchFocusList, focusQueryKeys } from "../../modules/focus/api";
import { fetchJobSchedule, jobsQueryKeys } from "../../modules/jobs/api";
import { fetchJournalEntry, journalQueryKeys } from "../../modules/journal/api";
import {
  fetchMediaFolderContents,
  fetchMediaMetadata,
  fetchMediaPanel,
  mediaQueryKeys,
} from "../../modules/media/api";
import { fetchProject, projectsQueryKeys } from "../../modules/projects/api";
import { fetchService, servicesQueryKeys } from "../../modules/services/api";
import {
  fetchFinanceObligation,
  fetchFinancePaymentMethod,
  fetchFinanceTransaction,
  fetchFinanceVendor,
  financeQueryKeys,
} from "../../modules/finance/api";
import { fetchTimelineEvent, timelineQueryKeys } from "../../modules/timeline/api";
import type { PinnedBreadcrumb } from "./breadcrumbPins";

function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function prefetchRecordLabel(
  queryClient: QueryClient,
  pathname: string,
  search: string,
): void {
  const agentId = new URLSearchParams(search).get("agent");
  if (pathname === "/agents" && agentId) {
    void queryClient.prefetchQuery({
      queryKey: agentsQueryKeys.catalog(),
      queryFn: fetchAgents,
    });
    return;
  }

  const focusListMatch = pathname.match(/^\/focus\/lists\/(\d+)$/);
  if (focusListMatch) {
    const listId = parsePositiveInt(focusListMatch[1] ?? "");
    if (listId !== null) {
      void queryClient.prefetchQuery({
        queryKey: focusQueryKeys.list(listId),
        queryFn: () => fetchFocusList(listId),
      });
    }
    return;
  }

  const coakRecordMatch = pathname.match(/^\/coak\/(\d+)$/);
  if (coakRecordMatch) {
    const recordId = parsePositiveInt(coakRecordMatch[1] ?? "");
    if (recordId !== null) {
      void queryClient.prefetchQuery({
        queryKey: coakQueryKeys.record(recordId),
        queryFn: () => fetchCoakRecord(recordId),
      });
    }
    return;
  }

  const projectMatch = pathname.match(/^\/projects\/(\d+)$/);
  if (projectMatch) {
    const projectId = parsePositiveInt(projectMatch[1] ?? "");
    if (projectId !== null) {
      void queryClient.prefetchQuery({
        queryKey: projectsQueryKeys.detail(projectId),
        queryFn: () => fetchProject(projectId),
      });
    }
    return;
  }

  const mediaFolderMatch = pathname.match(/^\/media\/folders\/([^/]+)$/);
  if (mediaFolderMatch) {
    const folderId = mediaFolderMatch[1] ?? "";
    void queryClient.prefetchQuery({
      queryKey: mediaQueryKeys.contents(folderId),
      queryFn: () => fetchMediaFolderContents(folderId),
    });
    return;
  }

  const mediaPanelMatch = pathname.match(/^\/media\/panels\/([^/]+)$/);
  if (mediaPanelMatch) {
    const panelId = mediaPanelMatch[1] ?? "";
    void queryClient.prefetchQuery({
      queryKey: mediaQueryKeys.panel(panelId),
      queryFn: () => fetchMediaPanel(panelId),
    });
    return;
  }

  const mediaDetailMatch = pathname.match(/^\/media\/([^/]+)$/);
  if (mediaDetailMatch) {
    const mediaId = mediaDetailMatch[1] ?? "";
    void queryClient.prefetchQuery({
      queryKey: mediaQueryKeys.detail(mediaId),
      queryFn: () => fetchMediaMetadata(mediaId),
    });
    return;
  }

  const familyGroupMatch = pathname.match(
    /^\/(?:people\/)?contacts\/family-groups\/([^/]+)$/,
  );
  if (familyGroupMatch) {
    const familyKey = familyGroupMatch[1] ?? "";
    void queryClient.prefetchQuery({
      queryKey: contactsQueryKeys.familyGroup(familyKey),
      queryFn: () => fetchFamilyGroup(familyKey),
    });
    return;
  }

  const contactMatch = pathname.match(/^\/(?:people\/)?contacts\/(\d+)$/);
  if (contactMatch) {
    const contactId = parsePositiveInt(contactMatch[1] ?? "");
    if (contactId !== null) {
      void queryClient.prefetchQuery({
        queryKey: contactsQueryKeys.detail(contactId),
        queryFn: () => fetchContact(contactId),
      });
    }
    return;
  }

  const figureMatch = pathname.match(/^\/people\/figures\/(\d+)$/);
  if (figureMatch) {
    const figureId = parsePositiveInt(figureMatch[1] ?? "");
    if (figureId !== null) {
      void queryClient.prefetchQuery({
        queryKey: figuresQueryKeys.detail(figureId),
        queryFn: () => fetchFigure(figureId),
      });
    }
    return;
  }

  const timelineEventMatch = pathname.match(/^\/timeline\/(\d+)$/);
  if (timelineEventMatch) {
    const eventId = parsePositiveInt(timelineEventMatch[1] ?? "");
    if (eventId !== null) {
      void queryClient.prefetchQuery({
        queryKey: timelineQueryKeys.detail(eventId),
        queryFn: () => fetchTimelineEvent(eventId),
      });
    }
    return;
  }

  const journalEntryMatch = pathname.match(/^\/journal\/(\d+)$/);
  if (journalEntryMatch) {
    const entryId = parsePositiveInt(journalEntryMatch[1] ?? "");
    if (entryId !== null) {
      void queryClient.prefetchQuery({
        queryKey: journalQueryKeys.detail(entryId),
        queryFn: () => fetchJournalEntry(entryId),
      });
    }
    return;
  }

  const jobScheduleMatch = pathname.match(/^\/jobs\/schedules\/([^/]+)$/);
  if (jobScheduleMatch) {
    const scheduleId = jobScheduleMatch[1] ?? "";
    void queryClient.prefetchQuery({
      queryKey: jobsQueryKeys.schedule(scheduleId),
      queryFn: () => fetchJobSchedule(scheduleId),
    });
    return;
  }

  const serviceMatch = pathname.match(/^\/services\/(\d+)$/);
  if (serviceMatch) {
    const serviceId = parsePositiveInt(serviceMatch[1] ?? "");
    if (serviceId !== null) {
      void queryClient.prefetchQuery({
        queryKey: servicesQueryKeys.detail(serviceId),
        queryFn: () => fetchService(serviceId),
      });
    }
    return;
  }

  const financeVendorMatch = pathname.match(/^\/finance\/vendors\/(\d+)$/);
  if (financeVendorMatch) {
    const vendorId = parsePositiveInt(financeVendorMatch[1] ?? "");
    if (vendorId !== null) {
      void queryClient.prefetchQuery({
        queryKey: financeQueryKeys.vendor(vendorId),
        queryFn: () => fetchFinanceVendor(vendorId),
      });
    }
    return;
  }

  const financeObligationMatch = pathname.match(/^\/finance\/subscriptions\/(\d+)$/);
  if (financeObligationMatch) {
    const obligationId = parsePositiveInt(financeObligationMatch[1] ?? "");
    if (obligationId !== null) {
      void queryClient.prefetchQuery({
        queryKey: financeQueryKeys.obligation(obligationId),
        queryFn: () => fetchFinanceObligation(obligationId),
      });
    }
    return;
  }

  const financeAccountMatch = pathname.match(/^\/finance\/accounts\/(\d+)$/);
  if (financeAccountMatch) {
    const paymentMethodId = parsePositiveInt(financeAccountMatch[1] ?? "");
    if (paymentMethodId !== null) {
      void queryClient.prefetchQuery({
        queryKey: financeQueryKeys.paymentMethod(paymentMethodId),
        queryFn: () => fetchFinancePaymentMethod(paymentMethodId),
      });
    }
    return;
  }

  const financeTransactionMatch = pathname.match(/^\/finance\/transactions\/(\d+)$/);
  if (financeTransactionMatch) {
    const transactionId = parsePositiveInt(financeTransactionMatch[1] ?? "");
    if (transactionId !== null) {
      void queryClient.prefetchQuery({
        queryKey: financeQueryKeys.transaction(transactionId),
        queryFn: () => fetchFinanceTransaction(transactionId),
      });
    }
    return;
  }

  const emailAccountMatch = pathname.match(/^\/email\/(\d+)$/);
  if (emailAccountMatch) {
    const accountId = parsePositiveInt(emailAccountMatch[1] ?? "");
    if (accountId !== null) {
      void queryClient.prefetchQuery({
        queryKey: emailQueryKeys.detail(accountId),
        queryFn: () => fetchEmailAccount(accountId),
      });
    }
  }
}

export function prefetchPinnedNavigationLabels(
  queryClient: QueryClient,
  pins: readonly PinnedBreadcrumb[],
): void {
  for (const pin of pins) {
    prefetchRecordLabel(queryClient, pin.pathname, pin.search);
  }
}
