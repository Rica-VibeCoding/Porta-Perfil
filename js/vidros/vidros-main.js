/**
 * Módulo Principal de Vidros - Integração com Cadastro Unificado
 * Sistema de Portas e Perfis
 */

import { EstadoVidros, VidrosAPI, VidrosNotificacoes } from './vidros-core.js';
import { VidrosTabela, VidrosModal, VidrosControles } from './vidros-ui.js';
import { CadastroNotificacoes } from '../cadastro-core.js';
import { VidrosAPI as UnifiedVidrosAPI } from '../cadastro-supabase.js';

/**
 * Handlers para o Modal Coordinator - Integrado com sistema unificado
 */
const VidrosHandlers = {
  /**
   * Handler para salvar vidro
   */
  async salvar(event) {
    try {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }

      // Obter dados do formulário
      const campoTipo = document.getElementById('itemModelo');
      const campoRgb = document.getElementById('itemRgb');
      
      if (!campoTipo) {
        CadastroNotificacoes.erro('Campo tipo não encontrado');
        return false;
      }

      const tipo = campoTipo.value?.trim();
      const rgb = campoRgb?.value?.trim() || '255,255,255,0.3';

      // Validar dados
      if (!tipo) {
        CadastroNotificacoes.aviso('Campo "Tipo de Vidro" é obrigatório');
        campoTipo.focus();
        return false;
      }

      const dadosVidro = { tipo, rgb };

      // Verificar se é edição ou criação
      const vidroAtual = EstadoVidros.vidroAtual;
      let resultado;

      if (vidroAtual && vidroAtual.id) {
        // Edição usando API unificada
        resultado = await UnifiedVidrosAPI.atualizar(vidroAtual.id, dadosVidro);
      } else {
        // Criação usando API unificada
        resultado = await UnifiedVidrosAPI.criar(dadosVidro);
      }

      if (resultado.success) {
        const acao = vidroAtual ? 'atualizado' : 'criado';
        CadastroNotificacoes.sucesso(`Vidro ${acao} com sucesso!`);
        
        // Recarregar lista
        await VidrosControles.carregar();
        
        // Atualizar select de vidros na interface principal
        if (window.atualizarSelectVidros) {
          await window.atualizarSelectVidros();
        }
        
        return true; // Sinaliza sucesso para o coordenador fechar modal
      } else {
        CadastroNotificacoes.erro(resultado.error || 'Erro ao salvar vidro');
        return false;
      }

    } catch (error) {
      console.error('❌ Erro ao salvar vidro:', error);
      CadastroNotificacoes.erro('Erro interno ao salvar vidro');
      return false;
    }
  },

  /**
   * Handler para abrir modal
   */
  abrir(data = {}) {
    try {
      if (data && data.id) {
        // Edição
        VidrosModal.configurarEdicao(data);
      } else {
        // Novo
        VidrosModal.configurarNovo();
      }
      
      console.log('📋 Modal de vidro configurado');
    } catch (error) {
      console.error('❌ Erro ao abrir modal de vidro:', error);
      throw error;
    }
  },

  /**
   * Handler para fechar modal
   */
  fechar() {
    try {
      VidrosModal.limparFormulario();
      EstadoVidros.vidroAtual = null;
      console.log('✅ Modal de vidro fechado');
    } catch (error) {
      console.error('❌ Erro ao fechar modal de vidro:', error);
    }
  }
};

/**
 * Inicialização do sistema de vidros integrado
 */
export async function inicializarVidros() {
  try {
    console.log('🔄 Inicializando Sistema de Vidros integrado...');

    // Aguardar DOM
    await aguardarDOM();
    
    // Registrar handlers no cadastro modal manager (novo sistema)
    if (window.cadastroModalManager) {
      window.cadastroModalManager.registrarHandlers('vidro', {
        save: VidrosHandlers.salvar,
        open: VidrosHandlers.abrir,
        close: VidrosHandlers.fechar
      });
      console.log('✅ Handlers de vidros registrados no Cadastro Modal Manager');
    } 
    // Fallback para modal coordinator antigo
    else if (window.modalCoordinator) {
      window.modalCoordinator.registerHandlers('vidro', {
        save: VidrosHandlers.salvar,
        open: VidrosHandlers.abrir,
        close: VidrosHandlers.fechar
      });
      console.log('✅ Handlers de vidros registrados no Modal Coordinator (fallback)');
    } else {
      console.warn('⚠️ Nenhum sistema de modal disponível');
    }
    
    // Aguardar Supabase
    await aguardarSupabase();

    // Configurar eventos
    configurarEventos();

    // Carregar dados se a aba estiver ativa
    const vidrosTab = document.getElementById('vidros-tab');
    if (vidrosTab && vidrosTab.classList.contains('active')) {
      await VidrosControles.carregar();
    }

    // Marcar como inicializado
    EstadoVidros.inicializado = true;

    console.log('✅ Sistema de Vidros integrado inicializado com sucesso');
    
    // Expor para depuração
    window.VidrosSistema = {
      carregar: VidrosControles.carregar,
      criar: (dados) => UnifiedVidrosAPI.criar(dados),
      editar: VidrosControles.editar,
      excluir: VidrosControles.excluir,
      estado: EstadoVidros
    };

  } catch (error) {
    console.error('❌ Erro ao inicializar Sistema de Vidros:', error);
    CadastroNotificacoes.erro('Erro ao inicializar sistema de vidros');
  }
}

/**
 * Aguardar DOM estar pronto
 */
function aguardarDOM() {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });
}

/**
 * Aguardar Supabase estar disponível
 */
function aguardarSupabase() {
  return new Promise((resolve) => {
    const verificar = () => {
      if (window.supabaseCliente) {
        resolve();
      } else {
        setTimeout(verificar, 100);
      }
    };
    verificar();
  });
}

/**
 * Configurar eventos específicos do módulo
 */
function configurarEventos() {
  // Evento da aba de vidros
  const vidrosTab = document.getElementById('vidros-tab');
  if (vidrosTab) {
    vidrosTab.addEventListener('shown.bs.tab', () => {
      VidrosControles.carregar();
    });
  }

  // Botão Novo Vidro
  const btnNovoVidro = document.getElementById('btnNovoVidro');
  if (btnNovoVidro) {
    btnNovoVidro.addEventListener('click', () => {
      if (window.cadastroModalManager) {
        window.cadastroModalManager.abrirModal('vidro');
      } else if (window.modalCoordinator) {
        window.modalCoordinator.openModal('vidro');
      } else {
        VidrosControles.abrirNovo();
      }
    });
  }

  console.log('✅ Eventos de vidros configurados');
} 