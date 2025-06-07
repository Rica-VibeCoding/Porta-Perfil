/**
 * Módulo para integração dos vidros do Supabase com o sistema de desenho
 * Sistema de Portas e Perfis
 */

// Cache das cores de vidro
let coresVidroCache = null;
let ultimaAtualizacaoCache = null;
const TEMPO_CACHE = 5 * 60 * 1000; // 5 minutos

/**
 * Carrega as cores de vidro do Supabase
 */
async function carregarCoresVidroSupabase() {
  try {
    const supabaseClient = window.supabaseCliente;
    if (!supabaseClient) {
      console.warn('Cliente Supabase não disponível para cores de vidro');
      return null;
    }

    const { data: vidros, error } = await supabaseClient.select('pv_vidro', {
      select: 'tipo, rgb',
      eq: { 'ativo': true }
    });

    if (error) {
      console.error('Erro ao carregar cores de vidro:', error);
      return null;
    }

    // Converter para formato de mapa
    const coresMap = {};
    vidros.forEach(vidro => {
      coresMap[vidro.tipo] = vidro.rgb;
    });

    console.log(`✅ ${vidros.length} cores de vidro carregadas do Supabase`);
    return coresMap;
  } catch (error) {
    console.error('Erro ao conectar com Supabase para cores de vidro:', error);
    return null;
  }
}

/**
 * Obtém as cores de vidro (com cache)
 */
async function obterCoresVidro() {
  const agora = Date.now();
  
  // Verificar se o cache é válido
  if (coresVidroCache && ultimaAtualizacaoCache && (agora - ultimaAtualizacaoCache) < TEMPO_CACHE) {
    return coresVidroCache;
  }

  // Carregar do Supabase
  const coresSupabase = await carregarCoresVidroSupabase();
  
  if (coresSupabase && Object.keys(coresSupabase).length > 0) {
    coresVidroCache = coresSupabase;
    ultimaAtualizacaoCache = agora;
    return coresSupabase;
  }

  // Fallback para cores hardcoded se Supabase falhar
  console.warn('Usando cores de vidro hardcoded como fallback');
  const coresFallback = {
    'Incolor': 'rgba(230, 235, 240, 0.35)',
    'Espelho': 'rgba(220, 220, 225, 0.70)',
    'Espelho Bronze': 'rgba(160, 120, 80, 0.70)',
    'Espelho Fumê': 'rgba(100, 100, 105, 0.70)',
    'Refleta Bronze': 'rgba(150, 110, 70, 0.55)',
    'Refleta Fume': 'rgba(90, 90, 95, 0.55)',
    'Refleta Prata': 'rgba(190, 200, 210, 0.60)',
    'Fumê': 'rgba(80, 80, 85, 0.45)',
    'Branco': 'rgba(240, 240, 240, 0.70)',
    'Super Branco': 'rgba(250, 250, 250, 0.75)',
    'Preto': 'rgba(20, 20, 20, 0.70)',
    'Canelado': 'rgba(220, 225, 230, 0.40)',
    'Acidato': 'rgba(235, 235, 235, 0.40)',
    'Acidato Fume': 'rgba(120, 120, 125, 0.40)',
    'Mini Boreal': 'rgba(230, 230, 235, 0.45)',
    'Colorido': 'rgba(180, 140, 220, 0.50)'
  };

  coresVidroCache = coresFallback;
  ultimaAtualizacaoCache = agora;
  return coresFallback;
}

/**
 * Atualiza o select de vidros com dados do Supabase
 */
async function atualizarSelectVidros() {
  try {
    const supabaseClient = window.supabaseCliente;
    if (!supabaseClient) {
      console.warn('Cliente Supabase não disponível para select de vidros');
      return;
    }

    const { data: vidros, error } = await supabaseClient.select('pv_vidro', {
      select: 'tipo',
      eq: { 'ativo': true },
      order: 'tipo.asc'
    });

    if (error) {
      console.error('Erro ao carregar vidros para select:', error);
      return;
    }

    const vidroSelect = document.getElementById('vidroTipo');
    if (!vidroSelect) {
      console.warn('Select de vidros não encontrado');
      return;
    }

    // Salvar valor atual
    const valorAtual = vidroSelect.value;

    // Limpar opções existentes
    vidroSelect.innerHTML = '';

    // Adicionar opções do Supabase
    vidros.forEach(vidro => {
      const option = document.createElement('option');
      option.value = vidro.tipo;
      option.textContent = vidro.tipo;
      vidroSelect.appendChild(option);
    });

    // Restaurar valor se ainda existir
    if (valorAtual && [...vidroSelect.options].some(opt => opt.value === valorAtual)) {
      vidroSelect.value = valorAtual;
    } else if (vidroSelect.options.length > 0) {
      vidroSelect.value = vidroSelect.options[0].value;
    }

    console.log(`✅ Select de vidros atualizado com ${vidros.length} opções`);

  } catch (error) {
    console.error('Erro ao atualizar select de vidros:', error);
  }
}

/**
 * Força atualização do cache
 */
async function forcarAtualizacaoCoresVidro() {
  coresVidroCache = null;
  ultimaAtualizacaoCache = null;
  return await obterCoresVidro();
}

/**
 * Função principal para obter cor do vidro (integrada com Supabase)
 */
async function obterCorVidroSupabase(vidroTipo) {
  if (!vidroTipo) {
    return 'rgba(230, 235, 240, 0.35)'; // Cor padrão
  }

  const cores = await obterCoresVidro();
  return cores[vidroTipo] || 'rgba(230, 235, 240, 0.35)';
}

/**
 * Versão síncrona que usa cache ou fallback
 */
function obterCorVidroSync(vidroTipo) {
  if (!vidroTipo) {
    return 'rgba(230, 235, 240, 0.35)';
  }

  // Usar cache se disponível
  if (coresVidroCache && coresVidroCache[vidroTipo]) {
    return coresVidroCache[vidroTipo];
  }

  // Fallback hardcoded
  const coresFallback = {
    'Incolor': 'rgba(230, 235, 240, 0.35)',
    'Espelho': 'rgba(220, 220, 225, 0.70)',
    'Espelho Bronze': 'rgba(160, 120, 80, 0.70)',
    'Espelho Fumê': 'rgba(100, 100, 105, 0.70)',
    'Refleta Bronze': 'rgba(150, 110, 70, 0.55)',
    'Refleta Fume': 'rgba(90, 90, 95, 0.55)',
    'Refleta Prata': 'rgba(190, 200, 210, 0.60)',
    'Fumê': 'rgba(80, 80, 85, 0.45)',
    'Branco': 'rgba(240, 240, 240, 0.70)',
    'Super Branco': 'rgba(250, 250, 250, 0.75)',
    'Preto': 'rgba(20, 20, 20, 0.70)',
    'Canelado': 'rgba(220, 225, 230, 0.40)',
    'Acidato': 'rgba(235, 235, 235, 0.40)',
    'Acidato Fume': 'rgba(120, 120, 125, 0.40)',
    'Mini Boreal': 'rgba(230, 230, 235, 0.45)',
    'Colorido': 'rgba(180, 140, 220, 0.50)'
  };

  return coresFallback[vidroTipo] || 'rgba(230, 235, 240, 0.35)';
}

/**
 * Inicializa o sistema de vidros do Supabase
 */
async function inicializarVidrosSupabase() {
  console.log('🔵 Inicializando sistema de vidros do Supabase...');
  
  try {
    // Carregar cores iniciais
    await obterCoresVidro();
    
    // Atualizar select de vidros
    await atualizarSelectVidros();
    
    // Substituir função global se existir
    if (window.obterCorVidro) {
      window.obterCorVidroOriginal = window.obterCorVidro;
    }
    window.obterCorVidro = obterCorVidroSync;
    
    console.log('✅ Sistema de vidros do Supabase inicializado');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar vidros do Supabase:', error);
  }
}

// Expor funções globalmente
window.obterCorVidroSupabase = obterCorVidroSupabase;
window.obterCorVidroSync = obterCorVidroSync;
window.atualizarSelectVidros = atualizarSelectVidros;
window.forcarAtualizacaoCoresVidro = forcarAtualizacaoCoresVidro;
window.inicializarVidrosSupabase = inicializarVidrosSupabase;

export {
  obterCorVidroSupabase,
  obterCorVidroSync,
  atualizarSelectVidros,
  forcarAtualizacaoCoresVidro,
  inicializarVidrosSupabase
}; 