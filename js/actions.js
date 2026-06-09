let stocksData = [];
let chartInstance = null;

const select = document.getElementById("stockSelect");
const priceElement = document.getElementById("stockPrice");
const variationElement = document.getElementById("stockVariation");

async function loadStocks() {

    const response = await fetch("settings/acoes-valores.json");

    stocksData = await response.json();

    stocksData.forEach(stock => {

        const option = document.createElement("option");

        option.value = stock.ticker;
        option.textContent = `${stock.ticker} (${stock.moeda})`;

        select.appendChild(option);
    });

    if (stocksData.length > 0) {

        select.value = stocksData[0].ticker;

        updateDashboard(stocksData[0]);
    }
}

function calculateVariation(stock) {

    const history = stock.historico_12_meses;

    const current =
        history[history.length - 1].preco_fechamento;

    const previous =
        history[history.length - 2].preco_fechamento;

    return ((current - previous) / previous) * 100;
}

function formatCurrency(value, currency) {

    return new Intl.NumberFormat(
        "pt-BR",
        {
            style: "currency",
            currency: currency
        }
    ).format(value);
}

function updateDashboard(stock) {

    const variation =
        calculateVariation(stock);

    priceElement.textContent =
        formatCurrency(
            stock.preco_atual,
            stock.moeda
        );

    variationElement.textContent =
        `${variation.toFixed(2)}%`;

    variationElement.classList.remove(
        "negative",
        "positive"
    );

    if (variation < 0) {

        variationElement.classList.add(
            "negative"
        );

    } else {

        variationElement.classList.add(
            "positive"
        );
    }

    updateChart(stock);
}

function updateChart(stock) {

    const ctx =
        document
            .getElementById("assetChart")
            .getContext("2d");

    const labels =
        stock.historico_12_meses.map(item => {

            const [year, month] =
                item.mes.split("-");

            return `${month}/${year.slice(2)}`;
        });

    const values =
        stock.historico_12_meses.map(
            item => item.preco_fechamento
        );

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            400
        );

    gradient.addColorStop(
        0,
        "rgba(67,255,150,0.35)"
    );

    gradient.addColorStop(
        1,
        "rgba(67,255,150,0)"
    );

    if (chartInstance) {

        chartInstance.destroy();
    }

    chartInstance =
        new Chart(ctx, {

            type: "line",

            data: {

                labels,

                datasets: [
                    {

                        data: values,

                        borderColor:
                            "#43ff96",

                        backgroundColor:
                            gradient,

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
                            color:
                                "rgba(255,255,255,0.03)"
                        },

                        ticks: {
                            color:
                                "#7d7d7d"
                        }
                    },

                    y: {

                        grid: {
                            color:
                                "rgba(255,255,255,0.03)"
                        },

                        ticks: {
                            color:
                                "#7d7d7d"
                        }
                    }
                }
            }
        });
}

select.addEventListener("change",
() => {
    const stock =
        stocksData.find(
            item =>
                item.ticker ===
                select.value
        );

    if (stock) {

        updateDashboard(stock);
    }
});

loadStocks();