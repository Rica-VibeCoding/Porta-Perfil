/**
 * Funções básicas para manipulação SVG
 * Sistema de Portas e Perfis
 * @module drawing/core
 */

import { CONFIG } from './config.js';

// Referências globais para o SVG
let svgContainer = null;
let svgElement = null;

// Contador global de correções para evitar mensagens repetitivas 
// (reset após cada nova renderização completa)
let contadorCorrecoes = {
  width: 0,
  height: 0
};

// Contador de tentativas de inicialização para controle de recuperação
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

/**
 * Inicializa o SVG de desenho
 * @param {string} containerId - ID do elemento que vai conter o SVG
 * @returns {boolean} - Status da inicialização
 */
export function inicializarCanvas(containerId) {
  console.log(`[INIT] Tentando inicializar SVG com ID '${containerId}'...`);
  
  try {
    // Incrementar contador de tentativas
    initAttempts++;
    
    // Verificar se o elemento existe e seu estado
    const containerElement = document.getElementById(containerId);
    
    if (!containerElement) {
      console.error(`[INIT] Contêiner com ID '${containerId}' não encontrado`);
      return tryRecoverInitialization(containerId);
    }
    
    // Verificar e remover quaisquer SVGs existentes que possam causar duplicação
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
    setContainerStyles(containerElement);
    
    // Criar o SVG diretamente como filho do contentor
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${CONFIG.largura} ${CONFIG.altura}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    setSvgStyles(svg);
    
    // Adicionar o SVG ao contêiner
    containerElement.appendChild(svg);
    
    // Definir as variáveis globais
    svgContainer = svg;
    svgElement = svg;
    
    // DIAGNÓSTICO: Verificar se o SVG foi adicionado corretamente
    const svgInDom = document.querySelector(`#${containerId} > svg`);
    
    if (!svgInDom) {
      console.error('[INIT] Falha ao adicionar SVG ao DOM');
      return tryRecoverInitialization(containerId);
    }
    
    // Verificar se podemos manipular o SVG adicionando um elemento de teste
    if (!testSvgManipulation()) {
      console.error('[INIT] Falha no teste de manipulação do SVG');
      return tryRecoverInitialization(containerId);
    }
    
    // Sucesso - resetar contador de tentativas
    console.log('[INIT] SVG inicializado com sucesso');
    initAttempts = 0;
    return true;
  }
  catch (error) {
    console.error('[INIT] Erro ao inicializar SVG:', error);
    return tryRecoverInitialization(containerId);
  }
}

/**
 * Tenta recuperar a inicialização do SVG após uma falha
 * @param {string} containerId - ID do elemento que vai conter o SVG
 * @returns {boolean} - Status da recuperação
 */
function tryRecoverInitialization(containerId) {
  if (initAttempts < MAX_INIT_ATTEMPTS) {
    console.warn(`[RECOVERY] Tentando recuperar inicialização do SVG (tentativa ${initAttempts}/${MAX_INIT_ATTEMPTS})`);
    
    // Adicionar um pequeno atraso antes da próxima tentativa
    setTimeout(() => {
      inicializarCanvas(containerId);
    }, 100);
    
    return false;
  } else {
    console.error('[RECOVERY] Número máximo de tentativas de inicialização excedido');
    initAttempts = 0;
    return false;
  }
}

/**
 * Configura os estilos do container do SVG
 * @param {HTMLElement} containerElement - Elemento container
 */
function setContainerStyles(containerElement) {
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
}

/**
 * Configura os estilos do elemento SVG
 * @param {SVGElement} svg - Elemento SVG
 */
function setSvgStyles(svg) {
  svg.style.backgroundColor = 'transparent';
  svg.style.border = 'none';
  svg.style.boxShadow = 'none';
  svg.style.display = 'block';
  svg.style.position = 'relative';
  svg.style.zIndex = '10';
}

/**
 * Testa se o SVG pode ser manipulado adicionando e verificando um elemento de teste
 * @returns {boolean} - true se o teste for bem-sucedido
 */
function testSvgManipulation() {
  try {
    if (!svgContainer) return false;
    
    // Desenhar um retângulo de teste para confirmar que o SVG está funcionando
    const testRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    testRect.setAttribute('x', '10');
    testRect.setAttribute('y', '10');
    testRect.setAttribute('width', '100');
    testRect.setAttribute('height', '50');
    testRect.setAttribute('fill', 'green');
    testRect.setAttribute('class', 'test-rect');
    svgContainer.appendChild(testRect);
    
    // Verificar se o retângulo foi adicionado
    const rectInSvg = svgContainer.querySelector('rect.test-rect');
    
    if (!rectInSvg) {
      return false;
    }
    
    // Teste bem-sucedido, remover o retângulo de teste
    rectInSvg.remove();
    return true;
  } catch (error) {
    console.error('[TEST] Erro ao testar manipulação do SVG:', error);
    return false;
  }
}

/**
 * Limpa o SVG
 * @returns {boolean} - Status da operação
 */
export function limparCanvas() {
  if (!svgContainer) {
    console.error('[CLEAN] SVG não inicializado - limparCanvas falhou');
    return false;
  }
  
  try {
    // Tentar limpar usando firstChild enquanto houver filhos
    while (svgContainer.firstChild) {
      svgContainer.removeChild(svgContainer.firstChild);
    }
  
    console.log('[CLEAN] SVG limpo com sucesso');
    return true;
  }
  catch (error) {
    console.error('[CLEAN] Erro ao limpar SVG com removeChild:', error);
    
    // Método alternativo em caso de erro
    try {
      svgContainer.innerHTML = '';
      console.log('[CLEAN] SVG limpo usando innerHTML');
      return true;
    }
    catch (innerError) {
      console.error('[CLEAN] Falha em ambos os métodos para limpar SVG:', innerError);
      return false;
    }
  }
}

/**
 * Limpa o SVG e reinicializa se necessário
 * @param {string} containerId - ID do container a ser reinicializado se necessário
 * @returns {boolean} - Status da operação
 */
export function limparCanvasSeguro(containerId) {
  // Verificar se o SVG está disponível
  if (!svgContainer || !document.body.contains(svgContainer)) {
    console.warn('[CLEAN] SVG não está disponível ou foi removido do DOM, tentando reinicializar');
    return inicializarCanvas(containerId);
  }
  
  // Tentar limpar normalmente
  const limpezaSucesso = limparCanvas();
  
  // Se falhar, tentar reinicializar
  if (!limpezaSucesso) {
    console.warn('[CLEAN] Falha ao limpar SVG, tentando reinicializar');
    return inicializarCanvas(containerId);
  }
  
  return true;
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
 * @returns {SVGElement|null} Elemento SVG criado ou null em caso de erro
 */
export function criarElementoSVG(tipo, atributos = {}) {
  try {
    // Validação por tipo de elemento
    if (!validarAtributosPorTipo(tipo, atributos)) {
      return null;
    }
    
    // Criar elemento
    const elemento = document.createElementNS('http://www.w3.org/2000/svg', tipo);
    
    // Definir atributos no elemento, validando cada um
    for (const [chave, valor] of Object.entries(atributos)) {
      // Validar valor para não definir atributos inválidos
      if (valor === undefined || valor === null || (typeof valor === 'number' && isNaN(valor))) {
        console.warn(`[SVG] Atributo inválido ignorado: ${chave}=${valor}`);
        continue;
      }
      
      // Converter valor para string se for necessário
      const valorFinal = typeof valor !== 'string' ? String(valor) : valor;
      elemento.setAttribute(chave, valorFinal);
    }
    
    return elemento;
  } catch (error) {
    console.error(`[ERRO] Falha ao criar elemento SVG ${tipo}:`, error);
    return null;
  }
}

/**
 * Valida atributos específicos por tipo de elemento SVG
 * @param {string} tipo - Tipo do elemento SVG
 * @param {Object} atributos - Atributos a serem validados
 * @returns {boolean} - Indica se os atributos são válidos
 */
function validarAtributosPorTipo(tipo, atributos) {
  // Validações específicas por tipo
  switch (tipo) {
    case 'rect':
      // Corrigir valores negativos para width e height
      if (atributos.width !== undefined && parseFloat(atributos.width) < 0) {
        if (contadorCorrecoes.width === 0) {
          console.warn(`[SVG] Corrigindo width negativo (${atributos.width}) para zero`);
          contadorCorrecoes.width++;
        }
        atributos.width = 0;
      }
      
      if (atributos.height !== undefined && parseFloat(atributos.height) < 0) {
        if (contadorCorrecoes.height === 0) {
          console.warn(`[SVG] Corrigindo height negativo (${atributos.height}) para zero`);
          contadorCorrecoes.height++;
        }
        atributos.height = 0;
      }
      break;
      
    case 'circle':
      // Verificar radius (r) negativo
      if (atributos.r !== undefined && parseFloat(atributos.r) < 0) {
        console.warn(`[SVG] Valor negativo para raio (${atributos.r}) não permitido`);
        atributos.r = 0;
      }
      break;
      
    case 'text':
      // Garantir que texto tenha conteúdo válido
      if (!atributos.textContent && !atributos.text) {
        atributos.textContent = '';
      }
      break;
      
    case 'path':
      // Verificar se tem o atributo 'd' que é obrigatório
      if (!atributos.d) {
        console.warn('[SVG] Elemento path sem atributo d (obrigatório)');
        atributos.d = 'M0,0';
      }
      break;
  }
  
  return true;
}

/**
 * Captura o desenho atual como uma imagem utilizando html2canvas
 * @param {string} formato - Formato da imagem (png, jpeg)
 * @param {number} escala - Fator de escala para a imagem (padrão: 2)
 * @returns {Promise<string>} - URL da imagem em formato data URL
 */
export function capturarImagemCanvas(formato = 'png', escala = 2) {
  return new Promise((resolve, reject) => {
    if (!svgContainer) {
      reject(new Error('SVG não inicializado'));
      return;
    }
    
    try {
      // Verificar se html2canvas está disponível
      if (typeof html2canvas !== 'function') {
        console.warn('html2canvas não disponível, usando método alternativo');
        // Método alternativo usando XMLSerializer e conversão SVG para canvas
        const svgData = new XMLSerializer().serializeToString(svgContainer);
        const canvas = document.createElement('canvas');
        
        // Definir dimensões baseadas no viewBox do SVG
        const viewBox = svgContainer.getAttribute('viewBox')?.split(' ') || ['0', '0', '1000', '1000'];
        canvas.width = parseInt(viewBox[2] || 1000) * escala;
        canvas.height = parseInt(viewBox[3] || 1000) * escala;
        
        // Criar imagem a partir do SVG
        const img = new Image();
        const blob = new Blob([svgData], {type: 'image/svg+xml'});
        const url = URL.createObjectURL(blob);
        
        img.onload = () => {
          try {
            // Desenhar imagem no canvas
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Converter para data URL
            const dataUrl = canvas.toDataURL(`image/${formato}`);
            
            // Liberar URL
            URL.revokeObjectURL(url);
            
            resolve(dataUrl);
          } catch (drawError) {
            console.error('Erro ao desenhar SVG no canvas:', drawError);
            reject(drawError);
          }
        };
        
        img.onerror = (error) => {
          console.error('Erro ao carregar imagem SVG:', error);
          URL.revokeObjectURL(url);
          reject(new Error('Falha ao carregar imagem SVG'));
        };
        
        img.src = url;
      } else {
        // Usar html2canvas
        const containerElement = svgContainer.parentElement;
        
        if (!containerElement) {
          reject(new Error('Container SVG não encontrado no DOM'));
          return;
        }
        
        // Configurar opções para html2canvas
        const options = {
          scale: escala,
          backgroundColor: '#FFFFFF',
          logging: false,
          useCORS: true,
          allowTaint: true
        };
        
        // Capturar imagem
        html2canvas(containerElement, options)
          .then(canvas => {
            const dataUrl = canvas.toDataURL(`image/${formato}`);
            resolve(dataUrl);
          })
          .catch(error => {
            console.error('Erro html2canvas:', error);
            reject(error);
          });
      }
    }
    catch (error) {
      console.error('Erro ao capturar imagem:', error);
      reject(error);
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