/**
 * Módulo de inicialização do sistema
 */

import { inicializarAuth, isLoggedIn } from './auth.js';

// Variáveis globais
let configuracaoAtual = {
  parceiro: '',
  cliente: '',
  ambiente: '',
  largura: undefined,
  altura: undefined,
  quantidade: 1,
  vidro: 'Incolor',
  perfilModelo: 'RM-114',
  perfilCor: 'Preto',
  funcao: 'superiorDireita',
  modeloDeslizante: 'RO-654025',
  numDobradicas: 4,
  dobradicas: [100, 500, 1000, 2000],
  puxador: {
    modelo: 'Cielo',
    medida: '150',
    posicao: 'vertical',
    cotaSuperior: 950,
    cotaInferior: 1000,
    deslocamento: 100,
    lados: 'direito'
  },
  observacao: ''
};

// Configuração padrão (cópia da configuração atual)
const configuracaoPadrao = { ...configuracaoAtual };

/**
 * Inicializa o sistema
 */
function inicializar() {
  console.log('Inicializando sistema base...');
  
  // Verificar compatibilidade do navegador
  if (!verificarCompatibilidade()) {
    console.warn('Navegador com compatibilidade limitada');
  }
  
  // Inicializar configuração padrão
  if (!configuracaoAtual.largura) {
    configuracaoAtual = { ...configuracaoPadrao };
  }
  
  // Inicializar sistema de autenticação
  inicializarAuth();
  
  // Garantir que a seção GERENCIAMENTO esteja visível para todos os usuários
  // e que o botão de cadastramento esteja sempre visível
  setTimeout(() => {
    const accordionItems = document.querySelectorAll('.accordion-item');
    for (const item of accordionItems) {
      if (item.querySelector('#headingGerenciamento')) {
        item.style.display = 'block';
        break;
      }
    }
    
    // Garantir que o botão de cadastramento esteja sempre visível
    const btnCadastramento = document.getElementById('btnCadastramento');
    if (btnCadastramento) {
      btnCadastramento.style.display = 'block';
    }
  }, 500);
  
  // Exposição global para compatibilidade com código legado
  window.obterConfiguracaoAtual = obterConfiguracaoAtual;
  window.atualizarConfiguracao = atualizarConfiguracao;
  
  return true;
}

/**
 * Configura variáveis de ambiente
 */
function configurarVariaveisAmbiente() {
  window.APP_VERSION = '1.0.0';
  window.DEBUG_MODE = window.location.hostname === 'localhost';
  window.PRECO_BASE = 350; // Preço base por m²
}

/**
 * Verifica a compatibilidade do navegador
 */
function verificarCompatibilidade() {
  // Verificar SVG
  const svgNS = 'http://www.w3.org/2000/svg';
  const svgSupport = !!document.createElementNS && !!document.createElementNS(svgNS, 'svg').createSVGRect;
  
  if (!svgSupport) {
    console.warn('Navegador não suporta SVG. Algumas funcionalidades podem não funcionar.');
  }
  
  // Verificar Canvas (como backup)
  if (!window.HTMLCanvasElement) {
    console.warn('Navegador não suporta Canvas. Funcionalidades de exportação podem ser afetadas.');
  }
  
  // Verificar localStorage
  try {
    localStorage.setItem('teste', 'teste');
    localStorage.removeItem('teste');
  }
  catch (e) {
    console.warn('LocalStorage não está disponível. As configurações não serão salvas.');
  }
}

/**
 * Configura opções de idioma e formatação
 */
function configurarIdioma() {
  // Definir idioma padrão
  document.documentElement.lang = 'pt-BR';
}

/**
 * Inicializa o tema da aplicação
 */
function inicializarTema() {
  // Tentar carregar tema das preferências do usuário
  try {
    const temaSalvo = localStorage.getItem('tema');
    if (temaSalvo) {
      document.body.classList.add(`tema-${temaSalvo}`);
    }
    else {
      // Verificar preferência do sistema
      const prefereTemaEscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.add(`tema-${prefereTemaEscuro ? 'escuro' : 'claro'}`);
    }
  }
  catch (e) {
    console.warn('Erro ao definir tema:', e);
    // Usar tema claro como fallback
    document.body.classList.add('tema-claro');
  }
}

/**
 * Obter configuração atual com base nos valores nos inputs
 */
function obterConfiguracaoAtual() {
  const larguraInput = document.getElementById('larguraInput');
  const alturaInput = document.getElementById('alturaInput');
  const quantidadeInput = document.getElementById('quantidadeInput');
  const vidroTipo = document.getElementById('vidroTipo');
  const perfilModelo = document.getElementById('perfilModelo');
  const perfilCor = document.getElementById('perfilCor');
  const funcaoPorta = document.getElementById('funcaoPorta');
  const modeloDeslizante = document.getElementById('modeloDeslizante');
  const numDobradicasInput = document.getElementById('numDobradicasInput');
  const puxadorModelo = document.getElementById('puxadorModelo');
  const puxadorMedida = document.getElementById('puxadorMedida');
  const puxadorPosicao = document.getElementById('puxadorPosicao');
  const puxadorCotaSuperior = document.getElementById('puxadorCotaSuperior');
  const puxadorCotaInferior = document.getElementById('puxadorCotaInferior');
  const puxadorLados = document.getElementById('puxadorLados');
  const observacaoInput = document.getElementById('observacaoInput');
  const parceiroInput = document.getElementById('parceiroInput');
  const clienteInput = document.getElementById('clienteInput');
  const ambienteInput = document.getElementById('ambienteInput');

  // Coleta posições das dobradiças (se houver)
  let dobradicas = [];
  const dobradicasCampos = document.querySelectorAll('#dobradicasCampos .dobradicaCampo input');
  if (dobradicasCampos && dobradicasCampos.length > 0) {
    dobradicas = Array.from(dobradicasCampos).map(input => parseInt(input.value, 10));
  }

  // Obter valores de largura e altura de forma mais robusta
  let largura = configuracaoAtual.largura;
  let altura = configuracaoAtual.altura;
  
  if (larguraInput && larguraInput.value) {
    const parsedLargura = parseInt(larguraInput.value, 10);
    if (!isNaN(parsedLargura)) {
      largura = parsedLargura;
    }
  }
  
  if (alturaInput && alturaInput.value) {
    const parsedAltura = parseInt(alturaInput.value, 10);
    if (!isNaN(parsedAltura)) {
      altura = parsedAltura;
    }
  }
  
  // Função da porta
  const funcao = funcaoPorta ? funcaoPorta.value : configuracaoAtual.funcao;
  
  // Obter o número de dobradiças
  let numDobradicas = numDobradicasInput ? 
    parseInt(numDobradicasInput.value, 10) || configuracaoAtual.numDobradicas : 
    configuracaoAtual.numDobradicas;
    
  // Se for basculante, o número de dobradiças deve ser calculado com base na largura
  // APENAS se o campo não tiver sido alterado manualmente pelo usuário
  if (funcao === "basculante") {
    // Usar a função definirNumeroDobradicasBasculante se estiver disponível
    if (window.definirNumeroDobradicasBasculante) {
      // Verificar se o valor atual corresponde ao calculado automaticamente
      // Se forem diferentes, significa que o usuário alterou manualmente
      const numCalculado = window.definirNumeroDobradicasBasculante(largura);
      
      // Verificar se o valor do input corresponde ao valor calculado
      // Se não corresponder, manter o valor manual do usuário
      if (numDobradicasInput && numDobradicas === numCalculado) {
        // Os valores são iguais, então aplicamos o calculado automaticamente
        numDobradicas = numCalculado;
        numDobradicasInput.value = numDobradicas;
      }
      // Se forem diferentes, mantemos o valor manualmente escolhido pelo usuário
    } else {
      // Fallback se a função não estiver disponível
      numDobradicas = 2;
    }
  }
  
  // Se for correr, somente 1 trilho
  let numTrilhos = 1;
  if (funcao === "correr" && tipoPorta === "correr-2-folhas-sobrepor") {
    numTrilhos = 2;
  }
  
  const configAtualizada = {
    parceiro: parceiroInput ? parceiroInput.value : configuracaoAtual.parceiro,
    cliente: clienteInput ? clienteInput.value : configuracaoAtual.cliente,
    ambiente: ambienteInput ? ambienteInput.value : configuracaoAtual.ambiente,
    largura: largura,
    altura: altura,
    quantidade: quantidadeInput ? parseInt(quantidadeInput.value, 10) || configuracaoAtual.quantidade : configuracaoAtual.quantidade,
    vidro: vidroTipo ? vidroTipo.value : configuracaoAtual.vidro,
    perfilModelo: perfilModelo ? perfilModelo.value : configuracaoAtual.perfilModelo,
    perfilCor: perfilCor ? perfilCor.value : configuracaoAtual.perfilCor,
    funcao: funcao,
    portaEmPar: (function() {
      const parCheckbox = document.getElementById('parCheckbox');
      if (parCheckbox) return !!parCheckbox.checked;
      return configuracaoAtual.portaEmPar || false;
    })(),
    modeloDeslizante: modeloDeslizante ? modeloDeslizante.value : configuracaoAtual.modeloDeslizante,
    numDobradicas: numDobradicas,
    dobradicas: dobradicas.length > 0 ? dobradicas : configuracaoAtual.dobradicas,
    puxador: {
      modelo: puxadorModelo ? 
        puxadorModelo.value : 
        configuracaoAtual.puxador?.modelo || 'Cielo',
        
      medida: puxadorMedida ? 
        puxadorMedida.value : 
        configuracaoAtual.puxador?.medida || '150',
        
      posicao: puxadorPosicao ? 
        puxadorPosicao.value : 
        configuracaoAtual.puxador?.posicao || 'vertical',
        
      cotaSuperior: puxadorCotaSuperior ? 
        (puxadorCotaSuperior.value === '0' || puxadorCotaSuperior.value === 0) ? 0 :
        (parseInt(puxadorCotaSuperior.value, 10) || configuracaoAtual.puxador?.cotaSuperior) : 
        configuracaoAtual.puxador?.cotaSuperior || 950,
        
      cotaInferior: puxadorCotaInferior ? 
        (puxadorCotaInferior.value === '0' || puxadorCotaInferior.value === 0) ? 0 :
        (parseInt(puxadorCotaInferior.value, 10) || configuracaoAtual.puxador?.cotaInferior) : 
        configuracaoAtual.puxador?.cotaInferior || 1000,
        
      lados: puxadorLados ? 
        puxadorLados.value : 
        configuracaoAtual.puxador?.lados || 'esquerdo'
    },
    observacao: observacaoInput ? observacaoInput.value : configuracaoAtual.observacao
  };

  // Atualiza a variável global também (opcional, mas pode ser útil)
  atualizarConfiguracao(configAtualizada);

  return configAtualizada;
}

/**
 * Atualiza a configuração atual
 * @param {Object} novasConfiguracoes - Novas configurações a serem aplicadas
 */
function atualizarConfiguracao(novasConfiguracoes = {}) {
  // Validar valores críticos antes de atualizar
  if (novasConfiguracoes.altura !== undefined) {
    // Verificar se altura é um número válido
    const altura = Number(novasConfiguracoes.altura);
    if (isNaN(altura) || altura <= 0) {
      console.error('[ERRO Vibecode] Altura inválida em atualizarConfiguracao:', novasConfiguracoes.altura);
      // Manter o valor atual ou usar fallback
      novasConfiguracoes.altura = configuracaoAtual.altura || 2100;
    }
  }
  
  if (novasConfiguracoes.largura !== undefined) {
    // Verificar se largura é um número válido
    const largura = Number(novasConfiguracoes.largura);
    if (isNaN(largura) || largura <= 0) {
      console.error('[ERRO Vibecode] Largura inválida em atualizarConfiguracao:', novasConfiguracoes.largura);
      // Manter o valor atual ou usar fallback
      novasConfiguracoes.largura = configuracaoAtual.largura || 700;
    }
  }
  
  // Mesclar configurações
  configuracaoAtual = {
    ...configuracaoAtual,
    ...novasConfiguracoes,
    // Mesclar objeto de puxador se existir
    puxador: {
      ...configuracaoAtual.puxador,
      ...(novasConfiguracoes.puxador || {})
    }
  };
  
  // Verificar se dobradicas precisa ser atualizado
  if (novasConfiguracoes.dobradicas) {
    configuracaoAtual.dobradicas = [...novasConfiguracoes.dobradicas];
  }
  
  // Validar valores finais críticos (dupla verificação)
  if (typeof configuracaoAtual.altura !== 'number' || isNaN(configuracaoAtual.altura) || configuracaoAtual.altura <= 0) {
    console.warn('[AVISO Vibecode] Altura final inválida, corrigindo para valor padrão');
    configuracaoAtual.altura = 2100;
  }
  
  if (typeof configuracaoAtual.largura !== 'number' || isNaN(configuracaoAtual.largura) || configuracaoAtual.largura <= 0) {
    console.warn('[AVISO Vibecode] Largura final inválida, corrigindo para valor padrão');
    configuracaoAtual.largura = 700;
  }
  
  // Atualizar o desenho e as especificações se a função desenharPorta estiver disponível
  if (typeof window.desenharPorta === 'function') {
    // Pequeno atraso para garantir que a atualização ocorra após todas as alterações
    setTimeout(() => {
      try {
        window.desenharPorta(configuracaoAtual);
      } catch (error) {
        console.error('[ERRO Vibecode] Erro ao desenhar porta após atualização:', error);
      }
    }, 10);
  }
  
  return configuracaoAtual;
}

// Exportar funções necessárias
export {
  inicializar,
  verificarCompatibilidade,
  obterConfiguracaoAtual,
  atualizarConfiguracao,
  configuracaoAtual
}; 