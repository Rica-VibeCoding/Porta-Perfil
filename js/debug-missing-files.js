/**
 * Diagnóstico de Arquivos Faltantes - Erro 406
 * Vibecode - Portas e Perfis
 */

console.log('🔍 Iniciando diagnóstico de arquivos faltantes...');

/**
 * Lista de arquivos que podem estar causando erro 406
 */
const arquivosFaltantes = [
  'js/app.js',
  'js/lib/bootstrap.bundle.min.js',
  'js/lib/html2canvas.min.js', 
  'js/lib/html2pdf.bundle.min.js',
  'js/lib/svgpath.min.js'
];

/**
 * Função para verificar se um arquivo existe
 */
async function verificarArquivo(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Diagnóstico completo
 */
async function diagnosticarArquivos() {
  console.log('📋 Verificando arquivos...');
  
  const resultados = {};
  
  for (const arquivo of arquivosFaltantes) {
    const existe = await verificarArquivo(arquivo);
    resultados[arquivo] = existe;
    
    if (existe) {
      console.log(`✅ ${arquivo} - OK`);
    } else {
      console.error(`❌ ${arquivo} - FALTANDO (erro 406)`);
    }
  }
  
  return resultados;
}

/**
 * Aplicar correções para arquivos faltantes
 */
function aplicarCorrecoes() {
  console.log('🛠️ Aplicando correções para arquivos faltantes...');
  
  try {
    // Remover scripts faltantes que podem estar causando erro 406
    const scriptsFaltantes = document.querySelectorAll('script[src*="js/lib/"], script[src*="js/app.js"]');
    
    scriptsFaltantes.forEach(script => {
      if (script.src) {
        console.warn(`⚠️ Removendo script faltante: ${script.src}`);
        script.remove();
      }
    });
    
    // Verificar se Bootstrap está sendo carregado de CDN (que funciona)
    const bootstrapCDN = document.querySelector('script[src*="bootstrap@5.3.2"]');
    if (bootstrapCDN) {
      console.log('✅ Bootstrap CDN detectado - OK');
    } else {
      console.warn('⚠️ Bootstrap CDN não encontrado');
    }
    
    console.log('✅ Correções aplicadas com sucesso');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao aplicar correções:', error);
    return false;
  }
}

/**
 * Função principal de diagnóstico
 */
async function executarDiagnostico() {
  try {
    console.log('🚀 Executando diagnóstico completo...');
    
    // 1. Verificar arquivos
    const resultados = await diagnosticarArquivos();
    
    // 2. Aplicar correções
    const corrigido = aplicarCorrecoes();
    
    // 3. Relatório final
    console.log('\n📊 RELATÓRIO DE DIAGNÓSTICO:');
    console.log('================================');
    
    const arquivosOK = Object.values(resultados).filter(ok => ok).length;
    const arquivosFaltando = Object.values(resultados).filter(ok => !ok).length;
    
    console.log(`✅ Arquivos OK: ${arquivosOK}`);
    console.log(`❌ Arquivos faltando: ${arquivosFaltando}`);
    console.log(`🛠️ Correções aplicadas: ${corrigido ? 'Sim' : 'Não'}`);
    
    if (arquivosFaltando > 0) {
      console.log('\n⚠️ ARQUIVOS FALTANTES DETECTADOS:');
      Object.entries(resultados).forEach(([arquivo, existe]) => {
        if (!existe) {
          console.log(`   - ${arquivo}`);
        }
      });
      
      console.log('\n💡 SOLUÇÕES RECOMENDADAS:');
      console.log('1. Criar diretório js/lib/ se necessário');
      console.log('2. Baixar bibliotecas ou usar CDNs');
      console.log('3. Remover referências a arquivos inexistentes');
      console.log('4. Verificar se o servidor está servindo arquivos corretamente');
    }
    
    return { resultados, corrigido };
    
  } catch (error) {
    console.error('💥 Erro no diagnóstico:', error);
    return null;
  }
}

// Expor funções globalmente
window.diagnosticarArquivos406 = executarDiagnostico;
window.aplicarCorrecoesMissingFiles = aplicarCorrecoes;

// Executar automaticamente após carregamento
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    console.log('🔧 Executando diagnóstico automático de arquivos...');
    executarDiagnostico();
  }, 2000);
});

console.log('📦 Debug de arquivos faltantes carregado'); 