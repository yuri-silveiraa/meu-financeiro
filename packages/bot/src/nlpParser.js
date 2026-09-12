const CATEGORIA_DEFAULT_MAP = {
  'alimentação': ['mercado', 'supermercado', 'comida', 'ifood', 'restaurante', 'lanchonete', 'padaria', 'acougue', 'feira'],
  'transporte': ['uber', '99', 'gasolina', 'combustivel', 'ônibus', 'metro', 'estacionamento', 'pedágio', 'freio'],
  'saúde': ['farmácia', 'remédio', 'médico', 'hospital', 'consulta', 'exame', 'plano de saúde'],
  'educação': ['faculdade', 'curso', 'livro', 'escola', 'material'],
  'lazer': ['cinema', 'bar', 'show', 'parque', 'viagem', 'jogo', 'streaming', 'netflix', 'spotify'],
  'moradia': ['aluguel', 'condomínio', 'luz', 'água', 'internet', 'telefone', 'gas'],
  'vestuário': ['roupa', 'sapato', 'tênis', 'loja'],
  'pets': ['petshop', 'veterinário', 'ração', 'cachorro', 'gato'],
  'presentes': ['presente', 'aniversário', 'natal'],
  'manutenção': ['conserto', 'manutenção', 'reforma', 'pintura'],
};

const VALOR_PATTERNS = [
  /r\$\s*([\d.,]+)/i,
  /([\d.,]+)\s*(?:reais?|rs)/i,
];

const DATA_PATTERNS = [
  { regex: /hoje/i, offset: 0 },
  { regex: /amanhã/i, offset: 1 },
  { regex: /ontem/i, offset: -1 },
  { regex: /(\d{1,2})\s*(?:de\s*)?([\w]+)(?:\s*de\s*(\d{4}))?/i, custom: true },
];

const MESES = {
  janeiro: 1, fevereiro: 2, março: 3, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

function parseData(text) {
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);

  for (const p of DATA_PATTERNS) {
    if (p.custom) {
      const m = text.match(p.regex);
      if (m) {
        const dia = parseInt(m[1]);
        const mesStr = m[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const mes = MESES[mesStr];
        const ano = m[3] ? parseInt(m[3]) : hoje.getFullYear();
        if (mes) {
          return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        }
      }
    } else if (p.regex.test(text)) {
      const d = new Date(hoje);
      d.setDate(d.getDate() + p.offset);
      return d.toISOString().split('T')[0];
    }
  }
  return hoje.toISOString().split('T')[0];
}

function parseValor(text) {
  for (const p of VALOR_PATTERNS) {
    const m = text.match(p);
    if (m) {
      let val = m[1].replace(/\./g, '').replace(',', '.');
      return parseFloat(val);
    }
  }
  // Tentar encontrar número sozinho (ex: "gastei 45")
  const numMatch = text.match(/(\d+[\.,]?\d*)/);
  if (numMatch) {
    let val = numMatch[1].replace(',', '.');
    const parsed = parseFloat(val);
    if (parsed > 0 && parsed < 100000) return parsed;
  }
  return null;
}

function inferirCategoria(texto, categorias) {
  const lower = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [cat, keywords] of Object.entries(CATEGORIA_DEFAULT_MAP)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        const catNormalized = cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const found = categorias.find(c => {
          const nomeNormalized = c.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          return nomeNormalized.includes(catNormalized) || catNormalized.includes(nomeNormalized);
        });
        if (found) return found.id;
      }
    }
  }
  return null;
}

function inferirTipo(texto) {
  const lower = texto.toLowerCase();
  const padroesReceita = ['recebi', 'ganhei', 'salário', 'salario', 'pagou', 'pagamento recebido', 'freelance', 'extra'];
  for (const p of padroesReceita) {
    if (lower.includes(p)) return 'receita';
  }
  return 'despesa';
}

function inferirTipoPagamento(texto) {
  const lower = texto.toLowerCase();
  if (lower.includes('pix')) return 'pix';
  if (lower.includes('crédito') || lower.includes('credito') || lower.includes('cartão') || lower.includes('cartao')) return 'credito';
  if (lower.includes('débito') || lower.includes('debito')) return 'debito';
  if (lower.includes('dinheiro') || lower.includes('cash')) return 'dinheiro';
  if (lower.includes('boleto')) return 'boleto';
  return null;
}

export function parseTransacao(texto, categorias = []) {
  const valor = parseValor(texto);
  const data = parseData(texto);
  const tipo = inferirTipo(texto);
  const tipo_pagamento = inferirTipoPagamento(texto);
  const categoria_id = inferirCategoria(texto, categorias);

  // Extrair descrição: tudo que sobrou depois de remover valor, data e tipo
  let descricao = texto
    .replace(/r\$\s*[\d.,]+/gi, '')
    .replace(/\d+[\.,]?\d*\s*(?:reais?|rs)?/gi, '')
    .replace(/hoje|amanhã|ontem/gi, '')
    .replace(/pix|crédito|credito|débito|debito|dinheiro|boleto/gi, '')
    .replace(/^(gastei|paguei|comprei|perdi|desembolsei|gasto|recebi|ganhei|entrou|pagou)\s*/gi, '')
    .replace(/^\s*(por|de|no|na|em|com|um|uma)\s+/gi, '')
    .replace(/\s+(por|de|no|na|em|com|um|uma|no|na)\s+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (descricao.length < 3) descricao = null;

  return {
    tipo,
    valor,
    data,
    descricao,
    tipo_pagamento,
    categoria_id,
    ehDespesa: tipo === 'despesa',
    ehReceita: tipo === 'receita',
  };
}

export function extrairPeriodo(texto) {
  const now = new Date();
  const lower = texto.toLowerCase();

  if (lower.includes('hoje')) {
    return { mes: now.getMonth() + 1, ano: now.getFullYear() };
  }
  if (lower.includes('este mês') || lower.includes('esse mês') || lower.includes('mes atual')) {
    return { mes: now.getMonth() + 1, ano: now.getFullYear() };
  }
  if (lower.includes('mês passado') || lower.includes('mes passado') || lower.includes('último mês') || lower.includes('ultimo mes')) {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { mes: d.getMonth() + 1, ano: d.getFullYear() };
  }
  if (lower.includes('ano passado') || lower.includes('ano anterior')) {
    return { mes: now.getMonth() + 1, ano: now.getFullYear() - 1 };
  }

  // Tentar extrair "julho", "agosto", etc.
  for (const [nome, num] of Object.entries(MESES)) {
    if (lower.includes(nome)) {
      const anoMatch = texto.match(/(\d{4})/);
      const ano = anoMatch ? parseInt(anoMatch[1]) : now.getFullYear();
      return { mes: num, ano };
    }
  }

  return { mes: now.getMonth() + 1, ano: now.getFullYear() };
}
