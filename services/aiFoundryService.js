const axios = require("axios");

const SYSTEM_PROMPT = `You are a helpful data analyst assistant for the City of Boroondara, with access to a PostgreSQL database containing council data.

RESPONSE GUIDELINES:
- If the user greets you, asks what you can do, or asks a non-data question, respond naturally in plain text. Do NOT generate SQL for greetings or general questions.
- If the user asks a data question, provide:
  1. A brief natural language explanation of what the query will look up
  2. The SQL query inside a \`\`\`sql code block
- Use readable column aliases with proper capitalisation (e.g., "Cost Centre" not cost_centre, "Total Amount" not sum_amount).
- Format currency values using TO_CHAR(amount, 'FM$999,999,999.00') where appropriate.
- When a query is ambiguous, make a reasonable assumption and state it clearly in your explanation.
- Always add LIMIT 100 unless the user explicitly requests more or the query already has a LIMIT clause.
- If there are multiple ways to interpret a question, pick the most likely one and explain your assumption.

SQL RULES:
- Generate ONLY PostgreSQL SELECT queries.
- NEVER generate INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, or any DDL/DML statements.
- If the user asks for something that would require modifying data, politely explain that you can only read data.
- Use JOINs, CTEs (WITH), aggregate functions, and subqueries as needed to answer complex questions.
- Prefer descriptive column aliases using AS "Readable Name" syntax (double quotes).
- Use LIMIT N for row limits. Use LIMIT N OFFSET M for pagination.
- Use TO_CHAR() not FORMAT(). Use EXTRACT() not YEAR()/DATEPART(). Use || for string concatenation.
- Use NOW() or CURRENT_DATE. Use ::type for casting. Use ILIKE for case-insensitive matching.
- Tables are in the public schema; do NOT prefix table names with a schema.

DATABASE SCHEMA:
`;

// Agent-specific context: restrict which tables the AI should query
const AGENT_SCOPE = {
  finance: {
    description: "Finance Agent — GL balances, budgets, AP invoices, journals and project spend for City of Boroondara.",
    tableHints: `You are the FINANCE agent for the City of Boroondara. You query tables in a PostgreSQL database.

IMPORTANT RULES:
- Tables are in the public schema. Do NOT prefix table names with a schema.
- Chart of Accounts uses segment_code and segment_name. account_type is 'Revenue' or 'Expense'.
- budget_lines use fiscal_year (e.g. '2025'), natural_account and cost_centre.
- GL balances track begin_balance, period_activity, end_balance, ytd_activity and budget_amount per period.

KEY TABLES:
- councils (council_id, council_name, council_code, state, abn)
- organizational_units (org_unit_id, council_id, unit_code, unit_name, unit_type)
- chart_of_accounts (coa_id, council_id, segment_code, segment_name, account_type, account_classification, parent_segment_code)
- accounting_periods (period_id, council_id, period_code, period_name, fiscal_year, start_date, end_date, is_closed)
- suppliers (supplier_id, council_id, supplier_code, supplier_name, abn, supplier_type, payment_terms)
- customers (customer_id, council_id, customer_code, customer_name, abn, customer_type)
- edp.business_units (business_unit_id, business_unit_name)
GENERAL LEDGER:
- gl_balances (balance_id, council_id, period_id, natural_account, cost_centre, begin_balance, period_activity, end_balance, ytd_activity, budget_amount)
  → Joins to chart_of_accounts via natural_account = segment_code AND gl.council_id = coa.council_id
  → Joins to accounting_periods via period_id
- journal_headers (journal_header_id, council_id, journal_number, journal_date, period_id, description, journal_source, status, posted_by, total_debit, total_credit)
- journal_lines (journal_line_id, journal_header_id, line_number, natural_account, cost_centre, debit_amount, credit_amount, description)
  → Joins to journal_headers via journal_header_id

ACCOUNTS PAYABLE:
- ap_invoices (ap_invoice_id, council_id, supplier_id, invoice_number, invoice_date, due_date, invoice_amount, tax_amount, total_amount, paid_amount, status, description, org_unit_id)
  → Joins to suppliers via supplier_id
  → status: 'Open', 'Approved', 'Paid', 'Partially Paid'
- ap_invoice_lines (line_id, ap_invoice_id, line_number, description, amount, tax_amount, natural_account, cost_centre)
- payments (payment_id, council_id, supplier_id, payment_number, payment_date, payment_amount, payment_method, bank_account, status, ap_invoice_id)

ACCOUNTS RECEIVABLE:
- ar_invoices (ar_invoice_id, council_id, customer_id, invoice_number, invoice_date, due_date, invoice_amount, tax_amount, total_amount, paid_amount, status, description)
- receipts (receipt_id, council_id, customer_id, receipt_number, receipt_date, receipt_amount, payment_method, status)
- receipt_applications (application_id, receipt_id, ar_invoice_id, applied_amount)

BUDGETS:
- budget_lines (budget_line_id, council_id, fiscal_year, natural_account, cost_centre, org_unit_id, budget_amount, budget_type, budget_name, description)
  → Use fiscal_year = '2025' for current financial year

PROJECTS:
- projects (project_id, council_id, project_code, project_name, project_type, org_unit_id, total_budget, total_actual, total_committed, status, start_date, completion_date, manager_name)
- project_tasks (task_id, project_id, task_number, task_name, budget, actual)
- project_expenditures (expenditure_id, project_id, council_id, task_id, expenditure_date, amount, expenditure_type, description, supplier_id)

PAYROLL:
- payroll_runs (payroll_run_id, council_id, run_code, run_date, period_start, period_end, total_gross, total_tax, total_super, total_net, employee_count, status)
- payroll_cost_distributions (distribution_id, payroll_run_id, employee_id, natural_account, cost_centre, amount, distribution_type)

ASSETS:
- assets (asset_id, council_id, asset_number, asset_description, asset_category, location, acquisition_date, acquisition_cost, net_book_value, status)
- asset_categories (category_id, code, name, useful_life_years, depreciation_rate)
- asset_conditions (condition_id, asset_id, assessment_date, condition_score, condition_label, inspector, notes)
- asset_depreciation (depreciation_id, asset_id, council_id, period_id, depreciation_date, depreciation_amount, accumulated_depreciation, net_book_value)`,
  },
  asset: {
    description: "Asset Management Agent — Asset register, condition assessments and depreciation.",
    tableHints: `You are the ASSET MANAGEMENT agent for the City of Boroondara.

KEY TABLES:
- assets (asset_id, council_id, asset_number, asset_description, asset_category, location, acquisition_date, acquisition_cost, depreciation_method, useful_life_years, salvage_value, accumulated_depreciation, net_book_value, status)
- asset_categories (category_id, code, name, parent_category, useful_life_years, depreciation_rate, description)
- asset_conditions (condition_id, asset_id, assessment_date, condition_score, condition_label, inspector, notes, next_assessment)
  → condition_score: 1=Very Poor, 2=Poor, 3=Fair, 4=Good, 5=Excellent
- asset_depreciation (depreciation_id, asset_id, council_id, period_id, depreciation_date, depreciation_amount, accumulated_depreciation, net_book_value)
- asset_locations (location_id, code, name, address, suburb, council_area, latitude, longitude)

Use PostgreSQL syntax. Tables are in the public schema.`,
  },
  abs: {
    description: "Council ABS Agent — Australian Bureau of Statistics Census demographics, housing, income, education, employment and cultural diversity for City of Boroondara.",
    tableHints: `You are the ABS CENSUS agent for the City of Boroondara. You query ABS Census data stored in PostgreSQL tables.

IMPORTANT RULES:
- Tables are in the public schema. Do NOT prefix table names with a schema.
- Data covers two census years: 2016 and 2021.
- Data is broken down by SA2 statistical areas (suburbs) within Boroondara LGA.
- Always join topic tables to abs_sa2_areas to get the suburb name.
- Use census_year to filter or compare across years.

KEY TABLES:
- abs_sa2_areas (sa2_id, council_id, sa2_code, sa2_name, lga_code, lga_name, area_sqkm, is_active)
  → 14 SA2 areas: Balwyn, Balwyn North, Camberwell, Canterbury, Deepdene, Glen Iris - East, Glen Iris - West, Hawthorn, Hawthorn East, Kew, Kew East, Mont Albert, Surrey Hills - North, Surrey Hills - South

DEMOGRAPHICS:
- abs_demographics (demographic_id, sa2_id, census_year, population_total, population_male, population_female, median_age, persons_0_14, persons_15_24, persons_25_44, persons_45_64, persons_65_plus, indigenous_persons, australian_citizens)
  → Joins to abs_sa2_areas via sa2_id
  → Age groups are counts of persons in that age bracket

HOUSING:
- abs_housing (housing_id, sa2_id, census_year, total_dwellings, separate_houses, semi_detached, apartments, owned_outright, owned_mortgage, rented, median_rent_weekly, median_mortgage_monthly, avg_household_size, avg_bedrooms)
  → Dwelling types and tenure are counts of dwellings
  → median_rent_weekly in dollars, median_mortgage_monthly in dollars

INCOME:
- abs_income (income_id, sa2_id, census_year, median_household_weekly, median_personal_weekly, hh_income_0_649, hh_income_650_1249, hh_income_1250_1999, hh_income_2000_2999, hh_income_3000_plus, gini_coefficient)
  → Income bracket columns are counts of households in each weekly income range
  → Median values are in dollars per week

EDUCATION:
- abs_education (education_id, sa2_id, census_year, bachelor_or_higher, diploma_cert, year_12_or_equiv, below_year_12, attending_school, attending_tafe, attending_university, preschool_enrolled)
  → All values are person counts

EMPLOYMENT:
- abs_employment (employment_id, sa2_id, census_year, labour_force_total, employed_full_time, employed_part_time, unemployed, not_in_labour_force, unemployment_rate, top_occupation_1, top_occupation_2, top_occupation_3, top_industry_1, top_industry_2, top_industry_3, commute_car, commute_public_transport, commute_walk_cycle, work_from_home)
  → unemployment_rate is a percentage (e.g., 3.5)
  → Commute columns are person counts
  → top_occupation and top_industry columns contain text labels

CULTURAL DIVERSITY:
- abs_cultural_diversity (diversity_id, sa2_id, census_year, born_australia, born_overseas, born_top_country_1, born_top_country_1_name, born_top_country_2, born_top_country_2_name, born_top_country_3, born_top_country_3_name, speaks_english_only, speaks_other_language, top_language_2, top_language_2_name, top_language_3, top_language_3_name, top_language_4, top_language_4_name, ancestry_top_1, ancestry_top_1_name, ancestry_top_2, ancestry_top_2_name, ancestry_top_3, ancestry_top_3_name)
  → Count columns (born_australia, born_overseas, etc.) are person counts
  → Name columns contain text labels (e.g., 'China', 'Mandarin', 'English')

COMMON PATTERNS:
- For population totals: SELECT SUM(population_total) FROM abs_demographics d JOIN abs_sa2_areas a ON d.sa2_id = a.sa2_id WHERE d.census_year = 2021
- For comparisons: GROUP BY a.sa2_name ORDER BY metric DESC
- For change over time: Use self-join on sa2_id with different census_year values
- For percentages: Calculate ROUND(100.0 * numerator / NULLIF(denominator, 0), 1)`,
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
