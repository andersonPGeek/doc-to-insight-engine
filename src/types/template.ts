export interface Template {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  colorScheme: {
    primary: string;
    accent: string;
    background: string;
  };
}

export const TEMPLATES: Template[] = [
  {
    id: 'responsabilidade',
    name: 'Termo de Responsabilidade',
    description: 'Layout moderno com barra lateral e timeline',
    previewUrl: '/templates/template-responsabilidade.html',
    colorScheme: {
      primary: '#132238',
      accent: '#f5b041',
      background: '#ffffff',
    },
  },
  {
    id: 'contrato',
    name: 'Contrato de Serviços',
    description: 'Design corporativo com fluxograma visual',
    previewUrl: '/templates/template-contrato.html',
    colorScheme: {
      primary: '#2c5282',
      accent: '#f6ad55',
      background: '#ffffff',
    },
  },
  {
    id: 'procuracao',
    name: 'Procuração',
    description: 'Elegante com cabeçalho gradiente roxo',
    previewUrl: '/templates/template-procuracao.html',
    colorScheme: {
      primary: '#4527a0',
      accent: '#7c43bd',
      background: '#ffffff',
    },
  },
  {
    id: 'alegacoes',
    name: 'Alegações Finais',
    description: 'Estilo institucional com cor vinho',
    previewUrl: '/templates/template-alegacoes.html',
    colorScheme: {
      primary: '#591313',
      accent: '#f2f2f2',
      background: '#ffffff',
    },
  },
  {
    id: 'privacidade',
    name: 'Política de Privacidade',
    description: 'Layout com sidebar azul e cards informativos',
    previewUrl: '/templates/template-privacidade.html',
    colorScheme: {
      primary: '#0d1b45',
      accent: '#3d5afe',
      background: '#ffffff',
    },
  },
  {
    id: 'alegacoes-finais',
    name: 'Alegações Finais (Vinho)',
    description: 'Design vinho com ícones e badges',
    previewUrl: '/templates/template-alegacoes-finais.html',
    colorScheme: {
      primary: '#591313',
      accent: '#fcebeb',
      background: '#ffffff',
    },
  },
  {
    id: 'alimentos',
    name: 'Ação de Alimentos',
    description: 'Layout clássico azul marinho profissional',
    previewUrl: '/templates/template-alimentos.html',
    colorScheme: {
      primary: '#0f3057',
      accent: '#005b96',
      background: '#ffffff',
    },
  },
  {
    id: 'replica',
    name: 'Réplica 360',
    description: 'Design moderno com logo circular',
    previewUrl: '/templates/template-replica.html',
    colorScheme: {
      primary: '#2c3e50',
      accent: '#16a085',
      background: '#ffffff',
    },
  },
  {
    id: 'civel-1',
    name: 'Cível Consumidor I',
    description: 'Layout sidebar navy com laranja',
    previewUrl: '/templates/template-civel-1.html',
    colorScheme: {
      primary: '#2c3e50',
      accent: '#e67e22',
      background: '#ffffff',
    },
  },
  {
    id: 'civel-2',
    name: 'Cível Consumidor II',
    description: 'Variação do modelo cível com sidebar',
    previewUrl: '/templates/template-civel-2.html',
    colorScheme: {
      primary: '#2c3e50',
      accent: '#e67e22',
      background: '#ffffff',
    },
  },
];
