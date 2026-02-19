-- ============================================================
-- pg-01-ddl.sql
-- Enterprise Data Portal — PostgreSQL table definitions
-- Target: Azure Database for PostgreSQL Flexible Server
-- ============================================================

-- gen_random_uuid() is built-in on PostgreSQL 13+.
-- pgcrypto is only needed for older versions — skip if unavailable.
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pgcrypto not available — using built-in gen_random_uuid()';
END $$;

-- =========================
--  CORE: Councils
-- =========================
CREATE TABLE IF NOT EXISTS councils (
    council_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_name  VARCHAR(120) NOT NULL,
    council_code  VARCHAR(20),
    state         VARCHAR(30) DEFAULT 'Victoria',
    abn           VARCHAR(14),
    address       TEXT,
    phone         VARCHAR(30),
    email         VARCHAR(150),
    website       VARCHAR(200),
    is_active     BOOLEAN DEFAULT TRUE
);

-- =========================
--  ORGANIZATIONAL UNITS
-- =========================
CREATE TABLE IF NOT EXISTS organizational_units (
    org_unit_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id    UUID REFERENCES councils(council_id),
    unit_code     VARCHAR(20) NOT NULL,
    unit_name     VARCHAR(120) NOT NULL,
    unit_type     VARCHAR(40),
    parent_unit_id UUID,
    is_active     BOOLEAN DEFAULT TRUE
);

-- =========================
--  CHART OF ACCOUNTS
-- =========================
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    coa_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id          UUID REFERENCES councils(council_id),
    segment_code        VARCHAR(20) NOT NULL,
    segment_name        VARCHAR(120) NOT NULL,
    account_type        VARCHAR(30),
    account_classification VARCHAR(60),
    parent_segment_code VARCHAR(20),
    is_active           BOOLEAN DEFAULT TRUE
);

-- =========================
--  ACCOUNTING PERIODS
-- =========================
CREATE TABLE IF NOT EXISTS accounting_periods (
    period_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id   UUID REFERENCES councils(council_id),
    period_code  VARCHAR(20) NOT NULL,
    period_name  VARCHAR(60),
    period_type  VARCHAR(20),
    fiscal_year  VARCHAR(10),
    start_date   DATE,
    end_date     DATE,
    is_closed    BOOLEAN DEFAULT FALSE
);

-- =========================
--  SUPPLIERS
-- =========================
CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id     UUID REFERENCES councils(council_id),
    supplier_code  VARCHAR(20) NOT NULL,
    supplier_name  VARCHAR(200) NOT NULL,
    abn            VARCHAR(14),
    supplier_type  VARCHAR(40),
    payment_terms  VARCHAR(30),
    is_active      BOOLEAN DEFAULT TRUE
);

-- =========================
--  CUSTOMERS
-- =========================
CREATE TABLE IF NOT EXISTS customers (
    customer_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id     UUID REFERENCES councils(council_id),
    customer_code  VARCHAR(20) NOT NULL,
    customer_name  VARCHAR(200) NOT NULL,
    abn            VARCHAR(14),
    customer_type  VARCHAR(40),
    is_active      BOOLEAN DEFAULT TRUE
);

-- =========================
--  ASSETS
-- =========================
CREATE TABLE IF NOT EXISTS assets (
    asset_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id              UUID REFERENCES councils(council_id),
    asset_number            VARCHAR(30) NOT NULL,
    asset_description       TEXT,
    asset_category          VARCHAR(80),
    org_unit_id             UUID,
    location                VARCHAR(120),
    acquisition_date        DATE,
    acquisition_cost        NUMERIC(14,2),
    depreciation_method     VARCHAR(40),
    useful_life_years       INT,
    salvage_value           NUMERIC(14,2) DEFAULT 0,
    accumulated_depreciation NUMERIC(14,2) DEFAULT 0,
    net_book_value          NUMERIC(14,2) DEFAULT 0,
    status                  VARCHAR(30) DEFAULT 'Active',
    category_id             UUID,
    location_id             UUID
);

-- =========================
--  ASSET DEPRECIATION
-- =========================
CREATE TABLE IF NOT EXISTS asset_depreciation (
    depreciation_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id                  UUID NOT NULL REFERENCES assets(asset_id),
    council_id                UUID REFERENCES councils(council_id),
    period_id                 UUID,
    depreciation_date         DATE,
    depreciation_amount       NUMERIC(14,2),
    accumulated_depreciation  NUMERIC(14,2),
    net_book_value            NUMERIC(14,2),
    natural_account_expense   VARCHAR(20),
    natural_account_accumulated VARCHAR(20)
);

-- =========================
--  ASSET CATEGORIES
-- =========================
CREATE TABLE IF NOT EXISTS asset_categories (
    category_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code              VARCHAR(20) NOT NULL UNIQUE,
    name              VARCHAR(100) NOT NULL,
    parent_category   VARCHAR(100),
    useful_life_years INT,
    depreciation_rate NUMERIC(5,2),
    description       TEXT
);

-- =========================
--  ASSET CONDITIONS
-- =========================
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

-- =========================
--  ASSET LOCATIONS
-- =========================
CREATE TABLE IF NOT EXISTS asset_locations (
    location_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code         VARCHAR(20) NOT NULL UNIQUE,
    name         VARCHAR(120) NOT NULL,
    address      TEXT,
    suburb       VARCHAR(60),
    council_area VARCHAR(80),
    latitude     NUMERIC(10,7),
    longitude    NUMERIC(10,7),
    council_id   UUID REFERENCES councils(council_id)
);

-- =========================
--  PROJECTS
-- =========================
CREATE TABLE IF NOT EXISTS projects (
    project_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id      UUID REFERENCES councils(council_id),
    project_code    VARCHAR(20) NOT NULL,
    project_name    VARCHAR(200) NOT NULL,
    project_type    VARCHAR(30),
    org_unit_id     UUID,
    total_budget    NUMERIC(14,2) DEFAULT 0,
    total_actual    NUMERIC(14,2) DEFAULT 0,
    total_committed NUMERIC(14,2) DEFAULT 0,
    status          VARCHAR(30),
    start_date      DATE,
    completion_date DATE,
    manager_name    VARCHAR(120)
);

-- =========================
--  PROJECT TASKS
-- =========================
CREATE TABLE IF NOT EXISTS project_tasks (
    task_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id   UUID NOT NULL REFERENCES projects(project_id),
    task_number  VARCHAR(20),
    task_name    VARCHAR(200),
    budget       NUMERIC(14,2) DEFAULT 0,
    actual       NUMERIC(14,2) DEFAULT 0
);

-- =========================
--  PROJECT EXPENDITURES
-- =========================
CREATE TABLE IF NOT EXISTS project_expenditures (
    expenditure_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id        UUID NOT NULL REFERENCES projects(project_id),
    council_id        UUID REFERENCES councils(council_id),
    task_id           UUID,
    expenditure_date  DATE,
    amount            NUMERIC(14,2),
    expenditure_type  VARCHAR(40),
    description       TEXT,
    supplier_id       UUID
);

-- =========================
--  GL BALANCES
-- =========================
CREATE TABLE IF NOT EXISTS gl_balances (
    balance_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id       UUID REFERENCES councils(council_id),
    period_id        UUID,
    natural_account  VARCHAR(20),
    cost_centre      VARCHAR(20),
    begin_balance    NUMERIC(14,2) DEFAULT 0,
    period_activity  NUMERIC(14,2) DEFAULT 0,
    end_balance      NUMERIC(14,2) DEFAULT 0,
    ytd_activity     NUMERIC(14,2) DEFAULT 0,
    budget_amount    NUMERIC(14,2) DEFAULT 0
);

-- =========================
--  BUDGET LINES
-- =========================
CREATE TABLE IF NOT EXISTS budget_lines (
    budget_line_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id      UUID REFERENCES councils(council_id),
    fiscal_year     VARCHAR(10),
    natural_account VARCHAR(20),
    cost_centre     VARCHAR(20),
    org_unit_id     UUID,
    budget_amount   NUMERIC(14,2) DEFAULT 0,
    budget_type     VARCHAR(30),
    budget_name     VARCHAR(120),
    description     TEXT
);

-- =========================
--  AP INVOICES
-- =========================
CREATE TABLE IF NOT EXISTS ap_invoices (
    ap_invoice_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id     UUID REFERENCES councils(council_id),
    supplier_id    UUID,
    invoice_number VARCHAR(30),
    invoice_date   DATE,
    due_date       DATE,
    invoice_amount NUMERIC(14,2),
    tax_amount     NUMERIC(14,2) DEFAULT 0,
    total_amount   NUMERIC(14,2),
    paid_amount    NUMERIC(14,2) DEFAULT 0,
    status         VARCHAR(30),
    description    TEXT,
    org_unit_id    UUID
);

-- =========================
--  AP INVOICE LINES
-- =========================
CREATE TABLE IF NOT EXISTS ap_invoice_lines (
    line_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ap_invoice_id  UUID NOT NULL REFERENCES ap_invoices(ap_invoice_id),
    line_number    INT,
    description    TEXT,
    amount         NUMERIC(14,2),
    tax_amount     NUMERIC(14,2) DEFAULT 0,
    natural_account VARCHAR(20),
    cost_centre    VARCHAR(20)
);

-- =========================
--  PAYMENTS
-- =========================
CREATE TABLE IF NOT EXISTS payments (
    payment_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id     UUID REFERENCES councils(council_id),
    supplier_id    UUID,
    payment_number VARCHAR(30),
    payment_date   DATE,
    payment_amount NUMERIC(14,2),
    payment_method VARCHAR(30),
    bank_account   VARCHAR(40),
    status         VARCHAR(30),
    ap_invoice_id  UUID
);

-- =========================
--  AR INVOICES
-- =========================
CREATE TABLE IF NOT EXISTS ar_invoices (
    ar_invoice_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id     UUID REFERENCES councils(council_id),
    customer_id    UUID,
    invoice_number VARCHAR(30),
    invoice_date   DATE,
    due_date       DATE,
    invoice_amount NUMERIC(14,2),
    tax_amount     NUMERIC(14,2) DEFAULT 0,
    total_amount   NUMERIC(14,2),
    paid_amount    NUMERIC(14,2) DEFAULT 0,
    status         VARCHAR(30),
    description    TEXT
);

-- =========================
--  RECEIPTS
-- =========================
CREATE TABLE IF NOT EXISTS receipts (
    receipt_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id     UUID REFERENCES councils(council_id),
    customer_id    UUID,
    receipt_number VARCHAR(30),
    receipt_date   DATE,
    receipt_amount NUMERIC(14,2),
    payment_method VARCHAR(30),
    status         VARCHAR(30)
);

-- =========================
--  RECEIPT APPLICATIONS
-- =========================
CREATE TABLE IF NOT EXISTS receipt_applications (
    application_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id      UUID NOT NULL REFERENCES receipts(receipt_id),
    ar_invoice_id   UUID,
    applied_amount  NUMERIC(14,2)
);

-- =========================
--  JOURNAL HEADERS
-- =========================
CREATE TABLE IF NOT EXISTS journal_headers (
    journal_header_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id        UUID REFERENCES councils(council_id),
    journal_number    VARCHAR(30),
    journal_date      DATE,
    period_id         UUID,
    description       TEXT,
    journal_source    VARCHAR(40),
    status            VARCHAR(30),
    posted_by         VARCHAR(120),
    total_debit       NUMERIC(14,2) DEFAULT 0,
    total_credit      NUMERIC(14,2) DEFAULT 0
);

-- =========================
--  JOURNAL LINES
-- =========================
CREATE TABLE IF NOT EXISTS journal_lines (
    journal_line_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_header_id UUID NOT NULL REFERENCES journal_headers(journal_header_id),
    line_number       INT,
    natural_account   VARCHAR(20),
    cost_centre       VARCHAR(20),
    debit_amount      NUMERIC(14,2) DEFAULT 0,
    credit_amount     NUMERIC(14,2) DEFAULT 0,
    description       TEXT
);

-- =========================
--  PAYROLL RUNS
-- =========================
CREATE TABLE IF NOT EXISTS payroll_runs (
    payroll_run_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    council_id      UUID REFERENCES councils(council_id),
    run_code        VARCHAR(20),
    run_date        DATE,
    period_start    DATE,
    period_end      DATE,
    pay_frequency   VARCHAR(20),
    total_gross     NUMERIC(14,2) DEFAULT 0,
    total_tax       NUMERIC(14,2) DEFAULT 0,
    total_super     NUMERIC(14,2) DEFAULT 0,
    total_net       NUMERIC(14,2) DEFAULT 0,
    employee_count  INT DEFAULT 0,
    status          VARCHAR(30)
);

-- =========================
--  PAYROLL COST DISTRIBUTIONS
-- =========================
CREATE TABLE IF NOT EXISTS payroll_cost_distributions (
    distribution_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_run_id   UUID NOT NULL REFERENCES payroll_runs(payroll_run_id),
    employee_id      UUID,
    natural_account  VARCHAR(20),
    cost_centre      VARCHAR(20),
    amount           NUMERIC(14,2),
    distribution_type VARCHAR(40)
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
    org_unit_id     UUID
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
    org_unit_id     UUID
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
--  SPATIAL TABLES (PostGIS)
--  NOTE: Moved to pg-02-spatial-ddl.sql so PostGIS failures
--        do not block creation of core tables.
-- =========================
