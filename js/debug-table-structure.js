/**
 * Script para debugar estrutura das tabelas no Supabase
 * Execute no console do navegador para verificar as tabelas
 */

async function debugTableStructure() {
  console.log('🔍 Verificando estrutura das tabelas...');
  
  const SUPABASE_URL = 'https://nzgifjdewdfibcopolof.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z2lmamRld2RmaWJjb3BvbG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA4NDAsImV4cCI6MjA2MzAzNjg0MH0.O7MKZNx_Cd-Z12iq8h0pq6Sq0bmJazcxDHvlVb4VJQc';
  
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  // 1. Verificar tabela usuarios
  console.log('\n👤 Verificando tabela usuarios...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?limit=5`, {
      method: 'GET',
      headers
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Tabela usuarios existe! Registros: ${data.length}`);
      if (data.length > 0) {
        console.log('Estrutura da primeira linha:', Object.keys(data[0]));
        console.log('Dados:', data);
      }
    } else {
      const error = await response.text();
      console.log('❌ Erro na tabela usuarios:', error);
    }
  } catch (error) {
    console.error('❌ Erro ao verificar usuarios:', error);
  }

  // 2. Verificar tabela puxadores
  console.log('\n🪄 Verificando tabela puxadores...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/puxadores?limit=5`, {
      method: 'GET',
      headers
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Tabela puxadores existe! Registros: ${data.length}`);
      if (data.length > 0) {
        console.log('Estrutura da primeira linha:', Object.keys(data[0]));
        console.log('Dados:', data);
      }
    } else {
      const error = await response.text();
      console.log('❌ Erro na tabela puxadores:', error);
    }
  } catch (error) {
    console.error('❌ Erro ao verificar puxadores:', error);
  }

  // 3. Verificar tabela trilhos
  console.log('\n🛤️ Verificando tabela trilhos...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/trilhos?limit=5`, {
      method: 'GET',
      headers
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Tabela trilhos existe! Registros: ${data.length}`);
      if (data.length > 0) {
        console.log('Estrutura da primeira linha:', Object.keys(data[0]));
        console.log('Dados:', data);
      }
    } else {
      const error = await response.text();
      console.log('❌ Erro na tabela trilhos:', error);
    }
  } catch (error) {
    console.error('❌ Erro ao verificar trilhos:', error);
  }

  // 4. Tentar inserir usuário admin se não existir
  console.log('\n👨‍💼 Verificando/criando usuário admin...');
  try {
    // Primeiro verificar se o admin existe
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?id=eq.00000000-0000-0000-0000-000000000007`, {
      method: 'GET',
      headers
    });
    
    if (checkResponse.ok) {
      const existingAdmin = await checkResponse.json();
      if (existingAdmin.length > 0) {
        console.log('✅ Usuário admin já existe:', existingAdmin[0]);
      } else {
        console.log('⚠️ Usuário admin não existe. Tentando criar...');
        
        // Tentar criar usuário admin
        const adminData = {
          id: '00000000-0000-0000-0000-000000000007',
          nome: 'Ricardo Nilton Borges',
          email: 'ricardo.nilton@hotmail.com',
          perfil: 'Conecta Móveis e Representações',
          ativo: true,
          criado_em: new Date().toISOString()
        };
        
        const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/usuarios`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify(adminData)
        });
        
        if (createResponse.ok) {
          const newAdmin = await createResponse.json();
          console.log('✅ Usuário admin criado com sucesso:', newAdmin);
        } else {
          const error = await createResponse.text();
          console.log('❌ Erro ao criar usuário admin:', error);
        }
      }
    } else {
      const error = await checkResponse.text();
      console.log('❌ Erro ao verificar usuário admin:', error);
    }
  } catch (error) {
    console.error('❌ Erro ao gerenciar usuário admin:', error);
  }

  console.log('\n🏁 Debug da estrutura concluído!');
}

// NÃO executar automaticamente para evitar conflitos
// debugTableStructure();

// Expor função globalmente
window.debugTableStructure = debugTableStructure;

// Função para tentar inserir um puxador de teste
window.testPuxadorInsert = async function() {
  console.log('🧪 Testando inserção de puxador...');
  
  const SUPABASE_URL = 'https://nzgifjdewdfibcopolof.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z2lmamRld2RmaWJjb3BvbG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA4NDAsImV4cCI6MjA2MzAzNjg0MH0.O7MKZNx_Cd-Z12iq8h0pq6Sq0bmJazcxDHvlVb4VJQc';
  
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const testPuxador = {
    nome: 'Teste Debug',
    modelo: 'Teste Debug',
    medida: '150mm',
    criado_em: new Date().toISOString()
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/puxadores`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPuxador)
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Puxador de teste inserido com sucesso:', data);
    } else {
      const error = await response.text();
      console.log('❌ Erro ao inserir puxador de teste:', error);
    }
  } catch (error) {
    console.error('❌ Erro na inserção de teste:', error);
  }
};

console.log('📋 Scripts de debug carregados!');
console.log('💡 Execute debugTableStructure() para verificar tabelas');
console.log('💡 Execute testPuxadorInsert() para testar inserção de puxador');