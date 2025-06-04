/**
 * Arquivo principal da aplicação
 */

// Prevenção de zoom
(function() {
  // Desabilita zoom por tecla
  document.addEventListener('keydown', function(e) {
    // Ctrl+ ou Ctrl- (zoom)
    if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '_' || e.key === '0')) {
      e.preventDefault();
      return false;
    }
  });

  // Atualiza para ter certeza que o viewport está fixado
  function fixViewport() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }

  // Chama no carregamento e no resize
  window.addEventListener('load', fixViewport);
  window.addEventListener('resize', fixViewport);
})();

// Importar módulos
import { inicializar, obterConfiguracaoAtual, atualizarConfiguracao } from './initialize.js';
import { configurarValidacao } from './utils.js';
import { mostrarNotificacao } from './notifications.js';
import { inicializarCanvas, desenharPorta, capturarImagemCanvas, atualizarDesenho } from './drawing.js';
import { 
  inicializarControlesUI,
  inicializarModais,
  inicializarSeletorLogo,
  toggleFuncaoPorta 
} from './ui-controls.js';
import { 
  inicializarImpressao, 
  capturarImagemParaImpressao 
} from './printing.js';
import { 
  inicializarArmazenamento,
  carregarUltimaConfiguracao
} from './storage.js';
import { inicializarGerenciamentoUsuarios } from './usuarios.js';
import { inicializarModaisDraggable } from './modal-draggable.js';
import { inicializarCadastramento } from './cadastramento.js';

// Vamos tentar importar o sidebar.js, mas usar o fallback global se falhar
let sidebarInstance;
try {
  // Importação estática, que funciona melhor em browsers que suportam ES6
  import('./sidebar.js').then(module => {
    sidebarInstance = module.sidebarInstance;
    console.log('Sidebar importado com sucesso via módulo');
  }).catch(error => {
    console.warn('Erro ao importar sidebar.js como módulo:', error);
    // Fallback para a versão global
    sidebarInstance = window.sidebarBS;
    console.log('Usando sidebar global como fallback:', !!sidebarInstance);
  });
}
catch (error) {
  console.warn('Abordagem de importação dinâmica não suportada:', error);
  // Usar diretamente a versão global
  sidebarInstance = window.sidebarBS;
}

// Inicializar Supabase
let supabase = null;

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Inicializando aplicação...');
  
  // Inicializar Supabase
  inicializarSupabase();
  
  // Inicializar módulos
  inicializarCadastramento();
  
  try {
    // Inicializar sistema base
    inicializar();
    
    // Inicializar armazenamento - mas NÃO carregar última configuração ainda
    inicializarArmazenamento(false); // Adicionamos um parâmetro para não carregar a configuração ainda
    
    // Verificar se o elemento de desenho existe
    verificarElementoDesenho();
    
    // Inicializar canvas ANTES dos controles
    console.log('Tentando inicializar canvas...');
    if (!inicializarCanvas('desenho')) {
      console.error('Erro ao inicializar o canvas de desenho');
      console.log('Tentando forçar a criação do elemento de desenho...');
      
      if (!forcarCriacaoElementoDesenho()) {
        console.error('Falha em todas as tentativas de inicializar o desenho');
        mostrarNotificacao('Erro ao inicializar o canvas de desenho', 'error');
        return;
      }
      else {
        console.log('Canvas inicializado com sucesso através de força bruta');
      }
    }
    
    // Verificar se o SVG foi realmente criado corretamente
    const svgElement = document.querySelector('#desenho svg');
    console.log('SVG elemento após inicialização:', svgElement);
    
    if (!svgElement) {
      console.error('SVG não encontrado após inicialização - tentando novamente');
      // Tentar recriar o elemento de desenho
      const canvasContainer = document.querySelector('.canvas-container');
      if (canvasContainer) {
        canvasContainer.innerHTML = '<div id="desenho" style="width:100%; height:100%;"></div>';
        console.log('Elemento de desenho recriado, tentando inicializar novamente...');
        if (!inicializarCanvas('desenho')) {
          console.error('Falha na segunda tentativa de inicializar canvas');
          mostrarNotificacao('Falha ao inicializar a área de desenho', 'error');
          return;
        }
      }
    }
    
    // Inicializar controles de formulário
    console.log('Inicializando controles de formulário...');
    inicializarControlesUI();
    
    // Inicializar modais
    console.log('Inicializando modais...');
    inicializarModais();
    
    // Inicializar seletor de logo
    console.log('Inicializando seletor de logo...');
    inicializarSeletorLogo();
    
    // Nota: Os botões de impressão e exportação foram removidos da interface atual
    // A inicialização do módulo de impressão foi mantida apenas para compatibilidade com funções internas
    // console.log('Inicializando impressão...');
    inicializarImpressao();
    
    // Inicializar sidebar
    console.log('Inicializando sidebar...');
    inicializarSidebar();
    
    // Inicializar gerenciamento de usuários
    console.log('Inicializando gerenciamento de usuários...');
    inicializarGerenciamentoUsuarios();
    
    // Inicializar modais arrastáveis
    console.log('Inicializando modais arrastáveis...');
    inicializarModaisDraggable();
    
    // Configurar validação de campos
    configurarValidacao();
    
    // Inicializar estado dos controles condicionais
    const funcaoPorta = document.getElementById('funcaoPorta');
    if (funcaoPorta) {
      toggleFuncaoPorta(funcaoPorta.value);
    }
    
    // Expor funções de desenho globalmente para facilitar debugging
    console.log('Expondo funções de desenho globalmente...');
    window.desenharPorta = desenharPorta;
    window.inicializarCanvas = inicializarCanvas;
    window.atualizarDesenho = atualizarDesenho;
    
    // Exportar funções úteis para o escopo global (para debugging)
    window.inicializarAplicacao = inicializarAplicacao;
    window.diagnosticarImpressao = diagnosticarImpressao;
    window.carregarUltimaConfiguracao = carregarUltimaConfiguracao;
    window.obterConfiguracaoAtual = obterConfiguracaoAtual;

    // Carregar a última configuração (ou projeto salvo) SOMENTE APÓS inicializar todos os controles
    // Isso evita que funções de inicialização sobrescrevam os campos de medidas do projeto carregado
    try {
      carregarUltimaConfiguracao();
      console.log('Última configuração carregada com sucesso após inicialização dos controles');
      // Atualizar especificações após carregar a configuração
      const configAtual = obterConfiguracaoAtual();
      atualizarEspecificacoes(configAtual);
    } catch (e) {
      console.warn('Erro ao carregar última configuração:', e);
      // Se falhar ao carregar a última configuração, desenhar com configuração padrão
      setTimeout(() => {
        const configPadrao = obterConfiguracaoAtual();
        console.log('Usando configuração padrão para desenho inicial:', configPadrao);
        desenharPorta(configPadrao);
        atualizarEspecificacoes(configPadrao);
      }, 200);
    }
    
    // Conectar eventos para os botões de múltiplas páginas
    const btnMultiPrint = document.getElementById('btnMultiPrint');
    if (btnMultiPrint) {
      btnMultiPrint.addEventListener('click', demonstrarMultiplasPaginas);
    }
    
    const btnMultiPDF = document.getElementById('btnMultiPDF');
    if (btnMultiPDF) {
      btnMultiPDF.addEventListener('click', demonstrarMultiplasPaginasPDF);
    }
    
    // Adicionar evento ao botão de salvar rápido
    const btnSalvarRapido = document.getElementById('btnSalvarRapido');
    if (btnSalvarRapido) {
      btnSalvarRapido.addEventListener('click', () => {
        import('./storage.js').then(storage => {
          storage.salvarConfiguracaoRapida();
        }).catch(error => {
          console.error('Erro ao importar módulo storage:', error);
          mostrarNotificacao('Erro ao salvar projeto', 'error');
        });
      });
    }
    
    // Adicionar evento ao botão de carregar projetos
    const btnCarregarProjetos = document.getElementById('btnCarregarProjetos');
    if (btnCarregarProjetos) {
      btnCarregarProjetos.addEventListener('click', () => {
        import('./storage.js').then(storage => {
          storage.carregarConfiguracoesNoModal();
        }).catch(error => {
          console.error('Erro ao importar módulo storage:', error);
          mostrarNotificacao('Erro ao carregar projetos', 'error');
        });
      });
    }
    
    // Configurar botão do Cadastramento para todos os usuários
    const btnCadastramento = document.getElementById('btnCadastramento');
    if (btnCadastramento) {
      // Garantir que o botão de cadastramento esteja visível para todos os usuários
      btnCadastramento.style.display = 'block';
    }
    
    console.log('Aplicação inicializada com sucesso');
    mostrarNotificacao('Sistema inicializado', 'success');
  }
  catch (error) {
    console.error('Erro ao inicializar aplicação:', error);
    mostrarNotificacao('Erro ao inicializar a aplicação: ' + error.message, 'error');
  }
});

/**
 * Verifica se o elemento de desenho existe e está estruturado corretamente
 */
function verificarElementoDesenho() {
  const desenhoElement = document.getElementById('desenho');
  
  if (!desenhoElement) {
    console.warn('Elemento de desenho não encontrado, criando um novo');
    
    // Obtém o container canvas
    const canvasContainer = document.querySelector('.canvas-container');
    
    if (!canvasContainer) {
      console.error('Container de canvas não encontrado, não é possível criar o elemento de desenho');
      throw new Error('Container de canvas não encontrado');
    }
    
    // Limpa o container e cria um novo elemento de desenho
    canvasContainer.innerHTML = '<div id="desenho"></div>';
    
    console.log('Elemento de desenho criado com sucesso');
  }
  else {
    console.log('Elemento de desenho encontrado:', desenhoElement);
  }
}

/**
 * Inicializa o sidebar com uma abordagem robusta que tenta várias estratégias
 */
function inicializarSidebar() {
  console.log('Tentando inicializar o sidebar...');
  
  // Estratégia 1: Tentar usar o objeto global window.sidebarBS
  if (window.sidebarBS && typeof window.sidebarBS.init === 'function') {
    if (!window.sidebarBS.initialized) {
      window.sidebarBS.init();
      console.log('Sidebar inicializado via objeto global');
      return true;
    }
    else {
      console.log('Sidebar global já estava inicializado');
      return true;
    }
  }
  
  // Estratégia 2: Tentar usar a variável sidebarInstance do escopo atual
  if (typeof sidebarInstance !== 'undefined' && sidebarInstance && typeof sidebarInstance.init === 'function') {
    if (!sidebarInstance.initialized) {
      sidebarInstance.init();
      console.log('Sidebar inicializado via variável sidebarInstance');
      return true;
    }
    else {
      console.log('Sidebar via sidebarInstance já estava inicializado');
      return true;
    }
  }
  
  // Estratégia 3: Tentar importar o módulo diretamente (se estamos em um contexto de módulo)
  try {
    // Verificar primeiro se window.sidebarBS já está disponível
    if (window.sidebarBS && typeof window.sidebarBS.init === 'function') {
      console.log('sidebarBS já está disponível globalmente, usando instância existente');
      window.sidebarBS.init();
      return true;
    }
    
    // Tentar importação dinâmica apenas se necessário
    console.log('Tentando importação dinâmica do sidebar como último recurso');
    import('./sidebar.js')
      .then(module => {
        // Verificar se o módulo foi carregado corretamente
        if (module && (module.sidebarInstance || module.default)) {
          const sidebar = module.sidebarInstance || module.default;
          if (sidebar && typeof sidebar.init === 'function') {
            sidebar.init();
            console.log('Sidebar inicializado via importação dinâmica');
            return true;
          }
        }
        else {
          throw new Error('Módulo sidebar.js carregado mas não contém sidebarInstance');
        }
      })
      .catch(error => {
        console.error('Erro na importação direta do sidebar:', error);
      });
  }
  catch (error) {
    // Se ocorreu um erro na importação, isso é normal quando o script já
    // foi carregado como não-módulo. Não é um erro crítico.
    console.log('Importação dinâmica não aplicável:', error.message);
  }
  
  // Estratégia 4: verificar se existe window.sidebarBS como um fallback final
  if (window.sidebarBS) {
    console.log('Utilizando window.sidebarBS como fallback final');
    if (typeof window.sidebarBS.init === 'function') {
      window.sidebarBS.init();
      return true;
    }
  }
  
  // Se chegou aqui, não conseguimos inicializar o sidebar, mas silenciamos o aviso
  // pois ele pode ser inicializado posteriormente via script inline
  console.log('Sidebar não inicializado agora, será inicializado posteriormente');
  return false;
}

/**
 * Função para demonstrar a impressão de múltiplas páginas
 */
function demonstrarMultiplasPaginas() {
  try {
    const module = window.printModule;
    if (!module || typeof module.prepararAreasImpressao !== 'function') {
      console.error('Módulo de impressão não está disponível');
      mostrarNotificacao('Módulo de impressão não disponível', 'error');
      return;
    }
    
    // Usar a configuração atual
    module.prepararAreasImpressao([obterConfiguracaoAtual()]);
    
    // Iniciar impressão
    window.print();
    
    // Mostrar notificação de sucesso
    mostrarNotificacao('Documento enviado para impressão!');
  }
  catch (error) {
    console.error('Erro ao imprimir múltiplas páginas:', error);
    mostrarNotificacao('Erro ao preparar impressão: ' + error.message, 'error');
  }
}

/**
 * Função para demonstrar a exportação de múltiplas páginas como PDF
 */
function demonstrarMultiplasPaginasPDF() {
  try {
    // Obter configuração atual
    const config = obterConfiguracaoAtual();
    
    // Verificar se temos os módulos necessários
    if (!window.exportarPDFMultiplasPaginas || !window.printModule) {
      console.error('Módulos necessários não disponíveis');
      mostrarNotificacao('Função de exportação não disponível', 'error');
              return;
            }
            
    // Usar a função de exportação
    window.exportarPDFMultiplasPaginas(
      [config], 
      'porta_perfil_' + new Date().toISOString().slice(0, 10)
    );
    
    // Mostrar notificação de sucesso
    mostrarNotificacao('Exportação de PDF iniciada!');
  }
  catch (error) {
    console.error('Erro ao exportar PDF:', error);
    mostrarNotificacao('Erro ao exportar PDF: ' + error.message, 'error');
  }
}

/**
 * Força a criação do elemento de desenho como último recurso
 * @returns {boolean} - Verdadeiro se conseguiu criar o elemento
 */
function forcarCriacaoElementoDesenho() {
  try {
    // Tentar criar o elemento de desenho do zero
    const canvasContainer = document.querySelector('.canvas-container');
    if (!canvasContainer) {
      console.error('Container canvas não encontrado para forçar criação');
      return false;
    }
    
    // Limpar e criar novo elemento
    canvasContainer.innerHTML = '';
    const desenhoDiv = document.createElement('div');
    desenhoDiv.id = 'desenho';
    desenhoDiv.style.width = '100%';
    desenhoDiv.style.height = '100%';
    desenhoDiv.style.minHeight = '600px';
    canvasContainer.appendChild(desenhoDiv);
    
    // Tentar inicializar novamente
    return inicializarCanvas('desenho');
  }
  catch (e) {
    console.error('Erro ao forçar criação do elemento de desenho:', e);
    return false;
  }
}

/**
 * Garante que o campo de medida do puxador tenha o valor 150mm como padrão, se for menor ou inválido
 */
function garantirMedidaPuxador() {
  const puxadorMedida = document.getElementById('puxadorMedida');
  if (puxadorMedida) {
    // Se o valor atual não for "Tamanho da Porta" e for menor que 150 ou inválido, definir como 150
    if (puxadorMedida.value === 'Tamanho da Porta' || 
        isNaN(parseInt(puxadorMedida.value, 10)) || 
        parseInt(puxadorMedida.value, 10) < 150) {
      
      puxadorMedida.value = '150';
      
      // Também atualizar na configuração
      const config = obterConfiguracaoAtual();
      if (config.puxador) {
        // Atualizar configuração
        atualizarConfiguracao({
          puxador: { 
            ...config.puxador,
            medida: '150'
          }
        });
        
        // Redesenhar a porta com a configuração atualizada
        desenharPorta(obterConfiguracaoAtual(), true);
      }
    }
  }
}

// Adicionar função para atualizar especificações
/**
 * Atualiza a tabela de especificações técnicas com os dados atuais
 * @param {Object} config - Configuração atual da porta
 */
function atualizarEspecificacoes(config) {
  if (!config) return;
  
  // Atualizar células da tabela com os dados da configuração
  const dimensoes = document.getElementById('specs-dimensoes');
  if (dimensoes) dimensoes.textContent = `${config.largura || '-'} × ${config.altura || '-'} mm`;
  
  const vidro = document.getElementById('specs-vidro');
  if (vidro) vidro.textContent = config.vidro?.tipo || '-';
  
  const perfil = document.getElementById('specs-perfil');
  if (perfil) perfil.textContent = `${config.perfil?.modelo || '-'} (${config.perfil?.cor || '-'})`;
  
  const funcao = document.getElementById('specs-funcao');
  if (funcao) {
    let funcaoTexto = '-';
    if (config.funcao) {
      if (config.funcao === 'deslizante') {
        funcaoTexto = 'Deslizante';
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

// Sobrescrever a função desenharPorta para também atualizar especificações
const desenharPortaOriginal = desenharPorta;
window.desenharPorta = function(config) {
  // Chamar a função original
  const resultado = desenharPortaOriginal(config);
  
  // Atualizar as especificações
  atualizarEspecificacoes(config);
  
  return resultado;
}; 

/**
 * Inicializa a conexão com Supabase
 */
function inicializarSupabase() {
    try {
        // Verificar se o Supabase já foi inicializado
        if (supabase) return supabase;
        
        // Verificar se o Supabase está disponível
        if (!window.supabaseUrl || !window.supabaseKey) {
            console.error('Credenciais do Supabase não encontradas. Verifique se supabaseUrl e supabaseKey estão definidos.');
            return null;
        }
        
        // Inicializar cliente Supabase usando o objeto global
        if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
            supabase = window.supabase.createClient(window.supabaseUrl, window.supabaseKey);
            
            // Disponibilizar globalmente como supabaseClient (usado em ui-controls, etc.)
            window.supabaseClient = supabase;
            // Manter window.supabase para compatibilidade se necessário, mas priorizar supabaseClient
            window.supabase = supabase; 
            
            console.log('Supabase inicializado com sucesso');
            return supabase;
        } else {
            console.error('Objeto Supabase não disponível globalmente ou não contém método createClient');
            return null;
        }
    } catch (error) {
        console.error('Erro ao inicializar Supabase:', error);
        return null;
    }
}

/**
 * Inicializa a aplicação completa
 * Função utilitária para diagnóstico e para inicializar tudo novamente se necessário
 */
function inicializarAplicacao() {
    console.log('Inicializando aplicação manualmente...');
    
    try {
        // Inicializar Supabase
        inicializarSupabase();
        
        // Inicializar módulos
        inicializarCadastramento();
        
        // Inicializar sistema base
        inicializar();
        
        // Inicializar armazenamento
        inicializarArmazenamento(false);
        
        // Verificar elemento de desenho
        verificarElementoDesenho();
        
        // Inicializar canvas
        inicializarCanvas('desenho');
        
        // Inicializar controles e UI
        inicializarControlesUI();
        inicializarModais();
        inicializarSeletorLogo();
        inicializarImpressao();
        inicializarSidebar();
        inicializarGerenciamentoUsuarios();
        inicializarModaisDraggable();
        
        // Configurar validação
        configurarValidacao();
        
        // Inicializar funções condicionais
        const funcaoPorta = document.getElementById('funcaoPorta');
        if (funcaoPorta) {
            toggleFuncaoPorta(funcaoPorta.value);
        }
        
        console.log('Aplicação reinicializada com sucesso');
        mostrarNotificacao('Sistema reinicializado com sucesso', 'success');
        return true;
    } catch (error) {
        console.error('Erro ao reinicializar aplicação:', error);
        mostrarNotificacao('Erro ao reinicializar a aplicação: ' + error.message, 'error');
        return false;
    }
} 

/**
 * Função auxiliar para diagnosticar problemas de impressão e exportação
 * Exportada globalmente para uso via console
 */
function diagnosticarImpressao() {
    console.log('Iniciando diagnóstico do sistema de impressão...');
    
    try {
        // Verificar se há módulo de impressão
        const temModuloImpressao = typeof window.printModule !== 'undefined';
        console.log('Módulo de impressão disponível:', temModuloImpressao);
        
        // Verificar se há função de exportar PDF
        const temExportPDF = typeof window.exportarPDFMultiplasPaginas === 'function';
        console.log('Função de exportar PDF disponível:', temExportPDF);
        
        // Verificar se o canvas existe
        const canvas = document.getElementById('desenho');
        console.log('Elemento de desenho encontrado:', !!canvas);
        
        // Verificar se funções importantes estão disponíveis
        const temCapturarImagem = typeof capturarImagemCanvas === 'function';
        console.log('Função capturarImagemCanvas disponível:', temCapturarImagem);
        
        // Verificar se as bibliotecas estão carregadas
        const temHTML2Canvas = typeof html2canvas === 'function';
        console.log('Biblioteca html2canvas carregada:', temHTML2Canvas);
        
        const temHTML2PDF = typeof html2pdf === 'object' && typeof html2pdf.Worker === 'function';
        console.log('Biblioteca html2pdf carregada:', temHTML2PDF);
        
        // Verificar configuração atual
        const configAtual = obterConfiguracaoAtual();
        console.log('Configuração atual:', configAtual);
        
        // Verificar SVG do desenho
        const svg = document.querySelector('#desenho svg');
        console.log('SVG do desenho encontrado:', !!svg);
        if (svg) {
            console.log('Dimensões do SVG:', {
                width: svg.getAttribute('width'),
                height: svg.getAttribute('height'),
                viewBox: svg.getAttribute('viewBox')
            });
        }
        
        // Retornar diagnóstico completo
        return {
            impressao: {
                modulo: temModuloImpressao,
                exportarPDF: temExportPDF,
                capturarImagem: temCapturarImagem
            },
            bibliotecas: {
                html2canvas: temHTML2Canvas,
                html2pdf: temHTML2PDF
            },
            elementos: {
                canvas: !!canvas,
                svg: !!svg
            },
            configuracao: configAtual
        };
    } catch (error) {
        console.error('Erro durante diagnóstico de impressão:', error);
        return {
            erro: error.message,
            stack: error.stack
        };
    }
} 