/**
 * Funções para desenhar anotações (cotas, legendas, etc.)
 * Sistema de Portas e Perfis
 */

import { CONFIG } from './config.js';
import { criarElementoSVG, getSvgContainer } from './core.js';
import { mmParaPixels, pixelsParaMmInteiro, formatarValorCota } from './utils.js';

/**
 * Desenha a cota (dimensão) no desenho
 * @param {number} x1 - Posição X inicial
 * @param {number} y1 - Posição Y inicial
 * @param {number} x2 - Posição X final
 * @param {number} y2 - Posição Y final
 * @param {string} texto - Texto da cota
 * @param {string} alinhamento - Alinhamento do texto
 * @param {string} cor - Cor da cota (opcional)
 */
export function desenharCotaSVG(x1, y1, x2, y2, texto, alinhamento = 'middle', cor = CONFIG.corTexto) {
  const svgContainer = getSvgContainer();
  
  // Verificar se o svgContainer existe
  if (!svgContainer) {
    console.error('Contêiner SVG não encontrado ao desenhar cota');
    return;
  }
  
  // Validar parâmetros
  if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) {
    console.error('Parâmetros inválidos para desenharCotaSVG:', { x1, y1, x2, y2, texto });
    return;
  }
  
  // Garantir que o texto está definido
  texto = texto || '';
  
  try {
    // Linha principal
    const linha = criarElementoSVG('line', {
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      stroke: cor,
      'stroke-width': CONFIG.espessuraLinha,
      'stroke-dasharray': '4,2'
    });
    svgContainer.appendChild(linha);
  
    // Linhas auxiliares
    if (x1 === x2) { // Cota vertical
      const extensao = 8;
      // Linha auxiliar superior
      const auxSup = criarElementoSVG('line', {
        x1: x1 - extensao,
        y1: y1,
        x2: x1 + extensao,
        y2: y1,
        stroke: cor,
        'stroke-width': CONFIG.espessuraLinha
      });
      svgContainer.appendChild(auxSup);
    
      // Linha auxiliar inferior
      const auxInf = criarElementoSVG('line', {
        x1: x1 - extensao,
        y1: y2,
        x2: x1 + extensao,
        y2: y2,
        stroke: cor,
        'stroke-width': CONFIG.espessuraLinha
      });
      svgContainer.appendChild(auxInf);
    
      // Texto com nova fonte e posicionamento ajustado
      const textoElem = criarElementoSVG('text', {
        x: x1 - 15,
        y: (y1 + y2) / 2,
        fill: cor,
        'font-family': CONFIG.fonteCota,
        'font-size': CONFIG.tamanhoCota,
        'font-weight': CONFIG.espessuraCota,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        transform: `rotate(-90, ${x1 - 15}, ${(y1 + y2) / 2})`
      });
      textoElem.textContent = texto;
      svgContainer.appendChild(textoElem);
    }
    else if (y1 === y2) { // Cota horizontal
      const extensao = 8;
      // Linha auxiliar esquerda
      const auxEsq = criarElementoSVG('line', {
        x1: x1,
        y1: y1 - extensao,
        x2: x1,
        y2: y1 + extensao,
        stroke: cor,
        'stroke-width': CONFIG.espessuraLinha
      });
      svgContainer.appendChild(auxEsq);
    
      // Linha auxiliar direita
      const auxDir = criarElementoSVG('line', {
        x1: x2,
        y1: y1 - extensao,
        x2: x2,
        y2: y1 + extensao,
        stroke: cor,
        'stroke-width': CONFIG.espessuraLinha
      });
      svgContainer.appendChild(auxDir);
    
      // Texto com nova fonte
      const textoElem = criarElementoSVG('text', {
        x: (x1 + x2) / 2,
        y: y1 - 15,
        fill: cor,
        'font-family': CONFIG.fonteCota,
        'font-size': CONFIG.tamanhoCota,
        'font-weight': CONFIG.espessuraCota,
        'text-anchor': alinhamento,
        'alignment-baseline': 'middle'
      });
      textoElem.textContent = texto;
      svgContainer.appendChild(textoElem);
    }
    else {
      console.warn('Tipo de cota não reconhecido (nem vertical nem horizontal):', { x1, y1, x2, y2 });
    }
  }
  catch (error) {
    console.error('Erro ao desenhar cota:', error, { x1, y1, x2, y2, texto });
  }
}

/**
 * Desenha as cotas principais da porta
 * @param {number} posX - Posição X inicial da porta
 * @param {number} posY - Posição Y inicial da porta
 * @param {number} larguraPorta - Largura da porta
 * @param {number} alturaPorta - Altura da porta
 * @param {Object} config - Configuração da porta
 */
export function desenharCotasSVG(posX, posY, larguraPorta, alturaPorta, config) {
  // Determinar o lado das dobradiças
  const ladoDireito = config.funcao?.includes('Direita');
  
  // Verificar se é uma porta deslizante
  const ehDeslizante = config.funcao === 'deslizante';
  
  // Verificar se é uma porta basculante
  const ehBasculante = config.funcao === 'basculante';
  
  // Verificar se é "S/Puxador" - nesse caso, não considera a posição do puxador para cotas
  // Usando comparação case-insensitive para garantir compatibilidade com novas convenções
  const semPuxador = config.puxador?.modelo === 'S/Puxador' || 
                    config.puxador?.modelo?.toUpperCase() === 'S/PUXADOR';
  
  // Verificar se o puxador é horizontal para ajustar posicionamento das cotas
  const ehPuxadorHorizontal = !semPuxador && config.puxador?.posicao === 'horizontal';
  const ehPortaInferior = config.funcao?.includes('inferior');
  
  // Determinar se a cota de largura fica em cima ou embaixo
  // Se for basculante, sempre posicionar a cota em cima (do mesmo lado das dobradiças)
  // Se for puxador horizontal:
  //   - Para portas inferiores: cotas em baixo (puxador em cima)
  //   - Para portas superiores: cotas em cima (puxador em baixo)
  // Se for sem puxador, usar posicionamento padrão (em cima para porta inferior, embaixo para superior)
  let cotaEmCima;
  
  if (ehBasculante) {
    // Para basculante, sempre colocar a cota em cima (alterado)
    cotaEmCima = true;
  } else if (ehPuxadorHorizontal) {
    // Para puxador horizontal:
    // - Se porta inferior: cotas em baixo (puxador em cima)
    // - Se porta superior: cotas em cima (puxador em baixo)
    cotaEmCima = !ehPortaInferior;
  } else if (semPuxador) {
    // Para portas sem puxador, usar posicionamento padrão
    cotaEmCima = ehPortaInferior;
  } else {
    // Para puxador vertical: em cima para inferior, embaixo para superior
    cotaEmCima = ehPortaInferior;
  }
  
  // Formatar valores de largura e altura usando a função de formatação
  const larguraFormatada = formatarValorCota(config.largura, true);
  const alturaFormatada = formatarValorCota(config.altura, true);
  
  // Distância padrão para cotas
  const distanciaCota = 50;
  
  // Cota horizontal (largura)
  desenharCotaSVG(
    posX, 
    cotaEmCima ? posY - distanciaCota : posY + alturaPorta + distanciaCota,
    posX + larguraPorta, 
    cotaEmCima ? posY - distanciaCota : posY + alturaPorta + distanciaCota,
    larguraFormatada,
    'middle',
    CONFIG.corCotaPorta
  );
  
  // Cota vertical (altura) - posicionada do mesmo lado das dobradiças para portas de abrir
  // ou do lado oposto ao puxador para portas deslizantes
  let posXCotaAltura;
  
  if (semPuxador) {
    // Quando não há puxador, posiciona no lado padrão (esquerda)
    posXCotaAltura = posX - distanciaCota;
  }
  else if (ehDeslizante) {
    // Para portas deslizantes, sempre posicionar a cota de altura à esquerda
    posXCotaAltura = posX - distanciaCota;
  }
  else {
    // Para portas de abrir, manter lógica existente
    posXCotaAltura = ladoDireito ? posX + larguraPorta + distanciaCota : posX - distanciaCota;
  }
  
  desenharCotaSVG(
    posXCotaAltura, 
    posY, 
    posXCotaAltura, 
    posY + alturaPorta, 
    alturaFormatada,
    'middle',
    CONFIG.corCotaPorta
  );
}

/**
 * Desenha a legenda com informações da porta
 * @param {Object} config - Configuração da porta
 */
export function desenharLegenda(config) {
  // AVISO: Esta função está sendo chamada por door-types.js, mas foi substituída por uma versão diferente lá
  // Isso causa conflito e duplicação de legendas. Vamos apenas repassar para a versão correta.
  
  // Verificar se existe a implementação mais recente em door-types.js
  if (typeof window.desenharLegendaNoSVG === 'function') {
    console.log('Redirecionando para implementação mais recente de desenharLegenda');
    return window.desenharLegendaNoSVG(config);
  }
  
  // Se a versão em door-types.js não estiver disponível, usar esta versão original
  const svgContainer = getSvgContainer();
  
  if (!svgContainer) {
    return;
  }
  
  // NOVO: Primeiro, verificar se já existe uma legenda e removê-la
  // Isso evita duplicação de legendas
  const legendasExistentes = svgContainer.querySelectorAll('rect[fill="white"][stroke="black"]');
  if (legendasExistentes.length > 0) {
    legendasExistentes.forEach(legenda => {
      // Verificar se é realmente uma legenda pela altura aproximada (140 ou próximo)
      const altura = parseFloat(legenda.getAttribute('height') || 0);
      if (altura >= 120 && altura <= 160) {
        console.log('Removendo legenda existente...');
        const posY = parseFloat(legenda.getAttribute('y'));
        const posX = parseFloat(legenda.getAttribute('x'));
        const largura = parseFloat(legenda.getAttribute('width'));
        
        // Remover todos os elementos que possam fazer parte da legenda
        // (textos, linhas e a própria borda)
        Array.from(svgContainer.children).forEach(element => {
          if (element.tagName === 'rect' || element.tagName === 'text' || element.tagName === 'line') {
            const elemY = parseFloat(element.getAttribute('y') || 0);
            const elemX = parseFloat(element.getAttribute('x') || 0);
            
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
  
  // Verificar se é uma porta deslizante
  const ehDeslizante = config.funcao === 'deslizante';
  
  // Determinar posição e tamanho da legenda
  const larguraLegenda = CONFIG.largura * 0.95;  // 95% da largura do desenho
  const alturaLegenda = 140;  // Altura fixa suficiente para 6 linhas de texto
  const posX = (CONFIG.largura - larguraLegenda) / 2;  // Centralizar horizontalmente
  const posY = CONFIG.altura - alturaLegenda - 10;  // Posicionar na parte inferior com margem
  
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
  criarTexto(posXTextos.coluna1, posYTextos.linha2, `Vidro: ${config.vidroTipo || config.vidro || 'Incolor'}`);
  
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
  criarTexto(posXTextos.coluna3, posYTextos.linha2, ``);

  // Terceira linha
  criarTexto(posXTextos.coluna1, posYTextos.linha3, `Perfil: ${config.perfilModelo || 'RM-114'}`);
  criarTexto(posXTextos.coluna2, posYTextos.linha3, ehDeslizante ? 
    `Sistema: ${config.modeloDeslizante || 'RO-654025'}` : 
    `Dobradiças: ${config.numDobradicas === 'S/Dobradiças' ? 'S/Dobradiças' : (config.numDobradicas || '4')}`);
  
  // Terceira linha - Quantidade em negrito com zeros à esquerda (3 dígitos)
  const qtdValor = config.quantidade || '1';
  const qtdFormatada = qtdValor.toString().padStart(3, '0'); // Formato 001, 002, etc.
  const quantidadeTexto = criarElementoSVG('text', {
    x: posXTextos.coluna3,
    y: posYTextos.linha3,
    'font-family': CONFIG.fonteCota,
    'font-size': '12px',
    'font-weight': 'bold', // Texto em negrito
    'text-anchor': 'start',
    'dominant-baseline': 'middle',
    fill: 'black'
  });
  quantidadeTexto.textContent = `Quantidade: ${qtdFormatada}`;
  svgContainer.appendChild(quantidadeTexto);

  // Quarta linha
  criarTexto(posXTextos.coluna1, posYTextos.linha4, `Cor: ${config.perfilCor || 'Preto'}`);
  criarTexto(posXTextos.coluna2, posYTextos.linha4, `Puxador: ${config.puxador?.modelo === 'S/Puxador' ? 'S/Puxador' : (config.puxador?.modelo || 'CIELO')}`);
  criarTexto(posXTextos.coluna3, posYTextos.linha4, `Pux. Medida: ${config.puxador?.modelo === 'S/Puxador' ? 'S/Puxador' : (config.puxador?.medida || '100 mm')}`);

  // Quinta linha
  // Se for deslizante, mostrar o trilho; se for porta de abrir (superior/inferior), mostrar Porta em Par
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
  criarTexto(posXTextos.coluna2, posYTextos.linha5, `Posição: ${config.puxador?.modelo === 'S/Puxador' ? 'S/Puxador' : (config.puxador?.posicao || 'Vertical')}`);
  criarTexto(posXTextos.coluna3, posYTextos.linha5, `Entrega: A combinar`);

  // Sexta linha - Observações
  criarTexto(posX + 10, posYTextos.obs, `Obs: ${config.observacao || ''}`);
} 