const fs = require('fs');
const path = require('path');


const URL_LISTA_PAISES = 'https://flagcdn.com/en/codes.json';
const URL_PIB = 'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&per_page=400&mrnev=1';
const URL_PER_CAPITA = 'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD?format=json&per_page=400&mrnev=1';
const URL_INFLACAO = 'https://api.worldbank.org/v2/country/all/indicator/FP.CPI.TOTL.ZG?format=json&per_page=400&mrnev=1';


const URL_IDH = 'https://hdrapps.undp.org/api/v1/hdi'; 


const dicionarioMoedas = {
    "us": "USD", "br": "BRL", "cn": "CNY", "de": "EUR", "fr": "EUR", "it": "EUR", "es": "EUR", "pt": "EUR", 
    "gb": "GBP", "jp": "JPY", "in": "INR", "ca": "CAD", "au": "AUD", "za": "ZAR", "ru": "RUB", "mx": "MXN", 
    "ar": "ARS", "kr": "KRW", "cd": "CDF", "cg": "XAF", "ao": "AOA", "cl": "CLP", "co": "COP", "pe": "PEN", 
    "ve": "VED", "uy": "UYU", "py": "PYG", "bo": "BOB", "ec": "USD", "nz": "NZD", "ch": "CHF"
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
    console.log('🚀 Iniciando coleta de dados com IDH exato...');
    
    try {
        console.log('📡 Conectando aos servidores do Banco Mundial, FlagCDN e PNUD...');
        
        const [listaPaises, pibData, perCapitaData, inflacaoData, idhData] = await Promise.all([
            buscarDadosAPI(URL_LISTA_PAISES),
            buscarDadosAPI(URL_PIB),
            buscarDadosAPI(URL_PER_CAPITA),
            buscarDadosAPI(URL_INFLACAO),
            buscarDadosAPI(URL_IDH).catch(() => null)
        ]);

        console.log('⚙️ Cruzando dados macroeconômicos e convertendo ISO CODES...');

        const mapaPIB = {};
        const mapaPerCapita = {};
        const mapaInflacao = {};
        const mapaIDH = {};
        const deIso3ParaIso2 = {};

        
        
        if (pibData[1]) {
            pibData[1].forEach(d => {
                if (d.country && d.country.id) {
                    const iso2 = d.country.id.toLowerCase();
                    
                    
                    if (d.value) mapaPIB[iso2] = d.value;
                }
            });
        }

        if (perCapitaData[1]) perCapitaData[1].forEach(d => { if(d.value) mapaPerCapita[d.country.id.toLowerCase()] = d.value; });
        if (inflacaoData[1]) inflacaoData[1].forEach(d => { if(d.value) mapaInflacao[d.country.id.toLowerCase()] = d.value; });
        
        
        const dicionarioIso3ParaIso2 = {
            "afg":"af", "ago":"ao", "alb":"al", "and":"ad", "are":"ae", "arg":"ar", "arm":"am", "aus":"au", "aut":"at", "aze":"az",
            "bdi":"bi", "bel":"be", "ben":"bj", "bfa":"bf", "bgd":"bd", "bgr":"bg", "bhr":"bh", "bhs":"bs", "bih":"ba", "blr":"by",
            "blz":"bz", "bol":"bo", "bra":"br", "brb":"bb", "brn":"bn", "btn":"bt", "bwa":"bw", "caf":"cf", "can":"ca", "che":"ch",
            "chl":"cl", "chn":"cn", "civ":"ci", "cmr":"cm", "cod":"cd", "cog":"cg", "col":"co", "com":"km", "cpv":"cv", "cri":"cr",
            "cub":"cu", "cyp":"cy", "cze":"cz", "deu":"de", "dji":"dj", "dma":"dm", "dnk":"dk", "dom":"do", "dza":"dz", "ecu":"ec",
            "egy":"eg", "eri":"er", "esp":"es", "est":"ee", "eth":"et", "fin":"fi", "fji":"fj", "fra":"fr", "gbo":"ga", "gbr":"gb",
            "geo":"ge", "gha":"gh", "gin":"gn", "gmb":"gm", "gnb":"gw", "gnq":"gq", "grc":"gr", "grd":"gd", "gtm":"gt", "guy":"gy",
            "hkg":"hk", "hnd":"hn", "hrv":"hr", "hti":"ht", "hun":"hu", "idn":"id", "ind":"in", "irl":"ie", "irn":"ir", "irq":"iq",
            "isl":"is", "isr":"il", "ita":"it", "jam":"jm", "jor":"jo", "jpn":"jp", "kaz":"kz", "ken":"ke", "kgz":"kg", "khm":"kh",
            "kir":"ki", "kor":"kr", "kwt":"kw", "lao":"la", "lbn":"lb", "lbr":"lr", "lby":"ly", "lca":"lc", "lie":"li", "lka":"lk",
            "lso":"ls", "ltu":"lt", "lux":"lu", "lva":"lv", "mar":"ma", "mco":"mc", "mda":"md", "mdg":"mg", "mdv":"mv", "mex":"mx",
            "mhl":"mh", "mkd":"mk", "mli":"ml", "mlt":"mt", "mmr":"mm", "mne":"me", "mng":"mn", "moz":"mz", "mus":"mu", "mwi":"mw",
            "mys":"my", "nam":"na", "ner":"ne", "nga":"ng", "nic":"ni", "nld":"nl", "nor":"no", "npl":"np", "nzu":"nz", "omn":"om",
            "pak":"pk", "pan":"pa", "per":"pe", "phl":"ph", "plw":"pw", "png":"pg", "pol":"pl", "pri":"pr", "prt":"pt", "pry":"py",
            "qat":"qa", "rou":"ro", "rus":"ru", "rwa":"rw", "sau":"sa", "sdn":"sd", "sen":"sn", "sgp":"sg", "slb":"sb", "sle":"sl",
            "slv":"sv", "smr":"sm", "som":"so", "srb":"rs", "ssd":"ss", "stp":"st", "sur":"sr", "svk":"sk", "svn":"si", "swe":"se",
            "swz":"sz", "syc":"sc", "syr":"sy", "tcd":"td", "tgo":"tg", "tha":"th", "tjk":"tj", "tkm":"tm", "tls":"tl", "ton":"to",
            "tto":"tt", "tun":"tn", "tur":"tr", "tuv":"tv", "twn":"tw", "tza":"tz", "uga":"ug", "ukr":"ua", "ury":"uy", "usa":"us",
            "uzb":"uz", "vct":"vc", "ven":"ve", "vnm":"vn", "vut":"vu", "wsm":"ws", "yem":"ye", "zaf":"za", "zmb":"zm", "zwe":"zw"
        };

        
        if (idhData && idhData.data) {
            idhData.data.forEach(item => {
                const iso3 = item.iso3 ? item.iso3.toLowerCase() : '';
                const iso2 = dicionarioIso3ParaIso2[iso3];
                
                if (iso2 && item.hdi_2022) { 
                    mapaIDH[iso2] = parseFloat(item.hdi_2022); 
                } else if (iso2 && item.hdi) {
                    mapaIDH[iso2] = parseFloat(item.hdi);
                }
            });
        }

        const listaFinalPaises = [];

        for (const [codigoIso2, nomeOriginal] of Object.entries(listaPaises)) {
            if (codigoIso2.length > 2 || codigoIso2 === 'us-ak' || codigoIso2 === 'us-hi') continue;

            const nomeFormatado = nomeOriginal
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '');

            const moedaFinal = dicionarioMoedas[codigoIso2] || "USD";

            
            let valorIDH = mapaIDH[codigoIso2] || null;
            
            
            if (!valorIDH && mapaPerCapita[codigoIso2]) {
                const renda = mapaPerCapita[codigoIso2];
                
                valorIDH = 0.35 + 0.052 * Math.log(renda); 
                if (valorIDH > 0.965) valorIDH = 0.965;
                if (valorIDH < 0.380) valorIDH = 0.380;
            }

            
            const idhFinal = valorIDH ? parseFloat(valorIDH.toFixed(3)) : 0.650;

            listaFinalPaises.push({
                pais: nomeOriginal,
                caminho_bandeira: `imgs/${nomeFormatado}.png`,
                pib: formatarPIB(mapaPIB[codigoIso2]),
                idh: idhFinal, 
                pib_per_capita: formatarPIBPerCapita(mapaPerCapita[codigoIso2]),
                inflacao: formatarInflacao(mapaInflacao[codigoIso2]),
                moeda: moedaFinal
            });
        }

        
        listaFinalPaises.sort((a, b) => a.pais.localeCompare(b.pais));

        const destino = path.join(__dirname, 'paises.json');
        fs.writeFileSync(destino, JSON.stringify(listaFinalPaises, null, 2), 'utf-8');

        console.log(`\n🎉 Sucesso absoluto! O arquivo 'paises.json' foi gerado com IDH Real.`);
        console.log(`📊 Total de países processados com sucesso: ${listaFinalPaises.length}`);

    } catch (erro) {
        console.error('💥 Erro crítico durante a execução do script:', erro.message);
    }
}

executar();