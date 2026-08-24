// Recupera os lançamentos salvos no navegador
let data = JSON.parse(
    localStorage.getItem("financeData") || "[]"
);

// Formatação dos valores em reais
const formatador = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

// Elementos principais da página
const home = document.getElementById("home");
const list = document.getElementById("list");
const graph = document.getElementById("graph");
const btnHome = document.getElementById("btnHome");
const btnList = document.getElementById("btnList");
const btnGraph = document.getElementById("btnGraph");
const eyebrow = document.getElementById("eyebrow");
const title = document.getElementById("title");

const balance = document.getElementById("balance");
const income = document.getElementById("income");
const income2 = document.getElementById("income2");
const expense = document.getElementById("expense");
const expense2 = document.getElementById("expense2");

const incomeBar = document.getElementById("incomeBar");
const expenseBar = document.getElementById("expenseBar");

const filterMonth = document.getElementById("filterMonth");
const filterCategory = document.getElementById("filterCategory");
const items = document.getElementById("items");
const chartMonth = document.getElementById("chartMonth");
const chartBars = document.getElementById("chartBars");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const form = document.getElementById("form");
const type = document.getElementById("type");
const description = document.getElementById("description");
const value = document.getElementById("value");
const date = document.getElementById("date");
const category = document.getElementById("category");
const save = document.getElementById("save");
const toast = document.getElementById("toast");
const monthName = document.getElementById("monthName");
const dashboardMonth = document.getElementById("dashboardMonth");

// Data atual
const now = new Date();

const currentMonth =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0");
// Coloca o mês atual na tela inicial
dashboardMonth.value = currentMonth;
dashboardMonth.addEventListener("change", render);

// Coloca o mês atual no filtro
filterMonth.value = currentMonth;
// Coloca o mês atual no gráfico
chartMonth.value = currentMonth;

// Atualiza o gráfico quando o mês for alterado
chartMonth.addEventListener(
    "change",
    renderChart
);

// Coloca a data atual no formulário
date.value = new Date().toISOString().slice(0, 10);

// Mostra o nome do mês
monthName.textContent = now.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
});

// Alterna entre início e lançamentos
function showView(view) {
    home.classList.toggle(
        "hidden",
        view !== "home"
    );

    list.classList.toggle(
        "hidden",
        view !== "list"
    );

    graph.classList.toggle(
        "hidden",
        view !== "graph"
    );

    btnHome.classList.toggle(
        "active",
        view === "home"
    );

    btnList.classList.toggle(
        "active",
        view === "list"
    );

    btnGraph.classList.toggle(
        "active",
        view === "graph"
    );

    if (view === "home") {
        eyebrow.textContent = "VISÃO GERAL";

        title.textContent =
            "Olá! Vamos cuidar das suas finanças?";
    }

    if (view === "list") {
        eyebrow.textContent =
            "ORGANIZE SEU DINHEIRO";

        title.textContent = "Lançamentos";
    }

    if (view === "graph") {
        eyebrow.textContent =
            "ANALISE SEUS GASTOS";

        title.textContent = "Gráficos";
    }

    render();
}

// Abre o formulário de receita ou despesa
function openModal(transactionType) {
    type.value = transactionType;

    modalTitle.textContent =
        transactionType === "receita"
            ? "Adicionar receita"
            : "Adicionar despesa";

    save.textContent =
        transactionType === "receita"
            ? "Salvar receita"
            : "Salvar despesa";

    save.className =
        transactionType === "receita"
            ? "save income"
            : "save expense";

    const incomeCategories = [
        "Salário",
        "Renda extra",
        "Vendas",
        "Outros"
    ];

    const expenseCategories = [
        "Alimentação",
        "Transporte",
        "Compra de roupas",
        "Gás de cozinha",
        "Conta de Energia",
        "Conta de água",
        "Aluguel",
        "internet",
        "Faculdade",
        "fatura do cartão",

        "Outros"
    ];

    const categories =
        transactionType === "receita"
            ? incomeCategories
            : expenseCategories;

    category.innerHTML = categories
        .map(function (categoryName) {
            return `<option value="${categoryName}">
                ${categoryName}
            </option>`;
        })
        .join("");

    modal.classList.remove("hidden");
}

// Fecha o formulário
function closeModal() {
    modal.classList.add("hidden");
}

// Salva uma nova receita ou despesa
form.addEventListener("submit", function (event) {
    event.preventDefault();

    const newTransaction = {
        id: Date.now(),
        type: type.value,
        description: description.value.trim(),
        value: Number(value.value),
        date: date.value,
        category: category.value
    };

    data.unshift(newTransaction);

    saveData();

    form.reset();

    date.value = new Date().toISOString().slice(0, 10);

    closeModal();
    showToast();
    render();
});

// Salva os lançamentos no navegador
function saveData() {
    localStorage.setItem(
        "financeData",
        JSON.stringify(data)
    );
}

// Exclui um lançamento
function del(id) {
    const confirmation = confirm(
        "Deseja realmente excluir este lançamento?"
    );

    if (!confirmation) {
        return;
    }

    data = data.filter(function (transaction) {
        return transaction.id !== id;
    });

    saveData();
    render();
}

// Limpa os filtros
function clearFilters() {
    filterMonth.value = "";
    filterCategory.value = "Todas";

    render();
}

// Mostra a mensagem de sucesso
function showToast() {
    toast.classList.remove("hidden");

    setTimeout(function () {
        toast.classList.add("hidden");
    }, 2000);
}

// Protege textos digitados pelo usuário
function escapeHTML(text) {
    const element = document.createElement("div");

    element.textContent = text;

    return element.innerHTML;
}

// Atualiza todos os valores da tela
function render() {
    const dashboardSelectedMonth =
    dashboardMonth.value || currentMonth;
    const dashboardMonthParts =
    dashboardSelectedMonth.split("-");

const dashboardYear =
    Number(dashboardMonthParts[0]);

const dashboardMonthNumber =
    Number(dashboardMonthParts[1]) - 1;

const dashboardDate =
    new Date(dashboardYear, dashboardMonthNumber, 1);

monthName.textContent =
    dashboardDate.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric"
    });
    const monthlyTransactions = data.filter(
        function (transaction) {
            return transaction.date.startsWith(dashboardSelectedMonth);
        }
    );

    const totalIncome = monthlyTransactions
        .filter(function (transaction) {
            return transaction.type === "receita";
        })
        .reduce(function (total, transaction) {
            return total + transaction.value;
        }, 0);

    const totalExpense = monthlyTransactions
        .filter(function (transaction) {
            return transaction.type === "despesa";
        })
        .reduce(function (total, transaction) {
            return total + transaction.value;
        }, 0);

        const transactionsUntilSelectedMonth = data.filter(
            function (transaction) {
                const transactionMonth = transaction.date.slice(0, 7);
        
                return transactionMonth <= dashboardSelectedMonth;
            }
        );
        
        const currentBalance = transactionsUntilSelectedMonth.reduce(
            function (total, transaction) {
                if (transaction.type === "receita") {
                    return total + transaction.value;
                }
        
                return total - transaction.value;
            },
            0
        );
       
   
    // Atualiza os cartões
    balance.textContent = formatador.format(currentBalance);

    income.textContent = formatador.format(totalIncome);
    income2.textContent = formatador.format(totalIncome);

    expense.textContent = formatador.format(totalExpense);
    expense2.textContent = formatador.format(totalExpense);

    // Atualiza as barras do resumo
    const biggestValue = Math.max(
        totalIncome,
        totalExpense,
        1
    );

    incomeBar.style.width =
        (totalIncome / biggestValue) * 100 + "%";

    expenseBar.style.width =
        (totalExpense / biggestValue) * 100 + "%";

    // Aplica os filtros
    const selectedMonth = filterMonth.value;
    const selectedCategory = filterCategory.value;

    const filteredTransactions = data.filter(
        function (transaction) {
            const monthMatches =
                selectedMonth === "" ||
                transaction.date.startsWith(selectedMonth);

            const categoryMatches =
                selectedCategory === "Todas" ||
                transaction.category === selectedCategory;

            return monthMatches && categoryMatches;
        }
    );

    // Mostra mensagem caso não existam lançamentos
    if (filteredTransactions.length === 0) {
        items.innerHTML = `
            <div class="empty">
                Nenhum lançamento encontrado.
            </div>
        `;

        return;
    }

    // Monta a lista de lançamentos
    items.innerHTML = filteredTransactions
        .map(function (transaction) {
            const formattedDate = new Date(
                transaction.date + "T12:00:00"
            ).toLocaleDateString("pt-BR");

            const valueClass =
                transaction.type === "receita"
                    ? "green"
                    : "red";

            const signal =
                transaction.type === "receita"
                    ? "+"
                    : "−";

            return `
                <div class="item">
                    <span>
                        <strong>
                            ${escapeHTML(transaction.description)}
                        </strong>
                    </span>

                    <span>
                        <b>${escapeHTML(transaction.category)}</b>
                    </span>

                    <span>${formattedDate}</span>

                    <strong class="${valueClass}">
                        ${signal} ${formatador.format(transaction.value)}
                    </strong>

                    <button
                        type="button"
                        onclick="del(${transaction.id})"
                        aria-label="Excluir lançamento"
                    >
                        ×
                    </button>
                </div>
            `;
        })
        .join("");
}
// Cria o gráfico de despesas por categoria
function renderChart() {
    const selectedMonth = chartMonth.value;

    // Seleciona somente despesas do mês escolhido
    const monthExpenses = data.filter(
        function (transaction) {
            const isExpense =
                transaction.type === "despesa";

            const isSelectedMonth =
                selectedMonth === "" ||
                transaction.date.startsWith(
                    selectedMonth
                );

            return isExpense && isSelectedMonth;
        }
    );

    // Objeto que armazenará os valores por categoria
    const categoryTotals = {};

    monthExpenses.forEach(
        function (transaction) {
            const categoryName =
                transaction.category;

            if (
                categoryTotals[categoryName] ===
                undefined
            ) {
                categoryTotals[categoryName] = 0;
            }

            categoryTotals[categoryName] +=
                transaction.value;
        }
    );

    // Converte o objeto em uma lista de categorias
    const categories = Object.entries(
        categoryTotals
    ).sort(function (first, second) {
        return second[1] - first[1];
    });

    // Se não houver despesas
    if (categories.length === 0) {
        chartBars.innerHTML = `
            <div class="chart-empty">
                Nenhuma despesa encontrada neste mês.
            </div>
        `;

        return;
    }

    // Encontra o maior valor
    const biggestValue = Math.max(
        ...categories.map(function (category) {
            return category[1];
        })
    );

    // Cria as barras do gráfico
    chartBars.innerHTML = categories
        .map(function (category) {
            const categoryName = category[0];
            const categoryValue = category[1];

            const percentage =
                (categoryValue / biggestValue) * 100;

            return `
                <div class="chart-row">
                    <span class="chart-category">
                        ${escapeHTML(categoryName)}
                    </span>

                    <div class="chart-track">
                        <div
                            class="chart-fill"
                            style="width: ${percentage}%"
                        ></div>
                    </div>

                    <strong class="chart-value">
                        ${formatador.format(categoryValue)}
                    </strong>
                </div>
            `;
        })
        .join("");
}
// Exibe as informações ao abrir o aplicativo
render();
renderChart();