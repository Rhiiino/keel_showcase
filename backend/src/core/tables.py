# stack_sandbox/backend/src/core/tables.py
"""Shared PostgreSQL table names for feature repositories.

Keep constants in sync with scripts under scripts/db/init/.
"""

# Users
USERS = "users"
USER_PREFERENCES = "user_preferences"

# Recently deleted (global trash)
DELETED_RECORDS = "deleted_records"

# Auth sessions
SESSIONS = "sessions"

# Background jobs
JOB_RUNS = "job_runs"
JOB_SCHEDULES = "job_schedules"

# Chat
CONVERSATIONS = "conversations"
MESSAGES = "messages"
TOOL_CALLS = "tool_calls"
CHAT_RULES = "chat_rules"
AGENT_LLM_PREFERENCES = "agent_llm_preferences"

# Personal projects (Baysic)
PROJECTS = "projects"
PROJECT_TAGS = "project_tags"
PROJECT_TAG_ASSIGNMENTS = "project_tag_assignments"
PROJECT_CANVAS = "project_canvas"
PROJECT_FOLDERS = "project_folders"

# Finance (transactions, vendors, obligations)
FINANCE_VENDORS = "finance_vendors"
FINANCE_TRANSACTIONS = "finance_transactions"
FINANCE_TRANSACTION_TAGS = "finance_transaction_tags"
FINANCE_TRANSACTION_TAG_ASSIGNMENTS = "finance_transaction_tag_assignments"
FINANCE_LISTING_PROPOSALS = "finance_listing_proposals"
FINANCE_PAYMENT_METHODS = "finance_payment_methods"
FINANCE_OBLIGATIONS = "finance_obligations"
FINANCE_OBLIGATION_TAGS = "finance_obligation_tags"
FINANCE_OBLIGATION_TAG_ASSIGNMENTS = "finance_obligation_tag_assignments"

# Media (Garage-backed object storage)
MEDIA_OBJECTS = "media_objects"
MEDIA_ATTACHMENTS = "media_attachments"
MEDIA_FOLDERS = "media_folders"
MEDIA_PANELS = "media_panels"
MEDIA_PANEL_ITEMS = "media_panel_items"

# Coak (learning workspaces)
COAK_RECORDS = "coak_records"
COAK_ITEMS = "coak_items"
COAK_TAGS = "coak_tags"
COAK_ITEM_TAG_ASSIGNMENTS = "coak_item_tag_assignments"

# Focus (nodes, tags, time tracking)
FOCUS_NODES = "focus_nodes"
FOCUS_NODE_TIME_ENTRIES = "focus_node_time_entries"
FOCUS_TAGS = "focus_tags"
FOCUS_NODE_TAGS = "focus_node_tags"

# Home
QUOTES = "quotes"

# Contacts
CONTACTS = "contacts"
CONTACT_RELATIONSHIPS = "contact_relationships"
CONTACT_TAGS = "contact_tags"
CONTACT_TAG_ASSIGNMENTS = "contact_tag_assignments"

# Figures (public people tracked per user)
FIGURES = "figures"

# Timeline (life events + planner)
TIMELINE_EVENTS = "timeline_events"
TIMELINE_EVENT_CONTACTS = "timeline_event_contacts"
TIMELINE_EVENT_FIGURES = "timeline_event_figures"
TIMELINE_EVENT_REMINDERS = "timeline_event_reminders"
TIMELINE_TAGS = "timeline_tags"
TIMELINE_TAG_ASSIGNMENTS = "timeline_tag_assignments"
TIMELINE_PLANS = "timeline_plans"
TIMELINE_PLAN_ITEMS = "timeline_plan_items"

# Journal (personal entries)
JOURNAL_ENTRIES = "journal_entries"
JOURNAL_TAGS = "journal_tags"
JOURNAL_ENTRY_TAG_ASSIGNMENTS = "journal_entry_tag_assignments"

# Intelligence catalog (global)
MODEL_MODALITIES = "model_modalities"
MODEL_PROVIDERS = "model_providers"
MODELS = "models"
TOOL_CATEGORIES = "tool_categories"
TOOLS = "tools"
SYSTEM_PROMPTS = "system_prompts"
AGENTS = "agents"
AGENT_TOOL_CATEGORIES = "agent_tool_categories"
AGENT_DELEGATIONS = "agent_delegations"
CATALOG_MEDIA = "catalog_media"

# Services (HTTP health monitors)
SERVICES = "services"

# Email (connected mailboxes)
EMAIL_ACCOUNTS = "email_accounts"

# Games (solo mini-games sessions and stats)
GAME_SESSIONS = "game_sessions"
GAME_STATS = "game_stats"
