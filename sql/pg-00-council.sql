-- ============================================================
-- pg-00-council.sql
-- Bootstrap: Insert the Manningham council record
-- Must run before pg-02-seed-data.sql (other seeds reference councils)
-- ============================================================

INSERT INTO councils (council_name, council_code, state, abn, address, phone, email, website)
SELECT 'City of Manningham', 'MANN', 'Victoria', '89 068 780 481',
       '699 Doncaster Rd, Doncaster VIC 3108',
       '03 9840 9333', 'info@manningham.vic.gov.au', 'https://www.manningham.vic.gov.au'
WHERE NOT EXISTS (SELECT 1 FROM councils WHERE council_code = 'MANN');
