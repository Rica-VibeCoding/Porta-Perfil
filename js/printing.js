/**
 * Módulo de funções de impressão
 */

import { mostrarNotificacao } from './notifications.js';
import { formatarData } from './utils.js';
import { obterConfiguracaoAtual } from './initialize.js';
import { atualizarDesenho } from './drawing.js';

/**
 * Inicializa o sistema de impressão
 */
function inicializarImpressao() {
  console.log('Inicializando módulo de impressão...');
  
  // Configurar botão de impressão
  const btnImprimir = document.getElementById('btnImprimir');
  if (btnImprimir) {
    // Remover event listeners existentes
    const novoBtnImprimir = btnImprimir.cloneNode(true);
    btnImprimir.parentNode.replaceChild(novoBtnImprimir, btnImprimir);
    
    // Adicionar novo event listener para usar a área dedicada
    novoBtnImprimir.addEventListener('click', imprimirComAreaDedicada);
    console.log('Botão de impressão configurado para usar área dedicada');
  } else {
    console.warn('Botão de impressão não encontrado no DOM');
  }
  
  // Nota: Os botões de exportação PDF e visualização prévia foram removidos da interface
  // e suas funcionalidades não são mais necessárias
  
  console.log('Módulo de impressão inicializado');
}

/**
 * Prepara o documento para impressão (função legada, lógica principal movida)
 */
function prepararImpressao() {
  console.warn('Função prepararImpressao() chamada, mas a lógica principal agora está em imprimirComAreaDedicada() e exportarComoPDFAreaDedicada(). Verifique as chamadas.');
  // A lógica original foi movida ou integrada em outras funções.
  // Esta função pode ser removida futuramente se não for mais necessária.
}

/**
 * Método principal para capturar SVG como imagem
 */
function capturarSVGParaImagem(svg) {
  return new Promise((resolve, reject) => {
    try {
      // Clonar o SVG para não afetar o original
      const svgClone = svg.cloneNode(true);
      
      // Adicionar o namespace XML para serialização correta
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      // Verificar se o SVG tem dimensões definidas
      if (!svgClone.getAttribute('width')) {
        svgClone.setAttribute('width', '595');
      }
      if (!svgClone.getAttribute('height')) {
        svgClone.setAttribute('height', '842');
      }
      
      // Converter o SVG para string
      const svgData = new XMLSerializer().serializeToString(svgClone);
      
      // Codificar o SVG para base64
      const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      
      // Testar se a imagem pode ser carregada
      const img = new Image();
      img.onload = function () {
        resolve(dataUrl);
      };
      img.onerror = function () {
        console.warn('Erro ao carregar SVG como imagem, tentando método alternativo');
        resolve(null);
      };
      img.src = dataUrl;
    } catch (error) {
      console.error('Erro ao converter SVG para imagem:', error);
      reject(error);
    }
  });
}

/**
 * Método alternativo usando html2canvas ou outras abordagens
 */
function fallbackCapturaSVG() {
  try {
    console.log('Tentando método alternativo de captura do SVG');
    
    // Verificar se temos html2canvas disponível
    if (typeof html2canvas !== 'undefined') {
      // Capturar o desenho usando html2canvas
      const elemento = document.getElementById('desenho');
      html2canvas(elemento).then(canvas => {
        const dataUrl = canvas.toDataURL('image/png');
        continuarProcessoImpressao(dataUrl);
      }).catch(error => {
        console.error('Falha no html2canvas:', error);
        // Tenta método mais simples como último recurso
        usarImagemFallback();
      });
    } else {
      // Se não temos html2canvas, tentar captura simples da div inteira
      usarImagemFallback();
    }
  } catch (error) {
    console.error('Erro no método alternativo:', error);
    usarImagemFallback();
  }
}

/**
 * Usa uma imagem de placeholder quando todos os métodos falham
 */
function usarImagemFallback() {
  console.warn('Todos os métodos de captura falharam, usando método básico');
  
  // Tentar capturar o SVG novamente com abordagem mais simples
  const svg = document.querySelector('#desenho svg');
  if (svg) {
    try {
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
      continuarProcessoImpressao(dataUrl);
    } catch (error) {
      console.error('Erro na captura básica:', error);
      mostrarNotificacao('Não foi possível capturar o desenho para impressão', 'error');
      document.body.classList.remove('modo-impressao');
    }
  } else {
    mostrarNotificacao('Desenho não encontrado', 'error');
    document.body.classList.remove('modo-impressao');
  }
}

/**
 * Continua o processo de impressão com a imagem já capturada
 */
function continuarProcessoImpressao(dataUrl) {
  // Atualizar imagem para impressão
  const imagemImpressao = document.getElementById('imagemImpressao');
  if (!imagemImpressao) {
    console.warn('Elemento imagemImpressao não encontrado, mas continuando com métodos alternativos de impressão');
    
    // Tentar usar os métodos modernos de impressão
    if (imprimirComAreaDedicada()) {
      return;
    }
    
    // Se o método moderno falhar, mostrar erro
    mostrarNotificacao('Erro ao preparar impressão: elemento de imagem não encontrado', 'error');
    document.body.classList.remove('modo-impressao');
    return;
  }
  
  // Continuar com o método legado
  imagemImpressao.src = dataUrl;
  console.log('Imagem para impressão definida com sucesso');
    
  // Obter a configuração atual
  const config = obterConfiguracaoAtual();
    
  // Preencher cabeçalho de impressão
  preencherCabecalhoImpressao(config);
    
  // Transferir logo para impressão
  const logoImage = document.getElementById('logoImage');
  const logoImpressao = document.getElementById('print-logo');
  if (logoImage && logoImpressao) {
    logoImpressao.src = logoImage.src;
  }
    
  // Adicionar classe para modo de impressão
  document.body.classList.add('modo-impressao');
    
  // Pequeno atraso para garantir que a imagem foi carregada
  setTimeout(() => {
    // Garantir que a imagem está carregada antes de imprimir
    if (imagemImpressao.complete) {
      console.log('Imagem carregada, iniciando impressão');
        
      // Remover a classe após imprimir
      setTimeout(() => {
        document.body.classList.remove('modo-impressao');
      }, 500);
    } else {
      // Se a imagem ainda não estiver carregada, aguardar o evento de carga
      imagemImpressao.onload = function () {
        console.log('Imagem carregada após evento onload, iniciando impressão');
          
        // Remover a classe após imprimir
        setTimeout(() => {
          document.body.classList.remove('modo-impressao');
        }, 500);
      };
        
      // Fallback caso a imagem não carregue em tempo razoável
      setTimeout(() => {
        if (!imagemImpressao.complete) {
          console.warn('Imagem não carregou, tentando impressão mesmo assim');
            
          // Remover a classe após imprimir
          setTimeout(() => {
            document.body.classList.remove('modo-impressao');
          }, 500);
        }
      }, 2000);
    }
  }, 500);
}

/**
 * Preenche o cabeçalho da página de impressão com as informações do projeto
 * @param {Object} config - Configuração atual do projeto
 */
function preencherCabecalhoImpressao(config) {
  // Construir uma descrição no formato "Cliente | Ambiente"
  let descricao = '';
  const clienteTexto = config.cliente || 'Cliente';
  const ambienteTexto = config.ambiente || 'Ambiente';
  descricao = `${clienteTexto} | ${ambienteTexto}`;
  
  // Determinar tipo de porta em português
  let tipoPorta = 'Não especificado';
  if (config.funcao) {
    if (config.funcao === 'deslizante') {
      tipoPorta = 'Deslizante';
    } else if (config.funcao.includes('superior')) {
      tipoPorta = config.funcao.includes('Direita') ? 'Abrir Superior Direita' : 'Abrir Superior Esquerda';
    } else if (config.funcao.includes('inferior')) {
      tipoPorta = config.funcao.includes('Direita') ? 'Abrir Inferior Direita' : 'Abrir Inferior Esquerda';
    }
  }
  
  // Informações do puxador
  let infoPuxador = 'Sem puxador';
  if (config.puxador) {
    infoPuxador = `Puxador ${config.puxador.modelo || 'CIELO'}`;
    if (config.puxador.medida) {
      if (config.puxador.medida === 'Tamanho da Porta') {
        infoPuxador += ' - Tamanho da Porta';
      } else {
        infoPuxador += ` - ${config.puxador.medida}mm`;
      }
    }
    if (config.puxador.posicao) {
      infoPuxador += ` (${config.puxador.posicao === 'vertical' ? 'Vertical' : 'Horizontal'})`;
    }
  }
  
  // Informações das dobradiças
  let infoDobradicas = 'Sem dobradiças';
  if (config.numDobradicas > 0) {
    infoDobradicas = `${config.numDobradicas} dobradiça${config.numDobradicas > 1 ? 's' : ''}`;
  }
  
  // Preencher dados do projeto
  const camposImpressao = {
    'impParceiro': config.parceiro || 'Cliente',
    'impDescricao': descricao,
    'impDimensoes': '', // Removido as dimensões da porta
    'impVidro': config.vidro || 'Incolor',
    'impPerfil': `${config.perfilModelo} - ${config.perfilCor}`,
    'impData': formatarData(new Date()),
    'impQtd': config.quantidade || 1,
    'impObservacao': config.observacao || '',
    'impFuncao': tipoPorta,
    'impPuxador': infoPuxador,
    'impDobradicas': infoDobradicas
  };
  
  // Aplicar valores aos elementos
  for (const [id, valor] of Object.entries(camposImpressao)) {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.textContent = valor;
    }
  }
}

/**
 * Captura a imagem do canvas para impressão
 * @param {string} elementId - ID do elemento contenedor
 * @param {string} [imagemData] - Dados da imagem em base64 (opcional)
 * @returns {boolean} - Se a captura foi bem-sucedida
 */
function capturarImagemParaImpressao(elementId = 'desenho', imagemData = null) {
  try {
    // Se a imagem já foi fornecida (para o caso do SVG)
    if (imagemData) {
      // Atualizar imagem para impressão (se existir)
      const imagemImpressao = document.getElementById('imagemImpressao');
      if (imagemImpressao) {
        imagemImpressao.src = imagemData;
      } else {
        console.warn('Elemento imagemImpressao não encontrado, mas continuando com métodos alternativos de impressão');
        // Como não temos o elemento, podemos armazenar apenas na sessão para uso posterior
      }
      
      // Também armazenar no localStorage para fácil recuperação
      try {
        sessionStorage.setItem('ultima_imagem_impressao', imagemData);
      } catch (e) {
        console.warn('Não foi possível salvar a imagem na sessão:', e);
      }
      
      return true;
    }
    
    // Caso não tenha recebido a imagem, verifica se o elemento é um canvas
    const elemento = document.getElementById(elementId);
    if (!elemento) {
      mostrarNotificacao('Elemento de desenho não encontrado', 'error');
      return false;
    }
    
    let dataUrl = null;
    
    // Verificar se é um canvas tradicional
    if (elemento.tagName === 'CANVAS') {
      dataUrl = elemento.toDataURL('image/png');
    } 
    // Se for um SVG
    else if (elemento.querySelector('svg')) {
      const svg = elemento.querySelector('svg');
      
      // Clonar o SVG para não afetar o original
      const svgClone = svg.cloneNode(true);
      
      // Adicionar o namespace XML para serialização correta
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      // Converter o SVG para string
      const svgData = new XMLSerializer().serializeToString(svgClone);
      
      // Codificar o SVG para base64
      dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } else {
      mostrarNotificacao('Tipo de elemento não suportado para captura', 'error');
      return false;
    }
    
    // Atualizar imagem para impressão
    const imagemImpressao = document.getElementById('imagemImpressao');
    if (imagemImpressao) {
      imagemImpressao.src = dataUrl;
    }
    
    // Também armazenar no localStorage para fácil recuperação
    try {
      sessionStorage.setItem('ultima_imagem_impressao', dataUrl);
    } catch (e) {
      console.warn('Não foi possível salvar a imagem na sessão:', e);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao capturar imagem para impressão:', error);
    mostrarNotificacao('Erro ao preparar imagem para impressão', 'error');
    return false;
  }
}

/**
 * Exporta o conteúdo do desenho como uma imagem PNG
 * @param {string} elementId - ID do elemento contenedor
 */
function exportarComoImagem(elementId = 'desenho') {
  try {
    // Obter o elemento de desenho
    const elemento = document.getElementById(elementId);
    if (!elemento) {
      mostrarNotificacao('Elemento de desenho não encontrado', 'error');
      return;
    }
    
    let dataUrl = null;
    
    // Verificar se é um canvas tradicional
    if (elemento.tagName === 'CANVAS') {
      dataUrl = elemento.toDataURL('image/png');
    } else if (elemento.querySelector('svg')) { // Se for um SVG
      const svg = elemento.querySelector('svg');
      
      // Clonar o SVG para não afetar o original
      const svgClone = svg.cloneNode(true);
      
      // Adicionar o namespace XML para serialização correta
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      // Converter o SVG para string
      const svgData = new XMLSerializer().serializeToString(svgClone);
      
      // Criar o Blob com o SVG
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      dataUrl = URL.createObjectURL(svgBlob);
    } else { // Se não for nenhum dos dois, usar o fallback
      mostrarNotificacao('Exportando como imagem usando fallback', 'info');
      return fallbackCapturaSVG();
    }
    
    // Garantir que temos uma URL
    if (!dataUrl) {
      mostrarNotificacao('Não foi possível gerar a imagem para exportação', 'error');
      return;
    }
    
    // Atualizar imagem para impressão (apenas como cache, não é usado para exportação)
    const imagemImpressao = document.getElementById('imagemImpressao');
    if (imagemImpressao) {
      imagemImpressao.src = dataUrl;
    }
    
    // Criar um link invisível para download
    const link = document.createElement('a');
    
    // Se for um objeto URL, usamos diretamente
    if (dataUrl.startsWith('blob:')) {
      link.href = dataUrl;
    } else { // Se for um Data URL, usamos como está
      link.href = dataUrl;
    }
    
    // Obter configuração para nome do arquivo
    const config = obterConfiguracaoAtual();
    const hoje = new Date();
    const dataFormatada = `${hoje.getFullYear()}${(hoje.getMonth()+1).toString().padStart(2, '0')}${hoje.getDate().toString().padStart(2, '0')}`;
    const nomeCliente = config.cliente ? config.cliente.replace(/[^\w]/g, '_') : 'porta';
    
    // Configurar o download
    link.download = `${nomeCliente}_${dataFormatada}.png`;
    document.body.appendChild(link);
    link.click();
    
    // Limpar o objeto URL para evitar vazamentos de memória
    if (dataUrl.startsWith('blob:')) {
      setTimeout(() => {
        URL.revokeObjectURL(dataUrl);
        document.body.removeChild(link);
      }, 100);
    } else {
      document.body.removeChild(link);
    }
    
    mostrarNotificacao('Imagem exportada com sucesso', 'success');
  } catch (error) {
    console.error('Erro ao exportar como imagem:', error);
    mostrarNotificacao('Erro ao exportar como imagem: ' + error.message, 'error');
  }
}

/**
 * Oculta elementos relacionados à impressão que não devem estar visíveis 
 * na visualização normal do site
 */
function ocultarElementosImpressao() {
  console.log("Ocultando elementos de impressão...");
  
  // Ocultar área de impressão do booklet
  const printBooklet = document.getElementById('print-booklet');
  if (printBooklet) {
    printBooklet.style.display = 'none';
    printBooklet.style.visibility = 'hidden';
    printBooklet.classList.remove('printing');
  }
  
  // Ocultar área de impressão padrão
  const printArea = document.getElementById('print-area');
  if (printArea) {
    printArea.style.display = 'none';
    printArea.style.visibility = 'hidden';
    printArea.classList.remove('printing');
  }
  
  // Restaurar a visibilidade dos elementos da página principal
  const pageElements = document.querySelectorAll('body > *:not(#print-booklet):not(#print-area)');
  pageElements.forEach(el => {
    if (el.dataset.originalVisibility) {
      el.style.visibility = el.dataset.originalVisibility;
      el.style.display = el.dataset.originalDisplay || 'block';
      delete el.dataset.originalVisibility;
      delete el.dataset.originalDisplay;
    }
  });
  
  // Remover classe de impressão do body
  document.body.classList.remove('modo-impressao', 'printing', 'printing-mode');
  
  console.log('Elementos de impressão ocultados');
}

/**
 * Restaura o estado da página após impressão ou exportação
 */
function restaurarEstadoAposImpressao() {
    console.log("Restaurando estado após impressão...");

    // Remover estilos de impressão
    removerEstilosImpressao();

    // Limpar áreas de impressão
    limparAreasDeImpressao();

    // Garantir que todos os elementos de impressão estejam ocultos
    ocultarElementosImpressao();

    // Assegurar que a porta seja redesenhada corretamente após a impressão
    setTimeout(() => {
        // NOVO: Adicionar verificação para evitar duplicações de SVG após impressão
        const portas = obterConfigPortas();
        if (portas && portas.length > 0) {
            console.log("Redesenhando porta após impressão...");
            
            // Se tivermos uma função garantirFundoSVG, usar ela para remover duplicações
            if (typeof garantirFundoSVG === 'function') {
                garantirFundoSVG();
            }
            
            // Verificar se há duplicações de SVG e remover
            const container = document.getElementById('desenho');
            if (container) {
                const svgs = container.querySelectorAll('svg');
                if (svgs.length > 1) {
                    console.warn(`Encontradas ${svgs.length} SVGs após impressão. Removendo duplicatas...`);
                    // Manter apenas a primeira SVG
                    for (let i = 1; i < svgs.length; i++) {
                        svgs[i].remove();
                    }
                }
            }
            
            // Redesenhar a porta ativa
            let configAtual = portas[indexPortaAtiva] || portas[0];
            
            // Verificar se a configuração tem dados aninhados
            if (configAtual.dados) {
                // Se os dados da porta estiverem aninhados em um objeto 'dados'
                if (configAtual.dados.largura && configAtual.dados.altura) {
                    configAtual = configAtual.dados;
                } else if (configAtual.dados.dados && configAtual.dados.dados.largura && configAtual.dados.dados.altura) {
                    configAtual = configAtual.dados.dados;
                }
            }
            
            // Validar e corrigir largura e altura
            if (!configAtual.largura || typeof configAtual.largura !== 'number' || isNaN(configAtual.largura)) {
                console.warn("Largura inválida na configuração, usando valor padrão 700mm");
                configAtual.largura = 700;
            }
            
            if (!configAtual.altura || typeof configAtual.altura !== 'number' || isNaN(configAtual.altura)) {
                console.warn("Altura inválida na configuração, usando valor padrão 2100mm");
                configAtual.altura = 2100;
            }
            
            console.log("Redesenhando porta com dimensões:", configAtual.largura, "x", configAtual.altura);
            
            // Tentar obter função desenharPorta
            let desenharPortaFunc = window.desenharPorta;
            if (!desenharPortaFunc && typeof atualizarDesenho === 'function') {
                console.log("Usando atualizarDesenho como fallback");
                desenharPortaFunc = atualizarDesenho;
            }
            
            if (typeof desenharPortaFunc === 'function') {
                desenharPortaFunc(configAtual);
            } else {
                console.error("Função desenharPorta não encontrada!");
            }
        }
    }, 500);
}

/**
 * Remove os estilos de impressão da página
 */
function removerEstilosImpressao() {
    // Remover classe de impressão do corpo
    document.body.classList.remove('modo-impressao', 'printing');
    
    // Remover estilos de impressão, se existirem
    const printStylesElement = document.getElementById('print-only-styles');
    if (printStylesElement && printStylesElement.parentNode) {
        printStylesElement.parentNode.removeChild(printStylesElement);
    }
    
    // Remover overlay de visualização se estiver presente
    const overlay = document.getElementById('print-preview-overlay');
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
    
    console.log('Estilos de impressão removidos');
}

/**
 * Limpa as áreas de impressão, removendo seu conteúdo
 */
function limparAreasDeImpressao() {
    // Ocultar e limpar área de impressão do booklet
    const printBooklet = document.getElementById('print-booklet');
    if (printBooklet) {
        printBooklet.innerHTML = '';
        printBooklet.className = 'print-container'; // Remover todas as classes
        printBooklet.removeAttribute('style'); // Remover estilos inline
        printBooklet.style.display = 'none';
        printBooklet.style.visibility = 'hidden';
    }
    
    // Ocultar e limpar área de impressão padrão
    const printArea = document.getElementById('print-area');
    if (printArea) {
        printArea.innerHTML = '';
        printArea.className = 'print-container'; // Remover todas as classes
        printArea.removeAttribute('style'); // Remover estilos inline
        printArea.style.display = 'none';
        printArea.style.visibility = 'hidden';
    }
    
    // Limpar outras áreas de impressão temporárias
    const tempPrintArea = document.getElementById('temp-print-area-v2');
    if (tempPrintArea) {
        tempPrintArea.innerHTML = '';
        tempPrintArea.style.display = 'none';
    }
    
    console.log('Áreas de impressão limpas');
}

/**
 * Ajusta escala do SVG para garantir que caiba em uma única folha A4
 * @param {SVGElement} svgClone - SVG a ser ajustado
 * @param {Object} config - Configuração da porta
 * @returns {SVGElement} - SVG com escala ajustada
 */
function ajustarEscalaParaA4(svgClone, config) {
  try {
    // Dimensões úteis de uma folha A4 em mm (margens extremamente reduzidas)
    const a4LarguraUtil = 202; // 210mm - 8mm de margens laterais (aumentado de 190mm)
    
    // Considerar espaço mínimo para cabeçalho e rodapé
    // Altura total A4: 297mm
    // Margens verticais (topo/base): 8mm (reduzido para 4mm x 2)
    // Espaço para cabeçalho: ~10mm (reduzido)
    // Espaço para rodapé: ~5mm (reduzido)
    const a4AlturaUtil = 270; // 297mm - 8mm margens - 10mm cabeçalho - 5mm rodapé (aumentado de 247mm)
    
    console.log(`Dimensões úteis A4 (otimizadas ao máximo): ${a4LarguraUtil}mm x ${a4AlturaUtil}mm`);
    
    // Obter dimensões atuais do SVG
    let svgLargura, svgAltura;
    
    // Tentar obter do viewBox primeiro
    const viewBox = svgClone.getAttribute('viewBox');
    if (viewBox) {
      const [, , width, height] = viewBox.split(' ').map(parseFloat);
      if (width && height) {
        svgLargura = width;
        svgAltura = height;
        console.log(`Dimensões do viewBox: ${svgLargura} x ${svgAltura}`);
      }
    }
    
    // Se não conseguiu obter do viewBox, tentar pegar da configuração
    if (!svgLargura || !svgAltura) {
      if (config && config.largura && config.altura) {
        // Converter mm para pixels usando escala aumentada
        const escala = 0.28; // Aumentado de 0.25 para dar mais detalhes
        svgLargura = config.largura * escala;
        svgAltura = config.altura * escala;
        console.log(`Dimensões calculadas da configuração (escala maximizada): ${svgLargura} x ${svgAltura}`);
      } else {
        // Fallback para dimensões fixas se tudo falhar
        svgLargura = 595;
        svgAltura = 842;
        console.log(`Usando dimensões padrão: ${svgLargura} x ${svgAltura}`);
      }
    }
    
    // Calcular proporção atual do SVG
    const proporcaoSVG = svgLargura / svgAltura;
    
    // Calcular proporção da área útil A4
    const proporcaoA4 = a4LarguraUtil / a4AlturaUtil;
    
    console.log(`Proporção SVG: ${proporcaoSVG.toFixed(3)}, Proporção A4: ${proporcaoA4.toFixed(3)}`);
    
    // Determinar qual dimensão limita o ajuste (largura ou altura)
    let novaLargura, novaAltura;
    
    if (proporcaoSVG > proporcaoA4) {
      // Mais largo que alto em relação ao A4 - limitar pela largura
      novaLargura = a4LarguraUtil;
      novaAltura = novaLargura / proporcaoSVG;
      console.log(`Ajustando pela largura: ${novaLargura}mm x ${novaAltura.toFixed(1)}mm`);
    } else {
      // Mais alto que largo em relação ao A4 - limitar pela altura
      novaAltura = a4AlturaUtil;
      novaLargura = novaAltura * proporcaoSVG;
      console.log(`Ajustando pela altura: ${novaLargura.toFixed(1)}mm x ${novaAltura}mm`);
    }
    
    // Usar fator de aumento para maximizar o espaço disponível
    const fatorOtimizacao = 0.99; // Usar 99% do espaço disponível (aumentado de 0.98)
    novaLargura *= fatorOtimizacao;
    novaAltura *= fatorOtimizacao;
    
    console.log(`Dimensões finais maximizadas (${fatorOtimizacao}): ${novaLargura.toFixed(1)}mm x ${novaAltura.toFixed(1)}mm`);
    
    // Definir as novas dimensões em mm
    svgClone.setAttribute('width', `${novaLargura}mm`);
    svgClone.setAttribute('height', `${novaAltura}mm`);
    svgClone.style.width = `${novaLargura}mm`;
    svgClone.style.height = `${novaAltura}mm`;
    
    // Informar no console o ajuste realizado
    console.log(`SVG ajustado para tamanho máximo em A4: ${novaLargura.toFixed(1)}mm x ${novaAltura.toFixed(1)}mm`);
    
    return svgClone;
  } catch (error) {
    console.error('Erro ao ajustar escala para A4:', error);
    return svgClone; // Retornar SVG original em caso de erro
  }
}

/**
 * Clona e ajusta o SVG original para impressão com método melhorado
 * @param {SVGElement} svgOriginal - SVG original a ser clonado
 * @param {Object} config - Configuração da porta
 * @returns {SVGElement} - SVG clonado e ajustado
 */
function clonarEAjustarSVG(svgOriginal, config) {
  try {
    console.log('Clonando SVG com método aprimorado para A4...');
    
    // Verificação de segurança para o SVG original
    if (!svgOriginal || svgOriginal.tagName !== 'svg') {
      console.error('SVG inválido fornecido para clonagem');
      throw new Error('SVG inválido fornecido para clonagem');
    }
    
    // Clonagem profunda do SVG
    const svgClone = svgOriginal.cloneNode(true);
    
    // Garantir que o namespace XML esteja presente para serialização correta
    svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    if (!svgClone.hasAttribute('xmlns:xlink')) {
      svgClone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    }
    
    // Garantir que todas as definições de gradientes estejam presentes
    // Primeiramente, verificar se o SVG original tem elementos defs
    const originalDefs = svgOriginal.querySelector('defs');
    const cloneDefs = svgClone.querySelector('defs');
    
    if (originalDefs && (!cloneDefs || cloneDefs.children.length === 0)) {
      console.log('Transferindo definições de gradientes para o SVG clonado...');
      // Se o SVG clonado não tem um elemento defs ou está vazio, adicionar um novo
      if (!cloneDefs) {
        const newDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        svgClone.insertBefore(newDefs, svgClone.firstChild);
      }
      
      // Clonar todos os gradientes do SVG original
      const originalGradients = originalDefs.querySelectorAll('linearGradient, radialGradient');
      originalGradients.forEach(gradient => {
        const gradientClone = gradient.cloneNode(true);
        // Não adicionar prefixo 'print_' aqui, faremos isso depois para todas as referências
        svgClone.querySelector('defs').appendChild(gradientClone);
      });
    }
    
    // Remover possíveis IDs duplicados que podem causar problemas
    const elementosComId = svgClone.querySelectorAll('[id]');
    elementosComId.forEach(el => {
      const idOriginal = el.getAttribute('id');
      el.setAttribute('id', `print_${idOriginal}`);
    });
    
    // Verificar e definir o viewBox se necessário
    if (!svgClone.hasAttribute('viewBox')) {
      console.log('SVG sem viewBox. Configurando com base nas dimensões...');

      // Tentativas de obter dimensões apropriadas para o viewBox
      let larguraViewBox, alturaViewBox;
      
      // 1. Tentar obter do BBox do original
      try {
        const bbox = svgOriginal.getBBox();
        if (bbox && bbox.width > 0 && bbox.height > 0) {
          larguraViewBox = bbox.width;
          alturaViewBox = bbox.height;
          console.log(`ViewBox definido pelo BBox: 0 0 ${larguraViewBox} ${alturaViewBox}`);
        } 
        // 2. Tentar obter da configuração
        else if (config && config.largura && config.altura) {
          // Usar CONFIG.escala para converter mm para pixels usados no SVG
          const escala = 0.15; // Valor padrão se não disponível
          larguraViewBox = config.largura * escala;
          alturaViewBox = config.altura * escala;
          console.log(`ViewBox definido pela configuração: 0 0 ${larguraViewBox} ${alturaViewBox}`);
        } 
        // 3. Último recurso: usar dimensões fixas do A4
        else {
          console.warn('Não foi possível determinar viewBox preciso, usando valores A4.');
          larguraViewBox = 595;
          alturaViewBox = 842;
        }
      } catch (e) {
        console.warn('Erro ao obter BBox, usando configuração ou padrão:', e);
        if (config && config.largura && config.altura) {
            const escala = 0.15;
            larguraViewBox = config.largura * escala;
            alturaViewBox = config.altura * escala;
        } else {
            larguraViewBox = 595;
            alturaViewBox = 842;
        }
      }

      // Definir o viewBox
      svgClone.setAttribute('viewBox', `0 0 ${larguraViewBox} ${alturaViewBox}`);
    }
    
    // Garantir que o aspect ratio seja preservado
    svgClone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    // Aplicar estilos inline para garantir centralização e visibilidade correta
    svgClone.style.display = 'block';
    svgClone.style.margin = '0 auto';
    svgClone.style.visibility = 'visible';
    svgClone.style.opacity = '1';
    svgClone.style.border = 'none';
    svgClone.style.boxShadow = 'none';
    
    // Ajustar escala para caber em uma única folha A4 usando nossa função
    const svgAjustado = ajustarEscalaParaA4(svgClone, config);
    
    /**
     * REMOÇÃO DE LINHAS HORIZONTAIS DO VIDRO PARA IMPRESSÃO
     * 
     * Este bloco identifica e remove os retângulos finos horizontais que são
     * utilizados para criar o efeito de textura/reflexo no vidro durante a
     * visualização normal. Na impressão, essas linhas podem ser confundidas
     * com riscos ou imperfeições, por isso são completamente removidas aqui.
     * 
     * As linhas são identificadas por várias características específicas:
     * - Altura muito pequena (≤ 0.75px)
     * - Preenchimento branco
     * - Opacidade baixa (< 0.3)
     * - Sem contorno (stroke)
     * 
     * Este tratamento diferenciado entre visualização e impressão permite
     * manter os efeitos visuais sofisticados na tela, enquanto garante
     * um resultado limpo e profissional na versão impressa.
     */
    // Encontrar todos os retângulos finos horizontais que são usados para criar o efeito de textura
    const todosRetangulos = svgAjustado.querySelectorAll('rect');
    todosRetangulos.forEach(rect => {
      // Identificar retângulos de textura do vidro pelas suas características
      const altura = rect.getAttribute('height');
      const fill = rect.getAttribute('fill');
      const opacity = rect.getAttribute('opacity');
      const stroke = rect.getAttribute('stroke');
      
      if (altura && parseFloat(altura) <= 0.75 && 
          fill === 'white' && 
          opacity && parseFloat(opacity) < 0.3 &&
          (!stroke || stroke === 'none')) {
        // Esse é um retângulo de textura - remover completamente para a impressão
        rect.remove();
      }
    });
    
    // Corrigir estilos de elementos filhos restantes
    const todosElementos = svgAjustado.querySelectorAll('*');
    todosElementos.forEach(el => {
      // Garantir visibilidade de todos os elementos
      el.style.visibility = 'visible';
      
      // Remover bordas e sombras que podem causar linhas na impressão
      el.style.border = 'none';
      el.style.boxShadow = 'none';
      
      // Preservar opacidades para gradientes
      const isGradient = el.tagName.toLowerCase().includes('gradient') || 
                          el.tagName.toLowerCase() === 'stop';
      
      // Detectar elementos com gradientes
      const hasGradientFill = el.hasAttribute('fill') && 
                             el.getAttribute('fill').includes('url(#');
      
      // Ajustar opacidade apenas para elementos que não sejam parte de gradientes
      if (!isGradient && !hasGradientFill) {
        if (el.hasAttribute('opacity') && parseFloat(el.getAttribute('opacity')) < 0.1) {
          el.setAttribute('opacity', '0.1'); // Usar valor mínimo de 0.1
        }
      }
      
      // Corrigir possíveis problemas com fill="none" que podem causar elementos invisíveis
      if (el.hasAttribute('fill') && el.getAttribute('fill') === 'none') {
        // Manter o fill="none" apenas para elementos de contorno
        if (!el.hasAttribute('stroke') || el.getAttribute('stroke') === 'none') {
          el.setAttribute('fill', 'transparent');
        }
      }
      
      // Garantir que elementos com stroke sejam visíveis
      if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
        const strokeWidth = el.getAttribute('stroke-width');
        if (!strokeWidth || parseFloat(strokeWidth) < 0.5) {
          el.setAttribute('stroke-width', '0.5');
        }
      }
    });
    
    // Corrigir referências de URL para gradientes
    // Primeiro mapeie os IDs originais para os novos IDs (com prefixo 'print_')
    const gradients = svgAjustado.querySelectorAll('linearGradient, radialGradient');
    const idMapping = {};
    
    gradients.forEach(gradient => {
      const id = gradient.getAttribute('id');
      if (id && id.startsWith('print_')) {
        const originalId = id.replace('print_', '');
        idMapping[originalId] = id;
      }
    });
    
    // Agora atualize todas as referências de URL
    const elementsWithFill = svgAjustado.querySelectorAll('[fill^="url(#"]');
    elementsWithFill.forEach(el => {
      const fillValue = el.getAttribute('fill');
      if (fillValue && fillValue.startsWith('url(#')) {
        // Extrair o ID da URL
        const matches = fillValue.match(/url\(#([^)]+)\)/);
        if (matches && matches[1]) {
          const originalId = matches[1];
          const newId = idMapping[originalId] || `print_${originalId}`;
          // Atualizar a referência URL
          el.setAttribute('fill', `url(#${newId})`);
        }
      }
    });
    
    // Remover possíveis scripts ou eventos que possam interferir na impressão
    const scripts = svgAjustado.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    console.log('SVG clonado e ajustado com sucesso para impressão A4:', {
      width: svgAjustado.getAttribute('width'),
      height: svgAjustado.getAttribute('height'),
      viewBox: svgAjustado.getAttribute('viewBox'),
      preserveAspectRatio: svgAjustado.getAttribute('preserveAspectRatio')
    });
    
    return svgAjustado;
  } catch (error) {
    console.error('Erro ao clonar e ajustar SVG:', error);
    // Em caso de erro, tentar retornar uma cópia simples
    try {
      // Último recurso: clonagem simples
      const svgSimples = svgOriginal.cloneNode(true);
      svgSimples.setAttribute('width', '180mm');
      svgSimples.setAttribute('height', 'auto');
      return svgSimples;
    } catch (fallbackError) {
      console.error('Falha total na clonagem de SVG:', fallbackError);
      mostrarNotificacao('Erro na preparação do desenho para impressão', 'error');
      throw new Error('Falha na preparação do SVG para impressão');
    }
  }
}

/**
 * Cria o cabeçalho para a página de impressão com estilo Bootstrap 5
 * @param {Object} config - Configuração atual da porta
 * @returns {HTMLElement} - Elemento de cabeçalho
 */
function criarCabecalhoImpressao(config) {
  const header = document.createElement('div');
  header.className = 'print-header';
  
  // Criar container para título com background cinza que se estende por toda a largura
  const titleContainer = document.createElement('div');
  titleContainer.className = 'print-header-bg';
  titleContainer.style.position = 'relative'; 
  titleContainer.style.display = 'flex';
  titleContainer.style.justifyContent = 'center'; // Centralizar horizontalmente
  titleContainer.style.alignItems = 'center'; 
  
  // Cliente | Ambiente no título
  const title = document.createElement('h2');
  title.className = 'fw-bold text-primary mb-0';
  
  // Cliente | Ambiente
  const clienteTexto = config.cliente || 'Cliente';
  const ambienteTexto = config.ambiente || 'Ambiente';
  title.textContent = `${clienteTexto} | ${ambienteTexto}`;
  
  // Adicionar título ao container
  titleContainer.appendChild(title);
  
  // Adicionar container ao cabeçalho
  header.appendChild(titleContainer);
  
  // Adicionar o logo - abordagem robusta
  try {
    // Obter o logo original do documento
    const logoOriginal = document.getElementById('logoImage');
    let logoSrc = '';
    
    if (logoOriginal && logoOriginal.src) {
      // Usar o src do logo existente
      logoSrc = logoOriginal.src;
      console.log('Usando src do logo original:', logoSrc);
    } else {
      // Fallback: usar caminho relativo para o logo
      logoSrc = 'LOGO 2.png';
      console.log('Usando caminho relativo para o logo:', logoSrc);
    }
    
    // Criar container para o logo
    const logoContainer = document.createElement('div');
    logoContainer.className = 'print-logo-container';
    logoContainer.style.position = 'absolute';
    logoContainer.style.top = '3mm';
    logoContainer.style.left = '0mm';
    logoContainer.style.zIndex = '100'; // Garantir que fique acima
    
    // Criar elemento de imagem para o logo
    const logoImg = document.createElement('img');
    logoImg.className = 'print-logo';
    logoImg.alt = 'Logo da empresa';
    logoImg.style.height = '16mm';
    logoImg.style.maxWidth = '35mm';
    logoImg.style.display = 'block';
    
    // Pré-carregar a imagem para garantir que apareça
    const imgLoader = new Image();
    imgLoader.onload = function() {
      console.log('Logo pré-carregado com sucesso');
      logoImg.src = logoSrc;
    };
    
    imgLoader.onerror = function() {
      console.error('Erro ao pré-carregar o logo:', logoSrc);
      // Tentar caminho alternativo
      const altSrc = 'LOGO 2.png';
      console.log('Tentando caminho alternativo:', altSrc);
      logoImg.src = altSrc;
    };
    
    // Iniciar o carregamento
    imgLoader.src = logoSrc;
    
    // Adicionar tratamento de erro para a imagem principal
    logoImg.onerror = function() {
      console.error('Erro ao carregar o logo:', logoImg.src);
      // Se falhar, tentar Base64 embutido
      const fallbackLogo = document.createElement('div');
      fallbackLogo.className = 'print-logo-text';
      fallbackLogo.textContent = 'LOGO';
      fallbackLogo.style.border = '1px solid #ccc';
      fallbackLogo.style.padding = '2mm 4mm';
      fallbackLogo.style.fontSize = '10mm';
      fallbackLogo.style.fontWeight = 'bold';
      logoContainer.innerHTML = '';
      logoContainer.appendChild(fallbackLogo);
    };
    
    // Adicionar a imagem ao container
    logoContainer.appendChild(logoImg);
    
    // Adicionar o container do logo ao cabeçalho
    header.appendChild(logoContainer);
    
  } catch (e) {
    console.error('Erro ao processar logo para impressão:', e);
  }
  
  return header;
}

/**
 * Cria o rodapé para a página de impressão com estilo Bootstrap 5
 * @returns {HTMLElement} - Elemento de rodapé
 */
function criarRodapeImpressao() {
  const footer = document.createElement('div');
  footer.className = 'print-footer d-flex justify-content-between align-items-center';
  
  // Disclaimer com design moderno
  const disclaimer = document.createElement('div');
  disclaimer.className = 'print-disclaimer text-muted small fst-italic';
  disclaimer.textContent = 'Este documento é uma especificação técnica. Todas as medidas devem ser confirmadas antes da fabricação.';
  
  // Container para o disclaimer e outros elementos
  const footerContent = document.createElement('div');
  footerContent.className = 'd-flex justify-content-between w-100 align-items-center';
  
  // Data atual em formato pequeno no lado direito
  const dataAtual = document.createElement('div');
  dataAtual.className = 'small text-end text-muted';
  dataAtual.style.paddingRight = '12mm'; // Adicionar padding à direita para deslocar mais para a esquerda
  const hoje = new Date();
  dataAtual.textContent = hoje.toLocaleDateString('pt-BR');
  
  // Adicionar elementos ao footer
  footerContent.appendChild(disclaimer);
  footerContent.appendChild(dataAtual);
  footer.appendChild(footerContent);
  
  return footer;
}

/**
 * Função desativada - Mantida apenas para compatibilidade
 * A exibição de data no rodapé foi removida para evitar problemas de duplicação
 * @param {boolean} incluirHora - Parâmetro ignorado
 */
function preencherDataImpressao(incluirHora = true) {
  // Função desativada - não faz mais nada
  console.log('preencherDataImpressao: Esta função foi desativada. A data não é mais exibida no rodapé.');
}

/**
 * Permite visualizar a área de impressão antes de imprimir (para depuração)
 * Esta função pode ser chamada do console para testes
 */
function visualizarAreaImpressao() {
  try {
    // Preparar a área de impressão usando a função comum
    if (!prepararAreasImpressao([obterConfiguracaoAtual()])) {
      return false;
    }
    
    // Mostrar área de impressão
    const printArea = document.getElementById('print-booklet');
    if (!printArea) {
      console.error('Área de impressão não encontrada');
      return false;
    }
    
    // Criar uma sobreposição para visualização
    const overlay = document.createElement('div');
    overlay.id = 'print-preview-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.padding = '20px';
    overlay.style.overflow = 'auto';
    
    // Clonar a área de impressão
    const previewContent = printArea.cloneNode(true);
    previewContent.style.display = 'block';
    previewContent.style.backgroundColor = 'white';
    previewContent.style.width = '210mm';
    previewContent.style.position = 'relative';
    previewContent.style.margin = 'auto';
    previewContent.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
    previewContent.style.overflowY = 'auto';
    previewContent.style.maxHeight = '90vh';
    
    // Adicionar botão para fechar
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Fechar Visualização';
    closeButton.style.position = 'fixed';
    closeButton.style.top = '20px';
    closeButton.style.right = '20px';
    closeButton.style.padding = '10px';
    closeButton.style.backgroundColor = '#c00';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.zIndex = '10000';
    
    closeButton.onclick = function () {
      document.body.removeChild(overlay);
    };
    
    overlay.appendChild(previewContent);
    overlay.appendChild(closeButton);
    document.body.appendChild(overlay);
    
    console.log('Visualização da área de impressão ativada');
    return true;
  } catch (error) {
    console.error('Erro ao visualizar área de impressão:', error);
    return false;
  }
}

/**
 * Método para imprimir múltiplas portas
 * @param {Array} configLista - Lista de configurações de portas
 */
function imprimirMultiplasPaginas(configLista) {
  try {
    console.log('Iniciando impressão de múltiplas páginas...');
    
    if (!configLista || !Array.isArray(configLista) || configLista.length === 0) {
      mostrarNotificacao('Nenhuma configuração fornecida para impressão', 'warning');
      return false;
    }
    
    if (!prepararAreasImpressao(configLista)) {
      return false;
    }
    
    // Iniciar a impressão
    setTimeout(() => {
      window.print();
    }, 300);
    
    console.log('Impressão de múltiplas páginas iniciada');
    return true;
  } catch (error) {
    console.error('Erro ao imprimir múltiplas páginas:', error);
    mostrarNotificacao('Erro ao imprimir: ' + error.message, 'error');
    return false;
  }
}

/**
 * Função auxiliar para inspecionar as dimensões e configurações do SVG atual
 * Pode ser chamada no console ou como função de diagnóstico
 * @param {boolean} [ajustar=false] Se true, ajusta o SVG para uma escala 1:1
 * @returns {Object} Objeto com as informações do SVG
 */
function inspecionarSVG(ajustar = false) {
  try {
    const svg = document.querySelector('#desenho svg');
    
    if (!svg) {
      console.warn('SVG não encontrado no elemento #desenho');
      return null;
    }
    
    // Coletar informações básicas
    const info = {
      width: svg.getAttribute('width'),
      height: svg.getAttribute('height'),
      viewBox: svg.getAttribute('viewBox'),
      boundingBox: svg.getBBox(),
      // Informações adicionais úteis
      style: {
        display: window.getComputedStyle(svg).display,
        width: window.getComputedStyle(svg).width,
        height: window.getComputedStyle(svg).height
      },
      preserveAspectRatio: svg.getAttribute('preserveAspectRatio')
    };
    
    // Se solicitado, ajustar as dimensões para escala 1:1
    if (ajustar) {
      // Obter viewBox atual
      const viewBox = svg.getAttribute('viewBox');
      let vbValues = [0, 0, 180, 260]; // valores padrão
      
      // Se viewBox existir, parse dos valores
      if (viewBox) {
        const values = viewBox.split(' ').map(v => parseFloat(v));
        if (values.length === 4) {
          vbValues = values;
        }
      }
      
      // Calcular proporção para manter aspect ratio correto
      const aspectRatio = vbValues[2] / vbValues[3]; // largura / altura
      const alturaCorrigida = 180 / aspectRatio;
      
      // Aplicar os atributos para forçar escala 1:1
      svg.setAttribute('width', '180mm');
      svg.style.width = '180mm'; // Definir estilo inline também
      svg.setAttribute('height', 'auto');
      svg.style.height = 'auto'; // Definir estilo inline também
      svg.setAttribute('viewBox', `${vbValues[0]} ${vbValues[1]} ${vbValues[2]} ${vbValues[3]}`);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      
      // Aplicar estilos inline para garantir centralização
      svg.style.display = 'block';
      svg.style.margin = '0 auto';
      svg.style.maxWidth = '180mm';
      
      // Atualizar informações após o ajuste
      info.ajustado = {
        width: svg.getAttribute('width'),
        height: svg.getAttribute('height'),
        viewBox: svg.getAttribute('viewBox'),
        preserveAspectRatio: svg.getAttribute('preserveAspectRatio'),
        aspectRatio: aspectRatio,
        alturaCalculada: `${alturaCorrigida}mm`
      };
      
      console.log('SVG ajustado para escala 1:1 (180mm de largura)');
    }
    
    // Exibir no console
    console.log('Inspeção do SVG:', info);
    
    return info;
  } catch (error) {
    console.error('Erro ao inspecionar SVG:', error);
    return null;
  }
}

/**
 * Ajusta o SVG para uma escala 1:1 com largura de 180mm
 * @param {Array<number>} [customViewBox] - Valores personalizados para o viewBox [x, y, width, height]
 * @returns {Object} Objeto com as informações do SVG ajustado
 */
function ajustarSVGEscala(customViewBox = null) {
  try {
    const svg = document.querySelector('#desenho svg');
    
    if (!svg) {
      console.warn('SVG não encontrado no elemento #desenho');
      return null;
    }
    
    // Obter viewBox atual ou usar o personalizado fornecido
    let vbValues = customViewBox || [0, 0, 180, 260]; // valores padrão se nada for fornecido
    
    if (!customViewBox) {
      const viewBox = svg.getAttribute('viewBox');
      // Se viewBox existir, parse dos valores
      if (viewBox) {
        const values = viewBox.split(' ').map(v => parseFloat(v));
        if (values.length === 4) {
          vbValues = values;
        }
      }
    }
    
    // Calcular proporção para manter aspect ratio correto
    const aspectRatio = vbValues[2] / vbValues[3]; // largura / altura
    const alturaCorrigida = 180 / aspectRatio;
    
    // Aplicar os atributos para forçar escala 1:1
    svg.setAttribute('width', '180mm');
    svg.style.width = '180mm'; // Definir estilo inline também
    svg.setAttribute('height', 'auto');
    svg.style.height = 'auto'; // Definir estilo inline também
    svg.setAttribute('viewBox', `${vbValues[0]} ${vbValues[1]} ${vbValues[2]} ${vbValues[3]}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    // Aplicar estilos inline para garantir centralização
    svg.style.display = 'block';
    svg.style.margin = '0 auto';
    svg.style.maxWidth = '180mm';
    
    // Informações do SVG após o ajuste
    const info = {
      width: svg.getAttribute('width'),
      height: svg.getAttribute('height'),
      viewBox: svg.getAttribute('viewBox'),
      preserveAspectRatio: svg.getAttribute('preserveAspectRatio'),
      aspectRatio: aspectRatio,
      alturaCalculada: `${alturaCorrigida}mm`,
      boundingBox: svg.getBBox()
    };
    
    console.log('SVG ajustado para escala 1:1 (180mm de largura):', info);
    return info;
  } catch (error) {
    console.error('Erro ao ajustar escala do SVG:', error);
    return null;
  }
}

// Função de diagnóstico para depuração de problemas de impressão
window.diagnosticarImpressao = function () {
  console.group('Diagnóstico de Impressão');
  
  // Verificar SVG
  const svgElement = document.querySelector('#desenho svg');
  console.log('SVG encontrado:', !!svgElement);
  if (svgElement) {
    console.log('Dimensões do SVG:', {
      width: svgElement.getAttribute('width'),
      height: svgElement.getAttribute('height'),
      viewBox: svgElement.getAttribute('viewBox')
    });
  } else {
    console.error('PROBLEMA: SVG não encontrado! Verifique se o desenho foi gerado corretamente.');
  }
  
  // Verificar elemento de imagem de impressão
  console.group('Elementos de imagem para impressão');
  const imagemImpressao = document.getElementById('imagemImpressao');
  console.log('Elemento imagemImpressao encontrado:', !!imagemImpressao);
  if (imagemImpressao) {
    console.log('Estado da imagem:', {
      src: imagemImpressao.src ? 'Definido' : 'Não definido',
      complete: imagemImpressao.complete,
      naturalWidth: imagemImpressao.naturalWidth,
      naturalHeight: imagemImpressao.naturalHeight
    });
    
    if (!imagemImpressao.src || imagemImpressao.src === 'about:blank') {
      console.warn('PROBLEMA: A imagem não tem uma fonte definida.');
    }
    
    if (imagemImpressao.naturalWidth === 0 || imagemImpressao.naturalHeight === 0) {
      console.warn('PROBLEMA: A imagem tem dimensões inválidas.');
    }
  } else {
    console.warn('Elemento imagemImpressao não encontrado, verificando alternativas...');
  }
  console.groupEnd();
  
  // Verificar áreas de impressão
  console.group('Áreas de impressão');
  const areaPrintable = document.getElementById('areaPrintable');
  const printArea = document.getElementById('print-area');
  const printBooklet = document.getElementById('print-booklet');
  
  console.log('Área #areaPrintable encontrada:', !!areaPrintable);
  console.log('Área #print-area encontrada:', !!printArea);
  console.log('Área #print-booklet encontrada:', !!printBooklet);
  
  if (!areaPrintable && !printArea && !printBooklet) {
    console.error('PROBLEMA CRÍTICO: Nenhuma área de impressão encontrada!');
    // Tentar criar área de impressão como último recurso
    const newPrintArea = document.createElement('div');
    newPrintArea.id = 'print-area';
    newPrintArea.style.display = 'none';
    document.body.appendChild(newPrintArea);
    console.log('Área de impressão criada dinamicamente como último recurso');
  }
  
  // Verificar estilos
  if (printArea) {
    console.log('Estilo de #print-area:', {
      display: window.getComputedStyle(printArea).display,
      visibility: window.getComputedStyle(printArea).visibility
    });
    
    if (window.getComputedStyle(printArea).display === 'none' && 
        !document.body.classList.contains('modo-impressao')) {
      console.log('Normal: área de impressão está oculta quando não está no modo de impressão');
    }
  }
  
  if (areaPrintable) {
    console.log('Estilo de #areaPrintable:', {
      display: window.getComputedStyle(areaPrintable).display,
      visibility: window.getComputedStyle(areaPrintable).visibility
    });
  }
  console.groupEnd();
  
  // Tentar verificar se o navegador está em modo de impressão
  console.group('Estado de impressão');
  const isInPrintMode = window.matchMedia('print').matches;
  console.log('Navegador em modo de impressão:', isInPrintMode);
  
  // Verificar classe modo-impressao no body
  const bodyHasPrintClass = document.body.classList.contains('modo-impressao');
  console.log('Body tem classe modo-impressao:', bodyHasPrintClass);
  
  if (!bodyHasPrintClass && !isInPrintMode) {
    console.log('Normal: não está em modo de impressão');
  }
  console.groupEnd();
  
  console.groupEnd();
  
  // Retornar objeto com diagnóstico
  return {
    svgOk: !!svgElement,
    imagemOk: !!imagemImpressao && imagemImpressao.complete && imagemImpressao.naturalWidth > 0,
    areaOk: !!areaPrintable || !!printArea || !!printBooklet,
    printMode: isInPrintMode || bodyHasPrintClass
  };
};

// --- INÍCIO DA REATORAÇÃO V2 --- 

/**
 * [V2] Prepara um clone do SVG principal para impressão ou exportação.
 * Garante dimensões físicas (180mm), viewBox correto e estilos essenciais.
 * @param {SVGElement} svgOriginal - O elemento SVG original do desenho.
 * @returns {SVGElement|null} - O elemento SVG clonado e ajustado, ou null em caso de erro.
 */
function v2_prepararSVG(svgOriginal) {
  console.log('[V2] Iniciando preparação do SVG...');
  if (!svgOriginal || !(svgOriginal instanceof SVGElement)) {
    console.error('[V2] SVG Original inválido ou não fornecido para preparar.');
    mostrarNotificacao('Erro interno: SVG original inválido.', 'error');
    return null;
  }

  try {
    // 1. Clonar o SVG original
    const svgClone = svgOriginal.cloneNode(true);
    console.log('[V2] SVG clonado com sucesso.');

    // 2. Adicionar namespace XML (essencial para serialização/html2pdf)
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // 3. Definir dimensões físicas (largura fixa, altura automática)
    svgClone.setAttribute('width', '180mm');
    svgClone.setAttribute('height', 'auto');
    console.log('[V2] Atributos width/height definidos: 180mm / auto');

    // 4. Garantir preservação da proporção
    svgClone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    console.log('[V2] preserveAspectRatio definido: xMidYMid meet');

    // 5. Determinar e definir o viewBox
    if (!svgClone.hasAttribute('viewBox') || svgClone.getAttribute('viewBox').trim() === '') {
      console.warn('[V2] SVG original sem viewBox. Tentando determinar...');
      let vbWidth = 700;  // Default
      let vbHeight = 2100; // Default
      let viewBoxDefinido = false;

      // Tentativa 1: BBox do original
      try {
        const bbox = svgOriginal.getBBox();
        if (bbox && bbox.width > 0 && bbox.height > 0) {
          vbWidth = bbox.width;
          vbHeight = bbox.height;
          console.log(`[V2] ViewBox determinado pelo BBox: 0 0 ${vbWidth} ${vbHeight}`);
          viewBoxDefinido = true;
        }
      } catch (e) {
        console.warn('[V2] Erro ao obter BBox do SVG original:', e);
      }

      // Tentativa 2: Configuração atual (se BBox falhou)
      if (!viewBoxDefinido) {
        try {
          // Precisamos importar ou acessar a função que obtém a config
          // Supondo que `obterConfiguracaoAtual` esteja acessível globalmente ou importada
          // Se não estiver, precisaremos ajustar isso.
          if (typeof obterConfiguracaoAtual === 'function') {
            const config = obterConfiguracaoAtual();
            if (config && config.largura && config.altura) {
              vbWidth = config.largura;
              vbHeight = config.altura;
              console.log(`[V2] ViewBox determinado pela configuração: 0 0 ${vbWidth} ${vbHeight}`);
              viewBoxDefinido = true;
            } else {
              console.warn('[V2] Configuração atual não encontrada ou inválida.');
            }
          } else {
            console.warn('[V2] Função obterConfiguracaoAtual não acessível para definir viewBox.');
          }
        } catch (e) {
          console.warn('[V2] Erro ao obter configuração para viewBox:', e);
        }
      }

      // Tentativa 3: Usar um padrão como último recurso
      if (!viewBoxDefinido) {
        console.error('[V2] Não foi possível determinar viewBox. Usando padrão 0 0 700 2100.');
        // Mantém os defaults vbWidth = 700, vbHeight = 2100;
      }

      svgClone.setAttribute('viewBox', `0 0 ${vbWidth} ${vbHeight}`);
      console.log(`[V2] ViewBox final definido: ${svgClone.getAttribute('viewBox')}`);
    } else {
      console.log(`[V2] SVG já possuía viewBox: ${svgClone.getAttribute('viewBox')}`);
    }

    // 6. Aplicar estilos essenciais para dimensionamento e centralização
    svgClone.style.display = 'block';
    svgClone.style.width = '180mm';
    svgClone.style.height = 'auto';
    svgClone.style.maxWidth = '180mm';
    svgClone.style.margin = '0 auto'; // Centraliza horizontalmente
    svgClone.style.visibility = 'visible'; // Garantir visibilidade
    svgClone.style.opacity = '1';
    console.log('[V2] Estilos inline aplicados (display, width, height, margin, etc).');

    // 7. Limpeza de atributos potencialmente problemáticos (opcional, mas pode ajudar)
    // svgClone.removeAttribute('id'); // Remover ID para evitar duplicatas

    console.log('[V2] Preparação do SVG concluída com sucesso.');
    return svgClone;

  } catch (error) {
    console.error('[V2] Erro durante a preparação do SVG:', error);
    mostrarNotificacao('Erro ao preparar o desenho para saída.', 'error');
    return null;
  }
}

/**
 * [V2] Imprime o desenho atual usando a janela de impressão do navegador.
 */
function v2_imprimirDesenho() {
  console.log('[V2] Iniciando processo de impressão...');
  const svgOriginal = document.querySelector('#desenho svg');
  if (!svgOriginal) {
    mostrarNotificacao('Nenhum desenho para imprimir. Gere um desenho primeiro.', 'warning');
    return;
  }

  // 1. Preparar o SVG
  const svgClone = v2_prepararSVG(svgOriginal);
  if (!svgClone) {
    mostrarNotificacao('Falha ao preparar o desenho para impressão.', 'error');
    return;
  }

  // 2. Criar container de impressão temporário
  const tempPrintContainerId = 'temp-print-area-v2';
  let tempPrintContainer = document.getElementById(tempPrintContainerId);
  if (tempPrintContainer) {
    // Remover container antigo se existir (pouco provável, mas seguro)
    tempPrintContainer.remove();
  }
  tempPrintContainer = document.createElement('div');
  tempPrintContainer.id = tempPrintContainerId;
  
  // 3. Estilizar o container para impressão
  //    Será oculto na tela normal, visível apenas na impressão via CSS
  tempPrintContainer.style.position = 'absolute';
  tempPrintContainer.style.left = '-9999px'; // Fora da tela
  tempPrintContainer.style.top = '-9999px';
  tempPrintContainer.style.width = '210mm'; // Tamanho A4
  tempPrintContainer.style.height = '297mm';
  tempPrintContainer.style.overflow = 'hidden'; // Evitar que afete layout
  tempPrintContainer.style.backgroundColor = 'white';
  tempPrintContainer.style.display = 'flex'; // Usar flexbox para centralizar
  tempPrintContainer.style.justifyContent = 'center';
  tempPrintContainer.style.alignItems = 'center';
  tempPrintContainer.style.padding = '15mm'; // Margens internas
  tempPrintContainer.style.boxSizing = 'border-box';

  // 3.5 Adicionar o logo sem deslocar o conteúdo (novo)
  const logoContainer = document.createElement('div');
  logoContainer.style.position = 'absolute';
  logoContainer.style.top = '15mm'; // Mesmo que o padding do container
  logoContainer.style.left = '15mm'; // Mesmo que o padding do container
  logoContainer.style.zIndex = '10';
  
  const logo = document.createElement('img');
  logo.src = 'LOGO 2.png'; // Caminho para o arquivo de logo na raiz
  logo.alt = 'Logo da empresa';
  logo.style.height = '16mm';
  logo.style.maxWidth = '35mm';
  logo.style.objectFit = 'contain';
  
  logoContainer.appendChild(logo);
  tempPrintContainer.appendChild(logoContainer);

  // 4. Adicionar o SVG clonado ao container
  // O v2_prepararSVG já aplica estilos de centralização e tamanho (180mm)
  tempPrintContainer.appendChild(svgClone);

  // 5. Adicionar o container ao body
  document.body.appendChild(tempPrintContainer);
  console.log('[V2] Container de impressão temporário criado e adicionado ao DOM.');

  // 6. Adicionar/atualizar regras de CSS para impressão
  const printStyleId = 'print-style-v2';
  let printStyle = document.getElementById(printStyleId);
  if (!printStyle) {
    printStyle = document.createElement('style');
    printStyle.id = printStyleId;
    document.head.appendChild(printStyle);
  }
  printStyle.textContent = `
    @media print {
      body > *:not(#${tempPrintContainerId}) {
        display: none !important; /* Esconder tudo exceto nosso container */
        visibility: hidden !important;
      }
      #${tempPrintContainerId} {
        display: flex !important; /* Garantir que o container seja visível */
        visibility: visible !important;
        position: static !important; /* Resetar posição para fluxo normal */
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 15mm !important; /* Aplicar margens novamente */
        box-sizing: border-box !important;
        left: auto !important;
        top: auto !important;
        background-color: white !important;
      }
      /* Garantir que o SVG ocupe o espaço e centralize */
      #${tempPrintContainerId} svg {
         max-width: 100%;
         max-height: calc(100% - 30mm); /* Ajustar altura máxima considerando padding */
         width: auto;
         height: auto;
         margin: auto; /* Centraliza */
      }
      @page {
          size: A4 portrait;
          margin: 0; /* Remover margens padrão do navegador */
      }
    }
  `;
  console.log('[V2] Estilos de impressão aplicados/atualizados.');

  // 7. Aguardar renderização e chamar impressão
  mostrarNotificacao('Preparando para imprimir...', 'info');
  console.log('[V2] Aguardando renderização antes de chamar window.print() (800ms)...');
  
  setTimeout(() => {
    try {
      console.log('[V2] Chamando window.print()...');
      window.print();
      console.log('[V2] Diálogo de impressão chamado.');
      mostrarNotificacao('Verifique o diálogo de impressão.', 'success');
    } catch (printError) {
      console.error('[V2] Erro ao chamar window.print():', printError);
      mostrarNotificacao('Erro ao abrir o diálogo de impressão.', 'error');
    } finally {
      // 8. Limpeza: Remover container e estilos após um tempo
      // Usar outro timeout para garantir que a limpeza ocorra após a interação do usuário
      setTimeout(() => {
        if (tempPrintContainer && tempPrintContainer.parentNode) {
          tempPrintContainer.remove();
          console.log('[V2] Container de impressão temporário removido.');
        }
        // Opcional: remover os estilos de impressão se não forem mais necessários
        // if (printStyle && printStyle.parentNode) {
        //   printStyle.remove();
        //   console.log('[V2] Estilos de impressão removidos.');
        // }
      }, 1500); // Atraso maior para limpeza
    }
  }, 800); // Atraso para renderização antes de imprimir
}

/**
 * [V2] Mostra uma pré-visualização do desenho como ele apareceria na impressão/PDF.
 */
function v2_visualizarDesenho() {
  console.log('[V2] Iniciando processo de visualização...');
  const svgOriginal = document.querySelector('#desenho svg');
  if (!svgOriginal) {
    mostrarNotificacao('Nenhum desenho para visualizar. Gere um desenho primeiro.', 'warning');
    return;
  }
  // TODO: Chamar v2_prepararSVG, criar overlay, adicionar SVG clonado, botão de fechar.
  mostrarNotificacao('Funcionalidade de visualização V2 ainda não implementada.', 'info');
}

// --- FIM DA REATORAÇÃO V2 --- 

/**
 * Prepara e exibe a área de impressão dedicada com o desenho SVG clonado
 * Versão aprimorada para garantir que tudo caiba em uma única página A4
 */
function imprimirComAreaDedicada() {
  try {
    console.log('Iniciando impressão...');
    
    // Salvar projeto automaticamente antes de imprimir
    try {
      // Importação dinâmica da função salvarConfiguracaoRapida
      const { salvarConfiguracaoRapida } = window.storageModule || {};
      
      // Verificar se a função está disponível e chamá-la
      if (typeof salvarConfiguracaoRapida === 'function') {
        console.log('Salvando projeto automaticamente antes de imprimir...');
        salvarConfiguracaoRapida();
      } else {
        console.log('Função salvarConfiguracaoRapida não disponível, continuando sem salvar');
      }
    } catch (saveError) {
      console.warn('Não foi possível salvar o projeto automaticamente:', saveError);
      // Continuar com a impressão mesmo que o salvamento falhe
    }
    
    // Verificar se o desenho SVG existe
    const svgOriginal = document.querySelector('#desenho svg');
    if (!svgOriginal) {
      mostrarNotificacao('Nenhum desenho SVG encontrado. Gere um desenho primeiro.', 'warning');
      return false;
    }
    
    // Obter a configuração atual
    const configAtual = obterConfiguracaoAtual();
    if (!configAtual) {
      mostrarNotificacao('Erro ao obter configuração atual.', 'error');
      return false;
    }
    
    // Preferir usar o booklet para garantir layout consistente
    let printArea = document.getElementById('print-booklet');
    
    // Se não existir, tenta usar a área padrão
    if (!printArea) {
      printArea = document.getElementById('print-area');
      if (!printArea) {
        console.error('Nenhuma área de impressão encontrada no DOM');
        mostrarNotificacao('Erro: Área de impressão não encontrada', 'error');
        return false;
      }
    }
    
    // Limpar o conteúdo atual
    printArea.innerHTML = '';
    
    // Remover todas as classes que afetam a visibilidade
    printArea.className = 'print-container';
    
    // Aplicar estilo inline para garantir que fique oculto
    printArea.style.display = 'none';
    printArea.style.visibility = 'hidden';
    printArea.style.position = 'absolute';
    printArea.style.left = '-9999px';
    printArea.style.top = '-9999px';
    printArea.style.width = '0';
    printArea.style.height = '0';
    printArea.style.overflow = 'hidden';
    printArea.style.opacity = '0';
    
    // Adicionar classe printing apenas para mídia de impressão
    printArea.classList.add('printing');
    
    // Criar uma página para a impressão atual
    const printPage = document.createElement('div');
    printPage.className = 'print-page single-page';
    
    // Adicionar cabeçalho
    const header = criarCabecalhoImpressao(configAtual);
    printPage.appendChild(header);
    
    // Criar container para o SVG
    const svgContainer = document.createElement('div');
    svgContainer.className = 'svg-container-clone one-page';
    
    try {
      // Clonar e ajustar o SVG
      const svgClone = clonarEAjustarSVG(svgOriginal, configAtual);
      if (svgClone) {
        svgContainer.appendChild(svgClone);
      } else {
        throw new Error('Falha ao clonar SVG');
      }
    } catch (svgError) {
      console.error('Erro ao clonar SVG para impressão:', svgError);
      
      // Tentar método alternativo: capturar SVG como imagem
      try {
        console.log('Tentando método alternativo: captura como imagem');
        const svgData = new XMLSerializer().serializeToString(svgOriginal);
        const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(svgBlob);
        
        const img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = '180mm';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.margin = '0 auto';
        
        svgContainer.appendChild(img);
        
        // Limpar URL após impressão
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } catch (imgError) {
        console.error('Falha também no método alternativo:', imgError);
        mostrarNotificacao('Erro crítico ao preparar desenho para impressão', 'error');
        return false;
      }
    }
    
    // Adicionar container do SVG à página
    printPage.appendChild(svgContainer);
    
    // Adicionar rodapé
    const footer = criarRodapeImpressao();
    printPage.appendChild(footer);
    
    // Adicionar página à área de impressão
    printArea.appendChild(printPage);
    
    // Atualizar data no rodapé da impressão
    preencherDataImpressao(true);
    
    // Adicionando estilos específicos para controlar a exibição durante a impressão
    const printStyles = document.createElement('style');
    printStyles.id = 'print-only-styles';
    printStyles.textContent = `
      @media print {
        body, html {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background-color: white !important;
        }
        
        body * {
          visibility: hidden !important;
          display: none !important;
        }
        
        #print-area.printing, #print-booklet.printing {
          display: block !important;
          visibility: visible !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          height: 100% !important;
          z-index: 9999 !important;
          background-color: white !important;
          opacity: 1 !important;
          overflow: visible !important;
        }
        
        #print-area.printing *, #print-booklet.printing * {
          visibility: visible !important;
          display: block !important;
          opacity: 1 !important;
        }
        
        /* Forçar que tudo caiba em uma página */
        .print-page {
          page-break-after: auto !important;
          break-after: auto !important;
          max-height: 297mm !important;
          overflow: hidden !important;
        }
        
        /* Ajustar altura do SVG para caber em uma página */
        .svg-container-clone {
          min-height: auto !important;
          max-height: 210mm !important;
          height: auto !important;
          overflow: hidden !important;
        }
        
        /* Garantir que não existe quebra de página */
        * {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Remover cabeçalhos e rodapés do navegador */
        @page {
          size: A4;
          margin: 0;
          margin-top: 0 !important;
          margin-bottom: 0 !important;
        }
        
        /* Esconder completamente a segunda página */
        .print-page ~ .print-page,
        .print-page + .print-page {
          display: none !important;
        }
        
        /* Assegurar visibilidade do logo de impressão */
        .print-header-logo, #print-logo, .print-logo {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          max-width: 200px !important;
          width: auto !important;
          height: auto !important;
        }
      }
    `;
    
    // Adicionar os estilos ao head do documento
    document.head.appendChild(printStyles);
    
    // PONTO CRÍTICO: Garantir o logo antes de imprimir
    // Primeiro verificamos se a função garantirLogoVisivel está disponível
    if (typeof window.garantirLogoVisivel === 'function') {
      console.log('Garantindo visibilidade do logo antes da impressão...');
      
      // Executamos uma vez imediatamente
      window.garantirLogoVisivel();
      
      // E agendamos mais duas chamadas com pequenos intervalos
      // para garantir que o logo esteja pronto durante a impressão
      setTimeout(() => {
        window.garantirLogoVisivel();
        console.log('Verificação adicional do logo antes de imprimir');
      }, 150);
    } else {
      console.warn('Função garantirLogoVisivel não encontrada. Continuando sem garantia de logo.');
    }
    
    const beforePrintHandler = () => {
      console.log('Iniciando impressão real (evento beforeprint)');
      
      // Garantir logo mais uma vez, no momento exato antes da impressão
      if (typeof window.garantirLogoVisivel === 'function') {
        window.garantirLogoVisivel(0, 1); // Forçar uma verificação rápida com apenas 1 tentativa
      }
    };
    
    const afterPrintHandler = () => {
      console.log('Impressão concluída (evento afterprint), restaurando estado...');
      
      // Remover estilos específicos de impressão
      const styles = document.getElementById('print-only-styles');
      if (styles && styles.parentNode) {
        styles.parentNode.removeChild(styles);
      }
      
      // Restaurar estado original
      restaurarEstadoAposImpressao();
      
      // Remover os próprios event listeners
      window.removeEventListener('beforeprint', beforePrintHandler);
      window.removeEventListener('afterprint', afterPrintHandler);
    };
    
    // Adicionar event listeners para os eventos de impressão
    window.addEventListener('beforeprint', beforePrintHandler);
    window.addEventListener('afterprint', afterPrintHandler);
    
    // Mostrar notificação discreta
    mostrarNotificacao('Abrindo diálogo de impressão...', 'info');
    
    // Dar tempo para garantir que todas as preparações foram concluídas
    setTimeout(() => {
      // Acionar impressão
      window.print();
    }, 300);
    
    return true;
  } catch (error) {
    console.error('Erro ao preparar impressão com área dedicada:', error);
    mostrarNotificacao('Erro ao preparar impressão: ' + error.message, 'error');
    
    // Limpar estilos de impressão em caso de erro
    const printStylesElement = document.getElementById('print-only-styles');
    if (printStylesElement && printStylesElement.parentNode) {
      printStylesElement.parentNode.removeChild(printStylesElement);
    }
    
    restaurarEstadoAposImpressao(); // Garantir restauração em caso de erro
    return false;
  }
}

/**
 * Nova função para preparar múltiplas áreas de impressão de uma vez
 * @param {Array} configs - Array de configurações de portas
 * @returns {boolean} - Se a preparação foi bem-sucedida
 */
function prepararAreasImpressao(configs) {
  try {
    // Validar se há configurações
    if (!configs || !Array.isArray(configs) || configs.length === 0) {
      configs = [obterConfiguracaoAtual()]; // Fallback para configuração atual
    }
    
    // Verificar se existe SVG para clonagem
    const svgOriginal = document.querySelector('#desenho svg');
    if (!svgOriginal) {
      mostrarNotificacao('Nenhum desenho SVG encontrado. Gere um desenho primeiro.', 'warning');
      return false;
    }
    
    // Adicionar estilo CSS para garantir que não hajam bordas ou sombras
    const styleId = 'print-no-borders-style';
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = `
      @media print {
        svg, rect, line, path, g, circle {
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
          stroke-width: 0.5px !important;
        }
      }
    `;
    
    // Verificar se há container para a área de impressão
    let printBooklet = document.getElementById('print-booklet');
    // Se não existe, criar
    if (!printBooklet) {
      printBooklet = document.createElement('div');
      printBooklet.id = 'print-booklet';
      document.body.appendChild(printBooklet);
    }
    
    // Limpar área de impressão atual e adicionar classe para impressão
    printBooklet.innerHTML = '';
    printBooklet.classList.add('printing');
    
    // Definir estilos explícitos para garantir visibilidade
    printBooklet.style.display = 'block';
    printBooklet.style.visibility = 'visible';
    printBooklet.style.opacity = '1';
    printBooklet.style.position = 'absolute';
    printBooklet.style.zIndex = '9999';
    printBooklet.style.left = '0';
    printBooklet.style.top = '0';
    printBooklet.style.width = '210mm'; // Largura A4
    printBooklet.style.backgroundColor = 'white';
    printBooklet.style.overflow = 'visible';
    
    // Para cada configuração, criar uma página
    configs.forEach((config, index) => {
      // Criar página para esta configuração
      const printPage = document.createElement('div');
      printPage.className = 'print-page';
      printPage.id = `print-page-${index}`;
      
      // Adicionar estilos explícitos para a página
      printPage.style.width = '100%';
      printPage.style.margin = '0 auto';
      printPage.style.padding = '10mm';
      printPage.style.boxSizing = 'border-box';
      printPage.style.pageBreakAfter = 'always';
      printPage.style.display = 'block';
      printPage.style.visibility = 'visible';
      
      // Adicionar cabeçalho
      const header = criarCabecalhoImpressao(config);
      printPage.appendChild(header);
      
      // Criar container para o SVG
      const svgContainer = document.createElement('div');
      svgContainer.className = 'svg-container-clone';
      
      // Adicionar estilos explícitos para o container do SVG
      svgContainer.style.display = 'flex';
      svgContainer.style.justifyContent = 'center';
      svgContainer.style.alignItems = 'center';
      svgContainer.style.padding = '10mm 0';
      svgContainer.style.minHeight = '230mm';
      svgContainer.style.width = '100%';
      svgContainer.style.boxSizing = 'border-box';
      svgContainer.style.overflow = 'visible';
      
      // Clonar o SVG original e ajustar para este container
      const svgClone = clonarEAjustarSVG(svgOriginal, config);
      svgContainer.appendChild(svgClone);
      printPage.appendChild(svgContainer);
      
      // Adicionar rodapé
      const footer = criarRodapeImpressao();
      printPage.appendChild(footer);
      
      // Adicionar a página ao livreto de impressão
      printBooklet.appendChild(printPage);
    });
    
    // Esconder temporariamente o resto da página
    const pageElements = document.querySelectorAll('body > *:not(#print-booklet):not(#print-area)');
    pageElements.forEach(el => {
      if (!el.dataset.originalVisibility) {
        el.dataset.originalVisibility = el.style.visibility || 'visible';
        el.dataset.originalDisplay = el.style.display || 'block';
      }
      el.style.visibility = 'hidden';
    });
    
    // Forçar um reflow para garantir que as mudanças no DOM foram aplicadas
    void printBooklet.offsetHeight;
    
    // Logar informações para debug
    console.log('Áreas de impressão preparadas:', {
      printBooklet: printBooklet,
      pages: printBooklet.querySelectorAll('.print-page').length,
      svgs: printBooklet.querySelectorAll('svg').length
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao preparar áreas de impressão:', error);
    mostrarNotificacao('Erro ao preparar áreas de impressão: ' + error.message, 'error');
    return false;
  }
}

/**
 * Salva o estado de visibilidade dos elementos antes da impressão
 * para restaurá-los posteriormente
 */
function salvarEstadoAntesDeImprimir() {
  console.log("Salvando estado dos elementos antes de imprimir...");
  
  // Salvar estado de visibilidade dos elementos principais da página
  const pageElements = document.querySelectorAll('body > *:not(#print-booklet):not(#print-area)');
  pageElements.forEach(el => {
    el.dataset.originalVisibility = window.getComputedStyle(el).visibility;
    el.dataset.originalDisplay = window.getComputedStyle(el).display;
  });
  
  console.log('Estado dos elementos salvos');
}

/**
 * Obtém as configurações de portas salvas
 * @returns {Array} Lista de configurações de portas
 */
function obterConfigPortas() {
  console.log("Obtendo configurações de portas...");
  
  try {
    // Tentar obter as configurações do storage
    if (typeof obterTodasConfiguracoes === 'function') {
      return obterTodasConfiguracoes();
    }
    
    // Tentar obter da janela global se existir
    if (window.obterTodasConfiguracoes) {
      return window.obterTodasConfiguracoes();
    }
    
    // Se não conseguir, tentar obter do localStorage diretamente
    const STORAGE_KEY = 'conecta_portas_configs';
    const dadosStorage = localStorage.getItem(STORAGE_KEY);
    if (dadosStorage) {
      try {
        return JSON.parse(dadosStorage);
      } catch (e) {
        console.error("Erro ao parsear dados do localStorage:", e);
      }
    }
    
    // Se tudo falhar, retornar array vazio com a configuração atual
    const configAtual = window.obterConfiguracaoAtual ? window.obterConfiguracaoAtual() : {};
    console.warn("Usando apenas a configuração atual como fallback.");
    return [configAtual];
  } catch (error) {
    console.error("Erro ao obter configurações de portas:", error);
    return [];
  }
}

// Variável global para rastrear qual porta está ativa atualmente
// (assumindo valor padrão 0 se não estiver definida)
let indexPortaAtiva = window.indexPortaAtiva || 0;

/**
 * Prepara o documento para impressão
 * @param {String} modo - Modo de impressão: 'normal', 'especificacoes', 'completo'
 */
function prepararParaImpressao(modo = 'normal') {
  console.log(`Preparando para impressão no modo: ${modo}`);
  
  // Executar diagnóstico de impressão para detectar e corrigir problemas
  if (typeof diagnosticarImpressao === 'function') {
    const resultadoDiagnostico = diagnosticarImpressao();
    console.log('Diagnóstico pré-impressão:', resultadoDiagnostico);
    
    // Se o diagnóstico falhou completamente, talvez seja melhor abortar
    if (resultadoDiagnostico && !resultadoDiagnostico.sucesso) {
      alert('Detectamos problemas na preparação da impressão. Tentaremos corrigir automaticamente, mas a qualidade pode ser afetada.');
    }
  }
  
  // Captura a visibilidade original dos elementos para restaurar depois
  salvarEstadoAntesDeImprimir();
  
  // Ocultar elementos que não devem aparecer na impressão
  ocultarElementosImpressao();
  
  // Limpar áreas de impressão
  document.getElementById('print-area').innerHTML = '';
  if (document.getElementById('print-booklet')) {
    document.getElementById('print-booklet').innerHTML = '';
  }
}

/**
 * Realiza a impressão do desenho atual
 * @param {String} modo - Modo de impressão: 'normal', 'especificacoes', 'completo'
 */
function imprimirDesenho(modo = 'normal') {
  console.log(`Iniciando impressão no modo: ${modo}`);
  
  // Diagnosticar e corrigir possíveis problemas
  if (typeof diagnosticarImpressao === 'function') {
    const diagnostico = diagnosticarImpressao();
    console.log('Diagnóstico pré-impressão:', diagnostico);
  }
  
  try {
    prepararParaImpressao(modo);
    
    // Certifique-se de que o desenho está visível
    let svgElement = document.querySelector('#desenho svg');
    if (svgElement) {
      svgElement.style.display = 'block';
      svgElement.style.visibility = 'visible';
    }
    
    // Capturar a imagem para impressão
    capturarImagemParaImpressao();
    
    // Ativar o modo de impressão
    document.body.classList.add('printing-mode');
    
    // Pequeno atraso para garantir que tudo esteja pronto
    setTimeout(() => {
      // Iniciar a impressão
      window.print();
      
      // Programar a restauração para após a impressão estar completa
      setTimeout(restaurarEstadoAposImpressao, 1000);
    }, 500);
  } catch (e) {
    console.error('Erro ao imprimir:', e);
    restaurarEstadoAposImpressao();
    alert('Ocorreu um erro durante a impressão. Por favor, tente novamente.');
  }
}

// Exportar funções
export {
  inicializarImpressao,
  prepararImpressao,
  capturarImagemParaImpressao,
  exportarComoImagem,
  preencherCabecalhoImpressao,
  imprimirComAreaDedicada,
  visualizarAreaImpressao,
  prepararAreasImpressao,
  imprimirMultiplasPaginas,
  inspecionarSVG,
  ajustarSVGEscala,
  restaurarEstadoAposImpressao,
  v2_prepararSVG,
  v2_imprimirDesenho,
  v2_visualizarDesenho
}; 