/**
 * Módulo de Cadastramento
 * Gerencia o cadastramento de itens (puxadores, perfis, etc)
 */

import { getCurrentUser, isCurrentUserAdmin as originalIsAdmin } from './auth.js';
import { mostrarNotificacao } from './notifications.js';
import supabase from './db-config.js';

// Sobrescrever a função isCurrentUserAdmin para sempre retornar true no contexto de cadastramento
// Isso permite que todos os usuários tenham acesso total ao cadastramento
function isCurrentUserAdmin() {
    // No contexto de cadastramento, todos os usuários são tratados como administradores
    return true;
}

// Variável global para acesso ao Supabase
let supabaseClient = null;

// Cache de usuários em memória (apenas para sessão atual)
// Reset ao recarregar a página ou após timeout
const usuariosCache = {
    dados: {}, // Dados dos usuários {id: {nome, email, timestamp}}
    solicitacoes: {}, // Controle de solicitações em andamento {id: Promise}
    tempoMaximo: 5 * 60 * 1000, // 5 minutos em milissegundos
    
    // Adiciona um usuário ao cache com timestamp
    adicionar(id, dados) {
        if (!id || !dados) return;
        this.dados[id] = {
            ...dados,
            timestamp: Date.now()
        };
    },
    
    // Obtém um usuário do cache, verificando validade
    obter(id) {
        if (!id || !this.dados[id]) return null;
        
        const item = this.dados[id];
        const agora = Date.now();
        
        // Verificar se o cache expirou
        if (agora - item.timestamp > this.tempoMaximo) {
            delete this.dados[id]; // Remover do cache
            return null;
        }
        
        return item;
    },
    
    // Limpa o cache inteiro
    limpar() {
        this.dados = {};
        this.solicitacoes = {};
    }
};

// Mapeamento de elementos DOM
const elementos = {
    modal: {
        cadastro: document.getElementById('cadastroFormModal'),
        confirmacao: document.getElementById('confirmarExclusaoItemModal')
    },
    tabelas: {
        puxadores: document.getElementById('tabelaPuxadores')
    },
    formularios: {
        cadastro: document.getElementById('formCadastro')
    },
    botoes: {
        novoPuxador: document.getElementById('btnNovoPuxador'),
        salvarCadastro: document.getElementById('btnSalvarCadastro'),
        confirmarExclusaoPuxador: document.getElementById('btnConfirmarExclusaoPuxador')
    }
};

// Instâncias de modais
let modalCadastro = null;
let modalConfirmacao = null;

// Item sendo editado atualmente
let itemAtual = null;

// Flag para tabela não existente
let tabelaPuxadoresInexistente = false;

// Dados de demonstração para puxadores - ATUALIZADO para usar id_usuario em vez de campos legados
const PUXADORES_DEMO = [
    { 
        id: '1', 
        modelo: 'Cielo', 
        fabricante: 'Aluminium', 
        cor: 'Anodizado', 
        medida: '150mm',
        id_usuario: '00000000-0000-0000-0000-000000000001', // ID demo para Admin Conecta
        foto: null,
        criado_em: new Date().toISOString() 
    },
    { 
        id: '2', 
        modelo: 'Luna', 
        fabricante: 'GlassFit', 
        cor: 'Preto', 
        medida: '300mm',
        id_usuario: '00000000-0000-0000-0000-000000000001', // ID demo para Admin Conecta 
        foto: null,
        criado_em: new Date().toISOString() 
    }
];

// Adicionar usuários de demonstração ao cache
usuariosCache['00000000-0000-0000-0000-000000000001'] = {
    nome: 'Admin Conecta',
    email: 'admin@conectamoveis.net'
};

/**
 * Inicializa o módulo de cadastramento
 */
export function inicializarCadastramento() {
    console.log('Inicializando módulo de cadastramento...');
    
    // Obter cliente Supabase
    supabaseClient = window.supabase;
    if (!supabaseClient) {
        console.error('Cliente Supabase não encontrado. O módulo de cadastramento requer Supabase.');
        return;
    }
    
    // Limpar cache ao iniciar (garantir dados frescos a cada carregamento)
    usuariosCache.limpar();
    
    // Inicializar módulo
    capturarElementos();
    inicializarModais();
    configurarEventos();
    
    // Pré-carregar alguns usuários importantes no cache
    carregarUsuariosParaCache();
    
    // Carregar trilhos no select da interface principal
    carregarTrilhosNoSelect();
    
    // Adicionar usuário atual ao cache
    const usuarioAtual = getCurrentUser();
    if (usuarioAtual && usuarioAtual.id) {
        usuariosCache.adicionar(usuarioAtual.id, {
            nome: usuarioAtual.nome || usuarioAtual.email,
            email: usuarioAtual.email
        });
    }
    
    console.log('Módulo de cadastramento inicializado com sucesso.');
}

/**
 * Captura elementos do DOM
 */
function capturarElementos() {
    // Atualizar referências a elementos que podem não ter sido carregados na inicialização
    elementos.modal.cadastro = document.getElementById('cadastroFormModal');
    elementos.modal.confirmacao = document.getElementById('confirmarExclusaoItemModal');
    
    elementos.tabelas.puxadores = document.getElementById('tabelaPuxadores');
    
    elementos.formularios.cadastro = document.getElementById('formCadastro');
    
    elementos.botoes.novoPuxador = document.getElementById('btnNovoPuxador');
    elementos.botoes.salvarCadastro = document.getElementById('btnSalvarCadastro');
    elementos.botoes.confirmarExclusaoPuxador = document.getElementById('btnConfirmarExclusaoPuxador');
}

/**
 * Inicializa os modais
 */
function inicializarModais() {
    if (elementos.modal.cadastro && window.bootstrap) {
        modalCadastro = new bootstrap.Modal(elementos.modal.cadastro);
    }
    
    if (elementos.modal.confirmacao && window.bootstrap) {
        modalConfirmacao = new bootstrap.Modal(elementos.modal.confirmacao);
    }
}

/**
 * Configura eventos
 */
function configurarEventos() {
    // Configurar botões
    if (elementos.botoes.novoPuxador) {
        elementos.botoes.novoPuxador.addEventListener('click', abrirModalNovoPuxador);
    }
    
    if (elementos.botoes.salvarCadastro) {
        elementos.botoes.salvarCadastro.addEventListener('click', salvarPuxador);
    }
    
    if (elementos.botoes.confirmarExclusaoPuxador) {
        elementos.botoes.confirmarExclusaoPuxador.addEventListener('click', excluirPuxador);
    }
    
    // Configurar evento para quando o modal de cadastramento for exibido
    const cadastramentoModal = document.getElementById('cadastramentoModal');
    if (cadastramentoModal) {
        cadastramentoModal.addEventListener('show.bs.modal', () => {
            carregarPuxadores();
        });

        // Ativar tooltips quando o modal for exibido
        cadastramentoModal.addEventListener('shown.bs.modal', () => {
            setTimeout(inicializarTooltips, 500);
        });
    }
    
    // Configurar input de foto com evento de prévia
    const inputFoto = document.getElementById('itemFoto');
    if (inputFoto) {
        // Evento para mostrar prévia
        inputFoto.addEventListener('change', mostrarPreviaImagem);
        
        // Configurar botão para remover foto
        const btnRemoverFoto = document.getElementById('btnRemoverFoto');
        if (btnRemoverFoto) {
            btnRemoverFoto.addEventListener('click', removerFoto);
        }
    }

    // Configurar evento para quando o tab de puxadores for ativado
    const puxadoresTab = document.getElementById('puxadores-tab');
    if (puxadoresTab) {
        puxadoresTab.addEventListener('shown.bs.tab', () => {
            carregarPuxadores();
        });
    }
}

/**
 * Mostra a prévia da imagem selecionada
 */
function mostrarPreviaImagem(event) {
    const preview = document.getElementById('fotoPreview');
    const previewContainer = document.getElementById('fotoPreviewContainer');
    const file = event.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.src = e.target.result;
            previewContainer.classList.remove('d-none');
        }
        
        reader.readAsDataURL(file);
    } else {
        previewContainer.classList.add('d-none');
    }
}

/**
 * Remove a foto selecionada
 */
function removerFoto() {
    const input = document.getElementById('itemFoto');
    const previewContainer = document.getElementById('fotoPreviewContainer');
    
    input.value = '';
    previewContainer.classList.add('d-none');
}

/**
 * Carrega usuários relevantes para o cache
 * Abordagem eficiente: apenas usuários necessários ou muito frequentes
 */
async function carregarUsuariosParaCache() {
    try {
        if (!supabaseClient) return;
        
        // Verificar se o usuário está logado
        const usuarioAtual = getCurrentUser();
        if (!usuarioAtual) return;
        
        // Administradores carregam usuários frequentes
        const isAdmin = isCurrentUserAdmin();
        
        if (isAdmin) {
            // Preferimos carregar sob demanda, mas para admins podemos
            // carregar um pequeno conjunto inicial (limitado a 10)
            const { data, error } = await supabaseClient
                .from('usuarios')
                .select('id, nome, email')
                .order('criado_em', { ascending: false })
                .limit(10);
                
            if (error) {
                console.error('Erro ao pré-carregar cache de usuários:', error);
                return;
            }
            
            // Preencher cache com usuários mais recentes
            if (data && data.length > 0) {
                data.forEach(usuario => {
                    usuariosCache.adicionar(usuario.id, {
                        nome: usuario.nome || usuario.email,
                        email: usuario.email
                    });
                });
                console.log(`Pré-cache de usuários: ${data.length} usuários carregados`);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar cache inicial de usuários:', error);
        // Não exibir erro para o usuário, cache será carregado sob demanda
    }
}

/**
 * Obtém informações do usuário, preferencialmente do cache
 * Utiliza Promise para controlar múltiplas solicitações simultâneas
 * @param {string} id_usuario - ID do usuário
 * @returns {Promise<Object>} Promessa com informações do usuário
 */
async function obterInfoUsuario(id_usuario) {
    // Se não tiver ID, retorna erro
    if (!id_usuario) {
        return Promise.reject(new Error('ID de usuário inválido'));
    }
    
    // Verificar se já está no cache
    const dadosCache = usuariosCache.obter(id_usuario);
    if (dadosCache) {
        return Promise.resolve(dadosCache);
    }
    
    // Verificar se já existe uma solicitação em andamento para este ID
    if (usuariosCache.solicitacoes[id_usuario]) {
        return usuariosCache.solicitacoes[id_usuario];
    }
    
    // Criar e armazenar a Promise para esta solicitação
    const promise = new Promise(async (resolve, reject) => {
        try {
            // Tempo limite de 5 segundos para a requisição
            const timeoutPromise = new Promise((_, rejeitar) => 
                setTimeout(() => rejeitar(new Error('Tempo limite excedido')), 5000)
            );
            
            // Competição entre a busca e o timeout
            const resultado = await Promise.race([
                supabaseClient
                    .from('usuarios')
                    .select('id, nome, email')
                    .eq('id', id_usuario)
                    .single(),
                timeoutPromise
            ]);
            
            // Verificar erro
            if (resultado.error) {
                throw resultado.error;
            }
            
            // Verificar se encontrou o usuário
            if (!resultado.data) {
                throw new Error('Usuário não encontrado');
            }
            
            // Extrair dados
            const { nome, email } = resultado.data;
            const dados = {
                nome: nome || email || 'Usuário sem nome',
                email: email || ''
            };
            
            // Adicionar ao cache
            usuariosCache.adicionar(id_usuario, dados);
            
            // Resolver a Promise
            resolve(dados);
        } catch (error) {
            console.error(`Erro ao buscar usuário ${id_usuario}:`, error);
            
            // Criar objeto de erro formatado
            const erro = {
                nome: 'Erro: ' + (error.message || 'Falha ao carregar'),
                email: '',
                erro: true
            };
            
            // Não armazenamos erros no cache para permitir novas tentativas
            // Apenas resolvemos a Promise atual
            resolve(erro);
        } finally {
            // Remover esta solicitação da lista de pendentes
            delete usuariosCache.solicitacoes[id_usuario];
        }
    });
    
    // Armazenar a Promise
    usuariosCache.solicitacoes[id_usuario] = promise;
    
    return promise;
}

/**
 * Renderiza informações do usuário no elemento DOM
 * Usa sistema de fallback progressivo
 * @param {Element} elemento - Elemento DOM para inserir as informações
 * @param {string} id_usuario - ID do usuário a ser exibido
 */
async function renderizarInfoUsuario(elemento, id_usuario) {
    if (!elemento || !id_usuario) return;
    
    try {
        // Mostrar estado de carregamento
        elemento.innerHTML = `<span class="loading-text">Carregando...</span>`;
        elemento.setAttribute('data-usuario-id', id_usuario);
        
        // Buscar info do usuário
        const info = await obterInfoUsuario(id_usuario);
        
        // Verificar se é um erro
        if (info.erro) {
            elemento.innerHTML = `<span class="text-danger" title="Tente novamente mais tarde">${info.nome}</span>`;
            // Adicionar botão de retry em caso de erro
            const retryBtn = document.createElement('button');
            retryBtn.className = 'btn btn-link btn-sm px-1 py-0';
            retryBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i>';
            retryBtn.title = 'Tentar novamente';
            retryBtn.onclick = (e) => {
                e.stopPropagation();
                // Remover este usuário do cache para forçar nova busca
                delete usuariosCache.dados[id_usuario];
                renderizarInfoUsuario(elemento, id_usuario);
            };
            elemento.appendChild(retryBtn);
            return;
        }
        
        // Renderizar dados normais
        elemento.innerHTML = `<span title="${info.email || ''}">${info.nome}</span>`;
    } catch (error) {
        console.error('Erro ao renderizar informações do usuário:', error);
        elemento.innerHTML = `<span class="text-muted">Proprietário indisponível</span>`;
    }
}

/**
 * Carrega puxadores do banco de dados
 */
async function carregarPuxadores() {
    try {
        console.log('🔍 Iniciando carregamento de puxadores...');
        
        // Verificar se o cliente Supabase está disponível
        if (!supabaseClient) {
            console.error('Cliente Supabase não disponível');
            mostrarNotificacao('Erro de conexão com o banco de dados', 'error');
            return;
        }
        
        console.log('✅ Cliente Supabase OK');
        
        // Obter usuário atual
        const usuarioAtual = getCurrentUser();
        if (!usuarioAtual) {
            console.error('Usuário não logado');
            mostrarNotificacao('Você precisa estar logado para acessar este recurso', 'error');
            return;
        }

        // Verificar se é administrador
        const isAdmin = isCurrentUserAdmin();
        
        // Log para debug
        console.log('Usuário atual:', { 
            id: usuarioAtual.id || 'não definido', 
            nome: usuarioAtual.nome,
            email: usuarioAtual.email,
            isAdmin 
        });
        
        // Todos os usuários agora veem todos os puxadores (como administradores)
        const query = supabaseClient
            .from('puxadores')
            .select('*')
            .order('modelo');
                
        console.log('Carregando todos os puxadores (acesso total para todos os usuários)');
        
        const { data, error } = await query;
            
        if (error) {
            // Verificar se é erro de tabela não existente
            if (error.code === '42P01') {
                console.warn('Tabela de puxadores não existe, usando modo demonstração');
                tabelaPuxadoresInexistente = true;
                renderizarTabelaPuxadores(PUXADORES_DEMO, true); // true = tratar como admin
                return;
            }
            
            // Melhorar o log para diagnóstico de erros
            console.error('Erro ao carregar puxadores:', error.message, 'Código:', error.code, 'Detalhes:', error);
            mostrarNotificacao(`Erro ao carregar puxadores: ${error.message}`, 'error');
            
            // Ainda mostramos os dados de demonstração em caso de erro
            renderizarTabelaPuxadores(PUXADORES_DEMO, true); // true = tratar como admin
            return;
        }
        
        // Se não houver erro mas também não houver dados, verificamos se é o primeiro acesso
        if (!data || data.length === 0) {
            console.log('Nenhum puxador encontrado. Carregando dados de demonstração para primeiro acesso.');
            renderizarTabelaPuxadores(PUXADORES_DEMO, true); // true = tratar como admin
            return;
        }
        
        renderizarTabelaPuxadores(data, true); // true = tratar como admin
    }
    catch (error) {
        console.error('Exceção ao carregar puxadores:', error);
        mostrarNotificacao('Erro ao processar dados de puxadores', 'error');
        // Em caso de exceção, mostramos os dados de demonstração
        renderizarTabelaPuxadores(PUXADORES_DEMO, true); // true = tratar como admin
    }
}

/**
 * Renderiza tabela de puxadores
 * @param {Array} puxadores Lista de puxadores
 * @param {boolean} isAdmin Indica se o usuário é administrador
 */
function renderizarTabelaPuxadores(puxadores, isAdmin) {
    if (!elementos.tabelas.puxadores) return;
    
    // Limpar tabela
    const tbody = elementos.tabelas.puxadores;
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Adicionar linhas
    if (puxadores.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="7" class="text-center">Nenhum puxador cadastrado</td>`;
        tbody.appendChild(tr);
        return;
    }
    
    puxadores.forEach((puxador, index) => {
        const usuarioAtual = getCurrentUser();
        
        // Agora todos os usuários têm permissão total como administradores
        const podeEditar = true; // Todos podem editar todos os puxadores
        
        const tr = document.createElement('tr');
        tr.dataset.id = puxador.id;
        tr.setAttribute('tabindex', '0'); // Torna a linha focável por teclado
        tr.setAttribute('aria-rowindex', index + 1);
        
        // Preparar thumbnail da foto
        let thumbnailHtml = '<div class="text-center">Sem foto</div>';
        if (puxador.foto) {
            thumbnailHtml = `
                <img src="${puxador.foto}" 
                     alt="Foto do puxador ${puxador.modelo}" 
                     class="img-thumbnail" 
                     style="max-height: 40px; max-width: 60px;"
                     tabindex="0"
                     role="button"
                     aria-label="Visualizar imagem do puxador ${puxador.modelo}"
                     title="Clique para ampliar">
            `;
        }
        
        // Criamos a célula de usuário vazia para depois preencher assincronamente
        const tdUsuario = document.createElement('td');
        tdUsuario.setAttribute('data-label', 'Usuário');
        
        tr.innerHTML = `
            <td data-label="Modelo" title="${puxador.modelo || '-'}">${puxador.modelo || '-'}</td>
            <td data-label="Fabricante" title="${puxador.fabricante || '-'}">${puxador.fabricante || '-'}</td>
            <td data-label="Cor" title="${puxador.cor || '-'}">${puxador.cor || '-'}</td>
            <td data-label="Medida" title="${puxador.medida || '-'}">${puxador.medida || '-'}</td>
            <td data-label="Usuário"></td>
            <td class="text-center" data-label="Foto">${thumbnailHtml}</td>
            <td class="text-end" data-label="Ações">
                <div class="btn-actions">
                    <button type="button" class="btn btn-sm btn-outline-primary btn-editar" data-id="${puxador.id}" title="Editar puxador" aria-label="Editar puxador ${puxador.modelo}">
                        <i class="bi bi-pencil" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger btn-excluir" data-id="${puxador.id}" title="Excluir puxador" aria-label="Excluir puxador ${puxador.modelo}">
                        <i class="bi bi-trash" aria-hidden="true"></i>
                    </button>
                </div>
            </td>
        `;
        
        // Substituir o placeholder da coluna de usuário
        const celulas = tr.getElementsByTagName('td');
        if (celulas.length >= 5) {
            tr.replaceChild(tdUsuario, celulas[4]);
        }
        
        tbody.appendChild(tr);
        
        // Adicionar eventos aos botões (todos os botões agora têm permissão)
        const btnEditar = tr.querySelector('.btn-editar');
        const btnExcluir = tr.querySelector('.btn-excluir');
        
        if (btnEditar) {
            btnEditar.addEventListener('click', () => {
                editarPuxador(puxador.id);
            });
            
            // Adicionar suporte a navegação por teclado
            btnEditar.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    editarPuxador(puxador.id);
                }
            });
        }
        
        if (btnExcluir) {
            btnExcluir.addEventListener('click', () => {
                confirmarExclusaoPuxador(puxador.id);
            });
            
            // Adicionar suporte a navegação por teclado
            btnExcluir.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    confirmarExclusaoPuxador(puxador.id);
                }
            });
        }
        
        // Carregar informações do usuário de forma assíncrona
        if (puxador.id_usuario) {
            // Renderizar informações do usuário
            renderizarInfoUsuario(tdUsuario, puxador.id_usuario);
        } else {
            // Sem ID de usuário
            tdUsuario.innerHTML = '<span class="text-muted">Proprietário desconhecido</span>';
        }
    });
    
    // Inicializar tooltips para textos longos
    inicializarTooltips();
}

/**
 * Inicializa tooltips para textos longos nas células da tabela
 */
function inicializarTooltips() {
    setTimeout(() => {
        const cells = document.querySelectorAll('#tabelaPuxadores td');
        cells.forEach(cell => {
            if (cell.scrollWidth > cell.clientWidth) {
                cell.setAttribute('data-bs-toggle', 'tooltip');
                cell.setAttribute('data-bs-placement', 'top');
                
                // Inicializar o tooltip usando Bootstrap se disponível
                if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
                    new bootstrap.Tooltip(cell, {
                        boundary: document.body
                    });
                }
            }
        });
    }, 500);
}

/**
 * Abre o modal para adicionar um novo puxador
 */
function abrirModalNovoPuxador() {
    // Resetar formulário
    if (elementos.formularios.cadastro) {
        elementos.formularios.cadastro.reset();
    }
    
    // Ocultar prévia de imagem
    const previewContainer = document.getElementById('fotoPreviewContainer');
    if (previewContainer) {
        previewContainer.classList.add('d-none');
    }
    
    // Resetar item atual
    itemAtual = null;
    
    // Atualizar título do modal
    const modalTitle = document.getElementById('tituloFormCadastro');
    if (modalTitle) {
        modalTitle.textContent = 'Novo Puxador';
    }
    
    // Ajustar campos para puxador
    document.querySelector('label[for="itemModelo"]').textContent = 'Modelo';
    document.getElementById('itemModelo').placeholder = 'Modelo do puxador';
    
    // Ajustar campo de medida para medida
    document.querySelector('label[for="itemMedida"]').textContent = 'Medida';
    
    // Converter campo medida de volta para input se for select
    const itemMedida = document.getElementById('itemMedida');
    if (itemMedida && itemMedida.tagName === 'SELECT') {
        const parent = itemMedida.parentNode;
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'itemMedida';
        input.name = 'medida';
        input.className = 'form-control form-control-sm';
        input.required = true;
        input.placeholder = 'Medida do puxador';
        
        parent.replaceChild(input, itemMedida);
    }
    
    // Abrir modal
    if (modalCadastro) {
        modalCadastro.show();
    }
}

/**
 * Abre o modal para editar um puxador existente
 * @param {string} id ID do puxador
 */
async function editarPuxador(id) {
    try {
        // Verificar se é modo demo
        if (tabelaPuxadoresInexistente) {
            const puxador = PUXADORES_DEMO.find(p => p.id === id);
            if (!puxador) {
                throw new Error('Puxador não encontrado');
            }
            
            preencherFormularioEdicao(puxador);
            return;
        }
        
        // Buscar puxador no Supabase (sem restrições de permissão)
        const { data, error } = await supabaseClient
            .from('puxadores')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        if (!data) throw new Error('Puxador não encontrado');
        
        preencherFormularioEdicao(data);
    } catch (error) {
        console.error('Erro ao editar puxador:', error);
        mostrarNotificacao('Erro ao editar puxador: ' + error.message, 'error');
    }
}

/**
 * Preenche o formulário com os dados do puxador para edição
 * @param {Object} puxador - Dados do puxador
 */
function preencherFormularioEdicao(puxador) {
    // Atualizar item atual
    itemAtual = puxador;
    
    // Preencher formulário
    if (elementos.formularios.cadastro) {
        const form = elementos.formularios.cadastro;
        
        // Preencher campos
        document.getElementById('itemId').value = puxador.id || '';
        document.getElementById('itemModelo').value = puxador.modelo || '';
        document.getElementById('itemFabricante').value = puxador.fabricante || '';
        document.getElementById('itemCor').value = puxador.cor || '';
        document.getElementById('itemMedida').value = puxador.medida || '';
        
        // Lidar com a foto
        const inputFoto = document.getElementById('itemFoto');
        const previewContainer = document.getElementById('fotoPreviewContainer');
        const preview = document.getElementById('fotoPreview');
        
        // Limpar o input de arquivo
        inputFoto.value = '';
        
        // Se tiver foto, mostrar a prévia
        if (puxador.foto) {
            preview.src = puxador.foto;
            preview.onerror = function() {
                preview.onerror = null;
                preview.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\' viewBox=\'0 0 120 120\'%3E%3Crect width=\'120\' height=\'120\' fill=\'%23f5f5f5\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' font-size=\'14\' text-anchor=\'middle\' alignment-baseline=\'middle\' font-family=\'Arial\' fill=\'%23999999\'%3EImagem não disponível%3C/text%3E%3C/svg%3E';
            };
            previewContainer.classList.remove('d-none');
        } else {
            previewContainer.classList.add('d-none');
        }
    }
    
    // Atualizar título do modal
    const modalTitle = document.getElementById('tituloFormCadastro');
    if (modalTitle) {
        modalTitle.textContent = 'Editar Puxador';
    }
    
    // Abrir modal
    if (modalCadastro) {
        modalCadastro.show();
    }
}

/**
 * Confirma a exclusão de um puxador
 * @param {string} id ID do puxador
 */
async function confirmarExclusaoPuxador(id) {
    try {
        let modelo = ""; // Valor padrão para o modelo
        
        // Verificar se é modo demo
        if (tabelaPuxadoresInexistente) {
            const puxador = PUXADORES_DEMO.find(p => p.id === id);
            
            if (puxador) {
                modelo = puxador.modelo;
                itemAtual = puxador;
            } else {
                console.warn(`Puxador com ID ${id} não encontrado no modo demo`);
                modelo = "ID: " + id;
            }
        } else {
            try {
                // Buscar puxador (sem restrições de permissão)
                const { data, error } = await supabaseClient
                    .from('puxadores')
                    .select('id, modelo')
                    .eq('id', id)
                    .single();
                    
                if (error) {
                    console.warn(`Erro ao buscar detalhes do puxador: ${error.message}`);
                    modelo = "ID: " + id;
                } else if (data) {
                    modelo = data.modelo;
                    itemAtual = data;
                } else {
                    console.warn(`Puxador com ID ${id} não encontrado`);
                    modelo = "ID: " + id;
                }
            } catch (searchError) {
                // Em caso de erro, continuamos com ID
                console.error('Erro ao buscar puxador:', searchError);
                modelo = "ID: " + id;
            }
        }
        
        // Atualizar mensagem de confirmação
        document.getElementById('modeloPuxadorExclusao').textContent = modelo;
        document.getElementById('idPuxadorExclusao').value = id;
        
        // Abrir modal
        if (modalConfirmacao) {
            modalConfirmacao.show();
        }
    } catch (error) {
        console.error('Erro ao confirmar exclusão:', error);
        mostrarNotificacao('Erro ao confirmar exclusão: ' + error.message, 'error');
    }
}

/**
 * Salva um puxador (novo ou existente)
 */
async function salvarPuxador() {
    try {
        if (!elementos.formularios.cadastro) {
            throw new Error('Formulário não encontrado');
        }
        
        // Detectar se estamos salvando um trilho ou puxador pelo título do modal
        const titulo = document.getElementById('tituloFormCadastro').textContent;
        const ehTrilho = titulo.includes('Trilho');
        
        if (ehTrilho) {
            return await salvarTrilho();
        }
        
        // Obter dados do formulário
        const id = document.getElementById('itemId').value;
        const modelo = document.getElementById('itemModelo').value;
        const fabricante = document.getElementById('itemFabricante').value;
        const cor = document.getElementById('itemCor').value;
        const medida = document.getElementById('itemMedida').value;
        const inputFoto = document.getElementById('itemFoto');
        
        // Verificar campos obrigatórios
        if (!modelo || !medida) {
            mostrarNotificacao('Os campos Modelo e Medida são obrigatórios', 'warning');
            return;
        }
        
        // Obter usuário atual
        const usuarioAtual = getCurrentUser();
        if (!usuarioAtual) {
            throw new Error('Usuário não logado');
        }
        
        let fotoUrl = itemAtual?.foto || null;
        let uploadTentado = false;
        
        // Se tiver um arquivo de foto selecionado, fazer upload
        if (inputFoto.files && inputFoto.files[0]) {
            uploadTentado = true;
            const file = inputFoto.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${usuarioAtual.email.replace(/[^\w]/g, '-')}-${Date.now()}.${fileExt}`;
            const filePath = `puxadores/${fileName}`;
            
            try {
                // CORREÇÃO: Verificar se o bucket 'imagens' existe antes de tentar upload
                const { data: buckets, error: bucketsError } = await supabaseClient
                    .storage
                    .listBuckets();
                
                if (bucketsError) {
                    console.error('Erro ao listar buckets:', bucketsError);
                    throw new Error('Não foi possível verificar os buckets de armazenamento');
                }
                
                const bucketExiste = buckets.some(bucket => bucket.name === 'imagens');
                
                if (!bucketExiste) {
                    // Se o bucket não existir, tentar criar (apenas se modo de serviço)
                    try {
                        const { data: createData, error: createError } = await supabaseClient
                            .storage
                            .createBucket('imagens', {
                                public: true
                            });
                            
                        if (createError) throw createError;
                        console.log('Bucket imagens criado com sucesso');
                    } catch (bucketCreateError) {
                        console.error('Erro ao criar bucket:', bucketCreateError);
                        throw new Error('Não foi possível criar o bucket de armazenamento. O puxador será salvo sem foto.');
                    }
                }
                
                // Upload do arquivo para o storage
                const { data: uploadData, error: uploadError } = await supabaseClient
                    .storage
                    .from('imagens')
                    .upload(filePath, file);
                    
                if (uploadError) {
                    console.error('Erro ao fazer upload da imagem:', uploadError);
                    throw new Error('Erro ao fazer upload da imagem. O puxador será salvo sem foto.');
                }
                
                // Obter URL público da imagem
                const { data: urlData } = supabaseClient
                    .storage
                    .from('imagens')
                    .getPublicUrl(filePath);
                    
                fotoUrl = urlData.publicUrl;
            } catch (uploadException) {
                // CORREÇÃO 2: Permitir salvar mesmo se o upload falhar
                console.error('Erro no processo de upload:', uploadException);
                mostrarNotificacao(uploadException.message, 'warning');
                // Manter fotoUrl como estava antes - null ou valor anterior
                // Continuamos o fluxo para salvar o puxador sem foto
            }
        }
        
        // Preparar objeto inicial para o puxador
        const puxador = {
            nome: modelo,  // O campo 'modelo' do formulário vai para 'nome' na tabela
            modelo,
            fabricante: fabricante || null, 
            cor: cor || null,
            medida: medida || null,
            foto: fotoUrl
        };
        
        // Se for uma atualização, manter o id_usuario original
        // Se for uma criação, usar ID do usuário que existe na tabela
        if (id && itemAtual && itemAtual.id_usuario) {
            // Manter o id_usuario original em atualizações
            puxador.id_usuario = itemAtual.id_usuario;
        } else {
            // CORREÇÃO TEMPORÁRIA: Usar o ID do usuário que sabemos que existe
            puxador.id_usuario = "c2319b68-6e15-4798-aacb-ed840126241d"; // Ricardo
        }
        
        // Log para diagnóstico
        console.log('Salvando puxador com id_usuario:', puxador.id_usuario);
        
        // Verificar se estamos em modo demo
        if (tabelaPuxadoresInexistente) {
            if (id) {
                // Atualizar puxador existente
                const index = PUXADORES_DEMO.findIndex(p => p.id === id);
                if (index !== -1) {
                    PUXADORES_DEMO[index] = {
                        ...PUXADORES_DEMO[index],
                        ...puxador
                    };
                }
            } else {
                // Adicionar novo puxador
                const novoId = String(Date.now());
                PUXADORES_DEMO.push({
                    id: novoId,
                    ...puxador,
                    criado_em: new Date().toISOString()
                });
            }
            
            // Fechar modal
            if (modalCadastro) {
                modalCadastro.hide();
            }
            
            // Recarregar dados
            renderizarTabelaPuxadores(PUXADORES_DEMO, true); // true = tratar como admin
            
            // Mostrar notificação
            mostrarNotificacao(
                id ? 'Puxador atualizado com sucesso (modo demonstração)!' : 'Puxador adicionado com sucesso (modo demonstração)!', 
                'success'
            );
            
            return;
        }
        
        let resultado;
        
        // Adicionar criado_em apenas para registros novos
        if (!id) {
            puxador.criado_em = new Date().toISOString();
        }
        
        // Editar ou criar novo puxador
        if (id) {
            // Atualizar
            resultado = await supabaseClient
                .from('puxadores')
                .update(puxador)
                .eq('id', id);
        } else {
            // Criar novo
            resultado = await supabaseClient
                .from('puxadores')
                .insert(puxador);
        }
        
        if (resultado.error) throw resultado.error;
        
        // Fechar modal
        if (modalCadastro) {
            modalCadastro.hide();
        }
        
        // Recarregar dados
        carregarPuxadores();
        
        // Atualizar selects da interface principal (se a função estiver disponível)
        if (window.popularPuxadoresSelect) {
            await window.popularPuxadoresSelect();
        }
        
        // Mostrar notificação
        mostrarNotificacao(
            id ? 'Puxador atualizado com sucesso!' : 'Puxador adicionado com sucesso!', 
            'success'
        );
        
        // Resetar item atual
        itemAtual = null;
    } catch (error) {
        console.error('Erro ao salvar puxador:', error);
        mostrarNotificacao('Erro ao salvar puxador: ' + error.message, 'error');
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
    document.getElementById('itemModelo').placeholder = 'Nome do trilho (ex: RO-654025)';
    
    // Ajustar campo de medida para tipo
    document.querySelector('label[for="itemMedida"]').textContent = 'Tipo (opcional)';
    document.getElementById('itemMedida').placeholder = 'Embutir ou Sobrepor (opcional)';
    
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
        document.getElementById('itemModelo').placeholder = 'Nome do trilho (ex: RO-654025)';
        
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
            .select('nome, tipo')
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