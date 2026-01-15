import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VISUAL_ELEMENTS = [
  "grafico_barra",
  "grafico_pizza", 
  "grafico_linha",
  "infografico",
  "timeline",
  "citacoes",
  "titulo1",
  "titulo2",
  "titulo3",
  "destaque",
  "cabecalho",
  "rodape",
  "barra_progresso",
  "tabela",
  "resumo",
  "qrcode",
  "fluxograma",
  "checklist"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      text, 
      fileName, 
      fileType, 
      wordCount, 
      fileSize, 
      model = 'gemini-flash',
      templateId,
      templateCss,
      templateColors,
      mode = 'json'
    } = await req.json();
    
    console.log('Starting document analysis:', { fileName, wordCount, model, mode, templateId });
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const modelMap: Record<string, string> = {
      'gemini-flash': 'google/gemini-2.5-flash',
      'gemini-pro': 'google/gemini-2.5-pro',
      'gpt-5': 'openai/gpt-5',
      'gpt-5-mini': 'openai/gpt-5-mini',
    };

    const selectedModel = modelMap[model] || 'google/gemini-2.5-flash';
    console.log('Using model:', selectedModel);

    let systemPrompt: string;
    let userPrompt: string;

    if (mode === 'visual') {
      systemPrompt = `Você é um especialista em Visual Law e design jurídico. Sua tarefa é transformar documentos de texto simples em HTML estilizado e visualmente rico.

ELEMENTOS VISUAIS QUE VOCÊ DEVE IDENTIFICAR E GERAR:
${VISUAL_ELEMENTS.map(el => `- ${el}`).join('\n')}

INSTRUÇÕES IMPORTANTES:
1. Analise o documento e identifique onde cada elemento visual se encaixa
2. NÃO force elementos - só adicione se fizer sentido no contexto
3. Use as cores do template: Primary: ${templateColors?.primary || '#2c3e50'}, Accent: ${templateColors?.accent || '#e67e22'}
4. Gere HTML semântico e CSS inline quando necessário
5. Para gráficos, crie SVG inline (não use bibliotecas externas)
6. Para QR codes, substitua links por placeholder com texto "[QR Code: URL]"
7. Mantenha o conteúdo original mas organize visualmente

FORMATO DE RESPOSTA (JSON):
{
  "html": "<div class='page'>... HTML completo do documento ...</div>",
  "css": "/* CSS adicional necessário */",
  "summary": "Resumo do documento em até 3 linhas",
  "elementsFound": ["lista", "dos", "elementos", "identificados"]
}

ESTILOS BASE A USAR:
- Fonte: 'Open Sans', sans-serif
- Página A4: width: 210mm; min-height: 297mm
- Bordas arredondadas: border-radius: 8px
- Sombras suaves: box-shadow: 0 4px 6px rgba(0,0,0,0.1)

EXEMPLOS DE ELEMENTOS:

1. TIMELINE:
<div class="timeline">
  <div class="timeline-item">
    <div class="timeline-date">Data</div>
    <div class="timeline-content">Evento</div>
  </div>
</div>

2. GRÁFICO DE BARRA (SVG):
<svg class="bar-chart" viewBox="0 0 400 200">
  <rect x="10" y="50" width="60" height="100" fill="${templateColors?.accent || '#e67e22'}"/>
  <text x="40" y="170" text-anchor="middle">Label</text>
</svg>

3. DESTAQUE:
<div class="highlight-box" style="border-left: 4px solid ${templateColors?.accent || '#e67e22'}; padding: 15px; background: ${templateColors?.primary}10;">
  Texto destacado
</div>

4. INFOGRÁFICO:
<div class="infographic">
  <div class="info-item">
    <div class="info-icon">📊</div>
    <div class="info-label">Label</div>
    <div class="info-value">Valor</div>
  </div>
</div>

5. TABELA:
<table class="styled-table">
  <thead><tr><th>Coluna</th></tr></thead>
  <tbody><tr><td>Dado</td></tr></tbody>
</table>

6. CHECKLIST:
<ul class="checklist">
  <li class="check-item checked">✓ Item completo</li>
  <li class="check-item">○ Item pendente</li>
</ul>

7. BARRA DE PROGRESSO:
<div class="progress-container">
  <div class="progress-bar" style="width: 75%;"></div>
  <span class="progress-label">75%</span>
</div>

8. FLUXOGRAMA:
<div class="flowchart">
  <div class="flow-step">Etapa 1</div>
  <div class="flow-arrow">→</div>
  <div class="flow-step">Etapa 2</div>
</div>

RESPONDA APENAS COM JSON VÁLIDO, sem markdown.`;

      userPrompt = `Transforme este documento em Visual Law usando o template "${templateId}":

Arquivo: ${fileName} (${fileType})
Tamanho: ${fileSize}
Palavras: ${wordCount}

CONTEÚDO DO DOCUMENTO:
${text}

Analise e identifique os elementos visuais apropriados. Gere o HTML estilizado.`;

    } else {
      // Original JSON mode
      systemPrompt = `Você é um especialista em análise de documentos jurídicos brasileiros. Extraia informações estruturadas rapidamente.

INSTRUÇÕES:
- Extraia entidades jurídicas (partes, advogados, testemunhas)
- Identifique citações de leis e artigos
- Forneça 2-3 sugestões de melhorias
- Crie timeline se houver datas relevantes

RESPONDA APENAS COM JSON VÁLIDO.`;

      userPrompt = `Analise este documento jurídico:

Arquivo: ${fileName} (${fileType})
Tamanho: ${fileSize}
Palavras: ${wordCount}

${text}`;
    }

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
          { role: 'user', content: userPrompt }
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

    let jsonResult;
    try {
      jsonResult = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonResult = JSON.parse(jsonMatch[1].trim());
      } else {
        const startIndex = content.indexOf('{');
        const endIndex = content.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
          jsonResult = JSON.parse(content.slice(startIndex, endIndex + 1));
        } else {
          throw new Error('Não foi possível extrair JSON da resposta');
        }
      }
    }

    // For visual mode, ensure we have all required fields
    if (mode === 'visual') {
      jsonResult = {
        html: jsonResult.html || '<div class="page"><p>Erro ao gerar documento</p></div>',
        css: jsonResult.css || '',
        summary: jsonResult.summary || 'Documento processado',
        elementsFound: jsonResult.elementsFound || [],
      };
      
      // Inject additional CSS if template CSS was provided
      if (templateCss) {
        jsonResult.css = templateCss + '\n\n/* Generated styles */\n' + jsonResult.css;
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
