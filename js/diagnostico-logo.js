/**
 * Script de diagnóstico para o logo na impressão
 * Este arquivo verifica se o logo está sendo carregado corretamente
 */

// Função para diagnóstico do logo
function diagnosticarLogo() {
  console.log('--- DIAGNÓSTICO DE LOGO ---');
  console.log('Iniciando diagnóstico em:', new Date().toLocaleTimeString());
  
  // Verificar logo na raiz do projeto
  const logoRaiz = new Image();
  logoRaiz.onload = function() {
    console.log('✅ Logo na raiz carregado com sucesso:', this.src);
    console.log('   Dimensões:', this.width, 'x', this.height);
  };
  
  logoRaiz.onerror = function() {
    console.error('❌ Erro ao carregar logo na raiz:', this.src);
  };
  
  logoRaiz.src = 'LOGO 2.png';
  
  // Verificar logo SVG
  const logoSVG = new Image();
  logoSVG.onload = function() {
    console.log('✅ Logo SVG carregado com sucesso:', this.src);
    console.log('   Dimensões:', this.width, 'x', this.height);
  };
  
  logoSVG.onerror = function() {
    console.error('❌ Erro ao carregar logo SVG:', this.src);
  };
  
  logoSVG.src = 'LOGO 2 - SVG.svg';
  
  // Verificar logo na pasta img
  const logoImg = new Image();
  logoImg.onload = function() {
    console.log('✅ Logo na pasta img carregado com sucesso:', this.src);
    console.log('   Dimensões:', this.width, 'x', this.height);
  };
  
  logoImg.onerror = function() {
    console.error('❌ Erro ao carregar logo na pasta img:', this.src);
  };
  
  logoImg.src = 'img/logo.png';
  
  // Verificar a área de impressão e o logo após um tempo para garantir que o DOM esteja pronto
  setTimeout(verificarAreaImpressao, 1500);
}

// Função específica para verificar a área de impressão
function verificarAreaImpressao() {
  console.log('Verificando elementos de logo no DOM:');
  
  // Verificar se a área de impressão existe
  const printArea = document.getElementById('print-area');
  console.log('3. Área de impressão (print-area):',
    printArea ? '✅ Encontrado' : '❌ Não encontrado',
    printArea ? `display=${window.getComputedStyle(printArea).display}` : ''
  );
  
  if (!printArea) {
    console.error('❌ Área de impressão não encontrada - logo não poderá ser exibido');
    return;
  }
  
  // Verificar se o logo de impressão existe
  const printLogo = document.querySelector('#print-area #print-logo');
  // Testar seletores alternativos se o primeiro falhar
  const logoAlternativo = printLogo || 
                         document.querySelector('.print-logo') || 
                         document.querySelector('.print-header-logo img') ||
                         document.getElementById('print-logo');
  
  console.log('2. Logo de impressão (print-logo):',
    logoAlternativo ? '✅ Encontrado' : '❌ Não encontrado',
    logoAlternativo ? `src="${logoAlternativo.src}"` : ''
  );
  
  // Verificar logo principal também
  const logoImage = document.getElementById('logoImage');
  console.log('1. Logo principal (logoImage):', 
    logoImage ? '✅ Encontrado' : '❌ Não encontrado',
    logoImage ? `src="${logoImage.src}"` : ''
  );
  
  // Verificar o objeto SVG fallback
  const logoObject = document.getElementById('print-logo-object');
  console.log('5. Logo objeto SVG (fallback):',
    logoObject ? '✅ Encontrado' : '❌ Não encontrado'
  );
  
  // Se encontrou algum logo, verificar estilos aplicados
  if (logoAlternativo) {
    const styles = window.getComputedStyle(logoAlternativo);
    console.log('   Estilos do logo de impressão:');
    console.log('   - display:', styles.display);
    console.log('   - visibility:', styles.visibility);
    console.log('   - width:', styles.width);
    console.log('   - height:', styles.height);
    console.log('   - opacity:', styles.opacity);
    console.log('   - has naturalWidth:', logoAlternativo.naturalWidth > 0 ? 'Sim' : 'Não');
    console.log('   - completo:', logoAlternativo.complete ? 'Sim' : 'Não');
    
    // Verificar container
    const logoContainer = logoAlternativo.closest('.print-header-logo');
    if (logoContainer) {
      const containerStyles = window.getComputedStyle(logoContainer);
      console.log('   Container do logo:');
      console.log('   - display:', containerStyles.display);
      console.log('   - visibility:', containerStyles.visibility);
      console.log('   - width:', containerStyles.width);
      console.log('   - height:', containerStyles.height);
    } else {
      console.error('   ❌ Container do logo não encontrado');
    }
    
    // Tentar corrigir o logo se não estiver visível
    if (styles.display === 'none' || styles.visibility === 'hidden' || logoAlternativo.naturalWidth === 0) {
      console.log('⚠️ Logo está invisível ou não carregou, tentando corrigir...');
      logoAlternativo.style.display = 'block';
      logoAlternativo.style.visibility = 'visible';
      logoAlternativo.style.opacity = '1';
      logoAlternativo.style.maxWidth = '200px';
      logoAlternativo.style.width = 'auto';
      logoAlternativo.style.height = 'auto';
      
      // Recarregar o logo
      if (logoAlternativo.naturalWidth === 0) {
        logoAlternativo.src = 'LOGO 2 - SVG.svg';
      }
    }
  }
  
  if (printArea) {
    const styles = window.getComputedStyle(printArea);
    console.log('   Estilos da área de impressão:');
    console.log('   - display:', styles.display);
    console.log('   - visibility:', styles.visibility);
    console.log('   - position:', styles.position);
    
    // Corrigir área de impressão se necessário
    if (styles.display === 'none' || styles.visibility === 'hidden') {
      console.log('⚠️ Área de impressão está invisível, tentando corrigir...');
      printArea.style.display = 'block';
      printArea.style.visibility = 'visible';
      printArea.style.position = 'absolute';
      printArea.style.left = '-9999px';
      printArea.style.top = '0';
    }
  }
  
  // Verificar container alternativo
  const printBooklet = document.getElementById('print-booklet');
  console.log('4. Booklet de impressão (print-booklet):',
    printBooklet ? '✅ Encontrado' : '❌ Não encontrado'
  );
  
  console.log('--- FIM DO DIAGNÓSTICO DE LOGO ---');
  
  // CORREÇÃO AUTOMÁTICA - Criar um logo de emergência se necessário
  if (!logoAlternativo || logoAlternativo.naturalWidth === 0) {
    console.log('⚠️ Implementando correção de emergência para o logo...');
    
    // Encontrar o container do logo
    const headerLogo = document.querySelector('.print-header-logo');
    
    if (headerLogo) {
      // Criar um novo elemento de imagem
      const novoLogo = document.createElement('img');
      novoLogo.id = 'print-logo-emergency';
      novoLogo.src = 'LOGO 2 - SVG.svg';
      novoLogo.alt = 'Logo da empresa (emergência)';
      novoLogo.className = 'print-logo';
      novoLogo.style.display = 'block';
      novoLogo.style.visibility = 'visible';
      novoLogo.style.opacity = '1';
      novoLogo.style.maxWidth = '200px';
      novoLogo.style.width = 'auto';
      novoLogo.style.height = 'auto';
      
      // Adicionar ao container
      headerLogo.prepend(novoLogo);
      
      console.log('✅ Logo de emergência criado e adicionado');
    }
  }
}

// Executar diagnóstico logo após a página carregar completamente
window.addEventListener('load', function() {
  // Executar imediatamente
  diagnosticarLogo();
  
  // E executar novamente após 3 segundos para garantir que tudo foi carregado
  setTimeout(diagnosticarLogo, 3000);
});

// Adicionar botão para teste manual do logo na impressão
window.addEventListener('DOMContentLoaded', function() {
  const btnImprimir = document.getElementById('btnImprimir');
  if (btnImprimir) {
    btnImprimir.addEventListener('click', function() {
      console.log('Botão imprimir clicado, diagnosticando logo...');
      diagnosticarLogo();
      
      // Executar verificação específica após um momento
      setTimeout(verificarAreaImpressao, 500);
    });
  }
});

// Exportar para uso externo
window.diagnosticarLogo = diagnosticarLogo;
window.verificarAreaImpressao = verificarAreaImpressao; 