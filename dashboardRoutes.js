// dashboardRoutes.js
// Dashboard summary endpoint — aggregated KPIs and chart data
const express = require("express");
const dbService = require("./services/dbService");

const router = express.Router();

// GET /api/dashboard/summary
// Runs 10 queries in parallel and returns all dashboard data in one response
router.get("/summary", async (req, res) => {
  try {
    const [
      budgetResult,
      revenueExpResult,
      apResult,
      assetCondResult,
      projectResult,
      serviceResult,
      expenseCatResult,
      employeeResult,
      assetCountResult,
      employeeCountResult,
    ] = await Promise.all([
      // 1. Total budget FY2025
      dbService.executeQuery(`
        SELECT
          COALESCE(SUM(CASE WHEN budget_amount < 0 THEN ABS(budget_amount) ELSE 0 END), 0) AS total_revenue_budget,
          COALESCE(SUM(CASE WHEN budget_amount > 0 THEN budget_amount ELSE 0 END), 0)     AS total_expense_budget,
          COALESCE(SUM(ABS(budget_amount)), 0)                                              AS total_budget
        FROM budget_lines
        WHERE fiscal_year = '2025'
      `),

      // 2. Revenue vs Expenditure by account type (from GL)
      dbService.executeQuery(`
        SELECT
          coa.account_type,
          COALESCE(SUM(ABS(gl.ytd_activity)), 0) AS ytd_total
        FROM gl_balances gl
        JOIN chart_of_accounts coa
          ON gl.natural_account = coa.segment_code
         AND gl.council_id = coa.council_id
        GROUP BY coa.account_type
        ORDER BY ytd_total DESC
      `),

      // 3. Accounts Payable summary
      dbService.executeQuery(`
        SELECT
          COUNT(*)                                                     AS invoice_count,
          COALESCE(SUM(total_amount - paid_amount), 0)                 AS outstanding_amount,
          SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END)            AS open_count,
          SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END)        AS approved_count,
          SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END)            AS paid_count
        FROM ap_invoices
      `),

      // 4. Asset condition distribution
      dbService.executeQuery(`
        SELECT
          condition_label,
          COUNT(*) AS count
        FROM asset_conditions
        WHERE condition_label IS NOT NULL
        GROUP BY condition_label
        ORDER BY
          CASE condition_label
            WHEN 'Excellent'  THEN 1
            WHEN 'Good'       THEN 2
            WHEN 'Fair'       THEN 3
            WHEN 'Poor'       THEN 4
            WHEN 'Very Poor'  THEN 5
          END
      `),

      // 5. Capital projects by status
      dbService.executeQuery(`
        SELECT
          status,
          COUNT(*)                           AS project_count,
          COALESCE(SUM(total_budget), 0)     AS total_budget,
          COALESCE(SUM(total_actual), 0)     AS total_actual,
          COALESCE(SUM(total_committed), 0)  AS total_committed
        FROM projects
        GROUP BY status
        ORDER BY project_count DESC
      `),

      // 6. Service requests by status
      dbService.executeQuery(`
        SELECT status, COUNT(*) AS count
        FROM service_requests
        GROUP BY status
        ORDER BY count DESC
      `),

      // 7. Top expense categories (from GL joined to COA)
      dbService.executeQuery(`
        SELECT
          coa.account_classification,
          COALESCE(SUM(ABS(gl.ytd_activity)), 0) AS ytd_amount
        FROM gl_balances gl
        JOIN chart_of_accounts coa
          ON gl.natural_account = coa.segment_code
         AND gl.council_id = coa.council_id
        WHERE coa.account_type = 'Expense'
        GROUP BY coa.account_classification
        ORDER BY ytd_amount DESC
        LIMIT 8
      `),

      // 8. Employees by department (top 10)
      dbService.executeQuery(`
        SELECT
          department,
          COUNT(*)                                                          AS headcount,
          SUM(CASE WHEN employment_type = 'Full-Time' THEN 1 ELSE 0 END)  AS full_time,
          SUM(CASE WHEN employment_type = 'Part-Time' THEN 1 ELSE 0 END)  AS part_time,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END)              AS active
        FROM employees
        GROUP BY department
        ORDER BY headcount DESC
        LIMIT 10
      `),

      // 9. Active asset count
      dbService.executeQuery(`SELECT COUNT(*) AS total FROM assets WHERE status = 'Active'`),

      // 10. Active employee count
      dbService.executeQuery(`SELECT COUNT(*) AS total FROM employees WHERE status = 'Active'`),
    ]);

    // Assemble KPIs
    const budgetRow = budgetResult.rows[0] || {};
    const apRow = apResult.rows[0] || {};
    const assetCount = assetCountResult.rows[0]?.total || 0;
    const employeeCount = employeeCountResult.rows[0]?.total || 0;

    const openRequests = serviceResult.rows.find((r) => r.status === "Open");
    const pendingRequests = serviceResult.rows.find((r) => r.status === "Pending");
    const totalOpenRequests =
      Number(openRequests?.count || 0) + Number(pendingRequests?.count || 0);

    const totalProjects = projectResult.rows.reduce(
      (sum, r) => sum + Number(r.project_count || 0),
      0
    );

    res.json({
      kpis: {
        totalBudget: Number(budgetRow.total_budget || 0),
        totalRevenueBudget: Number(budgetRow.total_revenue_budget || 0),
        totalExpenseBudget: Number(budgetRow.total_expense_budget || 0),
        outstandingAP: Number(apRow.outstanding_amount || 0),
        openAPInvoices: Number(apRow.open_count || 0) + Number(apRow.approved_count || 0),
        totalAssets: Number(assetCount),
        totalEmployees: Number(employeeCount),
        openServiceRequests: totalOpenRequests,
        totalProjects,
      },
      charts: {
        revenueVsExpenditure: revenueExpResult.rows.map((r) => ({
          account_type: r.account_type,
          ytd_total: Number(r.ytd_total || 0),
        })),
        assetConditions: assetCondResult.rows.map((r) => ({
          condition_label: r.condition_label,
          count: Number(r.count || 0),
        })),
        projectStatus: projectResult.rows.map((r) => ({
          status: r.status,
          project_count: Number(r.project_count || 0),
          total_budget: Number(r.total_budget || 0),
          total_actual: Number(r.total_actual || 0),
        })),
        serviceRequestsByStatus: serviceResult.rows.map((r) => ({
          status: r.status,
          count: Number(r.count || 0),
        })),
        topExpenseCategories: expenseCatResult.rows.map((r) => ({
          account_classification: r.account_classification,
          ytd_amount: Number(r.ytd_amount || 0),
        })),
        employeesByDepartment: employeeResult.rows.map((r) => ({
          department: r.department,
          headcount: Number(r.headcount || 0),
        })),
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[DASHBOARD] Error loading summary:", err);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

module.exports = router;
