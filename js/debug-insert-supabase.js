// ========================================
// DEBUG INSERÇÃO SUPABASE - VIBECODE
// ========================================

console.log('🔍 [DEBUG INSERT] Carregando debug de inserção Supabase...');

/**
 * Debug detalhado para inserção no Supabase
 */
window.debugInsertSupabase = async function() {
  console.log('');
  console.log('🔍 ========================================');
  console.log('🔍 INICIANDO DEBUG INSERÇÃO SUPABASE');
  console.log('🔍 ========================================');
  
  try {
    // STEP 1: Verificar configuração básica
    console.log('');
    console.log('1️⃣ VERIFICANDO CONFIGURAÇÃO BÁSICA...');
    console.log('   window.supabase existe:', !!window.supabase);
    console.log('   window.supabaseCliente existe:', !!window.supabaseCliente);
    
    if (!window.supabase && !window.supabaseCliente) {
      console.log('❌ PROBLEMA: Nenhum cliente Supabase encontrado');
      return false;
    }
    
    const client = window.supabase || window.supabaseCliente;
    console.log('✅ Cliente encontrado');
    
    // STEP 2: Verificar configuração do cliente
    console.log('');
    console.log('2️⃣ VERIFICANDO CONFIGURAÇÃO DO CLIENTE...');
    console.log('   URL:', client.url || 'não definida');
    console.log('   Headers:', client.headers ? 'existem' : 'não existem');
    
    if (client.headers) {
      console.log('   Headers detalhados:', {
        'Content-Type': client.headers['Content-Type'],
        'apikey': client.headers['apikey'] ? '***OCULTA***' : 'não definida',
        'Authorization': client.headers['Authorization'] ? '***OCULTA***' : 'não definida'
      });
    }
    
    // STEP 3: Teste de conectividade básica
    console.log('');
    console.log('3️⃣ TESTANDO CONECTIVIDADE...');
    
    try {
      const { data, error } = await client.select('usuarios', { limit: 1 });
      
      if (error) {
        console.log('❌ ERRO na consulta de teste:', error);
        console.log('   Código:', error.code);
        console.log('   Mensagem:', error.message);
        console.log('   Detalhes:', error.details);
      } else {
        console.log('✅ Conectividade OK - Teste SELECT funcionou');
        console.log('   Dados retornados:', data?.length || 0, 'registros');
      }
    } catch (connectError) {
      console.log('❌ ERRO de conectividade:', connectError.message);
    }
    
    // STEP 4: Verificar usuário atual
    console.log('');
    console.log('4️⃣ VERIFICANDO USUÁRIO ATUAL...');
    
    let usuario;
    try {
      // Tentar função personalizada primeiro
      if (typeof window.fixUsuarioNaoEncontrado === 'function') {
        usuario = await window.fixUsuarioNaoEncontrado();
        console.log('✅ Usuário via fixUsuarioNaoEncontrado:', usuario?.email || usuario?.id);
      } else {
        // Fallback para usuário temporário
        usuario = window.usuarioTemporario || { id: 'temp-user-' + Date.now() };
        console.log('⚠️ Usando usuário temporário:', usuario.id);
      }
    } catch (userError) {
      console.log('❌ ERRO ao obter usuário:', userError.message);
      usuario = { id: 'debug-user-' + Date.now() };
    }
    
    // STEP 5: Preparar dados de teste
    console.log('');
    console.log('5️⃣ PREPARANDO DADOS DE TESTE...');
    
    const dadosTeste = {
      modelo: `DEBUG-TEST-${Date.now()}`,
      fabricante: 'Debug Inc',
      cor: 'Azul Debug',
      medida: '150mm',
      id_usuario: usuario.id,
      created_at: new Date().toISOString()
    };
    
    console.log('   Dados preparados:', dadosTeste);
    
    // STEP 6: Executar inserção de teste
    console.log('');
    console.log('6️⃣ EXECUTANDO INSERÇÃO DE TESTE...');
    
    const startTime = Date.now();
    
    const { data: insertData, error: insertError } = await client.insert('puxadores', [dadosTeste]);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('   Tempo de execução:', duration + 'ms');
    
    if (insertError) {
      console.log('❌ ERRO NA INSERÇÃO:');
      console.log('   Código:', insertError.code);
      console.log('   Mensagem:', insertError.message);
      console.log('   Detalhes:', insertError.details);
      console.log('   Hint:', insertError.hint);
      console.log('   Status:', insertError.status);
      console.log('   Erro completo:', insertError);
      
      // Análise específica de erros comuns
      if (insertError.code === '23505') {
        console.log('🔍 DIAGNÓSTICO: Violação de chave única - registro já existe');
      } else if (insertError.code === '23502') {
        console.log('🔍 DIAGNÓSTICO: Campo obrigatório não preenchido');
      } else if (insertError.code === '42703') {
        console.log('🔍 DIAGNÓSTICO: Coluna inexistente na tabela');
      } else if (insertError.message?.includes('406')) {
        console.log('🔍 DIAGNÓSTICO: Erro 406 - Headers incorretos');
      }
      
      return false;
    }
    
    console.log('✅ INSERÇÃO REALIZADA COM SUCESSO!');
    console.log('   Dados inseridos:', insertData);
    console.log('   ID gerado:', insertData?.[0]?.id);
    
    // STEP 7: Verificar se o registro foi realmente inserido
    console.log('');
    console.log('7️⃣ VERIFICANDO INSERÇÃO...');
    
    try {
      const { data: verificacao, error: errorVerif } = await client.select('puxadores', {
        eq: { modelo: dadosTeste.modelo }
      });
      
      if (errorVerif) {
        console.log('⚠️ Erro ao verificar inserção:', errorVerif.message);
      } else if (verificacao && verificacao.length > 0) {
        console.log('✅ CONFIRMADO: Registro encontrado na base');
        console.log('   Registro:', verificacao[0]);
      } else {
        console.log('❌ PROBLEMA: Registro não encontrado após inserção');
      }
    } catch (verifError) {
      console.log('⚠️ Erro na verificação:', verifError.message);
    }
    
    console.log('');
    console.log('🎉 DEBUG CONCLUÍDO!');
    return true;
    
  } catch (error) {
    console.log('');
    console.log('❌ ERRO GERAL NO DEBUG:', error.message);
    console.log('   Stack:', error.stack);
    return false;
  }
};

/**
 * Teste rápido de inserção
 */
window.testeInsercaoRapida = async function(dados = {}) {
  console.log('🚀 TESTE RÁPIDO DE INSERÇÃO');
  
  const dadosDefault = {
    modelo: `TESTE-RAPIDO-${Date.now()}`,
    fabricante: dados.fabricante || 'Teste',
    cor: dados.cor || 'Branco',
    medida: dados.medida || '100mm',
    id_usuario: dados.id_usuario || 'test-user',
    ...dados
  };
  
  console.log('📋 Dados:', dadosDefault);
  
  try {
    const client = window.supabase || window.supabaseCliente;
    const { data, error } = await client.insert('puxadores', [dadosDefault]);
    
    if (error) {
      console.log('❌ ERRO:', error);
      return { success: false, error };
    }
    
    console.log('✅ SUCESSO:', data);
    return { success: true, data };
    
  } catch (error) {
    console.log('❌ EXCEÇÃO:', error.message);
    return { success: false, error: error.message };
  }
};

// Auto-executar debug
console.log('');
console.log('🎯 COMANDOS DISPONÍVEIS:');
console.log('   debugInsertSupabase()     - Debug completo');
console.log('   testeInsercaoRapida()     - Teste rápido');
console.log('');
console.log('💡 Para executar automaticamente:');
console.log('   debugInsertSupabase()'); 