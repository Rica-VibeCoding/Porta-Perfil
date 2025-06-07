/**
 * Debug Modal Puxador - Versão Concisa
 * Vibecode - Portas e Perfis
 */

// Debug principal
function debugModalPuxador() {
  console.log('🔍 === DEBUG MODAL PUXADOR ===');
  
  // 1. Verificar modais
  const modalCadastro = document.getElementById('modalCadastro');
  const cadastroFormModal = document.getElementById('cadastroFormModal');
  const tituloModalCadastro = document.getElementById('tituloModalCadastro');
  
  console.log('📋 Modais encontrados:');
  console.log('   modalCadastro:', !!modalCadastro);
  console.log('   cadastroFormModal:', !!cadastroFormModal);
  console.log('   tituloModalCadastro:', tituloModalCadastro?.textContent);
  
  // 2. Verificar modal coordinator
  console.log('⚙️ Modal Coordinator:', !!window.modalCoordinator);
  
  // 3. Verificar botões
  const btnAdd = document.getElementById('btnAdicionarPuxador');
  const btnNovo = document.getElementById('btnNovoPuxador');
  console.log('🔘 Botões:', { btnAdd: !!btnAdd, btnNovo: !!btnNovo });
  
  return { modalCadastro, cadastroFormModal, tituloModalCadastro };
}

// Correção rápida
function corrigirModalPuxador() {
  console.log('🔧 Corrigindo modal de puxador...');
  
  // Função para definir título correto
  window.setTituloModal = function(isEdit = false) {
    const titulo = isEdit ? 'Editar Puxador' : 'Novo Puxador';
    
    ['tituloModalCadastro', 'cadastroFormModalLabel', 'tituloFormCadastro'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = titulo;
        console.log(`✅ Título ${id}: ${titulo}`);
      }
    });
  };
  
  // Função para abrir modal seguro
  window.openModalPuxador = function(dados = null) {
    console.log('🎯 Abrindo modal:', dados ? 'Edição' : 'Novo');
    
    // Definir título
    window.setTituloModal(!!dados);
    
    // Usar coordinator se disponível
    if (window.modalCoordinator?.openModal) {
      try {
        return window.modalCoordinator.openModal('puxador', dados);
      } catch (e) {
        console.warn('Coordinator falhou:', e);
      }
    }
    
    // Fallback direto
    const modal = document.getElementById('cadastroFormModal') || 
                  document.getElementById('modalCadastro');
    
    if (modal && window.bootstrap) {
      const bsModal = new bootstrap.Modal(modal);
      
      // Reset form
      const form = modal.querySelector('form');
      if (form) form.reset();
      
      // Fill data if editing
      if (dados) {
        ['itemModelo', 'itemFabricante', 'itemCor', 'itemMedida'].forEach(id => {
          const field = document.getElementById(id);
          const key = id.replace('item', '').toLowerCase();
          if (field && dados[key]) field.value = dados[key];
        });
      }
      
      bsModal.show();
      return true;
    }
    
    console.error('❌ Modal não encontrado');
    return false;
  };
  
  // Configurar botões
  ['btnAdicionarPuxador', 'btnNovoPuxador'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.onclick = (e) => {
        e.preventDefault();
        window.openModalPuxador();
      };
      console.log(`✅ Botão ${id} configurado`);
    }
  });
  
  console.log('✅ Correções aplicadas!');
}

// Teste rápido
async function testarModalPuxador() {
  console.log('🧪 Testando modal...');
  
  try {
    // Teste abrir novo
    window.openModalPuxador();
    console.log('✅ Modal novo: OK');
    
    // Teste abrir edição
    setTimeout(() => {
      window.openModalPuxador({ modelo: 'Teste', fabricante: 'Test Inc' });
      console.log('✅ Modal edição: OK');
    }, 1000);
    
  } catch (error) {
    console.error('❌ Teste falhou:', error);
  }
}

// Exposição global
window.debugModalPuxador = debugModalPuxador;
window.corrigirModalPuxador = corrigirModalPuxador;
window.testarModalPuxador = testarModalPuxador;

console.log('🚀 Debug Modal Puxador carregado');
console.log('   Execute: debugModalPuxador()');
console.log('   Corrigir: corrigirModalPuxador()');
console.log('   Testar: testarModalPuxador()'); 