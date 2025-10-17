--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Debian 17.5-1.pgdg120+1)
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: attendance_status; Type: TYPE; Schema: public; Owner: nom
--

CREATE TYPE public.attendance_status AS ENUM (
    'not_arrived',
    'checked_in',
    'no_show'
);


ALTER TYPE public.attendance_status OWNER TO nom;

--
-- Name: booking_source; Type: TYPE; Schema: public; Owner: nom
--

CREATE TYPE public.booking_source AS ENUM (
    'main_qr',
    'tour_qr',
    'direct',
    'referral',
    'social',
    'other'
);


ALTER TYPE public.booking_source OWNER TO nom;

--
-- Name: booking_status; Type: TYPE; Schema: public; Owner: nom
--

CREATE TYPE public.booking_status AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'completed',
    'no_show'
);


ALTER TYPE public.booking_status OWNER TO nom;

--
-- Name: development_category; Type: TYPE; Schema: public; Owner: nom
--

CREATE TYPE public.development_category AS ENUM (
    'tours',
    'bookings',
    'payments',
    'qr_codes',
    'notifications',
    'analytics',
    'ui_ux',
    'performance',
    'security',
    'integrations',
    'mobile',
    'api',
    'admin',
    'other'
);


ALTER TYPE public.development_category OWNER TO nom;

--
-- Name: development_effort; Type: TYPE; Schema: public; Owner: nom
--

CREATE TYPE public.development_effort AS ENUM (
    'xs',
    's',
    'm',
    'l',
    'xl',
    'xxl'
);


ALTER TYPE public.development_effort OWNER TO nom;

--
-- Name: development_priority; Type: TYPE; Schema: public; Owner: nom
--

CREATE TYPE public.development_priority AS ENUM (
    'critical',
    'high',
    'medium',
    'low',
    'backlog'
);


ALTER TYPE public.development_priority OWNER TO nom;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: nom
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'paid',
    'failed',
    'refunded'
);


ALTER TYPE public.payment_status OWNER TO nom;

--
-- Name: payment_type; Type: TYPE; Schema: public; Owner: nom
--

CREATE TYPE public.payment_type AS ENUM (
    'direct',
    'platform_collected'
);


ALTER TYPE public.payment_type OWNER TO nom;

--
-- Name: payout_status; Type: TYPE; Schema: public; Owner: nom
--

CREATE TYPE public.payout_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);


ALTER TYPE public.payout_status OWNER TO nom;

--
-- Name: qr_category; Type: TYPE; Schema: public; Owner: nom
--

CREATE TYPE public.qr_category AS ENUM (
    'digital',
    'print',
    'partner',
    'event',
    'promo'
);


ALTER TYPE public.qr_category OWNER TO nom;

--
-- Name: recurring_pattern; Type: TYPE; Schema: public; Owner: nom
--

CREATE TYPE public.recurring_pattern AS ENUM (
    'daily',
    'weekly',
    'monthly'
);


ALTER TYPE public.recurring_pattern OWNER TO nom;

--
-- Name: release_status; Type: TYPE; Schema: public; Owner: nom
--

CREATE TYPE public.release_status AS ENUM (
    'planned',
    'in_development',
    'testing',
    'deployed',
    'cancelled'
);


ALTER TYPE public.release_status OWNER TO nom;

--
-- Name: subscription_plan; Type: TYPE; Schema: public; Owner: nom
--

CREATE TYPE public.subscription_plan AS ENUM (
    'free',
    'starter_pro',
    'professional',
    'agency'
);


ALTER TYPE public.subscription_plan OWNER TO nom;

--
-- Name: subscription_status; Type: TYPE; Schema: public; Owner: nom
--

CREATE TYPE public.subscription_status AS ENUM (
    'active',
    'canceled',
    'past_due',
    'unpaid',
    'incomplete',
    'incomplete_expired',
    'trialing'
);


ALTER TYPE public.subscription_status OWNER TO nom;

--
-- Name: time_slot_status; Type: TYPE; Schema: public; Owner: nom
--

CREATE TYPE public.time_slot_status AS ENUM (
    'available',
    'full',
    'cancelled'
);


ALTER TYPE public.time_slot_status OWNER TO nom;

--
-- Name: tour_status; Type: TYPE; Schema: public; Owner: nom
--

CREATE TYPE public.tour_status AS ENUM (
    'active',
    'draft'
);


ALTER TYPE public.tour_status OWNER TO nom;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: nom
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'user'
);


ALTER TYPE public.user_role OWNER TO nom;

--
-- Name: auto_generate_booking_codes(); Type: FUNCTION; Schema: public; Owner: nom
--

CREATE FUNCTION public.auto_generate_booking_codes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
IF NEW.booking_reference IS NULL THEN
NEW.booking_reference := generate_booking_reference();
END IF;
IF NEW.ticket_qr_code IS NULL THEN
NEW.ticket_qr_code := generate_ticket_qr_code();
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION public.auto_generate_booking_codes() OWNER TO nom;

--
-- Name: auto_generate_tour_qr(); Type: FUNCTION; Schema: public; Owner: nom
--

CREATE FUNCTION public.auto_generate_tour_qr() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
IF NEW.qr_code IS NULL THEN
NEW.qr_code := generate_tour_qr_code();
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION public.auto_generate_tour_qr() OWNER TO nom;

--
-- Name: generate_booking_reference(); Type: FUNCTION; Schema: public; Owner: nom
--

CREATE FUNCTION public.generate_booking_reference() RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
RETURN 'BK-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
END;
$$;


ALTER FUNCTION public.generate_booking_reference() OWNER TO nom;

--
-- Name: generate_qr_code(text); Type: FUNCTION; Schema: public; Owner: nom
--

CREATE FUNCTION public.generate_qr_code(prefix text DEFAULT 'QR'::text) RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
RETURN prefix || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
END;
$$;


ALTER FUNCTION public.generate_qr_code(prefix text) OWNER TO nom;

--
-- Name: generate_ticket_qr_code(); Type: FUNCTION; Schema: public; Owner: nom
--

CREATE FUNCTION public.generate_ticket_qr_code() RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
RETURN 'TKT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
END;
$$;


ALTER FUNCTION public.generate_ticket_qr_code() OWNER TO nom;

--
-- Name: generate_tour_qr_code(); Type: FUNCTION; Schema: public; Owner: nom
--

CREATE FUNCTION public.generate_tour_qr_code() RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
RETURN 'TUR-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
END;
$$;


ALTER FUNCTION public.generate_tour_qr_code() OWNER TO nom;

--
-- Name: update_beta_applications_updated_at(); Type: FUNCTION; Schema: public; Owner: nom
--

CREATE FUNCTION public.update_beta_applications_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_beta_applications_updated_at() OWNER TO nom;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: nom
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO nom;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.bookings (
    id text NOT NULL,
    tour_id text NOT NULL,
    time_slot_id text NOT NULL,
    source public.booking_source DEFAULT 'direct'::public.booking_source NOT NULL,
    source_qr_code character varying(100),
    customer_name character varying(255) NOT NULL,
    customer_email character varying(255) NOT NULL,
    customer_phone character varying(50),
    participants integer NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status public.booking_status DEFAULT 'pending'::public.booking_status NOT NULL,
    payment_id character varying(255),
    payment_status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    booking_reference character varying(100) NOT NULL,
    special_requests text,
    ticket_qr_code character varying(100),
    attendance_status public.attendance_status DEFAULT 'not_arrived'::public.attendance_status,
    checked_in_at timestamp with time zone,
    checked_in_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    participant_breakdown json,
    CONSTRAINT check_participants_positive CHECK ((participants > 0)),
    CONSTRAINT check_total_amount_positive CHECK ((total_amount >= (0)::numeric))
);


ALTER TABLE public.bookings OWNER TO nom;

--
-- Name: tours; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.tours (
    id text NOT NULL,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    duration integer NOT NULL,
    capacity integer NOT NULL,
    user_id text NOT NULL,
    images json DEFAULT '[]'::json,
    status public.tour_status DEFAULT 'draft'::public.tour_status NOT NULL,
    location character varying(255),
    included_items json DEFAULT '[]'::json,
    requirements json DEFAULT '[]'::json,
    cancellation_policy text,
    qr_code character varying(100),
    qr_scans integer DEFAULT 0 NOT NULL,
    qr_conversions integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    enable_pricing_tiers boolean DEFAULT false NOT NULL,
    pricing_tiers json,
    public_listing boolean DEFAULT true NOT NULL,
    categories json DEFAULT '[]'::json,
    CONSTRAINT check_capacity_positive CHECK ((capacity > 0)),
    CONSTRAINT check_duration_positive CHECK ((duration > 0)),
    CONSTRAINT check_price_positive CHECK ((price >= (0)::numeric)),
    CONSTRAINT check_qr_conversions_positive CHECK ((qr_conversions >= 0)),
    CONSTRAINT check_qr_scans_positive CHECK ((qr_scans >= 0))
);


ALTER TABLE public.tours OWNER TO nom;

--
-- Name: users; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.users (
    id text NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password text,
    name character varying(255) NOT NULL,
    username character varying(50),
    business_name character varying(255),
    stripe_account_id character varying(255),
    avatar text,
    role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
    phone character varying(50),
    website character varying(255),
    country text,
    description text,
    location character varying(255),
    currency character varying(3) DEFAULT 'EUR'::character varying NOT NULL,
    main_qr_code character varying(100),
    main_qr_scans integer DEFAULT 0 NOT NULL,
    stripe_customer_id character varying(255),
    subscription_plan public.subscription_plan DEFAULT 'free'::public.subscription_plan NOT NULL,
    subscription_status public.subscription_status,
    subscription_id character varying(255),
    subscription_current_period_start timestamp with time zone,
    subscription_current_period_end timestamp with time zone,
    subscription_cancel_at_period_end boolean DEFAULT false NOT NULL,
    monthly_bookings_used integer DEFAULT 0 NOT NULL,
    monthly_bookings_reset_at timestamp with time zone,
    email_verified boolean DEFAULT false NOT NULL,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    promo_code_used character varying(50),
    subscription_discount_percentage integer DEFAULT 0,
    subscription_free_until timestamp with time zone,
    is_lifetime_discount boolean DEFAULT false,
    early_access_member boolean DEFAULT false,
    whatsapp_notifications boolean DEFAULT true NOT NULL,
    bank_account_info text,
    payment_setup boolean DEFAULT false NOT NULL,
    CONSTRAINT check_monthly_bookings_used_positive CHECK ((monthly_bookings_used >= 0)),
    CONSTRAINT check_subscription_discount_percentage CHECK (((subscription_discount_percentage >= 0) AND (subscription_discount_percentage <= 100))),
    CONSTRAINT chk_subscription_discount CHECK (((subscription_discount_percentage >= 0) AND (subscription_discount_percentage <= 100)))
);


ALTER TABLE public.users OWNER TO nom;

--
-- Name: COLUMN users.whatsapp_notifications; Type: COMMENT; Schema: public; Owner: nom
--

COMMENT ON COLUMN public.users.whatsapp_notifications IS 'User preference for receiving WhatsApp notifications (Professional+ feature)';


--
-- Name: analytics_summary; Type: VIEW; Schema: public; Owner: nom
--

CREATE VIEW public.analytics_summary AS
 SELECT COALESCE(u.id, ''::text) AS user_id,
    COALESCE(u.name, 'Unknown Guide'::character varying) AS guide_name,
    COALESCE(count(DISTINCT t.id), (0)::bigint) AS total_tours,
    COALESCE(count(DISTINCT
        CASE
            WHEN (t.status = 'active'::public.tour_status) THEN t.id
            ELSE NULL::text
        END), (0)::bigint) AS active_tours,
    COALESCE(count(DISTINCT b.id), (0)::bigint) AS total_bookings,
    COALESCE(count(DISTINCT
        CASE
            WHEN (b.status = 'confirmed'::public.booking_status) THEN b.id
            ELSE NULL::text
        END), (0)::bigint) AS confirmed_bookings,
    COALESCE(sum(
        CASE
            WHEN (b.status = 'confirmed'::public.booking_status) THEN COALESCE(b.total_amount, (0)::numeric)
            ELSE (0)::numeric
        END), (0)::numeric) AS total_revenue,
    COALESCE(sum(COALESCE(t.qr_scans, 0)), (0)::bigint) AS total_qr_scans,
    COALESCE(sum(COALESCE(t.qr_conversions, 0)), (0)::bigint) AS total_qr_conversions
   FROM ((public.users u
     LEFT JOIN public.tours t ON ((u.id = t.user_id)))
     LEFT JOIN public.bookings b ON ((t.id = b.tour_id)))
  WHERE (u.role = 'user'::public.user_role)
  GROUP BY u.id, u.name;


ALTER VIEW public.analytics_summary OWNER TO nom;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.audit_logs (
    id text DEFAULT concat('audit_', (EXTRACT(epoch FROM now()))::bigint, '_', substr(md5((random())::text), 1, 9)) NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    admin_id text NOT NULL,
    admin_email character varying(255) NOT NULL,
    action character varying(100) NOT NULL,
    resource character varying(50) NOT NULL,
    resource_id text NOT NULL,
    resource_name character varying(255),
    details jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO nom;

--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: nom
--

COMMENT ON TABLE public.audit_logs IS 'Tracks all administrative actions for compliance and accountability';


--
-- Name: COLUMN audit_logs.action; Type: COMMENT; Schema: public; Owner: nom
--

COMMENT ON COLUMN public.audit_logs.action IS 'Type of action performed (update_tour, delete_user, etc.)';


--
-- Name: COLUMN audit_logs.resource; Type: COMMENT; Schema: public; Owner: nom
--

COMMENT ON COLUMN public.audit_logs.resource IS 'Type of resource affected (tour, user, booking, etc.)';


--
-- Name: COLUMN audit_logs.details; Type: COMMENT; Schema: public; Owner: nom
--

COMMENT ON COLUMN public.audit_logs.details IS 'JSON object containing action-specific metadata and context';


--
-- Name: COLUMN audit_logs.created_at; Type: COMMENT; Schema: public; Owner: nom
--

COMMENT ON COLUMN public.audit_logs.created_at IS 'Use for retention policy - keep audit logs for 7 years minimum';


--
-- Name: beta_applications; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.beta_applications (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50),
    website character varying(255),
    business_name character varying(255),
    location character varying(255) NOT NULL,
    country character varying(2) NOT NULL,
    tour_types text NOT NULL,
    tour_frequency text NOT NULL,
    current_booking_method text NOT NULL,
    biggest_challenge text NOT NULL,
    beta_contribution text NOT NULL,
    years_experience integer NOT NULL,
    team_size integer DEFAULT 1 NOT NULL,
    interested_features text[],
    availability_for_feedback boolean DEFAULT true NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    reviewer_notes text,
    reviewed_at timestamp with time zone,
    reviewed_by text,
    referral_source character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.beta_applications OWNER TO nom;

--
-- Name: beta_interviews; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.beta_interviews (
    id text NOT NULL,
    user_id text NOT NULL,
    scheduled_at timestamp with time zone,
    completed_at timestamp with time zone,
    interviewer text,
    notes text,
    recording_url text,
    key_insights text[],
    action_items text[],
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.beta_interviews OWNER TO nom;

--
-- Name: beta_rewards; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.beta_rewards (
    id text NOT NULL,
    user_id text NOT NULL,
    reward_type character varying(50) NOT NULL,
    reward_value text NOT NULL,
    reason text,
    applied_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.beta_rewards OWNER TO nom;

--
-- Name: development_comments; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.development_comments (
    id text NOT NULL,
    development_item_id text NOT NULL,
    user_id text NOT NULL,
    comment text NOT NULL,
    type character varying(50) DEFAULT 'comment'::character varying NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.development_comments OWNER TO nom;

--
-- Name: TABLE development_comments; Type: COMMENT; Schema: public; Owner: nom
--

COMMENT ON TABLE public.development_comments IS 'Comments and activity log for development items';


--
-- Name: development_items; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.development_items (
    id text NOT NULL,
    feedback_id text,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    type character varying(50) NOT NULL,
    priority public.development_priority DEFAULT 'medium'::public.development_priority NOT NULL,
    category public.development_category DEFAULT 'other'::public.development_category NOT NULL,
    effort public.development_effort,
    status character varying(50) DEFAULT 'backlog'::character varying NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    assigned_to text,
    reported_by text,
    user_impact integer DEFAULT 3,
    business_value integer DEFAULT 3,
    technical_notes text,
    acceptance_criteria jsonb DEFAULT '[]'::jsonb,
    tags jsonb DEFAULT '[]'::jsonb,
    target_release character varying(50),
    release_status public.release_status DEFAULT 'planned'::public.release_status,
    blocked_by jsonb DEFAULT '[]'::jsonb,
    blocks jsonb DEFAULT '[]'::jsonb,
    estimated_hours numeric(5,2),
    actual_hours numeric(5,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    target_date timestamp with time zone
);


ALTER TABLE public.development_items OWNER TO nom;

--
-- Name: TABLE development_items; Type: COMMENT; Schema: public; Owner: nom
--

COMMENT ON TABLE public.development_items IS 'Tracks all development tasks including bugs, features, improvements, and technical debt';


--
-- Name: development_metrics; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.development_metrics (
    id text NOT NULL,
    week_number integer NOT NULL,
    year integer NOT NULL,
    story_points_completed integer DEFAULT 0 NOT NULL,
    items_completed integer DEFAULT 0 NOT NULL,
    bugs_fixed integer DEFAULT 0 NOT NULL,
    features_delivered integer DEFAULT 0 NOT NULL,
    bugs_introduced integer DEFAULT 0 NOT NULL,
    cycle_time numeric(5,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.development_metrics OWNER TO nom;

--
-- Name: TABLE development_metrics; Type: COMMENT; Schema: public; Owner: nom
--

COMMENT ON TABLE public.development_metrics IS 'Weekly development velocity and quality metrics';


--
-- Name: email_verification_tokens; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.email_verification_tokens (
    id text NOT NULL,
    user_id text NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.email_verification_tokens OWNER TO nom;

--
-- Name: feature_usage; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.feature_usage (
    id text NOT NULL,
    user_id text NOT NULL,
    feature_name character varying(100) NOT NULL,
    action character varying(100) NOT NULL,
    metadata jsonb,
    session_id text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.feature_usage OWNER TO nom;

--
-- Name: feedback_submissions; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.feedback_submissions (
    id text NOT NULL,
    user_id text NOT NULL,
    type character varying(50) NOT NULL,
    category character varying(100),
    description text NOT NULL,
    urgency integer,
    screenshot_url text,
    browser_info text,
    page_url text,
    status character varying(50) DEFAULT 'new'::character varying,
    admin_notes text,
    resolution text,
    created_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    resolved_by text,
    CONSTRAINT feedback_submissions_urgency_check CHECK (((urgency >= 1) AND (urgency <= 5)))
);


ALTER TABLE public.feedback_submissions OWNER TO nom;

--
-- Name: feedback_votes; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.feedback_votes (
    id text NOT NULL,
    feedback_id text NOT NULL,
    user_id text NOT NULL,
    vote_type character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.feedback_votes OWNER TO nom;

--
-- Name: feedback_with_votes; Type: VIEW; Schema: public; Owner: nom
--

CREATE VIEW public.feedback_with_votes AS
 SELECT f.id,
    f.user_id,
    f.type,
    f.category,
    f.description,
    f.urgency,
    f.screenshot_url,
    f.browser_info,
    f.page_url,
    f.status,
    f.admin_notes,
    f.resolution,
    f.created_at,
    f.resolved_at,
    f.resolved_by,
    u.name AS user_name,
    u.email AS user_email,
    COALESCE(upvotes.count, (0)::bigint) AS upvote_count,
    COALESCE(downvotes.count, (0)::bigint) AS downvote_count,
    (COALESCE(upvotes.count, (0)::bigint) - COALESCE(downvotes.count, (0)::bigint)) AS net_votes
   FROM (((public.feedback_submissions f
     JOIN public.users u ON ((f.user_id = u.id)))
     LEFT JOIN ( SELECT feedback_votes.feedback_id,
            count(*) AS count
           FROM public.feedback_votes
          WHERE ((feedback_votes.vote_type)::text = 'upvote'::text)
          GROUP BY feedback_votes.feedback_id) upvotes ON ((f.id = upvotes.feedback_id)))
     LEFT JOIN ( SELECT feedback_votes.feedback_id,
            count(*) AS count
           FROM public.feedback_votes
          WHERE ((feedback_votes.vote_type)::text = 'downvote'::text)
          GROUP BY feedback_votes.feedback_id) downvotes ON ((f.id = downvotes.feedback_id)));


ALTER VIEW public.feedback_with_votes OWNER TO nom;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    user_id text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data text,
    actions text,
    read boolean DEFAULT false NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO nom;

--
-- Name: oauth_accounts; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.oauth_accounts (
    id text NOT NULL,
    user_id text NOT NULL,
    provider character varying(50) NOT NULL,
    provider_user_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oauth_accounts OWNER TO nom;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.password_reset_tokens (
    id text NOT NULL,
    user_id text NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO nom;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.payments (
    id text NOT NULL,
    booking_id text NOT NULL,
    stripe_payment_intent_id character varying(255) NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'EUR'::character varying NOT NULL,
    status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    refund_amount numeric(10,2),
    processing_fee numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    net_amount numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_type public.payment_type DEFAULT 'direct'::public.payment_type NOT NULL,
    tour_guide_user_id text,
    payout_id text,
    payout_completed boolean DEFAULT false NOT NULL,
    CONSTRAINT check_amount_positive CHECK ((amount >= (0)::numeric)),
    CONSTRAINT check_net_amount_positive CHECK ((net_amount >= (0)::numeric)),
    CONSTRAINT check_processing_fee_positive CHECK ((processing_fee >= (0)::numeric))
);


ALTER TABLE public.payments OWNER TO nom;

--
-- Name: payout_items; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.payout_items (
    id text NOT NULL,
    payout_id text NOT NULL,
    payment_id text NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_payout_item_amount_positive CHECK ((amount >= (0)::numeric))
);


ALTER TABLE public.payout_items OWNER TO nom;

--
-- Name: payouts; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.payouts (
    id text NOT NULL,
    tour_guide_user_id text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    payout_currency character varying(3) NOT NULL,
    exchange_rate numeric(10,6),
    payout_amount_local numeric(10,2),
    stripe_payout_id character varying(255),
    status public.payout_status DEFAULT 'pending'::public.payout_status NOT NULL,
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    bank_account_info jsonb,
    processing_started_at timestamp with time zone,
    completed_at timestamp with time zone,
    failure_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_exchange_rate_positive CHECK (((exchange_rate IS NULL) OR (exchange_rate > (0)::numeric))),
    CONSTRAINT check_payout_amount_local_positive CHECK (((payout_amount_local IS NULL) OR (payout_amount_local >= (0)::numeric))),
    CONSTRAINT check_period_end_after_start CHECK ((period_end > period_start))
);


ALTER TABLE public.payouts OWNER TO nom;

--
-- Name: promo_codes; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.promo_codes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    type character varying(50) NOT NULL,
    discount_percentage integer,
    free_months integer,
    is_lifetime boolean DEFAULT false NOT NULL,
    max_uses integer,
    current_uses integer DEFAULT 0 NOT NULL,
    valid_from timestamp with time zone DEFAULT now() NOT NULL,
    valid_until timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_current_uses_positive CHECK ((current_uses >= 0)),
    CONSTRAINT check_discount_percentage CHECK (((discount_percentage >= 0) AND (discount_percentage <= 100))),
    CONSTRAINT check_free_months_positive CHECK ((free_months >= 0)),
    CONSTRAINT chk_discount_percentage CHECK (((discount_percentage >= 0) AND (discount_percentage <= 100)))
);


ALTER TABLE public.promo_codes OWNER TO nom;

--
-- Name: pulse_surveys; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.pulse_surveys (
    id text NOT NULL,
    user_id text NOT NULL,
    week_number integer NOT NULL,
    year integer NOT NULL,
    satisfaction_score integer,
    improvement_suggestion text,
    nps_score integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pulse_surveys_nps_score_check CHECK (((nps_score >= 0) AND (nps_score <= 10))),
    CONSTRAINT pulse_surveys_satisfaction_score_check CHECK (((satisfaction_score >= 1) AND (satisfaction_score <= 10)))
);


ALTER TABLE public.pulse_surveys OWNER TO nom;

--
-- Name: releases; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.releases (
    id text NOT NULL,
    name character varying(100) NOT NULL,
    version character varying(50) NOT NULL,
    description text,
    status public.release_status DEFAULT 'planned'::public.release_status NOT NULL,
    planned_date timestamp with time zone,
    release_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.releases OWNER TO nom;

--
-- Name: TABLE releases; Type: COMMENT; Schema: public; Owner: nom
--

COMMENT ON TABLE public.releases IS 'Release/milestone tracking';


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    user_id text NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO nom;

--
-- Name: time_slots; Type: TABLE; Schema: public; Owner: nom
--

CREATE TABLE public.time_slots (
    id text NOT NULL,
    tour_id text NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    available_spots integer NOT NULL,
    booked_spots integer DEFAULT 0 NOT NULL,
    status public.time_slot_status DEFAULT 'available'::public.time_slot_status NOT NULL,
    is_recurring boolean DEFAULT false NOT NULL,
    recurring_pattern public.recurring_pattern,
    recurring_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_available_spots_positive CHECK ((available_spots >= 0)),
    CONSTRAINT check_booked_spots_positive CHECK ((booked_spots >= 0)),
    CONSTRAINT check_end_after_start CHECK ((end_time > start_time))
);


ALTER TABLE public.time_slots OWNER TO nom;

--
-- Name: user_engagement_metrics; Type: VIEW; Schema: public; Owner: nom
--

CREATE VIEW public.user_engagement_metrics AS
 SELECT u.id,
    u.name,
    u.email,
    count(DISTINCT f.id) AS feedback_count,
    count(DISTINCT p.id) AS survey_count,
    count(DISTINCT i.id) AS interview_count,
    count(DISTINCT r.id) AS reward_count,
    max(f.created_at) AS last_feedback,
    max(p.created_at) AS last_survey
   FROM ((((public.users u
     LEFT JOIN public.feedback_submissions f ON ((u.id = f.user_id)))
     LEFT JOIN public.pulse_surveys p ON ((u.id = p.user_id)))
     LEFT JOIN public.beta_interviews i ON ((u.id = i.user_id)))
     LEFT JOIN public.beta_rewards r ON ((u.id = r.user_id)))
  WHERE (u.created_at >= (now() - '90 days'::interval))
  GROUP BY u.id, u.name, u.email;


ALTER VIEW public.user_engagement_metrics OWNER TO nom;

--
-- Name: weekly_pulse_averages; Type: VIEW; Schema: public; Owner: nom
--

CREATE VIEW public.weekly_pulse_averages AS
 SELECT year,
    week_number,
    count(DISTINCT user_id) AS respondents,
    avg(satisfaction_score) AS avg_satisfaction,
    avg(nps_score) AS avg_nps,
    count(*) AS total_responses
   FROM public.pulse_surveys
  GROUP BY year, week_number
  ORDER BY year DESC, week_number DESC;


ALTER VIEW public.weekly_pulse_averages OWNER TO nom;

--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: beta_applications beta_applications_email_key; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.beta_applications
    ADD CONSTRAINT beta_applications_email_key UNIQUE (email);


--
-- Name: beta_applications beta_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.beta_applications
    ADD CONSTRAINT beta_applications_pkey PRIMARY KEY (id);


--
-- Name: beta_interviews beta_interviews_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.beta_interviews
    ADD CONSTRAINT beta_interviews_pkey PRIMARY KEY (id);


--
-- Name: beta_rewards beta_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.beta_rewards
    ADD CONSTRAINT beta_rewards_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_booking_reference_key; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_booking_reference_key UNIQUE (booking_reference);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_ticket_qr_code_key; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_ticket_qr_code_key UNIQUE (ticket_qr_code);


--
-- Name: development_comments development_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.development_comments
    ADD CONSTRAINT development_comments_pkey PRIMARY KEY (id);


--
-- Name: development_items development_items_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.development_items
    ADD CONSTRAINT development_items_pkey PRIMARY KEY (id);


--
-- Name: development_metrics development_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.development_metrics
    ADD CONSTRAINT development_metrics_pkey PRIMARY KEY (id);


--
-- Name: development_metrics development_metrics_year_week_number_key; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.development_metrics
    ADD CONSTRAINT development_metrics_year_week_number_key UNIQUE (year, week_number);


--
-- Name: email_verification_tokens email_verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: email_verification_tokens email_verification_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_token_key UNIQUE (token);


--
-- Name: feature_usage feature_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.feature_usage
    ADD CONSTRAINT feature_usage_pkey PRIMARY KEY (id);


--
-- Name: feedback_submissions feedback_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.feedback_submissions
    ADD CONSTRAINT feedback_submissions_pkey PRIMARY KEY (id);


--
-- Name: feedback_votes feedback_votes_feedback_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.feedback_votes
    ADD CONSTRAINT feedback_votes_feedback_id_user_id_key UNIQUE (feedback_id, user_id);


--
-- Name: feedback_votes feedback_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.feedback_votes
    ADD CONSTRAINT feedback_votes_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: oauth_accounts oauth_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.oauth_accounts
    ADD CONSTRAINT oauth_accounts_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payments payments_stripe_payment_intent_id_key; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_stripe_payment_intent_id_key UNIQUE (stripe_payment_intent_id);


--
-- Name: payout_items payout_items_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.payout_items
    ADD CONSTRAINT payout_items_pkey PRIMARY KEY (id);


--
-- Name: payouts payouts_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_pkey PRIMARY KEY (id);


--
-- Name: payouts payouts_stripe_payout_id_key; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_stripe_payout_id_key UNIQUE (stripe_payout_id);


--
-- Name: promo_codes promo_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_code_key UNIQUE (code);


--
-- Name: promo_codes promo_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_pkey PRIMARY KEY (id);


--
-- Name: pulse_surveys pulse_surveys_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.pulse_surveys
    ADD CONSTRAINT pulse_surveys_pkey PRIMARY KEY (id);


--
-- Name: releases releases_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.releases
    ADD CONSTRAINT releases_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: time_slots time_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.time_slots
    ADD CONSTRAINT time_slots_pkey PRIMARY KEY (id);


--
-- Name: tours tours_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_pkey PRIMARY KEY (id);


--
-- Name: tours tours_qr_code_key; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_qr_code_key UNIQUE (qr_code);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_main_qr_code_key; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_main_qr_code_key UNIQUE (main_qr_code);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_admin_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_audit_logs_admin_id ON public.audit_logs USING btree (admin_id);


--
-- Name: idx_audit_logs_admin_timestamp; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_audit_logs_admin_timestamp ON public.audit_logs USING btree (admin_id, "timestamp" DESC);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_resource; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_audit_logs_resource ON public.audit_logs USING btree (resource, resource_id);


--
-- Name: idx_audit_logs_timestamp; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs USING btree ("timestamp" DESC);


--
-- Name: idx_beta_applications_country; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_beta_applications_country ON public.beta_applications USING btree (country);


--
-- Name: idx_beta_applications_created_at; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_beta_applications_created_at ON public.beta_applications USING btree (created_at);


--
-- Name: idx_beta_applications_status; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_beta_applications_status ON public.beta_applications USING btree (status);


--
-- Name: idx_bookings_attendance_status; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_bookings_attendance_status ON public.bookings USING btree (attendance_status);


--
-- Name: idx_bookings_booking_reference; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_bookings_booking_reference ON public.bookings USING btree (booking_reference);


--
-- Name: idx_bookings_created_at; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_bookings_created_at ON public.bookings USING btree (created_at);


--
-- Name: idx_bookings_customer_email; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_bookings_customer_email ON public.bookings USING btree (customer_email);


--
-- Name: idx_bookings_payment_status; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_bookings_payment_status ON public.bookings USING btree (payment_status);


--
-- Name: idx_bookings_source; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_bookings_source ON public.bookings USING btree (source);


--
-- Name: idx_bookings_source_qr_code; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_bookings_source_qr_code ON public.bookings USING btree (source_qr_code);


--
-- Name: idx_bookings_status; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);


--
-- Name: idx_bookings_status_created; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_bookings_status_created ON public.bookings USING btree (status, created_at DESC);


--
-- Name: idx_bookings_ticket_qr_code; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_bookings_ticket_qr_code ON public.bookings USING btree (ticket_qr_code);


--
-- Name: idx_bookings_time_slot_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_bookings_time_slot_id ON public.bookings USING btree (time_slot_id);


--
-- Name: idx_bookings_tour_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_bookings_tour_id ON public.bookings USING btree (tour_id);


--
-- Name: idx_bookings_tour_status_amount; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_bookings_tour_status_amount ON public.bookings USING btree (tour_id, status, total_amount);


--
-- Name: INDEX idx_bookings_tour_status_amount; Type: COMMENT; Schema: public; Owner: nom
--

COMMENT ON INDEX public.idx_bookings_tour_status_amount IS 'Optimize revenue calculations for admin statistics';


--
-- Name: idx_development_comments_created_at; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_development_comments_created_at ON public.development_comments USING btree (created_at DESC);


--
-- Name: idx_development_comments_item_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_development_comments_item_id ON public.development_comments USING btree (development_item_id);


--
-- Name: idx_development_items_assigned_to; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_development_items_assigned_to ON public.development_items USING btree (assigned_to);


--
-- Name: idx_development_items_category; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_development_items_category ON public.development_items USING btree (category);


--
-- Name: idx_development_items_created_at; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_development_items_created_at ON public.development_items USING btree (created_at DESC);


--
-- Name: idx_development_items_feedback_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_development_items_feedback_id ON public.development_items USING btree (feedback_id);


--
-- Name: idx_development_items_priority; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_development_items_priority ON public.development_items USING btree (priority);


--
-- Name: idx_development_items_status; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_development_items_status ON public.development_items USING btree (status);


--
-- Name: idx_development_metrics_year_week; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_development_metrics_year_week ON public.development_metrics USING btree (year, week_number);


--
-- Name: idx_email_verification_tokens_expires_at; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_email_verification_tokens_expires_at ON public.email_verification_tokens USING btree (expires_at);


--
-- Name: idx_email_verification_tokens_token; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_email_verification_tokens_token ON public.email_verification_tokens USING btree (token);


--
-- Name: idx_email_verification_tokens_user_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_email_verification_tokens_user_id ON public.email_verification_tokens USING btree (user_id);


--
-- Name: idx_feedback_created_at; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_feedback_created_at ON public.feedback_submissions USING btree (created_at DESC);


--
-- Name: idx_feedback_status; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_feedback_status ON public.feedback_submissions USING btree (status);


--
-- Name: idx_feedback_type; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_feedback_type ON public.feedback_submissions USING btree (type);


--
-- Name: idx_feedback_user_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_feedback_user_id ON public.feedback_submissions USING btree (user_id);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (read);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_oauth_accounts_provider; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_oauth_accounts_provider ON public.oauth_accounts USING btree (provider);


--
-- Name: idx_oauth_accounts_provider_user; Type: INDEX; Schema: public; Owner: nom
--

CREATE UNIQUE INDEX idx_oauth_accounts_provider_user ON public.oauth_accounts USING btree (provider, provider_user_id);


--
-- Name: idx_oauth_accounts_user_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_oauth_accounts_user_id ON public.oauth_accounts USING btree (user_id);


--
-- Name: idx_password_reset_tokens_expires_at; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens USING btree (expires_at);


--
-- Name: idx_password_reset_tokens_token; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);


--
-- Name: idx_password_reset_tokens_user_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_payments_booking_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_payments_booking_id ON public.payments USING btree (booking_id);


--
-- Name: idx_payments_created_at; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_payments_created_at ON public.payments USING btree (created_at);


--
-- Name: idx_payments_payment_type; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_payments_payment_type ON public.payments USING btree (payment_type);


--
-- Name: idx_payments_payout_completed; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_payments_payout_completed ON public.payments USING btree (payout_completed);


--
-- Name: idx_payments_payout_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_payments_payout_id ON public.payments USING btree (payout_id);


--
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_payments_status ON public.payments USING btree (status);


--
-- Name: idx_payments_stripe_payment_intent_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_payments_stripe_payment_intent_id ON public.payments USING btree (stripe_payment_intent_id);


--
-- Name: idx_payments_tour_guide_user_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_payments_tour_guide_user_id ON public.payments USING btree (tour_guide_user_id);


--
-- Name: idx_payout_items_payment_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_payout_items_payment_id ON public.payout_items USING btree (payment_id);


--
-- Name: idx_payout_items_payout_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_payout_items_payout_id ON public.payout_items USING btree (payout_id);


--
-- Name: idx_payouts_created_at; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_payouts_created_at ON public.payouts USING btree (created_at);


--
-- Name: idx_payouts_status; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_payouts_status ON public.payouts USING btree (status);


--
-- Name: idx_payouts_tour_guide_user_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_payouts_tour_guide_user_id ON public.payouts USING btree (tour_guide_user_id);


--
-- Name: idx_promo_codes_code; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_promo_codes_code ON public.promo_codes USING btree (code);


--
-- Name: idx_promo_codes_current_uses; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_promo_codes_current_uses ON public.promo_codes USING btree (current_uses);


--
-- Name: idx_promo_codes_is_active; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_promo_codes_is_active ON public.promo_codes USING btree (is_active);


--
-- Name: idx_promo_codes_type; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_promo_codes_type ON public.promo_codes USING btree (type);


--
-- Name: idx_promo_codes_valid_from; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_promo_codes_valid_from ON public.promo_codes USING btree (valid_from);


--
-- Name: idx_promo_codes_valid_until; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_promo_codes_valid_until ON public.promo_codes USING btree (valid_until);


--
-- Name: idx_pulse_created_at; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_pulse_created_at ON public.pulse_surveys USING btree (created_at DESC);


--
-- Name: idx_pulse_user_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_pulse_user_id ON public.pulse_surveys USING btree (user_id);


--
-- Name: idx_pulse_week_year; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_pulse_week_year ON public.pulse_surveys USING btree (year, week_number);


--
-- Name: idx_releases_planned_date; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_releases_planned_date ON public.releases USING btree (planned_date);


--
-- Name: idx_releases_status; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_releases_status ON public.releases USING btree (status);


--
-- Name: idx_rewards_type; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_rewards_type ON public.beta_rewards USING btree (reward_type);


--
-- Name: idx_rewards_user_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_rewards_user_id ON public.beta_rewards USING btree (user_id);


--
-- Name: idx_sessions_expires_at; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_sessions_expires_at ON public.sessions USING btree (expires_at);


--
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- Name: idx_time_slots_is_recurring; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_time_slots_is_recurring ON public.time_slots USING btree (is_recurring);


--
-- Name: idx_time_slots_start_time; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_time_slots_start_time ON public.time_slots USING btree (start_time);


--
-- Name: idx_time_slots_status; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_time_slots_status ON public.time_slots USING btree (status);


--
-- Name: idx_time_slots_tour_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_time_slots_tour_id ON public.time_slots USING btree (tour_id);


--
-- Name: idx_time_slots_tour_status_time; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_time_slots_tour_status_time ON public.time_slots USING btree (tour_id, status, start_time);


--
-- Name: idx_tours_created_at; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_tours_created_at ON public.tours USING btree (created_at);


--
-- Name: idx_tours_description_search; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_tours_description_search ON public.tours USING gin (to_tsvector('english'::regconfig, description));


--
-- Name: idx_tours_enable_pricing_tiers; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_tours_enable_pricing_tiers ON public.tours USING btree (enable_pricing_tiers);


--
-- Name: idx_tours_location_status; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_tours_location_status ON public.tours USING btree (location, status) WHERE (location IS NOT NULL);


--
-- Name: idx_tours_name_search; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_tours_name_search ON public.tours USING gin (to_tsvector('english'::regconfig, (name)::text));


--
-- Name: idx_tours_public_listing; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_tours_public_listing ON public.tours USING btree (public_listing, status) WHERE ((public_listing = true) AND (status = 'active'::public.tour_status));


--
-- Name: idx_tours_qr_code; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_tours_qr_code ON public.tours USING btree (qr_code);


--
-- Name: idx_tours_status; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_tours_status ON public.tours USING btree (status);


--
-- Name: idx_tours_status_created; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_tours_status_created ON public.tours USING btree (status, created_at DESC);


--
-- Name: INDEX idx_tours_status_created; Type: COMMENT; Schema: public; Owner: nom
--

COMMENT ON INDEX public.idx_tours_status_created IS 'Optimize admin dashboard tour listing by status and creation date';


--
-- Name: idx_tours_updated_at; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_tours_updated_at ON public.tours USING btree (updated_at);


--
-- Name: idx_tours_user_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_tours_user_id ON public.tours USING btree (user_id);


--
-- Name: idx_tours_user_id_status; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_tours_user_id_status ON public.tours USING btree (user_id, status);


--
-- Name: INDEX idx_tours_user_id_status; Type: COMMENT; Schema: public; Owner: nom
--

COMMENT ON INDEX public.idx_tours_user_id_status IS 'Optimize queries filtering tours by operator and status';


--
-- Name: idx_usage_action; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_usage_action ON public.feature_usage USING btree (action);


--
-- Name: idx_usage_created_at; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_usage_created_at ON public.feature_usage USING btree (created_at DESC);


--
-- Name: idx_usage_feature; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_usage_feature ON public.feature_usage USING btree (feature_name);


--
-- Name: idx_usage_session; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_usage_session ON public.feature_usage USING btree (session_id);


--
-- Name: idx_usage_user_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_usage_user_id ON public.feature_usage USING btree (user_id);


--
-- Name: idx_users_country_payment; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_country_payment ON public.users USING btree (country, payment_setup);


--
-- Name: idx_users_country_role; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_country_role ON public.users USING btree (country, role) WHERE (country IS NOT NULL);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at);


--
-- Name: idx_users_early_access_member; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_early_access_member ON public.users USING btree (early_access_member);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_email_verified; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_email_verified ON public.users USING btree (email_verified, created_at DESC);


--
-- Name: idx_users_main_qr_code; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_main_qr_code ON public.users USING btree (main_qr_code);


--
-- Name: idx_users_monthly_bookings_reset_at; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_monthly_bookings_reset_at ON public.users USING btree (monthly_bookings_reset_at);


--
-- Name: idx_users_name_search; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_name_search ON public.users USING gin (to_tsvector('english'::regconfig, (COALESCE(name, ''::character varying))::text));


--
-- Name: idx_users_payment_setup; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_payment_setup ON public.users USING btree (payment_setup);


--
-- Name: idx_users_promo_code; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_promo_code ON public.users USING btree (promo_code_used);


--
-- Name: idx_users_promo_code_used; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_promo_code_used ON public.users USING btree (promo_code_used);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_role_created; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_role_created ON public.users USING btree (role, created_at DESC);


--
-- Name: INDEX idx_users_role_created; Type: COMMENT; Schema: public; Owner: nom
--

COMMENT ON INDEX public.idx_users_role_created IS 'Optimize admin user management queries';


--
-- Name: idx_users_stripe_customer_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_stripe_customer_id ON public.users USING btree (stripe_customer_id);


--
-- Name: idx_users_subscription_discount_percentage; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_subscription_discount_percentage ON public.users USING btree (subscription_discount_percentage);


--
-- Name: idx_users_subscription_free_until; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_subscription_free_until ON public.users USING btree (subscription_free_until);


--
-- Name: idx_users_subscription_id; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_subscription_id ON public.users USING btree (subscription_id);


--
-- Name: idx_users_subscription_plan; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_subscription_plan ON public.users USING btree (subscription_plan);


--
-- Name: idx_users_subscription_status; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_subscription_status ON public.users USING btree (subscription_status);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: idx_votes_feedback; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_votes_feedback ON public.feedback_votes USING btree (feedback_id);


--
-- Name: idx_votes_user; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX idx_votes_user ON public.feedback_votes USING btree (user_id);


--
-- Name: users_deleted_at_idx; Type: INDEX; Schema: public; Owner: nom
--

CREATE INDEX users_deleted_at_idx ON public.users USING btree (deleted_at);


--
-- Name: bookings auto_booking_codes_trigger; Type: TRIGGER; Schema: public; Owner: nom
--

CREATE TRIGGER auto_booking_codes_trigger BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.auto_generate_booking_codes();


--
-- Name: tours auto_tour_qr_trigger; Type: TRIGGER; Schema: public; Owner: nom
--

CREATE TRIGGER auto_tour_qr_trigger BEFORE INSERT ON public.tours FOR EACH ROW EXECUTE FUNCTION public.auto_generate_tour_qr();


--
-- Name: beta_applications update_beta_applications_updated_at; Type: TRIGGER; Schema: public; Owner: nom
--

CREATE TRIGGER update_beta_applications_updated_at BEFORE UPDATE ON public.beta_applications FOR EACH ROW EXECUTE FUNCTION public.update_beta_applications_updated_at();


--
-- Name: development_items update_development_items_updated_at; Type: TRIGGER; Schema: public; Owner: nom
--

CREATE TRIGGER update_development_items_updated_at BEFORE UPDATE ON public.development_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: releases update_releases_updated_at; Type: TRIGGER; Schema: public; Owner: nom
--

CREATE TRIGGER update_releases_updated_at BEFORE UPDATE ON public.releases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_logs audit_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: beta_interviews beta_interviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.beta_interviews
    ADD CONSTRAINT beta_interviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: beta_rewards beta_rewards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.beta_rewards
    ADD CONSTRAINT beta_rewards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: bookings bookings_checked_in_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_checked_in_by_fkey FOREIGN KEY (checked_in_by) REFERENCES public.users(id);


--
-- Name: bookings bookings_time_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_time_slot_id_fkey FOREIGN KEY (time_slot_id) REFERENCES public.time_slots(id);


--
-- Name: bookings bookings_tour_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(id);


--
-- Name: development_comments development_comments_development_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.development_comments
    ADD CONSTRAINT development_comments_development_item_id_fkey FOREIGN KEY (development_item_id) REFERENCES public.development_items(id) ON DELETE CASCADE;


--
-- Name: email_verification_tokens email_verification_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: feature_usage feature_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.feature_usage
    ADD CONSTRAINT feature_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: feedback_submissions feedback_submissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.feedback_submissions
    ADD CONSTRAINT feedback_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: feedback_votes feedback_votes_feedback_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.feedback_votes
    ADD CONSTRAINT feedback_votes_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES public.feedback_submissions(id);


--
-- Name: feedback_votes feedback_votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.feedback_votes
    ADD CONSTRAINT feedback_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oauth_accounts oauth_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.oauth_accounts
    ADD CONSTRAINT oauth_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: payments payments_tour_guide_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_tour_guide_user_id_fkey FOREIGN KEY (tour_guide_user_id) REFERENCES public.users(id);


--
-- Name: payout_items payout_items_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.payout_items
    ADD CONSTRAINT payout_items_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;


--
-- Name: payout_items payout_items_payout_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.payout_items
    ADD CONSTRAINT payout_items_payout_id_fkey FOREIGN KEY (payout_id) REFERENCES public.payouts(id) ON DELETE CASCADE;


--
-- Name: payouts payouts_tour_guide_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_tour_guide_user_id_fkey FOREIGN KEY (tour_guide_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pulse_surveys pulse_surveys_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.pulse_surveys
    ADD CONSTRAINT pulse_surveys_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: time_slots time_slots_tour_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.time_slots
    ADD CONSTRAINT time_slots_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(id) ON DELETE CASCADE;


--
-- Name: tours tours_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nom
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

