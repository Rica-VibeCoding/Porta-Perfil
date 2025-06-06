/**
 * Módulo de armazenamento - Gerencia o salvamento e carregamento de configurações
 * @module storage
 */
import { obterConfiguracaoAtual, atualizarConfiguracao } from './initialize.js';
import { atualizarDesenho } from './drawing.js';
import { mostrarNotificacao } from './notifications.js';
import { updateDobradicaInputs } from './form-handlers.js';

// Versão do esquema de armazenamento - incrementar quando a estrutura mudar
const STORAGE_VERSION = 1;
const VERSION_KEY = 'conecta_storage_version';

// Chave para armazenar configurações no localStorage
const STORAGE_KEY = 'conecta_portas_configs';
const LAST_CONFIG_KEY = 'conecta_ultima_config';
const LOGO_KEY = 'logo_empresa';

// [Vibecode] --- PADRÕES POR TIPO DE PORTA ---
const PADROES_PORTA_KEY = 'conecta_portas_padrao';

// Padrões iniciais por tipo de porta
const PADROES_INICIAIS_PORTA = {
  'Abrir Superior Direita': { largura: 450, altura: 2450 },
  'Abrir Superior Esquerda': { largura: 450, altura: 2450 },
  'Abrir Inferior Direita': { largura: 450, altura: 2450 },
  'Abrir Inferior Esquerda': { largura: 450, altura: 2450 },
  'Basculante': { largura: 1000, altura: 450 },
  'Deslizante': { largura: 900, altura: 2450 }
};

/**
 * Verifica e executa migração de dados se necessário
 */
function inicializarVersaoStorage() {
  try {
    const currentVersion = localStorage.getItem(VERSION_KEY) || 0;
    
    if (parseInt(currentVersion) < STORAGE_VERSION) {
      console.log(`Migrando dados do armazenamento da versão ${currentVersion} para ${STORAGE_VERSION}`);
      migrateStorageData(parseInt(currentVersion), STORAGE_VERSION);
      localStorage.setItem(VERSION_KEY, STORAGE_VERSION.toString());
    }
  } catch (error) {
    console.error('Erro ao verificar versão do armazenamento:', error);
  }
}

/**
 * Migra dados entre versões de armazenamento
 * @param {number} fromVersion - Versão atual dos dados
 * @param {number} toVersion - Versão alvo para migração
 */
function migrateStorageData(fromVersion, toVersion) {
  // Migração da versão 0 (sem versão) para versão 1
  if (fromVersion < 1 && toVersion >= 1) {
    try {
      // Migrar configurações salvas
      const configs = obterTodasConfiguracoes();
      const normalizedConfigs = configs.map(config => ({
        id: config.id || Date.now().toString(),
        nome: config.nome || 'Projeto sem nome',
        data: config.data || new Date().toISOString(),
        dados: normalizeConfig(config.dados || config)
      }));
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedConfigs));
      
      // Migrar última configuração
      const lastConfig = JSON.parse(localStorage.getItem(LAST_CONFIG_KEY) || '{}');
      if (lastConfig && Object.keys(lastConfig).length > 0) {
        const normalizedLastConfig = {
          id: lastConfig.id || Date.now().toString(),
          nome: lastConfig.nome || 'Último projeto',
          data: lastConfig.data || new Date().toISOString(),
          dados: normalizeConfig(lastConfig.dados || lastConfig)
        };
        
        localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify(normalizedLastConfig));
      }
      
      console.log('Migração para versão 1 concluída com sucesso');
    } catch (error) {
      console.error('Erro durante migração para versão 1:', error);
    }
  }
  
  // Adicionar mais migrações aqui quando novas versões forem criadas
}

/**
 * Normaliza uma configuração para o formato padrão
 * @param {Object} config - Configuração a normalizar
 * @returns {Object} Configuração normalizada
 */
function normalizeConfig(config) {
  if (!config) return null;
  
  // Criar estrutura padronizada
  const normalized = {
    // Dados básicos
    largura: getNestedValue(config, 'largura', 450),
    altura: getNestedValue(config, 'altura', 2450),
    funcao: getNestedValue(config, 'funcao', 'superiorDireita'),
    
    // Vidro e perfil
    vidroTipo: getNestedValue(config, 'vidroTipo', 'Incolor') || getNestedValue(config, 'vidro', 'Incolor'),
    perfilModelo: getNestedValue(config, 'perfilModelo', 'RM-114'),
    perfilCor: getNestedValue(config, 'perfilCor', 'Preto'),
    
    // Informações do cliente
    parceiro: getNestedValue(config, 'parceiro', ''),
    cliente: getNestedValue(config, 'cliente', ''),
    ambiente: getNestedValue(config, 'ambiente', ''),
    
    // Outros campos
    quantidade: getNestedValue(config, 'quantidade', 1),
    numDobradicas: getNestedValue(config, 'numDobradicas', 4),
    observacao: getNestedValue(config, 'observacao', '') || getNestedValue(config, 'descricao', ''),
    
    // Puxador
    puxador: {
      modelo: getNestedPuxadorValue(config, 'modelo', 'Cielo'),
      medida: getNestedPuxadorValue(config, 'medida', '150'),
      posicao: getNestedPuxadorValue(config, 'posicao', 'vertical'),
      cotaSuperior: getNestedPuxadorValue(config, 'cotaSuperior', 950),
      cotaInferior: getNestedPuxadorValue(config, 'cotaInferior', 1000),
      deslocamento: getNestedPuxadorValue(config, 'deslocamento', 50),
      lados: getNestedPuxadorValue(config, 'lados', 'esquerdo')
    }
  };
  
  return normalized;
}

/**
 * Extrai um valor aninhado de um objeto config, considerando diferentes caminhos possíveis
 * @param {Object} config - Objeto de configuração
 * @param {string} key - Chave a buscar
 * @param {*} defaultValue - Valor padrão se não encontrado
 */
function getNestedValue(config, key, defaultValue) {
  if (!config) return defaultValue;
  
  // Verificar diretamente no objeto
  if (config[key] !== undefined) return config[key];
  
  // Verificar em config.dados
  if (config.dados && config.dados[key] !== undefined) return config.dados[key];
  
  // Verificar em config.dados.dados
  if (config.dados && config.dados.dados && config.dados.dados[key] !== undefined) {
    return config.dados.dados[key];
  }
  
  return defaultValue;
}

/**
 * Extrai um valor aninhado específico para o puxador
 * @param {Object} config - Objeto de configuração
 * @param {string} key - Chave a buscar
 * @param {*} defaultValue - Valor padrão se não encontrado
 */
function getNestedPuxadorValue(config, key, defaultValue) {
  if (!config) return defaultValue;
  
  // Verificar em config.puxador
  if (config.puxador && config.puxador[key] !== undefined) return config.puxador[key];
  
  // Verificar em config.dados.puxador
  if (config.dados && config.dados.puxador && config.dados.puxador[key] !== undefined) {
    return config.dados.puxador[key];
  }
  
  // Verificar em config.dados.dados.puxador
  if (config.dados && config.dados.dados && config.dados.dados.puxador && 
      config.dados.dados.puxador[key] !== undefined) {
    return config.dados.dados.puxador[key];
  }
  
  return defaultValue;
}

/**
 * Inicializa o sistema de armazenamento
 * @param {boolean} [carregarUltima=true] - Se verdadeiro, carrega a última configuração usada
 */
function inicializarArmazenamento(carregarUltima = true) {
  // Inicializar sistema de versionamento e migração
  inicializarVersaoStorage();
  
  // Carregar configurações salvas no modal
  carregarConfiguracoesNoModal();
    
  // Configurar botão de salvar
  const btnSalvar = document.querySelector('.modal-content button');
  if (btnSalvar) {
    btnSalvar.addEventListener('click', salvarConfiguracaoAtual);
  }
    
  // Carregar última configuração usada
  if (carregarUltima) {
    try {
      carregarUltimaConfiguracao();
    }
    catch (e) {
      console.warn('Erro ao carregar última configuração:', e);
    }
  }
  else {
    console.log('Carregamento da última configuração adiado para evitar erro de SVG não inicializado');
  }
}

/**
 * Carrega as configurações salvas no modal
 */
function carregarConfiguracoesNoModal() {
  const savedConfigs = document.getElementById('savedConfigs');
  if (!savedConfigs) {
    return;
  }
    
  // Limpar conteúdo existente
  savedConfigs.innerHTML = '';
    
  // Obter configurações salvas
  const configs = obterTodasConfiguracoes();
    
  if (configs.length === 0) {
    // Mostrar mensagem se não houver configurações
    const mensagem = document.createElement('p');
    mensagem.textContent = 'Nenhuma configuração salva.';
    mensagem.style.fontStyle = 'italic';
    mensagem.style.color = '#666';
    savedConfigs.appendChild(mensagem);
    return;
  }
    
  // Criar lista de configurações
  const lista = document.createElement('ul');
  lista.className = 'config-list';
    
  configs.forEach(config => {
    const item = criarItemConfiguracao(config);
    lista.appendChild(item);
  });
    
  savedConfigs.appendChild(lista);
}

/**
 * Cria um item na lista de configurações
 * @param {Object} config - Configuração a ser exibida
 * @returns {HTMLElement} - Elemento de lista
 */
function criarItemConfiguracao(config) {
  const item = document.createElement('li');
  item.className = 'config-item';
  
  // Wrapper para todos os elementos em linha única
  const wrapper = document.createElement('div');
  wrapper.className = 'config-details single-line';
  
  // Nome do projeto (principal) - sem as dimensões
  const nome = document.createElement('span');
  nome.className = 'config-name';
  
  // Extrair o nome sem as dimensões
  let nomeProjeto = config.nome || 'Projeto sem nome';
  // Remover o padrão de dimensões (ex: "- 700x2100mm") se existir
  nomeProjeto = nomeProjeto.replace(/\s+-\s+\d+x\d+mm$/, '');
  nome.textContent = nomeProjeto;
  
  // Container de informações adicionais
  const infoContainer = document.createElement('div');
  infoContainer.className = 'config-info-container';
  
  // Dimensões
  const dimensoes = document.createElement('span');
  dimensoes.className = 'config-dimensoes';
  
  // Correção para obter corretamente as dimensões
  let largura = "?";
  let altura = "?";
  
  // Verificar todas as possíveis localizações dos valores
  if (config.dados) {
    if (config.dados.largura) largura = config.dados.largura;
    else if (config.dados.dados && config.dados.dados.largura) largura = config.dados.dados.largura;
    
    if (config.dados.altura) altura = config.dados.altura;
    else if (config.dados.dados && config.dados.dados.altura) altura = config.dados.dados.altura;
  }
  
  dimensoes.innerHTML = `<i class="bi bi-arrows-angle-expand"></i> ${largura}×${altura}mm`;
  
  // Tipo de vidro
  const vidro = document.createElement('span');
  vidro.className = 'config-vidro';
  let tipoVidro = "Incolor";
  
  if (config.dados) {
    if (config.dados.vidroTipo) tipoVidro = config.dados.vidroTipo;
    else if (config.dados.dados && config.dados.dados.vidroTipo) tipoVidro = config.dados.dados.vidroTipo;
  }
  
  vidro.innerHTML = `<i class="bi bi-grid-3x3"></i> ${tipoVidro}`;
  
  // Função da porta
  const funcao = document.createElement('span');
  funcao.className = 'config-funcao';
  let tipoFuncao = "superiorDireita";
  
  if (config.dados) {
    if (config.dados.funcao) tipoFuncao = config.dados.funcao;
    else if (config.dados.dados && config.dados.dados.funcao) tipoFuncao = config.dados.dados.funcao;
  }
  
  // Converter códigos de função para texto mais legível
  const funcaoMap = {
    'superiorDireita': 'Sup. Direita',
    'superiorEsquerda': 'Sup. Esquerda',
    'inferiorDireita': 'Inf. Direita',
    'inferiorEsquerda': 'Inf. Esquerda',
    'deslizante': 'Deslizante'
  };
  funcao.innerHTML = `<i class="bi bi-door-open"></i> ${funcaoMap[tipoFuncao] || tipoFuncao}`;
  
  // Data de criação com horário
  const data = document.createElement('span');
  data.className = 'config-date';
  try {
    const dataObj = new Date(config.data);
    const dataFormatada = dataObj.toLocaleDateString('pt-BR');
    const horaFormatada = dataObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
    data.innerHTML = `<i class="bi bi-calendar3"></i> ${dataFormatada} ${horaFormatada}`;
  } catch (e) {
    data.innerHTML = `<i class="bi bi-calendar3"></i> Data desconhecida`;
  }
  
  // Botões de ação
  const acoes = document.createElement('div');
  acoes.className = 'config-actions';
    
  const btnCarregar = document.createElement('button');
  btnCarregar.innerHTML = '<i class="bi bi-folder2-open"></i>';
  btnCarregar.title = 'Carregar projeto';
  btnCarregar.className = 'btn-load';
  btnCarregar.addEventListener('click', () => carregarConfiguracao(config.id));
    
  const btnExcluir = document.createElement('button');
  btnExcluir.innerHTML = '<i class="bi bi-trash"></i>';
  btnExcluir.title = 'Excluir projeto';
  btnExcluir.className = 'btn-delete';
  btnExcluir.addEventListener('click', () => excluirConfiguracao(config.id));
    
  // Montar o item
  acoes.appendChild(btnCarregar);
  acoes.appendChild(btnExcluir);
  
  // Adicionar informações ao container de info
  infoContainer.appendChild(dimensoes);
  infoContainer.appendChild(vidro);
  infoContainer.appendChild(funcao);
  infoContainer.appendChild(data);
  
  // Montar o wrapper em uma única linha
  wrapper.appendChild(nome);
  wrapper.appendChild(infoContainer);
  wrapper.appendChild(acoes);
  
  // Montar o item principal
  item.appendChild(wrapper);
    
  return item;
}

/**
 * Salva a configuração atual com o nome especificado
 */
function salvarConfiguracaoAtual() {
  const configName = document.getElementById('configName');
  if (!configName) {
    return;
  }
    
  const nome = configName.value.trim();
  if (!nome) {
    mostrarNotificacao('Por favor, informe um nome para a configuração.', 'erro');
    return;
  }
    
  // Obter configuração atual
  const configAtual = obterConfiguracaoAtual();
    
  // Preparar dados para salvar
  const configuracao = {
    id: Date.now().toString(),
    nome: nome,
    data: new Date().toISOString(),
    dados: configAtual
  };
    
  // Salvar configuração
  salvarConfiguracao(configuracao);
    
  // Limpar campo de nome
  configName.value = '';
    
  // Atualizar lista de configurações
  carregarConfiguracoesNoModal();
    
  // Fechar modal
  const modal = document.getElementById('configModal');
  if (modal) {
    modal.style.display = 'none';
  }
    
  // Mostrar notificação
  mostrarNotificacao('Configuração salva com sucesso!');
}

/**
 * Salva uma configuração no armazenamento
 * @param {Object} config - Configuração a ser salva
 * @returns {boolean} - true se salvou com sucesso, false caso contrário
 */
function salvarConfiguracao(config) {
  try {
    // Normalizar os dados para garantir formato consistente
    const dadosNormalizados = normalizeConfig(config);
    
    // Preparar dados para salvar
    const configuracao = {
      id: Date.now().toString(),
      nome: config.nome || 'Projeto sem nome',
      data: new Date().toISOString(),
      dados: dadosNormalizados
    };

    // Obter configurações existentes
    const configs = obterTodasConfiguracoes();
        
    // Adicionar nova configuração
    configs.push(configuracao);
        
    // Salvar no localStorage com tratamento de erros de tamanho
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    } catch (storageError) {
      // Verificar se é erro de quota excedida
      if (isQuotaExceeded(storageError)) {
        console.warn('Limite de armazenamento excedido, removendo configurações mais antigas');
        
        // Remover configurações mais antigas para liberar espaço
        if (configs.length > 1) {
          // Ordenar por data e manter apenas metade das configurações mais recentes
          configs.sort((a, b) => new Date(b.data) - new Date(a.data));
          const novoTamanho = Math.max(1, Math.floor(configs.length / 2));
          const configsReduzidas = configs.slice(0, novoTamanho);
          
          localStorage.setItem(STORAGE_KEY, JSON.stringify(configsReduzidas));
          console.log(`Armazenamento reduzido para ${novoTamanho} configurações`);
        } else {
          console.error('Não é possível reduzir mais o armazenamento');
          throw storageError;
        }
      } else {
        // Outro tipo de erro
        throw storageError;
      }
    }
        
    // Salvar também como última configuração usada
    localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify(configuracao));
        
    return true;
  }
  catch (e) {
    console.error('Erro ao salvar configuração:', e);
    mostrarNotificacao('Erro ao salvar configuração.', 'erro');
    return false;
  }
}

/**
 * Verifica se um erro é devido a quota excedida de armazenamento
 * @param {Error} e - O erro capturado
 * @returns {boolean} - true se for erro de quota excedida
 */
function isQuotaExceeded(e) {
  let quotaExceeded = false;
  
  if (e) {
    if (e.code) {
      switch (e.code) {
        case 22: // Chrome
        case 1014: // Firefox
          // O Storage está cheio
          quotaExceeded = true;
          break;
      }
    } else if (e.name === 'QuotaExceededError' || 
               e.name === 'NS_ERROR_DOM_QUOTA_REACHED') { // Firefox
      quotaExceeded = true;
    }
  }
  
  return quotaExceeded;
}

/**
 * Carrega uma configuração pelo ID
 * @param {string} id - ID da configuração
 */
function carregarConfiguracao(id) {
  // Obter todas as configurações
  const configs = obterTodasConfiguracoes();
    
  // Encontrar a configuração pelo ID
  const config = configs.find(c => c.id === id);
  if (!config) {
    // Removendo a notificação de erro
    console.log('Tentativa de carregar configuração inexistente:', id);
    return;
  }
  
  // Preparar dados da configuração para garantir consistência
  let dadosConfig = config.dados;
  
  // Em alguns casos antigos, os dados estão aninhados em um objeto 'dados'
  if (dadosConfig.dados && typeof dadosConfig.dados === 'object') {
    dadosConfig = dadosConfig.dados;
  }
  
  // Se a função da porta for basculante, ajustar dimensões para 800x350
  if (dadosConfig.funcao === 'basculante') {
    // Definir dimensões apenas se não estiverem definidas na configuração salva
    if (!dadosConfig.largura) dadosConfig.largura = 800;
    if (!dadosConfig.altura) dadosConfig.altura = 350;
    
    // Definir 2 dobradiças para porta basculante (isso sempre será forçado)
    dadosConfig.numDobradicas = 2;
  }
  
  // Garantir que a configuração tenha a estrutura esperada
  if (!dadosConfig.puxador) {
    dadosConfig.puxador = {
      modelo: 'Cielo',
      medida: '150',
      posicao: 'vertical',
      cotaSuperior: 950,
      cotaInferior: 1000,
      deslocamento: 50,
      lados: 'esquerdo'
    };
  }
  
  // Aplicar a configuração
  aplicarConfiguracao(dadosConfig);
  
  // Garantir que os campos de dobradiças sejam atualizados
  if (typeof window.atualizarCamposPosicoesDobradicasQtd === 'function') {
    window.atualizarCamposPosicoesDobradicasQtd(dadosConfig.numDobradicas || 4);
  }
  
  // Atualizar seleção de tipo de porta (isso pode afetar visibilidade de campos)
  const funcaoPorta = document.getElementById('funcaoPorta');
  if (funcaoPorta) {
    funcaoPorta.value = dadosConfig.funcao || 'superiorDireita';
    const event = new Event('change');
    funcaoPorta.dispatchEvent(event);
  }
  
  // [Vibecode] Garantir que os campos de largura e altura sejam atualizados com o valor salvo após o evento 'change' do tipo de porta
  const larguraInput = document.getElementById('larguraInput');
  const alturaInput = document.getElementById('alturaInput');
  if (larguraInput && dadosConfig.largura) larguraInput.value = dadosConfig.largura;
  if (alturaInput && dadosConfig.altura) alturaInput.value = dadosConfig.altura;
  // Atualizar a configuração global para garantir que o desenho use os valores corretos
  atualizarConfiguracao({
    largura: dadosConfig.largura,
    altura: dadosConfig.altura
  });
  
  // Se for porta deslizante, garantir que os campos corretos estejam visíveis
  if (dadosConfig.funcao === 'deslizante') {
    const sectionDobradicas = document.getElementById('sectionDobradicas');
    const sectionDeslizante = document.getElementById('sectionDeslizante');
    
    if (sectionDobradicas) sectionDobradicas.style.display = 'none';
    if (sectionDeslizante) sectionDeslizante.style.display = 'block';
  }
  
  // Se for porta basculante, garantir que o puxador esteja na posição horizontal
  if (dadosConfig.funcao === 'basculante') {
    const puxadorPosicao = document.getElementById('puxadorPosicao');
    if (puxadorPosicao) {
      puxadorPosicao.value = 'horizontal';
      
      // Garantir que as configurações do puxador reflitam a posição horizontal
      if (dadosConfig.puxador) {
        dadosConfig.puxador.posicao = 'horizontal';
      }
      
      // Atualizar a configuração
      atualizarConfiguracao({
        puxador: {
          ...dadosConfig.puxador,
          posicao: 'horizontal'
        }
      });
    }
  }
    
  // Salvar como última configuração usada
  try {
    localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify(config));
  }
  catch (e) {
    console.warn('Erro ao salvar última configuração:', e);
  }
    
  // Fechar modal
  const modal = document.getElementById('projetosModal');
  if (modal && window.bootstrap) {
    const modalInstance = bootstrap.Modal.getInstance(modal);
    if (modalInstance) {
      modalInstance.hide();
    }
  }
    
  // Mostrar notificação
  mostrarNotificacao(`Configuração "${config.nome}" carregada com sucesso!`);
}

/**
 * Exclui uma configuração pelo ID
 * @param {string} id - ID da configuração
 */
function excluirConfiguracao(id) {
  // Obter todas as configurações
  let configs = obterTodasConfiguracoes();
    
  // Filtrar a configuração a ser excluída
  configs = configs.filter(c => c.id !== id);
    
  // Salvar configurações atualizadas
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  }
  catch (e) {
    console.error('Erro ao excluir configuração:', e);
    mostrarNotificacao('Erro ao excluir configuração.', 'erro');
    return;
  }
    
  // Atualizar lista de configurações
  carregarConfiguracoesNoModal();
    
  // Mostrar notificação
  mostrarNotificacao('Configuração excluída com sucesso!');
}

/**
 * Obtém todas as configurações salvas
 * @returns {Array} - Lista de configurações
 */
function obterTodasConfiguracoes() {
  try {
    const configs = localStorage.getItem(STORAGE_KEY);
    return configs ? JSON.parse(configs) : [];
  }
  catch (e) {
    console.error('Erro ao obter configurações:', e);
    return [];
  }
}

/**
 * Aplica uma configuração aos campos do formulário
 * @param {Object} config - Configuração a ser aplicada
 */
function aplicarConfiguracao(config) {
  if (!config) {
    console.warn('Configuração vazia ou inválida para aplicar');
    return;
  }
    
  // Campos a serem atualizados
  const campos = {
    parceiroInput: config.parceiro || '',
    clienteInput: config.cliente || '',
    ambienteInput: config.ambiente || '',
    larguraInput: config.largura,
    alturaInput: config.altura,
    quantidadeInput: config.quantidade || 1,
    vidroTipo: config.vidroTipo || config.vidro || 'Incolor',
    perfilModelo: config.perfilModelo || 'RM-114',
    perfilCor: config.perfilCor || 'Preto',
    funcaoPorta: config.funcao || 'superiorDireita',
    modeloDeslizante: config.modeloDeslizante || 'RO-654025',
    numDobradicasInput: config.numDobradicas || 4,
    puxadorModelo: config.puxador?.modelo || 'Cielo',
    puxadorMedida: config.puxador?.medida || '150',
    puxadorPosicao: config.puxador?.posicao || 'vertical',
    puxadorCotaSuperior: config.puxador?.cotaSuperior || 950,
    puxadorCotaInferior: config.puxador?.cotaInferior || 1000,
    observacaoInput: config.descricao || config.observacao || ''
  };
    
  // Atualizar cada campo
  Object.keys(campos).forEach(campo => {
    const elemento = document.getElementById(campo);
    if (elemento) {
      elemento.value = campos[campo];
      // Usar console.log apenas para depuração detalhada
      // console.log(`[CONFIG] Campo ${campo} atualizado para ${campos[campo]}`);
    }
    else {
      // Verificar campos opcionais vs obrigatórios para determinar o nível de log
      const camposOpcionais = ['parceiroInput', 'clienteInput', 'ambienteInput', 'observacaoInput'];
      if (camposOpcionais.includes(campo)) {
        // Para campos opcionais, usar log informativo
        console.log(`[CONFIG] Elemento ${campo} não encontrado`);
      } else {
        // Para campos obrigatórios, manter o aviso
        console.warn(`[CONFIG] Elemento ${campo} não encontrado`);
      }
    }
  });
    
  // Atualizar visibilidade dos campos de cota do puxador
  const posicaoPuxador = config.puxador?.posicao || 'vertical';
  const cotasVertical = document.getElementById('cotasVertical');
  const cotasHorizontal = document.getElementById('cotasHorizontal');
    
  if (cotasVertical && cotasHorizontal) {
    if (posicaoPuxador === 'vertical') {
      cotasVertical.style.display = 'block';
      cotasHorizontal.style.display = 'none';
    }
    else {
      cotasVertical.style.display = 'none';
      cotasHorizontal.style.display = 'block';
    }
  }
    
  // Atualizar a configuração atual
  atualizarConfiguracao(config);
    
  // Atualizar campos dependentes
  atualizarCamposDependentes();
    
  // Atualizar o desenho
  atualizarDesenho();
}

/**
 * Atualiza campos que dependem de outros campos
 */
function atualizarCamposDependentes() {
  // Atualizar campos de dobradiças
  updateDobradicaInputs();
    
  // Atualizar visibilidade dos campos de função
  const funcaoPorta = document.getElementById('funcaoPorta');
  if (funcaoPorta) {
    const event = new Event('change');
    funcaoPorta.dispatchEvent(event);
  }
    
  // Atualizar visibilidade do campo de deslocamento
  const puxadorDeslocOption = document.getElementById('puxadorDeslocOption');
  if (puxadorDeslocOption) {
    const event = new Event('change');
    puxadorDeslocOption.dispatchEvent(event);
  }
    
  // Atualizar título do pedido
  const parceiroInput = document.getElementById('parceiroInput');
  if (!parceiroInput) {
    console.log('[CONFIG] Elemento parceiroInput não encontrado');
  } else {
    const parceiroNome = document.getElementById('parceiro-nome');
    const tituloPedidoImpressao = document.getElementById('tituloPedidoImpressao');
      
    if (parceiroNome) {
      parceiroNome.textContent = parceiroInput.value || 'Selecione';
    }
      
    if (tituloPedidoImpressao) {
      tituloPedidoImpressao.textContent = `Pedido | ${parceiroInput.value || 'Selecione'}`;
    }
  }
    
  // Atualizar descrição da impressão
  const descricaoInput = document.getElementById('descricaoInput');
  const descricaoPedidoImpressao = document.getElementById('descricaoPedidoImpressao');
    
  if (descricaoInput && descricaoPedidoImpressao) {
    descricaoPedidoImpressao.textContent = descricaoInput.value;
  }
}

/**
 * Carrega a última configuração usada
 */
function carregarUltimaConfiguracao() {
  try {
    const ultimaConfig = localStorage.getItem(LAST_CONFIG_KEY);
    if (ultimaConfig) {
      const config = JSON.parse(ultimaConfig);
      aplicarConfiguracao(config.dados);
    }
  }
  catch (e) {
    console.warn('Erro ao carregar última configuração:', e);
  }
}

/**
 * Carrega o logo da empresa do localStorage
 * @returns {string|null} URL do logo ou null se não existir
 */
function carregarLogo() {
  try {
    return localStorage.getItem(LOGO_KEY);
  }
  catch (e) {
    console.warn('Erro ao carregar logo:', e);
    return null;
  }
}

/**
 * Salva o logo da empresa no localStorage
 * @param {string} logoUrl URL do logo em formato data URL
 * @returns {boolean} true se salvou com sucesso, false caso contrário
 */
function salvarLogoNoStorage(logoUrl) {
  try {
    localStorage.setItem(LOGO_KEY, logoUrl);
    return true;
  }
  catch (e) {
    console.error('Erro ao salvar logo:', e);
    throw e;
  }
}

/**
 * Carrega os projetos salvos do localStorage
 * @returns {Array} Lista de projetos
 */
function carregarProjetos() {
  try {
    const projetos = localStorage.getItem(STORAGE_KEY);
    return projetos ? JSON.parse(projetos) : [];
  }
  catch (e) {
    console.warn('Erro ao carregar projetos:', e);
    return [];
  }
}

/**
 * Salva rapidamente a configuração atual
 */
function salvarConfiguracaoRapida() {
  try {
    // Remover qualquer notificação de novo projeto existente
    const toastExistente = document.querySelector('.toast-novo-projeto');
    if (toastExistente && toastExistente.parentNode) {
      toastExistente.parentNode.removeChild(toastExistente);
    }
    
    // Obter configuração atual
    const configAtual = obterConfiguracaoAtual();
    
    // Gerar nome baseado no cliente, ambiente (sem as dimensões no nome principal)
    let nomeProjeto = '';
    
    // Verificar se temos informações de cliente
    if (configAtual.cliente && configAtual.cliente.trim() !== '') {
      nomeProjeto += configAtual.cliente;
      
      // Adicionar ambiente se existir
      if (configAtual.ambiente && configAtual.ambiente.trim() !== '') {
        nomeProjeto += ' | ' + configAtual.ambiente;
      }
    } else {
      nomeProjeto = 'Projeto sem nome';
    }
    
    // Note que não adicionamos mais as dimensões ao nome principal
    // pois elas já serão exibidas na seção de informações
    
    // Preparar dados para salvar
    const configuracao = {
      id: Date.now().toString(),
      nome: nomeProjeto,
      data: new Date().toISOString(), // Isso armazena data e hora completa
      dados: configAtual
    };
    
    // Obter configurações existentes
    let configs = obterTodasConfiguracoes();
    
    // Adicionar nova configuração
    configs.push(configuracao);
    
    // Manter apenas os 10 projetos mais recentes
    if (configs.length > 10) {
      // Ordenar por data (mais recentes primeiro)
      configs.sort((a, b) => new Date(b.data) - new Date(a.data));
      // Manter apenas os 10 primeiros (mais recentes)
      configs = configs.slice(0, 10);
    }
    
    // Salvar no localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    
    // Salvar também como última configuração usada
    localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify(configuracao));
    
    // Atualizar o modal de projetos se estiver aberto
    carregarConfiguracoesNoModal();
    
    // Mostrar notificação
    mostrarNotificacao(`Projeto salvo como "${nomeProjeto}"`);
    
    return true;
  }
  catch (e) {
    console.error('Erro ao salvar configuração rápida:', e);
    mostrarNotificacao('Erro ao salvar projeto', 'error');
    return false;
  }
}

/**
 * Lê o JSON de padrões do localStorage, criando se não existir
 */
export function obterPadroesPorta() {
  let padroes = localStorage.getItem(PADROES_PORTA_KEY);
  if (!padroes) {
    padroes = {
      ultimoTipo: 'Abrir Superior Direita',
      ultimosValores: { ...PADROES_INICIAIS_PORTA }
    };
    localStorage.setItem(PADROES_PORTA_KEY, JSON.stringify(padroes));
    return padroes;
  }
  try {
    return JSON.parse(padroes);
  } catch (e) {
    // Se corrompido, recria
    const novo = {
      ultimoTipo: 'Abrir Superior Direita',
      ultimosValores: { ...PADROES_INICIAIS_PORTA }
    };
    localStorage.setItem(PADROES_PORTA_KEY, JSON.stringify(novo));
    return novo;
  }
}

/**
 * Salva o JSON de padrões no localStorage
 */
export function salvarPadroesPorta(padroes) {
  localStorage.setItem(PADROES_PORTA_KEY, JSON.stringify(padroes));
}

/**
 * Atualiza o último valor de um tipo de porta
 * @param {string} tipo - Nome do tipo de porta
 * @param {Object} valores - Objeto com largura e altura
 */
export function atualizarUltimoValorPorta(tipo, valores) {
  const padroes = obterPadroesPorta();
  padroes.ultimosValores[tipo] = { ...valores };
  padroes.ultimoTipo = tipo;
  salvarPadroesPorta(padroes);
}

/**
 * Obtém o último valor salvo para um tipo de porta, ou o padrão se não houver
 * @param {string} tipo - Nome do tipo de porta
 */
export function obterUltimoValorPorta(tipo) {
  const padroes = obterPadroesPorta();
  return padroes.ultimosValores[tipo] || PADROES_INICIAIS_PORTA[tipo] || { largura: 450, altura: 2450 };
}

/**
 * Atualiza o último tipo de porta selecionado
 * @param {string} tipo
 */
export function atualizarUltimoTipoPorta(tipo) {
  const padroes = obterPadroesPorta();
  padroes.ultimoTipo = tipo;
  salvarPadroesPorta(padroes);
}

// Exportar funções necessárias
export {
  inicializarArmazenamento,
  carregarConfiguracoesNoModal,
  criarItemConfiguracao,
  salvarConfiguracaoAtual,
  salvarConfiguracao,
  carregarConfiguracao,
  excluirConfiguracao,
  obterTodasConfiguracoes,
  aplicarConfiguracao,
  atualizarCamposDependentes,
  carregarUltimaConfiguracao,
  carregarLogo,
  salvarLogoNoStorage,
  carregarProjetos,
  salvarConfiguracaoRapida
};

// [Vibecode] Ao carregar o módulo, tentar carregar a última configuração salva automaticamente
if (typeof window !== 'undefined') {
  // Disponibilizar o módulo globalmente para acesso de outras partes do código
  window.storageModule = {
    salvarConfiguracaoRapida,
    carregarUltimaConfiguracao,
    carregarConfiguracao,
    salvarConfiguracao,
    excluirConfiguracao
  };
  
  document.addEventListener('DOMContentLoaded', function() {
    // Tentar carregar a última configuração salva
    try {
      carregarUltimaConfiguracao();
      console.log('[Vibecode] Última configuração restaurada automaticamente ao iniciar');
    } catch (e) {
      console.warn('[Vibecode] Nenhuma configuração salva encontrada, usando padrão do HTML/JS');
    }
  });
} 