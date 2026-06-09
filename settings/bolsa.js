const fs = require('fs');
const path = require('path');

// Lista de tickers (símbolos) de ações famosas para monitorar
// Ex: AAPL (Apple), MSFT (Microsoft), PETR4.SA (Petrobras), VALE3.SA (Vale)
const TICKERS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 
    'PETR4.SA', 'VALE3.SA', 'ITUB4.SA', 'BBDC4.SA'
];

async function obterHistoricoAcoes() {
    console.log('📈 Iniciando busca de dados das ações no Yahoo Finance...');
    
    // Define o período dos últimos 12 meses em Unix Timestamp
    const hoje = Math.floor(Date.now() / 1000);
    const umAnoAtras = hoje - (365 * 24 * 60 * 60);

    const resultadoFinal = [];

    for (const ticker of TICKERS) {
        // API pública do Yahoo Finance para dados históricos (Query v8)
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${umAnoAtras}&period2=${hoje}&interval=1mo&events=history`;

        try {
            console.log(`📡 Buscando histórico para: ${ticker}`);
            const response = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });

            if (!response.ok) {
                console.error(`❌ Não foi possível obter dados para ${ticker}. Status: ${response.status}`);
                continue;
            }

            const dados = await response.json();
            const chartData = dados.chart?.result?.[0];

            if (!chartData) {
                console.error(`⚠️ Dados inválidos ou vazios para ${ticker}`);
                continue;
            }

            const timestamps = chartData.timestamp || [];
            const fechamentos = chartData.indicators?.quote?.[0]?.close || [];
            const moeda = chartData.meta?.currency || 'USD';

            // Monta o histórico dos últimos 12 meses filtrando valores nulos
            const historico12Meses = [];
            
            timestamps.forEach((timestamp, index) => {
                const preco = fechamentos[index];
                if (preco !== null && preco !== undefined) {
                    const dataFormatada = new Date(timestamp * 1000).toISOString().substring(0, 7); // Formato YYYY-MM
                    historico12Meses.push({
                        mes: dataFormatada,
                        preco_fechamento: parseFloat(preco.toFixed(2))
                    });
                }
            });

            // Pega o preço atual mais recente
            const precoAtual = historico12Meses.length > 0 ? historico12Meses[historico12Meses.length - 1].preco_fechamento : "N/A";

            resultadoFinal.push({
                ticker: ticker,
                moeda: moeda,
                preco_atual: precoAtual,
                historico_12_meses: historico12Meses
            });

        } catch (erro) {
            console.error(`💥 Erro ao processar o ticker ${ticker}:`, erro.message);
        }
    }

    // Grava o arquivo JSON final
    try {
        const destino = path.join(__dirname, 'acoes-valores.json');
        fs.writeFileSync(destino, JSON.stringify(resultadoFinal, null, 2), 'utf-8');
        console.log(`\n🎉 Sucesso! Arquivo '${path.basename(destino)}' gerado com os dados históricos.`);
    } catch (erroEscrita) {
        console.error('💥 Erro ao salvar o arquivo JSON:', erroEscrita.message);
    }
}

obterHistoricoAcoes();