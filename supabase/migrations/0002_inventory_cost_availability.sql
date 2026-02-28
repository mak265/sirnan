do $$
begin
  if not exists (select 1 from pg_type where typname = 'product_availability') then
    create type product_availability as enum ('available', 'preorder');
  end if;
end $$;

alter table if exists public.products
  add column if not exists unit_cost_php numeric(12, 2) not null default 0 check (unit_cost_php >= 0);

alter table if exists public.products
  add column if not exists availability product_availability not null default 'available';

alter table if exists public.quote_items
  add column if not exists unit_cost_php_snapshot numeric(12, 2) not null default 0 check (unit_cost_php_snapshot >= 0);

alter table if exists public.quote_items
  add column if not exists availability_snapshot product_availability not null default 'available';

update public.products
set unit_cost_php = coalesce(unit_cost_php, 0)
where unit_cost_php is null;

update public.products
set availability = coalesce(availability, 'available')
where availability is null;

update public.quote_items
set unit_cost_php_snapshot = coalesce(unit_cost_php_snapshot, 0)
where unit_cost_php_snapshot is null;

update public.quote_items
set availability_snapshot = coalesce(availability_snapshot, 'available')
where availability_snapshot is null;

