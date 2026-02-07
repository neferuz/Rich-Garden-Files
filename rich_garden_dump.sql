--
-- PostgreSQL database dump
--

\restrict aXLGd0ByJoy4cf3RoHxSHz9Zoqpmv7rUUczOpqDdogGf8oDibKoVdZSGE12VrgS

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.addresses (
    id integer NOT NULL,
    user_id integer,
    title character varying,
    address character varying,
    info character varying,
    created_at timestamp without time zone
);


ALTER TABLE public.addresses OWNER TO postgres;

--
-- Name: addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.addresses_id_seq OWNER TO postgres;

--
-- Name: addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.addresses_id_seq OWNED BY public.addresses.id;


--
-- Name: banners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.banners (
    id integer NOT NULL,
    title character varying,
    subtitle character varying,
    button_text character varying,
    bg_color character varying,
    image_url character varying,
    link character varying,
    title_color character varying,
    subtitle_color character varying,
    button_text_color character varying,
    button_bg_color character varying,
    sort_order integer,
    is_active boolean
);


ALTER TABLE public.banners OWNER TO postgres;

--
-- Name: banners_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.banners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.banners_id_seq OWNER TO postgres;

--
-- Name: banners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.banners_id_seq OWNED BY public.banners.id;


--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calendar_events (
    id integer NOT NULL,
    user_id integer,
    family_member_id integer,
    title character varying,
    date date,
    type character varying,
    created_at timestamp without time zone
);


ALTER TABLE public.calendar_events OWNER TO postgres;

--
-- Name: calendar_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.calendar_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.calendar_events_id_seq OWNER TO postgres;

--
-- Name: calendar_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.calendar_events_id_seq OWNED BY public.calendar_events.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    telegram_id bigint,
    full_name character varying,
    username character varying,
    role character varying,
    photo_url character varying,
    is_active boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    amount integer,
    category character varying,
    note character varying,
    date character varying
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expenses_id_seq OWNER TO postgres;

--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: family_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.family_members (
    id integer NOT NULL,
    user_id integer,
    name character varying,
    relation character varying,
    birthday character varying,
    image character varying,
    created_at timestamp without time zone
);


ALTER TABLE public.family_members OWNER TO postgres;

--
-- Name: family_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.family_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.family_members_id_seq OWNER TO postgres;

--
-- Name: family_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.family_members_id_seq OWNED BY public.family_members.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    user_id integer,
    customer_name character varying,
    customer_phone character varying,
    total_price integer,
    status character varying,
    items character varying,
    address character varying,
    comment character varying,
    payment_method character varying,
    extras character varying,
    history character varying,
    created_at timestamp without time zone,
    telegram_message_id integer,
    payme_receipt_id character varying(255)
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: payme_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payme_transactions (
    id integer NOT NULL,
    transaction_id character varying,
    order_id integer,
    amount bigint,
    state integer,
    create_time bigint,
    perform_time bigint,
    cancel_time bigint,
    reason integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.payme_transactions OWNER TO postgres;

--
-- Name: payme_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payme_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payme_transactions_id_seq OWNER TO postgres;

--
-- Name: payme_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payme_transactions_id_seq OWNED BY public.payme_transactions.id;


--
-- Name: product_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_history (
    id integer NOT NULL,
    product_id integer,
    action character varying,
    quantity integer,
    date character varying
);


ALTER TABLE public.product_history OWNER TO postgres;

--
-- Name: product_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_history_id_seq OWNER TO postgres;

--
-- Name: product_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_history_id_seq OWNED BY public.product_history.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying,
    category character varying,
    price character varying,
    price_raw integer,
    image character varying,
    images character varying,
    rating character varying,
    is_hit boolean,
    is_new boolean,
    description character varying,
    composition character varying,
    cost_price integer,
    stock_quantity integer,
    supplier character varying,
    unit character varying,
    is_ingredient boolean,
    views integer
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: recently_viewed; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recently_viewed (
    id integer NOT NULL,
    user_id integer,
    product_id integer,
    viewed_at timestamp without time zone
);


ALTER TABLE public.recently_viewed OWNER TO postgres;

--
-- Name: recently_viewed_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recently_viewed_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recently_viewed_id_seq OWNER TO postgres;

--
-- Name: recently_viewed_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recently_viewed_id_seq OWNED BY public.recently_viewed.id;


--
-- Name: stories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stories (
    id integer NOT NULL,
    title character varying,
    thumbnail_url character varying,
    content_url character varying,
    content_type character varying,
    bg_color character varying,
    created_at timestamp without time zone,
    is_active boolean
);


ALTER TABLE public.stories OWNER TO postgres;

--
-- Name: stories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stories_id_seq OWNER TO postgres;

--
-- Name: stories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stories_id_seq OWNED BY public.stories.id;


--
-- Name: story_views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.story_views (
    id integer NOT NULL,
    story_id integer,
    user_id integer,
    viewed_at timestamp without time zone
);


ALTER TABLE public.story_views OWNER TO postgres;

--
-- Name: story_views_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.story_views_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.story_views_id_seq OWNER TO postgres;

--
-- Name: story_views_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.story_views_id_seq OWNED BY public.story_views.id;


--
-- Name: telegram_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.telegram_users (
    id integer NOT NULL,
    telegram_id bigint,
    first_name character varying,
    username character varying,
    photo_url character varying,
    phone_number character varying,
    created_at timestamp without time zone,
    birth_date date
);


ALTER TABLE public.telegram_users OWNER TO postgres;

--
-- Name: telegram_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.telegram_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.telegram_users_id_seq OWNER TO postgres;

--
-- Name: telegram_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.telegram_users_id_seq OWNED BY public.telegram_users.id;


--
-- Name: wow_effects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wow_effects (
    id integer NOT NULL,
    name character varying,
    price double precision,
    icon character varying,
    category character varying,
    description character varying,
    is_active boolean
);


ALTER TABLE public.wow_effects OWNER TO postgres;

--
-- Name: wow_effects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wow_effects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wow_effects_id_seq OWNER TO postgres;

--
-- Name: wow_effects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wow_effects_id_seq OWNED BY public.wow_effects.id;


--
-- Name: addresses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);


--
-- Name: banners id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banners ALTER COLUMN id SET DEFAULT nextval('public.banners_id_seq'::regclass);


--
-- Name: calendar_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events ALTER COLUMN id SET DEFAULT nextval('public.calendar_events_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: family_members id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_members ALTER COLUMN id SET DEFAULT nextval('public.family_members_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: payme_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payme_transactions ALTER COLUMN id SET DEFAULT nextval('public.payme_transactions_id_seq'::regclass);


--
-- Name: product_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_history ALTER COLUMN id SET DEFAULT nextval('public.product_history_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: recently_viewed id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recently_viewed ALTER COLUMN id SET DEFAULT nextval('public.recently_viewed_id_seq'::regclass);


--
-- Name: stories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stories ALTER COLUMN id SET DEFAULT nextval('public.stories_id_seq'::regclass);


--
-- Name: story_views id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.story_views ALTER COLUMN id SET DEFAULT nextval('public.story_views_id_seq'::regclass);


--
-- Name: telegram_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.telegram_users ALTER COLUMN id SET DEFAULT nextval('public.telegram_users_id_seq'::regclass);


--
-- Name: wow_effects id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wow_effects ALTER COLUMN id SET DEFAULT nextval('public.wow_effects_id_seq'::regclass);


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.addresses (id, user_id, title, address, info, created_at) FROM stdin;
1	1	Дом	Зангота	100 	2026-02-05 16:44:06.179333
2	4	Домшао	Аоал		2026-02-05 22:09:58.135954
\.


--
-- Data for Name: banners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.banners (id, title, subtitle, button_text, bg_color, image_url, link, title_color, subtitle_color, button_text_color, button_bg_color, sort_order, is_active) FROM stdin;
1	 Дарить цветы — всегда в тему Особенно 14 февраля 💘	Порадуй любимую нашими букетами	УЗНАТЬ ПОДРОБНЕЕ	bg-[#d9f99d]	/static/uploads/a4c322c8-53bb-4ce0-9740-42bfac41d19e.jpg	\N	#ffffff	#ffffff	#000000	#ffffff	1	t
\.


--
-- Data for Name: calendar_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.calendar_events (id, user_id, family_member_id, title, date, type, created_at) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, telegram_id, full_name, username, role, photo_url, is_active, created_at) FROM stdin;
1	670031187	Admin 1	\N	owner	\N	t	2026-02-05 10:48:54.135081
2	6309778899	Admin 2	\N	admin	\N	t	2026-02-05 10:48:54.135081
3	340659823	Admin 3	\N	admin	\N	t	2026-02-05 10:48:54.135081
4	7687056819	Admin 4	\N	admin	\N	t	2026-02-05 10:48:54.135081
5	2013463	Анастасия	NastenaPolovinkina	owner	\N	t	2026-02-05 22:19:39.91316
6	209982951	Исломжон	O22_Islam	owner	\N	t	2026-02-05 22:39:22.794641
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, amount, category, note, date) FROM stdin;
1	2000000	Закупка	Поставка: Раникулс (100 шт) от Ерник	2026-02-05T19:49:54.604105
\.


--
-- Data for Name: family_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.family_members (id, user_id, name, relation, birthday, image, created_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, user_id, customer_name, customer_phone, total_price, status, items, address, comment, payment_method, extras, history, created_at, telegram_message_id, payme_receipt_id) FROM stdin;
1	1	Mr_ilxom	Уточнить	100000	pending_payment	[{"id":3,"name":"Нежность","price":100000,"quantity":1,"image":"/static/uploads/ea66f70a-e371-4a2b-8952-04d0fcd4cc78.jpg"}]	Дом: Зангота, 100 	\N	click	{"postcard":null,"wow_effect":null,"addons":[]}	[{"status": "new", "time": "05.02.2026 16:47", "active": true}]	2026-02-05 16:47:22.21747	\N	\N
2	1	Mr_ilxom	Уточнить	100000	pending_payment	[{"id":3,"name":"Нежность","price":100000,"quantity":1,"image":"/static/uploads/ea66f70a-e371-4a2b-8952-04d0fcd4cc78.jpg"}]	Дом: Зангота, 100 	\N	payme	{"postcard":null,"wow_effect":null,"addons":[]}	[{"status": "new", "time": "05.02.2026 16:47", "active": true}]	2026-02-05 16:47:40.721338	\N	6984835d6db027cd45559515
3	1	Mr_ilxom	Уточнить	100000	new	[{"id":3,"name":"Нежность","price":100000,"quantity":1,"image":"/static/uploads/ea66f70a-e371-4a2b-8952-04d0fcd4cc78.jpg"}]	Дом: Зангота, 100 	\N	cash	{"postcard":null,"wow_effect":null,"addons":[]}	[{"status": "new", "time": "05.02.2026 16:47", "active": true}]	2026-02-05 16:47:58.247898	464	\N
\.


--
-- Data for Name: payme_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payme_transactions (id, transaction_id, order_id, amount, state, create_time, perform_time, cancel_time, reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: product_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_history (id, product_id, action, quantity, date) FROM stdin;
1	1	writeoff	90	2026-02-05T16:41:15.949838
2	1	writeoff	9	2026-02-05T16:41:46.737654
6	1	income	3	2026-02-05T17:14:11.689530
7	22	income	1	2026-02-05T17:59:32.812400
8	23	income	1	2026-02-05T18:01:06.038164
9	24	income	1	2026-02-05T18:02:14.940431
10	25	income	1	2026-02-05T18:03:55.767363
12	10	income	2	2026-02-05T18:19:23.518376
13	11	income	51	2026-02-05T18:19:23.524740
14	28	income	1	2026-02-05T18:20:26.757264
15	29	income	1	2026-02-05T18:31:52.580718
16	30	income	1	2026-02-05T18:34:13.887780
18	1	income	100	2026-02-05T19:49:54.600468
19	43	income	1	2026-02-05T19:57:28.869030
20	44	income	1	2026-02-05T20:00:17.753171
21	45	income	1	2026-02-05T20:03:17.511620
22	46	income	1	2026-02-05T20:07:15.211688
23	47	income	1	2026-02-05T20:12:06.967905
27	49	income	11	2026-02-05T20:23:06.242710
28	50	income	1	2026-02-05T20:24:07.306805
29	51	income	1	2026-02-05T20:25:12.613306
30	52	income	1	2026-02-05T20:26:30.519088
31	53	income	1	2026-02-05T20:30:06.582808
32	54	income	1	2026-02-05T20:31:54.116506
33	55	income	1	2026-02-05T20:33:15.977606
34	57	income	1	2026-02-05T20:36:11.418259
35	58	income	1	2026-02-05T20:38:03.497431
36	59	income	1	2026-02-05T21:16:40.742592
37	61	income	1	2026-02-05T21:21:43.658290
39	63	income	1	2026-02-05T21:27:36.046039
40	5	income	7	2026-02-05T21:29:07.657293
41	10	income	1	2026-02-05T21:29:07.664034
42	64	income	1	2026-02-05T21:30:08.007871
43	65	income	1	2026-02-05T21:31:13.818698
44	1	income	25	2026-02-05T21:58:08.948753
45	67	income	1	2026-02-05T22:14:04.673219
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, category, price, price_raw, image, images, rating, is_hit, is_new, description, composition, cost_price, stock_quantity, supplier, unit, is_ingredient, views) FROM stdin;
32	Фрезы 	Цветы	\N	10000	/static/uploads/73278702-d45f-4535-a4f3-f4e8932b2feb.jpg	[]	5.0	f	t		[]	4000	500	Dy_florist	шт	t	0
24	Тюльпаны Фиолетовый	tulips	\N	650000	/static/uploads/626cfa53-aaec-44bd-a623-0b6073548e48.jpg	["/static/uploads/626cfa53-aaec-44bd-a623-0b6073548e48.jpg","/static/uploads/4305f2e5-6c25-4968-b3d0-e2c2adbd3e75.jpg"]	5.0	f	t	Авторский букет	[{"id":11,"name":"Тюльпаны ","qty":25,"price":20000}]	325000	1	Основной склад	шт	f	4
26	Роза голландская 	Цветы	\N	55000	/static/uploads/aef2a7d8-1885-4642-ac16-1ff79c113a12.jpg	[]	5.0	f	t		[]	28800	500	Иброхим	шт	t	0
41	Орнет	Цветы	\N	35000	/static/uploads/256030c4-8de2-4456-8dcd-065b7fac1323.jpg	[]	5.0	f	t		[]	15000	50	Еркин	шт	t	0
6	Гортензия гигантус	Цветы	\N	140000	/static/uploads/947ec3ba-37de-4d29-81d5-ce8fd9d0f2c1.jpg	[]	5.0	f	t		[]	75000	300	Еркин	шт	t	0
7	Хризантемы медведь 	Цветы	\N	20000	/static/uploads/b669e7cf-30f2-4932-ac69-14a9641cf20b.jpg	[]	5.0	f	t		[]	10000	100	Оптом	шт	t	0
8	Хризантема бигуди	Цветы	\N	20000	/static/uploads/f268d2e2-9a43-4c0f-b878-4b711c3237f4.jpg	[]	5.0	f	t		[]	10000	100	Оптом	шт	t	0
9	ХРИЗАНТЕМА КУСТОВАЯ	Цветы	\N	20000	/static/uploads/246fa36b-9612-4185-b6bb-63e876879854.jpg	[]	5.0	f	t		[]	10000	100	Оптом	шт	t	0
12	Ред пионы 	Цветы	\N	60000	/static/uploads/bc2f0607-69aa-440a-8624-c12233c7b7b3.jpg	[]	5.0	f	t		[]	30000	300	Еркин	шт	t	0
13	Bubbles 	Цветы	\N	60000	/static/uploads/c8e7fddd-14d9-4bf1-a7ed-0c5f4c2d497a.jpg	[]	5.0	f	t		[]	30000	100	Оптом	шт	t	0
14	Catalina	Цветы	\N	60000	/static/uploads/48682ed5-5ec9-4bf2-9e28-3b5512f854e9.jpg	[]	5.0	f	t		[]	30000	100		шт	t	0
15	Рускус	Цветы	\N	12000	/static/uploads/c3925ab6-c949-48aa-a2e3-083ab4e57a88.jpg	[]	5.0	f	t		[]	6000	100	Доврон	шт	t	0
16	Аспидистра	Цветы	\N	12000	/static/uploads/e250b3c3-15b4-4200-ad6d-f30940220b1a.jpg	[]	5.0	f	t		[]	6000	100	Доврон	шт	t	0
17	Матиолла 	Цветы	\N	20000	/static/uploads/6f2c7810-cac7-4c8d-a4e1-500bfcbd10f3.jpg	[]	5.0	f	t		[]	10000	100	Оптом	шт	t	0
18	Естома	Цветы	\N	40000	/static/uploads/dd891c20-f602-4396-a2f1-5405c9168be3.jpg	[]	5.0	f	t		[]	20000	100	Еркмн	шт	t	0
19	Диантус	Цветы	\N	15000	/static/uploads/21c5b2f5-e611-45e3-896c-943b061cfa8c.jpg	[]	5.0	f	t		[]	7000	100	Оптом	шт	t	0
20	Гипсафила	Цветы	\N	40000	/static/uploads/6a213ac0-6f2f-4827-9724-5d898b5c90bc.jpg	[]	5.0	f	t		[]	20000	100	Еркин	шт	t	0
21	Пион 	Цветы	\N	170000	/static/uploads/a7e9ebee-0906-4026-842d-4a2f3b7c6940.jpg	[]	5.0	f	t		[]	120000	100	Фреедом	шт	t	0
22	Тюльпаны красные 	tulips	\N	650000	/static/uploads/9f45fbcc-eac7-4111-ba6e-35f4cc0929c1.jpg	["/static/uploads/9f45fbcc-eac7-4111-ba6e-35f4cc0929c1.jpg","/static/uploads/6217ff5d-91e4-4e34-94af-ed2307c14fe8.jpg"]	5.0	f	t	Авторский букет	[{"id":11,"name":"Тюльпаны ","qty":25,"price":20000}]	325000	1	Основной склад	шт	f	2
25	Тюльпаны Сиреневый	tulips	\N	650000	/static/uploads/217ccd8d-b64f-4854-9c86-a025f4a3a550.jpg	["/static/uploads/217ccd8d-b64f-4854-9c86-a025f4a3a550.jpg","/static/uploads/41465412-d950-4d1d-8271-d6999ac13121.jpg"]	5.0	f	t	Авторский букет	[{"id":11,"name":"Тюльпаны ","qty":25,"price":20000}]	325000	1	Основной склад	шт	f	2
11	Тюльпаны 	Цветы	\N	20000	/static/uploads/616f68d9-0faa-4562-be31-8602d58cea2f.jpg	[]	5.0	f	t		[]	13000	1051	Шароф	шт	t	0
30	Тюльпаны-101шт	tulips	\N	2250000	/static/uploads/a504f227-b610-4d66-a6e0-ed5591d32d18.jpg	["/static/uploads/a504f227-b610-4d66-a6e0-ed5591d32d18.jpg","/static/uploads/be375470-2abf-47d5-8819-531012ba8294.jpg","/static/uploads/4bc3e683-04a4-4ef0-9da6-95f209c95bc5.jpg"]	5.0	f	t	Авторский букет	[{"id":11,"name":"Тюльпаны ","qty":3,"price":20000},{"id":10,"name":"Эвкалипт","qty":101,"price":35000}]	1554000	1	Основной склад	шт	f	0
28	Тюльпаны-51шт	tulips	\N	1250000	/static/uploads/66da6e4e-0a58-44cf-b0f7-7f5c64fcc1b3.jpg	["/static/uploads/66da6e4e-0a58-44cf-b0f7-7f5c64fcc1b3.jpg","/static/uploads/a6651852-ccef-4ffc-a386-31b96c1c9c6a.jpg"]	5.0	f	t	Авторский букет	[{"id":11,"name":"Тюльпаны ","qty":2,"price":20000},{"id":10,"name":"Эвкалипт","qty":51,"price":35000}]	791000	1	Основной склад	шт	f	1
29	Тюльпаны-75шт	tulips	\N	1750000	/static/uploads/a65f0355-a4cb-4cb4-a90c-7442d5ecfc72.jpg	["/static/uploads/a65f0355-a4cb-4cb4-a90c-7442d5ecfc72.jpg","/static/uploads/f7a7da25-0e13-4f56-8e81-1c525ad6b3f5.jpg","/static/uploads/fd6d69cf-c720-4074-aa22-336e88ac3650.jpg"]	5.0	f	t	Авторский букет	[{"id":11,"name":"Тюльпаны ","qty":2,"price":20000},{"id":10,"name":"Эвкалипт","qty":75,"price":35000}]	1151000	1	Основной склад	шт	f	1
5	Гортензия Колумбийский	Цветы	\N	70000	/static/uploads/aae1fbb9-d542-4f40-bca6-db2a0a7c1d5c.jpg	[]	5.0	f	t		[]	40000	507	Иброхим	шт	t	0
33	Салидаго	Цветы	\N	40000	/static/uploads/bd2ac152-035a-46c8-a14f-cc21b983e3ed.jpg	[]	5.0	f	t		[]	18000	100	Фреддом	шт	t	0
34	Фалинопис	Цветы	\N	60000	/static/uploads/a030f0f6-c679-4dac-b3f5-c2edd6c12923.jpg	[]	5.0	f	t		[]	37500	100	Еркин	шт	t	0
35	Пингпон	Цветы	\N	30000	/static/uploads/30f1564f-6181-4146-8cb3-05c24c82ad7f.jpg	[]	5.0	f	t		[]	15000	100	Еркин	шт	t	0
36	Кала 	Цветы	\N	70000	/static/uploads/acd8b65f-56dd-447f-b72d-962b6c11b9f7.jpg	[]	5.0	f	t		[]	48000	100	Еркин	шт	t	0
10	Эвкалипт	Цветы	\N	35000	/static/uploads/0d063b4f-7bac-4aa6-b5fe-c5e52efb4bf2.jpg	[]	5.0	f	t		[]	15000	103	Еркин	шт	t	0
37	Бобастик	Цветы	\N	60000	/static/uploads/2ba810dd-1748-4327-a1aa-b5944633e5ea.jpg	[]	5.0	f	t		[]	30000	100	Оптом	шт	t	0
38	Гиоргин	Цветы	\N	30000	/static/uploads/ec85f119-929b-4ba5-9e2f-67f625927d70.jpg	[]	5.0	f	t		[]	15000	100	Оптом	шт	t	0
42	Азотамус	Цветы	\N	60000	/static/uploads/8336f7df-1c80-4508-a847-4fd8506679f3.jpg	[]	5.0	f	t		[]	35000	100	Еркин	шт	t	0
54	Букет из гортензия-19шт	Гортензия 	\N	1430000	/static/uploads/4f9d5a3b-4317-4709-94df-d6690407d8dd.jpg	["/static/uploads/4f9d5a3b-4317-4709-94df-d6690407d8dd.jpg","/static/uploads/1ccc4765-7d94-4bee-abf8-b553189f0fdd.jpg"]	5.0	f	t	Авторский букет	[{"id":5,"name":"Гортензия Колумбийский","qty":19,"price":70000}]	760000	1	Основной склад	шт	f	0
57	Букет из гортензия-9шт	Гортензия 	\N	730000	/static/uploads/84523232-3a64-43c6-9b96-6ba59c9248c7.jpg	["/static/uploads/84523232-3a64-43c6-9b96-6ba59c9248c7.jpg","/static/uploads/7d38f85e-fb37-40dd-956f-5ad1b38d901b.jpg"]	5.0	f	t	Авторский букет	[{"id":5,"name":"Гортензия Колумбийский","qty":9,"price":70000}]	360000	1	Основной склад	шт	f	0
52	Эффектная подача классических роз ❤️-L	boxes	\N	950000	/static/uploads/84c019f6-8eaf-4fb9-b93d-2e857fc57ca9.jpg	["/static/uploads/84c019f6-8eaf-4fb9-b93d-2e857fc57ca9.jpg","/static/uploads/db2fdbb1-d9a2-4592-8252-dad7d28f15fe.jpg"]	5.0	f	t	Авторский букет\nИз-25шт роз	[{"id":49,"name":"Роза под голландский ","qty":25,"price":30000}]	350000	1	Основной склад	шт	f	0
46	Букет из 25 роз в живом оформлении	roses	\N	1905000	/static/uploads/1ebfabcb-68b4-427d-9b14-5f3aa63e22c8.jpg	["/static/uploads/1ebfabcb-68b4-427d-9b14-5f3aa63e22c8.jpg","/static/uploads/a097e1bf-5ad8-4c0c-a596-35d42baab428.jpg"]	5.0	f	t	Авторский букет	[{"id":26,"name":"Роза голландская ","qty":25,"price":55000},{"id":16,"name":"Аспидистра","qty":10,"price":12000},{"id":15,"name":"Рускус","qty":30,"price":12000}]	960000	1	Основной склад	шт	f	1
1	Раникулс	Цветы	\N	40000	/static/uploads/9b6d5a67-52cc-4596-af2a-cd67ee28a410.jpg	[]	5.0	f	t		[]	20000	129	Ерник	шт	t	0
53	Букет гортензия-11шт	Гортензия 	\N	870000	/static/uploads/ecca1fd0-9345-45f0-9ce0-887a6bc143d7.jpg	["/static/uploads/ecca1fd0-9345-45f0-9ce0-887a6bc143d7.jpg","/static/uploads/e5647d9c-9274-4823-aba0-7f213146373e.jpg"]	5.0	f	t	Авторский букет	[{"id":5,"name":"Гортензия Колумбийский","qty":11,"price":70000}]	440000	1	Основной склад	шт	f	1
44	Фрезы сумки 	boxes	\N	750000	/static/uploads/b83648c4-951e-458f-bce0-51ee3ea9407c.jpg	["/static/uploads/b83648c4-951e-458f-bce0-51ee3ea9407c.jpg","/static/uploads/d38f46ee-8986-410c-8074-80bd6d316e55.jpg"]	5.0	f	t	Авторский букет	[{"id":32,"name":"Фрезы ","qty":51,"price":10000}]	204000	1	Основной склад	шт	f	3
39	Гиперикум	Цветы	\N	35000	/static/uploads/08a978c8-aaca-4810-99ae-3924933e5d86.jpg	[]	5.0	f	t		[]	18000	100	Еркин	шт	t	0
47	Букет из 51 розы в живом оформлении	roses	\N	3455000	/static/uploads/2eb91669-30d7-4c40-aa02-1c1fa223558b.jpg	["/static/uploads/2eb91669-30d7-4c40-aa02-1c1fa223558b.jpg","/static/uploads/70f640f7-2cae-41c2-806f-b63f1ccbf00d.jpg"]	5.0	f	t	Авторский букет	[{"id":26,"name":"Роза голландская ","qty":51,"price":55000},{"id":15,"name":"Рускус","qty":10,"price":12000},{"id":16,"name":"Аспидистра","qty":45,"price":12000}]	1798800	1	Основной склад	шт	f	0
49	Роза под голландский 	Цветы	\N	30000	/static/uploads/f1e820a0-81c2-406c-97ea-21f0793f9822.jpg	[]	5.0	f	t		[]	14000	611	Еркин	шт	t	0
50	Эффектная подача классических-S роз ❤️	boxes	\N	535000	/static/uploads/2a7a262f-01d2-4eaf-a0fd-9f104e84f1ce.jpg	["/static/uploads/2a7a262f-01d2-4eaf-a0fd-9f104e84f1ce.jpg","/static/uploads/9528c355-5a7d-4f02-b1aa-705d0ba5b4bb.jpg"]	5.0	f	t	Авторский букет\nИз-11шт роз	[{"id":49,"name":"Роза под голландский ","qty":11,"price":30000}]	154000	1	Основной склад	шт	f	0
55	Букет из гортензия-15шт	Гортензия 	\N	1150000	/static/uploads/cb2fccdd-57c6-4269-a32e-9ae1355c8613.jpg	["/static/uploads/cb2fccdd-57c6-4269-a32e-9ae1355c8613.jpg","/static/uploads/b1873f08-cdd7-4af5-a561-a8dd88046907.jpg"]	5.0	f	t	Авторский букет	[{"id":5,"name":"Гортензия Колумбийский","qty":15,"price":70000}]	600000	1	Основной склад	шт	f	0
43	Роскошь весны! 201 тюльпан с орхидеями в живом оформлении 💖	tulips	\N	5750000	/static/uploads/d9354415-bdd3-4bd1-ad32-42ce0be29f00.jpg	["/static/uploads/d9354415-bdd3-4bd1-ad32-42ce0be29f00.jpg","/static/uploads/1a7f4e55-5071-40b0-85ee-35d37e98fed6.jpg"]	5.0	f	t	Авторский букет	[{"id":10,"name":"Эвкалипт","qty":10,"price":35000},{"id":11,"name":"Тюльпаны ","qty":201,"price":20000},{"id":34,"name":"Фалинопис","qty":20,"price":60000}]	3513000	1	Основной склад	шт	f	1
45	Беспроигрышный вариант ❤️ 51 голландская роза 🌹	roses	\N	3455000	/static/uploads/90cc434d-3d66-4041-9dc0-58e9baefd49c.jpg	["/static/uploads/90cc434d-3d66-4041-9dc0-58e9baefd49c.jpg","/static/uploads/4b96efbf-5cad-4dcc-9dd3-c9158ed2dbd7.jpg"]	5.0	f	t	Авторский букет	[{"id":26,"name":"Роза голландская ","qty":51,"price":55000},{"id":15,"name":"Рускус","qty":40,"price":12000},{"id":16,"name":"Аспидистра","qty":10,"price":12000}]	1768800	1	Основной склад	шт	f	2
40	Фисташка 	Цветы	\N	60000	/static/uploads/51b56c9e-689c-4e0f-9675-a79d290da890.jpg	[]	5.0	f	t		[]	30000	100	Еркин	шт	t	0
51	Эффектная подача классических роз ❤️-M	boxes	\N	715000	/static/uploads/49567f2f-09e3-41ba-9ef3-4c311ff3b8cd.jpg	["/static/uploads/49567f2f-09e3-41ba-9ef3-4c311ff3b8cd.jpg","/static/uploads/7acadc58-ba28-4d5b-8dc1-d6ffe814d502.jpg"]	5.0	f	t	Авторский букет\nИз-17шт роз	[{"id":49,"name":"Роза под голландский ","qty":17,"price":30000}]	238000	1	Основной склад	шт	f	0
58	Букет из гортензия-17шт	Гортензия 	\N	1290000	/static/uploads/f90c0754-966b-4a1a-9db5-e75eaf9bc4d7.jpg	["/static/uploads/f90c0754-966b-4a1a-9db5-e75eaf9bc4d7.jpg","/static/uploads/3f5a4a8b-a810-46e1-aab5-84843c0b8c87.jpg"]	5.0	f	t	Авторский букет	[{"id":5,"name":"Гортензия Колумбийский","qty":17,"price":70000}]	680000	1	Основной склад	шт	f	0
23	Тюльпаны розовые 	tulips	\N	650000	/static/uploads/b01b8c25-2b5b-49b0-a230-41cadc5457ff.jpg	["/static/uploads/b01b8c25-2b5b-49b0-a230-41cadc5457ff.jpg","/static/uploads/3c4db4c1-9005-49e0-8588-23dd44140f33.jpg"]	5.0	f	t	Авторский букет	[{"id":11,"name":"Тюльпаны ","qty":25,"price":20000}]	325000	1	Основной склад	шт	f	1
59	Букет из гортензия-11шт	Гортензия 	\N	870000	/static/uploads/7efecfeb-8ca6-4eeb-937d-b3a794477f2d.jpg	["/static/uploads/7efecfeb-8ca6-4eeb-937d-b3a794477f2d.jpg","/static/uploads/4c522352-a1f7-481e-974b-0075829630a3.jpg"]	5.0	f	t	Авторский букет	[{"id":5,"name":"Гортензия Колумбийский","qty":11,"price":70000}]	440000	1	Основной склад	шт	f	0
61	Гортензия и эвкалипт микс 	Гортензия 	\N	660000	/static/uploads/0df454fa-b470-434f-ba32-a0a4cb42cc85.jpg	["/static/uploads/0df454fa-b470-434f-ba32-a0a4cb42cc85.jpg","/static/uploads/2d28f97b-b3cc-4122-8df8-1e861eed0e8d.jpg"]	5.0	f	t	Авторский букет	[{"id":5,"name":"Гортензия Колумбийский","qty":7,"price":70000},{"id":10,"name":"Эвкалипт","qty":1,"price":35000}]	295000	1	Основной склад	шт	f	0
63	Букет гортензия и эвкалипт розовый 	Гортензия 	\N	660000	/static/uploads/9570136b-3ff7-4621-b1b0-a3a171ee4dba.jpg	["/static/uploads/9570136b-3ff7-4621-b1b0-a3a171ee4dba.jpg","/static/uploads/d836715f-1c2a-424f-8a1b-aebd9d322025.jpg"]	5.0	f	t	Авторский букет	[{"id":5,"name":"Гортензия Колумбийский","qty":7,"price":70000},{"id":10,"name":"Эвкалипт","qty":1,"price":35000}]	295000	1	Основной склад	шт	f	0
64	Букет гортензия и эвкалипт синий 	Гортензия 	\N	660000	/static/uploads/1055e732-d8b4-46ae-b4ee-2cb1ae7bf789.jpg	["/static/uploads/1055e732-d8b4-46ae-b4ee-2cb1ae7bf789.jpg","/static/uploads/a2b237b1-8920-412e-ad1d-48e13f000b20.jpg"]	5.0	f	t	Авторский букет	[{"id":5,"name":"Гортензия Колумбийский","qty":7,"price":70000},{"id":10,"name":"Эвкалипт","qty":1,"price":35000}]	295000	1	Основной склад	шт	f	0
65	Букет гортензия и эвкалипт белый 	Гортензия 	\N	660000	/static/uploads/06dcaed9-2ff8-4ef6-bc9a-2098658d16aa.jpg	["/static/uploads/06dcaed9-2ff8-4ef6-bc9a-2098658d16aa.jpg","/static/uploads/2eb0cdca-da4c-45d6-9ecd-8828effce292.jpg"]	5.0	f	t	Авторский букет	[{"id":5,"name":"Гортензия Колумбийский","qty":7,"price":70000},{"id":10,"name":"Эвкалипт","qty":1,"price":35000}]	295000	1	Основной склад	шт	f	0
66	Спрей розы	Цветы	\N	60000	/static/uploads/7b862e1e-9ae0-46ba-933d-aad80985bce2.jpg	[]	5.0	f	t		[]	30000	100	Еркин	шт	t	0
67	Микс букет 	boxes	\N	1350000	/static/uploads/1d0a6843-c7f6-4302-a650-400fd7ffa19b.jpg	["/static/uploads/1d0a6843-c7f6-4302-a650-400fd7ffa19b.jpg","/static/uploads/af06503a-74a5-4489-b76b-6fa2530637ad.jpg","/static/uploads/f209f0c2-17ea-4bb5-9f08-caff41da8d35.jpg"]	5.0	f	t	Авторский букет	[{"id":5,"name":"Гортензия Колумбийский","qty":7,"price":70000},{"id":66,"name":"Спрей розы","qty":5,"price":60000},{"id":10,"name":"Эвкалипт","qty":3,"price":35000}]	475000	1	Основной склад	шт	f	0
\.


--
-- Data for Name: recently_viewed; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recently_viewed (id, user_id, product_id, viewed_at) FROM stdin;
3	1	28	2026-02-05 18:20:34.456024
4	1	29	2026-02-05 18:32:19.07433
6	1	24	2026-02-05 19:24:21.080341
7	4	23	2026-02-05 21:01:26.956858
8	4	22	2026-02-05 21:01:33.236933
10	4	46	2026-02-05 21:04:22.184319
14	4	43	2026-02-05 21:52:39.03657
15	4	24	2026-02-05 22:13:13.834363
16	4	53	2026-02-05 22:17:41.269357
12	4	44	2026-02-05 22:17:52.172835
13	4	25	2026-02-05 22:32:38.494467
17	1	22	2026-02-05 22:40:37.497078
11	1	45	2026-02-06 10:56:35.546825
\.


--
-- Data for Name: stories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stories (id, title, thumbnail_url, content_url, content_type, bg_color, created_at, is_active) FROM stdin;
1	Valentine’s	/static/uploads/4abcab3a-4d13-4d48-b62d-d5d1bf42d353.jpg	/static/uploads/b3e36a44-241a-4f57-b13a-53e5653ec5d2.mp4	video	bg-blue-100	2026-02-05 11:35:34.671533	t
\.


--
-- Data for Name: story_views; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.story_views (id, story_id, user_id, viewed_at) FROM stdin;
\.


--
-- Data for Name: telegram_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.telegram_users (id, telegram_id, first_name, username, photo_url, phone_number, created_at, birth_date) FROM stdin;
1	6309778899	Mr_ilxom	\N	https://t.me/i/userpic/320/bGEkbhRBcwzDOwZ9I03W6INMieogBfZLOzLOJQMlobKwY5nBYhR_4vlVdonDKcat.svg	\N	2026-02-05 16:28:21.772444	\N
2	670031187	Feruz	feruuuz1	https://t.me/i/userpic/320/2f5YrepV7IXCtPjlFUp_vRgka6LinI8m53CmAmXeujo.svg	\N	2026-02-05 21:01:12.401662	\N
4	2013463	Анастасия	NastenaPolovinkina	https://t.me/i/userpic/320/DM5b0gkusycUtO9M7XYFxhRL8BIfZxYDsOtmkSrTYkM.svg	\N	2026-02-05 21:01:21.635684	\N
6	209982951	ISLOMJON	O22_Islam	https://t.me/i/userpic/320/lXiLnyX1dw8OBrJARdAhf45CwJaQHEl72uZKpNyN76E.svg	998909848999	2026-02-05 22:40:30.871806	\N
7	1336128248	Bintu Axrol🌞	e_axrolovna	https://t.me/i/userpic/320/k9ZWAKud7vtR4FIMYgcUlPIjLMbnVoQdWH88fS_Lrd8.svg	998999043419	2026-02-06 10:53:36.248301	\N
8	12345	TestUser	test	https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&auto=format&fit=crop	+998901234567	2026-02-07 02:12:42.636762	\N
\.


--
-- Data for Name: wow_effects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wow_effects (id, name, price, icon, category, description, is_active) FROM stdin;
1	Скрипач	500000	music	wow	Порадуй свою девушку, музыкой	t
\.


--
-- Name: addresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.addresses_id_seq', 2, true);


--
-- Name: banners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.banners_id_seq', 1, true);


--
-- Name: calendar_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.calendar_events_id_seq', 1, false);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employees_id_seq', 6, true);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expenses_id_seq', 1, true);


--
-- Name: family_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.family_members_id_seq', 1, false);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 3, true);


--
-- Name: payme_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payme_transactions_id_seq', 1, false);


--
-- Name: product_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_history_id_seq', 45, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 67, true);


--
-- Name: recently_viewed_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recently_viewed_id_seq', 17, true);


--
-- Name: stories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stories_id_seq', 3, true);


--
-- Name: story_views_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.story_views_id_seq', 1, false);


--
-- Name: telegram_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.telegram_users_id_seq', 9, true);


--
-- Name: wow_effects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wow_effects_id_seq', 1, true);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: family_members family_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT family_members_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payme_transactions payme_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payme_transactions
    ADD CONSTRAINT payme_transactions_pkey PRIMARY KEY (id);


--
-- Name: product_history product_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_history
    ADD CONSTRAINT product_history_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: recently_viewed recently_viewed_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recently_viewed
    ADD CONSTRAINT recently_viewed_pkey PRIMARY KEY (id);


--
-- Name: stories stories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_pkey PRIMARY KEY (id);


--
-- Name: story_views story_views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.story_views
    ADD CONSTRAINT story_views_pkey PRIMARY KEY (id);


--
-- Name: telegram_users telegram_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.telegram_users
    ADD CONSTRAINT telegram_users_pkey PRIMARY KEY (id);


--
-- Name: wow_effects wow_effects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wow_effects
    ADD CONSTRAINT wow_effects_pkey PRIMARY KEY (id);


--
-- Name: ix_addresses_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_addresses_id ON public.addresses USING btree (id);


--
-- Name: ix_banners_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_banners_id ON public.banners USING btree (id);


--
-- Name: ix_calendar_events_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_calendar_events_id ON public.calendar_events USING btree (id);


--
-- Name: ix_employees_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_employees_id ON public.employees USING btree (id);


--
-- Name: ix_employees_telegram_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_employees_telegram_id ON public.employees USING btree (telegram_id);


--
-- Name: ix_expenses_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_expenses_id ON public.expenses USING btree (id);


--
-- Name: ix_family_members_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_family_members_id ON public.family_members USING btree (id);


--
-- Name: ix_orders_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_orders_id ON public.orders USING btree (id);


--
-- Name: ix_payme_transactions_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_payme_transactions_id ON public.payme_transactions USING btree (id);


--
-- Name: ix_payme_transactions_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_payme_transactions_order_id ON public.payme_transactions USING btree (order_id);


--
-- Name: ix_payme_transactions_transaction_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_payme_transactions_transaction_id ON public.payme_transactions USING btree (transaction_id);


--
-- Name: ix_product_history_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_product_history_id ON public.product_history USING btree (id);


--
-- Name: ix_products_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_products_category ON public.products USING btree (category);


--
-- Name: ix_products_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_products_id ON public.products USING btree (id);


--
-- Name: ix_products_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_products_name ON public.products USING btree (name);


--
-- Name: ix_recently_viewed_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_recently_viewed_id ON public.recently_viewed USING btree (id);


--
-- Name: ix_stories_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_stories_id ON public.stories USING btree (id);


--
-- Name: ix_story_views_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_story_views_id ON public.story_views USING btree (id);


--
-- Name: ix_telegram_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_telegram_users_id ON public.telegram_users USING btree (id);


--
-- Name: ix_telegram_users_telegram_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_telegram_users_telegram_id ON public.telegram_users USING btree (telegram_id);


--
-- Name: ix_wow_effects_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_wow_effects_id ON public.wow_effects USING btree (id);


--
-- Name: ix_wow_effects_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_wow_effects_name ON public.wow_effects USING btree (name);


--
-- Name: addresses addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.telegram_users(id);


--
-- Name: calendar_events calendar_events_family_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_family_member_id_fkey FOREIGN KEY (family_member_id) REFERENCES public.family_members(id);


--
-- Name: calendar_events calendar_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.telegram_users(id);


--
-- Name: family_members family_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT family_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.telegram_users(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.telegram_users(id);


--
-- Name: product_history product_history_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_history
    ADD CONSTRAINT product_history_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: recently_viewed recently_viewed_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recently_viewed
    ADD CONSTRAINT recently_viewed_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: recently_viewed recently_viewed_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recently_viewed
    ADD CONSTRAINT recently_viewed_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.telegram_users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict aXLGd0ByJoy4cf3RoHxSHz9Zoqpmv7rUUczOpqDdogGf8oDibKoVdZSGE12VrgS

