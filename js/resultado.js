document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de resultados carregada, iniciando script...');
    
    // Obter dados do localStorage
    const dadosArmazenados = localStorage.getItem('simulacaoResultado');
    
    if (!dadosArmazenados) {
        console.log('Nenhum dado encontrado, redirecionando...');
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const dados = JSON.parse(dadosArmazenados);
        console.log('Dados do localStorage parseados:', dados);
        preencherResultados(dados);
        
        // Verificar se há PDF gerado
        verificarPDFGerado();
        
    } catch (error) {
        console.error('Erro ao parsear dados do localStorage:', error);
        window.location.href = 'index.html';
    }
    
    // Configurar o botão de agendamento
    setupBotaoAgendamento();
    
    // Configurar botão de PDF
    setupBotaoPDF();
});

function verificarPDFGerado() {
    const ultimoPDF = localStorage.getItem('ultimoPDFGerado');
    if (ultimoPDF) {
        try {
            const pdfInfo = JSON.parse(ultimoPDF);
            if (pdfInfo.gerado) {
                mostrarNotificacao(`PDF "${pdfInfo.filename}" foi gerado e salvo automaticamente!`, 'success');
                
                // Limpar a informação após mostrar
                localStorage.removeItem('ultimoPDFGerado');
            }
        } catch (error) {
            console.error('Erro ao verificar PDF gerado:', error);
        }
    }
}

function preencherResultados(dados) {
    try {
        console.log('Iniciando preenchimento dos resultados com dados:', dados);
        
        // Financiamento
        const valorCredito = dados.financiamento?.credito || 0;
        const entradaMinima = valorCredito * 0.3; // 30% do valor do crédito
        const entradaFinal = Math.max(entradaMinima, dados.financiamento?.entrada || 0);
        const valorFinanciado = valorCredito - entradaFinal;
        const prazoFinanciamento = CONFIG_FINANCIAMENTO.PRAZO_MESES;
        let parcelaFinanciamento = dados.financiamento?.valorParcela || 0;
        
        // Se não houver valor de parcela, recalculamos
        if (parcelaFinanciamento <= 0) {
            const taxaJurosAnual = CONFIG_FINANCIAMENTO.TAXA_JUROS_ANUAL;
            const taxaMensal = Math.pow(1 + taxaJurosAnual, 1/12) - 1;
            parcelaFinanciamento = (valorFinanciado) * (taxaMensal * Math.pow(1 + taxaMensal, prazoFinanciamento)) / (Math.pow(1 + taxaMensal, prazoFinanciamento) - 1);
        }
        
        const totalFinanciamento = (prazoFinanciamento * parcelaFinanciamento) + entradaFinal;

        // Preencher dados do Financiamento
        const elementosFinanciamento = {
            'financiamento-credito': valorCredito,
            'entrada-minima-30': entradaMinima,
            'financiamento-valor-financiado': valorFinanciado,
            'financiamento-parcela': parcelaFinanciamento,
            'financiamento-total': totalFinanciamento
        };

        Object.entries(elementosFinanciamento).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = formatarMoeda(valor);
            }
        });

        // Preencher taxa e prazo do financiamento
        const taxaElement = document.getElementById('financiamento-taxa');
        if (taxaElement) {
            taxaElement.textContent = `${dados.financiamento?.taxaAnual?.toFixed(2) || 11.49}% a.a.`;
        }

        const prazoElement = document.getElementById('financiamento-prazo');
        if (prazoElement) {
            prazoElement.textContent = `${prazoFinanciamento} meses`;
        }

        // Consórcio
        const creditoConsorcio = dados.consorcio?.credito || 0;
        const parcelaConsorcio = dados.consorcio?.valorParcela || 0;
        const lanceSubsidiado = creditoConsorcio * 0.25;
        const parcelaReduzida = parcelaConsorcio * 0.5;

        // Preencher dados do Consórcio
        const elementosConsorcio = {
            'consorcio-credito': creditoConsorcio,
            'consorcio-lance-subsidiado': lanceSubsidiado,
            'consorcio-parcela': parcelaConsorcio,
            'consorcio-parcela-reduzida': parcelaReduzida,
            'consorcio-total': dados.consorcio?.total || 0
        };

        Object.entries(elementosConsorcio).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = formatarMoeda(valor);
            }
        });

        // Preencher taxa e prazo do consórcio
        const taxaConsorcioElement = document.getElementById('consorcio-taxa');
        if (taxaConsorcioElement) {
            taxaConsorcioElement.textContent = `${dados.consorcio?.taxaAdm?.toFixed(2) || 28.00}%`;
        }

        const prazoConsorcioElement = document.getElementById('consorcio-prazo');
        if (prazoConsorcioElement) {
            prazoConsorcioElement.textContent = `${dados.consorcio?.parcelas || 240} meses`;
        }

        // Calcular economia
        setTimeout(() => {
            const finTotalElement = document.getElementById('financiamento-total');
            const consTotalElement = document.getElementById('consorcio-total');
            
            let valorFinanciamento = 0;
            let valorConsorcio = 0;
            
            if (finTotalElement && finTotalElement.textContent) {
                valorFinanciamento = parseFloat(finTotalElement.textContent.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
            }
            
            if (consTotalElement && consTotalElement.textContent) {
                valorConsorcio = parseFloat(consTotalElement.textContent.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
            }
            
            const economiaTotal = valorFinanciamento - valorConsorcio;
            
            const economiaElement = document.getElementById('economia-valor');
            if (economiaElement) {
                economiaElement.textContent = formatarMoeda(economiaTotal);
            }
            
            const percentualEconomia = (economiaTotal / valorFinanciamento) * 100;
            const percentualElement = document.getElementById('economia-percentual');
            if (percentualElement) {
                percentualElement.textContent = `${percentualEconomia.toFixed(1)}% de economia`;
            }
        }, 100);
        
        console.log('Preenchimento dos resultados concluído com sucesso');
        
    } catch (error) {
        console.error('Erro ao preencher resultados:', error);
        alert('Ocorreu um erro ao carregar os dados da simulação. Por favor, tente novamente.');
    }
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function setupBotaoAgendamento() {
    const btnAgendar = document.querySelector('.btn-agendar');
    if (btnAgendar) {
        btnAgendar.addEventListener('click', function(e) {
            e.preventDefault();
            
            const dadosArmazenados = localStorage.getItem('simulacaoResultado');
            if (!dadosArmazenados) return;
            
            const dados = JSON.parse(dadosArmazenados);
            const whatsapp = dados.cliente?.whatsapp?.replace(/\D/g, '') || '';
            const mensagem = encodeURIComponent(
                `Olá! Vi a simulação de financiamento/consórcio no site e gostaria de agendar uma consultoria.`
            );
            
            window.open(`https://wa.me/5519991946424?text=${mensagem}`, '_blank');
        });
    }
}

function setupBotaoPDF() {
    // Adicionar botão de PDF na página de resultados
    const acaoContainer = document.querySelector('.acao-container');
    if (acaoContainer) {
        const btnPDF = document.createElement('a');
        btnPDF.href = '#';
        btnPDF.className = 'btn-agendar';
        btnPDF.style.backgroundColor = '#e74c3c';
        btnPDF.innerHTML = '<i class="fas fa-file-pdf"></i> Baixar PDF';
        
        btnPDF.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const dadosArmazenados = localStorage.getItem('simulacaoResultado');
            if (!dadosArmazenados) {
                alert('Dados da simulação não encontrados');
                return;
            }
            
            try {
                mostrarLoader('Gerando PDF...');
                
                // Verificar se as bibliotecas estão carregadas
                if (typeof window.jsPDF === 'undefined') {
                    await carregarJsPDF();
                }
                
                if (!window.pdfGenerator) {
                    alert('Gerador de PDF não está disponível');
                    esconderLoader();
                    return;
                }
                
                const dados = JSON.parse(dadosArmazenados);
                const resultado = await window.pdfGenerator.gerarPDF(dados, true); // true = fazer download
                
                esconderLoader();
                
                if (resultado.success) {
                    mostrarNotificacao('PDF gerado e baixado com sucesso!', 'success');
                } else {
                    mostrarNotificacao('Erro ao gerar PDF: ' + resultado.error, 'error');
                }
                
            } catch (error) {
                console.error('Erro ao gerar PDF:', error);
                esconderLoader();
                mostrarNotificacao('Erro ao gerar PDF. Tente novamente.', 'error');
            }
        });
        
        // Inserir antes do botão de voltar
        const btnVoltar = acaoContainer.querySelector('.btn-voltar');
        if (btnVoltar) {
            acaoContainer.insertBefore(btnPDF, btnVoltar);
        } else {
            acaoContainer.appendChild(btnPDF);
        }
    }
}

async function carregarJsPDF() {
    return new Promise((resolve, reject) => {
        if (typeof window.jsPDF !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            // jsPDF carregado, agora carregar o gerador de PDF
            const pdfScript = document.createElement('script');
            pdfScript.src = 'js/pdf-generator.js';
            pdfScript.onload = () => resolve();
            pdfScript.onerror = () => reject(new Error('Erro ao carregar gerador de PDF'));
            document.head.appendChild(pdfScript);
        };
        script.onerror = () => reject(new Error('Erro ao carregar jsPDF'));
        document.head.appendChild(script);
    });
}

// Função para mostrar o loader
function mostrarLoader(mensagem) {
    let loader = document.getElementById('simulacao-loader');
    
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'simulacao-loader';
        loader.className = 'simulacao-loader';
        loader.innerHTML = `
            <div class="loader-spinner"></div>
            <div class="loader-mensagem">${mensagem || 'Carregando...'}</div>
        `;
        document.body.appendChild(loader);
        
        if (!document.getElementById('loader-style')) {
            const style = document.createElement('style');
            style.id = 'loader-style';
            style.textContent = `
                .simulacao-loader {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    color: white;
                }
                .loader-spinner {
                    border: 5px solid #f3f3f3;
                    border-top: 5px solid #3498db;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    animation: spin 2s linear infinite;
                    margin-bottom: 15px;
                }
                .loader-mensagem {
                    font-size: 18px;
                    text-align: center;
                    max-width: 80%;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    } else {
        const mensagemElement = loader.querySelector('.loader-mensagem');
        if (mensagemElement && mensagem) {
            mensagemElement.textContent = mensagem;
        }
    }
    
    loader.style.display = 'flex';
}

// Função para esconder o loader
function esconderLoader() {
    const loader = document.getElementById('simulacao-loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Função para mostrar notificações
function mostrarNotificacao(mensagem, tipo = 'info') {
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