create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'quote_status') then
    create type quote_status as enum ('Draft', 'Sent', 'Approved', 'Expired');
  end if;
end $$;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  brand text null,
  image_url text null,
  unit_price_php numeric(12,2) not null check (unit_price_php >= 0),
  warranty_notes text null,
  stock_on_hand integer not null default 0 check (stock_on_hand >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text null,
  phone text null,
  address_text text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stock_rules (
  id uuid primary key default gen_random_uuid(),
  mode text not null default 'block_on_send' check (mode in ('warn_only', 'block_on_send')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role text not null check (role in ('admin', 'sales')),
  created_at timestamptz not null default now()
);

create table if not exists quote_counters (
  quote_date date primary key,
  last_seq integer not null default 0
);

create or replace function generate_quotation_no(p_date date)
returns text
language plpgsql
as $$
declare
  seq integer;
begin
  insert into quote_counters (quote_date, last_seq)
  values (p_date, 1)
  on conflict (quote_date)
  do update set last_seq = quote_counters.last_seq + 1
  returning last_seq into seq;

  return to_char(p_date, 'YYYYMMDD') || '-' || lpad(seq::text, 4, '0');
end;
$$;

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  quotation_no text not null unique,
  company_name text not null,
  system_name text null,
  quotation_date date not null default current_date,
  valid_until date not null,
  status quote_status not null default 'Draft',
  customer_type text not null default 'Walk-in',
  customer_name text not null,
  customer_id uuid null,
  currency text not null default 'PHP',
  vat_inclusive boolean not null default true,
  terms_template text not null default '• Quoted prices are in Philippine Peso, VAT Inclusive.',
  grand_total_php numeric(14,2) not null default 0,
  pdf_object_path text null,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function quotes_set_quotation_no()
returns trigger
language plpgsql
as $$
begin
  if new.quotation_no is null or length(trim(new.quotation_no)) = 0 then
    new.quotation_no := generate_quotation_no(new.quotation_date);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_quotes_set_quotation_no on quotes;
create trigger trg_quotes_set_quotation_no
before insert on quotes
for each row
execute function quotes_set_quotation_no();

create table if not exists quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  product_id uuid not null references products(id),
  sku_snapshot text not null,
  name_snapshot text not null,
  brand_snapshot text null,
  image_url_snapshot text null,
  warranty_notes_snapshot text null,
  unit_price_php_snapshot numeric(12,2) not null check (unit_price_php_snapshot >= 0),
  qty integer not null check (qty > 0),
  line_total_php numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quote_items_quote_id_idx on quote_items(quote_id);
create index if not exists quote_items_product_id_idx on quote_items(product_id);

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  );
$$;

grant usage on schema public to anon, authenticated;

grant select on products to authenticated;
grant select on customers to authenticated;
grant select on quotes to authenticated;
grant select on quote_items to authenticated;
grant select on stock_rules to authenticated;
grant select on user_roles to authenticated;

grant insert, update, delete on products to authenticated;
grant insert, update, delete on customers to authenticated;
grant insert, update, delete on quotes to authenticated;
grant insert, update, delete on quote_items to authenticated;
grant insert, update, delete on stock_rules to authenticated;
grant insert, update, delete on user_roles to authenticated;

alter table products enable row level security;
alter table customers enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;
alter table stock_rules enable row level security;
alter table user_roles enable row level security;

drop policy if exists products_read on products;
create policy products_read on products for select to authenticated using (true);
drop policy if exists products_admin_write on products;
create policy products_admin_write on products for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists customers_read on customers;
create policy customers_read on customers for select to authenticated using (true);
drop policy if exists customers_admin_write on customers;
create policy customers_admin_write on customers for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists user_roles_read_self_or_admin on user_roles;
create policy user_roles_read_self_or_admin on user_roles
for select to authenticated
using (user_id = auth.uid() or is_admin());
drop policy if exists user_roles_admin_write on user_roles;
create policy user_roles_admin_write on user_roles
for all to authenticated
using (is_admin())
with check (is_admin());

drop policy if exists stock_rules_read on stock_rules;
create policy stock_rules_read on stock_rules for select to authenticated using (true);
drop policy if exists stock_rules_admin_write on stock_rules;
create policy stock_rules_admin_write on stock_rules for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists quotes_read on quotes;
create policy quotes_read on quotes
for select to authenticated
using (created_by_user_id = auth.uid() or is_admin());

drop policy if exists quotes_insert on quotes;
create policy quotes_insert on quotes
for insert to authenticated
with check (created_by_user_id = auth.uid() or is_admin());

drop policy if exists quotes_update on quotes;
create policy quotes_update on quotes
for update to authenticated
using (created_by_user_id = auth.uid() or is_admin())
with check (created_by_user_id = auth.uid() or is_admin());

drop policy if exists quotes_delete on quotes;
create policy quotes_delete on quotes
for delete to authenticated
using (created_by_user_id = auth.uid() or is_admin());

drop policy if exists quote_items_read on quote_items;
create policy quote_items_read on quote_items
for select to authenticated
using (
  exists (
    select 1 from quotes q
    where q.id = quote_items.quote_id
      and (q.created_by_user_id = auth.uid() or is_admin())
  )
);

drop policy if exists quote_items_write on quote_items;
create policy quote_items_write on quote_items
for all to authenticated
using (
  exists (
    select 1 from quotes q
    where q.id = quote_items.quote_id
      and (q.created_by_user_id = auth.uid() or is_admin())
  )
)
with check (
  exists (
    select 1 from quotes q
    where q.id = quote_items.quote_id
      and (q.created_by_user_id = auth.uid() or is_admin())
  )
);

insert into stock_rules (mode)
select 'block_on_send'
where not exists (select 1 from stock_rules);

insert into products (sku, name, brand, image_url, unit_price_php, warranty_notes, stock_on_hand, active)
select * from (
  values
    ('TC701', 'TC701 Mobile Computer', null, null, 12000.00, 'Note: 6 months warranty', 5, true),
    ('TC73', 'TC73 Mobile Computer', 'Zebra', null, 50000.00, 'Note: 12 months', 2, true)
) as v(sku, name, brand, image_url, unit_price_php, warranty_notes, stock_on_hand, active)
where not exists (select 1 from products);

insert into customers (name, email, phone, address_text)
select * from (
  values
    ('Symbol Science Walk-in', null, null, null),
    ('Acme Retail', 'purchasing@acme.example', '+63 917 000 0000', 'Makati City, Metro Manila')
) as v(name, email, phone, address_text)
where not exists (select 1 from customers);
