const MAX_TABLE_ROWS = 50;

function formatMarkdownTable(rows, fields) {
  if (!rows || rows.length === 0 || !fields || fields.length === 0) {
    return "_No results returned._";
  }

  const columnNames = fields.map((f) => f.name);

  // Header row
  const header = "| " + columnNames.join(" | ") + " |";
  const separator = "| " + columnNames.map(() => "---").join(" | ") + " |";

  // Data rows (cap at MAX_TABLE_ROWS)
  const displayRows = rows.slice(0, MAX_TABLE_ROWS);
  const dataLines = displayRows.map((row) => {
    const cells = columnNames.map((col) => {
      const val = row[col];
      if (val === null || val === undefined) return "";
      return String(val).replace(/\|/g, "\\|");
    });
    return "| " + cells.join(" | ") + " |";
  });

  let table = [header, separator, ...dataLines].join("\n");

  if (rows.length > MAX_TABLE_ROWS) {
    table += `\n\n_Showing first ${MAX_TABLE_ROWS} of ${rows.length} rows._`;
  }

  return table;
}

function formatResponse({
  query,
  sql,
  explanation,
  rows,
  fields,
  rowCount,
  tokensUsed,
  model,
  startTime,
  sessionId,
  exampleQueries,
}) {
  const table = formatMarkdownTable(rows, fields);

  const parts = [];

  if (explanation) {
    parts.push(explanation);
  }

  parts.push(`**${rowCount ?? rows?.length ?? 0} row(s) returned.**`);
  parts.push(table);

  const response = parts.join("\n\n");

  return {
    response,
    sessionId: sessionId || `session-${Date.now()}`,
    citations: [
      {
        id: "sql-query",
        source: "Generated SQL",
        excerpt: sql,
      },
    ],
    suggestions: exampleQueries || [],
    metadata: {
      tokensUsed: tokensUsed || 0,
      responseTime: Date.now() - (startTime || Date.now()),
      model: model || "unknown",
    },
    // Structured data for chart visualisation (ALL rows, not capped)
    chartData:
      rows && rows.length > 0 && fields && fields.length > 0
        ? {
            rows: rows,
            fields: fields.map((f) => ({
              name: f.name,
              dataType: f.dataTypeID || f.dataType || "text",
            })),
            rowCount: rows.length,
          }
        : null,
  };
}

module.exports = { formatResponse };
