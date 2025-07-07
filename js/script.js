document.addEventListener('DOMContentLoaded', function() {
    console.log("Script.js carregado - versão estática");
    
    const form = document.getElementById('simulador-form');
    
    // Aplicar máscaras nos campos monetários
    const camposMoeda = ['input[name="currentRent"]', 'input[name="familyIncome"]', 'input[name="propertyValue"]', 'input[name="downPayment"]', 'input[name="fgts"]'];
    
    function formatarValorMonetario(valor) {
        // Remove tudo que não for dígito
        valor = valor.replace(/\D/g, '');
        
        // Remove zeros à esquerda
        valor = valor.replace(/^0+/, '');
        
        // Se ficou vazio, retorna zero formatado
        if (valor === '') return 'R$ 0,00';
        
        // Adiciona zeros à esquerda se necessário para ter no mínimo 3 dígitos (1 real = 100 centavos)
        valor = valor.padStart(3, '0');
        
        // Separa reais e centavos
        const reais = valor.slice(0, -2).replace(/^0+/, '') || '0';
        const centavos = valor.slice(-2);
        
        // Adiciona pontos para milhar
        const reaisFormatado = reais.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
        
        return `R$ ${reaisFormatado},${centavos}`;
    }
    
    // Aplica a máscara em todos os campos monetários
    camposMoeda.forEach(campo => {
        $(campo).on('input', function(e) {
            const valor = $(this).val();
            $(this).val(formatarValorMonetario(valor));
        });
        
        // Formata o valor inicial se houver
        if ($(campo).val()) {
            $(campo).val(formatarValorMonetario($(campo).val()));
        }
    });
    
    // Máscara para o WhatsApp
    $('input[name="whatsapp"]').on('input', function() {
        let valor = $(this).val().replace(/\D/g, '');
        if (valor.length > 11) valor = valor.substring(0, 11);
        
        if (valor.length > 2) {
            valor = `(${valor.substring(0, 2)}) ${valor.substring(2)}`;
        }
        if (valor.length > 10) {
            valor = `${valor.substring(0, 10)}-${valor.substring(10)}`;
        }
        
        $(this).val(valor);
    });
    
    // Máscara para o CPF
    $('input[name="cpf"]').on('input', function() {
        let cpf = $(this).val().replace(/\D/g, '');
        if (cpf.length > 11) cpf = cpf.substring(0, 11);
        
        if (cpf.length > 3) {
            cpf = cpf.substring(0, 3) + '.' + cpf.substring(3);
        }
        if (cpf.length > 7) {
            cpf = cpf.substring(0, 7) + '.' + cpf.substring(7);
        }
        if (cpf.length > 11) {
            cpf = cpf.substring(0, 11) + '-' + cpf.substring(11);
        }
        
        $(this).val(cpf);
    });
    
    // Máscara para o CEP
    $('#cep').on('input', function() {
        let cep = $(this).val().replace(/\D/g, '');
        if (cep.length > 8) cep = cep.substring(0, 8);
        if (cep.length > 5) {
            cep = cep.substring(0, 5) + '-' + cep.substring(5);
        }
        $(this).val(cep);
    });
    
    // Validação e preenchimento automático do CEP
    $('#cep').on('blur', function() {
        const cep = $(this).val().replace(/\D/g, '');
        if (cep.length === 8) {
            fetch(`https://viacep.com.br/ws/${cep}/json/`)
                .then(response => response.json())
                .then(data => {
                    if (!data.erro) {
                        $('input[name="address"]').val(`${data.logradouro ? data.logradouro + ', ' : ''}${data.bairro ? data.bairro + ', ' : ''}${data.localidade ? data.localidade + ' - ' : ''}${data.uf ? data.uf : ''}`);
                        $(this).removeClass('erro');
                    } else {
                        $(this).addClass('erro');
                        alert('CEP não encontrado.');
                    }
                })
                .catch(error => {
                    console.error('Erro ao buscar CEP:', error);
                    $(this).addClass('erro');
                    alert('Erro ao buscar CEP. Verifique sua conexão.');
                });
        } else if (cep.length > 0) {
            $(this).addClass('erro');
            alert('CEP inválido.');
        }
    });
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Verificar se o formulário é válido
        if (!validarFormulario()) {
            return;
        }
        
        // Mostrar loader
        mostrarLoader('Calculando sua simulação...');
        
        // Coletar dados do formulário
        const formData = new FormData(form);
        const dados = {};
        
        formData.forEach((value, key) => {
            // Converter valores monetários para números
            if (['currentRent', 'familyIncome', 'propertyValue', 'downPayment', 'fgts'].includes(key)) {
                dados[key] = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
            } else {
                dados[key] = value;
            }
        });
        
        // Calcular resultados localmente
        const resultado = calcularSimulacao(dados);
        
        // Preparar dados para armazenar
        const dadosSimulacao = {
            cliente: {
                nome: dados.name,
                email: dados.email,
                whatsapp: dados.whatsapp,
                profissao: dados.profession,
                tipoImovel: dados.propertyType,
                aluguelAtual: dados.currentRent,
                rendaFamiliar: dados.familyIncome,
                valorImovel: dados.propertyValue,
                entrada: dados.downPayment,
                fgts: dados.fgts
            },
            financiamento: resultado.financiamento,
            consorcio: resultado.consorcio
        };
        
        // Esconder loader
        esconderLoader();
        
        // Armazenar dados
        localStorage.setItem('simulacaoResultado', JSON.stringify(dadosSimulacao));
        
        // Redirecionar para a página de resultados
        window.location.href = 'resultado.html';
    });
    
    function validarFormulario() {
        let valido = true;
        const camposObrigatorios = [
            'name',
            'email',
            'whatsapp',
            'profession',
            'propertyType',
            'familyIncome',
            'propertyValue',
            'cpf'
        ];
        
        // Remover mensagens de erro anteriores
        document.querySelectorAll('.erro-mensagem').forEach(el => el.remove());
        
        camposObrigatorios.forEach(campo => {
            const elemento = document.querySelector(`[name="${campo}"]`);
            const valor = elemento.value.trim();
            
            if (!valor) {
                elemento.classList.add('erro');
                const mensagemErro = document.createElement('div');
                mensagemErro.className = 'erro-mensagem';
                mensagemErro.style.color = '#ff3b30';
                mensagemErro.style.fontSize = '0.8rem';
                mensagemErro.style.marginTop = '4px';
                mensagemErro.textContent = 'Este campo é obrigatório';
                elemento.parentNode.appendChild(mensagemErro);
                valido = false;
            } else {
                elemento.classList.remove('erro');
                // Validações específicas
                if (campo === 'email' && !validarEmail(valor)) {
                    elemento.classList.add('erro');
                    const mensagemErro = document.createElement('div');
                    mensagemErro.className = 'erro-mensagem';
                    mensagemErro.style.color = '#ff3b30';
                    mensagemErro.style.fontSize = '0.8rem';
                    mensagemErro.style.marginTop = '4px';
                    mensagemErro.textContent = 'Email inválido';
                    elemento.parentNode.appendChild(mensagemErro);
                    valido = false;
                }
                if (campo === 'whatsapp' && !validarWhatsapp(valor)) {
                    elemento.classList.add('erro');
                    const mensagemErro = document.createElement('div');
                    mensagemErro.className = 'erro-mensagem';
                    mensagemErro.style.color = '#ff3b30';
                    mensagemErro.style.fontSize = '0.8rem';
                    mensagemErro.style.marginTop = '4px';
                    mensagemErro.textContent = 'WhatsApp inválido';
                    elemento.parentNode.appendChild(mensagemErro);
                    valido = false;
                }
                if (campo === 'cpf' && !validarCPF(valor)) {
                    elemento.classList.add('erro');
                    const mensagemErro = document.createElement('div');
                    mensagemErro.className = 'erro-mensagem';
                    mensagemErro.style.color = '#ff3b30';
                    mensagemErro.style.fontSize = '0.8rem';
                    mensagemErro.style.marginTop = '4px';
                    mensagemErro.textContent = 'CPF inválido';
                    elemento.parentNode.appendChild(mensagemErro);
                    valido = false;
                }
                // Validar valores monetários
                if (['familyIncome', 'propertyValue'].includes(campo)) {
                    const valorNumerico = extrairValorMonetario(valor);
                    if (valorNumerico <= 0) {
                        elemento.classList.add('erro');
                        const mensagemErro = document.createElement('div');
                        mensagemErro.className = 'erro-mensagem';
                        mensagemErro.style.color = '#ff3b30';
                        mensagemErro.style.fontSize = '0.8rem';
                        mensagemErro.style.marginTop = '4px';
                        mensagemErro.textContent = 'Valor inválido';
                        elemento.parentNode.appendChild(mensagemErro);
                        valido = false;
                    }
                }
            }
        });
        
        if (!valido) {
            const primeiroErro = document.querySelector('.erro');
            if (primeiroErro) {
                primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            alert('Por favor, preencha todos os campos corretamente.');
        }
        
        return valido;
    }
    
    function validarEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function validarWhatsapp(whatsapp) {
        const numero = whatsapp.replace(/\D/g, '');
        return numero.length >= 10 && numero.length <= 11;
    }
    
    function validarCPF(cpf) {
        cpf = cpf.replace(/[^\d]/g, '');
        
        if (cpf.length !== 11) return false;
        
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        
        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let resto = 11 - (soma % 11);
        let digitoVerificador1 = resto > 9 ? 0 : resto;
        if (digitoVerificador1 !== parseInt(cpf.charAt(9))) return false;
        
        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(cpf.charAt(i)) * (11 - i);
        }
        resto = 11 - (soma % 11);
        let digitoVerificador2 = resto > 9 ? 0 : resto;
        if (digitoVerificador2 !== parseInt(cpf.charAt(10))) return false;
        
        return true;
    }
    
    function calcularSimulacao(dados) {
        const valorImovel = dados.propertyValue;
        const valorEntrada = dados.downPayment + dados.fgts;
        
        // FINANCIAMENTO - Usar configurações globais
        const taxaJurosAnual = CONFIG_FINANCIAMENTO.TAXA_JUROS_ANUAL;
        const parcelasFinanciamento = CONFIG_FINANCIAMENTO.PRAZO_MESES;
        
        // Cálculo do financiamento usando taxa de juros
        const taxaMensal = Math.pow(1 + taxaJurosAnual, 1/12) - 1;
        const valorParcelaFinanciamento = (valorImovel - valorEntrada) * (taxaMensal * Math.pow(1 + taxaMensal, parcelasFinanciamento)) / (Math.pow(1 + taxaMensal, parcelasFinanciamento) - 1);
        const totalFinanciamento = valorParcelaFinanciamento * parcelasFinanciamento;
        
        // CONSÓRCIO - Usar configurações globais
        const taxaAdministrativa = CONFIG_CONSORCIO.TAXA_ADMIN;
        const parcelasConsorcio = CONFIG_CONSORCIO.PRAZO_MESES;
        
        // Calcular parcela e total do consórcio
        const valorParcelaConsorcio = (valorImovel * (1 + taxaAdministrativa)) / parcelasConsorcio;
        const totalConsorcio = valorParcelaConsorcio * parcelasConsorcio;
        
        return {
            financiamento: {
                credito: valorImovel,
                entrada: valorEntrada,
                parcelas: parcelasFinanciamento,
                valorParcela: valorParcelaFinanciamento,
                total: totalFinanciamento,
                taxaAnual: taxaJurosAnual * 100,
                prazoAnos: parcelasFinanciamento / 12
            },
            consorcio: {
                credito: valorImovel,
                entrada: 0,
                parcelas: parcelasConsorcio,
                valorParcela: valorParcelaConsorcio,
                total: totalConsorcio,
                taxaAdm: taxaAdministrativa * 100,
                prazoAnos: parcelasConsorcio / 12
            }
        };
    }
    
    function extrairValorMonetario(str) {
        if (!str) return 0;
        return parseFloat(str.replace(/[^\d,\.]/g, '').replace(',', '.')) || 0;
    }
});

// Adicionar estilos para inputs com erro
document.head.insertAdjacentHTML('beforeend', `
    <style>
        input.erro, select.erro {
            border-color: #ff3b30 !important;
            box-shadow: 0 0 0 2px rgba(255, 59, 48, 0.2) !important;
        }
    </style>
`);

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