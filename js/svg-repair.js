/**
 * Sistema de reparo e diagnóstico para problemas de SVG
 * Este arquivo deve ser carregado de forma não modular para garantir disponibilidade imediata
 */

// Sistema de monitoramento e reparo do SVG
(function() {
  console.log('[SVG-REPAIR] Inicializando sistema de monitoramento SVG');
  
  // Tornar funções disponíveis globalmente
  window.svgRepair = {
    // Verifica se o SVG existe e é válido
    verificarSVG: function() {
      const desenho = document.getElementById('desenho');
      if (!desenho) {
        console.error('[SVG-REPAIR] Elemento #desenho não encontrado');
        return false;
      }
      
      const svg = desenho.querySelector('svg');
      if (!svg) {
        console.error('[SVG-REPAIR] SVG não encontrado dentro de #desenho');
        return false;
      }
      
      // Verificar se o SVG tem algum conteúdo
      const conteudo = svg.querySelectorAll('*');
      if (conteudo.length <= 1) {
        console.warn('[SVG-REPAIR] SVG existe mas está praticamente vazio');
        return false;
      }
      
      return true;
    },
    
    // Cria um SVG de emergência
    criarSVGEmergencia: function() {
      console.log('[SVG-REPAIR] Criando SVG de emergência');
      const desenho = document.getElementById('desenho');
      if (!desenho) {
        // Tentar encontrar ou criar o contêiner desenho
        const canvasContainer = document.querySelector('.canvas-container');
        if (canvasContainer) {
          const novoDesenho = document.createElement('div');
          novoDesenho.id = 'desenho';
          novoDesenho.style.width = '100%';
          novoDesenho.style.height = '100%';
          novoDesenho.style.minHeight = '600px';
          novoDesenho.style.position = 'relative';
          novoDesenho.style.zIndex = '20';
          novoDesenho.style.backgroundColor = 'white';
          canvasContainer.appendChild(novoDesenho);
          return this.criarSVGEmergencia(); // Chamar recursivamente
        } else {
          console.error('[SVG-REPAIR] Impossível encontrar ou criar contêiner do desenho');
          return false;
        }
      }
      
      // Limpar o contêiner
      desenho.innerHTML = '';
      
      // Criar um novo SVG
      try {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('id', 'svg-emergencia');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 800 1200');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.backgroundColor = '#FFFFFF';
        svg.style.display = 'block';
        svg.style.maxWidth = '100%';
        svg.style.maxHeight = 'calc(100vh - 40px)';
        svg.style.margin = '0 auto';
        
        // Criar retângulo de teste
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '50');
        rect.setAttribute('y', '50');
        rect.setAttribute('width', '200');
        rect.setAttribute('height', '100');
        rect.setAttribute('fill', 'red');
        rect.setAttribute('stroke', 'black');
        rect.setAttribute('stroke-width', '2');
        svg.appendChild(rect);
        
        // Criar círculo de teste
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '400');
        circle.setAttribute('cy', '100');
        circle.setAttribute('r', '50');
        circle.setAttribute('fill', 'blue');
        svg.appendChild(circle);
        
        // Criar texto explicativo
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '50');
        text.setAttribute('y', '200');
        text.setAttribute('font-size', '24');
        text.setAttribute('fill', 'black');
        text.textContent = 'SVG de emergência criado pelo sistema de reparo';
        svg.appendChild(text);
        
        // Adicionar o SVG ao contêiner
        desenho.appendChild(svg);
        console.log('[SVG-REPAIR] SVG de emergência criado com sucesso');
        
        // Definir a variável global svgContainer se possível
        if (typeof window.svgContainer === 'undefined') {
          window.svgContainer = svg;
          console.log('[SVG-REPAIR] Variável global svgContainer definida');
        }
        
        return true;
      } catch (error) {
        console.error('[SVG-REPAIR] Erro ao criar SVG de emergência:', error);
        
        // Último recurso - usar innerHTML
        try {
          desenho.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" id="svg-fallback" width="100%" height="100%" 
                 viewBox="0 0 800 1200" preserveAspectRatio="xMidYMid meet" 
                 style="background-color:#FFFFFF; display:block; max-width:100%; margin:0 auto;">
              <rect x="100" y="100" width="300" height="150" fill="red" stroke="black" stroke-width="2" />
              <text x="100" y="300" font-size="24" fill="black">
                SVG de emergência (fallback usando innerHTML)
              </text>
            </svg>
          `;
          console.log('[SVG-REPAIR] SVG criado via innerHTML como último recurso');
          
          // Tentar definir a variável global
          if (typeof window.svgContainer === 'undefined') {
            window.svgContainer = desenho.querySelector('svg');
          }
          
          return true;
        } catch (innerError) {
          console.error('[SVG-REPAIR] Falha total na criação do SVG:', innerError);
          return false;
        }
      }
    },
    
    // Tenta reparar o SVG se necessário
    reparar: function() {
      if (!this.verificarSVG()) {
        console.warn('[SVG-REPAIR] SVG inválido ou não encontrado, tentando reparar');
        return this.criarSVGEmergencia();
      }
      console.log('[SVG-REPAIR] SVG está ok, não é necessário reparo');
      return true;
    },
    
    // Força a recriação do SVG independentemente do estado atual
    forcarRecriacao: function() {
      console.log('[SVG-REPAIR] Forçando recriação do SVG');
      return this.criarSVGEmergencia();
    },
    
    // Diagnóstico completo
    diagnosticar: function() {
      const desenho = document.getElementById('desenho');
      const svg = desenho ? desenho.querySelector('svg') : null;
      
      console.log('[SVG-REPAIR] DIAGNÓSTICO DO SVG:');
      console.log('- Elemento #desenho encontrado:', !!desenho);
      console.log('- SVG encontrado:', !!svg);
      
      if (svg) {
        console.log('- Atributos do SVG:');
        console.log('  * width:', svg.getAttribute('width'));
        console.log('  * height:', svg.getAttribute('height'));
        console.log('  * viewBox:', svg.getAttribute('viewBox'));
        console.log('- Estilos do SVG:');
        console.log('  * display:', svg.style.display);
        console.log('  * visibility:', svg.style.visibility);
        console.log('  * background-color:', svg.style.backgroundColor);
        console.log('- Número de elementos filhos:', svg.childElementCount);
        console.log('- Elementos filhos:', Array.from(svg.children).map(el => el.tagName));
      }
      
      return {
        desenhoExiste: !!desenho,
        svgExiste: !!svg,
        childCount: svg ? svg.childElementCount : 0,
        viewBox: svg ? svg.getAttribute('viewBox') : null,
        display: svg ? svg.style.display : null,
        svgValido: this.verificarSVG()
      };
    }
  };
  
  // Iniciar verificação automática quando o DOM estiver carregado
  document.addEventListener('DOMContentLoaded', function() {
    console.log('[SVG-REPAIR] DOM carregado, verificando SVG');
    
    // Verificar imediatamente
    if (!window.svgRepair.verificarSVG()) {
      console.warn('[SVG-REPAIR] SVG não encontrado no carregamento inicial, tentando criar');
      window.svgRepair.criarSVGEmergencia();
    }
    
    // Verificar novamente após um tempo para garantir que o SVG não foi substituído
    setTimeout(function() {
      if (!window.svgRepair.verificarSVG()) {
        console.warn('[SVG-REPAIR] SVG ainda não válido após 500ms, tentando reparar novamente');
        window.svgRepair.reparar();
      }
    }, 500);
    
    // Verificação final após carregamento de todos os scripts
    setTimeout(function() {
      if (!window.svgRepair.verificarSVG()) {
        console.error('[SVG-REPAIR] SVG continua inválido após 2s, fazendo reparo final');
        window.svgRepair.forcarRecriacao();
        
        // Diagnosticar o problema
        window.svgRepair.diagnosticar();
      }
    }, 2000);
  });
})();

// Expor uma função global de reparação
window.repararSVGVisivel = function() {
  if (window.svgRepair) {
    return window.svgRepair.reparar();
  }
  return false;
}; 