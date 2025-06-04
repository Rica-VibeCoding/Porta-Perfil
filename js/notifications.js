/**
 * Sistema de notificações
 */

// Criar container de notificações se não existir
function criarContainerNotificacoes() {
  let container = document.getElementById('notificacoes-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificacoes-container';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 320px;
    `;
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Mostra uma notificação na tela
 * @param {string} mensagem - Mensagem a ser exibida
 * @param {string} tipo - Tipo da notificação (success, error, warning, info)
 * @param {number} duracao - Duração da notificação em ms (padrão: 3000ms)
 */
function mostrarNotificacao(mensagem, tipo = 'success', duracao = 3000) {
  const container = criarContainerNotificacoes();
  
  // Mapear tipos para ícones e cores
  const tipoConfig = {
    success: {
      icone: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>',
      corFundo: '#dff9e3',
      corTexto: '#0f5724'
    },
    error: {
      icone: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/></svg>',
      corFundo: '#fee7e8',
      corTexto: '#b71c1c'
    },
    warning: {
      icone: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>',
      corFundo: '#fff6e3',
      corTexto: '#996500'
    },
    info: {
      icone: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>',
      corFundo: '#e4f4ff',
      corTexto: '#0a558c'
    }
  };
  
  // Adequar tipo para os tipos suportados
  if (!tipoConfig[tipo]) {
    tipo = tipo === 'sucesso' ? 'success' : tipo === 'erro' ? 'error' : tipo === 'aviso' ? 'warning' : 'info';
  }
  
  const config = tipoConfig[tipo];
  
  // Criar elemento de notificação
  const notificacao = document.createElement('div');
  notificacao.className = `notificacao ${tipo}`;
  notificacao.style.cssText = `
    background-color: ${config.corFundo};
    color: ${config.corTexto};
    padding: 12px 16px;
    margin-bottom: 10px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    min-width: 250px;
    max-width: 100%;
    font-size: 14px;
    transform: translateY(20px);
    opacity: 0;
    transition: all 0.3s ease;
    position: relative;
  `;
  
  // Adicionar conteúdo à notificação
  const iconeDiv = document.createElement('div');
  iconeDiv.style.cssText = `
    margin-right: 12px;
    display: flex;
    align-items: center;
  `;
  iconeDiv.innerHTML = config.icone;
  
  const textoDiv = document.createElement('div');
  textoDiv.style.cssText = `
    flex: 1;
  `;
  textoDiv.textContent = mensagem;
  
  const botaoFechar = document.createElement('button');
  botaoFechar.style.cssText = `
    background: transparent;
    border: none;
    color: ${config.corTexto};
    cursor: pointer;
    opacity: 0.7;
    padding: 0;
    margin-left: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
  `;
  botaoFechar.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  botaoFechar.onclick = () => fecharNotificacao(notificacao);
  
  // Montar a notificação
  notificacao.appendChild(iconeDiv);
  notificacao.appendChild(textoDiv);
  notificacao.appendChild(botaoFechar);
  
  // Adicionar barra de progresso para tempo
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    width: 100%;
    background-color: ${config.corTexto};
    opacity: 0.3;
    transform-origin: left;
  `;
  
  notificacao.appendChild(progressBar);
  
  // Adicionar ao container
  container.appendChild(notificacao);
  
  // Animar entrada
  setTimeout(() => {
    notificacao.style.transform = 'translateY(0)';
    notificacao.style.opacity = '1';
    
    // Animar a barra de progresso
    progressBar.style.transition = `width ${duracao}ms linear`;
    progressBar.style.width = '0';
  }, 10);
  
  // Configurar temporizador para remoção
  const timeoutId = setTimeout(() => {
    fecharNotificacao(notificacao);
  }, duracao);
  
  // Pausar temporizador ao passar o mouse
  notificacao.addEventListener('mouseenter', () => {
    clearTimeout(timeoutId);
    progressBar.style.transition = 'none';
  });
  
  // Retomar temporizador ao remover o mouse
  notificacao.addEventListener('mouseleave', () => {
    const novoTimeout = setTimeout(() => {
      fecharNotificacao(notificacao);
    }, 1000);
    
    progressBar.style.transition = 'width 1000ms linear';
    progressBar.style.width = '0';
  });
  
  return notificacao;
}

/**
 * Fecha uma notificação com animação
 * @param {HTMLElement} notificacao - Elemento de notificação a ser fechado
 */
function fecharNotificacao(notificacao) {
  notificacao.style.opacity = '0';
  notificacao.style.transform = 'translateY(20px)';
  
  setTimeout(() => {
    if (notificacao.parentNode) {
      notificacao.parentNode.removeChild(notificacao);
    }
  }, 300);
}

export {
  mostrarNotificacao
}; 