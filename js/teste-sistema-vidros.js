/**
 * Testes standalone para o sistema de vidros
 * Sistema de Portas e Perfis
 */

/**
 * Executa todos os testes do sistema de vidros
 */
async function executarTestesVidrosStandalone() {
  console.log('🧪 Iniciando testes standalone do sistema de vidros...');
  
  const testes = [];
  
  try {
    // Aguardar cliente Supabase estar disponível
    await aguardarSupabase();
    
    // Teste 1: Conectividade com Supabase
    testes.push(await testeConectividadeSupabase());
    
    // Teste 2: Criação de vidro
    testes.push(await testeCriarVidro());
    
    // Teste 3: Leitura de vidros
    testes.push(await testeLeituraVidros());
    
    // Teste 4: Atualização de vidro
    testes.push(await testeAtualizarVidro());
    
    // Teste 5: Exclusão (soft delete)
    testes.push(await testeExcluirVidro());
    
    // Teste 6: Validação da interface
    testes.push(await testeValidacaoInterface());
    
    // Relatório final
    const sucessos = testes.filter(t => t.sucesso).length;
    const total = testes.length;
    
    console.log(`🧪 Testes concluídos: ${sucessos}/${total} sucessos`);
    
    testes.forEach(teste => {
      const icon = teste.sucesso ? '✅' : '❌';
      console.log(`${icon} ${teste.nome}: ${teste.resultado}`);
    });
    
    if (sucessos === total) {
      mostrarNotificacao('Todos os testes passaram! Sistema de vidros funcionando corretamente.', 'success');
    } else {
      mostrarNotificacao(`${sucessos}/${total} testes passaram. Verifique o console para detalhes.`, 'warning');
    }
    
    return { sucessos, total, testes };
    
  } catch (error) {
    console.error('❌ Erro durante execução dos testes:', error);
    mostrarNotificacao('Erro durante testes: ' + error.message, 'error');
    return { sucessos: 0, total: testes.length, erro: error.message };
  }
}

/**
 * Aguarda o cliente Supabase estar disponível
 */
async function aguardarSupabase() {
  let tentativas = 0;
  const maxTentativas = 50; // 5 segundos
  
  while (tentativas < maxTentativas) {
    if (window.supabaseCliente) {
      console.log('✅ Cliente Supabase disponível');
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    tentativas++;
  }
  
  throw new Error('Cliente Supabase não disponível após 5 segundos');
}

/**
 * Função de notificação fallback
 */
function mostrarNotificacao(mensagem, tipo) {
  if (window.mostrarNotificacao) {
    window.mostrarNotificacao(mensagem, tipo);
  } else {
    console.log(`[${tipo.toUpperCase()}] ${mensagem}`);
  }
}

// Funções de teste individuais
async function testeConectividadeSupabase() {
  try {
    if (!window.supabaseCliente) {
      throw new Error('Cliente Supabase não disponível');
    }
    
    const { data, error } = await window.supabaseCliente.select('pv_vidro', {
      select: 'count',
      limit: 1
    });
        
    if (error) throw error;
    
    return {
      nome: 'Conectividade Supabase',
      sucesso: true,
      resultado: 'Conectado com sucesso'
    };
  } catch (error) {
    return {
      nome: 'Conectividade Supabase',
      sucesso: false,
      resultado: error.message
    };
  }
}

async function testeCriarVidro() {
  try {
    const vidroTeste = {
      tipo: 'Teste_' + Date.now(),
      rgb: 'rgba(255, 0, 0, 0.5)',
      ativo: true
    };
    
    const { data, error } = await window.supabaseCliente.insert('pv_vidro', [vidroTeste]);
        
    if (error) throw error;
    
    // Limpar teste
    await window.supabaseCliente.delete('pv_vidro', {
      eq: { 'id': data[0].id }
    });
    
    return {
      nome: 'Criar Vidro',
      sucesso: true,
      resultado: 'Vidro criado e removido com sucesso'
    };
  } catch (error) {
    return {
      nome: 'Criar Vidro',
      sucesso: false,
      resultado: error.message
    };
  }
}

async function testeLeituraVidros() {
  try {
    const { data, error } = await window.supabaseCliente.select('pv_vidro', {
      select: '*',
      limit: 5
    });
        
    if (error) throw error;
    
    return {
      nome: 'Leitura de Vidros',
      sucesso: true,
      resultado: `${data.length} vidros lidos com sucesso`
    };
  } catch (error) {
    return {
      nome: 'Leitura de Vidros',
      sucesso: false,
      resultado: error.message
    };
  }
}

async function testeAtualizarVidro() {
  try {
    // Criar vidro temporário
    const { data: created, error: createError } = await window.supabaseCliente.insert('pv_vidro', [{
      tipo: 'Teste_Update_' + Date.now(),
      rgb: 'rgba(0, 255, 0, 0.5)',
      ativo: true
    }]);
        
    if (createError) throw createError;
    
    // Atualizar
    const { error: updateError } = await window.supabaseCliente.update('pv_vidro', 
      { rgb: 'rgba(0, 0, 255, 0.5)' },
      { eq: { 'id': created[0].id } }
    );
        
    if (updateError) throw updateError;
    
    // Limpar
    await window.supabaseCliente.delete('pv_vidro', {
      eq: { 'id': created[0].id }
    });
    
    return {
      nome: 'Atualizar Vidro',
      sucesso: true,
      resultado: 'Vidro atualizado com sucesso'
    };
  } catch (error) {
    return {
      nome: 'Atualizar Vidro',
      sucesso: false,
      resultado: error.message
    };
  }
}

async function testeExcluirVidro() {
  try {
    // Criar vidro temporário
    const { data: created, error: createError } = await window.supabaseCliente.insert('pv_vidro', [{
      tipo: 'Teste_Delete_' + Date.now(),
      rgb: 'rgba(255, 255, 0, 0.5)',
      ativo: true
    }]);
        
    if (createError) throw createError;
    
    // Soft delete
    const { error: deleteError } = await window.supabaseCliente.update('pv_vidro',
      { ativo: false },
      { eq: { 'id': created[0].id } }
    );
        
    if (deleteError) throw deleteError;
    
    // Limpar definitivamente
    await window.supabaseCliente.delete('pv_vidro', {
      eq: { 'id': created[0].id }
    });
    
    return {
      nome: 'Excluir Vidro (Soft Delete)',
      sucesso: true,
      resultado: 'Vidro excluído com sucesso'
    };
  } catch (error) {
    return {
      nome: 'Excluir Vidro (Soft Delete)',
      sucesso: false,
      resultado: error.message
    };
  }
}

async function testeValidacaoInterface() {
  try {
    // Verificar se elementos da interface existem
    const tabelaVidros = document.getElementById('tabelaVidros');
    const btnNovoVidro = document.getElementById('btnNovoVidro');
    const vidrosTab = document.getElementById('vidros-tab');
    
    const elementos = {
      'Tabela de vidros': !!tabelaVidros,
      'Botão novo vidro': !!btnNovoVidro, 
      'Aba de vidros': !!vidrosTab
    };
    
    const elementosEncontrados = Object.values(elementos).filter(Boolean).length;
    const totalElementos = Object.keys(elementos).length;
    
    const detalhes = Object.entries(elementos)
      .map(([nome, existe]) => `${nome}: ${existe ? '✅' : '❌'}`)
      .join(', ');
    
    return {
      nome: 'Validação da Interface',
      sucesso: elementosEncontrados === totalElementos,
      resultado: `${elementosEncontrados}/${totalElementos} elementos encontrados (${detalhes})`
    };
  } catch (error) {
    return {
      nome: 'Validação da Interface',
      sucesso: false,
      resultado: error.message
    };
  }
}

// Expor função globalmente
window.testarSistemaVidrosStandalone = executarTestesVidrosStandalone;

// Auto-execução se chamado diretamente
if (typeof module === 'undefined') {
  console.log('📋 Teste standalone de vidros carregado. Execute: testarSistemaVidrosStandalone()');
} 