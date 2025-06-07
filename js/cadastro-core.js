/**
 * Módulo Core do Sistema de Cadastramento Unificado
 * Sistema de Portas e Perfis
 */

/**
 * Validações unificadas para formulários
 */
export const CadastroValidacao = {
  /**
   * Valida dados de puxador
   */
  validarPuxador(dados) {
    const erros = [];
    
    if (!dados.modelo?.trim()) {
      erros.push('Campo "Modelo" é obrigatório');
    }
    
    if (!dados.medida?.trim()) {
      erros.push('Campo "Medida" é obrigatório');
    }
    
    return {
      valido: erros.length === 0,
      erros
    };
  },

  /**
   * Valida dados de trilho
   */
  validarTrilho(dados) {
    const erros = [];
    
    if (!dados.nome?.trim()) {
      erros.push('Campo "Nome" é obrigatório');
    }
    
    return {
      valido: erros.length === 0,
      erros
    };
  },

  /**
   * Valida dados de vidro
   */
  validarVidro(dados) {
    const erros = [];
    
    if (!dados.tipo?.trim()) {
      erros.push('Campo "Tipo de Vidro" é obrigatório');
    }
    
    if (dados.rgb && !this.validarFormatoRGB(dados.rgb)) {
      erros.push('Formato RGB inválido. Use: R,G,B,A (ex: 255,0,0,0.5)');
    }
    
    return {
      valido: erros.length === 0,
      erros
    };
  },

  /**
   * Valida formato RGB
   */
  validarFormatoRGB(rgb) {
    if (!rgb) return true;
    const regex = /^\d{1,3},\d{1,3},\d{1,3},(0(\.\d+)?|1(\.0+)?)$/;
    return regex.test(rgb.trim());
  }
};

/**
 * Manipulação de formulários
 */
export const CadastroFormularios = {
  /**
   * Extrai dados do formulário baseado no tipo
   */
  extrairDados(tipo) {
    const dados = {};
    
    switch (tipo) {
      case 'puxador':
        dados.id = document.getElementById('itemId')?.value || '';
        dados.modelo = document.getElementById('itemModelo')?.value?.trim() || '';
        dados.fabricante = document.getElementById('itemFabricante')?.value?.trim() || '';
        dados.cor = document.getElementById('itemCor')?.value?.trim() || '';
        dados.medida = document.getElementById('itemMedida')?.value?.trim() || '';
        dados.foto = document.getElementById('itemFoto')?.files?.[0] || null;
        break;
        
      case 'trilho':
        dados.id = document.getElementById('itemId')?.value || '';
        dados.nome = document.getElementById('itemModelo')?.value?.trim() || '';
        dados.fabricante = document.getElementById('itemFabricante')?.value?.trim() || '';
        dados.cor = document.getElementById('itemCor')?.value?.trim() || '';
        dados.tipo = document.getElementById('itemMedida')?.value?.trim() || '';
        dados.foto = document.getElementById('itemFoto')?.files?.[0] || null;
        break;
        
      case 'vidro':
        dados.id = document.getElementById('itemId')?.value || '';
        dados.tipo = document.getElementById('itemModelo')?.value?.trim() || '';
        dados.rgb = document.getElementById('itemRgb')?.value?.trim() || '255,255,255,0.3';
        break;
    }
    
    return dados;
  },

  /**
   * Preenche formulário com dados
   */
  preencherFormulario(tipo, dados) {
    // Limpar formulário primeiro
    this.limparFormulario();
    
    switch (tipo) {
      case 'puxador':
        this.definirValor('itemId', dados.id);
        this.definirValor('itemModelo', dados.modelo);
        this.definirValor('itemFabricante', dados.fabricante);
        this.definirValor('itemCor', dados.cor);
        this.definirValor('itemMedida', dados.medida);
        break;
        
      case 'trilho':
        this.definirValor('itemId', dados.id);
        this.definirValor('itemModelo', dados.nome);
        this.definirValor('itemFabricante', dados.fabricante);
        this.definirValor('itemCor', dados.cor);
        this.definirValor('itemMedida', dados.tipo);
        break;
        
      case 'vidro':
        this.definirValor('itemId', dados.id);
        this.definirValor('itemModelo', dados.tipo);
        this.definirValor('itemRgb', dados.rgb);
        break;
    }
  },

  /**
   * Define valor de um campo
   */
  definirValor(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.value = valor || '';
    }
  },

  /**
   * Limpa formulário
   */
  limparFormulario() {
    const form = document.getElementById('formCadastro');
    if (form) {
      form.reset();
      form.classList.remove('was-validated');
    }
    
    // Limpar preview de imagem
    const previewContainer = document.getElementById('fotoPreviewContainer');
    if (previewContainer) {
      previewContainer.classList.add('d-none');
    }
  },

  /**
   * Configura campos específicos do tipo
   */
  configurarCamposPorTipo(tipo) {
    this.esconderTodosCampos();
    
    switch (tipo) {
      case 'puxador':
        this.configurarCamposPuxador();
        break;
      case 'trilho':
        this.configurarCamposTrilho();
        break;
      case 'vidro':
        this.configurarCamposVidro();
        break;
    }
  },

  /**
   * Esconde todos os campos opcionais
   */
  esconderTodosCampos() {
    const camposParaEsconder = [
      'itemFabricante', 'itemCor', 'itemMedida', 'itemFoto'
    ];
    
    camposParaEsconder.forEach(id => {
      const campo = document.getElementById(id);
      const container = campo?.closest('.mb-2') || campo?.closest('.mb-3') || campo?.closest('.form-group');
      if (container) {
        container.style.display = 'none';
      }
    });
  },

  /**
   * Configura campos para puxador
   */
  configurarCamposPuxador() {
    // Mostrar todos os campos para puxadores
    this.mostrarCampo('itemModelo', 'Modelo *');
    this.mostrarCampo('itemFabricante', 'Fabricante (opcional)');
    this.mostrarCampo('itemCor', 'Cor (opcional)');
    this.mostrarCampo('itemMedida', 'Medida *');
    this.mostrarCampo('itemFoto', 'Foto (opcional)');
    
    // Configurar campo medida como input
    this.converterParaInput('itemMedida');
  },

  /**
   * Configura campos para trilho
   */
  configurarCamposTrilho() {
    this.mostrarCampo('itemModelo', 'Nome *');
    this.mostrarCampo('itemFabricante', 'Fabricante (opcional)');
    this.mostrarCampo('itemCor', 'Cor (opcional)');
    this.mostrarCampo('itemMedida', 'Tipo (opcional)');
    this.mostrarCampo('itemFoto', 'Foto (opcional)');
    
    // Configurar campo medida como select
    this.converterParaSelect('itemMedida', [
      { value: '', text: 'Selecione o tipo (opcional)' },
      { value: 'Embutir', text: 'Embutir' },
      { value: 'Sobrepor', text: 'Sobrepor' }
    ]);
  },

  /**
   * Configura campos para vidro
   */
  configurarCamposVidro() {
    this.mostrarCampo('itemModelo', 'Tipo de Vidro *');
    
    // Adicionar campo RGB se não existir
    this.adicionarCampoRGB();
  },

  /**
   * Mostra um campo com label
   */
  mostrarCampo(id, labelText) {
    const campo = document.getElementById(id);
    const container = campo?.closest('.mb-2') || campo?.closest('.mb-3') || campo?.closest('.form-group');
    if (container) {
      container.style.display = '';
      
      // Atualizar label
      const label = container.querySelector('label');
      if (label && labelText) {
        label.textContent = labelText;
      }
    }
  },

  /**
   * Converte campo para input
   */
  converterParaInput(id) {
    const elemento = document.getElementById(id);
    if (elemento && elemento.tagName === 'SELECT') {
      const valor = elemento.value;
      const parent = elemento.parentNode;
      
      const input = document.createElement('input');
      input.type = 'text';
      input.id = id;
      input.name = elemento.name;
      input.className = elemento.className;
      input.required = elemento.required;
      input.value = valor;
      
      parent.replaceChild(input, elemento);
    }
  },

  /**
   * Converte campo para select
   */
  converterParaSelect(id, opcoes) {
    const elemento = document.getElementById(id);
    if (elemento && elemento.tagName === 'INPUT') {
      const valor = elemento.value;
      const parent = elemento.parentNode;
      
      const select = document.createElement('select');
      select.id = id;
      select.name = elemento.name;
      select.className = elemento.className;
      select.required = elemento.required;
      
      opcoes.forEach(opcao => {
        const option = document.createElement('option');
        option.value = opcao.value;
        option.textContent = opcao.text;
        select.appendChild(option);
      });
      
      select.value = valor;
      parent.replaceChild(select, elemento);
    }
  },

  /**
   * Adiciona campo RGB para vidros
   */
  adicionarCampoRGB() {
    const campoModelo = document.getElementById('itemModelo');
    const container = campoModelo?.closest('.mb-2') || campoModelo?.closest('.mb-3') || campoModelo?.closest('.form-group');
    
    if (!container) return;
    
    // Verificar se já existe
    if (document.getElementById('corPreviewContainer')) return;
    
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
      this.atualizarPreviewCor();
    }
  },

  /**
   * Atualiza preview de cor
   */
  atualizarPreviewCor() {
    const campoRgb = document.getElementById('itemRgb');
    const preview = document.getElementById('corPreview');
    
    if (!campoRgb || !preview) return;
    
    const valor = campoRgb.value.trim();
    const corCSS = CadastroUtils.rgbParaCSS(valor);
    preview.style.background = corCSS;
  }
};

/**
 * Gerenciamento de imagens
 */
export const CadastroImagens = {
  /**
   * Configura preview de imagem
   */
  configurarPreview() {
    const inputFoto = document.getElementById('itemFoto');
    if (inputFoto) {
      inputFoto.addEventListener('change', this.mostrarPrevia.bind(this));
      
      const btnRemover = document.getElementById('btnRemoverFoto');
      if (btnRemover) {
        btnRemover.addEventListener('click', this.removerFoto.bind(this));
      }
    }
  },

  /**
   * Mostra prévia da imagem
   */
  mostrarPrevia(event) {
    const preview = document.getElementById('fotoPreview');
    const previewContainer = document.getElementById('fotoPreviewContainer');
    const file = event.target.files[0];
    
    if (file) {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        if (preview) {
          preview.src = e.target.result;
        }
        if (previewContainer) {
          previewContainer.classList.remove('d-none');
        }
      };
      
      reader.readAsDataURL(file);
    } else {
      if (previewContainer) {
        previewContainer.classList.add('d-none');
      }
    }
  },

  /**
   * Remove foto selecionada
   */
  removerFoto() {
    const input = document.getElementById('itemFoto');
    const previewContainer = document.getElementById('fotoPreviewContainer');
    
    if (input) input.value = '';
    if (previewContainer) previewContainer.classList.add('d-none');
  }
};

/**
 * Gerenciamento de usuários e cache
 */
export const CadastroUsuarios = {
  cache: {
    dados: {},
    solicitacoes: {},
    tempoMaximo: 5 * 60 * 1000 // 5 minutos
  },

  /**
   * Adiciona usuário ao cache
   */
  adicionarCache(id, dados) {
    if (!id || !dados) return;
    this.cache.dados[id] = {
      ...dados,
      timestamp: Date.now()
    };
  },

  /**
   * Obtém usuário do cache
   */
  obterCache(id) {
    if (!id || !this.cache.dados[id]) return null;
    
    const item = this.cache.dados[id];
    const agora = Date.now();
    
    if (agora - item.timestamp > this.cache.tempoMaximo) {
      delete this.cache.dados[id];
      return null;
    }
    
    return item;
  },

  /**
   * Limpa cache
   */
  limparCache() {
    this.cache.dados = {};
    this.cache.solicitacoes = {};
  },

  /**
   * Obtém informações do usuário
   */
  async obterInfo(id_usuario) {
    if (!id_usuario) {
      return Promise.reject(new Error('ID de usuário inválido'));
    }
    
    // Verificar cache
    const dadosCache = this.obterCache(id_usuario);
    if (dadosCache) {
      return Promise.resolve(dadosCache);
    }
    
    // Verificar solicitação em andamento
    if (this.cache.solicitacoes[id_usuario]) {
      return this.cache.solicitacoes[id_usuario];
    }
    
    // Criar nova solicitação
    const promise = new Promise(async (resolve, reject) => {
      try {
        const supabaseClient = window.supabase || window.supabaseCliente;
        if (!supabaseClient) {
          throw new Error('Cliente Supabase não disponível');
        }
        
        const timeoutPromise = new Promise((_, rejeitar) => 
          setTimeout(() => rejeitar(new Error('Tempo limite excedido')), 5000)
        );
        
        const resultado = await Promise.race([
          supabaseClient.from('usuarios').select('id,nome,email').eq('id', id_usuario).single(),
          timeoutPromise
        ]);
        
        if (resultado.error) throw resultado.error;
        
        if (!resultado.data) {
          throw new Error('Usuário não encontrado');
        }
        
        const dados = {
          nome: resultado.data.nome || resultado.data.email || 'Usuário sem nome',
          email: resultado.data.email || ''
        };
        
        this.adicionarCache(id_usuario, dados);
        resolve(dados);
        
      } catch (error) {
        console.error(`Erro ao buscar usuário ${id_usuario}:`, error);
        resolve({
          nome: 'Erro: ' + (error.message || 'Falha ao carregar'),
          email: '',
          erro: true
        });
      } finally {
        delete this.cache.solicitacoes[id_usuario];
      }
    });
    
    this.cache.solicitacoes[id_usuario] = promise;
    return promise;
  },

  /**
   * Renderiza informações do usuário
   */
  async renderizar(elemento, id_usuario) {
    if (!elemento || !id_usuario) return;
    
    try {
      elemento.innerHTML = `<span class="loading-text">Carregando...</span>`;
      elemento.setAttribute('data-usuario-id', id_usuario);
      
      const info = await this.obterInfo(id_usuario);
      
      if (info.erro) {
        elemento.innerHTML = `<span class="text-danger" title="Tente novamente mais tarde">${info.nome}</span>`;
        
        const retryBtn = document.createElement('button');
        retryBtn.className = 'btn btn-link btn-sm px-1 py-0';
        retryBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i>';
        retryBtn.title = 'Tentar novamente';
        retryBtn.onclick = (e) => {
          e.stopPropagation();
          delete this.cache.dados[id_usuario];
          this.renderizar(elemento, id_usuario);
        };
        elemento.appendChild(retryBtn);
        return;
      }
      
      elemento.innerHTML = `<span title="${info.email || ''}">${info.nome}</span>`;
    } catch (error) {
      console.error('Erro ao renderizar informações do usuário:', error);
      elemento.innerHTML = `<span class="text-muted">Proprietário indisponível</span>`;
    }
  }
};

/**
 * Utilitários gerais
 */
export const CadastroUtils = {
  /**
   * Converte RGB string para CSS
   */
  rgbParaCSS(rgb) {
    if (!rgb || typeof rgb !== 'string') {
      return 'rgba(255,255,255,0.3)';
    }
    
    const partes = rgb.split(',');
    if (partes.length === 4) {
      return `rgba(${partes[0]},${partes[1]},${partes[2]},${partes[3]})`;
    }
    
    return 'rgba(255,255,255,0.3)';
  },

  /**
   * Formata data para exibição
   */
  formatarData(data) {
    if (!data) return '-';
    
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  },

  /**
   * Inicializa tooltips
   */
  inicializarTooltips() {
    setTimeout(() => {
      if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltipElements.forEach(el => {
          new bootstrap.Tooltip(el);
        });
      }
    }, 500);
  },

  /**
   * Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

/**
 * Sistema de notificações
 */
export const CadastroNotificacoes = {
  /**
   * Mostra notificação de sucesso
   */
  sucesso(mensagem) {
    this.mostrar(mensagem, 'success');
  },

  /**
   * Mostra notificação de erro
   */
  erro(mensagem) {
    this.mostrar(mensagem, 'error');
  },

  /**
   * Mostra notificação de aviso
   */
  aviso(mensagem) {
    this.mostrar(mensagem, 'warning');
  },

  /**
   * Mostra notificação de informação
   */
  info(mensagem) {
    this.mostrar(mensagem, 'info');
  },

  /**
   * Mostra notificação
   */
  mostrar(mensagem, tipo = 'info') {
    // Tentar usar o sistema de notificações existente
    if (window.mostrarNotificacao) {
      window.mostrarNotificacao(mensagem, tipo);
      return;
    }
    
    // Fallback para alert
    const tipoTexto = {
      success: 'SUCESSO',
      error: 'ERRO',
      warning: 'AVISO',
      info: 'INFO'
    }[tipo] || 'INFO';
    
    alert(`${tipoTexto}: ${mensagem}`);
  }
};

// Expor módulos globalmente para compatibilidade
window.CadastroValidacao = CadastroValidacao;
window.CadastroFormularios = CadastroFormularios;
window.CadastroImagens = CadastroImagens;
window.CadastroUsuarios = CadastroUsuarios;
window.CadastroUtils = CadastroUtils;
window.CadastroNotificacoes = CadastroNotificacoes;