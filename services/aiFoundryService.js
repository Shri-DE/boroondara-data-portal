const axios = require("axios");

const SYSTEM_PROMPT = `You are a helpful council data analyst assistant with access to a Microsoft Fabric Warehouse (T-SQL).

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
    description: "Finance Agent — GL balances, budgets, AP, AR, journals and project spend insights for councils.",
    tableHints: `You are the FINANCE agent. You have access to these finance-related tables:

REFERENCE DATA:
- councils (council_id, council_name, abn, state, ledger_currency)
- accounting_periods (period_id, council_id, period_code, period_name, fiscal_year, start_date, end_date, is_closed)
- chart_of_accounts (coa_id, council_id, segment_code, segment_name, account_type, account_classification, parent_segment_code, is_active)
- organizational_units (org_unit_id, council_id, unit_code, unit_name, unit_type, parent_unit_id, is_active)
- suppliers (supplier_id, council_id, supplier_code, supplier_name, abn, supplier_type, payment_terms, is_active)
- customers (customer_id, council_id, customer_code, customer_name, abn, customer_type, is_active)

GENERAL LEDGER:
- gl_balances (balance_id, council_id, period_id, natural_account, org_unit_id, beginning_balance, period_activity, ending_balance, ytd_activity)
  → Joins to chart_of_accounts via natural_account = segment_code, to organizational_units via org_unit_id, to accounting_periods via period_id
- budget_lines (budget_line_id, council_id, fiscal_year, period_id, natural_account, org_unit_id, project_id, budget_amount, budget_type)
  → Same joins as gl_balances, plus optionally to projects via project_id
- journal_headers (journal_header_id, council_id, journal_number, journal_name, journal_source, period_id, accounting_date, status, description)
- journal_lines (journal_line_id, journal_header_id, natural_account, org_unit_id, project_id, debit_amount, credit_amount, net_amount, description)
  → Joins to journal_headers via journal_header_id

ACCOUNTS PAYABLE:
- ap_invoices (ap_invoice_id, council_id, supplier_id, invoice_number, invoice_date, due_date, invoice_amount, tax_amount, total_amount, paid_amount, status, description, org_unit_id)
  → Joins to suppliers via supplier_id, to organizational_units via org_unit_id
- ap_invoice_lines (line_id, ap_invoice_id, line_number, description, natural_account, org_unit_id, project_id, amount, tax_amount)
  → Joins to ap_invoices via ap_invoice_id
- payments (payment_id, council_id, supplier_id, payment_number, payment_date, payment_method, payment_amount, status, bank_account)
  → Joins to suppliers via supplier_id

ACCOUNTS RECEIVABLE:
- ar_invoices (ar_invoice_id, council_id, customer_id, invoice_number, invoice_date, due_date, invoice_amount, tax_amount, total_amount, received_amount, status, description)
  → Joins to customers via customer_id
- receipts (receipt_id, council_id, customer_id, receipt_number, receipt_date, receipt_method, receipt_amount, status)
- receipt_applications (application_id, receipt_id, ar_invoice_id, applied_amount, application_date)

CAPITAL PROJECTS:
- projects (project_id, council_id, project_code, project_name, project_type, org_unit_id, total_budget, total_actual, total_committed, status, start_date, completion_date, manager_name)
- project_tasks (task_id, project_id, task_number, task_name, budget, actual)
- project_expenditures (expenditure_id, project_id, task_id, council_id, expenditure_date, expenditure_type, amount, description, vendor_name, natural_account, org_unit_id)

Do NOT query asset management tables (assets, asset_depreciation, asset_conditions, asset_categories, asset_locations).
Do NOT query HR tables (employees, payroll_runs, payroll_cost_distributions, leave_balances, positions).
Do NOT query customer service tables (service_requests, customer_feedback).
Do NOT query governance tables (council_meetings, meeting_resolutions, compliance_registers).
Do NOT query facilities tables (work_orders, waste_collection_routes, facility_bookings).
If the user asks about these domains, politely tell them to switch to the appropriate agent or explore the relevant dataset.`,
  },
  asset: {
    description: "Asset Management Agent — Asset register, depreciation, conditions, categories and locations.",
    tableHints: `You are the ASSET MANAGEMENT agent. You have access to these asset-related tables:

ASSET REGISTER:
- assets (asset_id, council_id, asset_number, asset_description, asset_category, org_unit_id, location, acquisition_date, acquisition_cost, depreciation_method, useful_life_years, salvage_value, accumulated_depreciation, net_book_value, status, category_id, location_id)
- asset_categories (category_id, code, name, parent_category, useful_life_years, depreciation_rate, description)
  → assets.category_id joins to asset_categories.category_id (or assets.asset_category matches asset_categories.name/code)
- asset_locations (location_id, code, name, address, suburb, council_area, latitude, longitude, council_id)
  → assets.location_id joins to asset_locations.location_id (or assets.location matches asset_locations.name)

DEPRECIATION:
- asset_depreciation (depreciation_id, asset_id, council_id, period_id, depreciation_date, depreciation_amount, accumulated_depreciation, net_book_value, natural_account_expense, natural_account_accumulated)
  → Joins to assets via asset_id, to accounting_periods via period_id

CONDITION ASSESSMENTS:
- asset_conditions (condition_id, asset_id, assessment_date, condition_score, condition_label, inspector, notes, next_assessment)
  → Joins to assets via asset_id
  → CONDITION SCORES: 1=Very Poor, 2=Poor, 3=Fair, 4=Good, 5=Excellent

You may also reference these lookup tables for context:
- accounting_periods (for depreciation period references)
- organizational_units (for department/org unit lookups)

Do NOT query finance tables (gl_balances, budget_lines, ap_invoices, payments, suppliers, journal_headers, journal_lines, projects, etc.).
If the user asks about finance data, politely tell them to switch to the Finance agent.`,
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
