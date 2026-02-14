const axios = require("axios");

const CHAT_SYSTEM_PROMPT = `You are a helpful data analyst assistant. The user may upload files (CSV, Excel, JSON, TXT) for you to analyse.

RESPONSE GUIDELINES:
- Analyse the uploaded file data thoroughly and provide clear, actionable insights.
- Use markdown tables to present structured data when appropriate.
- Use bullet points, headings, and bold text for readability.
- If the data contains numbers, provide summary statistics (totals, averages, min, max) where relevant.
- If asked to "analyse this file", provide: a summary of what the data contains, key statistics, notable patterns or outliers, and suggestions for further analysis.
- If no file is uploaded and the user asks a general question, respond naturally and helpfully.
- Keep responses concise but comprehensive.
`;

async function chat(query, fileContext) {
  const endpoint = process.env.AZURE_AI_ENDPOINT;
  const apiKey = process.env.AZURE_AI_API_KEY;
  const deployment = process.env.AZURE_AI_MODEL_DEPLOYMENT || "gpt-4.1";

  if (!endpoint) throw new Error("AZURE_AI_ENDPOINT is not configured");
  if (!apiKey) throw new Error("AZURE_AI_API_KEY is not configured");

  let url;
  try {
    url = new URL(
      `/openai/deployments/${deployment}/chat/completions?api-version=2024-12-01-preview`,
      endpoint
    );
  } catch (err) {
    throw new Error(`Invalid Azure AI Foundry endpoint URL: ${err.message}`);
  }

  let systemMessage = CHAT_SYSTEM_PROMPT;

  if (fileContext) {
    systemMessage += `\n\nUPLOADED FILE DATA:\n${fileContext}`;
  }

  const response = await axios.post(
    url.toString(),
    {
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: query },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    },
    {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      timeout: 60000, // 60s — file analysis can take longer
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

  return { response: content.trim(), tokensUsed, model };
}

module.exports = { chat };
