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
    } catch (error) {
        console.error('Erro ao parsear dados do localStorage:', error);
        window.location.href = 'index.html';
    }
    
    // Configurar o botão de agendamento
    setupBotaoAgendamento();
    
    // Configurar botão de PDF
    setupBotaoPDF();
});

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
        btnPDF.innerHTML = '<i class="fas fa-file-pdf"></i> Gerar PDF';
        
        btnPDF.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const dadosArmazenados = localStorage.getItem('simulacaoResultado');
            if (!dadosArmazenados) {
                alert('Dados da simulação não encontrados');
                return;
            }
            
            try {
                // Verificar se as bibliotecas estão carregadas
                if (typeof window.jsPDF === 'undefined') {
                    // Carregar jsPDF dinamicamente
                    await carregarJsPDF();
                }
                
                if (!window.pdfGenerator) {
                    alert('Gerador de PDF não está disponível');
                    return;
                }
                
                const dados = JSON.parse(dadosArmazenados);
                const sucesso = await window.pdfGenerator.gerarPDF(dados);
                
                if (!sucesso) {
                    alert('Erro ao gerar PDF');
                }
                
            } catch (error) {
                console.error('Erro ao gerar PDF:', error);
                alert('Erro ao gerar PDF. Verifique sua conexão com a internet.');
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