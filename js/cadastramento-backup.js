/**
 * Módulo de Cadastramento Refatorado
 * Gerencia o cadastramento de itens (puxadores, trilhos, vidros)
 * Agora usando arquitetura modular
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
    tipoAtual: null // 'puxador', 'trilho', 'vidro'
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
        
        // Configurar handlers dos modais
        configurarHandlersModais();
        
        // Configurar eventos gerais
        configurarEventosGerais();
        
        // Carregar cache de usuários
        CadastroUsuarios.carregarUsuariosParaCache();
        
        // Carregar trilhos nos selects
        carregarTrilhosNoSelect();
        
        // Adicionar usuário atual ao cache
        adicionarUsuarioAtualAoCache();
        
        console.log('✅ Módulo de cadastramento refatorado inicializado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao inicializar cadastramento:', error);
        CadastroNotificacoes.erro('Erro ao inicializar sistema de cadastramento');
    }
}

/**
 * Configura handlers dos modais
 */
function configurarHandlersModais() {
    // Registrar handlers para puxadores
    cadastroModalManager.registrarHandlers('puxador', {
        save: salvarPuxador,
        open: abrirModalNovoPuxador,
        close: () => console.log('Modal puxador fechado'),
        delete: excluirPuxador
    });

    // Registrar handlers para trilhos
    cadastroModalManager.registrarHandlers('trilho', {
        save: salvarTrilho,
        open: abrirModalNovoTrilho,
        close: () => console.log('Modal trilho fechado'),
        delete: excluirTrilho
    });

    // Registrar handlers para vidros
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
    // Botão novo puxador
    const btnNovoPuxador = document.getElementById('btnNovoPuxador');
    if (btnNovoPuxador) {
        btnNovoPuxador.addEventListener('click', () => {
            cadastroModalManager.abrirModal('puxador');
        });
    }

    // Botão novo trilho
    const btnNovoTrilho = document.getElementById('btnNovoTrilho');
    if (btnNovoTrilho) {
        btnNovoTrilho.addEventListener('click', () => {
            cadastroModalManager.abrirModal('trilho');
        });
    }
    
    // Modal de cadastramento
    const cadastramentoModal = document.getElementById('cadastramentoModal');
    if (cadastramentoModal) {
        cadastramentoModal.addEventListener('show.bs.modal', () => {
            carregarPuxadores();
        });

        cadastramentoModal.addEventListener('shown.bs.modal', () => {
            setTimeout(() => CadastroUtils.inicializarTooltips(), 500);
        });
    }

    // Tabs
    configurarEventosTabs();
}

/**
 * Configura eventos das tabs
 */
function configurarEventosTabs() {
    const puxadoresTab = document.getElementById('puxadores-tab');
    if (puxadoresTab) {
        puxadoresTab.addEventListener('shown.bs.tab', carregarPuxadores);
    }

    const trilhosTab = document.getElementById('trilhos-tab');
    if (trilhosTab) {
        trilhosTab.addEventListener('shown.bs.tab', carregarTrilhos);
    }
}

/**
 * Adiciona usuário atual ao cache
 */
function adicionarUsuarioAtualAoCache() {
    const usuarioAtual = getCurrentUser();
    if (usuarioAtual && usuarioAtual.id) {
        CadastroUsuarios.adicionarAoCache(usuarioAtual.id, {
            nome: usuarioAtual.nome || usuarioAtual.email,
            email: usuarioAtual.email
        });
    }
}

// =============================================
// FUNÇÕES DE CARREGAMENTO DE DADOS
// =============================================

/**
 * Carrega puxadores do banco de dados
 */
async function carregarPuxadores() {
    try {
        console.log('🔍 Carregando puxadores...');
        
        if (!estadoCadastramento.supabaseInicializado) {
            console.warn('Supabase não inicializado, usando dados demo');
            renderizarTabelaPuxadores(DadosDemo.puxadores, true);
            return;
        }

        const resultado = await PuxadoresAPI.listar();
        
        if (resultado.success) {
            if (resultado.data.length === 0) {
                console.log('Nenhum puxador encontrado, usando dados demo');
                renderizarTabelaPuxadores(DadosDemo.puxadores, true);
            } else {
                renderizarTabelaPuxadores(resultado.data, true);
            }
        } else {
            console.error('Erro ao carregar puxadores:', resultado.error);
            if (resultado.error.includes('42P01')) {
                console.warn('Tabela não existe, usando modo demo');
                estadoCadastramento.tabelaPuxadoresInexistente = true;
            }
            renderizarTabelaPuxadores(DadosDemo.puxadores, true);
            CadastroNotificacoes.aviso('Usando dados de demonstração');
        }
    } catch (error) {
        console.error('Erro inesperado ao carregar puxadores:', error);
        renderizarTabelaPuxadores(DadosDemo.puxadores, true);
        CadastroNotificacoes.erro('Erro ao carregar puxadores');
    }
}

/**
 * Renderiza tabela de puxadores
 */
function renderizarTabelaPuxadores(puxadores, isAdmin) {
    const tbody = document.getElementById('tabelaPuxadores');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (puxadores.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">Nenhum puxador cadastrado</td></tr>`;
        return;
    }
    
    puxadores.forEach((puxador, index) => {
        const tr = document.createElement('tr');
        tr.dataset.id = puxador.id;
        
        // Thumbnail da foto
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
        
        // Carregar informações do usuário
        if (puxador.id_usuario) {
            const tdUsuario = document.getElementById(`usuario-${puxador.id}`);
            CadastroUsuarios.renderizarInfoUsuario(tdUsuario, puxador.id_usuario);
        } else {
            const tdUsuario = document.getElementById(`usuario-${puxador.id}`);
            tdUsuario.innerHTML = '<span class="text-muted">Proprietário desconhecido</span>';
        }
    });
    
    CadastroUtils.inicializarTooltips();
}

// =============================================
// FUNÇÕES DE MODAL E FORMULÁRIO
// =============================================

/**
 * Abre modal para novo puxador
 */
function abrirModalNovoPuxador(dados = {}) {
    estadoCadastramento.tipoAtual = 'puxador';
    estadoCadastramento.itemAtual = null;
    console.log('📋 Abrindo modal para novo puxador');
}

/**
 * Abre modal para novo trilho
 */
function abrirModalNovoTrilho(dados = {}) {
    estadoCadastramento.tipoAtual = 'trilho';
    estadoCadastramento.itemAtual = null;
    console.log('📋 Abrindo modal para novo trilho');
}

/**
 * Abre modal para novo vidro
 */
function abrirModalNovoVidro(dados = {}) {
    estadoCadastramento.tipoAtual = 'vidro';
    estadoCadastramento.itemAtual = null;
    console.log('📋 Abrindo modal para novo vidro');
}

// =============================================
// FUNÇÕES DE EDIÇÃO
// =============================================

/**
 * Edita um puxador existente
 */
async function editarPuxador(id) {
    try {
        console.log(`✏️ Editando puxador: ${id}`);
        
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
        
        if (!puxador) {
            throw new Error('Puxador não encontrado');
        }
        
        estadoCadastramento.itemAtual = puxador;
        cadastroModalManager.abrirModal('puxador', { item: puxador });
    } catch (error) {
        console.error('Erro ao editar puxador:', error);
        CadastroNotificacoes.erro('Erro ao editar puxador: ' + error.message);
    }
}

/**
 * Confirma exclusão de puxador
 */
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
        console.error('Erro ao confirmar exclusão:', error);
        CadastroNotificacoes.erro('Erro ao confirmar exclusão');
    }
}

// =============================================
// FUNÇÕES DE SALVAMENTO
// =============================================

/**
 * Salva um puxador (novo ou existente)
 */
async function salvarPuxador() {
    try {
        console.log('💾 Salvando puxador...');
        
        // Obter dados do formulário
        const id = document.getElementById('itemId').value;
        const modelo = document.getElementById('itemModelo').value;
        const fabricante = document.getElementById('itemFabricante').value;
        const cor = document.getElementById('itemCor').value;
        const medida = document.getElementById('itemMedida').value;
        const inputFoto = document.getElementById('itemFoto');
        
        // Validar campos obrigatórios
        if (!modelo || !medida) {
            CadastroNotificacoes.aviso('Os campos Modelo e Medida são obrigatórios');
            return false;
        }
        
        // Fazer upload da foto se necessário
        let fotoUrl = estadoCadastramento.itemAtual?.foto || null;
        if (inputFoto.files && inputFoto.files[0]) {
            const resultadoUpload = await UploadAPI.uploadImagem(inputFoto.files[0], 'puxadores');
            if (resultadoUpload.success) {
                fotoUrl = resultadoUpload.url;
            } else {
                CadastroNotificacoes.aviso('Erro no upload da imagem: ' + resultadoUpload.error);
            }
        }
        
        // Preparar dados do puxador
        const dadosPuxador = {
            modelo,
            fabricante,
            cor,
            medida,
            foto: fotoUrl,
            id_usuario: estadoCadastramento.itemAtual?.id_usuario || "c2319b68-6e15-4798-aacb-ed840126241d"
        };
        
        let resultado;
        
        // Modo demo ou Supabase
        if (estadoCadastramento.tabelaPuxadoresInexistente) {
            // Simular operação em modo demo
            resultado = { success: true };
            CadastroNotificacoes.sucesso(id ? 'Puxador atualizado (demo)!' : 'Puxador criado (demo)!');
        } else {
            // Operação real no Supabase
            if (id) {
                resultado = await PuxadoresAPI.atualizar(id, dadosPuxador);
            } else {
                resultado = await PuxadoresAPI.criar(dadosPuxador);
            }
            
            if (resultado.success) {
                CadastroNotificacoes.sucesso(id ? 'Puxador atualizado!' : 'Puxador criado!');
            } else {
                throw new Error(resultado.error);
            }
        }
        
        // Recarregar dados e atualizar interface
        carregarPuxadores();
        if (window.popularPuxadoresSelect) {
            await window.popularPuxadoresSelect();
        }
        
        return true;
    } catch (error) {
        console.error('Erro ao salvar puxador:', error);
        CadastroNotificacoes.erro('Erro ao salvar puxador: ' + error.message);
        return false;
    }
}

/**
 * Exclui um puxador ou trilho
 */
async function excluirPuxador() {
    try {
        const id = document.getElementById('idPuxadorExclusao').value;
        
        if (!id) {
            throw new Error('ID do item não encontrado');
        }
        
        // Detectar se estamos excluindo um trilho pelo texto da confirmação
        const modalBodyP = document.querySelector('#confirmarExclusaoItemModal .modal-body p');
        const textoConfirmacao = modalBodyP ? modalBodyP.textContent : '';
        const ehTrilho = textoConfirmacao.includes('trilho');
        
        console.log('Tipo de exclusão detectado:', ehTrilho ? 'TRILHO' : 'PUXADOR');
        
        // Verificar se estamos em modo demo
        if (tabelaPuxadoresInexistente) {
            const index = PUXADORES_DEMO.findIndex(p => p.id === id);
            
            if (index !== -1) {
                PUXADORES_DEMO.splice(index, 1);
            }
            
            // Fechar modal
            if (modalConfirmacao) {
                modalConfirmacao.hide();
            }
            
            // Recarregar dados (tratar como admin)
            renderizarTabelaPuxadores(PUXADORES_DEMO, true);
            
            // Mostrar notificação
            mostrarNotificacao('Puxador excluído com sucesso (modo demonstração)!', 'success');
            
            return;
        }
        
        // Excluir item (puxador ou trilho)
        const tabela = ehTrilho ? 'trilhos' : 'puxadores';
        const { error } = await supabaseClient
            .from(tabela)
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        
        // Fechar modal
        if (modalConfirmacao) {
            modalConfirmacao.hide();
        }
        
        // Recarregar dados
        if (ehTrilho) {
            carregarTrilhos();
            // Atualizar selects da interface principal
            if (window.popularModelosDeslizantesSelect) {
                await window.popularModelosDeslizantesSelect();
            }
        } else {
            carregarPuxadores();
            // Atualizar selects da interface principal
            if (window.popularPuxadoresSelect) {
                await window.popularPuxadoresSelect();
            }
        }
        
        // Mostrar notificação
        const tipoItem = ehTrilho ? 'Trilho' : 'Puxador';
        mostrarNotificacao(`${tipoItem} excluído com sucesso!`, 'success');
        
        // Resetar item atual
        itemAtual = null;
    } catch (error) {
        console.error('Erro ao excluir puxador:', error);
        mostrarNotificacao('Erro ao excluir puxador: ' + error.message, 'error');
    }
}

// Função para verificar se o usuário pode editar um puxador
function podeEditarItem(item) {
    // Todos os usuários podem editar todos os itens
    return true;
}

// Função para verificar se o usuário pode excluir um puxador
function podeExcluirItem(item) {
    // Todos os usuários podem excluir todos os itens
    return true;
}

// =============================================
// FUNCIONALIDADES PARA TRILHOS
// =============================================

/**
 * Carrega trilhos do banco de dados
 */
async function carregarTrilhos() {
    try {
        // Verificar se o cliente Supabase está disponível
        if (!supabaseClient) {
            console.error('Cliente Supabase não disponível');
            mostrarNotificacao('Erro de conexão com o banco de dados', 'error');
            return;
        }
        
        // Obter usuário atual
        const usuarioAtual = getCurrentUser();
        if (!usuarioAtual) {
            console.error('Usuário não logado');
            mostrarNotificacao('Você precisa estar logado para acessar este recurso', 'error');
            return;
        }

        // Verificar se é administrador
        const isAdmin = isCurrentUserAdmin();
        
        // Carregar todos os trilhos
        const query = supabaseClient
            .from('trilhos')
            .select('*')
            .order('nome');
                
        console.log('Carregando todos os trilhos...');
        
        const { data, error } = await query;
            
        if (error) {
            console.error('Erro ao carregar trilhos:', error);
            mostrarNotificacao('Erro ao carregar trilhos: ' + error.message, 'error');
            return;
        }
        
        // Renderizar trilhos na tabela
        renderizarTabelaTrilhos(data || [], isAdmin);
        
    } catch (error) {
        console.error('Erro inesperado ao carregar trilhos:', error);
        mostrarNotificacao('Erro inesperado ao carregar trilhos', 'error');
    }
}

/**
 * Renderiza a tabela de trilhos
 */
function renderizarTabelaTrilhos(trilhos, isAdmin) {
    const tbody = document.getElementById('tabelaTrilhos');
    if (!tbody) {
        console.error('Elemento #tabelaTrilhos não encontrado');
        return;
    }
    
    // Limpar tabela
    tbody.innerHTML = '';
    
    // Se não há trilhos, mostrar mensagem
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
    
    // Renderizar cada trilho
    trilhos.forEach(trilho => {
        const row = document.createElement('tr');
        
        // Nome
        const tdNome = document.createElement('td');
        tdNome.setAttribute('data-label', 'Nome');
        tdNome.title = trilho.nome || '-';
        tdNome.textContent = trilho.nome || '-';
        row.appendChild(tdNome);
        
        // Tipo
        const tdTipo = document.createElement('td');
        tdTipo.setAttribute('data-label', 'Tipo');
        tdTipo.title = trilho.tipo || '-';
        tdTipo.textContent = trilho.tipo || '-';
        row.appendChild(tdTipo);
        
        // Fabricante
        const tdFabricante = document.createElement('td');
        tdFabricante.setAttribute('data-label', 'Fabricante');
        tdFabricante.title = trilho.fabricante || '-';
        tdFabricante.textContent = trilho.fabricante || '-';
        row.appendChild(tdFabricante);
        
        // Cor
        const tdCor = document.createElement('td');
        tdCor.setAttribute('data-label', 'Cor');
        tdCor.title = trilho.cor || '-';
        tdCor.textContent = trilho.cor || '-';
        row.appendChild(tdCor);
        
        // Usuário
        const tdUsuario = document.createElement('td');
        tdUsuario.setAttribute('data-label', 'Usuário');
        if (trilho.id_usuario) {
            renderizarInfoUsuario(tdUsuario, trilho.id_usuario);
        } else {
            tdUsuario.innerHTML = `<span class="text-muted">-</span>`;
        }
        row.appendChild(tdUsuario);
        
        // Foto
        const tdFoto = document.createElement('td');
        tdFoto.setAttribute('data-label', 'Foto');
        if (trilho.foto) {
            tdFoto.innerHTML = `
                <button class="btn btn-outline-primary btn-sm" onclick="visualizarImagemTrilho('${trilho.foto}', '${trilho.nome}')">
                    <i class="bi bi-image"></i>
                </button>
            `;
        } else {
            tdFoto.innerHTML = `<span class="text-muted">Sem foto</span>`;
        }
        row.appendChild(tdFoto);
        
        // Ações
        const tdAcoes = document.createElement('td');
        tdAcoes.setAttribute('data-label', 'Ações');
        tdAcoes.className = 'text-center';
        
        const podeEditar = podeEditarItem(trilho);
        const podeExcluir = podeExcluirItem(trilho);
        
        let botoesHtml = '';
        
        if (podeEditar) {
            botoesHtml += `
                <button class="btn btn-outline-primary btn-sm me-1" onclick="editarTrilho('${trilho.id}')" title="Editar trilho">
                    <i class="bi bi-pencil"></i>
                </button>
            `;
        }
        
        if (podeExcluir) {
            botoesHtml += `
                <button class="btn btn-outline-danger btn-sm" onclick="confirmarExclusaoTrilho('${trilho.id}')" title="Excluir trilho">
                    <i class="bi bi-trash"></i>
                </button>
            `;
        }
        
        if (!botoesHtml) {
            botoesHtml = `<span class="text-muted">-</span>`;
        }
        
        tdAcoes.innerHTML = botoesHtml;
        row.appendChild(tdAcoes);
        
        tbody.appendChild(row);
    });
}

/**
 * Abre modal para criar novo trilho
 */
function abrirModalNovoTrilho() {
    // Resetar formulário
    const form = document.getElementById('formCadastro');
    if (form) {
        form.reset();
        form.classList.remove('was-validated');
    }
    
    // Limpar campos específicos
    document.getElementById('itemId').value = '';
    document.getElementById('fotoPreviewContainer').classList.add('d-none');
    
    // Atualizar título do modal
    document.getElementById('tituloFormCadastro').textContent = 'Novo Trilho';
    
    // Ajustar campos para trilho
    document.querySelector('label[for="itemModelo"]').textContent = 'Nome';
    
    // Ajustar campo de medida para tipo
    document.querySelector('label[for="itemMedida"]').textContent = 'Tipo (opcional)';
    
            // Converter campo medida em select para trilhos
        const itemMedida = document.getElementById('itemMedida');
        if (itemMedida && itemMedida.tagName === 'INPUT') {
            const parent = itemMedida.parentNode;
            const select = document.createElement('select');
            select.id = 'itemMedida';
            select.name = 'medida';
            select.className = 'form-control form-control-sm';
            select.required = false;
        
        // Adicionar opções
        const optionDefault = document.createElement('option');
        optionDefault.value = '';
        optionDefault.textContent = 'Selecione o tipo (opcional)';
        select.appendChild(optionDefault);
        
        const optionEmbutir = document.createElement('option');
        optionEmbutir.value = 'Embutir';
        optionEmbutir.textContent = 'Embutir';
        select.appendChild(optionEmbutir);
        
        const optionSobrepor = document.createElement('option');
        optionSobrepor.value = 'Sobrepor';
        optionSobrepor.textContent = 'Sobrepor';
        select.appendChild(optionSobrepor);
        
        parent.replaceChild(select, itemMedida);
    }
    
    // Resetar item atual
    itemAtual = null;
    
    // Abrir modal
    if (modalCadastro) {
        modalCadastro.show();
    }
}

/**
 * Edita um trilho existente
 */
async function editarTrilho(id) {
    try {
        if (!supabaseClient) {
            console.error('Cliente Supabase não disponível');
            return;
        }

        // Buscar trilho no Supabase
        const { data, error } = await supabaseClient
            .from('trilhos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Erro ao buscar trilho:', error);
            mostrarNotificacao('Erro ao carregar dados do trilho', 'error');
            return;
        }

        if (!data) {
            mostrarNotificacao('Trilho não encontrado', 'error');
            return;
        }

        // Armazenar o trilho atual para edição
        itemAtual = data;

        // Preencher formulário com dados do trilho
        preencherFormularioEdicaoTrilho(data);

        // Atualizar título do modal
        document.getElementById('tituloFormCadastro').textContent = 'Editar Trilho';
        
        // Ajustar campos para trilho
        document.querySelector('label[for="itemModelo"]').textContent = 'Nome';
        
        // Ajustar campo de medida para tipo
        document.querySelector('label[for="itemMedida"]').textContent = 'Tipo';
        
        // Converter campo medida em select para trilhos se for input
        const itemMedida = document.getElementById('itemMedida');
        if (itemMedida && itemMedida.tagName === 'INPUT') {
            const valorAtual = itemMedida.value;
            const parent = itemMedida.parentNode;
            const select = document.createElement('select');
            select.id = 'itemMedida';
            select.name = 'medida';
            select.className = 'form-control form-control-sm';
            select.required = false;
            
            // Adicionar opções
            const optionDefault = document.createElement('option');
            optionDefault.value = '';
            optionDefault.textContent = 'Selecione o tipo (opcional)';
            select.appendChild(optionDefault);
            
            const optionEmbutir = document.createElement('option');
            optionEmbutir.value = 'Embutir';
            optionEmbutir.textContent = 'Embutir';
            select.appendChild(optionEmbutir);
            
            const optionSobrepor = document.createElement('option');
            optionSobrepor.value = 'Sobrepor';
            optionSobrepor.textContent = 'Sobrepor';
            select.appendChild(optionSobrepor);
            
            parent.replaceChild(select, itemMedida);
            
            // Restaurar valor se houver
            if (valorAtual) {
                select.value = valorAtual;
            }
        }

        // Abrir modal
        if (modalCadastro) {
            modalCadastro.show();
        }

    } catch (error) {
        console.error('Erro ao editar trilho:', error);
        mostrarNotificacao('Erro ao editar trilho: ' + error.message, 'error');
    }
}

/**
 * Preenche o formulário com dados do trilho para edição
 */
function preencherFormularioEdicaoTrilho(trilho) {
    document.getElementById('itemId').value = trilho.id || '';
    document.getElementById('itemModelo').value = trilho.nome || '';
    document.getElementById('itemFabricante').value = trilho.fabricante || '';
    document.getElementById('itemCor').value = trilho.cor || '';
    document.getElementById('itemMedida').value = trilho.tipo || '';
    
    // Limpar prévia de foto
    document.getElementById('fotoPreviewContainer').classList.add('d-none');
    document.getElementById('itemFoto').value = '';
}

/**
 * Confirma exclusão de trilho
 */
async function confirmarExclusaoTrilho(id) {
    try {
        if (!supabaseClient) {
            console.error('Cliente Supabase não disponível');
            return;
        }

        // Buscar trilho para exibir nome na confirmação
        const { data, error } = await supabaseClient
            .from('trilhos')
            .select('nome')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Erro ao buscar trilho:', error);
            return;
        }

        const nome = data?.nome || 'trilho selecionado';

        // Preencher dados do modal de confirmação
        document.getElementById('idPuxadorExclusao').value = id;
        document.getElementById('modeloPuxadorExclusao').textContent = nome;
        
        // Atualizar texto do modal para trilho
        const modalBodyP = document.querySelector('#confirmarExclusaoItemModal .modal-body p');
        if (modalBodyP) {
            modalBodyP.innerHTML = `Tem certeza que deseja excluir o trilho <strong>${nome}</strong>?`;
        } else {
            console.error('Elemento do modal de confirmação não encontrado');
            return;
        }

        // Abrir modal de confirmação
        if (modalConfirmacao) {
            modalConfirmacao.show();
        }

    } catch (error) {
        console.error('Erro ao confirmar exclusão de trilho:', error);
        mostrarNotificacao('Erro ao processar exclusão', 'error');
    }
}

/**
 * Salva um trilho (novo ou editado)
 */
async function salvarTrilho() {
    try {
        // Obter dados do formulário
        const id = document.getElementById('itemId').value;
        const nome = document.getElementById('itemModelo').value;
        const fabricante = document.getElementById('itemFabricante').value;
        const cor = document.getElementById('itemCor').value;
        const tipo = document.getElementById('itemMedida').value;
        const inputFoto = document.getElementById('itemFoto');
        
        // Verificar campos obrigatórios - apenas Nome é obrigatório
        if (!nome) {
            mostrarNotificacao('O campo Nome é obrigatório', 'warning');
            return;
        }
        
        // Obter usuário atual
        const usuarioAtual = getCurrentUser();
        if (!usuarioAtual) {
            throw new Error('Usuário não logado');
        }
        
        let fotoUrl = itemAtual?.foto || null;
        
        // Se tiver um arquivo de foto selecionado, fazer upload
        if (inputFoto.files && inputFoto.files[0]) {
            const file = inputFoto.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${usuarioAtual.email.replace(/[^\w]/g, '-')}-${Date.now()}.${fileExt}`;
            const filePath = `trilhos/${fileName}`;
            
            try {
                // Upload do arquivo para o storage
                const { data: uploadData, error: uploadError } = await supabaseClient
                    .storage
                    .from('imagens')
                    .upload(filePath, file);
                    
                if (uploadError) {
                    console.error('Erro ao fazer upload da imagem:', uploadError);
                    mostrarNotificacao('Erro ao fazer upload da imagem. O trilho será salvo sem foto.', 'warning');
                } else {
                    // Obter URL público da imagem
                    const { data: urlData } = supabaseClient
                        .storage
                        .from('imagens')
                        .getPublicUrl(filePath);
                        
                    fotoUrl = urlData.publicUrl;
                }
            } catch (uploadException) {
                console.error('Erro no processo de upload:', uploadException);
                mostrarNotificacao('Erro no upload da imagem. O trilho será salvo sem foto.', 'warning');
            }
        }
        
        // Preparar objeto para o trilho - permitir valores vazios/nulos exceto nome
        const trilho = {
            nome,
            tipo: tipo || null,
            fabricante: fabricante || null, 
            cor: cor || null,
            foto: fotoUrl
        };
        
        // Se for uma atualização, manter o id_usuario original
        // Se for uma criação, usar ID do usuário que existe na tabela
        if (id && itemAtual && itemAtual.id_usuario) {
            trilho.id_usuario = itemAtual.id_usuario;
        } else {
            // CORREÇÃO TEMPORÁRIA: Usar o ID do usuário que sabemos que existe
            trilho.id_usuario = "c2319b68-6e15-4798-aacb-ed840126241d"; // Ricardo
        }
        
        let resultado;
        
        // Adicionar criado_em apenas para registros novos
        if (!id) {
            trilho.criado_em = new Date().toISOString();
        }
        
        // Editar ou criar novo trilho
        if (id) {
            // Atualizar
            resultado = await supabaseClient
                .from('trilhos')
                .update(trilho)
                .eq('id', id);
        } else {
            // Criar novo
            resultado = await supabaseClient
                .from('trilhos')
                .insert(trilho);
        }
        
        if (resultado.error) throw resultado.error;
        
        // Fechar modal
        if (modalCadastro) {
            modalCadastro.hide();
        }
        
        // Recarregar dados
        carregarTrilhos();
        
        // Atualizar selects da interface principal (se a função estiver disponível)
        if (window.popularModelosDeslizantesSelect) {
            await window.popularModelosDeslizantesSelect();
        } else {
            await carregarTrilhosNoSelect();
        }
        
        // Mostrar notificação
        mostrarNotificacao(
            id ? 'Trilho atualizado com sucesso!' : 'Trilho adicionado com sucesso!', 
            'success'
        );
        
        // Resetar item atual
        itemAtual = null;
    } catch (error) {
        console.error('Erro ao salvar trilho:', error);
        console.error('Detalhes do erro:', error.details, error.hint, error.code);
        mostrarNotificacao(`Erro ao salvar trilho: ${error.message || error}`, 'error');
    }
}

// Adicionar eventos específicos para trilhos na inicialização
const inicializarEventosTrilhos = () => {
    // Botão para novo trilho
    const btnNovoTrilho = document.getElementById('btnNovoTrilho');
    if (btnNovoTrilho) {
        btnNovoTrilho.addEventListener('click', abrirModalNovoTrilho);
    }
    
    // Configurar evento para quando a aba de trilhos for ativada
    const trilhosTab = document.getElementById('trilhos-tab');
    if (trilhosTab) {
        trilhosTab.addEventListener('shown.bs.tab', () => {
            carregarTrilhos();
        });
    }
};

// Função para visualizar imagem do trilho
window.visualizarImagemTrilho = function(url, nome) {
    document.getElementById('imagemAmpliada').src = url;
    document.getElementById('modeloPuxadorImagem').textContent = `Trilho ${nome}`;
    
    const modal = new bootstrap.Modal(document.getElementById('imagemAmpliadaModal'));
    modal.show();
};

// Tornar funções globais para uso nos botões
window.editarTrilho = editarTrilho;
window.confirmarExclusaoTrilho = confirmarExclusaoTrilho;

// Adicionar inicialização de trilhos à função existente
const inicializarTrilhos = () => {
    // Adicionar inicialização específica para trilhos
    setTimeout(() => {
        inicializarEventosTrilhos();
        console.log('Eventos de trilhos inicializados');
    }, 100);
};

// Chamar a inicialização de trilhos quando o módulo for carregado
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', inicializarTrilhos);
}

/**
 * Carrega trilhos nos selects da interface principal
 */
async function carregarTrilhosNoSelect() {
    try {
        if (!supabaseClient) {
            console.warn('Cliente Supabase não disponível para carregar trilhos');
            return;
        }
        
        // Buscar trilhos ordenados por nome
        const { data, error } = await supabaseClient
            .from('trilhos')
            .select('nome,tipo')
            .order('nome');
            
        if (error) {
            console.error('Erro ao carregar trilhos para select:', error);
            return;
        }
        
        // Atualizar select de Modelo do Sistema Deslizante
        const modeloSelect = document.getElementById('modeloDeslizante');
        if (modeloSelect && data && data.length > 0) {
            // Limpar o select
            modeloSelect.innerHTML = '';
            
            // Adicionar trilhos do banco de dados
            data.forEach(trilho => {
                const option = document.createElement('option');
                option.value = trilho.nome;
                option.textContent = trilho.nome;
                modeloSelect.appendChild(option);
            });
            
            console.log('Modelos deslizantes atualizados:', data.length);
        }
        
        // Atualizar select de Tipo de Trilho
        const trilhoSelect = document.getElementById('trilhoDeslizante');
        if (trilhoSelect && data && data.length > 0) {
            // Manter opções padrão e adicionar tipos únicos do banco
            const tiposUnicos = [...new Set(data.map(t => t.tipo))];
            const optionsExistentes = Array.from(trilhoSelect.options).map(opt => opt.value);
            
            tiposUnicos.forEach(tipo => {
                if (!optionsExistentes.includes(tipo)) {
                    const option = document.createElement('option');
                    option.value = tipo;
                    option.textContent = tipo;
                    trilhoSelect.appendChild(option);
                }
            });
            
            console.log('Tipos de trilho atualizados');
        }
        
        console.log('Trilhos carregados nos selects:', data?.length || 0);
        
    } catch (error) {
        console.error('Erro ao carregar trilhos nos selects:', error);
    }
} 