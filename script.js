/* ==================================================
   ESTADO DO APLICATIVO
================================================== */

let data = [];
let currentUserId = null;
let currentUserName = "";
let editingTransactionId = null;

const formatador = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

const now = new Date();
const today = now.toISOString().slice(0, 10);
const currentMonth =
    now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");

/* ==================================================
   ELEMENTOS DA INTERFACE
================================================== */

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
const dashboardMonth = document.getElementById("dashboardMonth");
const monthName = document.getElementById("monthName");

const transactionModal = document.getElementById("transactionModal");
const modalTitle = document.getElementById("modalTitle");
const form = document.getElementById("form");
const type = document.getElementById("type");
const description = document.getElementById("description");
const value = document.getElementById("value");
const date = document.getElementById("date");
const category = document.getElementById("category");
const save = document.getElementById("save");
const formMessage = document.getElementById("formMessage");

const loadingScreen = document.getElementById("loadingScreen");
const loadingText = document.getElementById("loadingText");
const exportButton = document.getElementById("exportButton");
const privacyButton = document.getElementById("privacyButton");
const privacyModal = document.getElementById("privacyModal");
const toast = document.getElementById("toast");

/* ==================================================
   CONFIGURAÇÃO INICIAL
================================================== */

dashboardMonth.value = currentMonth;
filterMonth.value = currentMonth;
chartMonth.value = currentMonth;
date.value = today;
date.max = today;

dashboardMonth.addEventListener("change", render);
chartMonth.addEventListener("change", renderChart);
exportButton.addEventListener("click", exportToExcel);
privacyButton.addEventListener("click", function () {
    privacyModal.classList.remove("hidden");
});

window.addEventListener(
    "smart-saldo-auth-changed",
    async function (event) {
        currentUserId = event.detail.userId;
        currentUserName = event.detail.userName || "";
        updateGreeting();

        if (!currentUserId) {
            data = [];
            render();
            renderChart();
            return;
        }

        showLoading("Carregando seus lançamentos...");

        try {
            data = await window.smartSaldoFirebase.loadTransactions(currentUserId);
            render();
            renderChart();
        } catch (error) {
            console.error("Erro ao carregar lançamentos:", error);
            showToast("Não foi possível carregar seus lançamentos.", "error");
        } finally {
            hideLoading();
        }
    }
);

/* ==================================================
   NAVEGAÇÃO E SAUDAÇÃO
================================================== */

function updateGreeting() {
    title.textContent = currentUserName
        ? `Olá, ${currentUserName}! Vamos cuidar das suas finanças?`
        : "Olá! Vamos cuidar das suas finanças?";
}

function showView(view) {
    home.classList.toggle("hidden", view !== "home");
    list.classList.toggle("hidden", view !== "list");
    graph.classList.toggle("hidden", view !== "graph");

    btnHome.classList.toggle("active", view === "home");
    btnList.classList.toggle("active", view === "list");
    btnGraph.classList.toggle("active", view === "graph");

    if (view === "home") {
        eyebrow.textContent = "VISÃO GERAL";
        updateGreeting();
    } else if (view === "list") {
        eyebrow.textContent = "ORGANIZE SEU DINHEIRO";
        title.textContent = "Lançamentos";
    } else {
        eyebrow.textContent = "ANALISE SEUS GASTOS";
        title.textContent = "Gráficos";
        renderChart();
    }

    render();
}

/* ==================================================
   CADASTRO E EDIÇÃO DE LANÇAMENTOS
================================================== */

const incomeCategories = ["Salário", "Renda extra", "Vendas", "Outros"];
const expenseCategories = [
    "Alimentação",
    "Transporte",
    "Compra de roupas",
    "Gás de cozinha",
    "Conta de Energia",
    "Conta de água",
    "Aluguel",
    "Internet",
    "Faculdade",
    "Fatura do cartão",
    "Outros"
];

function openModal(transactionType, transactionId = null) {
    editingTransactionId = transactionId;
    type.value = transactionType;
    formMessage.textContent = "";

    description.placeholder = transactionType === "receita"
        ? "Ex.: Salário"
        : "Ex.: Compras do mercado";

    const categories = transactionType === "receita"
        ? incomeCategories
        : expenseCategories;

    category.innerHTML = categories
        .map(function (categoryName) {
            return `<option value="${escapeHTML(categoryName)}">${escapeHTML(categoryName)}</option>`;
        })
        .join("");

    const transaction = transactionId === null
        ? null
        : data.find(function (item) {
            return item.id === transactionId;
        });

    modalTitle.textContent = transaction
        ? "Editar lançamento"
        : transactionType === "receita" ? "Adicionar receita" : "Adicionar despesa";

    save.textContent = transaction ? "Salvar alterações" : "Salvar lançamento";
    save.className = transactionType === "receita" ? "save income" : "save expense";

    if (transaction) {
        description.value = transaction.description;
        value.value = transaction.value;
        date.value = transaction.date;
        category.value = categories.find(function (categoryName) {
            return categoryName.toLowerCase() === transaction.category.toLowerCase();
        }) || "Outros";
    } else {
        form.reset();
        type.value = transactionType;
        date.value = today;
        category.innerHTML = categories
            .map(function (categoryName) {
                return `<option value="${escapeHTML(categoryName)}">${escapeHTML(categoryName)}</option>`;
            })
            .join("");
    }

    transactionModal.classList.remove("hidden");
    description.focus();
}

function editTransaction(transactionId) {
    const transaction = data.find(function (item) {
        return item.id === transactionId;
    });

    if (transaction) {
        openModal(transaction.type, transactionId);
    }
}

function closeModal(event) {
    if (event && event.target !== transactionModal) {
        return;
    }

    transactionModal.classList.add("hidden");
    editingTransactionId = null;
    formMessage.textContent = "";
}

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!currentUserId) {
        showFormMessage("Entre na sua conta para salvar um lançamento.");
        return;
    }

    const cleanDescription = description.value.trim().replace(/\s+/g, " ");
    const numericValue = Number(value.value);
    const selectedDate = date.value;
    const selectedCategory = category.value;

    const validationMessage = validateTransaction(
        cleanDescription,
        numericValue,
        selectedDate,
        selectedCategory
    );

    if (validationMessage) {
        showFormMessage(validationMessage);
        return;
    }

    const transaction = {
        id: editingTransactionId ?? Date.now(),
        type: type.value,
        description: cleanDescription,
        value: Math.round(numericValue * 100) / 100,
        date: selectedDate,
        category: selectedCategory
    };

    const wasEditing = editingTransactionId !== null;

    save.disabled = true;
    showFormMessage("Salvando...", "success");

    try {
        await window.smartSaldoFirebase.saveTransaction(currentUserId, transaction);

        if (editingTransactionId === null) {
            data.unshift(transaction);
        } else {
            data = data.map(function (item) {
                return item.id === editingTransactionId ? transaction : item;
            });
        }

        closeModal();
        render();
        renderChart();
        showToast(
            wasEditing ? "Lançamento atualizado!" : "Lançamento salvo!"
        );
    } catch (error) {
        console.error("Erro ao salvar lançamento:", error);
        showFormMessage("Não foi possível salvar. Verifique sua conexão.");
    } finally {
        save.disabled = false;
    }
});

async function del(transactionId) {
    const confirmed = window.confirm("Deseja realmente excluir este lançamento?");

    if (!confirmed || !currentUserId) {
        return;
    }

    showLoading("Excluindo lançamento...");

    try {
        await window.smartSaldoFirebase.deleteTransaction(currentUserId, transactionId);
        data = data.filter(function (transaction) {
            return transaction.id !== transactionId;
        });
        render();
        renderChart();
        showToast("Lançamento excluído!");
    } catch (error) {
        console.error("Erro ao excluir lançamento:", error);
        showToast("Não foi possível excluir o lançamento.", "error");
    } finally {
        hideLoading();
    }
}

function validateTransaction(text, amount, transactionDate, selectedCategory) {
    if (text.length < 2 || text.length > 80) {
        return "A descrição deve ter entre 2 e 80 caracteres.";
    }

    if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999.99) {
        return "Digite um valor válido maior que zero.";
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
        return "Selecione uma data válida.";
    }

    if (transactionDate > today) {
        return "A data do lançamento não pode estar no futuro.";
    }

    const validCategories = type.value === "receita"
        ? incomeCategories
        : expenseCategories;

    if (!validCategories.includes(selectedCategory)) {
        return "Selecione uma categoria válida.";
    }

    return "";
}

/* ==================================================
   FILTROS, CÁLCULOS E LISTA
================================================== */

function clearFilters() {
    filterMonth.value = "";
    filterCategory.value = "Todas";
    render();
}

function getFilteredTransactions() {
    const selectedMonth = filterMonth.value;
    const selectedCategory = filterCategory.value;

    return data.filter(function (transaction) {
        const monthMatches = !selectedMonth || transaction.date.startsWith(selectedMonth);
        const categoryMatches =
            selectedCategory === "Todas" || transaction.category === selectedCategory;

        return monthMatches && categoryMatches;
    });
}

function render() {
    const dashboardSelectedMonth = dashboardMonth.value || currentMonth;
    const parts = dashboardSelectedMonth.split("-");
    const dashboardDate = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);

    monthName.textContent = dashboardDate.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric"
    });

    const monthlyTransactions = data.filter(function (transaction) {
        return transaction.date.startsWith(dashboardSelectedMonth);
    });

    const totalIncome = sumByType(monthlyTransactions, "receita");
    const totalExpense = sumByType(monthlyTransactions, "despesa");

    const transactionsUntilSelectedMonth = data.filter(function (transaction) {
        return transaction.date.slice(0, 7) <= dashboardSelectedMonth;
    });

    const currentBalance = transactionsUntilSelectedMonth.reduce(
        function (total, transaction) {
            return transaction.type === "receita"
                ? total + transaction.value
                : total - transaction.value;
        },
        0
    );

    balance.textContent = formatador.format(currentBalance);
    income.textContent = formatador.format(totalIncome);
    income2.textContent = formatador.format(totalIncome);
    expense.textContent = formatador.format(totalExpense);
    expense2.textContent = formatador.format(totalExpense);

    const biggestValue = Math.max(totalIncome, totalExpense, 1);
    incomeBar.style.width = (totalIncome / biggestValue) * 100 + "%";
    expenseBar.style.width = (totalExpense / biggestValue) * 100 + "%";

    const filteredTransactions = getFilteredTransactions();

    if (filteredTransactions.length === 0) {
        items.innerHTML = '<div class="empty">Nenhum lançamento encontrado.</div>';
        return;
    }

    items.innerHTML = filteredTransactions
        .map(function (transaction) {
            const formattedDate = new Date(
                transaction.date + "T12:00:00"
            ).toLocaleDateString("pt-BR");

            const valueClass = transaction.type === "receita" ? "green" : "red";
            const signal = transaction.type === "receita" ? "+" : "−";

            return `
                <div class="item">
                    <span><strong>${escapeHTML(transaction.description)}</strong></span>
                    <span><b>${escapeHTML(transaction.category)}</b></span>
                    <span>${formattedDate}</span>
                    <strong class="${valueClass}">${signal} ${formatador.format(transaction.value)}</strong>
                    <span class="item-actions">
                        <button class="edit-button" type="button" onclick="editTransaction(${transaction.id})" aria-label="Editar lançamento">✎</button>
                        <button class="delete-button" type="button" onclick="del(${transaction.id})" aria-label="Excluir lançamento">×</button>
                    </span>
                </div>`;
        })
        .join("");
}

function sumByType(transactions, transactionType) {
    return transactions
        .filter(function (transaction) {
            return transaction.type === transactionType;
        })
        .reduce(function (total, transaction) {
            return total + transaction.value;
        }, 0);
}

/* ==================================================
   GRÁFICO
================================================== */

function renderChart() {
    const selectedMonth = chartMonth.value;
    const categoryTotals = {};

    data.filter(function (transaction) {
        return transaction.type === "despesa" &&
            (!selectedMonth || transaction.date.startsWith(selectedMonth));
    }).forEach(function (transaction) {
        categoryTotals[transaction.category] =
            (categoryTotals[transaction.category] || 0) + transaction.value;
    });

    const categories = Object.entries(categoryTotals).sort(function (first, second) {
        return second[1] - first[1];
    });

    if (categories.length === 0) {
        chartBars.innerHTML =
            '<div class="chart-empty">Nenhuma despesa encontrada neste mês.</div>';
        return;
    }

    const biggestValue = Math.max(...categories.map(function (item) {
        return item[1];
    }));

    chartBars.innerHTML = categories.map(function ([categoryName, categoryValue]) {
        const percentage = (categoryValue / biggestValue) * 100;

        return `
            <div class="chart-row">
                <span class="chart-category">${escapeHTML(categoryName)}</span>
                <div class="chart-track"><div class="chart-fill" style="width: ${percentage}%"></div></div>
                <strong class="chart-value">${formatador.format(categoryValue)}</strong>
            </div>`;
    }).join("");
}

/* ==================================================
   EXPORTAÇÃO PARA EXCEL
================================================== */

function exportToExcel() {
    const transactions = getFilteredTransactions();

    if (transactions.length === 0) {
        showToast("Não existem lançamentos para exportar.", "error");
        return;
    }

    if (typeof XLSX === "undefined") {
        showToast(
            "Não foi possível carregar o gerador de Excel. Verifique sua conexão.",
            "error"
        );
        return;
    }

    const spreadsheetRows = transactions.map(function (transaction) {
        return {
            Tipo: transaction.type === "receita" ? "Receita" : "Despesa",
            Descrição: protectSpreadsheetText(transaction.description),
            Categoria: protectSpreadsheetText(transaction.category),
            Data: new Date(transaction.date + "T12:00:00"),
            Valor: transaction.value
        };
    });

    const totalIncome = sumByType(transactions, "receita");
    const totalExpense = sumByType(transactions, "despesa");
    const selectedPeriod = filterMonth.value || "Todos os períodos";

    const summaryRows = [
        ["SMART SALDO — RESUMO"],
        ["Período", selectedPeriod],
        ["Total de receitas", totalIncome],
        ["Total de despesas", totalExpense],
        ["Saldo do período", totalIncome - totalExpense]
    ];

    const transactionsSheet = XLSX.utils.json_to_sheet(spreadsheetRows);
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);

    transactionsSheet["!cols"] = [
        { wch: 12 },
        { wch: 32 },
        { wch: 24 },
        { wch: 14 },
        { wch: 16 }
    ];

    summarySheet["!cols"] = [{ wch: 24 }, { wch: 20 }];

    for (let row = 2; row <= spreadsheetRows.length + 1; row += 1) {
        const dateCell = transactionsSheet[`D${row}`];
        const valueCell = transactionsSheet[`E${row}`];

        if (dateCell) {
            dateCell.z = "dd/mm/yyyy";
        }

        if (valueCell) {
            valueCell.z = 'R$ #,##0.00';
        }
    }

    ["B3", "B4", "B5"].forEach(function (cellAddress) {
        if (summarySheet[cellAddress]) {
            summarySheet[cellAddress].z = 'R$ #,##0.00';
        }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, "Lançamentos");
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo");

    XLSX.writeFile(
        workbook,
        `smart-saldo-${filterMonth.value || "todos"}.xlsx`
    );

    showToast("Planilha do Excel exportada!");
}

function protectSpreadsheetText(valueToProtect) {
    const text = String(valueToProtect);
    return /^[=+\-@]/.test(text) ? "'" + text : text;
}

/* ==================================================
   MODAL DE PRIVACIDADE E FEEDBACK
================================================== */

function closePrivacyModal(event) {
    if (event && event.target !== privacyModal) {
        return;
    }

    privacyModal.classList.add("hidden");
}

function showLoading(message) {
    loadingText.textContent = message;
    loadingScreen.classList.remove("hidden");
}

function hideLoading() {
    loadingScreen.classList.add("hidden");
}

function showToast(message, type = "success") {
    toast.textContent = message;
    toast.classList.toggle("error-toast", type === "error");
    toast.classList.remove("hidden");

    window.setTimeout(function () {
        toast.classList.add("hidden");
    }, 2500);
}

function showFormMessage(message, type = "error") {
    formMessage.textContent = message;
    formMessage.classList.toggle("success-message", type === "success");
}

function escapeHTML(text) {
    const element = document.createElement("div");
    element.textContent = text;
    return element.innerHTML;
}

render();
renderChart();
