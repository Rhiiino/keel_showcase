// stack_sandbox/frontend_web/src/app/navigation/navigationStackTypes.ts

// Types for the in-app navigation stack and per-page UI snapshots.

export type NavigationUiState = Record<string, unknown>;

export type NavigationStackEntry = {
  id: string;
  pathname: string;
  search: string;
  hash: string;
  label: string;
  uiState: NavigationUiState | null;
  pageKey: string | null;
};

export type NavigationStateHandlers = {
  capture: () => NavigationUiState | null;
  restore: (state: NavigationUiState | null) => void;
};

export type NavigationSegmentKind = "module" | "record" | "page";

export type NavigationLabelResult = {
  label: string;
  kind: NavigationSegmentKind;
};

export type NavigationLabelContext = {
  getProjectTitle: (projectId: number) => string | undefined;
  getAgentDisplayName: (agentId: string) => string | undefined;
  getMediaFilename: (mediaId: string) => string | undefined;
  getMediaFolderName: (folderId: string) => string | undefined;
  getMediaPanelName: (panelId: string) => string | undefined;
  getContactName: (contactId: number) => string | undefined;
  getFigureName: (figureId: number) => string | undefined;
  getFamilyGroupName: (familyKey: string) => string | undefined;
  getCoakRecordName: (recordId: number) => string | undefined;
  getEmailAccountName: (accountId: number) => string | undefined;
  getFinanceTransactionTitle: (transactionId: number) => string | undefined;
  getFinanceVendorName: (vendorId: number) => string | undefined;
  getFinanceObligationName: (obligationId: number) => string | undefined;
  getFinancePaymentMethodLabel: (paymentMethodId: number) => string | undefined;
  getServiceName: (serviceId: number) => string | undefined;
  getJournalEntryLabel: (entryId: number) => string | undefined;
  getTimelineEventLabel: (eventId: number) => string | undefined;
  getJobScheduleName: (scheduleId: string) => string | undefined;
  getFocusListTitle: (listId: number) => string | undefined;
};
