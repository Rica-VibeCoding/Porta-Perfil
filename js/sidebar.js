/**
 * Controle do sidebar para a aplicação Portas Perfis
 * Implementa as funcionalidades do accordion do Bootstrap 5
 */

import { obterConfiguracaoAtual, atualizarConfiguracao } from './initialize.js';
import { mostrarNotificacao } from './notifications.js';

class BootstrapSidebar {
  constructor() {
    this.sidebar = null;
    this.initialized = false;
    this.accordionItems = [];
  }

  /**
   * Inicializa o sidebar com Bootstrap 5
   */
  init() {
    if (this.initialized) {
      console.log('Sidebar já inicializado, ignorando inicialização duplicada');
      return true;
    }
    
    // Logs para depuração
    console.log('Inicializando sidebar Bootstrap...');
    
    // Obtém a referência ao sidebar
    this.sidebar = document.querySelector('.sidebar-bootstrap');
    if (!this.sidebar) {
      console.warn('Sidebar Bootstrap não encontrado no DOM (consulta por .sidebar-bootstrap)');
      
      // Tentativa alternativa - procurar pelo sidebar-wrapper ou accordion
      this.sidebar = document.querySelector('#sidebar-wrapper') || 
                    document.querySelector('.accordion') || 
                    document.querySelector('.offcanvas-body');
      
      if (!this.sidebar) {
        console.error('Não foi possível encontrar nenhum elemento de sidebar no DOM');
        // Não retornar, continuar para inicializar os manipuladores de evento
      }
      else {
        console.log('Sidebar encontrado usando seletor alternativo:', this.sidebar);
      }
    }
    
    // Verifica se o elemento 'desenho' existe, se não, cria-o
    this.verificarElementoDesenho();
    
    // Mesmo sem um sidebar válido, tenta inicializar os controles
    this.initEventHandlers();
    
    this.initialized = true;
    console.log('Sidebar Bootstrap inicializado com sucesso');
    return true;
  }
  
  /**
   * Verifica se o elemento de desenho existe e está estruturado corretamente
   */
  verificarElementoDesenho() {
    console.log('Verificando elemento de desenho a partir do sidebar...');
    const desenhoElement = document.getElementById('desenho');
    
    if (!desenhoElement) {
      console.warn('Elemento de desenho não encontrado, criando um novo');
      
      // Obtém o container canvas
      let canvasContainer = document.querySelector('.canvas-container');
      
      if (!canvasContainer) {
        console.error('Container de canvas não encontrado, tentando criar um');
        
        // Tentar criar o container de canvas
        const container = document.getElementById('container') || document.querySelector('.container');
        if (container) {
          console.log('Container principal encontrado, criando canvas-container');
          canvasContainer = document.createElement('div');
          canvasContainer.className = 'canvas-container';
          canvasContainer.innerHTML = '<div id="desenho" style="width:100%; height:100%; min-height:600px;"></div>';
          container.appendChild(canvasContainer);
          console.log('Canvas container e elemento de desenho criados');
          return;
        }
        else {
          // Tenta encontrar qualquer elemento válido para anexar o canvas
          const mainElement = document.querySelector('main') || document.body;
          console.warn('Container principal não encontrado, criando na main ou body');
          canvasContainer = document.createElement('div');
          canvasContainer.className = 'canvas-container';
          canvasContainer.innerHTML = '<div id="desenho" style="width:100%; height:100%; min-height:600px;"></div>';
          mainElement.appendChild(canvasContainer);
          console.log('Canvas container e elemento de desenho criados em elemento alternativo');
          return;
        }
      }
      
      // Limpa o container e cria um novo elemento de desenho com estilo explícito
      canvasContainer.innerHTML = '<div id="desenho" style="width:100%; height:100%; min-height:600px; position:relative;"></div>';
      
      console.log('Elemento de desenho criado com sucesso');
    }
    else {
      // Verificar se o desenho tem as propriedades corretas
      const styles = window.getComputedStyle(desenhoElement);
      
      // Garantir dimensões mínimas
      if (desenhoElement.offsetHeight < 100 || desenhoElement.offsetWidth < 100) {
        console.warn('Elemento de desenho com dimensões insuficientes, ajustando...');
        desenhoElement.style.width = '100%';
        desenhoElement.style.height = '100%';
        desenhoElement.style.minHeight = '600px';
        desenhoElement.style.position = 'relative';
      }
      
      console.log('Elemento de desenho encontrado e validado:', desenhoElement);
    }
  }
  
  /**
   * Inicializa os manipuladores de eventos
   */
  initEventHandlers() {
    // Inicializar manipulador de eventos para o modal de observações
    this.setupModalFocusManagement();
    
    // O Bootstrap 5 gerencia quase todos os eventos, mas podemos adicionar lógica personalizada aqui
    
    // Exemplo: Ao alternar uma seção, podemos atualizar o estado
    document.querySelectorAll('.accordion-button').forEach(button => {
      button.addEventListener('click', (e) => {
        // A lógica de alternância é gerenciada pelo Bootstrap
        // Podemos adicionar comportamento adicional aqui se necessário
      });
    });
    
    // Verificar o tipo de porta e controlar a exibição das seções específicas
    const funcaoPortaSelect = document.getElementById('funcaoPorta');
    if (funcaoPortaSelect) {
      funcaoPortaSelect.addEventListener('change', this.togglePortaType.bind(this));
      // Inicializar com o valor atual
      this.togglePortaType({ target: funcaoPortaSelect });
    }

    // Vibecode: Controle de visibilidade da imagem do puxador ao clicar no select
    const collapsePuxador = document.getElementById('collapsePuxador');
    const puxadorPreviewContainer = document.getElementById('puxador-preview-container');
    const puxadorModeloSelect = document.getElementById('puxadorModelo'); // O select do modelo

    if (collapsePuxador && puxadorPreviewContainer && puxadorModeloSelect) {
      // Esconder a imagem inicialmente (garantido pelo CSS, mas JS confirma)
      puxadorPreviewContainer.classList.add('d-none');

      // Evento para MOSTRAR a imagem: APENAS clique direto no select do modelo
      puxadorModeloSelect.addEventListener('mousedown', () => {
        puxadorPreviewContainer.classList.remove('d-none');
      });
      
      // Evento para ESCONDER a imagem: quando a seção Puxador for recolhida
      collapsePuxador.addEventListener('hide.bs.collapse', () => {
        puxadorPreviewContainer.classList.add('d-none');
      });

    } else {
      // Logs de aviso caso elementos não sejam encontrados
      if (!collapsePuxador) console.warn('Elemento #collapsePuxador não encontrado.');
      if (!puxadorPreviewContainer) console.warn('Elemento #puxador-preview-container não encontrado.');
      if (!puxadorModeloSelect) console.warn('Elemento #puxadorModelo não encontrado.');
    }
    // Fim - Vibecode: Controle de visibilidade da imagem do puxador
  }
  
  /**
   * Configura o gerenciamento de foco para o modal de observações
   * para evitar problemas de acessibilidade com aria-hidden
   */
  setupModalFocusManagement() {
    // Referência ao botão que abre o modal
    const btnAbrirObservacoes = document.getElementById('btnAbrirObservacoes');
    const observacoesModal = document.getElementById('observacoesModal');
    
    if (observacoesModal && btnAbrirObservacoes) {
      // Salvar o elemento que tinha o foco antes de abrir o modal
      let previousFocusElement = null;
      
      // Configurar MutationObserver para monitorar mudanças de atributos
      const modalObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'aria-hidden' && 
              observacoesModal.classList.contains('show')) {
            // Se o modal estiver visível, remover o atributo aria-hidden
            observacoesModal.removeAttribute('aria-hidden');
          }
        });
      });
      
      // Iniciar observação de mudanças de atributos
      modalObserver.observe(observacoesModal, { attributes: true });
      
      // Quando o modal é mostrado, registrar o elemento que tinha o foco
      observacoesModal.addEventListener('show.bs.modal', function () {
        previousFocusElement = document.activeElement;
        
        // Remover atributo aria-hidden para evitar problemas de acessibilidade
        observacoesModal.removeAttribute('aria-hidden');
        
        // Também verificar modal backdrop e remover aria-hidden se necessário
        setTimeout(() => {
          const modalBackdrop = document.querySelector('.modal-backdrop');
          if (modalBackdrop && modalBackdrop.hasAttribute('aria-hidden')) {
            modalBackdrop.removeAttribute('aria-hidden');
          }
        }, 50);
      });
      
      // Quando o modal estiver totalmente visível, focar no textarea
      observacoesModal.addEventListener('shown.bs.modal', function () {
        // Focar no textarea de observações
        const observacaoInput = document.getElementById('observacaoInput');
        if (observacaoInput) {
          observacaoInput.focus();
        }
      });
      
      // Quando o modal é fechado, restaurar o foco ao elemento anterior
      observacoesModal.addEventListener('hidden.bs.modal', function () {
        if (previousFocusElement) {
          previousFocusElement.focus();
        }
        else {
          // Se não houver elemento anterior com foco, voltar para o botão que abriu o modal
          btnAbrirObservacoes.focus();
        }
      });
      
      // Configurar botão de salvar observações para fechar o modal e gerenciar o foco
      const btnSalvarObservacoes = document.getElementById('btnSalvarObservacoes');
      if (btnSalvarObservacoes) {
        btnSalvarObservacoes.addEventListener('click', function () {
          // Salvar o conteúdo do textarea
          const observacaoInput = document.getElementById('observacaoInput');
          if (observacaoInput) {
            try {
              // Salvar na configuração atual
              const config = obterConfiguracaoAtual();
              config.observacao = observacaoInput.value;
              
              atualizarConfiguracao(config);
              console.log('Observações salvas na configuração atual');
              
              // Mostrar notificação de sucesso
              mostrarNotificacao('Observações salvas com sucesso');
            }
            catch (e) {
              console.warn('Erro ao salvar observações:', e);
            }
          }
          
          // Usar o método bootstrap para fechar o modal
          const modalInstance = bootstrap.Modal.getInstance(observacoesModal);
          if (modalInstance) {
            modalInstance.hide();
          }
        });
      }
    }
  }
  
  /**
   * Alterna a exibição das seções específicas com base no tipo de porta
   * @param {Event} event - O evento de mudança
   */
  togglePortaType(event) {
    const value = event.target.value;
    let sectionDobradicas = document.getElementById('sectionDobradicas');
    let sectionDeslizante = document.getElementById('sectionDeslizante');
    
    // Verificar se as seções existem no DOM
    const collapseFuncao = document.getElementById('collapseFuncao');
    const collapseDobradicas = document.getElementById('collapseDobradicas');
    
    // Se a seção de dobradiças não existir, vamos procurá-la ou criá-la em outra parte do DOM
    if (!sectionDobradicas) {
      // Procurar em outras possíveis localizações
      sectionDobradicas = document.getElementById('dobradicasCampos')?.parentElement || 
                         document.getElementById('collapseDobradicas');
                         
      if (!sectionDobradicas && collapseDobradicas) {
        // A seção existe no accordion mas o ID está diferente
        sectionDobradicas = collapseDobradicas;
      }
    }
    
    // Se a seção deslizante não existir, vamos procurá-la ou criá-la
    if (!sectionDeslizante && collapseFuncao) {
      // Tentar encontrar a div que contém os campos específicos da porta deslizante
      const deslizanteFields = Array.from(collapseFuncao.querySelectorAll('.mb-3')).find(
        div => div.querySelector('#modeloDeslizante') || div.querySelector('#trilhoDeslizante')
      );
      
      if (deslizanteFields) {
        sectionDeslizante = deslizanteFields.parentElement;
      } else {
        // Se a seção não existe, podemos usar o próprio accordion item como referência
        const accordionDeslizante = document.querySelector('.accordion-item:has(#modeloDeslizante)');
        if (accordionDeslizante) {
          sectionDeslizante = accordionDeslizante;
        }
      }
    }
    
    // Se ainda não encontramos as seções, registrar isso sem exibir um aviso
    if (!sectionDobradicas || !sectionDeslizante) {
      console.log('Algumas seções específicas de porta não foram encontradas. A interface pode não mostrar corretamente as opções específicas.');
      
      // Podemos tentar alternativas para que o código não falhe completamente
      // Por exemplo, verificar visibilidade do accordion inteiro
      if (value === 'deslizante') {
        // Mostrar accordion de dobradiças fechado quando for deslizante
        const dobradicasAccordion = document.querySelector('#headingDobradicas button');
        if (dobradicasAccordion && dobradicasAccordion.getAttribute('aria-expanded') === 'true') {
          dobradicasAccordion.click(); // Fecha o accordion
        }
      }
      
      return;
    }
    
    // Controlar a visibilidade com base no tipo de porta
    if (value === 'deslizante') {
      if (sectionDobradicas && sectionDobradicas.style) {
        sectionDobradicas.style.display = 'none';
      } else if (collapseDobradicas) {
        collapseDobradicas.classList.add('collapse');
      }
      
      if (sectionDeslizante && sectionDeslizante.style) {
        sectionDeslizante.style.display = 'block';
      }
    } else {
      if (sectionDobradicas && sectionDobradicas.style) {
        sectionDobradicas.style.display = 'block';
      } else if (collapseDobradicas) {
        collapseDobradicas.classList.remove('collapse');
      }
      
      if (sectionDeslizante && sectionDeslizante.style) {
        sectionDeslizante.style.display = 'none';
      }
    }
  }
  
  /**
   * Abre uma seção específica do accordion pelo ID
   * @param {string} sectionId - ID da seção a ser aberta
   */
  openSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) {
      return;
    }
    
    const accordion = bootstrap.Collapse.getInstance(section);
    if (accordion) {
      accordion.show();
    }
    else {
      new bootstrap.Collapse(section, { toggle: true });
    }
  }
  
  /**
   * Fecha uma seção específica do accordion pelo ID
   * @param {string} sectionId - ID da seção a ser fechada
   */
  closeSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) {
      return;
    }
    
    const accordion = bootstrap.Collapse.getInstance(section);
    if (accordion) {
      accordion.hide();
    }
    else {
      new bootstrap.Collapse(section, { toggle: false });
    }
  }
}

// Criar instância única para exportação
const sidebarInstance = new BootstrapSidebar();

// Atribuir ao objeto window para compatibilidade com código não-modular
if (typeof window !== 'undefined') {
  // No ambiente do navegador, adicionar ao objeto window
  window.sidebarInstance = sidebarInstance;
  
  // Certificar-se de que a instância é inicializada quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!sidebarInstance.initialized) {
        setTimeout(() => {
          sidebarInstance.init();
          console.log('Sidebar inicializado via DOM loading event');
        }, 100);
      }
    });
  }
  else {
    // O DOM já está pronto
    if (!sidebarInstance.initialized) {
      setTimeout(() => {
        sidebarInstance.init();
        console.log('Sidebar inicializado diretamente (DOM já carregado)');
      }, 100);
    }
  }
}

// Exportar a instância para uso como módulo ES6
export { sidebarInstance }; 