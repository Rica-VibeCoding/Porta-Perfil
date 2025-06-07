/**
 * Gerenciador de Modal Unificado para Sistema de Cadastramento
 * Sistema de Portas e Perfis
 */

import { 
  CadastroFormularios, 
  CadastroImagens, 
  CadastroNotificacoes,
  CadastroUtils
} from './cadastro-core.js';

/**
 * Gerenciador principal do modal de cadastro
 */
export class CadastroModalManager {
  constructor() {
    this.modal = null;
    this.tipoAtual = null;
    this.itemAtual = null;
    this.inicializado = false;
    this.eventListenersAtivos = new Set();
  }

  /**
   * Inicializa o gerenciador de modal
   */
  inicializar() {
    if (this.inicializado) return true;

    const modalElement = document.getElementById('cadastroFormModal');
    if (!modalElement || !window.bootstrap) {
      console.warn('Modal de cadastro não encontrado ou Bootstrap não disponível');
      return false;
    }

    this.modal = new bootstrap.Modal(modalElement);
    this.configurarEventosGlobais();
    this.inicializado = true;

    console.log('✅ Cadastro Modal Manager inicializado');
    return true;
  }

  /**
   * Configura eventos globais do modal
   */
  configurarEventosGlobais() {
    const modalElement = document.getElementById('cadastroFormModal');
    if (!modalElement) return;

    // Evento quando modal é fechado
    if (!this.eventListenersAtivos.has('modalHidden')) {
      modalElement.addEventListener('hidden.bs.modal', () => {
        this.limparEstado();
      });
      this.eventListenersAtivos.add('modalHidden');
    }

    // Configurar preview de imagem
    CadastroImagens.configurarPreview();
  }

  /**
   * Abre modal para um tipo específico
   */
  async abrirModal(tipo, dados = null) {
    if (!this.inicializado) {
      console.error('Modal Manager não inicializado');
      return false;
    }

    if (!['puxador', 'trilho', 'vidro'].includes(tipo)) {
      console.error(`Tipo inválido: ${tipo}`);
      return false;
    }

    try {
      // Limpar estado anterior
      this.limparEstado();
      
      // Definir tipo atual
      this.tipoAtual = tipo;
      this.itemAtual = dados;

      // Configurar modal para o tipo
      this.configurarModalParaTipo(tipo, dados);

      // Abrir modal
      this.modal.show();

      console.log(`📋 Modal aberto para: ${tipo}`, dados ? '(edição)' : '(novo)');
      return true;

    } catch (error) {
      console.error(`Erro ao abrir modal para ${tipo}:`, error);
      CadastroNotificacoes.erro('Erro ao abrir formulário');
      return false;
    }
  }

  /**
   * Configura modal para um tipo específico
   */
  configurarModalParaTipo(tipo, dados = null) {
    // Configurar título
    this.configurarTitulo(tipo, dados);

    // Configurar campos
    CadastroFormularios.configurarCamposPorTipo(tipo);

    // Preencher dados se for edição
    if (dados) {
      CadastroFormularios.preencherFormulario(tipo, dados);
      
      // Lidar com foto existente
      if (dados.foto) {
        this.mostrarFotoExistente(dados.foto, tipo, dados);
      }
    } else {
      CadastroFormularios.limparFormulario();
    }

    // Configurar eventos específicos se necessário
    this.configurarEventosEspecificos(tipo);
  }

  /**
   * Configura título do modal
   */
  configurarTitulo(tipo, dados = null) {
    const acao = dados ? 'Editar' : 'Novo';
    const tipoTexto = {
      'puxador': 'Puxador',
      'trilho': 'Trilho', 
      'vidro': 'Vidro'
    }[tipo];

    const titulo = `${acao} ${tipoTexto}`;

    // Atualizar título principal
    const modalTitle = document.getElementById('cadastroFormModalLabel');
    if (modalTitle) {
      modalTitle.innerHTML = `<i class="bi bi-database-fill"></i> ${titulo}`;
    }

    // Atualizar título do span
    const formTitle = document.getElementById('tituloFormCadastro');
    if (formTitle) {
      formTitle.textContent = titulo;
    }
  }

  /**
   * Mostra foto existente no modo edição
   */
  mostrarFotoExistente(fotoUrl, tipo, dados) {
    const preview = document.getElementById('fotoPreview');
    const previewContainer = document.getElementById('fotoPreviewContainer');
    
    if (preview && previewContainer && fotoUrl) {
      preview.src = fotoUrl;
      preview.onerror = function() {
        preview.onerror = null;
        preview.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\' viewBox=\'0 0 120 120\'%3E%3Crect width=\'120\' height=\'120\' fill=\'%23f5f5f5\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' font-size=\'14\' text-anchor=\'middle\' alignment-baseline=\'middle\' font-family=\'Arial\' fill=\'%23999999\'%3EImagem não disponível%3C/text%3E%3C/svg%3E';
      };
      previewContainer.classList.remove('d-none');
    }
  }

  /**
   * Configura eventos específicos por tipo
   */
  configurarEventosEspecificos(tipo) {
    if (tipo === 'vidro') {
      // Configurar evento para preview de cor RGB
      setTimeout(() => {
        const campoRgb = document.getElementById('itemRgb');
        if (campoRgb && !this.eventListenersAtivos.has('rgbPreview')) {
          campoRgb.addEventListener('input', () => {
            CadastroFormularios.atualizarPreviewCor();
          });
          this.eventListenersAtivos.add('rgbPreview');
          
          // Atualizar preview inicial
          CadastroFormularios.atualizarPreviewCor();
        }
      }, 100);
    }
  }

  /**
   * Fecha modal
   */
  fecharModal() {
    if (this.modal) {
      this.modal.hide();
    }
    this.limparEstado();
  }

  /**
   * Limpa estado do modal
   */
  limparEstado() {
    this.tipoAtual = null;
    this.itemAtual = null;
    
    // Limpar formulário
    CadastroFormularios.limparFormulario();
    
    // Remover campos específicos de vidro
    const corPreviewContainer = document.getElementById('corPreviewContainer');
    if (corPreviewContainer) {
      corPreviewContainer.remove();
    }
    
    // Remover alguns event listeners específicos
    if (this.eventListenersAtivos.has('rgbPreview')) {
      this.eventListenersAtivos.delete('rgbPreview');
    }
    
    console.log('🔄 Estado do modal limpo');
  }

  /**
   * Obtém tipo atual
   */
  getTipoAtual() {
    return this.tipoAtual;
  }

  /**
   * Obtém item atual
   */
  getItemAtual() {
    return this.itemAtual;
  }

  /**
   * Verifica se modal está aberto para um tipo
   */
  isAbertoParaTipo(tipo) {
    return this.tipoAtual === tipo;
  }

  /**
   * Força fechamento do modal (em caso de emergência)
   */
  forcarFechamento() {
    try {
      const modalElement = document.getElementById('cadastroFormModal');
      if (!modalElement) return;

      // Forçar fechamento manual
      modalElement.classList.remove('show');
      modalElement.style.display = 'none';
      modalElement.setAttribute('aria-hidden', 'true');
      modalElement.removeAttribute('aria-modal');
      modalElement.removeAttribute('role');

      // Remover backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }

      // Restaurar body
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';

      this.limparEstado();
      console.log('🔧 Modal fechado forçadamente');
    } catch (error) {
      console.error('Erro ao forçar fechamento do modal:', error);
    }
  }
}

/**
 * Integração com Modal Coordinator
 */
export class CadastroModalCoordinator {
  constructor(modalManager) {
    this.modalManager = modalManager;
    this.coordinatorAtivo = false;
  }

  /**
   * Integra com o Modal Coordinator existente
   */
  integrarComCoordinator() {
    if (!window.modalCoordinator) {
      console.warn('Modal Coordinator não disponível');
      return false;
    }

    // Evitar múltiplas integrações
    if (this.coordinatorAtivo) {
      return true;
    }

    try {
      // Backup dos handlers existentes se houver
      const handlersExistentes = window.modalCoordinator.handlers || {};

      // Registrar handlers unificados
      window.modalCoordinator.registerHandlers('puxador', {
        save: (event) => this.handleSave('puxador', event),
        open: (data) => this.handleOpen('puxador', data),
        close: () => this.handleClose('puxador')
      });

      window.modalCoordinator.registerHandlers('trilho', {
        save: (event) => this.handleSave('trilho', event),
        open: (data) => this.handleOpen('trilho', data),
        close: () => this.handleClose('trilho')
      });

      window.modalCoordinator.registerHandlers('vidro', {
        save: (event) => this.handleSave('vidro', event),
        open: (data) => this.handleOpen('vidro', data),
        close: () => this.handleClose('vidro')
      });

      this.coordinatorAtivo = true;
      console.log('✅ Integração com Modal Coordinator concluída');
      return true;

    } catch (error) {
      console.error('Erro na integração com Modal Coordinator:', error);
      return false;
    }
  }

  /**
   * Handler unificado para abertura
   */
  handleOpen(tipo, data = {}) {
    return this.modalManager.abrirModal(tipo, data);
  }

  /**
   * Handler unificado para fechamento
   */
  handleClose(tipo) {
    console.log(`🔄 Fechando modal para: ${tipo}`);
    this.modalManager.limparEstado();
  }

  /**
   * Handler unificado para salvamento
   */
  async handleSave(tipo, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      // Extrair dados do formulário
      const dados = CadastroFormularios.extrairDados(tipo);
      
      console.log(`💾 Salvando ${tipo}:`, dados);
      
      // Validar dados
      const validacao = this.validarDados(tipo, dados);
      if (!validacao.valido) {
        CadastroNotificacoes.erro(validacao.erros.join('\n'));
        return false;
      }
      
      // Chamar API apropriada
      let resultado;
      const isEdicao = dados.id && dados.id.trim() !== '';
      
      switch (tipo) {
        case 'puxador':
          if (isEdicao) {
            resultado = await window.PuxadoresAPI.atualizar(dados.id, dados);
          } else {
            resultado = await window.PuxadoresAPI.criar(dados);
          }
          break;
          
        case 'trilho':
          if (isEdicao) {
            resultado = await window.TrilhosAPI.atualizar(dados.id, dados);
          } else {
            resultado = await window.TrilhosAPI.criar(dados);
          }
          break;
          
        case 'vidro':
          if (isEdicao) {
            resultado = await window.VidrosAPI.atualizar(dados.id, dados);
          } else {
            resultado = await window.VidrosAPI.criar(dados);
          }
          break;
          
        default:
          throw new Error(`Tipo não suportado: ${tipo}`);
      }
      
      if (resultado.success) {
        const acao = isEdicao ? 'atualizado' : 'salvo';
        CadastroNotificacoes.sucesso(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} ${acao} com sucesso!`);
        
        // Fechar modal
        this.modalManager.fecharModal();
        
        // Atualizar tabela correspondente
        this.atualizarTabelaAposSalvar(tipo);
        
        return true;
      } else {
        throw new Error(resultado.error || 'Erro desconhecido ao salvar');
      }

    } catch (error) {
      console.error(`Erro ao salvar ${tipo}:`, error);
      CadastroNotificacoes.erro(`Erro ao salvar ${tipo}: ${error.message}`);
      return false;
    }
  }

  /**
   * Valida dados do formulário
   */
  validarDados(tipo, dados) {
    // Usar as validações do módulo core
    if (window.CadastroValidacao) {
      switch (tipo) {
        case 'puxador':
          return window.CadastroValidacao.validarPuxador(dados);
        case 'trilho':
          return window.CadastroValidacao.validarTrilho(dados);
        case 'vidro':
          return window.CadastroValidacao.validarVidro(dados);
        default:
          return { valido: true, erros: [] };
      }
    }
    
    // Fallback para validação básica
    const erros = [];
    if (!dados || typeof dados !== 'object') {
      erros.push('Dados inválidos');
    }
    
    return { valido: erros.length === 0, erros };
  }

  /**
   * Atualiza tabela após salvamento
   */
  atualizarTabelaAposSalvar(tipo) {
    try {
      // Verificar se existem funções globais de carregamento
      switch (tipo) {
        case 'puxador':
          if (window.carregarPuxadores) {
            window.carregarPuxadores();
          } else if (window.inicializarCadastramento) {
            // Força recarregamento dos dados
            setTimeout(() => {
              const event = new CustomEvent('recarregarPuxadores');
              document.dispatchEvent(event);
            }, 100);
          }
          break;
          
        case 'trilho':
          if (window.carregarTrilhos) {
            window.carregarTrilhos();
          } else {
            setTimeout(() => {
              const event = new CustomEvent('recarregarTrilhos');
              document.dispatchEvent(event);
            }, 100);
          }
          break;
          
        case 'vidro':
          if (window.carregarVidros) {
            window.carregarVidros();
          } else {
            setTimeout(() => {
              const event = new CustomEvent('recarregarVidros');
              document.dispatchEvent(event);
            }, 100);
          }
          break;
      }
    } catch (error) {
      console.warn(`Erro ao atualizar tabela de ${tipo}:`, error);
    }
  }
}

/**
 * Factory para criar instância única
 */
export class CadastroModalFactory {
  static instance = null;
  static coordinator = null;

  /**
   * Obtém instância única do modal manager
   */
  static getInstance() {
    if (!this.instance) {
      this.instance = new CadastroModalManager();
      this.coordinator = new CadastroModalCoordinator(this.instance);
    }
    return this.instance;
  }

  /**
   * Obtém coordinator
   */
  static getCoordinator() {
    if (!this.coordinator) {
      this.getInstance(); // Cria ambos
    }
    return this.coordinator;
  }

  /**
   * Inicializa sistema completo
   */
  static async inicializar() {
    const manager = this.getInstance();
    const coordinator = this.getCoordinator();

    // Inicializar modal manager
    const inicializado = manager.inicializar();
    if (!inicializado) {
      return false;
    }

    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // Integrar com coordinator existente
    coordinator.integrarComCoordinator();

    // Configurar eventos de botões
    setTimeout(() => {
      this.configurarBotoesCadastro();
    }, 100);

    console.log('✅ Sistema de modal unificado inicializado');
    return true;
  }

  /**
   * Configura eventos dos botões de cadastro
   */
  static configurarBotoesCadastro() {
    const manager = this.getInstance();

    // Botão Novo Puxador
    const btnNovoPuxador = document.getElementById('btnNovoPuxador');
    if (btnNovoPuxador) {
      // Remover listeners existentes
      const novoBtn = btnNovoPuxador.cloneNode(true);
      btnNovoPuxador.parentNode.replaceChild(novoBtn, btnNovoPuxador);
      
      novoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (window.modalCoordinator && window.modalCoordinator.openModal) {
          window.modalCoordinator.openModal('puxador');
        } else {
          manager.abrirModal('puxador');
        }
      });
    }

    // Botão Novo Vidro
    const btnNovoVidro = document.getElementById('btnNovoVidro');
    if (btnNovoVidro) {
      // Remover listeners existentes
      const novoBtn = btnNovoVidro.cloneNode(true);
      btnNovoVidro.parentNode.replaceChild(novoBtn, btnNovoVidro);
      
      novoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (window.modalCoordinator && window.modalCoordinator.openModal) {
          window.modalCoordinator.openModal('vidro');
        } else {
          manager.abrirModal('vidro');
        }
      });
    }

    // Botão Novo Trilho
    const btnNovoTrilho = document.getElementById('btnNovoTrilho');
    if (btnNovoTrilho) {
      // Remover listeners existentes
      const novoBtn = btnNovoTrilho.cloneNode(true);
      btnNovoTrilho.parentNode.replaceChild(novoBtn, btnNovoTrilho);
      
      novoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (window.modalCoordinator && window.modalCoordinator.openModal) {
          window.modalCoordinator.openModal('trilho');
        } else {
          manager.abrirModal('trilho');
        }
      });
    }

    console.log('✅ Botões de cadastro configurados');
  }
}

// Expor para uso global
window.CadastroModalManager = CadastroModalManager;
window.CadastroModalFactory = CadastroModalFactory;