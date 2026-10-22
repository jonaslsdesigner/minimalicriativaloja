revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

create table public.products (
  id text primary key,
  name text not null,
  category text not null check (category in ('topos', 'canecas', 'papelaria', 'impressos', 'lembrancinhas')),
  label text not null,
  price numeric(10, 2) not null check (price >= 0),
  placeholder_color text not null default '#f3c4d8' check (placeholder_color ~ '^#[0-9A-Fa-f]{6}$'),
  badge text not null default '',
  featured boolean not null default false,
  is_new boolean not null default false,
  description text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "public_can_read_active_products"
on public.products
for select
to anon, authenticated
using (active = true);

grant usage on schema public to anon, authenticated;
grant select on table public.products to anon, authenticated;

insert into public.products
  (id, name, category, label, price, placeholder_color, badge, featured, is_new, description, sort_order)
values
  ('topo-personalizado', 'Topo de bolo personalizado', 'topos', 'Uma festa do seu jeitinho', 10.00, '#ffb1d1', 'Queridinho', true, false, 'Um toque de alegria para o centro da festa. Personalize com o nome, a idade e o tema que fazem parte da sua história.', 10),
  ('caneca-personalizada', 'Caneca personalizada', 'canecas', 'Um presente cheio de afeto', 34.90, '#aee7ff', '', true, false, 'Transforme o café de todo dia em uma lembrança especial. Conte sua ideia de nome, ilustração ou mensagem para personalizar.', 20),
  ('topper-mesversario', 'Topper de mesversário', 'topos', 'Cada mês, uma nova memória', 10.00, '#d8b8ff', 'Novo', true, true, 'Para celebrar cada pequena conquista. Escolha o tema e conte o nome e o mês que deseja destacar no seu topper.', 30),
  ('etiquetas-adesivos', 'Etiquetas e adesivos', 'papelaria', 'Seu carinho em cada detalhe', 12.50, '#aeeec8', '', true, false, 'Dê um acabamento especial aos seus presentes, embalagens ou materiais. Conte como você imagina suas etiquetas e adesivos.', 40),
  ('lembrancinha-personalizada', 'Lembrancinha personalizada', 'lembrancinhas', 'Um pedacinho da sua celebração', 8.00, '#ffe394', 'Queridinho', true, false, 'Um mimo para levar a festa na memória. Personalize o tema, as cores e a mensagem para seus convidados.', 50),
  ('caneca-mae', 'Caneca para quem é especial', 'canecas', 'Para dizer: você é única', 34.90, '#ffc0d5', 'Novo', true, true, 'Carinho em forma de presente. Escolha uma mensagem e conte para quem será essa surpresa especial.', 60),
  ('papelaria-marca', 'Papelaria para sua marca', 'impressos', 'A sua identidade no papel', 12.50, '#a8e4ec', 'Novo', true, true, 'Pequenos detalhes para acompanhar sua marca. Conte o tipo de impresso, as cores e a mensagem que deseja usar.', 70),
  ('caneca-marca', 'Caneca com a sua marca', 'canecas', 'Sua ideia acompanha o café', 34.90, '#ffc9ae', '', true, false, 'Sua marca pode fazer parte de momentos especiais. Descreva como deseja aplicar sua identidade em uma caneca personalizada.', 80);
