/**
 * Funções básicas para manipulação SVG
 * Sistema de Portas e Perfis
 */

import { CONFIG } from './config.js';

// Referências globais para o SVG
let svgContainer = null;
let svgElement = null;
const containerElement = null;

// Contador global de correções para evitar mensagens repetitivas 
// (reset após cada nova renderização completa)
let contadorCorrecoes = {
  width: 0,
  height: 0
};

/**
 * Inicializa o SVG de desenho
 * @param {string} containerId - ID do elemento que vai conter o SVG
 * @returns {boolean} - Status da inicialização
 */
export function inicializarCanvas(containerId) {
  console.log(`[INIT] Tentando inicializar SVG com ID '${containerId}'...`);
  
  try {
    // Verificar se o elemento existe e seu estado
    const containerElement = document.getElementById(containerId);
    console.log('[INIT] Elemento contentor encontrado:', !!containerElement);
    
    if (!containerElement) {
      console.error(`[INIT] Contêiner com ID '${containerId}' não encontrado`);
      return false;
    }
    
    // NOVO: Verificar e remover quaisquer SVGs existentes que possam causar duplicação
    const svgsExistentes = containerElement.querySelectorAll('svg');
    if (svgsExistentes.length > 0) {
      console.warn(`[INIT] Encontrados ${svgsExistentes.length} elementos SVG existentes. Removendo para evitar duplicação.`);
      svgsExistentes.forEach(svg => svg.remove());
      // Forçar reflow do DOM após remoção
      void containerElement.offsetHeight;
    }
  
    // Limpar o contêiner de qualquer outro conteúdo
    containerElement.innerHTML = '';
  
    // Definir estilo do contêiner para garantir que ele seja visível
    containerElement.style.display = 'flex';
    containerElement.style.justifyContent = 'center';
    containerElement.style.alignItems = 'center';
    containerElement.style.width = '100%';
    containerElement.style.height = '100%';
    containerElement.style.position = 'relative';
    containerElement.style.backgroundColor = 'transparent';
    containerElement.style.padding = '0';
    containerElement.style.margin = '0';
    containerElement.style.overflow = 'hidden';
    
    // Criar o SVG diretamente como filho do contentor
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${CONFIG.largura} ${CONFIG.altura}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.backgroundColor = 'transparent';
    svg.style.border = 'none';
    svg.style.boxShadow = 'none';
    svg.style.display = 'block';
    svg.style.position = 'relative';
    svg.style.zIndex = '10';
    
    // Adicionar o SVG ao contêiner
    containerElement.appendChild(svg);
    
    // Definir as variáveis globais
    svgContainer = svg;
    svgElement = svg;
    
    // DIAGNÓSTICO: Verificar se o SVG foi adicionado corretamente
    const svgInDom = document.querySelector(`#${containerId} > svg`);
    console.log('[INIT] SVG adicionado ao DOM:', !!svgInDom);
    console.log('[INIT] svgContainer definido:', svgContainer !== null);
    console.log('[INIT] svgContainer é um elemento do tipo:', svgContainer.tagName);
    
    if (!svgInDom) {
      console.error('[INIT] Falha ao adicionar SVG ao DOM');
      return false;
    }
    
    // Desenhar um retângulo de teste para confirmar que o SVG está funcionando
    const testRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    testRect.setAttribute('x', '10');
    testRect.setAttribute('y', '10');
    testRect.setAttribute('width', '100');
    testRect.setAttribute('height', '50');
    testRect.setAttribute('fill', 'green');
    svgContainer.appendChild(testRect);
    
    // Verificar se o retângulo foi adicionado
    const rectInSvg = svgContainer.querySelector('rect');
    console.log('[INIT] Retângulo de teste adicionado:', !!rectInSvg);
    
    if (!rectInSvg) {
      console.error('[INIT] Falha ao adicionar elementos ao SVG');
      return false;
    }
    
    console.log('[INIT] SVG inicializado com sucesso');
    return true;
  }
  catch (error) {
    console.error('[INIT] Erro ao inicializar SVG:', error);
    return false;
  }
}

/**
 * Limpa o SVG
 */
export function limparCanvas() {
  console.log('[CLEAN] Tentando limpar canvas. svgContainer:', svgContainer);
  console.log('[CLEAN] svgContainer é válido:', svgContainer !== null && svgContainer !== undefined);
  
  if (!svgContainer) {
    console.error('[CLEAN] SVG não inicializado - limparCanvas falhou');
    return;
  }
  
  try {
    // Tentar limpar usando firstChild enquanto houver filhos
    while (svgContainer.firstChild) {
      svgContainer.removeChild(svgContainer.firstChild);
    }
  
    console.log('[CLEAN] SVG limpo com sucesso');
  }
  catch (error) {
    console.error('[CLEAN] Erro ao limpar SVG:', error);
    
    // Método alternativo em caso de erro
    try {
      svgContainer.innerHTML = '';
      console.log('[CLEAN] SVG limpo usando innerHTML');
    }
    catch (innerError) {
      console.error('[CLEAN] Falha em ambos os métodos para limpar SVG:', innerError);
    }
  }
}

/**
 * Reseta o contador de correções quando um novo desenho é iniciado
 */
export function resetarContadorCorrecoes() {
  contadorCorrecoes = {
    width: 0,
    height: 0
  };
}

/**
 * Cria um elemento SVG com os atributos especificados
 * @param {string} tipo - Tipo do elemento (rect, circle, etc.)
 * @param {Object} atributos - Objeto contendo os atributos para o elemento
 * @returns {SVGElement} Elemento SVG criado
 */
export function criarElementoSVG(tipo, atributos) {
  try {
    // Validar valores para evitar erros SVG com valores negativos
    if (tipo === 'rect') {
      if (atributos.width !== undefined && parseFloat(atributos.width) < 0) {
        // Mostrar o aviso no máximo 1 vez por desenho
        if (contadorCorrecoes.width === 0) {
          console.warn(`[Vibecode] Corrigindo width negativo (${atributos.width}) para zero`);
          contadorCorrecoes.width++;
        }
        atributos.width = 0;
      }
      
      if (atributos.height !== undefined && parseFloat(atributos.height) < 0) {
        // Mostrar o aviso no máximo 1 vez por desenho
        if (contadorCorrecoes.height === 0) {
          console.warn(`[Vibecode] Corrigindo height negativo (${atributos.height}) para zero`);
          contadorCorrecoes.height++;
        }
        atributos.height = 0;
      }
    }
    
    const elemento = document.createElementNS('http://www.w3.org/2000/svg', tipo);
    
    // Definir atributos no elemento
    for (const chave in atributos) {
      elemento.setAttribute(chave, atributos[chave]);
    }
    
    return elemento;
  } catch (error) {
    console.error(`[ERRO Vibecode] Falha ao criar elemento SVG ${tipo}:`, error);
    return null;
  }
}

/**
 * Captura o desenho atual como uma imagem
 * @param {string} formato - Formato da imagem (png, jpeg)
 * @returns {Promise<string>} - URL da imagem
 */
export function capturarImagemCanvas(formato = 'png') {
  return new Promise((resolve, reject) => {
    if (!svgContainer) {
      reject('SVG não inicializado');
      return;
    }
    
    try {
      // Implementação da captura de imagem...
      // Este é um placeholder, a implementação real depende de bibliotecas específicas
      // ou de APIs do navegador
      const dataUrl = 'data:image/png;base64,placeholder';
      resolve(dataUrl);
    }
    catch (error) {
      reject(`Erro ao capturar imagem: ${error.message}`);
    }
  });
}

/**
 * Exporta a referência para o container SVG (para uso em outros módulos)
 */
export function getSvgContainer() {
  return svgContainer;
}

/**
 * Aplica-se um fundo branco ao SVG
 */
export function aplicarFundoBranco() {
  if (!svgContainer) {
    return;
  }
  
  const fundo = criarElementoSVG('rect', {
    x: 0,
    y: 0,
    width: CONFIG.largura,
    height: CONFIG.altura,
    fill: '#FFFFFF', // Branco sólido
    stroke: 'none'
  });
  svgContainer.appendChild(fundo);
}

// Aliases para manter compatibilidade com o código que usa drawing-svg.js
export const inicializarSVG = inicializarCanvas;
export const limparSVG = limparCanvas; 