// Script para o painel administrativo
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Painel administrativo carregado');
    
    // Aguardar inicialização do banco
    await window.localDB.init();
    
    // Aguardar inicialização do storage de PDFs
    if (window.pdfStorage) {
        await window.pdfStorage.init();
    }
    
    // Carregar estatísticas
    await carregarEstatisticas();
    
    // Carregar simulações
    await buscarSimulacoes();
    
    // Configurar eventos
    configurarEventos();
});

async function carregarEstatisticas() {
    try {
        const stats = await window.localDB.obterEstatisticas();
        
        document.getElementById('total-simulacoes').textContent = stats.totalSimulacoes;
        document.getElementById('simulacoes-mes').textContent = stats.simulacoesUltimoMes;
        document.getElementById('valor-medio').textContent = formatarMoeda(stats.valorMedioImoveis);
        
        // Carregar estatísticas de PDFs
        if (window.pdfStorage) {
            try {
                const pdfs = await window.pdfStorage.listarPDFs();
                document.getElementById('total-pdfs').textContent = pdfs.length;
            } catch (error) {
                console.error('Erro ao carregar PDFs:', error);
                document.getElementById('total-pdfs').textContent = '0';
            }
        }
        
        // Criar gráfico de tipos de imóveis
        criarGraficoTipos(stats.tiposImoveisPopulares);
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        mostrarNotificacao('Erro ao carregar estatísticas', 'error');
    }
}

async function buscarSimulacoes() {
    try {
        const filtros = obterFiltros();
        const simulacoes = await window.localDB.buscarSimulacoes(filtros);
        
        preencherTabelaSimulacoes(simulacoes);
        
        document.getElementById('total-registros').textContent = `${simulacoes.length} registros`;
        
    } catch (error) {
        console.error('Erro ao buscar simulações:', error);
        mostrarNotificacao('Erro ao buscar simulações', 'error');
    }
}

function obterFiltros() {
    return {
        nome: document.getElementById('filtro-nome').value,
        email: document.getElementById('filtro-email').value,
        dataInicio: document.getElementById('filtro-data-inicio').value,
        dataFim: document.getElementById('filtro-data-fim').value
    };
}

function preencherTabelaSimulacoes(simulacoes) {
    const tbody = document.getElementById('tabela-simulacoes');
    
    if (simulacoes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">Nenhuma simulação encontrada</td></tr>';
        return;
    }
    
    tbody.innerHTML = simulacoes.map(simulacao => `
        <tr>
            <td>${formatarData(simulacao.dataSimulacao)}</td>
            <td>${simulacao.cliente.nome}</td>
            <td>${simulacao.cliente.email}</td>
            <td>${simulacao.cliente.whatsapp}</td>
            <td>${getTipoImovel(simulacao.cliente.tipoImovel)}</td>
            <td>${formatarMoeda(simulacao.cliente.valorImovel)}</td>
            <td>${formatarMoeda(simulacao.cliente.rendaFamiliar)}</td>
            <td>
                <button class="btn btn-primary btn-small" onclick="verDetalhes(${simulacao.id})">
                    <i class="fas fa-eye"></i>
                    Ver
                </button>
                <button class="btn btn-success btn-small" onclick="gerarPDFSimulacao(${simulacao.id})">
                    <i class="fas fa-file-pdf"></i>
                    PDF
                </button>
            </td>
        </tr>
    `).join('');
}

async function verDetalhes(id) {
    try {
        const simulacoes = await window.localDB.buscarSimulacoes();
        const simulacao = simulacoes.find(s => s.id === id);
        
        if (!simulacao) {
            mostrarNotificacao('Simulação não encontrada', 'error');
            return;
        }
        
        const modalBody = document.getElementById('modal-body-content');
        modalBody.innerHTML = `
            <div class="simulacao-detalhes">
                <div class="detalhe-secao">
                    <h4><i class="fas fa-user"></i> Dados do Cliente</h4>
                    <div class="detalhe-item">
                        <span class="detalhe-label">Nome:</span>
                        <span class="detalhe-valor">${simulacao.cliente.nome}</span>
                    </div>
                    <div class="detalhe-item">
                        <span class="detalhe-label">Email:</span>
                        <span class="detalhe-valor">${simulacao.cliente.email}</span>
                    </div>
                    <div class="detalhe-item">
                        <span class="detalhe-label">WhatsApp:</span>
                        <span class="detalhe-valor">${simulacao.cliente.whatsapp}</span>
                    </div>
                    <div class="detalhe-item">
                        <span class="detalhe-label">Profissão:</span>
                        <span class="detalhe-valor">${simulacao.cliente.profissao || 'N/A'}</span>
                    </div>
                    <div class="detalhe-item">
                        <span class="detalhe-label">Data da Simulação:</span>
                        <span class="detalhe-valor">${formatarDataCompleta(simulacao.dataSimulacao)}</span>
                    </div>
                </div>
                
                <div class="detalhe-secao">
                    <h4><i class="fas fa-home"></i> Dados do Imóvel</h4>
                    <div class="detalhe-item">
                        <span class="detalhe-label">Tipo:</span>
                        <span class="detalhe-valor">${getTipoImovel(simulacao.cliente.tipoImovel)}</span>
                    </div>
                    <div class="detalhe-item">
                        <span class="detalhe-label">Valor:</span>
                        <span class="detalhe-valor">${formatarMoeda(simulacao.cliente.valorImovel)}</span>
                    </div>
                    <div class="detalhe-item">
                        <span class="detalhe-label">Entrada + FGTS:</span>
                        <span class="detalhe-valor">${formatarMoeda(simulacao.cliente.entrada + simulacao.cliente.fgts)}</span>
                    </div>
                    <div class="detalhe-item">
                        <span class="detalhe-label">Renda Familiar:</span>
                        <span class="detalhe-valor">${formatarMoeda(simulacao.cliente.rendaFamiliar)}</span>
                    </div>
                    <div class="detalhe-item">
                        <span class="detalhe-label">Aluguel Atual:</span>
                        <span class="detalhe-valor">${formatarMoeda(simulacao.cliente.aluguelAtual)}</span>
                    </div>
                </div>
                
                <div class="detalhe-secao">
                    <h4><i class="fas fa-calculator"></i> Resultados da Simulação</h4>
                    <div class="detalhe-item">
                        <span class="detalhe-label">Financiamento - Parcela:</span>
                        <span class="detalhe-valor">${formatarMoeda(simulacao.financiamento.valorParcela)}</span>
                    </div>
                    <div class="detalhe-item">
                        <span class="detalhe-label">Financiamento - Total:</span>
                        <span class="detalhe-valor">${formatarMoeda(simulacao.financiamento.total)}</span>
                    </div>
                    <div class="detalhe-item">
                        <span class="detalhe-label">Consórcio - Parcela:</span>
                        <span class="detalhe-valor">${formatarMoeda(simulacao.consorcio.valorParcela)}</span>
                    </div>
                    <div class="detalhe-item">
                        <span class="detalhe-label">Consórcio - Total:</span>
                        <span class="detalhe-valor">${formatarMoeda(simulacao.consorcio.total)}</span>
                    </div>
                    <div class="detalhe-item">
                        <span class="detalhe-label">Economia Total:</span>
                        <span class="detalhe-valor" style="color: #27AE60; font-weight: bold;">
                            ${formatarMoeda(simulacao.financiamento.total - simulacao.consorcio.total)}
                        </span>
                    </div>
                </div>
            </div>
        `;
        
        // Armazenar ID da simulação atual para o PDF
        document.getElementById('modal-detalhes').setAttribute('data-simulacao-id', id);
        
        // Mostrar modal
        document.getElementById('modal-detalhes').style.display = 'block';
        
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        mostrarNotificacao('Erro ao carregar detalhes da simulação', 'error');
    }
}

async function gerarPDFSimulacao(id) {
    try {
        const simulacoes = await window.localDB.buscarSimulacoes();
        const simulacao = simulacoes.find(s => s.id === id);
        
        if (!simulacao) {
            mostrarNotificacao('Simulação não encontrada', 'error');
            return;
        }
        
        // Verificar se o gerador de PDF está disponível
        if (!window.pdfGenerator) {
            mostrarNotificacao('Gerador de PDF não está disponível. Verifique se a biblioteca jsPDF está carregada.', 'error');
            return;
        }
        
        mostrarNotificacao('Gerando PDF...', 'info');
        
        const resultado = await window.pdfGenerator.gerarPDF(simulacao, true); // true = fazer download
        
        if (resultado.success) {
            mostrarNotificacao('PDF gerado com sucesso!', 'success');
            
            // Atualizar estatísticas
            await carregarEstatisticas();
        } else {
            mostrarNotificacao('Erro ao gerar PDF: ' + resultado.error, 'error');
        }
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        mostrarNotificacao('Erro ao gerar PDF', 'error');
    }
}

async function gerarPDFModal() {
    const simulacaoId = document.getElementById('modal-detalhes').getAttribute('data-simulacao-id');
    if (simulacaoId) {
        await gerarPDFSimulacao(parseInt(simulacaoId));
    }
}

async function gerenciarPDFs() {
    try {
        if (!window.pdfStorage) {
            mostrarNotificacao('Storage de PDFs não está disponível', 'error');
            return;
        }
        
        const pdfs = await window.pdfStorage.listarPDFs();
        
        const modalBody = document.getElementById('modal-pdfs-content');
        
        if (pdfs.length === 0) {
            modalBody.innerHTML = '<p class="no-data">Nenhum PDF armazenado</p>';
        } else {
            modalBody.innerHTML = `
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Cliente</th>
                                <th>Email</th>
                                <th>Valor Imóvel</th>
                                <th>Arquivo</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pdfs.map(pdf => `
                                <tr>
                                    <td>${formatarData(pdf.dataGeracao)}</td>
                                    <td>${pdf.clienteNome}</td>
                                    <td>${pdf.clienteEmail}</td>
                                    <td>${formatarMoeda(pdf.valorImovel)}</td>
                                    <td>${pdf.filename}</td>
                                    <td>
                                        <button class="btn btn-primary btn-small" onclick="baixarPDFArmazenado(${pdf.id})">
                                            <i class="fas fa-download"></i>
                                            Baixar
                                        </button>
                                        <button class="btn btn-danger btn-small" onclick="excluirPDFArmazenado(${pdf.id})">
                                            <i class="fas fa-trash"></i>
                                            Excluir
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        document.getElementById('modal-pdfs').style.display = 'block';
        
    } catch (error) {
        console.error('Erro ao carregar PDFs:', error);
        mostrarNotificacao('Erro ao carregar PDFs armazenados', 'error');
    }
}

async function baixarPDFArmazenado(id) {
    try {
        await window.pdfStorage.baixarPDF(id);
        mostrarNotificacao('PDF baixado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao baixar PDF:', error);
        mostrarNotificacao('Erro ao baixar PDF', 'error');
    }
}

async function excluirPDFArmazenado(id) {
    if (confirm('Tem certeza que deseja excluir este PDF?')) {
        try {
            await window.pdfStorage.excluirPDF(id);
            mostrarNotificacao('PDF excluído com sucesso!', 'success');
            
            // Recarregar lista de PDFs
            await gerenciarPDFs();
            
            // Atualizar estatísticas
            await carregarEstatisticas();
            
        } catch (error) {
            console.error('Erro ao excluir PDF:', error);
            mostrarNotificacao('Erro ao excluir PDF', 'error');
        }
    }
}

async function confirmarLimpezaPDFs() {
    if (confirm('ATENÇÃO: Esta ação irá apagar TODOS os PDFs armazenados. Esta ação não pode ser desfeita. Deseja continuar?')) {
        try {
            const pdfs = await window.pdfStorage.listarPDFs();
            
            for (const pdf of pdfs) {
                await window.pdfStorage.excluirPDF(pdf.id);
            }
            
            mostrarNotificacao('Todos os PDFs foram excluídos com sucesso!', 'success');
            
            // Fechar modal e atualizar
            fecharModalPDFs();
            await carregarEstatisticas();
            
        } catch (error) {
            console.error('Erro ao limpar PDFs:', error);
            mostrarNotificacao('Erro ao limpar PDFs', 'error');
        }
    }
}

function fecharModalPDFs() {
    document.getElementById('modal-pdfs').style.display = 'none';
}

async function exportarDados() {
    try {
        mostrarNotificacao('Exportando dados...', 'info');
        await window.localDB.exportarDados();
        mostrarNotificacao('Dados exportados com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        mostrarNotificacao('Erro ao exportar dados', 'error');
    }
}

function limparFiltros() {
    document.getElementById('filtro-nome').value = '';
    document.getElementById('filtro-email').value = '';
    document.getElementById('filtro-data-inicio').value = '';
    document.getElementById('filtro-data-fim').value = '';
    
    buscarSimulacoes();
}

function confirmarLimpeza() {
    if (confirm('ATENÇÃO: Esta ação irá apagar TODOS os dados do banco local. Esta ação não pode ser desfeita. Deseja continuar?')) {
        if (confirm('Tem certeza absoluta? Todos os dados serão perdidos permanentemente.')) {
            limparBanco();
        }
    }
}

async function limparBanco() {
    try {
        await window.localDB.limparDados();
        mostrarNotificacao('Banco de dados limpo com sucesso!', 'success');
        
        // Recarregar dados
        await carregarEstatisticas();
        await buscarSimulacoes();
        
    } catch (error) {
        console.error('Erro ao limpar banco:', error);
        mostrarNotificacao('Erro ao limpar banco de dados', 'error');
    }
}

function fecharModal() {
    document.getElementById('modal-detalhes').style.display = 'none';
}

function configurarEventos() {
    // Fechar modal ao clicar fora
    window.onclick = function(event) {
        const modal = document.getElementById('modal-detalhes');
        const modalPDFs = document.getElementById('modal-pdfs');
        
        if (event.target === modal) {
            fecharModal();
        }
        if (event.target === modalPDFs) {
            fecharModalPDFs();
        }
    };
    
    // Buscar ao pressionar Enter nos campos de filtro
    ['filtro-nome', 'filtro-email'].forEach(id => {
        document.getElementById(id).addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                buscarSimulacoes();
            }
        });
    });
    
    // Buscar automaticamente ao alterar datas
    ['filtro-data-inicio', 'filtro-data-fim'].forEach(id => {
        document.getElementById(id).addEventListener('change', buscarSimulacoes);
    });
}

function criarGraficoTipos(tiposPopulares) {
    const canvas = document.getElementById('chart-tipos-imoveis');
    const ctx = canvas.getContext('2d');
    
    if (tiposPopulares.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Nenhum dado disponível', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Cores para o gráfico
    const cores = ['#046986', '#0a8eab', '#f68b1f', '#27AE60', '#e74c3c'];
    
    // Calcular total
    const total = tiposPopulares.reduce((sum, item) => sum + item.quantidade, 0);
    
    // Desenhar gráfico de pizza
    let anguloInicial = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const raio = Math.min(centerX, centerY) - 50;
    
    tiposPopulares.forEach((item, index) => {
        const angulo = (item.quantidade / total) * 2 * Math.PI;
        
        // Desenhar fatia
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, raio, anguloInicial, anguloInicial + angulo);
        ctx.closePath();
        ctx.fillStyle = cores[index % cores.length];
        ctx.fill();
        
        // Desenhar label
        const labelAngle = anguloInicial + angulo / 2;
        const labelX = centerX + Math.cos(labelAngle) * (raio + 30);
        const labelY = centerY + Math.sin(labelAngle) * (raio + 30);
        
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${getTipoImovel(item.tipo)} (${item.quantidade})`, labelX, labelY);
        
        anguloInicial += angulo;
    });
}

// Funções utilitárias
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function formatarData(dataISO) {
    return new Date(dataISO).toLocaleDateString('pt-BR');
}

function formatarDataCompleta(dataISO) {
    return new Date(dataISO).toLocaleString('pt-BR');
}

function getTipoImovel(tipo) {
    const tipos = {
        'house': 'Casa',
        'apartment': 'Apartamento',
        'land': 'Terreno / Lote',
        'construction': 'Construção',
        'commercial': 'Imóvel Comercial',
        'incorporation': 'Incorporação Imobiliária',
        'rural': 'Imóvel Rural'
    };
    return tipos[tipo] || tipo;
}

function mostrarNotificacao(mensagem, tipo = 'info') {
    // Criar elemento de notificação
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao notificacao-${tipo}`;
    notificacao.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${mensagem}</span>
    `;
    
    // Adicionar estilos se não existirem
    if (!document.getElementById('notificacao-styles')) {
        const style = document.createElement('style');
        style.id = 'notificacao-styles';
        style.textContent = `
            .notificacao {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                color: white;
                font-weight: 600;
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                animation: slideInRight 0.3s ease;
                max-width: 400px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .notificacao-success { background-color: #27AE60; }
            .notificacao-error { background-color: #e74c3c; }
            .notificacao-info { background-color: #3498db; }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notificacao);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notificacao.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            if (notificacao.parentNode) {
                notificacao.parentNode.removeChild(notificacao);
            }
        }, 300);
    }, 5000);
}