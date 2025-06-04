/**
 * Modal Draggable
 * Permite arrastar modais pelo cabeçalho
 * Sistema de Portas e Perfis
 */

// Função para inicializar os modais arrastáveis
function inicializarModaisDraggable() {
  console.log('Inicializando modais arrastáveis...');
  
  // Selecionar todos os modais com a classe modal-draggable
  const modais = document.querySelectorAll('.modal-draggable');
  
  modais.forEach(modal => {
    // Encontrar o header do modal
    const modalHeader = modal.querySelector('.modal-header');
    const modalDialog = modal.querySelector('.modal-dialog');
    
    if (!modalHeader || !modalDialog) return;
    
    // Adicionar cursor de "mover" ao header
    modalHeader.style.cursor = 'move';
    
    // Variáveis para controlar a posição
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    
    // Handler para iniciar o arrasto
    modalHeader.addEventListener('mousedown', startDrag);
    
    // Handler para parar o arrasto
    document.addEventListener('mouseup', stopDrag);
    
    // Handler para mover o modal
    document.addEventListener('mousemove', drag);
    
    // Função para iniciar o arrasto
    function startDrag(e) {
      isDragging = true;
      
      // Obter posição inicial do mouse
      startX = e.clientX;
      startY = e.clientY;
      
      // Obter posição inicial do modal
      const rect = modalDialog.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      
      // Adicionar uma classe para indicar que está sendo arrastado
      modalDialog.classList.add('dragging');
      
      // Prevenir seleção de texto durante o arrasto
      e.preventDefault();
    }
    
    // Função para parar o arrasto
    function stopDrag() {
      if (!isDragging) return;
      
      isDragging = false;
      modalDialog.classList.remove('dragging');
    }
    
    // Função para mover o modal
    function drag(e) {
      if (!isDragging) return;
      
      // Calcular a distância movida
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // Atualizar a posição do modal
      modalDialog.style.position = 'fixed';
      modalDialog.style.margin = '0';
      modalDialog.style.left = `${initialLeft + deltaX}px`;
      modalDialog.style.top = `${initialTop + deltaY}px`;
    }
  });
  
  console.log('Modais arrastáveis inicializados');
  
  // Adicionar estilo CSS para os modais arrastáveis
  adicionarEstiloModaisDraggable();
}

// Função para adicionar o estilo CSS necessário
function adicionarEstiloModaisDraggable() {
  // Verificar se o estilo já existe
  if (document.getElementById('modal-draggable-style')) return;
  
  // Criar elemento de estilo
  const style = document.createElement('style');
  style.id = 'modal-draggable-style';
  
  // Definir o CSS
  style.innerHTML = `
    .modal-draggable .modal-dialog.dragging {
      transition: none !important;
      user-select: none;
    }
    
    .modal-draggable .modal-header {
      cursor: move;
    }
  `;
  
  // Adicionar ao head
  document.head.appendChild(style);
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Aguardar um momento para garantir que os modais foram criados
  setTimeout(inicializarModaisDraggable, 500);
});

// Exportar função para uso em outros módulos
export { inicializarModaisDraggable }; 