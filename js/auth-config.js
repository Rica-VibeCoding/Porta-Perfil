/**
 * Configuração de autenticação
 * Sistema de Portas e Perfis
 */

// Usuário administrativo com permissões especiais
export const ADMIN_USER = {
  email: 'ricardo.nilton@hotmail.com',
  nome: 'Ricardo Nilton Borges',
  empresa: 'Conecta Móveis e Representações'
};

// Verificar se um usuário é admin
export function isAdmin(email) {
  return email && email.toLowerCase() === ADMIN_USER.email.toLowerCase();
} 