import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SCHEMA_TEMPLATE = `{
  "documento": {
    "id": number,
    "user_id": number,
    "nome_arquivo": "string",
    "tipo_arquivo": "string",
    "conteudo_texto": "HTML formatado do documento",
    "entidade_juridica": [
      {
        "classificacao": "Autor/Réu/Testemunha/etc",
        "nome": "string",
        "cpf": "string ou vazio",
        "cnpj": "string ou vazio",
        "endereco": "string",
        "paragrafo": number
      }
    ],
    "citacoes_de_lei": [
      {
        "titulo_lei": "Nome completo da lei",
        "artigo": "Artigo citado",
        "resumo": "Resumo do que dispõe",
        "paragrafo": number
      }
    ],
    "sugestoes_analise": [
      {
        "id_paragrafo": number,
        "paragrafo": "Trecho do texto",
        "sugestoes": ["sugestão 1", "sugestão 2"]
      }
    ],
    "grafico": [
      {
        "paragrafo": number,
        "eixoX": "descrição do eixo X",
        "eixoY": "descrição do eixo Y",
        "valores_eixoX": ["valor1", "valor2"],
        "valores_eixoY": [numero1, numero2]
      }
    ],
    "infografico": [
      {
        "paragrafo": number,
        "dados": [
          {
            "icone": "URL do ícone",
            "chave 1": "descrição",
            "valor 1": "valor"
          }
        ]
      }
    ],
    "timeline": [
      {
        "paragrafo": number,
        "fatos": [
          {
            "data": "YYYY-MM-DD",
            "evento": "descrição do evento",
            "icone": "URL do ícone"
          }
        ]
      }
    ],
    "citacoes": [{ "paragrafo": number }],
    "destaque": [{ "paragrafo": number }],
    "categoria_ia": "Classificação do tipo de documento jurídico",
    "created_at": "ISO date string",
    "updated_at": "ISO date string",
    "folder_id": null,
    "projeto_id": number,
    "quantidade_palavras": number,
    "quantidade_imagens": number,
    "tamanho_arquivo": "string"
  },
  "status_ia": "Processado"
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, fileName, fileType, wordCount, fileSize, model = 'gemini-flash' } = await req.json();
    
    console.log('Starting document analysis:', { fileName, wordCount, model });
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Model mapping for faster processing
    const modelMap: Record<string, string> = {
      'gemini-flash': 'google/gemini-2.5-flash',
      'gemini-pro': 'google/gemini-2.5-pro',
      'gpt-5': 'openai/gpt-5',
      'gpt-5-mini': 'openai/gpt-5-mini',
    };

    const selectedModel = modelMap[model] || 'google/gemini-2.5-flash';
    console.log('Using model:', selectedModel);

    const systemPrompt = `Você é um especialista em análise de documentos jurídicos brasileiros. Extraia informações estruturadas rapidamente.

Schema JSON esperado:
${SCHEMA_TEMPLATE}

INSTRUÇÕES (seja direto e eficiente):
- Extraia entidades jurídicas (partes, advogados, testemunhas)
- Identifique citações de leis e artigos
- Forneça 2-3 sugestões de melhorias
- Crie timeline se houver datas relevantes
- O conteudo_texto deve ser HTML formatado
- Use "https://exemplo.com/icones/[nome].png" para ícones
- Tamanho: "${fileSize}", Palavras: ${wordCount}

RESPONDA APENAS COM JSON VÁLIDO.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analise este documento jurídico:\n\nArquivo: ${fileName} (${fileType})\n\n${text}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit exceeded');
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        console.error('Payment required');
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos em Configurações.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`Erro na API de IA: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Resposta vazia da IA');
    }

    console.log('AI response received, parsing JSON...');

    // Try to extract JSON from the response
    let jsonResult;
    try {
      // First, try to parse directly
      jsonResult = JSON.parse(content);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonResult = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to find JSON object in the response
        const startIndex = content.indexOf('{');
        const endIndex = content.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
          jsonResult = JSON.parse(content.slice(startIndex, endIndex + 1));
        } else {
          throw new Error('Não foi possível extrair JSON da resposta');
        }
      }
    }

    console.log('Document analysis completed successfully');

    return new Response(
      JSON.stringify(jsonResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-document:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
