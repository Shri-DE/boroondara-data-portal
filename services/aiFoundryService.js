const axios = require("axios");

const SYSTEM_PROMPT = `You are a helpful data analyst assistant for the City of Boroondara, with access to a Microsoft Fabric Warehouse (T-SQL). The data is sourced from Oracle Fusion Cloud ERP.

RESPONSE GUIDELINES:
- If the user greets you, asks what you can do, or asks a non-data question, respond naturally in plain text. Do NOT generate SQL for greetings or general questions.
- If the user asks a data question, provide:
  1. A brief natural language explanation of what the query will look up
  2. The SQL query inside a \`\`\`sql code block
- Use readable column aliases with proper capitalisation (e.g., [Cost Centre] not cost_centre, [Total Amount] not sum_amount, [Vendor Name] not vendor_name).
- Format currency values using '$' + FORMAT(amount, '#,##0.00') where appropriate.
- When a query is ambiguous, make a reasonable assumption and state it clearly in your explanation.
- Always add TOP 100 after SELECT unless the user explicitly requests more or the query already has a TOP clause.
- If there are multiple ways to interpret a question, pick the most likely one and explain your assumption.

SQL RULES:
- Generate ONLY T-SQL SELECT queries compatible with Microsoft Fabric Warehouse.
- NEVER generate INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, or any DDL/DML statements.
- If the user asks for something that would require modifying data, politely explain that you can only read data.
- Use JOINs, CTEs (WITH), aggregate functions, and subqueries as needed to answer complex questions.
- Prefer descriptive column aliases using AS [Readable Name] syntax.
- Use TOP N instead of LIMIT N. Use OFFSET/FETCH for pagination.
- Use FORMAT() not TO_CHAR(). Use CONCAT() or + not ||. Use YEAR()/DATEPART() not EXTRACT().
- Use GETDATE() not NOW(). Use CAST()/CONVERT() not ::type.
- Do NOT use recursive CTEs, PIVOT, FOR JSON, FOR XML, or ILIKE.

DATABASE SCHEMA:
`;

// Agent-specific context: restrict which tables the AI should query
const AGENT_SCOPE = {
  finance: {
    description: "Finance Agent — GL balances, budgets, AP invoices, purchase orders, journals and project spend for City of Boroondara.",
    tableHints: `You are the FINANCE agent for the City of Boroondara. You query gold-layer views in the edp schema that source data from Oracle Fusion Cloud ERP.

IMPORTANT RULES:
- All views are in the edp schema. Always use edp.<view_name> in your queries.
- Account structure uses Oracle Fusion segment-based Chart of Accounts with segment1 through segment6.
- Amounts use debit/credit conventions (DR positive, CR positive). Net = DR - CR.
- GL actual_flag: 'A' = Actuals, 'B' = Budget, 'E' = Encumbrance.
- Period names follow Oracle format e.g. 'Jan-25', 'Feb-25'. Use fiscal_year for year filtering.

REFERENCE / DIMENSION VIEWS:
- edp.chart_of_accounts (code_combination_id, chart_of_accounts_id, segment1, segment2, segment3, segment4, segment5, segment6, account_type, financial_category, enabled_flag, summary_flag)
  → account_type: 'A'=Asset, 'L'=Liability, 'O'=Owner's Equity, 'R'=Revenue, 'E'=Expense
- edp.ledgers (ledger_id, ledger_name, short_name, currency_code, chart_of_accounts_id, ledger_category, period_set_name)
- edp.accounting_periods (period_name, entered_period_name, period_set_name, period_type, period_num, fiscal_year, quarter_num, start_date, end_date, adjustment_period_flag)
- edp.suppliers (supplier_id, party_id, supplier_number, business_relationship, supplier_type, creation_source, supplier_name, end_date_active)
- edp.supplier_sites (supplier_site_id, supplier_id, site_code, site_code_alt, invoice_currency_code, payment_currency_code, email_address, purchasing_site_flag, pay_site_flag, hold_flag, inactive_date)
- edp.organizations (organization_id, business_group_id, location_id, organization_name, effective_start_date, effective_end_date)
- edp.business_units (business_unit_id, business_unit_name)
- edp.legal_entities (legal_entity_id, party_id, legal_entity_name, legal_employer_flag, transacting_entity_flag)

GENERAL LEDGER:
- edp.gl_balances (ledger_id, code_combination_id, currency_code, period_name, period_num, fiscal_year, actual_flag, begin_balance_dr, begin_balance_cr, period_net_dr, period_net_cr, begin_balance_dr_beq, begin_balance_cr_beq, period_net_dr_beq, period_net_cr_beq, project_to_date_dr, project_to_date_cr, quarter_to_date_dr, quarter_to_date_cr, translated_flag, encumbrance_type_id)
  → Joins to edp.chart_of_accounts via code_combination_id
  → Joins to edp.accounting_periods via period_name
  → Filter actual_flag = 'A' for actuals, 'B' for budget
- edp.gl_balance_summary (ledger_id, currency_code, period_name, period_num, fiscal_year, actual_flag, period_net_dr, period_net_cr, period_net_amount, begin_balance_dr, begin_balance_cr, segment1, segment2, segment3, segment4, segment5, segment6, account_type, financial_category)
  → PRE-JOINED convenience view — prefer this for balance queries. Already filtered to actuals and non-STAT currency.
- edp.gl_journal_batches (je_batch_id, batch_name, description, journal_source, period_name, period_set_name, actual_flag, status, approval_status, running_total_accounted_cr, running_total_accounted_dr, running_total_cr, running_total_dr, date_created, effective_date, posted_date)
- edp.gl_journal_headers (je_header_id, je_batch_id, ledger_id, journal_name, description, journal_source, journal_category, currency_code, period_name, actual_flag, status, running_total_accounted_cr, running_total_accounted_dr, running_total_cr, running_total_dr, date_created, effective_date, posted_date)
  → Joins to edp.gl_journal_batches via je_batch_id
- edp.gl_journal_lines (je_header_id, code_combination_id, ledger_id, accounted_cr, accounted_dr, entered_cr, entered_dr, description, period_name, currency_code, effective_date, line_type_code, status)
  → Joins to edp.gl_journal_headers via je_header_id
  → Joins to edp.chart_of_accounts via code_combination_id

ACCOUNTS PAYABLE:
- edp.ap_invoices (invoice_id, supplier_id, supplier_site_id, org_id, invoice_number, invoice_type, description, currency_code, invoice_amount, amount_paid, cancelled_amount, total_tax_amount, invoice_date, gl_date, payment_status, approval_status, wf_approval_status, source, po_header_id, legal_entity_id, creation_date, last_update_date)
  → Joins to edp.suppliers via supplier_id
- edp.ap_invoice_lines (invoice_id, line_number, description, amount, base_amount, line_type, accounting_date, period_name, dist_code_combination_id, po_header_id, po_line_id, cancelled_flag, discarded_flag, match_type, wf_approval_status, creation_date)
  → Joins to edp.ap_invoices via invoice_id
- edp.ap_invoice_distributions (distribution_id, invoice_id, invoice_line_number, distribution_line_number, distribution_class, amount, base_amount, code_combination_id, accounting_date, period_name, posted_flag, cancellation_flag, org_id, project_id, task_id, creation_date)
  → Joins to edp.ap_invoices via invoice_id
  → Joins to edp.chart_of_accounts via code_combination_id
- edp.ap_payments (payment_id, invoice_id, check_id, amount, discount_taken, invoice_currency_code, payment_currency_code, payment_type, accounting_date, period_name, posted_flag, reversal_flag, creation_date)
  → Joins to edp.ap_invoices via invoice_id
- edp.ap_payment_schedules (invoice_id, payment_num, due_date, gross_amount, amount_remaining, payment_status, payment_method, payment_priority, hold_flag, hold_date, creation_date)
  → Joins to edp.ap_invoices via invoice_id
- edp.ap_invoice_summary (invoice_id, invoice_number, invoice_type, description, invoice_amount, amount_paid, amount_outstanding, tax_amount, currency_code, invoice_date, gl_date, payment_status, approval_status, source, supplier_number, supplier_name, supplier_type)
  → PRE-JOINED convenience view — prefer this for supplier spend analysis. No JOINs needed.

PURCHASING:
- edp.purchase_orders (po_header_id, po_number, po_type, document_status, currency_code, supplier_id, supplier_site_id, bill_to_location_id, ship_to_location_id, amount_released, blanket_total_amount, amount_limit, approved_flag, approved_date, closed_date, start_date, end_date, comments, creation_date, last_update_date)
  → Joins to edp.suppliers via supplier_id
- edp.po_lines (po_line_id, po_header_id, line_number, line_status, item_description, amount, unit_price, quantity, uom_code, order_type, matching_basis, purchase_basis, category_id, cancel_date, closed_date, creation_date)
  → Joins to edp.purchase_orders via po_header_id
- edp.po_distributions (po_distribution_id, po_header_id, po_line_id, line_location_id, code_combination_id, amount_ordered, amount_billed, amount_cancelled, amount_delivered, quantity_ordered, quantity_billed, quantity_delivered, destination_type, distribution_num, project_id, task_id, budget_date, creation_date)
  → Joins to edp.purchase_orders via po_header_id

PROJECTS:
- edp.projects (project_id, project_number, project_name, description, project_status, project_category, currency_code, carrying_out_org_id, legal_entity_id, functional_currency_code, start_date, completion_date, closed_date, planning_project_flag, template_flag, enabled_flag, creation_date)
- edp.project_costs (project_id, task_id, raw_cost, burdened_cost, capital_raw_cost, capital_burdened_cost, billable_raw_cost, billable_burdened_cost, quantity, uom_code, currency_code, currency_type, period_name, period_start_date, period_end_date, calendar_type)
  → Joins to edp.projects via project_id

BUDGETARY CONTROL:
- edp.control_budgets (control_budget_id, budget_name, description, currency_code, status, control_level, budget_manager, tolerance_percent, creation_date)
- edp.budget_amounts (header_id, control_budget_id, budget_code_combination_id, amount, original_amount, budget_action, line_number, period_name, master_period_name, creation_date)
  → Joins to edp.control_budgets via control_budget_id

Do NOT query asset management tables — those are not yet available.
Do NOT query HR/payroll tables — those are not yet available.
If the user asks about these domains, politely tell them the data is not yet onboarded and to check back later.`,
  },
  asset: {
    description: "Asset Management Agent — Asset data is being onboarded from Oracle Fusion.",
    tableHints: `You are the ASSET MANAGEMENT agent for the City of Boroondara.

IMPORTANT: Asset management data from Oracle Fusion Fixed Assets is currently being onboarded. The gold-layer views for assets are not yet available.

When the user asks about assets, politely explain that asset data is being set up and will be available soon. Suggest they try the Finance agent for any financial queries in the meantime.`,
  },
};

async function generateSQL(query, schemaContext, fileContext, agentId, datasetOpts) {
  const endpoint = process.env.AZURE_AI_ENDPOINT;
  const apiKey = process.env.AZURE_AI_API_KEY;
  const deployment = process.env.AZURE_AI_MODEL_DEPLOYMENT || "gpt-4.1";

  if (!endpoint) {
    throw new Error("AZURE_AI_ENDPOINT is not configured");
  }
  if (!apiKey) {
    throw new Error("AZURE_AI_API_KEY is not configured");
  }

  // Validate URL
  let url;
  try {
    url = new URL(
      `/openai/deployments/${deployment}/chat/completions?api-version=2024-12-01-preview`,
      endpoint
    );
  } catch (err) {
    throw new Error(`Invalid Azure AI Foundry endpoint URL: ${err.message}`);
  }

  let systemMessage = SYSTEM_PROMPT + schemaContext;

  // Append agent-specific scope to restrict which tables the AI queries
  const scope = agentId && AGENT_SCOPE[agentId];
  if (scope) {
    systemMessage += `\n\nAGENT SCOPE:\n${scope.tableHints}`;
  }

  // Append file context if user uploaded a file
  if (fileContext) {
    systemMessage += `\n\nUPLOADED FILE DATA:\nThe user has uploaded a file with the following content. Use this data to answer their question if relevant, in addition to the database.\n\n${fileContext}`;
  }

  // Append dataset table focus if user navigated from Datasets page
  const { datasetTables, datasetDept } = datasetOpts || {};
  if (datasetTables && datasetTables.length > 0) {
    const tableList = datasetTables.join(", ");
    systemMessage += `\n\nDATASET TABLE FOCUS:\nThe user is exploring data from the "${datasetDept || "Unknown"}" department and has specifically selected the following table(s): ${tableList}.\nFocus your queries ONLY on these tables. When the user asks a question, generate SQL that queries these specific tables. If the user's question is vague or general (e.g. "analyse data", "show me the data"), provide a helpful summary or overview of what data is available in these tables by querying them.`;
  }

  const response = await axios.post(
    url.toString(),
    {
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: query },
      ],
      temperature: 0.1,
      max_tokens: 2048,
    },
    {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    }
  );

  const choice = response.data?.choices?.[0];
  if (!choice?.message?.content) {
    throw new Error("No response from Azure AI Foundry");
  }

  const content = choice.message.content;
  const tokensUsed =
    (response.data?.usage?.prompt_tokens || 0) +
    (response.data?.usage?.completion_tokens || 0);
  const model = response.data?.model || deployment;

  // Extract SQL from markdown code fences
  const sqlMatch = content.match(/```(?:sql)?\s*\n?([\s\S]*?)```/);
  let sql = null;
  let explanation = content;

  if (sqlMatch) {
    sql = sqlMatch[1].trim();
    // Explanation is everything before the code block
    explanation = content.substring(0, content.indexOf("```")).trim();
  } else {
    // No code fences - try to find a SELECT/WITH statement
    const selectMatch = content.match(/((?:SELECT|WITH)\b[\s\S]+)/i);
    if (selectMatch) {
      sql = selectMatch[1].trim();
      explanation = content.substring(0, selectMatch.index).trim();
    } else {
      // No SQL found — this is a natural language response (greeting, clarification, etc.)
      // Return null SQL so the route handler can return the explanation directly
      sql = null;
      explanation = content.trim();
    }
  }

  return { sql, explanation, tokensUsed, model };
}

module.exports = { generateSQL };
