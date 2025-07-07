// PDF Generator usando jsPDF - Versão Melhorada com Storage
class PDFGenerator {
    constructor() {
        this.doc = null;
        this.pageHeight = 297; // A4 height in mm
        this.pageWidth = 210; // A4 width in mm
        this.margin = 20;
        this.currentY = this.margin;
        this.pdfStorage = new PDFStorage();
    }

    async gerarPDF(dados, autoDownload = true) {
        try {
            console.log('Iniciando geração de PDF...');
            
            // Verificar se jsPDF está carregado, se não, carregar
            if (typeof window.jsPDF === 'undefined') {
                console.log('jsPDF não encontrado, carregando...');
                await this.carregarJsPDF();
            }

            this.doc = new window.jsPDF();
            this.currentY = this.margin;

            // Configurar fonte padrão
            this.doc.setFont('helvetica');

            // Adicionar cabeçalho
            this.adicionarCabecalho();

            // Adicionar dados do cliente
            this.adicionarDadosCliente(dados.cliente);

            // Adicionar comparativo
            this.adicionarComparativo(dados);

            // Adicionar economia
            this.adicionarEconomia(dados);

            // Adicionar rodapé
            this.adicionarRodape();

            // Gerar nome do arquivo
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const nomeCliente = dados.cliente.nome.replace(/[^a-zA-Z0-9]/g, '_');
            const nomeArquivo = `simulacao_${nomeCliente}_${timestamp}.pdf`;

            // Obter o PDF como blob
            const pdfBlob = this.doc.output('blob');
            
            // Armazenar o PDF
            await this.pdfStorage.armazenarPDF(nomeArquivo, pdfBlob, dados);
            
            // Download automático se solicitado
            if (autoDownload) {
                this.doc.save(nomeArquivo);
            }

            console.log('PDF gerado e armazenado com sucesso:', nomeArquivo);
            return { success: true, filename: nomeArquivo, blob: pdfBlob };

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            
            // Tentar método alternativo
            try {
                console.log('Tentando método alternativo...');
                return await this.gerarPDFAlternativo(dados, autoDownload);
            } catch (alternativeError) {
                console.error('Erro no método alternativo:', alternativeError);
                return { success: false, error: alternativeError.message };
            }
        }
    }

    async carregarJsPDF() {
        return new Promise((resolve, reject) => {
            // Verificar se já está carregado
            if (typeof window.jsPDF !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                console.log('jsPDF carregado com sucesso');
                resolve();
            };
            script.onerror = () => {
                console.error('Erro ao carregar jsPDF');
                reject(new Error('Erro ao carregar biblioteca jsPDF'));
            };
            document.head.appendChild(script);
        });
    }

    async gerarPDFAlternativo(dados, autoDownload = true) {
        // Método alternativo usando HTML2Canvas + jsPDF
        try {
            const htmlContent = this.gerarHTMLParaPDF(dados);
            
            // Criar elemento temporário
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.width = '210mm';
            tempDiv.style.padding = '20mm';
            tempDiv.style.backgroundColor = 'white';
            tempDiv.style.fontFamily = 'Arial, sans-serif';
            document.body.appendChild(tempDiv);

            // Aguardar renderização
            await new Promise(resolve => setTimeout(resolve, 100));

            // Criar PDF simples com texto
            this.doc = new window.jsPDF();
            this.currentY = this.margin;

            // Adicionar conteúdo de forma mais simples
            this.adicionarConteudoSimples(dados);

            // Remover elemento temporário
            document.body.removeChild(tempDiv);

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const nomeCliente = dados.cliente.nome.replace(/[^a-zA-Z0-9]/g, '_');
            const nomeArquivo = `simulacao_${nomeCliente}_${timestamp}.pdf`;

            const pdfBlob = this.doc.output('blob');
            await this.pdfStorage.armazenarPDF(nomeArquivo, pdfBlob, dados);

            if (autoDownload) {
                this.doc.save(nomeArquivo);
            }

            return { success: true, filename: nomeArquivo, blob: pdfBlob };

        } catch (error) {
            console.error('Erro no método alternativo:', error);
            throw error;
        }
    }

    adicionarConteudoSimples(dados) {
        // Título
        this.doc.setFontSize(20);
        this.doc.setTextColor(4, 105, 134);
        this.doc.text('SIMULAÇÃO FINANCEIRA', this.pageWidth / 2, this.currentY, { align: 'center' });
        this.currentY += 15;

        this.doc.setFontSize(12);
        this.doc.setTextColor(0, 0, 0);
        this.doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, this.pageWidth / 2, this.currentY, { align: 'center' });
        this.currentY += 20;

        // Dados do cliente
        this.doc.setFontSize(14);
        this.doc.setTextColor(4, 105, 134);
        this.doc.text('DADOS DO CLIENTE', this.margin, this.currentY);
        this.currentY += 10;

        this.doc.setFontSize(10);
        this.doc.setTextColor(0, 0, 0);

        const dadosCliente = [
            `Nome: ${dados.cliente.nome}`,
            `Email: ${dados.cliente.email}`,
            `WhatsApp: ${dados.cliente.whatsapp}`,
            `Tipo de Imóvel: ${this.getTipoImovel(dados.cliente.tipoImovel)}`,
            `Valor do Imóvel: ${this.formatarMoeda(dados.cliente.valorImovel)}`,
            `Renda Familiar: ${this.formatarMoeda(dados.cliente.rendaFamiliar)}`
        ];

        dadosCliente.forEach(linha => {
            this.doc.text(linha, this.margin, this.currentY);
            this.currentY += 6;
        });

        this.currentY += 15;

        // Comparativo
        this.doc.setFontSize(14);
        this.doc.setTextColor(4, 105, 134);
        this.doc.text('COMPARATIVO FINANCEIRO', this.margin, this.currentY);
        this.currentY += 15;

        // Financiamento
        this.doc.setFontSize(12);
        this.doc.setTextColor(26, 93, 173);
        this.doc.text('FINANCIAMENTO BANCÁRIO', this.margin, this.currentY);
        this.currentY += 8;

        this.doc.setFontSize(10);
        this.doc.setTextColor(0, 0, 0);

        const financiamento = [
            `Crédito: ${this.formatarMoeda(dados.financiamento.credito)}`,
            `Parcela Mensal: ${this.formatarMoeda(dados.financiamento.valorParcela)}`,
            `Total a Pagar: ${this.formatarMoeda(dados.financiamento.total)}`
        ];

        financiamento.forEach(linha => {
            this.doc.text(linha, this.margin + 5, this.currentY);
            this.currentY += 6;
        });

        this.currentY += 10;

        // Consórcio
        this.doc.setFontSize(12);
        this.doc.setTextColor(246, 139, 31);
        this.doc.text('CONSÓRCIO IMOBILIÁRIO', this.margin, this.currentY);
        this.currentY += 8;

        this.doc.setFontSize(10);
        this.doc.setTextColor(0, 0, 0);

        const consorcio = [
            `Crédito: ${this.formatarMoeda(dados.consorcio.credito)}`,
            `Parcela Mensal: ${this.formatarMoeda(dados.consorcio.valorParcela)}`,
            `Total a Pagar: ${this.formatarMoeda(dados.consorcio.total)}`
        ];

        consorcio.forEach(linha => {
            this.doc.text(linha, this.margin + 5, this.currentY);
            this.currentY += 6;
        });

        this.currentY += 15;

        // Economia
        const economia = dados.financiamento.total - dados.consorcio.total;
        this.doc.setFontSize(16);
        this.doc.setTextColor(246, 139, 31);
        this.doc.text(`ECONOMIA TOTAL: ${this.formatarMoeda(economia)}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    }

    gerarHTMLParaPDF(dados) {
        return `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h1 style="color: #046986; text-align: center;">SIMULAÇÃO FINANCEIRA</h1>
                <p style="text-align: center;">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
                
                <h2 style="color: #046986;">DADOS DO CLIENTE</h2>
                <p><strong>Nome:</strong> ${dados.cliente.nome}</p>
                <p><strong>Email:</strong> ${dados.cliente.email}</p>
                <p><strong>WhatsApp:</strong> ${dados.cliente.whatsapp}</p>
                <p><strong>Tipo de Imóvel:</strong> ${this.getTipoImovel(dados.cliente.tipoImovel)}</p>
                <p><strong>Valor do Imóvel:</strong> ${this.formatarMoeda(dados.cliente.valorImovel)}</p>
                <p><strong>Renda Familiar:</strong> ${this.formatarMoeda(dados.cliente.rendaFamiliar)}</p>
                
                <h2 style="color: #046986;">COMPARATIVO FINANCEIRO</h2>
                
                <h3 style="color: #1A5DAD;">FINANCIAMENTO BANCÁRIO</h3>
                <p><strong>Crédito:</strong> ${this.formatarMoeda(dados.financiamento.credito)}</p>
                <p><strong>Parcela Mensal:</strong> ${this.formatarMoeda(dados.financiamento.valorParcela)}</p>
                <p><strong>Total a Pagar:</strong> ${this.formatarMoeda(dados.financiamento.total)}</p>
                
                <h3 style="color: #f68b1f;">CONSÓRCIO IMOBILIÁRIO</h3>
                <p><strong>Crédito:</strong> ${this.formatarMoeda(dados.consorcio.credito)}</p>
                <p><strong>Parcela Mensal:</strong> ${this.formatarMoeda(dados.consorcio.valorParcela)}</p>
                <p><strong>Total a Pagar:</strong> ${this.formatarMoeda(dados.consorcio.total)}</p>
                
                <h2 style="color: #f68b1f; text-align: center;">
                    ECONOMIA TOTAL: ${this.formatarMoeda(dados.financiamento.total - dados.consorcio.total)}
                </h2>
            </div>
        `;
    }

    adicionarCabecalho() {
        // Título
        this.doc.setFontSize(20);
        this.doc.setTextColor(4, 105, 134);
        this.doc.text('SIMULAÇÃO FINANCEIRA', this.pageWidth / 2, this.currentY + 15, { align: 'center' });

        this.doc.setFontSize(12);
        this.doc.setTextColor(0, 0, 0);
        this.doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, this.pageWidth / 2, this.currentY + 25, { align: 'center' });

        this.currentY += 40;
        this.adicionarLinha();
    }

    adicionarDadosCliente(cliente) {
        this.verificarNovaPagina(60);

        this.doc.setFontSize(16);
        this.doc.setTextColor(4, 105, 134);
        this.doc.text('DADOS DO CLIENTE', this.margin, this.currentY);
        this.currentY += 10;

        this.doc.setFontSize(10);
        this.doc.setTextColor(0, 0, 0);

        const dadosCliente = [
            ['Nome:', cliente.nome || 'N/A'],
            ['Email:', cliente.email || 'N/A'],
            ['WhatsApp:', cliente.whatsapp || 'N/A'],
            ['Profissão:', cliente.profissao || 'N/A'],
            ['Tipo de Imóvel:', this.getTipoImovel(cliente.tipoImovel)],
            ['Renda Familiar:', this.formatarMoeda(cliente.rendaFamiliar)],
            ['Valor do Imóvel:', this.formatarMoeda(cliente.valorImovel)],
            ['Entrada + FGTS:', this.formatarMoeda(cliente.entrada + cliente.fgts)]
        ];

        dadosCliente.forEach(([label, valor]) => {
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(label, this.margin, this.currentY);
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(String(valor), this.margin + 40, this.currentY);
            this.currentY += 6;
        });

        this.currentY += 10;
        this.adicionarLinha();
    }

    adicionarComparativo(dados) {
        this.verificarNovaPagina(100);

        this.doc.setFontSize(16);
        this.doc.setTextColor(4, 105, 134);
        this.doc.text('COMPARATIVO FINANCEIRO', this.margin, this.currentY);
        this.currentY += 15;

        // Financiamento
        this.doc.setFontSize(14);
        this.doc.setTextColor(26, 93, 173);
        this.doc.text('FINANCIAMENTO BANCÁRIO', this.margin, this.currentY);
        this.currentY += 8;

        this.doc.setFontSize(10);
        this.doc.setTextColor(0, 0, 0);

        const dadosFinanciamento = [
            ['Crédito:', this.formatarMoeda(dados.financiamento.credito)],
            ['Entrada Mínima (30%):', this.formatarMoeda(dados.financiamento.credito * 0.3)],
            ['Valor Financiado:', this.formatarMoeda(dados.financiamento.credito - (dados.financiamento.credito * 0.3))],
            ['Taxa de Juros:', `${dados.financiamento.taxaAnual?.toFixed(2) || '11.49'}% a.a.`],
            ['Prazo:', `${dados.financiamento.parcelas || 420} meses`],
            ['Parcela Mensal:', this.formatarMoeda(dados.financiamento.valorParcela)],
            ['Total a Pagar:', this.formatarMoeda(dados.financiamento.total)]
        ];

        dadosFinanciamento.forEach(([label, valor]) => {
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(label, this.margin + 5, this.currentY);
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(String(valor), this.margin + 60, this.currentY);
            this.currentY += 6;
        });

        this.currentY += 10;

        // Consórcio
        this.doc.setFontSize(14);
        this.doc.setTextColor(246, 139, 31);
        this.doc.text('CONSÓRCIO IMOBILIÁRIO', this.margin, this.currentY);
        this.currentY += 8;

        this.doc.setFontSize(10);
        this.doc.setTextColor(0, 0, 0);

        const dadosConsorcio = [
            ['Crédito:', this.formatarMoeda(dados.consorcio.credito)],
            ['Lance Subsidiado (25%):', this.formatarMoeda(dados.consorcio.credito * 0.25)],
            ['Taxa Administrativa:', `${dados.consorcio.taxaAdm?.toFixed(2) || '28.00'}%`],
            ['Prazo:', `${dados.consorcio.parcelas || 240} meses`],
            ['Parcela Mensal:', this.formatarMoeda(dados.consorcio.valorParcela)],
            ['Parcela Reduzida (50%):', this.formatarMoeda(dados.consorcio.valorParcela * 0.5)],
            ['Total a Pagar:', this.formatarMoeda(dados.consorcio.total)]
        ];

        dadosConsorcio.forEach(([label, valor]) => {
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(label, this.margin + 5, this.currentY);
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(String(valor), this.margin + 60, this.currentY);
            this.currentY += 6;
        });

        this.currentY += 10;
        this.adicionarLinha();
    }

    adicionarEconomia(dados) {
        this.verificarNovaPagina(40);

        const economia = dados.financiamento.total - dados.consorcio.total;
        const percentualEconomia = (economia / dados.financiamento.total) * 100;

        // Caixa de destaque para economia
        this.doc.setFillColor(246, 139, 31);
        this.doc.rect(this.margin, this.currentY, this.pageWidth - (2 * this.margin), 25, 'F');

        this.doc.setFontSize(16);
        this.doc.setTextColor(255, 255, 255);
        this.doc.text('ECONOMIA TOTAL COM CONSÓRCIO', this.pageWidth / 2, this.currentY + 8, { align: 'center' });

        this.doc.setFontSize(20);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(this.formatarMoeda(economia), this.pageWidth / 2, this.currentY + 16, { align: 'center' });

        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(`${percentualEconomia.toFixed(1)}% de economia`, this.pageWidth / 2, this.currentY + 22, { align: 'center' });

        this.currentY += 35;

        // Informações adicionais
        this.doc.setFontSize(10);
        this.doc.setTextColor(0, 0, 0);
        this.doc.text('✓ Lei do Consórcio 11.795/2008 - Fiscalização BACEN', this.margin, this.currentY);
        this.currentY += 5;
        this.doc.text('✓ 4 Formas de Contemplação: Sorteio, Lance Livre, Fixo 25%, Fixo 50%', this.margin, this.currentY);
        this.currentY += 5;
        this.doc.text('✓ Uso do FGTS e Restituição do Imposto de Renda', this.margin, this.currentY);

        this.currentY += 15;
        this.adicionarLinha();
    }

    adicionarRodape() {
        const rodapeY = this.pageHeight - 30;

        this.doc.setFontSize(10);
        this.doc.setTextColor(100, 100, 100);
        this.doc.text('Casa Programada - Consultoria Financeira', this.pageWidth / 2, rodapeY, { align: 'center' });
        this.doc.text('WhatsApp: (19) 99194-6424', this.pageWidth / 2, rodapeY + 5, { align: 'center' });
        this.doc.text('Este documento foi gerado automaticamente pelo sistema de simulação.', this.pageWidth / 2, rodapeY + 10, { align: 'center' });
    }

    verificarNovaPagina(alturaMinima) {
        if (this.currentY + alturaMinima > this.pageHeight - 40) {
            this.doc.addPage();
            this.currentY = this.margin;
        }
    }

    adicionarLinha() {
        this.doc.setDrawColor(200, 200, 200);
        this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
        this.currentY += 5;
    }

    formatarMoeda(valor) {
        if (typeof valor !== 'number') {
            valor = parseFloat(valor) || 0;
        }
        return valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    getTipoImovel(tipo) {
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
}

// Classe para armazenamento de PDFs
class PDFStorage {
    constructor() {
        this.dbName = 'CasaProgramadaPDFs';
        this.version = 1;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Erro ao abrir banco de PDFs:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Banco de PDFs aberto com sucesso');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('pdfs')) {
                    const pdfStore = db.createObjectStore('pdfs', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    pdfStore.createIndex('filename', 'filename', { unique: false });
                    pdfStore.createIndex('clienteNome', 'clienteNome', { unique: false });
                    pdfStore.createIndex('dataGeracao', 'dataGeracao', { unique: false });
                }
            };
        });
    }

    async armazenarPDF(filename, blob, dadosSimulacao) {
        try {
            if (!this.db) {
                await this.init();
            }

            // Converter blob para array buffer para armazenamento
            const arrayBuffer = await blob.arrayBuffer();

            const pdfData = {
                filename: filename,
                data: arrayBuffer,
                clienteNome: dadosSimulacao.cliente.nome,
                clienteEmail: dadosSimulacao.cliente.email,
                valorImovel: dadosSimulacao.cliente.valorImovel,
                dataGeracao: new Date().toISOString(),
                dadosCompletos: dadosSimulacao
            };

            const transaction = this.db.transaction(['pdfs'], 'readwrite');
            const store = transaction.objectStore('pdfs');
            
            return new Promise((resolve, reject) => {
                const request = store.add(pdfData);
                
                request.onsuccess = () => {
                    console.log('PDF armazenado com ID:', request.result);
                    resolve(request.result);
                };
                
                request.onerror = () => {
                    console.error('Erro ao armazenar PDF:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Erro ao armazenar PDF:', error);
            throw error;
        }
    }

    async listarPDFs() {
        try {
            if (!this.db) {
                await this.init();
            }

            const transaction = this.db.transaction(['pdfs'], 'readonly');
            const store = transaction.objectStore('pdfs');

            return new Promise((resolve, reject) => {
                const request = store.getAll();
                
                request.onsuccess = () => {
                    const pdfs = request.result.map(pdf => ({
                        id: pdf.id,
                        filename: pdf.filename,
                        clienteNome: pdf.clienteNome,
                        clienteEmail: pdf.clienteEmail,
                        valorImovel: pdf.valorImovel,
                        dataGeracao: pdf.dataGeracao
                    }));
                    
                    // Ordenar por data (mais recente primeiro)
                    pdfs.sort((a, b) => new Date(b.dataGeracao) - new Date(a.dataGeracao));
                    
                    resolve(pdfs);
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Erro ao listar PDFs:', error);
            throw error;
        }
    }

    async baixarPDF(id) {
        try {
            if (!this.db) {
                await this.init();
            }

            const transaction = this.db.transaction(['pdfs'], 'readonly');
            const store = transaction.objectStore('pdfs');

            return new Promise((resolve, reject) => {
                const request = store.get(id);
                
                request.onsuccess = () => {
                    const pdfData = request.result;
                    if (pdfData) {
                        // Converter array buffer de volta para blob
                        const blob = new Blob([pdfData.data], { type: 'application/pdf' });
                        
                        // Criar URL e fazer download
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = pdfData.filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        resolve(true);
                    } else {
                        reject(new Error('PDF não encontrado'));
                    }
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Erro ao baixar PDF:', error);
            throw error;
        }
    }

    async excluirPDF(id) {
        try {
            if (!this.db) {
                await this.init();
            }

            const transaction = this.db.transaction(['pdfs'], 'readwrite');
            const store = transaction.objectStore('pdfs');

            return new Promise((resolve, reject) => {
                const request = store.delete(id);
                
                request.onsuccess = () => {
                    console.log('PDF excluído com sucesso');
                    resolve(true);
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Erro ao excluir PDF:', error);
            throw error;
        }
    }
}

// Instância global
window.pdfGenerator = new PDFGenerator();
window.pdfStorage = new PDFStorage();

// Inicializar automaticamente
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Inicializando PDF Generator...');
        
        // Carregar jsPDF se não estiver carregado
        if (typeof window.jsPDF === 'undefined') {
            await window.pdfGenerator.carregarJsPDF();
        }
        
        console.log('PDF Generator inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar PDF Generator:', error);
    }
});