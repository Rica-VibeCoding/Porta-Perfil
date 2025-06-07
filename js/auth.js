/**
 * Módulo de autenticação simples
 * Sistema de Portas e Perfis
 */

import { isAdmin } from './auth-config.js';
import { mostrarNotificacao } from './notifications.js';
import supabase from './db-config.js';

// Chave para armazenamento local do usuário
const USER_STORAGE_KEY = 'porta_perfil_user';

// Referências aos modais
let loginModal;
let cadastroModal;

// Verifica se o usuário está logado
export function isLoggedIn() {
  return getCurrentUser() !== null;
}

// Verifica autenticação e retorna o status (usado para a tela de splash)
export function verificarAutenticacao() {
  const logado = isLoggedIn();
  return logado;
}

// Obtém o usuário atual do localStorage
export function getCurrentUser() {
  try {
    const userData = localStorage.getItem(USER_STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Erro ao recuperar usuário:', error);
    return null;
  }
}

// Verifica se o usuário atual é administrador
export function isCurrentUserAdmin() {
  const user = getCurrentUser();
  return user ? isAdmin(user.email) : false;
}

// Login do usuário - salva dados no localStorage
export function loginUser(user) {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    
    // Disparar evento de usuário logado para remover a classe not-authenticated do body
    const event = new CustomEvent('usuarioLogado', { detail: user });
    document.dispatchEvent(event);
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    return false;
  }
}

// Logout do usuário - remove dados do localStorage
export function logoutUser() {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return false;
  }
}

// Verificar se um email já está cadastrado
export async function verificarEmailCadastrado(email) {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nome, perfil')
      .eq('email', email)
      .single();
    
    if (error) {
      // Se o erro for por não encontrar o registro (404), significa que o email não existe
      if (error.code === 'PGRST116') {
        return { cadastrado: false };
      }
      
      // Para tabela não existente, consideramos que o email não existe
      if (error.code === '42P01') {
        console.warn('Tabela de usuários não existe, usando modo demonstração');
        
        // Verificar nos usuários de demonstração
        const usuarioDemo = USUARIOS_DEMO.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (usuarioDemo) {
          return { 
            cadastrado: true, 
            id: usuarioDemo.id || '00000000-0000-0000-0000-000000000001', // ID padrão para usuários de demonstração
            nome: usuarioDemo.nome,
            empresa: usuarioDemo.empresa || 'Não definida'
          };
        }
        
        return { cadastrado: false };
      }
      
      console.error('Erro ao verificar email:', error);
      // Em caso de erro de conexão ou outros, vamos considerar que o usuário não existe
      return { cadastrado: false, error };
    }
    
    // Retorna true se encontrou o email (usuário existe)
    if (data) {
      return { 
        cadastrado: true, 
        id: data.id || '00000000-0000-0000-0000-000000000001', // ID padrão caso não exista
        nome: data.nome,
        empresa: data.perfil || 'Não definida' // Mapear perfil para empresa
      };
    }
    
    return { cadastrado: false };
  } catch (error) {
    console.error('Erro ao verificar email cadastrado:', error);
    return { cadastrado: false, error };
  }
}

// Cadastrar novo usuário
export async function cadastrarUsuario(usuario) {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([usuario])
      .select();
      
    if (error) {
      console.error('Erro ao cadastrar usuário:', error);
      
      // Se a tabela não existir, consideramos que foi um sucesso para não bloquear o fluxo
      if (error.code === '42P01') {
        mostrarNotificacao('Registro de usuário: modo demonstração', 'info');
        return { success: true, modo: 'demo' };
      }
      
      return { success: false, error };
    }
    
    mostrarNotificacao('Usuário cadastrado com sucesso!', 'success');
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    return { success: false, error };
  }
}

// Inicializa a UI da autenticação
export function inicializarAuth() {
  console.log('Inicializando autenticação...');
  
  // Inicializar referências aos modais
  loginModal = new bootstrap.Modal(document.getElementById('loginModal'), {
    backdrop: 'static',   // Impede clicar fora para fechar
    keyboard: false       // Desabilita fechamento com ESC
  });
  
  cadastroModal = new bootstrap.Modal(document.getElementById('cadastroModal'), {
    backdrop: 'static',
    keyboard: false
  });
  
  // Configurar eventos dos formulários
  configurarEventosLogin();
  configurarEventosCadastro();
  
  // Verificar se já tem usuário logado e atualizar a UI
  const user = getCurrentUser();
  if (!user) {
    // Se não houver usuário logado, mostrar o modal de login
    mostrarLoginModal();
    
    // Remover a possibilidade de fechar o modal via botão X se não estiver logado
    const modalElement = document.getElementById('loginModal');
    if (modalElement) {
      const closeBtn = modalElement.querySelector('.btn-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
          // Se o usuário não estiver logado, impedir o fechamento do modal
          if (!isLoggedIn()) {
            e.preventDefault();
            e.stopPropagation();
            
            // Mostrar mensagem informativa
            const loginMessage = document.getElementById('loginMessage');
            if (loginMessage) {
              loginMessage.classList.remove('d-none');
              loginMessage.classList.add('alert-warning');
              loginMessage.textContent = 'É necessário fazer login para acessar o sistema.';
            }
            return false;
          }
        });
      }
    }
  } else {
    // Atualizar UI com usuário logado
    atualizarUIComUsuarioLogado();
    
    // Ocultar/mostrar elementos de admin conforme permissões
    atualizarPermissoesUI();
  }
  
  console.log('Autenticação inicializada');
}

// Configurar eventos do formulário de login
function configurarEventosLogin() {
  // Botão de submeter login
  const btnLoginSubmit = document.getElementById('btnLoginSubmit');
  if (btnLoginSubmit) {
    btnLoginSubmit.addEventListener('click', handleLoginSubmit);
  }
  
  // Permitir submissão com a tecla Enter
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleLoginSubmit();
      }
    });
  }
  
  // Link de esquecimento de senha
  const forgotPasswordLink = document.querySelector('.forgot-password');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', handleForgotPassword);
  }
  
  // Evento para o botão de mostrar login no header
  const userInfoContainer = document.getElementById('userInfoContainer');
  if (userInfoContainer) {
    // Verificar se já tem um botão de login
    const btnShowLogin = userInfoContainer.querySelector('#btnShowLogin');
    if (btnShowLogin) {
      btnShowLogin.addEventListener('click', mostrarLoginModal);
    }
  }
}

// Configurar eventos do formulário de cadastro
function configurarEventosCadastro() {
  // Botão de submeter cadastro
  const btnCadastroSubmit = document.getElementById('btnCadastroSubmit');
  if (btnCadastroSubmit) {
    btnCadastroSubmit.addEventListener('click', handleCadastroSubmit);
  }
  
  // Permitir submissão com a tecla Enter
  const cadastroForm = document.getElementById('cadastroForm');
  if (cadastroForm) {
    cadastroForm.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCadastroSubmit();
      }
    });
  }
}

// Manipular submissão do login
async function handleLoginSubmit() {
  // Processo de login simplificado
  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');
  
  // Limpar mensagens anteriores
  loginMessage.classList.add('d-none');
  
  // Validar formulário
  const nome = document.getElementById('loginNome').value.trim();
  const email = document.getElementById('loginEmail').value.trim();
  
  if (!nome || !email) {
    loginMessage.classList.remove('d-none');
    loginMessage.classList.add('alert-danger');
    loginMessage.textContent = 'Por favor, preencha todos os campos.';
    return;
  }
  
  try {
    // Verificar se é o admin
    if (isAdmin(email)) {
      // Login como admin - sistema livre
      const adminUser = {
        id: null, // Sistema livre: sem ID específico
        email,
        nome: nome || 'Administrador',
        empresa: 'Conecta Móveis e Representações'
      };
      
      // Salvar usuário no localStorage
      if (loginUser(adminUser)) {
        // Fechar modal
        loginModal.hide();
        
        // Atualizar interface
        atualizarUIComUsuarioLogado();
        
        // Atualizar permissões
        atualizarPermissoesUI();
        
        mostrarNotificacao(`Bem-vindo, ${adminUser.nome}!`, 'success');
      } else {
        loginMessage.classList.remove('d-none');
        loginMessage.classList.add('alert-danger');
        loginMessage.textContent = 'Erro ao fazer login. Tente novamente.';
      }
      return;
    }
    
    // Verificar se o email existe
    const emailVerificado = await verificarEmailCadastrado(email);
    
    if (emailVerificado.cadastrado) {
      // Login bem-sucedido com usuário existente - sistema livre
      const user = {
        id: null, // Sistema livre: sem ID específico
        email,
        nome: emailVerificado.nome || nome,
        empresa: emailVerificado.empresa || 'Não definida'
      };
      
      // Salvar usuário no localStorage
      if (loginUser(user)) {
        // Fechar modal
        loginModal.hide();
        
        // Atualizar interface
        atualizarUIComUsuarioLogado();
        
        // Atualizar permissões
        atualizarPermissoesUI();
        
        mostrarNotificacao(`Bem-vindo, ${user.nome}!`, 'success');
      } else {
        loginMessage.classList.remove('d-none');
        loginMessage.classList.add('alert-danger');
        loginMessage.textContent = 'Erro ao fazer login. Tente novamente.';
      }
    } else {
      // Usuário não encontrado, mostrar tela de cadastro
      loginModal.hide();
      
      // Preencher os dados do formulário de cadastro
      document.getElementById('cadastroNome').value = nome;
      document.getElementById('cadastroEmail').value = email;
      document.getElementById('cadastroEmpresa').value = '';
      document.getElementById('cadastroEmpresa').focus();
      
      // Mostrar mensagem
      const cadastroMessage = document.getElementById('cadastroMessage');
      cadastroMessage.classList.remove('d-none');
      cadastroMessage.classList.add('alert-info');
      cadastroMessage.textContent = 'Email não encontrado. Complete seu cadastro.';
      
      // Mostrar modal de cadastro
      cadastroModal.show();
    }
  } catch (error) {
    console.error('Erro no processo de login:', error);
    loginMessage.classList.remove('d-none');
    loginMessage.classList.add('alert-danger');
    loginMessage.textContent = 'Ocorreu um erro inesperado. Tente novamente.';
  }
}

// Manipular submissão do cadastro
async function handleCadastroSubmit() {
  try {
    // Obter valores do formulário
    const nome = document.getElementById('cadastroNome').value.trim();
    const email = document.getElementById('cadastroEmail').value.trim();
    const empresa = document.getElementById('cadastroEmpresa').value.trim();
    
    // Validações básicas
    if (!nome || !email || !empresa) {
      mostrarNotificacao('Preencha todos os campos', 'error');
      return;
    }
    
    // Sistema livre: apenas salvar no localStorage, sem banco
    const usuarioFinal = {
      id: null, // Sistema livre: sem ID específico
      nome,
      email,
      empresa: empresa,
      ativo: true,
      criado_em: new Date().toISOString()
    };
    
    // Para sistema livre, não tentar cadastrar no banco
    // Apenas fazer login direto
    if (loginUser(usuarioFinal)) {
        // Fechar modal de cadastro
        cadastroModal.hide();
        
        // Atualizar UI
        atualizarUIComUsuarioLogado();
        
        // Mostrar mensagem de sucesso
        mostrarNotificacao('Cadastro realizado com sucesso!', 'success');
      } else {
        mostrarNotificacao('Erro ao salvar dados do usuário.', 'error');
      }
  } catch (error) {
    console.error('Erro no cadastro:', error);
    mostrarNotificacao('Erro ao cadastrar usuário', 'error');
  }
}

// Mostrar o modal de login
function mostrarLoginModal() {
  // Limpar formulário
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.reset();
  
  // Limpar mensagens
  const loginMessage = document.getElementById('loginMessage');
  if (loginMessage) loginMessage.classList.add('d-none');
  
  // Exibir modal
  loginModal.show();
}

// Atualiza a UI com o usuário logado
function atualizarUIComUsuarioLogado() {
  const user = getCurrentUser();
  const userInfoContainer = document.getElementById('userInfoContainer');
  
  if (!userInfoContainer) {
    console.warn('Container de informações do usuário não encontrado');
    return;
  }
  
  if (user) {
    // Mostra apenas o nome do usuário, sem o email
    userInfoContainer.innerHTML = `
      <div class="user-info">
        <div class="user-info-text">
          <span class="user-name" style="color: rgba(255, 255, 255, 0.85);">${user.nome}</span>
        </div>
      </div>
    `;
    
    // Criar o botão de logout separadamente para melhor posicionamento
    const logoutButton = document.createElement('button');
    logoutButton.id = 'btnLogout';
    logoutButton.className = 'btn-logout';
    logoutButton.setAttribute('aria-label', 'Sair');
    logoutButton.innerHTML = '<i class="bi bi-box-arrow-right"></i>';
    
    // Adicionar o botão ao header diretamente para melhor posicionamento
    const headerContent = document.querySelector('.header-content');
    if (headerContent) {
      headerContent.appendChild(logoutButton);
      
      // Adicionar evento de logout
      logoutButton.addEventListener('click', handleLogout);
    }
    
    console.log('UI atualizada com usuário logado:', user.nome);
  } else {
    // Se não há usuário logado, exibe o texto "Deslogado" com ícone
    console.log('Nenhum usuário logado, exibindo status deslogado');
    userInfoContainer.innerHTML = `
      <div class="user-status-deslogado">
        <i class="bi bi-person"></i>
        <span>Deslogado</span>
      </div>
    `;
    
    // Adicionar evento de clique para abrir o modal de login
    userInfoContainer.addEventListener('click', mostrarLoginModal);
    
    // Remover qualquer botão de logout existente
    const existingLogoutBtn = document.getElementById('btnLogout');
    if (existingLogoutBtn) {
      existingLogoutBtn.remove();
    }
  }
}

// Atualiza elementos da UI baseado nas permissões do usuário
function atualizarPermissoesUI() {
  // Mostrar a seção de gerenciamento para todos os usuários
  const accordionItems = document.querySelectorAll('.accordion-item');
  
  // Procurar o item do accordion que contém o headingGerenciamento
  for (const item of accordionItems) {
    if (item.querySelector('#headingGerenciamento')) {
      // Sempre mostrar a seção de gerenciamento (agora todos os usuários têm acesso)
      item.style.display = 'block';
      break;
    }
  }
  
  // Ocultar/mostrar botão de gerenciar usuários com base na permissão de administrador
  const btnGerenciarUsuarios = document.getElementById('btnGerenciarUsuarios');
  if (btnGerenciarUsuarios) {
    // Apenas administradores podem ver o botão de gerenciar usuários
    if (isCurrentUserAdmin()) {
      btnGerenciarUsuarios.style.display = 'block';
    } else {
      btnGerenciarUsuarios.style.display = 'none';
    }
  }
}

// Handler para o botão de logout
function handleLogout() {
  if (logoutUser()) {
    mostrarNotificacao('Logout realizado com sucesso', 'success');
    // Atualizar UI
    atualizarUIComUsuarioLogado();
    atualizarPermissoesUI();
  } else {
    mostrarNotificacao('Erro ao fazer logout', 'error');
  }
}

// Lidar com esquecimento de senha
function handleForgotPassword(e) {
  e.preventDefault();
  
  // Mostrar mensagem no formulário
  const loginMessage = document.getElementById('loginMessage');
  loginMessage.classList.remove('d-none', 'alert-danger');
  loginMessage.classList.add('alert-info');
  
  loginMessage.innerHTML = `
    <p class="mb-3">Para acessar, basta lembrar o nome e o e-mail que você usou no cadastro.</p>
    <p class="mb-3">Caso queira criar um novo acesso, é só preencher novamente com seu nome e e-mail.</p>
    <p>Se tiver qualquer dúvida, envie um e-mail para: <strong>ricardo@conectamoveis.net.br</strong>.</p>
  `;
  
  // Notificação
  mostrarNotificacao('Instruções de acesso exibidas', 'info');
}

// Função para gerar UUID temporário válido
function generateTempUUID() {
  return 'temp-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Dados estáticos para demonstração (importado de usuarios.js)
const USUARIOS_DEMO = [
  { id: '1', nome: 'Admin Árvore Forte', email: 'admin@arvoreforte.com', empresa: 'Árvore Forte', created_at: new Date(), ultimo_acesso: null },
  { id: '2', nome: 'Admin ConstrRapa', email: 'admin@constrap.com', empresa: 'ConstrRapa', created_at: new Date(), ultimo_acesso: null },
  { id: '3', nome: 'Admin Estilo', email: 'admin@estiloedesign.com', empresa: 'Estilo & Design', created_at: new Date(), ultimo_acesso: null },
  { id: '4', nome: 'Admin Excellence', email: 'admin@excellence.com.br', empresa: 'Excellence', created_at: new Date(), ultimo_acesso: null },
  { id: '5', nome: 'Admin Fernandes', email: 'admin@fernandesmoveis.com.br', empresa: 'Fernandes Móveis', created_at: new Date(), ultimo_acesso: null },
  { id: '6', nome: 'ARTHI COMERCIAL LT', email: 'contabil-leandro@arthi.com.br', empresa: 'ARTHI Comercial', created_at: new Date(), ultimo_acesso: null },
  { id: '7', nome: 'RICARDO BORGES', email: 'ricardo.nilton@hotmail.com', empresa: 'Conecta Móveis e Representações', created_at: new Date(), ultimo_acesso: null },
  { id: '8', nome: 'RICARDO NILTON', email: 'ricardo@conectamoveis.net', empresa: 'Conecta Móveis', created_at: new Date(), ultimo_acesso: null }
]; 