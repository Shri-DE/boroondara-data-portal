-- ============================================================
-- pg-04-alter-columns.sql
-- Add missing columns to existing tables so seed data can load.
-- Each ALTER is wrapped in a DO block with EXCEPTION handler
-- so it's safe to run multiple times (idempotent).
-- ============================================================

-- ap_invoice_lines: add org_unit_id
DO $$ BEGIN ALTER TABLE ap_invoice_lines ADD COLUMN org_unit_id UUID; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ar_invoices: add received_amount
DO $$ BEGIN ALTER TABLE ar_invoices ADD COLUMN received_amount NUMERIC(14,2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- receipts: add receipt_method
DO $$ BEGIN ALTER TABLE receipts ADD COLUMN receipt_method VARCHAR(30); EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- receipt_applications: add application_date
DO $$ BEGIN ALTER TABLE receipt_applications ADD COLUMN application_date DATE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- journal_headers: add journal_name, accounting_date, posting_date, created_by
DO $$ BEGIN ALTER TABLE journal_headers ADD COLUMN journal_name VARCHAR(200); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE journal_headers ADD COLUMN accounting_date DATE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE journal_headers ADD COLUMN posting_date DATE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE journal_headers ADD COLUMN created_by VARCHAR(120); EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- journal_lines: add council_id, org_unit_id, net_amount, currency_code
DO $$ BEGIN ALTER TABLE journal_lines ADD COLUMN council_id UUID REFERENCES councils(council_id); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE journal_lines ADD COLUMN org_unit_id UUID; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE journal_lines ADD COLUMN net_amount NUMERIC(14,2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE journal_lines ADD COLUMN currency_code VARCHAR(10) DEFAULT 'AUD'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- gl_balances: add org_unit_id, beginning_balance, ending_balance
DO $$ BEGIN ALTER TABLE gl_balances ADD COLUMN org_unit_id UUID; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE gl_balances ADD COLUMN beginning_balance NUMERIC(14,2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE gl_balances ADD COLUMN ending_balance NUMERIC(14,2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- budget_lines: add period_id
DO $$ BEGIN ALTER TABLE budget_lines ADD COLUMN period_id UUID; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- project_expenditures: add vendor_name, natural_account, org_unit_id
DO $$ BEGIN ALTER TABLE project_expenditures ADD COLUMN vendor_name VARCHAR(200); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE project_expenditures ADD COLUMN natural_account VARCHAR(20); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE project_expenditures ADD COLUMN org_unit_id UUID; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- payroll_cost_distributions: add council_id, employee_name, org_unit_id, distribution_percentage
DO $$ BEGIN ALTER TABLE payroll_cost_distributions ADD COLUMN council_id UUID REFERENCES councils(council_id); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE payroll_cost_distributions ADD COLUMN employee_name VARCHAR(200); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE payroll_cost_distributions ADD COLUMN org_unit_id UUID; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE payroll_cost_distributions ADD COLUMN distribution_percentage NUMERIC(5,2); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
