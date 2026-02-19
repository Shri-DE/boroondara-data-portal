-- ============================================================
-- pg-03-spatial-seed.sql
-- Enterprise Data Portal — Spatial seed data for PostGIS
-- ============================================================

-- ── Layer definitions ──
INSERT INTO spatial_layers (code, name, description, layer_type, category, icon, color)
SELECT v.code, v.name, v.description, v.layer_type, v.category, v.icon, v.color
FROM (VALUES
  ('facilities',     'Council Facilities',    'Council buildings, libraries, aquatic centres, community centres and depots across Boroondara.',          'point',   'Community',       'CityNext',        '#0078D4'),
  ('parks',          'Parks & Reserves',      'Public parks, nature reserves, linear trails and open space areas maintained by council.',                'point',   'Environment',     'Leaf',            '#34D399'),
  ('infrastructure', 'Infrastructure Assets', 'Bridges, drainage pits, stormwater assets and road infrastructure with condition assessments.',           'point',   'Infrastructure',  'Manufacturing',   '#FBBF24'),
  ('wards',          'Ward Boundaries',       'Three electoral wards of Boroondara City Council with councillor and population details.',                'polygon', 'Governance',      'Globe',           '#7C7CFF'),
  ('trees',          'Street Trees',          'Council-managed street trees with species, dimensions, health status and planting dates.',                'point',   'Environment',     'Flower',          '#22C55E'),
  ('zones',          'Planning Zones',        'Victorian planning scheme zones including residential, activity centre, commercial and public use.',      'polygon', 'Planning',        'Org',             '#38BDF8')
) AS v(code, name, description, layer_type, category, icon, color)
WHERE NOT EXISTS (SELECT 1 FROM spatial_layers LIMIT 1);

-- ── Layer 1: Council Facilities (~29 points) ──
INSERT INTO spatial_features (layer_id, name, description, properties, geom)
SELECT
  (SELECT layer_id FROM spatial_layers WHERE code = 'facilities'),
  v.name, v.description, v.props::jsonb,
  ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)
FROM (VALUES
  ('Camberwell Civic Centre',         'Council headquarters and customer service centre',         '{"facility_type":"Civic","address":"8 Inglesby Rd, Camberwell","suburb":"Camberwell","phone":"03 9278 4444"}',              145.0570, -37.8400),
  ('Kew Civic Centre',                'Municipal offices and community meeting rooms',            '{"facility_type":"Civic","address":"30 Cotham Rd, Kew","suburb":"Kew","phone":"03 9278 4444"}',                             145.0290, -37.8070),
  ('Hawthorn Arts Centre',            'Performing arts venue and cultural hub',                   '{"facility_type":"Arts Centre","address":"360 Burwood Rd, Hawthorn","suburb":"Hawthorn","phone":"03 9278 4770"}',           145.0350, -37.8220),
  ('Hawthorn Aquatic Centre',         'Indoor and outdoor swimming pools and fitness centre',     '{"facility_type":"Aquatic Centre","address":"Glenferrie Rd, Hawthorn","suburb":"Hawthorn","phone":"03 9818 3788"}',         145.0365, -37.8285),
  ('Ashburton Pool & Recreation',     'Swimming pool and recreation facility',                    '{"facility_type":"Aquatic Centre","address":"12 Warner Ave, Ashburton","suburb":"Ashburton","phone":"03 9885 1612"}',       145.0800, -37.8650),
  ('Camberwell Library',              'Main library and community learning hub',                  '{"facility_type":"Library","address":"340 Camberwell Rd, Camberwell","suburb":"Camberwell","phone":"03 9278 4666"}',       145.0580, -37.8380),
  ('Kew Library',                     'Branch library inside Kew Civic Centre',                   '{"facility_type":"Library","address":"30 Cotham Rd, Kew","suburb":"Kew","phone":"03 9278 4666"}',                           145.0290, -37.8070),
  ('Balwyn Library',                  'Branch library serving Balwyn and surrounding suburbs',    '{"facility_type":"Library","address":"336 Whitehorse Rd, Balwyn","suburb":"Balwyn","phone":"03 9278 4666"}',               145.0780, -37.8100),
  ('Hawthorn Library',                'Branch library on Glenferrie Rd strip',                    '{"facility_type":"Library","address":"584 Glenferrie Rd, Hawthorn","suburb":"Hawthorn","phone":"03 9278 4666"}',           145.0370, -37.8280),
  ('Boroondara Sports Complex',       'Multi-sport facility with ovals and courts',               '{"facility_type":"Sports Complex","address":"40 Reservoir Rd, Balwyn North","suburb":"Balwyn North","phone":"03 9836 7942"}', 145.0870, -37.7930),
  ('Glenferrie Oval',                 'Historic sporting oval and pavilion',                       '{"facility_type":"Sports Oval","address":"Glenferrie Rd, Hawthorn","suburb":"Hawthorn"}',                                  145.0380, -37.8260),
  ('Burke Rd Shopping Strip',         'Major commercial precinct and retail centre',              '{"facility_type":"Commercial Precinct","address":"Burke Rd, Camberwell","suburb":"Camberwell"}',                            145.0590, -37.8350),
  ('Glenferrie Rd Shopping Strip',    'Vibrant retail and dining precinct near Swinburne',        '{"facility_type":"Commercial Precinct","address":"Glenferrie Rd, Hawthorn","suburb":"Hawthorn"}',                           145.0370, -37.8250),
  ('Camberwell Junction',             'Major activity centre and transport interchange',          '{"facility_type":"Activity Centre","address":"Burke Rd, Camberwell","suburb":"Camberwell"}',                                145.0600, -37.8310),
  ('Kew Junction',                    'Local activity centre at High St and Cotham Rd',           '{"facility_type":"Activity Centre","address":"High St, Kew","suburb":"Kew"}',                                               145.0300, -37.8050),
  ('Balwyn Village',                  'Local shopping village on Whitehorse Rd',                  '{"facility_type":"Village Centre","address":"Whitehorse Rd, Balwyn","suburb":"Balwyn"}',                                   145.0770, -37.8105),
  ('Ashburton Village',               'Local shopping centre and community precinct',             '{"facility_type":"Village Centre","address":"High St, Ashburton","suburb":"Ashburton"}',                                   145.0770, -37.8630),
  ('Surrey Hills Neighbourhood Centre','Community hub and neighbourhood house',                   '{"facility_type":"Community Centre","address":"157 Union Rd, Surrey Hills","suburb":"Surrey Hills"}',                      145.0990, -37.8270),
  ('Canterbury Community Centre',     'Community hall and meeting rooms',                          '{"facility_type":"Community Centre","address":"2 Rochester Rd, Canterbury","suburb":"Canterbury"}',                         145.0740, -37.8250),
  ('Glen Iris Community Centre',      'Neighbourhood house and meeting facility',                  '{"facility_type":"Community Centre","address":"200 Glen Iris Rd, Glen Iris","suburb":"Glen Iris"}',                         145.0640, -37.8570),
  ('Hawthorn East Community Centre',  'Community meeting and activity space',                      '{"facility_type":"Community Centre","address":"584 Burwood Rd, Hawthorn East","suburb":"Hawthorn East"}',                  145.0520, -37.8300),
  ('Deepdene Community Hub',          'Local community services and meeting rooms',                '{"facility_type":"Community Centre","address":"3 Whitehorse Rd, Deepdene","suburb":"Deepdene"}',                           145.0660, -37.8110),
  ('Balwyn North Community Centre',   'Community hall and neighbourhood programs',                 '{"facility_type":"Community Centre","address":"Buchanan Ave, Balwyn North","suburb":"Balwyn North"}',                      145.0820, -37.7960),
  ('Mont Albert Community Centre',    'Neighbourhood house and learning centre',                   '{"facility_type":"Community Centre","address":"2 Springfield Ave, Mont Albert","suburb":"Mont Albert"}',                   145.1050, -37.8150),
  ('Boroondara Depot Camberwell',     'Council works depot and vehicle storage',                   '{"facility_type":"Depot","address":"Fordholm Rd, Hawthorn","suburb":"Hawthorn"}',                                          145.0320, -37.8190),
  ('Kew Recreation Centre',           'Indoor sports and recreation facility',                     '{"facility_type":"Recreation Centre","address":"Kew Recreation Centre, Princess St, Kew","suburb":"Kew"}',                 145.0250, -37.8020),
  ('Swinburne University Precinct',   'University and innovation precinct surrounds',              '{"facility_type":"Education Precinct","address":"John St, Hawthorn","suburb":"Hawthorn"}',                                 145.0390, -37.8225),
  ('Canterbury Gardens Precinct',     'Gardens precinct and community open space',                  '{"facility_type":"Garden Precinct","address":"Canterbury Rd, Canterbury","suburb":"Canterbury"}',                           145.0790, -37.8270),
  ('Riversdale Park Precinct',        'Park precinct with sports and community facilities',         '{"facility_type":"Park Precinct","address":"Riverside Cres, Hawthorn East","suburb":"Hawthorn East"}',                     145.0470, -37.8340)
) AS v(name, description, props, lng, lat)
WHERE NOT EXISTS (SELECT 1 FROM spatial_features sf JOIN spatial_layers sl ON sf.layer_id = sl.layer_id WHERE sl.code = 'facilities');

-- ── Layer 2: Parks & Reserves (~20 points) ──
INSERT INTO spatial_features (layer_id, name, description, properties, geom)
SELECT
  (SELECT layer_id FROM spatial_layers WHERE code = 'parks'),
  v.name, v.description, v.props::jsonb,
  ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)
FROM (VALUES
  ('Canterbury Gardens',              'Heritage-listed gardens with mature elms and ornamental plantings',            '{"park_type":"Heritage Garden","area_ha":4.5,"facilities":["Playground","Toilet","Walking Path","Rotunda"]}',               145.0790, -37.8270),
  ('Maranoa Gardens',                 'Nationally significant Australian native plant garden',                       '{"park_type":"Botanic","area_ha":3.0,"facilities":["Walking Path","Interpretive Signs","Picnic Area"]}',                   145.0910, -37.8090),
  ('Victoria Park',                   'Major open space parkland along the Yarra River in Kew',                      '{"park_type":"Regional","area_ha":16.5,"facilities":["Sports Oval","Playground","BBQ","Toilet","Car Park","Walking Trail"]}', 145.0200, -37.8000),
  ('Wattle Park',                     'Large bushland park with native grasslands and creek frontage',               '{"park_type":"Bushland","area_ha":25.0,"facilities":["Walking Trail","Playground","BBQ","Toilet","Car Park","Golf Course"]}', 145.1050, -37.8310),
  ('Riversdale Park',                 'Sports and recreation park beside the Yarra River',                            '{"park_type":"Sports","area_ha":8.0,"facilities":["Sports Oval","Tennis Courts","Playground","Toilet"]}',                  145.0470, -37.8340),
  ('Central Gardens',                 'Formal gardens and open space in Hawthorn',                                    '{"park_type":"Heritage Garden","area_ha":2.5,"facilities":["Playground","Walking Path","Seating","Rose Garden"]}',          145.0410, -37.8240),
  ('Anderson Park',                   'Local park with playground and sports oval in Hawthorn East',                  '{"park_type":"Sports","area_ha":5.0,"facilities":["Sports Oval","Playground","Toilet","Car Park"]}',                       145.0510, -37.8310),
  ('Fordham Gardens',                 'Community park with playground and picnic facilities',                          '{"park_type":"Community","area_ha":2.0,"facilities":["Playground","BBQ","Seating"]}',                                      145.0330, -37.8160),
  ('Hays Paddock',                    'Former dairy farm now open grassland with wetland restoration',                '{"park_type":"Heritage","area_ha":6.5,"facilities":["Walking Trail","Dog Off-Leash","Wetland Viewing"]}',                  145.0210, -37.8060),
  ('Willsmere Park',                  'Historic parkland surrounding former Willsmere estate in Kew',                 '{"park_type":"Heritage","area_ha":8.0,"facilities":["Walking Trail","Playground","Heritage Buildings"]}',                  145.0280, -37.7990),
  ('Beckett Park',                    'Large recreation park in Balwyn with sports facilities',                       '{"park_type":"Sports","area_ha":12.0,"facilities":["Sports Oval","Cricket Nets","Tennis Courts","Toilet","Car Park"]}',    145.0880, -37.8080),
  ('Stradbroke Park',                 'Scenic Yarra River frontage park in Kew',                                      '{"park_type":"Riverside","area_ha":5.5,"facilities":["Walking Trail","Canoe Launch","Toilet"]}',                            145.0140, -37.7960),
  ('Ashburton Park',                  'Community park with sports oval and nature playground',                         '{"park_type":"Community","area_ha":7.0,"facilities":["Sports Oval","Nature Playground","BBQ","Toilet"]}',                   145.0810, -37.8640),
  ('Frog Hollow Reserve',             'Bushland reserve with seasonal creek and frog habitat',                        '{"park_type":"Bushland","area_ha":3.5,"facilities":["Walking Trail","Interpretive Signs","Bird Hide"]}',                   145.0700, -37.8430),
  ('Outer Circle Linear Park',        'Former railway corridor converted to shared trail',                            '{"park_type":"Linear","area_ha":10.0,"facilities":["Cycling Path","Walking Trail","Seating"]}',                             145.0680, -37.8510),
  ('Markham Reserve',                 'Sports reserve with pavilion and playground in Ashburton',                      '{"park_type":"Sports","area_ha":4.0,"facilities":["Sports Oval","Pavilion","Playground","Toilet"]}',                        145.0720, -37.8600),
  ('Balwyn Park',                     'Community park with mature trees and open lawn areas',                          '{"park_type":"Local","area_ha":3.0,"facilities":["Playground","Open Space","Seating","Dog Off-Leash"]}',                    145.0810, -37.8130),
  ('Mont Albert Reserve',             'Neighbourhood park with sports facilities',                                    '{"park_type":"Sports","area_ha":4.5,"facilities":["Sports Oval","Tennis Courts","Playground"]}',                            145.1040, -37.8170),
  ('Surrey Gardens',                  'Neighbourhood park in Surrey Hills with playground',                           '{"park_type":"Local","area_ha":2.0,"facilities":["Playground","Open Space","Seating"]}',                                   145.0990, -37.8280),
  ('Yarra Boulevard Reserve',         'Scenic riverside reserve with walking trail along the Yarra',                  '{"park_type":"Riverside","area_ha":15.0,"facilities":["Walking Trail","Cycling Path","Lookout","Car Park"]}',              145.0170, -37.7930)
) AS v(name, description, props, lng, lat)
WHERE NOT EXISTS (SELECT 1 FROM spatial_features sf JOIN spatial_layers sl ON sf.layer_id = sl.layer_id WHERE sl.code = 'parks');

-- ── Layer 3: Infrastructure Assets (~40 points) ──
INSERT INTO spatial_features (layer_id, name, description, properties, geom)
SELECT
  (SELECT layer_id FROM spatial_layers WHERE code = 'infrastructure'),
  v.name, v.description, v.props::jsonb,
  ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)
FROM (VALUES
  ('Burke Rd Bridge (Yarra)',         'Major road bridge over Yarra River',                      '{"asset_type":"Bridge","condition":4,"condition_label":"Good","last_inspected":"2024-09-15","replacement_value":9200000}',   145.0590, -37.8180),
  ('Glenferrie Rd Bridge',            'Road bridge over Yarra River at Hawthorn',                '{"asset_type":"Bridge","condition":3,"condition_label":"Fair","last_inspected":"2024-07-20","replacement_value":7500000}',   145.0370, -37.8150),
  ('Chandler Hwy Bridge',             'Major arterial bridge over Yarra River near Kew',         '{"asset_type":"Bridge","condition":5,"condition_label":"Excellent","last_inspected":"2024-11-01","replacement_value":35000000}', 145.0090, -37.7930),
  ('Walmer St Bridge',                'Pedestrian and cyclist bridge over Yarra River',           '{"asset_type":"Bridge","condition":4,"condition_label":"Good","last_inspected":"2024-06-10","replacement_value":4200000}',  145.0160, -37.7990),
  ('Gardiners Creek Trail Bridge #1', 'Shared trail bridge over Gardiners Creek',                '{"asset_type":"Bridge","condition":4,"condition_label":"Good","last_inspected":"2024-08-30","replacement_value":680000}',   145.0620, -37.8480),
  ('Gardiners Creek Trail Bridge #2', 'Pedestrian bridge near Glen Iris Rd',                     '{"asset_type":"Bridge","condition":3,"condition_label":"Fair","last_inspected":"2024-10-15","replacement_value":520000}',   145.0650, -37.8560),
  ('Burke Rd Drainage Pit #1',        'Stormwater collection pit on Burke Rd south',             '{"asset_type":"Drainage Pit","condition":5,"condition_label":"Excellent","last_inspected":"2025-01-10","replacement_value":15000}', 145.0585, -37.8360),
  ('Burke Rd Drainage Pit #2',        'Stormwater collection pit near Camberwell Junction',      '{"asset_type":"Drainage Pit","condition":4,"condition_label":"Good","last_inspected":"2024-12-05","replacement_value":15000}',     145.0595, -37.8320),
  ('Cotham Rd Drainage Pit',          'Stormwater pit at Cotham Rd intersection',                '{"asset_type":"Drainage Pit","condition":3,"condition_label":"Fair","last_inspected":"2024-10-18","replacement_value":15000}',      145.0310, -37.8080),
  ('Whitehorse Rd Drainage Pit',      'Major stormwater pit on Whitehorse Rd',                   '{"asset_type":"Drainage Pit","condition":4,"condition_label":"Good","last_inspected":"2024-08-22","replacement_value":18000}',      145.0790, -37.8100),
  ('Gardiners Creek Drain Outlet',    'Stormwater outlet to Gardiners Creek',                    '{"asset_type":"Drain Outlet","condition":3,"condition_label":"Fair","last_inspected":"2024-05-15","replacement_value":45000}',      145.0630, -37.8490),
  ('Back Creek Culvert',              'Box culvert under Canterbury Rd',                          '{"asset_type":"Culvert","condition":4,"condition_label":"Good","last_inspected":"2024-09-30","replacement_value":280000}',          145.0740, -37.8250),
  ('Gardiners Creek Retaining Wall',  'Gabion retaining wall along creek channel',               '{"asset_type":"Retaining Wall","condition":3,"condition_label":"Fair","last_inspected":"2024-04-12","replacement_value":350000}',   145.0610, -37.8520),
  ('Burke Rd - Section A',            'Arterial road segment: Yarra to Camberwell Rd',           '{"asset_type":"Road Segment","condition":4,"condition_label":"Good","last_inspected":"2024-11-20","replacement_value":1800000}',    145.0590, -37.8280),
  ('Burke Rd - Section B',            'Arterial road segment: Camberwell Rd to Toorak Rd',       '{"asset_type":"Road Segment","condition":3,"condition_label":"Fair","last_inspected":"2024-11-20","replacement_value":1400000}',    145.0590, -37.8420),
  ('Glenferrie Rd - Section A',       'Arterial road segment through Hawthorn',                   '{"asset_type":"Road Segment","condition":4,"condition_label":"Good","last_inspected":"2024-10-05","replacement_value":1200000}',   145.0370, -37.8260),
  ('Camberwell Rd - Section A',       'Arterial road segment through Camberwell',                 '{"asset_type":"Road Segment","condition":4,"condition_label":"Good","last_inspected":"2024-10-05","replacement_value":980000}',    145.0550, -37.8380),
  ('Cotham Rd Footpath',              'Concrete footpath along Cotham Rd',                        '{"asset_type":"Footpath","condition":4,"condition_label":"Good","last_inspected":"2024-08-01","replacement_value":120000}',        145.0300, -37.8075),
  ('Glenferrie Rd Footpath',          'Concrete footpath through Hawthorn shopping strip',        '{"asset_type":"Footpath","condition":5,"condition_label":"Excellent","last_inspected":"2025-01-05","replacement_value":180000}',   145.0370, -37.8250),
  ('Stormwater Pump Station #1',      'Automated stormwater pump at Gardiners Creek',             '{"asset_type":"Pump Station","condition":4,"condition_label":"Good","last_inspected":"2024-12-01","replacement_value":450000}',    145.0620, -37.8500),
  ('Stormwater Pump Station #2',      'Automated stormwater pump at Back Creek',                  '{"asset_type":"Pump Station","condition":5,"condition_label":"Excellent","last_inspected":"2025-01-15","replacement_value":380000}', 145.0760, -37.8240),
  ('Whitehorse Rd - Section A',       'Arterial road through Balwyn',                             '{"asset_type":"Road Segment","condition":4,"condition_label":"Good","last_inspected":"2024-09-10","replacement_value":1100000}',   145.0780, -37.8100),
  ('High St Bridge (Kew)',            'Pedestrian bridge over creek in Kew',                      '{"asset_type":"Bridge","condition":4,"condition_label":"Good","last_inspected":"2024-10-22","replacement_value":680000}',          145.0200, -37.8010)
) AS v(name, description, props, lng, lat)
WHERE NOT EXISTS (SELECT 1 FROM spatial_features sf JOIN spatial_layers sl ON sf.layer_id = sl.layer_id WHERE sl.code = 'infrastructure');

-- ── Layer 4: Ward Boundaries (3 polygons) ──
INSERT INTO spatial_features (layer_id, name, description, properties, geom)
SELECT
  (SELECT layer_id FROM spatial_layers WHERE code = 'wards'),
  v.name, v.description, v.props::jsonb,
  ST_GeomFromText(v.wkt, 4326)
FROM (VALUES
  ('Gardiner Ward',
   'Southern ward covering Glen Iris, Canterbury, Ashburton and Surrey Hills',
   '{"councillor":"Cr. Lisa Hollingsworth","area_km2":12.8,"population":56000,"suburbs":["Glen Iris","Canterbury","Ashburton","Surrey Hills"]}',
   'POLYGON((145.040 -37.835, 145.110 -37.835, 145.110 -37.875, 145.040 -37.875, 145.040 -37.835))'),
  ('Lynden Ward',
   'Central ward covering Camberwell, Hawthorn East and Deepdene',
   '{"councillor":"Cr. Jim Parke","area_km2":10.5,"population":54500,"suburbs":["Camberwell","Hawthorn East","Deepdene"]}',
   'POLYGON((145.030 -37.815, 145.085 -37.815, 145.085 -37.835, 145.030 -37.835, 145.030 -37.815))'),
  ('Studley Ward',
   'Northern ward covering Hawthorn, Kew, Balwyn and Balwyn North',
   '{"councillor":"Cr. Felicity Sinfield","area_km2":14.2,"population":57200,"suburbs":["Hawthorn","Kew","Balwyn","Balwyn North"]}',
   'POLYGON((145.005 -37.790, 145.100 -37.790, 145.100 -37.815, 145.005 -37.815, 145.005 -37.790))')
) AS v(name, description, props, wkt)
WHERE NOT EXISTS (SELECT 1 FROM spatial_features sf JOIN spatial_layers sl ON sf.layer_id = sl.layer_id WHERE sl.code = 'wards');

-- ── Layer 5: Street Trees (sample ~20) ──
INSERT INTO spatial_features (layer_id, name, description, properties, geom)
SELECT
  (SELECT layer_id FROM spatial_layers WHERE code = 'trees'),
  v.name, v.description, v.props::jsonb,
  ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)
FROM (VALUES
  ('English Elm #CAM001',            'Heritage elm on Burke Rd median strip',                   '{"species":"Ulmus procera","common_name":"English Elm","height_m":22,"dbh_cm":95,"health_status":"Good","planted_date":"1920-03-15"}',           145.0588, -37.8355),
  ('London Plane #CAM002',           'Mature shade tree on Camberwell Rd',                      '{"species":"Platanus x acerifolia","common_name":"London Plane","height_m":20,"dbh_cm":80,"health_status":"Excellent","planted_date":"1935-04-20"}', 145.0560, -37.8385),
  ('Brush Box #HAW001',              'Street tree on Glenferrie Rd shopping strip',             '{"species":"Lophostemon confertus","common_name":"Brush Box","height_m":14,"dbh_cm":45,"health_status":"Good","planted_date":"1998-07-10"}',     145.0372, -37.8255),
  ('English Oak #KEW001',            'Heritage oak in Kew streetscape',                          '{"species":"Quercus robur","common_name":"English Oak","height_m":18,"dbh_cm":85,"health_status":"Fair","planted_date":"1910-03-01"}',           145.0295, -37.8065),
  ('Spotted Gum #BAL001',            'Street tree along Whitehorse Rd',                          '{"species":"Corymbia maculata","common_name":"Spotted Gum","height_m":25,"dbh_cm":70,"health_status":"Excellent","planted_date":"1988-05-20"}', 145.0785, -37.8105),
  ('Lemon-scented Gum #CNT001',     'Ornamental tree in Canterbury streetscape',                '{"species":"Corymbia citriodora","common_name":"Lemon-scented Gum","height_m":22,"dbh_cm":60,"health_status":"Good","planted_date":"1975-04-10"}', 145.0745, -37.8255),
  ('Pin Oak #GIR001',                'Street tree on Glen Iris Rd',                              '{"species":"Quercus palustris","common_name":"Pin Oak","height_m":14,"dbh_cm":42,"health_status":"Good","planted_date":"2002-07-20"}',           145.0640, -37.8575),
  ('Sugar Gum #SRH001',              'Tall specimen in Surrey Hills streetscape',                '{"species":"Eucalyptus cladocalyx","common_name":"Sugar Gum","height_m":24,"dbh_cm":80,"health_status":"Good","planted_date":"1980-03-10"}',    145.0995, -37.8275),
  ('River Red Gum #KEW002',          'Mature specimen along Yarra Boulevard',                    '{"species":"Eucalyptus camaldulensis","common_name":"River Red Gum","height_m":28,"dbh_cm":110,"health_status":"Good","planted_date":"1940-02-01"}', 145.0175, -37.7935),
  ('Canary Island Date Palm #HWE001','Ornamental palm on Burwood Rd',                           '{"species":"Phoenix canariensis","common_name":"Canary Island Date Palm","height_m":12,"dbh_cm":55,"health_status":"Good","planted_date":"1960-04-20"}', 145.0525, -37.8305),
  ('Tulip Tree #CAM003',             'Ornamental tree near Camberwell Junction',                 '{"species":"Liriodendron tulipifera","common_name":"Tulip Tree","height_m":15,"dbh_cm":42,"health_status":"Excellent","planted_date":"2000-04-10"}', 145.0605, -37.8315),
  ('Lilly Pilly #ASH001',            'Native screen planting near Ashburton shops',              '{"species":"Syzygium smithii","common_name":"Lilly Pilly","height_m":8,"dbh_cm":18,"health_status":"Excellent","planted_date":"2016-03-20"}',    145.0775, -37.8635),
  ('Jacaranda #HAW002',              'Ornamental tree near Swinburne University',                '{"species":"Jacaranda mimosifolia","common_name":"Jacaranda","height_m":10,"dbh_cm":28,"health_status":"Excellent","planted_date":"2014-10-15"}', 145.0395, -37.8228),
  ('Desert Ash #DPD001',             'Street tree in Deepdene shopping precinct',                '{"species":"Fraxinus angustifolia","common_name":"Desert Ash","height_m":12,"dbh_cm":35,"health_status":"Good","planted_date":"1995-08-20"}',    145.0665, -37.8115),
  ('Norfolk Island Pine #KEW003',    'Landmark tree in Kew streetscape',                         '{"species":"Araucaria heterophylla","common_name":"Norfolk Island Pine","height_m":25,"dbh_cm":60,"health_status":"Good","planted_date":"1950-10-01"}', 145.0305, -37.8055),
  ('Coast Banksia #BLN001',          'Native banksia along Balwyn North streetscape',            '{"species":"Banksia integrifolia","common_name":"Coast Banksia","height_m":8,"dbh_cm":25,"health_status":"Excellent","planted_date":"2008-03-15"}', 145.0830, -37.7965),
  ('Snow Gum #MNA001',               'Ornamental planting in Mont Albert',                       '{"species":"Eucalyptus pauciflora","common_name":"Snow Gum","height_m":8,"dbh_cm":20,"health_status":"Good","planted_date":"2018-04-10"}',      145.1045, -37.8155),
  ('Crimson Bottlebrush #GIR002',    'Native bottlebrush along Gardiners Creek trail',           '{"species":"Callistemon citrinus","common_name":"Crimson Bottlebrush","height_m":5,"dbh_cm":12,"health_status":"Excellent","planted_date":"2017-09-15"}', 145.0615, -37.8495),
  ('Silver Birch #CNT002',           'Ornamental birch in Canterbury gardens precinct',          '{"species":"Betula pendula","common_name":"Silver Birch","height_m":10,"dbh_cm":22,"health_status":"Good","planted_date":"2010-06-15"}',        145.0795, -37.8265),
  ('Claret Ash #HAW003',             'Autumn-colour tree on Burwood Rd',                         '{"species":"Fraxinus angustifolia Raywood","common_name":"Claret Ash","height_m":12,"dbh_cm":30,"health_status":"Excellent","planted_date":"2005-04-10"}', 145.0345, -37.8225)
) AS v(name, description, props, lng, lat)
WHERE NOT EXISTS (SELECT 1 FROM spatial_features sf JOIN spatial_layers sl ON sf.layer_id = sl.layer_id WHERE sl.code = 'trees');

-- ── Layer 6: Planning Zones (8 polygons) ──
INSERT INTO spatial_features (layer_id, name, description, properties, geom)
SELECT
  (SELECT layer_id FROM spatial_layers WHERE code = 'zones'),
  v.name, v.description, v.props::jsonb,
  ST_GeomFromText(v.wkt, 4326)
FROM (VALUES
  ('Neighbourhood Residential Zone - Kew',
   'Areas of established neighbourhood character in Kew requiring protection',
   '{"zone_code":"NRZ","max_height":"9m","min_lot_size":"650sqm","description":"Limited change residential preserving existing character in Kew"}',
   'POLYGON((145.010 -37.795, 145.040 -37.795, 145.040 -37.815, 145.010 -37.815, 145.010 -37.795))'),
  ('Neighbourhood Residential Zone - Canterbury',
   'Heritage residential precinct in Canterbury with significant streetscapes',
   '{"zone_code":"NRZ","max_height":"9m","min_lot_size":"650sqm","description":"Limited change residential preserving heritage streetscapes in Canterbury"}',
   'POLYGON((145.065 -37.820, 145.090 -37.820, 145.090 -37.840, 145.065 -37.840, 145.065 -37.820))'),
  ('General Residential Zone - Balwyn',
   'Standard residential areas in Balwyn allowing moderate housing growth',
   '{"zone_code":"GRZ","max_height":"11m","min_lot_size":"500sqm","description":"Moderate growth residential with neighbourhood character considerations"}',
   'POLYGON((145.070 -37.800, 145.100 -37.800, 145.100 -37.820, 145.070 -37.820, 145.070 -37.800))'),
  ('Activity Centre Zone - Camberwell Junction',
   'Camberwell Junction major activity centre for mixed-use development',
   '{"zone_code":"ACZ","max_height":"21m","min_lot_size":"N/A","description":"Mixed use centre supporting growth at Camberwell Junction transport interchange"}',
   'POLYGON((145.053 -37.826, 145.065 -37.826, 145.065 -37.836, 145.053 -37.836, 145.053 -37.826))'),
  ('Commercial 1 Zone - Glenferrie Rd',
   'Retail and commercial strip along Glenferrie Rd Hawthorn',
   '{"zone_code":"C1Z","max_height":"14m","min_lot_size":"N/A","description":"Commercial and retail precinct along Glenferrie Rd shopping strip"}',
   'POLYGON((145.034 -37.820, 145.040 -37.820, 145.040 -37.832, 145.034 -37.832, 145.034 -37.820))'),
  ('Public Use Zone',
   'Land used for public purposes including civic, education and community',
   '{"zone_code":"PUZ","max_height":"N/A","min_lot_size":"N/A","description":"Public purpose land for government, education and community facilities"}',
   'POLYGON((145.054 -37.837, 145.062 -37.837, 145.062 -37.843, 145.054 -37.843, 145.054 -37.837))'),
  ('General Residential Zone - Glen Iris',
   'Moderate growth residential area in Glen Iris and Ashburton',
   '{"zone_code":"GRZ","max_height":"11m","min_lot_size":"500sqm","description":"Moderate growth residential areas supporting incremental housing change"}',
   'POLYGON((145.050 -37.845, 145.090 -37.845, 145.090 -37.870, 145.050 -37.870, 145.050 -37.845))'),
  ('Mixed Use Zone - Kew Junction',
   'Commercial and residential mixed use at Kew Junction',
   '{"zone_code":"MUZ","max_height":"14m","min_lot_size":"N/A","description":"Mixed commercial and residential at Kew Junction activity centre"}',
   'POLYGON((145.025 -37.800, 145.035 -37.800, 145.035 -37.810, 145.025 -37.810, 145.025 -37.800))')
) AS v(name, description, props, wkt)
WHERE NOT EXISTS (SELECT 1 FROM spatial_features sf JOIN spatial_layers sl ON sf.layer_id = sl.layer_id WHERE sl.code = 'zones');

-- ── Update feature counts ──
UPDATE spatial_layers sl
SET feature_count = (
  SELECT COUNT(*) FROM spatial_features sf WHERE sf.layer_id = sl.layer_id
);
