// keel_web/src/app/navigation/buildNavigationLabelContext.ts

// Builds breadcrumb label lookups from the React Query cache.

import type { QueryClient } from "@tanstack/react-query";

import { agentsQueryKeys, type AgentSummary } from "../../modules/agents/api";
import { coakQueryKeys, type CoakRecord } from "../../modules/coak/api";
import {
  contactsQueryKeys,
  formatContactName,
  type Contact,
  type FamilyGroupDetail,
} from "../../modules/people/contacts/api";
import {
  figuresQueryKeys,
  formatFigureName,
  type Figure,
} from "../../modules/people/figures/api";
import { emailQueryKeys, type EmailAccount } from "../../modules/email/api";
import { emailAccountDisplayName } from "../../modules/email/lib/emailDisplay";
import { focusQueryKeys, type FocusList } from "../../modules/focus/api";
import { jobsQueryKeys, type JobSchedule } from "../../modules/jobs/api";
import {
  formatJournalEntryDate,
  truncateJournalPreview,
} from "../../modules/journal/lib/journalDisplay";
import { journalQueryKeys, type JournalEntry } from "../../modules/journal/api";
import {
  mediaQueryKeys,
  type MediaFolderContents,
  type MediaObject,
  type MediaPanelDetail,
} from "../../modules/media/api";
import { projectsQueryKeys, type Project } from "../../modules/projects/api";
import { servicesQueryKeys, type Service } from "../../modules/services/api";
import {
  financeQueryKeys,
  type FinanceObligation,
  type FinancePaymentMethod,
  type FinanceTransaction,
  type FinanceVendor,
} from "../../modules/finance/api";
import { timelineCalendarEventTitle } from "../../modules/timeline/lib/timelineCalendarEvents";
import { timelineQueryKeys, type TimelineEvent } from "../../modules/timeline/api";
import type { NavigationLabelContext } from "./navigationStackTypes";

export function buildNavigationLabelContext(
  queryClient: QueryClient,
): NavigationLabelContext {
  return {
    getProjectTitle: (projectId) => {
      const project = queryClient.getQueryData<Project>(
        projectsQueryKeys.detail(projectId),
      );
      return project?.title;
    },
    getAgentDisplayName: (agentId) => {
      const agents = queryClient.getQueryData<AgentSummary[]>(
        agentsQueryKeys.catalog(),
      );
      return agents?.find((agent) => agent.id === agentId)?.display_name;
    },
    getMediaFilename: (mediaId) => {
      const media = queryClient.getQueryData<MediaObject>(
        mediaQueryKeys.detail(mediaId),
      );
      return media?.original_filename;
    },
    getMediaFolderName: (folderId) => {
      const contents = queryClient.getQueryData<MediaFolderContents>(
        mediaQueryKeys.contents(folderId),
      );
      if (contents?.folder?.name) {
        return contents.folder.name;
      }
      return contents?.breadcrumbs.find((folder) => folder.id === folderId)?.name;
    },
    getMediaPanelName: (panelId) => {
      const panel = queryClient.getQueryData<MediaPanelDetail>(
        mediaQueryKeys.panel(panelId),
      );
      return panel?.name;
    },
    getContactName: (contactId) => {
      const contact = queryClient.getQueryData<Contact>(
        contactsQueryKeys.detail(contactId),
      );
      return contact ? formatContactName(contact) : undefined;
    },
    getFigureName: (figureId) => {
      const figure = queryClient.getQueryData<Figure>(
        figuresQueryKeys.detail(figureId),
      );
      return figure ? formatFigureName(figure) : undefined;
    },
    getFamilyGroupName: (familyKey) => {
      const group = queryClient.getQueryData<FamilyGroupDetail>(
        contactsQueryKeys.familyGroup(familyKey),
      );
      return group?.name;
    },
    getCoakRecordName: (recordId) => {
      const record = queryClient.getQueryData<CoakRecord>(
        coakQueryKeys.record(recordId),
      );
      return record?.name;
    },
    getEmailAccountName: (accountId) => {
      const account = queryClient.getQueryData<EmailAccount>(
        emailQueryKeys.detail(accountId),
      );
      return account ? emailAccountDisplayName(account) : undefined;
    },
    getFinanceTransactionTitle: (transactionId) => {
      const transaction = queryClient.getQueryData<FinanceTransaction>(
        financeQueryKeys.transaction(transactionId),
      );
      return transaction?.title;
    },
    getFinanceVendorName: (vendorId) => {
      const vendor = queryClient.getQueryData<FinanceVendor>(
        financeQueryKeys.vendor(vendorId),
      );
      return vendor?.name;
    },
    getFinanceObligationName: (obligationId) => {
      const obligation = queryClient.getQueryData<FinanceObligation>(
        financeQueryKeys.obligation(obligationId),
      );
      return obligation?.name;
    },
    getFinancePaymentMethodLabel: (paymentMethodId) => {
      const method = queryClient.getQueryData<FinancePaymentMethod>(
        financeQueryKeys.paymentMethod(paymentMethodId),
      );
      return method?.label;
    },
    getServiceName: (serviceId) => {
      const service = queryClient.getQueryData<Service>(
        servicesQueryKeys.detail(serviceId),
      );
      return service?.service_name;
    },
    getJournalEntryLabel: (entryId) => {
      const entry = queryClient.getQueryData<JournalEntry>(
        journalQueryKeys.detail(entryId),
      );
      if (!entry) {
        return undefined;
      }
      const preview = truncateJournalPreview(entry.content);
      const dateLabel = formatJournalEntryDate(entry.entry_date);
      return preview ? `${dateLabel} · ${preview}` : dateLabel;
    },
    getTimelineEventLabel: (eventId) => {
      const event = queryClient.getQueryData<TimelineEvent>(
        timelineQueryKeys.detail(eventId),
      );
      if (!event) {
        return undefined;
      }
      const subject = event.subject_name?.trim();
      if (subject) {
        return subject;
      }
      return timelineCalendarEventTitle(event);
    },
    getJobScheduleName: (scheduleId) => {
      const schedule = queryClient.getQueryData<JobSchedule>(
        jobsQueryKeys.schedule(scheduleId),
      );
      return schedule?.name;
    },
    getFocusListTitle: (listId) => {
      const list = queryClient.getQueryData<FocusList>(focusQueryKeys.list(listId));
      return list?.title;
    },
  };
}
