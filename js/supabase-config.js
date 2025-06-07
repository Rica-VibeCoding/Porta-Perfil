/**
 * Configuração do Supabase para Sistema de Portas e Perfis
 * Módulo para integração com banco de dados na nuvem
 */

// Configurações do Supabase
const SUPABASE_URL = 'https://nzgifjdewdfibcopolof.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z2lmamRld2RmaWJjb3BvbG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA4NDAsImV4cCI6MjA2MzAzNjg0MH0.O7MKZNx_Cd-Z12iq8h0pq6Sq0bmJazcxDHvlVb4VJQc';

/**
 * Cliente Supabase simplificado usando fetch nativo
 * Para evitar dependências externas e manter o projeto usando apenas tecnologias aprovadas
 */
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'apikey': key
    };
  }

  /**
   * Executa uma query SELECT
   * @param {string} table - Nome da tabela
   * @param {object} options - Opções da query
   * @returns {Promise<{data: any[], error: any}>}
   */
  async select(table, options = {}) {
    try {
      let url = `${this.url}/rest/v1/${table}`;
      const params = new URLSearchParams();

      if (options.select) {
        params.append('select', options.select);
      }

      if (options.eq) {
        for (const [key, value] of Object.entries(options.eq)) {
          params.append(key, `eq.${value}`);
        }
      }

      if (options.order) {
        params.append('order', options.order);
      }

      if (options.limit) {
        params.append('limit', options.limit);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro na query SELECT:', error);
      return { data: null, error };
    }
  }

  /**
   * Executa uma query INSERT
   * @param {string} table - Nome da tabela
   * @param {object|array} data - Dados para inserir
   * @returns {Promise<{data: any, error: any}>}
   */
  async insert(table, data) {
    try {
      const url = `${this.url}/rest/v1/${table}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { ...this.headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        return { data: null, error: result };
      }

      return { data: result, error: null };
    } catch (error) {
      console.error('Erro na query INSERT:', error);
      return { data: null, error };
    }
  }

  /**
   * Executa uma query UPDATE
   * @param {string} table - Nome da tabela
   * @param {object} data - Dados para atualizar
   * @param {object} where - Condições WHERE
   * @returns {Promise<{data: any, error: any}>}
   */
  async update(table, data, where) {
    try {
      let url = `${this.url}/rest/v1/${table}`;
      const params = new URLSearchParams();

      if (where.eq) {
        for (const [key, value] of Object.entries(where.eq)) {
          params.append(key, `eq.${value}`);
        }
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'PATCH',
        headers: { ...this.headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        return { data: null, error: result };
      }

      return { data: result, error: null };
    } catch (error) {
      console.error('Erro na query UPDATE:', error);
      return { data: null, error };
    }
  }

  /**
   * Executa uma query DELETE
   * @param {string} table - Nome da tabela
   * @param {object} where - Condições WHERE
   * @returns {Promise<{data: any, error: any}>}
   */
  async delete(table, where) {
    try {
      let url = `${this.url}/rest/v1/${table}`;
      const params = new URLSearchParams();

      if (where.eq) {
        for (const [key, value] of Object.entries(where.eq)) {
          params.append(key, `eq.${value}`);
        }
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.headers
      });

      if (!response.ok) {
        const error = await response.json();
        return { data: null, error };
      }

      return { data: true, error: null };
    } catch (error) {
      console.error('Erro na query DELETE:', error);
      return { data: null, error };
    }
  }
}

// Instância do cliente Supabase
const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Funções específicas para gerenciar projetos de portas
 */

/**
 * Gera um ID único para o usuário baseado em informações do navegador
 * Como não temos autenticação, usamos uma combinação de dados do browser
 * @returns {string} ID único do usuário
 */
function gerarIdUsuario() {
  // Verificar se já existe um ID salvo
  const idSalvo = localStorage.getItem('user_unique_id');
  if (idSalvo) {
    return idSalvo;
  }

  // Gerar novo ID baseado em dados do navegador + timestamp
  const navegador = navigator.userAgent;
  const idioma = navigator.language;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timestamp = Date.now();
  
  // Criar hash simples
  const dados = `${navegador}-${idioma}-${timezone}-${timestamp}`;
  const hash = btoa(dados).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  
  // Salvar para uso futuro
  localStorage.setItem('user_unique_id', hash);
  
  return hash;
}

/**
 * Salva um projeto no Supabase
 * @param {object} projeto - Dados do projeto
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
async function salvarProjetoSupabase(projeto) {
  try {
    const idUsuario = gerarIdUsuario();
    
    // Mapear dados do projeto para a estrutura da tabela
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
      puxador: {
        modelo: projeto.dados?.puxadorModelo || 'Cielo',
        medida: projeto.dados?.puxadorMedida || '150',
        posicao: projeto.dados?.puxadorPosicao || 'vertical',
        cotaSuperior: projeto.dados?.cotaSuperior || 950,
        cotaInferior: projeto.dados?.cotaInferior || 1000,
        deslocamento: projeto.dados?.deslocamento || 50,
        lados: projeto.dados?.puxadorLados || 'esquerdo'
      },
      num_dobradicas: projeto.dados?.numDobradicas || 4,
      dobradicas: projeto.dados?.dobradicas || null,
      observacao: projeto.dados?.observacao || projeto.dados?.observacoes || null,
      configuracao_completa: projeto.dados
    };

    const { data, error } = await supabase.insert('Salvar_Portas', dadosSupabase);

    if (error) {
      console.error('Erro ao salvar no Supabase:', error);
      return { success: false, error };
    }

    console.log('Projeto salvo no Supabase com sucesso:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao salvar projeto no Supabase:', error);
    return { success: false, error };
  }
}

/**
 * Carrega projetos do usuário do Supabase
 * @returns {Promise<{success: boolean, data?: any[], error?: any}>}
 */
async function carregarProjetosSupabase() {
  try {
    const idUsuario = gerarIdUsuario();
    
    const { data, error } = await supabase.select('Salvar_Portas', {
      eq: { id_usuario: idUsuario, ativo: true },
      order: 'atualizado_em.desc',
      limit: 50
    });

    if (error) {
      console.error('Erro ao carregar projetos do Supabase:', error);
      return { success: false, error };
    }

    // Converter dados do Supabase para formato do sistema local
    const projetosConvertidos = data.map(projeto => ({
      id: projeto.id,
      nome: projeto.nome,
      data: projeto.criado_em,
      dados: {
        // Primeiro aplicar configuracao_completa (se existir)
        ...(projeto.configuracao_completa || {}),
        // Depois sobrescrever com dados diretos da tabela (prioridade)
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
        puxadorModelo: projeto.puxador?.modelo,
        puxadorMedida: projeto.puxador?.medida,
        puxadorPosicao: projeto.puxador?.posicao,
        cotaSuperior: projeto.puxador?.cotaSuperior,
        cotaInferior: projeto.puxador?.cotaInferior,
        deslocamento: projeto.puxador?.deslocamento,
        puxadorLados: projeto.puxador?.lados,
        numDobradicas: projeto.num_dobradicas,
        dobradicas: projeto.dobradicas,
        observacao: projeto.observacao,
        observacoes: projeto.observacao
      }
    }));

    console.log(`${projetosConvertidos.length} projetos carregados do Supabase`);
    return { success: true, data: projetosConvertidos };
  } catch (error) {
    console.error('Erro ao carregar projetos do Supabase:', error);
    return { success: false, error };
  }
}

/**
 * Exclui um projeto do Supabase (soft delete)
 * @param {string} id - ID do projeto
 * @returns {Promise<{success: boolean, error?: any}>}
 */
async function excluirProjetoSupabase(id) {
  try {
    const idUsuario = gerarIdUsuario();
    
    const { data, error } = await supabase.update('Salvar_Portas', 
      { ativo: false }, 
      { eq: { id, id_usuario: idUsuario } }
    );

    if (error) {
      console.error('Erro ao excluir projeto do Supabase:', error);
      return { success: false, error };
    }

    console.log('Projeto arquivado no Supabase:', id);
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir projeto do Supabase:', error);
    return { success: false, error };
  }
}

// Exportar funções
export {
  supabase,
  gerarIdUsuario,
  salvarProjetoSupabase,
  carregarProjetosSupabase,
  excluirProjetoSupabase
}; 