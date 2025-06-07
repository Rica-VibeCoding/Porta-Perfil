/**
 * Módulo Core de Vidros - Funcionalidades Básicas
 * Sistema de Portas e Perfis
 */

// Estado global do módulo de vidros
export const EstadoVidros = {
  vidroAtual: null,
  inicializado: false,
  elementos: {
    tabela: null,
    modal: null
  }
};

/**
 * Operações CRUD básicas
 */
export const VidrosAPI = {
  /**
   * Listar vidros ativos
   */
  async listar() {
    try {
      if (!window.supabaseCliente) {
        throw new Error('Cliente Supabase não disponível');
      }

      const { data, error } = await window.supabaseCliente.select('pv_vidro', {
        select: '*',
        eq: { 'ativo': true },
        order: 'tipo.asc'
      });

      if (error) throw error;
      
      console.log(`✅ ${data?.length || 0} vidros carregados`);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Erro ao listar vidros:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Criar novo vidro
   */
  async criar(dadosVidro) {
    try {
      if (!window.supabaseCliente) {
        throw new Error('Cliente Supabase não disponível');
      }

      // Validar dados obrigatórios
      if (!dadosVidro.tipo) {
        throw new Error('Tipo de vidro é obrigatório');
      }

      const novoVidro = {
        tipo: dadosVidro.tipo.trim(),
        rgb: dadosVidro.rgb || '255,255,255,0.3',
        ativo: true,
        criado_em: new Date().toISOString()
      };

      const { data, error } = await window.supabaseCliente.insert('pv_vidro', [novoVidro]);

      if (error) throw error;

      console.log('✅ Vidro criado:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Erro ao criar vidro:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Atualizar vidro existente
   */
  async atualizar(id, dadosVidro) {
    try {
      if (!window.supabaseCliente) {
        throw new Error('Cliente Supabase não disponível');
      }

      if (!id) {
        throw new Error('ID do vidro é obrigatório');
      }

      const atualizacao = {
        tipo: dadosVidro.tipo?.trim(),
        rgb: dadosVidro.rgb
      };

      // Remover campos undefined
      Object.keys(atualizacao).forEach(key => {
        if (atualizacao[key] === undefined) {
          delete atualizacao[key];
        }
      });

      const { data, error } = await window.supabaseCliente.update('pv_vidro', atualizacao, {
        eq: { 'id': id }
      });

      if (error) throw error;

      console.log('✅ Vidro atualizado:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Erro ao atualizar vidro:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Excluir vidro (soft delete)
   */
  async excluir(id) {
    try {
      if (!window.supabaseCliente) {
        throw new Error('Cliente Supabase não disponível');
      }

      if (!id) {
        throw new Error('ID do vidro é obrigatório');
      }

      const { data, error } = await window.supabaseCliente.update('pv_vidro', { ativo: false }, {
        eq: { 'id': id }
      });

      if (error) throw error;

      console.log('✅ Vidro excluído (soft delete):', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Erro ao excluir vidro:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Utilitários
 */
export const VidrosUtils = {
  /**
   * Formatar data para exibição
   */
  formatarData(dataString) {
    if (!dataString) return 'N/A';
    
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.warn('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  },

  /**
   * Validar RGB
   */
  validarRGB(rgb) {
    if (!rgb) return false;
    
    // Aceitar formato: r,g,b,a ou r,g,b
    const regex = /^\d{1,3},\d{1,3},\d{1,3}(,\d*\.?\d+)?$/;
    return regex.test(rgb);
  },

  /**
   * Normalizar RGB
   */
  normalizarRGB(rgb) {
    if (!rgb) return '255,255,255,0.3';
    
    // Se não tiver alpha, adicionar padrão
    if (!rgb.includes(',', rgb.lastIndexOf(','))) {
      return rgb + ',0.3';
    }
    
    return rgb;
  },

  /**
   * Converter RGB para CSS
   */
  rgbParaCSS(rgb) {
    if (!rgb) return 'rgba(255,255,255,0.3)';
    
    // Limpar string e detectar formato
    const rgbLimpo = rgb.trim();
    
    // Se já está em formato CSS, usar diretamente
    if (rgbLimpo.startsWith('rgba(') || rgbLimpo.startsWith('rgb(')) {
      return rgbLimpo;
    }
    
    // Tratar formato r,g,b,a
    const valores = rgbLimpo.split(',').map(v => v.trim());
    
    if (valores.length === 3) {
      return `rgb(${valores.join(',')})`;
    } else if (valores.length === 4) {
      return `rgba(${valores.join(',')})`;
    }
    
    return 'rgba(255,255,255,0.3)';
  }
};

/**
 * Sistema de notificações específico para vidros
 */
export const VidrosNotificacoes = {
  sucesso(mensagem) {
    if (window.mostrarNotificacao) {
      window.mostrarNotificacao(mensagem, 'success');
    } else {
      console.log('✅', mensagem);
    }
  },

  erro(mensagem) {
    if (window.mostrarNotificacao) {
      window.mostrarNotificacao(mensagem, 'error');
    } else {
      console.error('❌', mensagem);
    }
  },

  aviso(mensagem) {
    if (window.mostrarNotificacao) {
      window.mostrarNotificacao(mensagem, 'warning');
    } else {
      console.warn('⚠️', mensagem);
    }
  },

  info(mensagem) {
    if (window.mostrarNotificacao) {
      window.mostrarNotificacao(mensagem, 'info');
    } else {
      console.info('ℹ️', mensagem);
    }
  }
}; 