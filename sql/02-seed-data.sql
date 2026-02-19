-- ============================================================
-- 02-seed-data.sql  (Part 1 of 1)
-- Enterprise Data Portal — Comprehensive seed data (reference SQL)
-- NOTE: This app now targets Microsoft Fabric Warehouse (T-SQL).
--       This file is kept as a reference for seed data.
--       Adapt syntax for Fabric Warehouse before executing.
-- ============================================================

-- ============================================================
-- SECTION 1: Asset Categories, Locations (new tables, no deps)
-- ============================================================

INSERT INTO asset_categories (code, name, parent_category, useful_life_years, depreciation_rate, description)
SELECT v.code, v.name, v.parent_category, v.useful_life_years, v.depreciation_rate, v.description
FROM (VALUES
  ('ROAD',  'Roads',              NULL,          50, 2.00,  'Sealed and unsealed road surfaces'),
  ('BRDG',  'Bridges',            NULL,          80, 1.25,  'Road and pedestrian bridges'),
  ('BLDG',  'Buildings',          NULL,          60, 1.67,  'Council-owned buildings and facilities'),
  ('VEHI',  'Vehicles',           NULL,           8, 12.50, 'Fleet vehicles and heavy plant'),
  ('ITEQ',  'IT Equipment',       NULL,           4, 25.00, 'Computers, servers, networking'),
  ('PARK',  'Parks & Playgrounds',NULL,          25, 4.00,  'Playground equipment and park furniture'),
  ('DRAIN', 'Drainage',           NULL,          80, 1.25,  'Stormwater and drainage infrastructure'),
  ('FPATH', 'Footpaths',          NULL,          40, 2.50,  'Concrete and gravel footpaths'),
  ('CPARK', 'Car Parks',          NULL,          30, 3.33,  'Public car park surfaces and structures'),
  ('LIGHT', 'Street Lighting',    NULL,          20, 5.00,  'Street and public area lighting'),
  ('FURN',  'Street Furniture',   'PARK',        15, 6.67,  'Benches, bins, bollards'),
  ('LIBR',  'Library Resources',  'BLDG',         5, 20.00, 'Library books and digital resources'),
  ('SPORT', 'Sports Facilities',  'PARK',        25, 4.00,  'Ovals, courts, pavilions'),
  ('WATER', 'Water Features',     'PARK',        20, 5.00,  'Fountains and water play areas'),
  ('SIGN',  'Signage',            NULL,          10, 10.00, 'Regulatory and wayfinding signage')
) AS v(code, name, parent_category, useful_life_years, depreciation_rate, description)
WHERE NOT EXISTS (SELECT 1 FROM asset_categories LIMIT 1);

INSERT INTO asset_locations (code, name, address, suburb, council_area, latitude, longitude, council_id)
SELECT v.code, v.name, v.address, v.suburb, v.council_area, v.latitude, v.longitude,
       (SELECT council_id FROM councils LIMIT 1)
FROM (VALUES
  ('LOC-CAMB',  'Camberwell Civic Centre',         '8 Inglesby Rd',           'Camberwell',         'Boroondara', -37.8400000, 145.0570000),
  ('LOC-HAWT',  'Hawthorn Arts Centre',             '360 Burwood Rd',          'Hawthorn',           'Boroondara', -37.8220000, 145.0350000),
  ('LOC-KEWC',  'Kew Civic Centre',                 '30 Cotham Rd',            'Kew',                'Boroondara', -37.8070000, 145.0290000),
  ('LOC-GLEN',  'Glen Iris Wetlands',               '25 High St',              'Glen Iris',          'Boroondara', -37.8610000, 145.0650000),
  ('LOC-SURY',  'Surrey Hills Neighbourhood Centre','157 Union Rd',            'Surrey Hills',       'Boroondara', -37.8260000, 145.1010000),
  ('LOC-BALW',  'Balwyn Community Centre',           '412 Whitehorse Rd',      'Balwyn',             'Boroondara', -37.8110000, 145.0770000),
  ('LOC-CANT',  'Canterbury Gardens',                'Canterbury Rd',           'Canterbury',         'Boroondara', -37.8270000, 145.0790000),
  ('LOC-BPOL',  'Boroondara Sports Complex',         '40 Reservior Rd',        'Balwyn North',       'Boroondara', -37.7930000, 145.0870000),
  ('LOC-GARD',  'Gardiner Park',                     'Gardiner Pde',           'Glen Iris',          'Boroondara', -37.8560000, 145.0520000),
  ('LOC-HAWL',  'Hawthorn Library',                  '584 Glenferrie Rd',      'Hawthorn',           'Boroondara', -37.8280000, 145.0370000),
  ('LOC-DEEP',  'Deepdene Park',                     '25 Whitehorse Rd',       'Deepdene',           'Boroondara', -37.8120000, 145.0570000),
  ('LOC-KEWD',  'Kew Depot',                         '5 Normanby Rd',          'Kew',                'Boroondara', -37.8010000, 145.0250000),
  ('LOC-ASHB',  'Ashburton Pool & Recreation',       '12 Warner Ave',          'Ashburton',          'Boroondara', -37.8650000, 145.0800000),
  ('LOC-CAMR',  'Camberwell Sports Ground',          '60 Prospect Hill Rd',    'Camberwell',         'Boroondara', -37.8430000, 145.0660000),
  ('LOC-KEWR',  'Kew Recreation Centre',             '175 Barkers Rd',         'Kew',                'Boroondara', -37.8050000, 145.0380000),
  ('LOC-BALP',  'Balwyn Park',                       '1 Balwyn Rd',            'Balwyn',             'Boroondara', -37.8130000, 145.0830000),
  ('LOC-BURK',  'Burke Rd Precinct',                 'Burke Rd',               'Camberwell',         'Boroondara', -37.8350000, 145.0590000),
  ('LOC-RIVD',  'Riversdale Reserve',                'Riversdale Rd',          'Hawthorn East',      'Boroondara', -37.8340000, 145.0470000),
  ('LOC-LYNR',  'Lynden Park Reserve',               'Burke Rd',               'Camberwell',         'Boroondara', -37.8480000, 145.0590000),
  ('LOC-MARL',  'Maranoa Gardens',                   'Beckett Park Rd',        'Balwyn',             'Boroondara', -37.8090000, 145.0910000),
  ('LOC-COTT',  'Cotham Rd Reserve',                 'Cotham Rd',              'Kew',                'Boroondara', -37.8060000, 145.0340000),
  ('LOC-GLFT',  'Glenferrie Oval',                   'Glenferrie Rd',          'Hawthorn',           'Boroondara', -37.8260000, 145.0380000),
  ('LOC-VICTG', 'Victoria Park',                     'High St',                'Kew',                'Boroondara', -37.8000000, 145.0200000),
  ('LOC-FREY',  'Freeway Golf Course',               'Yarra Blvd',             'Kew',                'Boroondara', -37.7960000, 145.0160000),
  ('LOC-GARV',  'Garvin Park',                       'Garvin St',              'Balwyn North',       'Boroondara', -37.7950000, 145.0900000),
  ('LOC-LEAD',  'Lead Street Reserve',               'Lead St',                'Balwyn',             'Boroondara', -37.8080000, 145.0740000),
  ('LOC-WATT',  'Wattle Park',                       'Riversdale Rd',          'Surrey Hills',       'Boroondara', -37.8310000, 145.1050000),
  ('LOC-READ',  'Read Gardens',                      'Mont Albert Rd',         'Canterbury',         'Boroondara', -37.8200000, 145.0820000),
  ('LOC-PEEL',  'Peel St Reserve',                   'Peel St',                'Kew',                'Boroondara', -37.8020000, 145.0300000),
  ('LOC-BEAU',  'Beaumont Reserve',                  'Beaumont Pde',           'Camberwell',         'Boroondara', -37.8450000, 145.0700000)
) AS v(code, name, address, suburb, council_area, latitude, longitude)
WHERE NOT EXISTS (SELECT 1 FROM asset_locations LIMIT 1);


-- ============================================================
-- SECTION 2: Service Categories (new table, no deps)
-- ============================================================

INSERT INTO service_categories (name, parent_category, description, sla_days)
SELECT v.name, v.parent_cat, v.description, v.sla_days
FROM (VALUES
  ('Roads & Footpaths',    NULL,                   'Road surface, pothole, footpath issues', 10),
  ('Waste & Recycling',    NULL,                   'Missed bins, illegal dumping, hard waste', 5),
  ('Parks & Gardens',      NULL,                   'Tree maintenance, park facilities, mowing', 14),
  ('Drainage & Flooding',  NULL,                   'Blocked drains, flooding, stormwater', 7),
  ('Animals',              NULL,                   'Barking dogs, lost pets, animal management', 3),
  ('Building & Planning',  NULL,                   'Permits, inspections, zoning queries', 21),
  ('Noise Complaints',     NULL,                   'Noise disturbance, construction hours', 5),
  ('Graffiti & Vandalism', NULL,                   'Graffiti removal, public property damage', 7),
  ('Street Lighting',      'Roads & Footpaths',    'Street light outages and faults', 10),
  ('Abandoned Vehicles',   'Roads & Footpaths',    'Vehicles left on public roads', 14),
  ('Tree Maintenance',     'Parks & Gardens',      'Tree pruning, removal, root damage', 21),
  ('Playground Issues',    'Parks & Gardens',      'Broken equipment, safety concerns', 3),
  ('Hard Waste Collection','Waste & Recycling',     'Scheduled hard-waste pickup', 14),
  ('Illegal Dumping',      'Waste & Recycling',     'Illegally dumped rubbish', 7),
  ('Local Laws',           NULL,                   'Parking, signs, local law enquiries', 10)
) AS v(name, parent_cat, description, sla_days)
WHERE NOT EXISTS (SELECT 1 FROM service_categories LIMIT 1);


-- ============================================================
-- SECTION 3: Large DO block for all remaining data
-- ============================================================

DO $$
DECLARE
    v_council_id UUID;
    v_count      INT;
    i            INT;
    j            INT;
    v_id         UUID;
    v_period_id  UUID;
    v_coa_id     UUID;
    v_org_id     UUID;
    v_supplier_id UUID;
    v_customer_id UUID;
    v_asset_id   UUID;
    v_project_id UUID;
    v_meeting_id UUID;
    v_employee_id UUID;
    v_request_id UUID;
    v_receipt_id UUID;
    v_journal_id UUID;
    v_ap_id      UUID;
    v_ar_id      UUID;
    v_route_id   UUID;
    v_task_id    UUID;
    v_seg_code   TEXT;

    -- Australian first/last name pools
    v_first_names TEXT[] := ARRAY['James','Sarah','Michael','Emma','David','Jessica','Daniel','Rachel','Andrew','Nicole',
                                  'Matthew','Lauren','Christopher','Michelle','Joshua','Stephanie','Luke','Melissa','Ryan','Amanda',
                                  'Thomas','Rebecca','Nathan','Kathryn','Benjamin','Megan','Jack','Hannah','Liam','Chloe',
                                  'William','Olivia','Ethan','Sophie','Harry','Grace','Oliver','Charlotte','Noah','Emily',
                                  'Alexander','Zoe','Patrick','Lisa','Cameron','Fiona','Shane','Karen','Peter','Helen',
                                  'Mark','Catherine','Stuart','Wendy','Craig','Tracey','Dean','Donna','Brett','Julie',
                                  'Scott','Anne','Glen','Deborah','Darren','Natalie','Adrian','Kellie','Jason','Belinda',
                                  'Gary','Sandra','Wayne','Joanne','Trevor','Leanne','Russell','Tina','Geoffrey','Pamela'];
    v_last_names TEXT[]  := ARRAY['Smith','Johnson','Williams','Brown','Jones','Davis','Wilson','Taylor','Anderson','Thomas',
                                  'White','Martin','Thompson','Garcia','Martinez','Robinson','Clark','Lewis','Lee','Walker',
                                  'Hall','Allen','Young','King','Wright','Lopez','Hill','Scott','Green','Adams',
                                  'Baker','Gonzalez','Nelson','Carter','Mitchell','Perez','Roberts','Turner','Phillips','Campbell',
                                  'Parker','Evans','Edwards','Collins','Stewart','Sanchez','Morris','Rogers','Reed','Cook',
                                  'Morgan','Bell','Murphy','Bailey','Rivera','Cooper','Richardson','Cox','Howard','Ward',
                                  'Torres','Peterson','Gray','Ramirez','James','Watson','Brooks','Kelly','Sanders','Price',
                                  'Bennett','Wood','Barnes','Ross','Henderson','Coleman','Jenkins','Perry','Powell','Long'];

    v_departments TEXT[] := ARRAY['Finance','Engineering','Community Services','Parks & Recreation',
                                  'Library Services','Information Technology','Customer Service',
                                  'Planning & Building','Environment & Sustainability',
                                  'Governance & Legal','Human Resources','Communications',
                                  'Asset Management','Waste Services','Youth & Family Services'];

    v_suburbs TEXT[] := ARRAY['Hawthorn','Camberwell','Kew','Balwyn','Canterbury',
                              'Glen Iris','Surrey Hills','Hawthorn East','Balwyn North',
                              'Deepdene'];

    v_streets TEXT[] := ARRAY['Glenferrie Rd','Burke Rd','Riversdale Rd','Cotham Rd','Camberwell Rd',
                              'Toorak Rd','Auburn Rd','Power St','Prospect Hill Rd',
                              'Canterbury Rd','Station St','High St','Church St','Victoria Rd',
                              'Barkers Rd','Studley Park Rd','Denmark St','Mont Albert Rd',
                              'Whitehorse Rd','Boulevard'];

BEGIN
    -- Get the existing council
    SELECT council_id INTO v_council_id FROM councils LIMIT 1;

    -- ========================================
    -- ORGANIZATIONAL UNITS  (boost to ~25)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM organizational_units;
    IF v_count < 25 THEN
        INSERT INTO organizational_units (council_id, unit_code, unit_name, unit_type, parent_unit_id, is_active)
        SELECT v_council_id, v.code, v.name, v.utype, NULL, TRUE
        FROM (VALUES
            ('HR',    'Human Resources',             'Department'),
            ('COMM',  'Communications & Engagement', 'Department'),
            ('ASSET', 'Asset Management',            'Department'),
            ('WASTE', 'Waste Services',              'Department'),
            ('YOUTH', 'Youth & Family Services',     'Department'),
            ('GOV',   'Governance & Legal',          'Department'),
            ('STRAT', 'Strategy & Performance',      'Department'),
            ('PLAN',  'Planning & Building',         'Department'),
            ('ENVS',  'Environment & Sustainability','Department'),
            ('RECS',  'Recreation & Leisure',        'Department'),
            ('TRANS', 'Transport & Traffic',         'Department'),
            ('EDEV',  'Economic Development',        'Department'),
            ('PROJ',  'Project Delivery',            'Department'),
            ('PROP',  'Property & Facilities',       'Department')
        ) AS v(code, name, utype)
        WHERE NOT EXISTS (SELECT 1 FROM organizational_units WHERE unit_code = v.code);
    END IF;

    -- ========================================
    -- CHART OF ACCOUNTS  (boost to ~100)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM chart_of_accounts;
    IF v_count < 100 THEN
        INSERT INTO chart_of_accounts (council_id, segment_code, segment_name, account_type, account_classification, parent_segment_code, is_active)
        SELECT v_council_id, v.seg, v.seg_name, v.atype, v.aclass, v.parent, TRUE
        FROM (VALUES
            ('4110','Rates - Residential',           'Revenue','Operating Revenue','4100'),
            ('4120','Rates - Commercial',            'Revenue','Operating Revenue','4100'),
            ('4130','Rates - Supplementary',         'Revenue','Operating Revenue','4100'),
            ('4210','Parking Fees',                  'Revenue','Operating Revenue','4200'),
            ('4220','Facility Hire Income',          'Revenue','Operating Revenue','4200'),
            ('4230','Fines & Penalties',             'Revenue','Operating Revenue','4200'),
            ('4240','Planning Application Fees',     'Revenue','Operating Revenue','4200'),
            ('4310','Victorian Grants Commission',   'Revenue','Grant Revenue',    '4300'),
            ('4320','Roads to Recovery Grant',       'Revenue','Grant Revenue',    '4300'),
            ('4330','Community Safety Grant',        'Revenue','Grant Revenue',    '4300'),
            ('4340','Environmental Sustainability Grant','Revenue','Grant Revenue','4300'),
            ('4410','Waste Collection Charges',      'Revenue','Operating Revenue','4400'),
            ('4420','Green Waste Charges',           'Revenue','Operating Revenue','4400'),
            ('4510','Interest on Investments',       'Revenue','Other Revenue',    '4500'),
            ('4520','Rental Income',                 'Revenue','Other Revenue',    '4500'),
            ('4530','Asset Sales Proceeds',          'Revenue','Other Revenue',    '4500'),
            ('5110','Salaries - Permanent',          'Expense','Employee Costs',   '5100'),
            ('5120','Salaries - Casual',             'Expense','Employee Costs',   '5100'),
            ('5130','Superannuation',                'Expense','Employee Costs',   '5100'),
            ('5140','Workers Compensation',          'Expense','Employee Costs',   '5100'),
            ('5150','Staff Training & Development',  'Expense','Employee Costs',   '5100'),
            ('5160','Recruitment Costs',             'Expense','Employee Costs',   '5100'),
            ('5210','Electricity',                   'Expense','Utilities',        '5200'),
            ('5220','Gas',                           'Expense','Utilities',        '5200'),
            ('5230','Water & Sewerage',              'Expense','Utilities',        '5200'),
            ('5240','Telecommunications',            'Expense','Utilities',        '5200'),
            ('5310','Road Maintenance',              'Expense','Materials & Services','5300'),
            ('5320','Parks Maintenance',             'Expense','Materials & Services','5300'),
            ('5330','Building Maintenance',          'Expense','Materials & Services','5300'),
            ('5340','Drainage Maintenance',          'Expense','Materials & Services','5300'),
            ('5350','Fleet Maintenance',             'Expense','Materials & Services','5300'),
            ('5360','IT Maintenance & Licences',     'Expense','Materials & Services','5300'),
            ('5410','Waste Collection Contract',     'Expense','Contracts',        '5400'),
            ('5420','Cleaning Contracts',            'Expense','Contracts',        '5400'),
            ('5430','Security Contracts',            'Expense','Contracts',        '5400'),
            ('5440','Consulting & Professional',     'Expense','Contracts',        '5400'),
            ('5510','Insurance Premiums',            'Expense','Insurance',        '5500'),
            ('5610','Depreciation - Roads',          'Expense','Depreciation',     '5600'),
            ('5620','Depreciation - Buildings',      'Expense','Depreciation',     '5600'),
            ('5630','Depreciation - Vehicles',       'Expense','Depreciation',     '5600'),
            ('5640','Depreciation - IT Equipment',   'Expense','Depreciation',     '5600'),
            ('5650','Depreciation - Drainage',       'Expense','Depreciation',     '5600'),
            ('8110','Capital - Road Renewal',        'Expense','Capital Works',    '8100'),
            ('8120','Capital - Bridge Works',        'Expense','Capital Works',    '8100'),
            ('8130','Capital - Building Works',      'Expense','Capital Works',    '8100'),
            ('8140','Capital - Drainage Works',      'Expense','Capital Works',    '8100'),
            ('8210','Capital - New Roads',           'Expense','Capital Works',    '8200'),
            ('8220','Capital - New Buildings',       'Expense','Capital Works',    '8200'),
            ('8230','Capital - New Footpaths',       'Expense','Capital Works',    '8200'),
            ('8310','Capital - Vehicle Purchases',   'Expense','Capital Works',    '8300'),
            ('8320','Capital - IT Purchases',        'Expense','Capital Works',    '8300')
        ) AS v(seg, seg_name, atype, aclass, parent)
        WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE segment_code = v.seg AND council_id = v_council_id);
    END IF;

    -- ========================================
    -- ACCOUNTING PERIODS  (boost to 24)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM accounting_periods;
    IF v_count < 24 THEN
        -- FY2024: Jul 2023 - Jun 2024
        FOR i IN 1..12 LOOP
            INSERT INTO accounting_periods (council_id, period_code, period_name, period_type, fiscal_year, start_date, end_date, is_closed)
            SELECT v_council_id,
                   'FY24-' || LPAD(i::TEXT, 2, '0'),
                   TO_CHAR(DATE '2023-06-01' + (i || ' months')::INTERVAL, 'Mon YYYY'),
                   'Monthly', '2024',
                   (DATE '2023-06-01' + (i || ' months')::INTERVAL)::DATE,
                   ((DATE '2023-06-01' + ((i+1) || ' months')::INTERVAL) - INTERVAL '1 day')::DATE,
                   TRUE
            WHERE NOT EXISTS (
                SELECT 1 FROM accounting_periods
                WHERE council_id = v_council_id AND period_code = 'FY24-' || LPAD(i::TEXT, 2, '0')
            );
        END LOOP;
        -- FY2025: Jul 2024 - Jun 2025
        FOR i IN 1..12 LOOP
            INSERT INTO accounting_periods (council_id, period_code, period_name, period_type, fiscal_year, start_date, end_date, is_closed)
            SELECT v_council_id,
                   'FY25-' || LPAD(i::TEXT, 2, '0'),
                   TO_CHAR(DATE '2024-06-01' + (i || ' months')::INTERVAL, 'Mon YYYY'),
                   'Monthly', '2025',
                   (DATE '2024-06-01' + (i || ' months')::INTERVAL)::DATE,
                   ((DATE '2024-06-01' + ((i+1) || ' months')::INTERVAL) - INTERVAL '1 day')::DATE,
                   CASE WHEN i <= 6 THEN TRUE ELSE FALSE END
            WHERE NOT EXISTS (
                SELECT 1 FROM accounting_periods
                WHERE council_id = v_council_id AND period_code = 'FY25-' || LPAD(i::TEXT, 2, '0')
            );
        END LOOP;
    END IF;

    -- ========================================
    -- SUPPLIERS  (boost to ~40)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM suppliers;
    IF v_count < 40 THEN
        INSERT INTO suppliers (council_id, supplier_code, supplier_name, abn, supplier_type, payment_terms, is_active)
        SELECT v_council_id, v.code, v.name, v.abn, v.stype, v.terms, TRUE
        FROM (VALUES
            ('SUP011','Fulton Hogan Pty Ltd',       '16 055 331 264','Contractor','Net 30'),
            ('SUP012','Boral Asphalt',              '13 008 421 761','Materials', 'Net 30'),
            ('SUP013','Telstra Corporation',         '33 051 775 556','Utility',   'Net 14'),
            ('SUP014','AusGrid',                    '45 100 150 900','Utility',   'Net 14'),
            ('SUP015','Citywide Service Solutions', '34 120 660 218','Contractor','Net 30'),
            ('SUP016','Downer Group',               '97 003 872 848','Contractor','Net 30'),
            ('SUP017','John Holland Group',          '11 004 282 268','Contractor','Net 45'),
            ('SUP018','Cleanaway Waste Management',  '74 101 079 878','Contractor','Net 30'),
            ('SUP019','Veolia Australia',            '45 101 010 893','Contractor','Net 30'),
            ('SUP020','Ventia Services Group',       '25 604 591 639','Contractor','Net 30'),
            ('SUP021','Origin Energy',               '30 000 051 696','Utility',   'Net 14'),
            ('SUP022','AGL Energy',                  '74 115 061 375','Utility',   'Net 14'),
            ('SUP023','Yarra Valley Water',          '93 066 902 501','Utility',   'Net 30'),
            ('SUP024','Dell Technologies AU',        '46 003 855 561','IT',        'Net 30'),
            ('SUP025','Microsoft Australia',         '47 000 530 921','IT',        'Net 30'),
            ('SUP026','Bunnings Group',              '26 008 672 179','Materials', 'Net 14'),
            ('SUP027','Coates Hire',                 '99 074 126 971','Equipment', 'Net 30'),
            ('SUP028','Programmed Maintenance',      '61 054 742 264','Contractor','Net 30'),
            ('SUP029','Maddocks Lawyers',            '32 005 757 251','Professional','Net 30'),
            ('SUP030','KPMG Australia',              '51 002 291 883','Professional','Net 30'),
            ('SUP031','Jacobs Engineering',          '37 008 710 004','Consultant','Net 30'),
            ('SUP032','GHD Pty Ltd',                 '39 008 488 373','Consultant','Net 30'),
            ('SUP033','Cardno Pty Ltd',              '41 006 913 196','Consultant','Net 30'),
            ('SUP034','Aspect Studios',              '22 143 987 102','Consultant','Net 30'),
            ('SUP035','WSP Australia',               '80 078 004 798','Consultant','Net 30'),
            ('SUP036','Officeworks',                 '36 004 763 526','Materials', 'Net 14'),
            ('SUP037','Blackwoods',                  '20 000 906 675','Materials', 'Net 30'),
            ('SUP038','Total Tools',                 '92 093 742 827','Materials', 'Net 14'),
            ('SUP039','Kennards Hire',               '29 001 710 745','Equipment', 'Net 30'),
            ('SUP040','BP Australia',                '53 004 085 616','Fuel',      'Net 14')
        ) AS v(code, name, abn, stype, terms)
        WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE supplier_code = v.code AND council_id = v_council_id);
    END IF;

    -- ========================================
    -- CUSTOMERS  (boost to ~25)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM customers;
    IF v_count < 25 THEN
        INSERT INTO customers (council_id, customer_code, customer_name, abn, customer_type, is_active)
        SELECT v_council_id, v.code, v.name, v.abn, v.ctype, TRUE
        FROM (VALUES
            ('CUST006','Camberwell Fresh Food Market',  '50 008 700 100','Commercial'),
            ('CUST007','Boroondara YMCA',             '14 001 283 726','Community'),
            ('CUST008','Hawthorn RSL',                '72 004 201 955','Community'),
            ('CUST009','Canterbury Primary School',   '11 222 333 444','Education'),
            ('CUST010','Camberwell High School',      '22 333 444 555','Education'),
            ('CUST011','Kew Uniting Church',          '33 444 555 666','Community'),
            ('CUST012','Hawthorn FC',                 '44 555 666 777','Sports Club'),
            ('CUST013','Kew Cricket Club',            '55 666 777 888','Sports Club'),
            ('CUST014','St Vincents Hospital',        '68 286 158 036','Health'),
            ('CUST015','Hawthorn Bowling Club',       '66 777 888 999','Sports Club'),
            ('CUST016','Boroondara Business Network', '77 888 999 000','Business'),
            ('CUST017','Balwyn Tennis Club',          '88 999 000 111','Sports Club'),
            ('CUST018','Hawthorn Arts Centre Trust',  '99 000 111 222','Community'),
            ('CUST019','Camberwell Traders Assn',     '18 064 741 295','Business'),
            ('CUST020','Surrey Hills Neighbourhood Centre','10 111 222 333','Community'),
            ('CUST021','Kew Scouts',                  '11 112 223 334','Community'),
            ('CUST022','Balwyn Cinema',               '22 223 334 445','Business'),
            ('CUST023','Glenferrie Rd Traders',       '33 334 445 556','Business'),
            ('CUST024','Boroondara Toy Library',      '44 445 556 667','Community'),
            ('CUST025','Canterbury Sports Ground Trust','55 556 667 778','Community')
        ) AS v(code, name, abn, ctype)
        WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_code = v.code AND council_id = v_council_id);
    END IF;

    -- ========================================
    -- PROJECTS  (boost to ~15)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM projects;
    IF v_count < 15 THEN
        INSERT INTO projects (council_id, project_code, project_name, project_type, org_unit_id, total_budget, total_actual, total_committed, status, start_date, completion_date, manager_name)
        SELECT v_council_id, v.code, v.name, v.ptype,
               (SELECT org_unit_id FROM organizational_units WHERE council_id = v_council_id ORDER BY random() LIMIT 1),
               v.budget, v.actual, v.committed, v.status, v.sdate::DATE, v.cdate::DATE, v.manager
        FROM (VALUES
            ('PRJ005','Road Renewal Program 2025',        'Capital', 4500000, 1200000, 2800000,'Active',     '2024-07-01','2025-06-30','David Chen'),
            ('PRJ006','Ashburton Pool Redevelopment',      'Capital',12000000, 3500000, 7200000,'Active',     '2024-01-15','2026-06-30','Sarah Mitchell'),
            ('PRJ007','LED Street Lighting Upgrade',      'Capital', 2800000, 2100000,  500000,'Active',     '2023-10-01','2025-03-31','Mark Thompson'),
            ('PRJ008','Bridge Strengthening - Yarra',     'Capital', 1800000,  450000, 1100000,'Active',     '2024-03-01','2025-09-30','Andrew White'),
            ('PRJ009','Victoria Park Masterplan',           'Capital', 6000000,  800000, 3500000,'Active',     '2024-06-01','2027-12-31','Nicole Taylor'),
            ('PRJ010','Civic Centre Solar Installation',  'Capital',  950000,  920000,       0,'Completed',  '2023-07-01','2024-06-15','James Roberts'),
            ('PRJ011','Drainage Upgrade - Gardiners Creek','Capital', 3200000,  600000, 2200000,'Active',     '2024-09-01','2025-12-31','Peter Evans'),
            ('PRJ012','Community Safety CCTV Program',    'Capital',  750000,  300000,  350000,'Active',     '2024-04-01','2025-06-30','Rachel Green'),
            ('PRJ013','Shared Path Network Extension',    'Capital', 2100000,  150000, 1600000,'Active',     '2024-11-01','2026-03-31','Luke Anderson'),
            ('PRJ014','Library Digital Transformation',   'Operating',450000,  380000,   50000,'Active',     '2024-01-01','2025-06-30','Emma Collins'),
            ('PRJ015','Glenferrie Rd Streetscape Renewal', 'Capital', 1500000,   50000, 1200000,'Planning',   '2025-01-01','2026-06-30','Daniel Harris')
        ) AS v(code, name, ptype, budget, actual, committed, status, sdate, cdate, manager)
        WHERE NOT EXISTS (SELECT 1 FROM projects WHERE project_code = v.code AND council_id = v_council_id);
    END IF;

    -- ========================================
    -- PROJECT TASKS  (boost to ~30)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM project_tasks;
    IF v_count < 30 THEN
        FOR v_project_id IN (SELECT p.project_id FROM projects p WHERE p.council_id = v_council_id) LOOP
            INSERT INTO project_tasks (project_id, task_number, task_name, budget, actual)
            SELECT v_project_id, v.tnum, v.tname, v.budget, v.actual
            FROM (VALUES
                ('T01','Design & Planning',   150000, 120000),
                ('T02','Construction',        800000, 350000)
            ) AS v(tnum, tname, budget, actual)
            WHERE NOT EXISTS (
                SELECT 1 FROM project_tasks WHERE project_id = v_project_id AND task_number = v.tnum
            );
        END LOOP;
    END IF;

    -- ========================================
    -- EMPLOYEES  (INSERT ~80, new table)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM employees;
    IF v_count < 80 THEN
        FOR i IN 1..80 LOOP
            INSERT INTO employees (council_id, employee_code, first_name, last_name, email, department, position_title, employment_type, start_date, status, manager_name, org_unit_id)
            SELECT v_council_id,
                   'EMP' || LPAD(i::TEXT, 4, '0'),
                   v_first_names[1 + (i % array_length(v_first_names,1))],
                   v_last_names[1 + ((i * 7) % array_length(v_last_names,1))],
                   LOWER(v_first_names[1 + (i % array_length(v_first_names,1))]) || '.' ||
                   LOWER(v_last_names[1 + ((i * 7) % array_length(v_last_names,1))]) || '@boroondara.vic.gov.au',
                   v_departments[1 + (i % array_length(v_departments,1))],
                   CASE (i % 10)
                       WHEN 0 THEN 'Director'
                       WHEN 1 THEN 'Manager'
                       WHEN 2 THEN 'Team Leader'
                       WHEN 3 THEN 'Senior Officer'
                       ELSE 'Officer'
                   END || ' - ' || v_departments[1 + (i % array_length(v_departments,1))],
                   CASE WHEN i % 8 = 0 THEN 'Part-Time' WHEN i % 12 = 0 THEN 'Casual' ELSE 'Full-Time' END,
                   DATE '2015-01-01' + (random() * 3650)::INT,
                   CASE WHEN i % 20 = 0 THEN 'On Leave' ELSE 'Active' END,
                   v_first_names[1 + ((i+5) % array_length(v_first_names,1))] || ' ' || v_last_names[1 + ((i+3) % array_length(v_last_names,1))],
                   (SELECT org_unit_id FROM organizational_units WHERE council_id = v_council_id ORDER BY random() LIMIT 1)
            WHERE NOT EXISTS (
                SELECT 1 FROM employees WHERE employee_code = 'EMP' || LPAD(i::TEXT, 4, '0') AND council_id = v_council_id
            );
        END LOOP;
    END IF;

    -- ========================================
    -- LEAVE BALANCES  (INSERT ~80)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM leave_balances;
    IF v_count < 80 THEN
        FOR v_employee_id IN (SELECT e.employee_id FROM employees e WHERE e.council_id = v_council_id LIMIT 80) LOOP
            INSERT INTO leave_balances (employee_id, leave_type, balance_hours, accrued_this_year, taken_this_year, as_of_date)
            VALUES
                (v_employee_id, 'Annual Leave',   76 + (random()*80)::INT, 152, (random()*120)::INT, CURRENT_DATE),
                (v_employee_id, 'Personal Leave',  40 + (random()*60)::INT, 76,  (random()*40)::INT,  CURRENT_DATE);
            -- only insert once per employee; skip if already present (no unique constraint so we just let it insert)
        END LOOP;
    END IF;

    -- ========================================
    -- POSITIONS  (INSERT ~40)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM positions;
    IF v_count < 40 THEN
        FOR i IN 1..40 LOOP
            INSERT INTO positions (council_id, position_code, title, department, classification, fte, is_vacant, org_unit_id)
            SELECT v_council_id,
                   'POS' || LPAD(i::TEXT, 3, '0'),
                   CASE (i % 8)
                       WHEN 0 THEN 'Director'
                       WHEN 1 THEN 'Manager'
                       WHEN 2 THEN 'Coordinator'
                       WHEN 3 THEN 'Senior Officer'
                       WHEN 4 THEN 'Officer'
                       WHEN 5 THEN 'Administration Officer'
                       WHEN 6 THEN 'Team Leader'
                       ELSE 'Analyst'
                   END || ' - ' || v_departments[1 + (i % array_length(v_departments,1))],
                   v_departments[1 + (i % array_length(v_departments,1))],
                   CASE (i % 4) WHEN 0 THEN 'Band 7' WHEN 1 THEN 'Band 6' WHEN 2 THEN 'Band 5' ELSE 'Band 4' END,
                   CASE WHEN i % 6 = 0 THEN 0.8 ELSE 1.0 END,
                   CASE WHEN i % 10 = 0 THEN TRUE ELSE FALSE END,
                   (SELECT org_unit_id FROM organizational_units WHERE council_id = v_council_id ORDER BY random() LIMIT 1)
            WHERE NOT EXISTS (
                SELECT 1 FROM positions WHERE position_code = 'POS' || LPAD(i::TEXT, 3, '0') AND council_id = v_council_id
            );
        END LOOP;
    END IF;

    -- ========================================
    -- ASSETS  (boost to ~150)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM assets;
    IF v_count < 150 THEN
        FOR i IN 6..150 LOOP
            INSERT INTO assets (council_id, asset_number, asset_description, asset_category, org_unit_id, location,
                                acquisition_date, acquisition_cost, depreciation_method, useful_life_years, salvage_value,
                                accumulated_depreciation, net_book_value, status)
            SELECT v_council_id,
                   'AST-' || LPAD(i::TEXT, 5, '0'),
                   CASE (i % 9)
                       WHEN 0 THEN 'Road Segment - ' || v_streets[1 + (i % array_length(v_streets,1))]
                       WHEN 1 THEN 'Footpath - ' || v_suburbs[1 + (i % array_length(v_suburbs,1))]
                       WHEN 2 THEN 'Building - ' || v_suburbs[1 + (i % array_length(v_suburbs,1))] || ' Community Centre'
                       WHEN 3 THEN 'Vehicle - Fleet Unit ' || i
                       WHEN 4 THEN 'Playground - ' || v_suburbs[1 + (i % array_length(v_suburbs,1))] || ' Reserve'
                       WHEN 5 THEN 'Drainage Pit - ' || v_streets[1 + (i % array_length(v_streets,1))]
                       WHEN 6 THEN 'Bridge - ' || v_streets[1 + (i % array_length(v_streets,1))] || ' Crossing'
                       WHEN 7 THEN 'IT Server - Rack ' || (i % 20)
                       ELSE 'Street Light Cluster - ' || v_suburbs[1 + (i % array_length(v_suburbs,1))]
                   END,
                   CASE (i % 9)
                       WHEN 0 THEN 'Roads' WHEN 1 THEN 'Footpaths' WHEN 2 THEN 'Buildings'
                       WHEN 3 THEN 'Vehicles' WHEN 4 THEN 'Parks & Playgrounds' WHEN 5 THEN 'Drainage'
                       WHEN 6 THEN 'Bridges' WHEN 7 THEN 'IT Equipment' ELSE 'Street Lighting'
                   END,
                   (SELECT org_unit_id FROM organizational_units WHERE council_id = v_council_id ORDER BY random() LIMIT 1),
                   v_suburbs[1 + (i % array_length(v_suburbs,1))],
                   DATE '2000-01-01' + (random() * 8765)::INT,
                   (50000 + random() * 2000000)::NUMERIC(14,2),
                   'Straight Line',
                   CASE (i % 9)
                       WHEN 0 THEN 50 WHEN 1 THEN 40 WHEN 2 THEN 60
                       WHEN 3 THEN 8  WHEN 4 THEN 25 WHEN 5 THEN 80
                       WHEN 6 THEN 80 WHEN 7 THEN 4  ELSE 20
                   END,
                   0,
                   (10000 + random() * 500000)::NUMERIC(14,2),
                   (40000 + random() * 1500000)::NUMERIC(14,2),
                   CASE WHEN i % 30 = 0 THEN 'Disposed' WHEN i % 20 = 0 THEN 'Under Maintenance' ELSE 'Active' END
            WHERE NOT EXISTS (
                SELECT 1 FROM assets WHERE asset_number = 'AST-' || LPAD(i::TEXT, 5, '0') AND council_id = v_council_id
            );
        END LOOP;
    END IF;

    -- ========================================
    -- ASSET CONDITIONS  (INSERT ~150)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM asset_conditions;
    IF v_count < 150 THEN
        i := 0;
        FOR v_asset_id IN (SELECT a.asset_id FROM assets a WHERE a.council_id = v_council_id ORDER BY a.asset_number LIMIT 150) LOOP
            i := i + 1;
            INSERT INTO asset_conditions (asset_id, assessment_date, condition_score, condition_label, inspector, notes, next_assessment)
            VALUES (
                v_asset_id,
                DATE '2024-01-01' + (random() * 365)::INT,
                1 + (random() * 4)::INT,
                CASE (1 + (random()*4)::INT)
                    WHEN 1 THEN 'Very Poor' WHEN 2 THEN 'Poor' WHEN 3 THEN 'Fair' WHEN 4 THEN 'Good' ELSE 'Excellent'
                END,
                v_first_names[1 + (i % array_length(v_first_names,1))] || ' ' || v_last_names[1 + (i % array_length(v_last_names,1))],
                CASE (i % 5)
                    WHEN 0 THEN 'Surface cracking observed, schedule repair'
                    WHEN 1 THEN 'Good condition, minor wear'
                    WHEN 2 THEN 'Requires painting and sealing'
                    WHEN 3 THEN 'Structural integrity sound'
                    ELSE 'End of useful life approaching'
                END,
                DATE '2025-01-01' + (random() * 365)::INT
            );
        END LOOP;
    END IF;

    -- ========================================
    -- ASSET DEPRECIATION  (boost to ~300)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM asset_depreciation;
    IF v_count < 300 THEN
        i := 0;
        FOR v_asset_id IN (SELECT a.asset_id FROM assets a WHERE a.council_id = v_council_id ORDER BY a.asset_number LIMIT 100) LOOP
            FOR v_period_id IN (SELECT p.period_id FROM accounting_periods p WHERE p.council_id = v_council_id AND p.fiscal_year = '2025' ORDER BY p.start_date LIMIT 3) LOOP
                i := i + 1;
                IF i > 300 THEN EXIT; END IF;
                INSERT INTO asset_depreciation (asset_id, council_id, period_id, depreciation_date, depreciation_amount,
                                                 accumulated_depreciation, net_book_value, natural_account_expense, natural_account_accumulated)
                SELECT v_asset_id, v_council_id, v_period_id,
                       ap.start_date + 15,
                       (500 + random() * 5000)::NUMERIC(14,2),
                       (10000 + random() * 500000)::NUMERIC(14,2),
                       (40000 + random() * 1500000)::NUMERIC(14,2),
                       CASE (i % 5)
                           WHEN 0 THEN '5610' WHEN 1 THEN '5620' WHEN 2 THEN '5630' WHEN 3 THEN '5640' ELSE '5650'
                       END,
                       '1900'
                FROM accounting_periods ap WHERE ap.period_id = v_period_id;
            END LOOP;
        END LOOP;
    END IF;

    -- ========================================
    -- AP INVOICES  (boost to ~150)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM ap_invoices;
    IF v_count < 150 THEN
        FOR i IN 20..150 LOOP
            SELECT s.supplier_id INTO v_supplier_id FROM suppliers s WHERE s.council_id = v_council_id ORDER BY random() LIMIT 1;
            SELECT o.org_unit_id INTO v_org_id FROM organizational_units o WHERE o.council_id = v_council_id ORDER BY random() LIMIT 1;

            INSERT INTO ap_invoices (council_id, supplier_id, invoice_number, invoice_date, due_date,
                                      invoice_amount, tax_amount, total_amount, paid_amount, status, description, org_unit_id)
            SELECT v_council_id, v_supplier_id,
                   'INV-' || LPAD(i::TEXT, 5, '0'),
                   DATE '2024-01-01' + (random() * 400)::INT,
                   DATE '2024-01-01' + (random() * 400)::INT + 30,
                   amt, amt * 0.10, amt * 1.10,
                   CASE WHEN i % 4 = 0 THEN 0 ELSE amt * 1.10 END,
                   CASE WHEN i % 4 = 0 THEN 'Open' WHEN i % 4 = 1 THEN 'Paid' WHEN i % 4 = 2 THEN 'Approved' ELSE 'Paid' END,
                   CASE (i % 8)
                       WHEN 0 THEN 'Road resurfacing materials'
                       WHEN 1 THEN 'IT hardware and software licences'
                       WHEN 2 THEN 'Building maintenance services'
                       WHEN 3 THEN 'Waste collection services - monthly'
                       WHEN 4 THEN 'Consulting - engineering design'
                       WHEN 5 THEN 'Fleet fuel charges'
                       WHEN 6 THEN 'Electricity charges - facilities'
                       ELSE 'Parks maintenance contract'
                   END,
                   v_org_id
            FROM (SELECT (500 + random() * 50000)::NUMERIC(14,2) AS amt) sub
            WHERE NOT EXISTS (
                SELECT 1 FROM ap_invoices WHERE invoice_number = 'INV-' || LPAD(i::TEXT, 5, '0') AND council_id = v_council_id
            );
        END LOOP;
    END IF;

    -- ========================================
    -- AP INVOICE LINES  (INSERT ~400, currently 0)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM ap_invoice_lines;
    IF v_count < 400 THEN
        i := 0;
        FOR v_ap_id IN (SELECT ap.ap_invoice_id FROM ap_invoices ap WHERE ap.council_id = v_council_id ORDER BY ap.invoice_number) LOOP
            FOR j IN 1..3 LOOP
                i := i + 1;
                IF i > 400 THEN EXIT; END IF;
                SELECT o.org_unit_id INTO v_org_id FROM organizational_units o WHERE o.council_id = v_council_id ORDER BY random() LIMIT 1;

                INSERT INTO ap_invoice_lines (ap_invoice_id, line_number, description, natural_account, org_unit_id, amount, tax_amount)
                VALUES (
                    v_ap_id, j,
                    CASE (i % 6)
                        WHEN 0 THEN 'Labour charges' WHEN 1 THEN 'Materials supply'
                        WHEN 2 THEN 'Equipment hire'  WHEN 3 THEN 'Professional fees'
                        WHEN 4 THEN 'Software licence' ELSE 'Consumables'
                    END,
                    CASE (i % 6)
                        WHEN 0 THEN '5310' WHEN 1 THEN '5320' WHEN 2 THEN '5350'
                        WHEN 3 THEN '5440' WHEN 4 THEN '5360' ELSE '5330'
                    END,
                    v_org_id,
                    (100 + random() * 15000)::NUMERIC(14,2),
                    (10 + random() * 1500)::NUMERIC(14,2)
                );
            END LOOP;
            IF i > 400 THEN EXIT; END IF;
        END LOOP;
    END IF;

    -- ========================================
    -- PAYMENTS  (boost to ~120)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM payments;
    IF v_count < 120 THEN
        FOR i IN 18..120 LOOP
            SELECT s.supplier_id INTO v_supplier_id FROM suppliers s WHERE s.council_id = v_council_id ORDER BY random() LIMIT 1;
            INSERT INTO payments (council_id, supplier_id, payment_number, payment_date, payment_method, payment_amount, status, bank_account)
            SELECT v_council_id, v_supplier_id,
                   'PAY-' || LPAD(i::TEXT, 5, '0'),
                   DATE '2024-01-01' + (random() * 400)::INT,
                   CASE (i % 3) WHEN 0 THEN 'EFT' WHEN 1 THEN 'Cheque' ELSE 'BPAY' END,
                   (200 + random() * 55000)::NUMERIC(14,2),
                   CASE WHEN i % 10 = 0 THEN 'Voided' ELSE 'Completed' END,
                   'BSB 013-442 Acc 2876543'
            WHERE NOT EXISTS (
                SELECT 1 FROM payments WHERE payment_number = 'PAY-' || LPAD(i::TEXT, 5, '0') AND council_id = v_council_id
            );
        END LOOP;
    END IF;

    -- ========================================
    -- AR INVOICES  (boost to ~80)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM ar_invoices;
    IF v_count < 80 THEN
        FOR i IN 6..80 LOOP
            SELECT c.customer_id INTO v_customer_id FROM customers c WHERE c.council_id = v_council_id ORDER BY random() LIMIT 1;
            INSERT INTO ar_invoices (council_id, customer_id, invoice_number, invoice_date, due_date,
                                      invoice_amount, tax_amount, total_amount, received_amount, status, description)
            SELECT v_council_id, v_customer_id,
                   'AR-' || LPAD(i::TEXT, 5, '0'),
                   DATE '2024-01-01' + (random() * 400)::INT,
                   DATE '2024-01-01' + (random() * 400)::INT + 30,
                   amt, amt * 0.10, amt * 1.10,
                   CASE WHEN i % 3 = 0 THEN 0 ELSE amt * 1.10 END,
                   CASE WHEN i % 3 = 0 THEN 'Open' WHEN i % 3 = 1 THEN 'Paid' ELSE 'Overdue' END,
                   CASE (i % 5)
                       WHEN 0 THEN 'Facility hire - community hall'
                       WHEN 1 THEN 'Parking permit annual fee'
                       WHEN 2 THEN 'Planning permit application'
                       WHEN 3 THEN 'Rates - supplementary'
                       ELSE 'Advertising in council newsletter'
                   END
            FROM (SELECT (100 + random() * 8000)::NUMERIC(14,2) AS amt) sub
            WHERE NOT EXISTS (
                SELECT 1 FROM ar_invoices WHERE invoice_number = 'AR-' || LPAD(i::TEXT, 5, '0') AND council_id = v_council_id
            );
        END LOOP;
    END IF;

    -- ========================================
    -- RECEIPTS  (boost to ~60)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM receipts;
    IF v_count < 60 THEN
        FOR i IN 6..60 LOOP
            SELECT c.customer_id INTO v_customer_id FROM customers c WHERE c.council_id = v_council_id ORDER BY random() LIMIT 1;
            INSERT INTO receipts (council_id, customer_id, receipt_number, receipt_date, receipt_method, receipt_amount, status)
            SELECT v_council_id, v_customer_id,
                   'RCT-' || LPAD(i::TEXT, 5, '0'),
                   DATE '2024-01-01' + (random() * 400)::INT,
                   CASE (i % 4) WHEN 0 THEN 'BPAY' WHEN 1 THEN 'Direct Deposit' WHEN 2 THEN 'Credit Card' ELSE 'Cash' END,
                   (100 + random() * 8800)::NUMERIC(14,2),
                   'Applied'
            WHERE NOT EXISTS (
                SELECT 1 FROM receipts WHERE receipt_number = 'RCT-' || LPAD(i::TEXT, 5, '0') AND council_id = v_council_id
            );
        END LOOP;
    END IF;

    -- ========================================
    -- RECEIPT APPLICATIONS  (boost to ~60)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM receipt_applications;
    IF v_count < 60 THEN
        i := 0;
        FOR v_receipt_id IN (SELECT r.receipt_id FROM receipts r WHERE r.council_id = v_council_id ORDER BY r.receipt_number) LOOP
            i := i + 1;
            IF i > 60 THEN EXIT; END IF;
            SELECT ar.ar_invoice_id INTO v_ar_id FROM ar_invoices ar WHERE ar.council_id = v_council_id ORDER BY random() LIMIT 1;
            INSERT INTO receipt_applications (receipt_id, ar_invoice_id, applied_amount, application_date)
            VALUES (v_receipt_id, v_ar_id, (100 + random() * 5000)::NUMERIC(14,2), DATE '2024-01-15' + (random() * 380)::INT);
        END LOOP;
    END IF;

    -- ========================================
    -- JOURNAL HEADERS  (boost to ~50)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM journal_headers;
    IF v_count < 50 THEN
        FOR i IN 8..50 LOOP
            SELECT p.period_id INTO v_period_id FROM accounting_periods p WHERE p.council_id = v_council_id ORDER BY random() LIMIT 1;
            INSERT INTO journal_headers (council_id, journal_number, journal_name, journal_source, period_id,
                                          accounting_date, posting_date, status, description, created_by)
            SELECT v_council_id,
                   'JNL-' || LPAD(i::TEXT, 5, '0'),
                   CASE (i % 6)
                       WHEN 0 THEN 'Monthly Depreciation' WHEN 1 THEN 'Payroll Allocation'
                       WHEN 2 THEN 'Accruals' WHEN 3 THEN 'Revenue Recognition'
                       WHEN 4 THEN 'Revaluation Entry' ELSE 'Reclassification'
                   END,
                   CASE (i % 4) WHEN 0 THEN 'Subledger' WHEN 1 THEN 'Manual' WHEN 2 THEN 'Payroll' ELSE 'Assets' END,
                   v_period_id,
                   ap.start_date + 15, ap.start_date + 16,
                   CASE WHEN i % 8 = 0 THEN 'Unposted' ELSE 'Posted' END,
                   CASE (i % 6)
                       WHEN 0 THEN 'Monthly depreciation run'
                       WHEN 1 THEN 'Fortnightly payroll distribution'
                       WHEN 2 THEN 'Month-end accrual entries'
                       WHEN 3 THEN 'Revenue recognition - rates and fees'
                       WHEN 4 THEN 'Asset revaluation per AASB 116'
                       ELSE 'Account reclassification correction'
                   END,
                   'system'
            FROM accounting_periods ap WHERE ap.period_id = v_period_id
            AND NOT EXISTS (
                SELECT 1 FROM journal_headers WHERE journal_number = 'JNL-' || LPAD(i::TEXT, 5, '0') AND council_id = v_council_id
            );
        END LOOP;
    END IF;

    -- ========================================
    -- JOURNAL LINES  (boost to ~150)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM journal_lines;
    IF v_count < 150 THEN
        i := 0;
        FOR v_journal_id IN (SELECT jh.journal_header_id FROM journal_headers jh WHERE jh.council_id = v_council_id ORDER BY jh.journal_number) LOOP
            SELECT o.org_unit_id INTO v_org_id FROM organizational_units o WHERE o.council_id = v_council_id ORDER BY random() LIMIT 1;
            FOR j IN 1..3 LOOP
                i := i + 1;
                IF i > 150 THEN EXIT; END IF;
                INSERT INTO journal_lines (journal_header_id, council_id, line_number, natural_account, org_unit_id,
                                            debit_amount, credit_amount, net_amount, currency_code, description)
                VALUES (
                    v_journal_id, v_council_id, j,
                    CASE (i % 8)
                        WHEN 0 THEN '5610' WHEN 1 THEN '5620' WHEN 2 THEN '5110' WHEN 3 THEN '4110'
                        WHEN 4 THEN '5410' WHEN 5 THEN '5310' WHEN 6 THEN '4310' ELSE '5130'
                    END,
                    v_org_id,
                    CASE WHEN j % 2 = 1 THEN (500 + random() * 25000)::NUMERIC(14,2) ELSE 0 END,
                    CASE WHEN j % 2 = 0 THEN (500 + random() * 25000)::NUMERIC(14,2) ELSE 0 END,
                    CASE WHEN j % 2 = 1 THEN (500 + random() * 25000)::NUMERIC(14,2) ELSE -(500 + random() * 25000)::NUMERIC(14,2) END,
                    'AUD',
                    CASE (i % 6)
                        WHEN 0 THEN 'Depreciation expense' WHEN 1 THEN 'Salary allocation'
                        WHEN 2 THEN 'Revenue accrual'      WHEN 3 THEN 'Contract expense'
                        WHEN 4 THEN 'Revaluation adjustment' ELSE 'Reclassification entry'
                    END
                );
            END LOOP;
            IF i > 150 THEN EXIT; END IF;
        END LOOP;
    END IF;

    -- ========================================
    -- GL BALANCES  (INSERT ~1500, currently 0!)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM gl_balances;
    IF v_count < 100 THEN
        i := 0;
        FOR v_period_id IN (SELECT p.period_id FROM accounting_periods p WHERE p.council_id = v_council_id ORDER BY p.start_date) LOOP
            FOR v_seg_code IN (SELECT c.segment_code FROM chart_of_accounts c WHERE c.council_id = v_council_id ORDER BY c.segment_code) LOOP
                i := i + 1;
                IF i > 1500 THEN EXIT; END IF;
                SELECT o.org_unit_id INTO v_org_id FROM organizational_units o WHERE o.council_id = v_council_id ORDER BY random() LIMIT 1;

                INSERT INTO gl_balances (council_id, period_id, natural_account, org_unit_id, beginning_balance, period_activity, ending_balance, ytd_activity)
                VALUES (
                    v_council_id,
                    v_period_id,
                    v_seg_code,
                    v_org_id,
                    CASE WHEN v_seg_code LIKE '4%' THEN -(100000 + random() * 900000)::NUMERIC(14,2) ELSE (50000 + random() * 500000)::NUMERIC(14,2) END,
                    CASE WHEN v_seg_code LIKE '4%' THEN -(10000 + random() * 90000)::NUMERIC(14,2) ELSE (5000 + random() * 50000)::NUMERIC(14,2) END,
                    CASE WHEN v_seg_code LIKE '4%' THEN -(110000 + random() * 990000)::NUMERIC(14,2) ELSE (55000 + random() * 550000)::NUMERIC(14,2) END,
                    CASE WHEN v_seg_code LIKE '4%' THEN -(50000 + random() * 500000)::NUMERIC(14,2) ELSE (25000 + random() * 250000)::NUMERIC(14,2) END
                );
            END LOOP;
            IF i > 1500 THEN EXIT; END IF;
        END LOOP;
    END IF;

    -- ========================================
    -- BUDGET LINES  (boost to ~300)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM budget_lines;
    IF v_count < 300 THEN
        i := 0;
        FOR v_period_id IN (SELECT p.period_id FROM accounting_periods p WHERE p.council_id = v_council_id AND p.fiscal_year = '2025' ORDER BY p.start_date) LOOP
            FOR v_seg_code IN (SELECT c.segment_code FROM chart_of_accounts c WHERE c.council_id = v_council_id ORDER BY c.segment_code) LOOP
                i := i + 1;
                IF i > 300 THEN EXIT; END IF;
                SELECT o.org_unit_id INTO v_org_id FROM organizational_units o WHERE o.council_id = v_council_id ORDER BY random() LIMIT 1;

                INSERT INTO budget_lines (council_id, fiscal_year, period_id, natural_account, org_unit_id, budget_amount, budget_type)
                VALUES (
                    v_council_id, '2025', v_period_id, v_seg_code, v_org_id,
                    CASE WHEN v_seg_code LIKE '4%' THEN -(10000 + random() * 100000)::NUMERIC(14,2) ELSE (8000 + random() * 60000)::NUMERIC(14,2) END,
                    CASE WHEN v_seg_code LIKE '8%' THEN 'Capital' ELSE 'Operating' END
                );
            END LOOP;
            IF i > 300 THEN EXIT; END IF;
        END LOOP;
    END IF;

    -- ========================================
    -- PROJECT EXPENDITURES  (boost to ~60)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM project_expenditures;
    IF v_count < 60 THEN
        i := 0;
        FOR v_project_id IN (SELECT p.project_id FROM projects p WHERE p.council_id = v_council_id) LOOP
            SELECT t.task_id INTO v_task_id FROM project_tasks t WHERE t.project_id = v_project_id LIMIT 1;
            FOR j IN 1..5 LOOP
                i := i + 1;
                IF i > 60 THEN EXIT; END IF;
                SELECT o.org_unit_id INTO v_org_id FROM organizational_units o WHERE o.council_id = v_council_id ORDER BY random() LIMIT 1;
                INSERT INTO project_expenditures (project_id, task_id, council_id, expenditure_date, expenditure_type, amount,
                                                   description, vendor_name, natural_account, org_unit_id)
                VALUES (
                    v_project_id, v_task_id, v_council_id,
                    DATE '2024-01-01' + (random() * 400)::INT,
                    CASE (i % 4) WHEN 0 THEN 'Labour' WHEN 1 THEN 'Materials' WHEN 2 THEN 'Equipment' ELSE 'Professional Services' END,
                    (1000 + random() * 80000)::NUMERIC(14,2),
                    CASE (i % 4)
                        WHEN 0 THEN 'Construction labour charges'
                        WHEN 1 THEN 'Raw materials delivery'
                        WHEN 2 THEN 'Excavator hire'
                        ELSE 'Engineering consultancy'
                    END,
                    CASE (i % 5)
                        WHEN 0 THEN 'Fulton Hogan Pty Ltd' WHEN 1 THEN 'Downer Group'
                        WHEN 2 THEN 'John Holland Group' WHEN 3 THEN 'GHD Pty Ltd' ELSE 'Jacobs Engineering'
                    END,
                    CASE (i % 3) WHEN 0 THEN '8110' WHEN 1 THEN '8120' ELSE '8130' END,
                    v_org_id
                );
            END LOOP;
            IF i > 60 THEN EXIT; END IF;
        END LOOP;
    END IF;

    -- ========================================
    -- PAYROLL COST DISTRIBUTIONS  (boost to ~100)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM payroll_cost_distributions;
    IF v_count < 100 THEN
        i := 0;
        FOR v_id IN (SELECT pr.payroll_run_id FROM payroll_runs pr WHERE pr.council_id = v_council_id ORDER BY pr.run_code) LOOP
            FOR j IN 1..8 LOOP
                i := i + 1;
                IF i > 100 THEN EXIT; END IF;
                SELECT o.org_unit_id INTO v_org_id FROM organizational_units o WHERE o.council_id = v_council_id ORDER BY random() LIMIT 1;
                SELECT e.employee_id INTO v_employee_id FROM employees e
                  WHERE e.employee_code = 'EMP' || LPAD(((i % 80) + 1)::TEXT, 4, '0') AND e.council_id = v_council_id LIMIT 1;
                INSERT INTO payroll_cost_distributions (payroll_run_id, council_id, employee_id, employee_name, natural_account,
                                                         org_unit_id, amount, distribution_percentage)
                VALUES (
                    v_id, v_council_id,
                    v_employee_id,
                    v_first_names[1 + (i % array_length(v_first_names,1))] || ' ' || v_last_names[1 + ((i*3) % array_length(v_last_names,1))],
                    CASE (i % 3) WHEN 0 THEN '5110' WHEN 1 THEN '5120' ELSE '5130' END,
                    v_org_id,
                    (2000 + random() * 6000)::NUMERIC(14,2),
                    CASE (i % 3) WHEN 0 THEN 80.00 WHEN 1 THEN 10.00 ELSE 10.00 END
                );
            END LOOP;
            IF i > 100 THEN EXIT; END IF;
        END LOOP;
    END IF;

    -- ========================================
    -- SERVICE REQUESTS  (INSERT ~200)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM service_requests;
    IF v_count < 200 THEN
        FOR i IN 1..200 LOOP
            INSERT INTO service_requests (council_id, request_number, category, subcategory, description, status, priority,
                                           reported_date, resolved_date, customer_name, suburb, assigned_to)
            SELECT v_council_id,
                   'SR-' || LPAD(i::TEXT, 5, '0'),
                   CASE (i % 8)
                       WHEN 0 THEN 'Roads & Footpaths' WHEN 1 THEN 'Waste & Recycling'
                       WHEN 2 THEN 'Parks & Gardens'    WHEN 3 THEN 'Drainage & Flooding'
                       WHEN 4 THEN 'Animals'            WHEN 5 THEN 'Building & Planning'
                       WHEN 6 THEN 'Noise Complaints'   ELSE 'Graffiti & Vandalism'
                   END,
                   CASE (i % 8)
                       WHEN 0 THEN 'Pothole' WHEN 1 THEN 'Missed Bin'
                       WHEN 2 THEN 'Tree Pruning' WHEN 3 THEN 'Blocked Drain'
                       WHEN 4 THEN 'Barking Dog' WHEN 5 THEN 'Permit Enquiry'
                       WHEN 6 THEN 'Construction Noise' ELSE 'Graffiti Removal'
                   END,
                   CASE (i % 8)
                       WHEN 0 THEN 'Pothole approximately 30cm wide on ' || v_streets[1 + (i % array_length(v_streets,1))] || ', causing traffic hazard'
                       WHEN 1 THEN 'Recycling bin was not collected on scheduled day in ' || v_suburbs[1 + (i % array_length(v_suburbs,1))]
                       WHEN 2 THEN 'Large overhanging branch needs removal near ' || v_streets[1 + (i % array_length(v_streets,1))]
                       WHEN 3 THEN 'Stormwater drain blocked with debris causing local flooding on ' || v_streets[1 + (i % array_length(v_streets,1))]
                       WHEN 4 THEN 'Dog barking excessively between 10pm-6am at property in ' || v_suburbs[1 + (i % array_length(v_suburbs,1))]
                       WHEN 5 THEN 'Enquiry about building permit requirements for extension in ' || v_suburbs[1 + (i % array_length(v_suburbs,1))]
                       WHEN 6 THEN 'Construction site operating outside permitted hours on ' || v_streets[1 + (i % array_length(v_streets,1))]
                       ELSE 'Graffiti on public infrastructure near ' || v_streets[1 + (i % array_length(v_streets,1))]
                   END,
                   CASE (i % 5)
                       WHEN 0 THEN 'Open' WHEN 1 THEN 'In Progress' WHEN 2 THEN 'Resolved'
                       WHEN 3 THEN 'Closed' ELSE 'Pending'
                   END,
                   CASE (i % 4) WHEN 0 THEN 'High' WHEN 1 THEN 'Medium' WHEN 2 THEN 'Low' ELSE 'Medium' END,
                   DATE '2024-01-01' + (random() * 400)::INT,
                   CASE WHEN i % 3 != 0 THEN DATE '2024-01-01' + (random() * 400)::INT + 7 ELSE NULL END,
                   v_first_names[1 + (i % array_length(v_first_names,1))] || ' ' || v_last_names[1 + ((i*3) % array_length(v_last_names,1))],
                   v_suburbs[1 + (i % array_length(v_suburbs,1))],
                   v_first_names[1 + ((i+10) % array_length(v_first_names,1))] || ' ' || v_last_names[1 + ((i+7) % array_length(v_last_names,1))]
            WHERE NOT EXISTS (
                SELECT 1 FROM service_requests WHERE request_number = 'SR-' || LPAD(i::TEXT, 5, '0') AND council_id = v_council_id
            );
        END LOOP;
    END IF;

    -- ========================================
    -- CUSTOMER FEEDBACK  (INSERT ~80)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM customer_feedback;
    IF v_count < 80 THEN
        i := 0;
        FOR v_request_id IN (SELECT sr.request_id FROM service_requests sr WHERE sr.council_id = v_council_id AND sr.status IN ('Resolved','Closed') ORDER BY sr.request_number LIMIT 80) LOOP
            i := i + 1;
            INSERT INTO customer_feedback (council_id, request_id, rating, comment, submitted_date, channel)
            VALUES (
                v_council_id, v_request_id,
                1 + (random() * 4)::INT,
                CASE (i % 5)
                    WHEN 0 THEN 'Excellent response time, very satisfied with the outcome'
                    WHEN 1 THEN 'Issue resolved but took longer than expected'
                    WHEN 2 THEN 'Staff were helpful and professional'
                    WHEN 3 THEN 'Could have been communicated better, but result was fine'
                    ELSE 'Very disappointed with the slow response'
                END,
                DATE '2024-02-01' + (random() * 380)::INT,
                CASE (i % 4) WHEN 0 THEN 'Online' WHEN 1 THEN 'Phone' WHEN 2 THEN 'Email' ELSE 'In Person' END
            );
        END LOOP;
    END IF;

    -- ========================================
    -- COUNCIL MEETINGS  (INSERT ~20)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM council_meetings;
    IF v_count < 20 THEN
        FOR i IN 1..20 LOOP
            INSERT INTO council_meetings (council_id, meeting_type, meeting_date, start_time, end_time, location, status, minutes_url)
            VALUES (
                v_council_id,
                CASE (i % 3) WHEN 0 THEN 'Ordinary' WHEN 1 THEN 'Special' ELSE 'Ordinary' END,
                DATE '2024-01-23' + ((i - 1) * 21),
                '19:00'::TIME,
                CASE WHEN i % 3 = 1 THEN '20:30'::TIME ELSE '21:30'::TIME END,
                'Camberwell Civic Centre, Council Chamber',
                CASE WHEN i <= 16 THEN 'Completed' ELSE 'Scheduled' END,
                CASE WHEN i <= 16 THEN 'https://www.boroondara.vic.gov.au/minutes/' || i ELSE NULL END
            );
        END LOOP;
    END IF;

    -- ========================================
    -- MEETING RESOLUTIONS  (INSERT ~80)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM meeting_resolutions;
    IF v_count < 80 THEN
        i := 0;
        FOR v_meeting_id IN (SELECT cm.meeting_id FROM council_meetings cm WHERE cm.council_id = v_council_id AND cm.status = 'Completed' ORDER BY cm.meeting_date) LOOP
            FOR j IN 1..5 LOOP
                i := i + 1;
                IF i > 80 THEN EXIT; END IF;
                INSERT INTO meeting_resolutions (meeting_id, resolution_number, title, description, mover, seconder, status, vote_for, vote_against, vote_abstain)
                VALUES (
                    v_meeting_id,
                    'RES-2024-' || LPAD(i::TEXT, 3, '0'),
                    CASE (i % 10)
                        WHEN 0 THEN 'Adoption of Annual Budget 2024-25'
                        WHEN 1 THEN 'Approval of Road Renewal Capital Works Program'
                        WHEN 2 THEN 'Amendment to Local Law No. 2 - Community Amenity'
                        WHEN 3 THEN 'Endorsement of Waste Management Strategy'
                        WHEN 4 THEN 'Approval of Planning Permit Application PA-2024-' || i
                        WHEN 5 THEN 'Adoption of Recreation Strategy 2024-2034'
                        WHEN 6 THEN 'Award of Contract CT-2024-' || i || ' for Parks Maintenance'
                        WHEN 7 THEN 'Adoption of Climate Emergency Action Plan Update'
                        WHEN 8 THEN 'Approval of Community Grant Allocations Round ' || (i % 3 + 1)
                        ELSE 'Endorsement of Asset Management Policy Review'
                    END,
                    CASE (i % 10)
                        WHEN 0 THEN 'Resolution to adopt the 2024-25 Annual Budget with total expenditure of $165.2M'
                        WHEN 1 THEN 'Approval of $4.5M road renewal program across 12 road segments'
                        WHEN 2 THEN 'Amendment to strengthen provisions relating to construction hours and noise'
                        WHEN 3 THEN 'Endorsement of 10-year strategy including green waste and recycling targets'
                        WHEN 4 THEN 'Approval of planning permit for mixed-use development with conditions'
                        WHEN 5 THEN 'Adoption of strategy to guide investment in recreation facilities'
                        WHEN 6 THEN 'Award of 3-year parks maintenance contract valued at $2.1M per annum'
                        WHEN 7 THEN 'Updated action plan with new emissions reduction targets for 2030'
                        WHEN 8 THEN 'Allocation of $350K to 42 community organisations'
                        ELSE 'Endorsement of revised asset management policy aligned with AASB requirements'
                    END,
                    CASE (i % 5) WHEN 0 THEN 'Cr. Jennifer Ward' WHEN 1 THEN 'Cr. Stephen Chang' WHEN 2 THEN 'Cr. Maria Rossi' WHEN 3 THEN 'Cr. Tom Nguyen' ELSE 'Cr. Helen Clarke' END,
                    CASE (i % 5) WHEN 0 THEN 'Cr. Tom Nguyen' WHEN 1 THEN 'Cr. Helen Clarke' WHEN 2 THEN 'Cr. Jennifer Ward' WHEN 3 THEN 'Cr. Maria Rossi' ELSE 'Cr. Stephen Chang' END,
                    CASE WHEN i % 12 = 0 THEN 'Lost' ELSE 'Carried' END,
                    CASE WHEN i % 12 = 0 THEN 3 ELSE 5 + (random() * 4)::INT END,
                    CASE WHEN i % 12 = 0 THEN 5 ELSE (random() * 2)::INT END,
                    CASE WHEN random() < 0.3 THEN 1 ELSE 0 END
                );
            END LOOP;
            IF i > 80 THEN EXIT; END IF;
        END LOOP;
    END IF;

    -- ========================================
    -- COMPLIANCE REGISTERS  (INSERT ~30)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM compliance_registers;
    IF v_count < 30 THEN
        INSERT INTO compliance_registers (council_id, obligation_name, legislation, responsible_officer, compliance_status, due_date, last_review_date, next_review_date, notes)
        SELECT v_council_id, v.oname, v.legis, v.officer, v.status, v.due::DATE, v.last_rev::DATE, v.next_rev::DATE, v.notes
        FROM (VALUES
            ('Annual Financial Statements',           'Local Government Act 2020 s100',       'Chief Financial Officer',   'Compliant',     '2024-09-30','2024-09-28','2025-09-30','Audited by VAGO, unqualified opinion'),
            ('Council Plan Review',                   'Local Government Act 2020 s90',        'Director Strategy',         'Compliant',     '2024-06-30','2024-06-25','2025-06-30','4 year plan adopted 2021'),
            ('Rates Declaration',                     'Local Government Act 2020 s94',        'Revenue Manager',           'Compliant',     '2024-06-30','2024-06-30','2025-06-30','Rates declared at June meeting'),
            ('OHS Management System',                 'Occupational Health and Safety Act 2004','OH&S Manager',            'Compliant',     '2024-12-31','2024-11-15','2025-12-31','Annual system audit completed'),
            ('Privacy Policy Review',                 'Privacy and Data Protection Act 2014', 'Governance Manager',        'Compliant',     '2024-12-31','2024-10-20','2025-12-31','Policy updated October 2024'),
            ('Child Safety Standards',                'Child Wellbeing and Safety Act 2005',  'Community Services Director','Compliant',     '2025-03-31','2024-09-15','2025-09-15','Training delivered to all staff'),
            ('Emergency Management Plan',             'Emergency Management Act 2013',        'Emergency Coordinator',     'Compliant',     '2024-12-31','2024-08-30','2025-08-30','Plan reviewed with CFA and SES'),
            ('Disability Action Plan',                'Disability Act 2006',                  'Inclusion Officer',         'Compliant',     '2025-06-30','2024-07-15','2025-07-15','3 year plan in Year 2'),
            ('Domestic Animal Management Plan',       'Domestic Animals Act 1994',            'Local Laws Manager',        'Under Review',  '2025-06-30','2024-04-10','2025-04-10','Plan being revised for new registration requirements'),
            ('Food Safety Inspections',               'Food Act 1984',                        'Environmental Health Lead', 'Compliant',     '2025-06-30','2024-12-01','2025-06-01','All registered premises inspected'),
            ('Public Health Plan',                    'Public Health and Wellbeing Act 2008', 'Public Health Officer',     'Compliant',     '2025-09-30','2024-09-01','2025-09-01','Biennial review due'),
            ('Road Management Plan',                  'Road Management Act 2004',             'Director Engineering',      'Compliant',     '2024-12-31','2024-06-15','2025-06-15','Inspection schedule current'),
            ('Procurement Policy',                    'Local Government Act 2020 s108',       'Procurement Manager',       'Compliant',     '2025-06-30','2024-11-20','2025-11-20','Policy revised November 2024'),
            ('Gender Equality Action Plan',           'Gender Equality Act 2020',             'HR Director',               'Compliant',     '2025-03-31','2024-03-01','2025-03-01','Reporting submitted to Commission'),
            ('Heritage Register Maintenance',         'Heritage Act 2017',                    'Heritage Advisor',          'Compliant',     '2025-12-31','2024-07-01','2025-07-01','Register up to date'),
            ('Councillor Code of Conduct',            'Local Government Act 2020 s139',       'Governance Manager',        'Compliant',     '2025-06-30','2024-02-28','2025-02-28','Adopted by resolution'),
            ('Asset Management Plans',                'Local Government Act 2020 s92',        'Asset Manager',             'Compliant',     '2025-06-30','2024-06-30','2025-06-30','Covers all asset classes'),
            ('Waste Management Policy',               'Environment Protection Act 2017',      'Waste Services Manager',    'Compliant',     '2025-06-30','2024-09-01','2025-09-01','Aligned with circular economy targets'),
            ('Financial Reporting - Quarterly',        'Local Government Act 2020 s97',       'Finance Manager',           'Compliant',     '2025-03-31','2025-01-15','2025-04-15','Q2 FY25 report submitted'),
            ('Planning Scheme Amendment',             'Planning and Environment Act 1987',    'Strategic Planner',         'In Progress',   '2025-12-31','2024-06-01','2025-06-01','Amendment C145 in progress'),
            ('Stormwater Management Plan',            'Water Act 1989',                       'Drainage Engineer',         'Compliant',     '2025-06-30','2024-05-15','2025-05-15','WSUD targets being met'),
            ('Community Engagement Policy',           'Local Government Act 2020 s56',        'Community Engagement Lead', 'Compliant',     '2025-06-30','2024-08-20','2025-08-20','Deliberative engagement completed for budget'),
            ('IT Security Policy',                    'Protective Data Security Standards',   'IT Manager',                'Under Review',  '2025-03-31','2024-10-01','2025-04-01','Penetration testing scheduled Q3'),
            ('Tree Management Policy',                'Planning and Environment Act 1987',    'Arborist Manager',          'Compliant',     '2025-12-31','2024-11-01','2025-11-01','SLO review completed'),
            ('Staff Enterprise Agreement',            'Fair Work Act 2009',                   'HR Director',               'Compliant',     '2026-06-30','2024-01-15','2025-01-15','Current EBA valid to June 2026'),
            ('Fuel Storage Compliance',               'Dangerous Goods (Storage & Handling) Regs','Depot Manager',         'Compliant',     '2025-06-30','2024-08-01','2025-08-01','Annual inspection passed'),
            ('Graffiti Management Plan',              'Graffiti Prevention Act 2007',         'Local Laws Manager',        'Compliant',     '2025-12-31','2024-07-01','2025-07-01','Removal targets being met'),
            ('Building Permit Records',               'Building Act 1993',                    'Building Surveyor',         'Compliant',     '2025-06-30','2024-12-31','2025-06-30','Records digitisation in progress'),
            ('Swimming Pool Barrier Inspections',     'Building Regulations 2018',            'Building Surveyor',         'In Progress',   '2025-12-31','2024-09-01','2025-09-01','Program 60% complete'),
            ('Integrated Water Management Plan',      'Water Act 1989',                       'Environment Manager',       'Compliant',     '2025-12-31','2024-06-01','2025-06-01','IWM forum participation active')
        ) AS v(oname, legis, officer, status, due, last_rev, next_rev, notes)
        WHERE NOT EXISTS (SELECT 1 FROM compliance_registers WHERE council_id = v_council_id LIMIT 1);
    END IF;

    -- ========================================
    -- WORK ORDERS  (INSERT ~150)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM work_orders;
    IF v_count < 150 THEN
        FOR i IN 1..150 LOOP
            SELECT a.asset_id INTO v_asset_id FROM assets a WHERE a.council_id = v_council_id ORDER BY random() LIMIT 1;
            INSERT INTO work_orders (council_id, work_order_number, asset_id, description, work_type, priority, status,
                                      requested_date, scheduled_date, completed_date, assigned_to, estimated_cost, actual_cost)
            SELECT v_council_id,
                   'WO-' || LPAD(i::TEXT, 5, '0'),
                   v_asset_id,
                   CASE (i % 10)
                       WHEN 0 THEN 'Pothole repair - ' || v_streets[1 + (i % array_length(v_streets,1))]
                       WHEN 1 THEN 'Tree removal - storm damaged'
                       WHEN 2 THEN 'Building HVAC maintenance'
                       WHEN 3 THEN 'Playground equipment repair'
                       WHEN 4 THEN 'Drainage pit clearance'
                       WHEN 5 THEN 'Road line marking renewal'
                       WHEN 6 THEN 'Footpath grinding - trip hazard'
                       WHEN 7 THEN 'Street light globe replacement'
                       WHEN 8 THEN 'Park bench replacement'
                       ELSE 'Bridge barrier inspection and repair'
                   END,
                   CASE (i % 5) WHEN 0 THEN 'Reactive' WHEN 1 THEN 'Preventive' WHEN 2 THEN 'Corrective' WHEN 3 THEN 'Condition Based' ELSE 'Scheduled' END,
                   CASE (i % 4) WHEN 0 THEN 'High' WHEN 1 THEN 'Medium' WHEN 2 THEN 'Low' ELSE 'Urgent' END,
                   CASE (i % 6)
                       WHEN 0 THEN 'Open' WHEN 1 THEN 'Assigned' WHEN 2 THEN 'In Progress'
                       WHEN 3 THEN 'Completed' WHEN 4 THEN 'Completed' ELSE 'On Hold'
                   END,
                   DATE '2024-01-01' + (random() * 400)::INT,
                   DATE '2024-01-01' + (random() * 400)::INT + 7,
                   CASE WHEN i % 3 != 0 THEN DATE '2024-01-01' + (random() * 400)::INT + 14 ELSE NULL END,
                   v_first_names[1 + (i % array_length(v_first_names,1))] || ' ' || v_last_names[1 + ((i*5) % array_length(v_last_names,1))],
                   (500 + random() * 25000)::NUMERIC(14,2),
                   CASE WHEN i % 3 != 0 THEN (400 + random() * 28000)::NUMERIC(14,2) ELSE NULL END
            WHERE NOT EXISTS (
                SELECT 1 FROM work_orders WHERE work_order_number = 'WO-' || LPAD(i::TEXT, 5, '0') AND council_id = v_council_id
            );
        END LOOP;
    END IF;

    -- ========================================
    -- WASTE COLLECTION ROUTES  (INSERT ~20)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM waste_collection_routes;
    IF v_count < 20 THEN
        INSERT INTO waste_collection_routes (council_id, route_code, route_name, waste_type, collection_day, frequency, suburb_coverage, households, contractor)
        SELECT v_council_id, v.code, v.name, v.wtype, v.day, v.freq, v.suburbs, v.hh, v.contractor
        FROM (VALUES
            ('WR-001','Hawthorn General Mon',        'General Waste','Monday',   'Weekly',    'Hawthorn, Hawthorn East',     2800,'Cleanaway Waste Management'),
            ('WR-002','Hawthorn Recycling Mon',       'Recycling',    'Monday',   'Fortnightly','Hawthorn, Hawthorn East',  2800,'Cleanaway Waste Management'),
            ('WR-003','Hawthorn Green Mon',           'Green Waste',  'Monday',   'Fortnightly','Hawthorn, Hawthorn East',  2800,'Cleanaway Waste Management'),
            ('WR-004','Camberwell General Tue',       'General Waste','Tuesday',  'Weekly',    'Camberwell, Canterbury',      3200,'Cleanaway Waste Management'),
            ('WR-005','Camberwell Recycling Tue',     'Recycling',    'Tuesday',  'Fortnightly','Camberwell, Canterbury',    3200,'Cleanaway Waste Management'),
            ('WR-006','Camberwell Green Tue',         'Green Waste',  'Tuesday',  'Fortnightly','Camberwell, Canterbury',    3200,'Cleanaway Waste Management'),
            ('WR-007','Kew General Wed',              'General Waste','Wednesday','Weekly',    'Kew, Deepdene',              1800,'Cleanaway Waste Management'),
            ('WR-008','Kew Recycling Wed',            'Recycling',    'Wednesday','Fortnightly','Kew, Deepdene',             1800,'Cleanaway Waste Management'),
            ('WR-009','Kew Green Wed',                'Green Waste',  'Wednesday','Fortnightly','Kew, Deepdene',             1800,'Cleanaway Waste Management'),
            ('WR-010','Balwyn General Thu',           'General Waste','Thursday', 'Weekly',    'Balwyn, Balwyn North',       2100,'Cleanaway Waste Management'),
            ('WR-011','Balwyn Recycling Thu',         'Recycling',    'Thursday', 'Fortnightly','Balwyn, Balwyn North',      2100,'Cleanaway Waste Management'),
            ('WR-012','Balwyn Green Thu',             'Green Waste',  'Thursday', 'Fortnightly','Balwyn, Balwyn North',      2100,'Cleanaway Waste Management'),
            ('WR-013','Glen Iris General Fri',        'General Waste','Friday',   'Weekly',    'Glen Iris, Ashburton',        2600,'Cleanaway Waste Management'),
            ('WR-014','Glen Iris Recycling Fri',      'Recycling',    'Friday',   'Fortnightly','Glen Iris, Ashburton',      2600,'Cleanaway Waste Management'),
            ('WR-015','Glen Iris Green Fri',          'Green Waste',  'Friday',   'Fortnightly','Glen Iris, Ashburton',      2600,'Cleanaway Waste Management'),
            ('WR-016','Surrey Hills General Mon',     'General Waste','Monday',   'Weekly',    'Surrey Hills, Mont Albert',   1200,'Cleanaway Waste Management'),
            ('WR-017','Surrey Hills Recycling Mon',   'Recycling',    'Monday',   'Fortnightly','Surrey Hills, Mont Albert', 1200,'Cleanaway Waste Management'),
            ('WR-018','Surrey Hills Green Mon',       'Green Waste',  'Monday',   'Fortnightly','Surrey Hills, Mont Albert', 1200,'Cleanaway Waste Management'),
            ('WR-019','Hard Waste - North Zone',      'Hard Waste',   'Booked',   'On Request','All northern suburbs',       8500,'Cleanaway Waste Management'),
            ('WR-020','Hard Waste - South Zone',      'Hard Waste',   'Booked',   'On Request','All southern suburbs',       9000,'Cleanaway Waste Management')
        ) AS v(code, name, wtype, day, freq, suburbs, hh, contractor)
        WHERE NOT EXISTS (SELECT 1 FROM waste_collection_routes WHERE council_id = v_council_id LIMIT 1);
    END IF;

    -- ========================================
    -- FACILITY BOOKINGS  (INSERT ~100)
    -- ========================================
    SELECT COUNT(*) INTO v_count FROM facility_bookings;
    IF v_count < 100 THEN
        FOR i IN 1..100 LOOP
            INSERT INTO facility_bookings (council_id, facility_name, booked_by, booking_date, start_time, end_time, purpose, attendees, status, fee_amount)
            SELECT v_council_id,
                   CASE (i % 8)
                       WHEN 0 THEN 'Camberwell Civic Centre - Main Hall'
                       WHEN 1 THEN 'Hawthorn Arts Centre - Room A'
                       WHEN 2 THEN 'Kew Civic Centre Pavilion'
                       WHEN 3 THEN 'Canterbury Community Centre'
                       WHEN 4 THEN 'Glen Iris Community Centre'
                       WHEN 5 THEN 'Balwyn Library Meeting Room'
                       WHEN 6 THEN 'Surrey Hills Neighbourhood Centre'
                       ELSE 'Ashburton Community Hub'
                   END,
                   v_first_names[1 + (i % array_length(v_first_names,1))] || ' ' || v_last_names[1 + ((i*3) % array_length(v_last_names,1))],
                   DATE '2024-06-01' + (random() * 300)::INT,
                   (ARRAY['08:00','09:00','10:00','12:00','14:00','17:00','18:00','19:00'])[1 + (i % 8)]::TIME,
                   (ARRAY['10:00','11:00','12:00','15:00','17:00','20:00','21:00','22:00'])[1 + (i % 8)]::TIME,
                   CASE (i % 7)
                       WHEN 0 THEN 'Birthday party'
                       WHEN 1 THEN 'Community group meeting'
                       WHEN 2 THEN 'Sports club AGM'
                       WHEN 3 THEN 'Art exhibition'
                       WHEN 4 THEN 'Council workshop'
                       WHEN 5 THEN 'Dance class'
                       ELSE 'Corporate team building'
                   END,
                   10 + (random() * 190)::INT,
                   CASE (i % 5) WHEN 0 THEN 'Confirmed' WHEN 1 THEN 'Confirmed' WHEN 2 THEN 'Pending' WHEN 3 THEN 'Cancelled' ELSE 'Confirmed' END,
                   CASE WHEN i % 4 = 0 THEN 0 ELSE (50 + random() * 450)::NUMERIC(10,2) END
            WHERE NOT EXISTS (
                SELECT 1 FROM facility_bookings fb WHERE fb.council_id = v_council_id AND fb.facility_name = (
                    CASE (i % 8)
                       WHEN 0 THEN 'Camberwell Civic Centre - Main Hall'
                       WHEN 1 THEN 'Hawthorn Arts Centre - Room A'
                       WHEN 2 THEN 'Kew Civic Centre Pavilion'
                       WHEN 3 THEN 'Canterbury Community Centre'
                       WHEN 4 THEN 'Glen Iris Community Centre'
                       WHEN 5 THEN 'Balwyn Library Meeting Room'
                       WHEN 6 THEN 'Surrey Hills Neighbourhood Centre'
                       ELSE 'Ashburton Community Hub'
                   END
                ) AND fb.booking_date = DATE '2024-06-01' + (i * 3)
                LIMIT 1
            );
        END LOOP;
    END IF;

    RAISE NOTICE 'Seed data load complete for council %', v_council_id;

END $$;
