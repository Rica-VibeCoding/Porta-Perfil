// Funções de manipulação de formulários

import { atualizarConfiguracao, obterConfiguracaoAtual } from './initialize.js';
import { atualizarDesenho } from './drawing.js';
import { mostrarNotificacao } from './notifications.js';

/**
 * Atualiza os campos de dobradiças baseado no número selecionado
 * Esta função agora redireciona para a implementação principal em ui-controls.js
 */
function updateDobradicaInputs() {
  // Obter número atual de dobradiças
  const num = parseInt(document.getElementById('numDobradicasInput').value) || 0;
  
  // Usar a implementação unificada em ui-controls.js
  if (typeof window.atualizarCamposPosicoesDobradicasQtd === 'function') {
    window.atualizarCamposPosicoesDobradicasQtd(num);
  }
  else {
    console.warn('Função atualizarCamposPosicoesDobradicasQtd não disponível - tentando aguardar carregamento...');
    
    // Implementar retry com múltiplas tentativas
    let tentativas = 0;
    const maxTentativas = 10;
    
    const tentarNovamente = () => {
      tentativas++;
      
      if (typeof window.atualizarCamposPosicoesDobradicasQtd === 'function') {
        console.log(`Função encontrada após ${tentativas} tentativa(s) - executando...`);
        window.atualizarCamposPosicoesDobradicasQtd(num);
        return;
      }
      
      if (tentativas < maxTentativas) {
        // Aumentar progressivamente o delay
        const delay = Math.min(50 * tentativas, 500);
        setTimeout(tentarNovamente, delay);
      } else {
        console.error('Função atualizarCamposPosicoesDobradicasQtd ainda não disponível após ' + maxTentativas + ' tentativas');
        // Implementação de fallback básica
        updateDobradicaInputsFallback(num);
      }
    };
    
    tentarNovamente();
  }
}

/**
 * Função de fallback simples para atualizar campos de dobradiças
 * Usada quando a função principal não está disponível
 */
function updateDobradicaInputsFallback(num) {
  console.log('Executando fallback para atualização de dobradiças');
  
  const container = document.getElementById('dobradicasCampos');
  if (!container) {
    console.warn('Container de dobradiças não encontrado no fallback');
    return;
  }
  
  // Limpar container
  container.innerHTML = '';
  
  if (num <= 0) {
    return;
  }
  
  // Criar campos simples
  for (let i = 0; i < num; i++) {
    const div = document.createElement('div');
    div.className = 'input-group mb-2';
    
    const label = document.createElement('span');
    label.className = 'input-group-text';
    label.innerText = `${i+1} Dob:`;
    label.style.width = '65px';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'form-control';
    input.id = `dobradicaPos${i+1}`;
    input.value = 100 + (i * 200); // Posições simples
    input.min = '0';
    input.max = '3000';
    
    div.appendChild(label);
    div.appendChild(input);
    container.appendChild(div);
  }
}

/**
 * Coleta todos os dados do formulário
 * @returns {Object} Dados do formulário
 */
function coletarDadosFormulario() {
  const descricao = document.getElementById('descricaoInput')?.value || '';
  const largura = parseFloat(document.getElementById('larguraInput')?.value) || 700;
  const altura = parseFloat(document.getElementById('alturaInput')?.value) || 2100;
  const quantidade = parseInt(document.getElementById('quantidadeInput')?.value) || 1;
  const vidroTipo = document.getElementById('vidroTipo')?.value || 'Incolor';
  const perfilModelo = document.getElementById('perfilModelo')?.value || 'RM-114';
  const perfilCor = document.getElementById('perfilCor')?.value || 'Preto';
  const funcaoPorta = document.getElementById('funcaoPorta')?.value || 'superiorDireita';
  const modeloDeslizante = document.getElementById('modeloDeslizante')?.value || 'RO-654025';
  const numDobradicas = parseInt(document.getElementById('numDobradicasInput')?.value) || 3;
  const puxadorMedida = document.getElementById('puxadorMedida')?.value;
  const puxadorModelo = document.getElementById('puxadorModelo')?.value;
  const puxadorPosicao = document.getElementById('puxadorPosicao')?.value;
  const puxadorCotaSuperior = parseInt(document.getElementById('puxadorCotaSuperior')?.value || '950', 10);
  const puxadorCotaInferior = parseInt(document.getElementById('puxadorCotaInferior')?.value || '1000', 10);
  const puxadorLados = document.getElementById('puxadorLados')?.value;
  const observacao = document.getElementById('observacaoInput')?.value || '';

  // Dobradiças
  const dobradicas = [];
  for (let i = 1; i <= numDobradicas; i++) {
    const val = parseFloat(document.getElementById(`dobradicaPos${i}`)?.value);
    if (!isNaN(val)) {
      dobradicas.push(val);
    }
    else {
      dobradicas.push(-1);
    }
  }

  let puxadorMedVal;
  if (puxadorMedida === 'Tamanho da Porta') {
    if (puxadorPosicao === 'vertical') {
      puxadorMedVal = altura;
    }
    else {
      puxadorMedVal = largura;
    }
  }
  else {
    puxadorMedVal = parseFloat(puxadorMedida);
  }

  return {
    descricao, largura, altura, quantidade,
    vidroTipo, perfilModelo, perfilCor, funcaoPorta,
    modeloDeslizante, numDobradicas, dobradicas,
    puxadorModelo, puxadorMedVal, puxadorPosicao,
    puxadorCotaSuperior, puxadorCotaInferior, puxadorLados,
    observacao
  };
}

/**
 * Módulo de manipulação de formulários e campos de entrada
 */
function inicializarFormularios() {
  // Inicializar campos básicos
  inicializarCamposGerais();
    
  // Inicializar campos de medidas
  inicializarCamposMedidas();
    
  // Inicializar campos de materiais
  inicializarCamposMateriais();
    
  // Inicializar campos de dobradiças
  inicializarCamposDobradicasEPuxador();
    
  // Configurar validação
  configurarValidacao();
    
  // Configurar listeners para accordion
  configurarListenersAccordion();
}

/**
 * Inicializa campos gerais do formulário
 */
function inicializarCamposGerais() {
  // Obter referencias
  const parceiroInput = document.getElementById('parceiroInput');
  const descricaoInput = document.getElementById('descricaoInput');
  const quantidadeInput = document.getElementById('quantidadeInput');
  const observacaoInput = document.getElementById('observacaoInput');
    
  // Referências ao título da página
  const parceiroNome = document.getElementById('parceiro-nome');
  const tituloPedidoImpressao = document.getElementById('tituloPedidoImpressao');
  const descricaoPedidoImpressao = document.getElementById('descricaoPedidoImpressao');
    
  // Configurar listener para parceiro
  if (parceiroInput) {
    parceiroInput.addEventListener('change', () => {
      // Atualizar títulos
      if (parceiroNome) {
        parceiroNome.textContent = parceiroInput.value || 'Selecione';
      }
      if (tituloPedidoImpressao) {
        tituloPedidoImpressao.textContent = `Pedido | ${parceiroInput.value || 'Selecione'}`;
      }
            
      // Atualizar configuração
      atualizarConfiguracao({
        parceiro: parceiroInput.value
      });
            
      // Atualizar desenho
      atualizarDesenho();
    });
  }
    
  // Configurar listener para descrição
  if (descricaoInput) {
    descricaoInput.addEventListener('input', () => {
      // Atualizar descrição na impressão
      if (descricaoPedidoImpressao) {
        descricaoPedidoImpressao.textContent = descricaoInput.value;
      }
            
      // Atualizar configuração
      atualizarConfiguracao({
        descricao: descricaoInput.value
      });
            
      // Atualizar desenho
      atualizarDesenho();
    });
  }
    
  // Configurar listener para quantidade
  if (quantidadeInput) {
    quantidadeInput.addEventListener('change', () => {
      // Validar quantidade
      const quantidade = parseInt(quantidadeInput.value);
      if (quantidade < 1) {
        quantidadeInput.value = 1;
      }
      if (quantidade > 100) {
        quantidadeInput.value = 100;
      }
            
      // Atualizar configuração
      atualizarConfiguracao({
        quantidade: parseInt(quantidadeInput.value)
      });
            
      // Atualizar desenho
      atualizarDesenho();
    });
  }
    
  // Configurar listener para observação
  if (observacaoInput) {
    observacaoInput.addEventListener('input', () => {
      // Atualizar configuração
      atualizarConfiguracao({
        observacao: observacaoInput.value
      });
            
      // Atualizar desenho
      atualizarDesenho();
    });
  }
}

/**
 * Inicializa campos de medidas
 */
function inicializarCamposMedidas() {
  // Obter referências
  const larguraInput = document.getElementById('larguraInput');
  const alturaInput = document.getElementById('alturaInput');
  const quantidadeInput = document.getElementById('quantidadeInput');
    
  // Configurar listener para largura
  if (larguraInput) {
    larguraInput.addEventListener('change', () => {
      // Se a função global handleLarguraChange estiver disponível, usá-la
      if (typeof window.handleLarguraChange === 'function') {
        window.handleLarguraChange();
      } else {
        // Validar largura
        const largura = parseInt(larguraInput.value);
        if (largura < 200) {
          larguraInput.value = 200;
          mostrarValidacaoErro('larguraInput', 'Largura mínima: 200mm');
        }
        else if (largura > 1500) {
          larguraInput.value = 1500;
          mostrarValidacaoErro('larguraInput', 'Largura máxima: 1500mm');
        }
        else {
          esconderValidacaoErro('larguraInput');
        }
              
        // Atualizar configuração
        atualizarConfiguracao({
          largura: parseInt(larguraInput.value)
        });
              
        // Atualizar desenho
        atualizarDesenho();
      }
    });
    
    // Adicionar listener para Enter
    larguraInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        // Chama o handler global para garantir atualização correta de dobradiças e desenho
        if (typeof window.handleLarguraChange === 'function') {
          window.handleLarguraChange();
        } else {
          // Fallback: lógica antiga
          const largura = parseInt(larguraInput.value);
          if (!isNaN(largura)) {
            if (largura < 200) {
              larguraInput.value = 200;
              mostrarValidacaoErro('larguraInput', 'Largura mínima: 200mm');
            } else if (largura > 1500) {
              larguraInput.value = 1500;
              mostrarValidacaoErro('larguraInput', 'Largura máxima: 1500mm');
            } else {
              esconderValidacaoErro('larguraInput');
            }
            atualizarConfiguracao({ largura: parseInt(larguraInput.value) });
            atualizarDesenho();
          }
        }
        event.preventDefault();
      }
    });

    // Adicionar listener para quando o campo perde o foco
    larguraInput.addEventListener('blur', () => {
      // Aqui também usar a função global se disponível
      if (typeof window.handleLarguraChange === 'function') {
        window.handleLarguraChange();
      } else {
        const largura = parseInt(larguraInput.value);
        if (!isNaN(largura)) {
          // Validar largura
          if (largura < 200) {
            larguraInput.value = 200;
            mostrarValidacaoErro('larguraInput', 'Largura mínima: 200mm');
          }
          else if (largura > 1500) {
            larguraInput.value = 1500;
            mostrarValidacaoErro('larguraInput', 'Largura máxima: 1500mm');
          }
          else {
            esconderValidacaoErro('larguraInput');
          }
                
          // Atualizar configuração
          atualizarConfiguracao({
            largura: parseInt(larguraInput.value)
          });
                
          // Atualizar desenho
          atualizarDesenho();
        }
      }
    });
  }
    
  // Configurar listener para altura
  if (alturaInput) {
    alturaInput.addEventListener('change', () => {
      // Se a função global handleAlturaChange estiver disponível, usá-la
      if (typeof window.handleAlturaChange === 'function') {
        window.handleAlturaChange();
      } else {
        // Validar altura
        const altura = parseInt(alturaInput.value);
        if (altura < 200) {
          alturaInput.value = 200;
          mostrarValidacaoErro('alturaInput', 'Altura mínima: 200mm');
        }
        else if (altura > 3000) {
          alturaInput.value = 3000;
          mostrarValidacaoErro('alturaInput', 'Altura máxima: 3000mm');
        }
        else {
          esconderValidacaoErro('alturaInput');
        }
            
        // Atualizar configuração
        atualizarConfiguracao({
          altura: parseInt(alturaInput.value)
        });
            
        // Atualizar desenho
        atualizarDesenho();
      }
    });
        
    // Adicionar listener para Enter
    alturaInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        // Usar a função global se disponível
        if (typeof window.handleAlturaChange === 'function') {
          window.handleAlturaChange();
        } else if (typeof window.handleAlturaKeydown === 'function') {
          window.handleAlturaKeydown(event);
        } else {
          // Fallback: lógica antiga
          const altura = parseInt(alturaInput.value);
          if (!isNaN(altura)) {
            if (altura < 200) {
              alturaInput.value = 200;
              mostrarValidacaoErro('alturaInput', 'Altura mínima: 200mm');
            } else if (altura > 3000) {
              alturaInput.value = 3000;
              mostrarValidacaoErro('alturaInput', 'Altura máxima: 3000mm');
            } else {
              esconderValidacaoErro('alturaInput');
            }
            atualizarConfiguracao({ altura: parseInt(alturaInput.value) });
            atualizarDesenho();
          }
        }
        event.preventDefault();
      }
    });
        
    // Adicionar listener para quando o campo perde o foco
    alturaInput.addEventListener('blur', () => {
      // Usar a função global se disponível
      if (typeof window.handleAlturaChange === 'function') {
        window.handleAlturaChange();
      } else {
        const altura = parseInt(alturaInput.value);
        if (!isNaN(altura)) {
          // Validar altura
          if (altura < 200) {
            alturaInput.value = 200;
            mostrarValidacaoErro('alturaInput', 'Altura mínima: 200mm');
          }
          else if (altura > 3000) {
            alturaInput.value = 3000;
            mostrarValidacaoErro('alturaInput', 'Altura máxima: 3000mm');
          }
          else {
            esconderValidacaoErro('alturaInput');
          }
              
          // Atualizar configuração
          atualizarConfiguracao({
            altura: parseInt(alturaInput.value)
          });
              
          // Atualizar desenho
          atualizarDesenho();
        }
      }
    });
  }
}

/**
 * Inicializa campos de materiais
 */
function inicializarCamposMateriais() {
  // Obter referências
  const vidroTipo = document.getElementById('vidroTipo');
  const perfilModelo = document.getElementById('perfilModelo');
  const perfilCor = document.getElementById('perfilCor');
    
  // Configurar listeners para materiais
  const camposMateriais = [vidroTipo, perfilModelo, perfilCor];
    
  camposMateriais.forEach(campo => {
    if (campo) {
      campo.addEventListener('change', () => {
        const atualizacao = {};
        atualizacao[campo.id] = campo.value;
                
        // Atualizar configuração
        atualizarConfiguracao(atualizacao);
                
        // Atualizar desenho
        atualizarDesenho();
      });
    }
  });
}

/**
 * Inicializa campos de dobradiças e puxador
 */
function inicializarCamposDobradicasEPuxador() {
  // Obter referência ao campo de número de dobradiças
  const numDobradicasInput = document.getElementById('numDobradicasInput');
    
  if (numDobradicasInput) {
    // Configurar estado inicial usando a função unificada
    if (typeof window.atualizarCamposPosicoesDobradicasQtd === 'function') {
      const num = parseInt(numDobradicasInput.value, 10) || 0;
      window.atualizarCamposPosicoesDobradicasQtd(num);
    }
    else {
      // Usar a função local que agora é apenas um wrapper
      updateDobradicaInputs();
    }
        
    // Configurar listener para número de dobradiças
    numDobradicasInput.addEventListener('change', () => {
      // Obter nova configuração de número de dobradiças
      const novoNumDobradicas = parseInt(numDobradicasInput.value, 10) || 0;
            
      // Atualizar a configuração
      atualizarConfiguracao({
        numDobradicas: novoNumDobradicas
      });
            
      // Usar função principal para atualizar os campos
      if (typeof window.atualizarCamposPosicoesDobradicasQtd === 'function') {
        window.atualizarCamposPosicoesDobradicasQtd(novoNumDobradicas);
      }
      else {
        // Fallback para wrapper local
        updateDobradicaInputs();
      }
            
      // Atualizar desenho
      atualizarDesenho();
    });
  }
}

/**
 * Configura validação de campos no formulário
 */
function configurarValidacao() {
  // Funções para validar inputs numéricos
  const inputsNumericos = document.querySelectorAll('input[type="number"]');
    
  inputsNumericos.forEach(input => {
    input.addEventListener('input', () => {
      // Limitar a apenas números
      input.value = input.value.replace(/[^\d]/g, '');
    });
  });
}

/**
 * Mostra mensagem de erro de validação
 * @param {string} inputId - ID do input
 * @param {string} mensagem - Mensagem de erro
 */
function mostrarValidacaoErro(inputId, mensagem) {
  const input = document.getElementById(inputId);
    
  if (input) {
    // Utilizar a função unificada de utils.js
    if (typeof window.mostrarErroValidacao === 'function') {
      window.mostrarErroValidacao(input, mensagem);
    }
    else {
      // Fallback para o comportamento original se a função global não existir
      const errorDiv = document.getElementById(`${inputId}Error`);
      if (errorDiv) {
        input.classList.add('invalid');
        errorDiv.textContent = mensagem;
        errorDiv.style.display = 'block';
      }
    }
  }
}

/**
 * Esconde mensagem de erro de validação
 * @param {string} inputId - ID do input
 */
function esconderValidacaoErro(inputId) {
  const input = document.getElementById(inputId);
    
  if (input) {
    // Utilizar a função unificada de utils.js
    if (typeof window.removerErroValidacao === 'function') {
      window.removerErroValidacao(input);
    }
    else {
      // Fallback para o comportamento original se a função global não existir
      const errorDiv = document.getElementById(`${inputId}Error`);
      if (input && errorDiv) {
        input.classList.remove('invalid');
        errorDiv.style.display = 'none';
      }
    }
  }
}

/**
 * Função auxiliar para atualizar a altura e recalcular todas as dobradiças
 * Esta função é chamada diretamente pelos eventos input, change e keydown
 * @param {number} novaAltura - Nova altura em mm
 */
function atualizarAlturaERecalcularDobradicasImediatamente(novaAltura) {
  // Garantir que o valor seja um número válido
  novaAltura = parseInt(novaAltura, 10);
  if (isNaN(novaAltura)) {
    return;
  }
    
  console.log('Atualizando altura para ' + novaAltura + 'mm e recalculando dobradiças');
    
  // Pegar altura antiga antes de atualizar
  const configAtual = obterConfiguracaoAtual();
  const alturaAntiga = configAtual.altura;
  
  // Determinar o número de dobradiças com base na altura
  let numDobradicas;
  if (novaAltura >= 200 && novaAltura <= 900) {
    numDobradicas = 2;
  } else if (novaAltura > 900 && novaAltura <= 1500) {
    numDobradicas = 3;
  } else if (novaAltura > 1500 && novaAltura <= 2600) {
    numDobradicas = 4;
  } else if (novaAltura > 2600 && novaAltura <= 3000) {
    numDobradicas = 5;
  } else {
    // Para alturas fora dos intervalos definidos, usar a regra padrão
    numDobradicas = 2;
  }
  
  console.log(`Altura: ${novaAltura}mm - Definindo ${numDobradicas} dobradiças`);
  
  // Atualizar o campo de seleção de dobradiças na interface
  const numDobradicasInput = document.getElementById('numDobradicasInput');
  if (numDobradicasInput) {
    numDobradicasInput.value = numDobradicas.toString();
  }
    
  // Atualizar configuração com nova altura e número de dobradiças, mas SEM redesenhar ainda
  // Modificamos a configuração diretamente para evitar o redesenho automático
  configAtual.altura = novaAltura;
  configAtual.numDobradicas = numDobradicas;
    
  // Recalcular posições das dobradiças
  if (typeof window.calcularPosicaoDefaultDobradica === 'function') {
    // Calcular as novas posições
    const novasPosicoes = window.calcularPosicaoDefaultDobradica(numDobradicas, novaAltura);
          
    if (novasPosicoes && novasPosicoes.length > 0) {
      console.log('Novas posições de dobradiças calculadas:', novasPosicoes);
              
      // Atualizar a configuração diretamente com as novas posições
      configAtual.dobradicas = [...novasPosicoes];
              
      // Atualizar os campos de dobradiças no formulário
      for (let i = 0; i < numDobradicas; i++) {
        const inputField = document.getElementById(`dobradicaPos${i+1}`);
        if (inputField) {
          console.log(`Atualizando campo dobradicaPos${i+1} para ${novasPosicoes[i]}`);
          inputField.value = novasPosicoes[i];
        }
      }
      
      // Atualizar o container de campos de dobradiças
      if (typeof window.atualizarCamposPosicoesDobradicasQtd === 'function') {
        window.atualizarCamposPosicoesDobradicasQtd(numDobradicas);
      }
    }
  }
    
  // Redesenho completo garantirá que todas as coordenadas sejam recalculadas
    
  // Agora que todas as atualizações foram feitas, forçar o redesenho UMA VEZ
  if (typeof window.desenharPorta === 'function') {
    window.desenharPorta(configAtual, true);
  } else if (typeof window.atualizarDesenho === 'function') {
    window.atualizarDesenho();
  }
}

// Configura listeners para tabs de accordion no Bootstrap
function configurarListenersAccordion() {
  // Selecionar todos os botões de accordion
  const accordionButtons = document.querySelectorAll('.accordion-button');
  
  // Adicionar event listener para cada botão
  accordionButtons.forEach(button => {
    button.addEventListener('click', function () {
      // Verificar se este botão tem o atributo data-force-update
      if (this.getAttribute('data-force-update') === 'true') {
        // Verificar se a seção está se expandindo
        const expanded = this.getAttribute('aria-expanded') === 'true';
        if (!expanded) { // Se estava fechado e vai abrir
          console.log('Forçando atualização das dobradiças porque a seção Função da Porta foi aberta');
          
          // Esperar um pouco para o DOM ser atualizado
          setTimeout(() => {
            // Forçar a atualização das dobradiças com a altura atual
            const config = obterConfiguracaoAtual();
            if (typeof window.forcaAtualizacaoDobradicas === 'function') {
              window.forcaAtualizacaoDobradicas(config.altura, config.numDobradicas);
            }
          }, 50);
        }
      }
    });
  });
}

// Exportar todas as funções necessárias em um único bloco no final
export {
  inicializarFormularios,
  updateDobradicaInputs,
  coletarDadosFormulario
};

// Exportar para compatibilidade com não-módulos
window.inicializarFormularios = inicializarFormularios; 
window.atualizarAlturaERecalcularDobradicasImediatamente = atualizarAlturaERecalcularDobradicasImediatamente; 