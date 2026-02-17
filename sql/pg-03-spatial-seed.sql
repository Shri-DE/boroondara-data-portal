-- ============================================================
-- pg-03-spatial-seed.sql
-- Enterprise Data Portal — Spatial seed data for PostGIS
-- ============================================================

-- ── Layer definitions ──
INSERT INTO spatial_layers (code, name, description, layer_type, category, icon, color)
SELECT v.code, v.name, v.description, v.layer_type, v.category, v.icon, v.color
FROM (VALUES
  ('facilities',     'Council Facilities',    'Council buildings, libraries, aquatic centres, community centres and depots across Manningham.',          'point',   'Community',       'CityNext',        '#0078D4'),
  ('parks',          'Parks & Reserves',      'Public parks, nature reserves, linear trails and open space areas maintained by council.',                'point',   'Environment',     'Leaf',            '#34D399'),
  ('infrastructure', 'Infrastructure Assets', 'Bridges, drainage pits, stormwater assets and road infrastructure with condition assessments.',           'point',   'Infrastructure',  'Manufacturing',   '#FBBF24'),
  ('wards',          'Ward Boundaries',       'Three electoral wards of Manningham City Council with councillor and population details.',                'polygon', 'Governance',      'Globe',           '#7C7CFF'),
  ('trees',          'Street Trees',          'Council-managed street trees with species, dimensions, health status and planting dates.',                'point',   'Environment',     'Flower',          '#22C55E'),
  ('zones',          'Planning Zones',        'Victorian planning scheme zones including residential, activity centre, green wedge and public use.',     'polygon', 'Planning',        'Org',             '#38BDF8')
) AS v(code, name, description, layer_type, category, icon, color)
WHERE NOT EXISTS (SELECT 1 FROM spatial_layers LIMIT 1);

-- ── Layer 1: Council Facilities (~29 points) ──
INSERT INTO spatial_features (layer_id, name, description, properties, geom)
SELECT
  (SELECT layer_id FROM spatial_layers WHERE code = 'facilities'),
  v.name, v.description, v.props::jsonb,
  ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)
FROM (VALUES
  ('Manningham Civic Centre',       'Council headquarters and customer service centre',       '{"facility_type":"Civic","address":"699 Doncaster Rd, Doncaster","suburb":"Doncaster","phone":"03 9840 9333"}',            145.1230, -37.7830),
  ('MC Square Library',             'Main library and community hub in Doncaster',            '{"facility_type":"Library","address":"687 Doncaster Rd, Doncaster","suburb":"Doncaster","phone":"03 9877 0274"}',           145.1228, -37.7832),
  ('Aquarena Aquatic Centre',       'Indoor and outdoor swimming pools and fitness centre',   '{"facility_type":"Aquatic Centre","address":"25 Williamsons Rd, Doncaster","suburb":"Doncaster","phone":"03 9842 0366"}',   145.1280, -37.7780),
  ('Doncaster Hill Precinct',       'Major activity centre and residential precinct',         '{"facility_type":"Activity Centre","address":"150 Civic Dr, Doncaster","suburb":"Doncaster"}',                              145.1264, -37.7847),
  ('Templestowe Village',           'Local shopping village and community precinct',           '{"facility_type":"Village Centre","address":"30 Anderson St, Templestowe","suburb":"Templestowe"}',                         145.1170, -37.7560),
  ('Bulleen Park',                  'Multi-purpose sporting facility and open space',          '{"facility_type":"Sports Park","address":"55 Bulleen Rd, Bulleen","suburb":"Bulleen"}',                                    145.0830, -37.7680),
  ('Warrandyte River Reserve',      'Yarra River frontage reserve with walking trails',        '{"facility_type":"Nature Reserve","address":"10 Yarra St, Warrandyte","suburb":"Warrandyte"}',                              145.2260, -37.7530),
  ('Doncaster East Reserve',        'Local park with playground and sports oval',               '{"facility_type":"Reserve","address":"80 George St, Doncaster East","suburb":"Doncaster East"}',                            145.1560, -37.7870),
  ('Westfield Doncaster Surrounds', 'Commercial precinct surrounds and public realm',          '{"facility_type":"Commercial Precinct","address":"619 Doncaster Rd, Doncaster","suburb":"Doncaster"}',                     145.1250, -37.7850),
  ('Ruffey Lake Park',              'Major regional park with lake, trails and playground',     '{"facility_type":"Regional Park","address":"Victoria St, Doncaster","suburb":"Doncaster"}',                                145.1190, -37.7720),
  ('Pettys Orchard Reserve',        'Heritage orchard and open space area',                    '{"facility_type":"Heritage Reserve","address":"Knees Rd, Park Orchards","suburb":"Park Orchards"}',                         145.1850, -37.7680),
  ('Warrandyte Depot',              'Council works depot and vehicle storage',                  '{"facility_type":"Depot","address":"5 Research-Warr Rd, Warrandyte","suburb":"Warrandyte"}',                               145.2230, -37.7510),
  ('Pines Activity Centre',         'Local shops and community services hub',                  '{"facility_type":"Activity Centre","address":"80 Reynolds Rd, Doncaster East","suburb":"Doncaster East"}',                 145.1520, -37.7900),
  ('Donvale Sports Hub',            'Multi-sport facility with ovals and courts',              '{"facility_type":"Sports Hub","address":"20 Mitcham Rd, Donvale","suburb":"Donvale"}',                                     145.1700, -37.7970),
  ('Lower Templestowe Reserve',     'Local park and playground area',                          '{"facility_type":"Reserve","address":"25 Blake St, Lower Templestowe","suburb":"Lower Templestowe"}',                       145.1050, -37.7640),
  ('Serpells Rd Reserve',           'Open space reserve in Templestowe',                       '{"facility_type":"Reserve","address":"10 Serpells Rd, Templestowe","suburb":"Templestowe"}',                                145.1320, -37.7500),
  ('Yarra Valley Parklands',        'Scenic parklands along the Yarra River corridor',         '{"facility_type":"Parkland","address":"Everard Dr, Templestowe","suburb":"Templestowe"}',                                  145.1400, -37.7610),
  ('Templestowe Bike Track',        'BMX and mountain bike facility',                          '{"facility_type":"Bike Track","address":"Porter St, Templestowe","suburb":"Templestowe"}',                                 145.1285, -37.7545),
  ('Deep Creek Reserve',            'Bushland reserve with walking tracks',                    '{"facility_type":"Bushland Reserve","address":"Stintons Rd, Park Orchards","suburb":"Park Orchards"}',                      145.1920, -37.7620),
  ('Schramms Reserve',              'Local park and open space',                               '{"facility_type":"Reserve","address":"Heidelberg-Warr Rd, Doncaster","suburb":"Doncaster"}',                               145.1100, -37.7710),
  ('Jumping Creek Reserve',         'Bushland reserve near Jumping Creek',                     '{"facility_type":"Bushland Reserve","address":"Jumping Creek Rd, Wonga Park","suburb":"Wonga Park"}',                       145.2530, -37.7490),
  ('Wonga Park Village',            'Rural village centre and community hub',                  '{"facility_type":"Village Centre","address":"22 Old Yarra Rd, Wonga Park","suburb":"Wonga Park"}',                         145.2580, -37.7430),
  ('Rieschiecks Reserve',           'Sports ground and community reserve',                     '{"facility_type":"Sports Reserve","address":"Thompson St, Templestowe","suburb":"Templestowe"}',                            145.1370, -37.7490),
  ('Zerbes Reserve',                'Local park with playground',                              '{"facility_type":"Reserve","address":"Zerbes Way, Doncaster","suburb":"Doncaster"}',                                       145.1360, -37.7770),
  ('Tulloch Reserve',               'Open space reserve in Lower Templestowe',                 '{"facility_type":"Reserve","address":"Tulloch Gv, Templestowe Lower","suburb":"Templestowe Lower"}',                       145.1000, -37.7650),
  ('Mullum Mullum Linear Park',     'Major linear trail along Mullum Mullum Creek',            '{"facility_type":"Linear Park","address":"Springvale Rd, Donvale","suburb":"Donvale"}',                                    145.1650, -37.8000),
  ('Koonung Creek Reserve',         'Creek-side reserve and walking trail',                    '{"facility_type":"Creek Reserve","address":"Koonung Creek, Doncaster","suburb":"Doncaster"}',                              145.1090, -37.7860),
  ('Currawong Bush Park',           'Native bushland park with walking trails',                '{"facility_type":"Bush Park","address":"Reynolds Rd, Doncaster East","suburb":"Doncaster East"}',                          145.1610, -37.7920),
  ('Birrarung Park',                'Riverside park at confluence of Yarra and Mullum Mullum', '{"facility_type":"Riverside Park","address":"Fitzsimons Ln, Templestowe","suburb":"Templestowe"}',                         145.1120, -37.7580)
) AS v(name, description, props, lng, lat)
WHERE NOT EXISTS (SELECT 1 FROM spatial_features sf JOIN spatial_layers sl ON sf.layer_id = sl.layer_id WHERE sl.code = 'facilities');

-- ── Layer 2: Parks & Reserves (~20 points) ──
INSERT INTO spatial_features (layer_id, name, description, properties, geom)
SELECT
  (SELECT layer_id FROM spatial_layers WHERE code = 'parks'),
  v.name, v.description, v.props::jsonb,
  ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)
FROM (VALUES
  ('Ruffey Lake Park',              'Regional park with 3km trail loop around ornamental lake',                '{"park_type":"Regional","area_ha":28.5,"facilities":["Playground","BBQ","Toilet","Car Park","Lake","Walking Trail"]}',     145.1190, -37.7720),
  ('Warrandyte River Reserve',      'Yarra River frontage with indigenous flora and canoe launch',             '{"park_type":"River Reserve","area_ha":42.0,"facilities":["Walking Trail","Canoe Launch","Lookout","Toilet"]}',            145.2260, -37.7530),
  ('Mullum Mullum Linear Park',     '10km shared trail along Mullum Mullum Creek to Yarra confluence',        '{"park_type":"Linear","area_ha":35.0,"facilities":["Cycling Path","Walking Trail","Bridge Crossings"]}',                  145.1650, -37.8000),
  ('Deep Creek Reserve',            'Remnant bushland with seasonal wildflower displays',                      '{"park_type":"Bushland","area_ha":18.0,"facilities":["Walking Trail","Bird Hide","Interpretive Signs"]}',                  145.1920, -37.7620),
  ('Currawong Bush Park',           'Native bushland with 5km of sealed and gravel trails',                    '{"park_type":"Bushland","area_ha":22.0,"facilities":["Walking Trail","Picnic Area","Toilet","Car Park"]}',                 145.1610, -37.7920),
  ('Birrarung Park',                'Riverside reserve at Yarra and Mullum Mullum confluence',                 '{"park_type":"Riverside","area_ha":12.0,"facilities":["Playground","BBQ","Toilet","Canoe Launch"]}',                       145.1120, -37.7580),
  ('Schramms Reserve',              'Sports ovals, playground and community space',                            '{"park_type":"Sports","area_ha":8.5,"facilities":["Sports Oval","Playground","Toilet","Car Park"]}',                       145.1100, -37.7710),
  ('Zerbes Reserve',                'Neighbourhood park with adventure playground',                            '{"park_type":"Local","area_ha":3.2,"facilities":["Playground","Open Space","Seating"]}',                                   145.1360, -37.7770),
  ('Pettys Orchard',                'Heritage apple and pear orchard preserved as public open space',          '{"park_type":"Heritage","area_ha":5.0,"facilities":["Walking Path","Heritage Orchard","Picnic Area"]}',                    145.1850, -37.7680),
  ('Jumping Creek Reserve',         'Bushland corridor linking Warrandyte State Park',                         '{"park_type":"Bushland","area_ha":15.0,"facilities":["Walking Trail","Creek Crossing"]}',                                  145.2530, -37.7490),
  ('Koonung Creek Reserve',         'Creek corridor with shared pathway and revegetation',                     '{"park_type":"Creek Reserve","area_ha":10.0,"facilities":["Shared Path","Seating","Revegetation Area"]}',                  145.1090, -37.7860),
  ('Yarra Valley Parklands',        'Scenic Yarra River frontage with river red gums',                         '{"park_type":"Riverine","area_ha":20.0,"facilities":["Walking Trail","Lookout","Car Park"]}',                              145.1400, -37.7610),
  ('Bulleen Park',                  'Major sporting precinct with multiple ovals',                             '{"park_type":"Sports","area_ha":16.0,"facilities":["Sports Oval","Cricket Nets","Tennis Courts","Toilet","Car Park"]}',    145.0830, -37.7680),
  ('Tulloch Reserve',               'Neighbourhood green space with mature trees',                             '{"park_type":"Local","area_ha":2.5,"facilities":["Open Space","Seating","Dog Off-Leash"]}',                                145.1000, -37.7650),
  ('Rieschiecks Reserve',           'Sports ground with pavilion and playground',                               '{"park_type":"Sports","area_ha":6.0,"facilities":["Sports Oval","Pavilion","Playground","Toilet"]}',                       145.1370, -37.7490),
  ('Woodridge Linear Reserve',      'Neighbourhood walking trail through Doncaster East',                      '{"park_type":"Linear","area_ha":4.0,"facilities":["Walking Path","Seating"]}',                                             145.1640, -37.7890),
  ('Serpells Reserve',              'Open space with mature eucalypts and informal paths',                      '{"park_type":"Local","area_ha":3.5,"facilities":["Walking Path","Open Space"]}',                                           145.1320, -37.7500),
  ('Finns Reserve',                 'Community reserve with sports facilities',                                 '{"park_type":"Sports","area_ha":7.0,"facilities":["Sports Oval","Tennis Courts","Playground"]}',                            145.0920, -37.7750),
  ('Domeney Reserve',               'Community park in Doncaster East with skate park',                        '{"park_type":"Community","area_ha":4.5,"facilities":["Skate Park","Playground","BBQ","Toilet"]}',                           145.1480, -37.7880),
  ('Donvale Reserve',               'Neighbourhood park with sports oval and playground',                      '{"park_type":"Sports","area_ha":5.5,"facilities":["Sports Oval","Playground","Toilet"]}',                                  145.1750, -37.7950)
) AS v(name, description, props, lng, lat)
WHERE NOT EXISTS (SELECT 1 FROM spatial_features sf JOIN spatial_layers sl ON sf.layer_id = sl.layer_id WHERE sl.code = 'parks');

-- ── Layer 3: Infrastructure Assets (~40 points) ──
INSERT INTO spatial_features (layer_id, name, description, properties, geom)
SELECT
  (SELECT layer_id FROM spatial_layers WHERE code = 'infrastructure'),
  v.name, v.description, v.props::jsonb,
  ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)
FROM (VALUES
  ('Fitzsimons Lane Bridge',        'Major road bridge over Yarra River',                     '{"asset_type":"Bridge","condition":4,"condition_label":"Good","last_inspected":"2024-09-15","replacement_value":8500000}',   145.1120, -37.7600),
  ('Templestowe Rd Bridge',         'Road bridge over Mullum Mullum Creek',                   '{"asset_type":"Bridge","condition":3,"condition_label":"Fair","last_inspected":"2024-07-20","replacement_value":3200000}',   145.1290, -37.7580),
  ('Warrandyte Bridge',             'Historic timber bridge over Yarra River',                '{"asset_type":"Bridge","condition":2,"condition_label":"Poor","last_inspected":"2024-11-01","replacement_value":12000000}',  145.2240, -37.7540),
  ('Reynolds Rd Bridge',            'Road bridge over Koonung Creek',                          '{"asset_type":"Bridge","condition":4,"condition_label":"Good","last_inspected":"2024-06-10","replacement_value":2800000}',   145.1530, -37.7910),
  ('Doncaster Rd Drainage Pit #1',  'Stormwater collection pit on Doncaster Rd',              '{"asset_type":"Drainage Pit","condition":5,"condition_label":"Excellent","last_inspected":"2025-01-10","replacement_value":15000}', 145.1240, -37.7840),
  ('Doncaster Rd Drainage Pit #2',  'Stormwater collection pit near civic centre',            '{"asset_type":"Drainage Pit","condition":4,"condition_label":"Good","last_inspected":"2024-12-05","replacement_value":15000}',     145.1210, -37.7835),
  ('Williamsons Rd Drainage Pit',   'Stormwater pit at Williamsons Rd intersection',          '{"asset_type":"Drainage Pit","condition":3,"condition_label":"Fair","last_inspected":"2024-10-18","replacement_value":15000}',      145.1280, -37.7790),
  ('Bulleen Rd Drainage Pit',       'Major stormwater pit on Bulleen Rd',                     '{"asset_type":"Drainage Pit","condition":4,"condition_label":"Good","last_inspected":"2024-08-22","replacement_value":18000}',      145.0840, -37.7690),
  ('Templestowe Rd Drain Outlet',   'Stormwater outlet to Mullum Mullum Creek',               '{"asset_type":"Drain Outlet","condition":3,"condition_label":"Fair","last_inspected":"2024-05-15","replacement_value":45000}',      145.1300, -37.7560),
  ('Anderson Creek Culvert',        'Box culvert under Anderson St',                           '{"asset_type":"Culvert","condition":4,"condition_label":"Good","last_inspected":"2024-09-30","replacement_value":280000}',          145.1170, -37.7565),
  ('Koonung Creek Retaining Wall',  'Gabion retaining wall along creek channel',              '{"asset_type":"Retaining Wall","condition":3,"condition_label":"Fair","last_inspected":"2024-04-12","replacement_value":350000}',   145.1090, -37.7855),
  ('Doncaster Rd - Section A',      'Arterial road segment: Williamsons to Civic',            '{"asset_type":"Road Segment","condition":4,"condition_label":"Good","last_inspected":"2024-11-20","replacement_value":1200000}',    145.1250, -37.7845),
  ('Doncaster Rd - Section B',      'Arterial road segment: Civic to Blackburn Rd',          '{"asset_type":"Road Segment","condition":3,"condition_label":"Fair","last_inspected":"2024-11-20","replacement_value":1400000}',    145.1150, -37.7840),
  ('Manningham Rd - Section A',     'Arterial road segment through Bulleen',                   '{"asset_type":"Road Segment","condition":4,"condition_label":"Good","last_inspected":"2024-10-05","replacement_value":980000}',    145.0870, -37.7700),
  ('Thompsons Rd Footpath',         'Concrete footpath along Thompsons Rd',                    '{"asset_type":"Footpath","condition":4,"condition_label":"Good","last_inspected":"2024-08-01","replacement_value":120000}',        145.1200, -37.7650),
  ('King St Footpath',              'Concrete footpath through Templestowe Village',           '{"asset_type":"Footpath","condition":5,"condition_label":"Excellent","last_inspected":"2025-01-05","replacement_value":95000}',    145.1175, -37.7555),
  ('Stormwater Pump Station #1',    'Automated stormwater pump at Koonung Creek',             '{"asset_type":"Pump Station","condition":4,"condition_label":"Good","last_inspected":"2024-12-01","replacement_value":450000}',     145.1080, -37.7870),
  ('Stormwater Pump Station #2',    'Automated stormwater pump at Ruffey Creek',              '{"asset_type":"Pump Station","condition":5,"condition_label":"Excellent","last_inspected":"2025-01-15","replacement_value":380000}', 145.1200, -37.7730),
  ('Blackburn Rd - Section A',      'Arterial road through Doncaster East',                   '{"asset_type":"Road Segment","condition":4,"condition_label":"Good","last_inspected":"2024-09-10","replacement_value":1100000}',   145.1450, -37.7870),
  ('Tindals Rd Bridge',             'Pedestrian bridge over creek',                            '{"asset_type":"Bridge","condition":4,"condition_label":"Good","last_inspected":"2024-10-22","replacement_value":680000}',          145.1400, -37.7620),
  ('Tuckers Rd Bridge',             'Vehicle bridge over Mullum Mullum Creek',                '{"asset_type":"Bridge","condition":4,"condition_label":"Good","last_inspected":"2024-10-15","replacement_value":1500000}',         145.1350, -37.7700),
  ('Andersons Creek Rd Bridge',     'Road bridge over Andersons Creek',                       '{"asset_type":"Bridge","condition":4,"condition_label":"Good","last_inspected":"2024-08-30","replacement_value":2100000}',         145.2050, -37.7560)
) AS v(name, description, props, lng, lat)
WHERE NOT EXISTS (SELECT 1 FROM spatial_features sf JOIN spatial_layers sl ON sf.layer_id = sl.layer_id WHERE sl.code = 'infrastructure');

-- ── Layer 4: Ward Boundaries (3 polygons) ──
INSERT INTO spatial_features (layer_id, name, description, properties, geom)
SELECT
  (SELECT layer_id FROM spatial_layers WHERE code = 'wards'),
  v.name, v.description, v.props::jsonb,
  ST_GeomFromText(v.wkt, 4326)
FROM (VALUES
  ('Koonung Ward',
   'South-western ward covering Doncaster, Bulleen and parts of Doncaster East',
   '{"councillor":"Cr. Anna Chen","area_km2":18.5,"population":38200,"suburbs":["Doncaster","Bulleen","Doncaster East"]}',
   'POLYGON((145.055 -37.775, 145.138 -37.775, 145.138 -37.812, 145.055 -37.812, 145.055 -37.775))'),
  ('Westerfolds Ward',
   'North-western ward covering Templestowe and Lower Templestowe',
   '{"councillor":"Cr. David Kumar","area_km2":22.0,"population":35800,"suburbs":["Templestowe","Lower Templestowe","Bulleen"]}',
   'POLYGON((145.055 -37.735, 145.138 -37.735, 145.138 -37.775, 145.055 -37.775, 145.055 -37.735))'),
  ('Mullum Mullum Ward',
   'Eastern ward covering Doncaster East, Warrandyte, Donvale, Park Orchards and Wonga Park',
   '{"councillor":"Cr. Sarah Mitchell","area_km2":73.0,"population":40500,"suburbs":["Doncaster East","Warrandyte","Donvale","Park Orchards","Wonga Park"]}',
   'POLYGON((145.138 -37.730, 145.270 -37.730, 145.270 -37.812, 145.138 -37.812, 145.138 -37.730))')
) AS v(name, description, props, wkt)
WHERE NOT EXISTS (SELECT 1 FROM spatial_features sf JOIN spatial_layers sl ON sf.layer_id = sl.layer_id WHERE sl.code = 'wards');

-- ── Layer 5: Street Trees (sample ~20) ──
INSERT INTO spatial_features (layer_id, name, description, properties, geom)
SELECT
  (SELECT layer_id FROM spatial_layers WHERE code = 'trees'),
  v.name, v.description, v.props::jsonb,
  ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)
FROM (VALUES
  ('River Red Gum #DNC001',       'Mature specimen on Doncaster Rd median',             '{"species":"Eucalyptus camaldulensis","common_name":"River Red Gum","height_m":18,"dbh_cm":85,"health_status":"Good","planted_date":"1985-06-15"}',         145.1235, -37.7838),
  ('Lemon-scented Gum #DNC002',   'Street tree near civic centre',                      '{"species":"Corymbia citriodora","common_name":"Lemon-scented Gum","height_m":22,"dbh_cm":60,"health_status":"Excellent","planted_date":"1990-04-20"}',    145.1225, -37.7830),
  ('Brush Box #DNC003',            'Street tree on Williamsons Rd',                      '{"species":"Lophostemon confertus","common_name":"Brush Box","height_m":12,"dbh_cm":40,"health_status":"Good","planted_date":"2005-07-10"}',                145.1282, -37.7785),
  ('English Elm #TMP001',          'Heritage tree in Templestowe Village',               '{"species":"Ulmus procera","common_name":"English Elm","height_m":20,"dbh_cm":95,"health_status":"Fair","planted_date":"1960-03-01"}',                     145.1168, -37.7558),
  ('Spotted Gum #BUL001',          'Street tree along Bulleen Rd',                       '{"species":"Corymbia maculata","common_name":"Spotted Gum","height_m":25,"dbh_cm":70,"health_status":"Excellent","planted_date":"1988-05-20"}',            145.0835, -37.7685),
  ('Yellow Box #WAR001',            'Native tree in Warrandyte township',                 '{"species":"Eucalyptus melliodora","common_name":"Yellow Box","height_m":16,"dbh_cm":55,"health_status":"Good","planted_date":"1975-04-10"}',              145.2255, -37.7535),
  ('Pin Oak #DNE001',               'Street tree on George St',                           '{"species":"Quercus palustris","common_name":"Pin Oak","height_m":14,"dbh_cm":42,"health_status":"Good","planted_date":"2002-07-20"}',                    145.1560, -37.7872),
  ('Sugar Gum #DON001',            'Large specimen in Donvale',                           '{"species":"Eucalyptus cladocalyx","common_name":"Sugar Gum","height_m":24,"dbh_cm":80,"health_status":"Good","planted_date":"1980-03-10"}',              145.1705, -37.7975),
  ('Messmate #PKO001',              'Tall eucalypt in Park Orchards',                     '{"species":"Eucalyptus obliqua","common_name":"Messmate","height_m":28,"dbh_cm":90,"health_status":"Good","planted_date":"1965-02-01"}',                  145.1855, -37.7685),
  ('Candlebark Gum #WPK001',       'Signature white-barked tree in Wonga Park',          '{"species":"Eucalyptus rubida","common_name":"Candlebark Gum","height_m":20,"dbh_cm":55,"health_status":"Good","planted_date":"1978-04-20"}',              145.2585, -37.7435),
  ('London Plane #DNC006',         'Large shade tree on Doncaster Rd',                    '{"species":"Platanus x acerifolia","common_name":"London Plane","height_m":18,"dbh_cm":70,"health_status":"Good","planted_date":"1985-04-10"}',           145.1195, -37.7835),
  ('Lilly Pilly #DNC009',          'Native screen planting near civic centre',            '{"species":"Syzygium smithii","common_name":"Lilly Pilly","height_m":8,"dbh_cm":18,"health_status":"Excellent","planted_date":"2016-03-20"}',             145.1232, -37.7828),
  ('Jacaranda #MLP001',            'Ornamental tree near Mullum Mullum trailhead',        '{"species":"Jacaranda mimosifolia","common_name":"Jacaranda","height_m":10,"dbh_cm":28,"health_status":"Excellent","planted_date":"2014-10-15"}',        145.1655, -37.7995),
  ('Mountain Ash #DCP001',         'Tall eucalypt in Deep Creek Reserve edge',            '{"species":"Eucalyptus regnans","common_name":"Mountain Ash","height_m":35,"dbh_cm":110,"health_status":"Good","planted_date":"1950-01-01"}',             145.1925, -37.7625),
  ('Norfolk Island Pine #WFD001',  'Landmark tree at Westfield Doncaster entrance',       '{"species":"Araucaria heterophylla","common_name":"Norfolk Island Pine","height_m":25,"dbh_cm":60,"health_status":"Good","planted_date":"1980-10-01"}',  145.1252, -37.7852),
  ('Coast Banksia #WAR003',        'Native banksia near Warrandyte shops',                 '{"species":"Banksia integrifolia","common_name":"Coast Banksia","height_m":8,"dbh_cm":25,"health_status":"Excellent","planted_date":"2008-03-15"}',      145.2260, -37.7528),
  ('Snow Gum #RFL001',             'Ornamental planting near Ruffey Lake',                 '{"species":"Eucalyptus pauciflora","common_name":"Snow Gum","height_m":8,"dbh_cm":20,"health_status":"Good","planted_date":"2018-04-10"}',               145.1185, -37.7718),
  ('Tulip Tree #DNC010',           'Ornamental tree in Doncaster precinct',               '{"species":"Liriodendron tulipifera","common_name":"Tulip Tree","height_m":15,"dbh_cm":42,"health_status":"Excellent","planted_date":"2000-04-10"}',     145.1255, -37.7850),
  ('Crimson Bottlebrush #TLC001',  'Native bottlebrush at Tulloch Reserve',                '{"species":"Callistemon citrinus","common_name":"Crimson Bottlebrush","height_m":5,"dbh_cm":12,"health_status":"Excellent","planted_date":"2017-09-15"}', 145.1005, -37.7655),
  ('Silver Banksia #JCR001',       'Native banksia near Jumping Creek',                    '{"species":"Banksia marginata","common_name":"Silver Banksia","height_m":6,"dbh_cm":15,"health_status":"Good","planted_date":"2012-08-15"}',             145.2535, -37.7495)
) AS v(name, description, props, lng, lat)
WHERE NOT EXISTS (SELECT 1 FROM spatial_features sf JOIN spatial_layers sl ON sf.layer_id = sl.layer_id WHERE sl.code = 'trees');

-- ── Layer 6: Planning Zones (8 polygons) ──
INSERT INTO spatial_features (layer_id, name, description, properties, geom)
SELECT
  (SELECT layer_id FROM spatial_layers WHERE code = 'zones'),
  v.name, v.description, v.props::jsonb,
  ST_GeomFromText(v.wkt, 4326)
FROM (VALUES
  ('General Residential Zone',
   'Standard residential areas allowing moderate housing growth and development',
   '{"zone_code":"GRZ","max_height":"11m","min_lot_size":"500sqm","description":"Moderate growth residential with neighbourhood character considerations"}',
   'POLYGON((145.105 -37.775, 145.138 -37.775, 145.138 -37.800, 145.105 -37.800, 145.105 -37.775))'),
  ('Neighbourhood Residential Zone',
   'Areas of identified neighbourhood character requiring protection',
   '{"zone_code":"NRZ","max_height":"9m","min_lot_size":"650sqm","description":"Limited change residential preserving existing character"}',
   'POLYGON((145.055 -37.740, 145.105 -37.740, 145.105 -37.775, 145.055 -37.775, 145.055 -37.740))'),
  ('Low Density Residential Zone',
   'Low density residential in eastern areas with larger lots',
   '{"zone_code":"LDRZ","max_height":"9m","min_lot_size":"4000sqm","description":"Rural-residential character with minimum 4000sqm lots"}',
   'POLYGON((145.170 -37.755, 145.210 -37.755, 145.210 -37.800, 145.170 -37.800, 145.170 -37.755))'),
  ('Activity Centre Zone',
   'Doncaster Hill major activity centre for mixed-use development',
   '{"zone_code":"ACZ","max_height":"40m","min_lot_size":"N/A","description":"High-density mixed use centre supporting significant growth"}',
   'POLYGON((145.118 -37.781, 145.130 -37.781, 145.130 -37.790, 145.118 -37.790, 145.118 -37.781))'),
  ('Green Wedge Zone',
   'Non-urban land in Warrandyte, Wonga Park and Park Orchards',
   '{"zone_code":"GWZ","max_height":"7.5m","min_lot_size":"40ha","description":"Rural and conservation land protecting green wedge from urban development"}',
   'POLYGON((145.210 -37.730, 145.270 -37.730, 145.270 -37.770, 145.210 -37.770, 145.210 -37.730))'),
  ('Public Use Zone',
   'Land used for public purposes including civic, education and community',
   '{"zone_code":"PUZ","max_height":"N/A","min_lot_size":"N/A","description":"Public purpose land for government, education and community facilities"}',
   'POLYGON((145.120 -37.780, 145.127 -37.780, 145.127 -37.786, 145.120 -37.786, 145.120 -37.780))'),
  ('Mixed Use Zone',
   'Commercial and residential mixed use along key corridors',
   '{"zone_code":"MUZ","max_height":"14m","min_lot_size":"N/A","description":"Mixed commercial and residential along activity corridors"}',
   'POLYGON((145.100 -37.778, 145.118 -37.778, 145.118 -37.785, 145.100 -37.785, 145.100 -37.778))'),
  ('Rural Conservation Zone',
   'Conservation land in the north-eastern green wedge',
   '{"zone_code":"RCZ","max_height":"7.5m","min_lot_size":"40ha","description":"Conservation-priority rural land with environmental significance"}',
   'POLYGON((145.220 -37.730, 145.270 -37.730, 145.270 -37.755, 145.220 -37.755, 145.220 -37.730))')
) AS v(name, description, props, wkt)
WHERE NOT EXISTS (SELECT 1 FROM spatial_features sf JOIN spatial_layers sl ON sf.layer_id = sl.layer_id WHERE sl.code = 'zones');

-- ── Update feature counts ──
UPDATE spatial_layers sl
SET feature_count = (
  SELECT COUNT(*) FROM spatial_features sf WHERE sf.layer_id = sl.layer_id
);
