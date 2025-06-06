/**
 * Funções para diagnóstico da configuração da porta
 * Sistema de Portas e Perfis
 */

import { CONFIG } from './drawing/config.js';
import { obterConfiguracaoAtual } from './initialize.js';
import { mmParaPixels } from './drawing/utils.js';

/**
 * Realiza o diagnóstico completo da configuração atual da porta
 * @returns {Object} Resultado do diagnóstico com possíveis problemas encontrados
 */
export function diagnosticarPorta() {
  // Obter configuração atual
  const config = obterConfiguracaoAtual();
  
  // Array para armazenar problemas encontrados
  const problemas = [];
  
  // Verificar dimensões básicas
  if (!config.largura || config.largura < 200 || config.largura > 1500) {
    problemas.push({
      tipo: 'erro',
      componente: 'largura',
      mensagem: 'Largura inválida. Deve estar entre 200mm e 1500mm.',
      valor: config.largura
    });
  }
  
  if (!config.altura || config.altura < 200 || config.altura > 3000) {
    problemas.push({
      tipo: 'erro',
      componente: 'altura',
      mensagem: 'Altura inválida. Deve estar entre 200mm e 3000mm.',
      valor: config.altura
    });
  }
  
  // Verificar dobradiças
  if (config.funcao !== 'deslizante') {
    // Verificar quantidade de dobradiças
    const numDobradicas = parseInt(config.numDobradicas, 10);
    if (isNaN(numDobradicas) || numDobradicas < 2 || numDobradicas > 4) {
      problemas.push({
        tipo: 'erro',
        componente: 'dobradicas',
        mensagem: 'Número de dobradiças inválido. Deve estar entre 2 e 4.',
        valor: numDobradicas
      });
    }
    
    // Verificar posições das dobradiças
    if (config.dobradicas && config.dobradicas.length > 0) {
      // Verificar distância mínima entre dobradiças
      const distanciaMinima = 100; // 100mm
      
      for (let i = 0; i < config.dobradicas.length - 1; i++) {
        const distancia = config.dobradicas[i + 1] - config.dobradicas[i];
        if (distancia < distanciaMinima) {
          problemas.push({
            tipo: 'erro',
            componente: 'dobradicas',
            mensagem: `Distância muito pequena entre dobradiças ${i + 1} e ${i + 2} (${distancia}mm). Mínimo: ${distanciaMinima}mm.`,
            valor: distancia
          });
        }
      }
      
      // Verificar primeira e última dobradiça - permitir personalização, mas manter 50mm mínimo
      const distanciaMinimaBorda = 50; // Reduzido de 100mm para 50mm
      
      if (config.dobradicas[0] < distanciaMinimaBorda) {
        problemas.push({
          tipo: 'erro',
          componente: 'dobradicas',
          mensagem: `Primeira dobradiça muito próxima da borda superior. Mínimo: ${distanciaMinimaBorda}mm.`,
          valor: config.dobradicas[0]
        });
      }
      
      const ultimaDistancia = config.altura - config.dobradicas[config.dobradicas.length - 1];
      if (ultimaDistancia < distanciaMinimaBorda) {
        problemas.push({
          tipo: 'erro',
          componente: 'dobradicas',
          mensagem: `Última dobradiça muito próxima da borda inferior. Mínimo: ${distanciaMinimaBorda}mm.`,
          valor: ultimaDistancia
        });
      }
    }
  }
  
  // Verificar puxador
  if (config.puxador) {
    // Verificar medida do puxador
    if (config.puxador.medida && config.puxador.medida !== 'Tamanho da Porta') {
      const medidaPuxador = parseInt(config.puxador.medida, 10);
      if (isNaN(medidaPuxador) || medidaPuxador < 150 || medidaPuxador > config.altura) {
        problemas.push({
          tipo: 'erro',
          componente: 'puxador',
          mensagem: 'Medida do puxador inválida. Deve estar entre 150mm e a altura da porta.',
          valor: medidaPuxador
        });
      }
    }
    
    // Verificar posição do puxador
    if (config.puxador.posicao === 'vertical') {
      // Verificar cotas superior e inferior para puxador vertical
      const cotaSuperior = parseInt(config.puxador.cotaSuperior, 10);
      const cotaInferior = parseInt(config.puxador.cotaInferior, 10);
      const alturaPuxador = config.puxador.medida === 'Tamanho da Porta' ? 
        config.altura : 
        parseInt(config.puxador.medida, 10);
      
      if (isNaN(cotaSuperior) || cotaSuperior < 0) {
        problemas.push({
          tipo: 'erro',
          componente: 'puxador',
          mensagem: 'Cota superior do puxador inválida.',
          valor: cotaSuperior
        });
      }
      
      if (isNaN(cotaInferior) || cotaInferior < 0) {
        problemas.push({
          tipo: 'erro',
          componente: 'puxador',
          mensagem: 'Cota inferior do puxador inválida.',
          valor: cotaInferior
        });
      }
      
      // Verificar se a soma das cotas mais altura do puxador é igual à altura da porta
      const somaCotas = cotaSuperior + alturaPuxador + cotaInferior;
      if (Math.abs(somaCotas - config.altura) > 1) { // Tolerância de 1mm
        problemas.push({
          tipo: 'erro',
          componente: 'puxador',
          mensagem: 'Soma das cotas do puxador não corresponde à altura da porta.',
          valor: somaCotas
        });
      }
    }
  }
  
  // Retornar resultado do diagnóstico
  return {
    temProblemas: problemas.length > 0,
    problemas: problemas,
    config: config
  };
}

/**
 * Mostra o resultado do diagnóstico na interface
 * @param {Object} resultado - Resultado do diagnóstico
 */
export function mostrarResultadoDiagnostico(resultado) {
  console.group('Diagnóstico da Porta');
  
  if (!resultado.temProblemas) {
    console.log('✅ Configuração válida! Nenhum problema encontrado.');
  }
  else {
    console.log('❌ Problemas encontrados:');
    resultado.problemas.forEach(problema => {
      console.log(`\n[${problema.componente.toUpperCase()}] ${problema.tipo === 'erro' ? '❌' : '⚠️'}`);
      console.log(problema.mensagem);
      if (problema.valor !== undefined) {
        console.log(`Valor atual: ${problema.valor}`);
      }
    });
  }
  
  console.groupEnd();
  
  // Retornar true se não houver problemas
  return !resultado.temProblemas;
}

// Exportar função para uso global
window.diagnosticarPorta = diagnosticarPorta;
window.mostrarResultadoDiagnostico = mostrarResultadoDiagnostico;

/**
 * Arquivo de diagnóstico para resolver problemas de travamento
 * ao alterar a altura da porta
 */

/**
 * Função para diagnosticar e corrigir problemas no cálculo de posições de dobradiças
 * Esta função substitui temporariamente a função original para evitar loops infinitos
 */
function diagnosticarProblemaCalculoPosicoes() {
  console.log("Iniciando diagnóstico do problema de cálculo de posições de dobradiças");
  
  // 1. Verificar se a função original existe
  if (typeof window.calcularPosicaoDefaultDobradica !== 'function') {
    console.error("DIAGNÓSTICO: Função calcularPosicaoDefaultDobradica não encontrada");
    return false;
  }
  
  // Guardar referência à função original
  const calcularPosicaoOriginal = window.calcularPosicaoDefaultDobradica;
  
  // Substituir a função original por uma versão protegida
  window.calcularPosicaoDefaultDobradica = function(total, alturaPorta) {
    console.log(`DIAGNÓSTICO: Calculando ${total} dobradiças para altura ${alturaPorta}mm`);
    
    // Validar parâmetros
    total = parseInt(total, 10);
    alturaPorta = parseInt(alturaPorta, 10);
    
    if (isNaN(total) || total <= 0) {
      console.error("DIAGNÓSTICO: Total de dobradiças inválido:", total);
      return [100, 500, 900, 1300, 1700].slice(0, Math.max(1, total));
    }
    
    if (isNaN(alturaPorta) || alturaPorta <= 0) {
      console.error("DIAGNÓSTICO: Altura inválida:", alturaPorta);
      return [100, 500, 900, 1300, 1700].slice(0, total);
    }
    
    try {
      // Aplicar limite à recursão
      if (window._contadorChamadas === undefined) {
        window._contadorChamadas = 0;
      }
      
      window._contadorChamadas++;
      
      // Se atingir muitas chamadas, retornar um valor seguro
      if (window._contadorChamadas > 10) {
        console.error("DIAGNÓSTICO: Detectado possível loop infinito de cálculo");
        window._contadorChamadas = 0;
        
        // Retornar valores seguros baseados na altura
        const distanciaExtremidade = 50; // Reduzido de 100mm para 50mm
        const espacoDisponivel = alturaPorta - (2 * distanciaExtremidade);
        const posicoes = [];
        
        for (let i = 0; i < total; i++) {
          if (i === 0) {
            posicoes.push(distanciaExtremidade);
          } 
          else if (i === total - 1) {
            posicoes.push(alturaPorta - distanciaExtremidade);
          }
          else {
            const posicao = Math.round(distanciaExtremidade + (i * (espacoDisponivel / (total - 1))));
            posicoes.push(posicao);
          }
        }
        
        return posicoes;
      }
      
      // Chamar função original com try/catch
      const resultado = calcularPosicaoOriginal(total, alturaPorta);
      
      // Verificar resultado
      if (!resultado || !Array.isArray(resultado) || resultado.length !== total) {
        console.error("DIAGNÓSTICO: Resultado inválido do cálculo original:", resultado);
        
        // Gerar resultado seguro
        const distanciaExtremidade = 50; // Reduzido de 100mm para 50mm
        const espacoDisponivel = alturaPorta - (2 * distanciaExtremidade);
        const posicoes = [];
        
        for (let i = 0; i < total; i++) {
          if (i === 0) {
            posicoes.push(distanciaExtremidade);
          } 
          else if (i === total - 1) {
            posicoes.push(alturaPorta - distanciaExtremidade);
          }
          else {
            const posicao = Math.round(distanciaExtremidade + (i * (espacoDisponivel / (total - 1))));
            posicoes.push(posicao);
          }
        }
        
        return posicoes;
      }
      
      // Resetar contador após sucesso
      window._contadorChamadas = 0;
      
      return resultado;
    } catch (error) {
      console.error("DIAGNÓSTICO: Erro no cálculo de posições", error);
      window._contadorChamadas = 0;
      
      // Retornar valores seguros baseados na altura
      const distanciaExtremidade = 50; // Reduzido de 100mm para 50mm
      const espacoDisponivel = alturaPorta - (2 * distanciaExtremidade);
      const posicoes = [];
      
      for (let i = 0; i < total; i++) {
        if (i === 0) {
          posicoes.push(distanciaExtremidade);
        } 
        else if (i === total - 1) {
          posicoes.push(alturaPorta - distanciaExtremidade);
        }
        else {
          const posicao = Math.round(distanciaExtremidade + (i * (espacoDisponivel / (total - 1))));
          posicoes.push(posicao);
        }
      }
      
      return posicoes;
    }
  };
  
  console.log("Diagnóstico concluído. A função calcularPosicaoDefaultDobradica foi protegida contra erros.");
  console.log("Tente mudar a altura da porta novamente.");
  
  return true;
}

/**
 * Função para evitar múltiplos redesenhos da porta que podem causar travamento
 * Esta função substitui temporariamente as funções de redesenho para controlar a frequência
 */
function diagnosticarProblemaRedesenho() {
  console.log("Iniciando diagnóstico de problemas de redesenho múltiplo");
  
  // 1. Verificar se as funções de desenho existem
  if (typeof window.desenharPorta !== 'function') {
    console.error("DIAGNÓSTICO: Função desenharPorta não encontrada");
    return false;
  }
  
  if (typeof window.atualizarDesenho !== 'function') {
    console.warn("DIAGNÓSTICO: Função atualizarDesenho não encontrada");
  }
  
  // Verificar função de atualização de altura
  if (typeof window.atualizarAlturaERecalcularDobradicasImediatamente !== 'function') {
    console.warn("DIAGNÓSTICO: Função atualizarAlturaERecalcularDobradicasImediatamente não encontrada");
  }
  
  // 2. Guardar referências às funções originais
  const desenharPortaOriginal = window.desenharPorta;
  const atualizarDesenhoOriginal = window.atualizarDesenho;
  const atualizarAlturaOriginal = window.atualizarAlturaERecalcularDobradicasImediatamente;
  
  // 3. Substituir a função desenharPorta por uma versão com debounce - REMOVIDO
  // Esta redefinição estava causando conflitos. O desenho agora é controlado diretamente.
  
  // 4. Substituir a função atualizarDesenho se existir
  if (typeof atualizarDesenhoOriginal === 'function') {
    window.atualizarDesenho = function(config) {
      // Usar o mesmo mecanismo de bloqueio
      if (window._bloqueioAtualizacao) {
        console.log("DIAGNÓSTICO: Bloqueando chamada duplicada à atualizarDesenho");
        return;
      }
      
      // Ativar bloqueio temporário
      window._bloqueioAtualizacao = true;
      
      // Executar a atualização
      try {
        atualizarDesenhoOriginal(config);
      } catch (error) {
        console.error("DIAGNÓSTICO: Erro ao atualizar desenho", error);
      }
      
      // Remover bloqueio após um tempo
      setTimeout(() => {
        window._bloqueioAtualizacao = false;
      }, 300); // 300ms de debounce
    };
  }
  
  // 5. Substituir a função de atualização de altura se existir
  if (typeof atualizarAlturaOriginal === 'function') {
    window.atualizarAlturaERecalcularDobradicasImediatamente = function(novaAltura) {
      console.log("DIAGNÓSTICO: Atualizando altura para", novaAltura);
      
      // Validar altura
      novaAltura = parseInt(novaAltura, 10);
      if (isNaN(novaAltura) || novaAltura < 200 || novaAltura > 3000) {
        console.error("DIAGNÓSTICO: Altura inválida:", novaAltura);
        return;
      }
      
      // Evitar atualizações muito frequentes
      if (window._bloqueioAtualizacaoAltura) {
        console.log("DIAGNÓSTICO: Bloqueando atualização rápida de altura");
        return;
      }
      
      // Ativar bloqueio
      window._bloqueioAtualizacaoAltura = true;
      
      try {
        // Chamar a função original
        atualizarAlturaOriginal(novaAltura);
      } catch (error) {
        console.error("DIAGNÓSTICO: Erro ao atualizar altura", error);
        
        // Tenta uma atualização simplificada em caso de erro
        if (typeof window.obterConfiguracaoAtual === 'function' && 
            typeof window.atualizarConfiguracao === 'function') {
          
          const config = window.obterConfiguracaoAtual();
          config.altura = novaAltura;
          
          // Determinar número de dobradiças pela altura
          let numDobradicas;
          if (novaAltura <= 900) {
            numDobradicas = 2;
          } else if (novaAltura <= 1500) {
            numDobradicas = 3;
          } else if (novaAltura <= 2600) {
            numDobradicas = 4;
          } else {
            numDobradicas = 5;
          }
          
          config.numDobradicas = numDobradicas;
          
          // Calcular posições padrão para dobradiças
          const posicoes = [];
          const distanciaExtremidade = 100;
          const espacoDisponivel = novaAltura - (2 * distanciaExtremidade);
          
          for (let i = 0; i < numDobradicas; i++) {
            if (i === 0) {
              posicoes.push(distanciaExtremidade);
            } else if (i === numDobradicas - 1) {
              posicoes.push(novaAltura - distanciaExtremidade);
            } else {
              posicoes.push(Math.round(distanciaExtremidade + (i * (espacoDisponivel / (numDobradicas - 1)))));
            }
          }
          
          config.dobradicas = posicoes;
          
          // Atualizar configuração
          window.atualizarConfiguracao(config);
          
          // Forçar redesenho único
          if (typeof window.desenharPorta === 'function') {
            window.desenharPorta(config, true);
          }
        }
      }
      
      // Liberar bloqueio após um tempo
      setTimeout(() => {
        window._bloqueioAtualizacaoAltura = false;
      }, 700); // 700ms de debounce
    };
  }
  
  // 6. Proteção adicional ao campo de altura
  const alturaInput = document.getElementById('alturaInput');
  if (alturaInput) {
    // Guardar a referência aos listeners existentes
    const originalOnChange = alturaInput.onchange;
    
    // Substituir o evento change por um com debounce
    alturaInput.onchange = null;
    alturaInput.addEventListener('change', function(event) {
      console.log("DIAGNÓSTICO: Evento change no campo de altura");
      
      // Evitar processamento duplicado
      if (window._bloqueioInputAltura) {
        console.log("DIAGNÓSTICO: Bloqueando eventos duplicados de altura");
        return;
      }
      
      window._bloqueioInputAltura = true;
      
      // Obter o valor
      const valor = parseInt(this.value, 10);
      
      // Validar valor
      if (!isNaN(valor) && valor >= 200 && valor <= 3000) {
        // Chamar o handler de atualização de altura
        if (typeof window.atualizarAlturaERecalcularDobradicasImediatamente === 'function') {
          window.atualizarAlturaERecalcularDobradicasImediatamente(valor);
        }
      }
      
      // Liberar bloqueio
      setTimeout(() => {
        window._bloqueioInputAltura = false;
      }, 800);
    });
  }
  
  console.log("Diagnóstico de redesenho concluído. As funções de desenho foram protegidas contra chamadas múltiplas.");
  console.log("Tente mudar a altura da porta novamente.");
  
  return true;
}

// Expor funções globalmente para execução no console
window.diagnosticarProblemaCalculoPosicoes = diagnosticarProblemaCalculoPosicoes;
window.diagnosticarProblemaRedesenho = diagnosticarProblemaRedesenho;

/**
 * Função para substituir completamente a atualização de altura
 * Esta é a abordagem mais radical, substituindo toda a lógica de atualização
 * por uma versão extremamente simplificada e robusta
 */
function diagnosticarProblemaAlturaCompleto() {
  console.log("Iniciando diagnóstico completo do problema de altura");
  
  // 1. Desativar todos os event listeners existentes no campo de altura
  const alturaInput = document.getElementById('alturaInput');
  if (!alturaInput) {
    console.error("DIAGNÓSTICO: Campo de altura não encontrado");
    return false;
  }
  
  // Função para clonar e substituir o elemento, removendo todos os listeners
  function removerTodosEventListeners(elemento) {
    const clone = elemento.cloneNode(true);
    elemento.parentNode.replaceChild(clone, elemento);
    return clone;
  }
  
  // Clonar o campo para remover todos os listeners
  const novoAlturaInput = removerTodosEventListeners(alturaInput);
  
  // 2. Criar função simplificada para atualização da altura
  function atualizarAlturaSimplificado(altura) {
    console.log("DIAGNÓSTICO: Atualizando altura de forma simplificada:", altura);
    
    // Validar altura
    altura = parseInt(altura, 10);
    if (isNaN(altura) || altura < 200 || altura > 3000) {
      console.error("DIAGNÓSTICO: Altura inválida:", altura);
      return false;
    }
    
    // Obter configuração atual
    if (typeof window.obterConfiguracaoAtual !== 'function') {
      console.error("DIAGNÓSTICO: Função obterConfiguracaoAtual não encontrada");
      return false;
    }
    
    const config = window.obterConfiguracaoAtual();
    const alturaAntiga = config.altura;
    
    // Determinar número de dobradiças pela altura
    let numDobradicas;
    if (altura <= 900) {
      numDobradicas = 2;
    } else if (altura <= 1500) {
      numDobradicas = 3;
    } else if (altura <= 2600) {
      numDobradicas = 4;
    } else {
      numDobradicas = 5;
    }
    
    // Calcular posições de dobradiças diretamente, sem chamar funções externas
    const posicoes = [];
    const distanciaExtremidade = 100;
    const espacoDisponivel = altura - (2 * distanciaExtremidade);
    
    for (let i = 0; i < numDobradicas; i++) {
      if (i === 0) {
        posicoes.push(distanciaExtremidade);
      } else if (i === numDobradicas - 1) {
        posicoes.push(altura - distanciaExtremidade);
      } else {
        posicoes.push(Math.round(distanciaExtremidade + (i * (espacoDisponivel / (numDobradicas - 1)))));
      }
    }
    
    // Atualizar puxador se necessário
    let puxador = config.puxador || {};
    if (puxador.posicao === 'vertical' && puxador.medida !== 'Tamanho da Porta') {
      const alturaPuxador = parseInt(puxador.medida, 10);
      if (!isNaN(alturaPuxador)) {
        // Centralizar puxador na porta
        const cotaSuperior = Math.round((altura - alturaPuxador) / 2);
        const cotaInferior = altura - (cotaSuperior + alturaPuxador);
        
        puxador = {
          ...puxador,
          cotaSuperior: cotaSuperior,
          cotaInferior: cotaInferior
        };
        
        // Atualizar campos visuais do puxador
        const puxadorCotaSuperior = document.getElementById('puxadorCotaSuperior');
        const puxadorCotaInferior = document.getElementById('puxadorCotaInferior');
        
        if (puxadorCotaSuperior) puxadorCotaSuperior.value = cotaSuperior;
        if (puxadorCotaInferior) puxadorCotaInferior.value = cotaInferior;
      }
    }
    
    // Criar nova configuração completa
    const novaConfig = {
      ...config,
      altura: altura,
      numDobradicas: numDobradicas,
      dobradicas: posicoes,
      puxador: puxador
    };
    
    // Atualizar campos visuais de dobradiças
    const numDobradicasInput = document.getElementById('numDobradicasInput');
    if (numDobradicasInput) numDobradicasInput.value = numDobradicas;
    
    // Atualizar o container de campos de dobradiças
    const containerDobradicas = document.getElementById('dobradicasCampos');
    if (containerDobradicas && typeof window.atualizarCamposPosicoesDobradicasQtd === 'function') {
      try {
        window.atualizarCamposPosicoesDobradicasQtd(numDobradicas, posicoes);
      } catch (error) {
        console.error("DIAGNÓSTICO: Erro ao atualizar campos de dobradiças", error);
        // Fallback: Limpar e criar campos manualmente
        containerDobradicas.innerHTML = '';
        for (let i = 0; i < numDobradicas; i++) {
          const row = document.createElement('div');
          row.className = 'input-group mb-2';
          row.innerHTML = `
            <span class="input-group-text">${i+1} Dob:</span>
            <input type="number" class="form-control" id="dobradicaPos${i+1}" 
                   value="${posicoes[i]}" min="0" max="${altura}">
          `;
          containerDobradicas.appendChild(row);
        }
      }
    }
    
    // Atualizar configuração sem chamar funções que possam causar loops
    if (typeof window.atualizarConfiguracao === 'function') {
      try {
        window.atualizarConfiguracao(novaConfig);
      } catch (error) {
        console.error("DIAGNÓSTICO: Erro ao atualizar configuração", error);
      }
    }
    
    // Forçar redesenho direto, uma única vez
    if (typeof window.desenharPorta === 'function') {
      try {
        // Usar setTimeout para evitar possíveis loops recursivos
        setTimeout(() => {
          window.desenharPorta(novaConfig, true);
        }, 50);
      } catch (error) {
        console.error("DIAGNÓSTICO: Erro ao desenhar porta", error);
      }
    }
    
    return true;
  }
  
  // 3. Adicionar novo event listener para o campo de altura
  novoAlturaInput.addEventListener('change', function(event) {
    console.log("DIAGNÓSTICO: Evento change no campo de altura (substituído)");
    
    // Prevenir comportamento padrão
    event.preventDefault();
    
    // Obter valor
    const valor = parseInt(this.value, 10);
    
    // Validar valor
    if (isNaN(valor)) {
      console.error("DIAGNÓSTICO: Valor inválido no campo de altura");
      return false;
    }
    
    // Aplicar restrições
    let alturaFinal = valor;
    if (valor < 200) {
      alturaFinal = 200;
      this.value = 200;
    } else if (valor > 3000) {
      alturaFinal = 3000;
      this.value = 3000;
    }
    
    // Atualizar altura com versão simplificada
    atualizarAlturaSimplificado(alturaFinal);
  });
  
  // 4. Substituir também o handler para a tecla Enter
  novoAlturaInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      const valor = parseInt(this.value, 10);
      if (!isNaN(valor)) {
        // Aplicar restrições
        let alturaFinal = valor;
        if (valor < 200) {
          alturaFinal = 200;
          this.value = 200;
        } else if (valor > 3000) {
          alturaFinal = 3000;
          this.value = 3000;
        }
        
        // Atualizar altura com versão simplificada
        atualizarAlturaSimplificado(alturaFinal);
      }
    }
  });
  
  // 5. Substituir completamente a função global
  if (typeof window.atualizarAlturaERecalcularDobradicasImediatamente === 'function') {
    console.log("DIAGNÓSTICO: Substituindo função de atualização de altura");
    window.atualizarAlturaERecalcularDobradicasImediatamente = atualizarAlturaSimplificado;
  }
  
  console.log("Diagnóstico completo finalizado. A função de atualização de altura foi totalmente substituída.");
  console.log("Tente mudar a altura da porta novamente.");
  
  return true;
}

// Expor a nova função globalmente
window.diagnosticarProblemaAlturaCompleto = diagnosticarProblemaAlturaCompleto;

/**
 * Verifica o estado do localStorage e detecta valores inválidos ou faltantes
 * Útil para depurar problemas em modo anônimo ou após limpeza do localStorage
 */
function diagnosticarLocalStorage() {
  console.log("=== DIAGNÓSTICO DO LOCALSTORAGE ===");
  
  // Verificar se o localStorage está disponível
  try {
    const testKey = '_diagnostico_test';
    localStorage.setItem(testKey, 'teste');
    localStorage.removeItem(testKey);
    console.log("✅ localStorage disponível e funcional");
  } catch (error) {
    console.error("❌ localStorage indisponível:", error);
    return;
  }
  
  // Verificar padrões por tipo de porta
  try {
    const padroesSalvos = localStorage.getItem('conecta_portas_padrao');
    if (!padroesSalvos) {
      console.warn("⚠️ Nenhum padrão por tipo de porta encontrado");
    } else {
      const padroes = JSON.parse(padroesSalvos);
      console.log("✅ Padrões por tipo de porta:", padroes);
      
      // Verificar cada tipo de porta
      const tiposEsperados = [
        'Abrir Superior Direita',
        'Abrir Superior Esquerda', 
        'Abrir Inferior Direita', 
        'Abrir Inferior Esquerda',
        'Basculante',
        'Deslizante'
      ];
      
      for (const tipo of tiposEsperados) {
        if (!padroes[tipo]) {
          console.warn(`⚠️ Tipo de porta '${tipo}' não encontrado nos padrões`);
        } else {
          const padrao = padroes[tipo];
          if (!padrao.altura || !padrao.largura || 
              isNaN(Number(padrao.altura)) || isNaN(Number(padrao.largura))) {
            console.error(`❌ Valores inválidos para o tipo '${tipo}':`, padrao);
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Erro ao verificar padrões por tipo de porta:", error);
  }
  
  // Verificar última configuração
  try {
    const ultimaConfig = localStorage.getItem('conecta_ultima_config');
    if (!ultimaConfig) {
      console.warn("⚠️ Nenhuma última configuração encontrada");
    } else {
      try {
        const config = JSON.parse(ultimaConfig);
        console.log("✅ Última configuração:", config);
        
        // Verificar valores críticos
        if (!config.altura || !config.largura || 
            isNaN(Number(config.altura)) || isNaN(Number(config.largura))) {
          console.error("❌ Valores inválidos na última configuração:", { 
            altura: config.altura, 
            largura: config.largura 
          });
        }
        
        // Verificar função da porta
        if (!config.funcao) {
          console.warn("⚠️ Função da porta não definida na última configuração");
        }
      } catch (e) {
        console.error("❌ Erro ao parsear última configuração:", e);
      }
    }
  } catch (error) {
    console.error("❌ Erro ao verificar última configuração:", error);
  }
  
  // Verificar todas as configurações salvas
  try {
    const configsSalvas = localStorage.getItem('conecta_portas_configs');
    if (!configsSalvas) {
      console.warn("⚠️ Nenhuma configuração salva encontrada");
    } else {
      try {
        const configs = JSON.parse(configsSalvas);
        console.log(`✅ ${configs.length} configurações salvas encontradas`);
        
        // Verificar cada configuração
        for (let i = 0; i < configs.length; i++) {
          const config = configs[i];
          if (!config.dados || !config.dados.largura || !config.dados.altura ||
              isNaN(Number(config.dados.largura)) || isNaN(Number(config.dados.altura))) {
            console.error(`❌ Valores inválidos na configuração #${i}:`, config);
          }
        }
      } catch (e) {
        console.error("❌ Erro ao parsear configurações salvas:", e);
      }
    }
  } catch (error) {
    console.error("❌ Erro ao verificar configurações salvas:", error);
  }
  
  console.log("=== FIM DO DIAGNÓSTICO ===");
}

// Expor a função globalmente para chamada no console
window.diagnosticarLocalStorage = diagnosticarLocalStorage; 