// COLE ESTE CÓDIGO NO CONSOLE DO NAVEGADOR (F12 -> Console)

console.log('🔍 Iniciando debug das tabelas Supabase...');

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
fetch(`${SUPABASE_URL}/rest/v1/usuarios?limit=5`, { method: 'GET', headers })
  .then(response => {
    console.log(`Status usuarios: ${response.status} ${response.statusText}`);
    return response.json();
  })
  .then(data => {
    console.log(`✅ Tabela usuarios - Registros: ${data.length}`);
    if (data.length > 0) {
      console.log('Estrutura:', Object.keys(data[0]));
      console.log('Dados:', data);
    }
  })
  .catch(error => console.error('❌ Erro usuarios:', error));

// 2. Verificar tabela puxadores
console.log('\n🪄 Verificando tabela puxadores...');
fetch(`${SUPABASE_URL}/rest/v1/puxadores?limit=5`, { method: 'GET', headers })
  .then(response => {
    console.log(`Status puxadores: ${response.status} ${response.statusText}`);
    return response.json();
  })
  .then(data => {
    console.log(`✅ Tabela puxadores - Registros: ${data.length}`);
    if (data.length > 0) {
      console.log('Estrutura:', Object.keys(data[0]));
      console.log('Dados:', data);
    }
  })
  .catch(error => console.error('❌ Erro puxadores:', error));

// 3. Tentar criar usuário admin
console.log('\n👨‍💼 Criando usuário admin...');
const adminData = {
  id: '00000000-0000-0000-0000-000000000007',
  nome: 'Ricardo Nilton Borges',
  email: 'ricardo.nilton@hotmail.com',
  perfil: 'Conecta Móveis e Representações',
  ativo: true,
  criado_em: new Date().toISOString()
};

fetch(`${SUPABASE_URL}/rest/v1/usuarios`, {
  method: 'POST',
  headers: { ...headers, 'Prefer': 'return=representation' },
  body: JSON.stringify(adminData)
})
.then(response => {
  console.log(`Status criação admin: ${response.status} ${response.statusText}`);
  return response.json();
})
.then(data => {
  console.log('✅ Usuário admin criado:', data);
})
.catch(error => console.error('❌ Erro ao criar admin:', error));

console.log('🏁 Debug executado! Verifique os resultados acima.');