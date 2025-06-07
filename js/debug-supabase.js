/**
 * Script de debug direto para Supabase
 * Execute no console do navegador
 */

// Configuração do Supabase
const SUPABASE_URL = 'https://nzgifjdewdfibcopolof.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z2lmamRld2RmaWJjb3BvbG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA4NDAsImV4cCI6MjA2MzAzNjg0MH0.O7MKZNx_Cd-Z12iq8h0pq6Sq0bmJazcxDHvlVb4VJQc';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'apikey': SUPABASE_ANON_KEY
};

// Gerar ID do usuário
function gerarIdUsuario() {
  const idSalvo = localStorage.getItem('user_unique_id');
  if (idSalvo) {
    return idSalvo;
  }
  
  const navegador = navigator.userAgent;
  const idioma = navigator.language;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timestamp = Date.now();
  
  const dados = `${navegador}-${idioma}-${timezone}-${timestamp}`;
  const hash = btoa(dados).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  
  localStorage.setItem('user_unique_id', hash);
  return hash;
}

// Função de teste CRUD para copiar e colar no console
window.debugSupabase = async function() {
  console.log('[DEBUG SUPABASE] Iniciando teste completo...');
  
  const idUsuario = gerarIdUsuario();
  console.log(`[DEBUG] ID do usuário: ${idUsuario}`);
  
  try {
    // 1. LISTAR todos os projetos
    console.log('[DEBUG] 1. Listando TODOS os projetos...');
    const urlTodos = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id_usuario=eq.${idUsuario}&select=*&order=criado_em.desc`;
    const respTodos = await fetch(urlTodos, { method: 'GET', headers });
    const todosProjetos = await respTodos.json();
    console.log(`[DEBUG] Status: ${respTodos.status}`);
    console.log(`[DEBUG] Todos os projetos:`, todosProjetos);
    
    // 2. LISTAR apenas projetos ativos
    console.log('[DEBUG] 2. Listando projetos ATIVOS...');
    const urlAtivos = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id_usuario=eq.${idUsuario}&ativo=eq.true&select=*&order=criado_em.desc`;
    const respAtivos = await fetch(urlAtivos, { method: 'GET', headers });
    const projetosAtivos = await respAtivos.json();
    console.log(`[DEBUG] Status: ${respAtivos.status}`);
    console.log(`[DEBUG] Projetos ativos:`, projetosAtivos);
    
    if (projetosAtivos.length > 0) {
      const projeto = projetosAtivos[0];
      console.log(`[DEBUG] Testando com projeto:`, projeto);
      
      // 3. TESTAR SOFT DELETE
      console.log('[DEBUG] 3. Testando SOFT DELETE...');
      const urlUpdate = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id=eq.${projeto.id}&id_usuario=eq.${idUsuario}`;
      const respUpdate = await fetch(urlUpdate, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({ ativo: false })
      });
      
      console.log(`[DEBUG] Status PATCH: ${respUpdate.status}`);
      const resultUpdate = await respUpdate.json();
      console.log(`[DEBUG] Resultado PATCH:`, resultUpdate);
      
      // 4. VERIFICAR se foi atualizado
      console.log('[DEBUG] 4. Verificando se foi atualizado...');
      const urlVerify = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id=eq.${projeto.id}&select=id,nome,ativo`;
      const respVerify = await fetch(urlVerify, { method: 'GET', headers });
      const projetoVerify = await respVerify.json();
      console.log(`[DEBUG] Estado após PATCH:`, projetoVerify);
      
      // 5. RESTAURAR
      console.log('[DEBUG] 5. Restaurando projeto...');
      const respRestore = await fetch(urlUpdate, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({ ativo: true })
      });
      
      console.log(`[DEBUG] Status RESTORE: ${respRestore.status}`);
      const resultRestore = await respRestore.json();
      console.log(`[DEBUG] Resultado RESTORE:`, resultRestore);
      
      // CONCLUSÃO
      if (resultUpdate.length > 0 && projetoVerify.length > 0 && projetoVerify[0].ativo === false) {
        console.log('✅ SOFT DELETE FUNCIONA CORRETAMENTE!');
        return '✅ Soft delete funciona!';
      } else {
        console.log('❌ PROBLEMA COM SOFT DELETE!');
        return '❌ Problema identificado!';
      }
    } else {
      console.log('❌ Nenhum projeto ativo encontrado para testar');
      return '❌ Nenhum projeto para testar';
    }
    
  } catch (error) {
    console.error('[DEBUG] Erro:', error);
    return '❌ Erro no teste';
  }
};

// Função para testar DELETE real
window.debugDeleteReal = async function() {
  console.log('[DEBUG] Testando DELETE REAL...');
  
  const idUsuario = gerarIdUsuario();
  
  // Buscar projetos ativos
  const urlAtivos = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id_usuario=eq.${idUsuario}&ativo=eq.true&select=*&order=criado_em.desc&limit=1`;
  const respAtivos = await fetch(urlAtivos, { method: 'GET', headers });
  const projetos = await respAtivos.json();
  
  if (projetos.length > 0) {
    const projeto = projetos[0];
    console.log(`[DEBUG] Deletando projeto:`, projeto);
    
    const urlDelete = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id=eq.${projeto.id}&id_usuario=eq.${idUsuario}`;
    const respDelete = await fetch(urlDelete, {
      method: 'DELETE',
      headers: headers
    });
    
    console.log(`[DEBUG] Status DELETE: ${respDelete.status}`);
    
    if (respDelete.ok) {
      console.log('✅ DELETE REAL FUNCIONA!');
      return '✅ Delete real funciona!';
    } else {
      const error = await respDelete.json();
      console.log('❌ ERRO NO DELETE:', error);
      return '❌ Erro no delete real';
    }
  } else {
    return '❌ Nenhum projeto para deletar';
  }
};

// Função para testar especificamente campos que podem estar perdidos
window.debugCampos = async function() {
  console.log('[DEBUG CAMPOS] Testando salvamento e carregamento de campos...');
  
  const idUsuario = gerarIdUsuario();
  
  try {
    // Carregar projetos
    const urlAtivos = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id_usuario=eq.${idUsuario}&order=criado_em.desc&limit=1`;
    const respAtivos = await fetch(urlAtivos, { method: 'GET', headers });
    const projetos = await respAtivos.json();
    
    if (projetos.length > 0) {
      const projeto = projetos[0];
      console.log('[DEBUG CAMPOS] Projeto mais recente do banco:', projeto);
      
      // Verificar campos específicos
      const camposImportantes = [
        'quantidade',
        'largura', 
        'altura',
        'funcao',
        'porta_em_par',
        'cliente',
        'ambiente',
        'parceiro',
        'vidro_tipo',
        'perfil_modelo',
        'perfil_cor',
        'num_dobradicas',
        'observacao'
      ];
      
      console.log('[DEBUG CAMPOS] Valores dos campos no banco:');
      camposImportantes.forEach(campo => {
        console.log(`  ${campo}: ${projeto[campo]} (tipo: ${typeof projeto[campo]})`);
      });
      
      // Testar conversão para formato da aplicação
      console.log('[DEBUG CAMPOS] Como seria convertido para a aplicação:');
      const dadosConvertidos = {
        largura: projeto.largura,
        altura: projeto.altura,
        funcao: projeto.funcao,
        quantidade: projeto.quantidade,
        portaEmPar: projeto.porta_em_par,
        cliente: projeto.cliente,
        ambiente: projeto.ambiente,
        parceiro: projeto.parceiro,
        vidroTipo: projeto.vidro_tipo,
        perfilModelo: projeto.perfil_modelo,
        perfilCor: projeto.perfil_cor,
        numDobradicas: projeto.num_dobradicas,
        observacao: projeto.observacao
      };
      
      console.log('  Dados convertidos:', dadosConvertidos);
      
      // Verificar configuração completa
      if (projeto.configuracao_completa) {
        try {
          const configCompleta = JSON.parse(projeto.configuracao_completa);
          console.log('[DEBUG CAMPOS] Configuração completa salva:', configCompleta);
          
          // Comparar quantidade
          console.log(`[DEBUG CAMPOS] Quantidade - Direta: ${projeto.quantidade}, Completa: ${configCompleta.quantidade}`);
        } catch (e) {
          console.error('[DEBUG CAMPOS] Erro ao fazer parse da configuração completa:', e);
        }
      }
      
      return 'Análise completa - verifique logs';
    } else {
      return 'Nenhum projeto encontrado';
    }
    
  } catch (error) {
    console.error('[DEBUG CAMPOS] Erro:', error);
    return 'Erro na análise';
  }
};

// Função para testar o novo sistema de carregamento completo
window.testarNovoCarregamento = async function() {
  console.log('[TESTE NOVO CARREGAMENTO] Iniciando teste...');
  
  try {
    // 1. Verificar se as novas funções estão disponíveis
    if (!window.storageSupabase || !window.storageSupabase.carregarProjetoCompleto) {
      console.error('[TESTE] Função carregarProjetoCompleto não encontrada');
      return 'Erro: Função não disponível';
    }
    
    // 2. Buscar projetos disponíveis
    const urlTodos = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id_usuario=eq.${gerarIdUsuario()}&select=id,nome&order=criado_em.desc&limit=1`;
    const respTodos = await fetch(urlTodos, { method: 'GET', headers });
    const projetos = await respTodos.json();
    
    if (projetos.length === 0) {
      console.log('[TESTE] Nenhum projeto encontrado para testar');
      return 'Nenhum projeto disponível';
    }
    
    const projeto = projetos[0];
    console.log(`[TESTE] Testando com projeto: ${projeto.nome} (ID: ${projeto.id})`);
    
    // 3. Testar carregamento completo
    const resultado = await window.storageSupabase.carregarProjetoCompleto(projeto.id);
    
    if (resultado) {
      console.log('[TESTE] ✅ Carregamento completo funcionou!');
      
      // 4. Verificar se campos foram populados
      const camposParaVerificar = [
        'clienteInput', 'ambienteInput', 'larguraInput', 'alturaInput', 
        'quantidadeInput', 'funcaoPorta', 'puxadorModelo'
      ];
      
      const camposPopulados = {};
      camposParaVerificar.forEach(campoId => {
        const elemento = document.getElementById(campoId);
        if (elemento) {
          camposPopulados[campoId] = elemento.value;
        }
      });
      
      console.log('[TESTE] Campos populados:', camposPopulados);
      
      return `✅ Teste bem-sucedido! Projeto "${projeto.nome}" carregado.`;
    } else {
      console.error('[TESTE] ❌ Falha no carregamento');
      return '❌ Falha no carregamento';
    }
    
  } catch (error) {
    console.error('[TESTE] Erro:', error);
    return `❌ Erro: ${error.message}`;
  }
};

console.log('[DEBUG SUPABASE] Funções carregadas:');
console.log('- debugSupabase() - Teste completo');
console.log('- debugDeleteReal() - Teste delete permanente');
console.log('- debugCampos() - Teste campos específicos');
console.log('- testarNovoCarregamento() - Teste novo sistema de carregamento');