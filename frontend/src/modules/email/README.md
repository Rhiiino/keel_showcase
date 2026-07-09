# Email module

Manage connected Gmail mailbox records and fetch inbox messages on demand.

## Gmail OAuth setup

Uses the same Google Cloud OAuth client as Keel login (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`).

1. Enable **Gmail API** in Google Cloud Console for the project.
2. On the OAuth consent screen, add scope `https://www.googleapis.com/auth/gmail.readonly` (plus the default email/profile scopes).
3. Under **Authorized redirect URIs**, add your API callback URL (must match `GOOGLE_GMAIL_REDIRECT_URI`):
   - Local: `http://localhost:8002/email/gmail/callback`
   - Dev: `https://keelapi.themidhunraj.com/email/gmail/callback`

When the user clicks **Connect Gmail**, the browser opens Google sign-in, then returns to the account inbox page with status **Connected** if the signed-in Google account matches the email address on the form.

## Routes and navigation

| Path | Page |
|------|------|
| `/email` | Account list |
| `/email/new` | Create account |
| `/email/:accountId` | Inbox fetch workspace |

Nav item: [`navItem.tsx`](./navItem.tsx) — icon `email`.

Layout: [`EmailModuleLayout.tsx`](./EmailModuleLayout.tsx) — `AppShellContent` + `max-w-6xl`.

Account list columns: **Status** (glowing dot), **Name**, **Connection** (connected timestamp or Disconnected), row menu (delete with two-step confirm).

Inbox page: search filters, **Fetch** button, message list (unread dot, received, from, subject + snippet), settings modal for account CRUD/connect.

## Backend integration

REST prefix `/email` — see [`api.ts`](./api.ts).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/email` | List accounts |
| POST | `/email` | Create account |
| GET | `/email/:id` | Get account |
| PATCH | `/email/:id` | Update account |
| DELETE | `/email/:id` | Delete account |
| GET | `/email/:id/connect` | Start Gmail OAuth for one account |
| GET | `/email/gmail/callback` | Gmail OAuth callback (browser redirect) |
| POST | `/email/:id/messages/fetch` | Search Gmail messages |
| GET | `/email/:id/messages/:messageId` | Get one message with body |

Search filters persist per account under `user_preferences.data.email.lastFetchFilters` via `GET/PATCH /settings`.

## Directory structure

```
email/
├── api.ts
├── navItem.tsx
├── routes.tsx
├── EmailModuleLayout.tsx
├── components/
│   ├── EmailAccountConnectButton.tsx
│   ├── EmailAccountForm.tsx
│   ├── EmailAccountFormPageLayout.tsx
│   ├── EmailAccountInboxPageLayout.tsx
│   ├── EmailAccountSettingsModal.tsx
│   ├── EmailAccountStatusDot.tsx
│   ├── EmailAccountsListRow.tsx
│   ├── EmailAccountsListView.tsx
│   ├── EmailInboxFetchFilters.tsx
│   ├── EmailInboxMessageRow.tsx
│   ├── EmailInboxMessagesListView.tsx
│   └── EmailMessageDetailModal.tsx
├── hooks/
│   ├── useEmailAccountEditor.ts
│   └── useEmailInboxFetch.ts
├── lib/
│   ├── emailDisplay.ts
│   ├── emailInboxDisplay.ts
│   └── emailMessageDisplay.ts
├── pages/
│   ├── EmailAccountCreatePage.tsx
│   ├── EmailAccountDetailPage.tsx
│   └── EmailAccountsPage.tsx
└── README.md
```

## Module changelog

- **2026-07-04** — Inbox fetch workspace on account detail: filters, Fetch button, message list/detail modals, settings modal; Connection column on account list.
- **2026-07-04** — Initial email module: account list, create/edit form, delete with shared confirm pattern.
