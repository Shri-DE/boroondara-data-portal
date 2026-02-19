// absRoutes.js — ABS Census data API for City of Boroondara
const express = require("express");
const dbService = require("./services/dbService");

const router = express.Router();

// Helper: build WHERE clause from optional sa2 + year query params
function buildFilter(query) {
  const clauses = [];
  const params = [];
  let idx = 1;

  if (query.year) {
    clauses.push(`t.census_year = $${idx++}`);
    params.push(Number(query.year));
  }
  if (query.sa2) {
    clauses.push(`a.sa2_code = $${idx++}`);
    params.push(query.sa2);
  }

  const where = clauses.length ? "WHERE " + clauses.join(" AND ") : "";
  return { where, params };
}

// ── GET /api/abs/kpis ───────────────────────────────────
// Aggregated KPIs — optionally filtered by ?year=
router.get("/kpis", async (_req, res) => {
  try {
    const year = Number(_req.query.year) || 2021;
    const sql = `
      SELECT
        SUM(d.population_total)                                       AS total_population,
        ROUND(AVG(d.median_age), 1)                                   AS avg_median_age,
        ROUND(AVG(i.median_household_weekly))                         AS avg_median_household_income,
        ROUND(AVG(i.median_personal_weekly))                          AS avg_median_personal_income,
        SUM(h.total_dwellings)                                        AS total_dwellings,
        ROUND(AVG(h.median_rent_weekly))                              AS avg_median_rent,
        ROUND(AVG(h.median_mortgage_monthly))                         AS avg_median_mortgage,
        ROUND(AVG(e.unemployment_rate), 1)                            AS avg_unemployment_rate,
        ROUND(100.0 * SUM(ed.bachelor_or_higher) /
          NULLIF(SUM(ed.bachelor_or_higher + ed.diploma_cert + ed.year_12_or_equiv + ed.below_year_12), 0), 1)
                                                                      AS pct_bachelor_or_higher,
        ROUND(100.0 * SUM(c.born_overseas) /
          NULLIF(SUM(c.born_australia + c.born_overseas), 0), 1)      AS pct_born_overseas,
        (SELECT COUNT(*) FROM abs_sa2_areas WHERE is_active)          AS sa2_count,
        $1::INT                                                        AS census_year
      FROM abs_demographics d
      JOIN abs_sa2_areas a  ON d.sa2_id = a.sa2_id
      LEFT JOIN abs_income i   ON i.sa2_id = a.sa2_id AND i.census_year = d.census_year
      LEFT JOIN abs_housing h  ON h.sa2_id = a.sa2_id AND h.census_year = d.census_year
      LEFT JOIN abs_employment e ON e.sa2_id = a.sa2_id AND e.census_year = d.census_year
      LEFT JOIN abs_education ed ON ed.sa2_id = a.sa2_id AND ed.census_year = d.census_year
      LEFT JOIN abs_cultural_diversity c ON c.sa2_id = a.sa2_id AND c.census_year = d.census_year
      WHERE d.census_year = $1
    `;
    const result = await dbService.executeQuery(sql, [year]);
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error("[ABS] kpis error:", err.message);
    res.status(500).json({ error: "Failed to load ABS KPIs" });
  }
});

// ── GET /api/abs/sa2-areas ──────────────────────────────
router.get("/sa2-areas", async (_req, res) => {
  try {
    const result = await dbService.executeQuery(
      `SELECT sa2_code, sa2_name, area_sqkm FROM abs_sa2_areas WHERE is_active ORDER BY sa2_name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[ABS] sa2-areas error:", err.message);
    res.status(500).json({ error: "Failed to load SA2 areas" });
  }
});

// ── Generic topic endpoint factory ──────────────────────
function topicRoute(table, fields) {
  return async (req, res) => {
    try {
      const { where, params } = buildFilter(req.query);
      const sql = `
        SELECT a.sa2_code, a.sa2_name, ${fields}
        FROM ${table} t
        JOIN abs_sa2_areas a ON t.sa2_id = a.sa2_id
        ${where}
        ORDER BY a.sa2_name, t.census_year
      `;
      const result = await dbService.executeQuery(sql, params);
      res.json(result.rows);
    } catch (err) {
      console.error(`[ABS] ${table} error:`, err.message);
      res.status(500).json({ error: `Failed to load ${table}` });
    }
  };
}

// ── Topic endpoints ─────────────────────────────────────
router.get("/demographics", topicRoute("abs_demographics",
  `t.census_year, t.population_total, t.population_male, t.population_female,
   t.median_age, t.persons_0_14, t.persons_15_24, t.persons_25_44,
   t.persons_45_64, t.persons_65_plus, t.indigenous_persons, t.australian_citizens`
));

router.get("/housing", topicRoute("abs_housing",
  `t.census_year, t.total_dwellings, t.separate_houses, t.semi_detached, t.apartments,
   t.owned_outright, t.owned_mortgage, t.rented,
   t.median_rent_weekly, t.median_mortgage_monthly, t.avg_household_size, t.avg_bedrooms`
));

router.get("/income", topicRoute("abs_income",
  `t.census_year, t.median_household_weekly, t.median_personal_weekly,
   t.hh_income_0_649, t.hh_income_650_1249, t.hh_income_1250_1999,
   t.hh_income_2000_2999, t.hh_income_3000_plus, t.gini_coefficient`
));

router.get("/education", topicRoute("abs_education",
  `t.census_year, t.bachelor_or_higher, t.diploma_cert, t.year_12_or_equiv,
   t.below_year_12, t.attending_school, t.attending_tafe, t.attending_university, t.preschool_enrolled`
));

router.get("/employment", topicRoute("abs_employment",
  `t.census_year, t.labour_force_total, t.employed_full_time, t.employed_part_time,
   t.unemployed, t.not_in_labour_force, t.unemployment_rate,
   t.top_occupation_1, t.top_occupation_2, t.top_occupation_3,
   t.top_industry_1, t.top_industry_2, t.top_industry_3,
   t.commute_car, t.commute_public_transport, t.commute_walk_cycle, t.work_from_home`
));

router.get("/diversity", topicRoute("abs_cultural_diversity",
  `t.census_year, t.born_australia, t.born_overseas,
   t.born_top_country_1, t.born_top_country_1_name,
   t.born_top_country_2, t.born_top_country_2_name,
   t.born_top_country_3, t.born_top_country_3_name,
   t.speaks_english_only, t.speaks_other_language,
   t.top_language_2, t.top_language_2_name,
   t.top_language_3, t.top_language_3_name,
   t.top_language_4, t.top_language_4_name,
   t.ancestry_top_1, t.ancestry_top_1_name,
   t.ancestry_top_2, t.ancestry_top_2_name,
   t.ancestry_top_3, t.ancestry_top_3_name`
));

// ── GET /api/abs/comparison ─────────────────────────────
// Returns one metric across all SA2 areas for charting
// ?topic=demographics&metric=population_total&year=2021
router.get("/comparison", async (req, res) => {
  try {
    const topic = req.query.topic || "demographics";
    const metric = req.query.metric || "population_total";
    const year = Number(req.query.year) || 2021;

    // Validate table/column to prevent SQL injection
    const validTables = {
      demographics: "abs_demographics",
      housing: "abs_housing",
      income: "abs_income",
      education: "abs_education",
      employment: "abs_employment",
      diversity: "abs_cultural_diversity",
    };
    const table = validTables[topic];
    if (!table) return res.status(400).json({ error: "Invalid topic" });

    // Validate metric is a real column (alphanumeric + underscore only)
    if (!/^[a-z_]+$/.test(metric)) {
      return res.status(400).json({ error: "Invalid metric" });
    }

    const sql = `
      SELECT a.sa2_name, t.${metric} AS value
      FROM ${table} t
      JOIN abs_sa2_areas a ON t.sa2_id = a.sa2_id
      WHERE t.census_year = $1
      ORDER BY t.${metric} DESC NULLS LAST
    `;
    const result = await dbService.executeQuery(sql, [year]);
    res.json(result.rows);
  } catch (err) {
    console.error("[ABS] comparison error:", err.message);
    res.status(500).json({ error: "Failed to load comparison data" });
  }
});

module.exports = router;
