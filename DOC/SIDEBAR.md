# Documentação do Sidebar - Projeto PORTAS PERFIS

## 1. Visão Geral

O sidebar é o componente central de controle da aplicação Portas Perfis, implementado com Bootstrap 5 e JavaScript modular. Ele fornece uma interface organizada para configurar todos os aspectos do desenho técnico de portas, incluindo dimensões, função, puxadores, materiais e observações adicionais.

## 2. Estrutura Técnica

### Arquivos Principais
- **js/sidebar.js**: Implementação JavaScript da classe `BootstrapSidebar`
- **css/bootstrap-sidebar.css**: Estilos específicos para integração com Bootstrap 5
- **css/sidebar.css**: Estilos personalizados adicionais
- **js/ui-controls.js**: Criação dinâmica dos campos de dobradiças e manipulação de elementos

### Classe Principal
```javascript
class BootstrapSidebar {
  constructor() {
    this.sidebar = null;
    this.initialized = false;
    this.accordionItems = [];
  }
  
  // Métodos principais
  init() { /* Inicialização do sidebar */ }
  verificarElementoDesenho() { /* Verificação da área de desenho */ }
  initEventHandlers() { /* Configuração dos event listeners */ }
  togglePortaType(event) { /* Gerencia exibição condicional de seções */ }
  openSection(sectionId) { /* Método para abrir programaticamente uma seção */ }
  closeSection(sectionId) { /* Método para fechar programaticamente uma seção */ }
}
```

### Exportação e Disponibilização Global
```javascript
// Criar instância única para exportação
const sidebarInstance = new BootstrapSidebar();

// Disponibilizar globalmente para compatibilidade
if (typeof window !== 'undefined') {
  window.sidebarInstance = sidebarInstance;
}

// Exportar como módulo ES6
export { sidebarInstance };
```

## 3. Estrutura do Accordion

O sidebar utiliza o componente Accordion do Bootstrap 5 para organizar seções expansíveis:

### 3.1 Seções Principais
1. **INFORMAÇÕES**
   - ID: `collapseInfos`
   - Controles: cliente, ambiente
   - Estilo personalizado: Fundo turquesa profundo (rgba(22, 160, 133, 0.12)) com borda lateral em turquesa médio (rgba(22, 160, 133, 0.5))

2. **Função da Porta**
   - ID: `collapseFuncao`
   - Controles: tipo de porta (`#funcaoPorta`), subseções condicionais para dobradiças e deslizante.
   - **Nota:** Ao alterar o valor do seletor "Tipo de Porta", o sistema ajusta automaticamente os campos "Largura", "Altura" e "Quantidade" (na seção "Medidas") para os valores padrão daquele tipo de porta.

3. **Medidas**
   - ID: `collapseMedidas`
   - Controles: largura, altura, quantidade, porta em par (checkbox condicional)

4. **Puxador**
   - ID: `collapsePuxador`
   - Controles: modelo, posição (checkbox vertical/horizontal), lados, medida, cotas específicas

5. **Materiais**
   - ID: `collapseMateriais`
   - Controles: tipo de vidro, modelo do perfil, cor do perfil

6. **Observações**
   - Botão modal-trigger para abertura do modal de observações

### 3.2 Botões de Ação (Fixos)
- **Imprimir**: Gera PDF do desenho atual
- **Salvar**: Salva a configuração atual (estilizado com a mesma cor turquesa da seção INFORMAÇÕES - fundo: rgba(22, 160, 133, 0.8), borda: rgba(22, 160, 133, 1))
- **Projetos**: Abre o modal de projetos salvos

## 4. Comportamentos Específicos

### 4.1 Renderização Condicional

#### 4.1.1 Seções Baseadas no Tipo de Porta
```javascript
togglePortaType(event) {
  const value = event.target.value;
  const sectionDobradicas = document.getElementById('sectionDobradicas');
  const sectionDeslizante = document.getElementById('sectionDeslizante');
  
  if (value === 'deslizante') {
    sectionDobradicas.style.display = 'none';
    sectionDeslizante.style.display = 'block';
  }
  else {
    sectionDobradicas.style.display = 'block';
    sectionDeslizante.style.display = 'none';
  }
}
```

#### 4.1.2 Checkbox "Porta em Par"
A opção "Porta em Par" aparece condicionalmente apenas quando a quantidade de portas é par (2, 4, 6...) e o tipo de porta é de giro (não deslizante/basculante):

```javascript
function atualizarParCheckbox() {
  const quantidade = parseInt(quantidadeInput.value, 10);
  const funcaoPorta = document.getElementById('funcaoPorta');
  const funcao = funcaoPorta ? (funcaoPorta.value || '').toLowerCase().replace(/\s|_/g, '') : '';
  const ehGiro = funcao.startsWith('superior') || funcao.startsWith('inferior');
  const ehDeslizante = funcao.includes('deslizante') || funcao.includes('correr');
  const ehBasculante = funcao.includes('basculante');
  
  if (quantidade >= 2 && quantidade % 2 === 0 && ehGiro && !ehDeslizante && !ehBasculante) {
    parCheckboxContainer.style.display = '';
    parCheckbox.disabled = false;
  } else {
    parCheckbox.checked = false;
    parCheckbox.disabled = true;
    parCheckboxContainer.style.display = 'none';
  }
}
```

#### 4.1.3 Visibilidade do Campo de Posição do Puxador
O campo de posição do puxador (checkbox Vertical/Horizontal) é ocultado nos seguintes casos:
- Quando o modelo de puxador for "100 Puxador"
- Quando o modelo de puxador for "S/Puxador"
- Quando o tipo de porta for deslizante ou basculante

```javascript
if (puxadorPosicaoDiv) {
  const modelo = puxadorModeloSelect.value.trim().toLowerCase();
  const funcaoPorta = document.getElementById('funcaoPorta');
  let funcao = funcaoPorta ? (funcaoPorta.value || '').toLowerCase().replace(/\s|_/g, '') : '';
  const ehDeslizante = funcao.includes('deslizante') || funcao.includes('correr');
  const ehBasculante = funcao.includes('basculante');
  
  if (modelo === '100 puxador' || modelo === 's/puxador' || modelo === 's/ puxador' || ehDeslizante || ehBasculante) {
    puxadorPosicaoDiv.style.display = 'none';
  } else {
    puxadorPosicaoDiv.style.display = '';
  }
}
```

### 4.2 Campos de Dobradiças Personalizados
Os campos de dobradiças são criados dinamicamente no JavaScript com ajustes de estilo específicos:

```javascript
// Criar linha para a dobradiça
const dobradicaRow = document.createElement('div');
dobradicaRow.className = 'input-group mb-2';
dobradicaRow.style.marginBottom = '4px'; // Espaçamento reduzido entre campos

// Criar label
const label = document.createElement('span');
label.className = 'input-group-text';
label.innerText = `${i+1} Dob:`;
label.style.width = '65px';
label.style.textAlign = 'left';
label.style.fontWeight = '500';
label.style.letterSpacing = '0.5px';
label.style.fontSize = '0.8rem'; // Fonte reduzida
label.style.height = '20px'; // Altura compacta
label.style.padding = '2px 8px';

// Criar input
const input = document.createElement('input');
input.type = 'number';
input.className = 'form-control';
input.style.height = '20px'; // Altura compacta
input.style.fontSize = '0.8rem'; // Fonte reduzida
```

### 4.3 Inicialização Adaptativa
O sidebar implementa múltiplas estratégias para garantir sua inicialização:
- Carregamento no DOMContentLoaded
- Timeout com verificação de estado
- Checagem de duplicidade de inicialização

### 4.4 Gestão de Acessibilidade
```javascript
setupModalFocusManagement() {
  // Salvar elemento com foco anterior
  let previousFocusElement = null;
  
  // Monitorar atributos ARIA com MutationObserver
  const modalObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'aria-hidden' && 
          observacoesModal.classList.contains('show')) {
        observacoesModal.removeAttribute('aria-hidden');
      }
    });
  });
  
  // Restaurar foco ao fechar modal
  observacoesModal.addEventListener('hidden.bs.modal', function () {
    if (previousFocusElement) {
      previousFocusElement.focus();
    }
  });
}
```

## 5. Estilização e Responsividade

### 5.1 Temas e Cores
- Fundo: cor primária da aplicação (variável `--primary-color`)
- Títulos de seção: fundo semitransparente com bordas laterais
- Seção INFORMAÇÕES: Destaque visual com fundo turquesa profundo (rgba(22, 160, 133, 0.12)) e borda lateral em turquesa médio (rgba(22, 160, 133, 0.5))
- Botão Salvar: Destaque visual com fundo turquesa (rgba(22, 160, 133, 0.8)) e borda em turquesa sólido (rgba(22, 160, 133, 1)), mantendo coerência visual com a seção INFORMAÇÕES
- Campos de formulário: fundo claro sobre o fundo escuro do sidebar
- Checkboxes estilizados: Fundo semitransparente (rgba(255, 255, 255, 0.1)) com texto branco e ícones correspondentes

### 5.2 Campos Compactos
Os campos de dobradiças usam uma apresentação compacta com:
- Altura de 20px para elementos de input e label
- Espaçamento reduzido entre campos (4px)
- Fonte reduzida (0.8rem) para melhor encaixe
- Padding otimizado para alinhamento vertical

### 5.3 Adaptação Mobile
```css
@media screen and (max-width: 900px) {
  .sidebar-bootstrap {
    max-width: 100%;
    height: auto;
    max-height: 50vh;
  }
}

@media (max-width: 350px) {
  .sidebar-actions .btn {
    font-size: 0.65rem;
  }
  
  .sidebar-actions .btn i {
    margin-right: 1px;
    font-size: 0.75rem;
  }
}
```

## 6. Integração com o Desenho

### 6.1 Atualização Automática
Ao alterar valores no sidebar, o redesenho é acionado:
- O campo de altura define automaticamente o número de dobradiças
- Alterações no tipo de porta redefinem o posicionamento dos puxadores
- Mudanças nos materiais alteram a visualização do vidro e perfis

### 6.2 Persistência
O sidebar se integra com o módulo de armazenamento:
```javascript
btnSalvarObservacoes.addEventListener('click', function () {
  const observacaoInput = document.getElementById('observacaoInput');
  if (observacaoInput) {
    try {
      // Salvar na configuração atual
      const config = obterConfiguracaoAtual();
      config.observacao = observacaoInput.value;
      
      atualizarConfiguracao(config);
      mostrarNotificacao('Observações salvas com sucesso');
    }
    catch (e) {
      console.warn('Erro ao salvar observações:', e);
    }
  }
});
```

## 7. Casos de Uso Comuns

### 7.1 Adicionar um Novo Campo
1. Adicionar o HTML dentro da seção apropriada do accordion
2. Registrar o campo no sistema de validação (se necessário)
3. Adicionar handlers para integração com o desenho

#### 7.1.1 Adicionar Campo Checkbox Estilizado
Para adicionar um novo checkbox com o estilo de cartão:

```html
<div class="card border-primary shadow-sm p-1" style="min-height:unset; height:30px; background-color: rgba(255, 255, 255, 0.1);">
  <div class="d-flex justify-content-start align-items-center gap-2" style="height:100%; min-height:unset;">
    <input class="form-check-input" type="checkbox" id="seuCheckbox" style="transform: scale(1.2); margin-top: 0;">
    <i class="bi bi-seu-icone" style="font-size: 1.2rem; color: var(--primary-color);"></i>
    <label class="form-label mb-0" for="seuCheckbox" style="font-size: 1rem; font-weight: 500; color: #fff;">Seu Texto</label>
  </div>
</div>
```

### 7.2 Modificar Comportamento Condicional
1. Identificar o evento que aciona a mudança (geralmente em `togglePortaType` ou em listeners específicos)
2. Modificar a lógica condicional para mostrar/ocultar elementos
3. Testar com diferentes tipos de porta

#### 7.2.1 Controlar Visibilidade Condicional
Para controlar a visibilidade condicional de elementos (como o checkbox "Porta em Par"):

```javascript
// Exemplo: no evento de mudança de quantidade
quantidadeInput.addEventListener('change', () => {
  const quantidade = parseInt(quantidadeInput.value, 10);
  const funcaoPorta = document.getElementById('funcaoPorta');
  const funcao = funcaoPorta ? funcaoPorta.value.toLowerCase() : '';
  
  // Verificar condições para exibir o elemento
  if (quantidade >= 2 && quantidade % 2 === 0 && !funcao.includes('deslizante')) {
    seuElemento.style.display = ''; // Exibir
  } else {
    seuElemento.style.display = 'none'; // Ocultar
  }
});
```

### 7.3 Ajustar Aparência dos Campos de Dobradiças
Para modificar a aparência dos campos de dobradiças, edite a função `atualizarCamposPosicoesDobradicasQtd` no arquivo `js/ui-controls.js`:

```javascript
// Exemplo: Ajustar tamanho das caixas
label.style.height = '20px'; // Altura do label
label.style.fontSize = '0.8rem'; // Tamanho da fonte do label

input.style.height = '20px'; // Altura do input
input.style.fontSize = '0.8rem'; // Tamanho da fonte do input

// Exemplo: Ajustar espaçamento entre campos
dobradicaRow.style.marginBottom = '4px'; // Espaçamento entre campos
```

### 7.4 Personalizar Estilos de Seções e Botões
Para destacar visualmente uma seção específica, adicione estilos inline no botão correspondente:

```html
<button class="accordion-button collapsed" 
        style="background-color: rgba(22, 160, 133, 0.12); border-left-color: rgba(22, 160, 133, 0.5);">
  <i class="bi bi-info-circle section-icon"></i>INFORMAÇÕES
</button>
```

Para padronizar botões com a mesma identidade visual da seção INFORMAÇÕES, utilize:

```html
<button id="btnSalvarRapido" class="btn btn-success" 
        style="background-color: rgba(22, 160, 133, 0.8); border-color: rgba(22, 160, 133, 1);">
  <i class="bi bi-save"></i>
  <span>Salvar</span>
</button>
```

#### 7.4.1 Estilizar Checkboxes como Cartões
Para criar checkboxes estilizados com aparência de cartão:

```html
<!-- Checkbox Estilizado -->
<div class="card border-primary shadow-sm p-1" style="min-height:unset; height:30px; background-color: rgba(255, 255, 255, 0.1);">
  <div class="d-flex justify-content-start align-items-center gap-2" style="height:100%; min-height:unset;">
    <input class="form-check-input" type="checkbox" id="checkboxExemplo" style="transform: scale(1.2); margin-top: 0;">
    <i class="bi bi-arrows-vertical" style="font-size: 1.2rem; color: var(--primary-color);"></i>
    <label class="form-label mb-0" for="checkboxExemplo" style="font-size: 1rem; font-weight: 500; color: #fff;">Texto do Checkbox</label>
  </div>
</div>
```

Este estilo pode ser aplicado em campos como "Porta em Par" e seleção de posição do puxador (Vertical/Horizontal).

## 8. Boas Práticas e Convenções

### 8.1 Nomenclatura
- **IDs**: camelCase seguindo o padrão `tipoDePorta + Ação` (ex: puxadorPosicao)
- **Classes CSS**: kebab-case para elementos estruturais (ex: sidebar-actions)
- **Variáveis JS**: camelCase descritivo (ex: previousFocusElement)

### 8.2 Posicionamento
- Formulários seguem ordem lógica top-down
- Campos relacionados agrupados em seções (agora com "Medidas" em seção própria)
- Botões de ação sempre fixos na parte inferior
- Checkboxes de controle condicionais aparecem próximos aos campos relacionados (ex: "Porta em Par" após o campo de quantidade)

### 8.3 Validação
- Usar classes Bootstrap para feedback visual (.invalid-feedback)
- Implementar validação em tempo real quando apropriado
- Fornecer mensagens de erro descritivas

## 9. Problemas Conhecidos e Soluções

### 9.1 Inicialização Inconsistente
**Problema**: Em alguns casos, o sidebar pode não inicializar corretamente.
**Solução**: Implementação de múltiplas estratégias de inicialização e verificação.

### 9.2 Campos Dinâmicos de Dobradiças
**Problema**: Campos gerados dinamicamente podem perder event listeners.
**Solução**: Usar delegação de eventos no container pai.

### 9.3 Visibilidade Condicional de Campos
**Problema**: A visibilidade de campos como "Porta em Par" e posição do puxador depende de múltiplos fatores.
**Solução**: Centralizar a lógica de visibilidade em funções específicas e chamar essas funções em cada evento relevante (mudança de quantidade, tipo de porta, modelo de puxador).

### 9.3 Tamanho Inconsistente de Campos
**Problema**: Campos de dobradiças podem ter tamanhos inconsistentes.
**Solução**: Definir explicitamente a altura dos campos (label e input) e tamanhos de fonte.

### 9.4 Espaçamento Excessivo
**Problema**: Espaço excessivo entre campos de dobradiças.
**Solução**: Definir marginBottom reduzido (4px) para ter campos mais compactos.

## 10. Extensões Futuras Planejadas

1. **Temas Personalizados**: Suporte a temas claro/escuro
2. **Layout Ajustável**: Opção para minimizar o sidebar
3. **Atalhos de Teclado**: Navegação avançada por atalhos
4. **Validação Aprimorada**: Feedback visual em tempo real
5. **Persistência Expandida**: Lembrar seções abertas entre sessões
