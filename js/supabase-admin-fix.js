/**
 * Script administrativo para corrigir estrutura do Supabase
 * Usa service_role key para operações administrativas
 */

const SUPABASE_URL = 'https://nzgifjdewdfibcopolof.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z2lmamRld2RmaWJjb3BvbG9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzQ2MDg0MCwiZXhwIjoyMDYzMDM2ODQwfQ.6D9JGbSXzQZtFSu96hA_4cTtde8C3G-WwPG3C4Ta5n0';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z2lmamRld2RmaWJjb3BvbG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA4NDAsImV4cCI6MjA2MzAzNjg0MH0.O7MKZNx_Cd-Z12iq8h0pq6Sq0bmJazcxDHvlVb4VJQc';

// Headers para service_role (acesso administrativo)
const adminHeaders = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

// Headers para operações normais
const userHeaders = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

async function fixSupabaseStructure() {
  console.log('🔧 Iniciando correção da estrutura do Supabase...');
  console.log('URL:', SUPABASE_URL);

  // 1. Verificar e criar usuário admin
  console.log('\n👨‍💼 Verificando usuário admin...');
  try {
    // Verificar se admin existe
    const checkAdmin = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?id=eq.00000000-0000-0000-0000-000000000007`, {
      method: 'GET',
      headers: adminHeaders
    });

    console.log(`Status verificação admin: ${checkAdmin.status}`);

    if (checkAdmin.ok) {
      const adminData = await checkAdmin.json();
      if (adminData.length > 0) {
        console.log('✅ Usuário admin já existe:', adminData[0]);
      } else {
        console.log('⚠️ Usuário admin não existe. Criando...');
        
        // Criar usuário admin
        const newAdmin = {
          id: '00000000-0000-0000-0000-000000000007',
          nome: 'Ricardo Nilton Borges',
          email: 'ricardo.nilton@hotmail.com',
          perfil: 'Conecta Móveis e Representações',
          ativo: true,
          criado_em: new Date().toISOString()
        };

        const createAdmin = await fetch(`${SUPABASE_URL}/rest/v1/usuarios`, {
          method: 'POST',
          headers: { ...adminHeaders, 'Prefer': 'return=representation' },
          body: JSON.stringify(newAdmin)
        });

        if (createAdmin.ok) {
          const created = await createAdmin.json();
          console.log('✅ Usuário admin criado:', created);
        } else {
          const error = await createAdmin.text();
          console.log('❌ Erro ao criar admin:', error);
        }
      }
    } else {
      const error = await checkAdmin.text();
      console.log('❌ Erro ao verificar admin:', error);
    }
  } catch (error) {
    console.error('❌ Erro na verificação do admin:', error);
  }

  // 2. Verificar estrutura da tabela puxadores
  console.log('\n🪄 Verificando tabela puxadores...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/puxadores?limit=1`, {
      method: 'GET',
      headers: adminHeaders
    });

    console.log(`Status puxadores: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Tabela puxadores existe! Registros: ${data.length}`);
      if (data.length > 0) {
        console.log('Estrutura:', Object.keys(data[0]));
        console.log('Primeiro registro:', data[0]);
      }
    } else {
      const error = await response.text();
      console.log('❌ Tabela puxadores:', error);
    }
  } catch (error) {
    console.error('❌ Erro ao verificar puxadores:', error);
  }

  // 3. Verificar estrutura da tabela trilhos
  console.log('\n🛤️ Verificando tabela trilhos...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/trilhos?limit=1`, {
      method: 'GET',
      headers: adminHeaders
    });

    console.log(`Status trilhos: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Tabela trilhos existe! Registros: ${data.length}`);
      if (data.length > 0) {
        console.log('Estrutura:', Object.keys(data[0]));
        console.log('Primeiro registro:', data[0]);
      }
    } else {
      const error = await response.text();
      console.log('❌ Tabela trilhos:', error);
    }
  } catch (error) {
    console.error('❌ Erro ao verificar trilhos:', error);
  }

  // 4. Teste de inserção de puxador
  console.log('\n🧪 Testando inserção de puxador...');
  try {
    const testPuxador = {
      nome: 'Teste Admin',
      modelo: 'Teste Admin',
      medida: '150mm',
      id_usuario: '00000000-0000-0000-0000-000000000007',
      criado_em: new Date().toISOString()
    };

    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/puxadores`, {
      method: 'POST',
      headers: { ...adminHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(testPuxador)
    });

    console.log(`Status inserção: ${insertResponse.status}`);

    if (insertResponse.ok) {
      const inserted = await insertResponse.json();
      console.log('✅ Puxador de teste inserido:', inserted);
      
      // Limpar o teste
      if (inserted[0]?.id) {
        const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/puxadores?id=eq.${inserted[0].id}`, {
          method: 'DELETE',
          headers: adminHeaders
        });
        console.log('🗑️ Puxador de teste removido');
      }
    } else {
      const error = await insertResponse.text();
      console.log('❌ Erro na inserção:', error);
    }
  } catch (error) {
    console.error('❌ Erro no teste de inserção:', error);
  }

  console.log('\n🏁 Verificação administrativa concluída!');
}

// Função para testar inserção sem FK
async function testInsertWithoutFK() {
  console.log('🧪 Testando inserção sem foreign key...');
  
  const testPuxador = {
    nome: 'Teste Sem FK',
    modelo: 'Teste Sem FK',
    medida: '150mm',
    // Não incluir id_usuario
    criado_em: new Date().toISOString()
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/puxadores`, {
      method: 'POST',
      headers: { ...adminHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(testPuxador)
    });

    console.log(`Status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Inserção sem FK bem-sucedida:', data);
      
      // Limpar teste
      if (data[0]?.id) {
        await fetch(`${SUPABASE_URL}/rest/v1/puxadores?id=eq.${data[0].id}`, {
          method: 'DELETE',
          headers: adminHeaders
        });
        console.log('🗑️ Teste removido');
      }
    } else {
      const error = await response.text();
      console.log('❌ Erro:', error);
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Função para verificar políticas RLS
async function checkRLSPolicies() {
  console.log('🔒 Verificando políticas RLS...');
  
  const tables = ['usuarios', 'puxadores', 'trilhos'];
  
  for (const table of tables) {
    try {
      // Tentar com anon key
      const anonResponse = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
        method: 'GET',
        headers: userHeaders
      });
      
      // Tentar com service_role key
      const adminResponse = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
        method: 'GET',
        headers: adminHeaders
      });
      
      console.log(`📋 Tabela ${table}:`);
      console.log(`   Anon access: ${anonResponse.status}`);
      console.log(`   Admin access: ${adminResponse.status}`);
      
      if (anonResponse.status === 401) {
        console.log(`   ⚠️ RLS ativado para ${table} - pode estar bloqueando acesso anônimo`);
      }
    } catch (error) {
      console.error(`❌ Erro ao verificar ${table}:`, error);
    }
  }
}

// Expor funções globalmente
window.fixSupabaseStructure = fixSupabaseStructure;
window.testInsertWithoutFK = testInsertWithoutFK;
window.checkRLSPolicies = checkRLSPolicies;

console.log('🛠️ Scripts administrativos carregados!');
console.log('💡 Execute: fixSupabaseStructure()');
console.log('💡 Execute: testInsertWithoutFK()');
console.log('💡 Execute: checkRLSPolicies()');

// Executar automaticamente a verificação principal
fixSupabaseStructure();