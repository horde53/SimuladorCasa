// Database usando IndexedDB para armazenamento local
// Enhanced with Supabase integration
class LocalDatabase {
    constructor() {
        this.dbName = 'CasaProgramadaDB';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Erro ao abrir banco de dados:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Banco de dados aberto com sucesso');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Criar tabela de simulações
                if (!db.objectStoreNames.contains('simulacoes')) {
                    const simulacoesStore = db.createObjectStore('simulacoes', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    // Índices para busca
                    simulacoesStore.createIndex('email', 'cliente.email', { unique: false });
                    simulacoesStore.createIndex('cpf', 'cliente.cpf', { unique: false });
                    simulacoesStore.createIndex('data', 'dataSimulacao', { unique: false });
                    simulacoesStore.createIndex('nome', 'cliente.nome', { unique: false });
                }

                // Criar tabela de leads
                if (!db.objectStoreNames.contains('leads')) {
                    const leadsStore = db.createObjectStore('leads', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    leadsStore.createIndex('email', 'email', { unique: false });
                    leadsStore.createIndex('whatsapp', 'whatsapp', { unique: false });
                    leadsStore.createIndex('data', 'dataContato', { unique: false });
                }

                console.log('Estrutura do banco criada');
            };
        });
    }

    async salvarSimulacao(dados) {
        try {
            // Try to save to Supabase first
            if (window.isSupabaseAvailable && window.isSupabaseAvailable()) {
                console.log('Saving to Supabase...');
                const supabaseResult = await window.supabaseClient.salvarSimulacao(dados);
                
                if (supabaseResult.success) {
                    console.log('✅ Saved to Supabase successfully');
                    // Also save to local storage as backup
                    await this.salvarLocal(dados);
                    return supabaseResult.data.id;
                } else {
                    console.warn('⚠️ Supabase save failed, using local storage:', supabaseResult.error);
                }
            }
            
            // Fallback to local storage
            return await this.salvarLocal(dados);
            
        } catch (error) {
            console.error('Error in salvarSimulacao:', error);
            // Fallback to local storage
            return await this.salvarLocal(dados);
        }
    }

    async salvarLocal(dados) {
        try {
            if (!this.db) {
                await this.init();
            }

            const simulacao = {
                ...dados,
                dataSimulacao: new Date().toISOString(),
                ip: await this.obterIP(),
                userAgent: navigator.userAgent
            };

            const transaction = this.db.transaction(['simulacoes'], 'readwrite');
            const store = transaction.objectStore('simulacoes');
            
            return new Promise((resolve, reject) => {
                const request = store.add(simulacao);
                
                request.onsuccess = () => {
                    console.log('Simulação salva com ID:', request.result);
                    resolve(request.result);
                };
                
                request.onerror = () => {
                    console.error('Erro ao salvar simulação:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Erro ao salvar simulação:', error);
            throw error;
        }
    }

    async buscarSimulacoes(filtros = {}) {
        try {
            // Try Supabase first
            if (window.isSupabaseAvailable && window.isSupabaseAvailable()) {
                console.log('Fetching from Supabase...');
                const supabaseResult = await window.supabaseClient.buscarSimulacoes(filtros);
                
                if (supabaseResult.success) {
                    console.log('✅ Fetched from Supabase successfully');
                    return this.formatSupabaseData(supabaseResult.data);
                } else {
                    console.warn('⚠️ Supabase fetch failed, using local storage:', supabaseResult.error);
                }
            }
            
            // Fallback to local storage
            return await this.buscarLocal(filtros);
            
        } catch (error) {
            console.error('Error in buscarSimulacoes:', error);
            return await this.buscarLocal(filtros);
        }
    }

    async buscarLocal(filtros = {}) {
        try {
            if (!this.db) {
                await this.init();
            }

            const transaction = this.db.transaction(['simulacoes'], 'readonly');
            const store = transaction.objectStore('simulacoes');

            return new Promise((resolve, reject) => {
                const request = store.getAll();
                
                request.onsuccess = () => {
                    let resultados = request.result;
                    
                    // Aplicar filtros
                    if (filtros.email) {
                        resultados = resultados.filter(sim => 
                            sim.cliente.email.toLowerCase().includes(filtros.email.toLowerCase())
                        );
                    }
                    
                    if (filtros.nome) {
                        resultados = resultados.filter(sim => 
                            sim.cliente.nome.toLowerCase().includes(filtros.nome.toLowerCase())
                        );
                    }
                    
                    if (filtros.dataInicio) {
                        resultados = resultados.filter(sim => 
                            new Date(sim.dataSimulacao) >= new Date(filtros.dataInicio)
                        );
                    }
                    
                    if (filtros.dataFim) {
                        resultados = resultados.filter(sim => 
                            new Date(sim.dataSimulacao) <= new Date(filtros.dataFim)
                        );
                    }

                    // Ordenar por data (mais recente primeiro)
                    resultados.sort((a, b) => new Date(b.dataSimulacao) - new Date(a.dataSimulacao));
                    
                    resolve(resultados);
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Erro ao buscar simulações:', error);
            throw error;
        }
    }

    async salvarLead(dadosLead) {
        try {
            if (!this.db) {
                await this.init();
            }

            const lead = {
                ...dadosLead,
                dataContato: new Date().toISOString(),
                ip: await this.obterIP(),
                userAgent: navigator.userAgent
            };

            const transaction = this.db.transaction(['leads'], 'readwrite');
            const store = transaction.objectStore('leads');
            
            return new Promise((resolve, reject) => {
                const request = store.add(lead);
                
                request.onsuccess = () => {
                    console.log('Lead salvo com ID:', request.result);
                    resolve(request.result);
                };
                
                request.onerror = () => {
                    console.error('Erro ao salvar lead:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Erro ao salvar lead:', error);
            throw error;
        }
    }

    async exportarDados() {
        try {
            // Try Supabase first
            if (window.isSupabaseAvailable && window.isSupabaseAvailable()) {
                console.log('Exporting from Supabase...');
                const supabaseResult = await window.supabaseClient.exportarDados();
                
                if (supabaseResult.success) {
                    console.log('✅ Exported from Supabase successfully');
                    return supabaseResult.data;
                } else {
                    console.warn('⚠️ Supabase export failed, using local storage:', supabaseResult.error);
                }
            }
            
            // Fallback to local storage
            const simulacoes = await this.buscarSimulacoes();
            const leads = await this.buscarLeads();
            
            const dados = {
                simulacoes,
                leads,
                exportadoEm: new Date().toISOString(),
                versao: '1.0'
            };

            const blob = new Blob([JSON.stringify(dados, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `casa_programada_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return dados;
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            throw error;
        }
    }

    async buscarLeads(filtros = {}) {
        try {
            if (!this.db) {
                await this.init();
            }

            const transaction = this.db.transaction(['leads'], 'readonly');
            const store = transaction.objectStore('leads');

            return new Promise((resolve, reject) => {
                const request = store.getAll();
                
                request.onsuccess = () => {
                    let resultados = request.result;
                    
                    // Aplicar filtros
                    if (filtros.email) {
                        resultados = resultados.filter(lead => 
                            lead.email.toLowerCase().includes(filtros.email.toLowerCase())
                        );
                    }
                    
                    // Ordenar por data (mais recente primeiro)
                    resultados.sort((a, b) => new Date(b.dataContato) - new Date(a.dataContato));
                    
                    resolve(resultados);
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Erro ao buscar leads:', error);
            throw error;
        }
    }

    async obterEstatisticas() {
        try {
            // Try Supabase first
            if (window.isSupabaseAvailable && window.isSupabaseAvailable()) {
                console.log('Getting statistics from Supabase...');
                const supabaseResult = await window.supabaseClient.obterEstatisticas();
                
                if (supabaseResult.success) {
                    console.log('✅ Statistics from Supabase successfully');
                    return supabaseResult.data;
                } else {
                    console.warn('⚠️ Supabase statistics failed, using local storage:', supabaseResult.error);
                }
            }
            
            // Fallback to local storage
            return await this.obterEstatisticasLocal();
            
        } catch (error) {
            console.error('Error in obterEstatisticas:', error);
            return await this.obterEstatisticasLocal();
        }
    }

    async obterEstatisticasLocal() {
        try {
            const simulacoes = await this.buscarSimulacoes();
            const leads = await this.buscarLeads();
            
            const hoje = new Date();
            const umMesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate());
            
            const simulacoesUltimoMes = simulacoes.filter(sim => 
                new Date(sim.dataSimulacao) >= umMesAtras
            );
            
            const leadsUltimoMes = leads.filter(lead => 
                new Date(lead.dataContato) >= umMesAtras
            );

            // Calcular valor médio dos imóveis
            const valoresMedios = simulacoes.map(sim => sim.cliente.valorImovel);
            const valorMedio = valoresMedios.length > 0 ? 
                valoresMedios.reduce((a, b) => a + b, 0) / valoresMedios.length : 0;

            return {
                totalSimulacoes: simulacoes.length,
                totalLeads: leads.length,
                simulacoesUltimoMes: simulacoesUltimoMes.length,
                leadsUltimoMes: leadsUltimoMes.length,
                valorMedioImoveis: valorMedio,
                tiposImoveisPopulares: this.calcularTiposPopulares(simulacoes),
                conversaoLeads: leads.length > 0 ? (simulacoes.length / leads.length * 100).toFixed(2) : 0
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            throw error;
        }
    }

    calcularTiposPopulares(simulacoes) {
        const tipos = {};
        simulacoes.forEach(sim => {
            const tipo = sim.cliente.tipoImovel;
            tipos[tipo] = (tipos[tipo] || 0) + 1;
        });
        
        return Object.entries(tipos)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([tipo, count]) => ({ tipo, quantidade: count }));
    }

    async obterIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.log('Não foi possível obter IP:', error);
            return 'N/A';
        }
    }

    async limparDados() {
        try {
            // Clear from Supabase if available
            if (window.isSupabaseAvailable && window.isSupabaseAvailable()) {
                console.log('Clearing Supabase data...');
                const supabaseResult = await window.supabaseClient.limparDados();
                
                if (supabaseResult.success) {
                    console.log('✅ Supabase data cleared successfully');
                } else {
                    console.warn('⚠️ Supabase clear failed:', supabaseResult.error);
                }
            }
            
            // Also clear local storage
            if (!this.db) {
                await this.init();
            }

            const transaction = this.db.transaction(['simulacoes', 'leads'], 'readwrite');
            
            await Promise.all([
                new Promise((resolve, reject) => {
                    const request = transaction.objectStore('simulacoes').clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                }),
                new Promise((resolve, reject) => {
                    const request = transaction.objectStore('leads').clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                })
            ]);

            console.log('Dados limpos com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao limpar dados:', error);
            throw error;
        }
    }

    // Format Supabase data to match local format
    formatSupabaseData(supabaseData) {
        return supabaseData.map(item => ({
            id: item.id,
            dataSimulacao: item.data_simulacao,
            ip: item.ip_address,
            userAgent: item.user_agent,
            cliente: {
                nome: item.cliente_nome,
                email: item.cliente_email,
                whatsapp: item.cliente_whatsapp,
                profissao: item.cliente_profissao,
                cpf: item.cliente_cpf,
                endereco: item.cliente_endereco,
                numero: item.cliente_numero,
                cep: item.cliente_cep,
                tipoImovel: item.tipo_imovel,
                valorImovel: item.valor_imovel,
                entrada: item.entrada,
                fgts: item.fgts,
                rendaFamiliar: item.renda_familiar,
                aluguelAtual: item.aluguel_atual
            },
            financiamento: {
                credito: item.fin_credito,
                parcelas: item.fin_parcelas,
                valorParcela: item.fin_valor_parcela,
                total: item.fin_total,
                taxaAnual: item.fin_taxa_anual
            },
            consorcio: {
                credito: item.cons_credito,
                parcelas: item.cons_parcelas,
                valorParcela: item.cons_valor_parcela,
                total: item.cons_total,
                taxaAdm: item.cons_taxa_adm
            }
        }));
    }
}

// Instância global
window.localDB = new LocalDatabase();

// Inicializar automaticamente
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.localDB.init();
        console.log('Database inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar database:', error);
    }
});