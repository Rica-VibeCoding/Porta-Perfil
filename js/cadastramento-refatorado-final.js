/**
 * Módulo de Cadastramento Refatorado - Versão Final
 * Sistema de Portas e Perfis
 */

import { getCurrentUser } from './auth.js';
import { mostrarNotificacao } from './notifications.js';
import { 
    isCurrentUserAdmin,
    CadastroUsuarios, 
    CadastroUtils, 
    CadastroNotificacoes 
} from './cadastro-core.js';
import { cadastroModalManager } from './cadastro-modal.js';
import { 
    inicializarCadastroSupabase,
    PuxadoresAPI, 
    TrilhosAPI, 
    VidrosAPI, 
    UploadAPI,
    DadosDemo 
} from './cadastro-supabase.js';

// Estado da aplicação
const estadoCadastramento = {
    supabaseInicializado: false,
    tabelaPuxadoresInexistente: false,
    itemAtual: null,
    tipoAtual: null
};

/**
 * Inicializa o módulo de cadastramento refatorado
 */
export function inicializarCadastramento() {
    console.log('🔵 Inicializando módulo de cadastramento refatorado...');
    
    try {
        // Inicializar módulos
        estadoCadastramento.supabaseInicializado = inicializarCadastroSupabase();
        cadastroModalManager.inicializar();
        
        // Configurar handlers e eventos
        configurarHandlersModais();
        configurarEventosGerais();
        
        // Carregar dados iniciais
        CadastroUsuarios.carregarUsuariosParaCache();
        carregarTrilhosNoSelect();
        adicionarUsuarioAtualAoCache();
        
        console.log('✅ Módulo de cadastramento refatorado inicializado');
    } catch (error) {
        console.error('❌ Erro ao inicializar cadastramento:', error);
        CadastroNotificacoes.erro('Erro ao inicializar sistema');
    }
}

/**
 * Configura handlers dos modais
 */
function configurarHandlersModais() {
    cadastroModalManager.registrarHandlers('puxador', {
        save: salvarPuxador,
        open: abrirModalNovoPuxador,
        close: () => console.log('Modal puxador fechado'),
        delete: excluirPuxador
    });

    cadastroModalManager.registrarHandlers('trilho', {
        save: salvarTrilho,
        open: abrirModalNovoTrilho,
        close: () => console.log('Modal trilho fechado'),
        delete: excluirTrilho
    });

    cadastroModalManager.registrarHandlers('vidro', {
        save: salvarVidro,
        open: abrirModalNovoVidro,
        close: () => console.log('Modal vidro fechado'),
        delete: excluirVidro
    });
}

/**
 * Configura eventos gerais
 */
function configurarEventosGerais() {
    // Botões principais
    document.getElementById('btnNovoPuxador')?.addEventListener('click', () => {
        cadastroModalManager.abrirModal('puxador');
    });

    document.getElementById('btnNovoTrilho')?.addEventListener('click', () => {
        cadastroModalManager.abrirModal('trilho');
    });
    
    // Modal de cadastramento
    const cadastramentoModal = document.getElementById('cadastramentoModal');
    if (cadastramentoModal) {
        cadastramentoModal.addEventListener('show.bs.modal', carregarPuxadores);
        cadastramentoModal.addEventListener('shown.bs.modal', () => {
            setTimeout(() => CadastroUtils.inicializarTooltips(), 500);
        });
    }

    // Tabs
    document.getElementById('puxadores-tab')?.addEventListener('shown.bs.tab', carregarPuxadores);
    document.getElementById('trilhos-tab')?.addEventListener('shown.bs.tab', carregarTrilhos);
}

function adicionarUsuarioAtualAoCache() {
    const usuarioAtual = getCurrentUser();
    if (usuarioAtual?.id) {
        CadastroUsuarios.adicionarAoCache(usuarioAtual.id, {
            nome: usuarioAtual.nome || usuarioAtual.email,
            email: usuarioAtual.email
        });
    }
}

// =============================================
// CARREGAMENTO DE DADOS
// =============================================

async function carregarPuxadores() {
    try {
        console.log('🔍 Carregando puxadores...');
        
        if (!estadoCadastramento.supabaseInicializado) {
            renderizarTabelaPuxadores(DadosDemo.puxadores, true);
            return;
        }

        const resultado = await PuxadoresAPI.listar();
        
        if (resultado.success) {
            const dados = resultado.data.length > 0 ? resultado.data : DadosDemo.puxadores;
            renderizarTabelaPuxadores(dados, true);
        } else {
            console.error('Erro ao carregar puxadores:', resultado.error);
            if (resultado.error.includes('42P01')) {
                estadoCadastramento.tabelaPuxadoresInexistente = true;
            }
            renderizarTabelaPuxadores(DadosDemo.puxadores, true);
            CadastroNotificacoes.aviso('Usando dados de demonstração');
        }
    } catch (error) {
        console.error('Erro ao carregar puxadores:', error);
        renderizarTabelaPuxadores(DadosDemo.puxadores, true);
        CadastroNotificacoes.erro('Erro ao carregar dados');
    }
}

async function carregarTrilhos() {
    try {
        console.log('🔍 Carregando trilhos...');
        
        if (!estadoCadastramento.supabaseInicializado) {
            renderizarTabelaTrilhos(DadosDemo.trilhos, true);
            return;
        }

        const resultado = await TrilhosAPI.listar();
        
        if (resultado.success) {
            renderizarTabelaTrilhos(resultado.data || [], true);
        } else {
            console.error('Erro ao carregar trilhos:', resultado.error);
            renderizarTabelaTrilhos(DadosDemo.trilhos, true);
        }
    } catch (error) {
        console.error('Erro ao carregar trilhos:', error);
        renderizarTabelaTrilhos(DadosDemo.trilhos, true);
    }
}

function renderizarTabelaPuxadores(puxadores, isAdmin) {
    const tbody = document.getElementById('tabelaPuxadores');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (puxadores.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">Nenhum puxador cadastrado</td></tr>`;
        return;
    }
    
    puxadores.forEach((puxador) => {
        const tr = document.createElement('tr');
        tr.dataset.id = puxador.id;
        
        let thumbnailHtml = '<div class="text-center">Sem foto</div>';
        if (puxador.foto) {
            thumbnailHtml = `
                <img src="${puxador.foto}" 
                     alt="Foto do puxador ${puxador.modelo}" 
                     class="img-thumbnail" 
                     style="max-height: 40px; max-width: 60px;"
                     onclick="visualizarImagem('${puxador.foto}', 'Puxador ${puxador.modelo}')"
                     title="Clique para ampliar">
            `;
        }
        
        tr.innerHTML = `
            <td data-label="Modelo">${puxador.modelo || '-'}</td>
            <td data-label="Fabricante">${puxador.fabricante || '-'}</td>
            <td data-label="Cor">${puxador.cor || '-'}</td>
            <td data-label="Medida">${puxador.medida || '-'}</td>
            <td data-label="Usuário" id="usuario-${puxador.id}">Carregando...</td>
            <td class="text-center" data-label="Foto">${thumbnailHtml}</td>
            <td class="text-end" data-label="Ações">
                <button type="button" class="btn btn-sm btn-outline-primary me-1" onclick="editarPuxador('${puxador.id}')" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="confirmarExclusaoPuxador('${puxador.id}')" title="Excluir">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
        
        // Carregar info do usuário
        if (puxador.id_usuario) {
            const tdUsuario = document.getElementById(`usuario-${puxador.id}`);
            CadastroUsuarios.renderizarInfoUsuario(tdUsuario, puxador.id_usuario);
        } else {
            document.getElementById(`usuario-${puxador.id}`).innerHTML = '<span class="text-muted">-</span>';
        }
    });
    
    CadastroUtils.inicializarTooltips();
}

function renderizarTabelaTrilhos(trilhos, isAdmin) {
    const tbody = document.getElementById('tabelaTrilhos');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (trilhos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">Nenhum trilho cadastrado</td></tr>`;
        return;
    }
    
    trilhos.forEach((trilho) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Nome">${trilho.nome || '-'}</td>
            <td data-label="Tipo">${trilho.tipo || '-'}</td>
            <td data-label="Fabricante">${trilho.fabricante || '-'}</td>
            <td data-label="Cor">${trilho.cor || '-'}</td>
            <td data-label="Usuário" id="usuario-trilho-${trilho.id}">Carregando...</td>
            <td class="text-end" data-label="Ações">
                <button type="button" class="btn btn-sm btn-outline-primary me-1" onclick="editarTrilho('${trilho.id}')" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="confirmarExclusaoTrilho('${trilho.id}')" title="Excluir">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
        
        // Carregar info do usuário
        if (trilho.id_usuario) {
            const tdUsuario = document.getElementById(`usuario-trilho-${trilho.id}`);
            CadastroUsuarios.renderizarInfoUsuario(tdUsuario, trilho.id_usuario);
        }
    });
}

// =============================================
// FUNÇÕES DE MODAL
// =============================================

function abrirModalNovoPuxador() {
    estadoCadastramento.tipoAtual = 'puxador';
    estadoCadastramento.itemAtual = null;
}

function abrirModalNovoTrilho() {
    estadoCadastramento.tipoAtual = 'trilho';
    estadoCadastramento.itemAtual = null;
}

function abrirModalNovoVidro() {
    estadoCadastramento.tipoAtual = 'vidro';
    estadoCadastramento.itemAtual = null;
}

// =============================================
// FUNÇÕES DE EDIÇÃO
// =============================================

async function editarPuxador(id) {
    try {
        let puxador;
        
        if (estadoCadastramento.tabelaPuxadoresInexistente) {
            puxador = DadosDemo.puxadores.find(p => p.id === id);
        } else {
            const resultado = await PuxadoresAPI.buscarPorId(id);
            if (resultado.success) {
                puxador = resultado.data;
            } else {
                throw new Error(resultado.error);
            }
        }
        
        if (!puxador) throw new Error('Puxador não encontrado');
        
        estadoCadastramento.itemAtual = puxador;
        cadastroModalManager.abrirModal('puxador', { item: puxador });
    } catch (error) {
        CadastroNotificacoes.erro('Erro ao editar: ' + error.message);
    }
}

async function editarTrilho(id) {
    try {
        const resultado = await TrilhosAPI.buscarPorId(id);
        if (resultado.success) {
            estadoCadastramento.itemAtual = resultado.data;
            cadastroModalManager.abrirModal('trilho', { item: resultado.data });
        } else {
            throw new Error(resultado.error);
        }
    } catch (error) {
        CadastroNotificacoes.erro('Erro ao editar trilho: ' + error.message);
    }
}

async function confirmarExclusaoPuxador(id) {
    try {
        let puxador;
        
        if (estadoCadastramento.tabelaPuxadoresInexistente) {
            puxador = DadosDemo.puxadores.find(p => p.id === id);
        } else {
            const resultado = await PuxadoresAPI.buscarPorId(id);
            if (resultado.success) {
                puxador = resultado.data;
            }
        }
        
        const nome = puxador?.modelo || `ID: ${id}`;
        cadastroModalManager.abrirModalConfirmacao('puxador', { id, modelo: nome });
    } catch (error) {
        CadastroNotificacoes.erro('Erro ao confirmar exclusão');
    }
}

async function confirmarExclusaoTrilho(id) {
    try {
        const resultado = await TrilhosAPI.buscarPorId(id);
        const nome = resultado.success ? resultado.data.nome : `ID: ${id}`;
        cadastroModalManager.abrirModalConfirmacao('trilho', { id, modelo: nome });
    } catch (error) {
        CadastroNotificacoes.erro('Erro ao confirmar exclusão');
    }
}

// =============================================
// FUNÇÕES DE SALVAMENTO
// =============================================

async function salvarPuxador() {
    try {
        const id = document.getElementById('itemId').value;
        const modelo = document.getElementById('itemModelo').value;
        const fabricante = document.getElementById('itemFabricante').value;
        const cor = document.getElementById('itemCor').value;
        const medida = document.getElementById('itemMedida').value;
        const inputFoto = document.getElementById('itemFoto');
        
        if (!modelo || !medida) {
            CadastroNotificacoes.aviso('Modelo e Medida são obrigatórios');
            return false;
        }
        
        // Upload da foto se necessário
        let fotoUrl = estadoCadastramento.itemAtual?.foto || null;
        if (inputFoto.files?.[0]) {
            const resultado = await UploadAPI.uploadImagem(inputFoto.files[0], 'puxadores');
            if (resultado.success) {
                fotoUrl = resultado.url;
            }
        }
        
        const dados = {
            modelo, fabricante, cor, medida, foto: fotoUrl,
            id_usuario: estadoCadastramento.itemAtual?.id_usuario || "c2319b68-6e15-4798-aacb-ed840126241d"
        };
        
        let resultado;
        if (estadoCadastramento.tabelaPuxadoresInexistente) {
            resultado = { success: true };
            CadastroNotificacoes.sucesso(id ? 'Puxador atualizado (demo)!' : 'Puxador criado (demo)!');
        } else {
            resultado = id ? await PuxadoresAPI.atualizar(id, dados) : await PuxadoresAPI.criar(dados);
            if (resultado.success) {
                CadastroNotificacoes.sucesso(id ? 'Puxador atualizado!' : 'Puxador criado!');
            } else {
                throw new Error(resultado.error);
            }
        }
        
        carregarPuxadores();
        if (window.popularPuxadoresSelect) {
            await window.popularPuxadoresSelect();
        }
        
        return true;
    } catch (error) {
        CadastroNotificacoes.erro('Erro ao salvar: ' + error.message);
        return false;
    }
}

async function salvarTrilho() {
    try {
        const id = document.getElementById('itemId').value;
        const nome = document.getElementById('itemModelo').value;
        const fabricante = document.getElementById('itemFabricante').value;
        const cor = document.getElementById('itemCor').value;
        const tipo = document.getElementById('itemMedida').value;
        
        if (!nome) {
            CadastroNotificacoes.aviso('Nome é obrigatório');
            return false;
        }
        
        const dados = { nome, tipo, fabricante, cor };
        
        const resultado = id ? await TrilhosAPI.atualizar(id, dados) : await TrilhosAPI.criar(dados);
        
        if (resultado.success) {
            CadastroNotificacoes.sucesso(id ? 'Trilho atualizado!' : 'Trilho criado!');
            carregarTrilhos();
            carregarTrilhosNoSelect();
            return true;
        } else {
            throw new Error(resultado.error);
        }
    } catch (error) {
        CadastroNotificacoes.erro('Erro ao salvar trilho: ' + error.message);
        return false;
    }
}

async function salvarVidro() {
    try {
        const id = document.getElementById('itemId').value;
        const tipo = document.getElementById('itemModelo').value;
        
        if (!tipo) {
            CadastroNotificacoes.aviso('Tipo é obrigatório');
            return false;
        }
        
        const dados = { tipo, rgb: '255,255,255,0.3' };
        
        const resultado = id ? await VidrosAPI.atualizar(id, dados) : await VidrosAPI.criar(dados);
        
        if (resultado.success) {
            CadastroNotificacoes.sucesso(id ? 'Vidro atualizado!' : 'Vidro criado!');
            return true;
        } else {
            throw new Error(resultado.error);
        }
    } catch (error) {
        CadastroNotificacoes.erro('Erro ao salvar vidro: ' + error.message);
        return false;
    }
}

// =============================================
// FUNÇÕES DE EXCLUSÃO
// =============================================

async function excluirPuxador() {
    try {
        const id = document.getElementById('idPuxadorExclusao').value;
        
        let resultado;
        if (estadoCadastramento.tabelaPuxadoresInexistente) {
            resultado = { success: true };
            CadastroNotificacoes.sucesso('Puxador excluído (demo)!');
        } else {
            resultado = await PuxadoresAPI.excluir(id);
            if (resultado.success) {
                CadastroNotificacoes.sucesso('Puxador excluído!');
            } else {
                throw new Error(resultado.error);
            }
        }
        
        carregarPuxadores();
        if (window.popularPuxadoresSelect) {
            await window.popularPuxadoresSelect();
        }
    } catch (error) {
        CadastroNotificacoes.erro('Erro ao excluir: ' + error.message);
    }
}

async function excluirTrilho() {
    try {
        const id = document.getElementById('idPuxadorExclusao').value;
        
        const resultado = await TrilhosAPI.excluir(id);
        if (resultado.success) {
            CadastroNotificacoes.sucesso('Trilho excluído!');
            carregarTrilhos();
            carregarTrilhosNoSelect();
        } else {
            throw new Error(resultado.error);
        }
    } catch (error) {
        CadastroNotificacoes.erro('Erro ao excluir trilho: ' + error.message);
    }
}

async function excluirVidro() {
    try {
        const id = document.getElementById('idPuxadorExclusao').value;
        
        const resultado = await VidrosAPI.excluir(id);
        if (resultado.success) {
            CadastroNotificacoes.sucesso('Vidro excluído!');
        } else {
            throw new Error(resultado.error);
        }
    } catch (error) {
        CadastroNotificacoes.erro('Erro ao excluir vidro: ' + error.message);
    }
}

// =============================================
// FUNÇÕES AUXILIARES
// =============================================

async function carregarTrilhosNoSelect() {
    try {
        if (!estadoCadastramento.supabaseInicializado) return;
        
        const resultado = await TrilhosAPI.listar();
        if (!resultado.success) return;
        
        const modeloSelect = document.getElementById('modeloDeslizante');
        if (modeloSelect && resultado.data.length > 0) {
            modeloSelect.innerHTML = '';
            resultado.data.forEach(trilho => {
                const option = document.createElement('option');
                option.value = trilho.nome;
                option.textContent = trilho.nome;
                modeloSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar trilhos no select:', error);
    }
}

function visualizarImagem(url, titulo) {
    cadastroModalManager.visualizarImagem(url, titulo);
}

// Tornar funções globais para compatibilidade
window.editarPuxador = editarPuxador;
window.editarTrilho = editarTrilho;
window.confirmarExclusaoPuxador = confirmarExclusaoPuxador;
window.confirmarExclusaoTrilho = confirmarExclusaoTrilho;
window.visualizarImagem = visualizarImagem;