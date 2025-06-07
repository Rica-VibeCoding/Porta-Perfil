/**
 * Módulo de Interface de Usuário para Vidros
 * Sistema de Portas e Perfis
 */

import { EstadoVidros, VidrosAPI, VidrosUtils, VidrosNotificacoes } from './vidros-core.js';

/**
 * Renderização da tabela de vidros
 */
export const VidrosTabela = {
  /**
   * Renderizar tabela completa
   */
  renderizar(vidros) {
    const tabela = document.getElementById('tabelaVidros');
    if (!tabela) {
      console.warn('⚠️ Elemento tabelaVidros não encontrado');
      return;
    }

    tabela.innerHTML = '';

    if (!vidros || vidros.length === 0) {
      this.renderizarVazia(tabela);
      return;
    }

    vidros.forEach(vidro => {
      const linha = this.criarLinhaVidro(vidro);
      tabela.appendChild(linha);
    });
  },

  /**
   * Renderizar tabela vazia
   */
  renderizarVazia(tabela) {
    const linha = document.createElement('tr');
    linha.innerHTML = `
      <td colspan="5" class="text-center text-muted py-3">
        <i class="bi bi-inbox"></i> Nenhum vidro cadastrado
      </td>
    `;
    tabela.appendChild(linha);
  },

  /**
   * Criar linha individual do vidro
   */
  criarLinhaVidro(vidro) {
    const linha = document.createElement('tr');
    linha.innerHTML = `
      <td title="${vidro.tipo}">${vidro.tipo}</td>
      <td>
        <div class="d-flex align-items-center">
          <div class="cor-preview me-2" style="
            width: 20px; 
            height: 20px; 
            background: ${VidrosUtils.rgbParaCSS(vidro.rgb)}; 
            border: 1px solid #ccc; 
            border-radius: 3px;
          "></div>
          <span style="font-family: monospace; font-size: 0.85em;">${vidro.rgb}</span>
        </div>
      </td>
      <td>${VidrosUtils.formatarData(vidro.criado_em)}</td>
      <td>
        <span class="badge ${vidro.ativo ? 'bg-success' : 'bg-secondary'}">
          ${vidro.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td>
        <div class="btn-actions">
          <button class="btn btn-sm btn-outline-primary" onclick="VidrosControles.editar('${vidro.id}')" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="VidrosControles.confirmarExclusao('${vidro.id}', '${vidro.tipo}')" title="Excluir">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
    return linha;
  }
};

/**
 * Gerenciamento do formulário modal
 */
export const VidrosModal = {
  /**
   * Configurar modal para novo vidro
   */
  configurarNovo() {
    this.limparFormulario();
    this.configurarTitulo('Novo Vidro');
    this.mostrarCamposVidro();
    this.adicionarPreviewCor();
    EstadoVidros.vidroAtual = null;
  },

  /**
   * Configurar modal para edição
   */
  configurarEdicao(vidro) {
    this.limparFormulario();
    this.configurarTitulo('Editar Vidro');
    this.mostrarCamposVidro();
    this.preencherFormulario(vidro);
    this.adicionarPreviewCor();
    EstadoVidros.vidroAtual = vidro;
  },

  /**
   * Limpar formulário
   */
  limparFormulario() {
    const form = document.getElementById('formCadastro');
    if (form) {
      form.reset();
      form.noValidate = true;
      form.classList.remove('was-validated');
    }

    // Remover preview de cor anterior
    const previewExistente = document.getElementById('corPreviewContainer');
    if (previewExistente) {
      previewExistente.remove();
    }
  },

  /**
   * Configurar título do modal
   */
  configurarTitulo(titulo) {
    const modalTitle = document.getElementById('cadastroFormModalLabel');
    if (modalTitle) {
      modalTitle.textContent = titulo;
    }

    const formTitle = document.getElementById('tituloFormCadastro');
    if (formTitle) {
      formTitle.textContent = titulo;
    }
  },

  /**
   * Mostrar apenas campos relevantes para vidros
   */
  mostrarCamposVidro() {
    // Esconder campos não usados por vidros
    const camposParaEsconder = [
      'itemFabricante', 'itemMedida', 'itemFoto', 
      'itemCor', 'itemObservacoes'
    ];
    
    camposParaEsconder.forEach(id => {
      const campo = document.getElementById(id);
      const container = campo?.closest('.mb-3') || campo?.closest('.form-group');
      if (container) {
        container.style.display = 'none';
      }
    });

    // Mostrar e configurar campo do tipo de vidro
    const campoModelo = document.getElementById('itemModelo');
    const containerModelo = campoModelo?.closest('.mb-3') || campoModelo?.closest('.form-group');
    if (containerModelo) {
      containerModelo.style.display = '';
      
      // Alterar label para "Tipo de Vidro"
      const label = containerModelo.querySelector('label');
      if (label) {
        label.textContent = 'Tipo de Vidro *';
      }

      // Campo configurado
      if (campoModelo) {
        // Campo de tipo de vidro sem placeholder
      }
    }
  },

  /**
   * Preencher formulário com dados do vidro
   */
  preencherFormulario(vidro) {
    const campoTipo = document.getElementById('itemModelo');
    const campoRgb = document.getElementById('itemRgb');

    if (campoTipo) {
      campoTipo.value = vidro.tipo || '';
    }

    if (campoRgb) {
      campoRgb.value = vidro.rgb || '255,255,255,0.3';
    }
  },

  /**
   * Adicionar preview de cor
   */
  adicionarPreviewCor() {
    const campoModelo = document.getElementById('itemModelo');
    const container = campoModelo?.closest('.mb-3') || campoModelo?.closest('.form-group');
    
    if (!container) {
      return;
    }

    // Verificar se já existe
    if (document.getElementById('corPreviewContainer')) {
      return;
    }

    // Criar container do preview
    const previewContainer = document.createElement('div');
    previewContainer.id = 'corPreviewContainer';
    previewContainer.className = 'mt-2';
    previewContainer.innerHTML = `
      <label for="itemRgb" class="form-label">Cor RGB (opcional)</label>
      <div class="input-group">
        <input type="text" id="itemRgb" class="form-control form-control-sm" 
               value="255,255,255,0.3">
        <div class="input-group-text p-1">
          <div id="corPreview" style="
            width: 20px; 
            height: 20px; 
            border: 1px solid #ccc; 
            border-radius: 3px;
            background: rgba(255,255,255,0.3);
          "></div>
        </div>
      </div>
      <small class="form-text text-muted">Formato: R,G,B,A (ex: 255,0,0,0.5 para vermelho translúcido)</small>
    `;

    container.appendChild(previewContainer);

    // Configurar evento de atualização do preview
    const campoRgb = document.getElementById('itemRgb');
    if (campoRgb) {
      campoRgb.addEventListener('input', this.atualizarPreviewCor);
      // Atualizar preview inicial
      this.atualizarPreviewCor();
    }
  },

  /**
   * Atualizar preview de cor
   */
  atualizarPreviewCor() {
    const campoRgb = document.getElementById('itemRgb');
    const preview = document.getElementById('corPreview');
    
    if (!campoRgb || !preview) {
      return;
    }

    const valor = campoRgb.value.trim();
    const corCSS = VidrosUtils.rgbParaCSS(valor);
    preview.style.background = corCSS;
  }
};

/**
 * Controles e ações da interface
 */
export const VidrosControles = {
  /**
   * Carregar e exibir vidros
   */
  async carregar() {
    try {
      console.log('🔄 Carregando vidros...');
      
      const resultado = await VidrosAPI.listar();
      
      if (resultado.success) {
        VidrosTabela.renderizar(resultado.data);
      } else {
        VidrosNotificacoes.erro('Erro ao carregar vidros: ' + resultado.error);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar vidros:', error);
      VidrosNotificacoes.erro('Erro interno ao carregar vidros');
    }
  },

  /**
   * Abrir modal para novo vidro
   */
  abrirNovo() {
    VidrosModal.configurarNovo();
  },

  /**
   * Editar vidro existente
   */
  async editar(id) {
    try {
      const resultado = await VidrosAPI.listar();
      
      if (resultado.success) {
        const vidro = resultado.data.find(v => v.id === id);
        
        if (vidro) {
          VidrosModal.configurarEdicao(vidro);
          
          // Abrir modal via coordenador
          if (window.modalCoordinator) {
            window.modalCoordinator.openModal('vidro', vidro);
          }
        } else {
          VidrosNotificacoes.erro('Vidro não encontrado');
        }
      } else {
        VidrosNotificacoes.erro('Erro ao buscar vidro: ' + resultado.error);
      }
    } catch (error) {
      console.error('❌ Erro ao editar vidro:', error);
      VidrosNotificacoes.erro('Erro interno ao editar vidro');
    }
  },

  /**
   * Confirmar exclusão de vidro
   */
  confirmarExclusao(id, tipo) {
    const confirmacao = confirm(`Deseja realmente excluir o vidro "${tipo}"?`);
    
    if (confirmacao) {
      this.excluir(id);
    }
  },

  /**
   * Excluir vidro
   */
  async excluir(id) {
    try {
      const resultado = await VidrosAPI.excluir(id);
      
      if (resultado.success) {
        VidrosNotificacoes.sucesso('Vidro excluído com sucesso!');
        await this.carregar(); // Recarregar lista
      } else {
        VidrosNotificacoes.erro('Erro ao excluir vidro: ' + resultado.error);
      }
    } catch (error) {
      console.error('❌ Erro ao excluir vidro:', error);
      VidrosNotificacoes.erro('Erro interno ao excluir vidro');
    }
  }
};

// Expor globalmente para uso em onclick
window.VidrosControles = VidrosControles; 