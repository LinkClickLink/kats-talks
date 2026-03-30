-- ============================================================
-- KATS-TALKS — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Cat breeds (reference table)
create table if not exists cat_breeds (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  visual_traits text not null,      -- physical description for prompts
  personality text not null,        -- character personality traits
  prompt_base text not null,        -- base prompt fragment for Gemini
  active boolean default true,
  created_at timestamptz default now()
);

-- Cat characters (specific named characters)
create table if not exists cat_characters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  breed_id uuid references cat_breeds(id) on delete set null,
  fur_color text not null,
  eye_color text not null,
  accessories text[] default '{}',  -- permanent accessories
  personality text not null,
  catchphrase text not null default '',
  backstory text default '',
  prompt_description text not null, -- full visual prompt fragment
  active boolean default true,
  created_at timestamptz default now()
);

-- Scenarios / filming locations
create table if not exists scenarios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,           -- interior | exterior | fantasy | studio
  description text not null,
  visual_prompt text not null,      -- prompt fragment for Gemini
  lighting text not null,
  props text[] default '{}',
  active boolean default true,
  created_at timestamptz default now()
);

-- Generated videos
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references cat_characters(id) on delete set null,
  scenario_id uuid references scenarios(id) on delete set null,
  title text not null,
  topic_category text not null,
  spoken_script text not null,
  script_tone text not null,
  accessories_override text[] default '{}',
  animation_effects text[] default '{}',
  camera_movements text[] default '{}',
  prompt_frame1 text,
  prompt_frame2 text,
  prompt_veo3 text,
  n8n_execution_id text,
  status text default 'draft',      -- draft | generating | done | error
  video_url text,
  image_url text,
  notes text,
  created_at timestamptz default now()
);

-- n8n + API configuration
create table if not exists n8n_config (
  id uuid primary key default gen_random_uuid(),
  instance_url text not null default '',
  api_key text not null default '',
  workflow_kats_veo3_id text,
  gemini_api_key text,
  openai_api_key text,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- ALTER TABLE for existing databases (run if tables exist)
-- ============================================================
-- alter table n8n_config add column if not exists workflow_kats_veo3_id text;
-- alter table n8n_config add column if not exists gemini_api_key text;
-- alter table n8n_config add column if not exists openai_api_key text;

-- ============================================================
-- SEED: Cat Breeds (12 razas)
-- ============================================================
insert into cat_breeds (name, description, visual_traits, personality, prompt_base) values

('Maine Coon',
 'La raza más grande de gato doméstico, con pelaje largo y tupido',
 'large fluffy cat, tufted ears, bushy tail, thick multi-layered fur, large paws with tufts between toes',
 'friendly, playful, dog-like loyalty, curious, talkative',
 'large Maine Coon cat with thick flowing fur, tufted pointed ears, enormous bushy tail, gentle giant appearance'),

('Ragdoll',
 'Gato extremadamente dócil con ojos azules intensos',
 'large semi-longhair, blue eyes always, color-point pattern, silky soft coat, floppy relaxed posture',
 'calm, gentle, follows owners everywhere, floppy when held, affectionate',
 'beautiful Ragdoll cat with deep blue eyes, silky colorpoint coat, soft relaxed expression, plush fur'),

('Scottish Fold',
 'Conocido por sus orejas dobladas hacia adelante',
 'folded ears flat against head, round face, round eyes, compact body, plush coat',
 'adaptable, calm, sweet-tempered, loves to pose, observant',
 'adorable Scottish Fold cat with distinctive folded ears, perfectly round face, big round expressive eyes'),

('British Shorthair',
 'Gato robusto con cara redonda y pelaje denso',
 'stocky round body, dense plush short coat, round face, chubby cheeks, copper or gold eyes',
 'easygoing, loyal, not overly needy, dignified, patient',
 'chubby British Shorthair cat with dense plush coat, perfectly round face, chubby cheeks, dignified expression'),

('Siamese',
 'Elegante y vocal con patrón colorpoint',
 'sleek slender body, color-point markings on face/ears/paws/tail, almond-shaped blue eyes, short glossy coat',
 'vocal, social, demanding attention, intelligent, opinionated',
 'elegant Siamese cat with striking blue almond eyes, dark colorpoint markings, sleek athletic body, glossy coat'),

('Persian',
 'Gato de cara plana con pelaje largo y lujoso',
 'flat smooshed face, extremely long thick fluffy coat, small ears, large round eyes, stocky body',
 'calm, quiet, gentle, loves luxury, reserved',
 'glamorous Persian cat with flat round face, extremely luxurious long flowing fur, large expressive eyes, regal posture'),

('Bengal',
 'Gato salvaje de aspecto leopardo completamente doméstico',
 'spotted or marbled wild-looking coat, muscular athletic build, small round ears, whisker pads, glitter sheen on fur',
 'energetic, wild-spirited, clever, adventurous, chatty',
 'athletic Bengal cat with exotic leopard-like spotted coat, muscular body, wild expressive eyes, glittery fur sheen'),

('Norwegian Forest Cat',
 'Gato nórdico resistente con pelaje impermeable',
 'large strong body, double waterproof coat, tufted ears, long bushy tail, almond-shaped eyes, ruff around neck',
 'independent, gentle, outdoorsy spirit, patient, wise',
 'majestic Norwegian Forest Cat with thick double coat, ruff collar, tufted ears, long flowing tail, wise Nordic expression'),

('Sphynx',
 'Gato sin pelo con piel arrugada y orejas grandes',
 'hairless wrinkled skin, large bat-like ears, wrinkled face, visible muscles, peach-fuzz texture, warm to touch',
 'extroverted, attention-seeking, mischievous, loves warmth, very social',
 'bold Sphynx cat with bare wrinkled skin, enormous bat ears, naked expressive face, alien-like but endearing appearance'),

('Russian Blue',
 'Gato azul plateado con ojos verdes intensos',
 'blue-gray short dense coat, green eyes always, angular face, slender body, silver-tipped fur that shimmers',
 'quiet, loyal to family, shy with strangers, intelligent, playful privately',
 'elegant Russian Blue cat with shimmering silver-blue coat, vivid emerald green eyes, angular refined face, graceful posture'),

('Abyssinian',
 'Gato ágil y curioso de aspecto salvaje con pelaje agouti',
 'slender athletic build, ticked agouti coat with multiple colors per hair, large ears, almond eyes, arched back',
 'curious, active, loves heights, always exploring, energetic',
 'agile Abyssinian cat with ticked coat shimmering in the light, large curious ears, alert almond eyes, athletic pose'),

('Turkish Angora',
 'Gato blanco puro elegante con pelaje sedoso largo',
 'silky medium-long white coat, plumed tail, fine-boned elegant body, almond-shaped eyes, graceful movement',
 'playful, intelligent, dominant, graceful, loves music and movement',
 'graceful Turkish Angora cat with flowing silky white fur, plumed tail, fine elegant features, dancer-like posture')

on conflict (name) do nothing;

-- ============================================================
-- SEED: Scenarios (15 escenarios)
-- ============================================================
insert into scenarios (name, category, description, visual_prompt, lighting, props) values

('Salón Acogedor',
 'interior',
 'Sala de estar cálida con sofá, plantas y luz suave de tarde',
 'cozy living room, warm wood furniture, soft throw blankets on sofa, indoor plants, bookshelf in background, warm amber lighting',
 'warm golden hour light through windows, soft ambient glow',
 ARRAY['sofa', 'cushions', 'books', 'plant pot', 'coffee table']),

('Cocina Minimalista',
 'interior',
 'Cocina moderna blanca con isla central y luz natural',
 'minimalist modern kitchen, white cabinets, marble countertop, stainless appliances, large window with natural light',
 'bright natural daylight, clean white light',
 ARRAY['kitchen island', 'fruit bowl', 'coffee machine', 'cookbooks']),

('Jardín Japonés',
 'exterior',
 'Jardín zen con piedras, bambú y cerezos en flor',
 'serene Japanese zen garden, bamboo fence, cherry blossom tree, stone lantern, moss-covered stones, koi pond nearby',
 'soft diffused morning light, dappled shadows',
 ARRAY['stone lantern', 'bamboo', 'cherry blossoms', 'zen stones']),

('Biblioteca Vintage',
 'interior',
 'Biblioteca antigua con miles de libros y escalera de madera',
 'grand vintage library, floor-to-ceiling bookshelves, rolling ladder, leather armchair, warm candlelight, Persian rug',
 'warm candlelight and reading lamp glow, dramatic shadows',
 ARRAY['books', 'leather armchair', 'reading lamp', 'globe', 'magnifying glass']),

('Estudio de Arte',
 'interior',
 'Estudio bohemio lleno de pinturas, plantas y luz norte',
 'artist studio, canvases leaning on walls, paint-stained floor, large north-facing windows, plants everywhere, bohemian decor',
 'bright diffused north light, creative atmosphere',
 ARRAY['easel', 'paint palette', 'brushes', 'plants', 'art prints']),

('Terraza Urbana',
 'exterior',
 'Terraza moderna en la ciudad con vistas a los edificios',
 'rooftop terrace, city skyline in background, modern outdoor furniture, string lights, potted plants, evening atmosphere',
 'golden sunset light, city lights starting to glow',
 ARRAY['outdoor chairs', 'string lights', 'plant pots', 'city view']),

('Spa & Relax',
 'interior',
 'Habitación de spa con velas, pétalos y luz tenue',
 'luxurious spa room, candles everywhere, rose petals, bamboo mat, soft towels, essential oil diffuser, zen music atmosphere',
 'soft candlelight, warm diffused glow',
 ARRAY['candles', 'rose petals', 'bamboo mat', 'essential oils', 'towels']),

('Cafetería Parisiense',
 'interior',
 'Café parisino con mesas pequeñas, bistrot y croissants',
 'charming Parisian cafe, small round bistrot tables, red chairs, chalkboard menu, croissants, espresso machine, Eiffel Tower visible outside',
 'warm interior light, romantic Parisian ambiance',
 ARRAY['espresso cup', 'croissant', 'newspaper', 'flower vase', 'bistrot table']),

('Jardín Secreto',
 'exterior',
 'Jardín secreto exuberante con flores salvajes y mariposas',
 'enchanted secret garden, wild flowers everywhere, ivy-covered stone wall, butterflies, dappled sunlight through trees, magical atmosphere',
 'magical dappled forest light, golden hour glow',
 ARRAY['wildflowers', 'butterfly', 'stone wall', 'ivy', 'wooden gate']),

('Cuarto de Lujo',
 'interior',
 'Dormitorio lujoso con cama king size y cortinas de seda',
 'luxurious bedroom, king size bed with silk sheets, velvet headboard, bedside lamps, large window, elegant decor',
 'soft morning light through silk curtains, warm bedside lamps',
 ARRAY['silk sheets', 'velvet pillows', 'bedside lamp', 'flower vase', 'carpet']),

('Playa Atardecer',
 'exterior',
 'Playa tranquila con el sol poniéndose sobre el mar',
 'peaceful beach at golden sunset, gentle waves, warm sand, colorful sky, palm trees, nobody around, magical moment',
 'dramatic golden sunset light, warm orange and pink tones',
 ARRAY['sand dunes', 'palm tree', 'sunset reflection', 'gentle waves']),

('Nave Industrial Chic',
 'interior',
 'Espacio industrial convertido en loft moderno y creativo',
 'industrial chic loft, exposed brick walls, metal pipes, large windows, minimalist furniture, plants, modern art on walls',
 'cool industrial light through big windows, dramatic shadows',
 ARRAY['exposed brick', 'metal shelves', 'neon sign', 'plants', 'modern art']),

('Bosque Encantado',
 'exterior',
 'Bosque mágico con árboles enormes y luciérnagas',
 'magical forest, giant ancient trees, glowing fireflies, mystic fog, moss-covered ground, fairy tale atmosphere, ethereal lighting',
 'ethereal blue-green forest light, glowing particles, magical glow',
 ARRAY['ancient trees', 'fireflies', 'mushrooms', 'moss', 'fairy lights']),

('Cocina de Abuela',
 'interior',
 'Cocina tradicional con azulejos, especias y olor a guiso',
 'traditional grandmother kitchen, colorful tiles, hanging herbs and garlic, clay pots, old wooden table, warm and inviting',
 'warm sunny morning light, cozy and nostalgic atmosphere',
 ARRAY['clay pots', 'hanging herbs', 'tile wall', 'wooden table', 'spice jars']),

('Rooftop de Noche',
 'exterior',
 'Azotea de noche con vista a la ciudad iluminada',
 'rooftop at night, sparkling city lights below, stars above, neon signs reflected, cool night atmosphere, urban poetry',
 'cool blue night light, warm city glow, stars twinkling',
 ARRAY['city lights', 'stars', 'neon reflections', 'night sky', 'roof ledge'])

on conflict do nothing;

-- ============================================================
-- SEED: Example cat character
-- ============================================================
insert into cat_characters (name, breed_id, fur_color, eye_color, accessories, personality, catchphrase, backstory, prompt_description)
select
  'Mochi',
  b.id,
  'cream and orange tabby with white patches',
  'big round amber eyes',
  ARRAY['tiny vintage glasses', 'small bow tie'],
  'wise, sarcastic, secretly tender, very opinionated about life',
  'Los humanos sois adorablemente complicados.',
  'Former library cat who has read every book by osmosis. Expert on human behavior from years of observation.',
  'cream and orange tabby Maine Coon cat named Mochi, wearing tiny vintage glasses and a small bow tie, big round amber eyes, wise and slightly sarcastic expression, sitting upright with dignified posture'
from cat_breeds b
where b.name = 'Maine Coon'
limit 1
on conflict do nothing;
