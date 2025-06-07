/**
 * Script de debug para Supabase - Sistema de Portas e Perfis
 * Testa conexão, headers e estrutura de tabelas
 */

// Configurações do Supabase
const SUPABASE_URL = 'https://nzgifjdewdfibcopolof.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z2lmamRld2RmaWJjb3BvbG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA4NDAsImV4cCI6MjA2MzAzNjg0MH0.O7MKZNx_Cd-Z12iq8h0pq6Sq0bmJazcxDHvlVb4VJQc';

async function debugSupabaseConnection() {
  console.log('🔍 Iniciando debug da conexão Supabase...');
  console.log('URL:', SUPABASE_URL);
  console.log('Key:', SUPABASE_ANON_KEY.substring(0, 50) + '...');

  // Teste 1: Verificar se o servidor responde
  try {
    console.log('\n📡 Teste 1: Conectividade básica...');
    const response = await fetch(SUPABASE_URL + '/rest/v1/', {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('Status:', response.status, response.statusText);
    console.log('Headers de resposta:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erro na conectividade:', error);
    } else {
      console.log('✅ Conectividade básica OK');
    }
  } catch (error) {
    console.error('❌ Erro de rede:', error);
  }

  // Teste 2: Verificar tabelas disponíveis
  try {
    console.log('\n📋 Teste 2: Listando tabelas disponíveis...');
    const response = await fetch(SUPABASE_URL + '/rest/v1/', {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Accept': 'application/vnd.pgrst.object+json'
      }
    });
    
    console.log('Status:', response.status);
    const data = await response.text();
    console.log('Resposta do servidor:', data);
  } catch (error) {
    console.error('❌ Erro ao listar tabelas:', error);
  }

  // Teste 3: Tentar acessar tabela usuarios com diferentes métodos
  console.log('\n👤 Teste 3: Testando acesso à tabela usuarios...');
  
  const testMethods = [
    // Método 1: Query simples
    {
      name: 'Query simples',
      url: SUPABASE_URL + '/rest/v1/usuarios',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Accept': 'application/json'
      }
    },
    
    // Método 2: Com limit
    {
      name: 'Com limit',
      url: SUPABASE_URL + '/rest/v1/usuarios?limit=1',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Accept': 'application/json'
      }
    },
    
    // Método 3: Select específico
    {
      name: 'Select específico',
      url: SUPABASE_URL + '/rest/v1/usuarios?select=*',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Accept': 'application/json'
      }
    }
  ];

  for (const method of testMethods) {
    try {
      console.log(`\n  🔸 Testando: ${method.name}`);
      console.log(`     URL: ${method.url}`);
      
      const response = await fetch(method.url, {
        method: 'GET',
        headers: method.headers
      });
      
      console.log(`     Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 406) {
        console.log('     ⚠️ Erro 406: Not Acceptable - Possível problema de headers');
        const errorText = await response.text();
        console.log('     Erro detalhado:', errorText);
      } else if (response.status === 404) {
        console.log('     ⚠️ Tabela usuarios não encontrada');
      } else if (response.status === 401) {
        console.log('     ⚠️ Não autorizado - problema com chave API');
      } else if (response.ok) {
        console.log('     ✅ Sucesso!');
        const data = await response.json();
        console.log('     Dados:', data.length ? `${data.length} registros` : 'Nenhum registro');
      } else {
        const errorText = await response.text();
        console.log('     ❌ Erro:', errorText);
      }
    } catch (error) {
      console.error(`     ❌ Erro no método ${method.name}:`, error);
    }
  }

  // Teste 4: Verificar outras tabelas conhecidas
  console.log('\n🗂️ Teste 4: Verificando outras tabelas...');
  
  const tabelasParaTestar = ['puxadores', 'trilhos', 'pv_vidro', 'Salvar_Portas'];
  
  for (const tabela of tabelasParaTestar) {
    try {
      console.log(`\n  📁 Testando tabela: ${tabela}`);
      const response = await fetch(SUPABASE_URL + `/rest/v1/${tabela}?limit=1`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Accept': 'application/json'
        }
      });
      
      console.log(`     Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`     ✅ Tabela existe! Registros: ${data.length}`);
      } else if (response.status === 404) {
        console.log('     ⚠️ Tabela não encontrada');
      } else {
        console.log('     ❌ Erro de acesso');
      }
    } catch (error) {
      console.error(`     ❌ Erro ao testar ${tabela}:`, error);
    }
  }

  console.log('\n🏁 Debug concluído!');
}

// Executar debug quando o script for carregado
debugSupabaseConnection();

// Expor função globalmente para execução manual
window.debugSupabaseConnection = debugSupabaseConnection;