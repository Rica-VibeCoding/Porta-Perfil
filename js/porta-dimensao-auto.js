/**
 * Módulo para ajustar automaticamente as dimensões da porta quando o tipo de porta for alterado
 * 
 * Este é um módulo independente e pode ser facilmente removido se necessário.
 * Para desativá-lo, basta remover a inclusão do script no index.html.
 */

// Mapeamento dos tipos de porta para suas dimensões padrão usando formato padrão do sistema
const PADROES_DIMENSAO_PORTA = {
  'Abrir Superior Direita': { largura: 450, altura: 2450, quantidade: 1 },
  'Abrir Superior Esquerda': { largura: 450, altura: 2450, quantidade: 1 },
  'Abrir Inferior Direita': { largura: 450, altura: 2450, quantidade: 1 },
  'Abrir Inferior Esquerda': { largura: 450, altura: 2450, quantidade: 1 },
  'Basculante': { largura: 1000, altura: 450, quantidade: 1 },
  'Deslizante': { largura: 1000, altura: 2450, quantidade: 1 }
};

// Mapeamento entre o valor do select e o formato padrão usado pelo sistema
const MAPEAMENTO_TIPOS_PORTA = {
  'superiorDireita': 'Abrir Superior Direita',
  'superiorEsquerda': 'Abrir Superior Esquerda',
  'inferiorDireita': 'Abrir Inferior Direita',
  'inferiorEsquerda': 'Abrir Inferior Esquerda',
  'basculante': 'Basculante',
  'deslizante': 'Deslizante'
};

// Função para ajustar as dimensões com base no tipo de porta
function ajustarDimensoesPorTipo() {
  // Encontrar o elemento select que contém os tipos de porta
  const funcaoPorta = document.getElementById('funcaoPorta');
  if (!funcaoPorta) {
    console.error('ERRO: Elemento com ID \'funcaoPorta\' NÃO encontrado!'); // Manter este erro crítico
    return;
  }
  
  // Encontrar os inputs de dimensão
  const larguraInput = document.getElementById('larguraInput');
  const alturaInput = document.getElementById('alturaInput');
  const quantidadeInput = document.getElementById('quantidadeInput');
  
  if (!larguraInput || !alturaInput) return; // Saída silenciosa se inputs não encontrados
  
  // Valor inicial para evitar alteração no carregamento
  let valorInicial = funcaoPorta.value;
  
  // Adicionar listener para o evento de mudança no select
  funcaoPorta.addEventListener('change', () => {
    const tipoSelecionado = funcaoPorta.value;
    
    // Evitar ajuste no carregamento inicial
    if (tipoSelecionado === valorInicial) {
      valorInicial = null; // Reset após primeiro uso
      return;
    }
    
    // Converter o valor do select para o formato padrão do sistema
    const tipoPadronizado = MAPEAMENTO_TIPOS_PORTA[tipoSelecionado] || tipoSelecionado;
    
    // Obter as dimensões padrão para o tipo selecionado
    const dimensoesPadrao = PADROES_DIMENSAO_PORTA[tipoPadronizado];
    
    if (!dimensoesPadrao) {
      console.warn(`Dimensões padrão não encontradas para o tipo: ${tipoSelecionado} (${tipoPadronizado})`); // Manter este aviso
      return;
    }
    
    // Aplicar as dimensões padrão
    larguraInput.value = dimensoesPadrao.largura;
    alturaInput.value = dimensoesPadrao.altura;
    if (quantidadeInput) {
      quantidadeInput.value = dimensoesPadrao.quantidade;
    }
    
    // Disparar eventos para atualizar campos dependentes
    larguraInput.dispatchEvent(new Event('change'));
    alturaInput.dispatchEvent(new Event('change'));
    if (quantidadeInput) {
      quantidadeInput.dispatchEvent(new Event('change'));
    }
    
    // Atualizar configuração global se a função estiver disponível
    if (typeof window.atualizarConfiguracao === 'function') {
      const configParaAtualizar = {
        largura: dimensoesPadrao.largura,
        altura: dimensoesPadrao.altura,
        quantidade: dimensoesPadrao.quantidade,
        funcao: tipoPadronizado
      };
      window.atualizarConfiguracao(configParaAtualizar);
    } else {
      console.warn('Função window.atualizarConfiguracao não encontrada.'); // Manter este aviso
    }
    
    // Redesenhar se a função estiver disponível
    if (typeof window.desenharPorta === 'function' && typeof window.obterConfiguracaoAtual === 'function') {
      window.desenharPorta(window.obterConfiguracaoAtual(), true);
    } else {
      console.warn('Função window.desenharPorta ou obterConfiguracaoAtual não encontrada para redesenhar.'); // Manter este aviso
    }
  });
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', ajustarDimensoesPorTipo);

// Exportar função para uso global
if (typeof window !== 'undefined') {
  window.ajustarDimensoesPorTipo = ajustarDimensoesPorTipo;
}

console.log('Módulo porta-dimensao-auto carregado'); // Manter log de carregamento 