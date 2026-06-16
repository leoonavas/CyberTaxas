let moedasDados = [];
let meuGrafico = null;
let chartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    fetch('settings/coins-valores.json')
        .then(response => {
            if (!response.ok) throw new Error('Erro ao ler arquivo de configurações');
            return response.json();
        })
        .then(data => {
            moedasDados = data;
            popularComboboxes();
        })
        .catch(erro => console.error('Erro na carga dos dados:', erro));

    document.getElementById('baseCurrency').addEventListener('change', atualizarDashboard);
    document.getElementById('targetCurrency').addEventListener('change', atualizarDashboard);
});

function popularComboboxes() {
    const baseSelect = document.getElementById('baseCurrency');
    const targetSelect = document.getElementById('targetCurrency');

    moedasDados.forEach((item, index) => {
        const optBase = document.createElement('option');
        optBase.value = index;
        optBase.textContent = `${item.pais} (${item.moeda.sigla})`;
        baseSelect.appendChild(optBase);

        const optTarget = document.createElement('option');
        optTarget.value = index;
        optTarget.textContent = `${item.pais} (${item.moeda.sigla})`;
        targetSelect.appendChild(optTarget);
    });
}

function atualizarDashboard() {
    const baseIndex = document.getElementById('baseCurrency').value;
    const targetIndex = document.getElementById('targetCurrency').value;

    if (baseIndex === "" || targetIndex === "") {
        zerarDashboard();
        return;
    }

    const moedaOrigem = moedasDados[baseIndex];
    const moedaDestino = moedasDados[targetIndex];
    const taxaCruzada = moedaDestino.moeda.valor_em_dolar / moedaOrigem.moeda.valor_em_dolar;

    const casasDecimais = taxaCruzada < 0.1 ? 4 : 2;

    document.getElementById('exchangeRateDisplay').innerHTML = 
        `1 ${moedaOrigem.moeda.sigla} = <span style="color: #58a6ff">${taxaCruzada.toFixed(casasDecimais)}</span> ${moedaDestino.moeda.sigla}`;

    const precoBaseUSD = moedaOrigem.custo_bigmac.em_usd;
    const precoDestinoUSD = moedaDestino.custo_bigmac.em_usd;
    const razaoBigMac = precoBaseUSD / precoDestinoUSD;

    const precoLocal = moedaOrigem.custo_bigmac.na_moeda_local;
    const precoUSD = moedaOrigem.custo_bigmac.em_usd;

    const textoBigMacSimplificado = `<span style="color: #2ea44f;">${precoLocal}</span> <span style="font-size: 16px; color: #8b949e;">($${precoUSD.toFixed(2)})</span>`;

    document.getElementById('bigMacDisplay').innerHTML = textoBigMacSimplificado;

    atualizarGraficoCruzado(moedaOrigem, moedaDestino, taxaCruzada);
}

function zerarDashboard() {
    document.getElementById('exchangeRateDisplay').textContent = "--";
    document.getElementById('bigMacDisplay').textContent = "--";
    document.getElementById('value-convertido').innerHTML = "Resultado:";
    if (meuGrafico) meuGrafico.destroy();
}

function realizarConversao() {
    const baseSelect = document.getElementById('baseCurrency');
    const targetSelect = document.getElementById('targetCurrency');
    const inputValor = document.getElementById('exchangeValue');
    const campoResultado = document.getElementById('value-convertido');

    if (!campoResultado) {
        console.error("Erro: O elemento com id 'value-convertido' não foi encontrado no seu HTML.");
        return;
    }

    const baseIndex = baseSelect ? baseSelect.value : "";
    const targetIndex = targetSelect ? targetSelect.value : "";

    const valorNumerico = parseFloat(inputValor.value);
    
    const moedaOrigem = moedasDados[baseIndex];
    const moedaDestino = moedasDados[targetIndex];

    const taxaCruzada = moedaDestino.moeda.valor_em_dolar / moedaOrigem.moeda.valor_em_dolar;
    const valorConvertidoFinal = valorNumerico * taxaCruzada;

    campoResultado.innerHTML = `Resultado: <strong style="color: #fff;">${moedaDestino.moeda.simbolo} ${valorConvertidoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>`;
}

function atualizarGraficoCruzado(moedaOrigem, moedaDestino, taxaCruzadaInutilizada) {
    const ctx = document.getElementById("assetChart").getContext("2d");

    const subtitulo = document.getElementById("chartSubtitle");
    if (subtitulo) {
        subtitulo.textContent = `Histórico de Evolução (${moedaOrigem.moeda.sigla} / USD)`;
    }

    const mesesLista = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const labels = [];
    const values = [];
    const valorBase = moedaOrigem.moeda.valor_em_dolar;

    for (let i = 12; i > 0; i--) {
        const dataMatriz = new Date();
        dataMatriz.setMonth(dataMatriz.getMonth() - i);
        
        const mesFormatado = mesesLista[dataMatriz.getMonth()];
        const anoFormatado = dataMatriz.getFullYear().toString().slice(2);
        
        labels.push(`${mesFormatado}/${anoFormatado}`);
        
        const oscilacao = 1 + (Math.sin(i) * 0.04) + (Math.random() * 0.02 - 0.01);
        values.push(Number((valorBase * oscilacao).toFixed(4)));
    }
    
    values[values.length - 1] = valorBase;

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(67, 255, 150, 0.35)");
    gradient.addColorStop(1, "rgba(67, 255, 150, 0)");

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    data: values,
                    borderColor: "#43ff96",
                    backgroundColor: gradient,
                    fill: true,
                    borderWidth: 3,
                    tension: 0.45,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        color: "rgba(255, 255, 255, 0.03)"
                    },
                    ticks: {
                        color: "#7d7d7d"
                    }
                },
                y: {
                    grid: {
                        color: "rgba(255, 255, 255, 0.03)"
                    },
                    ticks: {
                        color: "#7d7d7d"
                    }
                }
            }
        }
    });
}