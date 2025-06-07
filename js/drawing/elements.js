/**
 * Componentes básicos de desenho para portas e perfis
 * Sistema de Portas e Perfis
 */

import { CONFIG, obterCorPerfil, obterCorVidro } from './config.js';
import { criarElementoSVG, getSvgContainer } from './core.js';
import { desenharCotaSVG } from './annotations.js';
import { obterConfiguracaoAtual } from '../initialize.js';
import { mmParaPixels, pixelsParaMm, pixelsParaMmInteiro, formatarValorCota } from './utils.js';
import { ehPortaDeslizante, ehPortaGiro, obterCotasPadraoParaDeslizante, obterCotasPadraoParaGiro, recalcularCotasParaCentralizar, validarDimensoesPuxador } from '../utils.js';

/**
 * Limpa todos os elementos do container SVG
 */
export function limparSVG() {
  const svgContainer = getSvgContainer();
  if (!svgContainer) {
    console.error('[ERRO Vibecode] Container SVG não encontrado em limparSVG');
    return;
  }
  
  // Remover todos os elementos, mantendo apenas o container
  while (svgContainer.firstChild) {
    svgContainer.removeChild(svgContainer.firstChild);
  }
  
  console.log('[INFO Vibecode] SVG limpo com sucesso');
}

// Expor globalmente para acesso dos controles de UI
window.limparSVG = limparSVG;

/**
 * Desenha as dobradiças da porta
 * @param {number} x - Posição X
 * @param {number} y - Posição Y
 */
export function desenharDobradicaSVG(x, y) {
  // Validação rigorosa dos parâmetros recebidos
  if (typeof x !== 'number' || isNaN(x) || typeof y !== 'number' || isNaN(y)) {
    // Usar log de erro apenas, sem debug
    console.error('[ERRO Vibecode] Valor inválido para x ou y em desenharDobradicaSVG:', { x, y });
    return; // Sair da função sem tentar desenhar
  }
  
  const raio = 5;
  const cor = CONFIG.corDobradicaNormal;
  const svgContainer = getSvgContainer();
  
  if (!svgContainer) {
    console.error('[ERRO Vibecode] Container SVG não encontrado em desenharDobradicaSVG');
    return;
  }
  
  // Círculo da dobradiça
  const dobradica = criarElementoSVG('circle', {
    cx: x,
    cy: y,
    r: raio,
    fill: cor,
    stroke: 'none'
  });
  
  // Verifica se o elemento foi criado corretamente antes de tentar adicionar
  if (!dobradica) {
    console.error('[ERRO Vibecode] Falha ao criar elemento dobradiça');
    return;
  }
  svgContainer.appendChild(dobradica);
  
  // Detalhe interno
  const detalhe = criarElementoSVG('circle', {
    cx: x,
    cy: y,
    r: raio * 0.6,
    fill: '#999999',
    stroke: 'none'
  });
  
  // Verificar se o detalhe foi criado corretamente
  if (!detalhe) {
    console.error('[ERRO Vibecode] Falha ao criar elemento detalhe da dobradiça');
    return;
  }
  svgContainer.appendChild(detalhe);
}

/**
 * Desenha o puxador da porta
 * @param {number} x - Posição X inicial da porta
 * @param {number} y - Posição Y inicial da porta
 * @param {number} altura - Altura da porta
 * @param {boolean} ladoDireito - Se as dobradiças estão no lado direito
 * @param {number} larguraPorta - Largura da porta
 * @param {Object} configParam - Configuração da porta
 */
export function desenharPuxadorSVG(x, y, altura, ladoDireito = false, larguraPorta, configParam) {
  // Usar a configuração fornecida ou obter a global
  const config = configParam || obterConfiguracaoAtual();
  
  // Se o modelo for "S/Puxador", não desenhar nada
  if (!config.puxador || config.puxador.modelo === 'S/Puxador') {
    return;
  }
  
  // Verificar se é uma porta basculante
  const ehBasculante = config.funcao === 'basculante';
  
  // Obter o container SVG
  const svgContainer = getSvgContainer();
  if (!svgContainer) {
    return;
  }
  
  // Obter dimensões e parâmetros do puxador
  const esticador = config.puxador.modelo === 'Esticador';
  
  // Verificar se o puxador deve ocupar a porta inteira
  const ehPortaInteira = config.puxador.medida === 'Porta Inteira';
  
  // Espessura padrão do puxador (5 pixels)
  const espessuraPuxador = 5;
  
  // Verificar se o puxador deve ser desenhado em ambos os lados
  let posicaoPuxador = config.puxador?.posicao || 'vertical';
  
  // Detectar tipo de porta para aplicar configurações específicas
  const ehDeslizante = ehPortaDeslizante(config.funcao);
  const ehGiro = ehPortaGiro(config.funcao);
  let cotaSuperior, cotaInferior;
  
  console.log('[DEBUG] Detectando tipo de porta:', {
    funcao: config.funcao,
    ehDeslizante: ehDeslizante,
    ehGiro: ehGiro,
    puxadorMedida: config.puxador?.medida,
    puxadorPosicao: config.puxador?.posicao
  });
  
  if (ehDeslizante) {
    // Obter medida do puxador para cálculo das cotas
    const medidaPuxador = config.puxador?.medida === 'Porta Inteira' ? 
                         altura / CONFIG.escala : // Se porta inteira, usar altura total
                         parseInt(config.puxador?.medida, 10) || 100; // Valor padrão 100mm
    
    // Usar configuração centralizada para portas deslizantes
    const cotasPadrao = obterCotasPadraoParaDeslizante(altura / CONFIG.escala, medidaPuxador);
    // Manter a posição escolhida pelo usuário, usar apenas as cotas padrão
    
    // Usar valores do config se válidos, senão usar padrão calculado
    const cotaSuperiorConfig = parseInt(config.puxador.cotaSuperior, 10);
    const cotaInferiorConfig = parseInt(config.puxador.cotaInferior, 10);
    
    // Priorizar valores do formulário quando válidos (incluindo zero)
    cotaSuperior = (!isNaN(cotaSuperiorConfig) && cotaSuperiorConfig >= 0) ? 
                   cotaSuperiorConfig : cotasPadrao.cotaSuperior;
    
    cotaInferior = (!isNaN(cotaInferiorConfig) && cotaInferiorConfig >= 0) ? 
                   cotaInferiorConfig : cotasPadrao.cotaInferior;
    
    console.log('[DEBUG] Porta deslizante - Cotas do config:', {
      cotaSuperiorConfig, cotaInferiorConfig, 
      cotaSuperior, cotaInferior, 
      cotasPadrao
    });
    
    // Validar se as dimensões cabem na porta
    const validacao = validarDimensoesPuxador(altura / CONFIG.escala, cotaSuperior, cotaInferior, medidaPuxador);
    if (!validacao.isValid) {
      console.warn('[VALIDAÇÃO] Problema com dimensões do puxador:', validacao.mensagem);
      console.warn('[VALIDAÇÃO] Valores que falharam:', { cotaSuperior, cotaInferior, medidaPuxador, altura: altura/CONFIG.escala });
      console.warn('[VALIDAÇÃO] Sobrescrevendo com padrões:', cotasPadrao);
      // Usar valores padrão seguros em caso de erro
      cotaSuperior = cotasPadrao.cotaSuperior;
      cotaInferior = cotasPadrao.cotaInferior;
    } else {
      console.log('[VALIDAÇÃO] Dimensões do puxador válidas:', { cotaSuperior, cotaInferior, medidaPuxador });
    }
  } else if (ehGiro) {
    // Configuração específica para portas de giro
    const medidaPuxador = config.puxador?.medida === 'Porta Inteira' ? 
                         altura / CONFIG.escala : // Se porta inteira, usar altura total
                         parseInt(config.puxador?.medida, 10) || 150; // Valor padrão 150mm
    
    // Usar configuração centralizada para portas de giro
    const cotasPadrao = obterCotasPadraoParaGiro(altura / CONFIG.escala, medidaPuxador, config.funcao);
    // Manter a posição escolhida pelo usuário, usar apenas as cotas padrão
    
    // Usar valores do config se válidos, senão usar padrão calculado
    const cotaSuperiorConfig = parseInt(config.puxador.cotaSuperior, 10);
    const cotaInferiorConfig = parseInt(config.puxador.cotaInferior, 10);
    
    // Priorizar valores do formulário quando válidos (incluindo zero)
    cotaSuperior = (!isNaN(cotaSuperiorConfig) && cotaSuperiorConfig >= 0) ? 
                   cotaSuperiorConfig : cotasPadrao.cotaSuperior;
    
    cotaInferior = (!isNaN(cotaInferiorConfig) && cotaInferiorConfig >= 0) ? 
                   cotaInferiorConfig : cotasPadrao.cotaInferior;
    
    console.log('[DEBUG] Porta de giro - Cotas do config:', {
      cotaSuperiorConfig, cotaInferiorConfig, 
      cotaSuperior, cotaInferior, 
      cotasPadrao
    });
    
    // Validar se as dimensões cabem na porta
    const validacao = validarDimensoesPuxador(altura / CONFIG.escala, cotaSuperior, cotaInferior, medidaPuxador);
    if (!validacao.isValid) {
      console.warn('[VALIDAÇÃO] Problema com dimensões do puxador de giro:', validacao.mensagem);
      console.warn('[VALIDAÇÃO] Valores que falharam:', { cotaSuperior, cotaInferior, medidaPuxador, altura: altura/CONFIG.escala });
      console.warn('[VALIDAÇÃO] Sobrescrevendo com padrões:', cotasPadrao);
      // Usar valores padrão seguros em caso de erro
      cotaSuperior = cotasPadrao.cotaSuperior;
      cotaInferior = cotasPadrao.cotaInferior;
    } else {
      console.log('[VALIDAÇÃO] Dimensões do puxador de giro válidas:', { cotaSuperior, cotaInferior, medidaPuxador });
    }
  }
  
  // Verificar se é porta inteira para determinar a renderização adequada
  if (ehPortaInteira) {
    if (posicaoPuxador === 'vertical') {
      // Para puxador vertical de porta inteira, ocupar toda a altura da porta
      
      // Determinar o lado do puxador
      let posX;
      if (ladoDireito) {
        // Dobradiças à direita, puxador à esquerda (junto ao perfil)
        posX = x;
      } else {
        // Dobradiças à esquerda, puxador à direita (junto ao perfil)
        posX = x + larguraPorta - espessuraPuxador;
      }
      
      // Corpo do puxador com altura igual à da porta
      const corpoPuxador = criarElementoSVG('rect', {
        x: posX,
        y: y,
        width: espessuraPuxador,
        height: altura,
        fill: CONFIG.corPuxador,
        stroke: 'none'
      });
      svgContainer.appendChild(corpoPuxador);
      
      // Detalhe lateral
      const lateral = criarElementoSVG('rect', {
        x: posX + espessuraPuxador,
        y: y,
        width: 1.5,
        height: altura,
        fill: '#808080',
        stroke: 'none'
      });
      svgContainer.appendChild(lateral);
      
      // Brilho superior
      const brilho = criarElementoSVG('rect', {
        x: posX,
        y: y,
        width: espessuraPuxador,
        height: 0.75,
        fill: '#FFFFFF',
        opacity: '0.3',
        stroke: 'none'
      });
      svgContainer.appendChild(brilho);
      
      // Não desenhar cota quando for "Porta inteira" pois seria redundante com a altura da porta
      
      return;
    } else if (posicaoPuxador === 'horizontal') {
      // Para puxador horizontal de porta inteira, ocupar toda a largura da porta
      
      // Determinar se é uma porta inferior ou superior
      const ehPortaInferior = config.funcao?.includes('inferior');
      const ehBasculante = config.funcao === 'basculante';
      
      // Posição Y do puxador dependendo do tipo de porta
      // - Para portas inferiores: na parte superior da porta
      // - Para portas superiores: na parte inferior da porta
      // - Para portas basculantes: na parte inferior da porta
      let posY;
      if (ehBasculante) {
        // Para portas basculantes, posicionar na parte inferior
        const calculoPosY = y + altura - (CONFIG.espessuraPerfil * CONFIG.escala / 2) - (espessuraPuxador * CONFIG.escala);
        posY = Math.max(y, calculoPosY); // Garantir que não fique menor que y
      } else if (ehPortaInferior) {
        // Para portas inferiores, posicionar rente à borda superior
        const deslocamentoSuperior = 0;
        posY = y + (deslocamentoSuperior * CONFIG.escala);
      } else {
        // Para portas superiores, posicionar na parte inferior
        const calculoPosY = y + altura - (CONFIG.espessuraPerfil * CONFIG.escala / 2) - (espessuraPuxador * CONFIG.escala);
        posY = Math.max(y, calculoPosY); // Garantir que não fique menor que y
      }
      
      // Corpo do puxador com largura igual à da porta
      const corpoPuxador = criarElementoSVG('rect', {
        x: x,
        y: posY,
        width: larguraPorta,
        height: espessuraPuxador,
        fill: CONFIG.corPuxador,
        stroke: 'none'
      });
      svgContainer.appendChild(corpoPuxador);
      
      // Detalhe inferior
      const lateral = criarElementoSVG('rect', {
        x: x,
        y: posY + espessuraPuxador,
        width: larguraPorta,
        height: 1.5,
        fill: '#808080',
        stroke: 'none'
      });
      svgContainer.appendChild(lateral);
      
      // Brilho superior
      const brilho = criarElementoSVG('rect', {
        x: x,
        y: posY,
        width: larguraPorta,
        height: 0.75,
        fill: '#FFFFFF',
        opacity: '0.3',
        stroke: 'none'
      });
      svgContainer.appendChild(brilho);
      
      // Não desenhar cota quando for "Porta inteira" pois seria redundante com a largura da porta
      
      return;
    }
  }
  
  // Continuar com o código existente para puxadores normais (não porta inteira)
  let medida = parseInt(config.puxador.medida || '150', 10);
  
  if (posicaoPuxador === 'vertical') {
    // Dimensões do puxador vertical
    let alturaPuxador = medida * CONFIG.escala;
    
    // Garantir que altura do puxador seja positiva
    alturaPuxador = Math.max(1, alturaPuxador);
    
    // Posição Y do puxador
    let posY;
    
    // As cotas já foram calculadas no início da função para portas deslizantes e de giro
    // Para outras portas (basculante, etc.), usar cálculo matematicamente correto
    if (!ehDeslizante && !ehGiro) {
      cotaSuperior = parseInt(config.puxador.cotaSuperior, 10);
      cotaInferior = parseInt(config.puxador.cotaInferior, 10);
      
      // CORREÇÃO MATEMÁTICA: Usar valores matematicamente corretos
      if (isNaN(cotaInferior) || cotaInferior < 0) {
        cotaInferior = 1000; // valor padrão da cota inferior
      }
      
      if (isNaN(cotaSuperior) || cotaSuperior < 0) {
        // Calcular cota superior baseada na altura da porta
        const alturaPortaMm = altura / CONFIG.escala;
        cotaSuperior = Math.max(0, alturaPortaMm - medida - cotaInferior);
        console.log('[CORREÇÃO MATEMÁTICA] Cota superior calculada:', {
          alturaPortaMm,
          medidaPuxador: medida,
          cotaInferior,
          cotaSuperiorCalculada: cotaSuperior
        });
      }
    }
    
    // Calcular posição Y com base nas cotas e tipo de porta
    if (ehDeslizante) {
      // Para portas deslizantes, posicionar baseado na cota inferior
      posY = y + altura - (cotaInferior * CONFIG.escala) - alturaPuxador;
      console.log('[DEBUG] Porta deslizante - PosY calculado pela cota inferior:', posY, 'CotaInferior:', cotaInferior, 'Altura:', altura/CONFIG.escala);
    } else if (ehGiro) {
      // Para portas de giro, usar sistema de prioridade dinâmica
      // Calcular duas posições possíveis e escolher a que faz mais sentido
      
      const posYByCotaSuperior = y + (cotaSuperior * CONFIG.escala);
      const posYByCotaInferior = y + altura - (cotaInferior * CONFIG.escala) - alturaPuxador;
      
      // Verificar se ambas as cotas produzem posições válidas
      const superiorValida = posYByCotaSuperior >= y && (posYByCotaSuperior + alturaPuxador) <= (y + altura);
      const inferiorValida = posYByCotaInferior >= y && (posYByCotaInferior + alturaPuxador) <= (y + altura);
      
      // Calcular qual das cotas resulta na posição mais próxima dos valores padrão
      const cotaSuperiorConfig = parseInt(config.puxador.cotaSuperior, 10);
      const cotaInferiorConfig = parseInt(config.puxador.cotaInferior, 10);
      
      // Se apenas uma posição é válida, usar ela
      if (superiorValida && !inferiorValida) {
        posY = posYByCotaSuperior;
        console.log('[DEBUG] Porta de giro - PosY pela cota superior (única válida):', posY, 'CotaSuperior:', cotaSuperior);
      } else if (!superiorValida && inferiorValida) {
        posY = posYByCotaInferior;
        console.log('[DEBUG] Porta de giro - PosY pela cota inferior (única válida):', posY, 'CotaInferior:', cotaInferior);
      } else {
        // Se ambas são válidas, priorizar a cota que foi definida pelo usuário (não é padrão)
        const cotaSuperiorEhPadrao = isNaN(cotaSuperiorConfig) || cotaSuperiorConfig === 950;
        const cotaInferiorEhPadrao = isNaN(cotaInferiorConfig) || cotaInferiorConfig === 1000;
        
        if (!cotaInferiorEhPadrao) {
          // Usuário definiu cota inferior, usar ela
          posY = posYByCotaInferior;
          console.log('[DEBUG] Porta de giro - PosY pela cota inferior (definida pelo usuário):', posY, 'CotaInferior:', cotaInferior);
        } else {
          // Usar cota superior (padrão ou definida pelo usuário)
          posY = posYByCotaSuperior;
          console.log('[DEBUG] Porta de giro - PosY pela cota superior (padrão):', posY, 'CotaSuperior:', cotaSuperior);
        }
      }
    } else {
      // Para outras portas (basculante, etc.), usar cota superior por padrão
      posY = y + (cotaSuperior * CONFIG.escala);
      console.log('[DEBUG] Porta padrão - PosY calculado pela cota superior:', posY, 'CotaSuperior:', cotaSuperior);
    }
    
    // Garantir que o puxador não ultrapasse os limites da porta
    if (posY < y) {
      posY = y;
    }
    
    if (posY + alturaPuxador > y + altura) {
      alturaPuxador = (y + altura) - posY;
    }
    
    // Determinar o lado do puxador sempre oposto às dobradiças
    let posX;
    if (ladoDireito) {
      // Dobradiças à direita, puxador à esquerda (junto ao perfil)
      posX = x;
    }
    else {
      // Dobradiças à esquerda, puxador à direita (junto ao perfil)
      posX = x + larguraPorta - espessuraPuxador;
    }
    
    const corpoPuxador = criarElementoSVG('rect', {
      x: posX,
      y: posY,
      width: espessuraPuxador,
      height: alturaPuxador,
      fill: CONFIG.corPuxador,
      stroke: 'none'
    });
    svgContainer.appendChild(corpoPuxador);
    
    const lateral = criarElementoSVG('rect', {
      x: posX + espessuraPuxador,
      y: posY,
      width: 1.5,
      height: alturaPuxador,
      fill: '#808080',
      stroke: 'none'
    });
    svgContainer.appendChild(lateral);
    
    const brilho = criarElementoSVG('rect', {
      x: posX,
      y: posY,
      width: espessuraPuxador,
      height: 0.75,
      fill: '#FFFFFF',
      opacity: '0.3',
      stroke: 'none'
    });
    svgContainer.appendChild(brilho);
    
    // Desenhar cotas
    console.log('[DEBUG] Desenhando cotas - Superior:', cotaSuperior, 'Inferior:', cotaInferior, 'PosY:', posY);
    
    if (cotaSuperior > 0) {
      // Cota do topo ao puxador
      desenharCotaSVG(
        ladoDireito ? posX - 15 : posX + espessuraPuxador + 25,
        y,
        ladoDireito ? posX - 15 : posX + espessuraPuxador + 25,
        posY,
        formatarValorCota(cotaSuperior),
        'middle',
        CONFIG.corCotaPuxador
      );
      console.log('[DEBUG] Cota superior desenhada:', cotaSuperior);
    }
    
    // Cota da base da porta ao puxador (só desenhar se não for zero)
    if (cotaInferior > 0) {
      desenharCotaSVG(
        ladoDireito ? posX - 15 : posX + espessuraPuxador + 25,
        posY + alturaPuxador,
        ladoDireito ? posX - 15 : posX + espessuraPuxador + 25,
        y + altura,
        formatarValorCota(cotaInferior),
        'middle',
        CONFIG.corCotaPuxador
      );
      console.log('[DEBUG] Cota inferior desenhada:', cotaInferior);
    }
    
    // Cota do comprimento do puxador (só desenhar se não for zero)
    if (medida > 0) {
      desenharCotaSVG(
        ladoDireito ? posX - 25 : posX + espessuraPuxador + 35,
        posY,
        ladoDireito ? posX - 25 : posX + espessuraPuxador + 35,
        posY + alturaPuxador,
        formatarValorCota(medida),
        'middle',
        CONFIG.corCotaPuxador
      );
    }
  }
  else if (posicaoPuxador === 'horizontal') {
    // Dimensões do puxador horizontal
    let larguraPuxador = medida * CONFIG.escala;
    
    // Garantir que largura do puxador seja positiva
    larguraPuxador = Math.max(1, larguraPuxador);
    
    // Determinar se é uma porta inferior ou superior
    const ehPortaInferior = config.funcao?.includes('inferior');
    
    // Posição Y do puxador dependendo do tipo de porta
    // - Para portas inferiores: na parte superior da porta
    // - Para portas superiores: na parte inferior da porta
    // - Para portas basculantes: na parte inferior da porta
    let posY;
    if (ehBasculante) {
      // Para portas basculantes, posicionar na parte inferior - com verificação para evitar valores negativos
      const calculoY = y + altura - (CONFIG.espessuraPerfil * CONFIG.escala / 2) - (espessuraPuxador * CONFIG.escala);
      posY = Math.max(y, calculoY); // Garantir que a posição nunca seja menor que y
    } else if (ehPortaInferior) {
      // Para portas inferiores, posicionar com distância adequada da borda superior
      const deslocamentoSuperior = 0; // Usar distância padronizada como feito para dobradiças
      posY = y + (deslocamentoSuperior * CONFIG.escala);
    } else {
      // Para portas superiores, posicionar na parte inferior - com verificação para evitar valores negativos
      const calculoY = y + altura - (CONFIG.espessuraPerfil * CONFIG.escala / 2) - (espessuraPuxador * CONFIG.escala);
      posY = Math.max(y, calculoY); // Garantir que a posição nunca seja menor que y
    }
    
    // Posicionar o puxador
    // - Nas portas basculantes: centralizado horizontalmente
    // - Nas outras portas: no lado oposto às dobradiças
    let posX;
    
    if (ehBasculante) {
      // Para portas basculantes, centralizar o puxador horizontalmente
      posX = x + (larguraPorta / 2) - (larguraPuxador / 2);
      console.log('[PUXADOR BASCULANTE] Centralizado. PosX:', posX, 'LarguraPorta:', larguraPorta, 'LarguraPuxador:', larguraPuxador);
    } else if (ladoDireito) {
      // Se as dobradiças estão à direita, puxador à esquerda
      posX = x;
    } else {
      // Se as dobradiças estão à esquerda, puxador à direita
      posX = x + larguraPorta - larguraPuxador;
    }
    
    // Corpo do puxador
    const corpoPuxador = criarElementoSVG('rect', {
      x: posX,
      y: posY,
      width: larguraPuxador,
      height: espessuraPuxador,
      fill: CONFIG.corPuxador,
      stroke: 'none'
    });
    svgContainer.appendChild(corpoPuxador);
    
    // Detalhe lateral
    const lateral = criarElementoSVG('rect', {
      x: posX,
      y: posY + espessuraPuxador,
      width: larguraPuxador,
      height: 1.5,
      fill: '#808080',
      stroke: 'none'
    });
    svgContainer.appendChild(lateral);
    
    // Brilho
    const brilho = criarElementoSVG('rect', {
      x: posX,
      y: posY,
      width: 0.75,
      height: espessuraPuxador,
      fill: '#FFFFFF',
      opacity: '0.3',
      stroke: 'none'
    });
    svgContainer.appendChild(brilho);
    
    // Cota para o tamanho do puxador (só desenhar se não for zero)
    if (medida > 0) {
      // Ajustar a posição da cota conforme a posição do puxador
      const posYCotaCalculado = ehPortaInferior ? 
        posY - 25 : // Para porta inferior, cota acima do puxador
        posY + espessuraPuxador + 25; // Para porta superior, cota abaixo do puxador
      
      // Garantir que posYCota não seja negativo
      const posYCota = Math.max(10, posYCotaCalculado);
        
      desenharCotaSVG(
        posX,
        posYCota,
        posX + larguraPuxador,
        posYCota,
        formatarValorCota(medida),
        'middle',
        CONFIG.corCotaPuxador
      );
    }
  }
  // Para puxadores esticadores e outros tipos especiais
  else if (posicaoPuxador === 'esticador') {
    // Implementação para esticadores (se necessário)
  }
}

/**
 * Aplica efeitos de reflexo no vidro usando gradientes SVG otimizados
 * @param {number} posX - Posição X inicial
 * @param {number} posY - Posição Y inicial
 * @param {number} larguraPorta - Largura da porta
 * @param {number} alturaPorta - Altura da porta
 * 
 * Esta função cria efeitos visuais otimizados para simular vidro real:
 * 1. Gradiente vertical principal - simula a transição natural de luz no vidro
 * 2. Gradiente lateral - simula reflexos nas bordas do vidro
 * 
 * IMPORTANTE: Os gradientes são otimizados para melhor performance em PDFs
 * e reutilizam definições para reduzir o tamanho do arquivo.
 */
export function aplicarEfeitosReflexoVidro(posX, posY, larguraPorta, alturaPorta) {
  const svgContainer = getSvgContainer();
  
  if (!svgContainer) {
    return;
  }
  
  // Calcular as coordenadas do vidro
  const vidroX = posX + CONFIG.espessuraPerfil * CONFIG.escala;
  const vidroY = posY + CONFIG.espessuraPerfil * CONFIG.escala;
  const vidroLargura = larguraPorta - (CONFIG.espessuraPerfil * CONFIG.escala * 2);
  const vidroAltura = alturaPorta - (CONFIG.espessuraPerfil * CONFIG.escala * 2);

  // IDs fixos para reutilização de gradientes
  const GRADIENT_VERTICAL_ID = 'vidroGradientVertical';
  const GRADIENT_LATERAL_ID = 'vidroGradientLateral';
  
  // Verificar se os gradientes já existem
  let defs = svgContainer.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svgContainer.appendChild(defs);
  }
  
  // GRADIENTE VERTICAL: Gradiente principal topo-base (vertical)
  if (!defs.querySelector(`#${GRADIENT_VERTICAL_ID}`)) {
    const gradient1 = criarElementoSVG('linearGradient', {
      id: GRADIENT_VERTICAL_ID,
      x1: '0%',
      y1: '0%',
      x2: '0%',
      y2: '100%'
    });
    defs.appendChild(gradient1);
    
    // Paradas do gradiente vertical - Simplificadas e otimizadas
    const stops1 = [
      { offset: '0%', color: 'white', opacity: '0.35' },
      { offset: '50%', color: 'white', opacity: '0.13' },
      { offset: '100%', color: 'white', opacity: '0.01' }
    ];
    
    stops1.forEach(stop => {
      const stopElem = criarElementoSVG('stop', {
        offset: stop.offset,
        'stop-color': stop.color,
        'stop-opacity': stop.opacity
      });
      gradient1.appendChild(stopElem);
    });
  }
  
  // GRADIENTE LATERAL: Para simular reflexo de luz nas laterais
  if (!defs.querySelector(`#${GRADIENT_LATERAL_ID}`)) {
    const gradient2 = criarElementoSVG('linearGradient', {
      id: GRADIENT_LATERAL_ID,
      x1: '0%',
      y1: '50%',
      x2: '100%',
      y2: '50%'
    });
    defs.appendChild(gradient2);
    
    // Paradas do gradiente lateral - Simplificadas
    const stops2 = [
      { offset: '0%', color: 'white', opacity: '0.20' },
      { offset: '15%', color: 'white', opacity: '0.02' },
      { offset: '85%', color: 'white', opacity: '0.02' },
      { offset: '100%', color: 'white', opacity: '0.20' }
    ];
    
    stops2.forEach(stop => {
      const stopElem = criarElementoSVG('stop', {
        offset: stop.offset,
        'stop-color': stop.color,
        'stop-opacity': stop.opacity
      });
      gradient2.appendChild(stopElem);
    });
  }
  
  // Aplicar o gradiente vertical principal
  const baseGradient = criarElementoSVG('rect', {
    x: vidroX,
    y: vidroY,
    width: vidroLargura,
    height: vidroAltura,
    fill: `url(#${GRADIENT_VERTICAL_ID})`,
    stroke: 'none'
  });
  svgContainer.appendChild(baseGradient);
  
  // Aplicar o gradiente lateral
  const lateralGradient = criarElementoSVG('rect', {
    x: vidroX,
    y: vidroY,
    width: vidroLargura,
    height: vidroAltura,
    fill: `url(#${GRADIENT_LATERAL_ID})`,
    stroke: 'none',
    'fill-opacity': '0.4'
  });
  svgContainer.appendChild(lateralGradient);
}

/**
 * Desenha as dobradiças da porta com base na configuração
 * @param {number} posX - Posição X inicial da porta
 * @param {number} posY - Posição Y inicial da porta
 * @param {number} alturaPorta - Altura da porta
 * @param {Object} config - Configuração da porta
 */
export function desenharDobradicasSVG(posX, posY, alturaPorta, config) {
  // Validar os parâmetros de entrada
  if (!config) {
    console.error('[ERRO Vibecode] Config inválida em desenharDobradicasSVG');
    return;
  }

  // Definir fallbacks duros como último recurso
  const fallbackPadroes = {
    'Abrir Superior Direita': { largura: 450, altura: 2450 },
    'Abrir Superior Esquerda': { largura: 450, altura: 2450 },
    'Abrir Inferior Direita': { largura: 450, altura: 2450 },
    'Abrir Inferior Esquerda': { largura: 450, altura: 2450 },
    'Basculante': { largura: 1000, altura: 450 },
    'Deslizante': { largura: 900, altura: 2450 }
  };

  // Funções de fallback em caso de erro
  const padroesFuncao = {
    obterUltimoValorPorta: (tipo) => {
      // Tentar obter do localStorage diretamente
      try {
        const padroesPorta = localStorage.getItem('conecta_portas_padrao');
        if (padroesPorta) {
          const padroes = JSON.parse(padroesPorta);
          if (padroes && padroes[tipo]) {
            return padroes[tipo];
          }
        }
      } catch (e) {
        console.warn('[AVISO Vibecode] Erro ao ler localStorage:', e);
      }
      // Retornar fallback duro
      return fallbackPadroes[tipo] || { altura: 2450, largura: 450 };
    },
    obterPadroesPorta: () => fallbackPadroes
  };

  // Obter e validar valores críticos da config
  let alturaMm = config.altura;
  let larguraMm = config.largura;
  let escala = CONFIG.escala;
  const distanciaExtremidade = 100; // Valor padrão para distância das extremidades
  
  // Sistema robusto de fallback em camadas:
  
  // 1. Verificar se os valores são válidos
  const alturaInvalida = typeof alturaMm !== 'number' || isNaN(alturaMm) || alturaMm <= 0;
  const larguraInvalida = typeof larguraMm !== 'number' || isNaN(larguraMm) || larguraMm <= 0;
  const escalaInvalida = typeof escala !== 'number' || isNaN(escala) || escala <= 0;
  
  if (alturaInvalida || larguraInvalida || escalaInvalida) {
    // 2. Determinar o tipo correto de porta para buscar padrões apropriados
    let tipoPorta = 'Abrir Superior Direita'; // Fallback padrão
    
    // Mapear o valor de config.funcao para os tipos padrão
    if (config.funcao) {
      const funcao = config.funcao.toLowerCase();
      if (funcao === 'basculante') {
        tipoPorta = 'Basculante';
      } else if (funcao === 'deslizante') {
        tipoPorta = 'Deslizante';
      } else if (funcao.includes('superior')) {
        tipoPorta = funcao.includes('direita') ? 'Abrir Superior Direita' : 'Abrir Superior Esquerda';
      } else if (funcao.includes('inferior')) {
        tipoPorta = funcao.includes('direita') ? 'Abrir Inferior Direita' : 'Abrir Inferior Esquerda';
      }
    }
    
    // 3. Buscar o padrão para o tipo de porta
    const padrao = padroesFuncao.obterUltimoValorPorta(tipoPorta);
    
    console.warn('[Vibecode] Aplicando fallback para valores inválidos em desenharDobradicasSVG:', 
      { alturaInvalida, larguraInvalida, escalaInvalida, tipoPorta, padrao }
    );
    
    // Aplicar valores do padrão
    if (alturaInvalida) alturaMm = padrao.altura;
    if (larguraInvalida) larguraMm = padrao.largura;
    if (escalaInvalida) escala = 1;
    
    // Atualizar config com valores corrigidos
    config.altura = alturaMm;
    config.largura = larguraMm;
  }
  
  // Garantir que numDobradicas seja válido
  const numDobradicas = config.numDobradicas !== undefined ? 
    parseInt(config.numDobradicas, 10) : 3;
  
  // Se não houver dobradiças, não fazer nada
  if (numDobradicas <= 0) {
    return;
  }
  
  // Verificar se é uma porta basculante
  const ehBasculante = (config.funcao || '').toLowerCase() === 'basculante';
  
  // Para porta basculante, as dobradiças ficam no topo (horizontalmente)
  if (ehBasculante) {
    const larguraPorta = larguraMm * escala;
    const distanciaExtremidade = 100;
    
    // Array para armazenar posições X das dobradiças em pixels e informações para cotas
    const posicoesDobradicas = [];
    
    // Posição Y fixada no topo da porta
    const posYDobradicaBasculante = posY + (CONFIG.espessuraPerfil * escala / 2);
    
    // Calcular posição X das cotas das dobradiças horizontais (mais abaixo que a cota de largura da porta)
    const posYCotaDobradicasHorizontais = posY - 15;
    
    // Recalcular posições das dobradiças para distribuição horizontal
    if (!config.dobradicasBasculante || config.dobradicasBasculante.length !== numDobradicas) {
      // Distribuir dobradiças horizontalmente - usando 100mm nas extremidades apenas para valores iniciais padrão
      for (let i = 0; i < numDobradicas; i++) {
        const posicaoMm = i === 0 ? distanciaExtremidade : 
            i === numDobradicas - 1 ? larguraMm - distanciaExtremidade :
            Math.round(distanciaExtremidade + (i * ((larguraMm - 2 * distanciaExtremidade) / (numDobradicas - 1))));
        
        const xPos = posX + (posicaoMm * escala);
        desenharDobradicaSVG(xPos, posYDobradicaBasculante);
        posicoesDobradicas.push({
          xPos: xPos,
          valorMm: Math.round(posicaoMm)
        });
      }
      
      // Atualizar config com as posições calculadas
      config.dobradicasBasculante = posicoesDobradicas.map(pos => Math.round(pos.valorMm));
    } else {
      // Usar posições existentes definidas pelo usuário, sem forçar 100mm de distância nas extremidades
      config.dobradicasBasculante.forEach(valorMm => {
        const xPos = posX + (valorMm * escala);
        desenharDobradicaSVG(xPos, posYDobradicaBasculante);
        posicoesDobradicas.push({
          xPos: xPos,
          valorMm: Math.round(valorMm)
        });
      });
    }
    
    // Ordenar as posições para garantir que as cotas sejam desenhadas da esquerda para a direita
    posicoesDobradicas.sort((a, b) => a.xPos - b.xPos);
    
    // Atualizar config depois da ordenação
    config.dobradicasBasculante = posicoesDobradicas.map(pos => Math.round(pos.valorMm));
    
    // Desenhar as cotas das dobradiças horizontais
    if (posicoesDobradicas.length > 0) {
      // Primeira dobradiça: cota da esquerda da porta até a primeira dobradiça
      desenharCotaSVG(
        posX,
        posYCotaDobradicasHorizontais,
        posicoesDobradicas[0].xPos,
        posYCotaDobradicasHorizontais,
        formatarValorCota(posicoesDobradicas[0].valorMm),
        'middle',
        CONFIG.corCotaDobradicasCima
      );
      
      // Dobradiças intermediárias: cotas entre dobradiças consecutivas
      for (let i = 1; i < posicoesDobradicas.length; i++) {
        const distanciaEntreDobradicas = Math.round(
          posicoesDobradicas[i].valorMm - posicoesDobradicas[i-1].valorMm
        );
        
        desenharCotaSVG(
          posicoesDobradicas[i-1].xPos,
          posYCotaDobradicasHorizontais,
          posicoesDobradicas[i].xPos,
          posYCotaDobradicasHorizontais,
          formatarValorCota(distanciaEntreDobradicas),
          'middle',
          CONFIG.corCotaDobradicasMeio
        );
      }
      
      // Última dobradiça: cota da última dobradiça até a direita da porta
      const ultimaDobradicaIndice = posicoesDobradicas.length - 1;
      const distanciaAteDireita = Math.round(
        larguraMm - posicoesDobradicas[ultimaDobradicaIndice].valorMm
      );
      
      desenharCotaSVG(
        posicoesDobradicas[ultimaDobradicaIndice].xPos,
        posYCotaDobradicasHorizontais,
        posX + larguraPorta,
        posYCotaDobradicasHorizontais,
        formatarValorCota(distanciaAteDireita),
        'middle',
        CONFIG.corCotaDobradicasBaixo
      );
    }
    
    return;
  }
  
  // Para outros tipos de porta, continuar com a lógica existente
  // Determinar o lado das dobradiças com base no tipo de porta
  const ladoDireito = config.funcao?.includes('Direita');
  
  // Posição X ajustada conforme o lado da dobradiça
  const larguraPorta = larguraMm * escala;
  const posXDobradicaCentralizada = ladoDireito ?
    posX + larguraPorta - (CONFIG.espessuraPerfil * escala / 2) :
    posX + (CONFIG.espessuraPerfil * escala / 2);
  
  // Calcular posição X das cotas das dobradiças (mais afastadas que a cota de altura da porta)
  const posXCotaDobradicasVerticais = ladoDireito ? 
    posX + larguraPorta + 25 : 
    posX - 25;
  
  // Array para armazenar posições Y das dobradiças em pixels e informações para cotas
  const posicoesDobradicas = [];
  
  // Verificar se precisamos recalcular as posições
  const precisaRecalcular = !config.dobradicas || config.dobradicas.length !== numDobradicas;

  // Adicionado: verificar também se há valores inválidos nas dobradicas existentes
  const temValoresInvalidos = config.dobradicas && config.dobradicas.some(valor => 
    typeof valor !== 'number' || isNaN(valor) || valor < 0 || valor > alturaMm
  );

  if (precisaRecalcular || temValoresInvalidos) {
    // Se precisamos recalcular ou há valores inválidos, usar a função global
    if (typeof window.calcularPosicaoDefaultDobradica === 'function') {
      // Usar a função global para ter comportamento consistente
      const posicoesMm = window.calcularPosicaoDefaultDobradica(numDobradicas, alturaMm);
      
      // Validar cada posição retornada
      for (let i = 0; i < numDobradicas; i++) {
        // Garantir que temos um valor para cada posição, e que está dentro dos limites
        const posicaoMm = Array.isArray(posicoesMm) && posicoesMm.length > i ? 
          Math.max(0, Math.min(alturaMm, posicoesMm[i])) : 
          (i === 0 ? distanciaExtremidade : 
            i === numDobradicas - 1 ? alturaMm - distanciaExtremidade :
              Math.round(distanciaExtremidade + (i * ((alturaMm - 2 * distanciaExtremidade) / (numDobradicas - 1)))));
        
        const yPos = posY + (posicaoMm * escala);
        desenharDobradicaSVG(posXDobradicaCentralizada, yPos);
        posicoesDobradicas.push({
          yPos: yPos,
          valorMm: Math.round(posicaoMm)
        });
      }
    }
    else {
      // Fallback se a função global não estiver disponível
      for (let i = 0; i < numDobradicas; i++) {
        const posicaoMm = i === 0 ? distanciaExtremidade : 
          i === numDobradicas - 1 ? alturaMm - distanciaExtremidade :
            Math.round(distanciaExtremidade + (i * ((alturaMm - 2 * distanciaExtremidade) / (numDobradicas - 1))));
        
        const yPos = posY + (posicaoMm * escala);
        desenharDobradicaSVG(posXDobradicaCentralizada, yPos);
        posicoesDobradicas.push({
          yPos: yPos,
          valorMm: Math.round(posicaoMm)
        });
      }
    }
    
    // Atualizar config.dobradicas com as novas posições calculadas
    config.dobradicas = posicoesDobradicas.map(pos => Math.round(pos.valorMm));
    
    // Aqui também chamar a função global para atualizar os campos de formulário
    if (typeof window.atualizarCamposPosicoesDobradicasQtd === 'function') {
      try {
        window.atualizarCamposPosicoesDobradicasQtd(numDobradicas, config.dobradicas);
      } catch (error) {
        console.warn('[AVISO Vibecode] Erro ao atualizar campos de dobradiças:', error);
      }
    }
  }
  else {
    // Usar posições existentes definidas pelo usuário, sem forçar 100mm de distância nas extremidades
    config.dobradicas.forEach(valorMm => {
      // Validar o valor antes de usar
      const valorValidado = Math.max(0, Math.min(alturaMm, valorMm));
      
      const yPos = posY + (valorValidado * escala);
      desenharDobradicaSVG(posXDobradicaCentralizada, yPos);
      posicoesDobradicas.push({
        yPos: yPos, 
        valorMm: Math.round(valorValidado)
      });
    });
  }
  
  // Ordenar as posições para garantir que as cotas sejam desenhadas de cima para baixo
  posicoesDobradicas.sort((a, b) => a.yPos - b.yPos);
  
  // Atualizar config.dobradicas após a ordenação
  config.dobradicas = posicoesDobradicas.map(pos => Math.round(pos.valorMm));
  
  // Verificar se os campos de formulário precisam ser atualizados
  const dobradicasInputs = document.querySelectorAll('[id^="dobradicaPos"]');
  if (dobradicasInputs.length === config.dobradicas.length) {
    // Atualizar os campos do formulário para refletir as posições atuais
    config.dobradicas.forEach((valorMm, i) => {
      const input = document.getElementById(`dobradicaPos${i+1}`);
      if (input && parseInt(input.value, 10) !== valorMm) {
        input.value = valorMm;
      }
    });
  }
  else if (typeof window.atualizarCamposPosicoesDobradicasQtd === 'function') {
    // Se o número de campos for diferente, recriá-los
    window.atualizarCamposPosicoesDobradicasQtd(config.dobradicas.length);
  }
  
  // Desenhar as cotas das dobradiças
  if (posicoesDobradicas.length > 0) {
    // Garantir que todas as posições estejam pelo menos com um valor mínimo
    const MIN_DISTANCE = 5; // Distância mínima segura
    
    // Primeira dobradiça: cota a partir do topo da porta
    desenharCotaSVG(
      posXCotaDobradicasVerticais,
      posY,
      posXCotaDobradicasVerticais,
      posicoesDobradicas[0].yPos,
      formatarValorCota(posicoesDobradicas[0].valorMm),
      'middle',
      CONFIG.corCotaDobradicasCima
    );
    
    // Dobradiças intermediárias: cotas entre dobradiças consecutivas
    for (let i = 1; i < posicoesDobradicas.length; i++) {
      const distanciaEntreDobradicas = Math.max(
        MIN_DISTANCE,
        Math.round(posicoesDobradicas[i].valorMm - posicoesDobradicas[i-1].valorMm)
      );
      
      desenharCotaSVG(
        posXCotaDobradicasVerticais,
        posicoesDobradicas[i-1].yPos,
        posXCotaDobradicasVerticais,
        posicoesDobradicas[i].yPos,
        formatarValorCota(distanciaEntreDobradicas),
        'middle',
        CONFIG.corCotaDobradicasMeio
      );
    }
    
    // Última dobradiça: cota da última dobradiça até a base da porta
    const ultimaDobradicaIndice = posicoesDobradicas.length - 1;
    const distanciaAteBase = Math.max(
      MIN_DISTANCE,
      Math.round(alturaMm - posicoesDobradicas[ultimaDobradicaIndice].valorMm)
    );
    
    desenharCotaSVG(
      posXCotaDobradicasVerticais,
      posicoesDobradicas[ultimaDobradicaIndice].yPos,
      posXCotaDobradicasVerticais,
      posY + alturaPorta,
      formatarValorCota(distanciaAteBase),
      'middle',
      CONFIG.corCotaDobradicasBaixo
    );
  }
} 