// Supabase Client for Static Pages
class SupabaseClient {
    constructor() {
        this.supabaseUrl = null;
        this.supabaseKey = null;
        this.supabase = null;
        this.initialized = false;
    }

    // Initialize Supabase with credentials
    async init(url, key) {
        try {
            if (!url || !key) {
                console.error('Supabase URL and Key are required');
                return false;
            }

            this.supabaseUrl = url;
            this.supabaseKey = key;

            // Load Supabase library if not loaded
            if (typeof window.supabase === 'undefined') {
                await this.loadSupabaseLibrary();
            }

            // Create Supabase client
            this.supabase = window.supabase.createClient(url, key);
            this.initialized = true;

            console.log('Supabase initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing Supabase:', error);
            return false;
        }
    }

    async loadSupabaseLibrary() {
        return new Promise((resolve, reject) => {
            if (typeof window.supabase !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/dist/umd/supabase.min.js';
            script.onload = () => {
                console.log('Supabase library loaded');
                resolve();
            };
            script.onerror = () => {
                console.error('Failed to load Supabase library');
                reject(new Error('Failed to load Supabase library'));
            };
            document.head.appendChild(script);
        });
    }

    // Check if Supabase is initialized
    isInitialized() {
        return this.initialized && this.supabase;
    }

    // Save simulation to Supabase
    async salvarSimulacao(dadosSimulacao) {
        try {
            if (!this.isInitialized()) {
                console.warn('Supabase not initialized, using local storage only');
                return { success: false, error: 'Supabase not initialized' };
            }

            // Prepare data for Supabase
            const simulacaoData = {
                cliente_nome: dadosSimulacao.cliente.nome,
                cliente_email: dadosSimulacao.cliente.email,
                cliente_whatsapp: dadosSimulacao.cliente.whatsapp,
                cliente_profissao: dadosSimulacao.cliente.profissao,
                cliente_cpf: dadosSimulacao.cliente.cpf,
                cliente_endereco: dadosSimulacao.cliente.endereco,
                cliente_numero: dadosSimulacao.cliente.numero,
                cliente_cep: dadosSimulacao.cliente.cep,
                tipo_imovel: dadosSimulacao.cliente.tipoImovel,
                valor_imovel: dadosSimulacao.cliente.valorImovel,
                entrada: dadosSimulacao.cliente.entrada,
                fgts: dadosSimulacao.cliente.fgts,
                renda_familiar: dadosSimulacao.cliente.rendaFamiliar,
                aluguel_atual: dadosSimulacao.cliente.aluguelAtual,
                
                // Financiamento data
                fin_credito: dadosSimulacao.financiamento.credito,
                fin_parcelas: dadosSimulacao.financiamento.parcelas,
                fin_valor_parcela: dadosSimulacao.financiamento.valorParcela,
                fin_total: dadosSimulacao.financiamento.total,
                fin_taxa_anual: dadosSimulacao.financiamento.taxaAnual,
                
                // Consórcio data
                cons_credito: dadosSimulacao.consorcio.credito,
                cons_parcelas: dadosSimulacao.consorcio.parcelas,
                cons_valor_parcela: dadosSimulacao.consorcio.valorParcela,
                cons_total: dadosSimulacao.consorcio.total,
                cons_taxa_adm: dadosSimulacao.consorcio.taxaAdm,
                
                // Metadata
                data_simulacao: new Date().toISOString(),
                ip_address: await this.obterIP(),
                user_agent: navigator.userAgent
            };

            const { data, error } = await this.supabase
                .from('simulacoes')
                .insert([simulacaoData])
                .select();

            if (error) {
                console.error('Error saving to Supabase:', error);
                return { success: false, error: error.message };
            }

            console.log('Simulation saved to Supabase:', data);
            return { success: true, data: data[0] };

        } catch (error) {
            console.error('Error in salvarSimulacao:', error);
            return { success: false, error: error.message };
        }
    }

    // Get all simulations
    async buscarSimulacoes(filtros = {}) {
        try {
            if (!this.isInitialized()) {
                return { success: false, error: 'Supabase not initialized' };
            }

            let query = this.supabase
                .from('simulacoes')
                .select('*')
                .order('data_simulacao', { ascending: false });

            // Apply filters
            if (filtros.nome) {
                query = query.ilike('cliente_nome', `%${filtros.nome}%`);
            }
            if (filtros.email) {
                query = query.ilike('cliente_email', `%${filtros.email}%`);
            }
            if (filtros.dataInicio) {
                query = query.gte('data_simulacao', filtros.dataInicio);
            }
            if (filtros.dataFim) {
                query = query.lte('data_simulacao', filtros.dataFim);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching simulations:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data };

        } catch (error) {
            console.error('Error in buscarSimulacoes:', error);
            return { success: false, error: error.message };
        }
    }

    // Get statistics
    async obterEstatisticas() {
        try {
            if (!this.isInitialized()) {
                return { success: false, error: 'Supabase not initialized' };
            }

            // Get total count
            const { count: totalSimulacoes } = await this.supabase
                .from('simulacoes')
                .select('*', { count: 'exact', head: true });

            // Get last 30 days count
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { count: simulacoesUltimoMes } = await this.supabase
                .from('simulacoes')
                .select('*', { count: 'exact', head: true })
                .gte('data_simulacao', thirtyDaysAgo.toISOString());

            // Get average property value
            const { data: avgData } = await this.supabase
                .from('simulacoes')
                .select('valor_imovel');

            let valorMedio = 0;
            if (avgData && avgData.length > 0) {
                const total = avgData.reduce((sum, item) => sum + (item.valor_imovel || 0), 0);
                valorMedio = total / avgData.length;
            }

            // Get popular property types
            const { data: tiposData } = await this.supabase
                .from('simulacoes')
                .select('tipo_imovel')
                .not('tipo_imovel', 'is', null);

            const tiposCount = {};
            tiposData?.forEach(item => {
                tiposCount[item.tipo_imovel] = (tiposCount[item.tipo_imovel] || 0) + 1;
            });

            const tiposImoveisPopulares = Object.entries(tiposCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([tipo, quantidade]) => ({ tipo, quantidade }));

            return {
                success: true,
                data: {
                    totalSimulacoes: totalSimulacoes || 0,
                    simulacoesUltimoMes: simulacoesUltimoMes || 0,
                    valorMedioImoveis: valorMedio,
                    tiposImoveisPopulares
                }
            };

        } catch (error) {
            console.error('Error getting statistics:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete all data (for admin)
    async limparDados() {
        try {
            if (!this.isInitialized()) {
                return { success: false, error: 'Supabase not initialized' };
            }

            const { error } = await this.supabase
                .from('simulacoes')
                .delete()
                .neq('id', 0); // Delete all records

            if (error) {
                console.error('Error clearing data:', error);
                return { success: false, error: error.message };
            }

            return { success: true };

        } catch (error) {
            console.error('Error in limparDados:', error);
            return { success: false, error: error.message };
        }
    }

    // Export data
    async exportarDados() {
        try {
            const result = await this.buscarSimulacoes();
            
            if (!result.success) {
                throw new Error(result.error);
            }

            const dados = {
                simulacoes: result.data,
                exportadoEm: new Date().toISOString(),
                versao: '2.0-supabase'
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

            return { success: true, data: dados };

        } catch (error) {
            console.error('Error exporting data:', error);
            return { success: false, error: error.message };
        }
    }

    async obterIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.log('Could not get IP:', error);
            return 'N/A';
        }
    }
}

// Global instance
window.supabaseClient = new SupabaseClient();