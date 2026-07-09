// keel_web/src/app/navigation/resolvePinnedNavigationLabel.ts

// Pinned breadcrumb labels: prefer live query data when available, otherwise
// fall back to the label captured at pin time.

import type { PinnedBreadcrumb } from "./breadcrumbPins";
import type { NavigationLabelContext } from "./navigationStackTypes";
import { resolveNavigationSegment } from "./resolveNavigationLabel";

function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function hasNavigationRecordData(
  pathname: string,
  search: string,
  context: NavigationLabelContext,
): boolean {
  const agentId = new URLSearchParams(search).get("agent");
  if (pathname === "/agents" && agentId) {
    return context.getAgentDisplayName(agentId) !== undefined;
  }

  const focusListMatch = pathname.match(/^\/focus\/lists\/(\d+)$/);
  if (focusListMatch) {
    const listId = parsePositiveInt(focusListMatch[1] ?? "");
    return listId !== null && context.getFocusListTitle(listId) !== undefined;
  }

  const coakRecordMatch = pathname.match(/^\/coak\/(\d+)$/);
  if (coakRecordMatch) {
    const recordId = parsePositiveInt(coakRecordMatch[1] ?? "");
    return recordId !== null && context.getCoakRecordName(recordId) !== undefined;
  }

  const projectMatch = pathname.match(/^\/projects\/(\d+)$/);
  if (projectMatch) {
    const projectId = parsePositiveInt(projectMatch[1] ?? "");
    return projectId !== null && context.getProjectTitle(projectId) !== undefined;
  }

  const mediaFolderMatch = pathname.match(/^\/media\/folders\/([^/]+)$/);
  if (mediaFolderMatch) {
    const folderId = mediaFolderMatch[1] ?? "";
    return context.getMediaFolderName(folderId) !== undefined;
  }

  const mediaPanelMatch = pathname.match(/^\/media\/panels\/([^/]+)$/);
  if (mediaPanelMatch) {
    const panelId = mediaPanelMatch[1] ?? "";
    return context.getMediaPanelName(panelId) !== undefined;
  }

  const mediaDetailMatch = pathname.match(/^\/media\/([^/]+)$/);
  if (mediaDetailMatch) {
    const mediaId = mediaDetailMatch[1] ?? "";
    return context.getMediaFilename(mediaId) !== undefined;
  }

  const familyGroupMatch = pathname.match(
    /^\/(?:people\/)?contacts\/family-groups\/([^/]+)$/,
  );
  if (familyGroupMatch) {
    const familyKey = familyGroupMatch[1] ?? "";
    return context.getFamilyGroupName(familyKey) !== undefined;
  }

  const contactMatch = pathname.match(/^\/(?:people\/)?contacts\/(\d+)$/);
  if (contactMatch) {
    const contactId = parsePositiveInt(contactMatch[1] ?? "");
    return contactId !== null && context.getContactName(contactId) !== undefined;
  }

  const figureMatch = pathname.match(/^\/people\/figures\/(\d+)$/);
  if (figureMatch) {
    const figureId = parsePositiveInt(figureMatch[1] ?? "");
    return figureId !== null && context.getFigureName(figureId) !== undefined;
  }

  const timelineEventMatch = pathname.match(/^\/timeline\/(\d+)$/);
  if (timelineEventMatch) {
    const eventId = parsePositiveInt(timelineEventMatch[1] ?? "");
    return (
      eventId !== null && context.getTimelineEventLabel(eventId) !== undefined
    );
  }

  const journalEntryMatch = pathname.match(/^\/journal\/(\d+)$/);
  if (journalEntryMatch) {
    const entryId = parsePositiveInt(journalEntryMatch[1] ?? "");
    return entryId !== null && context.getJournalEntryLabel(entryId) !== undefined;
  }

  const jobScheduleMatch = pathname.match(/^\/jobs\/schedules\/([^/]+)$/);
  if (jobScheduleMatch) {
    const scheduleId = jobScheduleMatch[1] ?? "";
    return context.getJobScheduleName(scheduleId) !== undefined;
  }

  const serviceMatch = pathname.match(/^\/services\/(\d+)$/);
  if (serviceMatch) {
    const serviceId = parsePositiveInt(serviceMatch[1] ?? "");
    return serviceId !== null && context.getServiceName(serviceId) !== undefined;
  }

  const financeVendorMatch = pathname.match(/^\/finance\/vendors\/(\d+)$/);
  if (financeVendorMatch) {
    const vendorId = parsePositiveInt(financeVendorMatch[1] ?? "");
    return vendorId !== null && context.getFinanceVendorName(vendorId) !== undefined;
  }

  const financeObligationMatch = pathname.match(/^\/finance\/subscriptions\/(\d+)$/);
  if (financeObligationMatch) {
    const obligationId = parsePositiveInt(financeObligationMatch[1] ?? "");
    return (
      obligationId !== null &&
      context.getFinanceObligationName(obligationId) !== undefined
    );
  }

  const financeAccountMatch = pathname.match(/^\/finance\/accounts\/(\d+)$/);
  if (financeAccountMatch) {
    const paymentMethodId = parsePositiveInt(financeAccountMatch[1] ?? "");
    return (
      paymentMethodId !== null &&
      context.getFinancePaymentMethodLabel(paymentMethodId) !== undefined
    );
  }

  const financeTransactionMatch = pathname.match(/^\/finance\/transactions\/(\d+)$/);
  if (financeTransactionMatch) {
    const transactionId = parsePositiveInt(financeTransactionMatch[1] ?? "");
    return (
      transactionId !== null &&
      context.getFinanceTransactionTitle(transactionId) !== undefined
    );
  }

  return false;
}

export function resolvePinnedNavigationLabel(
  entry: PinnedBreadcrumb,
  context: NavigationLabelContext,
): string {
  const segment = resolveNavigationSegment(
    entry.pathname,
    entry.search,
    context,
  );

  if (
    segment.kind === "record" &&
    !hasNavigationRecordData(entry.pathname, entry.search, context) &&
    entry.label
  ) {
    return entry.label;
  }

  return segment.label;
}
