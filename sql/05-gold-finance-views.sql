-- ============================================================
-- 05-gold-finance-views.sql
-- Gold-layer views for Finance Agent — City of Boroondara
--
-- These views query Oracle Fusion silver tables in the
-- Fabric Lakehouse via three-part naming:
--   lh_silver.oracle_fusion.<table_name>
--
-- Target schema: edp (Fabric Warehouse)
-- ============================================================

-- =========================
--  REFERENCE / DIMENSION VIEWS
-- =========================

-- ── Chart of Accounts (GL Code Combinations) ──
CREATE VIEW edp.chart_of_accounts AS
SELECT
    gcc.codecombinationcodecombinationid       AS code_combination_id,
    gcc.codecombinationchartofaccountsid        AS chart_of_accounts_id,
    gcc.codecombinationsegment1                 AS segment1,
    gcc.codecombinationsegment2                 AS segment2,
    gcc.codecombinationsegment3                 AS segment3,
    gcc.codecombinationsegment4                 AS segment4,
    gcc.codecombinationsegment5                 AS segment5,
    gcc.codecombinationsegment6                 AS segment6,
    gcc.codecombinationaccounttype              AS account_type,
    gcc.codecombinationfinancialcategory        AS financial_category,
    gcc.codecombinationenabledflag              AS enabled_flag,
    gcc.codecombinationsummaryflag              AS summary_flag
FROM lh_silver.oracle_fusion.gl_code_combinations gcc
WHERE gcc.codecombinationenabledflag = 'Y';
GO

-- ── Ledgers ──
CREATE VIEW edp.ledgers AS
SELECT
    l.ledgerledgerid                            AS ledger_id,
    l.ledgername                                AS ledger_name,
    l.ledgershortname                           AS short_name,
    l.ledgercurrencycode                        AS currency_code,
    l.ledgerchartofaccountsid                   AS chart_of_accounts_id,
    l.ledgerledgercategorycode                  AS ledger_category,
    l.ledgerperiodsetname                       AS period_set_name
FROM lh_silver.oracle_fusion.gl_ledgers l;
GO

-- ── GL Periods (Accounting Periods) ──
CREATE VIEW edp.accounting_periods AS
SELECT
    p.periodperiodname                          AS period_name,
    p.periodenteredperiodname                   AS entered_period_name,
    p.periodperiodsetname                       AS period_set_name,
    p.periodperiodtype                          AS period_type,
    p.periodperiodnum                           AS period_num,
    p.periodperiodyear                          AS fiscal_year,
    p.periodquarternum                          AS quarter_num,
    p.periodstartdate                           AS start_date,
    p.periodenddate                             AS end_date,
    p.periodadjustmentperiodflag                AS adjustment_period_flag
FROM lh_silver.oracle_fusion.gl_periods p;
GO

-- ── Suppliers (poz_suppliers_v — NO prefix on columns) ──
CREATE VIEW edp.suppliers AS
SELECT
    s.vendorid                                  AS supplier_id,
    s.partyid                                   AS party_id,
    s.segment1                                  AS supplier_number,
    s.businessrelationship                      AS business_relationship,
    s.vendortypelookupcode                      AS supplier_type,
    s.creationsource                            AS creation_source,
    s.alternatenamepartyname                    AS supplier_name,
    s.enddateactive                             AS end_date_active
FROM lh_silver.oracle_fusion.poz_suppliers_v s;
GO

-- ── Supplier Sites (poz_supplier_sites_all_m — NO prefix on columns) ──
CREATE VIEW edp.supplier_sites AS
SELECT
    ss.vendorsiteid                             AS supplier_site_id,
    ss.vendorid                                 AS supplier_id,
    ss.vendorsitecode                           AS site_code,
    ss.vendorsitecodealt                        AS site_code_alt,
    ss.invoicecurrencycode                      AS invoice_currency_code,
    ss.paymentcurrencycode                      AS payment_currency_code,
    ss.emailaddress                             AS email_address,
    ss.purchasingsiteflag                       AS purchasing_site_flag,
    ss.paysiteflag                              AS pay_site_flag,
    ss.holdflag                                 AS hold_flag,
    ss.inactivedate                             AS inactive_date
FROM lh_silver.oracle_fusion.poz_supplier_sites_all_m ss;
GO

-- ── Organizations (hr tables — organizationunitpeo/organizationunittranslationpeo prefix) ──
CREATE VIEW edp.organizations AS
SELECT
    o.organizationid                            AS organization_id,
    o.organizationunitpeobusinessgroupid        AS business_group_id,
    o.organizationunitpeolocationid             AS location_id,
    t.organizationunittranslationpeoname        AS organization_name,
    o.effectivestartdate                        AS effective_start_date,
    o.effectiveenddate                          AS effective_end_date
FROM lh_silver.oracle_fusion.hr_all_organization_units_f o
LEFT JOIN lh_silver.oracle_fusion.hr_organization_units_f_tl t
    ON o.organizationid = t.organizationid
    AND t.language = 'US'
    AND o.effectivestartdate = t.effectivestartdate;
GO

-- ── Business Units ──
CREATE VIEW edp.business_units AS
SELECT
    bu.businessunitid                           AS business_unit_id,
    bu.name                                     AS business_unit_name
FROM lh_silver.oracle_fusion.fun_all_business_units_v bu;
GO

-- ── Legal Entities ──
CREATE VIEW edp.legal_entities AS
SELECT
    le.legalentitylegalentityid                 AS legal_entity_id,
    le.legalentitypartyid                       AS party_id,
    le.legalentityname                          AS legal_entity_name,
    le.legalentitylegalemployerflag             AS legal_employer_flag,
    le.legalentitytransactingentityflag         AS transacting_entity_flag
FROM lh_silver.oracle_fusion.xle_entity_profiles le;
GO

-- =========================
--  GENERAL LEDGER VIEWS
-- =========================

-- ── GL Balances ──
CREATE VIEW edp.gl_balances AS
SELECT
    gb.balanceledgerid                          AS ledger_id,
    gb.balancecodecombinationid                AS code_combination_id,
    gb.balancecurrencycode                     AS currency_code,
    gb.balanceperiodname                       AS period_name,
    gb.balanceperiodnum                        AS period_num,
    gb.balanceperiodyear                       AS fiscal_year,
    gb.balanceactualflag                       AS actual_flag,
    gb.balancebeginbalancedr                   AS begin_balance_dr,
    gb.balancebeginbalancecr                   AS begin_balance_cr,
    gb.balanceperiodnetdr                      AS period_net_dr,
    gb.balanceperiodnetcr                      AS period_net_cr,
    gb.balancebeginbalancedrbeq                AS begin_balance_dr_beq,
    gb.balancebeginbalancecrbeq                AS begin_balance_cr_beq,
    gb.balanceperiodnetdrbeq                   AS period_net_dr_beq,
    gb.balanceperiodnetcrbeq                   AS period_net_cr_beq,
    gb.balanceprojecttodatedr                  AS project_to_date_dr,
    gb.balanceprojecttodatecr                  AS project_to_date_cr,
    gb.balancequartertodatedr                  AS quarter_to_date_dr,
    gb.balancequartertodatecr                  AS quarter_to_date_cr,
    gb.balancetranslatedflag                   AS translated_flag,
    gb.balanceencumbrancetypeid                AS encumbrance_type_id
FROM lh_silver.oracle_fusion.gl_balances gb;
GO

-- ── Journal Batches ──
CREATE VIEW edp.gl_journal_batches AS
SELECT
    jb.journalbatchjebatchid                   AS je_batch_id,
    jb.journalbatchname                        AS batch_name,
    jb.journalbatchdescription                 AS description,
    jb.journalbatchjesource                    AS journal_source,
    jb.journalbatchdefaultperiodname           AS period_name,
    jb.journalbatchperiodsetname               AS period_set_name,
    jb.journalbatchactualflag                  AS actual_flag,
    jb.journalbatchstatus                      AS status,
    jb.journalbatchapprovalstatuscode          AS approval_status,
    jb.journalbatchrunningtotalaccountedcr      AS running_total_accounted_cr,
    jb.journalbatchrunningtotalaccounteddr      AS running_total_accounted_dr,
    jb.journalbatchrunningtotalcr               AS running_total_cr,
    jb.journalbatchrunningtotaldr               AS running_total_dr,
    jb.journalbatchdatecreated                 AS date_created,
    jb.journalbatchdefaulteffectivedate        AS effective_date,
    jb.journalbatchposteddate                  AS posted_date
FROM lh_silver.oracle_fusion.gl_je_batches jb;
GO

-- ── Journal Headers ──
CREATE VIEW edp.gl_journal_headers AS
SELECT
    jh.jeheaderid                              AS je_header_id,
    jh.gljeheadersjebatchid                    AS je_batch_id,
    jh.gljeheadersledgerid                     AS ledger_id,
    jh.gljeheadersname                         AS journal_name,
    jh.gljeheadersdescription                  AS description,
    jh.gljeheadersjesource                     AS journal_source,
    jh.gljeheadersjecategory                   AS journal_category,
    jh.gljeheaderscurrencycode                 AS currency_code,
    jh.gljeheadersperiodname                   AS period_name,
    jh.gljeheadersactualflag                   AS actual_flag,
    jh.gljeheadersstatus                       AS status,
    jh.gljeheadersrunningtotalaccountedcr       AS running_total_accounted_cr,
    jh.gljeheadersrunningtotalaccounteddr       AS running_total_accounted_dr,
    jh.gljeheadersrunningtotalcr                AS running_total_cr,
    jh.gljeheadersrunningtotaldr                AS running_total_dr,
    jh.gljeheadersdatecreated                  AS date_created,
    jh.gljeheadersdefaulteffectivedate         AS effective_date,
    jh.gljeheadersposteddate                   AS posted_date
FROM lh_silver.oracle_fusion.gl_je_headers jh;
GO

-- ── Journal Lines (gl_je_lines — prefix is gljelines NOT gljelinesall) ──
CREATE VIEW edp.gl_journal_lines AS
SELECT
    jl.jeheaderid                              AS je_header_id,
    jl.gljelinescodecombinationid              AS code_combination_id,
    jl.gljelinesledgerid                       AS ledger_id,
    jl.gljelinesaccountedcr                    AS accounted_cr,
    jl.gljelinesaccounteddr                    AS accounted_dr,
    jl.gljelinesenteredcr                      AS entered_cr,
    jl.gljelinesentereddr                      AS entered_dr,
    jl.gljelinesdescription                    AS description,
    jl.gljelinesperiodname                     AS period_name,
    jl.gljelinescurrencycode                   AS currency_code,
    jl.gljelineseffectivedate                  AS effective_date,
    jl.gljelineslinetypecode                   AS line_type_code,
    jl.gljelinesstatus                         AS status
FROM lh_silver.oracle_fusion.gl_je_lines jl;
GO


-- =========================
--  ACCOUNTS PAYABLE VIEWS
-- =========================

-- ── AP Invoices ──
CREATE VIEW edp.ap_invoices AS
SELECT
    inv.apinvoicesinvoiceid                    AS invoice_id,
    inv.apinvoicesvendorid                     AS supplier_id,
    inv.apinvoicesvendorsiteid                 AS supplier_site_id,
    inv.apinvoicesorgid                        AS org_id,
    inv.apinvoicesinvoicenum                   AS invoice_number,
    inv.apinvoicesinvoicetypelookupcode        AS invoice_type,
    inv.apinvoicesdescription                  AS description,
    inv.apinvoicesinvoicecurrencycode          AS currency_code,
    inv.apinvoicesinvoiceamount                AS invoice_amount,
    inv.apinvoicesamountpaid                   AS amount_paid,
    inv.apinvoicescancelledamount              AS cancelled_amount,
    inv.apinvoicestotaltaxamount               AS total_tax_amount,
    inv.apinvoicesinvoicedate                  AS invoice_date,
    inv.apinvoicesgldate                       AS gl_date,
    inv.apinvoicespaymentstatusflag            AS payment_status,
    inv.apinvoicesapprovalstatus               AS approval_status,
    inv.apinvoiceswfapprovalstatus             AS wf_approval_status,
    inv.apinvoicessource                       AS source,
    inv.apinvoicespoheaderid                   AS po_header_id,
    inv.apinvoiceslegalentityid                AS legal_entity_id,
    inv.apinvoicescreationdate                 AS creation_date,
    inv.apinvoiceslastupdatedate               AS last_update_date
FROM lh_silver.oracle_fusion.ap_invoices_all inv;
GO

-- ── AP Invoice Lines ──
CREATE VIEW edp.ap_invoice_lines AS
SELECT
    il.apinvoicelinesallinvoiceid              AS invoice_id,
    il.apinvoicelinesalllinenumber             AS line_number,
    il.apinvoicelinesalldescription            AS description,
    il.apinvoicelinesallamount                 AS amount,
    il.apinvoicelinesallbaseamount             AS base_amount,
    il.apinvoicelinesalllinetypelookupcode     AS line_type,
    il.apinvoicelinesallaccountingdate         AS accounting_date,
    il.apinvoicelinesallperiodname             AS period_name,
    il.apinvoicelinesalldefaultdistccid        AS dist_code_combination_id,
    il.apinvoicelinesallpoheaderid             AS po_header_id,
    il.apinvoicelinesallpolineid               AS po_line_id,
    il.apinvoicelinesallcancelledflag          AS cancelled_flag,
    il.apinvoicelinesalldiscardedflag          AS discarded_flag,
    il.apinvoicelinesallmatchtype              AS match_type,
    il.apinvoicelinesallwfapprovalstatus       AS wf_approval_status,
    il.apinvoicelinesallcreationdate           AS creation_date
FROM lh_silver.oracle_fusion.ap_invoice_lines_all il;
GO

-- ── AP Invoice Distributions ──
CREATE VIEW edp.ap_invoice_distributions AS
SELECT
    d.apinvoicedistributionsinvoicedistributionid  AS distribution_id,
    d.apinvoicedistributionsinvoiceid              AS invoice_id,
    d.apinvoicedistributionsinvoicelinenumber      AS invoice_line_number,
    d.apinvoicedistributionsdistributionlinenumber AS distribution_line_number,
    d.apinvoicedistributionsdistributionclass      AS distribution_class,
    d.apinvoicedistributionsamount                 AS amount,
    d.apinvoicedistributionsbaseamount             AS base_amount,
    d.apinvoicedistributionsdistcodecombinationid  AS code_combination_id,
    d.apinvoicedistributionsaccountingdate         AS accounting_date,
    d.apinvoicedistributionsperiodname             AS period_name,
    d.apinvoicedistributionspostedflag             AS posted_flag,
    d.apinvoicedistributionscancellationflag       AS cancellation_flag,
    d.apinvoicedistributionsorgid                  AS org_id,
    d.apinvoicedistributionspjc_project_id         AS project_id,
    d.apinvoicedistributionspjc_task_id            AS task_id,
    d.apinvoicedistributionscreationdate           AS creation_date
FROM lh_silver.oracle_fusion.ap_invoice_distributions_all d;
GO

-- ── AP Payments ──
CREATE VIEW edp.ap_payments AS
SELECT
    p.apinvoicepaymentsallinvoicepaymentid     AS payment_id,
    p.apinvoicepaymentsallinvoiceid            AS invoice_id,
    p.apinvoicepaymentsallcheckid              AS check_id,
    p.apinvoicepaymentsallamount               AS amount,
    p.apinvoicepaymentsalldiscounttaken        AS discount_taken,
    p.apinvoicepaymentsallinvoicecurrencycode  AS invoice_currency_code,
    p.apinvoicepaymentsallpaymentcurrencycode  AS payment_currency_code,
    p.apinvoicepaymentsallinvoicepaymenttype   AS payment_type,
    p.apinvoicepaymentsallaccountingdate       AS accounting_date,
    p.apinvoicepaymentsallperiodname           AS period_name,
    p.apinvoicepaymentsallpostedflag           AS posted_flag,
    p.apinvoicepaymentsallreversalflag         AS reversal_flag,
    p.apinvoicepaymentsallcreationdate         AS creation_date
FROM lh_silver.oracle_fusion.ap_invoice_payments_all p;
GO

-- ── AP Payment Schedules ──
CREATE VIEW edp.ap_payment_schedules AS
SELECT
    ps.appaymentschedulesallinvoiceid          AS invoice_id,
    ps.appaymentschedulesallpaymentnum         AS payment_num,
    ps.appaymentschedulesallduedate            AS due_date,
    ps.appaymentschedulesallgrossamount        AS gross_amount,
    ps.appaymentschedulesallamountremaining    AS amount_remaining,
    ps.appaymentschedulesallpaymentstatusflag  AS payment_status,
    ps.appaymentschedulesallpaymentmethodcode  AS payment_method,
    ps.appaymentschedulesallpaymentpriority    AS payment_priority,
    ps.appaymentschedulesallholdflag           AS hold_flag,
    ps.appaymentschedulesallholddate           AS hold_date,
    ps.appaymentschedulesallcreationdate       AS creation_date
FROM lh_silver.oracle_fusion.ap_payment_schedules_all ps;
GO


-- =========================
--  PURCHASING VIEWS
-- =========================

-- ── Purchase Orders (po_headers_all — NO prefix on columns) ──
CREATE VIEW edp.purchase_orders AS
SELECT
    po.poheaderid                              AS po_header_id,
    po.segment1                                AS po_number,
    po.typelookupcode                          AS po_type,
    po.documentstatus                          AS document_status,
    po.currencycode                            AS currency_code,
    po.vendorid                                AS supplier_id,
    po.vendorsiteid                            AS supplier_site_id,
    po.billtolocationid                        AS bill_to_location_id,
    po.shiptolocationid                        AS ship_to_location_id,
    po.amountreleased                          AS amount_released,
    po.blankettotalamount                      AS blanket_total_amount,
    po.amountlimit                             AS amount_limit,
    po.approvedflag                            AS approved_flag,
    po.approveddate                            AS approved_date,
    po.closeddate                              AS closed_date,
    po.startdate                               AS start_date,
    po.enddate                                 AS end_date,
    po.comments                                AS comments,
    po.creationdate                            AS creation_date,
    po.lastupdatedate                          AS last_update_date
FROM lh_silver.oracle_fusion.po_headers_all po;
GO

-- ── PO Lines (po_lines_all — NO prefix on columns) ──
CREATE VIEW edp.po_lines AS
SELECT
    pl.polineid                                AS po_line_id,
    pl.poheaderid                              AS po_header_id,
    pl.linenum                                 AS line_number,
    pl.linestatus                              AS line_status,
    pl.itemdescription                         AS item_description,
    pl.amount                                  AS amount,
    pl.unitprice                               AS unit_price,
    pl.quantity                                AS quantity,
    pl.uomcode                                 AS uom_code,
    pl.ordertypelookupcode                     AS order_type,
    pl.matchingbasis                           AS matching_basis,
    pl.purchasebasis                           AS purchase_basis,
    pl.categoryid                              AS category_id,
    pl.canceldate                              AS cancel_date,
    pl.closeddate                              AS closed_date,
    pl.creationdate                            AS creation_date
FROM lh_silver.oracle_fusion.po_lines_all pl;
GO

-- ── PO Distributions (po_distributions_all — NO prefix on columns) ──
CREATE VIEW edp.po_distributions AS
SELECT
    pd.podistributionid                        AS po_distribution_id,
    pd.poheaderid                              AS po_header_id,
    pd.polineid                                AS po_line_id,
    pd.linelocationid                          AS line_location_id,
    pd.codecombinationid                       AS code_combination_id,
    pd.amountordered                           AS amount_ordered,
    pd.amountbilled                            AS amount_billed,
    pd.amountcancelled                         AS amount_cancelled,
    pd.amountdelivered                         AS amount_delivered,
    pd.quantityordered                         AS quantity_ordered,
    pd.quantitybilled                          AS quantity_billed,
    pd.quantitydelivered                       AS quantity_delivered,
    pd.destinationtypecode                     AS destination_type,
    pd.distributionnum                         AS distribution_num,
    pd.pjc_project_id                          AS project_id,
    pd.pjc_task_id                             AS task_id,
    pd.budgetdate                              AS budget_date,
    pd.creationdate                            AS creation_date
FROM lh_silver.oracle_fusion.po_distributions_all pd;
GO


-- =========================
--  PROJECTS VIEWS
-- =========================

-- ── Projects (pjf_projects_all_b — prefix is projectbasepeo, all lowercase) ──
CREATE VIEW edp.projects AS
SELECT
    pj.projectbasepeoprojectid                 AS project_id,
    pj.projectbasepeosegment1                  AS project_number,
    pj.projecttranslangpeoname                 AS project_name,
    pj.projecttranslangpeodescription          AS description,
    pj.projectbasepeoprojectstatuscode         AS project_status,
    pj.projectbasepeoprojectcategory           AS project_category,
    pj.projectbasepeoprojectcurrencycode       AS currency_code,
    pj.projectbasepeocarryingoutorganizationid AS carrying_out_org_id,
    pj.projectbasepeolegalentityid             AS legal_entity_id,
    pj.projectbasepeoprojfunccurrencycode      AS functional_currency_code,
    pj.projectbasepeostartdate                 AS start_date,
    pj.projectbasepeocompletiondate            AS completion_date,
    pj.projectbasepeocloseddate                AS closed_date,
    pj.projectbasepeoplanningprojectflag       AS planning_project_flag,
    pj.projectbasepeotemplateflag              AS template_flag,
    pj.projectbasepeoenabledflag               AS enabled_flag,
    pj.projectbasepeocreationdate              AS creation_date
FROM lh_silver.oracle_fusion.pjf_projects_all_b pj
WHERE pj.projectbasepeotemplateflag = 'N';
GO

-- ── Project Costs (pjs_fp_base_fin — MIXED: some actualcostpeo prefix, some unprefixed) ──
CREATE VIEW edp.project_costs AS
SELECT
    pa.projectid                               AS project_id,
    pa.taskid                                  AS task_id,
    pa.actualcostpeorawcost                    AS raw_cost,
    pa.actualcostpeobrdncost                   AS burdened_cost,
    pa.actualcostpeocaprawcost                 AS capital_raw_cost,
    pa.actualcostpeocapbrdncost                AS capital_burdened_cost,
    pa.actualcostpeobillrawcost                AS billable_raw_cost,
    pa.actualcostpeobillbrdncost               AS billable_burdened_cost,
    pa.actualcostpeoquantity                   AS quantity,
    pa.uomcode                                 AS uom_code,
    pa.actualcostpeocurrencycode               AS currency_code,
    pa.currencytype                            AS currency_type,
    pa.periodname                              AS period_name,
    pa.actualcostpeoperiodstartdate            AS period_start_date,
    pa.actualcostpeoperiodenddate              AS period_end_date,
    pa.calendartype                            AS calendar_type
FROM lh_silver.oracle_fusion.pjs_fp_base_fin pa;
GO


-- =========================
--  BUDGETARY CONTROL VIEWS
-- =========================

-- ── Control Budgets ──
CREATE VIEW edp.control_budgets AS
SELECT
    cb.controlbudgetid                         AS control_budget_id,
    cb.controlbudgetunsecuredname              AS budget_name,
    cb.controlbudgetunsecureddescription        AS description,
    cb.controlbudgetunsecuredcurrencycode      AS currency_code,
    cb.controlbudgetunsecuredstatuscode        AS status,
    cb.controlbudgetunsecuredcontrollevelcode   AS control_level,
    cb.controlbudgetunsecuredbudgetmanager     AS budget_manager,
    cb.controlbudgetunsecuredtolerancepercent  AS tolerance_percent,
    cb.controlbudgetunsecuredcreationdate      AS creation_date
FROM lh_silver.oracle_fusion.xcc_control_budgets cb;
GO

-- ── Budget Amounts (xcc_budget_dist_accts — NO prefix on columns) ──
CREATE VIEW edp.budget_amounts AS
SELECT
    ba.headerid                                AS header_id,
    ba.controlbudgetid                         AS control_budget_id,
    ba.budgetccid                              AS budget_code_combination_id,
    ba.amount                                  AS amount,
    ba.originalamount                          AS original_amount,
    ba.budgetaction                            AS budget_action,
    ba.linenumber                              AS line_number,
    ba.periodname                              AS period_name,
    ba.masterperiodname                        AS master_period_name,
    ba.creationdate                            AS creation_date
FROM lh_silver.oracle_fusion.xcc_budget_dist_accts ba;
GO

-- =========================
--  CONVENIENCE / SUMMARY VIEWS
-- =========================

-- ── AP Invoice Summary (joined with supplier) ──
-- This pre-joined view lets the AI agent answer supplier spend questions
-- with a single-table query instead of requiring JOINs.
CREATE VIEW edp.ap_invoice_summary AS
SELECT
    inv.apinvoicesinvoiceid                    AS invoice_id,
    inv.apinvoicesinvoicenum                   AS invoice_number,
    inv.apinvoicesinvoicetypelookupcode        AS invoice_type,
    inv.apinvoicesdescription                  AS description,
    inv.apinvoicesinvoiceamount                AS invoice_amount,
    inv.apinvoicesamountpaid                   AS amount_paid,
    (inv.apinvoicesinvoiceamount - ISNULL(inv.apinvoicesamountpaid, 0))
                                                AS amount_outstanding,
    inv.apinvoicestotaltaxamount               AS tax_amount,
    inv.apinvoicesinvoicecurrencycode          AS currency_code,
    inv.apinvoicesinvoicedate                  AS invoice_date,
    inv.apinvoicesgldate                       AS gl_date,
    inv.apinvoicespaymentstatusflag            AS payment_status,
    inv.apinvoicesapprovalstatus               AS approval_status,
    inv.apinvoicessource                       AS source,
    s.segment1                                 AS supplier_number,
    s.alternatenamepartyname                   AS supplier_name,
    s.vendortypelookupcode                     AS supplier_type
FROM lh_silver.oracle_fusion.ap_invoices_all inv
LEFT JOIN lh_silver.oracle_fusion.poz_suppliers_v s
    ON inv.apinvoicesvendorid = s.vendorid;
GO

-- ── GL Balance Summary (joined with code combinations) ──
-- Pre-joined view for GL balance queries with account segments.
CREATE VIEW edp.gl_balance_summary AS
SELECT
    gb.balanceledgerid                         AS ledger_id,
    gb.balancecurrencycode                     AS currency_code,
    gb.balanceperiodname                       AS period_name,
    gb.balanceperiodnum                        AS period_num,
    gb.balanceperiodyear                       AS fiscal_year,
    gb.balanceactualflag                       AS actual_flag,
    gb.balanceperiodnetdr                      AS period_net_dr,
    gb.balanceperiodnetcr                      AS period_net_cr,
    (gb.balanceperiodnetdr - gb.balanceperiodnetcr)
                                                AS period_net_amount,
    gb.balancebeginbalancedr                   AS begin_balance_dr,
    gb.balancebeginbalancecr                   AS begin_balance_cr,
    gcc.codecombinationsegment1                AS segment1,
    gcc.codecombinationsegment2                AS segment2,
    gcc.codecombinationsegment3                AS segment3,
    gcc.codecombinationsegment4                AS segment4,
    gcc.codecombinationsegment5                AS segment5,
    gcc.codecombinationsegment6                AS segment6,
    gcc.codecombinationaccounttype             AS account_type,
    gcc.codecombinationfinancialcategory       AS financial_category
FROM lh_silver.oracle_fusion.gl_balances gb
INNER JOIN lh_silver.oracle_fusion.gl_code_combinations gcc
    ON gb.balancecodecombinationid = gcc.codecombinationcodecombinationid
WHERE gb.balanceactualflag = 'A'
    AND gb.balancecurrencycode <> 'STAT';
GO
