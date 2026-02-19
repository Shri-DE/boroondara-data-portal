-- ============================================================
-- pg-05-abs-ddl.sql
-- ABS Census data tables for City of Boroondara
-- ============================================================

-- SA2 Statistical Areas within Boroondara LGA
CREATE TABLE IF NOT EXISTS abs_sa2_areas (
    sa2_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id      UUID NOT NULL REFERENCES councils(council_id),
    sa2_code        VARCHAR(12) NOT NULL UNIQUE,
    sa2_name        VARCHAR(120) NOT NULL,
    lga_code        VARCHAR(10) NOT NULL DEFAULT '20310',
    lga_name        VARCHAR(120) NOT NULL DEFAULT 'Boroondara',
    area_sqkm       NUMERIC(8,2),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Demographics: population, age, gender per SA2 per census year
CREATE TABLE IF NOT EXISTS abs_demographics (
    demographic_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sa2_id              UUID NOT NULL REFERENCES abs_sa2_areas(sa2_id),
    census_year         INT NOT NULL,
    population_total    INT,
    population_male     INT,
    population_female   INT,
    median_age          NUMERIC(4,1),
    persons_0_14        INT,
    persons_15_24       INT,
    persons_25_44       INT,
    persons_45_64       INT,
    persons_65_plus     INT,
    indigenous_persons  INT,
    australian_citizens INT,
    UNIQUE (sa2_id, census_year)
);

-- Housing: dwelling types, tenure, costs per SA2
CREATE TABLE IF NOT EXISTS abs_housing (
    housing_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sa2_id                  UUID NOT NULL REFERENCES abs_sa2_areas(sa2_id),
    census_year             INT NOT NULL,
    total_dwellings         INT,
    separate_houses         INT,
    semi_detached           INT,
    apartments              INT,
    owned_outright          INT,
    owned_mortgage          INT,
    rented                  INT,
    median_rent_weekly      INT,
    median_mortgage_monthly INT,
    avg_household_size      NUMERIC(3,1),
    avg_bedrooms            NUMERIC(3,1),
    UNIQUE (sa2_id, census_year)
);

-- Income: household and personal income per SA2
CREATE TABLE IF NOT EXISTS abs_income (
    income_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sa2_id                  UUID NOT NULL REFERENCES abs_sa2_areas(sa2_id),
    census_year             INT NOT NULL,
    median_household_weekly INT,
    median_personal_weekly  INT,
    hh_income_0_649         INT,
    hh_income_650_1249      INT,
    hh_income_1250_1999     INT,
    hh_income_2000_2999     INT,
    hh_income_3000_plus     INT,
    gini_coefficient        NUMERIC(4,3),
    UNIQUE (sa2_id, census_year)
);

-- Education: qualifications, school attendance per SA2
CREATE TABLE IF NOT EXISTS abs_education (
    education_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sa2_id              UUID NOT NULL REFERENCES abs_sa2_areas(sa2_id),
    census_year         INT NOT NULL,
    bachelor_or_higher  INT,
    diploma_cert        INT,
    year_12_or_equiv    INT,
    below_year_12       INT,
    attending_school    INT,
    attending_tafe      INT,
    attending_university INT,
    preschool_enrolled  INT,
    UNIQUE (sa2_id, census_year)
);

-- Employment: labour force, occupation, industry, commute per SA2
CREATE TABLE IF NOT EXISTS abs_employment (
    employment_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sa2_id                  UUID NOT NULL REFERENCES abs_sa2_areas(sa2_id),
    census_year             INT NOT NULL,
    labour_force_total      INT,
    employed_full_time      INT,
    employed_part_time      INT,
    unemployed              INT,
    not_in_labour_force     INT,
    unemployment_rate       NUMERIC(4,1),
    top_occupation_1        VARCHAR(80),
    top_occupation_2        VARCHAR(80),
    top_occupation_3        VARCHAR(80),
    top_industry_1          VARCHAR(80),
    top_industry_2          VARCHAR(80),
    top_industry_3          VARCHAR(80),
    commute_car             INT,
    commute_public_transport INT,
    commute_walk_cycle      INT,
    work_from_home          INT,
    UNIQUE (sa2_id, census_year)
);

-- Cultural diversity: country of birth, languages, ancestry per SA2
CREATE TABLE IF NOT EXISTS abs_cultural_diversity (
    diversity_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sa2_id                  UUID NOT NULL REFERENCES abs_sa2_areas(sa2_id),
    census_year             INT NOT NULL,
    born_australia          INT,
    born_overseas           INT,
    born_top_country_1      INT,
    born_top_country_1_name VARCHAR(60),
    born_top_country_2      INT,
    born_top_country_2_name VARCHAR(60),
    born_top_country_3      INT,
    born_top_country_3_name VARCHAR(60),
    speaks_english_only     INT,
    speaks_other_language   INT,
    top_language_2          INT,
    top_language_2_name     VARCHAR(60),
    top_language_3          INT,
    top_language_3_name     VARCHAR(60),
    top_language_4          INT,
    top_language_4_name     VARCHAR(60),
    ancestry_top_1          INT,
    ancestry_top_1_name     VARCHAR(60),
    ancestry_top_2          INT,
    ancestry_top_2_name     VARCHAR(60),
    ancestry_top_3          INT,
    ancestry_top_3_name     VARCHAR(60),
    UNIQUE (sa2_id, census_year)
);
