/**
 * Módulo de armazenamento Supabase - REFATORADO
 * Sistema de Portas e Perfis
 * Armazenamento exclusivo na tabela Salvar_Portas do Supabase
 */

import { mostrarNotificacao } from './notifications.js';

// Importar apenas funções necessárias do storage local para compatibilidade
import {
  aplicarConfiguracao,
  criarItemConfiguracao
} from './storage.js';

// Configuração direta do Supabase
const SUPABASE_URL = 'https://nzgifjdewdfibcopolof.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z2lmamRld2RmaWJjb3BvbG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA4NDAsImV4cCI6MjA2MzAzNjg0MH0.O7MKZNx_Cd-Z12iq8h0pq6Sq0bmJazcxDHvlVb4VJQc';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'apikey': SUPABASE_ANON_KEY
};

// Configuração para tipo de exclusão (true = DELETE real, false = soft delete)
let USE_HARD_DELETE = true; // Alterado para DELETE real por padrão

/**
 * Gera um ID único para o usuário baseado no usuário autenticado
 * Prioriza email do usuário logado, fallback para ID baseado em navegador
 */
function gerarIdUsuario() {
  // NOVA LÓGICA: Verificar se há usuário autenticado
  try {
    const userData = localStorage.getItem('porta_perfil_user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user && user.email) {
        // Usar email do usuário como ID (mais seguro e confiável)
        const idUsuarioAuth = btoa(user.email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
        console.log(`[Storage Supabase] Usando ID do usuário autenticado: ${user.email} -> ${idUsuarioAuth}`);
        return idUsuarioAuth;
      }
    }
  } catch (error) {
    console.warn('[Storage Supabase] Erro ao obter usuário autenticado:', error);
  }
  
  // FALLBACK: Sistema antigo baseado em navegador (para compatibilidade)
  const idSalvo = localStorage.getItem('user_unique_id');
  if (idSalvo) {
    console.warn('[Storage Supabase] Usando ID de fallback baseado em navegador (não seguro para multi-usuário)');
    return idSalvo;
  }

  const navegador = navigator.userAgent;
  const idioma = navigator.language;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timestamp = Date.now();
  
  const dados = `${navegador}-${idioma}-${timezone}-${timestamp}`;
  const hash = btoa(dados).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  
  localStorage.setItem('user_unique_id', hash);
  console.warn('[Storage Supabase] Criado novo ID de fallback baseado em navegador (não seguro para multi-usuário)');
  return hash;
}

/**
 * Função auxiliar para obter configuração atual
 */
function obterConfiguracaoAtual() {
  if (typeof window.obterConfiguracaoAtual === 'function') {
    return window.obterConfiguracaoAtual();
  }
  
  // Fallback com configuração padrão
  console.warn('[Storage Supabase] Usando configuração padrão');
  return {
    largura: 450,
    altura: 2450,
    funcao: 'superiorDireita',
    cliente: '',
    ambiente: '',
    puxadorModelo: 'Cielo',
    puxadorMedida: '150',
    puxadorPosicao: 'vertical',
    puxadorLados: 'esquerdo',
    vidroTipo: 'Incolor',
    perfilModelo: 'RM-114',
    perfilCor: 'Preto'
  };
}

/**
 * Salva projeto diretamente na tabela Salvar_Portas do Supabase
 * @param {object} projeto - Dados do projeto
 * @returns {Promise<boolean>} Success status
 */
async function salvarProjeto(projeto) {
  console.log('[Storage Supabase] Iniciando salvamento direto na tabela Salvar_Portas...');
  
  try {
    const idUsuario = gerarIdUsuario();
    
    // Mapear dados do projeto para a estrutura da tabela Salvar_Portas
    const dadosSupabase = {
      id_usuario: idUsuario,
      nome: projeto.nome || 'Projeto sem nome',
      largura: projeto.dados?.largura || 450,
      altura: projeto.dados?.altura || 2450,
      funcao: projeto.dados?.funcao || 'superiorDireita',
      quantidade: projeto.dados?.quantidade || 1,
      porta_em_par: projeto.dados?.portaEmPar || false,
      cliente: projeto.dados?.cliente || null,
      ambiente: projeto.dados?.ambiente || null,
      parceiro: projeto.dados?.parceiro || null,
      vidro_tipo: projeto.dados?.vidroTipo || 'Incolor',
      perfil_modelo: projeto.dados?.perfilModelo || 'RM-114',
      perfil_cor: projeto.dados?.perfilCor || 'Preto',
      puxador: JSON.stringify({
        modelo: projeto.dados?.puxadorModelo || projeto.dados?.puxador?.modelo || 'Cielo',
        medida: projeto.dados?.puxadorMedida || projeto.dados?.puxador?.medida || '150',
        posicao: projeto.dados?.puxadorPosicao || projeto.dados?.puxador?.posicao || 'vertical',
        cotaSuperior: projeto.dados?.puxador?.cotaSuperior || projeto.dados?.puxadorCotaSuperior || 950,
        cotaInferior: projeto.dados?.puxador?.cotaInferior || projeto.dados?.puxadorCotaInferior || 1000,
        deslocamento: projeto.dados?.puxador?.deslocamento || projeto.dados?.puxadorDeslocamento || 50,
        lados: projeto.dados?.puxadorLados || projeto.dados?.puxador?.lados || 'esquerdo'
      }),
      num_dobradicas: projeto.dados?.numDobradicas || 4,
      dobradicas: projeto.dados?.dobradicas ? JSON.stringify(projeto.dados.dobradicas) : null,
      observacao: projeto.dados?.observacao || projeto.dados?.observacoes || null,
      configuracao_completa: JSON.stringify(projeto.dados)
      // Removido campo 'ativo' - não é mais necessário
    };

    console.log('[Storage Supabase] Dados preparados para inserção:', dadosSupabase);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/Salvar_Portas`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(dadosSupabase)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Storage Supabase] Erro na resposta:', result);
      mostrarNotificacao('Erro ao salvar projeto no banco de dados', 'error');
      return false;
    }

    console.log('[Storage Supabase] Projeto salvo com sucesso:', result);
    mostrarNotificacao(`Projeto "${projeto.nome}" salvo com sucesso`, 'success');
    return true;
    
  } catch (error) {
    console.error('[Storage Supabase] Erro de conexão:', error);
    mostrarNotificacao('Erro de conexão com o banco de dados', 'error');
    return false;
  }
}

/**
 * Carrega projetos diretamente da tabela Salvar_Portas do Supabase
 * @returns {Promise<Array>} Lista de projetos
 */
async function carregarProjetos() {
  console.log('[Storage Supabase] Carregando projetos direto da tabela Salvar_Portas...');
  
  try {
    const idUsuario = gerarIdUsuario();
    
    const url = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id_usuario=eq.${idUsuario}&order=criado_em.desc&limit=50`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Storage Supabase] Erro na resposta:', error);
      mostrarNotificacao('Erro ao carregar projetos do banco de dados', 'error');
      return [];
    }

    const data = await response.json();
    console.log('[Storage Supabase] Dados brutos recebidos:', data);

    // Converter dados do Supabase para formato do sistema local
    const projetosConvertidos = data.map(projeto => {
      let configuracaoCompleta = {};
      
      // Tentar fazer parse da configuração completa
      try {
        if (projeto.configuracao_completa) {
          configuracaoCompleta = JSON.parse(projeto.configuracao_completa);
        }
      } catch (e) {
        console.warn('[Storage Supabase] Erro ao fazer parse da configuração completa:', e);
      }

      // Parse do puxador
      let puxadorData = {};
      try {
        if (projeto.puxador) {
          puxadorData = JSON.parse(projeto.puxador);
        }
      } catch (e) {
        console.warn('[Storage Supabase] Erro ao fazer parse do puxador:', e);
      }

      // Parse das dobradiças
      let dobradicasData = [];
      try {
        if (projeto.dobradicas) {
          dobradicasData = JSON.parse(projeto.dobradicas);
        }
      } catch (e) {
        console.warn('[Storage Supabase] Erro ao fazer parse das dobradiças:', e);
      }

      const projetoConvertido = {
        id: projeto.id,
        nome: projeto.nome,
        data: projeto.criado_em,
        dados: {
          // Usar dados diretos da tabela como prioridade
          largura: projeto.largura,
          altura: projeto.altura,
          funcao: projeto.funcao,
          quantidade: projeto.quantidade,
          portaEmPar: projeto.porta_em_par,
          cliente: projeto.cliente,
          ambiente: projeto.ambiente,
          parceiro: projeto.parceiro,
          vidroTipo: projeto.vidro_tipo,
          perfilModelo: projeto.perfil_modelo,
          perfilCor: projeto.perfil_cor,
          puxadorModelo: puxadorData.modelo || 'Cielo',
          puxadorMedida: puxadorData.medida || '150',
          puxadorPosicao: puxadorData.posicao || 'vertical',
          puxadorLados: puxadorData.lados || 'esquerdo',
          puxadorCotaSuperior: puxadorData.cotaSuperior || 950,
          puxadorCotaInferior: puxadorData.cotaInferior || 1000,
          puxadorDeslocamento: puxadorData.deslocamento || 50,
          puxador: {
            modelo: puxadorData.modelo || 'Cielo',
            medida: puxadorData.medida || '150',
            posicao: puxadorData.posicao || 'vertical',
            cotaSuperior: puxadorData.cotaSuperior || 950,
            cotaInferior: puxadorData.cotaInferior || 1000,
            deslocamento: puxadorData.deslocamento || 50,
            lados: puxadorData.lados || 'esquerdo'
          },
          numDobradicas: projeto.num_dobradicas,
          dobradicas: dobradicasData,
          observacao: projeto.observacao,
          observacoes: projeto.observacao,
          // Mesclar com configuração completa se disponível
          ...configuracaoCompleta
        }
      };

      console.log(`[Storage Supabase] Projeto convertido - ID: ${projetoConvertido.id}, Nome: ${projetoConvertido.nome}`);
      return projetoConvertido;
    });

    console.log(`[Storage Supabase] ${projetosConvertidos.length} projetos convertidos:`, projetosConvertidos);
    return projetosConvertidos;
    
  } catch (error) {
    console.error('[Storage Supabase] Erro de conexão:', error);
    mostrarNotificacao('Erro de conexão com o banco de dados', 'error');
    return [];
  }
}

/**
 * Exclui projeto da tabela Salvar_Portas (soft delete)
 * @param {string} id - ID do projeto
 * @returns {Promise<boolean>} Success status
 */
async function excluirProjeto(id) {
  console.log(`[Storage Supabase] Excluindo projeto ${id} (tipo: ${typeof id}) da tabela Salvar_Portas...`);
  
  try {
    const idUsuario = gerarIdUsuario();
    console.log(`[Storage Supabase] ID do usuário: ${idUsuario}`);
    
    // Garantir que o ID seja tratado corretamente
    const idProjeto = id.toString();
    console.log(`[Storage Supabase] ID do projeto convertido: ${idProjeto}`);
    
    // Primeiro, verificar se o projeto existe
    const checkUrl = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id=eq.${idProjeto}&id_usuario=eq.${idUsuario}&select=id,nome,ativo`;
    console.log(`[Storage Supabase] Verificando se projeto existe: ${checkUrl}`);
    
    const checkResponse = await fetch(checkUrl, {
      method: 'GET',
      headers: headers
    });
    
    if (checkResponse.ok) {
      const existingProjects = await checkResponse.json();
      console.log(`[Storage Supabase] Projetos encontrados:`, existingProjects);
      
      if (existingProjects.length === 0) {
        console.error(`[Storage Supabase] Projeto ${idProjeto} não encontrado para usuário ${idUsuario}`);
        mostrarNotificacao('Projeto não encontrado', 'error');
        return false;
      }
    }
    
    const url = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id=eq.${idProjeto}&id_usuario=eq.${idUsuario}`;
    console.log(`[Storage Supabase] URL da requisição PATCH: ${url}`);
    
    const body = JSON.stringify({ ativo: false });
    console.log(`[Storage Supabase] Body da requisição:`, body);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: body
    });

    console.log(`[Storage Supabase] Status da resposta: ${response.status}`);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('[Storage Supabase] Erro na resposta:', error);
      mostrarNotificacao('Erro ao excluir projeto', 'error');
      return false;
    }

    const result = await response.json();
    console.log('[Storage Supabase] Resultado da exclusão:', result);
    
    if (result.length === 0) {
      console.warn('[Storage Supabase] Nenhum projeto foi atualizado. Verifique se o ID e usuário estão corretos.');
      mostrarNotificacao('Projeto não encontrado ou já excluído', 'warning');
    } else {
      console.log('[Storage Supabase] Projeto arquivado com sucesso');
      mostrarNotificacao('Projeto excluído com sucesso', 'success');
    }
    
    // Atualizar modal se estiver aberto
    carregarConfiguracoesNoModal();
    
    return true;
    
  } catch (error) {
    console.error('[Storage Supabase] Erro de conexão:', error);
    mostrarNotificacao('Erro de conexão com o banco de dados', 'error');
    return false;
  }
}

/**
 * Carrega configurações no modal de projetos salvos
 */
async function carregarConfiguracoesNoModal() {
  try {
    console.log('[Storage Supabase] Carregando configurações no modal...');
    
    const savedConfigsDiv = document.getElementById('savedConfigs');
    if (!savedConfigsDiv) {
      console.warn('[Storage Supabase] Elemento savedConfigs não encontrado');
      return;
    }

    // Mostrar loading
    savedConfigsDiv.innerHTML = `
      <div class="text-center p-3">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Carregando...</span>
        </div>
        <p class="mt-2">Carregando projetos...</p>
      </div>
    `;

    // EXECUTAR MIGRAÇÃO AUTOMÁTICA (se necessário)
    await migrarProjetosParaUsuarioAutenticado();

    // Carregar projetos
    const projetos = await carregarProjetos();

    if (projetos.length === 0) {
      savedConfigsDiv.innerHTML = `
        <div class="empty-state text-center p-4">
          <i class="bi bi-folder2-open"></i>
          <p>Nenhum projeto salvo encontrado</p>
          <small>Seus projetos aparecerão aqui após serem salvos</small>
        </div>
      `;
      return;
    }

    // Criar elementos da lista
    const listaElement = document.createElement('ul');
    listaElement.className = 'saved-projects-list';

    projetos.forEach(projeto => {
      console.log(`[Storage Supabase] Processando projeto para modal:`, {
        id: projeto.id,
        nome: projeto.nome,
        tipo_id: typeof projeto.id
      });
      
      const itemElement = criarItemConfiguracao(projeto);
      
      // Remover event listeners antigos se existirem
      const btnCarregar = itemElement.querySelector('.btn-load');
      if (btnCarregar) {
        // Clonar o botão para remover todos os event listeners
        const novoBtnCarregar = btnCarregar.cloneNode(true);
        btnCarregar.parentNode.replaceChild(novoBtnCarregar, btnCarregar);
        
        // Adicionar novo event listener - USANDO NOVA FUNÇÃO COMPLETA
        novoBtnCarregar.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log(`[Storage Supabase] Carregando projeto COMPLETO: ${projeto.id}`);
          carregarProjetoCompleto(projeto.id);
        });
      }

      const btnExcluir = itemElement.querySelector('.btn-delete');
      if (btnExcluir) {
        // Clonar o botão para remover todos os event listeners
        const novoBtnExcluir = btnExcluir.cloneNode(true);
        btnExcluir.parentNode.replaceChild(novoBtnExcluir, btnExcluir);
        
        // Adicionar novo event listener
        novoBtnExcluir.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log(`[Storage Supabase] Botão excluir clicado para projeto:`, {
            id: projeto.id,
            nome: projeto.nome,
            tipo_id: typeof projeto.id
          });
          
          if (confirm(`Tem certeza que deseja excluir o projeto "${projeto.nome}"?`)) {
            console.log(`[Storage Supabase] Confirmação aceita, iniciando exclusão...`);
            console.log(`[Storage Supabase] Método de exclusão: DELETE permanente`);
            
            const resultado = await excluirProjetoReal(projeto.id);
              
            console.log(`[Storage Supabase] Resultado da exclusão: ${resultado}`);
          } else {
            console.log(`[Storage Supabase] Exclusão cancelada pelo usuário`);
          }
        });
      }

      listaElement.appendChild(itemElement);
    });

    savedConfigsDiv.innerHTML = '';
    savedConfigsDiv.appendChild(listaElement);

    // Adicionar indicador de fonte dos dados
    const indicator = document.createElement('div');
    indicator.className = 'storage-indicator';
    indicator.innerHTML = `
      <small class="text-muted">
        <i class="bi bi-cloud-check"></i> 
        Armazenado na nuvem | 
        <span style="color: #28a745;">${gerarIdUsuario().substring(0, 8)}</span>
      </small>
    `;
    savedConfigsDiv.appendChild(indicator);

  } catch (error) {
    console.error('[Storage Supabase] Erro ao carregar configurações no modal:', error);
    mostrarNotificacao('Erro ao carregar projetos', 'error');
  }
}

/**
 * Carrega uma configuração específica do Supabase (FUNÇÃO ANTIGA - DESCONTINUADA)
 * @deprecated Use carregarProjetoCompleto(id) que popula TODOS os campos do formulário
 * @param {string} id - ID da configuração
 */
async function carregarConfiguracao(id) {
  try {
    console.log(`[Storage Supabase] Carregando configuração ${id}...`);
    
    // Carregar projetos e encontrar o específico
    const projetos = await carregarProjetos();
    console.log(`[Storage Supabase] ${projetos.length} projetos disponíveis`);
    
    const projeto = projetos.find(p => p.id === id);

    if (!projeto) {
      console.error(`[Storage Supabase] Projeto ${id} não encontrado`);
      mostrarNotificacao('Projeto não encontrado', 'error');
      return;
    }

    console.log(`[Storage Supabase] Projeto encontrado:`, projeto);
    console.log(`[Storage Supabase] Dados do projeto:`, projeto.dados);
    
    // Verificar se há quantidade nos dados
    const quantidade = projeto.dados?.quantidade;
    console.log(`[Storage Supabase] Quantidade no projeto: ${quantidade}`);
    
    // Aplicar configuração
    console.log(`[Storage Supabase] Aplicando configuração...`);
    aplicarConfiguracao(projeto.dados);

    // Verificar se a quantidade foi aplicada corretamente
    setTimeout(() => {
      const quantidadeInput = document.getElementById('quantidadeInput');
      if (quantidadeInput) {
        console.log(`[Storage Supabase] Quantidade no input após aplicar: ${quantidadeInput.value}`);
        if (quantidade && quantidadeInput.value !== quantidade.toString()) {
          console.warn(`[Storage Supabase] INCONSISTÊNCIA: Esperado ${quantidade}, obtido ${quantidadeInput.value}`);
        }
      }
    }, 100);

    // Fechar modal
    const modal = document.getElementById('projetosModal');
    if (modal && window.bootstrap) {
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) {
        modalInstance.hide();
      }
    }

    // Mostrar notificação
    mostrarNotificacao(`Projeto "${projeto.nome}" carregado com sucesso`, 'success');

  } catch (error) {
    console.error('[Storage Supabase] Erro ao carregar configuração:', error);
    mostrarNotificacao('Erro ao carregar projeto', 'error');
  }
}

/**
 * Salvamento rápido exclusivo no Supabase
 */
async function salvarConfiguracaoRapida() {
  try {
    console.log('[Storage Supabase] Iniciando salvamento rápido...');
    
    // Obter configuração atual
    const configAtual = obterConfiguracaoAtual();
    console.log('[Storage Supabase] Configuração atual:', configAtual);
    
    // Gerar nome baseado no cliente e ambiente
    let nomeProjeto = '';
    
    if (configAtual.cliente && configAtual.cliente.trim() !== '') {
      nomeProjeto += configAtual.cliente;
      
      if (configAtual.ambiente && configAtual.ambiente.trim() !== '') {
        nomeProjeto += ' | ' + configAtual.ambiente;
      }
    } else {
      nomeProjeto = 'Projeto sem nome';
    }
    
    console.log('[Storage Supabase] Nome do projeto gerado:', nomeProjeto);
    
    // Preparar dados para salvar
    const configuracao = {
      id: Date.now().toString(),
      nome: nomeProjeto,
      data: new Date().toISOString(),
      dados: configAtual
    };
    
    // Salvar no Supabase
    const sucesso = await salvarProjeto(configuracao);
    
    // Atualizar modal se estiver aberto
    carregarConfiguracoesNoModal();
    
    return sucesso;
  } catch (error) {
    console.error('[Storage Supabase] Erro no salvamento rápido:', error);
    mostrarNotificacao('Erro ao salvar projeto', 'error');
    return false;
  }
}

// Exportar funções do Supabase
export {
  salvarProjeto,
  carregarProjetos,
  excluirProjeto,
  carregarConfiguracoesNoModal,
  carregarConfiguracao,
  salvarConfiguracaoRapida
};

/**
 * Função de teste para debug da exclusão
 */
async function testarExclusao() {
  console.log('[Storage Supabase] Iniciando teste de exclusão...');
  
  // Carregar projetos
  const projetos = await carregarProjetos();
  console.log('[Storage Supabase] Projetos disponíveis:', projetos);
  
  if (projetos.length > 0) {
    const primeiroId = projetos[0].id;
    console.log(`[Storage Supabase] Testando exclusão do projeto ID: ${primeiroId}`);
    
    const resultado = await excluirProjeto(primeiroId);
    console.log(`[Storage Supabase] Resultado do teste: ${resultado}`);
    
    return resultado;
  } else {
    console.log('[Storage Supabase] Nenhum projeto encontrado para testar');
    return false;
  }
}

/**
 * Teste completo de CRUD para diagnosticar problemas
 */
async function testarCRUDCompleto() {
  console.log('[DEBUG] Iniciando teste CRUD completo...');
  
  const idUsuario = gerarIdUsuario();
  console.log(`[DEBUG] ID do usuário: ${idUsuario}`);
  
  try {
    // 1. LISTAR todos os projetos do usuário (incluindo inativos)
    console.log('[DEBUG] 1. Listando TODOS os projetos (incluindo inativos)...');
    const urlTodos = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id_usuario=eq.${idUsuario}&select=*&order=criado_em.desc`;
    const respTodos = await fetch(urlTodos, { method: 'GET', headers });
    const todosProjetos = await respTodos.json();
    console.log(`[DEBUG] Todos os projetos encontrados:`, todosProjetos);
    
    // 2. LISTAR apenas projetos ativos
    console.log('[DEBUG] 2. Listando projetos ATIVOS...');
    const urlAtivos = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id_usuario=eq.${idUsuario}&ativo=eq.true&select=*&order=criado_em.desc`;
    const respAtivos = await fetch(urlAtivos, { method: 'GET', headers });
    const projetosAtivos = await respAtivos.json();
    console.log(`[DEBUG] Projetos ativos encontrados:`, projetosAtivos);
    
    if (projetosAtivos.length > 0) {
      const projetoTeste = projetosAtivos[0];
      console.log(`[DEBUG] Usando projeto para teste:`, projetoTeste);
      
      // 3. TESTAR UPDATE (marcar como inativo)
      console.log('[DEBUG] 3. Testando UPDATE para marcar como inativo...');
      const urlUpdate = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id=eq.${projetoTeste.id}&id_usuario=eq.${idUsuario}`;
      const respUpdate = await fetch(urlUpdate, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({ ativo: false })
      });
      
      console.log(`[DEBUG] Status do UPDATE: ${respUpdate.status}`);
      const resultUpdate = await respUpdate.json();
      console.log(`[DEBUG] Resultado do UPDATE:`, resultUpdate);
      
      // 4. VERIFICAR se realmente foi atualizado
      console.log('[DEBUG] 4. Verificando se foi realmente atualizado...');
      const urlVerify = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id=eq.${projetoTeste.id}&id_usuario=eq.${idUsuario}&select=id,nome,ativo`;
      const respVerify = await fetch(urlVerify, { method: 'GET', headers });
      const projetoVerify = await respVerify.json();
      console.log(`[DEBUG] Estado após UPDATE:`, projetoVerify);
      
      // 5. RESTAURAR o projeto (marcar como ativo novamente)
      console.log('[DEBUG] 5. Restaurando projeto para ativo...');
      const respRestore = await fetch(urlUpdate, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({ ativo: true })
      });
      
      console.log(`[DEBUG] Status do RESTORE: ${respRestore.status}`);
      const resultRestore = await respRestore.json();
      console.log(`[DEBUG] Resultado do RESTORE:`, resultRestore);
    }
    
  } catch (error) {
    console.error('[DEBUG] Erro no teste CRUD:', error);
  }
  
  return 'Teste CRUD completo finalizado - verifique logs';
}

/**
 * Exclusão REAL (DELETE) como alternativa ao soft delete
 * @param {string} id - ID do projeto
 * @returns {Promise<boolean>} Success status
 */
async function excluirProjetoReal(id) {
  console.log(`[Storage Supabase] Excluindo projeto PERMANENTEMENTE ${id}...`);
  
  try {
    const idUsuario = gerarIdUsuario();
    const idProjeto = id.toString();
    
    const url = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id=eq.${idProjeto}&id_usuario=eq.${idUsuario}`;
    console.log(`[Storage Supabase] URL DELETE: ${url}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: headers
    });

    console.log(`[Storage Supabase] Status DELETE: ${response.status}`);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('[Storage Supabase] Erro no DELETE:', error);
      mostrarNotificacao('Erro ao excluir projeto', 'error');
      return false;
    }

    console.log('[Storage Supabase] Projeto DELETADO permanentemente');
    mostrarNotificacao('Projeto excluído permanentemente', 'success');
    
    // Atualizar modal
    carregarConfiguracoesNoModal();
    
    return true;
    
  } catch (error) {
    console.error('[Storage Supabase] Erro de conexão no DELETE:', error);
    mostrarNotificacao('Erro de conexão', 'error');
    return false;
  }
}

/**
 * Alterna o método de exclusão entre soft delete e hard delete
 */
function alternarMetodoExclusao() {
  USE_HARD_DELETE = !USE_HARD_DELETE;
  console.log(`[Storage Supabase] Método de exclusão alterado para: ${USE_HARD_DELETE ? 'DELETE permanente' : 'Soft delete'}`);
  mostrarNotificacao(`Exclusão alterada para: ${USE_HARD_DELETE ? 'Permanente' : 'Arquivamento'}`, 'info');
  return USE_HARD_DELETE;
}

/**
 * Obtém o método atual de exclusão
 */
function obterMetodoExclusao() {
  return 'DELETE permanente (padrão)';
}

/**
 * NOVA FUNÇÃO DE CARREGAMENTO COMPLETA - FEITA DO ZERO
 * Carrega projeto do Supabase e popula TODOS os campos do formulário
 */
async function carregarProjetoCompleto(id) {
  console.log(`[NOVO CARREGAMENTO] Iniciando carregamento completo do projeto ${id}...`);
  
  try {
    // 1. BUSCAR PROJETO DIRETAMENTE NO BANCO
    const idUsuario = gerarIdUsuario();
    const url = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id=eq.${id}&id_usuario=eq.${idUsuario}&select=*`;
    
    const response = await fetch(url, { method: 'GET', headers });
    const projetos = await response.json();
    
    if (projetos.length === 0) {
      console.error('[NOVO CARREGAMENTO] Projeto não encontrado');
      mostrarNotificacao('Projeto não encontrado', 'error');
      return false;
    }
    
    const projeto = projetos[0];
    console.log('[NOVO CARREGAMENTO] Dados brutos do banco:', projeto);
    
    // 2. EXTRAIR DADOS (PRIORIDADE: CAMPOS DIRETOS > CONFIGURAÇÃO COMPLETA)
    let dados = {};
    
    // Parse da configuração completa como backup
    let configCompleta = {};
    if (projeto.configuracao_completa) {
      try {
        configCompleta = JSON.parse(projeto.configuracao_completa);
        console.log('[NOVO CARREGAMENTO] Configuração completa parseada:', configCompleta);
      } catch (e) {
        console.warn('[NOVO CARREGAMENTO] Erro ao fazer parse da configuração completa:', e);
      }
    }
    
    // Parse do puxador
    let puxadorData = {};
    if (projeto.puxador) {
      try {
        puxadorData = JSON.parse(projeto.puxador);
      } catch (e) {
        console.warn('[NOVO CARREGAMENTO] Erro ao fazer parse do puxador:', e);
      }
    }
    
    // Parse das dobradiças
    let dobradicasData = [];
    if (projeto.dobradicas) {
      try {
        dobradicasData = JSON.parse(projeto.dobradicas);
      } catch (e) {
        console.warn('[NOVO CARREGAMENTO] Erro ao fazer parse das dobradiças:', e);
      }
    }
    
    // 3. MONTAR DADOS FINAIS (PRIORIDADE: BANCO > CONFIG COMPLETA > PADRÃO)
    dados = {
      // Informações básicas
      parceiro: projeto.parceiro || configCompleta.parceiro || '',
      cliente: projeto.cliente || configCompleta.cliente || '',
      ambiente: projeto.ambiente || configCompleta.ambiente || '',
      
      // Dimensões e quantidade
      largura: projeto.largura || configCompleta.largura || 450,
      altura: projeto.altura || configCompleta.altura || 2450,
      quantidade: projeto.quantidade || configCompleta.quantidade || 1,
      portaEmPar: projeto.porta_em_par || configCompleta.portaEmPar || false,
      
      // Função da porta
      funcao: projeto.funcao || configCompleta.funcao || 'superiorDireita',
      
      // Materiais
      vidroTipo: projeto.vidro_tipo || configCompleta.vidroTipo || 'Incolor',
      perfilModelo: projeto.perfil_modelo || configCompleta.perfilModelo || 'RM-114',
      perfilCor: projeto.perfil_cor || configCompleta.perfilCor || 'Preto',
      
      // Dobradiças
      numDobradicas: projeto.num_dobradicas || configCompleta.numDobradicas || 4,
      dobradicas: dobradicasData.length > 0 ? dobradicasData : (configCompleta.dobradicas || [100, 500, 1000, 2000]),
      
      // Puxador
      puxadorModelo: puxadorData.modelo || configCompleta.puxadorModelo || 'Cielo',
      puxadorMedida: puxadorData.medida || configCompleta.puxadorMedida || '150',
      puxadorPosicao: puxadorData.posicao || configCompleta.puxadorPosicao || 'vertical',
      puxadorLados: puxadorData.lados || configCompleta.puxadorLados || 'esquerdo',
      puxadorCotaSuperior: puxadorData.cotaSuperior || configCompleta.puxadorCotaSuperior || 950,
      puxadorCotaInferior: puxadorData.cotaInferior || configCompleta.puxadorCotaInferior || 1000,
      puxadorDeslocamento: puxadorData.deslocamento || configCompleta.puxadorDeslocamento || 50,
      
      // Observações
      observacao: projeto.observacao || configCompleta.observacao || configCompleta.observacoes || ''
    };
    
    console.log('[NOVO CARREGAMENTO] Dados finais montados:', dados);
    
    // 4. POPULAR TODOS OS CAMPOS DO FORMULÁRIO
    await popularFormularioCompleto(dados);
    
    // 5. ATUALIZAR CONFIGURAÇÃO GLOBAL
    if (typeof window.atualizarConfiguracao === 'function') {
      window.atualizarConfiguracao(dados);
    }
    
    // 6. REDESENHAR PORTA
    if (typeof window.desenharPorta === 'function') {
      setTimeout(() => {
        window.desenharPorta(dados, true);
      }, 100);
    }
    
    // 7. FECHAR MODAL
    const modal = document.getElementById('projetosModal');
    if (modal && window.bootstrap) {
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
    
    // 8. NOTIFICAÇÃO
    mostrarNotificacao(`Projeto "${projeto.nome}" carregado com sucesso`, 'success');
    console.log('[NOVO CARREGAMENTO] Carregamento completo finalizado com sucesso');
    
    return true;
    
  } catch (error) {
    console.error('[NOVO CARREGAMENTO] Erro:', error);
    mostrarNotificacao('Erro ao carregar projeto', 'error');
    return false;
  }
}

/**
 * POPULA TODOS OS CAMPOS DO FORMULÁRIO NA SIDEBAR
 */
async function popularFormularioCompleto(dados) {
  console.log('[POPULAR FORMULÁRIO] Iniciando população completa dos campos...', dados);
  
  try {
    // INFORMAÇÕES BÁSICAS
    const parceiroInput = document.getElementById('parceiroInput');
    if (parceiroInput && dados.parceiro) {
      parceiroInput.value = dados.parceiro;
      console.log('[POPULAR FORMULÁRIO] Parceiro:', dados.parceiro);
    }
    
    const clienteInput = document.getElementById('clienteInput');
    if (clienteInput) {
      clienteInput.value = dados.cliente || '';
      console.log('[POPULAR FORMULÁRIO] Cliente:', dados.cliente);
    }
    
    const ambienteInput = document.getElementById('ambienteInput');
    if (ambienteInput) {
      ambienteInput.value = dados.ambiente || '';
      console.log('[POPULAR FORMULÁRIO] Ambiente:', dados.ambiente);
    }
    
    // DIMENSÕES E QUANTIDADE
    const larguraInput = document.getElementById('larguraInput');
    if (larguraInput) {
      larguraInput.value = dados.largura;
      console.log('[POPULAR FORMULÁRIO] Largura:', dados.largura);
    }
    
    const alturaInput = document.getElementById('alturaInput');
    if (alturaInput) {
      alturaInput.value = dados.altura;
      console.log('[POPULAR FORMULÁRIO] Altura:', dados.altura);
    }
    
    const quantidadeInput = document.getElementById('quantidadeInput');
    if (quantidadeInput) {
      quantidadeInput.value = dados.quantidade;
      console.log('[POPULAR FORMULÁRIO] Quantidade:', dados.quantidade);
    }
    
    // CHECKBOX PAR
    const parCheckbox = document.getElementById('parCheckbox');
    if (parCheckbox) {
      parCheckbox.checked = dados.portaEmPar || false;
      console.log('[POPULAR FORMULÁRIO] Porta em par:', dados.portaEmPar);
    }
    
    // FUNÇÃO DA PORTA
    const funcaoPorta = document.getElementById('funcaoPorta');
    if (funcaoPorta) {
      funcaoPorta.value = dados.funcao;
      console.log('[POPULAR FORMULÁRIO] Função:', dados.funcao);
    }
    
    // MATERIAIS
    const vidroTipo = document.getElementById('vidroTipo');
    if (vidroTipo) {
      vidroTipo.value = dados.vidroTipo;
      console.log('[POPULAR FORMULÁRIO] Vidro:', dados.vidroTipo);
    }
    
    const perfilModelo = document.getElementById('perfilModelo');
    if (perfilModelo) {
      perfilModelo.value = dados.perfilModelo;
      console.log('[POPULAR FORMULÁRIO] Perfil modelo:', dados.perfilModelo);
    }
    
    const perfilCor = document.getElementById('perfilCor');
    if (perfilCor) {
      perfilCor.value = dados.perfilCor;
      console.log('[POPULAR FORMULÁRIO] Perfil cor:', dados.perfilCor);
    }
    
    // DOBRADIÇAS
    const numDobradicasInput = document.getElementById('numDobradicasInput');
    if (numDobradicasInput) {
      numDobradicasInput.value = dados.numDobradicas;
      console.log('[POPULAR FORMULÁRIO] Número de dobradiças:', dados.numDobradicas);
    }
    
    // POPULAR POSIÇÕES DAS DOBRADIÇAS
    if (dados.dobradicas && Array.isArray(dados.dobradicas)) {
      dados.dobradicas.forEach((posicao, index) => {
        const dobradicaInput = document.getElementById(`dobradicaPos${index + 1}`);
        if (dobradicaInput) {
          dobradicaInput.value = posicao;
          console.log(`[POPULAR FORMULÁRIO] Dobradiça ${index + 1}:`, posicao);
        }
      });
    }
    
    // PUXADOR
    const puxadorModelo = document.getElementById('puxadorModelo');
    if (puxadorModelo) {
      puxadorModelo.value = dados.puxadorModelo;
      console.log('[POPULAR FORMULÁRIO] Puxador modelo:', dados.puxadorModelo);
    }
    
    const puxadorMedida = document.getElementById('puxadorMedida');
    if (puxadorMedida) {
      puxadorMedida.value = dados.puxadorMedida;
      console.log('[POPULAR FORMULÁRIO] Puxador medida:', dados.puxadorMedida);
    }
    
    const puxadorPosicao = document.getElementById('puxadorPosicao');
    if (puxadorPosicao) {
      puxadorPosicao.value = dados.puxadorPosicao;
      console.log('[POPULAR FORMULÁRIO] Puxador posição:', dados.puxadorPosicao);
    }
    
    // CHECKBOXES DE POSIÇÃO DO PUXADOR
    const posicaoVertical = document.getElementById('posicaoVertical');
    const posicaoHorizontal = document.getElementById('posicaoHorizontal');
    if (posicaoVertical && posicaoHorizontal) {
      if (dados.puxadorPosicao === 'vertical') {
        posicaoVertical.checked = true;
        posicaoHorizontal.checked = false;
      } else {
        posicaoVertical.checked = false;
        posicaoHorizontal.checked = true;
      }
      console.log('[POPULAR FORMULÁRIO] Checkboxes posição configurados');
    }
    
    const puxadorLados = document.getElementById('puxadorLados');
    if (puxadorLados) {
      puxadorLados.value = dados.puxadorLados;
      console.log('[POPULAR FORMULÁRIO] Puxador lados:', dados.puxadorLados);
    }
    
    const puxadorCotaSuperior = document.getElementById('puxadorCotaSuperior');
    if (puxadorCotaSuperior) {
      puxadorCotaSuperior.value = dados.puxadorCotaSuperior;
      console.log('[POPULAR FORMULÁRIO] Puxador cota superior:', dados.puxadorCotaSuperior);
    }
    
    const puxadorCotaInferior = document.getElementById('puxadorCotaInferior');
    if (puxadorCotaInferior) {
      puxadorCotaInferior.value = dados.puxadorCotaInferior;
      console.log('[POPULAR FORMULÁRIO] Puxador cota inferior:', dados.puxadorCotaInferior);
    }
    
    // OBSERVAÇÕES
    const observacaoInput = document.getElementById('observacaoInput');
    if (observacaoInput) {
      observacaoInput.value = dados.observacao || '';
      console.log('[POPULAR FORMULÁRIO] Observação:', dados.observacao);
    }
    
    console.log('[POPULAR FORMULÁRIO] População completa finalizada');
    
  } catch (error) {
    console.error('[POPULAR FORMULÁRIO] Erro:', error);
  }
}

/**
 * Migra projetos antigos do ID de navegador para o ID do usuário autenticado
 * Executa apenas uma vez quando detecta mudança de sistema de ID
 */
async function migrarProjetosParaUsuarioAutenticado() {
  console.log('[Storage Supabase] Verificando necessidade de migração de projetos...');
  
  try {
    // Verificar se há usuário autenticado
    const userData = localStorage.getItem('porta_perfil_user');
    if (!userData) {
      console.log('[Storage Supabase] Nenhum usuário autenticado, migração não necessária');
      return 0;
    }
    
    const user = JSON.parse(userData);
    if (!user.email) {
      console.log('[Storage Supabase] Usuário sem email, migração não possível');
      return 0;
    }
    
    // Gerar IDs antigo e novo
    const idFallback = localStorage.getItem('user_unique_id');
    const idNovoUsuario = btoa(user.email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    
    if (!idFallback || idFallback === idNovoUsuario) {
      console.log('[Storage Supabase] Migração não necessária ou já realizada');
      return 0;
    }
    
    // Verificar se já foi migrado
    const chaveControle = `migrated_${idFallback}_to_${idNovoUsuario}`;
    if (localStorage.getItem(chaveControle)) {
      console.log('[Storage Supabase] Migração já foi realizada anteriormente');
      return 0;
    }
    
    console.log(`[Storage Supabase] Migrando projetos de ${idFallback} para ${idNovoUsuario} (${user.email})`);
    
    // Buscar projetos do ID antigo
    const urlProjetos = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id_usuario=eq.${idFallback}&select=*`;
    const respProjetos = await fetch(urlProjetos, { method: 'GET', headers });
    const projetosAntigos = await respProjetos.json();
    
    if (projetosAntigos.length === 0) {
      console.log('[Storage Supabase] Nenhum projeto antigo encontrado para migrar');
      localStorage.setItem(chaveControle, 'completed');
      return 0;
    }
    
    console.log(`[Storage Supabase] Encontrados ${projetosAntigos.length} projetos para migrar`);
    
    // Migrar cada projeto
    let projetosMigrados = 0;
    for (const projeto of projetosAntigos) {
      try {
        // Atualizar o id_usuario do projeto
        const urlUpdate = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id=eq.${projeto.id}&id_usuario=eq.${idFallback}`;
        const respUpdate = await fetch(urlUpdate, {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify({ id_usuario: idNovoUsuario })
        });
        
        if (respUpdate.ok) {
          projetosMigrados++;
          console.log(`[Storage Supabase] Projeto "${projeto.nome}" migrado com sucesso`);
        } else {
          console.error(`[Storage Supabase] Erro ao migrar projeto "${projeto.nome}"`);
        }
      } catch (error) {
        console.error(`[Storage Supabase] Erro ao migrar projeto "${projeto.nome}":`, error);
      }
    }
    
    // Marcar como migrado
    localStorage.setItem(chaveControle, 'completed');
    console.log(`[Storage Supabase] Migração concluída: ${projetosMigrados}/${projetosAntigos.length} projetos migrados`);
    
    if (projetosMigrados > 0) {
      mostrarNotificacao(`${projetosMigrados} projeto(s) migrado(s) para sua conta`, 'success');
    }
    
    return projetosMigrados;
    
  } catch (error) {
    console.error('[Storage Supabase] Erro durante migração:', error);
    return 0;
  }
}

/**
 * Limpa projetos inativos existentes no banco
 * Remove projetos marcados como ativo: false
 */
async function limparProjetosInativos() {
  console.log('[Storage Supabase] Limpando projetos inativos...');
  
  try {
    const idUsuario = gerarIdUsuario();
    
    // Buscar projetos inativos
    const urlInativos = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id_usuario=eq.${idUsuario}&ativo=eq.false&select=id,nome`;
    const respInativos = await fetch(urlInativos, { method: 'GET', headers });
    const projetosInativos = await respInativos.json();
    
    console.log(`[Storage Supabase] Encontrados ${projetosInativos.length} projetos inativos:`, projetosInativos);
    
    if (projetosInativos.length > 0) {
      // Deletar todos os projetos inativos
      const urlDelete = `${SUPABASE_URL}/rest/v1/Salvar_Portas?id_usuario=eq.${idUsuario}&ativo=eq.false`;
      const respDelete = await fetch(urlDelete, {
        method: 'DELETE',
        headers: headers
      });
      
      if (respDelete.ok) {
        console.log(`[Storage Supabase] ${projetosInativos.length} projetos inativos removidos`);
        mostrarNotificacao(`${projetosInativos.length} projeto(s) arquivado(s) removido(s)`, 'success');
        
        // Atualizar modal
        carregarConfiguracoesNoModal();
        
        return projetosInativos.length;
      } else {
        const error = await respDelete.json();
        console.error('[Storage Supabase] Erro ao deletar inativos:', error);
        return 0;
      }
    } else {
      console.log('[Storage Supabase] Nenhum projeto inativo encontrado');
      return 0;
    }
    
  } catch (error) {
    console.error('[Storage Supabase] Erro ao limpar projetos inativos:', error);
    return 0;
  }
}

// Disponibilizar globalmente para compatibilidade
if (typeof window !== 'undefined') {
  window.storageSupabase = {
    salvarConfiguracaoRapida: salvarConfiguracaoRapida,
    carregarConfiguracoesNoModal: carregarConfiguracoesNoModal,
    carregarConfiguracao: carregarConfiguracao,
    carregarProjetoCompleto: carregarProjetoCompleto, // NOVA FUNÇÃO COMPLETA
    popularFormularioCompleto: popularFormularioCompleto, // NOVA FUNÇÃO DE POPULAÇÃO
    migrarProjetosParaUsuarioAutenticado: migrarProjetosParaUsuarioAutenticado, // MIGRAÇÃO DE PROJETOS
    excluirConfiguracao: excluirProjeto,
    excluirProjetoReal: excluirProjetoReal, // DELETE permanente
    limparProjetosInativos: limparProjetosInativos, // Limpar projetos arquivados
    alternarMetodoExclusao: alternarMetodoExclusao, // Alternar tipo de exclusão
    obterMetodoExclusao: obterMetodoExclusao, // Ver método atual
    testarExclusao: testarExclusao, // Para debug
    testarCRUDCompleto: testarCRUDCompleto // Para debug avançado
  };
  
  console.log('[Storage Supabase] Módulo carregado e funções disponíveis globalmente');
  console.log('[Storage Supabase] Novas funções de carregamento completo:');
  console.log('  - window.storageSupabase.carregarProjetoCompleto(id)');
  console.log('  - window.storageSupabase.popularFormularioCompleto(dados)');
  console.log('[Storage Supabase] Função de migração:');
  console.log('  - window.storageSupabase.migrarProjetosParaUsuarioAutenticado()');
  console.log('[Storage Supabase] Funções de debug disponíveis:');
  console.log('  - window.storageSupabase.testarCRUDCompleto()');
  console.log('  - window.storageSupabase.testarExclusao()');
  console.log('  - window.storageSupabase.alternarMetodoExclusao()');
  console.log('  - window.storageSupabase.obterMetodoExclusao()');
}

// Função para carregar manualmente se necessário
window.carregarFuncoesDebugSupabase = async function() {
  try {
    console.log('[Debug] Carregando módulo storage-supabase-only...');
    const module = await import('./js/storage-supabase-only.js');
    console.log('[Debug] Módulo carregado:', module);
    console.log('[Debug] Verificando window.storageSupabase:', window.storageSupabase);
    return 'Módulo carregado com sucesso';
  } catch (error) {
    console.error('[Debug] Erro ao carregar módulo:', error);
    return 'Erro ao carregar módulo';
  }
}; 