/**
 * Módulo para funcionalidade de Novo Projeto
 * Permite reinicializar os campos do formulário para uma configuração padrão
 */

import { mostrarNotificacao } from './notifications.js';
import { obterConfiguracaoAtual, atualizarConfiguracao } from './initialize.js';
import { desenharPorta } from './drawing.js';

/**
 * Valores padrão para novo projeto
 */
const VALORES_PADRAO = {
  // FUNÇÃO DA PORTA
  funcao: 'superiorDireita', // Abrir Superior Direita
  
  // MEDIDAS
  largura: 450,
  altura: 2450,
  quantidade: 1,
  portaEmPar: false,
  
  // PUXADOR
  puxadorModelo: 'Luna',
  puxadorPosicao: 'vertical',
  puxadorMedida: '150',  // em mm
  puxadorLados: 'esquerdo',
  
  // MATERIAIS
  vidroTipo: 'Espelho',
  perfilModelo: 'RM-060',
  perfilCor: 'Preto',
  
  // INFORMAÇÕES e OBSERVAÇÕES
  cliente: '',
  ambiente: '',
  observacoes: ''
};

/**
 * Reinicia a aplicação para um novo projeto com configurações padrão
 */
export function iniciarNovoProjeto() {
  try {
    // REMOVIDO: Salvamento automático ao iniciar novo projeto
    // O usuário deve salvar manualmente usando o botão "Salvar" se desejar
    console.log('Iniciando novo projeto sem salvamento automático...');

    // Atualizar configuração com valores padrão
    atualizarConfiguracao(VALORES_PADRAO);
    
    // Atualizar campos da interface
    atualizarCamposInterface(VALORES_PADRAO);
    
    // Redesenhar a porta com novos valores
    const configAtual = obterConfiguracaoAtual();
    desenharPorta(configAtual, true);
    
    console.log('Novo projeto iniciado com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao iniciar novo projeto:', error);
    return false;
  }
}

/**
 * Atualiza os campos da interface com os valores padrão
 */
function atualizarCamposInterface(config) {
  // FUNÇÃO DA PORTA
  const funcaoPorta = document.getElementById('funcaoPorta');
  if (funcaoPorta) {
    funcaoPorta.value = config.funcao;
    // Disparar evento change para atualizar seções condicionais
    funcaoPorta.dispatchEvent(new Event('change'));
  }
  
  // MEDIDAS
  const larguraInput = document.getElementById('larguraInput');
  if (larguraInput) {
    larguraInput.value = config.largura;
  }
  
  const alturaInput = document.getElementById('alturaInput');
  if (alturaInput) {
    alturaInput.value = config.altura;
    // Disparar evento para atualizar número de dobradiças
    alturaInput.dispatchEvent(new Event('change'));
  }
  
  const quantidadeInput = document.getElementById('quantidadeInput');
  if (quantidadeInput) {
    quantidadeInput.value = config.quantidade;
    // Disparar evento para atualizar checkbox Par
    quantidadeInput.dispatchEvent(new Event('change'));
  }
  
  // Desmarcar checkbox Par
  const parCheckbox = document.getElementById('parCheckbox');
  if (parCheckbox) {
    parCheckbox.checked = false;
  }
  
  // PUXADOR
  const puxadorModelo = document.getElementById('puxadorModelo');
  if (puxadorModelo) {
    puxadorModelo.value = config.puxadorModelo;
    puxadorModelo.dispatchEvent(new Event('change'));
  }
  
  // Posição do puxador (checkbox e campo oculto)
  const posicaoVertical = document.getElementById('posicaoVertical');
  const posicaoHorizontal = document.getElementById('posicaoHorizontal');
  const puxadorPosicao = document.getElementById('puxadorPosicao');
  
  if (posicaoVertical && posicaoHorizontal) {
    if (config.puxadorPosicao === 'vertical') {
      posicaoVertical.checked = true;
      posicaoHorizontal.checked = false;
    } else {
      posicaoVertical.checked = false;
      posicaoHorizontal.checked = true;
    }
  }
  
  if (puxadorPosicao) {
    puxadorPosicao.value = config.puxadorPosicao;
    puxadorPosicao.dispatchEvent(new Event('change'));
  }
  
  // Medida do puxador
  const puxadorMedida = document.getElementById('puxadorMedida');
  if (puxadorMedida) {
    puxadorMedida.value = config.puxadorMedida;
    puxadorMedida.dispatchEvent(new Event('change'));
  }
  
  // Lados do puxador (para deslizante)
  const puxadorLados = document.getElementById('puxadorLados');
  if (puxadorLados) {
    puxadorLados.value = config.puxadorLados;
  }
  
  // MATERIAIS
  const vidroTipo = document.getElementById('vidroTipo');
  if (vidroTipo) {
    vidroTipo.value = config.vidroTipo;
    vidroTipo.dispatchEvent(new Event('change'));
  }
  
  const perfilModelo = document.getElementById('perfilModelo');
  if (perfilModelo) {
    perfilModelo.value = config.perfilModelo;
    perfilModelo.dispatchEvent(new Event('change'));
  }
  
  const perfilCor = document.getElementById('perfilCor');
  if (perfilCor) {
    perfilCor.value = config.perfilCor;
    perfilCor.dispatchEvent(new Event('change'));
  }
  
  // INFORMAÇÕES
  const clienteInput = document.getElementById('clienteInput');
  if (clienteInput) {
    clienteInput.value = '';
  }
  
  const ambienteInput = document.getElementById('ambienteInput');
  if (ambienteInput) {
    ambienteInput.value = '';
  }
  
  // OBSERVAÇÕES - caso esteja sendo gerenciado via textarea
  const observacoesInput = document.getElementById('observacoesInput');
  if (observacoesInput) {
    observacoesInput.value = '';
  }
}

/**
 * Exibe uma notificação discreta de "Novo Projeto" criado
 */
function mostrarToastNovoProjeto() {
  // Verificar se já existe um toast e remover
  const toastExistente = document.querySelector('.toast-novo-projeto');
  if (toastExistente) {
    document.body.removeChild(toastExistente);
  }
  
  // Criar elemento toast
  const toast = document.createElement('div');
  toast.className = 'toast-novo-projeto';
  toast.innerHTML = `
    <i class="bi bi-check-circle-fill"></i>
    <span>Novo Projeto iniciado</span>
  `;
  
  // Adicionar ao body
  document.body.appendChild(toast);
  
  // Mostrar com atraso para efeito de animação
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Remover após 3 segundos
  setTimeout(() => {
    toast.classList.remove('show');
    // Remover do DOM após a animação
    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Exportar função para uso global
if (typeof window !== 'undefined') {
  window.iniciarNovoProjeto = iniciarNovoProjeto;
}
