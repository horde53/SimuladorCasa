// PDF Generator usando jsPDF
class PDFGenerator {
    constructor() {
        this.doc = null;
        this.pageHeight = 297; // A4 height in mm
        this.pageWidth = 210; // A4 width in mm
        this.margin = 20;
        this.currentY = this.margin;
    }

    async gerarPDF(dados) {
        try {
            // Verificar se jsPDF está carregado
            if (typeof window.jsPDF === 'undefined') {
                throw new Error('jsPDF não está carregado');
            }

            this.doc = new window.jsPDF();
            this.currentY = this.margin;

            // Configurar fonte padrão
            this.doc.setFont('helvetica');

            // Adicionar cabeçalho
            await this.adicionarCabecalho();

            // Adicionar dados do cliente
            this.adicionarDadosCliente(dados.cliente);

            // Adicionar comparativo
            this.adicionarComparativo(dados);

            // Adicionar economia
            this.adicionarEconomia(dados);

            // Adicionar rodapé
            this.adicionarRodape();

            // Gerar nome do arquivo
            const nomeArquivo = `simulacao_${dados.cliente.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

            // Salvar PDF
            this.doc.save(nomeArquivo);

            return true;
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF. Verifique se todas as bibliotecas estão carregadas.');
            return false;
        }
    }

    async adicionarCabecalho() {
        // Logo (se disponível)
        try {
            const logoImg = await this.carregarImagem('images/logo.png');
            this.doc.addImage(logoImg, 'PNG', this.margin, this.currentY, 60, 20);
        } catch (error) {
            console.log('Logo não carregada, continuando sem logo');
        }

        // Título
        this.doc.setFontSize(20);
        this.doc.setTextColor(4, 105, 134); // Azul escuro
        this.doc.text('SIMULAÇÃO FINANCEIRA', this.pageWidth - this.margin, this.currentY + 15, { align: 'right' });

        this.doc.setFontSize(12);
        this.doc.setTextColor(0, 0, 0);
        this.doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, this.pageWidth - this.margin, this.currentY + 25, { align: 'right' });

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
            this.doc.text(valor, this.margin + 40, this.currentY);
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
        this.doc.setTextColor(26, 93, 173); // Azul médio
        this.doc.text('FINANCIAMENTO BANCÁRIO', this.margin, this.currentY);
        this.currentY += 8;

        this.doc.setFontSize(10);
        this.doc.setTextColor(0, 0, 0);

        const dadosFinanciamento = [
            ['Crédito:', this.formatarMoeda(dados.financiamento.credito)],
            ['Entrada Mínima (30%):', this.formatarMoeda(dados.financiamento.credito * 0.3)],
            ['Valor Financiado:', this.formatarMoeda(dados.financiamento.credito - (dados.financiamento.credito * 0.3))],
            ['Taxa de Juros:', `${dados.financiamento.taxaAnual.toFixed(2)}% a.a.`],
            ['Prazo:', `${dados.financiamento.parcelas} meses`],
            ['Parcela Mensal:', this.formatarMoeda(dados.financiamento.valorParcela)],
            ['Total a Pagar:', this.formatarMoeda(dados.financiamento.total)]
        ];

        dadosFinanciamento.forEach(([label, valor]) => {
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(label, this.margin + 5, this.currentY);
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(valor, this.margin + 60, this.currentY);
            this.currentY += 6;
        });

        this.currentY += 10;

        // Consórcio
        this.doc.setFontSize(14);
        this.doc.setTextColor(246, 139, 31); // Laranja
        this.doc.text('CONSÓRCIO IMOBILIÁRIO', this.margin, this.currentY);
        this.currentY += 8;

        this.doc.setFontSize(10);
        this.doc.setTextColor(0, 0, 0);

        const dadosConsorcio = [
            ['Crédito:', this.formatarMoeda(dados.consorcio.credito)],
            ['Lance Subsidiado (25%):', this.formatarMoeda(dados.consorcio.credito * 0.25)],
            ['Taxa Administrativa:', `${dados.consorcio.taxaAdm.toFixed(2)}%`],
            ['Prazo:', `${dados.consorcio.parcelas} meses`],
            ['Parcela Mensal:', this.formatarMoeda(dados.consorcio.valorParcela)],
            ['Parcela Reduzida (50%):', this.formatarMoeda(dados.consorcio.valorParcela * 0.5)],
            ['Total a Pagar:', this.formatarMoeda(dados.consorcio.total)]
        ];

        dadosConsorcio.forEach(([label, valor]) => {
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(label, this.margin + 5, this.currentY);
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(valor, this.margin + 60, this.currentY);
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
        this.doc.setFillColor(246, 139, 31); // Laranja
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
        // Posicionar no final da página
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

    async carregarImagem(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = src;
        });
    }

    formatarMoeda(valor) {
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

// Instância global
window.pdfGenerator = new PDFGenerator();