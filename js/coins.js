let moedasDados = [];
let meuGrafico = null;
let chartInstance = null; // Garanta que o nome é chartInstance
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

// 2. Preencher os dois selects simultaneamente
function popularComboboxes() {
    const baseSelect = document.getElementById('baseCurrency');
    const targetSelect = document.getElementById('targetCurrency');

    moedasDados.forEach((item, index) => {
        // Opção para Moeda Base
        const optBase = document.createElement('option');
        optBase.value = index;
        optBase.textContent = `${item.pais} (${item.moeda.sigla})`;
        baseSelect.appendChild(optBase);

        // Opção para Moeda Alvo
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

    // --- CÁLCULO DA TAXA DE CÂMBIO CORRIGIDA ---
    // Invertemos a divisão para refletir a taxa de mercado real entre as duas moedas
    const taxaCruzada = moedaDestino.moeda.valor_em_dolar / moedaOrigem.moeda.valor_em_dolar;

    // Simplificação visual: Se a taxa for muito baixa, usa 4 casas. Se for normal, usa 2.
    const casasDecimais = taxaCruzada < 0.1 ? 4 : 2;

    document.getElementById('exchangeRateDisplay').innerHTML = 
        `1 ${moedaOrigem.moeda.sigla} = <span style="color: #58a6ff">${taxaCruzada.toFixed(casasDecimais)}</span> ${moedaDestino.moeda.sigla}`;

    // --- PARIDADE DO BIGMAC SIMPLIFICADA ---
    const precoBaseUSD = moedaOrigem.custo_bigmac.em_usd;
    const precoDestinoUSD = moedaDestino.custo_bigmac.em_usd;
    const razaoBigMac = precoBaseUSD / precoDestinoUSD;

// --- PARIDADE DO BIGMAC SIMPLIFICADA (EXIBIÇÃO DE VALORES) ---
    const precoLocal = moedaOrigem.custo_bigmac.na_moeda_local;
    const precoUSD = moedaOrigem.custo_bigmac.em_usd;

    // Monta a string no formato desejado: Preço Local ($ 5.69 ou R$ 24.30) e depois ($5.69)
    // Usamos uma cor verde suave para destacar os valores de forma elegante
    const textoBigMacSimplificado = `<span style="color: #2ea44f;">${precoLocal}</span> <span style="font-size: 16px; color: #8b949e;">($${precoUSD.toFixed(2)})</span>`;

    // Renderiza diretamente no card
    document.getElementById('bigMacDisplay').innerHTML = textoBigMacSimplificado;

    // Atualizar Gráfico Histórico Cruzado
    atualizarGraficoCruzado(moedaOrigem, moedaDestino, taxaCruzada);
}

// Reseta a interface caso o usuário remova a seleção
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

    // Se o elemento <p> não existir na página, evita travar o console
    if (!campoResultado) {
        console.error("Erro: O elemento com id 'value-convertido' não foi encontrado no seu HTML.");
        return;
    }

    const baseIndex = baseSelect ? baseSelect.value : "";
    const targetIndex = targetSelect ? targetSelect.value : "";

    // Validação de segurança: Moedas selecionadas
    if (baseIndex === "" || targetIndex === "") {
        campoResultado.innerHTML = "Resultado: <span style='color:#ff7b72;'>Selecione as duas moedas!</span>";
        return;
    }

    const valorNumerico = parseFloat(inputValor.value);
    
    // Validação de segurança: Valor numérico digitado
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
        campoResultado.innerHTML = "Resultado: <span style='color:#ff7b72;'>Insira um valor válido!</span>";
        return;
    }

    // moedasDados deve ser a sua lista carregada via fetch no início do arquivo
    const moedaOrigem = moedasDados[baseIndex];
    const moedaDestino = moedasDados[targetIndex];

    // Câmbio direto corrigido (Destino / Origem)
    const taxaCruzada = moedaDestino.moeda.valor_em_dolar / moedaOrigem.moeda.valor_em_dolar;
    const valorConvertidoFinal = valorNumerico * taxaCruzada;

    // Renderiza o resultado na tela de forma limpa
    campoResultado.innerHTML = `Resultado: <strong style="color: #fff;">${moedaDestino.moeda.simbolo} ${valorConvertidoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>`;
}
function atualizarGraficoCruzado(moedaOrigem, moedaDestino, taxaCruzadaInutilizada) {
    const ctx = document.getElementById("assetChart").getContext("2d");

    // Altera o subtítulo para identificar o par de moedas atual (Moeda Base / USD)
    const subtitulo = document.getElementById("chartSubtitle");
    if (subtitulo) {
        subtitulo.textContent = `Histórico de Evolução (${moedaOrigem.moeda.sigla} / USD)`;
    }

    // 1. Gerar labels de meses (12 meses para alinhar com o padrão do seu outro gráfico)
    const mesesLista = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const labels = [];
    const values = [];
    const valorBase = moedaOrigem.moeda.valor_em_dolar;

    // Monta os últimos 12 meses dinamicamente no formato "MM/AA" (Ex: 05/26)
    for (let i = 12; i > 0; i--) {
        const dataMatriz = new Date();
        dataMatriz.setMonth(dataMatriz.getMonth() - i);
        
        const mesFormatado = mesesLista[dataMatriz.getMonth()];
        const anoFormatado = dataMatriz.getFullYear().toString().slice(2);
        
        labels.push(`${mesFormatado}/${anoFormatado}`);
        
        // Simulação de oscilação suave (baseada em seno) para manter o gráfico harmônico
        const oscilacao = 1 + (Math.sin(i) * 0.04) + (Math.random() * 0.02 - 0.01);
        values.push(Number((valorBase * oscilacao).toFixed(4)));
    }
    
    // Força o último ponto a ser a cotação atual exata da moeda de origem
    values[values.length - 1] = valorBase;

    // 2. Construção do Gradiente Estilizado Néon (idêntico ao seu padrão)
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(67, 255, 150, 0.35)"); // Verde brilhante no topo
    gradient.addColorStop(1, "rgba(67, 255, 150, 0)");    // Fade para transparente na base

    // 3. Gerenciamento de Instância para evitar sobreposição de telas
    if (chartInstance) {
        chartInstance.destroy();
    }

    // 4. Nova Instância do Gráfico aplicando as suas regras de estilo
    chartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    data: values,
                    borderColor: "#43ff96", // Cor verde néon original
                    backgroundColor: gradient,
                    fill: true,
                    borderWidth: 3,
                    tension: 0.45,         // Linha curvada/suave
                    pointRadius: 0,        // Remove os pontos estáticos
                    pointHoverRadius: 6    // Exibe o ponto apenas no Hover
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Esconde a legenda superior indesejada
                }
            },
            scales: {
                x: {
                    grid: {
                        color: "rgba(255, 255, 255, 0.03)" // Grid super discreta
                    },
                    ticks: {
                        color: "#7d7d7d" // Cor cinza padrão dos textos de eixos
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