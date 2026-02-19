-- ============================================================
-- pg-06-abs-seed.sql
-- ABS Census seed data for City of Boroondara (LGA 20310)
-- 14 SA2 areas × 2 census years (2016, 2021)
-- ============================================================

DO $$
DECLARE
    v_council_id UUID;
    v_sa2_balwyn UUID;
    v_sa2_balwyn_nth UUID;
    v_sa2_camberwell UUID;
    v_sa2_canterbury UUID;
    v_sa2_deepdene UUID;
    v_sa2_glen_iris_e UUID;
    v_sa2_glen_iris_w UUID;
    v_sa2_hawthorn UUID;
    v_sa2_hawthorn_e UUID;
    v_sa2_kew UUID;
    v_sa2_kew_e UUID;
    v_sa2_mont_albert UUID;
    v_sa2_surrey_nth UUID;
    v_sa2_surrey_sth UUID;
BEGIN
    -- Get council reference
    SELECT council_id INTO v_council_id FROM councils LIMIT 1;

    -- ============================================================
    -- SA2 Areas
    -- ============================================================
    INSERT INTO abs_sa2_areas (council_id, sa2_code, sa2_name, lga_code, lga_name, area_sqkm)
    SELECT v_council_id, v.sa2_code, v.sa2_name, '20310', 'Boroondara', v.area_sqkm
    FROM (VALUES
        ('206011130', 'Balwyn',              4.82),
        ('206011131', 'Balwyn North',        5.14),
        ('206011132', 'Camberwell',          4.37),
        ('206011133', 'Canterbury',          3.21),
        ('206011134', 'Deepdene',            2.18),
        ('206011135', 'Glen Iris - East',    3.56),
        ('206011136', 'Glen Iris - West',    2.94),
        ('206011137', 'Hawthorn',            3.68),
        ('206011138', 'Hawthorn East',       4.15),
        ('206011139', 'Kew',                 5.73),
        ('206011140', 'Kew East',            3.89),
        ('206011141', 'Mont Albert',         2.47),
        ('206011142', 'Surrey Hills - North',3.12),
        ('206011143', 'Surrey Hills - South',2.86)
    ) AS v(sa2_code, sa2_name, area_sqkm)
    WHERE NOT EXISTS (SELECT 1 FROM abs_sa2_areas WHERE sa2_code = v.sa2_code);

    -- Retrieve SA2 IDs
    SELECT sa2_id INTO v_sa2_balwyn      FROM abs_sa2_areas WHERE sa2_code = '206011130';
    SELECT sa2_id INTO v_sa2_balwyn_nth  FROM abs_sa2_areas WHERE sa2_code = '206011131';
    SELECT sa2_id INTO v_sa2_camberwell  FROM abs_sa2_areas WHERE sa2_code = '206011132';
    SELECT sa2_id INTO v_sa2_canterbury  FROM abs_sa2_areas WHERE sa2_code = '206011133';
    SELECT sa2_id INTO v_sa2_deepdene    FROM abs_sa2_areas WHERE sa2_code = '206011134';
    SELECT sa2_id INTO v_sa2_glen_iris_e FROM abs_sa2_areas WHERE sa2_code = '206011135';
    SELECT sa2_id INTO v_sa2_glen_iris_w FROM abs_sa2_areas WHERE sa2_code = '206011136';
    SELECT sa2_id INTO v_sa2_hawthorn    FROM abs_sa2_areas WHERE sa2_code = '206011137';
    SELECT sa2_id INTO v_sa2_hawthorn_e  FROM abs_sa2_areas WHERE sa2_code = '206011138';
    SELECT sa2_id INTO v_sa2_kew         FROM abs_sa2_areas WHERE sa2_code = '206011139';
    SELECT sa2_id INTO v_sa2_kew_e       FROM abs_sa2_areas WHERE sa2_code = '206011140';
    SELECT sa2_id INTO v_sa2_mont_albert FROM abs_sa2_areas WHERE sa2_code = '206011141';
    SELECT sa2_id INTO v_sa2_surrey_nth  FROM abs_sa2_areas WHERE sa2_code = '206011142';
    SELECT sa2_id INTO v_sa2_surrey_sth  FROM abs_sa2_areas WHERE sa2_code = '206011143';

    -- ============================================================
    -- Demographics (14 SA2 × 2 years = 28 rows)
    -- ============================================================
    INSERT INTO abs_demographics (sa2_id, census_year, population_total, population_male, population_female, median_age, persons_0_14, persons_15_24, persons_25_44, persons_45_64, persons_65_plus, indigenous_persons, australian_citizens)
    SELECT v.sa2_id, v.census_year, v.pop_total, v.pop_male, v.pop_female, v.med_age, v.p0_14, v.p15_24, v.p25_44, v.p45_64, v.p65_plus, v.indigenous, v.citizens
    FROM (VALUES
        -- Balwyn 2016/2021
        (v_sa2_balwyn,      2016, 14230, 6830, 7400, 41.2, 2420, 1565, 3558, 3415, 3272, 42, 11384),
        (v_sa2_balwyn,      2021, 14890, 7147, 7743, 41.8, 2531, 1578, 3723, 3574, 3484, 48, 11912),
        -- Balwyn North 2016/2021
        (v_sa2_balwyn_nth,  2016, 15480, 7430, 8050, 42.5, 2787, 1703, 3716, 3870, 3404, 38, 12074),
        (v_sa2_balwyn_nth,  2021, 16210, 7781, 8429, 43.1, 2917, 1702, 3891, 4053, 3647, 44, 12649),
        -- Camberwell 2016/2021
        (v_sa2_camberwell,  2016, 16850, 8088, 8762, 40.3, 2865, 2022, 4381, 3876, 3706, 55, 13480),
        (v_sa2_camberwell,  2021, 17620, 8458, 9162, 40.9, 2997, 2026, 4581, 4053, 3963, 62, 14096),
        -- Canterbury 2016/2021
        (v_sa2_canterbury,  2016, 8740,  4195, 4545, 43.8, 1486, 874,  2010, 2185, 2185, 31, 7241),
        (v_sa2_canterbury,  2021, 9120,  4378, 4742, 44.2, 1551, 876,  2098, 2280, 2315, 35, 7570),
        -- Deepdene 2016/2021
        (v_sa2_deepdene,    2016, 8210,  3942, 4268, 40.7, 1396, 986,  2135, 1971, 1722, 33, 6568),
        (v_sa2_deepdene,    2021, 8580,  4118, 4462, 41.3, 1459, 986,  2231, 2060, 1844, 37, 6864),
        -- Glen Iris East 2016/2021
        (v_sa2_glen_iris_e, 2016, 11540, 5539, 6001, 39.6, 1962, 1385, 3116, 2770, 2307, 46, 9232),
        (v_sa2_glen_iris_e, 2021, 12080, 5798, 6282, 40.1, 2054, 1389, 3262, 2899, 2476, 52, 9664),
        -- Glen Iris West 2016/2021
        (v_sa2_glen_iris_w, 2016, 10380, 4982, 5398, 38.9, 1764, 1349, 2906, 2387, 1974, 52, 8304),
        (v_sa2_glen_iris_w, 2021, 10870, 5218, 5652, 39.4, 1848, 1348, 3044, 2500, 2130, 58, 8696),
        -- Hawthorn 2016/2021
        (v_sa2_hawthorn,    2016, 14960, 7181, 7779, 38.2, 2094, 2244, 4339, 3291, 2992, 60, 11968),
        (v_sa2_hawthorn,    2021, 15710, 7541, 8169, 38.7, 2199, 2278, 4556, 3456, 3221, 68, 12568),
        -- Hawthorn East 2016/2021
        (v_sa2_hawthorn_e,  2016, 13670, 6562, 7108, 39.5, 2188, 1641, 3691, 3145, 3005, 48, 10936),
        (v_sa2_hawthorn_e,  2021, 14310, 6869, 7441, 40.0, 2290, 1646, 3864, 3292, 3218, 55, 11448),
        -- Kew 2016/2021
        (v_sa2_kew,         2016, 16320, 7834, 8486, 40.8, 2775, 1958, 4243, 3753, 3591, 65, 13056),
        (v_sa2_kew,         2021, 17080, 8198, 8882, 41.3, 2904, 1964, 4441, 3928, 3843, 73, 13664),
        -- Kew East 2016/2021
        (v_sa2_kew_e,       2016, 9870,  4738, 5132, 42.9, 1677, 1086, 2368, 2467, 2272, 35, 8093),
        (v_sa2_kew_e,       2021, 10310, 4949, 5361, 43.4, 1753, 1083, 2474, 2578, 2422, 40, 8454),
        -- Mont Albert 2016/2021
        (v_sa2_mont_albert, 2016, 8950,  4296, 4654, 41.6, 1522, 1074, 2325, 2148, 1881, 36, 7339),
        (v_sa2_mont_albert, 2021, 9350,  4488, 4862, 42.1, 1589, 1075, 2431, 2245, 2010, 41, 7667),
        -- Surrey Hills North 2016/2021
        (v_sa2_surrey_nth,  2016, 9410,  4517, 4893, 40.1, 1600, 1129, 2541, 2259, 1881, 38, 7716),
        (v_sa2_surrey_nth,  2021, 9840,  4723, 5117, 40.6, 1673, 1132, 2657, 2362, 2016, 43, 8069),
        -- Surrey Hills South 2016/2021
        (v_sa2_surrey_sth,  2016, 8460,  4061, 4399, 41.4, 1438, 1015, 2199, 2030, 1778, 40, 6937),
        (v_sa2_surrey_sth,  2021, 8850,  4248, 4602, 41.9, 1504, 1018, 2301, 2124, 1903, 45, 7257)
    ) AS v(sa2_id, census_year, pop_total, pop_male, pop_female, med_age, p0_14, p15_24, p25_44, p45_64, p65_plus, indigenous, citizens)
    WHERE NOT EXISTS (
        SELECT 1 FROM abs_demographics d WHERE d.sa2_id = v.sa2_id AND d.census_year = v.census_year
    );

    -- ============================================================
    -- Housing (14 SA2 × 2 years = 28 rows)
    -- ============================================================
    INSERT INTO abs_housing (sa2_id, census_year, total_dwellings, separate_houses, semi_detached, apartments, owned_outright, owned_mortgage, rented, median_rent_weekly, median_mortgage_monthly, avg_household_size, avg_bedrooms)
    SELECT v.sa2_id, v.census_year, v.total_dw, v.sep_house, v.semi_det, v.apts, v.own_out, v.own_mort, v.rent, v.med_rent, v.med_mortg, v.avg_hh, v.avg_bed
    FROM (VALUES
        -- Balwyn 2016/2021
        (v_sa2_balwyn,      2016, 5420, 3523, 759, 1030, 1951, 1517, 1463, 420, 2400, 2.6, 3.2),
        (v_sa2_balwyn,      2021, 5680, 3635, 823, 1108, 1988, 1562, 1591, 500, 2850, 2.6, 3.2),
        -- Balwyn North 2016/2021
        (v_sa2_balwyn_nth,  2016, 5810, 4067, 640, 988, 2208, 1569, 1511, 410, 2350, 2.7, 3.3),
        (v_sa2_balwyn_nth,  2021, 6090, 4142, 731, 1096, 2253, 1614, 1646, 490, 2790, 2.7, 3.3),
        -- Camberwell 2016/2021
        (v_sa2_camberwell,  2016, 6820, 3955, 1228, 1500, 2387, 1977, 1979, 430, 2500, 2.5, 3.0),
        (v_sa2_camberwell,  2021, 7180, 4021, 1292, 1723, 2443, 2010, 2154, 520, 2980, 2.5, 3.0),
        -- Canterbury 2016/2021
        (v_sa2_canterbury,  2016, 3540, 2478, 460, 531, 1381, 955, 884, 450, 2700, 2.5, 3.3),
        (v_sa2_canterbury,  2021, 3690, 2546, 498, 572, 1402, 981, 968, 540, 3200, 2.5, 3.3),
        -- Deepdene 2016/2021
        (v_sa2_deepdene,    2016, 3380, 2029, 507, 743, 1182, 946, 979, 400, 2450, 2.4, 3.1),
        (v_sa2_deepdene,    2021, 3540, 2089, 549, 795, 1204, 971, 1062, 480, 2900, 2.4, 3.1),
        -- Glen Iris East 2016/2021
        (v_sa2_glen_iris_e, 2016, 4610, 2720, 691, 1106, 1614, 1337, 1336, 410, 2350, 2.5, 3.0),
        (v_sa2_glen_iris_e, 2021, 4850, 2765, 728, 1261, 1649, 1358, 1504, 490, 2800, 2.5, 3.0),
        -- Glen Iris West 2016/2021
        (v_sa2_glen_iris_w, 2016, 4280, 2311, 685, 1177, 1413, 1241, 1370, 395, 2300, 2.4, 2.9),
        (v_sa2_glen_iris_w, 2021, 4510, 2345, 722, 1334, 1444, 1263, 1489, 475, 2720, 2.4, 2.9),
        -- Hawthorn 2016/2021
        (v_sa2_hawthorn,    2016, 6340, 2474, 1014, 2726, 1712, 1649, 2345, 390, 2250, 2.4, 2.8),
        (v_sa2_hawthorn,    2021, 6720, 2486, 1075, 3024, 1747, 1680, 2554, 470, 2680, 2.3, 2.8),
        -- Hawthorn East 2016/2021
        (v_sa2_hawthorn_e,  2016, 5680, 2897, 909, 1761, 1874, 1534, 1761, 410, 2400, 2.4, 2.9),
        (v_sa2_hawthorn_e,  2021, 5970, 2925, 955, 1970, 1910, 1552, 1910, 495, 2850, 2.4, 2.9),
        -- Kew 2016/2021
        (v_sa2_kew,         2016, 6540, 3400, 916, 2093, 2223, 1831, 1962, 430, 2550, 2.5, 3.0),
        (v_sa2_kew,         2021, 6890, 3445, 965, 2342, 2271, 1860, 2132, 520, 3050, 2.5, 3.0),
        -- Kew East 2016/2021
        (v_sa2_kew_e,       2016, 3980, 2587, 517, 796, 1472, 1035, 1075, 400, 2300, 2.5, 3.2),
        (v_sa2_kew_e,       2021, 4160, 2661, 558, 857, 1498, 1060, 1165, 480, 2730, 2.5, 3.2),
        -- Mont Albert 2016/2021
        (v_sa2_mont_albert, 2016, 3620, 2353, 471, 688, 1303, 1013, 1051, 385, 2200, 2.5, 3.1),
        (v_sa2_mont_albert, 2021, 3790, 2389, 521, 765, 1326, 1040, 1136, 460, 2630, 2.5, 3.1),
        -- Surrey Hills North 2016/2021
        (v_sa2_surrey_nth,  2016, 3810, 2438, 534, 724, 1333, 1067, 1067, 395, 2250, 2.5, 3.1),
        (v_sa2_surrey_nth,  2021, 3990, 2474, 579, 818, 1357, 1097, 1158, 470, 2670, 2.5, 3.1),
        -- Surrey Hills South 2016/2021
        (v_sa2_surrey_sth,  2016, 3480, 2262, 487, 626, 1218, 974, 1009, 390, 2200, 2.4, 3.1),
        (v_sa2_surrey_sth,  2021, 3640, 2293, 528, 710, 1238, 1001, 1092, 465, 2620, 2.4, 3.1)
    ) AS v(sa2_id, census_year, total_dw, sep_house, semi_det, apts, own_out, own_mort, rent, med_rent, med_mortg, avg_hh, avg_bed)
    WHERE NOT EXISTS (
        SELECT 1 FROM abs_housing h WHERE h.sa2_id = v.sa2_id AND h.census_year = v.census_year
    );

    -- ============================================================
    -- Income (14 SA2 × 2 years = 28 rows)
    -- ============================================================
    INSERT INTO abs_income (sa2_id, census_year, median_household_weekly, median_personal_weekly, hh_income_0_649, hh_income_650_1249, hh_income_1250_1999, hh_income_2000_2999, hh_income_3000_plus, gini_coefficient)
    SELECT v.sa2_id, v.census_year, v.med_hh, v.med_pers, v.inc0, v.inc650, v.inc1250, v.inc2000, v.inc3000, v.gini
    FROM (VALUES
        -- Balwyn 2016/2021
        (v_sa2_balwyn,      2016, 2180, 870,  650, 810, 1030, 1250, 1680, 0.382),
        (v_sa2_balwyn,      2021, 2520, 1010, 610, 740, 960,  1250, 2120, 0.391),
        -- Balwyn North 2016/2021
        (v_sa2_balwyn_nth,  2016, 2050, 820,  720, 890, 1100, 1300, 1800, 0.375),
        (v_sa2_balwyn_nth,  2021, 2380, 960,  680, 810, 1020, 1310, 2270, 0.383),
        -- Camberwell 2016/2021
        (v_sa2_camberwell,  2016, 2290, 920,  780, 970, 1230, 1430, 2410, 0.395),
        (v_sa2_camberwell,  2021, 2650, 1070, 730, 890, 1150, 1440, 2970, 0.403),
        -- Canterbury 2016/2021
        (v_sa2_canterbury,  2016, 2690, 1080, 310, 420, 530,  680, 1600, 0.412),
        (v_sa2_canterbury,  2021, 3120, 1260, 290, 380, 490,  680, 1850, 0.418),
        -- Deepdene 2016/2021
        (v_sa2_deepdene,    2016, 2100, 850,  410, 510, 640,  730, 1090, 0.378),
        (v_sa2_deepdene,    2021, 2430, 990,  380, 460, 590,  730, 1380, 0.386),
        -- Glen Iris East 2016/2021
        (v_sa2_glen_iris_e, 2016, 2240, 900,  520, 650, 830,  990, 1620, 0.388),
        (v_sa2_glen_iris_e, 2021, 2590, 1050, 490, 590, 770,  1000, 2000, 0.396),
        -- Glen Iris West 2016/2021
        (v_sa2_glen_iris_w, 2016, 2060, 840,  510, 640, 820,  930, 1380, 0.372),
        (v_sa2_glen_iris_w, 2021, 2380, 980,  480, 580, 760,  940, 1750, 0.379),
        -- Hawthorn 2016/2021
        (v_sa2_hawthorn,    2016, 1980, 830,  810, 990, 1210, 1350, 1980, 0.398),
        (v_sa2_hawthorn,    2021, 2290, 970,  760, 900, 1120, 1360, 2580, 0.405),
        -- Hawthorn East 2016/2021
        (v_sa2_hawthorn_e,  2016, 2150, 880,  650, 810, 1020, 1180, 2020, 0.390),
        (v_sa2_hawthorn_e,  2021, 2480, 1020, 610, 740, 950,  1190, 2480, 0.398),
        -- Kew 2016/2021
        (v_sa2_kew,         2016, 2350, 950,  730, 910, 1150, 1370, 2380, 0.402),
        (v_sa2_kew,         2021, 2720, 1100, 690, 830, 1070, 1380, 2920, 0.410),
        -- Kew East 2016/2021
        (v_sa2_kew_e,       2016, 2130, 860,  450, 560, 710,  870, 1390, 0.380),
        (v_sa2_kew_e,       2021, 2460, 1000, 420, 510, 660,  870, 1700, 0.387),
        -- Mont Albert 2016/2021
        (v_sa2_mont_albert, 2016, 1920, 780,  440, 550, 700,  790, 1140, 0.365),
        (v_sa2_mont_albert, 2021, 2220, 910,  410, 500, 650,  800, 1430, 0.373),
        -- Surrey Hills North 2016/2021
        (v_sa2_surrey_nth,  2016, 2010, 810,  440, 560, 710,  830, 1270, 0.370),
        (v_sa2_surrey_nth,  2021, 2330, 950,  410, 510, 660,  840, 1570, 0.377),
        -- Surrey Hills South 2016/2021
        (v_sa2_surrey_sth,  2016, 1870, 760,  420, 530, 670,  770, 1090, 0.362),
        (v_sa2_surrey_sth,  2021, 2160, 890,  390, 480, 620,  780, 1370, 0.369)
    ) AS v(sa2_id, census_year, med_hh, med_pers, inc0, inc650, inc1250, inc2000, inc3000, gini)
    WHERE NOT EXISTS (
        SELECT 1 FROM abs_income i WHERE i.sa2_id = v.sa2_id AND i.census_year = v.census_year
    );

    -- ============================================================
    -- Education (14 SA2 × 2 years = 28 rows)
    -- ============================================================
    INSERT INTO abs_education (sa2_id, census_year, bachelor_or_higher, diploma_cert, year_12_or_equiv, below_year_12, attending_school, attending_tafe, attending_university, preschool_enrolled)
    SELECT v.sa2_id, v.census_year, v.bachelor, v.diploma, v.yr12, v.below12, v.att_sch, v.att_tafe, v.att_uni, v.preschool
    FROM (VALUES
        -- Balwyn 2016/2021
        (v_sa2_balwyn,      2016, 5977, 2205, 2348, 1424, 1994, 385, 1381, 499),
        (v_sa2_balwyn,      2021, 6551, 2234, 2383, 1326, 2084, 357, 1430, 536),
        -- Balwyn North 2016/2021
        (v_sa2_balwyn_nth,  2016, 6502, 2400, 2555, 1703, 2170, 418, 1393, 558),
        (v_sa2_balwyn_nth,  2021, 7133, 2432, 2594, 1587, 2270, 389, 1443, 600),
        -- Camberwell 2016/2021
        (v_sa2_camberwell,  2016, 7762, 2527, 2696, 1685, 2358, 472, 1820, 589),
        (v_sa2_camberwell,  2021, 8515, 2558, 2731, 1568, 2466, 441, 1885, 634),
        -- Canterbury 2016/2021
        (v_sa2_canterbury,  2016, 4108, 1268, 1311, 786, 1224, 219, 700, 315),
        (v_sa2_canterbury,  2021, 4503, 1282, 1330, 730, 1277, 203, 725, 339),
        -- Deepdene 2016/2021
        (v_sa2_deepdene,    2016, 3694, 1233, 1315, 870, 1150, 230, 780, 279),
        (v_sa2_deepdene,    2021, 4052, 1248, 1334, 811, 1201, 214, 808, 300),
        -- Glen Iris East 2016/2021
        (v_sa2_glen_iris_e, 2016, 5078, 1731, 1846, 1154, 1616, 323, 1108, 404),
        (v_sa2_glen_iris_e, 2021, 5569, 1751, 1870, 1074, 1689, 301, 1147, 434),
        -- Glen Iris West 2016/2021
        (v_sa2_glen_iris_w, 2016, 4464, 1557, 1661, 1038, 1453, 301, 1038, 363),
        (v_sa2_glen_iris_w, 2021, 4896, 1574, 1683, 967, 1522, 282, 1076, 391),
        -- Hawthorn 2016/2021
        (v_sa2_hawthorn,    2016, 7180, 2244, 2394, 1496, 2094, 449, 2094, 524),
        (v_sa2_hawthorn,    2021, 7884, 2274, 2428, 1394, 2199, 420, 2042, 565),
        -- Hawthorn East 2016/2021
        (v_sa2_hawthorn_e,  2016, 6152, 2051, 2187, 1367, 1914, 383, 1367, 479),
        (v_sa2_hawthorn_e,  2021, 6749, 2077, 2215, 1274, 2004, 357, 1417, 515),
        -- Kew 2016/2021
        (v_sa2_kew,         2016, 7507, 2448, 2611, 1632, 2285, 457, 1632, 572),
        (v_sa2_kew,         2021, 8234, 2479, 2646, 1521, 2391, 427, 1691, 615),
        -- Kew East 2016/2021
        (v_sa2_kew_e,       2016, 4342, 1530, 1628, 1086, 1382, 266, 829, 345),
        (v_sa2_kew_e,       2021, 4761, 1547, 1651, 1011, 1443, 247, 859, 371),
        -- Mont Albert 2016/2021
        (v_sa2_mont_albert, 2016, 3849, 1343, 1432, 1074, 1253, 250, 804, 313),
        (v_sa2_mont_albert, 2021, 4224, 1358, 1452, 1000, 1308, 233, 832, 337),
        -- Surrey Hills North 2016/2021
        (v_sa2_surrey_nth,  2016, 4047, 1412, 1506, 1035, 1318, 264, 903, 329),
        (v_sa2_surrey_nth,  2021, 4440, 1429, 1526, 963, 1378, 246, 935, 354),
        -- Surrey Hills South 2016/2021
        (v_sa2_surrey_sth,  2016, 3553, 1269, 1353, 1015, 1185, 237, 778, 296),
        (v_sa2_surrey_sth,  2021, 3896, 1284, 1372, 946, 1239, 221, 806, 319)
    ) AS v(sa2_id, census_year, bachelor, diploma, yr12, below12, att_sch, att_tafe, att_uni, preschool)
    WHERE NOT EXISTS (
        SELECT 1 FROM abs_education e WHERE e.sa2_id = v.sa2_id AND e.census_year = v.census_year
    );

    -- ============================================================
    -- Employment (14 SA2 × 2 years = 28 rows)
    -- ============================================================
    INSERT INTO abs_employment (sa2_id, census_year, labour_force_total, employed_full_time, employed_part_time, unemployed, not_in_labour_force, unemployment_rate, top_occupation_1, top_occupation_2, top_occupation_3, top_industry_1, top_industry_2, top_industry_3, commute_car, commute_public_transport, commute_walk_cycle, work_from_home)
    SELECT v.sa2_id, v.census_year, v.lf_total, v.emp_ft, v.emp_pt, v.unemp, v.nilf, v.unemp_rate,
           v.occ1, v.occ2, v.occ3, v.ind1, v.ind2, v.ind3, v.car, v.pt, v.walk, v.wfh
    FROM (VALUES
        -- Balwyn 2016
        (v_sa2_balwyn, 2016, 8396, 4869, 2855, 336, 4834, 4.0,
         'Professionals', 'Managers', 'Clerical and Administrative Workers',
         'Professional, Scientific and Technical Services', 'Education and Training', 'Health Care and Social Assistance',
         4198, 1931, 588, 756),
        -- Balwyn 2021
        (v_sa2_balwyn, 2021, 8786, 5008, 2988, 308, 5060, 3.5,
         'Professionals', 'Managers', 'Clerical and Administrative Workers',
         'Professional, Scientific and Technical Services', 'Education and Training', 'Health Care and Social Assistance',
         3778, 1845, 615, 2196),
        -- Balwyn North 2016
        (v_sa2_balwyn_nth, 2016, 8823, 5117, 3000, 353, 5557, 4.0,
         'Professionals', 'Managers', 'Clerical and Administrative Workers',
         'Professional, Scientific and Technical Services', 'Education and Training', 'Financial and Insurance Services',
         4500, 1941, 529, 794),
        -- Balwyn North 2021
        (v_sa2_balwyn_nth, 2021, 9240, 5266, 3142, 323, 5819, 3.5,
         'Professionals', 'Managers', 'Clerical and Administrative Workers',
         'Professional, Scientific and Technical Services', 'Education and Training', 'Financial and Insurance Services',
         3972, 1848, 554, 2310),
        -- Camberwell 2016
        (v_sa2_camberwell, 2016, 10110, 5859, 3437, 404, 5740, 4.0,
         'Professionals', 'Managers', 'Community and Personal Service Workers',
         'Professional, Scientific and Technical Services', 'Health Care and Social Assistance', 'Education and Training',
         4847, 2628, 708, 909),
        -- Camberwell 2021
        (v_sa2_camberwell, 2021, 10582, 6025, 3598, 370, 6006, 3.5,
         'Professionals', 'Managers', 'Community and Personal Service Workers',
         'Professional, Scientific and Technical Services', 'Health Care and Social Assistance', 'Education and Training',
         4233, 2487, 741, 2645),
        -- Canterbury 2016
        (v_sa2_canterbury, 2016, 4894, 2838, 1664, 166, 3346, 3.4,
         'Professionals', 'Managers', 'Clerical and Administrative Workers',
         'Professional, Scientific and Technical Services', 'Financial and Insurance Services', 'Education and Training',
         2398, 1126, 343, 440),
        -- Canterbury 2021
        (v_sa2_canterbury, 2021, 5112, 2920, 1739, 148, 3498, 2.9,
         'Professionals', 'Managers', 'Clerical and Administrative Workers',
         'Professional, Scientific and Technical Services', 'Financial and Insurance Services', 'Education and Training',
         2045, 1022, 358, 1278),
        -- Deepdene 2016
        (v_sa2_deepdene, 2016, 4761, 2761, 1619, 190, 2949, 4.0,
         'Professionals', 'Managers', 'Clerical and Administrative Workers',
         'Professional, Scientific and Technical Services', 'Education and Training', 'Health Care and Social Assistance',
         2333, 1095, 333, 428),
        -- Deepdene 2021
        (v_sa2_deepdene, 2021, 4979, 2843, 1694, 174, 3083, 3.5,
         'Professionals', 'Managers', 'Clerical and Administrative Workers',
         'Professional, Scientific and Technical Services', 'Education and Training', 'Health Care and Social Assistance',
         1991, 995, 349, 1244),
        -- Glen Iris East 2016
        (v_sa2_glen_iris_e, 2016, 6693, 3882, 2277, 267, 4247, 4.0,
         'Professionals', 'Managers', 'Community and Personal Service Workers',
         'Professional, Scientific and Technical Services', 'Health Care and Social Assistance', 'Financial and Insurance Services',
         3347, 1539, 469, 602),
        -- Glen Iris East 2021
        (v_sa2_glen_iris_e, 2021, 7006, 3993, 2382, 245, 4444, 3.5,
         'Professionals', 'Managers', 'Community and Personal Service Workers',
         'Professional, Scientific and Technical Services', 'Health Care and Social Assistance', 'Financial and Insurance Services',
         2873, 1471, 490, 1751),
        -- Glen Iris West 2016
        (v_sa2_glen_iris_w, 2016, 6124, 3551, 2082, 245, 3756, 4.0,
         'Professionals', 'Managers', 'Clerical and Administrative Workers',
         'Professional, Scientific and Technical Services', 'Health Care and Social Assistance', 'Education and Training',
         3001, 1470, 429, 551),
        -- Glen Iris West 2021
        (v_sa2_glen_iris_w, 2021, 6413, 3656, 2180, 225, 3932, 3.5,
         'Professionals', 'Managers', 'Clerical and Administrative Workers',
         'Professional, Scientific and Technical Services', 'Health Care and Social Assistance', 'Education and Training',
         2565, 1347, 449, 1603),
        -- Hawthorn 2016
        (v_sa2_hawthorn, 2016, 9277, 5380, 3152, 464, 4883, 5.0,
         'Professionals', 'Managers', 'Community and Personal Service Workers',
         'Professional, Scientific and Technical Services', 'Education and Training', 'Health Care and Social Assistance',
         4175, 2597, 834, 834),
        -- Hawthorn 2021
        (v_sa2_hawthorn, 2021, 9715, 5537, 3302, 340, 5124, 3.5,
         'Professionals', 'Managers', 'Community and Personal Service Workers',
         'Professional, Scientific and Technical Services', 'Education and Training', 'Health Care and Social Assistance',
         3498, 2429, 874, 2429),
        -- Hawthorn East 2016
        (v_sa2_hawthorn_e, 2016, 7903, 4583, 2688, 316, 4867, 4.0,
         'Professionals', 'Managers', 'Clerical and Administrative Workers',
         'Professional, Scientific and Technical Services', 'Health Care and Social Assistance', 'Financial and Insurance Services',
         3872, 1897, 553, 711),
        -- Hawthorn East 2021
        (v_sa2_hawthorn_e, 2021, 8279, 4719, 2815, 290, 5096, 3.5,
         'Professionals', 'Managers', 'Clerical and Administrative Workers',
         'Professional, Scientific and Technical Services', 'Health Care and Social Assistance', 'Financial and Insurance Services',
         3312, 1821, 580, 2070),
        -- Kew 2016
        (v_sa2_kew, 2016, 9630, 5585, 3274, 385, 5690, 4.0,
         'Professionals', 'Managers', 'Community and Personal Service Workers',
         'Professional, Scientific and Technical Services', 'Health Care and Social Assistance', 'Education and Training',
         4526, 2408, 770, 867),
        -- Kew 2021
        (v_sa2_kew, 2021, 10079, 5745, 3427, 353, 5958, 3.5,
         'Professionals', 'Managers', 'Community and Personal Service Workers',
         'Professional, Scientific and Technical Services', 'Health Care and Social Assistance', 'Education and Training',
         3831, 2218, 806, 2520),
        -- Kew East 2016
        (v_sa2_kew_e, 2016, 5723, 3319, 1946, 200, 3647, 3.5,
         'Professionals', 'Managers', 'Clerical and Administrative Workers',
         'Professional, Scientific and Technical Services', 'Education and Training', 'Financial and Insurance Services',
         2918, 1259, 401, 515),
        -- Kew East 2021
        (v_sa2_kew_e, 2021, 5990, 3414, 2036, 180, 3815, 3.0,
         'Professionals', 'Managers', 'Clerical and Administrative Workers',
         'Professional, Scientific and Technical Services', 'Education and Training', 'Financial and Insurance Services',
         2456, 1198, 419, 1498),
        -- Mont Albert 2016
        (v_sa2_mont_albert, 2016, 5191, 3011, 1765, 208, 3259, 4.0,
         'Professionals', 'Managers', 'Clerical and Administrative Workers',
         'Professional, Scientific and Technical Services', 'Education and Training', 'Health Care and Social Assistance',
         2700, 1142, 363, 467),
        -- Mont Albert 2021
        (v_sa2_mont_albert, 2021, 5428, 3094, 1845, 184, 3409, 3.4,
         'Professionals', 'Managers', 'Clerical and Administrative Workers',
         'Professional, Scientific and Technical Services', 'Education and Training', 'Health Care and Social Assistance',
         2279, 1086, 380, 1357),
        -- Surrey Hills North 2016
        (v_sa2_surrey_nth, 2016, 5552, 3220, 1888, 222, 3358, 4.0,
         'Professionals', 'Managers', 'Community and Personal Service Workers',
         'Professional, Scientific and Technical Services', 'Education and Training', 'Health Care and Social Assistance',
         2831, 1277, 388, 500),
        -- Surrey Hills North 2021
        (v_sa2_surrey_nth, 2021, 5810, 3312, 1975, 203, 3514, 3.5,
         'Professionals', 'Managers', 'Community and Personal Service Workers',
         'Professional, Scientific and Technical Services', 'Education and Training', 'Health Care and Social Assistance',
         2382, 1220, 407, 1453),
        -- Surrey Hills South 2016
        (v_sa2_surrey_sth, 2016, 4876, 2828, 1659, 195, 3184, 4.0,
         'Professionals', 'Managers', 'Clerical and Administrative Workers',
         'Professional, Scientific and Technical Services', 'Education and Training', 'Financial and Insurance Services',
         2487, 1073, 341, 439),
        -- Surrey Hills South 2021
        (v_sa2_surrey_sth, 2021, 5103, 2909, 1735, 174, 3332, 3.4,
         'Professionals', 'Managers', 'Clerical and Administrative Workers',
         'Professional, Scientific and Technical Services', 'Education and Training', 'Financial and Insurance Services',
         2092, 1021, 357, 1276)
    ) AS v(sa2_id, census_year, lf_total, emp_ft, emp_pt, unemp, nilf, unemp_rate,
           occ1, occ2, occ3, ind1, ind2, ind3, car, pt, walk, wfh)
    WHERE NOT EXISTS (
        SELECT 1 FROM abs_employment em WHERE em.sa2_id = v.sa2_id AND em.census_year = v.census_year
    );

    -- ============================================================
    -- Cultural Diversity (14 SA2 × 2 years = 28 rows)
    -- ============================================================
    INSERT INTO abs_cultural_diversity (sa2_id, census_year, born_australia, born_overseas, born_top_country_1, born_top_country_1_name, born_top_country_2, born_top_country_2_name, born_top_country_3, born_top_country_3_name, speaks_english_only, speaks_other_language, top_language_2, top_language_2_name, top_language_3, top_language_3_name, top_language_4, top_language_4_name, ancestry_top_1, ancestry_top_1_name, ancestry_top_2, ancestry_top_2_name, ancestry_top_3, ancestry_top_3_name)
    SELECT v.sa2_id, v.census_year, v.born_au, v.born_os,
           v.tc1, v.tc1_name, v.tc2, v.tc2_name, v.tc3, v.tc3_name,
           v.eng_only, v.other_lang,
           v.lang2, v.lang2_name, v.lang3, v.lang3_name, v.lang4, v.lang4_name,
           v.anc1, v.anc1_name, v.anc2, v.anc2_name, v.anc3, v.anc3_name
    FROM (VALUES
        -- Balwyn 2016
        (v_sa2_balwyn, 2016, 8538, 5692, 2136, 'China', 513, 'India', 399, 'Malaysia',
         9461, 4769, 1852, 'Mandarin', 855, 'Cantonese', 342, 'Hindi',
         4269, 'English', 3558, 'Australian', 2419, 'Chinese'),
        -- Balwyn 2021
        (v_sa2_balwyn, 2021, 8636, 6254, 2384, 'China', 596, 'India', 387, 'Malaysia',
         9482, 5408, 2115, 'Mandarin', 893, 'Cantonese', 417, 'Hindi',
         4319, 'English', 3575, 'Australian', 2831, 'Chinese'),
        -- Balwyn North 2016
        (v_sa2_balwyn_nth, 2016, 9288, 6192, 2571, 'China', 542, 'India', 464, 'Malaysia',
         10062, 5418, 2168, 'Mandarin', 1007, 'Cantonese', 356, 'Hindi',
         4644, 'English', 3870, 'Australian', 2787, 'Chinese'),
        -- Balwyn North 2021
        (v_sa2_balwyn_nth, 2021, 9402, 6808, 2917, 'China', 632, 'India', 454, 'Malaysia',
         10049, 6161, 2498, 'Mandarin', 1053, 'Cantonese', 438, 'Hindi',
         4701, 'English', 3891, 'Australian', 3242, 'Chinese'),
        -- Camberwell 2016
        (v_sa2_camberwell, 2016, 10952, 5898, 1685, 'China', 673, 'England', 505, 'New Zealand',
         12292, 4558, 1315, 'Mandarin', 674, 'Cantonese', 505, 'Greek',
         5729, 'English', 4549, 'Australian', 2527, 'Chinese'),
        -- Camberwell 2021
        (v_sa2_camberwell, 2021, 11101, 6519, 1938, 'China', 706, 'India', 529, 'England',
         12345, 5275, 1551, 'Mandarin', 706, 'Cantonese', 547, 'Hindi',
         5817, 'English', 4581, 'Australian', 2819, 'Chinese'),
        -- Canterbury 2016
        (v_sa2_canterbury, 2016, 6117, 2623, 437, 'England', 350, 'China', 262, 'New Zealand',
         6819, 1921, 306, 'Mandarin', 175, 'Cantonese', 175, 'Greek',
         3147, 'English', 2447, 'Australian', 1049, 'Irish'),
        -- Canterbury 2021
        (v_sa2_canterbury, 2021, 6202, 2918, 510, 'China', 365, 'England', 274, 'New Zealand',
         6935, 2185, 365, 'Mandarin', 183, 'Cantonese', 164, 'Greek',
         3192, 'English', 2462, 'Australian', 1094, 'Irish'),
        -- Deepdene 2016
        (v_sa2_deepdene, 2016, 5326, 2884, 780, 'China', 329, 'England', 246, 'New Zealand',
         6065, 2145, 624, 'Mandarin', 329, 'Cantonese', 164, 'Greek',
         2874, 'English', 2299, 'Australian', 1068, 'Chinese'),
        -- Deepdene 2021
        (v_sa2_deepdene, 2021, 5397, 3183, 901, 'China', 360, 'India', 257, 'England',
         6094, 2486, 729, 'Mandarin', 343, 'Cantonese', 206, 'Hindi',
         2915, 'English', 2317, 'Australian', 1201, 'Chinese'),
        -- Glen Iris East 2016
        (v_sa2_glen_iris_e, 2016, 7616, 3924, 923, 'China', 461, 'England', 346, 'New Zealand',
         8539, 3001, 692, 'Mandarin', 346, 'Cantonese', 346, 'Greek',
         3923, 'English', 3116, 'Australian', 1500, 'Chinese'),
        -- Glen Iris East 2021
        (v_sa2_glen_iris_e, 2021, 7730, 4350, 1087, 'China', 508, 'India', 362, 'England',
         8576, 3504, 820, 'Mandarin', 362, 'Cantonese', 362, 'Hindi',
         3984, 'English', 3142, 'Australian', 1690, 'Chinese'),
        -- Glen Iris West 2016
        (v_sa2_glen_iris_w, 2016, 6766, 3614, 831, 'China', 415, 'England', 311, 'India',
         7474, 2906, 623, 'Mandarin', 311, 'Greek', 311, 'Hindi',
         3529, 'English', 2802, 'Australian', 1349, 'Chinese'),
        -- Glen Iris West 2021
        (v_sa2_glen_iris_w, 2021, 6861, 4009, 978, 'China', 456, 'India', 326, 'England',
         7501, 3369, 739, 'Mandarin', 326, 'Cantonese', 326, 'Hindi',
         3582, 'English', 2827, 'Australian', 1522, 'Chinese'),
        -- Hawthorn 2016
        (v_sa2_hawthorn, 2016, 9872, 5088, 1197, 'China', 748, 'England', 599, 'India',
         10772, 4188, 898, 'Mandarin', 449, 'Cantonese', 449, 'Hindi',
         5088, 'English', 4039, 'Australian', 1946, 'Chinese'),
        -- Hawthorn 2021
        (v_sa2_hawthorn, 2021, 10049, 5661, 1414, 'China', 786, 'India', 628, 'England',
         10899, 4811, 1100, 'Mandarin', 471, 'Hindi', 471, 'Cantonese',
         5190, 'English', 4085, 'Australian', 2199, 'Chinese'),
        -- Hawthorn East 2016
        (v_sa2_hawthorn_e, 2016, 8886, 4784, 1093, 'China', 547, 'England', 410, 'India',
         9842, 3828, 820, 'Mandarin', 410, 'Cantonese', 342, 'Greek',
         4510, 'English', 3692, 'Australian', 1778, 'Chinese'),
        -- Hawthorn East 2021
        (v_sa2_hawthorn_e, 2021, 9001, 5309, 1288, 'China', 601, 'India', 430, 'England',
         9999, 4311, 973, 'Mandarin', 430, 'Hindi', 372, 'Cantonese',
         4579, 'English', 3721, 'Australian', 2004, 'Chinese'),
        -- Kew 2016
        (v_sa2_kew, 2016, 10608, 5712, 1306, 'China', 816, 'England', 653, 'India',
         11750, 4570, 979, 'Mandarin', 490, 'Cantonese', 490, 'Italian',
         5549, 'English', 4406, 'Australian', 2122, 'Chinese'),
        -- Kew 2021
        (v_sa2_kew, 2021, 10749, 6331, 1538, 'China', 854, 'India', 683, 'England',
         11881, 5199, 1196, 'Mandarin', 513, 'Hindi', 513, 'Cantonese',
         5634, 'English', 4441, 'Australian', 2392, 'Chinese'),
        -- Kew East 2016
        (v_sa2_kew_e, 2016, 6711, 3159, 592, 'China', 395, 'England', 296, 'Italy',
         7406, 2464, 444, 'Mandarin', 296, 'Italian', 197, 'Greek',
         3357, 'English', 2665, 'Australian', 1184, 'Chinese'),
        -- Kew East 2021
        (v_sa2_kew_e, 2021, 6806, 3504, 701, 'China', 433, 'India', 309, 'England',
         7439, 2871, 536, 'Mandarin', 309, 'Hindi', 206, 'Italian',
         3406, 'English', 2690, 'Australian', 1340, 'Chinese'),
        -- Mont Albert 2016
        (v_sa2_mont_albert, 2016, 5907, 3043, 626, 'China', 358, 'England', 268, 'India',
         6532, 2418, 447, 'Mandarin', 268, 'Cantonese', 179, 'Hindi',
         3042, 'English', 2414, 'Australian', 1074, 'Chinese'),
        -- Mont Albert 2021
        (v_sa2_mont_albert, 2021, 5985, 3365, 748, 'China', 374, 'India', 280, 'England',
         6545, 2805, 551, 'Mandarin', 280, 'Hindi', 187, 'Cantonese',
         3084, 'English', 2431, 'Australian', 1216, 'Chinese'),
        -- Surrey Hills North 2016
        (v_sa2_surrey_nth, 2016, 6305, 3105, 564, 'China', 376, 'England', 282, 'India',
         6870, 2540, 423, 'Mandarin', 282, 'Cantonese', 188, 'Greek',
         3199, 'English', 2541, 'Australian', 1129, 'Chinese'),
        -- Surrey Hills North 2021
        (v_sa2_surrey_nth, 2021, 6397, 3443, 679, 'China', 394, 'India', 295, 'England',
         6986, 2854, 532, 'Mandarin', 295, 'Hindi', 197, 'Cantonese',
         3248, 'English', 2558, 'Australian', 1280, 'Chinese'),
        -- Surrey Hills South 2016
        (v_sa2_surrey_sth, 2016, 5753, 2707, 508, 'China', 338, 'England', 254, 'India',
         6256, 2204, 381, 'Mandarin', 254, 'Cantonese', 169, 'Greek',
         2879, 'English', 2284, 'Australian', 1015, 'Chinese'),
        -- Surrey Hills South 2021
        (v_sa2_surrey_sth, 2021, 5832, 3018, 619, 'China', 354, 'India', 265, 'England',
         6280, 2570, 478, 'Mandarin', 265, 'Hindi', 177, 'Cantonese',
         2921, 'English', 2301, 'Australian', 1150, 'Chinese')
    ) AS v(sa2_id, census_year, born_au, born_os,
           tc1, tc1_name, tc2, tc2_name, tc3, tc3_name,
           eng_only, other_lang,
           lang2, lang2_name, lang3, lang3_name, lang4, lang4_name,
           anc1, anc1_name, anc2, anc2_name, anc3, anc3_name)
    WHERE NOT EXISTS (
        SELECT 1 FROM abs_cultural_diversity cd WHERE cd.sa2_id = v.sa2_id AND cd.census_year = v.census_year
    );

END $$;
