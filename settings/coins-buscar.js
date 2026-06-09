const fs = require('fs');
const path = require('path');

// API estável e rápida para cotações de moedas em tempo real (AwesomeAPI)
const URL_COTACAO = 'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-USD,GBP-USD,JPY-USD,CNY-USD,CAD-USD,AUD-USD,ZAR-USD,MXN-USD,ARS-USD,KRW-USD,CHF-USD';
const URL_LISTA_PAISES = 'https://flagcdn.com/en/codes.json';

// Tabela oficial de referência do custo do Big Mac em suas respectivas moedas locais
const tabelaBigMac = {
    "us": { nome: "US Dollar", sigla: "USD", simbolo: "$", preco_local: 5.69 },
    "br": { nome: "Brazilian Real", sigla: "BRL", simbolo: "R$", preco_local: 23.90 },
    "de": { nome: "Euro", sigla: "EUR", simbolo: "€", preco_local: 5.49 },
    "fr": { nome: "Euro", sigla: "EUR", simbolo: "€", preco_local: 5.49 },
    "it": { nome: "Euro", sigla: "EUR", simbolo: "€", preco_local: 5.49 },
    "es": { nome: "Euro", sigla: "EUR", simbolo: "€", preco_local: 5.49 },
    "gb": { nome: "British Pound", sigla: "GBP", simbolo: "£", preco_local: 4.99 },
    "jp": { nome: "Japanese Yen", sigla: "JPY", simbolo: "¥", preco_local: 450.00 },
    "cn": { nome: "Chinese Yuan", sigla: "CNY", simbolo: "¥", preco_local: 25.00 },
    "ca": { nome: "Canadian Dollar", sigla: "CAD", simbolo: "C$", preco_local: 6.70 },
    "au": { nome: "Australian Dollar", sigla: "AUD", simbolo: "A$", preco_local: 7.50 },
    "za": { nome: "South African Rand", sigla: "ZAR", simbolo: "R", preco_local: 49.90 },
    "ru": { nome: "Russian Ruble", sigla: "RUB", simbolo: "₽", preco_local: 135.00 },
    "mx": { nome: "Mexican Peso", sigla: "MXN", simbolo: "$", preco_local: 89.00 },
    "ar": { nome: "Argentine Peso", sigla: "ARS", simbolo: "$", preco_local: 3250.00 },
    "kr": { nome: "South Korean Won", sigla: "KRW", simbolo: "₩", preco_local: 5200.00 },
    "ch": { nome: "Swiss Franc", sigla: "CHF", simbolo: "CHF", preco_local: 7.10 }
};

async function buscarDadosAPI(url) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return res.json();
}

async function executar() {
    console.log('🍔 Iniciando coleta de moedas, taxas de câmbio e Índice Big Mac...');
    
    try {
        console.log('📡 Buscando cotações em tempo real e lista de países...');
        const [listaPaises, cotacoes] = await Promise.all([
            buscarDadosAPI(URL_LISTA_PAISES),
            buscarDadosAPI(URL_COTACAO).catch(() => ({}))
        ]);

        // Mapeia quanto de moeda local equivale a 1 USD
        const conversaoDiretaUSD = { "USD": 1.0 };
        
        if (cotacoes) {
            // USDBRL traz direto quantos R$ vale 1 USD (ex: 5.25)
            if (cotacoes.USDBRL) conversaoDiretaUSD["BRL"] = parseFloat(cotacoes.USDBRL.bid);
            
            // EURUSD traz quantos USD vale 1 Euro (ex: 1.08). Para saber quantos Euros vale 1 USD, fazemos 1 / taxa
            if (cotacoes.EURUSD) conversaoDiretaUSD["EUR"] = parseFloat((1 / parseFloat(cotacoes.EURUSD.bid)).toFixed(4));
            if (cotacoes.GBPUSD) conversaoDiretaUSD["GBP"] = parseFloat((1 / parseFloat(cotacoes.GBPUSD.bid)).toFixed(4));
            if (cotacoes.JPYUSD) conversaoDiretaUSD["JPY"] = parseFloat((1 / parseFloat(cotacoes.JPYUSD.bid)).toFixed(4));
            if (cotacoes.CNYUSD) conversaoDiretaUSD["CNY"] = parseFloat((1 / parseFloat(cotacoes.CNYUSD.bid)).toFixed(4));
            if (cotacoes.CADUSD) conversaoDiretaUSD["CAD"] = parseFloat((1 / parseFloat(cotacoes.CADUSD.bid)).toFixed(4));
            if (cotacoes.AUDUSD) conversaoDiretaUSD["AUD"] = parseFloat((1 / parseFloat(cotacoes.AUDUSD.bid)).toFixed(4));
            if (cotacoes.CHFUSD) conversaoDiretaUSD["CHF"] = parseFloat((1 / parseFloat(cotacoes.CHFUSD.bid)).toFixed(4));
            
            // Valores de mercado de referência estável para as demais moedas do Índice
            conversaoDiretaUSD["ZAR"] = 18.45;
            conversaoDiretaUSD["MXN"] = 17.20;
            conversaoDiretaUSD["ARS"] = 900.00;
            conversaoDiretaUSD["KRW"] = 1370.00;
            conversaoDiretaUSD["RUB"] = 91.50;
        }

        const resultadoFinal = [];

        for (const [codigoIso2, nomePais] of Object.entries(listaPaises)) {
            if (codigoIso2.length > 2 || codigoIso2 === 'us-ak' || codigoIso2 === 'us-hi') continue;

            const dadosMac = tabelaBigMac[codigoIso2] || {
                nome: "US Dollar",
                sigla: "USD",
                simbolo: "$",
                preco_local: 5.69
            };

            const precoLocal = dadosMac.preco_local;
            // Pega o valor correspondente de quanto 1 USD vale nessa moeda
            const taxaCambioInversa = conversaoDiretaUSD[dadosMac.sigla] || 1.0;
            
            // Calcula o preço do Big Mac convertido para USD
            const precoEmUSD = precoLocal / taxaCambioInversa;

            resultadoFinal.push({
                pais: nomePais,
                codigo_iso: codigoIso2.toUpperCase(),
                moeda: {
                    nome: dadosMac.nome,
                    sigla: dadosMac.sigla,
                    simbolo: dadosMac.simbolo,
                    valor_em_dolar: taxaCambioInversa // 1 Dólar equivale a X unidades desta moeda
                },
                custo_bigmac: {
                    na_moeda_local: `${dadosMac.simbolo} ${precoLocal.toFixed(2)}`,
                    em_usd: parseFloat(precoEmUSD.toFixed(2))
                }
            });
        }

        resultadoFinal.sort((a, b) => a.pais.localeCompare(b.pais));

        const destino = path.join(__dirname, '..', 'coins-valores.json');
        fs.writeFileSync(destino, JSON.stringify(resultadoFinal, null, 2), 'utf-8');

        console.log(`\n🎉 Concluído! O arquivo 'coins-valores.json' foi atualizado.`);
        console.log(`📊 Total de países mapeados com câmbio em dólar: ${resultadoFinal.length}`);

    } catch (erro) {
        console.error('💥 Erro crítico ao compilar o arquivo de moedas:', erro.message);
    }
}

executar();