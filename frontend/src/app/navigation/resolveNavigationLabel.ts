// stack_sandbox/frontend_web/src/app/navigation/resolveNavigationLabel.ts

// Human-readable breadcrumb labels from route paths and search params.

import { NAVIGATION_PAGE_KEYS } from "./navigationStackConfig";
import type {
  NavigationLabelContext,
  NavigationLabelResult,
  NavigationSegmentKind,
} from "./navigationStackTypes";

export function locationKey(pathname: string, search: string): string {
  return `${pathname}${search}`;
}

export function resolvePageKey(pathname: string): string | null {
  if (/^\/projects\/\d+\/workspace(?:\/\d+)?$/.test(pathname)) {
    return NAVIGATION_PAGE_KEYS.projectWorkspace;
  }
  if (pathname === "/agents") {
    return NAVIGATION_PAGE_KEYS.agents;
  }
  if (pathname === "/chat") {
    return NAVIGATION_PAGE_KEYS.chat;
  }
  return null;
}

function moduleResult(label: string): NavigationLabelResult {
  return { label, kind: "module" };
}

function recordResult(label: string): NavigationLabelResult {
  return { label, kind: "record" };
}

function pageResult(label: string): NavigationLabelResult {
  return { label, kind: "page" };
}

function recordOrFallback(
  name: string | undefined,
  fallback: string,
): NavigationLabelResult {
  return recordResult(name ?? fallback);
}

function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function fallbackPageLabel(pathname: string): NavigationLabelResult {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last) {
    return pageResult("Page");
  }
  return pageResult(last.charAt(0).toUpperCase() + last.slice(1));
}

export function resolveNavigationSegment(
  pathname: string,
  search: string,
  context: NavigationLabelContext,
): NavigationLabelResult {
  if (pathname === "/" || pathname === "") {
    return pageResult("Home");
  }

  if (pathname === "/chat") {
    return moduleResult("Chat");
  }

  if (pathname === "/agents") {
    const agentId = new URLSearchParams(search).get("agent");
    if (agentId) {
      const name = context.getAgentDisplayName(agentId);
      return recordOrFallback(name, `Agent · ${agentId}`);
    }
    return moduleResult("Agents");
  }

  const focusListMatch = pathname.match(/^\/focus\/lists\/(\d+)$/);
  if (focusListMatch) {
    const listId = parsePositiveInt(focusListMatch[1] ?? "");
    const title =
      listId !== null ? context.getFocusListTitle(listId) : undefined;
    return recordOrFallback(title, "Focus form");
  }

  if (pathname === "/focus") {
    return moduleResult("Focus");
  }

  const coakRecordMatch = pathname.match(/^\/coak\/(\d+)$/);
  if (coakRecordMatch) {
    const recordId = parsePositiveInt(coakRecordMatch[1] ?? "");
    const name =
      recordId !== null ? context.getCoakRecordName(recordId) : undefined;
    return recordOrFallback(name, "C.O.A.K. record");
  }

  if (pathname === "/coak") {
    return moduleResult("C.O.A.K.");
  }

  const workspaceMatch = pathname.match(/^\/projects\/(\d+)\/workspace(?:\/(\d+))?$/);
  if (workspaceMatch) {
    const projectId = parsePositiveInt(workspaceMatch[1] ?? "");
    const title =
      projectId !== null ? context.getProjectTitle(projectId) : undefined;
    return pageResult(title ? `${title} · Workspace` : "Workspace");
  }

  const projectMatch = pathname.match(/^\/projects\/(\d+)$/);
  if (projectMatch) {
    const projectId = parsePositiveInt(projectMatch[1] ?? "");
    const title =
      projectId !== null ? context.getProjectTitle(projectId) : undefined;
    return recordOrFallback(title, "Project");
  }

  if (pathname === "/projects/new") {
    return pageResult("New project");
  }

  if (pathname === "/projects/tags") {
    return pageResult("Project tags");
  }

  if (pathname === "/projects") {
    return moduleResult("Projects");
  }

  const mediaFolderMatch = pathname.match(/^\/media\/folders\/([^/]+)$/);
  if (mediaFolderMatch) {
    const folderId = mediaFolderMatch[1] ?? "";
    const name = context.getMediaFolderName(folderId);
    return recordOrFallback(name, "Folder");
  }

  const mediaPanelMatch = pathname.match(/^\/media\/panels\/([^/]+)$/);
  if (mediaPanelMatch) {
    const panelId = mediaPanelMatch[1] ?? "";
    const name = context.getMediaPanelName(panelId);
    return recordOrFallback(name, "Media panel");
  }

  const mediaDetailMatch = pathname.match(/^\/media\/([^/]+)$/);
  if (mediaDetailMatch) {
    const mediaId = mediaDetailMatch[1] ?? "";
    const name = context.getMediaFilename(mediaId);
    return recordOrFallback(name, "Media file");
  }

  if (pathname === "/media/panels") {
    return pageResult("Media panels");
  }

  if (pathname === "/media/new") {
    return pageResult("New media");
  }

  if (pathname === "/media") {
    return moduleResult("Media");
  }

  const familyGroupMatch = pathname.match(
    /^\/(?:people\/)?contacts\/family-groups\/([^/]+)$/,
  );
  if (familyGroupMatch) {
    const familyKey = familyGroupMatch[1] ?? "";
    const name = context.getFamilyGroupName(familyKey);
    return recordOrFallback(name, "Family group");
  }

  if (pathname === "/people/contacts/family-groups" || pathname === "/contacts/family-groups") {
    return pageResult("Family groups");
  }

  if (pathname === "/people/contacts/family-tree" || pathname === "/contacts/family-tree") {
    return pageResult("Family tree");
  }

  if (pathname === "/people/contacts/tags" || pathname === "/contacts/tags") {
    return pageResult("Contact tags");
  }

  if (pathname === "/people/contacts/new" || pathname === "/contacts/new") {
    return pageResult("New contact");
  }

  const contactMatch = pathname.match(/^\/(?:people\/)?contacts\/(\d+)$/);
  if (contactMatch) {
    const contactId = parsePositiveInt(contactMatch[1] ?? "");
    const name =
      contactId !== null ? context.getContactName(contactId) : undefined;
    return recordOrFallback(name, "Contact");
  }

  if (pathname === "/people/contacts" || pathname === "/contacts") {
    return pageResult("Contacts");
  }

  if (pathname === "/people/figures/new") {
    return pageResult("New figure");
  }

  const figureMatch = pathname.match(/^\/people\/figures\/(\d+)$/);
  if (figureMatch) {
    const figureId = parsePositiveInt(figureMatch[1] ?? "");
    const name = figureId !== null ? context.getFigureName(figureId) : undefined;
    return recordOrFallback(name, "Figure");
  }

  if (pathname === "/people/figures") {
    return pageResult("Figures");
  }

  if (pathname === "/timeline/calendar") {
    return pageResult("Timeline calendar");
  }

  if (pathname === "/timeline/plan/new") {
    return pageResult("New plan");
  }

  const timelinePlanMatch = pathname.match(/^\/timeline\/plan\/(\d+)$/);
  if (timelinePlanMatch) {
    return pageResult("Plan");
  }

  if (pathname === "/timeline/plan") {
    return pageResult("Plan");
  }

  if (pathname === "/timeline/tags") {
    return pageResult("Timeline tags");
  }

  if (pathname === "/timeline/new") {
    return pageResult("New timeline event");
  }

  const timelineEventMatch = pathname.match(/^\/timeline\/(\d+)$/);
  if (timelineEventMatch) {
    const eventId = parsePositiveInt(timelineEventMatch[1] ?? "");
    const label =
      eventId !== null ? context.getTimelineEventLabel(eventId) : undefined;
    return recordOrFallback(label, "Timeline event");
  }

  if (pathname === "/timeline") {
    return moduleResult("Timeline");
  }

  if (pathname === "/journal/tags") {
    return pageResult("Journal tags");
  }

  if (pathname === "/journal/new") {
    return pageResult("New journal entry");
  }

  const journalEntryMatch = pathname.match(/^\/journal\/(\d+)$/);
  if (journalEntryMatch) {
    const entryId = parsePositiveInt(journalEntryMatch[1] ?? "");
    const label =
      entryId !== null ? context.getJournalEntryLabel(entryId) : undefined;
    return recordOrFallback(label, "Journal entry");
  }

  if (pathname === "/journal") {
    return moduleResult("Journal");
  }

  const jobScheduleMatch = pathname.match(/^\/jobs\/schedules\/([^/]+)$/);
  if (jobScheduleMatch) {
    const scheduleId = jobScheduleMatch[1] ?? "";
    const name = context.getJobScheduleName(scheduleId);
    return recordOrFallback(name, "Job schedule");
  }

  if (pathname === "/jobs/schedules") {
    return pageResult("Job schedules");
  }

  if (pathname === "/jobs/tasks") {
    return pageResult("Job tasks");
  }

  if (pathname === "/jobs") {
    return moduleResult("Jobs");
  }

  if (pathname === "/services/new") {
    return pageResult("New service");
  }

  const serviceMatch = pathname.match(/^\/services\/(\d+)$/);
  if (serviceMatch) {
    const serviceId = parsePositiveInt(serviceMatch[1] ?? "");
    const name =
      serviceId !== null ? context.getServiceName(serviceId) : undefined;
    return recordOrFallback(name, "Service");
  }

  if (pathname === "/services") {
    return moduleResult("Services");
  }

  if (pathname === "/finance/vendors/new") {
    return pageResult("New vendor");
  }

  const financeVendorMatch = pathname.match(/^\/finance\/vendors\/(\d+)$/);
  if (financeVendorMatch) {
    const vendorId = parsePositiveInt(financeVendorMatch[1] ?? "");
    const name =
      vendorId !== null ? context.getFinanceVendorName(vendorId) : undefined;
    return recordOrFallback(name, "Vendor");
  }

  if (pathname === "/finance/vendors") {
    return pageResult("Vendors");
  }

  if (pathname === "/finance/subscriptions/new") {
    return pageResult("New subscription");
  }

  const financeObligationMatch = pathname.match(/^\/finance\/subscriptions\/(\d+)$/);
  if (financeObligationMatch) {
    const obligationId = parsePositiveInt(financeObligationMatch[1] ?? "");
    const name =
      obligationId !== null ? context.getFinanceObligationName(obligationId) : undefined;
    return recordOrFallback(name, "Subscription");
  }

  if (pathname === "/finance/subscriptions") {
    return pageResult("Subscriptions");
  }

  if (pathname === "/finance/accounts/new") {
    return pageResult("New account");
  }

  const financeAccountMatch = pathname.match(/^\/finance\/accounts\/(\d+)$/);
  if (financeAccountMatch) {
    const paymentMethodId = parsePositiveInt(financeAccountMatch[1] ?? "");
    const label =
      paymentMethodId !== null
        ? context.getFinancePaymentMethodLabel(paymentMethodId)
        : undefined;
    return recordOrFallback(label, "Account");
  }

  if (pathname === "/finance/accounts") {
    return pageResult("Accounts");
  }

  if (pathname === "/finance/tags/transactions") {
    return pageResult("Transaction tags");
  }

  if (pathname === "/finance/tags/obligations") {
    return pageResult("Obligation tags");
  }

  if (pathname === "/finance/tags") {
    return pageResult("Tags");
  }

  if (pathname === "/finance/transactions/new") {
    return pageResult("New transaction");
  }

  const financeTransactionMatch = pathname.match(/^\/finance\/transactions\/(\d+)$/);
  if (financeTransactionMatch) {
    const transactionId = parsePositiveInt(financeTransactionMatch[1] ?? "");
    const title =
      transactionId !== null ? context.getFinanceTransactionTitle(transactionId) : undefined;
    return recordOrFallback(title, "Transaction");
  }

  if (pathname === "/finance/transactions") {
    return pageResult("Transactions");
  }

  if (pathname === "/finance") {
    return moduleResult("Finance");
  }

  if (pathname === "/intelligence/models") {
    return pageResult("Intelligence models");
  }

  if (pathname === "/intelligence/tools") {
    return pageResult("Intelligence tools");
  }

  if (pathname === "/intelligence") {
    return moduleResult("Intelligence");
  }

  if (pathname === "/settings") {
    return pageResult("Settings");
  }

  return fallbackPageLabel(pathname);
}

export function resolveNavigationLabel(
  pathname: string,
  search: string,
  context: NavigationLabelContext,
): string {
  return resolveNavigationSegment(pathname, search, context).label;
}

export function navigationSegmentClassName(
  kind: NavigationSegmentKind,
  isCurrent: boolean,
  isClickable: boolean,
): string {
  const widthClass = isCurrent
    ? "max-w-[14rem] sm:max-w-[18rem]"
    : "max-w-[12rem] sm:max-w-[16rem]";
  const base = `${widthClass} truncate rounded px-1 py-0.5`;

  if (kind === "module") {
    return [
      base,
      "text-[10px] font-semibold uppercase tracking-[0.14em]",
      isClickable
        ? "text-stone-500 transition hover:bg-stone-900 hover:text-stone-300"
        : isCurrent
          ? "text-stone-400"
          : "text-stone-500",
    ].join(" ");
  }

  if (isClickable) {
    return [
      base,
      "text-stone-400 transition hover:bg-stone-900 hover:text-stone-200",
    ].join(" ");
  }

  return [base, "font-medium text-stone-200"].join(" ");
}
