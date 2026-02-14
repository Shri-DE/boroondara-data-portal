-- ============================================================
-- 01-ddl.sql
-- Enterprise Data Portal — Table definitions (reference SQL)
-- NOTE: This app now targets Microsoft Fabric Warehouse (T-SQL).
--       This file is kept as a reference for table structure.
--       Adapt syntax for Fabric Warehouse before executing.
-- ============================================================

-- =========================
--  ASSET DOMAIN
-- =========================

CREATE TABLE IF NOT EXISTS asset_categories (
    category_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code          VARCHAR(20)  NOT NULL UNIQUE,
    name          VARCHAR(100) NOT NULL,
    parent_category VARCHAR(100),
    useful_life_years INT,
    depreciation_rate NUMERIC(5,2),
    description   TEXT
);

CREATE TABLE IF NOT EXISTS asset_conditions (
    condition_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id         UUID NOT NULL REFERENCES assets(asset_id),
    assessment_date  DATE NOT NULL,
    condition_score  INT NOT NULL CHECK (condition_score BETWEEN 1 AND 5),
    condition_label  VARCHAR(30),
    inspector        VARCHAR(100),
    notes            TEXT,
    next_assessment  DATE
);

CREATE TABLE IF NOT EXISTS asset_locations (
    location_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code         VARCHAR(20)  NOT NULL UNIQUE,
    name         VARCHAR(120) NOT NULL,
    address      TEXT,
    suburb       VARCHAR(60),
    council_area VARCHAR(80),
    latitude     NUMERIC(10,7),
    longitude    NUMERIC(10,7),
    council_id   UUID REFERENCES councils(council_id)
);

-- =========================
--  PEOPLE & CULTURE
-- =========================

CREATE TABLE IF NOT EXISTS employees (
    employee_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id      UUID REFERENCES councils(council_id),
    employee_code   VARCHAR(20),
    first_name      VARCHAR(60),
    last_name       VARCHAR(60),
    email           VARCHAR(150),
    department      VARCHAR(80),
    position_title  VARCHAR(120),
    employment_type VARCHAR(30),
    start_date      DATE,
    status          VARCHAR(20),
    manager_name    VARCHAR(120),
    org_unit_id     UUID REFERENCES organizational_units(org_unit_id)
);

CREATE TABLE IF NOT EXISTS leave_balances (
    leave_balance_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id       UUID NOT NULL REFERENCES employees(employee_id),
    leave_type        VARCHAR(40),
    balance_hours     NUMERIC(10,2),
    accrued_this_year NUMERIC(10,2),
    taken_this_year   NUMERIC(10,2),
    as_of_date        DATE
);

CREATE TABLE IF NOT EXISTS positions (
    position_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id      UUID REFERENCES councils(council_id),
    position_code   VARCHAR(20),
    title           VARCHAR(120),
    department      VARCHAR(80),
    classification  VARCHAR(60),
    fte             NUMERIC(4,2),
    is_vacant       BOOLEAN DEFAULT FALSE,
    org_unit_id     UUID REFERENCES organizational_units(org_unit_id)
);

-- =========================
--  CUSTOMER SERVICES
-- =========================

CREATE TABLE IF NOT EXISTS service_requests (
    request_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id      UUID REFERENCES councils(council_id),
    request_number  VARCHAR(30),
    category        VARCHAR(80),
    subcategory     VARCHAR(80),
    description     TEXT,
    status          VARCHAR(30),
    priority        VARCHAR(20),
    reported_date   DATE,
    resolved_date   DATE,
    customer_name   VARCHAR(120),
    suburb          VARCHAR(60),
    assigned_to     VARCHAR(120)
);

CREATE TABLE IF NOT EXISTS service_categories (
    category_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(80) NOT NULL,
    parent_category VARCHAR(80),
    description     TEXT,
    sla_days        INT
);

CREATE TABLE IF NOT EXISTS customer_feedback (
    feedback_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id      UUID REFERENCES councils(council_id),
    request_id      UUID,
    rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    submitted_date  DATE,
    channel         VARCHAR(40)
);

-- =========================
--  GOVERNANCE
-- =========================

CREATE TABLE IF NOT EXISTS council_meetings (
    meeting_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id    UUID REFERENCES councils(council_id),
    meeting_type  VARCHAR(40),
    meeting_date  DATE NOT NULL,
    start_time    TIME,
    end_time      TIME,
    location      VARCHAR(120),
    status        VARCHAR(30),
    minutes_url   TEXT
);

CREATE TABLE IF NOT EXISTS meeting_resolutions (
    resolution_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id        UUID NOT NULL REFERENCES council_meetings(meeting_id),
    resolution_number VARCHAR(30),
    title             TEXT,
    description       TEXT,
    mover             VARCHAR(100),
    seconder          VARCHAR(100),
    status            VARCHAR(30),
    vote_for          INT,
    vote_against      INT,
    vote_abstain      INT
);

CREATE TABLE IF NOT EXISTS compliance_registers (
    register_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id          UUID REFERENCES councils(council_id),
    obligation_name     VARCHAR(200),
    legislation         VARCHAR(200),
    responsible_officer VARCHAR(120),
    compliance_status   VARCHAR(30),
    due_date            DATE,
    last_review_date    DATE,
    next_review_date    DATE,
    notes               TEXT
);

-- =========================
--  FACILITIES / WASTE / INFRASTRUCTURE
-- =========================

CREATE TABLE IF NOT EXISTS work_orders (
    work_order_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id          UUID REFERENCES councils(council_id),
    work_order_number   VARCHAR(30),
    asset_id            UUID,
    description         TEXT,
    work_type           VARCHAR(40),
    priority            VARCHAR(20),
    status              VARCHAR(30),
    requested_date      DATE,
    scheduled_date      DATE,
    completed_date      DATE,
    assigned_to         VARCHAR(120),
    estimated_cost      NUMERIC(14,2),
    actual_cost         NUMERIC(14,2)
);

CREATE TABLE IF NOT EXISTS waste_collection_routes (
    route_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id        UUID REFERENCES councils(council_id),
    route_code        VARCHAR(20),
    route_name        VARCHAR(100),
    waste_type        VARCHAR(40),
    collection_day    VARCHAR(20),
    frequency         VARCHAR(30),
    suburb_coverage   TEXT,
    households        INT,
    contractor        VARCHAR(120)
);

CREATE TABLE IF NOT EXISTS facility_bookings (
    booking_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id    UUID REFERENCES councils(council_id),
    facility_name VARCHAR(120),
    booked_by     VARCHAR(120),
    booking_date  DATE,
    start_time    TIME,
    end_time      TIME,
    purpose       VARCHAR(200),
    attendees     INT,
    status        VARCHAR(30),
    fee_amount    NUMERIC(10,2)
);

-- =========================
--  ALTER existing tables
-- =========================

ALTER TABLE assets ADD COLUMN IF NOT EXISTS category_id  UUID;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS location_id  UUID;

-- Widen ABN columns to support formatted ABNs (e.g. "16 055 331 264" = 14 chars)
ALTER TABLE councils  ALTER COLUMN abn TYPE VARCHAR(14);
ALTER TABLE suppliers ALTER COLUMN abn TYPE VARCHAR(14);
ALTER TABLE customers ALTER COLUMN abn TYPE VARCHAR(14);

-- Add gen_random_uuid() defaults to pre-existing tables that lack them
ALTER TABLE organizational_units     ALTER COLUMN org_unit_id       SET DEFAULT gen_random_uuid();
ALTER TABLE chart_of_accounts        ALTER COLUMN coa_id            SET DEFAULT gen_random_uuid();
ALTER TABLE accounting_periods       ALTER COLUMN period_id         SET DEFAULT gen_random_uuid();
ALTER TABLE suppliers                ALTER COLUMN supplier_id       SET DEFAULT gen_random_uuid();
ALTER TABLE customers                ALTER COLUMN customer_id       SET DEFAULT gen_random_uuid();
ALTER TABLE projects                 ALTER COLUMN project_id        SET DEFAULT gen_random_uuid();
ALTER TABLE project_tasks            ALTER COLUMN task_id           SET DEFAULT gen_random_uuid();
ALTER TABLE assets                   ALTER COLUMN asset_id          SET DEFAULT gen_random_uuid();
ALTER TABLE asset_depreciation       ALTER COLUMN depreciation_id   SET DEFAULT gen_random_uuid();
ALTER TABLE ap_invoices              ALTER COLUMN ap_invoice_id     SET DEFAULT gen_random_uuid();
ALTER TABLE ap_invoice_lines         ALTER COLUMN line_id           SET DEFAULT gen_random_uuid();
ALTER TABLE payments                 ALTER COLUMN payment_id        SET DEFAULT gen_random_uuid();
ALTER TABLE ar_invoices              ALTER COLUMN ar_invoice_id     SET DEFAULT gen_random_uuid();
ALTER TABLE receipts                 ALTER COLUMN receipt_id        SET DEFAULT gen_random_uuid();
ALTER TABLE receipt_applications     ALTER COLUMN application_id    SET DEFAULT gen_random_uuid();
ALTER TABLE journal_headers          ALTER COLUMN journal_header_id SET DEFAULT gen_random_uuid();
ALTER TABLE journal_lines            ALTER COLUMN journal_line_id   SET DEFAULT gen_random_uuid();
ALTER TABLE gl_balances              ALTER COLUMN balance_id        SET DEFAULT gen_random_uuid();
ALTER TABLE budget_lines             ALTER COLUMN budget_line_id    SET DEFAULT gen_random_uuid();
ALTER TABLE project_expenditures     ALTER COLUMN expenditure_id    SET DEFAULT gen_random_uuid();
ALTER TABLE payroll_cost_distributions ALTER COLUMN distribution_id SET DEFAULT gen_random_uuid();
ALTER TABLE payroll_runs             ALTER COLUMN payroll_run_id    SET DEFAULT gen_random_uuid();
ALTER TABLE councils                 ALTER COLUMN council_id        SET DEFAULT gen_random_uuid();
