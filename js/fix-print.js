/**
 * Script de correções para problemas de impressão
 * Fornece utilitários para diagnóstico e correção de problemas de impressão como o logo ausente
 */

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 DEBUG: Iniciando script fix-print.js');
  
  // Diagnóstico de visibilidade para áreas de impressão
  function diagnosticarAreasImpressao() {
    console.log('📄 Diagnóstico de áreas de impressão:');
    
    // Verificar todas as áreas dedicadas à impressão
    const areas = [
      '#print-area',
      '#print-booklet', 
      '#print-area .print-header',
      '#print-area .print-header-logo',
      '#print-booklet .print-header',
      '#print-booklet .print-header-logo'
    ];
    
    // Resultados do diagnóstico
    const diagnostico = {};
    
    areas.forEach(selector => {
      const element = document.querySelector(selector);
      
      if (element) {
        // Obter estilos computados para verificar visibilidade real
        const styles = window.getComputedStyle(element);
        
        diagnostico[selector] = {
          encontrado: true,
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          position: styles.position,
          left: styles.left,
          top: styles.top,
          width: styles.width,
          height: styles.height,
          zIndex: styles.zIndex,
          overflow: styles.overflow
        };
      } else {
        diagnostico[selector] = {
          encontrado: false
        };
      }
    });
    
    // Saída de diagnóstico
    console.table(diagnostico);
    
    return diagnostico;
  }
  
  // Diagnóstico de visibilidade para logos na impressão
  function diagnosticarLogosImpressao() {
    console.log('📄 Diagnóstico de logos na impressão:');
    
    // Verificar todos os possíveis elementos de logo
    const seletores = [
      '#print-logo',
      '.print-logo',
      '.print-header-logo img',
      '#print-logo-emergency',
      '#print-logo-object',
      '#print-logo-text'
    ];
    
    // Resultados do diagnóstico
    const diagnostico = {};
    
    seletores.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      
      if (elements.length > 0) {
        // Para cada elemento encontrado
        Array.from(elements).forEach((element, index) => {
          const selectorIndex = `${selector}[${index}]`;
          const styles = window.getComputedStyle(element);
          
          diagnostico[selectorIndex] = {
            encontrado: true,
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            width: styles.width,
            maxWidth: styles.maxWidth,
            height: styles.height,
            src: element.tagName === 'IMG' ? element.src : 'N/A',
            naturalWidth: element.tagName === 'IMG' ? element.naturalWidth : 'N/A',
            complete: element.tagName === 'IMG' ? element.complete : 'N/A'
          };
        });
      } else {
        diagnostico[selector] = {
          encontrado: false
        };
      }
    });
    
    // Saída de diagnóstico
    console.table(diagnostico);
    
    return diagnostico;
  }
  
  // Corrigir problemas de visibilidade em áreas de impressão
  function corrigirAreasImpressao() {
    console.log('📄 Corrigindo áreas de impressão...');
    
    // Obter os elementos alvo
    const printArea = document.getElementById('print-area');
    const printBooklet = document.getElementById('print-booklet');
    
    // Correções para o print-area
    if (printArea) {
      // Remover classes que possam ocultar
      printArea.className = 'print-container printing';
      
      // Aplicar estilos explícitos para impressão
      const printAreaStyles = {
        display: 'block',
        visibility: 'visible',
        opacity: '1',
        position: 'absolute',
        left: '-9999px', // Fora da tela, mas não oculto
        top: '0',
        width: 'auto',
        height: 'auto',
        zIndex: '9999',
        overflow: 'visible'
      };
      
      // Aplicar estilos
      Object.assign(printArea.style, printAreaStyles);
      
      console.log('📄 Área de impressão #print-area corrigida');
    } else {
      console.warn('📄 Área de impressão #print-area não encontrada!');
    }
    
    // Correções para o print-booklet
    if (printBooklet) {
      // Remover classes que possam ocultar
      printBooklet.className = 'print-container printing';
      
      // Aplicar estilos explícitos para impressão
      const printBookletStyles = {
        display: 'block',
        visibility: 'visible',
        opacity: '1',
        position: 'absolute',
        left: '-9999px', // Fora da tela, mas não oculto
        top: '0',
        width: 'auto',
        height: 'auto',
        zIndex: '9999',
        overflow: 'visible'
      };
      
      // Aplicar estilos
      Object.assign(printBooklet.style, printBookletStyles);
      
      console.log('📄 Área de impressão #print-booklet corrigida');
    } else {
      console.warn('📄 Área de impressão #print-booklet não encontrada!');
    }
    
    return {
      printArea: printArea ? 'corrigido' : 'não encontrado',
      printBooklet: printBooklet ? 'corrigido' : 'não encontrado'
    };
  }
  
  // Corrigir problemas com logos na impressão
  function corrigirLogosImpressao() {
    console.log('📄 Corrigindo logos na impressão...');
    
    // Verificar e corrigir todos os possíveis elementos de logo
    const logoPrintSelector = '#print-logo, .print-logo, .print-header-logo img, #print-logo-emergency';
    const logoElements = document.querySelectorAll(logoPrintSelector);
    
    console.log('📄 Elementos de logo encontrados:', logoElements.length);
    
    if (logoElements.length > 0) {
      logoElements.forEach(logo => {
        console.log('📄 Corrigindo:', logo.id || 'sem id', logo.className || 'sem classe');
        
        // Força a visibilidade
        const logoStyles = {
          display: 'block',
          visibility: 'visible',
          opacity: '1',
          maxWidth: '200px',
          width: 'auto',
          height: 'auto',
          marginBottom: '10px'
        };
        
        // Aplicar estilos
        Object.assign(logo.style, logoStyles);
        
        // Verifica se o src está correto
        if (logo.tagName === 'IMG' && (!logo.src || logo.naturalWidth === 0)) {
          console.log('📄 Ajustando src do logo - era:', logo.src);
          logo.src = 'LOGO 2 - SVG.svg';
          
          // Configurar fallback para o caso do SVG falhar
          logo.onerror = function() {
            console.log('📄 Erro ao carregar SVG, tentando PNG da pasta img');
            logo.src = 'img/logo.png';
            
            // Segundo fallback para logo na raiz
            logo.onerror = function() {
              console.log('📄 Erro ao carregar PNG da pasta img, tentando PNG da raiz');
              logo.src = 'LOGO 2.png';
            };
          };
        }
      });
      
      console.log('📄 Visibilidade de', logoElements.length, 'elementos de logo garantida');
    } else {
      console.warn('📄 Nenhum elemento de logo encontrado para corrigir. Tentando criar...');
      
      // Verificar se temos áreas de impressão
      const printAreas = ['#print-area', '#print-booklet'];
      let printAreaFound = false;
      
      for (const areaSelector of printAreas) {
        const printArea = document.querySelector(areaSelector);
        
        if (printArea) {
          printAreaFound = true;
          console.log('📄 Área de impressão encontrada:', areaSelector);
          
          // Verificar se já existe um header
          let printHeader = printArea.querySelector('.print-header');
          
          if (!printHeader) {
            console.log('📄 Criando cabeçalho para:', areaSelector);
            printHeader = document.createElement('div');
            printHeader.className = 'print-header';
            printHeader.style.display = 'block';
            printHeader.style.visibility = 'visible';
            printHeader.style.opacity = '1';
            printArea.prepend(printHeader);
          }
          
          // Verificar se já existe um container para o logo
          let logoContainer = printHeader.querySelector('.print-header-logo');
          
          if (!logoContainer) {
            console.log('📄 Criando container do logo para:', areaSelector);
            logoContainer = document.createElement('div');
            logoContainer.className = 'print-header-logo';
            logoContainer.style.display = 'block';
            logoContainer.style.visibility = 'visible';
            logoContainer.style.opacity = '1';
            printHeader.prepend(logoContainer);
          }
          
          // Criar logo
          const logo = document.createElement('img');
          logo.id = 'print-logo-emergency';
          logo.className = 'print-logo';
          logo.alt = 'Logo da empresa';
          logo.src = 'LOGO 2 - SVG.svg';
          logo.style.display = 'block';
          logo.style.visibility = 'visible';
          logo.style.opacity = '1';
          logo.style.maxWidth = '200px';
          logo.style.width = 'auto';
          logo.style.height = 'auto';
          
          // Adicionar ao container
          logoContainer.prepend(logo);
          
          console.log('📄 Logo criado com sucesso para:', areaSelector);
        }
      }
      
      if (!printAreaFound) {
        console.error('📄 Nenhuma área de impressão encontrada para adicionar o logo!');
        return false;
      }
    }
    
    return true;
  }
  
  // Adicionar estilos CSS que forçam a visibilidade na impressão
  function adicionarEstilosImpressao() {
    console.log('📄 Adicionando estilos CSS para corrigir visibilidade na impressão...');
    
    // Verificar se já existe
    let styleElement = document.getElementById('fix-print-styles');
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'fix-print-styles';
      document.head.appendChild(styleElement);
    }
    
    // Estilos para corrigir problemas de impressão
    styleElement.textContent = `
      @media print {
        /* Garantir que as áreas de impressão estejam visíveis */
        #print-area.printing, #print-booklet.printing {
          display: block !important;
          visibility: visible !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          height: 100% !important;
          z-index: 9999 !important;
          background-color: white !important;
          opacity: 1 !important;
          overflow: visible !important;
        }
        
        #print-area.printing *, #print-booklet.printing * {
          visibility: visible !important;
          display: block !important;
          opacity: 1 !important;
        }
        
        /* Garantir que o logo esteja visível */
        .print-header-logo, 
        #print-logo, 
        .print-logo, 
        #print-logo-emergency {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          max-width: 50px !important;
          width: auto !important;
          height: auto !important;
        }
      }
    `;
    
    console.log('📄 Estilos CSS adicionados com sucesso');
    return true;
  }
  
  // Função para corrigir tudo de uma vez
  function corrigirTudo() {
    console.log('📄 Iniciando correção completa para problemas de impressão...');
    
    // Executar diagnósticos
    diagnosticarAreasImpressao();
    diagnosticarLogosImpressao();
    
    // Aplicar correções
    corrigirAreasImpressao();
    corrigirLogosImpressao();
    adicionarEstilosImpressao();
    
    console.log('📄 Todas as correções de impressão aplicadas');
    return true;
  }
  
  // Executar diagnóstico inicial
  // setTimeout(() => {
  //   diagnosticarAreasImpressao();
  //   diagnosticarLogosImpressao();
  // }, 2000);
  
  // Exportar funções para uso global
  window.fixPrintModule = {
    diagnosticarAreasImpressao,
    diagnosticarLogosImpressao,
    corrigirAreasImpressao,
    corrigirLogosImpressao,
    adicionarEstilosImpressao,
    corrigirTudo
  };
  
  // Adicionar correções para evento beforeprint
  window.addEventListener('beforeprint', function() {
    console.log('📄 Evento beforeprint detectado, aplicando correções de emergência...');
    corrigirTudo();
  });
}); 