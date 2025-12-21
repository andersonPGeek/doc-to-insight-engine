export interface EntidadeJuridica {
  classificacao: string;
  nome: string;
  cpf: string;
  cnpj: string;
  endereco: string;
  paragrafo: number;
}

export interface CitacaoLei {
  titulo_lei: string;
  artigo: string;
  resumo: string;
  paragrafo: number;
}

export interface SugestaoAnalise {
  id_paragrafo: number;
  paragrafo: string;
  sugestoes: string[];
}

export interface GraficoDado {
  paragrafo: number;
  eixoX: string;
  eixoY: string;
  valores_eixoX: string[];
  valores_eixoY: number[];
}

export interface InfograficoDado {
  icone: string;
  [key: string]: string;
}

export interface Infografico {
  paragrafo: number;
  dados: InfograficoDado[];
}

export interface TimelineFato {
  data: string;
  evento: string;
  icone: string;
}

export interface Timeline {
  paragrafo: number;
  fatos: TimelineFato[];
}

export interface DocumentoAnalise {
  id: number;
  user_id: number;
  nome_arquivo: string;
  tipo_arquivo: string;
  conteudo_texto: string;
  entidade_juridica: EntidadeJuridica[];
  citacoes_de_lei: CitacaoLei[];
  sugestoes_analise: SugestaoAnalise[];
  grafico: GraficoDado[];
  infografico: Infografico[];
  timeline: Timeline[];
  citacoes: { paragrafo: number }[];
  destaque: { paragrafo: number }[];
  categoria_ia: string;
  created_at: string;
  updated_at: string;
  folder_id: number | null;
  projeto_id: number;
  quantidade_palavras: number;
  quantidade_imagens: number;
  tamanho_arquivo: string;
}

export interface ProcessingResult {
  documento: DocumentoAnalise;
  status_ia: string;
}

export interface ProcessingStage {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  duration?: number;
  startTime?: number;
}

export interface ProcessingTimes {
  upload: number;
  extraction: number;
  analysis: number;
  formatting: number;
  total: number;
}
