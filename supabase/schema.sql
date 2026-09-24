-- ReUX database schema
-- Run this in your Supabase project: SQL Editor > New query > paste > Run

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  price numeric(10,2) not null check (price >= 0),
  category text default 'Men',
  sizes text[] default '{}',
  stock integer not null default 0 check (stock >= 0),
  image_url text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  items jsonb not null default '[]',
  total numeric(10,2) not null default 0,
  status text not null default 'pending',
  stripe_session_id text,
  customer_email text,
  customer_name text,
  customer_phone text,
  shipping_address jsonb,
  tracking_number text,
  tracking_url text,
  coupon_code text,
  discount numeric(10,2) not null default 0,
  inventory_reserved boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products add column if not exists updated_at timestamptz default now();
alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists shipping_address jsonb;
alter table public.orders add column if not exists inventory_reserved boolean not null default false;
alter table public.orders add column if not exists updated_at timestamptz default now();
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists tracking_url text;
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists discount numeric(10,2) not null default 0;

create table if not exists public.user_carts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]',
  updated_at timestamptz default now()
);

create table if not exists public.wishlists (
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, product_id)
);

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  rating integer not null check (rating between 1 and 5),
  body text not null default '',
  created_at timestamptz default now(),
  unique (product_id, user_id)
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  percent_off numeric(5,2) not null check (percent_off > 0 and percent_off <= 100),
  active boolean not null default true,
  max_redemptions integer,
  redemption_count integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.user_carts enable row level security;
alter table public.wishlists enable row level security;
alter table public.product_reviews enable row level security;
alter table public.coupons enable row level security;

drop policy if exists "products readable by everyone" on public.products;
drop policy if exists "users read own orders" on public.orders;

create policy "products readable by everyone"
  on public.products for select using (true);

create policy "users read own orders"
  on public.orders for select using (auth.uid() = user_id);

drop policy if exists "users manage own carts" on public.user_carts;
create policy "users manage own carts" on public.user_carts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users manage own wishlists" on public.wishlists;
create policy "users manage own wishlists" on public.wishlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "reviews readable by everyone" on public.product_reviews;
create policy "reviews readable by everyone" on public.product_reviews for select using (true);
drop policy if exists "users manage own reviews" on public.product_reviews;
create policy "users manage own reviews" on public.product_reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.reserve_order_inventory(order_uuid uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  order_record public.orders%rowtype;
  item jsonb;
  updated_rows integer;
begin
  select * into order_record from public.orders where id = order_uuid for update;
  if not found then return false; end if;
  if order_record.inventory_reserved then return true; end if;

  for item in select * from jsonb_array_elements(order_record.items)
  loop
    update public.products
    set stock = stock - (item->>'qty')::integer,
        updated_at = now()
    where id = (item->>'id')::uuid
      and stock >= (item->>'qty')::integer;
    get diagnostics updated_rows = row_count;
    if updated_rows <> 1 then return false; end if;
  end loop;

  update public.orders
  set inventory_reserved = true, updated_at = now()
  where id = order_uuid;
  return true;
end;
$$;
