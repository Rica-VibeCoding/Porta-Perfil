/**
 * Módulo de controles de interface do usuário
 */

import { mostrarNotificacao } from './notifications.js';
import { obterConfiguracaoAtual, atualizarConfiguracao } from './initialize.js';
import { desenharPorta, atualizarDesenho } from './drawing.js';
import { salvarLogoNoStorage } from './storage.js';
import { ehPortaDeslizante, ehPortaGiro, obterCotasPadraoParaDeslizante, obterCotasPadraoParaGiro, recalcularCotasParaCentralizar, validarDimensoesPuxador } from './utils.js';

/**
 * Inicializa os controles do formulário
 */
function inicializarControles() {
  // Inicializar campos gerais
  inicializarCamposGerais();
  
  // Inicializar campos de medidas
  inicializarControlesMedidas();
  
  // Inicializar material e vidro
  inicializarControlesMateriais();
  
  // Inicializar controles de função
  inicializarControlesFuncao();
  
  // Configurar controles do puxador
  inicializarControlesPuxador();
  
  // Configurar controles de dobradiças
  inicializarControlesDobradicasQtd();
  
  // Validação de todos os campos
  configurarValidacaoFormulario();
  
  // Atualizar canvas com a configuração inicial
  const config = obterConfiguracaoAtual();
  atualizarDesenho(config);
}

/**
 * Inicializa os campos gerais do formulário
 */
function inicializarCamposGerais() {
  // Obter configuração atual
  const config = obterConfiguracaoAtual();
  
  // Configurar campo de parceiro
  const parceiroInput = document.getElementById('parceiroInput');
  if (parceiroInput) {
    parceiroInput.value = config.parceiro || '';
    parceiroInput.addEventListener('change', () => {
      atualizarConfiguracao({ parceiro: parceiroInput.value });
      const configAtual = obterConfiguracaoAtual();
      atualizarDesenho(configAtual);
    });
  }
  
  // Configurar campo de cliente
  const clienteInput = document.getElementById('clienteInput');
  if (clienteInput) {
    clienteInput.value = config.cliente || '';
    clienteInput.addEventListener('change', () => {
      atualizarConfiguracao({ cliente: clienteInput.value });
      const configAtual = obterConfiguracaoAtual();
      atualizarDesenho(configAtual);
    });
  }
  
  // Configurar campo de ambiente
  const ambienteInput = document.getElementById('ambienteInput');
  if (ambienteInput) {
    ambienteInput.value = config.ambiente || '';
    ambienteInput.addEventListener('change', () => {
      atualizarConfiguracao({ ambiente: ambienteInput.value });
      const configAtual = obterConfiguracaoAtual();
      atualizarDesenho(configAtual);
    });
  }
  
  // Configurar campo de quantidade
  const quantidadeInput = document.getElementById('quantidadeInput');
  const parCheckboxContainer = document.getElementById('parCheckboxContainer');
  const parCheckbox = document.getElementById('parCheckbox');

  function atualizarParCheckbox() {
    const quantidade = parseInt(quantidadeInput.value, 10);
    // Verificar tipo de porta
    const funcaoPorta = document.getElementById('funcaoPorta');
    const funcao = funcaoPorta ? (funcaoPorta.value || '').toLowerCase().replace(/\s|_/g, '') : '';
    const ehGiro = funcao.startsWith('superior') || funcao.startsWith('inferior') || funcao.includes('superiordireita') || funcao.includes('superioresquerda') || funcao.includes('inferiordireita') || funcao.includes('inferioresquerda');
    const ehDeslizante = funcao.includes('deslizante') || funcao.includes('correr');
    const ehBasculante = funcao.includes('basculante');
    if (quantidade >= 2 && quantidade % 2 === 0 && ehGiro && !ehDeslizante && !ehBasculante) {
      parCheckboxContainer.style.display = '';
      parCheckbox.disabled = false;
    } else {
      parCheckbox.checked = false;
      parCheckbox.disabled = true;
      parCheckboxContainer.style.display = 'none';
      atualizarConfiguracao({ portaEmPar: false });
    }
  }

  if (quantidadeInput) {
    quantidadeInput.value = config.quantidade || 1;
    quantidadeInput.addEventListener('change', () => {
      atualizarConfiguracao({ quantidade: parseInt(quantidadeInput.value, 10) });
      atualizarParCheckbox();
      const configAtual = obterConfiguracaoAtual();
      desenharPorta(configAtual, true); // Forçar redesenho completo incluindo a legenda
    });
    // Inicializar estado do checkbox ao carregar
    atualizarParCheckbox();
  }

  if (parCheckbox) {
    parCheckbox.checked = !!config.portaEmPar;
    parCheckbox.addEventListener('change', () => {
      atualizarConfiguracao({ portaEmPar: parCheckbox.checked });
      const configAtual = obterConfiguracaoAtual();
      desenharPorta(configAtual, true);
    });
  }
  
  // Nota: O campo de observações agora é gerenciado pelo modal de observações
}

/**
 * Inicializa os controles de medidas
 */
function inicializarControlesMedidas() {
  // Obter configuração atual
  const config = obterConfiguracaoAtual();
  
  // Log para depuração da origem dos valores
  console.log('[DEBUG] Valor inicial largura:', config.largura);
  console.log('[DEBUG] Valor inicial altura:', config.altura);
  
  // Configurar campo de largura
  const larguraInput = document.getElementById('larguraInput');
  if (larguraInput) {
    // Se houver valor salvo, usar, senão deixar vazio
    larguraInput.value = (config.largura !== undefined && config.largura !== null) ? config.largura : '';
    
    // Remover listeners antigos para evitar duplicação
    larguraInput.removeEventListener('change', handleLarguraChange);
    larguraInput.removeEventListener('input', handleLarguraInput);
    larguraInput.removeEventListener('keydown', handleLarguraKeydown);
    
    // Adicionar novos listeners
    larguraInput.addEventListener('change', handleLarguraChange);
    larguraInput.addEventListener('input', handleLarguraInput);
    larguraInput.addEventListener('keydown', handleLarguraKeydown);
  }
  
  // Configurar campo de altura
  const alturaInput = document.getElementById('alturaInput');
  if (alturaInput) {
    // Se houver valor salvo, usar, senão deixar vazio
    alturaInput.value = (config.altura !== undefined && config.altura !== null) ? config.altura : '';
    
    // Remover listeners antigos para evitar duplicação
    alturaInput.removeEventListener('change', handleAlturaChange);
    alturaInput.removeEventListener('input', handleAlturaInput);
    alturaInput.removeEventListener('keydown', handleAlturaKeydown);
    
    // Adicionar novos listeners
    alturaInput.addEventListener('change', handleAlturaChange);
    alturaInput.addEventListener('input', handleAlturaInput);
    alturaInput.addEventListener('keydown', handleAlturaKeydown);
  }
}

// Variável global para controlar os timeouts de atualização
let updateTimeoutId = null;

// Handler generalizado para largura (basculante e giro)
function handleLarguraChange() {
  validarLargura();
  const configAtual = obterConfiguracaoAtual();
  const larguraInput = document.getElementById('larguraInput');
  if (!larguraInput) return;
  const largura = parseInt(larguraInput.value, 10);
  if (isNaN(largura)) return;

  // Guardar o valor antigo da largura para verificar se houve mudança
  const larguraAntiga = configAtual.largura;

  // Atualizar campo e configuração de largura para qualquer tipo de porta
  larguraInput.value = largura;
  atualizarConfiguracao({ largura });

  // Basculante: atualizar número e posições das dobradiças e redesenhar
  if (configAtual.funcao === 'basculante') {
    const numDobradicasNovo = definirNumeroDobradicasBasculante(largura);
    const alturaAtual = configAtual.altura || 350;
    const posicoes = calcularPosicaoDefaultDobradica(numDobradicasNovo, alturaAtual);
    const numDobradicasInput = document.getElementById('numDobradicasInput');
    if (numDobradicasInput) {
      numDobradicasInput.value = numDobradicasNovo.toString();
    }
    atualizarConfiguracao({ numDobradicas: numDobradicasNovo, dobradicas: posicoes });
    if (typeof window.atualizarCamposPosicoesDobradicasQtd === 'function') {
      window.atualizarCamposPosicoesDobradicasQtd(numDobradicasNovo, posicoes);
    }

    // Para basculante, também precisamos recalcular as posições das dobradiças horizontais
    if (configAtual.dobradicasBasculante) {
      const novasPosicoesBasculante = [];
      const distanciaExtremidade = 100;
      
      for (let i = 0; i < numDobradicasNovo; i++) {
        const posicaoMm = i === 0 ? distanciaExtremidade : 
            i === numDobradicasNovo - 1 ? largura - distanciaExtremidade :
            Math.round(distanciaExtremidade + (i * ((largura - 2 * distanciaExtremidade) / (numDobradicasNovo - 1))));
        
        novasPosicoesBasculante.push(Math.round(posicaoMm));
      }
      
      atualizarConfiguracao({ dobradicasBasculante: novasPosicoesBasculante });
    }

    if (typeof window.desenharPorta === 'function') {
      window.desenharPorta(obterConfiguracaoAtual(), true);
    } else if (typeof window.atualizarDesenho === 'function') {
      window.atualizarDesenho();
    }
    return;
  }

  // Portas de giro: sempre 4 dobradiças, posições fixas
  const funcoesGiro = [
    'superiorDireita',
    'superiorEsquerda',
    'inferiorDireita',
    'inferiorEsquerda'
  ];
  if (funcoesGiro.includes(configAtual.funcao)) {
    const numDobradicasGiro = 4;
    // Usar altura e largura atuais, ou padrão do Novo Projeto (2450x450), nunca 2450x500
    const altura = (configAtual.altura !== undefined && configAtual.altura !== null) ? configAtual.altura : 2450;
    const largura = (configAtual.largura !== undefined && configAtual.largura !== null) ? configAtual.largura : 450;
    // Distribuição: 100mm do topo, 100mm da base, intermediárias uniformes
    const distanciaTopo = 100;
    const distanciaBase = 100;
    const alturaUtil = altura - distanciaTopo - distanciaBase;
    const posicoes = [
      distanciaTopo,
      Math.round(distanciaTopo + alturaUtil / 3),
      Math.round(distanciaTopo + 2 * (alturaUtil / 3)),
      altura - distanciaBase
    ];
    const numDobradicasInput = document.getElementById('numDobradicasInput');
    if (numDobradicasInput) {
      numDobradicasInput.value = numDobradicasGiro.toString();
    }
    // Atualizar configuração com padrão correto
    atualizarConfiguracao({
      numDobradicas: numDobradicasGiro,
      altura: altura,
      largura: largura,
      dobradicas: posicoes
    });
    if (typeof window.atualizarCamposPosicoesDobradicasQtd === 'function') {
      window.atualizarCamposPosicoesDobradicasQtd(numDobradicasGiro, posicoes);
    }
    
    // Redesenho completo garantirá que todas as coordenadas sejam recalculadas
    
    // Forçar redesenho
    if (typeof window.desenharPorta === 'function') {
      window.desenharPorta(obterConfiguracaoAtual(), true);
    } else if (typeof window.atualizarDesenho === 'function') {
      window.atualizarDesenho();
    }
    return;
  }
}


function handleLarguraInput() {
  const input = document.getElementById('larguraInput');
  if (!input || !input.value) {
    return;
  }
  
  // Removido o timeout automático para que as medidas só sejam
  // aplicadas quando o usuário pressionar Enter
}

// Novo handler para tecla Enter na largura
function handleLarguraKeydown(event) {
  if (event.key === 'Enter') {
    const input = document.getElementById('larguraInput');
    if (!input || !input.value) {
      return;
    }
    
    const valor = parseInt(input.value);
    if (!isNaN(valor)) {
      const configAtual = obterConfiguracaoAtual();
      const larguraAntiga = configAtual.largura;
      
      if (larguraAntiga !== valor) {
        configAtual.largura = valor;
        atualizarConfiguracao(configAtual);
        
        // FORÇAR REDESENHO COMPLETO
        if (typeof window.limparSVG === 'function') {
          window.limparSVG();
        }
        
        setTimeout(() => {
          const configNova = obterConfiguracaoAtual();
          if (typeof window.desenharPorta === 'function') {
            window.desenharPorta(configNova, true);
          } else if (typeof window.atualizarDesenho === 'function') {
            window.atualizarDesenho(configNova);
          }
        }, 10);
      }
    }
    event.preventDefault();
  }
}

// Handler generalizado para altura (todas as portas)
function handleAlturaChange() {
  validarAltura();
  const configAtual = obterConfiguracaoAtual();
  const alturaInput = document.getElementById('alturaInput');
  if (!alturaInput) return;
  const altura = parseInt(alturaInput.value, 10);
  if (isNaN(altura)) return;
  
  // Guardar o valor antigo da altura para comparar
  const alturaAntiga = configAtual.altura;
  
  // Verificar se a altura realmente mudou
  if (altura === alturaAntiga) return;
  
  // Atualizar a configuração da altura
  atualizarConfiguracao({ altura });
  
  // Recalcular posições das dobradiças com base no tipo de porta
  const tipoPorta = configAtual.funcao || 'superiorDireita';
  const ehBasculante = tipoPorta === 'basculante';
  const ehDeslizante = tipoPorta === 'deslizante';
  const ehGiro = ['superiorDireita', 'superiorEsquerda', 'inferiorDireita', 'inferiorEsquerda'].includes(tipoPorta);
  
  const numDobradicas = parseInt(configAtual.numDobradicas || 0, 10);
  
  if (ehBasculante) {
    // Para portas basculantes, as dobradiças ficam no topo, distribuídas horizontalmente
    // Nesse caso, não precisamos recalcular posições quando a altura muda
    // Apenas atualizar o desenho
  } 
  else if (ehGiro && numDobradicas > 0) {
    // Para portas de giro, recalcular posições verticais das dobradiças
    const distanciaTopo = 100;
    const distanciaBase = 100;
    const alturaUtil = altura - distanciaTopo - distanciaBase;
    
    // Calcular posições uniformes
    let novasPosicoes = [];
    
    if (numDobradicas === 2) {
      novasPosicoes = [
        distanciaTopo,
        altura - distanciaBase
      ];
    } 
    else if (numDobradicas === 3) {
      novasPosicoes = [
        distanciaTopo,
        Math.round(distanciaTopo + alturaUtil / 2),
        altura - distanciaBase
      ];
    }
    else if (numDobradicas === 4) {
      novasPosicoes = [
        distanciaTopo,
        Math.round(distanciaTopo + alturaUtil / 3),
        Math.round(distanciaTopo + 2 * (alturaUtil / 3)),
        altura - distanciaBase
      ];
    }
    else if (numDobradicas > 4) {
      // Para mais de 4 dobradiças, distribuir uniformemente
      novasPosicoes = [];
      for (let i = 0; i < numDobradicas; i++) {
        if (i === 0) {
          novasPosicoes.push(distanciaTopo);
        } 
        else if (i === numDobradicas - 1) {
          novasPosicoes.push(altura - distanciaBase);
        } 
        else {
          const posicao = Math.round(distanciaTopo + (i * (alturaUtil / (numDobradicas - 1))));
          novasPosicoes.push(posicao);
        }
      }
    }
    
    // Atualizar configuração com as novas posições
    if (novasPosicoes.length > 0) {
      atualizarConfiguracao({ dobradicas: novasPosicoes });
      
      // Atualizar campos de formulário
      if (typeof window.atualizarCamposPosicoesDobradicasQtd === 'function') {
        window.atualizarCamposPosicoesDobradicasQtd(numDobradicas, novasPosicoes);
      }
    }
  }
  
  // NOVO: Recentralizar puxador automaticamente quando dimensões mudam
  recentralizarPuxadorAutomaticamente(altura, alturaAntiga, configAtual);
  
  // Redesenho completo garantirá que todas as coordenadas sejam recalculadas
  
  // Redesenhar a porta
  if (typeof window.desenharPorta === 'function') {
    window.desenharPorta(obterConfiguracaoAtual(), true);
  } else if (typeof window.atualizarDesenho === 'function') {
    window.atualizarDesenho();
  }
}

/**
 * Recentraliza automaticamente o puxador quando as dimensões da porta mudam
 */
function recentralizarPuxadorAutomaticamente(novaAltura, alturaAntiga, config) {
  console.log('[AUTO-CENTRALIZAR] 🚀 Iniciando recentralização automática do puxador');
  console.log('[AUTO-CENTRALIZAR] Parâmetros:', { novaAltura, alturaAntiga, puxadorConfig: config.puxador, funcaoPorta: config.funcao });
  
  // Verificar se há puxador configurado
  if (!config.puxador) {
    console.log('[AUTO-CENTRALIZAR] ❌ Nenhum puxador configurado');
    return;
  }
  
  if (config.puxador.modelo === 'S/Puxador') {
    console.log('[AUTO-CENTRALIZAR] ❌ Puxador configurado como "S/Puxador"');
    return;
  }
  
  // Verificar se é "Porta Inteira" - nesses casos não precisamos recentralizar
  if (config.puxador.medida === 'Porta Inteira' || config.puxador.medida === 'Tamanho da Porta') {
    console.log('[AUTO-CENTRALIZAR] ❌ Puxador configurado como "Porta Inteira" - não precisa recentralizar');
    return;
  }
  
  const medidaPuxador = parseInt(config.puxador.medida, 10);
  if (isNaN(medidaPuxador)) {
    console.log('[AUTO-CENTRALIZAR] ❌ Medida do puxador inválida:', config.puxador.medida);
    return;
  }
  
  // Detectar tipo de porta
  const ehDeslizante = ehPortaDeslizante(config.funcao);
  const ehGiro = ehPortaGiro(config.funcao);
  
  console.log('[AUTO-CENTRALIZAR] Detecção do tipo de porta:', {
    funcao: config.funcao,
    ehDeslizante,
    ehGiro
  });
  
  if (!ehDeslizante && !ehGiro) {
    console.log('[AUTO-CENTRALIZAR] ❌ Tipo de porta não suportado para auto-centralização');
    return;
  }
  
  // Recalcular cotas para centralizar o puxador
  const tipoPorta = ehDeslizante ? 'deslizante' : 'giro';
  const cotasRecentralizadas = recalcularCotasParaCentralizar(novaAltura, medidaPuxador, tipoPorta);
  
  if (!cotasRecentralizadas) {
    console.error('[AUTO-CENTRALIZAR] ❌ Erro ao recalcular cotas');
    return;
  }
  
  console.log('[AUTO-CENTRALIZAR] ✅ Recentralizando puxador:', {
    tipoPorta,
    novaAltura: novaAltura + 'mm',
    alturaAntiga: alturaAntiga + 'mm',
    medidaPuxador: medidaPuxador + 'mm',
    cotasRecentralizadas
  });
  
  // Atualizar configuração com as novas cotas centralizadas
  atualizarConfiguracao({
    puxador: {
      ...config.puxador,
      cotaSuperior: cotasRecentralizadas.cotaSuperior,
      cotaInferior: cotasRecentralizadas.cotaInferior
    }
  });
  
  // Atualizar campos do formulário para refletir as novas cotas
  const puxadorCotaSuperior = document.getElementById('puxadorCotaSuperior');
  const puxadorCotaInferior = document.getElementById('puxadorCotaInferior');
  
  if (puxadorCotaSuperior) {
    puxadorCotaSuperior.value = cotasRecentralizadas.cotaSuperior;
    console.log('[AUTO-CENTRALIZAR] ✅ Campo cotaSuperior atualizado:', cotasRecentralizadas.cotaSuperior);
  } else {
    console.warn('[AUTO-CENTRALIZAR] ⚠️ Campo puxadorCotaSuperior não encontrado');
  }
  
  if (puxadorCotaInferior) {
    puxadorCotaInferior.value = cotasRecentralizadas.cotaInferior;
    console.log('[AUTO-CENTRALIZAR] ✅ Campo cotaInferior atualizado:', cotasRecentralizadas.cotaInferior);
  } else {
    console.warn('[AUTO-CENTRALIZAR] ⚠️ Campo puxadorCotaInferior não encontrado');
  }
  
  // Mostrar notificação para o usuário
  if (typeof mostrarNotificacao === 'function') {
    mostrarNotificacao(
      `🎯 Puxador recentralizado automaticamente para altura ${novaAltura}mm`, 
      'success', 
      3000
    );
  }
  
  console.log('[AUTO-CENTRALIZAR] 🎉 Recentralização concluída com sucesso!');
}

// Tornar a função disponível globalmente
window.handleAlturaChange = handleAlturaChange;

// Função de teste para debug da recentralização automática
window.testarRecentralizacaoPuxador = function(novaAltura, medidaPuxador = 150) {
  console.log('🧪 [TESTE] Testando recentralização manual do puxador');
  
  const config = obterConfiguracaoAtual();
  console.log('🧪 [TESTE] Configuração atual:', config);
  
  // Simular configuração de puxador se não existir
  if (!config.puxador) {
    config.puxador = {
      modelo: 'TESTE-001',
      medida: String(medidaPuxador),
      posicao: 'vertical'
    };
    console.log('🧪 [TESTE] Puxador simulado criado:', config.puxador);
  }
  
  const alturaAntiga = config.altura || 2450;
  
  console.log('🧪 [TESTE] Chamando recentralizarPuxadorAutomaticamente...');
  recentralizarPuxadorAutomaticamente(novaAltura, alturaAntiga, config);
  
  console.log('🧪 [TESTE] Teste concluído. Verifique os logs acima.');
  return '✅ Teste executado - verifique o console';
};

// Função de teste para verificar detecção de tipo de porta
window.testarDeteccaoTipoPorta = function(funcao) {
  console.log('🔍 [TESTE] Testando detecção de tipo de porta para:', funcao);
  
  const ehDeslizante = ehPortaDeslizante(funcao);
  const ehGiro = ehPortaGiro(funcao);
  
  console.log('🔍 [TESTE] Resultados:', {
    funcao,
    ehDeslizante,
    ehGiro
  });
  
  return { funcao, ehDeslizante, ehGiro };
};

// Função de diagnóstico completo do sistema de puxadores
window.diagnosticarSistemaPuxadores = function() {
  console.log('🔬 [DIAGNÓSTICO] Iniciando diagnóstico completo do sistema de puxadores');
  
  const config = obterConfiguracaoAtual();
  console.log('📋 [DIAGNÓSTICO] Configuração atual:', config);
  
  // Testar detecção de tipo de porta
  if (config.funcao) {
    const deteccao = window.testarDeteccaoTipoPorta(config.funcao);
    console.log('🔍 [DIAGNÓSTICO] Detecção de tipo:', deteccao);
  }
  
  // Verificar campos do formulário
  const alturaInput = document.getElementById('alturaInput');
  const puxadorCotaSuperior = document.getElementById('puxadorCotaSuperior');
  const puxadorCotaInferior = document.getElementById('puxadorCotaInferior');
  const puxadorMedida = document.getElementById('puxadorMedida');
  const funcaoPorta = document.getElementById('funcaoPorta');
  
  console.log('📝 [DIAGNÓSTICO] Campos do formulário:', {
    altura: alturaInput ? alturaInput.value : 'não encontrado',
    cotaSuperior: puxadorCotaSuperior ? puxadorCotaSuperior.value : 'não encontrado',
    cotaInferior: puxadorCotaInferior ? puxadorCotaInferior.value : 'não encontrado',
    medidaPuxador: puxadorMedida ? puxadorMedida.value : 'não encontrado',
    funcaoPorta: funcaoPorta ? funcaoPorta.value : 'não encontrado'
  });
  
  // Testar cálculo de recentralização
  if (alturaInput && puxadorMedida && config.altura) {
    const novaAltura = parseInt(alturaInput.value);
    const medidaPuxador = parseInt(puxadorMedida.value || '150');
    
    if (!isNaN(novaAltura) && !isNaN(medidaPuxador)) {
      console.log('🧮 [DIAGNÓSTICO] Testando cálculo de recentralização...');
      const cotasRecentralizadas = recalcularCotasParaCentralizar(novaAltura, medidaPuxador, 'giro');
      console.log('📐 [DIAGNÓSTICO] Cotas recentralizadas:', cotasRecentralizadas);
      
      // Validar as novas cotas
      const validacao = validarDimensoesPuxador(novaAltura, cotasRecentralizadas.cotaSuperior, cotasRecentralizadas.cotaInferior, medidaPuxador);
      console.log('✅ [DIAGNÓSTICO] Validação das cotas:', validacao);
    }
  }
  
  console.log('🎯 [DIAGNÓSTICO] Diagnóstico concluído');
  return '✅ Diagnóstico executado - verifique o console';
};

// Função para forçar mudança de altura e testar auto-centralização
window.testarMudancaAltura = function(novaAltura) {
  console.log('🧪 [TESTE ALTURA] Testando mudança de altura para:', novaAltura);
  
  const alturaInput = document.getElementById('alturaInput');
  if (!alturaInput) {
    console.error('❌ Campo alturaInput não encontrado');
    return;
  }
  
  const alturaAntiga = alturaInput.value;
  console.log('📏 [TESTE ALTURA] Altura atual:', alturaAntiga, '→ Nova altura:', novaAltura);
  
  // Mudar o valor e disparar evento
  alturaInput.value = novaAltura;
  alturaInput.dispatchEvent(new Event('change'));
  
  console.log('✅ [TESTE ALTURA] Evento de mudança disparado');
  return `Altura alterada de ${alturaAntiga}mm para ${novaAltura}mm`;
};

// Função de teste completo para reproduzir o problema das screenshots
window.testarCenarioScreenshots = function() {
  console.log('📸 [TESTE SCREENSHOTS] Reproduzindo cenário das screenshots...');
  
  // Primeiro: configurar altura inicial de 1300mm
  console.log('1️⃣ Configurando altura inicial: 1300mm');
  window.testarMudancaAltura(1300);
  
  setTimeout(() => {
    // Verificar estado atual
    console.log('📊 Estado após 1300mm:');
    window.diagnosticarSistemaPuxadores();
    
    setTimeout(() => {
      // Segundo: mudar para 850mm como na screenshot
      console.log('2️⃣ Mudando para altura final: 850mm');
      window.testarMudancaAltura(850);
      
      setTimeout(() => {
        // Verificar estado final
        console.log('📊 Estado final após 850mm:');
        window.diagnosticarSistemaPuxadores();
        
        console.log('🎬 [TESTE SCREENSHOTS] Teste concluído!');
      }, 500);
    }, 500);
  }, 500);
  
  return '🎬 Teste de cenário iniciado - aguarde os logs...';
};

function handleAlturaInput() {
  const input = document.getElementById('alturaInput');
  if (!input || !input.value) {
    return;
  }
  
  // Removido o timeout automático para que as medidas só sejam
  // aplicadas quando o usuário pressionar Enter
}

// Novo handler para tecla Enter na altura
function handleAlturaKeydown(event) {
  if (event.key === 'Enter') {
    const input = document.getElementById('alturaInput');
    if (!input || !input.value) {
      return;
    }
    
    const valor = parseInt(input.value);
    if (!isNaN(valor)) {
      const configAtual = obterConfiguracaoAtual();
      const alturaAntiga = configAtual.altura;
      
      if (alturaAntiga !== valor) {
        configAtual.altura = valor;
        atualizarConfiguracao(configAtual);
        
        // FORÇAR REDESENHO COMPLETO
        if (typeof window.limparSVG === 'function') {
          window.limparSVG();
        }
        
        setTimeout(() => {
          const configNova = obterConfiguracaoAtual();
          if (typeof window.desenharPorta === 'function') {
            window.desenharPorta(configNova, true);
          } else if (typeof window.atualizarDesenho === 'function') {
            window.atualizarDesenho(configNova);
          }
        }, 10);
      }
    }
    event.preventDefault();
  }
}

/**
 * Inicializa os controles de materiais
 */
function inicializarControlesMateriais() {
  // Obter configuração atual
  const config = obterConfiguracaoAtual();
  
  // Configurar select de vidro
  const vidroSelect = document.getElementById('vidroTipo');
  if (vidroSelect) {
    vidroSelect.value = config.vidro || 'Incolor';
    vidroSelect.addEventListener('change', () => {
      atualizarConfiguracao({ vidro: vidroSelect.value });
      const configAtual = obterConfiguracaoAtual();
      atualizarDesenho(configAtual);
    });
  }
  
  // Configurar select de modelo do perfil
  const perfilModeloSelect = document.getElementById('perfilModelo');
  if (perfilModeloSelect) {
    perfilModeloSelect.value = config.perfilModelo || 'RM-114';
    perfilModeloSelect.addEventListener('change', () => {
      atualizarConfiguracao({ perfilModelo: perfilModeloSelect.value });
      const configAtual = obterConfiguracaoAtual();
      atualizarDesenho(configAtual);
    });
  }
  
  // Configurar select de cor do perfil
  const perfilCorSelect = document.getElementById('perfilCor');
  if (perfilCorSelect) {
    perfilCorSelect.value = config.perfilCor || 'Preto';
    perfilCorSelect.addEventListener('change', () => {
      atualizarConfiguracao({ perfilCor: perfilCorSelect.value });
      const configAtual = obterConfiguracaoAtual();
      atualizarDesenho(configAtual);
    });
  }
}

/**
 * Inicializa os controles de função da porta
 */
function inicializarControlesFuncao() {
  // Obter configuração atual
  const config = obterConfiguracaoAtual();
  
  // Configurar select de função
  const funcaoPorta = document.getElementById('funcaoPorta');
  if (funcaoPorta) {
    funcaoPorta.value = config.funcao || 'superiorDireita';
    funcaoPorta.addEventListener('change', () => {
      const novaFuncao = funcaoPorta.value;
      const funcaoAntiga = config.funcao;
      
      // Se a função selecionada for basculante, atualizar largura para 800 e altura para 350
      if (novaFuncao === 'basculante') {
        // Atualizar os inputs no formulário
        const larguraInput = document.getElementById('larguraInput');
        const alturaInput = document.getElementById('alturaInput');
        const numDobradicasInput = document.getElementById('numDobradicasInput');
        
        // REMOVIDO: Não forçar largura=800 e altura=350 para porta basculante
        // Se houver valor anterior, mantém; se não, deixa vazio
        if (larguraInput) larguraInput.value = (config.largura !== undefined && config.largura !== null) ? config.largura : '';
        if (alturaInput) alturaInput.value = (config.altura !== undefined && config.altura !== null) ? config.altura : '';
        if (numDobradicasInput) numDobradicasInput.value = '2';
        
        // Obter configuração atual do puxador
        const configAtual = obterConfiguracaoAtual();
        const puxadorConfig = configAtual.puxador || {};
        
        // Atualizar configuração
        atualizarConfiguracao({ 
          funcao: novaFuncao,
          // largura e altura NÃO são mais forçadas aqui
          numDobradicas: 2,
          puxador: {
            ...puxadorConfig,
            posicao: 'horizontal'
          }
        });
      }
      else if (novaFuncao === 'deslizante') {
        // Atualizar os inputs no formulário
        const larguraInput = document.getElementById('larguraInput');
        const alturaInput = document.getElementById('alturaInput');
        
        // Obter largura e altura atuais, ou usar valores padrão
        const larguraAtual = (config.largura !== undefined && config.largura !== null) ? config.largura : 900;
        const alturaAtual = (config.altura !== undefined && config.altura !== null) ? config.altura : 2450;
        
        // Atualizar os inputs
        if (larguraInput) larguraInput.value = larguraAtual;
        if (alturaInput) alturaInput.value = alturaAtual;
        
        // Obter configuração atual do puxador
        const configAtual = obterConfiguracaoAtual();
        const puxadorConfig = configAtual.puxador || {};
        
        // Atualizar a configuração para porta deslizante
        atualizarConfiguracao({ 
          funcao: novaFuncao,
          largura: larguraAtual,
          altura: alturaAtual,
          puxador: {
            ...puxadorConfig,
            posicao: 'vertical'
          }
        });
      }
      else if (novaFuncao.includes('superior') || novaFuncao.includes('inferior')) {
        // Para portas de giro (superior ou inferior)
        
        // Atualizar os inputs no formulário
        const larguraInput = document.getElementById('larguraInput');
        const alturaInput = document.getElementById('alturaInput');
        const numDobradicasInput = document.getElementById('numDobradicasInput');
        
        // Obter valores atuais ou padrão para largura e altura
        const larguraAtual = (config.largura !== undefined && config.largura !== null) ? config.largura : 450;
        const alturaAtual = (config.altura !== undefined && config.altura !== null) ? config.altura : 2450;
        
        // Atualizar os inputs com os valores
        if (larguraInput) larguraInput.value = larguraAtual;
        if (alturaInput) alturaInput.value = alturaAtual;
        if (numDobradicasInput) numDobradicasInput.value = '4';
        
        // Calcular posições uniformes das 4 dobradiças
        const distanciaTopo = 100;
        const distanciaBase = 100;
        const alturaUtil = alturaAtual - distanciaTopo - distanciaBase;
        const posicoesUniformes = [
          distanciaTopo,
          Math.round(distanciaTopo + alturaUtil / 3),
          Math.round(distanciaTopo + 2 * (alturaUtil / 3)),
          alturaAtual - distanciaBase
        ];
        
        // Configurar o puxador com cota inferior fixa em 1000mm
        const configAtual = obterConfiguracaoAtual();
        const puxadorConfig = configAtual.puxador || {};
        const medidaPuxador = puxadorConfig.medida || '150';
        const alturaPuxador = parseInt(medidaPuxador, 10);
        const cotaInferior = 1000;
        const cotaSuperior = Math.max(0, alturaAtual - (alturaPuxador + cotaInferior));
        
        // Atualizar os campos de cota do puxador no formulário
        const puxadorCotaSuperior = document.getElementById('puxadorCotaSuperior');
        const puxadorCotaInferior = document.getElementById('puxadorCotaInferior');
        
        if (puxadorCotaSuperior) puxadorCotaSuperior.value = cotaSuperior;
        if (puxadorCotaInferior) puxadorCotaInferior.value = cotaInferior;
        
        // Atualizar configuração
        atualizarConfiguracao({ 
          funcao: novaFuncao,
          // largura e altura NÃO são mais forçadas aqui
          numDobradicas: 4,
          dobradicas: posicoesUniformes,
          puxador: {
            ...puxadorConfig,
            cotaSuperior: cotaSuperior,
            cotaInferior: cotaInferior,
            posicao: puxadorConfig.posicao || 'vertical'
          }
        });
        
        // Atualizar campos de interface para posições das dobradiças
        if (typeof window.atualizarCamposPosicoesDobradicasQtd === 'function') {
          window.atualizarCamposPosicoesDobradicasQtd(4, posicoesUniformes);
        }
      }
      else {
        // Para outros tipos, apenas atualizar a função
        atualizarConfiguracao({ funcao: novaFuncao });
      }
      
      // Redesenho completo garantirá que todas as coordenadas sejam recalculadas
      
      toggleFuncaoPorta(novaFuncao);
      const configAtual = obterConfiguracaoAtual();
      atualizarDesenho(configAtual);
      
      // Também atualizar o desenho do canvas se a função estiver disponível
      if (typeof window.gerarDesenho === 'function') {
        window.gerarDesenho();
      }
    });
    
    // Aplicar estado inicial
    toggleFuncaoPorta(funcaoPorta.value);
  }
}

/**
 * Alterna a exibição de campos específicos baseado na função da porta
 * @param {string} funcao - Função selecionada
 */
function toggleFuncaoPorta(funcao) {
  // Verificar se é uma porta deslizante
  const ehDeslizante = funcao === 'deslizante';
  
  // Verificar se é uma porta basculante
  const ehBasculante = funcao === 'basculante';
  
  // Mostrar ou ocultar campos de acordo com a seleção
  const sectionDeslizante = document.getElementById('sectionDeslizante');
  const sectionDobradicas = document.getElementById('sectionDobradicas');
  
  if (sectionDeslizante) {
    sectionDeslizante.style.display = ehDeslizante ? 'block' : 'none';
  }
  
  if (sectionDobradicas) {
    sectionDobradicas.style.display = ehDeslizante ? 'none' : 'block';
  }
  
  // Ocultar ou mostrar o seletor de lados do puxador para portas deslizantes
  const puxadorLadosDiv = document.getElementById('puxadorLadosDiv');
  if (puxadorLadosDiv) {
    puxadorLadosDiv.style.display = ehDeslizante ? 'block' : 'none';
  }
  
  // Ocultar opção de posição do puxador para portas basculantes (sempre horizontal)
  const puxadorPosicaoDiv = document.getElementById('puxadorPosicaoDiv');
  if (puxadorPosicaoDiv) {
    puxadorPosicaoDiv.style.display = ehBasculante ? 'none' : 'block';
  }
  
  // Se for basculante, ajustar posição do puxador
  if (ehBasculante) {
    // Para porta basculante, forçar puxador horizontal
    const puxadorPosicao = document.getElementById('puxadorPosicao');
    const posicaoVertical = document.getElementById('posicaoVertical');
    const posicaoHorizontal = document.getElementById('posicaoHorizontal');
    
    // Atualizar select e checkboxes
    if (puxadorPosicao) {
      puxadorPosicao.value = 'horizontal';
    }
    
    // Atualizar os checkboxes
    if (posicaoVertical && posicaoHorizontal) {
      posicaoVertical.checked = false;
      posicaoHorizontal.checked = true;
    }
      
    // Atualizar a configuração com a posição horizontal
    const configAtual = obterConfiguracaoAtual();
    if (configAtual && configAtual.puxador) {
      atualizarConfiguracao({
        puxador: {
          ...configAtual.puxador,
          posicao: 'horizontal'
        }
      });
    }
  }
  
  // Definir o número de dobradiças com base no tipo de porta
  if (ehBasculante) {
    // Para basculante, usar largura para definir número de dobradiças
    const configAtual = obterConfiguracaoAtual();
    if (configAtual && configAtual.largura) {
      // Verificar se devemos atualizar automaticamente
      const numDobradicasInput = document.getElementById('numDobradicasInput');
      if (numDobradicasInput) {
        // Se o campo existir, usar valor atual
        const valorAtual = parseInt(numDobradicasInput.value, 10);
        // Se o valor for inválido, calcular com base na largura
        if (isNaN(valorAtual) || valorAtual < 2) {
          if (typeof window.definirNumeroDobradicasBasculante === 'function') {
            const numDobradicasNovo = window.definirNumeroDobradicasBasculante(configAtual.largura);
            numDobradicasInput.value = numDobradicasNovo.toString();
            atualizarConfiguracao({ numDobradicas: numDobradicasNovo });
            
            if (typeof window.atualizarCamposPosicoesDobradicasQtd === 'function') {
              window.atualizarCamposPosicoesDobradicasQtd(numDobradicasNovo);
            }
          }
        }
      }
    }
  }
}

/**
 * Inicializa os controles de puxador
 */
function inicializarControlesPuxador() {
  // Obter configuração atual
  const config = obterConfiguracaoAtual();
  
  // Configurar select de modelo de puxador
  const puxadorModeloSelect = document.getElementById('puxadorModelo');
  if (puxadorModeloSelect) {
    puxadorModeloSelect.value = config.puxador?.modelo || 'Cielo';
    puxadorModeloSelect.addEventListener('change', () => {
      const configAtual = obterConfiguracaoAtual();
      atualizarConfiguracao({ 
        puxador: { ...configAtual.puxador, modelo: puxadorModeloSelect.value } 
      });
      
      // NOVO: Esconder campo de posição se modelo for '100 Puxador' ou 'S/Puxador'
      const puxadorPosicaoDiv = document.getElementById('puxadorPosicaoDiv');
      if (puxadorPosicaoDiv) {
        const modelo = puxadorModeloSelect.value.trim().toLowerCase();
        if (modelo === '100 puxador' || modelo === 's/puxador' || modelo === 's/ puxador') {
          puxadorPosicaoDiv.style.display = 'none';
        } else {
          puxadorPosicaoDiv.style.display = '';
        }
      }
      
      const configAtualizada = obterConfiguracaoAtual();
      desenharPorta(configAtualizada, true);
    });
    
    // Garantir estado correto ao carregar
    setTimeout(() => {
      const puxadorPosicaoDiv = document.getElementById('puxadorPosicaoDiv');
      if (puxadorPosicaoDiv) {
        const modelo = puxadorModeloSelect.value.trim().toLowerCase();
        if (modelo === '100 puxador' || modelo === 's/puxador' || modelo === 's/ puxador') {
          puxadorPosicaoDiv.style.display = 'none';
        } else {
          puxadorPosicaoDiv.style.display = '';
        }
      }
    }, 0);
  }
  
  // Configurar select de lados do puxador para portas deslizantes
  const puxadorLadosSelect = document.getElementById('puxadorLados');
  if (puxadorLadosSelect) {
    puxadorLadosSelect.value = config.puxador?.lados || 'direito';
    puxadorLadosSelect.addEventListener('change', () => {
      const configAtual = obterConfiguracaoAtual();
      
      // Atualizar a configuração com o novo valor
      atualizarConfiguracao({ 
        puxador: { ...configAtual.puxador, lados: puxadorLadosSelect.value } 
      });
      
      // Obter a configuração atualizada e redesenhar
      const configAtualizada = obterConfiguracaoAtual();
      console.log('Configuração atualizada após mudança de lados:', configAtualizada);
      desenharPorta(configAtualizada, true);
    });
  }
  
  // Configurar select de medida do puxador
  const puxadorMedidaSelect = document.getElementById('puxadorMedida');
  const puxadorCotasCampos = document.getElementById('puxadorCotasCampos');
  const puxadorCotaSuperior = document.getElementById('puxadorCotaSuperior');
  const puxadorCotaInferior = document.getElementById('puxadorCotaInferior');
  
  if (puxadorMedidaSelect) {
    // Garantir que '150' seja o valor padrão, nunca usar 'Tamanho da Porta' como default
    const medidaPuxadorAtual = config.puxador?.medida;
    
    // Sempre usar '150' como valor padrão se não houver valor definido ou for 'Tamanho da Porta'
    if (!medidaPuxadorAtual || medidaPuxadorAtual === 'Tamanho da Porta' || 
        isNaN(parseInt(medidaPuxadorAtual, 10)) || parseInt(medidaPuxadorAtual, 10) < 100) {
      
      puxadorMedidaSelect.value = '150';
      
      // Atualizar configuração com o valor padrão
      atualizarConfiguracao({
        puxador: {
          ...config.puxador,
          medida: '150'
        }
      });
    } else {
      // Definir o valor do select com o valor atual da configuração
      puxadorMedidaSelect.value = medidaPuxadorAtual;
    }
    
    // Configurar valores iniciais das cotas
    if (puxadorCotaSuperior && puxadorCotaInferior) {
      // Garantir que a cota inferior seja sempre 1000mm para puxadores verticais
      const cotaInferiorDefault = 1000;
      
      // Definir valores iniciais
      puxadorCotaSuperior.value = config.puxador?.cotaSuperior || '950';
      puxadorCotaInferior.value = cotaInferiorDefault;
      
      // Atualizar configuração para garantir que cotaInferior seja 1000
      atualizarConfiguracao({
        puxador: {
          ...config.puxador,
          cotaInferior: cotaInferiorDefault
        }
      });
      
      // Adicionar listeners para as cotas
      puxadorCotaSuperior.addEventListener('change', () => {
        const configAtual = obterConfiguracaoAtual();
        
        // Certificar que o valor é um número positivo
        let valor = parseInt(puxadorCotaSuperior.value, 10);
        if (isNaN(valor) || valor < 0) {
          valor = 0;
        }
        puxadorCotaSuperior.value = valor;
        
        // Verificar se a medida não é "Tamanho da Porta"
        if (configAtual.puxador.medida !== 'Tamanho da Porta') {
          const alturaPuxador = parseInt(configAtual.puxador.medida, 10);
          
          // Calcular cota inferior para manter a altura total da porta
          const cotaInferior = Math.max(0, configAtual.altura - (valor + alturaPuxador));
          
          // Atualizar campo da cota inferior
          if (puxadorCotaInferior) {
            puxadorCotaInferior.value = cotaInferior;
          }
          
          // Atualizar configuração com ambas as cotas
          atualizarConfiguracao({
            puxador: {
              ...configAtual.puxador,
              cotaSuperior: valor,
              cotaInferior: cotaInferior
            }
          });
        } else {
          // Se for "Tamanho da Porta", apenas atualizar o valor
          atualizarConfiguracao({
            puxador: {
              ...configAtual.puxador,
              cotaSuperior: valor
            }
          });
        }
        
        const configAtualizada = obterConfiguracaoAtual();
        desenharPorta(configAtualizada, true);
      });
      
      puxadorCotaInferior.addEventListener('change', () => {
        const configAtual = obterConfiguracaoAtual();
        
        // Certificar que o valor é um número positivo
        let valor = parseInt(puxadorCotaInferior.value, 10);
        if (isNaN(valor) || valor < 0) {
          valor = 0;
        }
        puxadorCotaInferior.value = valor;
        
        // Verificar se a medida não é "Tamanho da Porta"
        if (configAtual.puxador.medida !== 'Tamanho da Porta') {
          const alturaPuxador = parseInt(configAtual.puxador.medida, 10);
          const cotaSuperiorAtual = configAtual.puxador.cotaSuperior || 0;
          
          // Verificar se a soma das cotas excede a altura da porta
          if (cotaSuperiorAtual + alturaPuxador + valor !== configAtual.altura) {
            // Ajustar a cota superior para manter a altura total
            const novaCotaSuperior = Math.max(0, configAtual.altura - (alturaPuxador + valor));
            
            // Atualizar campo da cota superior
            if (puxadorCotaSuperior) {
              puxadorCotaSuperior.value = novaCotaSuperior;
            }
            
            // Atualizar configuração com ambas as cotas
            atualizarConfiguracao({
              puxador: {
                ...configAtual.puxador,
                cotaSuperior: novaCotaSuperior,
                cotaInferior: valor
              }
            });
          }
          else {
            // Se a soma estiver correta, apenas atualizar a cota inferior
            atualizarConfiguracao({
              puxador: {
                ...configAtual.puxador,
                cotaInferior: valor
              }
            });
          }
        }
        else {
          // Se for "Tamanho da Porta", apenas atualizar o valor
          atualizarConfiguracao({
            puxador: {
              ...configAtual.puxador,
              cotaInferior: valor
            }
          });
        }
        
        const configAtualizada = obterConfiguracaoAtual();
        desenharPorta(configAtualizada, true);
      });
    }
    
    // Adicionar listener para o select de medida
    puxadorMedidaSelect.addEventListener('change', () => {
      const configAtual = obterConfiguracaoAtual();
      const novoValor = puxadorMedidaSelect.value;
      
      // Se mudar para uma medida específica, recentralizar automaticamente
      if (novoValor !== 'Tamanho da Porta' && novoValor !== 'Porta Inteira') {
        const alturaTotalPorta = configAtual.altura;
        const alturaPuxador = parseInt(novoValor, 10);
        
        // NOVO: Usar sistema de centralização automática
        const ehDeslizante = ehPortaDeslizante(configAtual.funcao);
        const ehGiro = ehPortaGiro(configAtual.funcao);
        
        let cotasRecentralizadas;
        if (ehDeslizante || ehGiro) {
          // Usar nova função de centralização
          cotasRecentralizadas = recalcularCotasParaCentralizar(alturaTotalPorta, alturaPuxador, ehDeslizante ? 'deslizante' : 'giro');
          
          console.log('[AUTO-CENTRALIZAR] Medida do puxador alterada - recentralizando:', {
            novoValor,
            alturaPuxador,
            alturaTotalPorta,
            tipoPorta: ehDeslizante ? 'deslizante' : 'giro',
            cotasRecentralizadas
          });
          
          // Atualizar campos de interface com valores centralizados
          if (puxadorCotaSuperior) {
            puxadorCotaSuperior.value = cotasRecentralizadas.cotaSuperior;
          }
          if (puxadorCotaInferior) {
            puxadorCotaInferior.value = cotasRecentralizadas.cotaInferior;
          }
          
          // Atualizar configuração
          atualizarConfiguracao({ 
            puxador: { 
              ...configAtual.puxador, 
              medida: novoValor,
              cotaSuperior: cotasRecentralizadas.cotaSuperior,
              cotaInferior: cotasRecentralizadas.cotaInferior
            } 
          });
        } else {
          // Para outros tipos de porta (lógica antiga)
          // Para puxador vertical, manter cota inferior fixa em 1000mm
          if (configAtual.puxador.posicao === 'vertical') {
            const cotaInferior = 1000;
            const cotaSuperior = alturaTotalPorta - (alturaPuxador + cotaInferior);
            
            // Atualizar campos de interface
            if (puxadorCotaSuperior) {
              puxadorCotaSuperior.value = cotaSuperior;
            }
            if (puxadorCotaInferior) {
              puxadorCotaInferior.value = cotaInferior;
            }
            
            // Atualizar configuração
            atualizarConfiguracao({ 
              puxador: { 
                ...configAtual.puxador, 
                medida: novoValor,
                cotaSuperior: cotaSuperior,
                cotaInferior: cotaInferior
              } 
            });
          }
          // Para puxador horizontal ou outros tipos
          // Caso especial para medida 150mm
          if (novoValor === '150') {
            const cotaInferior = 1000;
            const cotaSuperior = alturaTotalPorta - (alturaPuxador + cotaInferior);
            
            // Atualizar campos de interface
            if (puxadorCotaSuperior) {
              puxadorCotaSuperior.value = cotaSuperior;
            }
            if (puxadorCotaInferior) {
              puxadorCotaInferior.value = cotaInferior;
            }
            
            // Atualizar configuração
            atualizarConfiguracao({ 
              puxador: { 
                ...configAtual.puxador, 
                medida: novoValor,
                cotaSuperior: cotaSuperior,
                cotaInferior: cotaInferior
              } 
            });
          } else {
            // Para outras medidas, centralizar o puxador
            // Definir cota superior para posicionar o puxador verticalmente centralizado
            const cotaSuperior = Math.max(0, Math.round((alturaTotalPorta - alturaPuxador) / 2));
            
            // Calcular cota inferior a partir da cota superior e altura do puxador
            const cotaInferior = Math.max(0, alturaTotalPorta - (cotaSuperior + alturaPuxador));
            
            // Verificar e garantir que as cotas são válidas (soma deve ser igual à altura da porta)
            let cotaSupFinal = cotaSuperior;
            let cotaInfFinal = cotaInferior;
            
            // Se por algum motivo a soma não for igual à altura da porta, ajustar
            if (cotaSupFinal + alturaPuxador + cotaInfFinal !== alturaTotalPorta) {
              // Priorizar manter a cota superior e ajustar a inferior
              cotaInfFinal = alturaTotalPorta - (cotaSupFinal + alturaPuxador);
              if (cotaInfFinal < 0) {
                // Se a cota inferior ficou negativa, reduzir a superior
                cotaInfFinal = 0;
                cotaSupFinal = alturaTotalPorta - alturaPuxador;
              }
            }
            
            // Atualizar campos de interface
            if (puxadorCotaSuperior) {
              puxadorCotaSuperior.value = cotaSupFinal;
            }
            if (puxadorCotaInferior) {
              puxadorCotaInferior.value = cotaInfFinal;
            }
            
            // Atualizar configuração
            atualizarConfiguracao({ 
              puxador: { 
                ...configAtual.puxador, 
                medida: novoValor,
                cotaSuperior: cotaSupFinal,
                cotaInferior: cotaInfFinal
              } 
            });
          }
        }
      } else {
        // Caso esteja selecionando "Tamanho da Porta" ou "Porta Inteira"
        // Forçar a seleção para '150'
        puxadorMedidaSelect.value = '150';
        
        // Valores padrão para '150'
        const alturaPuxador = 150;
        const cotaInferior = 1000;
        const cotaSuperior = configAtual.altura - (alturaPuxador + cotaInferior);
        
        // Atualizar campos de interface
        if (puxadorCotaSuperior) {
          puxadorCotaSuperior.value = cotaSuperior;
        }
        if (puxadorCotaInferior) {
          puxadorCotaInferior.value = cotaInferior;
        }
        
        // Atualizar configuração
        atualizarConfiguracao({ 
          puxador: { 
            ...configAtual.puxador, 
            medida: '150',
            cotaSuperior: cotaSuperior,
            cotaInferior: cotaInferior
          } 
        });
      }
      
      const configAtualizada = obterConfiguracaoAtual();
      desenharPorta(configAtualizada, true);
    });
  }
  
  // Atualizar visibilidade do campo de posição ao mudar o tipo de porta
  const funcaoPorta = document.getElementById('funcaoPorta');
  if (funcaoPorta) {
    funcaoPorta.addEventListener('change', () => {
      const puxadorModeloSelect = document.getElementById('puxadorModelo');
      const puxadorPosicaoDiv = document.getElementById('puxadorPosicaoDiv');
      if (puxadorModeloSelect && puxadorPosicaoDiv) {
        const modelo = puxadorModeloSelect.value.trim().toLowerCase();
        const funcao = funcaoPorta.value;
        const ehDeslizante = ehPortaDeslizante(funcao);
        const ehBasculante = ehPortaBasculante(funcao);
        if (modelo === '100 puxador' || modelo === 's/puxador' || modelo === 's/ puxador' || ehBasculante) {
          puxadorPosicaoDiv.style.display = 'none';
        } else {
          puxadorPosicaoDiv.style.display = '';
        }
      }
    });
  }

  // Configurar select de posição do puxador
  // Novos checkboxes para posição do puxador
  const posicaoVertical = document.getElementById('posicaoVertical');
  const posicaoHorizontal = document.getElementById('posicaoHorizontal');
  const puxadorPosicaoSelect = document.getElementById('puxadorPosicao');
  
  // Configurar os checkboxes para funcionarem como radio buttons
  if (posicaoVertical && posicaoHorizontal) {
    // Inicializar estado dos checkboxes com base na configuração atual
    const posicaoAtual = config.puxador?.posicao || 'vertical';
    posicaoVertical.checked = posicaoAtual === 'vertical';
    posicaoHorizontal.checked = posicaoAtual === 'horizontal';
    
    // Quando Vertical é clicado
    posicaoVertical.addEventListener('change', () => {
      if (posicaoVertical.checked) {
        posicaoHorizontal.checked = false;
        puxadorPosicaoSelect.value = 'vertical';
        atualizarConfiguracao({
          puxador: {
            ...config.puxador,
            posicao: 'vertical'
          }
        });
        desenharPorta(obterConfiguracaoAtual(), true);
      } else {
        // Garantir que pelo menos um esteja selecionado
        if (!posicaoHorizontal.checked) {
          posicaoVertical.checked = true;
        }
      }
    });
    
    // Quando Horizontal é clicado
    posicaoHorizontal.addEventListener('change', () => {
      if (posicaoHorizontal.checked) {
        posicaoVertical.checked = false;
        puxadorPosicaoSelect.value = 'horizontal';
        atualizarConfiguracao({
          puxador: {
            ...config.puxador,
            posicao: 'horizontal'
          }
        });
        desenharPorta(obterConfiguracaoAtual(), true);
      } else {
        // Garantir que pelo menos um esteja selecionado
        if (!posicaoVertical.checked) {
          posicaoHorizontal.checked = true;
        }
      }
    });
  }
  
  // Manter o select original para compatibilidade com código existente
  if (puxadorPosicaoSelect) {
    // Converter valores antigos para os novos
    let posicaoAtual = config.puxador?.posicao || 'vertical';
    
    // Converter valores antigos para novos
    if (posicaoAtual === 'paralelo') {
      posicaoAtual = 'vertical';
    } else if (posicaoAtual === 'superior' || posicaoAtual === 'inferior') {
      posicaoAtual = 'horizontal';
    }
    
    // Usar a posição na configuração ao invés de forçar 'vertical'
    puxadorPosicaoSelect.value = posicaoAtual;
    
    // Forçar a atualização da configuração para garantir consistência
    atualizarConfiguracao({ 
      puxador: { ...config.puxador, posicao: posicaoAtual } 
    });
    
    // Inicializa a visibilidade dos campos de cota
    const cotasVertical = document.getElementById('cotasVertical');
    const cotasHorizontal = document.getElementById('cotasHorizontal');
    
    if (cotasVertical && cotasHorizontal) {
      // Ajustar a visibilidade dos campos de cota com base na posição configurada
      if (posicaoAtual === 'vertical') {
        cotasVertical.style.display = 'block';
        cotasHorizontal.style.display = 'none';
      } else {
        cotasVertical.style.display = 'none';
        cotasHorizontal.style.display = 'block';
      }
    }
    
    puxadorPosicaoSelect.addEventListener('change', () => {
      const configAtual = obterConfiguracaoAtual();
      const novaPosicao = puxadorPosicaoSelect.value;
      
      // Alternar visibilidade dos campos de cota
      if (cotasVertical && cotasHorizontal) {
        if (novaPosicao === 'vertical') {
          cotasVertical.style.display = 'block';
          cotasHorizontal.style.display = 'none';
          
          // Garantir que a cota inferior seja sempre 1000mm para puxadores verticais
          const cotaInferiorDefault = 1000;
          
          if (puxadorCotaInferior) {
            puxadorCotaInferior.value = cotaInferiorDefault;
          }
          
          // Atualizar configuração para posição vertical com cota inferior fixa
          atualizarConfiguracao({ 
            puxador: { 
              ...configAtual.puxador, 
              posicao: novaPosicao,
              cotaInferior: cotaInferiorDefault 
            } 
          });
        } else {
          cotasVertical.style.display = 'none';
          cotasHorizontal.style.display = 'block';
          
          // Atualizar configuração para horizontal
          // Não precisamos mais configurar o deslocamento, pois o puxador 
          // horizontal sempre será posicionado na parte inferior da porta
          atualizarConfiguracao({ 
            puxador: { ...configAtual.puxador, posicao: novaPosicao } 
          });
        }
      } else {
        // Se os elementos de cotas não estiverem disponíveis, apenas atualizar a posição
        atualizarConfiguracao({ 
          puxador: { ...configAtual.puxador, posicao: novaPosicao } 
        });
      }
      
      const configAtualizada = obterConfiguracaoAtual();
      desenharPorta(configAtualizada, true);
    });
  }
}

/**
 * Inicializa os controles de dobradiças
 */
function inicializarControlesDobradicasQtd() {
  // Obter configuração atual
  const config = obterConfiguracaoAtual();
  
  // Obter elementos do DOM
  const numDobradicasInput = document.getElementById('numDobradicasInput');
  const dobradicasPosicao = document.getElementById('dobradicasPosicao');
  
  if (numDobradicasInput) {
    // Obter número de dobradiças atual
    let numDobradicas = config.numDobradicas;
    if (numDobradicas === undefined || isNaN(numDobradicas)) {
      numDobradicas = 4; // Valor padrão
    }
    else if (numDobradicas < 0) {
      numDobradicas = 0;
    }
    else if (numDobradicas > 10) {
      numDobradicas = 10;
    }
    
    // Definir o valor no select
    numDobradicasInput.value = numDobradicas.toString();
    
    // Atualizar a configuração com o valor validado
    if (numDobradicas !== config.numDobradicas) {
      atualizarConfiguracao({ numDobradicas });
    }
    
    // Adicionar listener para mudanças
    numDobradicasInput.addEventListener('change', () => {
      // Obter o novo valor
      const novoValor = numDobradicasInput.value;
      
      // Se for S/Dobradiças, tratar como caso especial
      if (novoValor === 'S/Dobradiças') {
        atualizarConfiguracao({ 
          numDobradicas: 'S/Dobradiças',
          dobradicas: [] 
        });
        
        // Limpar campos de posições
        if (dobradicasPosicao) {
          dobradicasPosicao.innerHTML = '';
        }
      } else {
        // Para outros valores, manter a lógica existente
        const novoNumDobradicas = parseInt(novoValor, 10);
        if (isNaN(novoNumDobradicas) || novoNumDobradicas < 1) {
          numDobradicasInput.value = '1';
          atualizarConfiguracao({ numDobradicas: 1 });
        } else if (novoNumDobradicas > 10) {
          numDobradicasInput.value = '10';
          atualizarConfiguracao({ numDobradicas: 10 });
        } else {
          atualizarConfiguracao({ numDobradicas: novoNumDobradicas });
        }
        
        // Atualizar campos de posições de dobradiças
        if (novoNumDobradicas > 0) {
          // Verificar se as posições das dobradiças estão configuradas corretamente
          let needsRecalculation = false;
          
          // Se não existir array de dobradiças, ou tiver tamanho diferente
          if (!config.dobradicas || config.dobradicas.length !== novoNumDobradicas) {
            needsRecalculation = true;
          }
          
          // Se precisar recalcular, criar novo array de posições
          if (needsRecalculation) {
            const dobradicas = [];
            for (let i = 0; i < novoNumDobradicas; i++) {
              dobradicas.push(calcularPosicaoDefaultDobradica(i, novoNumDobradicas, config.altura));
            }
            atualizarConfiguracao({ dobradicas });
          }
          
          // Atualizar campos de interface
          atualizarCamposPosicoesDobradicasQtd(novoNumDobradicas);
        }
      }
      
      // Atualizar o desenho
      const configAtualizada = obterConfiguracaoAtual();
      desenharPorta(configAtualizada, true);
    });
    
    // Inicializar campos de posições
    if (numDobradicas > 0) {
      // Verificar se as posições das dobradiças estão configuradas corretamente para o padrão atual
      let needsRecalculation = false;
      
      // Se não existir array de dobradiças, ou tiver tamanho diferente do numDobradicas
      if (!config.dobradicas || config.dobradicas.length !== numDobradicas) {
        needsRecalculation = true;
      } 
      // Não forçamos mais o recálculo para posições que não estejam a 100mm das extremidades
      // isso permite que o usuário personalize livremente as posições das dobradiças
      
      // Se precisar recalcular, criar um novo array de posições
      if (needsRecalculation) {
        const dobradicas = [];
        for (let i = 0; i < numDobradicas; i++) {
          dobradicas.push(calcularPosicaoDefaultDobradica(i, numDobradicas, config.altura));
        }
        
        // Atualizar a configuração com as novas posições
        atualizarConfiguracao({ dobradicas });
      }
      
      // Atualizar os campos de interface
      atualizarCamposPosicoesDobradicasQtd(numDobradicas);
    }
    else if (dobradicasPosicao) {
      // Limpar campos se não houver dobradiças
      dobradicasPosicao.innerHTML = '';
    }
  }
}

/**
 * Calcula posições padrão para as dobradiças
 * @param {number} total - Número total de dobradiças
 * @param {number} alturaPorta - Altura da porta em mm
 * @returns {Array} - Array com as posições calculadas
 */
function calcularPosicaoDefaultDobradica(total, alturaPorta = 2100) {
  console.log(`Calculando posições para ${total} dobradiças em porta de ${alturaPorta}mm`);
  
  // Garantir que os parâmetros sejam números
  total = parseInt(total, 10);
  alturaPorta = parseInt(alturaPorta, 10);
  
  // Se não tiver dobradiças, retornar array vazio
  if (!total || total <= 0) {
    return [];
  }
  
  // Distância fixa das extremidades (topo e base) apenas para o cálculo inicial
  const distanciaExtremidade = 100;
  
  // Espaço disponível entre a primeira e a última dobradiça
  const espacoDisponivel = alturaPorta - (2 * distanciaExtremidade);
  
  // Calcular divisões do espaço disponível
  const numDivisoes = total - 1;
  const tamanhoDivisao = numDivisoes > 0 ? espacoDisponivel / numDivisoes : 0;
  
  // Array para armazenar as posições
  const posicoes = [];
  
  // Calcular a posição de cada dobradiça
  for (let i = 0; i < total; i++) {
    let posicao;
    
    if (i === 0) {
      // Primeira dobradiça sempre na distância fixa do topo (valor padrão inicial)
      posicao = distanciaExtremidade;
    }
    else if (i === total - 1) {
      // Última dobradiça sempre na distância fixa da base (valor padrão inicial)
      posicao = alturaPorta - distanciaExtremidade;
    }
    else {
      // Dobradiças intermediárias distribuídas uniformemente
      posicao = Math.round(distanciaExtremidade + (i * tamanhoDivisao));
    }
    
    posicoes.push(posicao);
  }
  
  // Log para debug
  console.log('Posições calculadas:', posicoes.join(', '));
  
  return posicoes;
}

/**
 * Atualiza os campos de posição das dobradiças no formulário
 * @param {number} qtd - Quantidade de dobradiças
 * @param {Array} posicoesPredefinidas - Posições predefinidas (opcional)
 */
function atualizarCamposPosicoesDobradicasQtd(qtd, posicoesPredefinidas = null) {
  console.log(`Atualizando campos para ${qtd} dobradiças${posicoesPredefinidas ? ' com posições predefinidas' : ''}`);
  
  // Validar parâmetro
  if (qtd === undefined || qtd === null || isNaN(qtd)) {
    console.error('Quantidade de dobradiças inválida:', qtd);
    return;
  }
  
  qtd = parseInt(qtd, 10);
  
  // Obter configuração atual
  const config = obterConfiguracaoAtual();
  
  // Container onde ficam os campos de dobradiças
  const container = document.getElementById('dobradicasCampos');
  if (!container) {
    console.error('Container de dobradiças não encontrado');
    return;
  }
  
  // Limpar campos anteriores
  container.innerHTML = '';
  
  // Se não tiver dobradiças, parar aqui
  if (qtd <= 0) {
    console.log('Nenhuma dobradiça, limpando campos');
    
    // Atualizar configuração
    atualizarConfiguracao({
      dobradicas: []
    });
    
    return;
  }
  
  // Calcular posições padrão ou usar as predefinidas
  let posicoes;
  if (posicoesPredefinidas && Array.isArray(posicoesPredefinidas) && posicoesPredefinidas.length >= qtd) {
    posicoes = posicoesPredefinidas.slice(0, qtd);
    console.log('Usando posições predefinidas:', posicoes.join(', '));
  }
  else {
    // Calcular novas posições com base na altura atual
    posicoes = calcularPosicaoDefaultDobradica(qtd, config.altura);
    console.log('Posições calculadas:', posicoes.join(', '));
  }
  
  // Criar nova configuração de dobradiças
  const novasDobradicas = [];
  
  // Criar campos para cada dobradiça
  for (let i = 0; i < qtd; i++) {
    // Criar linha para a dobradiça
    const dobradicaRow = document.createElement('div');
    dobradicaRow.className = 'input-group mb-2';
    dobradicaRow.style.marginBottom = '4px'; // Reduz pela metade o espaçamento entre as caixas (de 8px para 4px)
    
    // Criar label
    const label = document.createElement('span');
    label.className = 'input-group-text';
    label.innerText = `${i+1} Dob:`;
    // Estilo isolado apenas para este elemento
    label.style.width = '65px';
    label.style.textAlign = 'left';
    label.style.fontWeight = '500';
    label.style.letterSpacing = '0.5px';
    label.style.fontSize = '0.8rem'; // Reduzido de 0.85rem para 0.8rem
    label.style.height = '20px'; // Reduzido de 25px para 20px
    label.style.padding = '2px 8px'; // Mantém o padding para boa aparência
    
    // Criar input
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'form-control';
    input.style.height = '20px'; // Reduzido de 25px para 20px
    input.style.fontSize = '0.8rem'; // Adiciona tamanho de fonte reduzido
    input.id = `dobradicaPos${i+1}`;
    input.min = '0';
    input.max = config.altura.toString();
    input.value = posicoes[i].toString();
    input.title = `Distância em mm da borda superior da porta até a dobradiça ${i+1}`;
    
    // Adicionar evento para atualizar a configuração quando o valor mudar
    input.addEventListener('change', function () {
      const val = parseInt(this.value, 10);
      
      // Validar valor
      if (isNaN(val) || val < 0 || val > config.altura) {
        this.value = posicoes[i];
        return;
      }
      
      // Atualizar array temporário
      novasDobradicas[i] = val;
      
      // Ordenar array para garantir que as dobradiças estejam em ordem
      const dobSorted = [...novasDobradicas].sort((a, b) => a - b);
      
      // Atualizar configuração
      atualizarConfiguracao({
        dobradicas: dobSorted
      });
      
      // Atualizar desenho
      atualizarDesenho();
    });
    
    // Adicionar valor inicial ao array de dobradiças
    novasDobradicas.push(posicoes[i]);
    
    // Adicionar elementos à linha
    dobradicaRow.appendChild(label);
    dobradicaRow.appendChild(input);
    
    // Adicionar linha ao container
    container.appendChild(dobradicaRow);
  }
  
  // Atualizar configuração com as novas posições
  atualizarConfiguracao({
    dobradicas: novasDobradicas
  });
  
  // Atualizar desenho
  atualizarDesenho();
}

// Exportar função globalmente para acesso de outros módulos
window.atualizarCamposPosicoesDobradicasQtd = atualizarCamposPosicoesDobradicasQtd;
console.log('[DEBUG] Função atualizarCamposPosicoesDobradicasQtd exportada globalmente');

/**
 * Configura validação para o formulário
 */
function configurarValidacaoFormulario() {
  // Campo de largura
  const larguraInput = document.getElementById('larguraInput');
  if (larguraInput) {
    larguraInput.min = '200';
    larguraInput.max = '1500';
    larguraInput.addEventListener('blur', validarLargura);
  }
  
  // Campo de altura
  const alturaInput = document.getElementById('alturaInput');
  if (alturaInput) {
    alturaInput.min = '200';
    alturaInput.max = '3000';
    alturaInput.addEventListener('blur', validarAltura);
  }
}

/**
 * Valida o campo de largura
 */
function validarLargura() {
  const min = 200;
  const max = 1500;
  const input = document.getElementById('larguraInput');
  
  if (!input || !input.value) {
    return;
  }
  
  // Cancelar qualquer timeout anterior
  if (updateTimeoutId) {
    clearTimeout(updateTimeoutId);
  }
  
  let valor = parseInt(input.value);
  if (isNaN(valor)) {
    // Substituir alert por mostrarErroValidacao
    if (typeof window.mostrarErroValidacao === 'function') {
      window.mostrarErroValidacao(input, 'Por favor, insira um número válido para a largura.');
    }
    input.value = obterConfiguracaoAtual().largura;
    return;
  }
  
  if (valor < min) {
    // Substituir alert por mostrarErroValidacao
    if (typeof window.mostrarErroValidacao === 'function') {
      window.mostrarErroValidacao(input, `A largura mínima é de ${min}mm.`);
    }
    valor = min;
    input.value = min;
  }
  else if (valor > max) {
    // Substituir alert por mostrarErroValidacao
    if (typeof window.mostrarErroValidacao === 'function') {
      window.mostrarErroValidacao(input, `A largura máxima é de ${max}mm.`);
    }
    valor = max;
    input.value = max;
  }
  else {
    // Limpar erro quando o valor está correto
    if (typeof window.removerErroValidacao === 'function') {
      window.removerErroValidacao(input);
    }
  }
  
  // CORREÇÃO PRINCIPAL: Sempre força redesenho completo
  const configAtual = obterConfiguracaoAtual();
  const larguraAntiga = configAtual.largura;
  
  if (larguraAntiga !== valor) {
    // Atualizar configuração
    configAtual.largura = valor;
    atualizarConfiguracao(configAtual);
    
    // FORÇAR REDESENHO COMPLETO - esta é a chave da correção
    // Limpar SVG primeiro para garantir que não há elementos antigos
    if (typeof window.limparSVG === 'function') {
      window.limparSVG();
    }
    
    // Redesenhar porta com nova configuração
    setTimeout(() => {
      const configNova = obterConfiguracaoAtual();
      if (typeof window.desenharPorta === 'function') {
        window.desenharPorta(configNova, true);
      } else if (typeof window.atualizarDesenho === 'function') {
        window.atualizarDesenho(configNova);
      }
    }, 10);
  } else {
    // Mesmo se não houve mudança, garantir que o desenho está correto
    desenharPorta(configAtual, true);
  }
}

/**
 * Recalcula as posições do puxador quando a altura ou largura da porta muda
 * @param {number} alturaAntiga - Altura anterior da porta em mm
 * @param {number} alturaNova - Nova altura da porta em mm
 * @param {number} larguraAntiga - Largura anterior da porta em mm (opcional)
 * @param {number} larguraNova - Nova largura da porta em mm (opcional)
 */
// NOTA: Funções de recálculo removidas - agora usamos redesenho completo
// Isso garante que todas as coordenadas sejam recalculadas corretamente

/**
 * Valida o campo de altura
 */
function validarAltura() {
  const min = 300;
  const max = 3000;
  const input = document.getElementById('alturaInput');
  
  if (!input || !input.value) {
    return;
  }
  
  // Cancelar qualquer timeout anterior
  if (updateTimeoutId) {
    clearTimeout(updateTimeoutId);
  }
  
  let valor = parseInt(input.value);
  if (isNaN(valor)) {
    // Substituir alert por mostrarErroValidacao
    if (typeof window.mostrarErroValidacao === 'function') {
      window.mostrarErroValidacao(input, 'Por favor, insira um número válido para a altura.');
    }
    input.value = obterConfiguracaoAtual().altura;
    return;
  }
  
  if (valor < min) {
    // Substituir alert por mostrarErroValidacao
    if (typeof window.mostrarErroValidacao === 'function') {
      window.mostrarErroValidacao(input, `A altura mínima é de ${min}mm.`);
    }
    valor = min;
    input.value = min;
  }
  else if (valor > max) {
    // Substituir alert por mostrarErroValidacao
    if (typeof window.mostrarErroValidacao === 'function') {
      window.mostrarErroValidacao(input, `A altura máxima é de ${max}mm.`);
    }
    valor = max;
    input.value = max;
  }
  else {
    // Limpar erro quando o valor está correto
    if (typeof window.removerErroValidacao === 'function') {
      window.removerErroValidacao(input);
    }
  }
  
  // CORREÇÃO PRINCIPAL: Sempre força redesenho completo
  const configAtual = obterConfiguracaoAtual();
  const alturaAntiga = configAtual.altura;
  
  if (alturaAntiga !== valor) {
    // Atualizar configuração
    configAtual.altura = valor;
    atualizarConfiguracao(configAtual);
    
    // FORÇAR REDESENHO COMPLETO - esta é a chave da correção
    // Limpar SVG primeiro para garantir que não há elementos antigos
    if (typeof window.limparSVG === 'function') {
      window.limparSVG();
    }
    
    // Redesenhar porta com nova configuração
    setTimeout(() => {
      const configNova = obterConfiguracaoAtual();
      if (typeof window.desenharPorta === 'function') {
        window.desenharPorta(configNova, true);
      } else if (typeof window.atualizarDesenho === 'function') {
        window.atualizarDesenho(configNova);
      }
    }, 10);
  } else {
    // Mesmo se não houve mudança, garantir que o desenho está correto
    desenharPorta(configAtual, true);
  }
}

/**
 * Inicializa os modais da aplicação
 */
function inicializarModais() {
  // Inicializar o modal de observações
  inicializarModalObservacoes();
  
  // Botões de abertura de modal (para modais antigos sem Bootstrap)
  const botoesAbrirModal = document.querySelectorAll('[data-toggle="modal"]');
  
  botoesAbrirModal.forEach(botao => {
    const targetId = botao.getAttribute('data-target');
    const modal = document.querySelector(targetId);
    
    if (modal) {
      botao.addEventListener('click', () => {
        modal.style.display = 'block';
      });
      
      // Botões de fechar modal
      const botoesFechar = modal.querySelectorAll('.close-modal, [data-dismiss="modal"]');
      
      botoesFechar.forEach(botaoFechar => {
        botaoFechar.addEventListener('click', () => {
          modal.style.display = 'none';
        });
      });
      
      // Fechar modal ao clicar fora
      window.addEventListener('click', (event) => {
        if (event.target === modal) {
          modal.style.display = 'none';
        }
      });
    }
  });
}

/**
 * Inicializa o modal de observações
 */
function inicializarModalObservacoes() {
  // Referência ao modal
  const observacoesModal = document.getElementById('observacoesModal');
  
  if (!observacoesModal) {
    return;
  }
  
  // Verificar se o Bootstrap está disponível no escopo global
  const bootstrapDisponivel = typeof bootstrap !== 'undefined';
  
  if (bootstrapDisponivel) {
    // Usar Bootstrap para gerenciar o modal
    let observacoesModalInstance = bootstrap.Modal.getInstance(observacoesModal);
    if (!observacoesModalInstance) {
      observacoesModalInstance = new bootstrap.Modal(observacoesModal, {
        backdrop: true,
        keyboard: true,
        focus: true
      });
    }
    
    // Lidar com o evento de fechamento
    observacoesModal.addEventListener('hidden.bs.modal', function () {
      // Certificar-se de que os elementos de backdrop foram removidos
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
      
      // Remover a classe 'modal-open' do corpo para permitir rolagem
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    });
    
    // Configurar botões para uso com Bootstrap
    const btnClose = observacoesModal.querySelector('.btn-close');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        observacoesModalInstance.hide();
      });
    }
    
    const btnFechar = observacoesModal.querySelector('.modal-footer .btn-secondary');
    if (btnFechar) {
      btnFechar.addEventListener('click', () => {
        observacoesModalInstance.hide();
      });
    }
    
    const btnSalvarObservacoes = document.getElementById('btnSalvarObservacoes');
    if (btnSalvarObservacoes) {
      btnSalvarObservacoes.addEventListener('click', () => {
        const observacaoInput = document.getElementById('observacaoInput');
        if (observacaoInput) {
          salvarObservacoes(observacaoInput.value);
          observacoesModalInstance.hide();
        }
      });
    }
  }
  else {
    // Método alternativo sem Bootstrap
    console.warn('Bootstrap não disponível, usando método alternativo para o modal');
    
    // Função para abrir o modal manualmente
    window.abrirModalObservacoes = function () {
      const config = obterConfiguracaoAtual();
      const observacaoInput = document.getElementById('observacaoInput');
      
      if (observacaoInput) {
        observacaoInput.value = config.observacao || '';
      }
      
      observacoesModal.style.display = 'block';
      observacoesModal.classList.add('show');
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      
      // Criar backdrop manualmente
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    };
    
    // Função para fechar o modal manualmente
    window.fecharModalObservacoes = function () {
      observacoesModal.style.display = 'none';
      observacoesModal.classList.remove('show');
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      
      // Remover backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    };
    
    // Substituir atributos data-bs-* por eventos de clique
    const modalTrigger = document.getElementById('btnAbrirObservacoes');
    if (modalTrigger) {
      modalTrigger.removeAttribute('data-bs-toggle');
      modalTrigger.removeAttribute('data-bs-target');
      modalTrigger.addEventListener('click', window.abrirModalObservacoes);
    }
    
    // Configurar botões para o método alternativo
    const btnClose = observacoesModal.querySelector('.btn-close');
    if (btnClose) {
      btnClose.removeAttribute('data-bs-dismiss');
      btnClose.addEventListener('click', window.fecharModalObservacoes);
    }
    
    const btnFechar = observacoesModal.querySelector('.modal-footer .btn-secondary');
    if (btnFechar) {
      btnFechar.removeAttribute('data-bs-dismiss');
      btnFechar.addEventListener('click', window.fecharModalObservacoes);
    }
    
    const btnSalvarObservacoes = document.getElementById('btnSalvarObservacoes');
    if (btnSalvarObservacoes) {
      btnSalvarObservacoes.removeAttribute('data-bs-dismiss');
      btnSalvarObservacoes.addEventListener('click', () => {
        const observacaoInput = document.getElementById('observacaoInput');
        if (observacaoInput) {
          salvarObservacoes(observacaoInput.value);
          window.fecharModalObservacoes();
        }
      });
    }
    
    // Fechar modal ao clicar no backdrop
    observacoesModal.addEventListener('click', function (event) {
      if (event.target === observacoesModal) {
        window.fecharModalObservacoes();
      }
    });
  }
  
  // Configurar o campo de observação com limite de 85 caracteres (comum a ambos os métodos)
  const observacaoInput = document.getElementById('observacaoInput');
  if (observacaoInput) {
    observacaoInput.maxLength = 85;
    observacaoInput.addEventListener('input', function () {
      if (this.value.length > 85) {
        this.value = this.value.slice(0, 85);
      }
    });
  }
}

/**
 * Função auxiliar para salvar observações
 */
function salvarObservacoes(texto) {
  const configAtual = obterConfiguracaoAtual();
  configAtual.observacao = texto;
  atualizarConfiguracao(configAtual);
  desenharPorta(configAtual, true);
  mostrarNotificacao('Observações salvas com sucesso', 'success');
}

/**
 * Inicializa o seletor de logo da empresa
 */
function inicializarSeletorLogo() {
  const logoFileInput = document.getElementById('logoFile');
  
  if (logoFileInput) {
    logoFileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      
      if (file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const logoUrl = e.target.result;
          
          // Atualizar imagem no cabeçalho
          const logoImage = document.getElementById('logoImage');
          if (logoImage) {
            logoImage.src = logoUrl;
          }
          
          // Atualizar imagem no cabeçalho de impressão
          const logoImpressao = document.getElementById('print-logo');
          if (logoImpressao) {
            logoImpressao.src = logoUrl;
          }
          
          // Salvar logo no localStorage
          try {
            salvarLogoNoStorage(logoUrl);
            mostrarNotificacao('Logo atualizado com sucesso', 'success');
          }
          catch (error) {
            console.error('Erro ao salvar logo:', error);
            mostrarNotificacao('Erro ao salvar logo. A imagem pode ser muito grande.', 'error');
          }
        };
        
        reader.onerror = () => {
          mostrarNotificacao('Erro ao ler o arquivo de imagem', 'error');
        };
        
        reader.readAsDataURL(file);
      }
    });
  }
}

/**
 * Força a atualização das posições das dobradiças com base na altura e quantidade
 * @param {number} altura - Altura da porta em mm
 * @param {number} numDobradicas - Número de dobradiças
 */
function forcaAtualizacaoDobradicas(altura, numDobradicas) {
  console.log(`Forçando atualização de ${numDobradicas} dobradiças para altura ${altura}mm`);
  
  // Verificar se os parâmetros são válidos
  if (!altura || !numDobradicas || isNaN(altura) || isNaN(numDobradicas)) {
    console.error('Parâmetros inválidos para forçar atualização das dobradiças');
    return;
  }
  
  // Primeiramente, recalcular as posições das dobradiças com a função correta
  const posicoes = calcularPosicaoDefaultDobradica(parseInt(numDobradicas), parseInt(altura));
  
  if (!posicoes || !posicoes.length) {
    console.error('Não foi possível calcular as posições das dobradiças');
    return;
  }
  
  // Mostrar no console as posições calculadas
  console.log('Posições calculadas:', posicoes);
  
  // Atualizar os campos do formulário e a configuração
  atualizarCamposPosicoesDobradicasQtd(numDobradicas, posicoes);
  
  // Atualizar a configuração diretamente também
  atualizarConfiguracao({
    dobradicas: posicoes
  });
  
  // Atualizar o desenho
  atualizarDesenho();
}

// Expor a função globalmente
window.forcaAtualizacaoDobradicas = forcaAtualizacaoDobradicas;

/**
 * Função para determinar o número de dobradiças para portas basculantes com base na largura
 * 
 * Regras para determinação do número de dobradiças em portas basculantes:
 * - Largura de 200mm a 600mm: 2 dobradiças
 * - Largura de 601mm a 1000mm: 3 dobradiças
 * - Largura de 1001mm a 1500mm: 4 dobradiças
 * 
 * @param {number} largura - Largura da porta em mm
 * @returns {number} - Número de dobradiças
 */
function definirNumeroDobradicasBasculante(largura) {
  console.log('Definindo número de dobradiças para porta basculante com base na largura:', largura);
  
  let numDobradicasNovo;
  
  if (largura >= 200 && largura <= 900) {
    numDobradicasNovo = 2;
  } else if (largura > 900 && largura <= 1500) {
    numDobradicasNovo = 3;
  } else if (largura > 1500 && largura <= 2600) {
    numDobradicasNovo = 4;
  } else if (largura > 2600 && largura <= 3000) {
    numDobradicasNovo = 5;
  } else {
    // Para larguras fora dos intervalos definidos, usar 2 dobradiças como padrão
    numDobradicasNovo = 2;
  }
  
  console.log(`Largura ${largura}mm: definindo ${numDobradicasNovo} dobradiças para porta basculante`);
  return numDobradicasNovo;
}

/**
 * Função para determinar e atualizar o número de dobradiças com base na altura da porta
 * Esta função é exposta globalmente e chamada quando a altura é alterada
 * 
 * Regras para determinação do número de dobradiças:
 * - Altura de 200mm a 900mm: 2 dobradiças
 * - Altura de 901mm a 1500mm: 3 dobradiças
 * - Altura de 1501mm a 2600mm: 4 dobradiças
 * - Altura de 2601mm a 3000mm: 5 dobradiças
 * - Para alturas fora desses intervalos: 2 dobradiças (padrão)
 * 
 * @param {number} altura - Altura da porta em mm
 */
function definirNumeroDobradicas(altura) {
  console.log('Definindo número de dobradiças com base na altura:', altura);
  
  // Obter a configuração atual para verificar o tipo de porta
  const configAtual = obterConfiguracaoAtual();
  
  // Se for porta basculante, usar a função específica baseada na largura
  if (configAtual && configAtual.funcao === 'basculante') {
    console.log('Porta basculante: definindo dobradiças com base na largura');
    
    // Obter o valor atual selecionado pelo usuário
    const numDobradicasInput = document.getElementById('numDobradicasInput');
    const valorAtual = numDobradicasInput ? parseInt(numDobradicasInput.value, 10) : 0;
    
    // Usar a largura da porta para determinar o número de dobradiças
    const largura = configAtual.largura || 800;
    const numDobradicasCalculado = definirNumeroDobradicasBasculante(largura);
    
    // Comparar o valor calculado com o valor atual no input
    // Se forem diferentes, o usuário pode ter alterado manualmente
    // Apenas atualizamos se o valor for igual ou se o input estiver vazio
    if (!numDobradicasInput || isNaN(valorAtual) || valorAtual === numDobradicasCalculado) {
      // Atualizar o input no formulário
      if (numDobradicasInput) {
        numDobradicasInput.value = numDobradicasCalculado.toString();
      }
      
      // Atualizar configuração
      atualizarConfiguracao({ numDobradicas: numDobradicasCalculado });
      
      // Atualizar campos de dobradiças se necessário
      if (typeof window.atualizarCamposPosicoesDobradicasQtd === 'function') {
        window.atualizarCamposPosicoesDobradicasQtd(numDobradicasCalculado);
      }
    }
    
    return;
  }
  
  // Definir o número de dobradiças com base na altura
  let numDobradicasNovo;
  
  if (altura >= 200 && altura <= 900) {
    numDobradicasNovo = 2;
  } else if (altura > 900 && altura <= 1500) {
    numDobradicasNovo = 3;
  } else if (altura > 1500 && altura <= 2600) {
    numDobradicasNovo = 4;
  } else if (altura > 2600 && altura <= 3000) {
    numDobradicasNovo = 5;
  } else {
    // Para alturas fora dos intervalos definidos, usar a regra padrão
    numDobradicasNovo = 2;
  }
  
  console.log(`Altura ${altura}mm: definindo ${numDobradicasNovo} dobradiças`);
  
  const numDobradicasInput = document.getElementById('numDobradicasInput');
  if (numDobradicasInput) {
    numDobradicasInput.value = numDobradicasNovo.toString();
    
    // Atualizar configuração
    atualizarConfiguracao({ numDobradicas: numDobradicasNovo });
    
    // Atualizar campos de dobradiças se necessário
    if (typeof window.atualizarCamposPosicoesDobradicasQtd === 'function') {
      window.atualizarCamposPosicoesDobradicasQtd(numDobradicasNovo);
    }
  }
}

// Exportar função globalmente
window.definirNumeroDobradicas = definirNumeroDobradicas;

// Exportar funções
export {
  inicializarControles,
  inicializarModais,
  inicializarSeletorLogo,
  toggleFuncaoPorta,
  desenharPorta,
  calcularPosicaoDefaultDobradica,
  atualizarCamposPosicoesDobradicasQtd
};

// Também disponibilizar globalmente
window.calcularPosicaoDefaultDobradica = calcularPosicaoDefaultDobradica;
window.definirNumeroDobradicasBasculante = definirNumeroDobradicasBasculante; 

/**
 * Popula o select de modelos de puxador com dados do Supabase.
 * Vibecode: Esta função busca modelos distintos da tabela 'puxadores'
 * e atualiza o dropdown no formulário principal.
 */
async function popularPuxadoresSelect() {
  // console.log('[DEBUG Vibecode] Iniciando popularPuxadoresSelect...'); // Log 1: Removido
  const puxadorModeloSelect = document.getElementById('puxadorModelo');
  if (!puxadorModeloSelect) {
    console.error('[ERRO Vibecode] Select de modelo de puxador (#puxadorModelo) não encontrado.');
    return;
  }
  // console.log('[DEBUG Vibecode] Elemento #puxadorModelo encontrado:', puxadorModeloSelect); // Log 2: Removido

  // Limpar opções existentes e adicionar a opção padrão "Sem Puxador"
  puxadorModeloSelect.innerHTML = '<option value="S/Puxador">S/Puxador</option>';

  // Verificar se o cliente Supabase está pronto
  // console.log('[DEBUG Vibecode] Verificando window.supabaseClient:', window.supabaseClient); // Log 3: Removido
  if (!window.supabaseClient) {
    console.error('[ERRO Vibecode] Cliente Supabase não está disponível para carregar puxadores.');
    mostrarNotificacao('Erro ao conectar com banco de dados para carregar puxadores.', 'error');
    return;
  }

  try {
    console.log('[INFO Vibecode] Buscando modelos de puxadores no Supabase...');
    const { data, error } = await window.supabaseClient
      .from('puxadores')
      .select('modelo, foto') // Vibecode: Incluído campo 'foto'
      .order('modelo'); // Ordena para consistência

    // console.log('[DEBUG Vibecode] Resultado da query Supabase:', { data, error }); // Log 4: Removido

    if (error) {
      console.error('[ERRO Vibecode] Erro ao buscar modelos de puxadores:', error);
      mostrarNotificacao(`Erro ao carregar modelos: ${error.message}`, 'error');
      return;
    }

    if (!data || data.length === 0) {
      console.warn('[AVISO Vibecode] Nenhum modelo de puxador encontrado na tabela \'puxadores\'. Select conterá apenas "S/Puxador".');
      // console.log('[DEBUG Vibecode] Finalizando popularPuxadoresSelect (sem dados).'); // Log 5a: Removido
      return; // Mantém apenas a opção "S/Puxador"
    }

    // Obter modelos únicos, mantendo a primeira URL de foto encontrada para cada modelo
    const modelosMap = new Map();
    data.forEach(item => {
        if (item.modelo && !modelosMap.has(item.modelo)) {
            modelosMap.set(item.modelo, item.foto || ''); // Armazena modelo e URL da foto (ou string vazia)
        }
    });
    const modelosUnicos = [...modelosMap.keys()].sort();
    // console.log('[DEBUG Vibecode] Modelos únicos encontrados:', modelosUnicos); // Log 6: Removido

    // Popular o select com os modelos únicos
    modelosUnicos.forEach(modelo => {
      if (modelo) { // Evitar adicionar opções vazias/nulas se existirem na DB
        const option = document.createElement('option');
        option.value = modelo;
        option.textContent = modelo;
        // Vibecode: Adicionar atributo data com a URL da foto correspondente
        option.setAttribute('data-foto-url', modelosMap.get(modelo)); 
        puxadorModeloSelect.appendChild(option);
      }
    });

    console.log(`[INFO Vibecode] ${modelosUnicos.length} modelos de puxadores carregados no select.`);

    // Tentar selecionar o valor padrão ou o primeiro modelo disponível
    const configAtual = window.obterConfiguracaoAtual ? window.obterConfiguracaoAtual() : {};
    const modeloSalvo = configAtual.puxador?.modelo;
    // console.log('[DEBUG Vibecode] Tentando selecionar valor. Salvo:', modeloSalvo); // Log 7: Removido

    if (modeloSalvo && modelosUnicos.includes(modeloSalvo)) {
        puxadorModeloSelect.value = modeloSalvo;
    } else if (modelosUnicos.length > 0) {
        if (puxadorModeloSelect.options.length > 1) {
             puxadorModeloSelect.value = modelosUnicos[0];
        } else {
             puxadorModeloSelect.value = "S/Puxador";
        }
    } else {
       puxadorModeloSelect.value = "S/Puxador";
    }
    // console.log('[DEBUG Vibecode] Valor final selecionado:', puxadorModeloSelect.value); // Log 8: Removido
     // Disparar evento change para atualizar a UI/desenho se necessário
     puxadorModeloSelect.dispatchEvent(new Event('change'));


  } catch (catchError) {
    console.error('[ERRO Vibecode] Exceção ao popular select de puxadores:', catchError); // Log 9: Erro no catch
    mostrarNotificacao('Erro inesperado ao carregar modelos de puxadores.', 'error');
  }
  // console.log('[DEBUG Vibecode] Finalizando popularPuxadoresSelect (com dados ou erro tratado).'); // Log 5b: Removido
}


/**
 * Popula o select de modelos deslizantes com dados do Supabase
 */
async function popularModelosDeslizantesSelect() {
  const modeloSelect = document.getElementById('modeloDeslizante');
  if (!modeloSelect) {
    console.error('[ERRO Vibecode] Select de modelo deslizante (#modeloDeslizante) não encontrado.');
    return;
  }

  // Verificar se o cliente Supabase está pronto
  if (!window.supabaseClient) {
    console.error('[ERRO Vibecode] Cliente Supabase não está disponível para carregar trilhos.');
    return;
  }

  try {
    console.log('[INFO Vibecode] Buscando modelos de trilhos no Supabase...');
    const { data, error } = await window.supabaseClient
      .from('trilhos')
      .select('nome, tipo')
      .order('nome');

    if (error) {
      console.error('[ERRO Vibecode] Erro ao buscar modelos de trilhos:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.warn('[AVISO Vibecode] Nenhum modelo de trilho encontrado na tabela \'trilhos\'.');
      return;
    }

    // Limpar select e popular com trilhos do banco
    modeloSelect.innerHTML = '';
    
    data.forEach(trilho => {
      if (trilho.nome) {
        const option = document.createElement('option');
        option.value = trilho.nome;
        option.textContent = trilho.nome;
        modeloSelect.appendChild(option);
      }
    });

    console.log(`[INFO Vibecode] ${data.length} modelos de trilhos carregados no select.`);

    // Tentar selecionar o valor padrão
    const configAtual = window.obterConfiguracaoAtual ? window.obterConfiguracaoAtual() : {};
    const modeloSalvo = configAtual.modeloDeslizante;
    
    if (modeloSalvo && data.some(t => t.nome === modeloSalvo)) {
      modeloSelect.value = modeloSalvo;
    } else if (data.length > 0) {
      modeloSelect.value = data[0].nome;
    }

    // Disparar evento change para atualizar a UI
    modeloSelect.dispatchEvent(new Event('change'));

  } catch (catchError) {
    console.error('[ERRO Vibecode] Exceção ao popular select de trilhos:', catchError);
  }
}

/**
 * Inicializa os controles da UI (inputs, selects, botões).
 */
export function inicializarControlesUI() {
  // console.log('[DEBUG Vibecode] ==> EXECUTANDO inicializarControlesUI <=='); // Log A: Removido

  const checkPuxadorModelo = document.getElementById('puxadorModelo');
  if (checkPuxadorModelo) {
    // console.log('[DEBUG Vibecode] Elemento #puxadorModelo JÁ EXISTE no DOM antes da chamada.'); // Log B: Removido
  } else {
    console.error('[ERRO Vibecode] Elemento #puxadorModelo NÃO existe no DOM antes da chamada!');
  }

  console.log('[INFO Vibecode] Inicializando controles da UI...');
  // console.log('[DEBUG Vibecode] Antes de chamar popularPuxadoresSelect.'); // Log 10: Removido

  // Popula o select de puxadores com dados do Supabase
  // Chamada agora é assíncrona, mas não esperamos aqui, deixamos popular em background.
  popularPuxadoresSelect(); // Vibecode: Chamada adicionada para carregar modelos dinamicamente
  
  // Popula o select de modelos deslizantes com dados do Supabase
  popularModelosDeslizantesSelect(); // Vibecode: Carregar trilhos do banco

  // console.log('[DEBUG Vibecode] Depois de chamar popularPuxadoresSelect (não aguardou).'); // Log 11: Removido

  // Mapeamento de IDs para funções de tratamento
  const handlers = {
    // ... (outros handlers existentes) ...
    'larguraInput': handleMedidaChange,
    'alturaInput': handleMedidaChange,
    'quantidadeInput': handleGenericChange,
    'vidroTipo': handleGenericChange,
    'perfilModelo': handlePerfilChange, // Adicionado handler específico
    'perfilCor': handleGenericChange,
    'funcaoPorta': handleFuncaoPortaChange,
    'modeloDeslizante': handleGenericChange,
    'trilhoDeslizante': handleGenericChange, // Adicionado para sistema deslizante
    'numDobradicasInput': handleNumDobradicasChange,
    'puxadorModelo': handlePuxadorChange, // Handler específico para puxador
    'puxadorMedida': handlePuxadorChange,
    // 'puxadorPosicao': handlePuxadorChange, // Agora controlado por checkboxes
    'puxadorCotaSuperior': handlePuxadorCotasChange,
    'puxadorCotaInferior': handlePuxadorCotasChange,
    'puxadorLados': handlePuxadorChange,
    'parCheckbox': handleParCheckboxChange, // Handler para checkbox 'Porta em Par'
    'posicaoVertical': handlePuxadorPosicaoCheckboxChange,
    'posicaoHorizontal': handlePuxadorPosicaoCheckboxChange,
    'btnImprimir': handleImprimir,
    // 'btnSalvarRapido': handleSalvarRapido, // Movido para main.js - sistema híbrido
    // 'btnCarregar': handleCarregar, // Removido ou substituído por modal
    'btnSalvarObservacoes': handleSalvarObservacoes,
    'btnAbrirObservacoes': () => { // Adicionado listener para garantir que o campo seja focado ao abrir
        const observacaoInput = document.getElementById('observacaoInput');
        const obsModal = document.getElementById('observacoesModal');
        
        // Pequeno delay para garantir que o modal esteja visível
        if (obsModal) {
            obsModal.addEventListener('shown.bs.modal', () => {
                if(observacaoInput) observacaoInput.focus();
            }, { once: true }); // Executar apenas uma vez
        }
    },
    // Outros botões como 'btnNovoProjeto', 'btnCarregarProjetos' podem ter listeners específicos
    // ou serem tratados em seus respectivos módulos.
  };

  // ... (restante do código de inicializarControlesUI) ...

  // Adiciona listeners genéricos
  Object.keys(handlers).forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      const eventType = (element.tagName === 'BUTTON' || element.type === 'button') ? 'click' : 'change';
      // Remover listener antigo para evitar duplicação, se houver
      // element.removeEventListener(eventType, handlers[id]); // CUIDADO: pode remover listeners adicionados em outros lugares
      element.addEventListener(eventType, handlers[id]);
      // console.log(`[DEBUG Vibecode] Listener ${eventType} adicionado para #${id}`);
    } else {
      // console.warn(`[AVISO Vibecode] Elemento #${id} não encontrado para adicionar listener.`);
    }
  });

  // Inicializa estado dos campos condicionais (Puxador, Dobradiças, Deslizante, etc.)
  atualizarVisibilidadeCampos();
  configurarCamposDobradicas(document.getElementById('numDobradicasInput')?.value || '4'); // Inicializa com valor padrão ou '4'
  configurarCamposPuxador(); // Garante a configuração inicial correta dos campos de puxador

  console.log('[INFO Vibecode] Controles da UI inicializados.');
}

/**
 * Vibecode: Configura os eventos para mostrar a pré-visualização da foto do puxador.
 */
function configurarPreviewPuxador() {
  const puxadorModeloSelect = document.getElementById('puxadorModelo');
  const previewContainer = document.getElementById('puxador-preview-container');

  if (!puxadorModeloSelect || !previewContainer) {
    console.warn('[AVISO Vibecode] Elementos para preview do puxador não encontrados (#puxadorModelo ou #puxador-preview-container).');
    return;
  }

  // Função auxiliar para atualizar e mostrar o preview
  const mostrarPreview = (optionElement) => {
    if (!optionElement) {
        previewContainer.innerHTML = 'Sem foto'; // Ou deixe em branco?
        previewContainer.style.display = 'block'; 
        return;
    }
    const fotoUrl = optionElement.getAttribute('data-foto-url');
    // console.log(`[DEBUG Vibecode] Mostrando preview para: ${optionElement.value}, URL: ${fotoUrl}`); // Log removido
    if (fotoUrl) {
      previewContainer.innerHTML = `<img src="${fotoUrl}" alt="Preview ${optionElement.value}" onerror="this.parentElement.innerHTML = 'Sem foto';">`;
    } else {
      previewContainer.innerHTML = 'Sem foto';
    }
    previewContainer.style.display = 'block';
  };

  // Esconder o preview
  const esconderPreview = () => {
      // console.log('[DEBUG Vibecode] Escondendo preview.'); // Log removido
      previewContainer.style.display = 'none';
  };

  // Remover listeners antigos de mouseover/mouseout
  // puxadorModeloSelect.removeEventListener('pointerover', handlePointerOver);
  // puxadorModeloSelect.removeEventListener('pointerout', handlePointerOut);
  // puxadorModeloSelect.removeEventListener('mouseleave', handleMouseLeave);
  // puxadorModeloSelect.removeEventListener('click', handleClickHide); 
  
  // Remover listener de change de depuração anterior
  // puxadorModeloSelect.removeEventListener('change', handleDebugChange);
  
  // Novo Listener: Mostrar preview ao clicar/focar no select
  puxadorModeloSelect.addEventListener('click', (event) => {
      // Mostra o preview da opção atualmente selecionada
      mostrarPreview(event.target.selectedOptions[0]);
  });
    
  // Novo Listener: Atualizar preview ao mudar a seleção
  puxadorModeloSelect.addEventListener('change', (event) => {
      // Atualiza o preview com a nova opção selecionada
      mostrarPreview(event.target.selectedOptions[0]);
      // Não esconder aqui, esperar o blur
  });

  // Novo Listener: Esconder preview ao perder o foco (blur)
  puxadorModeloSelect.addEventListener('blur', () => {
      // Pequeno delay para permitir que o 'change' processe antes de esconder
      setTimeout(esconderPreview, 150); 
  });

  console.log('[INFO Vibecode] Eventos (click, change, blur) para preview de puxador configurados.');
}

// Chamar a configuração do preview após inicializar os controles
document.addEventListener('DOMContentLoaded', () => {
    // Pequeno delay para garantir que inicializarControlesUI tenha terminado e populado o select
    setTimeout(configurarPreviewPuxador, 500); 
});


// ... (restante do código existente como handleMedidaChange, handleGenericChange, etc.) ...
// =============================================================================
// Handlers Específicos (Funções de tratamento de eventos)
// =============================================================================
// ... existing code ...

/**
 * Trata mudanças nos campos de medida (largura, altura).
 * Vibecode: Atualiza a configuração e redesenha a porta. Inclui validação.
 */
function handleMedidaChange(event) {
  const target = event.target;
  const id = target.id;
  const value = parseInt(target.value, 10);
  const min = parseInt(target.min, 10);
  const max = parseInt(target.max, 10);
  const errorElement = document.getElementById(`${id}Error`);

  let isValid = true;
  target.classList.remove('is-invalid');
  if (errorElement) errorElement.style.display = 'none';

  if (isNaN(value) || value < min || value > max) {
    target.classList.add('is-invalid');
    if (errorElement) {
      errorElement.textContent = `${id === 'larguraInput' ? 'Largura' : 'Altura'} deve ser entre ${min} e ${max} mm`;
      errorElement.style.display = 'block';
    }
    isValid = false;
    console.warn(`[AVISO Vibecode] Valor inválido para ${id}: ${target.value}`);
    // Poderia reverter para o valor anterior ou um padrão, mas por ora apenas avisa.
  }

  if (isValid) {
    const configKey = id === 'larguraInput' ? 'largura' : 'altura';
    // Atualiza configuração e redesenha
    window.atualizarConfiguracao({ [configKey]: value });

    // Lógica específica para altura (atualizar número de dobradiças se aplicável)
    if (id === 'alturaInput' && typeof window.definirNumeroDobradicas === 'function') {
       window.definirNumeroDobradicas(value);
    }
    // Lógica específica para largura (atualizar número de dobradiças se basculante)
    if (id === 'larguraInput' && typeof window.definirNumeroDobradicasBasculante === 'function') {
       const funcaoPorta = document.getElementById('funcaoPorta')?.value;
       if (funcaoPorta === 'basculante') {
           window.definirNumeroDobradicasBasculante(value);
       }
    }
  }
}

/**
 * Trata mudanças em campos genéricos (selects, inputs numéricos simples).
 * Vibecode: Atualiza a configuração correspondente e redesenha.
 */
function handleGenericChange(event) {
  const target = event.target;
  const id = target.id;
  let value = target.value;
  let configKey = '';

  // Mapeia ID para chave de configuração
  switch (id) {
    case 'quantidadeInput': configKey = 'quantidade'; value = parseInt(value, 10) || 1; break;
    case 'vidroTipo': configKey = 'vidro'; break;
    // case 'perfilModelo': configKey = 'perfilModelo'; break; // Movido para handlePerfilChange
    case 'perfilCor': configKey = 'perfilCor'; break;
    case 'modeloDeslizante': configKey = 'modeloDeslizante'; break;
    case 'trilhoDeslizante': configKey = 'trilhoDeslizante'; break; // Assumindo que existe na config
    default:
      console.warn(`[AVISO Vibecode] Handler genérico chamado para ID não mapeado: ${id}`);
      return;
  }

  if (configKey) {
    window.atualizarConfiguracao({ [configKey]: value });
  }
}

/**
 * Trata mudança no tipo de função da porta (abrir, basculante, deslizante).
 * Vibecode: Atualiza a configuração, redesenha e ajusta a visibilidade de campos específicos.
 */
function handleFuncaoPortaChange() {
    const funcaoPortaSelect = document.getElementById('funcaoPorta');
    if (!funcaoPortaSelect) return;

    const novaFuncao = funcaoPortaSelect.value;
    window.atualizarConfiguracao({ funcao: novaFuncao });

    // Atualiza a visibilidade dos campos relacionados à função
    atualizarVisibilidadeCampos();

    // Lógica para definir número de dobradiças ao mudar para basculante
    if (novaFuncao === 'basculante' && typeof window.definirNumeroDobradicasBasculante === 'function') {
        const largura = parseInt(document.getElementById('larguraInput')?.value || '0', 10);
        window.definirNumeroDobradicasBasculante(largura);
    }
     // Lógica para definir número de dobradiças ao mudar para abrir (se necessário)
     else if (novaFuncao !== 'basculante' && novaFuncao !== 'deslizante' && typeof window.definirNumeroDobradicas === 'function') {
         const altura = parseInt(document.getElementById('alturaInput')?.value || '0', 10);
         window.definirNumeroDobradicas(altura);
     }
}


/**
 * Trata mudança no número de dobradiças.
 * Vibecode: Atualiza a configuração, redesenha e gera os campos de cota dinamicamente.
 */
function handleNumDobradicasChange() {
  const numDobradicasSelect = document.getElementById('numDobradicasInput');
  if (!numDobradicasSelect) return;

  const numDobradicas = numDobradicasSelect.value; // Pode ser 'S/Dobradiças' ou um número
  const num = numDobradicas === 'S/Dobradiças' ? 0 : parseInt(numDobradicas, 10);

  window.atualizarConfiguracao({ numDobradicas: num });
  configurarCamposDobradicas(numDobradicas); // Atualiza os campos de cota
}

/**
 * Trata mudanças nos campos relacionados ao puxador (modelo, medida, posição, lados).
 * Vibecode: Atualiza a configuração do puxador, redesenha e ajusta campos visíveis.
 */
function handlePuxadorChange(event) {
  const target = event.target;
  const id = target.id;
  const value = target.value;
  let configPuxador = { ...window.obterConfiguracaoAtual().puxador }; // Copia para evitar mutação direta

  switch (id) {
    case 'puxadorModelo':
      configPuxador.modelo = value;
      break;
    case 'puxadorMedida':
      configPuxador.medida = value;
      break;
    // case 'puxadorPosicao': // Controlado pelos checkboxes agora
    //   configPuxador.posicao = value;
    //   break;
    case 'puxadorLados':
      configPuxador.lados = value;
      break;
    default:
      console.warn(`[AVISO Vibecode] Handler de puxador chamado para ID não mapeado: ${id}`);
      return;
  }

  window.atualizarConfiguracao({ puxador: configPuxador });
  configurarCamposPuxador(); // Atualiza visibilidade/estado dos campos de puxador
}

/**
 * Trata mudanças nas checkboxes de posição do puxador (Vertical/Horizontal).
 * Vibecode: Garante que apenas uma opção esteja marcada e atualiza a configuração.
 */
function handlePuxadorPosicaoCheckboxChange(event) {
    const verticalCheckbox = document.getElementById('posicaoVertical');
    const horizontalCheckbox = document.getElementById('posicaoHorizontal');
    const puxadorPosicaoSelect = document.getElementById('puxadorPosicao'); // Select oculto

    if (!verticalCheckbox || !horizontalCheckbox || !puxadorPosicaoSelect) return;

    const changedCheckbox = event.target;
    const otherCheckbox = changedCheckbox === verticalCheckbox ? horizontalCheckbox : verticalCheckbox;

    // Se o checkbox clicado foi desmarcado, remarca-o (sempre deve haver uma opção)
    // OU Se o outro checkbox estiver marcado, desmarca o outro.
    if (!changedCheckbox.checked) {
       changedCheckbox.checked = true; // Impede desmarcar a última opção
    } else if (otherCheckbox.checked) {
       otherCheckbox.checked = false;
    }

    // Atualiza o valor do select oculto para compatibilidade e configuração
    const novaPosicao = verticalCheckbox.checked ? 'vertical' : 'horizontal';
    puxadorPosicaoSelect.value = novaPosicao;

    // Atualiza a configuração
    const configPuxador = { ...window.obterConfiguracaoAtual().puxador, posicao: novaPosicao };
    window.atualizarConfiguracao({ puxador: configPuxador });
    configurarCamposPuxador(); // Atualiza a UI dos campos de cota
}


/**
 * Trata mudanças nas cotas do puxador.
 * Vibecode: Atualiza a configuração do puxador e redesenha. Valida as cotas.
 */
function handlePuxadorCotasChange(event) {
    const target = event.target;
    const id = target.id;
    const value = target.value.trim() === '' ? null : parseInt(target.value, 10); // Permite campo vazio -> null

    // Validação básica (é número ou nulo, não negativo)
    if (value !== null && (isNaN(value) || value < 0)) {
        console.warn(`[AVISO Vibecode] Cota inválida para ${id}: ${target.value}. Ignorando.`);
        // Poderia adicionar feedback visual (is-invalid) ou reverter
        // Por ora, apenas não atualiza a configuração com valor inválido.
        // Reverter para o valor anterior:
        // const configAnterior = window.obterConfiguracaoAtual().puxador;
        // target.value = id === 'puxadorCotaSuperior' ? configAnterior.cotaSuperior : configAnterior.cotaInferior;
        return;
    }

    let configPuxador = { ...window.obterConfiguracaoAtual().puxador };

    if (id === 'puxadorCotaSuperior') {
        configPuxador.cotaSuperior = value;
    } else if (id === 'puxadorCotaInferior') {
        configPuxador.cotaInferior = value;
    }

    window.atualizarConfiguracao({ puxador: configPuxador });
    // Redesenho já ocorre dentro de atualizarConfiguracao
}


/**
 * Trata mudança no modelo do perfil.
 * Vibecode: Atualiza a configuração e pode ajustar outras opções se necessário (ex: puxador).
 */
function handlePerfilChange(event) {
    const perfilModeloSelect = event.target;
    const novoModeloPerfil = perfilModeloSelect.value;

    window.atualizarConfiguracao({ perfilModelo: novoModeloPerfil });

    // Lógica adicional: Se o perfil for RM-114 (sem puxador embutido talvez?),
    // talvez desabilitar/resetar opções de puxador? (A ser definido)
    // Exemplo:
    // if (novoModeloPerfil === 'RM-114') {
    //   console.log('[INFO Vibecode] Perfil RM-114 selecionado, ajustando opções de puxador...');
    //   // Resetar ou desabilitar campos de puxador se necessário
    // }

    configurarCamposPuxador(); // Reavalia a configuração dos campos de puxador
}

/**
 * Trata mudança na checkbox 'Porta em Par'.
 * Vibecode: Atualiza a configuração e ajusta a visibilidade de campos dependentes (ex: lados do puxador).
 */
function handleParCheckboxChange(event) {
    const isChecked = event.target.checked;
    window.atualizarConfiguracao({ portaEmPar: isChecked });
    configurarCamposPuxador(); // Atualiza a visibilidade/opções dos lados do puxador
}

/**
 * Handler para o botão de impressão.
 * Vibecode: Chama a função de impressão definida em printing.js.
 */
function handleImprimir() {
  if (typeof window.imprimirDesenho === 'function') {
    console.log('[INFO Vibecode] Iniciando processo de impressão...');
    window.imprimirDesenho();
  } else {
    console.error('[ERRO Vibecode] Função de impressão (window.imprimirDesenho) não encontrada.');
    alert('Erro: Função de impressão não está disponível.');
  }
}

/**
 * Handler para o botão de salvar rápido - REMOVIDO
 * Agora é gerenciado pelo main.js com sistema híbrido (localStorage + Supabase)
 */
function handleSalvarRapido() {
  console.log('[INFO] Handler de salvamento movido para main.js - sistema híbrido ativo');
}

/**
 * Handler para salvar observações (quando o botão no modal é clicado).
 * Vibecode: Atualiza a configuração com o texto da observação e fecha o modal.
 */
function handleSalvarObservacoes() {
  const observacaoInput = document.getElementById('observacaoInput');
  if (observacaoInput) {
    window.atualizarConfiguracao({ observacao: observacaoInput.value });
    console.log('[INFO Vibecode] Observações salvas na configuração.');
    // Fechar o modal
    const modalElement = document.getElementById('observacoesModal');
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      } else {
        // Fallback se a instância não for encontrada (pouco provável)
        const fallbackModal = new bootstrap.Modal(modalElement);
        fallbackModal.hide();
      }
    }
     mostrarNotificacao('Observações salvas.', 'info');
  } else {
    console.error('[ERRO Vibecode] Campo de observação (#observacaoInput) não encontrado.');
     mostrarNotificacao('Erro ao salvar observações.', 'error');
  }
}


// =============================================================================
// Funções Auxiliares da UI
// =============================================================================

/**
 * Atualiza a visibilidade de seções e campos com base na configuração atual.
 * Ex: Esconde opções de dobradiça se for porta deslizante.
 * Vibecode: Centraliza a lógica de visibilidade condicional dos campos do formulário.
 */
function atualizarVisibilidadeCampos() {
  const config = window.obterConfiguracaoAtual();
  const funcao = config.funcao;

  // Elementos condicionais
  const sectionDeslizante = document.getElementById('sectionDeslizante');
  const sectionDobradicas = document.getElementById('collapseDobradicas').closest('.accordion-item');
  const sectionPuxador = document.getElementById('collapsePuxador').closest('.accordion-item'); // Assumindo que Puxador sempre é visível
  const parCheckboxContainer = document.getElementById('parCheckboxContainer');


  // Lógica de visibilidade
  if (sectionDeslizante) {
    sectionDeslizante.style.display = (funcao === 'deslizante') ? 'block' : 'none';
  }
  if (sectionDobradicas) {
    sectionDobradicas.style.display = (funcao === 'deslizante') ? 'none' : 'block';
  }
  if (parCheckboxContainer) {
      // Mostrar checkbox 'Porta em Par' apenas para portas de abrir
      const isAbrir = ['superiorDireita', 'superiorEsquerda', 'inferiorDireita', 'inferiorEsquerda'].includes(funcao);
      parCheckboxContainer.style.display = isAbrir ? 'block' : 'none';
      // Se não for porta de abrir, garantir que 'portaEmPar' seja false
      if (!isAbrir && config.portaEmPar) {
          window.atualizarConfiguracao({ portaEmPar: false });
          const parCheckbox = document.getElementById('parCheckbox');
          if(parCheckbox) parCheckbox.checked = false;
      }
  }

  // Configura campos específicos de puxador (cotas, lados)
  configurarCamposPuxador();

  // Configura campos de dobradiças (se visível)
  if (funcao !== 'deslizante') {
    configurarCamposDobradicas(config.numDobradicas.toString()); // Passa como string para comparar com 'S/Dobradiças'
  }

  console.log('[INFO Vibecode] Visibilidade dos campos da UI atualizada.');
}


/**
 * Configura os campos de cota das dobradiças com base na quantidade selecionada.
 * Vibecode: Gera ou remove inputs para as cotas das dobradiças dinamicamente.
 * @param {string} numDobradicasStr - Número de dobradiças selecionado (pode ser 'S/Dobradiças').
 */
function configurarCamposDobradicas(numDobradicasStr) {
  const dobradicasCamposDiv = document.getElementById('dobradicasCampos');
  if (!dobradicasCamposDiv) return;

  const numDobradicas = numDobradicasStr === 'S/Dobradiças' ? 0 : parseInt(numDobradicasStr, 10);

  // Limpa campos existentes
  dobradicasCamposDiv.innerHTML = '';

  if (isNaN(numDobradicas) || numDobradicas <= 0) {
    dobradicasCamposDiv.style.display = 'none'; // Esconde se for 0 ou inválido
    return;
  }

  dobradicasCamposDiv.style.display = 'block'; // Mostra se houver dobradiças

  // Obter cotas atuais da configuração para preenchimento
  const configAtual = window.obterConfiguracaoAtual();
  const cotasAtuais = configAtual.dobradicas || [];

  // Cria os campos de input
  for (let i = 0; i < numDobradicas; i++) {
    const cotaCampoDiv = document.createElement('div');
    cotaCampoDiv.className = 'cota-field dobradicaCampo mb-2'; // Adicionado mb-2 para espaçamento

    const label = document.createElement('div');
    label.className = 'cota-label';
    label.textContent = `Cota ${i + 1}:`;

    const flexGrow = document.createElement('div');
    flexGrow.className = 'flex-grow-1';

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'cota-input';
    input.id = `dobradicaCota${i + 1}`;
    input.min = '0';
    input.max = configAtual.altura || 3000; // Usa altura atual como máximo
    input.required = true;
    input.value = cotasAtuais[i] !== undefined ? cotasAtuais[i] : ''; // Preenche com valor existente

    // Adiciona listener para atualizar a configuração ao mudar a cota
    input.addEventListener('change', handleDobradicaCotaChange);

    cotaCampoDiv.appendChild(label);
    cotaCampoDiv.appendChild(flexGrow);
    cotaCampoDiv.appendChild(input);
    dobradicasCamposDiv.appendChild(cotaCampoDiv);
  }
   // console.log(`[DEBUG Vibecode] Campos para ${numDobradicas} dobradiças configurados.`);
}

/**
 * Handler para mudança nas cotas individuais das dobradiças.
 * Vibecode: Atualiza o array de cotas na configuração global.
 */
function handleDobradicaCotaChange() {
    const inputs = document.querySelectorAll('#dobradicasCampos .dobradicaCampo input');
    const novasCotas = Array.from(inputs)
        .map(input => parseInt(input.value, 10))
        .filter(value => !isNaN(value)); // Filtra valores inválidos ou vazios

    window.atualizarConfiguracao({ dobradicas: novasCotas });
    // O redesenho já ocorre em atualizarConfiguracao
    // console.log('[DEBUG Vibecode] Cotas de dobradiças atualizadas:', novasCotas);
}


/**
 * Configura a visibilidade e o estado dos campos relacionados ao puxador.
 * Ex: Mostra/esconde campos de cota dependendo da posição (vertical/horizontal).
 *     Habilita/desabilita opção '2 Lados' se for porta em par.
 * Vibecode: Centraliza a lógica de UI específica para a seção de puxadores.
 */
function configurarCamposPuxador() {
  const config = window.obterConfiguracaoAtual();
  const puxadorConfig = config.puxador || {};
  const puxadorModeloSelect = document.getElementById('puxadorModelo');
  const puxadorPosicaoDiv = document.getElementById('puxadorPosicaoDiv');
  const puxadorCotasCampos = document.getElementById('puxadorCotasCampos');
  const cotasVerticalDiv = document.getElementById('cotasVertical');
  const cotasHorizontalDiv = document.getElementById('cotasHorizontal');
  const puxadorLadosDiv = document.getElementById('puxadorLadosDiv');
  const puxadorLadosSelect = document.getElementById('puxadorLados');

  const semPuxador = !puxadorConfig.modelo || puxadorConfig.modelo === 'S/Puxador';

  // Habilita/Desabilita toda a seção de posição, medida e cotas se 'S/Puxador'
  const camposPuxador = [
    puxadorPosicaoDiv,
    document.getElementById('puxadorMedida')?.closest('.mb-3'),
    puxadorCotasCampos,
    puxadorLadosDiv
  ];

  camposPuxador.forEach(el => {
    if (el) el.style.display = semPuxador ? 'none' : 'block';
  });

  if (semPuxador) {
      // console.log('[DEBUG Vibecode] Sem puxador selecionado, escondendo campos relacionados.');
      return; // Não precisa configurar o resto se não há puxador
  }

  // Configura visibilidade das cotas (Vertical vs Horizontal)
  const isVertical = puxadorConfig.posicao === 'vertical';
  if (cotasVerticalDiv) cotasVerticalDiv.style.display = isVertical ? 'block' : 'none';
  if (cotasHorizontalDiv) cotasHorizontalDiv.style.display = isVertical ? 'none' : 'block';

  // Se for horizontal, talvez precise de inputs diferentes (deslocamento?)
  if (!isVertical && cotasHorizontalDiv) {
      // Lógica para campos de cota horizontal (se houver)
      // Ex: Mostrar input de deslocamento
      // cotasHorizontalDiv.innerHTML = '<p>Cotas horizontais ainda não implementadas.</p>'; // Placeholder
      const cotaInfo = cotasHorizontalDiv.querySelector('.cota-info');
      if (cotaInfo) {
           cotaInfo.innerHTML = '<div class="text-muted small">As cotas para puxador horizontal são calculadas automaticamente com base na medida.</div>'; // Ou adicionar inputs se necessário
      }
  }

  // Configura opções de "Lados" do puxador
  if (puxadorLadosSelect) {
    const opcaoAmbos = puxadorLadosSelect.querySelector('option[value="ambos"]');
    if (opcaoAmbos) {
      // Habilita "2 Lados" apenas se a porta for em par
      opcaoAmbos.disabled = !config.portaEmPar;
      // Se a porta não for em par e "ambos" estiver selecionado, volta para "direito"
      if (!config.portaEmPar && puxadorLadosSelect.value === 'ambos') {
        puxadorLadosSelect.value = 'direito'; // Ou 'esquerdo' como padrão?
        // Dispara o evento change para atualizar a configuração
        puxadorLadosSelect.dispatchEvent(new Event('change'));
      }
    }
  }
   // console.log('[DEBUG Vibecode] Campos de puxador configurados. Vertical:', isVertical, 'Porta em Par:', config.portaEmPar);
}

// =============================================================================
// Funções de Utilidade Exportadas (se necessário)
// =============================================================================
// Exemplo: Se alguma função daqui precisar ser chamada por outro módulo
// export { atualizarVisibilidadeCampos };

// Expor funções necessárias para atualização automática dos selects
window.popularPuxadoresSelect = popularPuxadoresSelect;
window.popularModelosDeslizantesSelect = popularModelosDeslizantesSelect;
