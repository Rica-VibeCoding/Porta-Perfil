/**
 * Script para testar conexão com a tabela de usuários do Supabase
 */

import supabase from './db-config.js';

// Função para testar a conexão e listar usuários
async function testarConexaoUsuarios() {
  console.log('Testando conexão com Supabase...');
  
  try {
    // Verificar se a tabela existe fazendo uma consulta
    const { data, error, status } = await supabase
      .from('usuarios')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('Erro ao acessar tabela de usuários:', error);
      console.log('Código de status:', status);
      return;
    }
    
    // Mostrar resultados
    console.log('Conexão bem sucedida');
    console.log('Quantidade de registros encontrados:', data ? data.length : 0);
    console.log('Dados retornados:', data);
    
    // Listar todas as tabelas disponíveis
    console.log('Listando todas as tabelas disponíveis...');
    const { data: tabelas, error: tabelasError } = await supabase
      .rpc('list_tables');
    
    if (tabelasError) {
      console.error('Erro ao listar tabelas:', tabelasError);
    } else {
      console.log('Tabelas disponíveis:', tabelas);
    }
    
  } catch (err) {
    console.error('Erro inesperado:', err);
  }
}

// Executar o teste
testarConexaoUsuarios(); 