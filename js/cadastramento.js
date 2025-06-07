/**
 * Módulo de Cadastramento Refatorado - Versão Unificada
 * Sistema de Portas e Perfis
 */

import { getCurrentUser, isCurrentUserAdmin } from './auth.js';
import { mostrarNotificacao } from './notifications.js';

// Importar módulos unificados
import { 
  CadastroValidacao,
  CadastroFormularios, 
  CadastroImagens, 
  CadastroUsuarios, 
  CadastroUtils, 
  CadastroNotificacoes 
} from './cadastro-core.js';

import { CadastroModalFactory } from './cadastro-modal.js';

import { 
  PuxadoresAPI, 
  TrilhosAPI, 
  VidrosAPI,
  inicializarSupabase
} from './cadastro-supabase.js';

// ========================================
// ESTADO GLOBAL DA APLICAÇÃO
// ========================================
const EstadoCadastramento = {
  inicializado: false,
  tabelasExistentes: {
    puxadores: true,
    trilhos: true,
    vidros: true
  },
  modalManager: null,
  itemAtual: null
};

// ========================================
// DADOS DEMO PARA FALLBACK
// ========================================
const DADOS_DEMO = {
  puxadores: [
    { 
      id: '1', 
      modelo: 'Cielo', 
      fabricante: 'Aluminium', 
      cor: 'Anodizado', 
      medida: '150mm',
      id_usuario: '00000000-0000-0000-0000-000000000001',
      foto: null,
      criado_em: new Date().toISOString() 
    },
    { 
      id: '2', 
      modelo: 'Luna', 
      fabricante: 'GlassFit', 
      cor: 'Preto', 
      medida: '300mm',
      id_usuario: '00000000-0000-0000-0000-000000000001',
      foto: null,
      criado_em: new Date().toISOString() 
    }
  ]
};

// ========================================
// FUNÇÕES PRINCIPAIS DE INICIALIZAÇÃO
// ========================================

/**
 * Função principal de inicialização
 */
export async function inicializarCadastramento() {
  console.log('🔵 Inicializando sistema de cadastramento unificado...');
  
  try {
    if (EstadoCadastramento.inicializado) {
      console.log('⚠️ Sistema já inicializado');
      return;
    }

    // Inicializar módulos base
    await inicializarModulosBase();
    
    // Configurar eventos
    configurarEventos();
    
    // Carregar dados iniciais
    await carregarDadosIniciais();
    
    EstadoCadastramento.inicializado = true;
    console.log('✅ Sistema de cadastramento inicializado com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar cadastramento:', error);
    CadastroNotificacoes.erro('Erro ao inicializar sistema de cadastramento');
  }
}

/**
 * Inicializa módulos base
 */
async function inicializarModulosBase() {
  // Inicializar Supabase
  inicializarSupabase();
  
  // Inicializar modal manager
  EstadoCadastramento.modalManager = await CadastroModalFactory.inicializar();
  
  // Configurar sistema de usuários
  configurarSistemaUsuarios();
}

/**
 * Configura sistema de usuários
 */
function configurarSistemaUsuarios() {
  // Adicionar usuário atual ao cache
  const usuarioAtual = getCurrentUser();
  if (usuarioAtual && usuarioAtual.id) {
    CadastroUsuarios.adicionarCache(usuarioAtual.id, {
      nome: usuarioAtual.nome || usuarioAtual.email,
      email: usuarioAtual.email
    });
  }
  
  // Pré-carregar usuários para cache
  CadastroUsuarios.obterInfo.bind(CadastroUsuarios);
}

/**
 * Configura eventos principais
 */
function configurarEventos() {
  // Modal de cadastramento principal
  const cadastramentoModal = document.getElementById('cadastramentoModal');
  if (cadastramentoModal) {
    cadastramentoModal.addEventListener('show.bs.modal', () => {
      carregarPuxadores();
    });
    
    cadastramentoModal.addEventListener('shown.bs.modal', () => {
      setTimeout(() => CadastroUtils.inicializarTooltips(), 500);
    });
  }
  
  // Abas específicas
  configurarEventosAbas();
  
  // Eventos personalizados para recarregar tabelas
  configurarEventosRecarregamento();
}

/**
 * Configura eventos de recarregamento de tabelas
 */
function configurarEventosRecarregamento() {
  document.addEventListener('recarregarPuxadores', () => {
    console.log('🔄 Recarregando puxadores via evento personalizado');
    carregarPuxadores();
  });
  
  document.addEventListener('recarregarTrilhos', () => {
    console.log('🔄 Recarregando trilhos via evento personalizado');
    carregarTrilhos();
  });
  
  document.addEventListener('recarregarVidros', () => {
    console.log('🔄 Recarregando vidros via evento personalizado');
    carregarVidros();
  });
}

/**
 * Configura eventos das abas
 */
function configurarEventosAbas() {
  // Aba Puxadores
  const puxadoresTab = document.getElementById('puxadores-tab');
  if (puxadoresTab) {
    puxadoresTab.addEventListener('shown.bs.tab', () => {
      carregarPuxadores();
    });
  }
  
  // Aba Vidros
  const vidrosTab = document.getElementById('vidros-tab');
  if (vidrosTab) {
    vidrosTab.addEventListener('shown.bs.tab', () => {
      carregarVidros();
    });
  }
  
  // Aba Trilhos
  const trilhosTab = document.getElementById('trilhos-tab');
  if (trilhosTab) {
    trilhosTab.addEventListener('shown.bs.tab', () => {
      carregarTrilhos();
    });
  }
}

/**
 * Carrega dados iniciais
 */
async function carregarDadosIniciais() {
  // Carregar puxadores se estiver na aba ativa
  const puxadoresTab = document.getElementById('puxadores-tab');
  if (puxadoresTab && puxadoresTab.classList.contains('active')) {
    await carregarPuxadores();
  }
  
  // Carregar trilhos para selects da interface principal
  await carregarTrilhosNoSelect();
}

// ========================================
// FUNÇÕES DE CARREGAMENTO DE DADOS
// ========================================

/**
 * Carrega puxadores
 */
async function carregarPuxadores() {
  try {
    console.log('🔍 Carregando puxadores...');
    
    const resultado = await PuxadoresAPI.listar();
    
    if (resultado.success) {
      const puxadores = resultado.data || [];
      renderizarTabelaPuxadores(puxadores);
    } else {
      console.warn('Erro ao carregar puxadores, usando dados demo');
      EstadoCadastramento.tabelasExistentes.puxadores = false;
      renderizarTabelaPuxadores(DADOS_DEMO.puxadores);
    }
    
  } catch (error) {
    console.error('Exceção ao carregar puxadores:', error);
    EstadoCadastramento.tabelasExistentes.puxadores = false;
    renderizarTabelaPuxadores(DADOS_DEMO.puxadores);
  }
}

/**
 * Carrega trilhos
 */
async function carregarTrilhos() {
  try {
    console.log('🔍 Carregando trilhos...');
    
    const resultado = await TrilhosAPI.listar();
    
    if (resultado.success) {
      const trilhos = resultado.data || [];
      renderizarTabelaTrilhos(trilhos);
    } else {
      console.warn('Erro ao carregar trilhos:', resultado.error);
      renderizarTabelaTrilhos([]);
    }
    
  } catch (error) {
    console.error('Exceção ao carregar trilhos:', error);
    renderizarTabelaTrilhos([]);
  }
}

/**
 * Carrega vidros
 */
async function carregarVidros() {
  try {
    console.log('🔍 Carregando vidros...');
    
    const resultado = await VidrosAPI.listar();
    
    if (resultado.success) {
      const vidros = resultado.data || [];
      renderizarTabelaVidros(vidros);
    } else {
      console.warn('Erro ao carregar vidros:', resultado.error);
      renderizarTabelaVidros([]);
    }
    
  } catch (error) {
    console.error('Exceção ao carregar vidros:', error);
    renderizarTabelaVidros([]);
  }
}

// ========================================
// FUNÇÕES DE RENDERIZAÇÃO
// ========================================

/**
 * Renderiza tabela de puxadores
 */
function renderizarTabelaPuxadores(puxadores) {
  const tbody = document.getElementById('tabelaPuxadores');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (!puxadores || puxadores.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center">Nenhum puxador cadastrado</td></tr>`;
    return;
  }
  
  puxadores.forEach((puxador, index) => {
    const tr = document.createElement('tr');
    tr.dataset.id = puxador.id;
    tr.setAttribute('tabindex', '0');
    tr.setAttribute('aria-rowindex', index + 1);
    
    // Preparar thumbnail da foto
    let thumbnailHtml = '<div class="text-center">Sem foto</div>';
    if (puxador.foto) {
      thumbnailHtml = `
        <img src="${puxador.foto}" 
             alt="Foto do puxador ${puxador.modelo}" 
             class="img-thumbnail" 
             style="max-height: 40px; max-width: 60px;"
             title="Clique para ampliar">
      `;
    }
    
    tr.innerHTML = `
      <td data-label="Modelo" title="${puxador.modelo || '-'}">${puxador.modelo || '-'}</td>
      <td data-label="Fabricante" title="${puxador.fabricante || '-'}">${puxador.fabricante || '-'}</td>
      <td data-label="Cor" title="${puxador.cor || '-'}">${puxador.cor || '-'}</td>
      <td data-label="Medida" title="${puxador.medida || '-'}">${puxador.medida || '-'}</td>
      <td data-label="Usuário" class="usuario-cell"></td>
      <td class="text-center" data-label="Foto">${thumbnailHtml}</td>
      <td class="text-end" data-label="Ações">
        <div class="btn-actions">
          <button type="button" class="btn btn-sm btn-outline-primary btn-editar" 
                  data-id="${puxador.id}" title="Editar puxador">
            <i class="bi bi-pencil"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger btn-excluir" 
                  data-id="${puxador.id}" title="Excluir puxador">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
    
    tbody.appendChild(tr);
    
    // Configurar eventos dos botões
    const btnEditar = tr.querySelector('.btn-editar');
    const btnExcluir = tr.querySelector('.btn-excluir');
    
    if (btnEditar) {
      btnEditar.addEventListener('click', () => editarPuxador(puxador.id));
    }
    
    if (btnExcluir) {
      btnExcluir.addEventListener('click', () => confirmarExclusaoPuxador(puxador.id, puxador.modelo));
    }
    
    // Renderizar informações do usuário
    const celulaUsuario = tr.querySelector('.usuario-cell');
    if (puxador.id_usuario && celulaUsuario) {
      CadastroUsuarios.renderizar(celulaUsuario, puxador.id_usuario);
    } else if (celulaUsuario) {
      celulaUsuario.innerHTML = '<span class="text-muted">Proprietário desconhecido</span>';
    }
  });
  
  CadastroUtils.inicializarTooltips();
}

/**
 * Renderiza tabela de trilhos
 */
function renderizarTabelaTrilhos(trilhos) {
  const tbody = document.getElementById('tabelaTrilhos');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (!trilhos || trilhos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">
          <i class="bi bi-dash-lg fs-1 d-block mb-2 opacity-50"></i>
          Nenhum trilho encontrado
        </td>
      </tr>
    `;
    return;
  }
  
  trilhos.forEach(trilho => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td data-label="Nome" title="${trilho.nome || '-'}">${trilho.nome || '-'}</td>
      <td data-label="Tipo" title="${trilho.tipo || '-'}">${trilho.tipo || '-'}</td>
      <td data-label="Fabricante" title="${trilho.fabricante || '-'}">${trilho.fabricante || '-'}</td>
      <td data-label="Cor" title="${trilho.cor || '-'}">${trilho.cor || '-'}</td>
      <td data-label="Usuário" class="usuario-cell"></td>
      <td data-label="Foto">
        ${trilho.foto ? 
          `<button class="btn btn-outline-primary btn-sm" onclick="visualizarImagemTrilho('${trilho.foto}', '${trilho.nome}')">
            <i class="bi bi-image"></i>
          </button>` : 
          `<span class="text-muted">Sem foto</span>`
        }
      </td>
      <td class="text-center" data-label="Ações">
        <button class="btn btn-outline-primary btn-sm me-1" onclick="editarTrilho('${trilho.id}')" title="Editar trilho">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-outline-danger btn-sm" onclick="confirmarExclusaoTrilho('${trilho.id}', '${trilho.nome}')" title="Excluir trilho">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    
    tbody.appendChild(row);
    
    // Renderizar informações do usuário
    const celulaUsuario = row.querySelector('.usuario-cell');
    if (trilho.id_usuario && celulaUsuario) {
      CadastroUsuarios.renderizar(celulaUsuario, trilho.id_usuario);
    } else if (celulaUsuario) {
      celulaUsuario.innerHTML = '<span class="text-muted">-</span>';
    }
  });
}

/**
 * Renderiza tabela de vidros
 */
function renderizarTabelaVidros(vidros) {
  const tbody = document.getElementById('tabelaVidros');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (!vidros || vidros.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-3">
          <i class="bi bi-inbox"></i> Nenhum vidro cadastrado
        </td>
      </tr>
    `;
    return;
  }
  
  vidros.forEach(vidro => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td title="${vidro.tipo}">${vidro.tipo}</td>
      <td>
        <div class="d-flex align-items-center">
          <div class="cor-preview me-2" style="
            width: 20px; 
            height: 20px; 
            background: ${CadastroUtils.rgbParaCSS(vidro.rgb)}; 
            border: 1px solid #ccc; 
            border-radius: 3px;
          "></div>
          <span style="font-family: monospace; font-size: 0.85em;">${vidro.rgb}</span>
        </div>
      </td>
      <td>${CadastroUtils.formatarData(vidro.criado_em)}</td>
      <td>
        <span class="badge ${vidro.ativo ? 'bg-success' : 'bg-secondary'}">
          ${vidro.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td>
        <div class="btn-actions">
          <button class="btn btn-sm btn-outline-primary" onclick="editarVidro('${vidro.id}')" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="confirmarExclusaoVidro('${vidro.id}', '${vidro.tipo}')" title="Excluir">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ========================================
// FUNÇÕES DE EDIÇÃO E EXCLUSÃO
// ========================================

/**
 * Edita puxador
 */
async function editarPuxador(id) {
  try {
    const puxador = await buscarPuxadorPorId(id);
    if (puxador) {
      EstadoCadastramento.itemAtual = puxador;
      if (window.modalCoordinator) {
        window.modalCoordinator.openModal('puxador', puxador);
      } else if (EstadoCadastramento.modalManager) {
        EstadoCadastramento.modalManager.abrirModal('puxador', puxador);
      }
    }
  } catch (error) {
    console.error('Erro ao editar puxador:', error);
    CadastroNotificacoes.erro('Erro ao editar puxador');
  }
}

/**
 * Confirma exclusão de puxador
 */
function confirmarExclusaoPuxador(id, modelo) {
  if (confirm(`Deseja realmente excluir o puxador "${modelo}"?`)) {
    excluirPuxador(id);
  }
}

/**
 * Exclui puxador
 */
async function excluirPuxador(id) {
  try {
    const resultado = await PuxadoresAPI.excluir(id);
    
    if (resultado.success) {
      CadastroNotificacoes.sucesso('Puxador excluído com sucesso!');
      await carregarPuxadores();
    } else {
      CadastroNotificacoes.erro('Erro ao excluir puxador: ' + resultado.error);
    }
    
  } catch (error) {
    console.error('Erro ao excluir puxador:', error);
    CadastroNotificacoes.erro('Erro ao excluir puxador');
  }
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Busca puxador por ID
 */
async function buscarPuxadorPorId(id) {
  try {
    const resultado = await PuxadoresAPI.listar();
    if (resultado.success) {
      return resultado.data.find(p => p.id === id);
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar puxador:', error);
    return null;
  }
}

/**
 * Carrega trilhos nos selects da interface principal
 */
async function carregarTrilhosNoSelect() {
  try {
    const resultado = await TrilhosAPI.listar();
    
    if (resultado.success && resultado.data && resultado.data.length > 0) {
      // Atualizar select de Modelo do Sistema Deslizante
      const modeloSelect = document.getElementById('modeloDeslizante');
      if (modeloSelect) {
        modeloSelect.innerHTML = '';
        resultado.data.forEach(trilho => {
          const option = document.createElement('option');
          option.value = trilho.nome;
          option.textContent = trilho.nome;
          modeloSelect.appendChild(option);
        });
      }
      
      console.log('✅ Modelos deslizantes atualizados:', resultado.data.length);
    }
    
  } catch (error) {
    console.error('Erro ao carregar trilhos nos selects:', error);
  }
}

// ========================================
// FUNÇÕES GLOBAIS PARA COMPATIBILIDADE
// ========================================

// Tornar funções específicas globais para uso em botões
window.editarTrilho = async function(id) {
  try {
    if (window.modalCoordinator) {
      // Buscar dados do trilho
      const resultado = await TrilhosAPI.listar();
      if (resultado.success) {
        const trilho = resultado.data.find(t => t.id === id);
        if (trilho) {
          window.modalCoordinator.openModal('trilho', trilho);
        }
      }
    }
  } catch (error) {
    console.error('Erro ao editar trilho:', error);
    CadastroNotificacoes.erro('Erro ao editar trilho');
  }
};

window.confirmarExclusaoTrilho = function(id, nome) {
  if (confirm(`Deseja realmente excluir o trilho "${nome}"?`)) {
    excluirTrilho(id);
  }
};

window.editarVidro = async function(id) {
  try {
    if (window.modalCoordinator) {
      const resultado = await VidrosAPI.listar();
      if (resultado.success) {
        const vidro = resultado.data.find(v => v.id === id);
        if (vidro) {
          window.modalCoordinator.openModal('vidro', vidro);
        }
      }
    }
  } catch (error) {
    console.error('Erro ao editar vidro:', error);
    CadastroNotificacoes.erro('Erro ao editar vidro');
  }
};

window.confirmarExclusaoVidro = function(id, tipo) {
  if (confirm(`Deseja realmente excluir o vidro "${tipo}"?`)) {
    excluirVidro(id);
  }
};

window.visualizarImagemTrilho = function(url, nome) {
  const modal = document.getElementById('imagemAmpliadaModal');
  if (modal) {
    document.getElementById('imagemAmpliada').src = url;
    document.getElementById('modeloPuxadorImagem').textContent = `Trilho ${nome}`;
    new bootstrap.Modal(modal).show();
  }
};

/**
 * Exclui trilho
 */
async function excluirTrilho(id) {
  try {
    const resultado = await TrilhosAPI.excluir(id);
    
    if (resultado.success) {
      CadastroNotificacoes.sucesso('Trilho excluído com sucesso!');
      await carregarTrilhos();
    } else {
      CadastroNotificacoes.erro('Erro ao excluir trilho: ' + resultado.error);
    }
    
  } catch (error) {
    console.error('Erro ao excluir trilho:', error);
    CadastroNotificacoes.erro('Erro ao excluir trilho');
  }
}

/**
 * Exclui vidro
 */
async function excluirVidro(id) {
  try {
    const resultado = await VidrosAPI.excluir(id);
    
    if (resultado.success) {
      CadastroNotificacoes.sucesso('Vidro excluído com sucesso!');
      await carregarVidros();
    } else {
      CadastroNotificacoes.erro('Erro ao excluir vidro: ' + resultado.error);
    }
    
  } catch (error) {
    console.error('Erro ao excluir vidro:', error);
    CadastroNotificacoes.erro('Erro ao excluir vidro');
  }
}

// ========================================
// EXPOSIÇÃO GLOBAL PARA MODAL COORDINATOR
// ========================================

// Expor funções de carregamento globalmente
window.carregarPuxadores = carregarPuxadores;
window.carregarTrilhos = carregarTrilhos;
window.carregarVidros = carregarVidros;