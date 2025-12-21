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
    const { text, fileName, fileType, wordCount, fileSize } = await req.json();
    
    console.log('Starting document analysis:', { fileName, wordCount });
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Você é um especialista em análise de documentos jurídicos brasileiros. Sua tarefa é extrair informações estruturadas de petições, contratos, sentenças e outros documentos legais.

Analise o documento fornecido e preencha o seguinte schema JSON:

${SCHEMA_TEMPLATE}

INSTRUÇÕES IMPORTANTES:
1. Extraia TODAS as entidades jurídicas mencionadas (partes, advogados, testemunhas, etc.)
2. Identifique TODAS as citações de leis, artigos e normas
3. Forneça sugestões de melhorias para parágrafos importantes
4. Se houver dados quantitativos ou temporais, crie gráficos e timelines
5. O campo "conteudo_texto" deve conter o texto formatado em HTML
6. Use ícones placeholder como "https://exemplo.com/icones/[nome].png"
7. Classifique corretamente o tipo de documento na categoria_ia
8. Gere valores realistas para id, user_id e projeto_id (números inteiros)
9. As datas devem estar no formato ISO (YYYY-MM-DDTHH:mm:ss.000000Z)
10. O tamanho do arquivo deve ser "${fileSize}"
11. A quantidade de palavras é ${wordCount}

RESPONDA APENAS COM O JSON VÁLIDO, SEM EXPLICAÇÕES ADICIONAIS.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analise o seguinte documento jurídico e extraia as informações no formato JSON especificado:\n\nNome do arquivo: ${fileName}\nTipo: ${fileType}\n\n${text}` }
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
