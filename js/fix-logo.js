/**
 * Script para corrigir o problema do logo na impressão
 * Garante que a imagem do logo seja carregada corretamente antes da impressão
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔍 DEBUG: Iniciando script fix-logo.js');
  
  // Função para depurar os seletores
  function depurarSeletores() {
    console.log('🔍 DEBUG: Verificando seletores no DOM');
    
    // Listar todos os elementos img no documento
    const todasImagens = document.querySelectorAll('img');
    console.log('🔍 Total de imagens no documento:', todasImagens.length);
    
    // Listar as primeiras 5 imagens com seus IDs e classes
    Array.from(todasImagens).slice(0, 5).forEach((img, index) => {
      console.log(`🔍 Imagem ${index}:`, {
        id: img.id || 'sem id',
        classes: img.className || 'sem classes',
        src: img.src || 'sem src'
      });
    });
    
    // Verificar cada seletor individualmente
    [
      '#print-logo', 
      '.print-logo', 
      '.print-header-logo img', 
      '#print-logo-emergency'
    ].forEach(selector => {
      const elements = document.querySelectorAll(selector);
      console.log(`🔍 Seletor "${selector}":`, elements.length, 'elementos encontrados');
    });
    
    // Verificar containers
    [
      '.print-header-logo',
      '.print-header',
      '#print-area'
    ].forEach(selector => {
      const element = document.querySelector(selector);
      console.log(`🔍 Container "${selector}":`, element ? 'encontrado' : 'não encontrado');
    });
  }
  
  // Executar verificação imediata
  depurarSeletores();
  
  // Verifica se a área de impressão está pronta
  function verificarAreaImpressao() {
    // Verificar se a área de impressão existe
    const printArea = document.getElementById('print-area');
    if (!printArea) {
      console.log('🔍 Área de impressão (print-area) ainda não existe');
      return false;
    }
    
    return true;
  }
  
  // Função centralizada para garantir a visibilidade do logo
  // Variável para controlar se uma estrutura de emergência já foi criada
  let estruturaDeEmergenciaCriada = false;
  let tentativasRealizadas = 0;
  const MAX_TENTATIVAS = 3;
  
  function garantirLogoVisivel(forcado = false) {
    // Se não for chamada forçada e já tivermos tentado o máximo ou criado estrutura de emergência, sair
    if (!forcado && (tentativasRealizadas >= MAX_TENTATIVAS || estruturaDeEmergenciaCriada)) {
      return;
    }
    
    tentativasRealizadas++;
    console.log('🔍 Executando garantirLogoVisivel() - Tentativa:', tentativasRealizadas);
    
    // Verificar se a área de impressão está pronta antes de continuar
    if (!verificarAreaImpressao()) {
      console.log('🔍 Área de impressão não encontrada, aguardando criação...');
      return;
    }
    
    // Depurar novamente antes de tentar a correção
    depurarSeletores();
    
    // Verificar e corrigir todos os possíveis elementos de logo
    const logoPrintSelector = '#print-logo, .print-logo, .print-header-logo img, #print-logo-emergency';
    const logoElements = document.querySelectorAll(logoPrintSelector);
    
    console.log('🔍 logoElements:', logoElements.length, 'elementos encontrados');
    
    if (logoElements.length > 0) {
      logoElements.forEach(logo => {
        console.log('🔍 Corrigindo logo:', logo.id || 'sem id', logo.className || 'sem classe');
        
        // Força a visibilidade
        logo.style.display = 'block';
        logo.style.visibility = 'visible';
        logo.style.opacity = '1';
        logo.style.maxWidth = '200px';
        logo.style.width = 'auto';
        logo.style.height = 'auto';
        logo.style.marginBottom = '10px';
        
        // Verifica se o src está correto
        if (!logo.src || logo.naturalWidth === 0) {
          console.log('🔍 Ajustando src do logo - era:', logo.src);
          logo.src = 'LOGO 2 - SVG.svg';
          
          // Configurar fallback para o caso do SVG falhar
          logo.onerror = function() {
            console.log('🔍 Erro ao carregar SVG, tentando PNG da pasta img');
            logo.src = 'img/logo.png';
            
            // Segundo fallback para logo na raiz
            logo.onerror = function() {
              console.log('🔍 Erro ao carregar PNG da pasta img, tentando PNG da raiz');
              logo.src = 'LOGO 2.png';
            };
          };
        }
      });
      
      console.log('✅ Visibilidade de', logoElements.length, 'elementos de logo garantida');
    } else if (!estruturaDeEmergenciaCriada) {
      console.warn('⚠️ Nenhum elemento de logo encontrado depois de várias tentativas, criando estrutura de emergência');
      estruturaDeEmergenciaCriada = true;
      
      // CORREÇÃO DE EMERGÊNCIA: Criar logo na área de impressão
      console.log('🔍 Tentando criar logo de emergência');
      
      // Primeiro verificar se a área de impressão existe
      const printArea = document.getElementById('print-area');
      if (!printArea) {
        console.error('❌ Área de impressão (#print-area) não existe!');
        
        // Tentar criar a área de impressão
        console.log('🔍 Criando área de impressão de emergência');
        const novaPrintArea = document.createElement('div');
        novaPrintArea.id = 'print-area';
        novaPrintArea.className = 'print-container';
        novaPrintArea.style.display = 'block';
        novaPrintArea.style.position = 'absolute';
        novaPrintArea.style.left = '-9999px';
        novaPrintArea.style.top = '0';
        document.body.appendChild(novaPrintArea);
        
        // Criar estrutura básica
        novaPrintArea.innerHTML = `
          <div class="print-header">
            <div class="print-header-logo">
              <img src="LOGO 2 - SVG.svg" id="print-logo" class="print-logo" alt="Logo da empresa" 
                   style="max-width:200px; width:auto; height:auto; display:block; visibility:visible; opacity:1;">
            </div>
            <div class="print-header-title">
              <h2>Descrição da Porta:</h2>
            </div>
          </div>
          <div class="print-content">
            <div class="watermark">ESPECIFICAÇÃO TÉCNICA</div>
            <div id="svg-container-clone" class="svg-container"></div>
          </div>
        `;
        
        console.log('✅ Área de impressão criada com logo');
      } else {
        // Tentar encontrar ou criar o container do logo
        let headerLogo = printArea.querySelector('.print-header-logo');
        
        if (!headerLogo) {
          console.log('🔍 Container .print-header-logo não encontrado, criando...');
          
          // Verificar se há pelo menos um header
          let printHeader = printArea.querySelector('.print-header');
          
          if (!printHeader) {
            console.log('🔍 Criando .print-header...');
            printHeader = document.createElement('div');
            printHeader.className = 'print-header';
            printHeader.style.display = 'block';
            printArea.prepend(printHeader);
          }
          
          // Criar o container do logo
          headerLogo = document.createElement('div');
          headerLogo.className = 'print-header-logo';
          headerLogo.style.display = 'block';
          printHeader.prepend(headerLogo);
        }
        
        if (headerLogo) {
          console.log('🔍 Criando logo de emergência no container existente');
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
          
          // Verificar se foi adicionado corretamente
          setTimeout(() => {
            const logoCheck = document.getElementById('print-logo-emergency');
            console.log('🔍 Verificação após criar logo:', logoCheck ? 'logo criado com sucesso' : 'falha ao criar logo');
          }, 0);
        }
      }
    }
    
    // Verificar também os containers
    const containers = [
      '.print-header-logo',
      '.print-header',
      '#print-area'
    ];
    
    containers.forEach(selector => {
      const container = document.querySelector(selector);
      if (container) {
        container.style.display = 'block';
        container.style.visibility = 'visible';
        container.style.opacity = '1';
      } else {
        console.log(`🔍 Container ${selector} não encontrado`);
      }
    });
    
    // Verificar o objeto fallback
    const logoObject = document.getElementById('print-logo-object');
    if (logoObject) {
      // Se a imagem principal falhar, mostrar o objeto
      const mainLogo = document.getElementById('print-logo');
      if (!mainLogo || mainLogo.naturalWidth === 0) {
        logoObject.style.display = 'block';
        if (mainLogo) mainLogo.style.display = 'none';
      }
    } else {
      console.log('🔍 Objeto SVG fallback não encontrado');
    }
    
    // Verificar o fallback de texto
    const logoText = document.getElementById('print-logo-text');
    if (logoText) {
      // Se tanto a imagem quanto o objeto falharem, mostrar o texto
      const mainLogo = document.getElementById('print-logo');
      const logoObject = document.getElementById('print-logo-object');
      
      if ((!mainLogo || mainLogo.naturalWidth === 0) && 
          (!logoObject || logoObject.offsetWidth === 0)) {
        logoText.style.display = 'block';
      }
    } else {
      console.log('🔍 Texto fallback não encontrado');
    }
    
    // Verificar novamente se encontramos os logos
    setTimeout(() => {
      depurarSeletores();
    }, 0);
  }
  
  // Executar correção inicialmente após carregamento com uma lógica de tentativas mais inteligente
  console.log('🔍 Agendando primeira tentativa logo após carregamento');
  setTimeout(garantirLogoVisivel, 800);
  
  // Adicionar outra tentativa após 2 segundos, se ainda não tivermos conseguido
  setTimeout(() => {
    if (tentativasRealizadas < MAX_TENTATIVAS && !estruturaDeEmergenciaCriada) {
      garantirLogoVisivel();
    }
  }, 2000);
  
  // Os logos de interface (não impressão) continuam com PNG
  const interfaceLogos = document.querySelectorAll('.logo:not(#print-logo), .splash-logo, .auth-logo');
  console.log('🔍 Logos de interface encontrados:', interfaceLogos.length);
  
  interfaceLogos.forEach(logo => {
    if (!logo.src.includes('LOGO 2.png')) {
      logo.src = 'LOGO 2.png';
    }
  });
  
  // Ajuste para garantir que o logo apareça durante a impressão
  window.addEventListener('beforeprint', function() {
    console.log('🔍 Evento beforeprint disparado');
    // Garantir que o logo esteja visível antes da impressão, forçando a execução
    garantirLogoVisivel(true);
  });
  
  // Verificação adicional ao carregar a página
  window.addEventListener('load', function() {
    console.log('🔍 Evento load disparado');
    // Verificar novamente após o carregamento completo da página
    setTimeout(() => garantirLogoVisivel(), 500);
  });
  
  // Também adiciona botão de diagnóstico temporário
  const btnImprimir = document.getElementById('btnImprimir');
  if (btnImprimir) {
    btnImprimir.addEventListener('click', function() {
      console.log('🔍 Botão de impressão clicado');
      garantirLogoVisivel(true);
    });
  } else {
    console.log('🔍 Botão de impressão não encontrado');
  }
  
  // Exportar função para uso global
  window.garantirLogoVisivel = garantirLogoVisivel;
  
  // Função de ajuda para verificar se o documento está pronto para impressão
  window.verificarProntidaoImpressao = function() {
    console.log('🔍 Verificação manual de prontidão para impressão');
    depurarSeletores();
    garantirLogoVisivel(true);
    return 'Verificação concluída';
  };
}); 