--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: touch_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    post_id integer NOT NULL,
    user_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT comments_content_len CHECK (((char_length(content) >= 1) AND (char_length(content) <= 5000)))
);


--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_messages (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    message text NOT NULL,
    client_ip inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: contact_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contact_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contact_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contact_messages_id_seq OWNED BY public.contact_messages.id;


--
-- Name: content_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_blocks (
    id integer NOT NULL,
    section_id integer NOT NULL,
    title text,
    body text NOT NULL,
    image_url text,
    order_index integer DEFAULT 0 NOT NULL,
    published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: content_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.content_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: content_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.content_blocks_id_seq OWNED BY public.content_blocks.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    author_id integer NOT NULL,
    image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: reflection_daily_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reflection_daily_messages (
    id integer NOT NULL,
    daily_id integer NOT NULL,
    user_id integer NOT NULL,
    username text,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reflection_daily_messages_len CHECK (((char_length(content) >= 1) AND (char_length(content) <= 2000)))
);


--
-- Name: reflection_daily_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reflection_daily_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reflection_daily_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reflection_daily_messages_id_seq OWNED BY public.reflection_daily_messages.id;


--
-- Name: reflection_daily_prompts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reflection_daily_prompts (
    id integer NOT NULL,
    prompt_id integer NOT NULL,
    active_on date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reflection_daily_prompts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reflection_daily_prompts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reflection_daily_prompts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reflection_daily_prompts_id_seq OWNED BY public.reflection_daily_prompts.id;


--
-- Name: reflection_prompts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reflection_prompts (
    id integer NOT NULL,
    text text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reflection_prompts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reflection_prompts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reflection_prompts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reflection_prompts_id_seq OWNED BY public.reflection_prompts.id;


--
-- Name: sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sections (
    id integer NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sections_id_seq OWNED BY public.sections.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text,
    CONSTRAINT users_role_chk CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text]))),
    CONSTRAINT users_username_len_chk CHECK (((char_length(username) >= 3) AND (char_length(username) <= 32)))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: contact_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);


--
-- Name: content_blocks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_blocks ALTER COLUMN id SET DEFAULT nextval('public.content_blocks_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: reflection_daily_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reflection_daily_messages ALTER COLUMN id SET DEFAULT nextval('public.reflection_daily_messages_id_seq'::regclass);


--
-- Name: reflection_daily_prompts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reflection_daily_prompts ALTER COLUMN id SET DEFAULT nextval('public.reflection_daily_prompts_id_seq'::regclass);


--
-- Name: reflection_prompts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reflection_prompts ALTER COLUMN id SET DEFAULT nextval('public.reflection_prompts_id_seq'::regclass);


--
-- Name: sections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections ALTER COLUMN id SET DEFAULT nextval('public.sections_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: content_blocks content_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_blocks
    ADD CONSTRAINT content_blocks_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: reflection_daily_messages reflection_daily_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reflection_daily_messages
    ADD CONSTRAINT reflection_daily_messages_pkey PRIMARY KEY (id);


--
-- Name: reflection_daily_prompts reflection_daily_prompts_active_on_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reflection_daily_prompts
    ADD CONSTRAINT reflection_daily_prompts_active_on_key UNIQUE (active_on);


--
-- Name: reflection_daily_prompts reflection_daily_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reflection_daily_prompts
    ADD CONSTRAINT reflection_daily_prompts_pkey PRIMARY KEY (id);


--
-- Name: reflection_prompts reflection_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reflection_prompts
    ADD CONSTRAINT reflection_prompts_pkey PRIMARY KEY (id);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- Name: sections sections_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_slug_key UNIQUE (slug);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_blocks_section_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blocks_section_order ON public.content_blocks USING btree (section_id, order_index, created_at);


--
-- Name: idx_comments_post_id_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_post_id_created ON public.comments USING btree (post_id, created_at);


--
-- Name: idx_comments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_user_id ON public.comments USING btree (user_id);


--
-- Name: idx_posts_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_author_id ON public.posts USING btree (author_id);


--
-- Name: idx_posts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_created_at ON public.posts USING btree (created_at DESC);


--
-- Name: idx_reflection_daily_messages_daily; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reflection_daily_messages_daily ON public.reflection_daily_messages USING btree (daily_id, created_at);


--
-- Name: idx_reflection_daily_messages_daily_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reflection_daily_messages_daily_created ON public.reflection_daily_messages USING btree (daily_id, created_at);


--
-- Name: idx_reflection_daily_messages_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reflection_daily_messages_user ON public.reflection_daily_messages USING btree (user_id);


--
-- Name: idx_reflection_daily_prompts_active_on; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reflection_daily_prompts_active_on ON public.reflection_daily_prompts USING btree (active_on);


--
-- Name: idx_reflection_daily_prompts_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reflection_daily_prompts_date ON public.reflection_daily_prompts USING btree (active_on);


--
-- Name: idx_reflection_daily_prompts_prompt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reflection_daily_prompts_prompt ON public.reflection_daily_prompts USING btree (prompt_id);


--
-- Name: sections_slug_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX sections_slug_uniq ON public.sections USING btree (lower(slug));


--
-- Name: users_email_lower_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_lower_uniq ON public.users USING btree (lower(email));


--
-- Name: users_username_lower_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_username_lower_uniq ON public.users USING btree (lower(username));


--
-- Name: comments comments_touch_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER comments_touch_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: content_blocks content_blocks_touch_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER content_blocks_touch_updated_at BEFORE UPDATE ON public.content_blocks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: posts posts_touch_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER posts_touch_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: reflection_daily_messages reflection_daily_messages_touch_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER reflection_daily_messages_touch_updated_at BEFORE UPDATE ON public.reflection_daily_messages FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: reflection_daily_prompts reflection_daily_prompts_touch_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER reflection_daily_prompts_touch_updated_at BEFORE UPDATE ON public.reflection_daily_prompts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: reflection_prompts reflection_prompts_touch_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER reflection_prompts_touch_updated_at BEFORE UPDATE ON public.reflection_prompts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: sections sections_touch_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sections_touch_updated_at BEFORE UPDATE ON public.sections FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: users users_touch_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER users_touch_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: comments comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: content_blocks content_blocks_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_blocks
    ADD CONSTRAINT content_blocks_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;


--
-- Name: posts posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reflection_daily_messages reflection_daily_messages_daily_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reflection_daily_messages
    ADD CONSTRAINT reflection_daily_messages_daily_id_fkey FOREIGN KEY (daily_id) REFERENCES public.reflection_daily_prompts(id) ON DELETE CASCADE;


--
-- Name: reflection_daily_messages reflection_daily_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reflection_daily_messages
    ADD CONSTRAINT reflection_daily_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reflection_daily_prompts reflection_daily_prompts_prompt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reflection_daily_prompts
    ADD CONSTRAINT reflection_daily_prompts_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.reflection_prompts(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

