/**
 * Módulo para funcionalidade de Novo Projeto
 * Permite reinicializar os campos do formulário para uma configuração padrão
 */

import { mostrarNotificacao } from './notifications.js';
import { obterConfiguracaoAtual, atualizarConfiguracao } from './initialize.js';
import { desenharPorta } from './drawing.js';

/**
 * Valores padrão para novo projeto (BASEADO NA CONFIGURAÇÃO ORIGINAL DO SISTEMA)
 */
const VALORES_PADRAO = {
  // INFORMAÇÕES BÁSICAS
  parceiro: '',
  cliente: '',
  ambiente: '',
  
  // FUNÇÃO DA PORTA
  funcao: 'superiorDireita', // Abrir Superior Direita
  
  // MEDIDAS (valores padrão do sistema original)
  largura: 450,
  altura: 2450,
  quantidade: 1,
  portaEmPar: false,
  
  // MATERIAIS (configuração original do sistema)
  vidroTipo: 'Incolor',  // Original era 'Incolor'
  perfilModelo: 'RM-114', // Original era 'RM-114'
  perfilCor: 'Preto',
  
  // DOBRADIÇAS (configuração original)
  numDobradicas: 4,
  dobradicas: [100, 500, 1000, 2000], // Posições originais
  
  // PUXADOR (configuração original do sistema)
  puxadorModelo: 'Cielo', // Original era 'Cielo'
  puxadorPosicao: 'vertical',
  puxadorMedida: '150',
  puxadorLados: 'direito', // Original era 'direito'
  puxadorCotaSuperior: 950,
  puxadorCotaInferior: 1000,
  puxadorDeslocamento: 100,
  
  // OUTROS
  modeloDeslizante: 'RO-654025',
  observacao: ''
};

/**
 * Reinicia a aplicação para um novo projeto com configurações padrão
 */
export function iniciarNovoProjeto() {
  try {
    console.log('🆕 [Novo Projeto] Iniciando novo projeto...');

    // Atualizar configuração com valores padrão
    atualizarConfiguracao(VALORES_PADRAO);
    
    // Atualizar campos da interface
    atualizarCamposInterface(VALORES_PADRAO);
    
    // Log para confirmar configuração do puxador
    console.log('📐 [Novo Projeto] Cotas do puxador aplicadas:', {
      cotaSuperior: VALORES_PADRAO.puxadorCotaSuperior,
      cotaInferior: VALORES_PADRAO.puxadorCotaInferior,
      modelo: VALORES_PADRAO.puxadorModelo,
      medida: VALORES_PADRAO.puxadorMedida
    });
    
    // Redesenhar a porta com novos valores
    const configAtual = obterConfiguracaoAtual();
    desenharPorta(configAtual, true);
    
    // Mostrar notificação de sucesso
    mostrarNotificacao('Novo projeto iniciado com configurações padrão', 'success');
    
    console.log('✅ [Novo Projeto] Projeto reiniciado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ [Novo Projeto] Erro ao iniciar novo projeto:', error);
    mostrarNotificacao('Erro ao iniciar novo projeto', 'error');
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
  
  // COTAS DO PUXADOR
  const puxadorCotaSuperior = document.getElementById('puxadorCotaSuperior');
  if (puxadorCotaSuperior) {
    puxadorCotaSuperior.value = config.puxadorCotaSuperior;
    puxadorCotaSuperior.dispatchEvent(new Event('change'));
  }
  
  const puxadorCotaInferior = document.getElementById('puxadorCotaInferior');
  if (puxadorCotaInferior) {
    puxadorCotaInferior.value = config.puxadorCotaInferior; // 1000mm
    puxadorCotaInferior.dispatchEvent(new Event('change'));
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
  
  // OBSERVAÇÕES - limpar tanto o campo direto quanto o do modal
  const observacoesInput = document.getElementById('observacoesInput');
  if (observacoesInput) {
    observacoesInput.value = '';
  }
  
  const observacaoInput = document.getElementById('observacaoInput');
  if (observacaoInput) {
    observacaoInput.value = '';
  }
  
  // Limpar campo parceiro se existir
  const parceiroInput = document.getElementById('parceiroInput');
  if (parceiroInput) {
    parceiroInput.value = '';
  }
  
  // RESETAR CAMPOS DE DOBRADIÇAS
  const numDobradicasInput = document.getElementById('numDobradicasInput');
  if (numDobradicasInput) {
    numDobradicasInput.value = '4'; // Valor padrão
    numDobradicasInput.dispatchEvent(new Event('change'));
  }
  
  // Resetar posições de dobradiças individuais (se existirem)
  for (let i = 1; i <= 10; i++) {
    const dobradicaInput = document.getElementById(`dobradicaPos${i}`);
    if (dobradicaInput) {
      dobradicaInput.value = '';
    }
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

/**
 * Função de teste para verificar se o botão está funcionando
 */
function testarBotaoNovoProjeto() {
  console.log('[TESTE] Verificando botão Novo Projeto...');
  
  const btn = document.getElementById('btnNovoProjeto');
  if (!btn) {
    console.error('[TESTE] ❌ Botão btnNovoProjeto não encontrado!');
    return false;
  }
  
  console.log('[TESTE] ✅ Botão encontrado:', btn);
  
  // Verificar se há event listeners
  const hasClickListener = btn.onclick !== null;
  console.log('[TESTE] Event listener onclick:', hasClickListener);
  
  // Testar click manualmente
  console.log('[TESTE] Simulando click...');
  try {
    btn.click();
    return true;
  } catch (error) {
    console.error('[TESTE] ❌ Erro ao clicar:', error);
    return false;
  }
}

/**
 * Função de teste específica para verificar cotas do puxador
 */
function verificarCotasPuxador() {
  console.log('[TESTE COTAS] Verificando cotas do puxador após novo projeto...');
  
  // Verificar campos na interface
  const cotaSuperior = document.getElementById('puxadorCotaSuperior');
  const cotaInferior = document.getElementById('puxadorCotaInferior');
  const puxadorModelo = document.getElementById('puxadorModelo');
  
  const resultado = {
    cotaSuperior: cotaSuperior ? cotaSuperior.value : 'Campo não encontrado',
    cotaInferior: cotaInferior ? cotaInferior.value : 'Campo não encontrado',
    modelo: puxadorModelo ? puxadorModelo.value : 'Campo não encontrado',
    esperado: {
      cotaSuperior: VALORES_PADRAO.puxadorCotaSuperior,
      cotaInferior: VALORES_PADRAO.puxadorCotaInferior,
      modelo: VALORES_PADRAO.puxadorModelo
    }
  };
  
  console.log('[TESTE COTAS] Resultado:', resultado);
  
  // Verificar se está correto
  const cotaCorreta = cotaInferior && cotaInferior.value == '1000';
  console.log(`[TESTE COTAS] Cota inferior está correta (1000mm): ${cotaCorreta ? '✅' : '❌'}`);
  
  return resultado;
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.iniciarNovoProjeto = iniciarNovoProjeto;
  window.testarBotaoNovoProjeto = testarBotaoNovoProjeto;
  window.verificarCotasPuxador = verificarCotasPuxador;
  
  console.log('[Novo Projeto] Funções disponíveis globalmente:');
  console.log('  - window.iniciarNovoProjeto()');
  console.log('  - window.testarBotaoNovoProjeto()');
  console.log('  - window.verificarCotasPuxador()');
}
