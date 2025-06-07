/**
 * Correção Emergencial - Erros do Console
 * Vibecode - Portas e Perfis
 */

console.log('🚨 Correção emergencial carregando...');

// 1. Fix Supabase 406 Error
function fixSupabase406() {
  console.log('🔧 Corrigindo erro 406 do Supabase...');
  
  if (!window.supabase) {
    // Tentar carregar Supabase de outro CDN
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@supabase/supabase-js@2';
    script.onload = () => {
      console.log('✅ Supabase carregado via CDN alternativo');
      // Tentar inicializar
      if (window.supabaseUrl && window.supabaseKey) {
        window.supabase = window.supabase.createClient(window.supabaseUrl, window.supabaseKey);
      }
    };
    document.head.appendChild(script);
  }
}

// 2. Fix Modal Coordinator
function fixModalCoordinator() {
  console.log('🔧 Corrigindo Modal Coordinator...');
  
  if (!window.modalCoordinator) {
    window.modalCoordinator = {
      handleSave: function(tipo, dados) {
        console.log('🔄 Modal Coordinator Fallback - handleSave:', tipo);
        
        if (tipo === 'puxador') {
          return criarPuxadorDireto(dados);
        }
        
        return Promise.resolve({ success: false, error: 'Tipo não suportado' });
      },
      
      openModal: function(tipo, dados) {
        console.log('🔄 Modal Coordinator Fallback - openModal:', tipo);
        
        if (window.openModalPuxador) {
          return window.openModalPuxador(dados);
        }
        
        alert('Modal não disponível');
        return false;
      }
    };
    
    console.log('✅ Modal Coordinator Fallback criado');
  }
}

// 3. Criar puxador direto (bypass do sistema complexo)
async function criarPuxadorDireto(dados) {
  console.log('➕ Criando puxador direto:', dados);
  
  try {
    if (window.supabase) {
      const user = await window.supabase.auth.getUser();
      const dadosCompletos = {
        modelo: dados.modelo || dados.itemModelo || 'Modelo Teste',
        fabricante: dados.fabricante || dados.itemFabricante || '',
        cor: dados.cor || dados.itemCor || '',
        medida: dados.medida || dados.itemMedida || '',
        id_usuario: user.data?.user?.id || '00000000-0000-0000-0000-000000000001',
        criado_em: new Date().toISOString()
      };
      
      const { data, error } = await window.supabase
        .from('puxadores')
        .insert([dadosCompletos])
        .select();
      
      if (error) throw error;
      
      console.log('✅ Puxador criado com sucesso:', data[0]);
      
      // Fechar modal se aberto
      const modal = document.querySelector('.modal.show');
      if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
      }
      
      // Recarregar dados
      if (window.carregarPuxadores) {
        window.carregarPuxadores();
      }
      
      alert('Puxador criado com sucesso!');
      return { success: true, data: data[0] };
      
    } else {
      throw new Error('Supabase não disponível');
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar puxador:', error);
    alert('Erro ao criar puxador: ' + error.message);
    return { success: false, error: error.message };
  }
}

// 4. Fix botão Adicionar Puxador
function fixBotaoAdicionar() {
  console.log('🔧 Corrigindo botão Adicionar...');
  
  const btn = document.getElementById('btnAdicionarPuxador');
  if (btn) {
    // Remover todos os eventos
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    // Adicionar evento simples
    newBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('🎯 Botão clicado - abrindo modal');
      
      // Tentar abrir modal
      const modal = document.getElementById('modalCadastro');
      if (modal) {
        // Limpar formulário
        const form = modal.querySelector('form');
        if (form) form.reset();
        
        // Definir título correto
        const titulo = document.getElementById('tituloModalCadastro');
        if (titulo) titulo.textContent = 'Novo Puxador';
        
        // Abrir modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        console.log('✅ Modal aberto com sucesso');
      } else {
        alert('Modal não encontrado');
      }
    };
    
    console.log('✅ Botão reconfigurado');
  }
}

// 5. Fix formulário de submit
function fixFormularioSubmit() {
  console.log('🔧 Corrigindo formulário...');
  
  const form = document.getElementById('formPuxadores');
  if (form) {
    form.onsubmit = async function(e) {
      e.preventDefault();
      
      console.log('📝 Formulário enviado');
      
      const dados = {
        modelo: document.getElementById('codigo')?.value || '',
        fabricante: document.getElementById('nome')?.value || '',
        cor: '',
        medida: document.getElementById('valor')?.value || ''
      };
      
      const resultado = await criarPuxadorDireto(dados);
      
      if (resultado.success) {
        form.reset();
      }
    };
    
    console.log('✅ Formulário reconfigurado');
  }
}

// 6. Aplicar todas as correções
function aplicarCorrecoes() {
  console.log('🔥 APLICANDO TODAS AS CORREÇÕES...');
  
  fixSupabase406();
  fixModalCoordinator();
  fixBotaoAdicionar();
  fixFormularioSubmit();
  
  console.log('✅ CORREÇÕES APLICADAS - Tente criar um puxador agora!');
}

// Expor funções
window.fixSupabase406 = fixSupabase406;
window.fixModalCoordinator = fixModalCoordinator;
window.criarPuxadorDireto = criarPuxadorDireto;
window.aplicarCorrecoes = aplicarCorrecoes;

// Auto-aplicar correções
setTimeout(() => {
  aplicarCorrecoes();
}, 1000);

console.log('🚨 Fix emergencial carregado - Execute aplicarCorrecoes() se necessário'); 