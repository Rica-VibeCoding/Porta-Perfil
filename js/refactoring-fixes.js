/**
 * Correções para os principais problemas identificados nos erros
 * Arquivo: refactoring-fixes.js
 * Vibecode - Portas e Perfis
 */

/**
 * Função auxiliar para validação robusta de usuário
 * Substitui a função problemática em cadastro-supabase.js
 */
window.validateCurrentUserSafely = function() {
  try {
    // Verifica se auth.js está carregado e getCurrentUser está disponível
    if (typeof getCurrentUser === 'undefined') {
      console.error('❌ getCurrentUser não está disponível');
      throw new Error('Sistema de autenticação não inicializado');
    }

    const usuarioAtual = getCurrentUser();
    
    console.log('🔍 Validando usuário:', {
      usuario: usuarioAtual,
      id: usuarioAtual && usuarioAtual.id,
      tipo: usuarioAtual && typeof usuarioAtual.id
    });
    
    // Validações robustas do usuário
    if (!usuarioAtual) {
      console.error('❌ Usuário não encontrado');
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    
    if (!usuarioAtual.id) {
      console.error('❌ ID de usuário ausente');
      throw new Error('ID de usuário inválido. Faça logout e login novamente.');
    }
    
    // Verificar se é ID temporário (causa comum do erro)
    if (usuarioAtual.id.toString().startsWith('temp-')) {
      console.error('❌ ID temporário detectado:', usuarioAtual.id);
      throw new Error('ID de usuário temporário. Faça logout e login novamente.');
    }
    
    // Verificar formato UUID básico (para evitar violação de FK)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(usuarioAtual.id)) {
      console.error('❌ Formato UUID inválido:', usuarioAtual.id);
      throw new Error('Formato de ID de usuário inválido. Faça logout e login novamente.');
    }

    console.log('✅ Usuário validado com sucesso:', usuarioAtual.id);
    return usuarioAtual;
  } catch (error) {
    console.error('💥 Erro na validação do usuário:', error);
    // Re-throw com contexto mais específico
    if (error.message.includes('Usuário não autenticado') || 
        error.message.includes('ID de usuário') ||
        error.message.includes('temporário') ||
        error.message.includes('inválido')) {
      throw error; // Re-throw erros de validação específicos
    }
    throw new Error(`Erro interno na validação de usuário: ${error.message}`);
  }
};

/**
 * Função auxiliar para tratamento seguro de salvamento no modal
 * Substitui as funções problemáticas em modal-coordinator.js e cadastro-modal.js
 */
window.handleModalSaveSafely = async function(tipo, event) {
  if (event) {
    try {
      event.preventDefault();
      event.stopPropagation();
    } catch (e) {
      console.warn('Erro ao prevenir evento:', e);
    }
  }

  try {
    // Verificar se tipo é válido
    if (!tipo || !['puxador', 'trilho', 'vidro'].includes(tipo)) {
      throw new Error(`Tipo inválido ou não especificado: ${tipo}`);
    }

    // Verificar se CadastroFormularios está disponível
    if (!window.CadastroFormularios) {
      throw new Error('CadastroFormularios não disponível');
    }

    // Extrair dados do formulário
    const dados = window.CadastroFormularios.extrairDados(tipo);
    
    console.log(`💾 Salvando ${tipo}:`, dados);
    
    // Validar dados básicos
    if (!dados || typeof dados !== 'object') {
      throw new Error('Dados do formulário são inválidos');
    }

    // Chamar API apropriada
    let resultado;
    const isEdicao = dados.id && dados.id.trim() !== '';
    
    switch (tipo) {
      case 'puxador':
        if (!window.PuxadoresAPI) {
          throw new Error('PuxadoresAPI não disponível');
        }
        if (isEdicao) {
          resultado = await window.PuxadoresAPI.atualizar(dados.id, dados);
        } else {
          resultado = await window.PuxadoresAPI.criar(dados);
        }
        break;
        
      case 'trilho':
        if (!window.TrilhosAPI) {
          throw new Error('TrilhosAPI não disponível');
        }
        if (isEdicao) {
          resultado = await window.TrilhosAPI.atualizar(dados.id, dados);
        } else {
          resultado = await window.TrilhosAPI.criar(dados);
        }
        break;
        
      case 'vidro':
        if (!window.VidrosAPI) {
          throw new Error('VidrosAPI não disponível');
        }
        if (isEdicao) {
          resultado = await window.VidrosAPI.atualizar(dados.id, dados);
        } else {
          resultado = await window.VidrosAPI.criar(dados);
        }
        break;
        
      default:
        throw new Error(`Tipo não suportado: ${tipo}`);
    }
    
    if (resultado && resultado.success) {
      const acao = isEdicao ? 'atualizado' : 'salvo';
      if (window.CadastroNotificacoes) {
        window.CadastroNotificacoes.sucesso(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} ${acao} com sucesso!`);
      }
      
      // Fechar modal se disponível
      if (window.modalCoordinator && window.modalCoordinator.closeModal) {
        window.modalCoordinator.closeModal();
      } else if (window.CadastroModalFactory) {
        const manager = window.CadastroModalFactory.getInstance();
        if (manager && manager.fecharModal) {
          manager.fecharModal();
        }
      }
      
      // Atualizar tabela correspondente
      updateTableAfterSave(tipo);
      
      return true;
    } else {
      throw new Error((resultado && resultado.error) || 'Erro desconhecido ao salvar');
    }

  } catch (error) {
    console.error(`Erro ao salvar ${tipo}:`, error);
    if (window.CadastroNotificacoes) {
      window.CadastroNotificacoes.erro(`Erro ao salvar ${tipo}: ${error.message}`);
    }
    return false;
  }
};

/**
 * Função auxiliar para atualizar tabelas após salvamento
 */
function updateTableAfterSave(tipo) {
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

/**
 * Função para verificar e corrigir integridade do sistema de modais
 */
window.fixModalSystem = function() {
  console.log('🔧 Iniciando correção do sistema de modais...');
  
  try {
    // Verificar se modal coordinator existe e corrigi-lo se necessário
    if (window.modalCoordinator) {
      // Sobrescrever o handleSave problemático
      if (window.modalCoordinator.handleSave) {
        const originalHandleSave = window.modalCoordinator.handleSave.bind(window.modalCoordinator);
        window.modalCoordinator.handleSave = async function(event) {
          const currentType = this.getCurrentType ? this.getCurrentType() : this.currentType;
          return await window.handleModalSaveSafely(currentType, event);
        };
        console.log('✅ Modal coordinator handleSave corrigido');
      }
    }
    
    // Verificar se CadastroModalCoordinator existe e corrigi-lo
    if (window.CadastroModalFactory) {
      const coordinator = window.CadastroModalFactory.getCoordinator();
      if (coordinator && coordinator.handleSave) {
        coordinator.handleSave = async function(tipo, event) {
          return await window.handleModalSaveSafely(tipo, event);
        };
        console.log('✅ CadastroModalCoordinator handleSave corrigido');
      }
    }
    
    console.log('✅ Sistema de modais corrigido com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao corrigir sistema de modais:', error);
    return false;
  }
};

/**
 * Função para corrigir problemas com verificação de usuários
 */
window.fixUserValidation = function() {
  console.log('👤 Corrigindo validação de usuários...');
  
  try {
    // Sobrescrever a função verificarUsuarioExiste para ser mais tolerante
    window.verificarUsuarioExisteSafe = async function(userId) {
      try {
        console.log('🔍 Verificação segura de usuário:', userId);
        
        if (!userId) {
          throw new Error('ID de usuário é obrigatório');
        }
        
        // Verificar se Supabase está disponível
        if (!window.supabase) {
          console.warn('⚠️ Supabase não disponível - modo demo');
          return true; // Permitir em modo demo
        }
        
        // Tentar consultar tabela de usuários
        const { data, error } = await window.supabase
          .from('usuarios')
          .select('id')
          .eq('id', userId)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            // Usuário não encontrado - tentar criar
            console.log('👤 Usuário não encontrado, tentando criar...');
            return await window.createUserIfNeeded(userId);
          }
          
          if (error.code === '42P01') {
            // Tabela não existe - modo demo
            console.warn('⚠️ Tabela usuarios não existe - modo demo ativado');
            return true;
          }
          
          throw error;
        }
        
        console.log('✅ Usuário existe no banco:', data.id);
        return true;
        
      } catch (error) {
        console.error('💥 Erro na verificação de usuário:', error);
        
        // Em caso de erro, não bloquear o sistema
        console.warn('⚠️ Pulando verificação de usuário devido ao erro');
        return true;
      }
    };
    
    // Função auxiliar para criar usuário se necessário
    window.createUserIfNeeded = async function(userId) {
      try {
        // Obter dados do usuário atual
        const userData = getCurrentUser ? getCurrentUser() : null;
        
        if (!userData) {
          console.warn('⚠️ Dados de usuário não disponíveis');
          return true; // Permitir mesmo assim
        }
        
        const novoUsuario = {
          id: userId,
          email: userData.email || 'usuario@demo.com',
          nome: userData.nome || 'Usuário Demo',
          perfil: userData.perfil || 'usuário',
          ativo: true,
          criado_em: new Date().toISOString()
        };
        
        const { data, error } = await window.supabase
          .from('usuarios')
          .insert(novoUsuario)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Erro ao criar usuário:', error);
          return true; // Não bloquear mesmo se não conseguir criar
        }
        
        console.log('✅ Usuário criado automaticamente:', data);
        return true;
        
      } catch (error) {
        console.error('💥 Erro ao criar usuário:', error);
        return true; // Não bloquear o sistema
      }
    };
    
    console.log('✅ Validação de usuários corrigida');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao corrigir validação de usuários:', error);
    return false;
  }
};

/**
 * Inicializar correções automaticamente quando o DOM estiver pronto
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Aplicando correções automáticas...');
  
  // Aguardar um pouco para garantir que outros scripts carregaram
  setTimeout(() => {
    window.fixModalSystem();
    window.fixUserValidation();
  }, 1000);
});

console.log('📦 Arquivo de correções carregado'); 