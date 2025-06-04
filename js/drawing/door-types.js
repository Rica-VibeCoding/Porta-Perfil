/**
 * Funções para desenhar diferentes tipos de porta
 * Sistema de Portas e Perfis
 */

import { CONFIG, obterCorPerfil, obterCorVidro } from './config.js';
import { criarElementoSVG, getSvgContainer, aplicarFundoBranco, inicializarCanvas } from './core.js';
import { desenharDobradicasSVG, aplicarEfeitosReflexoVidro, desenharPuxadorSVG, limparSVG } from './elements.js';
import { desenharCotasSVG, desenharLegenda } from './annotations.js';
import { mmParaPixels, pixelsParaMmInteiro, formatarValorCota } from './utils.js';

/**
 * Atualiza a tabela de especificações com os dados da configuração atual
 * @param {Object} config - Configuração atual da porta
 */
function atualizarTabelaEspecificacoes(config) {
  if (!config) return;
  
  // Atualizar células da tabela com os dados da configuração
  const dimensoes = document.getElementById('specs-dimensoes');
  if (dimensoes) dimensoes.textContent = `${config.largura || '-'} × ${config.altura || '-'} mm`;
  
  const vidro = document.getElementById('specs-vidro');
  if (vidro) vidro.textContent = config.vidroTipo || config.vidro || '-';
  
  const perfil = document.getElementById('specs-perfil');
  if (perfil) perfil.textContent = `${config.perfilModelo || '-'} (${config.perfilCor || '-'})`;
  
  const funcao = document.getElementById('specs-funcao');
  if (funcao) {
    let funcaoTexto = '-';
    if (config.funcao) {
      if (config.funcao === 'deslizante') {
        funcaoTexto = 'Deslizante';
      } else if (config.funcao === 'basculante') {
        funcaoTexto = 'Basculante';
      } else if (config.funcao.includes('superior')) {
        funcaoTexto = config.funcao.includes('Direita') ? 'Superior Direita' : 'Superior Esquerda';
      } else if (config.funcao.includes('inferior')) {
        funcaoTexto = config.funcao.includes('Direita') ? 'Inferior Direita' : 'Inferior Esquerda';
      }
    }
    funcao.textContent = funcaoTexto;
  }
  
  const puxador = document.getElementById('specs-puxador');
  if (puxador) {
    if (config.puxador?.modelo === 'S/Puxador') {
      puxador.textContent = 'Sem puxador';
    } else {
      const posicao = config.puxador?.posicao === 'vertical' ? 'Vertical' : 'Horizontal';
      const medida = config.puxador?.medida || '-';
      puxador.textContent = `${config.puxador?.modelo || '-'} ${posicao} (${medida} mm)`;
    }
  }
}

/**
 * Desenha a porta com base na configuração
 * @param {Object} config - Configuração atual da porta
 * @returns {boolean} - Status do desenho
 */
export function desenharPorta(config) {
  // Verificar se o container SVG está disponível
  let svgContainer = getSvgContainer();
  if (!svgContainer) {
    console.warn('[AVISO Vibecode] SVG não inicializado, tentando inicializar...');
    
    // Tenta inicializar o SVG como último recurso
    try {
      const inicializado = inicializarCanvas('desenho');
      if (inicializado) {
        console.log('[AVISO Vibecode] SVG inicializado com sucesso no desenharPorta');
        svgContainer = getSvgContainer();
      }
      else {
        // Ainda não conseguiu inicializar
        console.error('[ERRO Vibecode] Falha ao inicializar SVG em desenharPorta');
        return false;
      }
    }
    catch (error) {
      console.error('[ERRO Vibecode] Erro ao tentar inicializar SVG em desenharPorta:', error);
      return false;
    }
  }
  
  // Verificar se o SVG foi inicializado após a tentativa
  if (!svgContainer) {
    console.error('[ERRO Vibecode] SVG não inicializado e não foi possível inicializá-lo');
    return false;
  }
  
  // Se config não for fornecido, usamos os valores padrão
  if (!config) {
    console.warn('[AVISO Vibecode] Configuração não fornecida para desenharPorta, usando valores padrão');
    config = {
      largura: 700,
      altura: 2100,
      perfilCor: 'Preto',
      numDobradicas: 4,
      funcao: 'superiorDireita'
    };
  }
  
  // Garantir que valores críticos existam e sejam válidos
  // Verificação de valores inválidos
  if (typeof config.largura !== 'number' || isNaN(config.largura) || config.largura <= 0) {
    console.error('[ERRO Vibecode] Largura inválida para desenharPorta:', config.largura);
    config.largura = 700; // Valor padrão seguro
  }
  
  if (typeof config.altura !== 'number' || isNaN(config.altura) || config.altura <= 0) {
    console.error('[ERRO Vibecode] Altura inválida para desenharPorta:', config.altura);
    config.altura = 2100; // Valor padrão seguro
  }
  
  // Normalizar a função para garantir consistência nas comparações
  if (!config.funcao) {
    config.funcao = 'superiorDireita'; // Valor padrão seguro
  }
  
  // Verificar se é uma porta deslizante ou basculante usando verificação case-insensitive
  const funcaoNormalizada = typeof config.funcao === 'string' ? config.funcao.toLowerCase() : '';
  const ehDeslizante = funcaoNormalizada === 'deslizante';
  const ehBasculante = funcaoNormalizada === 'basculante';
  
  // Tratar o erro de appendChild (causa original) com proteção em camadas
  try {
    // Limpar todo o SVG antes de desenhar novamente (evitar elementos sobrescritos parcialmente)
    limparSVG();
    
    // Desenhar de acordo com o tipo de porta
    if (ehDeslizante) {
      return desenharPortaDeslizante(config);
    }
    else if (ehBasculante) {
      return desenharPortaBasculante(config);
    }
    else {
      return desenharPortaAbrir(config);
    }
  } catch (error) {
    console.error('[ERRO Vibecode] Falha ao desenhar porta:', error);
    // Tentar recuperar desenho colocando um SVG de emergência
    try {
      limparSVG();
      // Desenhar um retângulo simples como indicador de erro
      const rect = criarElementoSVG('rect', {
        x: 100,
        y: 100,
        width: 400,
        height: 200,
        fill: '#ffcccc',
        stroke: 'red',
        'stroke-width': 2
      });
      if (rect) svgContainer.appendChild(rect);
      
      // Mensagem de erro
      const text = criarElementoSVG('text', {
        x: 300,
        y: 200,
        'text-anchor': 'middle',
        'font-size': '16px',
        fill: 'red'
      });
      if (text) {
        text.textContent = 'Erro ao desenhar a porta. Tente recarregar a página.';
        svgContainer.appendChild(text);
      }
    } catch (secondaryError) {
      console.error('[ERRO Vibecode] Falha ao desenhar mensagem de erro:', secondaryError);
    }
    return false;
  }
}

/**
 * Desenha uma porta de abrir (com dobradiças)
 * @param {Object} config - Configuração da porta
 * @returns {boolean} - Status do desenho
 */
export function desenharPortaAbrir(config) {
  const svgContainer = getSvgContainer();
  if (!svgContainer) {
    return false;
  }
  
  // Validar largura e altura
  if (!config.largura || !config.altura) {
    console.error('Dimensões inválidas para a porta:', config);
    return false;
  }
  
  // Calcular dimensões usando a função de conversão mm para pixels
  const larguraPorta = mmParaPixels(config.largura);
  const alturaPorta = mmParaPixels(config.altura);
  
  // Posição central
  const posX = (CONFIG.largura - larguraPorta) / 2;
  const posY = (CONFIG.altura - alturaPorta) / 4;
  
  // Adicionar um fundo branco primeiro
  aplicarFundoBranco();
  
  // Espessura do perfil em pixels
  const espessuraPerfilPx = mmParaPixels(CONFIG.espessuraPerfil);
  
  // Moldura externa fina
  const molduraExterna = criarElementoSVG('rect', {
    x: posX,
    y: posY,
    width: larguraPorta,
    height: alturaPorta,
    fill: obterCorPerfil(config.perfilCor),
    stroke: 'black',
    'stroke-width': CONFIG.espessuraLinha
  });
  svgContainer.appendChild(molduraExterna);
  
  // Desenhar o contorno interno
  const molduraInterna = criarElementoSVG('rect', {
    x: posX + espessuraPerfilPx,
    y: posY + espessuraPerfilPx,
    width: larguraPorta - (espessuraPerfilPx * 2),
    height: alturaPorta - (espessuraPerfilPx * 2),
    fill: 'none',
    stroke: 'black',
    'stroke-width': CONFIG.espessuraLinha
  });
  svgContainer.appendChild(molduraInterna);
  
  // Área do vidro
  const vidro = criarElementoSVG('rect', {
    x: posX + espessuraPerfilPx,
    y: posY + espessuraPerfilPx,
    width: larguraPorta - (espessuraPerfilPx * 2),
    height: alturaPorta - (espessuraPerfilPx * 2),
    fill: obterCorVidro(config.vidroTipo || config.vidro),
    stroke: 'black',
    'stroke-width': CONFIG.espessuraLinha
  });
  svgContainer.appendChild(vidro);

  // Aplicar efeitos de reflexo no vidro
  aplicarEfeitosReflexoVidro(posX, posY, larguraPorta, alturaPorta);
  
  // Desenhar dobradiças
  desenharDobradicasSVG(posX, posY, alturaPorta, config);
  
  // Determinar o lado das dobradiças com base no tipo de porta
  const ladoDireito = config.funcao?.includes('Direita');
  
  // Desenhar puxador, passando o objeto config
  desenharPuxadorSVG(posX, posY, alturaPorta, ladoDireito, larguraPorta, config);
  
  // Desenhar cotas
  desenharCotasSVG(posX, posY, larguraPorta, alturaPorta, config);
  
  // Atualizar tabela de especificações
  atualizarTabelaEspecificacoes(config);
  
  // Limpar legendas antigas do SVG antes de desenhar nova
  limparLegendaExistente(config);
  
  // Renderizar a lâmina da porta (a face principal)
  desenharLaminaPorta(config);
  
  // Desenhar cotas
  desenharCotasSVG(posX, posY, larguraPorta, alturaPorta, config);
  
  return true;
}

/**
 * Desenha uma porta deslizante
 * @param {Object} config - Configuração da porta
 * @returns {boolean} - Status do desenho
 */
export function desenharPortaDeslizante(config) {
  const svgContainer = getSvgContainer();
  if (!svgContainer) {
    return false;
  }
  
  // Validar largura e altura
  if (!config.largura || !config.altura) {
    console.error('Dimensões inválidas para a porta deslizante:', config);
    return false;
  }
  
  // Calcular dimensões usando a função de conversão mm para pixels
  const larguraPorta = mmParaPixels(config.largura);
  const alturaPorta = mmParaPixels(config.altura);
  
  // Posição central
  const posX = (CONFIG.largura - larguraPorta) / 2;
  const posY = (CONFIG.altura - alturaPorta) / 3;
  
  // Adicionar um fundo branco primeiro
  aplicarFundoBranco();
  
  // Espessura do perfil em pixels
  const espessuraPerfilPx = mmParaPixels(CONFIG.espessuraPerfil);
  
  // Moldura externa fina
  const molduraExterna = criarElementoSVG('rect', {
    x: posX,
    y: posY,
    width: larguraPorta,
    height: alturaPorta,
    fill: obterCorPerfil(config.perfilCor),
    stroke: 'black',
    'stroke-width': CONFIG.espessuraLinha
  });
  svgContainer.appendChild(molduraExterna);
  
  // Desenhar o contorno interno
  const molduraInterna = criarElementoSVG('rect', {
    x: posX + espessuraPerfilPx,
    y: posY + espessuraPerfilPx,
    width: larguraPorta - (espessuraPerfilPx * 2),
    height: alturaPorta - (espessuraPerfilPx * 2),
    fill: 'none',
    stroke: 'black',
    'stroke-width': CONFIG.espessuraLinha
  });
  svgContainer.appendChild(molduraInterna);
  
  // Área do vidro
  const vidro = criarElementoSVG('rect', {
    x: posX + espessuraPerfilPx,
    y: posY + espessuraPerfilPx,
    width: larguraPorta - (espessuraPerfilPx * 2),
    height: alturaPorta - (espessuraPerfilPx * 2),
    fill: obterCorVidro(config.vidroTipo || config.vidro),
    stroke: 'black',
    'stroke-width': CONFIG.espessuraLinha
  });
  svgContainer.appendChild(vidro);
  
  // Aplicar efeitos de reflexo no vidro
  aplicarEfeitosReflexoVidro(posX, posY, larguraPorta, alturaPorta);
  
  // Verificar se o puxador deve ser desenhado em ambos os lados
  const ladoPuxador = config.puxador?.lados || 'direito';
  
  if (ladoPuxador === 'ambos') {
    // Configuração para puxador do lado direito
    const configPuxadorDireito = {
      ...config,
      puxador: {
        ...config.puxador,
        posicao: 'vertical',
        lado: 'direito'
      }
    };
    
    // Configuração para puxador do lado esquerdo
    const configPuxadorEsquerdo = {
      ...config,
      puxador: {
        ...config.puxador,
        posicao: 'vertical',
        lado: 'esquerdo'
      }
    };
    
    // Desenhar puxador no lado direito (ladoDireito = true)
    desenharPuxadorSVG(posX, posY, alturaPorta, true, larguraPorta, configPuxadorDireito);
    
    // Desenhar puxador no lado esquerdo (ladoDireito = false)
    desenharPuxadorSVG(posX, posY, alturaPorta, false, larguraPorta, configPuxadorEsquerdo);
  } 
  else {
    // Desenhar puxador respeitando a configuração do usuário para um único lado
    const configuracaoPuxador = {
      ...config,
      puxador: {
        ...config.puxador,
        posicao: 'vertical',
        lado: ladoPuxador
      }
    };
    
    // O parâmetro ladoDireito agora é dinâmico baseado na configuração
    desenharPuxadorSVG(posX, posY, alturaPorta, ladoPuxador !== 'esquerdo', larguraPorta, configuracaoPuxador);
  }
  
  // Desenhar cotas
  desenharCotasSVG(posX, posY, larguraPorta, alturaPorta, config);
  
  // Atualizar tabela de especificações
  atualizarTabelaEspecificacoes(config);
  
  // Limpar legendas antigas do SVG antes de desenhar nova
  limparLegendaExistente(config);
  
  // Renderizar a lâmina da porta (a face principal)
  desenharLaminaPorta(config);
  
  // Desenhar cotas
  desenharCotasSVG(posX, posY, larguraPorta, alturaPorta, config);
  
  return true;
}

/**
 * Desenha uma porta basculante
 * @param {Object} config - Configuração da porta
 * @returns {boolean} - Status do desenho
 */
export function desenharPortaBasculante(config) {
  console.log('DIAGNÓSTICO - desenharPortaBasculante chamado com config:', config);
  
  const svgContainer = getSvgContainer();
  if (!svgContainer) {
    return false;
  }
  
  // Validar largura e altura
  if (!config.largura || !config.altura) {
    console.error('Dimensões inválidas para a porta basculante:', config);
    return false;
  }
  
  // Calcular dimensões usando a função de conversão mm para pixels
  const larguraPorta = mmParaPixels(config.largura);
  const alturaPorta = mmParaPixels(config.altura);
  
  // Posição central - nota: para basculante usamos /3 para posicionar mais abaixo 
  // conforme documentação
  const posX = (CONFIG.largura - larguraPorta) / 2;
  const posY = (CONFIG.altura - alturaPorta) / 3;
  
  // Adicionar um fundo branco primeiro
  aplicarFundoBranco();
  
  // Espessura do perfil em pixels
  const espessuraPerfilPx = mmParaPixels(CONFIG.espessuraPerfil);
  
  // Moldura externa fina
  const molduraExterna = criarElementoSVG('rect', {
    x: posX,
    y: posY,
    width: larguraPorta,
    height: alturaPorta,
    fill: obterCorPerfil(config.perfilCor),
    stroke: 'black',
    'stroke-width': CONFIG.espessuraLinha
  });
  svgContainer.appendChild(molduraExterna);
  
  // Desenhar o contorno interno
  const molduraInterna = criarElementoSVG('rect', {
    x: posX + espessuraPerfilPx,
    y: posY + espessuraPerfilPx,
    width: larguraPorta - (espessuraPerfilPx * 2),
    height: alturaPorta - (espessuraPerfilPx * 2),
    fill: 'none',
    stroke: 'black',
    'stroke-width': CONFIG.espessuraLinha
  });
  svgContainer.appendChild(molduraInterna);
  
  // Área do vidro
  const vidro = criarElementoSVG('rect', {
    x: posX + espessuraPerfilPx,
    y: posY + espessuraPerfilPx,
    width: larguraPorta - (espessuraPerfilPx * 2),
    height: alturaPorta - (espessuraPerfilPx * 2),
    fill: obterCorVidro(config.vidroTipo || config.vidro),
    stroke: 'black',
    'stroke-width': CONFIG.espessuraLinha
  });
  svgContainer.appendChild(vidro);
  
  // Aplicar efeitos de reflexo no vidro
  aplicarEfeitosReflexoVidro(posX, posY, larguraPorta, alturaPorta);
  
  // Desenhar dobradiças no topo
  desenharDobradicasSVG(posX, posY, alturaPorta, config);
  
  // Forçar configuração específica para porta basculante
  if (!config.puxador) {
    config.puxador = {};
  }
  
  // Forçar puxador horizontal para porta basculante
  const configPuxador = {
    ...config,
    puxador: {
      ...config.puxador,
      posicao: 'horizontal'
    }
  };
  
  // Centralizar o puxador na parte inferior
  desenharPuxadorSVG(posX, posY, alturaPorta, false, larguraPorta, configPuxador);
  
  // Desenhar cotas
  desenharCotasSVG(posX, posY, larguraPorta, alturaPorta, config);
  
  // Atualizar tabela de especificações
  atualizarTabelaEspecificacoes(config);
  
  // Limpar legendas antigas do SVG antes de desenhar nova
  limparLegendaExistente(config);
  
  // Renderizar a lâmina da porta (a face principal)
  desenharLaminaPorta(config);
  
  // Desenhar cotas
  desenharCotasSVG(posX, posY, larguraPorta, alturaPorta, config);
  
  return true;
}

/**
 * Atualiza o desenho da porta com base na configuração atual
 * @param {Object} [config] - Configuração atual (opcional)
 * @returns {boolean} - Status da atualização
 */
export function atualizarDesenho(config) {
  try {
    // Se config não for fornecido, tenta obter a configuração atual
    if (!config) {
      try {
        // Tenta importar e usar a função obterConfiguracaoAtual
        const modulePromise = import('../initialize.js').then(module => {
          if (typeof module.obterConfiguracaoAtual === 'function') {
            const currentConfig = module.obterConfiguracaoAtual();
            if (currentConfig) {
              return validarEDesenharPorta(currentConfig);
            }
          }
        }).catch(error => {
          console.warn('[ERRO Vibecode] Erro ao importar módulo initialize.js:', error);
        });
        
        // Se a importação falhar ou estiver em andamento, tenta usar uma função global
        if (typeof window.obterConfiguracaoAtual === 'function') {
          const currentConfig = window.obterConfiguracaoAtual();
          if (currentConfig) {
            return validarEDesenharPorta(currentConfig);
          }
        }
        
        return modulePromise; // Retorna a promessa se estiver usando import dinâmico
      }
      catch (error) {
        console.warn('[ERRO Vibecode] Erro ao obter configuração atual:', error);
      }
    }
    
    // Se chegou aqui, usa a config recebida
    return validarEDesenharPorta(config);
  }
  catch (error) {
    console.error('[ERRO Vibecode] Erro ao atualizar desenho:', error);
    return false;
  }
}

/**
 * Função auxiliar que valida a configuração antes de desenhar
 * @private
 * @param {Object} config - Configuração a ser validada e usada
 * @returns {boolean} - Status do desenho
 */
function validarEDesenharPorta(config) {
  if (!config) {
    console.error('[ERRO Vibecode] Configuração inválida em validarEDesenharPorta');
    return false;
  }
  
  // Fallback duro para os padrões
  const fallbackPadroes = {
    'Abrir Superior Direita': { largura: 450, altura: 2450 },
    'Abrir Superior Esquerda': { largura: 450, altura: 2450 },
    'Abrir Inferior Direita': { largura: 450, altura: 2450 },
    'Abrir Inferior Esquerda': { largura: 450, altura: 2450 },
    'Basculante': { largura: 1000, altura: 450 },
    'Deslizante': { largura: 900, altura: 2450 }
  };
  
  // Funções de fallback
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
  
  // Validar e corrigir valores críticos
  const alturaInvalida = typeof config.altura !== 'number' || isNaN(config.altura) || config.altura <= 0;
  const larguraInvalida = typeof config.largura !== 'number' || isNaN(config.largura) || config.largura <= 0;
  
  if (alturaInvalida || larguraInvalida) {
    // Determinar o tipo correto de porta para buscar padrões apropriados
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
    
    // Buscar padrão para o tipo de porta
    const padrao = padroesFuncao.obterUltimoValorPorta(tipoPorta);
    
    console.warn('[Vibecode] Corrigindo valores inválidos em validarEDesenharPorta:', 
      { alturaInvalida, larguraInvalida, tipoPorta, padrao }
    );
    
    // Aplicar valores do padrão
    if (alturaInvalida) config.altura = padrao.altura;
    if (larguraInvalida) config.largura = padrao.largura;
  }
  
  return desenharPorta(config);
}

/**
 * Desenha a porta usando SVG
 * @param {Object} config - Configuração da porta
 */
export function desenharPortaSVG(config) {
  return desenharPorta(config);
}

/**
 * Desenha a lâmina principal da porta (camada visual base)
 * @param {Object} config - Configuração da porta
 */
function desenharLaminaPorta(config) {
  // Esta função é apenas um espaço reservado para futura implementação
  // Eventualmente poderia desenhar detalhes adicionais ou texturas na superfície da porta
  console.log('desenharLaminaPorta chamada - implementação básica');
  
  // Não faz nada por enquanto, mas mantida para compatibilidade com o código existente
  return;
}

/**
 * Limpa legendas existentes no SVG
 * @param {Object} config - Configuração da porta
 */
function limparLegendaExistente(config) {
  // IMPORTANTE: Este código foi refatorado para resolver o problema de duplicação da legenda
  // Não usar esta função diretamente, use a versão em annotations.js
  
  console.log('DIAGNÓSTICO: limparLegendaExistente chamada de door-types.js');
  
  const svgContainer = getSvgContainer();
  if (!svgContainer) {
    return;
  }
  
  // APENAS LIMPA qualquer legenda existente dentro do SVG
  const legendasExistentes = svgContainer.querySelectorAll('rect[fill="white"][stroke="black"]');
  if (legendasExistentes.length > 0) {
    console.log(`Removendo ${legendasExistentes.length} legendas existentes dentro do SVG`);
    legendasExistentes.forEach(legenda => {
      // Verificar se é realmente uma legenda pela altura aproximada
      const altura = parseFloat(legenda.getAttribute('height') || 0);
      if (altura >= 120 && altura <= 160) {
        const posY = parseFloat(legenda.getAttribute('y'));
        const posX = parseFloat(legenda.getAttribute('x'));
        const largura = parseFloat(legenda.getAttribute('width'));
        const altura = parseFloat(legenda.getAttribute('height'));
        
        // Remover todos os elementos que possam fazer parte da legenda
        Array.from(svgContainer.children).forEach(element => {
          if (element.tagName === 'rect' || element.tagName === 'text' || element.tagName === 'line') {
            const elemY = parseFloat(element.getAttribute('y') || element.getAttribute('y1') || 0);
            const elemX = parseFloat(element.getAttribute('x') || element.getAttribute('x1') || 0);
            
            // Se o elemento estiver na área da legenda, remover
            if (elemY >= posY && elemY <= posY + altura && 
                elemX >= posX && elemX <= posX + largura) {
              try {
                svgContainer.removeChild(element);
              } catch (e) {
                console.warn('Falha ao remover elemento:', e);
              }
            }
          }
        });
      }
    });
  }
  
  // Agora, vamos desenhar a legenda novamente no SVG
  console.log('Adicionando legenda dentro do SVG');
  
  // Verificar se é uma porta deslizante
  const ehDeslizante = config.funcao === 'deslizante';
  
  // Determinar posição e tamanho da legenda
  const larguraLegenda = CONFIG.largura * 0.95;  // 95% da largura do desenho
  const alturaLegenda = 140;  // Altura fixa suficiente para 6 linhas de texto
  const posX = (CONFIG.largura - larguraLegenda) / 2;  // Centralizar horizontalmente
  const posY = CONFIG.altura - alturaLegenda - 10;  // Posicionar na parte inferior com margem
  
  // Validar dimensões para evitar erros de valor negativo
  if (larguraLegenda <= 0 || alturaLegenda <= 0 || posX < 0 || posY < 0) {
    console.warn('[Vibecode] Dimensões inválidas para legenda:', { larguraLegenda, alturaLegenda, posX, posY });
    return; // Não prosseguir se as dimensões forem inválidas
  }
  
  // Desenhar a borda da legenda
  const borda = criarElementoSVG('rect', {
    x: posX,
    y: posY,
    width: larguraLegenda,
    height: alturaLegenda,
    fill: 'white',
    stroke: 'black',
    'stroke-width': 0.5,
    'class': 'legenda-borda'  // Adicionar classe para facilitar identificação
  });
  svgContainer.appendChild(borda);
  
  // Espaçamento entre as linhas
  const espacoEntreLinhas = alturaLegenda / 6;  // 6 seções (título + 5 linhas de dados)
  
  // Desenhar as linhas horizontais
  [1, 2, 3, 4, 5].forEach(i => {
    const linha = criarElementoSVG('line', {
      x1: posX,
      y1: posY + espacoEntreLinhas * i,
      x2: posX + larguraLegenda,
      y2: posY + espacoEntreLinhas * i,
      stroke: 'black',
      'stroke-width': 0.5,
      'class': 'legenda-linha'  // Adicionar classe para facilitar identificação
    });
    svgContainer.appendChild(linha);
  });
  
  // Calcula a largura de cada coluna (3 colunas iguais)
  const larguraColuna = larguraLegenda / 3;
  
  // Linhas verticais
  const linhaVertical1 = criarElementoSVG('line', {
    x1: posX + larguraColuna,
    y1: posY + espacoEntreLinhas,
    x2: posX + larguraColuna,
    y2: posY + espacoEntreLinhas * 5,
    stroke: 'black',
    'stroke-width': 0.5
  });
  svgContainer.appendChild(linhaVertical1);
  
  const linhaVertical2 = criarElementoSVG('line', {
    x1: posX + larguraColuna * 2,
    y1: posY + espacoEntreLinhas,
    x2: posX + larguraColuna * 2,
    y2: posY + espacoEntreLinhas * 5,
    stroke: 'black',
    'stroke-width': 0.5
  });
  svgContainer.appendChild(linhaVertical2);

  // Ajustar as posições Y dos textos para ficarem centralizados em seus espaços
  const posYTextos = {
    titulo: posY + espacoEntreLinhas/2,        // Centralizado na primeira seção
    linha2: posY + espacoEntreLinhas * 1.5,    // Centralizado na segunda seção
    linha3: posY + espacoEntreLinhas * 2.5,    // Centralizado na terceira seção
    linha4: posY + espacoEntreLinhas * 3.5,    // Centralizado na quarta seção
    linha5: posY + espacoEntreLinhas * 4.5,    // Centralizado na quinta seção
    obs: posY + espacoEntreLinhas * 5.5        // Centralizado na sexta seção
  };
  
  // Definir posições X para os textos em cada coluna (com margem de 10px)
  const posXTextos = {
    coluna1: posX + 10,
    coluna2: posX + larguraColuna + 10,
    coluna3: posX + larguraColuna * 2 + 10
  };
  
  // Função auxiliar para criar texto
  const criarTexto = (x, y, texto, tamanho = '12px') => {
    const element = criarElementoSVG('text', {
      x: x,
      y: y,
      'font-family': CONFIG.fonteCota,
      'font-size': tamanho,
      'text-anchor': 'start',
      'dominant-baseline': 'middle',
      fill: 'black'
    });
    element.textContent = texto;
    svgContainer.appendChild(element);
  };

  // Título principal (parte 1 - "Descrição da Porta:")
  const tituloLegendaParte1 = criarElementoSVG('text', {
    x: posX + 15,
    y: posYTextos.titulo,
    'font-family': CONFIG.fonteCota,
    'font-size': '11px',
    'font-weight': 'bold',
    'text-anchor': 'start',
    'dominant-baseline': 'middle',
    fill: 'black'
  });
  tituloLegendaParte1.textContent = 'Descrição da Porta:';
  svgContainer.appendChild(tituloLegendaParte1);
  
  // Título principal (parte 2 - valor do cliente/ambiente)
  const tituloLegendaParte2 = criarElementoSVG('text', {
    x: posXTextos.coluna2,
    y: posYTextos.titulo,
    'font-family': CONFIG.fonteCota,
    'font-size': '11px',
    'font-weight': 'normal',
    'font-style': 'italic',
    'text-anchor': 'start',
    'dominant-baseline': 'middle',
    fill: '#444444'
  });
  tituloLegendaParte2.textContent = `${config.cliente || 'Cliente'} | ${config.ambiente || 'Ambiente'}`;
  svgContainer.appendChild(tituloLegendaParte2);

  // Segunda linha
  criarTexto(posXTextos.coluna1, posYTextos.linha2, `Medidas: ${config.altura || 0} × ${config.largura || 0} mm`);
  
  // Formatação adequada para todos os tipos de porta
  let funcaoTexto = '';
  if (ehDeslizante) {
    funcaoTexto = 'Deslizante';
  } else if (config.funcao === 'basculante') {
    funcaoTexto = 'Basculante';
  } else if (config.funcao?.includes('superior')) {
    funcaoTexto = config.funcao.includes('Direita') ? 'Superior Direita' : 'Superior Esquerda';
  } else if (config.funcao?.includes('inferior')) {
    funcaoTexto = config.funcao.includes('Direita') ? 'Inferior Direita' : 'Inferior Esquerda';
  } else {
    funcaoTexto = 'Superior Direita'; // Valor padrão
  }
  
  criarTexto(posXTextos.coluna2, posYTextos.linha2, `Função: ${funcaoTexto}`);
  
  // Quantidade em negrito com zeros à esquerda (3 dígitos)
  const qtdValor = config.quantidade || '1';
  const qtdFormatada = qtdValor.toString().padStart(3, '0'); // Formato 001, 002, etc.
  const quantidadeTexto = criarElementoSVG('text', {
    x: posXTextos.coluna3,
    y: posYTextos.linha2,
    'font-family': CONFIG.fonteCota,
    'font-size': '12px',
    'font-weight': 'bold', // Texto em negrito
    'text-anchor': 'start',
    'dominant-baseline': 'middle',
    fill: 'black'
  });
  quantidadeTexto.textContent = `Quantidade: ${qtdFormatada}`;
  svgContainer.appendChild(quantidadeTexto);

  // Terceira linha
  criarTexto(posXTextos.coluna1, posYTextos.linha3, `Vidro: ${config.vidroTipo || config.vidro || 'Incolor'}`);
  criarTexto(posXTextos.coluna2, posYTextos.linha3, `Perfil: ${config.perfilModelo || 'RM-114'}`);
  criarTexto(posXTextos.coluna3, posYTextos.linha3, `Cor Perfil: ${config.perfilCor || 'Preto'}`);

  // Quarta linha - Sistemas específicos para tipo de porta
  criarTexto(posXTextos.coluna1, posYTextos.linha4, ehDeslizante ? 
    `Sistema: ${config.modeloDeslizante || 'RO-654025'}` : 
    `Dobradiças: ${config.numDobradicas === 'S/Dobradiças' ? 'S/Dobradiças' : (config.numDobradicas || '4')}`);
  criarTexto(posXTextos.coluna2, posYTextos.linha4, `Puxador: ${config.puxador?.modelo === 'S/Puxador' ? 'S/Puxador' : (config.puxador?.modelo || 'CIELO')}`);
  criarTexto(posXTextos.coluna3, posYTextos.linha4, `Posição Pux.: ${config.puxador?.modelo === 'S/Puxador' ? 'S/Puxador' : (config.puxador?.posicao || 'Vertical')}`);

  // Quinta linha - Baseado no tipo de porta
  let textoLinha5Col1 = '';
  const funcao = (config.funcao || '').toLowerCase().replace(/\s|_/g, '');
  const ehBasculante = funcao.includes('basculante');
  if (ehDeslizante) {
    textoLinha5Col1 = `Trilho: ${config.trilhoDeslizante || 'Embutir'}`;
  } else if (ehBasculante) {
    textoLinha5Col1 = '-----';
  } else {
    // Porta de giro (abrir superior/inferior)
    const abrirSuperior = funcao.startsWith('superior') || funcao.includes('superiordireita') || funcao.includes('superioresquerda');
    const abrirInferior = funcao.startsWith('inferior') || funcao.includes('inferiordireita') || funcao.includes('inferioresquerda');
    if (abrirSuperior || abrirInferior) {
      textoLinha5Col1 = `Porta em Par: ${config.portaEmPar ? 'Sim' : 'Não'}`;
    } else {
      textoLinha5Col1 = '-';
    }
  }
  criarTexto(posXTextos.coluna1, posYTextos.linha5, textoLinha5Col1);
  criarTexto(posXTextos.coluna2, posYTextos.linha5, `Pux. Medida: ${config.puxador?.modelo === 'S/Puxador' ? 'S/Puxador' : (config.puxador?.medida || '100 mm')}`);
  criarTexto(posXTextos.coluna3, posYTextos.linha5, `Entrega: A combinar`);

  // Sexta linha - Observações
  criarTexto(posX + 10, posYTextos.obs, `Obs: ${config.observacao || ''}`);
}

// Exportar para uso global para evitar ciclos de referência
window.desenharLegendaNoSVG = limparLegendaExistente; 