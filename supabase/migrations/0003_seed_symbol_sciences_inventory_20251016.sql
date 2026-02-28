create or replace function public.seed_products_upsert_add_stock(
  p_sku text,
  p_name text,
  p_unit_price_php numeric,
  p_stock_on_hand integer,
  p_active boolean default true
)
returns void
language plpgsql
as $$
begin
  insert into public.products (
    sku,
    name,
    brand,
    image_url,
    unit_price_php,
    unit_cost_php,
    availability,
    warranty_notes,
    stock_on_hand,
    active,
    updated_at
  )
  values (
    p_sku,
    p_name,
    null,
    null,
    coalesce(p_unit_price_php, 0),
    0,
    'available',
    null,
    greatest(coalesce(p_stock_on_hand, 0), 0),
    coalesce(p_active, true),
    now()
  )
  on conflict (sku)
  do update set
    name = excluded.name,
    unit_price_php = excluded.unit_price_php,
    unit_cost_php = excluded.unit_cost_php,
    availability = excluded.availability,
    warranty_notes = excluded.warranty_notes,
    stock_on_hand = public.products.stock_on_hand + excluded.stock_on_hand,
    active = excluded.active,
    updated_at = excluded.updated_at;
end;
$$;

select public.seed_products_upsert_add_stock('UHF-WHITE-CARD', 'UHF WHITE CARD', 12.07, 3000, true);
select public.seed_products_upsert_add_stock('DUAL-FREQUENCY-CARD', 'Dual Frequency Card', 39.38, 80, true);
select public.seed_products_upsert_add_stock('60S-HB-1', 'Charging cradle with auxilary', 4107.14, 1, true);
select public.seed_products_upsert_add_stock('YJ5900', 'Youjie Scanner kit', 7767.86, 3, true);
select public.seed_products_upsert_add_stock('ZL2200', 'Youjie Scanner kit', 2600.00, 5, true);
select public.seed_products_upsert_add_stock('AK18353-1', 'MZ series Spare Battery', 2912.00, 1, true);
select public.seed_products_upsert_add_stock('CRD5500-101UES', 'Single Slot Cradle Kit (INTL). Kit includes:', 4950.00, 1, true);
select public.seed_products_upsert_add_stock('105950-035', 'Cleaning Supplies 12 Printhead Cleaning Pens', 109.97, 15, true);
select public.seed_products_upsert_add_stock('BTRY-MC50EAB02', 'spare battery pack,3600 mAH,LI-ON rechargeable', 3702.39, 1, true);
select public.seed_products_upsert_add_stock('KR-201E-15M', 'KR-201E (15M) EM card reader only', 600.00, 5, true);
select public.seed_products_upsert_add_stock('ZKABK-280U', 'Stainless U Bracket for frameless', 400.00, 2, true);
select public.seed_products_upsert_add_stock('ZKYM-280', 'ZKYM-280 (12M)', 2100.00, 1, true);
select public.seed_products_upsert_add_stock('ZKABK-280L', 'L Bracket (to be used with EM Lock)', 550.00, 1, true);
select public.seed_products_upsert_add_stock('220531-000', 'Oneil Printer Battery', 2700.00, 1, true);
select public.seed_products_upsert_add_stock('PWRS-14000-241R', 'Power Supply provides power to the 4 slot charge only', 2110.50, 1, true);
select public.seed_products_upsert_add_stock('BTRY-MC55EAB02', 'MC55 Extended Capacity Spare Battery 3600 MAH.', 1692.60, 5, true);
select public.seed_products_upsert_add_stock('25-108022-03R', 'MC55/65/67: USB Charge', 2493.40, 6, true);
select public.seed_products_upsert_add_stock('CBA-U01-S07ZAR', 'USB Cable for LS2208', 589.29, 2, true);
select public.seed_products_upsert_add_stock('PC42TWE01213', 'Honeywell PC42t Direct Thermal/Thermal Transfer Printer - Monochrome - Desktop - Label Print - 104.10 mm (4.10") Print Width - 101.60 mm/s Mono - 203 dpi - 64 M', 7321.43, 1, true);
select public.seed_products_upsert_add_stock('DX2A2BB10', 'Quad Battery Charger', 11669.64, 4, true);
select public.seed_products_upsert_add_stock('2X1-SATIN-YELLOW', '2x1 satin yellow color 2275 pcs/roll', 348.21, 14, true);
select public.seed_products_upsert_add_stock('1X0-75-SATIN-3ACROSS', '1" X .75" Satin 3 ACROSS w/gap sensor with ribbon 2500 pcs/roll', 223.21, 28, true);
select public.seed_products_upsert_add_stock('1950GHD-2USB-A', 'Black Scanner', 8303.58, 2, true);
select public.seed_products_upsert_add_stock('213-064-001', 'Kit Rubber Protective Boot for', 946.43, 15, true);
select public.seed_products_upsert_add_stock('ROL15-3058-11', 'H-CLASS, UPPER PLATEN ROLLER ASSEMBLY (2 PACK), FOR 6" H-CLASS PRINTERS', 1718.75, 9, true);
select public.seed_products_upsert_add_stock('LI4278-TRBU0100ZAR', 'LI4278 Black Standard Cradle USB Kit', 0, 2, true);
select public.seed_products_upsert_add_stock('P1058930-009', 'Printhead 203 DPI', 18035.71, 1, true);
select public.seed_products_upsert_add_stock('P1037974-010', 'Printhead 203 DPI', 16785.71, 3, true);
select public.seed_products_upsert_add_stock('P1058930-080', 'Kit Platten Roller', 2404.08, 2, true);
select public.seed_products_upsert_add_stock('P1037974-028', 'Kit Platten Roller', 1986.01, 2, true);
select public.seed_products_upsert_add_stock('710-118S-002', 'PM43, Platen Roller', 2375.00, 1, true);
select public.seed_products_upsert_add_stock('710-179S-001', 'Printhead PM42/PM43 300 dpi', 27375.00, 4, true);
select public.seed_products_upsert_add_stock('1-040230-93', 'Pressing Roller', 2705.36, 2, true);
select public.seed_products_upsert_add_stock('1-040230-93', 'Pressing Roller', 2276.79, 1, true);
select public.seed_products_upsert_add_stock('CRD-RS51-4SCHG-01', 'RS5100 Ring Scanner', 11312.50, 1, true);
select public.seed_products_upsert_add_stock('BTRY-MC32-52MA-10', 'MC32 Spare Battery', 1584.82, 6, true);
select public.seed_products_upsert_add_stock('2X1-SATIN-HIGH-TACK', '2X1 Satin high tack adhesive w/ ribbon', 209.82, 30, true);
select public.seed_products_upsert_add_stock('DS2278-SR7U2100PRW', 'DS2278 Scanner W/ USB Kit', 10892.86, 5, true);
select public.seed_products_upsert_add_stock('CRD9000-1001SR', 'Single Slot Cradle no power supply (no cost free only)', 0, 1, true);
select public.seed_products_upsert_add_stock('1-040083-900', 'PX4i, Printhead (Z3)', 29017.86, 2, true);
select public.seed_products_upsert_add_stock('BTRY-MC93-STN-01', 'MC93 Spare Battery', 3750.00, 9, true);
select public.seed_products_upsert_add_stock('MC330L-GJ4EG4RW', 'MC33 Mobile Terminal', 67142.86, 4, true);
select public.seed_products_upsert_add_stock('Z1AE-MC33XX-3C00', 'Zebra One Care', 10267.86, 4, true);
select public.seed_products_upsert_add_stock('SG-MC33-RBTRD-01', 'MC33 Rubber Boot', 357.14, 4, true);
select public.seed_products_upsert_add_stock('CK65-L0N-BSC210E', 'CK65, 4GB/32GB Memory', 84535.71, 3, true);
select public.seed_products_upsert_add_stock('HH492-R1-1USB-5', 'Scanner kit HH4494', 8125.00, 2, true);
select public.seed_products_upsert_add_stock('HPRTPRN0005', '4 Thermal Transfer Barcode Printer, 203 DPI Resolution', 8750.00, 1, true);
select public.seed_products_upsert_add_stock('ZD22042-T0PG00EZ', 'Zebra Printer', 8035.71, 17, true);
select public.seed_products_upsert_add_stock('DS2208-SR7U2100SGW', 'DS2208 Scanner', 3750.00, 22, true);
select public.seed_products_upsert_add_stock('LS2208-SR20007R-UR', 'LS2208 Scanner USB KIT', 3062.00, 4, true);
select public.seed_products_upsert_add_stock('LS2208-SR20007R-UR', 'LS2208 Scanner USB KIT', 3026.79, 26, true);
select public.seed_products_upsert_add_stock('PD45S0C0010000200', 'PD45 Printer 203', 37500.00, 1, true);
select public.seed_products_upsert_add_stock('PD45S0C0010000200', 'PD45 Printer 203', 45982.14, 1, true);
select public.seed_products_upsert_add_stock('PC42E-TB02200', 'PC42 Honeywell printer', 8214.29, 1, true);
select public.seed_products_upsert_add_stock('CK67-X0N-58S1A0G', 'CK67 Mobile Terminal', 77205.36, 7, true);
select public.seed_products_upsert_add_stock('CK67-SCH', 'Scan Handle', 6937.50, 7, true);
select public.seed_products_upsert_add_stock('871-230-401', 'Quad Battery', 14196.43, 2, true);
select public.seed_products_upsert_add_stock('851-061-502', 'Univ Adapter w/Bead, 12V 3.5x1.4m', 3294.64, 2, true);
select public.seed_products_upsert_add_stock('318-063-001', 'Spare battery', 3982.14, 7, true);
select public.seed_products_upsert_add_stock('1-040085-900', 'TPH ASSY 300 DPI PX6i', 36607.43, 9, true);
select public.seed_products_upsert_add_stock('MC930B-GSEEG4RW', 'MC93 Mobile Terminal', 83035.71, 11, true);
select public.seed_products_upsert_add_stock('Z1AE-MC93XX-3C00', '3 Years Service Contract', 13928.57, 11, true);
select public.seed_products_upsert_add_stock('MISC-MC93-SCRN-01', 'Tempered Glass', 1339.28, 1, true);
select public.seed_products_upsert_add_stock('CRD-MC93-4SUCHG-01', 'Single Slot Charge', 11607.14, 2, true);

drop function if exists public.seed_products_upsert_add_stock(text, text, numeric, integer, boolean);

