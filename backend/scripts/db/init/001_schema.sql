-- keel_showcase/backend/scripts/db/init/001_schema.sql
-- Runs once when the Postgres data volume is first created.

CREATE EXTENSION IF NOT EXISTS vector;

-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
-- Name: agent_delegations; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.agent_delegations (
    parent_agent_id integer NOT NULL,
    child_agent_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT agent_delegations_not_self CHECK ((parent_agent_id <> child_agent_id))
);
-- Name: agent_llm_preferences; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.agent_llm_preferences (
    user_id integer NOT NULL,
    agent_id text NOT NULL,
    llm_provider text NOT NULL,
    llm_model text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Name: agent_tool_categories; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.agent_tool_categories (
    agent_id integer NOT NULL,
    category_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Name: agents; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.agents (
    id integer NOT NULL,
    key text NOT NULL,
    display_name text NOT NULL,
    description text NOT NULL,
    system_prompt_id integer,
    is_orchestrator boolean DEFAULT false NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT agents_key_nonempty CHECK ((char_length(TRIM(BOTH FROM key)) > 0))
);
-- Name: agents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.agents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: agents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.agents_id_seq OWNED BY public.agents.id;
-- Name: catalog_media; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.catalog_media (
    id integer NOT NULL,
    agent_id integer,
    tool_category_id integer,
    provider_id integer,
    model_id integer,
    media_kind text NOT NULL,
    role text,
    storage_key text NOT NULL,
    mime_type text NOT NULL,
    byte_size integer,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT catalog_media_exactly_one_owner CHECK (((((((agent_id IS NOT NULL))::integer + ((tool_category_id IS NOT NULL))::integer) + ((provider_id IS NOT NULL))::integer) + ((model_id IS NOT NULL))::integer) = 1)),
    CONSTRAINT catalog_media_kind_valid CHECK ((media_kind = ANY (ARRAY['image'::text, 'model_3d'::text]))),
    CONSTRAINT catalog_media_storage_key_nonempty CHECK ((char_length(TRIM(BOTH FROM storage_key)) > 0))
);
-- Name: catalog_media_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.catalog_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: catalog_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.catalog_media_id_seq OWNED BY public.catalog_media.id;
-- Name: chat_rules; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.chat_rules (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    agent_ids text[] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_rules_agent_ids_nonempty CHECK ((cardinality(agent_ids) > 0)),
    CONSTRAINT chat_rules_content_nonempty CHECK ((char_length(TRIM(BOTH FROM content)) > 0)),
    CONSTRAINT chat_rules_title_nonempty CHECK ((char_length(TRIM(BOTH FROM title)) > 0))
);
-- Name: chat_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.chat_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: chat_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.chat_rules_id_seq OWNED BY public.chat_rules.id;
-- Name: coak_item_tag_assignments; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.coak_item_tag_assignments (
    coak_item_id integer NOT NULL,
    coak_record_id integer NOT NULL,
    tag_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Name: coak_items; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.coak_items (
    id integer NOT NULL,
    coak_record_id integer NOT NULL,
    user_id integer NOT NULL,
    parent_id integer,
    kind text NOT NULL,
    name text NOT NULL,
    color_hex text DEFAULT '#06B6D4'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    media_id uuid,
    note_body text DEFAULT ''::text NOT NULL,
    flash_front text DEFAULT ''::text NOT NULL,
    flash_back text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT coak_items_color_hex_valid CHECK ((color_hex ~ '^#[0-9A-Fa-f]{6}$'::text)),
    CONSTRAINT coak_items_kind_valid CHECK ((kind = ANY (ARRAY['folder'::text, 'note'::text, 'flash'::text]))),
    CONSTRAINT coak_items_name_nonempty CHECK ((char_length(TRIM(BOTH FROM name)) > 0))
);
-- Name: coak_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.coak_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: coak_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.coak_items_id_seq OWNED BY public.coak_items.id;
-- Name: coak_records; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.coak_records (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    color_hex text DEFAULT '#FBBF24'::text NOT NULL,
    workspace_state jsonb DEFAULT '{}'::jsonb NOT NULL,
    workspace_settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    configuration_settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT coak_records_color_hex_valid CHECK ((color_hex ~ '^#[0-9A-Fa-f]{6}$'::text)),
    CONSTRAINT coak_records_configuration_settings_object CHECK ((jsonb_typeof(configuration_settings) = 'object'::text)),
    CONSTRAINT coak_records_name_nonempty CHECK ((char_length(TRIM(BOTH FROM name)) > 0)),
    CONSTRAINT coak_records_workspace_settings_object CHECK ((jsonb_typeof(workspace_settings) = 'object'::text)),
    CONSTRAINT coak_records_workspace_state_object CHECK ((jsonb_typeof(workspace_state) = 'object'::text))
);
-- Name: coak_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.coak_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: coak_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.coak_records_id_seq OWNED BY public.coak_records.id;
-- Name: coak_tags; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.coak_tags (
    id integer NOT NULL,
    coak_record_id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    description text,
    color_hex text DEFAULT '#06B6D4'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT coak_tags_color_hex_valid CHECK ((color_hex ~ '^#[0-9A-Fa-f]{6}$'::text)),
    CONSTRAINT coak_tags_name_nonempty CHECK ((char_length(TRIM(BOTH FROM name)) > 0))
);
-- Name: coak_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.coak_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: coak_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.coak_tags_id_seq OWNED BY public.coak_tags.id;
-- Name: contact_relationships; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.contact_relationships (
    id integer NOT NULL,
    user_id integer NOT NULL,
    from_contact_id integer NOT NULL,
    to_contact_id integer NOT NULL,
    relationship_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contact_relationships_no_self_link CHECK ((from_contact_id <> to_contact_id)),
    CONSTRAINT contact_relationships_type_valid CHECK ((relationship_type = ANY (ARRAY['spouse'::text, 'parent'::text, 'sibling'::text, 'friend'::text])))
);
-- Name: contact_relationships_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.contact_relationships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: contact_relationships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.contact_relationships_id_seq OWNED BY public.contact_relationships.id;
-- Name: contact_tag_assignments; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.contact_tag_assignments (
    contact_id integer NOT NULL,
    tag_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Name: contact_tags; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.contact_tags (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    color_hex text DEFAULT '#06B6D4'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contact_tags_color_hex_valid CHECK ((color_hex ~ '^#[0-9A-Fa-f]{6}$'::text)),
    CONSTRAINT contact_tags_name_nonempty CHECK ((char_length(TRIM(BOTH FROM name)) > 0))
);
-- Name: contact_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.contact_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: contact_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.contact_tags_id_seq OWNED BY public.contact_tags.id;
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.contacts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    first_name text,
    last_name text,
    gender text,
    birth_date date,
    birth_date_year_known boolean DEFAULT true NOT NULL,
    death_date date,
    notes text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    is_self boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contacts_gender_valid CHECK (((gender IS NULL) OR (gender = ANY (ARRAY['male'::text, 'female'::text])))),
    CONSTRAINT contacts_status_valid CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text])))
);
-- Name: contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.contacts_id_seq OWNED BY public.contacts.id;
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.conversations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text,
    driver_agent_id text DEFAULT 'keel'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    project_id integer
);
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;
-- Name: deleted_records; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.deleted_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    display_label text NOT NULL,
    payload jsonb NOT NULL,
    purge_group_id uuid,
    deleted_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    permanently_deleted_at timestamp with time zone,
    CONSTRAINT deleted_records_payload_object CHECK ((jsonb_typeof(payload) = 'object'::text))
);
-- Name: figures; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.figures (
    id integer NOT NULL,
    user_id integer NOT NULL,
    first_name text,
    last_name text,
    gender text,
    birth_date date,
    birth_date_year_known boolean DEFAULT true NOT NULL,
    death_date date,
    notes text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT figures_gender_valid CHECK (((gender IS NULL) OR (gender = ANY (ARRAY['male'::text, 'female'::text])))),
    CONSTRAINT figures_status_valid CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text])))
);
-- Name: figures_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.figures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: figures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.figures_id_seq OWNED BY public.figures.id;
-- Name: finance_listing_proposals; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.finance_listing_proposals (
    id integer NOT NULL,
    user_id integer NOT NULL,
    conversation_id integer,
    status text DEFAULT 'pending'::text NOT NULL,
    payload jsonb NOT NULL,
    created_transaction_id integer,
    created_vendor_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT finance_listing_proposals_status_valid CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'declined'::text])))
);
-- Name: finance_listing_proposals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.finance_listing_proposals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: finance_listing_proposals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.finance_listing_proposals_id_seq OWNED BY public.finance_listing_proposals.id;
-- Name: finance_obligation_tag_assignments; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.finance_obligation_tag_assignments (
    obligation_id integer NOT NULL,
    tag_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Name: finance_obligation_tags; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.finance_obligation_tags (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    description text,
    color_hex text DEFAULT '#06B6D4'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT finance_obligation_tags_color_hex_valid CHECK ((color_hex ~ '^#[0-9A-Fa-f]{6}$'::text)),
    CONSTRAINT finance_obligation_tags_name_nonempty CHECK ((char_length(TRIM(BOTH FROM name)) > 0))
);
-- Name: finance_obligation_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.finance_obligation_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: finance_obligation_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.finance_obligation_tags_id_seq OWNED BY public.finance_obligation_tags.id;
-- Name: finance_obligations; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.finance_obligations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    vendor_id integer,
    payment_method_id integer,
    name text NOT NULL,
    kind text DEFAULT 'subscription'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    amount numeric(12,2),
    currency text DEFAULT 'USD'::text NOT NULL,
    billing_interval text DEFAULT 'monthly'::text NOT NULL,
    billing_day integer,
    started_at timestamp with time zone,
    next_billing_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    ends_at timestamp with time zone,
    account_url text,
    notes text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT finance_obligations_billing_day_valid CHECK (((billing_day IS NULL) OR ((billing_day >= 1) AND (billing_day <= 31)))),
    CONSTRAINT finance_obligations_billing_interval_valid CHECK ((billing_interval = ANY (ARRAY['monthly'::text, 'annual'::text, 'weekly'::text, 'quarterly'::text]))),
    CONSTRAINT finance_obligations_kind_valid CHECK ((kind = ANY (ARRAY['subscription'::text, 'membership'::text, 'bill'::text]))),
    CONSTRAINT finance_obligations_name_nonempty CHECK ((char_length(TRIM(BOTH FROM name)) > 0)),
    CONSTRAINT finance_obligations_status_valid CHECK ((status = ANY (ARRAY['active'::text, 'trial'::text, 'paused'::text, 'cancelled'::text])))
);
-- Name: finance_obligations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.finance_obligations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: finance_obligations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.finance_obligations_id_seq OWNED BY public.finance_obligations.id;
-- Name: finance_payment_methods; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.finance_payment_methods (
    id integer NOT NULL,
    user_id integer NOT NULL,
    kind text DEFAULT 'credit_card'::text NOT NULL,
    label text NOT NULL,
    institution_name text,
    last_four text,
    notes text DEFAULT ''::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT finance_payment_methods_kind_valid CHECK ((kind = ANY (ARRAY['credit_card'::text, 'debit_card'::text, 'checking'::text, 'savings'::text, 'prepaid'::text, 'other'::text]))),
    CONSTRAINT finance_payment_methods_label_nonempty CHECK ((char_length(TRIM(BOTH FROM label)) > 0)),
    CONSTRAINT finance_payment_methods_last_four_valid CHECK (((last_four IS NULL) OR (last_four ~ '^\d{4}$'::text)))
);
-- Name: finance_payment_methods_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.finance_payment_methods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: finance_payment_methods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.finance_payment_methods_id_seq OWNED BY public.finance_payment_methods.id;
-- Name: finance_transaction_tag_assignments; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.finance_transaction_tag_assignments (
    transaction_id integer NOT NULL,
    tag_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Name: finance_transaction_tags; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.finance_transaction_tags (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    description text,
    color_hex text DEFAULT '#06B6D4'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT finance_transaction_tags_color_hex_valid CHECK ((color_hex ~ '^#[0-9A-Fa-f]{6}$'::text)),
    CONSTRAINT finance_transaction_tags_name_nonempty CHECK ((char_length(TRIM(BOTH FROM name)) > 0))
);
-- Name: finance_transaction_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.finance_transaction_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: finance_transaction_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.finance_transaction_tags_id_seq OWNED BY public.finance_transaction_tags.id;
-- Name: finance_transactions; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.finance_transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    vendor_id integer,
    title text NOT NULL,
    kind text DEFAULT 'physical'::text NOT NULL,
    status text DEFAULT 'considering'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    listing_url text,
    notes text DEFAULT ''::text NOT NULL,
    price_amount numeric(12,2),
    currency text DEFAULT 'USD'::text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    ordered_at timestamp with time zone,
    received_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    obligation_id integer,
    CONSTRAINT finance_transactions_kind_valid CHECK ((kind = ANY (ARRAY['physical'::text, 'expense'::text, 'subscription'::text, 'service'::text]))),
    CONSTRAINT finance_transactions_quantity_positive CHECK ((quantity > 0)),
    CONSTRAINT finance_transactions_status_valid CHECK ((status = ANY (ARRAY['considering'::text, 'ordered'::text, 'in_transit'::text, 'received'::text, 'cancelled'::text, 'returned'::text]))),
    CONSTRAINT finance_transactions_title_nonempty CHECK ((char_length(TRIM(BOTH FROM title)) > 0))
);
-- Name: finance_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.finance_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: finance_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.finance_transactions_id_seq OWNED BY public.finance_transactions.id;
-- Name: finance_vendors; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.finance_vendors (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    website_url text,
    billing_portal_url text,
    notes text DEFAULT ''::text NOT NULL,
    default_currency text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT finance_vendors_name_nonempty CHECK ((char_length(TRIM(BOTH FROM name)) > 0))
);
-- Name: finance_vendors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.finance_vendors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: finance_vendors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.finance_vendors_id_seq OWNED BY public.finance_vendors.id;
-- Name: focus_node_tags; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.focus_node_tags (
    node_id integer NOT NULL,
    tag_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Name: focus_node_time_entries; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.focus_node_time_entries (
    id integer NOT NULL,
    user_id integer NOT NULL,
    node_id integer NOT NULL,
    status text DEFAULT 'running'::text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    last_paused_at timestamp with time zone,
    ended_at timestamp with time zone,
    accumulated_paused_seconds integer DEFAULT 0 NOT NULL,
    duration_seconds integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT focus_node_time_entries_end_valid CHECK ((((status = 'ended'::text) AND (ended_at IS NOT NULL) AND (duration_seconds IS NOT NULL)) OR (status <> 'ended'::text))),
    CONSTRAINT focus_node_time_entries_open_valid CHECK (((status <> 'running'::text) OR ((last_paused_at IS NULL) AND (ended_at IS NULL) AND (duration_seconds IS NULL)))),
    CONSTRAINT focus_node_time_entries_pause_valid CHECK ((((status = 'paused'::text) AND (last_paused_at IS NOT NULL) AND (ended_at IS NULL)) OR (status <> 'paused'::text))),
    CONSTRAINT focus_node_time_entries_seconds_valid CHECK (((accumulated_paused_seconds >= 0) AND ((duration_seconds IS NULL) OR (duration_seconds >= 0)))),
    CONSTRAINT focus_node_time_entries_status_valid CHECK ((status = ANY (ARRAY['running'::text, 'paused'::text, 'ended'::text])))
);
-- Name: focus_node_time_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.focus_node_time_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: focus_node_time_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.focus_node_time_entries_id_seq OWNED BY public.focus_node_time_entries.id;
-- Name: focus_nodes; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.focus_nodes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    parent_id integer,
    kind text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    title text NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    completed_at timestamp with time zone,
    work_order integer,
    node_color_hex text,
    title_font_key text,
    is_origin boolean DEFAULT false NOT NULL,
    reference_target_type text,
    reference_target_id text,
    show_reference_content boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT focus_nodes_kind_shape CHECK ((((kind = 'item'::text) AND (reference_target_type IS NULL) AND (reference_target_id IS NULL)) OR ((kind = 'list'::text) AND (reference_target_type IS NULL) AND (reference_target_id IS NULL)) OR ((kind = 'record'::text) AND (reference_target_type IS NOT NULL) AND (reference_target_id IS NOT NULL)))),
    CONSTRAINT focus_nodes_kind_valid CHECK ((kind = ANY (ARRAY['item'::text, 'list'::text, 'record'::text]))),
    CONSTRAINT focus_nodes_node_color_hex_valid CHECK (((node_color_hex IS NULL) OR (node_color_hex ~ '^#[0-9A-Fa-f]{6}$'::text))),
    CONSTRAINT focus_nodes_status_valid CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'archived'::text, 'limbo'::text]))),
    CONSTRAINT focus_nodes_title_font_key_valid CHECK (((title_font_key IS NULL) OR (title_font_key = ANY (ARRAY['default'::text, 'serif'::text, 'mono'::text, 'rounded'::text, 'condensed'::text, 'handwritten'::text, 'display'::text, 'elegant'::text, 'slab'::text, 'bold'::text, 'retro'::text, 'tech'::text, 'classic'::text, 'wide'::text])))),
    CONSTRAINT focus_nodes_title_nonempty CHECK ((char_length(TRIM(BOTH FROM title)) > 0)),
    CONSTRAINT focus_nodes_work_order_valid CHECK (((work_order IS NULL) OR (work_order >= 0)))
);
-- Name: focus_nodes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.focus_nodes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: focus_nodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.focus_nodes_id_seq OWNED BY public.focus_nodes.id;
-- Name: focus_tags; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.focus_tags (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    color_hex text DEFAULT '#06B6D4'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT focus_tags_color_hex_valid CHECK ((color_hex ~ '^#[0-9A-Fa-f]{6}$'::text)),
    CONSTRAINT focus_tags_name_nonempty CHECK ((char_length(TRIM(BOTH FROM name)) > 0))
);
-- Name: focus_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.focus_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: focus_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.focus_tags_id_seq OWNED BY public.focus_tags.id;
-- Name: game_sessions; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.game_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer NOT NULL,
    game_key text NOT NULL,
    level integer NOT NULL,
    status text DEFAULT 'in_progress'::text NOT NULL,
    state jsonb DEFAULT '{}'::jsonb NOT NULL,
    move_count integer DEFAULT 0 NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT game_sessions_level_positive CHECK ((level >= 1)),
    CONSTRAINT game_sessions_state_object CHECK ((jsonb_typeof(state) = 'object'::text)),
    CONSTRAINT game_sessions_status_check CHECK ((status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'abandoned'::text])))
);
-- Name: game_stats; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.game_stats (
    user_id integer NOT NULL,
    game_key text NOT NULL,
    stats jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT game_stats_stats_object CHECK ((jsonb_typeof(stats) = 'object'::text))
);
-- Name: job_runs; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.job_runs (
    id uuid NOT NULL,
    celery_task_id text NOT NULL,
    task_name text NOT NULL,
    queue text DEFAULT 'default'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    triggered_by text NOT NULL,
    user_id integer,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    result jsonb,
    error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    schedule_id uuid,
    CONSTRAINT job_runs_queue_valid CHECK ((queue = ANY (ARRAY['default'::text, 'heavy'::text]))),
    CONSTRAINT job_runs_status_valid CHECK ((status = ANY (ARRAY['pending'::text, 'running'::text, 'success'::text, 'failure'::text, 'retry'::text]))),
    CONSTRAINT job_runs_triggered_by_valid CHECK ((triggered_by = ANY (ARRAY['api'::text, 'beat'::text, 'manual'::text])))
);
-- Name: job_schedules; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.job_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    task_name text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    queue text DEFAULT 'default'::text NOT NULL,
    recurrence text NOT NULL,
    minute smallint DEFAULT 0 NOT NULL,
    hour smallint DEFAULT 0 NOT NULL,
    days_of_week smallint[],
    day_of_month smallint,
    month_of_year smallint,
    interval_minutes integer,
    timezone text DEFAULT 'America/New_York'::text NOT NULL,
    task_kwargs jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT job_schedules_day_of_month_valid CHECK (((day_of_month IS NULL) OR ((day_of_month >= 1) AND (day_of_month <= 31)))),
    CONSTRAINT job_schedules_days_of_week_valid CHECK (((days_of_week IS NULL) OR ((cardinality(days_of_week) >= 1) AND (cardinality(days_of_week) <= 7) AND (days_of_week <@ ARRAY[(0)::smallint, (1)::smallint, (2)::smallint, (3)::smallint, (4)::smallint, (5)::smallint, (6)::smallint])))),
    CONSTRAINT job_schedules_hour_valid CHECK (((hour >= 0) AND (hour <= 23))),
    CONSTRAINT job_schedules_interval_minutes_valid CHECK (((interval_minutes IS NULL) OR ((interval_minutes >= 1) AND (interval_minutes <= 1440)))),
    CONSTRAINT job_schedules_interval_recurrence_fields CHECK ((((recurrence = 'interval'::text) AND (interval_minutes IS NOT NULL)) OR ((recurrence <> 'interval'::text) AND (interval_minutes IS NULL)))),
    CONSTRAINT job_schedules_minute_valid CHECK (((minute >= 0) AND (minute <= 59))),
    CONSTRAINT job_schedules_month_of_year_valid CHECK (((month_of_year IS NULL) OR ((month_of_year >= 1) AND (month_of_year <= 12)))),
    CONSTRAINT job_schedules_queue_valid CHECK ((queue = ANY (ARRAY['default'::text, 'heavy'::text]))),
    CONSTRAINT job_schedules_recurrence_valid CHECK ((recurrence = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'yearly'::text, 'interval'::text])))
);
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.journal_entries (
    id integer NOT NULL,
    user_id integer NOT NULL,
    entry_date date NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT journal_entries_content_nonempty CHECK ((char_length(TRIM(BOTH FROM content)) > 0))
);
-- Name: journal_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.journal_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: journal_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.journal_entries_id_seq OWNED BY public.journal_entries.id;
-- Name: journal_entry_tag_assignments; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.journal_entry_tag_assignments (
    journal_entry_id integer NOT NULL,
    tag_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Name: journal_tags; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.journal_tags (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    color_hex text DEFAULT '#06B6D4'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT journal_tags_color_hex_valid CHECK ((color_hex ~ '^#[0-9A-Fa-f]{6}$'::text)),
    CONSTRAINT journal_tags_name_nonempty CHECK ((char_length(TRIM(BOTH FROM name)) > 0))
);
-- Name: journal_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.journal_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: journal_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.journal_tags_id_seq OWNED BY public.journal_tags.id;
-- Name: media_attachments; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.media_attachments (
    id integer NOT NULL,
    media_id uuid NOT NULL,
    entity_type text NOT NULL,
    entity_id integer NOT NULL,
    role text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    display_name text,
    project_folder_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT media_attachments_entity_type_valid CHECK ((entity_type = ANY (ARRAY['project'::text, 'finance_transaction'::text, 'finance_obligation'::text, 'contact'::text, 'figure'::text, 'finance_vendor'::text, 'timeline_event'::text, 'journal_entry'::text]))),
    CONSTRAINT media_attachments_role_valid CHECK ((role = ANY (ARRAY['gallery'::text, 'cover'::text, 'photo'::text, 'logo'::text])))
);
-- Name: media_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.media_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: media_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.media_attachments_id_seq OWNED BY public.media_attachments.id;
-- Name: media_folders; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.media_folders (
    id uuid NOT NULL,
    user_id integer NOT NULL,
    parent_folder_id uuid,
    name text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT media_folders_name_nonempty CHECK ((char_length(TRIM(BOTH FROM name)) > 0))
);
-- Name: media_objects; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.media_objects (
    id uuid NOT NULL,
    user_id integer NOT NULL,
    folder_id uuid,
    storage_key text NOT NULL,
    original_filename text NOT NULL,
    mime_type text NOT NULL,
    byte_size bigint NOT NULL,
    media_kind text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    sha256 text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT media_objects_byte_size_positive CHECK ((byte_size > 0)),
    CONSTRAINT media_objects_kind_valid CHECK ((media_kind = ANY (ARRAY['image'::text, 'video'::text, 'audio'::text, 'document'::text, 'model_3d'::text, 'other'::text]))),
    CONSTRAINT media_objects_original_filename_nonempty CHECK ((char_length(TRIM(BOTH FROM original_filename)) > 0)),
    CONSTRAINT media_objects_status_valid CHECK ((status = ANY (ARRAY['pending'::text, 'ready'::text, 'deleted'::text])))
);
-- Name: media_panel_items; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.media_panel_items (
    id uuid NOT NULL,
    panel_id uuid NOT NULL,
    media_id uuid NOT NULL,
    grid_x integer DEFAULT 0 NOT NULL,
    grid_y integer DEFAULT 0 NOT NULL,
    col_span integer DEFAULT 1 NOT NULL,
    row_span integer DEFAULT 1 NOT NULL,
    preview_scale real DEFAULT 1.0 NOT NULL,
    preview_focal_x real DEFAULT 0.5 NOT NULL,
    preview_focal_y real DEFAULT 0.5 NOT NULL,
    border_color text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT media_panel_items_border_color_valid CHECK (((border_color IS NULL) OR ((char_length(border_color) = 7) AND (border_color ~ '^#[0-9A-Fa-f]{6}$'::text)))),
    CONSTRAINT media_panel_items_col_span_valid CHECK ((col_span >= 1)),
    CONSTRAINT media_panel_items_grid_x_valid CHECK ((grid_x >= 0)),
    CONSTRAINT media_panel_items_grid_y_valid CHECK ((grid_y >= 0)),
    CONSTRAINT media_panel_items_preview_focal_x_valid CHECK (((preview_focal_x >= (0.0)::double precision) AND (preview_focal_x <= (1.0)::double precision))),
    CONSTRAINT media_panel_items_preview_focal_y_valid CHECK (((preview_focal_y >= (0.0)::double precision) AND (preview_focal_y <= (1.0)::double precision))),
    CONSTRAINT media_panel_items_preview_scale_valid CHECK (((preview_scale >= (1.0)::double precision) AND (preview_scale <= (8.0)::double precision))),
    CONSTRAINT media_panel_items_row_span_valid CHECK ((row_span >= 1))
);
-- Name: media_panels; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.media_panels (
    id uuid NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    column_count integer DEFAULT 12 NOT NULL,
    row_unit_px integer DEFAULT 64 NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT media_panels_column_count_valid CHECK ((column_count >= 1)),
    CONSTRAINT media_panels_name_nonempty CHECK ((char_length(TRIM(BOTH FROM name)) > 0)),
    CONSTRAINT media_panels_row_unit_px_valid CHECK ((row_unit_px >= 16))
);
-- Name: messages; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    role text NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    agent_id text,
    agents_used text[] DEFAULT '{}'::text[] NOT NULL,
    provider text,
    model text,
    input_tokens integer,
    output_tokens integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text, 'tool'::text])))
);
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;
-- Name: model_modalities; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.model_modalities (
    key text NOT NULL,
    display_name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Name: model_providers; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.model_providers (
    id integer NOT NULL,
    key text NOT NULL,
    display_name text NOT NULL,
    base_url text,
    is_enabled boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT model_providers_key_nonempty CHECK ((char_length(TRIM(BOTH FROM key)) > 0))
);
-- Name: model_providers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.model_providers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: model_providers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.model_providers_id_seq OWNED BY public.model_providers.id;
-- Name: models; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.models (
    id integer NOT NULL,
    key text NOT NULL,
    provider_id integer NOT NULL,
    modality_key text DEFAULT 'llm'::text NOT NULL,
    display_name text NOT NULL,
    max_context_window integer,
    input_price_per_1m numeric(12,4),
    output_price_per_1m numeric(12,4),
    capabilities jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    is_provider_default boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT models_key_nonempty CHECK ((char_length(TRIM(BOTH FROM key)) > 0))
);
-- Name: models_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.models_id_seq OWNED BY public.models.id;
-- Name: project_canvas; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.project_canvas (
    id integer NOT NULL,
    project_id integer NOT NULL,
    user_id integer NOT NULL,
    name text DEFAULT 'Main'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    state jsonb DEFAULT '{}'::jsonb NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT project_canvas_name_nonempty CHECK ((char_length(TRIM(BOTH FROM name)) > 0)),
    CONSTRAINT project_canvas_settings_object CHECK ((jsonb_typeof(settings) = 'object'::text)),
    CONSTRAINT project_canvas_state_object CHECK ((jsonb_typeof(state) = 'object'::text))
);
-- Name: project_canvas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.project_canvas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: project_canvas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.project_canvas_id_seq OWNED BY public.project_canvas.id;
-- Name: project_folders; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.project_folders (
    id uuid NOT NULL,
    project_id integer NOT NULL,
    user_id integer NOT NULL,
    parent_folder_id uuid,
    name text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT project_folders_name_nonempty CHECK ((char_length(TRIM(BOTH FROM name)) > 0))
);
-- Name: project_tag_assignments; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.project_tag_assignments (
    project_id integer NOT NULL,
    tag_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Name: project_tags; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.project_tags (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    description text,
    color_hex text DEFAULT '#06B6D4'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT project_tags_color_hex_valid CHECK ((color_hex ~ '^#[0-9A-Fa-f]{6}$'::text)),
    CONSTRAINT project_tags_name_nonempty CHECK ((char_length(TRIM(BOTH FROM name)) > 0))
);
-- Name: project_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.project_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: project_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.project_tags_id_seq OWNED BY public.project_tags.id;
-- Name: projects; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.projects (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'planning'::text NOT NULL,
    kind text,
    cover_glow_color_hex text,
    cover_model_color_hex text,
    cover_model_brightness real DEFAULT 1.0 NOT NULL,
    cover_image_scale real DEFAULT 1.0 NOT NULL,
    cover_image_position_x real DEFAULT 50.0 NOT NULL,
    cover_image_position_y real DEFAULT 50.0 NOT NULL,
    kanban_card_color_hex text,
    title_font_key text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT projects_cover_glow_color_hex_valid CHECK (((cover_glow_color_hex IS NULL) OR (cover_glow_color_hex ~ '^#[0-9A-Fa-f]{6}$'::text))),
    CONSTRAINT projects_cover_image_position_x_valid CHECK (((cover_image_position_x >= (0.0)::double precision) AND (cover_image_position_x <= (100.0)::double precision))),
    CONSTRAINT projects_cover_image_position_y_valid CHECK (((cover_image_position_y >= (0.0)::double precision) AND (cover_image_position_y <= (100.0)::double precision))),
    CONSTRAINT projects_cover_image_scale_valid CHECK (((cover_image_scale >= (0.25)::double precision) AND (cover_image_scale <= (3.0)::double precision))),
    CONSTRAINT projects_cover_model_brightness_valid CHECK (((cover_model_brightness >= (0.5)::double precision) AND (cover_model_brightness <= (2.0)::double precision))),
    CONSTRAINT projects_cover_model_color_hex_valid CHECK (((cover_model_color_hex IS NULL) OR (cover_model_color_hex ~ '^#[0-9A-Fa-f]{6}$'::text))),
    CONSTRAINT projects_kanban_card_color_hex_valid CHECK (((kanban_card_color_hex IS NULL) OR (kanban_card_color_hex ~ '^#[0-9A-Fa-f]{6}$'::text))),
    CONSTRAINT projects_status_valid CHECK ((status = ANY (ARRAY['planning'::text, 'active'::text, 'paused'::text, 'completed'::text, 'archived'::text]))),
    CONSTRAINT projects_title_font_key_valid CHECK (((title_font_key IS NULL) OR (title_font_key = ANY (ARRAY['default'::text, 'serif'::text, 'mono'::text, 'rounded'::text, 'condensed'::text, 'handwritten'::text, 'display'::text, 'elegant'::text, 'slab'::text, 'bold'::text, 'retro'::text, 'tech'::text, 'classic'::text, 'wide'::text])))),
    CONSTRAINT projects_title_nonempty CHECK ((char_length(TRIM(BOTH FROM title)) > 0))
);
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;
-- Name: quotes; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.quotes (
    id integer NOT NULL,
    text text NOT NULL,
    author text NOT NULL,
    CONSTRAINT quotes_author_nonempty CHECK ((char_length(TRIM(BOTH FROM author)) > 0)),
    CONSTRAINT quotes_text_nonempty CHECK ((char_length(TRIM(BOTH FROM text)) > 0))
);
-- Name: quotes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.quotes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: quotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.quotes_id_seq OWNED BY public.quotes.id;
-- Name: services; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.services (
    id integer NOT NULL,
    user_id integer NOT NULL,
    service_name text NOT NULL,
    url text NOT NULL,
    service_type text DEFAULT 'frontend'::text NOT NULL,
    description text,
    check_enabled boolean DEFAULT true NOT NULL,
    expected_status_code integer DEFAULT 200 NOT NULL,
    failure_threshold integer DEFAULT 3 NOT NULL,
    last_status text,
    last_checked_at timestamp with time zone,
    response_time_ms integer,
    status_code integer,
    error_message text,
    consecutive_failures integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT services_consecutive_failures_nonnegative CHECK ((consecutive_failures >= 0)),
    CONSTRAINT services_expected_status_valid CHECK (((expected_status_code >= 100) AND (expected_status_code <= 599))),
    CONSTRAINT services_failure_threshold_positive CHECK ((failure_threshold >= 1)),
    CONSTRAINT services_last_status_valid CHECK (((last_status IS NULL) OR (last_status = ANY (ARRAY['up'::text, 'down'::text, 'caution'::text])))),
    CONSTRAINT services_name_nonempty CHECK ((char_length(TRIM(BOTH FROM service_name)) > 0)),
    CONSTRAINT services_service_type_valid CHECK ((service_type = ANY (ARRAY['frontend'::text, 'backend'::text]))),
    CONSTRAINT services_url_http CHECK ((url ~* '^https?://'::text)),
    CONSTRAINT services_url_nonempty CHECK ((char_length(TRIM(BOTH FROM url)) > 0))
);
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    session_token_hash text NOT NULL,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    last_seen_at timestamp with time zone,
    invalidated_at timestamp with time zone
);
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;
-- Name: system_prompts; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.system_prompts (
    id integer NOT NULL,
    key text NOT NULL,
    display_name text NOT NULL,
    identity text NOT NULL,
    purpose text NOT NULL,
    guidelines text NOT NULL,
    domain_reference text NOT NULL,
    tool_guidance text,
    safety text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT system_prompts_domain_reference_nonempty CHECK ((char_length(TRIM(BOTH FROM domain_reference)) > 0)),
    CONSTRAINT system_prompts_guidelines_nonempty CHECK ((char_length(TRIM(BOTH FROM guidelines)) > 0)),
    CONSTRAINT system_prompts_identity_nonempty CHECK ((char_length(TRIM(BOTH FROM identity)) > 0)),
    CONSTRAINT system_prompts_key_nonempty CHECK ((char_length(TRIM(BOTH FROM key)) > 0)),
    CONSTRAINT system_prompts_purpose_nonempty CHECK ((char_length(TRIM(BOTH FROM purpose)) > 0)),
    CONSTRAINT system_prompts_safety_nonempty CHECK ((char_length(TRIM(BOTH FROM safety)) > 0))
);
-- Name: system_prompts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.system_prompts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: system_prompts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.system_prompts_id_seq OWNED BY public.system_prompts.id;
-- Name: timeline_event_contacts; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.timeline_event_contacts (
    timeline_event_id integer NOT NULL,
    contact_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Name: timeline_event_figures; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.timeline_event_figures (
    timeline_event_id integer NOT NULL,
    figure_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Name: timeline_event_reminders; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.timeline_event_reminders (
    id integer NOT NULL,
    timeline_event_id integer NOT NULL,
    amount integer NOT NULL,
    unit text NOT NULL,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT timeline_event_reminders_amount_positive CHECK ((amount > 0)),
    CONSTRAINT timeline_event_reminders_unit_valid CHECK ((unit = ANY (ARRAY['minutes'::text, 'hours'::text, 'days'::text])))
);
-- Name: timeline_event_reminders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.timeline_event_reminders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: timeline_event_reminders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.timeline_event_reminders_id_seq OWNED BY public.timeline_event_reminders.id;
-- Name: timeline_events; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.timeline_events (
    id integer NOT NULL,
    user_id integer NOT NULL,
    subject_name text,
    description text NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    all_day boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT timeline_events_description_nonempty CHECK ((char_length(TRIM(BOTH FROM description)) > 0)),
    CONSTRAINT timeline_events_end_on_or_after_start CHECK (((end_date IS NULL) OR (end_date >= start_date)))
);
-- Name: timeline_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.timeline_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: timeline_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.timeline_events_id_seq OWNED BY public.timeline_events.id;
-- Name: timeline_plan_items; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.timeline_plan_items (
    id integer NOT NULL,
    user_id integer NOT NULL,
    plan_id integer NOT NULL,
    title text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    start_at timestamp with time zone NOT NULL,
    end_at timestamp with time zone,
    all_day boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'planned'::text NOT NULL,
    timeline_event_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT timeline_plan_items_end_on_or_after_start CHECK (((end_at IS NULL) OR (end_at >= start_at))),
    CONSTRAINT timeline_plan_items_status_valid CHECK ((status = ANY (ARRAY['planned'::text, 'done'::text, 'skipped'::text]))),
    CONSTRAINT timeline_plan_items_title_nonempty CHECK ((char_length(TRIM(BOTH FROM title)) > 0))
);
-- Name: timeline_plan_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.timeline_plan_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: timeline_plan_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.timeline_plan_items_id_seq OWNED BY public.timeline_plan_items.id;
-- Name: timeline_plans; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.timeline_plans (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT timeline_plans_end_on_or_after_start CHECK ((end_date >= start_date)),
    CONSTRAINT timeline_plans_title_nonempty CHECK ((char_length(TRIM(BOTH FROM title)) > 0))
);
-- Name: timeline_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.timeline_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: timeline_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.timeline_plans_id_seq OWNED BY public.timeline_plans.id;
-- Name: timeline_tag_assignments; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.timeline_tag_assignments (
    tag_id integer NOT NULL,
    timeline_event_id integer,
    timeline_plan_item_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT timeline_tag_assignments_one_entity CHECK ((((timeline_event_id IS NOT NULL) AND (timeline_plan_item_id IS NULL)) OR ((timeline_event_id IS NULL) AND (timeline_plan_item_id IS NOT NULL))))
);
-- Name: timeline_tags; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.timeline_tags (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    description text,
    color_hex text DEFAULT '#06B6D4'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT timeline_tags_color_hex_valid CHECK ((color_hex ~ '^#[0-9A-Fa-f]{6}$'::text)),
    CONSTRAINT timeline_tags_name_nonempty CHECK ((char_length(TRIM(BOTH FROM name)) > 0))
);
-- Name: timeline_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.timeline_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: timeline_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.timeline_tags_id_seq OWNED BY public.timeline_tags.id;
-- Name: tool_calls; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.tool_calls (
    id integer NOT NULL,
    message_id integer NOT NULL,
    tool_name text NOT NULL,
    category text,
    tool_call_json jsonb NOT NULL,
    tool_response_json jsonb,
    duration_seconds double precision,
    call_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tool_calls_call_order_check CHECK ((call_order >= 0))
);
-- Name: tool_calls_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.tool_calls_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: tool_calls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.tool_calls_id_seq OWNED BY public.tool_calls.id;
-- Name: tool_categories; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.tool_categories (
    id integer NOT NULL,
    key text NOT NULL,
    display_name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tool_categories_key_nonempty CHECK ((char_length(TRIM(BOTH FROM key)) > 0))
);
-- Name: tool_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.tool_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: tool_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.tool_categories_id_seq OWNED BY public.tool_categories.id;
-- Name: tools; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.tools (
    id integer NOT NULL,
    name text NOT NULL,
    category_id integer NOT NULL,
    description text NOT NULL,
    parameters jsonb DEFAULT '{}'::jsonb NOT NULL,
    returns text DEFAULT ''::text NOT NULL,
    examples jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tools_name_nonempty CHECK ((char_length(TRIM(BOTH FROM name)) > 0))
);
-- Name: tools_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.tools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: tools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.tools_id_seq OWNED BY public.tools.id;
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.user_preferences (
    user_id integer NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_preferences_data_object CHECK ((jsonb_typeof(data) = 'object'::text))
);
-- Name: users; Type: TABLE; Schema: public; Owner: -
CREATE TABLE public.users (
    id integer NOT NULL,
    provider text NOT NULL,
    provider_user_id text NOT NULL,
    email text NOT NULL,
    display_name text NOT NULL,
    picture_url text,
    chat_llm_provider text,
    chat_llm_model text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    contact_id integer
);
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
-- Name: agents id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.agents ALTER COLUMN id SET DEFAULT nextval('public.agents_id_seq'::regclass);
-- Name: catalog_media id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.catalog_media ALTER COLUMN id SET DEFAULT nextval('public.catalog_media_id_seq'::regclass);
-- Name: chat_rules id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.chat_rules ALTER COLUMN id SET DEFAULT nextval('public.chat_rules_id_seq'::regclass);
-- Name: coak_items id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.coak_items ALTER COLUMN id SET DEFAULT nextval('public.coak_items_id_seq'::regclass);
-- Name: coak_records id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.coak_records ALTER COLUMN id SET DEFAULT nextval('public.coak_records_id_seq'::regclass);
-- Name: coak_tags id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.coak_tags ALTER COLUMN id SET DEFAULT nextval('public.coak_tags_id_seq'::regclass);
-- Name: contact_relationships id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.contact_relationships ALTER COLUMN id SET DEFAULT nextval('public.contact_relationships_id_seq'::regclass);
-- Name: contact_tags id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.contact_tags ALTER COLUMN id SET DEFAULT nextval('public.contact_tags_id_seq'::regclass);
-- Name: contacts id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.contacts ALTER COLUMN id SET DEFAULT nextval('public.contacts_id_seq'::regclass);
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);
-- Name: figures id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.figures ALTER COLUMN id SET DEFAULT nextval('public.figures_id_seq'::regclass);
-- Name: finance_listing_proposals id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_listing_proposals ALTER COLUMN id SET DEFAULT nextval('public.finance_listing_proposals_id_seq'::regclass);
-- Name: finance_obligation_tags id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_obligation_tags ALTER COLUMN id SET DEFAULT nextval('public.finance_obligation_tags_id_seq'::regclass);
-- Name: finance_obligations id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_obligations ALTER COLUMN id SET DEFAULT nextval('public.finance_obligations_id_seq'::regclass);
-- Name: finance_payment_methods id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_payment_methods ALTER COLUMN id SET DEFAULT nextval('public.finance_payment_methods_id_seq'::regclass);
-- Name: finance_transaction_tags id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_transaction_tags ALTER COLUMN id SET DEFAULT nextval('public.finance_transaction_tags_id_seq'::regclass);
-- Name: finance_transactions id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_transactions ALTER COLUMN id SET DEFAULT nextval('public.finance_transactions_id_seq'::regclass);
-- Name: finance_vendors id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_vendors ALTER COLUMN id SET DEFAULT nextval('public.finance_vendors_id_seq'::regclass);
-- Name: focus_node_time_entries id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.focus_node_time_entries ALTER COLUMN id SET DEFAULT nextval('public.focus_node_time_entries_id_seq'::regclass);
-- Name: focus_nodes id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.focus_nodes ALTER COLUMN id SET DEFAULT nextval('public.focus_nodes_id_seq'::regclass);
-- Name: focus_tags id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.focus_tags ALTER COLUMN id SET DEFAULT nextval('public.focus_tags_id_seq'::regclass);
-- Name: journal_entries id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.journal_entries ALTER COLUMN id SET DEFAULT nextval('public.journal_entries_id_seq'::regclass);
-- Name: journal_tags id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.journal_tags ALTER COLUMN id SET DEFAULT nextval('public.journal_tags_id_seq'::regclass);
-- Name: media_attachments id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.media_attachments ALTER COLUMN id SET DEFAULT nextval('public.media_attachments_id_seq'::regclass);
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);
-- Name: model_providers id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.model_providers ALTER COLUMN id SET DEFAULT nextval('public.model_providers_id_seq'::regclass);
-- Name: models id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.models ALTER COLUMN id SET DEFAULT nextval('public.models_id_seq'::regclass);
-- Name: project_canvas id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.project_canvas ALTER COLUMN id SET DEFAULT nextval('public.project_canvas_id_seq'::regclass);
-- Name: project_tags id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.project_tags ALTER COLUMN id SET DEFAULT nextval('public.project_tags_id_seq'::regclass);
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);
-- Name: quotes id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.quotes ALTER COLUMN id SET DEFAULT nextval('public.quotes_id_seq'::regclass);
-- Name: services id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);
-- Name: system_prompts id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.system_prompts ALTER COLUMN id SET DEFAULT nextval('public.system_prompts_id_seq'::regclass);
-- Name: timeline_event_reminders id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_event_reminders ALTER COLUMN id SET DEFAULT nextval('public.timeline_event_reminders_id_seq'::regclass);
-- Name: timeline_events id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_events ALTER COLUMN id SET DEFAULT nextval('public.timeline_events_id_seq'::regclass);
-- Name: timeline_plan_items id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_plan_items ALTER COLUMN id SET DEFAULT nextval('public.timeline_plan_items_id_seq'::regclass);
-- Name: timeline_plans id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_plans ALTER COLUMN id SET DEFAULT nextval('public.timeline_plans_id_seq'::regclass);
-- Name: timeline_tags id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_tags ALTER COLUMN id SET DEFAULT nextval('public.timeline_tags_id_seq'::regclass);
-- Name: tool_calls id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.tool_calls ALTER COLUMN id SET DEFAULT nextval('public.tool_calls_id_seq'::regclass);
-- Name: tool_categories id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.tool_categories ALTER COLUMN id SET DEFAULT nextval('public.tool_categories_id_seq'::regclass);
-- Name: tools id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.tools ALTER COLUMN id SET DEFAULT nextval('public.tools_id_seq'::regclass);
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);
-- Name: agent_delegations agent_delegations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.agent_delegations
    ADD CONSTRAINT agent_delegations_pkey PRIMARY KEY (parent_agent_id, child_agent_id);
-- Name: agent_llm_preferences agent_llm_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.agent_llm_preferences
    ADD CONSTRAINT agent_llm_preferences_pkey PRIMARY KEY (user_id, agent_id);
-- Name: agent_tool_categories agent_tool_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.agent_tool_categories
    ADD CONSTRAINT agent_tool_categories_pkey PRIMARY KEY (agent_id, category_id);
-- Name: agents agents_key_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_key_key UNIQUE (key);
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);
-- Name: catalog_media catalog_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.catalog_media
    ADD CONSTRAINT catalog_media_pkey PRIMARY KEY (id);
-- Name: chat_rules chat_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.chat_rules
    ADD CONSTRAINT chat_rules_pkey PRIMARY KEY (id);
-- Name: coak_item_tag_assignments coak_item_tag_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.coak_item_tag_assignments
    ADD CONSTRAINT coak_item_tag_assignments_pkey PRIMARY KEY (coak_item_id, tag_id);
-- Name: coak_items coak_items_id_record_unique; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.coak_items
    ADD CONSTRAINT coak_items_id_record_unique UNIQUE (id, coak_record_id);
-- Name: coak_items coak_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.coak_items
    ADD CONSTRAINT coak_items_pkey PRIMARY KEY (id);
-- Name: coak_records coak_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.coak_records
    ADD CONSTRAINT coak_records_pkey PRIMARY KEY (id);
-- Name: coak_tags coak_tags_id_record_unique; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.coak_tags
    ADD CONSTRAINT coak_tags_id_record_unique UNIQUE (id, coak_record_id);
-- Name: coak_tags coak_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.coak_tags
    ADD CONSTRAINT coak_tags_pkey PRIMARY KEY (id);
-- Name: coak_tags coak_tags_record_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.coak_tags
    ADD CONSTRAINT coak_tags_record_name_unique UNIQUE (coak_record_id, name);
-- Name: contact_relationships contact_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.contact_relationships
    ADD CONSTRAINT contact_relationships_pkey PRIMARY KEY (id);
-- Name: contact_relationships contact_relationships_unique_edge; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.contact_relationships
    ADD CONSTRAINT contact_relationships_unique_edge UNIQUE (from_contact_id, to_contact_id, relationship_type);
-- Name: contact_tag_assignments contact_tag_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.contact_tag_assignments
    ADD CONSTRAINT contact_tag_assignments_pkey PRIMARY KEY (contact_id, tag_id);
-- Name: contact_tags contact_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.contact_tags
    ADD CONSTRAINT contact_tags_pkey PRIMARY KEY (id);
-- Name: contact_tags contact_tags_user_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.contact_tags
    ADD CONSTRAINT contact_tags_user_name_unique UNIQUE (user_id, name);
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);
-- Name: deleted_records deleted_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.deleted_records
    ADD CONSTRAINT deleted_records_pkey PRIMARY KEY (id);
-- Name: figures figures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.figures
    ADD CONSTRAINT figures_pkey PRIMARY KEY (id);
-- Name: finance_listing_proposals finance_listing_proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_listing_proposals
    ADD CONSTRAINT finance_listing_proposals_pkey PRIMARY KEY (id);
-- Name: finance_obligation_tag_assignments finance_obligation_tag_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_obligation_tag_assignments
    ADD CONSTRAINT finance_obligation_tag_assignments_pkey PRIMARY KEY (obligation_id, tag_id);
-- Name: finance_obligation_tags finance_obligation_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_obligation_tags
    ADD CONSTRAINT finance_obligation_tags_pkey PRIMARY KEY (id);
-- Name: finance_obligation_tags finance_obligation_tags_user_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_obligation_tags
    ADD CONSTRAINT finance_obligation_tags_user_name_unique UNIQUE (user_id, name);
-- Name: finance_obligations finance_obligations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_obligations
    ADD CONSTRAINT finance_obligations_pkey PRIMARY KEY (id);
-- Name: finance_payment_methods finance_payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_payment_methods
    ADD CONSTRAINT finance_payment_methods_pkey PRIMARY KEY (id);
-- Name: finance_payment_methods finance_payment_methods_user_label_unique; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_payment_methods
    ADD CONSTRAINT finance_payment_methods_user_label_unique UNIQUE (user_id, label);
-- Name: finance_transaction_tag_assignments finance_transaction_tag_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_transaction_tag_assignments
    ADD CONSTRAINT finance_transaction_tag_assignments_pkey PRIMARY KEY (transaction_id, tag_id);
-- Name: finance_transaction_tags finance_transaction_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_transaction_tags
    ADD CONSTRAINT finance_transaction_tags_pkey PRIMARY KEY (id);
-- Name: finance_transaction_tags finance_transaction_tags_user_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_transaction_tags
    ADD CONSTRAINT finance_transaction_tags_user_name_unique UNIQUE (user_id, name);
-- Name: finance_transactions finance_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT finance_transactions_pkey PRIMARY KEY (id);
-- Name: finance_vendors finance_vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_vendors
    ADD CONSTRAINT finance_vendors_pkey PRIMARY KEY (id);
-- Name: finance_vendors finance_vendors_user_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_vendors
    ADD CONSTRAINT finance_vendors_user_name_unique UNIQUE (user_id, name);
-- Name: focus_node_tags focus_node_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.focus_node_tags
    ADD CONSTRAINT focus_node_tags_pkey PRIMARY KEY (node_id, tag_id);
-- Name: focus_node_time_entries focus_node_time_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.focus_node_time_entries
    ADD CONSTRAINT focus_node_time_entries_pkey PRIMARY KEY (id);
-- Name: focus_nodes focus_nodes_id_user_unique; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.focus_nodes
    ADD CONSTRAINT focus_nodes_id_user_unique UNIQUE (id, user_id);
-- Name: focus_nodes focus_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.focus_nodes
    ADD CONSTRAINT focus_nodes_pkey PRIMARY KEY (id);
-- Name: focus_tags focus_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.focus_tags
    ADD CONSTRAINT focus_tags_pkey PRIMARY KEY (id);
-- Name: focus_tags focus_tags_user_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.focus_tags
    ADD CONSTRAINT focus_tags_user_name_unique UNIQUE (user_id, name);
-- Name: game_sessions game_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.game_sessions
    ADD CONSTRAINT game_sessions_pkey PRIMARY KEY (id);
-- Name: game_stats game_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.game_stats
    ADD CONSTRAINT game_stats_pkey PRIMARY KEY (user_id, game_key);
-- Name: job_runs job_runs_celery_task_id_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.job_runs
    ADD CONSTRAINT job_runs_celery_task_id_key UNIQUE (celery_task_id);
-- Name: job_runs job_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.job_runs
    ADD CONSTRAINT job_runs_pkey PRIMARY KEY (id);
-- Name: job_schedules job_schedules_name_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.job_schedules
    ADD CONSTRAINT job_schedules_name_key UNIQUE (name);
-- Name: job_schedules job_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.job_schedules
    ADD CONSTRAINT job_schedules_pkey PRIMARY KEY (id);
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);
-- Name: journal_entry_tag_assignments journal_entry_tag_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.journal_entry_tag_assignments
    ADD CONSTRAINT journal_entry_tag_assignments_pkey PRIMARY KEY (journal_entry_id, tag_id);
-- Name: journal_tags journal_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.journal_tags
    ADD CONSTRAINT journal_tags_pkey PRIMARY KEY (id);
-- Name: journal_tags journal_tags_user_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.journal_tags
    ADD CONSTRAINT journal_tags_user_name_unique UNIQUE (user_id, name);
-- Name: media_attachments media_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.media_attachments
    ADD CONSTRAINT media_attachments_pkey PRIMARY KEY (id);
-- Name: media_folders media_folders_id_user_unique; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.media_folders
    ADD CONSTRAINT media_folders_id_user_unique UNIQUE (id, user_id);
-- Name: media_folders media_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.media_folders
    ADD CONSTRAINT media_folders_pkey PRIMARY KEY (id);
-- Name: media_objects media_objects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.media_objects
    ADD CONSTRAINT media_objects_pkey PRIMARY KEY (id);
-- Name: media_panel_items media_panel_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.media_panel_items
    ADD CONSTRAINT media_panel_items_pkey PRIMARY KEY (id);
-- Name: media_panel_items media_panel_items_unique_media; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.media_panel_items
    ADD CONSTRAINT media_panel_items_unique_media UNIQUE (panel_id, media_id);
-- Name: media_panels media_panels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.media_panels
    ADD CONSTRAINT media_panels_pkey PRIMARY KEY (id);
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
-- Name: model_modalities model_modalities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.model_modalities
    ADD CONSTRAINT model_modalities_pkey PRIMARY KEY (key);
-- Name: model_providers model_providers_key_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.model_providers
    ADD CONSTRAINT model_providers_key_key UNIQUE (key);
-- Name: model_providers model_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.model_providers
    ADD CONSTRAINT model_providers_pkey PRIMARY KEY (id);
-- Name: models models_key_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_key_key UNIQUE (key);
-- Name: models models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_pkey PRIMARY KEY (id);
-- Name: project_canvas project_canvas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.project_canvas
    ADD CONSTRAINT project_canvas_pkey PRIMARY KEY (id);
-- Name: project_folders project_folders_id_project_unique; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.project_folders
    ADD CONSTRAINT project_folders_id_project_unique UNIQUE (id, project_id);
-- Name: project_folders project_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.project_folders
    ADD CONSTRAINT project_folders_pkey PRIMARY KEY (id);
-- Name: project_tag_assignments project_tag_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.project_tag_assignments
    ADD CONSTRAINT project_tag_assignments_pkey PRIMARY KEY (project_id, tag_id);
-- Name: project_tags project_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.project_tags
    ADD CONSTRAINT project_tags_pkey PRIMARY KEY (id);
-- Name: project_tags project_tags_user_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.project_tags
    ADD CONSTRAINT project_tags_user_name_unique UNIQUE (user_id, name);
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);
-- Name: services services_user_name_type_unique; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_user_name_type_unique UNIQUE (user_id, service_name, service_type);
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);
-- Name: sessions sessions_session_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_session_token_hash_key UNIQUE (session_token_hash);
-- Name: system_prompts system_prompts_key_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.system_prompts
    ADD CONSTRAINT system_prompts_key_key UNIQUE (key);
-- Name: system_prompts system_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.system_prompts
    ADD CONSTRAINT system_prompts_pkey PRIMARY KEY (id);
-- Name: timeline_event_contacts timeline_event_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_event_contacts
    ADD CONSTRAINT timeline_event_contacts_pkey PRIMARY KEY (timeline_event_id, contact_id);
-- Name: timeline_event_figures timeline_event_figures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_event_figures
    ADD CONSTRAINT timeline_event_figures_pkey PRIMARY KEY (timeline_event_id, figure_id);
-- Name: timeline_event_reminders timeline_event_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_event_reminders
    ADD CONSTRAINT timeline_event_reminders_pkey PRIMARY KEY (id);
-- Name: timeline_event_reminders timeline_event_reminders_unique_offset; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_event_reminders
    ADD CONSTRAINT timeline_event_reminders_unique_offset UNIQUE (timeline_event_id, amount, unit);
-- Name: timeline_events timeline_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_events
    ADD CONSTRAINT timeline_events_pkey PRIMARY KEY (id);
-- Name: timeline_plan_items timeline_plan_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_plan_items
    ADD CONSTRAINT timeline_plan_items_pkey PRIMARY KEY (id);
-- Name: timeline_plans timeline_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_plans
    ADD CONSTRAINT timeline_plans_pkey PRIMARY KEY (id);
-- Name: timeline_tags timeline_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_tags
    ADD CONSTRAINT timeline_tags_pkey PRIMARY KEY (id);
-- Name: timeline_tags timeline_tags_user_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_tags
    ADD CONSTRAINT timeline_tags_user_name_unique UNIQUE (user_id, name);
-- Name: tool_calls tool_calls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.tool_calls
    ADD CONSTRAINT tool_calls_pkey PRIMARY KEY (id);
-- Name: tool_categories tool_categories_key_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.tool_categories
    ADD CONSTRAINT tool_categories_key_key UNIQUE (key);
-- Name: tool_categories tool_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.tool_categories
    ADD CONSTRAINT tool_categories_pkey PRIMARY KEY (id);
-- Name: tools tools_name_key; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_name_key UNIQUE (name);
-- Name: tools tools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_pkey PRIMARY KEY (id);
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (user_id);
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
-- Name: users users_provider_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_provider_user_id_unique UNIQUE (provider, provider_user_id);
-- Name: game_sessions_active_level_uq; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX game_sessions_active_level_uq ON public.game_sessions USING btree (user_id, game_key, level) WHERE (status = 'in_progress'::text);
-- Name: idx_agent_delegations_child; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_agent_delegations_child ON public.agent_delegations USING btree (child_agent_id);
-- Name: idx_agent_tool_categories_category_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_agent_tool_categories_category_id ON public.agent_tool_categories USING btree (category_id);
-- Name: idx_agents_one_orchestrator; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX idx_agents_one_orchestrator ON public.agents USING btree (is_orchestrator) WHERE (is_orchestrator = true);
-- Name: idx_agents_sort; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_agents_sort ON public.agents USING btree (sort_order, id);
-- Name: idx_catalog_media_agent_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_catalog_media_agent_id ON public.catalog_media USING btree (agent_id);
-- Name: idx_catalog_media_model_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_catalog_media_model_id ON public.catalog_media USING btree (model_id);
-- Name: idx_catalog_media_provider_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_catalog_media_provider_id ON public.catalog_media USING btree (provider_id);
-- Name: idx_catalog_media_tool_category_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_catalog_media_tool_category_id ON public.catalog_media USING btree (tool_category_id);
-- Name: idx_chat_rules_user_sort; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_chat_rules_user_sort ON public.chat_rules USING btree (user_id, sort_order, id);
-- Name: idx_coak_item_tag_assignments_tag_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_coak_item_tag_assignments_tag_id ON public.coak_item_tag_assignments USING btree (tag_id);
-- Name: idx_coak_items_record_parent_sort; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_coak_items_record_parent_sort ON public.coak_items USING btree (coak_record_id, parent_id, sort_order, id);
-- Name: idx_coak_items_unique_sibling_name; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX idx_coak_items_unique_sibling_name ON public.coak_items USING btree (coak_record_id, COALESCE(parent_id, '-1'::integer), lower(name));
-- Name: idx_coak_items_user_record; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_coak_items_user_record ON public.coak_items USING btree (user_id, coak_record_id);
-- Name: idx_coak_records_user_updated; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_coak_records_user_updated ON public.coak_records USING btree (user_id, updated_at DESC);
-- Name: idx_coak_tags_coak_record_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_coak_tags_coak_record_id ON public.coak_tags USING btree (coak_record_id);
-- Name: idx_coak_tags_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_coak_tags_user_id ON public.coak_tags USING btree (user_id);
-- Name: idx_contact_relationships_from; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_contact_relationships_from ON public.contact_relationships USING btree (from_contact_id);
-- Name: idx_contact_relationships_to; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_contact_relationships_to ON public.contact_relationships USING btree (to_contact_id);
-- Name: idx_contact_relationships_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_contact_relationships_user_id ON public.contact_relationships USING btree (user_id);
-- Name: idx_contact_tag_assignments_tag_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_contact_tag_assignments_tag_id ON public.contact_tag_assignments USING btree (tag_id);
-- Name: idx_contact_tags_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_contact_tags_user_id ON public.contact_tags USING btree (user_id);
-- Name: idx_contacts_one_self_per_user; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX idx_contacts_one_self_per_user ON public.contacts USING btree (user_id) WHERE (is_self = true);
-- Name: idx_contacts_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_contacts_user_id ON public.contacts USING btree (user_id);
-- Name: idx_conversations_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_conversations_user_id ON public.conversations USING btree (user_id);
-- Name: idx_conversations_user_project; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_conversations_user_project ON public.conversations USING btree (user_id, project_id);
-- Name: idx_conversations_user_sort; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_conversations_user_sort ON public.conversations USING btree (user_id, project_id, sort_order, id);
-- Name: idx_conversations_user_updated_at; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_conversations_user_updated_at ON public.conversations USING btree (user_id, updated_at DESC);
-- Name: idx_deleted_records_expires_active; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_deleted_records_expires_active ON public.deleted_records USING btree (expires_at) WHERE (permanently_deleted_at IS NULL);
-- Name: idx_deleted_records_user_active; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_deleted_records_user_active ON public.deleted_records USING btree (user_id, deleted_at DESC) WHERE (permanently_deleted_at IS NULL);
-- Name: idx_figures_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_figures_user_id ON public.figures USING btree (user_id);
-- Name: idx_finance_listing_proposals_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_finance_listing_proposals_user_id ON public.finance_listing_proposals USING btree (user_id);
-- Name: idx_finance_listing_proposals_user_status; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_finance_listing_proposals_user_status ON public.finance_listing_proposals USING btree (user_id, status);
-- Name: idx_finance_obligation_tag_assignments_tag_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_finance_obligation_tag_assignments_tag_id ON public.finance_obligation_tag_assignments USING btree (tag_id);
-- Name: idx_finance_obligation_tags_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_finance_obligation_tags_user_id ON public.finance_obligation_tags USING btree (user_id);
-- Name: idx_finance_obligations_user_next_billing; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_finance_obligations_user_next_billing ON public.finance_obligations USING btree (user_id, next_billing_at);
-- Name: idx_finance_obligations_user_status; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_finance_obligations_user_status ON public.finance_obligations USING btree (user_id, status);
-- Name: idx_finance_payment_methods_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_finance_payment_methods_user_id ON public.finance_payment_methods USING btree (user_id);
-- Name: idx_finance_payment_methods_user_sort; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_finance_payment_methods_user_sort ON public.finance_payment_methods USING btree (user_id, sort_order, id);
-- Name: idx_finance_transaction_tag_assignments_tag_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_finance_transaction_tag_assignments_tag_id ON public.finance_transaction_tag_assignments USING btree (tag_id);
-- Name: idx_finance_transaction_tags_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_finance_transaction_tags_user_id ON public.finance_transaction_tags USING btree (user_id);
-- Name: idx_finance_transactions_obligation_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_finance_transactions_obligation_id ON public.finance_transactions USING btree (obligation_id) WHERE (obligation_id IS NOT NULL);
-- Name: idx_finance_transactions_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_finance_transactions_user_id ON public.finance_transactions USING btree (user_id);
-- Name: idx_finance_transactions_user_kind; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_finance_transactions_user_kind ON public.finance_transactions USING btree (user_id, kind);
-- Name: idx_finance_transactions_user_status_sort; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_finance_transactions_user_status_sort ON public.finance_transactions USING btree (user_id, status, sort_order, id);
-- Name: idx_finance_transactions_user_updated_at; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_finance_transactions_user_updated_at ON public.finance_transactions USING btree (user_id, updated_at DESC);
-- Name: idx_finance_transactions_vendor_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_finance_transactions_vendor_id ON public.finance_transactions USING btree (vendor_id);
-- Name: idx_finance_vendors_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_finance_vendors_user_id ON public.finance_vendors USING btree (user_id);
-- Name: idx_focus_node_tags_tag_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_focus_node_tags_tag_id ON public.focus_node_tags USING btree (tag_id);
-- Name: idx_focus_node_time_entries_one_open_per_node; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX idx_focus_node_time_entries_one_open_per_node ON public.focus_node_time_entries USING btree (user_id, node_id) WHERE (status = ANY (ARRAY['running'::text, 'paused'::text]));
-- Name: idx_focus_node_time_entries_user_node_started; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_focus_node_time_entries_user_node_started ON public.focus_node_time_entries USING btree (user_id, node_id, started_at DESC);
-- Name: idx_focus_nodes_one_origin_per_user; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX idx_focus_nodes_one_origin_per_user ON public.focus_nodes USING btree (user_id) WHERE (is_origin = true);
-- Name: idx_focus_nodes_reference_target; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_focus_nodes_reference_target ON public.focus_nodes USING btree (user_id, reference_target_type, reference_target_id) WHERE (kind = 'record'::text);
-- Name: idx_focus_nodes_user_kind_updated; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_focus_nodes_user_kind_updated ON public.focus_nodes USING btree (user_id, kind, updated_at DESC);
-- Name: idx_focus_nodes_user_parent_sort; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_focus_nodes_user_parent_sort ON public.focus_nodes USING btree (user_id, parent_id, sort_order);
-- Name: idx_focus_nodes_user_status; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_focus_nodes_user_status ON public.focus_nodes USING btree (user_id, status, updated_at DESC);
-- Name: idx_focus_tags_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_focus_tags_user_id ON public.focus_tags USING btree (user_id);
-- Name: idx_game_sessions_user_game; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_game_sessions_user_game ON public.game_sessions USING btree (user_id, game_key, updated_at DESC);
-- Name: idx_job_runs_schedule_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_job_runs_schedule_id ON public.job_runs USING btree (schedule_id) WHERE (schedule_id IS NOT NULL);
-- Name: idx_job_runs_status; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_job_runs_status ON public.job_runs USING btree (status);
-- Name: idx_job_runs_task_name_created_at; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_job_runs_task_name_created_at ON public.job_runs USING btree (task_name, created_at DESC);
-- Name: idx_job_runs_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_job_runs_user_id ON public.job_runs USING btree (user_id) WHERE (user_id IS NOT NULL);
-- Name: idx_job_schedules_enabled; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_job_schedules_enabled ON public.job_schedules USING btree (enabled) WHERE (enabled = true);
-- Name: idx_journal_entries_user_entry_date; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_journal_entries_user_entry_date ON public.journal_entries USING btree (user_id, entry_date DESC);
-- Name: idx_journal_entries_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_journal_entries_user_id ON public.journal_entries USING btree (user_id);
-- Name: idx_journal_entry_tag_assignments_tag_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_journal_entry_tag_assignments_tag_id ON public.journal_entry_tag_assignments USING btree (tag_id);
-- Name: idx_journal_tags_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_journal_tags_user_id ON public.journal_tags USING btree (user_id);
-- Name: idx_media_attachments_entity; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_media_attachments_entity ON public.media_attachments USING btree (entity_type, entity_id, role, sort_order, id);
-- Name: idx_media_attachments_one_cover_per_entity; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX idx_media_attachments_one_cover_per_entity ON public.media_attachments USING btree (entity_type, entity_id) WHERE (role = 'cover'::text);
-- Name: idx_media_attachments_one_logo_per_vendor; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX idx_media_attachments_one_logo_per_vendor ON public.media_attachments USING btree (entity_id) WHERE ((entity_type = 'finance_vendor'::text) AND (role = 'logo'::text));
-- Name: idx_media_attachments_one_photo_per_contact; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX idx_media_attachments_one_photo_per_contact ON public.media_attachments USING btree (entity_id) WHERE ((entity_type = 'contact'::text) AND (role = 'photo'::text));
-- Name: idx_media_attachments_one_photo_per_figure; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX idx_media_attachments_one_photo_per_figure ON public.media_attachments USING btree (entity_id) WHERE ((entity_type = 'figure'::text) AND (role = 'photo'::text));
-- Name: idx_media_attachments_project_folder; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_media_attachments_project_folder ON public.media_attachments USING btree (entity_type, entity_id, project_folder_id, sort_order, id) WHERE ((entity_type = 'project'::text) AND (role = 'gallery'::text));
-- Name: idx_media_folders_parent; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_media_folders_parent ON public.media_folders USING btree (user_id, parent_folder_id, sort_order, name) WHERE (deleted_at IS NULL);
-- Name: idx_media_folders_unique_sibling_name; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX idx_media_folders_unique_sibling_name ON public.media_folders USING btree (user_id, parent_folder_id, lower(name)) WHERE (deleted_at IS NULL);
-- Name: idx_media_objects_storage_key; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX idx_media_objects_storage_key ON public.media_objects USING btree (storage_key);
-- Name: idx_media_objects_user_created_at; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_media_objects_user_created_at ON public.media_objects USING btree (user_id, created_at DESC);
-- Name: idx_media_objects_user_folder_created_at; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_media_objects_user_folder_created_at ON public.media_objects USING btree (user_id, folder_id, created_at DESC) WHERE (status <> 'deleted'::text);
-- Name: idx_media_panel_items_media; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_media_panel_items_media ON public.media_panel_items USING btree (media_id);
-- Name: idx_media_panel_items_panel; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_media_panel_items_panel ON public.media_panel_items USING btree (panel_id, grid_y, grid_x);
-- Name: idx_media_panels_user_updated; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_media_panels_user_updated ON public.media_panels USING btree (user_id, updated_at DESC) WHERE (deleted_at IS NULL);
-- Name: idx_messages_conversation_created_at; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_messages_conversation_created_at ON public.messages USING btree (conversation_id, created_at);
-- Name: idx_messages_conversation_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_messages_conversation_id ON public.messages USING btree (conversation_id);
-- Name: idx_model_providers_sort; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_model_providers_sort ON public.model_providers USING btree (sort_order, id);
-- Name: idx_models_modality_key; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_models_modality_key ON public.models USING btree (modality_key, sort_order, id);
-- Name: idx_models_one_default_per_provider; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX idx_models_one_default_per_provider ON public.models USING btree (provider_id) WHERE (is_provider_default = true);
-- Name: idx_models_provider_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_models_provider_id ON public.models USING btree (provider_id, sort_order, id);
-- Name: idx_project_canvas_one_default_per_project; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX idx_project_canvas_one_default_per_project ON public.project_canvas USING btree (project_id) WHERE (is_default = true);
-- Name: idx_project_canvas_project_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_project_canvas_project_id ON public.project_canvas USING btree (project_id);
-- Name: idx_project_folders_parent; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_project_folders_parent ON public.project_folders USING btree (project_id, parent_folder_id, sort_order, name) WHERE (deleted_at IS NULL);
-- Name: idx_project_folders_unique_sibling_name; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX idx_project_folders_unique_sibling_name ON public.project_folders USING btree (project_id, parent_folder_id, lower(name)) WHERE (deleted_at IS NULL);
-- Name: idx_project_tag_assignments_tag_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_project_tag_assignments_tag_id ON public.project_tag_assignments USING btree (tag_id);
-- Name: idx_project_tags_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_project_tags_user_id ON public.project_tags USING btree (user_id);
-- Name: idx_projects_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_projects_user_id ON public.projects USING btree (user_id);
-- Name: idx_projects_user_updated_at; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_projects_user_updated_at ON public.projects USING btree (user_id, updated_at DESC);
-- Name: idx_services_check_enabled; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_services_check_enabled ON public.services USING btree (check_enabled) WHERE (check_enabled = true);
-- Name: idx_services_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_services_user_id ON public.services USING btree (user_id);
-- Name: idx_sessions_token_active_idx; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_sessions_token_active_idx ON public.sessions USING btree (session_token_hash) WHERE (invalidated_at IS NULL);
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);
-- Name: idx_system_prompts_sort; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_system_prompts_sort ON public.system_prompts USING btree (sort_order, id);
-- Name: idx_timeline_event_contacts_contact_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_timeline_event_contacts_contact_id ON public.timeline_event_contacts USING btree (contact_id);
-- Name: idx_timeline_event_figures_figure_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_timeline_event_figures_figure_id ON public.timeline_event_figures USING btree (figure_id);
-- Name: idx_timeline_event_reminders_unsent; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_timeline_event_reminders_unsent ON public.timeline_event_reminders USING btree (timeline_event_id) WHERE (sent_at IS NULL);
-- Name: idx_timeline_events_user_start_date; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_timeline_events_user_start_date ON public.timeline_events USING btree (user_id, start_date DESC);
-- Name: idx_timeline_plan_items_timeline_event; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_timeline_plan_items_timeline_event ON public.timeline_plan_items USING btree (timeline_event_id) WHERE (timeline_event_id IS NOT NULL);
-- Name: idx_timeline_plan_items_user_plan_start; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_timeline_plan_items_user_plan_start ON public.timeline_plan_items USING btree (user_id, plan_id, start_at, sort_order);
-- Name: idx_timeline_plans_id_user; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX idx_timeline_plans_id_user ON public.timeline_plans USING btree (id, user_id);
-- Name: idx_timeline_plans_user_start_date; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_timeline_plans_user_start_date ON public.timeline_plans USING btree (user_id, start_date DESC);
-- Name: idx_timeline_tag_assignments_event_tag; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX idx_timeline_tag_assignments_event_tag ON public.timeline_tag_assignments USING btree (timeline_event_id, tag_id) WHERE (timeline_event_id IS NOT NULL);
-- Name: idx_timeline_tag_assignments_plan_item_tag; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX idx_timeline_tag_assignments_plan_item_tag ON public.timeline_tag_assignments USING btree (timeline_plan_item_id, tag_id) WHERE (timeline_plan_item_id IS NOT NULL);
-- Name: idx_timeline_tag_assignments_tag_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_timeline_tag_assignments_tag_id ON public.timeline_tag_assignments USING btree (tag_id);
-- Name: idx_timeline_tags_user_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_timeline_tags_user_id ON public.timeline_tags USING btree (user_id);
-- Name: idx_tool_calls_message_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_tool_calls_message_id ON public.tool_calls USING btree (message_id);
-- Name: idx_tool_categories_sort; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_tool_categories_sort ON public.tool_categories USING btree (sort_order, id);
-- Name: idx_tools_category_id; Type: INDEX; Schema: public; Owner: -
CREATE INDEX idx_tools_category_id ON public.tools USING btree (category_id, name);
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
CREATE UNIQUE INDEX idx_users_email ON public.users USING btree (email);
-- Name: agent_delegations agent_delegations_child_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.agent_delegations
    ADD CONSTRAINT agent_delegations_child_agent_id_fkey FOREIGN KEY (child_agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;
-- Name: agent_delegations agent_delegations_parent_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.agent_delegations
    ADD CONSTRAINT agent_delegations_parent_agent_id_fkey FOREIGN KEY (parent_agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;
-- Name: agent_llm_preferences agent_llm_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.agent_llm_preferences
    ADD CONSTRAINT agent_llm_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: agent_tool_categories agent_tool_categories_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.agent_tool_categories
    ADD CONSTRAINT agent_tool_categories_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;
-- Name: agent_tool_categories agent_tool_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.agent_tool_categories
    ADD CONSTRAINT agent_tool_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.tool_categories(id) ON DELETE CASCADE;
-- Name: agents agents_system_prompt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_system_prompt_id_fkey FOREIGN KEY (system_prompt_id) REFERENCES public.system_prompts(id) ON DELETE SET NULL;
-- Name: catalog_media catalog_media_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.catalog_media
    ADD CONSTRAINT catalog_media_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;
-- Name: catalog_media catalog_media_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.catalog_media
    ADD CONSTRAINT catalog_media_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.models(id) ON DELETE CASCADE;
-- Name: catalog_media catalog_media_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.catalog_media
    ADD CONSTRAINT catalog_media_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.model_providers(id) ON DELETE CASCADE;
-- Name: catalog_media catalog_media_tool_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.catalog_media
    ADD CONSTRAINT catalog_media_tool_category_id_fkey FOREIGN KEY (tool_category_id) REFERENCES public.tool_categories(id) ON DELETE CASCADE;
-- Name: chat_rules chat_rules_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.chat_rules
    ADD CONSTRAINT chat_rules_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: coak_item_tag_assignments coak_item_tag_assignments_item_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.coak_item_tag_assignments
    ADD CONSTRAINT coak_item_tag_assignments_item_fk FOREIGN KEY (coak_item_id, coak_record_id) REFERENCES public.coak_items(id, coak_record_id) ON DELETE CASCADE;
-- Name: coak_item_tag_assignments coak_item_tag_assignments_tag_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.coak_item_tag_assignments
    ADD CONSTRAINT coak_item_tag_assignments_tag_fk FOREIGN KEY (tag_id, coak_record_id) REFERENCES public.coak_tags(id, coak_record_id) ON DELETE CASCADE;
-- Name: coak_items coak_items_coak_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.coak_items
    ADD CONSTRAINT coak_items_coak_record_id_fkey FOREIGN KEY (coak_record_id) REFERENCES public.coak_records(id) ON DELETE CASCADE;
-- Name: coak_items coak_items_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.coak_items
    ADD CONSTRAINT coak_items_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media_objects(id) ON DELETE SET NULL;
-- Name: coak_items coak_items_parent_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.coak_items
    ADD CONSTRAINT coak_items_parent_fkey FOREIGN KEY (parent_id, coak_record_id) REFERENCES public.coak_items(id, coak_record_id) ON DELETE CASCADE;
-- Name: coak_items coak_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.coak_items
    ADD CONSTRAINT coak_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: coak_records coak_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.coak_records
    ADD CONSTRAINT coak_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: coak_tags coak_tags_coak_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.coak_tags
    ADD CONSTRAINT coak_tags_coak_record_id_fkey FOREIGN KEY (coak_record_id) REFERENCES public.coak_records(id) ON DELETE CASCADE;
-- Name: coak_tags coak_tags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.coak_tags
    ADD CONSTRAINT coak_tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: contact_relationships contact_relationships_from_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.contact_relationships
    ADD CONSTRAINT contact_relationships_from_contact_id_fkey FOREIGN KEY (from_contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;
-- Name: contact_relationships contact_relationships_to_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.contact_relationships
    ADD CONSTRAINT contact_relationships_to_contact_id_fkey FOREIGN KEY (to_contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;
-- Name: contact_relationships contact_relationships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.contact_relationships
    ADD CONSTRAINT contact_relationships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: contact_tag_assignments contact_tag_assignments_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.contact_tag_assignments
    ADD CONSTRAINT contact_tag_assignments_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;
-- Name: contact_tag_assignments contact_tag_assignments_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.contact_tag_assignments
    ADD CONSTRAINT contact_tag_assignments_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.contact_tags(id) ON DELETE CASCADE;
-- Name: contact_tags contact_tags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.contact_tags
    ADD CONSTRAINT contact_tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: contacts contacts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: conversations conversations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
-- Name: conversations conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: deleted_records deleted_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.deleted_records
    ADD CONSTRAINT deleted_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: figures figures_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.figures
    ADD CONSTRAINT figures_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: finance_listing_proposals finance_listing_proposals_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_listing_proposals
    ADD CONSTRAINT finance_listing_proposals_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE SET NULL;
-- Name: finance_listing_proposals finance_listing_proposals_created_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_listing_proposals
    ADD CONSTRAINT finance_listing_proposals_created_transaction_id_fkey FOREIGN KEY (created_transaction_id) REFERENCES public.finance_transactions(id) ON DELETE SET NULL;
-- Name: finance_listing_proposals finance_listing_proposals_created_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_listing_proposals
    ADD CONSTRAINT finance_listing_proposals_created_vendor_id_fkey FOREIGN KEY (created_vendor_id) REFERENCES public.finance_vendors(id) ON DELETE SET NULL;
-- Name: finance_listing_proposals finance_listing_proposals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_listing_proposals
    ADD CONSTRAINT finance_listing_proposals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: finance_obligation_tag_assignments finance_obligation_tag_assignments_obligation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_obligation_tag_assignments
    ADD CONSTRAINT finance_obligation_tag_assignments_obligation_id_fkey FOREIGN KEY (obligation_id) REFERENCES public.finance_obligations(id) ON DELETE CASCADE;
-- Name: finance_obligation_tag_assignments finance_obligation_tag_assignments_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_obligation_tag_assignments
    ADD CONSTRAINT finance_obligation_tag_assignments_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.finance_obligation_tags(id) ON DELETE CASCADE;
-- Name: finance_obligation_tags finance_obligation_tags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_obligation_tags
    ADD CONSTRAINT finance_obligation_tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: finance_obligations finance_obligations_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_obligations
    ADD CONSTRAINT finance_obligations_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.finance_payment_methods(id) ON DELETE SET NULL;
-- Name: finance_obligations finance_obligations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_obligations
    ADD CONSTRAINT finance_obligations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: finance_obligations finance_obligations_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_obligations
    ADD CONSTRAINT finance_obligations_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.finance_vendors(id) ON DELETE SET NULL;
-- Name: finance_payment_methods finance_payment_methods_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_payment_methods
    ADD CONSTRAINT finance_payment_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: finance_transaction_tag_assignments finance_transaction_tag_assignments_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_transaction_tag_assignments
    ADD CONSTRAINT finance_transaction_tag_assignments_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.finance_transaction_tags(id) ON DELETE CASCADE;
-- Name: finance_transaction_tag_assignments finance_transaction_tag_assignments_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_transaction_tag_assignments
    ADD CONSTRAINT finance_transaction_tag_assignments_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.finance_transactions(id) ON DELETE CASCADE;
-- Name: finance_transaction_tags finance_transaction_tags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_transaction_tags
    ADD CONSTRAINT finance_transaction_tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: finance_transactions finance_transactions_obligation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT finance_transactions_obligation_id_fkey FOREIGN KEY (obligation_id) REFERENCES public.finance_obligations(id) ON DELETE SET NULL;
-- Name: finance_transactions finance_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT finance_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: finance_transactions finance_transactions_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT finance_transactions_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.finance_vendors(id) ON DELETE SET NULL;
-- Name: finance_vendors finance_vendors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.finance_vendors
    ADD CONSTRAINT finance_vendors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: focus_node_tags focus_node_tags_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.focus_node_tags
    ADD CONSTRAINT focus_node_tags_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.focus_nodes(id) ON DELETE CASCADE;
-- Name: focus_node_tags focus_node_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.focus_node_tags
    ADD CONSTRAINT focus_node_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.focus_tags(id) ON DELETE CASCADE;
-- Name: focus_node_time_entries focus_node_time_entries_node_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.focus_node_time_entries
    ADD CONSTRAINT focus_node_time_entries_node_user_fkey FOREIGN KEY (node_id, user_id) REFERENCES public.focus_nodes(id, user_id) ON DELETE CASCADE;
-- Name: focus_node_time_entries focus_node_time_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.focus_node_time_entries
    ADD CONSTRAINT focus_node_time_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: focus_nodes focus_nodes_parent_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.focus_nodes
    ADD CONSTRAINT focus_nodes_parent_fkey FOREIGN KEY (parent_id, user_id) REFERENCES public.focus_nodes(id, user_id) ON DELETE CASCADE;
-- Name: focus_nodes focus_nodes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.focus_nodes
    ADD CONSTRAINT focus_nodes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: focus_tags focus_tags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.focus_tags
    ADD CONSTRAINT focus_tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: game_sessions game_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.game_sessions
    ADD CONSTRAINT game_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: game_stats game_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.game_stats
    ADD CONSTRAINT game_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: job_runs job_runs_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.job_runs
    ADD CONSTRAINT job_runs_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.job_schedules(id) ON DELETE SET NULL;
-- Name: job_runs job_runs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.job_runs
    ADD CONSTRAINT job_runs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
-- Name: journal_entries journal_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: journal_entry_tag_assignments journal_entry_tag_assignments_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.journal_entry_tag_assignments
    ADD CONSTRAINT journal_entry_tag_assignments_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE CASCADE;
-- Name: journal_entry_tag_assignments journal_entry_tag_assignments_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.journal_entry_tag_assignments
    ADD CONSTRAINT journal_entry_tag_assignments_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.journal_tags(id) ON DELETE CASCADE;
-- Name: journal_tags journal_tags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.journal_tags
    ADD CONSTRAINT journal_tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: media_attachments media_attachments_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.media_attachments
    ADD CONSTRAINT media_attachments_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media_objects(id) ON DELETE CASCADE;
-- Name: media_attachments media_attachments_project_folder_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.media_attachments
    ADD CONSTRAINT media_attachments_project_folder_fk FOREIGN KEY (project_folder_id) REFERENCES public.project_folders(id) ON DELETE SET NULL;
-- Name: media_folders media_folders_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.media_folders
    ADD CONSTRAINT media_folders_parent_fk FOREIGN KEY (parent_folder_id, user_id) REFERENCES public.media_folders(id, user_id) ON DELETE RESTRICT;
-- Name: media_folders media_folders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.media_folders
    ADD CONSTRAINT media_folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: media_objects media_objects_folder_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.media_objects
    ADD CONSTRAINT media_objects_folder_fk FOREIGN KEY (folder_id, user_id) REFERENCES public.media_folders(id, user_id) ON DELETE SET NULL;
-- Name: media_objects media_objects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.media_objects
    ADD CONSTRAINT media_objects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: media_panel_items media_panel_items_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.media_panel_items
    ADD CONSTRAINT media_panel_items_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media_objects(id) ON DELETE CASCADE;
-- Name: media_panel_items media_panel_items_panel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.media_panel_items
    ADD CONSTRAINT media_panel_items_panel_id_fkey FOREIGN KEY (panel_id) REFERENCES public.media_panels(id) ON DELETE CASCADE;
-- Name: media_panels media_panels_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.media_panels
    ADD CONSTRAINT media_panels_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
-- Name: models models_modality_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_modality_key_fkey FOREIGN KEY (modality_key) REFERENCES public.model_modalities(key);
-- Name: models models_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.model_providers(id) ON DELETE RESTRICT;
-- Name: project_canvas project_canvas_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.project_canvas
    ADD CONSTRAINT project_canvas_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
-- Name: project_canvas project_canvas_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.project_canvas
    ADD CONSTRAINT project_canvas_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: project_folders project_folders_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.project_folders
    ADD CONSTRAINT project_folders_parent_fk FOREIGN KEY (parent_folder_id, project_id) REFERENCES public.project_folders(id, project_id) ON DELETE RESTRICT;
-- Name: project_folders project_folders_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.project_folders
    ADD CONSTRAINT project_folders_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
-- Name: project_folders project_folders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.project_folders
    ADD CONSTRAINT project_folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: project_tag_assignments project_tag_assignments_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.project_tag_assignments
    ADD CONSTRAINT project_tag_assignments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
-- Name: project_tag_assignments project_tag_assignments_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.project_tag_assignments
    ADD CONSTRAINT project_tag_assignments_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.project_tags(id) ON DELETE CASCADE;
-- Name: project_tags project_tags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.project_tags
    ADD CONSTRAINT project_tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: projects projects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: services services_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: timeline_event_contacts timeline_event_contacts_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_event_contacts
    ADD CONSTRAINT timeline_event_contacts_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;
-- Name: timeline_event_contacts timeline_event_contacts_timeline_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_event_contacts
    ADD CONSTRAINT timeline_event_contacts_timeline_event_id_fkey FOREIGN KEY (timeline_event_id) REFERENCES public.timeline_events(id) ON DELETE CASCADE;
-- Name: timeline_event_figures timeline_event_figures_figure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_event_figures
    ADD CONSTRAINT timeline_event_figures_figure_id_fkey FOREIGN KEY (figure_id) REFERENCES public.figures(id) ON DELETE CASCADE;
-- Name: timeline_event_figures timeline_event_figures_timeline_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_event_figures
    ADD CONSTRAINT timeline_event_figures_timeline_event_id_fkey FOREIGN KEY (timeline_event_id) REFERENCES public.timeline_events(id) ON DELETE CASCADE;
-- Name: timeline_event_reminders timeline_event_reminders_timeline_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_event_reminders
    ADD CONSTRAINT timeline_event_reminders_timeline_event_id_fkey FOREIGN KEY (timeline_event_id) REFERENCES public.timeline_events(id) ON DELETE CASCADE;
-- Name: timeline_events timeline_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_events
    ADD CONSTRAINT timeline_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: timeline_plan_items timeline_plan_items_plan_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_plan_items
    ADD CONSTRAINT timeline_plan_items_plan_user_fkey FOREIGN KEY (plan_id, user_id) REFERENCES public.timeline_plans(id, user_id) ON DELETE CASCADE;
-- Name: timeline_plan_items timeline_plan_items_timeline_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_plan_items
    ADD CONSTRAINT timeline_plan_items_timeline_event_id_fkey FOREIGN KEY (timeline_event_id) REFERENCES public.timeline_events(id) ON DELETE SET NULL;
-- Name: timeline_plan_items timeline_plan_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_plan_items
    ADD CONSTRAINT timeline_plan_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: timeline_plans timeline_plans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_plans
    ADD CONSTRAINT timeline_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: timeline_tag_assignments timeline_tag_assignments_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_tag_assignments
    ADD CONSTRAINT timeline_tag_assignments_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.timeline_tags(id) ON DELETE CASCADE;
-- Name: timeline_tag_assignments timeline_tag_assignments_timeline_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_tag_assignments
    ADD CONSTRAINT timeline_tag_assignments_timeline_event_id_fkey FOREIGN KEY (timeline_event_id) REFERENCES public.timeline_events(id) ON DELETE CASCADE;
-- Name: timeline_tag_assignments timeline_tag_assignments_timeline_plan_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_tag_assignments
    ADD CONSTRAINT timeline_tag_assignments_timeline_plan_item_id_fkey FOREIGN KEY (timeline_plan_item_id) REFERENCES public.timeline_plan_items(id) ON DELETE CASCADE;
-- Name: timeline_tags timeline_tags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.timeline_tags
    ADD CONSTRAINT timeline_tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: tool_calls tool_calls_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.tool_calls
    ADD CONSTRAINT tool_calls_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;
-- Name: tools tools_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.tools
    ADD CONSTRAINT tools_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.tool_categories(id) ON DELETE RESTRICT;
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
-- Name: users users_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;
