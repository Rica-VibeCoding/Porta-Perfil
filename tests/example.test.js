describe('Exemplo de Testes', () => {
  
  test('Deve usar o mock do localStorage', () => {
    localStorage.setItem('chave', 'valor');
    
    expect(localStorage.setItem).toHaveBeenCalledWith('chave', 'valor');
  });

  test('Deve usar o mock do Canvas', () => {
    const canvas = new HTMLCanvasElement();
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(100, 100);
    ctx.stroke();
    
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(100, 100);
    expect(ctx.stroke).toHaveBeenCalled();
  });

}); 