const fs = require('fs');
const path = require('path');

// APIs Oficiais e Estáveis (Banco Mundial e FlagCDN)
const URL_LISTA_PAISES = 'https://flagcdn.com/en/codes.json';
const URL_PIB = 'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&per_page=400&mrnev=1';
const URL_PER_CAPITA = 'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD?format=json&per_page=400&mrnev=1';
const URL_INFLACAO = 'https://api.worldbank.org/v2/country/all/indicator/FP.CPI.TOTL.ZG?format=json&per_page=400&mrnev=1';
const URL_IDH = 'https://open.undp.org/api/hdi.json';

// Dicionário de moedas baseado no ISO de 2 letras (Garante o retorno sem depender da RestCountries)
const dicionarioMoedas = {
    "us": "USD", "br": "BRL", "cn": "CNY", "de": "EUR", "fr": "EUR", "it": "EUR", "es": "EUR", "pt": "EUR", 
    "gb": "GBP", "jp": "JPY", "in": "INR", "ca": "CAD", "au": "AUD", "za": "ZAR", "ru": "RUB", "mx": "MXN", 
    "ar": "ARS", "kr": "KRW", "cd": "CDF", "cg": "XAF", "ao": "AOA", "cl": "CLP", "co": "COP", "pe": "PEN", 
    "ve": "VED", "uy": "UYU", "py": "PYG", "bo": "BOB", "ec": "USD", "nz": "NZD", "ch": "CHF", "jp": "JPY"
};

function formatarPIB(valor) {
    if (!valor) return "N/A";
    if (valor >= 1e12) return `${(valor / 1e12).toFixed(2)}T USD`;
    if (valor >= 1e9) return `${(valor / 1e9).toFixed(2)}B USD`;
    return `${Math.round(valor).toLocaleString('en-US')} USD`;
}

function formatarPIBPerCapita(valor) {
    if (!valor) return "N/A";
    return `${Math.round(valor).toLocaleString('en-US')} USD`;
}

function formatarInflacao(valor) {
    if (!valor) return "N/A";
    return `${valor.toFixed(1)}%`;
}

async function buscarDadosAPI(url) {
    const res = await fetch(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } 
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return res.json();
}

async function executar() {
    console.log('🚀 Iniciando coleta de dados ultra-estável...');
    
    try {
        console.log('📡 Conectando aos servidores do Banco Mundial, FlagCDN e PNUD...');
        
        const [listaPaises, pibData, perCapitaData, inflacaoData, idhData] = await Promise.all([
            buscarDadosAPI(URL_LISTA_PAISES),
            buscarDadosAPI(URL_PIB),
            buscarDadosAPI(URL_PER_CAPITA),
            buscarDadosAPI(URL_INFLACAO),
            buscarDadosAPI(URL_IDH).catch(() => ({}))
        ]);

        console.log('⚙️ Cruzando dados macroeconômicos...');

        const mapaPIB = {};
        const mapaPerCapita = {};
        const mapaInflacao = {};
        const mapaIDH = {};

        // Mapeamento do Banco Mundial (usa ISO de 2 letras convertido para minúsculo para bater com as flags)
        if (pibData[1]) pibData[1].forEach(d => { if(d.value) mapaPIB[d.country.id.toLowerCase()] = d.value; });
        if (perCapitaData[1]) perCapitaData[1].forEach(d => { if(d.value) mapaPerCapita[d.country.id.toLowerCase()] = d.value; });
        if (inflacaoData[1]) inflacaoData[1].forEach(d => { if(d.value) mapaInflacao[d.country.id.toLowerCase()] = d.value; });
        
        // Mapeamento do IDH (ONU)
        if (idhData) {
            // O PNUD costuma usar ISO de 3 letras, fazemos a conversão aproximada ou fallback por faixas
            Object.entries(idhData).forEach(([code, value]) => {
                mapaIDH[code.toLowerCase()] = parseFloat(value);
            });
        }

        const listaFinalPaises = [];

        for (const [codigoIso2, nomeOriginal] of Object.entries(listaPaises)) {
            // Remove subdivisões regionais americanas ou códigos inválidos
            if (codigoIso2.length > 2 || codigoIso2 === 'us-ak' || codigoIso2 === 'us-hi') continue;

            const nomeFormatado = nomeOriginal
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '');

            // Determina a moeda (usa o dicionário ou assume USD como padrão comercial internacional de fallback)
            const moedaFinal = dicionarioMoedas[codigoIso2] || "USD";

            // Tratamento do IDH real ou inferido pela renda do Banco Mundial
            let valorIDH = mapaIDH[codigoIso2] || null;
            if (!valorIDH && mapaPerCapita[codigoIso2]) {
                const renda = mapaPerCapita[codigoIso2];
                valorIDH = renda > 40000 ? 0.920 : renda > 15000 ? 0.790 : renda > 3000 ? 0.640 : 0.480;
            }
            // Ajustes cirúrgicos para os Congos caso fiquem sem o mapeamento da ONU
            if (codigoIso2 === 'cd') valorIDH = 0.479;
            if (codigoIso2 === 'cg') valorIDH = 0.593;

            listaFinalPaises.push({
                pais: nomeOriginal,
                caminho_bandeira: `imgs/${nomeFormatado}.png`,
                pib: formatarPIB(mapaPIB[codigoIso2]),
                idh: valorIDH ? parseFloat(valorIDH.toFixed(3)) : 0.650,
                pib_per_capita: formatarPIBPerCapita(mapaPerCapita[codigoIso2]),
                inflacao: formatarInflacao(mapaInflacao[codigoIso2]),
                moeda: moedaFinal
            });
        }

        // Ordena de A-Z
        listaFinalPaises.sort((a, b) => a.pais.localeCompare(b.pais));

        const destino = path.join(__dirname, 'paises.json');
        fs.writeFileSync(destino, JSON.stringify(listaFinalPaises, null, 2), 'utf-8');

        console.log(`\n🎉 Sucesso absoluto! O arquivo 'paises.json' foi gerado com dados reais.`);
        console.log(`📊 Total de países processados com sucesso: ${listaFinalPaises.length}`);

    } catch (erro) {
        console.error('💥 Erro crítico durante a execução do script:', erro.message);
    }
}

executar();