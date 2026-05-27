import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Edge function: extrai tarefas acionáveis de um texto livre via Google Gemini Flash.
// Configurar GEMINI_API_KEY como secret no Supabase:
//   supabase secrets set GEMINI_API_KEY=... --project-ref vyfcfvozwizobnjsxnmq

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "gemini-2.5-flash"; // free tier real, alta qualidade
const SYSTEM_PROMPT =
  "Você é assistente que extrai tarefas acionáveis de mensagens, briefings e anotações de gestão de tráfego pago. Responda APENAS com JSON válido, sem texto extra antes ou depois.";

const TASK_SCHEMA = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título curto e acionável" },
          description: { type: "string", description: "Detalhe opcional" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          due_date: { type: "string", description: "YYYY-MM-DD se mencionado" },
        },
        required: ["title", "priority"],
      },
    },
  },
  required: ["tasks"],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return jsonResponse({ error: "text required" }, 400);
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return jsonResponse({ error: "GEMINI_API_KEY not configured" }, 500);
    }

    const userPrompt = `Extraia as tarefas claras e acionáveis do texto abaixo. Se nenhum prazo for mencionado, omita due_date. Use priority high apenas para itens com urgência explícita.\n\nTEXTO:\n${text}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: TASK_SCHEMA,
        },
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      if (resp.status === 429) {
        return jsonResponse({ error: "Limite de requisições atingido. Tente em instantes." }, 429);
      }
      if (resp.status === 403) {
        return jsonResponse({ error: "API key inválida ou sem permissão." }, 403);
      }
      return jsonResponse({ error: "Erro na IA", detail }, 500);
    }

    const json = await resp.json();
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return jsonResponse({ tasks: [] });

    try {
      const parsed = JSON.parse(raw);
      const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
      return jsonResponse({ tasks });
    } catch {
      return jsonResponse({ error: "Resposta da IA não pôde ser interpretada.", raw }, 502);
    }
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
