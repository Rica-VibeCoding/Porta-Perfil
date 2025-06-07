/**
 * Coordenador de Modal para Sistema de Cadastramento
 * Gerencia Puxadores, Trilhos e Vidros no mesmo modal
 * Sistema de Portas e Perfis
 */

class ModalCoordinator {
  constructor() {
    this.currentType = null; // 'puxador', 'trilho', 'vidro'
    this.modal = null;
    this.handlers = {
      puxador: {
        save: null,
        open: null,
        close: null
      },
      trilho: {
        save: null,
        open: null,
        close: null
      },
      vidro: {
        save: null,
        open: null,
        close: null
      }
    };
    this.initialized = false;
  }

  /**
   * Inicializa o coordenador
   */
  init() {
    if (this.initialized) return;

    const modalElement = document.getElementById('cadastroFormModal');
    if (!modalElement || !window.bootstrap) {
      console.warn('Modal de cadastro de formulário não encontrado');
      return false;
    }

    this.modal = new bootstrap.Modal(modalElement);
    this.setupEventListeners();
    this.initialized = true;

    // Integrar com o novo cadastro modal manager
    if (window.cadastroModalManager) {
      console.log('🔗 Integrando com Cadastro Modal Manager');
      this.integrarComCadastroModalManager();
    }

    console.log('✅ Modal Coordinator inicializado');
    return true;
  }

  /**
   * Integra com o novo cadastro modal manager
   */
  integrarComCadastroModalManager() {
    if (!window.cadastroModalManager) return;

    // Usar o novo gerenciador para operações de modal
    this.cadastroModalManager = window.cadastroModalManager;
    
    // Redirecionar operações para o novo gerenciador
    const originalOpenModal = this.openModal.bind(this);
    this.openModal = (type, data = {}) => {
      console.log(`🔄 Redirecionando abertura de modal ${type} para novo gerenciador`);
      return this.cadastroModalManager.abrirModal(type, data);
    };

    const originalCloseModal = this.closeModal.bind(this);
    this.closeModal = () => {
      console.log('🔄 Redirecionando fechamento para novo gerenciador');
      return this.cadastroModalManager.fecharModal();
    };
  }

  /**
   * Configura event listeners únicos
   */
  setupEventListeners() {
    // Se o cadastro modal manager estiver disponível, não configurar eventos duplicados
    if (window.cadastroModalManager) {
      console.log('⚠️ Cadastro Modal Manager detectado - pulando configuração de eventos duplicados');
      return;
    }

    const btnSalvar = document.getElementById('btnSalvarCadastro');
    const btnCancelar = document.querySelector('#cadastroFormModal [data-bs-dismiss="modal"]');
    const btnFechar = document.querySelector('#cadastroFormModal .btn-close');
    const modalElement = document.getElementById('cadastroFormModal');

    // Evento único para salvar
    if (btnSalvar) {
      btnSalvar.addEventListener('click', (e) => this.handleSave(e));
    }

    // Eventos únicos para cancelar/fechar - prevenindo conflitos
    if (btnCancelar && !btnCancelar.dataset.listenerAdded) {
      btnCancelar.addEventListener('click', (e) => this.handleClose(e));
      btnCancelar.dataset.listenerAdded = 'true';
    }

    if (btnFechar && !btnFechar.dataset.listenerAdded) {
      btnFechar.addEventListener('click', (e) => this.handleClose(e));
      btnFechar.dataset.listenerAdded = 'true';
    }

    // Evento de modal fechado
    if (modalElement && !modalElement.dataset.listenerAdded) {
      modalElement.addEventListener('hidden.bs.modal', () => this.handleModalHidden());
      modalElement.dataset.listenerAdded = 'true';
    }
  }

  /**
   * Registra handlers para um tipo específico
   */
  registerHandlers(type, handlers) {
    if (!['puxador', 'trilho', 'vidro'].includes(type)) {
      console.error(`Tipo inválido: ${type}`);
      return false;
    }

    this.handlers[type] = {
      save: handlers.save || null,
      open: handlers.open || null,
      close: handlers.close || null
    };

    console.log(`✅ Handlers registrados para: ${type}`);
    return true;
  }

  /**
   * Abre modal para um tipo específico
   */
  openModal(type, data = {}) {
    if (!this.initialized) {
      console.error('Modal Coordinator não inicializado');
      return false;
    }

    if (!['puxador', 'trilho', 'vidro'].includes(type)) {
      console.error(`Tipo inválido: ${type}`);
      return false;
    }

    // Limpar estado anterior
    this.closeCurrentType();
    
    // Definir tipo atual
    this.currentType = type;

    // Executar handler de abertura específico
    if (this.handlers[type].open) {
      try {
        this.handlers[type].open(data);
      } catch (error) {
        console.error(`Erro ao abrir modal ${type}:`, error);
        return false;
      }
    }

    // Abrir modal
    this.modal.show();

    console.log(`📋 Modal aberto para: ${type}`);
    return true;
  }

  /**
   * Fecha modal e limpa estado
   */
  closeModal() {
    if (!this.modal) return;

    this.closeCurrentType();
    this.modal.hide();
    this.currentType = null;

    console.log('✅ Modal fechado');
  }

  /**
   * Handler único para salvar
   */
  async handleSave(event) {
    if (!this.currentType) {
      console.warn('Nenhum tipo definido para salvar');
      return;
    }

    // Prevenir múltiplas execuções
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const handler = this.handlers[this.currentType].save;
    if (!handler) {
      console.error(`Handler de save não encontrado para: ${this.currentType}`);
      return;
    }

    try {
      const result = await handler(event);
      if (result === true) {
        // Sucesso - fechar modal
        this.closeModal();
        console.log(`✅ ${this.currentType} salvo com sucesso`);
      }
    } catch (error) {
      console.error(`Erro ao salvar ${this.currentType}:`, error);
    }
  }

  /**
   * Handler único para cancelar/fechar
   */
  handleClose(event) {
    if (!this.currentType) {
      this.closeModal();
      return;
    }

    const handler = this.handlers[this.currentType].close;
    if (handler) {
      try {
        handler(event);
      } catch (error) {
        console.error(`Erro ao fechar ${this.currentType}:`, error);
      }
    }

    this.closeModal();
  }

  /**
   * Handler para quando modal é fechado
   */
  handleModalHidden() {
    this.closeCurrentType();
    this.currentType = null;
    console.log('🔄 Modal limpo após fechamento');
  }

  /**
   * Fecha tipo atual sem fechar modal
   */
  closeCurrentType() {
    if (!this.currentType) return;

    const handler = this.handlers[this.currentType].close;
    if (handler) {
      try {
        handler();
      } catch (error) {
        console.error(`Erro ao limpar ${this.currentType}:`, error);
      }
    }
  }

  /**
   * Força fechamento do modal
   */
  forceClose() {
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

    this.handleModalHidden();
    console.log('🔧 Modal fechado forçadamente');
  }

  /**
   * Verifica se modal está aberto para um tipo específico
   */
  isOpenFor(type) {
    return this.currentType === type;
  }

  /**
   * Obtém tipo atual
   */
  getCurrentType() {
    return this.currentType;
  }
}

// Instância global do coordenador
const modalCoordinator = new ModalCoordinator();

// Expor globalmente
window.modalCoordinator = modalCoordinator;

export { modalCoordinator }; 