-- ============================================================
-- pg-00-council.sql
-- Bootstrap: Insert the Boroondara council record
-- Must run before seed data (other seeds reference councils)
-- ============================================================

INSERT INTO councils (council_name, council_code, state, abn, address, phone, email, website)
SELECT 'City of Boroondara', 'BORO', 'Victoria', '89 300 600 267',
       '8 Inglesby Rd, Camberwell VIC 3124',
       '03 9278 4444', 'boroondara@boroondara.vic.gov.au', 'https://www.boroondara.vic.gov.au'
WHERE NOT EXISTS (SELECT 1 FROM councils WHERE council_code = 'BORO');
