
import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('SidebarExploration_2025-04-14', async ({ page, context }) => {
  
    // Navigate to URL
    await page.goto('http://127.0.0.1:3000/');

    // Take screenshot
    await page.screenshot({ path: 'sidebar-overview.png' });

    // Click element
    await page.click('.accordion-button[aria-controls='collapseInfos']');

    // Take screenshot
    await page.screenshot({ path: 'informacoes-basicas.png' });

    // Fill input field
    await page.fill('#clienteInput', 'Cliente Teste');

    // Fill input field
    await page.fill('#ambienteInput', 'Sala');

    // Fill input field
    await page.fill('#larguraInput', '800');

    // Fill input field
    await page.fill('#alturaInput', '2200');

    // Click element
    await page.click('.accordion-button[aria-controls='collapseFuncao']');

    // Take screenshot
    await page.screenshot({ path: 'funcao-porta.png' });

    // Select option
    await page.selectOption('#funcaoPorta', 'basculante');

    // Take screenshot
    await page.screenshot({ path: 'porta-basculante.png' });

    // Select option
    await page.selectOption('#funcaoPorta', 'deslizante');

    // Take screenshot
    await page.screenshot({ path: 'porta-deslizante.png' });

    // Click element
    await page.click('.accordion-button[aria-controls='collapsePuxador']');

    // Take screenshot
    await page.screenshot({ path: 'opcoes-puxador.png' });

    // Select option
    await page.selectOption('#puxadorPosicao', 'horizontal');

    // Click element
    await page.click('#puxadorPosicao');

    // Click element
    await page.click('.accordion-button[aria-controls='collapseMateriais']');

    // Take screenshot
    await page.screenshot({ path: 'opcoes-materiais.png' });

    // Select option
    await page.selectOption('#vidroTipo', 'Fumê');

    // Select option
    await page.selectOption('#perfilModelo', 'RM-060');

    // Click element
    await page.click('.accordion-button.modal-trigger');

    // Take screenshot
    await page.screenshot({ path: 'modal-observacoes.png' });

    // Fill input field
    await page.fill('#observacaoInput', 'Observação de teste para a porta');

    // Click element
    await page.click('#btnSalvarObservacoes');

    // Click element
    await page.click('#btnCarregarProjetos');

    // Take screenshot
    await page.screenshot({ path: 'modal-projetos.png' });

    // Click element
    await page.click('.btn-close');

    // Click element
    await page.click('.modal-footer .btn-secondary');
});