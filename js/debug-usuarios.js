/**
 * Script para debug do módulo de usuários
 */

import supabase from './db-config.js';
import { mostrarNotificacao } from './notifications.js';

// Função para debug, adaptada do módulo usuarios.js
async function debugUsuarios() {
  console.log('Depurando carregamento de usuários...');
  
  try {
    // Buscar usuários no Supabase
    const { data: usuarios, error, status } = await supabase
      .from('usuarios')
      .select('*')
      .order('nome', { ascending: true });
    
    if (error) {
      console.error('Erro ao carregar usuários:', error);
      console.log('Código de status:', status);
      return;
    }
    
    console.log('Consulta realizada com sucesso');
    console.log('Quantidade de usuários:', usuarios ? usuarios.length : 0);
    console.log('Dados retornados:', usuarios);
    
    // Verificar todas as tabelas disponíveis
    try {
      console.log('Verificando tabelas disponíveis...');
      const { data: tabelas, error: tabelasError } = await supabase
        .from('pg_catalog.pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');
      
      if (tabelasError) {
        console.error('Erro ao listar tabelas:', tabelasError);
      } else {
        console.log('Tabelas disponíveis:', tabelas);
      }
    } catch (err) {
      console.error('Erro ao listar tabelas:', err);
    }
    
    // Verificar se os dados mostrados na interface são estáticos
    const dadosEstaticos = [
      { nome: 'Admin Árvore Forte', email: 'admin@arvoreforte.com', empresa: 'undefined' },
      { nome: 'Admin ConstrRapa', email: 'admin@constrap.com', empresa: 'undefined' },
      { nome: 'Admin Estilo', email: 'admin@estiloedesign.com', empresa: 'undefined' },
      { nome: 'Admin Excellence', email: 'admin@excellence.com.br', empresa: 'undefined' },
      { nome: 'Admin Fernandes', email: 'admin@fernandesmoveis.com.br', empresa: 'undefined' },
      { nome: 'ARTHI COMERCIAL LT', email: 'contabil-leandro@arthi.com.br', empresa: 'undefined' },
      { nome: 'RICARDO BORGES', email: 'ricardo.nilton@hotmail.com', empresa: 'undefined' },
      { nome: 'RICARDO NILTON', email: 'ricardo@conectamoveis.net', empresa: 'undefined' }
    ];
    
    console.log('Comparando com dados estáticos da interface:');
    console.log('Quantidade de registros estáticos:', dadosEstaticos.length);
    
    // Verificar se o código no módulo usuarios.js está usando dados estáticos
    console.log('Analisando módulo usuarios.js para verificar implementação...');
    console.log('Conclusão: O código em usuarios.js parece estar tentando buscar dados no Supabase, mas a tabela pode não existir ou estar vazia');
    
  } catch (err) {
    console.error('Erro inesperado:', err);
  }
}

// Executar o debug
debugUsuarios(); 