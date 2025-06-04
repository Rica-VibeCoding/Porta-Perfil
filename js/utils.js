// Funções utilitárias

/**
 * Atualiza o título baseado no parceiro selecionado
 */
function atualizarTitulo() {
  const parceiro = document.getElementById('parceiroInput').value || 'Selecione';
  const titulo = document.getElementById('parceiro-nome');
  
  if (titulo) {
    titulo.textContent = parceiro || 'Selecione';
  }
}

/**
 * Exibe uma notificação na tela
 * @param {string} mensagem - Mensagem a ser exibida
 * @param {string} tipo - Tipo da notificação (success, error, warning, info)
 */
function mostrarNotificacao(mensagem, tipo = 'info') {
  const notificacaoEl = document.getElementById('notificacao');
  if (!notificacaoEl) {
    console.error('Elemento de notificação não encontrado');
    alert(mensagem);
    return;
  }
  
  // Limpar notificações anteriores
  clearTimeout(window.notificacaoTimeout);
  
  // Definir classe de acordo com o tipo
  notificacaoEl.className = 'notificacao';
  notificacaoEl.classList.add(`notificacao-${tipo}`);
  
  // Definir texto
  notificacaoEl.textContent = mensagem;
  
  // Mostrar notificação
  notificacaoEl.classList.add('mostrar');
  
  // Esconder automaticamente após 5 segundos
  window.notificacaoTimeout = setTimeout(() => {
    notificacaoEl.classList.remove('mostrar');
  }, 5000);
}

/**
 * Configura a validação de campos de formulário
 */
function configurarValidacao() {
  // Seleciona todos os campos numéricos
  const camposNumericos = document.querySelectorAll('input[type="number"], input[data-tipo="numero"]');
  
  // Para cada campo, adiciona listeners de validação
  camposNumericos.forEach(campo => {
    const minimo = parseInt(campo.getAttribute('min') || '0', 10);
    const maximo = parseInt(campo.getAttribute('max') || '999999', 10);
    const step = parseFloat(campo.getAttribute('step') || '1');
    
    // Adicionar eventos para validar ao sair do campo ou ao mudar valor
    campo.addEventListener('blur', () => validarCampoNumerico(campo, minimo, maximo, step));
    campo.addEventListener('change', () => validarCampoNumerico(campo, minimo, maximo, step));
  });
}

/**
 * Valida um campo numérico
 * @param {HTMLElement} campo - Campo a ser validado
 * @param {number} minimo - Valor mínimo permitido
 * @param {number} maximo - Valor máximo permitido
 * @param {number} step - Incremento permitido
 */
function validarCampoNumerico(campo, minimo, maximo, step) {
  const valor = parseFloat(campo.value.replace(',', '.'));
  
  // Verificar se é um número válido
  if (isNaN(valor)) {
    mostrarErroValidacao(campo, `Por favor, insira um número válido`);
    campo.value = minimo;
    return;
  }
  
  // Validar mínimo e máximo
  if (valor < minimo) {
    mostrarErroValidacao(campo, `O valor mínimo é ${minimo}`);
    campo.value = minimo;
    return;
  }
  
  if (valor > maximo) {
    mostrarErroValidacao(campo, `O valor máximo é ${maximo}`);
    campo.value = maximo;
    return;
  }
  
  // Para campos com step, garantir que o valor esteja em um incremento válido
  if (step !== 1) {
    const resto = (valor - minimo) % step;
    if (resto !== 0) {
      const valorAjustado = Math.round((valor - minimo) / step) * step + minimo;
      mostrarErroValidacao(campo, `O valor deve ser um múltiplo de ${step}`);
      campo.value = valorAjustado;
      return;
    }
  }
  
  // Se chegou aqui, o campo é válido
  removerErroValidacao(campo);
}

/**
 * Mostra mensagem de erro de validação para um campo
 * @param {HTMLElement} campo - Campo com erro
 * @param {string} mensagem - Mensagem de erro
 */
function mostrarErroValidacao(campo, mensagem) {
  // Remover mensagem anterior se existir
  removerErroValidacao(campo);
  
  // Adicionar classe de erro ao campo
  campo.classList.add('campo-invalido');
  
  // Verificar se existe uma div de erro Bootstrap (invalid-feedback)
  if (campo.id) {
    const bootstrapErrorDiv = document.getElementById(`${campo.id}Error`);
    if (bootstrapErrorDiv) {
      bootstrapErrorDiv.textContent = mensagem;
      bootstrapErrorDiv.style.display = 'block';
      campo.classList.add('invalid'); // Classe usada pelo Bootstrap para ativar feedback
      return; // Se encontrou e atualizou a div de erro do Bootstrap, não precisa criar novo elemento
    }
  }
  
  // Criar elemento de mensagem personalizado se não existir div de erro Bootstrap
  const msgEl = document.createElement('div');
  msgEl.className = 'msg-erro';
  msgEl.textContent = mensagem;
  
  // Inserir mensagem após o campo
  campo.parentNode.insertBefore(msgEl, campo.nextSibling);
  
  // Mostrar notificação também
  mostrarNotificacao(mensagem, 'warning');
}

/**
 * Remove mensagem de erro de validação
 * @param {HTMLElement} campo - Campo a ser limpo
 */
function removerErroValidacao(campo) {
  // Remover classes de erro
  campo.classList.remove('campo-invalido');
  campo.classList.remove('invalid');
  
  // Verificar se existe uma div de erro Bootstrap
  if (campo.id) {
    const bootstrapErrorDiv = document.getElementById(`${campo.id}Error`);
    if (bootstrapErrorDiv) {
      bootstrapErrorDiv.style.display = 'none';
    }
  }
  
  // Buscar e remover mensagem de erro personalizada
  const msgErro = campo.parentNode.querySelector('.msg-erro');
  if (msgErro) {
    msgErro.parentNode.removeChild(msgErro);
  }
}

/**
 * Formata data no padrão brasileiro
 * @param {Date} data - Data a ser formatada
 * @returns {string} Data formatada
 */
function formatarDataBr(data = new Date()) {
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Módulo de utilidades - Funções auxiliares genéricas
 */

/**
 * Formata um número como uma dimensão em milímetros
 * @param {number} valor - Valor a formatar
 * @returns {string} - Valor formatado
 */
function formatarDimensao(valor) {
  return `${valor} mm`;
}

/**
 * Formata uma data incluindo hora para uso em impressões
 * @param {Date|string} data - Data a formatar
 * @param {boolean} incluirHora - Se deve incluir a hora
 * @returns {string} - Data formatada
 */
function formatarData(data, incluirHora = false) {
  if (typeof data === 'string') {
    data = new Date(data);
  }
  
  if (!data || isNaN(data.getTime())) {
    data = new Date();
  }
  
  if (incluirHora) {
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } else {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

/**
 * Gera um ID único para identificar elementos
 * @returns {string} - ID único
 */
function gerarId() {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formata um preço para o formato brasileiro
 * @param {number} valor - Valor a formatar
 * @returns {string} - Valor formatado
 */
function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  });
}

/**
 * Trunca um texto longo e adiciona reticências
 * @param {string} texto - Texto a truncar
 * @param {number} tamanhoMaximo - Tamanho máximo
 * @returns {string} - Texto truncado
 */
function truncarTexto(texto, tamanhoMaximo) {
  if (!texto || texto.length <= tamanhoMaximo) {
    return texto;
  }
    
  return texto.substring(0, tamanhoMaximo - 3) + '...';
}

/**
 * Converte RGB para Hexadecimal
 * @param {number} r - Vermelho (0-255)
 * @param {number} g - Verde (0-255)
 * @param {number} b - Azul (0-255)
 * @returns {string} - Cor em formato hexadecimal
 */
function rgbParaHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Verifica se um arquivo é uma imagem
 * @param {File} arquivo - Arquivo a verificar
 * @returns {boolean} - Se é uma imagem
 */
function eImagem(arquivo) {
  return arquivo && arquivo.type.startsWith('image/');
}

/**
 * Debounce para otimizar eventos frequentes
 * @param {Function} funcao - Função a ser executada
 * @param {number} tempoDespera - Tempo de espera em ms
 * @returns {Function} - Função com debounce
 */
function debounce(funcao, tempoDespera = 300) {
  let timeout;
    
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      funcao.apply(this, args);
    }, tempoDespera);
  };
}

/**
 * Copia texto para a área de transferência
 * @param {string} texto - Texto a copiar
 * @returns {Promise<boolean>} - Se foi copiado com sucesso
 */
async function copiarParaAreaDeTransferencia(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  }
  catch (e) {
    console.error('Erro ao copiar texto:', e);
    return false;
  }
}

/**
 * Converte uma string para formatação de título (Title Case)
 * @param {string} texto - Texto a ser formatado
 * @returns {string} Texto formatado
 */
function formatarTitulo(texto) {
  if (!texto) {
    return '';
  }
  
  return texto
    .toLowerCase()
    .split(' ')
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ');
}

// Exportar todas as funções necessárias em um único bloco
export {
  atualizarTitulo,
  configurarValidacao,
  formatarDataBr,
  formatarDimensao,
  formatarData,
  gerarId,
  formatarPreco,
  truncarTexto,
  rgbParaHex,
  eImagem,
  debounce,
  copiarParaAreaDeTransferencia,
  formatarTitulo
};

// Exportar funções de validação para o escopo global
window.validarCampoNumerico = validarCampoNumerico;
window.mostrarErroValidacao = mostrarErroValidacao;
window.removerErroValidacao = removerErroValidacao;
window.configurarValidacao = configurarValidacao; 