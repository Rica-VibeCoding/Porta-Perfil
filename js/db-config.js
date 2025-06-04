/**
 * Configuração de conexão com o Supabase
 * Sistema de Portas e Perfis
 */

// URL e chave anônima do projeto Supabase (PORTA_PERFIL)
const supabaseUrl = 'https://nzgifjdewdfibcopolof.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56Z2lmamRld2RmaWJjb3BvbG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjA4NDAsImV4cCI6MjA2MzAzNjg0MH0.O7MKZNx_Cd-Z12iq8h0pq6Sq0bmJazcxDHvlVb4VJQc';

// Criar cliente Supabase usando o objeto global com verificação defensiva
const supabase = window.supabase?.createClient 
  ? window.supabase.createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Verificar conexão
console.log('Conexão com Supabase (PORTA_PERFIL) inicializada');

export default supabase; 