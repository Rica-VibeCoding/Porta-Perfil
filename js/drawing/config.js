/**
 * Configurações para o módulo de desenho SVG
 * Sistema de Portas e Perfis
 */

// Configurações padrão do desenho
export const CONFIG = {
  largura: 595,  // Largura A4 em pixels (reduzida de 794 para 595 - 75%)
  altura: 842,   // Altura A4 em pixels (reduzida de 1123 para 842 - 75%)
  margemX: 45,   // Reduzido proporcionalmente
  margemY: 45,   // Reduzido proporcionalmente
  escala: 0.18,  // Reduzido de 0.20 para 0.15 para manter proporções
  corPerfil: '#E8E8E8',
  corVidro: 'rgba(193, 203, 212, 0.54)',
  corFundo: '#FFFFFF',
  corTexto: '#000000',
  espessuraPerfil: 60,
  espessuraBatente: 10,
  espessuraLinha: 0.5,
  corDobradicaNormal: '#666666',
  corPuxador: '#A0A0A0',
  fonteCota: '\'Inter\', \'Roboto\', \'Arial\', sans-serif',
  tamanhoCota: '12px',
  espessuraCota: '400',
  // Cores para as cotas
  corCotaPorta: '#4285F4',       // Azul Google - para dimensões principais da porta
  corCotaDobradicasCima: '#5D4037', // Marrom escuro - para todas as dobradiças
  corCotaDobradicasMeio: '#5D4037', // Marrom escuro - para todas as dobradiças
  corCotaDobradicasBaixo: '#5D4037', // Marrom escuro - para todas as dobradiças
  corCotaPuxador: '#673AB7'      // Roxo - para dimensões do puxador
};

/**
 * Garante que os valores de configuração estejam válidos
 * Aplica valores mínimos aos parâmetros críticos para evitar erros de renderização
 * Chamado automaticamente durante inicialização
 */
export function validarConfiguracao() {
  // Garantir valores críticos nunca sejam negativos ou zero
  const valoresMinimos = {
    largura: 100,
    altura: 100,
    escala: 0.01,
    espessuraPerfil: 10,
    espessuraLinha: 0.1
  };
  
  // Verificar e corrigir cada valor crítico
  for (const [key, minimo] of Object.entries(valoresMinimos)) {
    if (typeof CONFIG[key] !== 'number' || CONFIG[key] <= 0 || isNaN(CONFIG[key])) {
      console.warn(`[Vibecode] Corrigindo configuração inválida: ${key} = ${CONFIG[key]} → ${minimo}`);
      CONFIG[key] = minimo;
    }
  }
}

// Executar validação imediatamente
validarConfiguracao();

/**
 * Obtém a cor do perfil com base no tipo selecionado
 * @param {string} perfilCor - Tipo de perfil selecionado
 * @returns {string} - Código da cor a ser utilizada
 */
export function obterCorPerfil(perfilCor) {
  // Sempre retorna cinza claro para o perfil
  return '#D3D3D3';
}

/**
 * Obtém a cor do vidro com base no tipo selecionado
 * @param {string} vidroTipo - Tipo de vidro selecionado
 * @returns {string} - Código da cor a ser utilizada
 */
export function obterCorVidro(vidroTipo) {
  const cores = {
    'Incolor': 'rgba(230, 235, 240, 0.35)', // Mais claro e levemente azulado, como vidro real
    'Espelho': 'rgba(220, 220, 225, 0.70)', // Tom espelhado, com alta reflectividade
    'Espelho Bronze': 'rgba(160, 120, 80, 0.70)', // Tom espelhado bronzeado
    'Espelho Fumê': 'rgba(100, 100, 105, 0.70)', // Tom escuro espelhado
    'Refleta Bronze': 'rgba(150, 110, 70, 0.55)', // Tom bronzeado mais intenso e metálico
    'Refleta Fume': 'rgba(90, 90, 95, 0.55)', // Tom fumê mais metálico e reflectivo
    'Refleta Prata': 'rgba(190, 200, 210, 0.60)', // Prateado mais metálico e reflectivo
    'Fumê': 'rgba(80, 80, 85, 0.45)', // Tom mais escuro e levemente opaco
    'Branco': 'rgba(240, 240, 240, 0.70)', // Branco fosco
    'Super Branco': 'rgba(250, 250, 250, 0.75)', // Branco ainda mais claro
    'Preto': 'rgba(20, 20, 20, 0.70)', // Preto profundo
    'Canelado': 'rgba(220, 225, 230, 0.40)', // Textura linear sutil
    'Acidato': 'rgba(235, 235, 235, 0.40)', // Tom branco fosco e texturizado
    'Acidato Fume': 'rgba(120, 120, 125, 0.40)', // Tom fumê fosco e texturizado
    'Mini Boreal': 'rgba(230, 230, 235, 0.45)', // Textura tipo boreal
    'Colorido': 'rgba(180, 140, 220, 0.50)' // Tom levemente colorido
  };
  
  return cores[vidroTipo] || CONFIG.corVidro;
} 