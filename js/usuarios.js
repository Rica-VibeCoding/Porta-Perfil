/**
 * Módulo de gerenciamento de usuários
 * Sistema de Portas e Perfis
 */

import supabase from './db-config.js';
import { mostrarNotificacao } from './notifications.js';

/**
 * Dados estáticos de usuários para demonstração
 * Usados quando a tabela no Supabase não existe ou está vazia
 */
const USUARIOS_DEMO = [
  { id: '1', nome: 'Admin Árvore Forte', email: 'admin@arvoreforte.com', empresa: 'undefined', created_at: new Date(), ultimo_acesso: null },
  { id: '2', nome: 'Admin ConstrRapa', email: 'admin@constrap.com', empresa: 'undefined', created_at: new Date(), ultimo_acesso: null },
  { id: '3', nome: 'Admin Estilo', email: 'admin@estiloedesign.com', empresa: 'undefined', created_at: new Date(), ultimo_acesso: null },
  { id: '4', nome: 'Admin Excellence', email: 'admin@excellence.com.br', empresa: 'undefined', created_at: new Date(), ultimo_acesso: null },
  { id: '5', nome: 'Admin Fernandes', email: 'admin@fernandesmoveis.com.br', empresa: 'undefined', created_at: new Date(), ultimo_acesso: null },
  { id: '6', nome: 'ARTHI COMERCIAL LT', email: 'contabil-leandro@arthi.com.br', empresa: 'undefined', created_at: new Date(), ultimo_acesso: null },
  { id: '7', nome: 'RICARDO BORGES', email: 'ricardo.nilton@hotmail.com', empresa: 'undefined', created_at: new Date(), ultimo_acesso: null },
  { id: '8', nome: 'RICARDO NILTON', email: 'ricardo@conectamoveis.net', empresa: 'undefined', created_at: new Date(), ultimo_acesso: null }
];

/**
 * Flag que indica se a tabela 'usuarios' não existe
 * Isso evita tentativas repetidas de conexão quando sabemos que vai falhar
 */
let tabelaUsuariosInexistente = false;

/**
 * Inicializa o gerenciamento de usuários
 */
export function inicializarGerenciamentoUsuarios() {
  console.log('Inicializando gerenciamento de usuários...');
  
  // Configurar botão para gerenciar usuários
  const btnGerenciarUsuarios = document.getElementById('btnGerenciarUsuarios');
  if (btnGerenciarUsuarios) {
    btnGerenciarUsuarios.addEventListener('click', carregarUsuarios);
  }
  
  // Botão para adicionar novo usuário
  const btnNovoUsuario = document.getElementById('btnNovoUsuario');
  if (btnNovoUsuario) {
    btnNovoUsuario.addEventListener('click', mostrarFormNovoUsuario);
  }

  // Configurar modal de usuários
  const usuariosModal = document.getElementById('usuariosModal');
  if (usuariosModal) {
    usuariosModal.addEventListener('show.bs.modal', carregarUsuarios);
  }

  // Configurar botão de salvar usuário
  const btnSalvarUsuario = document.getElementById('btnSalvarUsuario');
  if (btnSalvarUsuario) {
    btnSalvarUsuario.addEventListener('click', salvarUsuario);
  }

  // Configurar botão de confirmar exclusão
  const btnConfirmarExclusao = document.getElementById('btnConfirmarExclusao');
  if (btnConfirmarExclusao) {
    btnConfirmarExclusao.addEventListener('click', excluirUsuario);
  }
  
  // Configurar eventos para garantir largura dos modais
  const usuarioFormModal = document.getElementById('usuarioFormModal');
  if (usuarioFormModal) {
    usuarioFormModal.addEventListener('show.bs.modal', () => {
      const modalDialog = usuarioFormModal.querySelector('.modal-dialog');
      modalDialog.style.width = '440px';
      modalDialog.style.maxWidth = '90%';
    });
  }
  
  const confirmarExclusaoModal = document.getElementById('confirmarExclusaoModal');
  if (confirmarExclusaoModal) {
    confirmarExclusaoModal.addEventListener('show.bs.modal', () => {
      const modalDialog = confirmarExclusaoModal.querySelector('.modal-dialog');
      modalDialog.style.width = '440px';
      modalDialog.style.maxWidth = '90%';
    });
  }

  console.log('Gerenciamento de usuários inicializado');
}

/**
 * Carrega os usuários do Supabase
 */
async function carregarUsuarios() {
  console.log('Carregando usuários...');
  const tabelaUsuarios = document.getElementById('tabelaUsuarios');
  
  if (!tabelaUsuarios) {
    console.error('Elemento tabelaUsuarios não encontrado');
    return;
  }
  
  // Exibir mensagem de carregamento
  tabelaUsuarios.innerHTML = '<tr><td colspan="6" class="text-center">Carregando usuários...</td></tr>';
  
  // Se sabemos que a tabela não existe, usamos diretamente os dados de demonstração
  if (tabelaUsuariosInexistente) {
    console.log('Tabela usuarios inexistente, usando dados de demonstração');
    carregarUsuariosDemonstracao(tabelaUsuarios);
    return;
  }
  
  try {
    // Buscar usuários no Supabase
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nome', { ascending: true });
    
    if (error) {
      console.error('Erro ao carregar usuários:', error);
      
      // Se o erro for que a tabela não existe (código 42P01), marcamos isso para futuras chamadas
      if (error.code === '42P01') {
        console.warn('A tabela usuarios não existe no Supabase. Usando dados de demonstração.');
        tabelaUsuariosInexistente = true;
      }
      
      // Mostrar dados de demonstração em caso de erro
      carregarUsuariosDemonstracao(tabelaUsuarios);
      
      // Mostrar notificação apenas em produção
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        mostrarNotificacao('Erro ao conectar com o banco de dados. Usando dados de demonstração.', 'warning');
      }
      return;
    }
    
    if (!usuarios || usuarios.length === 0) {
      console.log('Nenhum usuário encontrado no banco, usando dados de demonstração');
      carregarUsuariosDemonstracao(tabelaUsuarios);
      return;
    }
    
    // Dados reais encontrados, exibir na tabela
    carregarUsuariosNaTabela(tabelaUsuarios, usuarios);
    console.log(`${usuarios.length} usuários carregados do banco de dados`);
    
  } catch (error) {
    console.error('Erro ao processar usuários:', error);
    carregarUsuariosDemonstracao(tabelaUsuarios);
    mostrarNotificacao('Erro ao processar dados de usuários. Usando dados de demonstração.', 'warning');
  }
}

/**
 * Carrega os usuários de demonstração na tabela
 * @param {HTMLElement} tabelaUsuarios - Elemento da tabela
 */
function carregarUsuariosDemonstracao(tabelaUsuarios) {
  carregarUsuariosNaTabela(tabelaUsuarios, USUARIOS_DEMO);
  console.log('Dados de demonstração carregados na tabela');
}

/**
 * Carrega os usuários na tabela
 * @param {HTMLElement} tabelaUsuarios - Elemento da tabela
 * @param {Array} usuarios - Array de usuários a serem exibidos
 */
function carregarUsuariosNaTabela(tabelaUsuarios, usuarios) {
  // Limpar tabela e popular com os dados
  tabelaUsuarios.innerHTML = '';
  
  // Adicionar estilo personalizado para a tabela
  const style = document.getElementById('usuarios-table-style') || document.createElement('style');
  if (!document.getElementById('usuarios-table-style')) {
    style.id = 'usuarios-table-style';
    style.innerHTML = `
      #usuariosModal .table {
        font-size: 0.85rem;
        line-height: 1.2;
        table-layout: fixed;
        width: 100%;
        margin-bottom: 0;
      }
      #usuariosModal .table-responsive {
        border-radius: 4px;
        overflow: hidden;
      }
      #usuariosModal .table td, 
      #usuariosModal .table th {
        padding: 0.4rem 0.5rem;
        vertical-align: middle;
      }
      #usuariosModal .table th {
        background-color: #f8f9fa;
        border-bottom: 2px solid #dee2e6;
        font-weight: 600;
      }
      #usuariosModal .btn-actions {
        white-space: nowrap;
        display: flex;
        gap: 0.25rem;
        justify-content: center;
      }
      #usuariosModal .btn-sm {
        padding: 0.2rem 0.4rem;
        font-size: 0.75rem;
      }
      .truncate-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .date-column {
        width: 100px;
        text-align: center;
        white-space: nowrap;
        padding-left: 0;
        padding-right: 0;
      }
      .actions-column {
        width: 80px;
        text-align: center;
      }
      .email-column {
        width: 25%;
      }
      .name-column {
        width: 20%;
      }
      .company-column {
        width: 25%;
      }
      /* Ajuste específico para a largura dos modais */
      #usuarioFormModal .modal-dialog,
      #confirmarExclusaoModal .modal-dialog {
        width: 440px;
        max-width: 90%;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Adicionar cabeçalho com classes específicas
  const thead = tabelaUsuarios.closest('table').querySelector('thead');
  if (thead) {
    thead.innerHTML = `
      <tr>
        <th class="name-column">Nome</th>
        <th class="email-column">Email</th>
        <th class="company-column">Empresa</th>
        <th class="date-column">Data Cadastro</th>
        <th class="date-column">Último Acesso</th>
        <th class="actions-column">Ações</th>
      </tr>
    `;
  }
  
  usuarios.forEach(usuario => {
    const dataFormatada = new Date(usuario.created_at).toLocaleDateString('pt-BR');
    const ultimoAcesso = usuario.ultimo_acesso 
      ? new Date(usuario.ultimo_acesso).toLocaleDateString('pt-BR') 
      : 'Nunca acessou';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="name-column truncate-text" title="${usuario.nome}">${usuario.nome}</td>
      <td class="email-column truncate-text" title="${usuario.email}">${usuario.email}</td>
      <td class="company-column truncate-text" title="${usuario.empresa}">${usuario.empresa}</td>
      <td class="date-column">${dataFormatada}</td>
      <td class="date-column">${ultimoAcesso}</td>
      <td class="actions-column">
        <div class="btn-actions">
          <button class="btn btn-sm btn-warning btn-editar" data-id="${usuario.id}" title="Editar">
            <i class="bi bi-pencil-fill"></i>
          </button>
          <button class="btn btn-sm btn-danger btn-excluir" data-id="${usuario.id}" title="Excluir">
            <i class="bi bi-trash-fill"></i>
          </button>
        </div>
      </td>
    `;
    
    // Adicionar eventos aos botões de ação
    const btnEditar = tr.querySelector('.btn-editar');
    const btnExcluir = tr.querySelector('.btn-excluir');
    
    btnEditar.addEventListener('click', () => {
      editarUsuario(usuario.id);
    });
    
    btnExcluir.addEventListener('click', () => {
      confirmarExclusao(usuario.id, usuario.nome);
    });
    
    tabelaUsuarios.appendChild(tr);
  });
}

/**
 * Exibe o formulário para adicionar novo usuário
 */
function mostrarFormNovoUsuario() {
  console.log('Abrindo formulário para novo usuário');
  
  // Limpar o formulário
  document.getElementById('formUsuario').reset();
  document.getElementById('usuarioId').value = '';
  
  // Alterar o título do modal
  document.getElementById('tituloFormUsuario').textContent = 'Novo Usuário';
  
  // Remover classes de validação
  document.getElementById('usuarioNome').classList.remove('is-invalid', 'is-valid');
  document.getElementById('usuarioEmail').classList.remove('is-invalid', 'is-valid');
  document.getElementById('usuarioEmpresa').classList.remove('is-invalid', 'is-valid');
  
  // Garantir que o modal mantenha o tamanho correto
  const modalElement = document.getElementById('usuarioFormModal');
  const modalDialog = modalElement.querySelector('.modal-dialog');
  modalDialog.style.width = '440px';
  modalDialog.style.maxWidth = '90%';
  
  // Abrir o modal
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
}

/**
 * Busca e exibe o formulário para editar um usuário
 * @param {string} id - ID do usuário a ser editado
 */
async function editarUsuario(id) {
  console.log('Editando usuário:', id);
  
  let usuario;
  
  // Se estamos em modo de demonstração, buscamos no array local
  if (tabelaUsuariosInexistente) {
    usuario = USUARIOS_DEMO.find(u => u.id === id);
    
    if (!usuario) {
      mostrarNotificacao('Usuário não encontrado', 'erro');
      return;
    }
    
    preencherFormularioEdicao(usuario);
    return;
  }
  
  // Buscar dados no Supabase
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar usuário:', error);
      mostrarNotificacao('Erro ao buscar dados do usuário', 'erro');
      return;
    }
    
    if (!data) {
      mostrarNotificacao('Usuário não encontrado', 'erro');
      return;
    }
    
    usuario = data;
    preencherFormularioEdicao(usuario);
    
  } catch (error) {
    console.error('Erro ao processar edição do usuário:', error);
    mostrarNotificacao('Erro ao processar dados do usuário', 'erro');
  }
}

/**
 * Preenche o formulário com os dados do usuário para edição
 * @param {Object} usuario - Dados do usuário
 */
function preencherFormularioEdicao(usuario) {
  document.getElementById('usuarioId').value = usuario.id;
  document.getElementById('usuarioNome').value = usuario.nome;
  document.getElementById('usuarioEmail').value = usuario.email;
  document.getElementById('usuarioEmpresa').value = usuario.empresa || '';
  
  // Alterar o título do modal
  document.getElementById('tituloFormUsuario').textContent = 'Editar Usuário';
  
  // Garantir que o modal mantenha o tamanho correto
  const modalElement = document.getElementById('usuarioFormModal');
  const modalDialog = modalElement.querySelector('.modal-dialog');
  modalDialog.style.width = '440px';
  modalDialog.style.maxWidth = '90%';
  
  // Abrir o modal
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
}

/**
 * Confirma a exclusão de um usuário
 * @param {string} id - ID do usuário a ser excluído
 * @param {string} nome - Nome do usuário para exibição
 */
function confirmarExclusao(id, nome) {
  console.log('Confirmando exclusão do usuário:', id, nome);
  
  // Preencher dados no modal de confirmação
  document.getElementById('idUsuarioExclusao').value = id;
  document.getElementById('nomeUsuarioExclusao').textContent = nome;
  
  // Garantir que o modal mantenha o tamanho correto
  const modalElement = document.getElementById('confirmarExclusaoModal');
  const modalDialog = modalElement.querySelector('.modal-dialog');
  modalDialog.style.width = '440px';
  modalDialog.style.maxWidth = '90%';
  
  // Abrir o modal de confirmação
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
}

/**
 * Salva os dados do usuário (novo ou editado)
 */
async function salvarUsuario() {
  console.log('Salvando dados do usuário...');
  
  // Validar o formulário
  const form = document.getElementById('formUsuario');
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    mostrarNotificacao('Por favor, preencha todos os campos obrigatórios', 'aviso');
    return;
  }
  
  // Obter dados do formulário
  const id = document.getElementById('usuarioId').value;
  const nome = document.getElementById('usuarioNome').value;
  const email = document.getElementById('usuarioEmail').value;
  const empresa = document.getElementById('usuarioEmpresa').value;
  
  // Verificar se é um novo usuário ou edição
  const isNovo = !id;
  
  // Se estamos em modo de demonstração, simulamos a operação
  if (tabelaUsuariosInexistente) {
    if (isNovo) {
      // Criar novo usuário com ID único
      const novoId = String(Math.max(...USUARIOS_DEMO.map(u => parseInt(u.id))) + 1);
      const novoUsuario = {
        id: novoId,
        nome,
        email,
        empresa,
        created_at: new Date(),
        ultimo_acesso: null
      };
      
      USUARIOS_DEMO.push(novoUsuario);
      mostrarNotificacao('Usuário adicionado com sucesso (modo demonstração)', 'sucesso');
    } else {
      // Buscar e atualizar usuário existente
      const index = USUARIOS_DEMO.findIndex(u => u.id === id);
      
      if (index !== -1) {
        USUARIOS_DEMO[index] = {
          ...USUARIOS_DEMO[index],
          nome,
          email,
          empresa
        };
        mostrarNotificacao('Usuário atualizado com sucesso (modo demonstração)', 'sucesso');
      } else {
        mostrarNotificacao('Usuário não encontrado', 'erro');
      }
    }
    
    // Fechar o modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('usuarioFormModal'));
    modal.hide();
    
    // Recarregar a tabela
    carregarUsuarios();
    return;
  }
  
  // Em modo real, persistir no Supabase
  try {
    let response, error;
    
    if (isNovo) {
      // Inserir novo usuário
      ({ data: response, error } = await supabase
        .from('usuarios')
        .insert({
          nome,
          email,
          empresa,
          created_at: new Date().toISOString()
        })
        .select());
    } else {
      // Atualizar usuário existente
      ({ data: response, error } = await supabase
        .from('usuarios')
        .update({
          nome,
          email,
          empresa
        })
        .eq('id', id)
        .select());
    }
    
    if (error) {
      console.error('Erro ao salvar usuário:', error);
      mostrarNotificacao('Erro ao salvar dados do usuário', 'erro');
      return;
    }
    
    console.log('Usuário salvo com sucesso:', response);
    mostrarNotificacao(`Usuário ${isNovo ? 'cadastrado' : 'atualizado'} com sucesso`, 'sucesso');
    
    // Fechar o modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('usuarioFormModal'));
    modal.hide();
    
    // Recarregar a tabela
    carregarUsuarios();
    
  } catch (error) {
    console.error('Erro ao processar salvamento do usuário:', error);
    mostrarNotificacao('Erro ao processar dados do usuário', 'erro');
  }
}

/**
 * Exclui um usuário
 */
async function excluirUsuario() {
  const id = document.getElementById('idUsuarioExclusao').value;
  
  console.log('Excluindo usuário:', id);
  
  // Se estamos em modo de demonstração, simulamos a operação
  if (tabelaUsuariosInexistente) {
    const index = USUARIOS_DEMO.findIndex(u => u.id === id);
    
    if (index !== -1) {
      USUARIOS_DEMO.splice(index, 1);
      mostrarNotificacao('Usuário excluído com sucesso (modo demonstração)', 'sucesso');
    } else {
      mostrarNotificacao('Usuário não encontrado', 'erro');
    }
    
    // Fechar o modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('confirmarExclusaoModal'));
    modal.hide();
    
    // Recarregar a tabela
    carregarUsuarios();
    return;
  }
  
  // Em modo real, excluir do Supabase
  try {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao excluir usuário:', error);
      mostrarNotificacao('Erro ao excluir usuário', 'erro');
      return;
    }
    
    console.log('Usuário excluído com sucesso');
    mostrarNotificacao('Usuário excluído com sucesso', 'sucesso');
    
    // Fechar o modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('confirmarExclusaoModal'));
    modal.hide();
    
    // Recarregar a tabela
    carregarUsuarios();
    
  } catch (error) {
    console.error('Erro ao processar exclusão do usuário:', error);
    mostrarNotificacao('Erro ao processar exclusão do usuário', 'erro');
  }
} 