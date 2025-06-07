// ========================================
// DIAGNÓSTICO AUTOMÁTICO - INSERÇÃO SUPABASE
// ========================================

console.log('🔍 [DIAGNÓSTICO AUTO] Iniciando diagnóstico automático...');

/**
 * Executa diagnóstico automático ao carregar a página
 */
async function diagnosticoAutomatico() {
  console.log('');
  console.log('🔍 ========================================');
  console.log('🔍 DIAGNÓSTICO AUTOMÁTICO - INSERÇÃO SUPABASE');
  console.log('🔍 ========================================');
  
  const resultado = {
    supabaseDisponivel: false,
    conectividadeOk: false,
    usuarioValido: false,
    erroEncontrado: null,
    solucaoSugerida: null
  };
  
  try {
    // STEP 1: Verificar Supabase
    console.log('1️⃣ Verificando Supabase...');
    
    if (!window.supabase && !window.supabaseCliente) {
      resultado.erroEncontrado = 'Cliente Supabase não encontrado';
      resultado.solucaoSugerida = 'Verificar se os scripts do Supabase foram carregados';
      console.log('❌ ERRO: Cliente Supabase não encontrado');
      return resultado;
    }
    
    resultado.supabaseDisponivel = true;
    const client = window.supabase || window.supabaseCliente;
    console.log('✅ Cliente Supabase encontrado');
    
    // STEP 2: Teste de conectividade
    console.log('2️⃣ Testando conectividade...');
    
    try {
      const { data, error } = await client.select('usuarios', { limit: 1 });
      
      if (error) {
        resultado.erroEncontrado = `Erro de conectividade: ${error.message}`;
        
        if (error.message?.includes('406')) {
          resultado.solucaoSugerida = 'Erro 406 - Verificar headers da requisição';
        } else if (error.message?.includes('401')) {
          resultado.solucaoSugerida = 'Erro 401 - Verificar chave API do Supabase';
        } else if (error.message?.includes('CORS')) {
          resultado.solucaoSugerida = 'Erro CORS - Verificar configuração de domínio no Supabase';
        } else {
          resultado.solucaoSugerida = 'Verificar logs do console para mais detalhes';
        }
        
        console.log('❌ ERRO de conectividade:', error.message);
        return resultado;
      }
      
      resultado.conectividadeOk = true;
      console.log('✅ Conectividade OK');
      
    } catch (connectError) {
      resultado.erroEncontrado = `Exceção de conectividade: ${connectError.message}`;
      resultado.solucaoSugerida = 'Verificar configuração de rede e Supabase';
      console.log('❌ EXCEÇÃO de conectividade:', connectError.message);
      return resultado;
    }
    
    // STEP 3: Verificar usuário
    console.log('3️⃣ Verificando usuário...');
    
    let usuario;
    try {
      if (typeof window.fixUsuarioNaoEncontrado === 'function') {
        usuario = await window.fixUsuarioNaoEncontrado();
      } else {
        usuario = window.usuarioTemporario || { id: 'temp-' + Date.now() };
      }
      
      if (!usuario || !usuario.id) {
        resultado.erroEncontrado = 'Usuário inválido ou não encontrado';
        resultado.solucaoSugerida = 'Executar fixUsuarioNaoEncontrado() ou definir usuário temporário';
        console.log('❌ ERRO: Usuário inválido');
        return resultado;
      }
      
      resultado.usuarioValido = true;
      console.log('✅ Usuário válido:', usuario.id);
      
    } catch (userError) {
      resultado.erroEncontrado = `Erro ao obter usuário: ${userError.message}`;
      resultado.solucaoSugerida = 'Verificar função de autenticação de usuário';
      console.log('❌ ERRO ao obter usuário:', userError.message);
      return resultado;
    }
    
    // STEP 4: Teste de inserção simples
    console.log('4️⃣ Testando inserção...');
    
    const dadosTeste = {
      modelo: `TESTE-DIAG-${Date.now()}`,
      fabricante: 'Diagnóstico',
      cor: 'Teste',
      medida: '100mm',
      id_usuario: usuario.id
    };
    
    try {
      const { data: insertData, error: insertError } = await client.insert('puxadores', [dadosTeste]);
      
      if (insertError) {
        resultado.erroEncontrado = `Erro na inserção: ${insertError.message}`;
        
        // Diagnóstico específico por código de erro
        if (insertError.code === '23505') {
          resultado.solucaoSugerida = 'Violação de chave única - Verificar dados duplicados';
        } else if (insertError.code === '23502') {
          resultado.solucaoSugerida = 'Campo obrigatório faltando - Verificar estrutura da tabela';
        } else if (insertError.code === '42703') {
          resultado.solucaoSugerida = 'Coluna inexistente - Verificar schema da tabela';
        } else if (insertError.message?.includes('406')) {
          resultado.solucaoSugerida = 'Erro 406 - Executar fixErro406Supabase()';
        } else {
          resultado.solucaoSugerida = 'Verificar logs detalhados com debugInsertSupabase()';
        }
        
        console.log('❌ ERRO na inserção:', insertError);
        console.log('   Código:', insertError.code);
        console.log('   Mensagem:', insertError.message);
        return resultado;
      }
      
      console.log('✅ INSERÇÃO BEM-SUCEDIDA!');
      console.log('   Dados inseridos:', insertData);
      resultado.solucaoSugerida = 'Sistema funcionando corretamente';
      
    } catch (insertException) {
      resultado.erroEncontrado = `Exceção na inserção: ${insertException.message}`;
      resultado.solucaoSugerida = 'Verificar configuração geral do Supabase';
      console.log('❌ EXCEÇÃO na inserção:', insertException.message);
      return resultado;
    }
    
    console.log('');
    console.log('🎉 DIAGNÓSTICO CONCLUÍDO: SISTEMA OK!');
    return resultado;
    
  } catch (error) {
    resultado.erroEncontrado = `Erro geral: ${error.message}`;
    resultado.solucaoSugerida = 'Verificar console para stack trace completo';
    console.log('❌ ERRO GERAL no diagnóstico:', error);
    return resultado;
  }
}

/**
 * Mostra resumo do diagnóstico
 */
function mostrarResumoDiagnostico(resultado) {
  console.log('');
  console.log('📋 ========================================');
  console.log('📋 RESUMO DO DIAGNÓSTICO');
  console.log('📋 ========================================');
  console.log('   Supabase Disponível:', resultado.supabaseDisponivel ? '✅' : '❌');
  console.log('   Conectividade OK:', resultado.conectividadeOk ? '✅' : '❌');
  console.log('   Usuário Válido:', resultado.usuarioValido ? '✅' : '❌');
  
  if (resultado.erroEncontrado) {
    console.log('');
    console.log('❌ ERRO ENCONTRADO:', resultado.erroEncontrado);
    console.log('💡 SOLUÇÃO SUGERIDA:', resultado.solucaoSugerida);
    console.log('');
    console.log('🔧 COMANDOS PARA CORREÇÃO:');
    
    if (resultado.solucaoSugerida?.includes('fixErro406Supabase')) {
      console.log('   fixErro406Supabase()');
    }
    if (resultado.solucaoSugerida?.includes('fixUsuarioNaoEncontrado')) {
      console.log('   fixUsuarioNaoEncontrado()');
    }
    if (resultado.solucaoSugerida?.includes('debugInsertSupabase')) {
      console.log('   debugInsertSupabase()');
    }
  } else {
    console.log('');
    console.log('🎉 SISTEMA FUNCIONANDO CORRETAMENTE!');
  }
  
  console.log('');
}

/**
 * Executar diagnóstico automático após carregamento
 */
window.addEventListener('load', async () => {
  // Aguardar um pouco para garantir que tudo foi carregado
  setTimeout(async () => {
    try {
      const resultado = await diagnosticoAutomatico();
      mostrarResumoDiagnostico(resultado);
      
      // Salvar resultado para consulta posterior
      window.ultimoDiagnostico = resultado;
      
    } catch (error) {
      console.log('❌ Erro ao executar diagnóstico automático:', error);
    }
  }, 2000); // 2 segundos de delay
});

// Expor função para execução manual
window.executarDiagnostico = async function() {
  const resultado = await diagnosticoAutomatico();
  mostrarResumoDiagnostico(resultado);
  return resultado;
};

console.log('✅ Diagnóstico automático configurado');
console.log('💡 Execute manualmente com: executarDiagnostico()'); 