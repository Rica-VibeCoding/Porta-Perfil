/**
 * Script de diagnóstico para problemas com ID de usuário
 * Coloque este script antes do fechamento do </body> para debug
 */

(function() {
    // Carregar dependências
    import('./auth.js').then(auth => {
        // Verificar usuário atual
        const user = auth.getCurrentUser();
        console.log('🔍 DEBUG - Usuário atual:', user);
        
        if (!user) {
            console.warn('⚠️ Nenhum usuário logado. O salvamento de dados requer login.');
            return;
        }
        
        // Verificar ID
        if (!user.id) {
            console.error('❌ Usuário sem ID. Isso causará erros ao salvar dados.');
            
            // Tentar corrigir automaticamente
            mostrarNotificacaoDebug('ID de usuário ausente ou inválido. Tente fazer logout e login novamente.');
            return;
        }
        
        // Verificar se é ID temporário
        if (user.id.startsWith('temp-')) {
            console.error('❌ ID temporário detectado:', user.id);
            console.error('Isso causará violação de chave estrangeira ao salvar puxadores.');
            
            // Tentar corrigir automaticamente
            mostrarNotificacaoDebug('Seu ID de usuário é temporário. Tente fazer logout e login novamente.');
            return;
        }
        
        // Verificar formato UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(user.id)) {
            console.error('❌ ID não parece ser um UUID válido:', user.id);
            console.error('Isso pode causar violação de chave estrangeira.');
            
            // Tentar corrigir automaticamente
            mostrarNotificacaoDebug('Seu ID de usuário não está no formato esperado. Tente fazer logout e login novamente.');
            return;
        }
        
        console.log('✅ ID de usuário parece válido:', user.id);
        
        // Mostrar status como sucesso
        mostrarStatus('ID de usuário verificado', 'success');
    }).catch(error => {
        console.error('❌ Erro ao carregar módulo de autenticação:', error);
        mostrarNotificacaoDebug('Erro ao verificar usuário. Tente recarregar a página.');
    });
    
    // Função para mostrar status
    function mostrarStatus(mensagem, tipo = 'info') {
        console.log(`[${tipo.toUpperCase()}] ${mensagem}`);
    }
    
    // Função para mostrar notificação de debug
    function mostrarNotificacaoDebug(mensagem) {
        // Tentar usar o sistema de notificação existente
        if (window.mostrarNotificacao) {
            window.mostrarNotificacao(mensagem, 'warning');
            return;
        }
        
        // Fallback para alert se não houver sistema de notificação
        console.warn('Sistema de notificação não encontrado, usando alert');
        setTimeout(() => {
            alert('DIAGNÓSTICO: ' + mensagem);
        }, 1000);
    }
})(); 