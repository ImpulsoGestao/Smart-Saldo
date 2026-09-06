/* ==================================================
   ESTADO DO APLICATIVO
================================================== */

let data = [];
let recurringData = [];
let currentUserId = null;
let currentUserName = "";
let editingTransactionId = null;
let editingRecurringId = null;

const formatador = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

const now = new Date();
const today =
    now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0");
const currentMonth =
    now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");

/* ==================================================
   ELEMENTOS DA INTERFACE
================================================== */

const home = document.getElementById("home");
const list = document.getElementById("list");
const graph = document.getElementById("graph");
const recurring = document.getElementById("recurring");
const btnHome = document.getElementById("btnHome");
const btnList = document.getElementById("btnList");
const btnGraph = document.getElementById("btnGraph");
const btnRecurring = document.getElementById("btnRecurring");
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
const homeReminders = document.getElementById("homeReminders");
const recurringMonth = document.getElementById("recurringMonth");
const recurringIncome = document.getElementById("recurringIncome");
const recurringExpense = document.getElementById("recurringExpense");
const recurringReminders = document.getElementById("recurringReminders");
const recurringItems = document.getElementById("recurringItems");

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
const recurringModal = document.getElementById("recurringModal");
const recurringModalTitle = document.getElementById("recurringModalTitle");
const recurringForm = document.getElementById("recurringForm");
const recurringType = document.getElementById("recurringType");
const recurringDescription = document.getElementById("recurringDescription");
const recurringValue = document.getElementById("recurringValue");
const recurringDay = document.getElementById("recurringDay");
const recurringCategory = document.getElementById("recurringCategory");
const recurringStartMonth = document.getElementById("recurringStartMonth");
const recurringEndMonth = document.getElementById("recurringEndMonth");
const recurringFormMessage = document.getElementById("recurringFormMessage");
const saveRecurring = document.getElementById("saveRecurring");

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
recurringMonth.value = currentMonth;
date.value = today;
date.max = today;

dashboardMonth.addEventListener("change", render);
chartMonth.addEventListener("change", renderChart);
recurringMonth.addEventListener("change", renderRecurring);
recurringType.addEventListener("change", fillRecurringCategories);
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
            recurringData = [];
            render();
            renderChart();
            renderRecurring();
            return;
        }

        showLoading("Carregando seus lançamentos...");

        try {
            [data, recurringData] = await Promise.all([
                window.smartSaldoFirebase.loadTransactions(currentUserId),
                window.smartSaldoFirebase.loadRecurring(currentUserId)
            ]);
            render();
            renderChart();
            renderRecurring();
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
    recurring.classList.toggle("hidden", view !== "recurring");

    btnHome.classList.toggle("active", view === "home");
    btnList.classList.toggle("active", view === "list");
    btnGraph.classList.toggle("active", view === "graph");
    btnRecurring.classList.toggle("active", view === "recurring");

    if (view === "home") {
        eyebrow.textContent = "VISÃO GERAL";
        updateGreeting();
    } else if (view === "list") {
        eyebrow.textContent = "ORGANIZE SEU DINHEIRO";
        title.textContent = "Lançamentos";
    } else if (view === "graph") {
        eyebrow.textContent = "ANALISE SEUS GASTOS";
        title.textContent = "Gráficos";
        renderChart();
    } else {
        eyebrow.textContent = "ORGANIZE O QUE SE REPETE";
        title.textContent = "Lançamentos fixos";
        renderRecurring();
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

    renderHomeReminders();

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

    const chartColors = [
        "#10a77b",
        "#ef5b64",
        "#f2aa3c",
        "#4f7cff",
        "#8b5cf6",
        "#22a7b8",
        "#f07bb5",
        "#6f9f42",
        "#e67e38",
        "#64748b"
    ];

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

    const totalExpense = categories.reduce(function (total, item) {
        return total + item[1];
    }, 0);

    let accumulatedPercentage = 0;
    const gradientParts = categories.map(function (item, index) {
        const percentage = (item[1] / totalExpense) * 100;
        const start = accumulatedPercentage;
        accumulatedPercentage += percentage;
        const color = chartColors[index % chartColors.length];

        return `${color} ${start.toFixed(2)}% ${accumulatedPercentage.toFixed(2)}%`;
    });

    const legendItems = categories.map(function ([categoryName, categoryValue], index) {
        const percentage = (categoryValue / totalExpense) * 100;
        const color = chartColors[index % chartColors.length];

        return `
            <div class="legend-item">
                <span class="legend-color" style="background: ${color}"></span>
                <div class="legend-info">
                    <span class="legend-category">${escapeHTML(categoryName)}</span>
                    <span class="legend-percentage">${percentage.toFixed(1).replace(".", ",")}% do total</span>
                </div>
                <strong class="legend-value">${formatador.format(categoryValue)}</strong>
            </div>`;
    }).join("");

    chartBars.innerHTML = `
        <div class="chart-layout">
            <div class="donut-panel">
                <div
                    class="donut-chart"
                    style="background: conic-gradient(from -90deg, ${gradientParts.join(", ")})"
                    role="img"
                    aria-label="Gráfico de despesas por categoria. Total: ${formatador.format(totalExpense)}"
                >
                    <div class="donut-center">
                        <span>Total</span>
                        <strong>${formatador.format(totalExpense)}</strong>
                    </div>
                </div>
            </div>
            <div class="chart-legend" aria-label="Legenda do gráfico">
                ${legendItems}
            </div>
        </div>`;
}

/* ==================================================
   RECEITAS E DESPESAS FIXAS
================================================== */

function fillRecurringCategories() {
    const categories = recurringType.value === "receita" ? incomeCategories : expenseCategories;
    recurringCategory.innerHTML = categories.map(function (categoryName) {
        return `<option value="${escapeHTML(categoryName)}">${escapeHTML(categoryName)}</option>`;
    }).join("");
    saveRecurring.className = recurringType.value === "receita" ? "save income" : "save expense";
}

function openRecurringModal(recurringId = null) {
    editingRecurringId = recurringId;
    recurringFormMessage.textContent = "";
    const item = recurringData.find(function (entry) { return entry.id === recurringId; });

    recurringModalTitle.textContent = item ? "Editar lançamento fixo" : "Novo lançamento fixo";
    recurringForm.reset();
    recurringType.value = item ? item.type : "receita";
    fillRecurringCategories();
    recurringDescription.value = item ? item.description : "";
    recurringValue.value = item ? item.value : "";
    recurringDay.value = item ? item.day : "";
    recurringStartMonth.value = item ? item.startMonth : currentMonth;
    recurringEndMonth.value = item ? (item.endMonth || "") : "";
    if (item) recurringCategory.value = item.category;
    saveRecurring.textContent = item ? "Salvar alterações futuras" : "Salvar lançamento fixo";
    recurringModal.classList.remove("hidden");
    recurringDescription.focus();
}

function closeRecurringModal(event) {
    if (event && event.target !== recurringModal) return;
    recurringModal.classList.add("hidden");
    editingRecurringId = null;
    recurringFormMessage.textContent = "";
}

recurringForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!currentUserId) return;

    const cleanDescription = recurringDescription.value.trim().replace(/\s+/g, " ");
    const numericValue = Number(recurringValue.value);
    const day = Number(recurringDay.value);
    const startMonth = recurringStartMonth.value;
    const endMonth = recurringEndMonth.value;

    if (cleanDescription.length < 2 || cleanDescription.length > 80) {
        showRecurringFormMessage("A descrição deve ter entre 2 e 80 caracteres."); return;
    }
    if (!Number.isFinite(numericValue) || numericValue <= 0 || numericValue > 999999999.99) {
        showRecurringFormMessage("Digite um valor válido maior que zero."); return;
    }
    if (!Number.isInteger(day) || day < 1 || day > 31) {
        showRecurringFormMessage("Escolha um dia entre 1 e 31."); return;
    }
    if (!/^\d{4}-\d{2}$/.test(startMonth) || (endMonth && endMonth < startMonth)) {
        showRecurringFormMessage("Confira os meses de início e término."); return;
    }

    const previous = recurringData.find(function (entry) { return entry.id === editingRecurringId; });
    const item = {
        id: editingRecurringId ?? Date.now(),
        type: recurringType.value,
        description: cleanDescription,
        value: Math.round(numericValue * 100) / 100,
        day,
        category: recurringCategory.value,
        startMonth,
        endMonth,
        active: previous ? previous.active !== false : true,
        createdAt: previous ? previous.createdAt : Date.now()
    };
    const wasEditingRecurring = editingRecurringId !== null;

    saveRecurring.disabled = true;
    showRecurringFormMessage("Salvando...", "success");
    try {
        await window.smartSaldoFirebase.saveRecurring(currentUserId, item);
        recurringData = editingRecurringId === null
            ? [item, ...recurringData]
            : recurringData.map(function (entry) { return entry.id === editingRecurringId ? item : entry; });
        closeRecurringModal();
        renderRecurring();
        render();
        showToast(wasEditingRecurring ? "Lançamento fixo atualizado!" : "Lançamento fixo criado!");
    } catch (error) {
        console.error("Erro ao salvar lançamento fixo:", error);
        showRecurringFormMessage("Não foi possível salvar. Verifique sua conexão.");
    } finally {
        saveRecurring.disabled = false;
    }
});

function getRecurringForMonth(month) {
    return recurringData.filter(function (item) {
        return item.active !== false && item.startMonth <= month && (!item.endMonth || item.endMonth >= month);
    });
}

function getOccurrenceDate(item, month) {
    const [year, monthNumber] = month.split("-").map(Number);
    const lastDay = new Date(year, monthNumber, 0).getDate();
    return `${month}-${String(Math.min(Number(item.day), lastDay)).padStart(2, "0")}`;
}

function getConfirmedTransaction(item, month) {
    return data.find(function (transaction) {
        return String(transaction.recurringId || "") === String(item.id) && transaction.recurringMonth === month;
    });
}

function getOccurrenceStatus(item, month) {
    if (getConfirmedTransaction(item, month)) return "confirmed";
    const occurrenceDate = getOccurrenceDate(item, month);
    if (occurrenceDate < today) return "late";
    if (occurrenceDate === today) return "today";
    return "upcoming";
}

async function confirmRecurring(recurringId, editValue = false, monthOverride = null) {
    const item = recurringData.find(function (entry) { return entry.id === recurringId; });
    const month = monthOverride || recurringMonth.value || currentMonth;
    if (!item || !currentUserId || getConfirmedTransaction(item, month)) {
        showToast("Esse lançamento já foi confirmado.", "error"); return;
    }

    let confirmedValue = item.value;
    if (editValue) {
        const informedValue = window.prompt("Informe o valor recebido ou pago neste mês:", String(item.value));
        if (informedValue === null) return;
        confirmedValue = Number(String(informedValue).replace(",", "."));
        if (!Number.isFinite(confirmedValue) || confirmedValue <= 0) {
            showToast("Digite um valor válido.", "error"); return;
        }
    }

    const transaction = {
        id: Date.now(), type: item.type, description: item.description,
        value: Math.round(confirmedValue * 100) / 100,
        date: getOccurrenceDate(item, month), category: item.category,
        recurringId: item.id, recurringMonth: month
    };

    showLoading(item.type === "receita" ? "Confirmando recebimento..." : "Confirmando pagamento...");
    try {
        await window.smartSaldoFirebase.saveTransaction(currentUserId, transaction);
        data.unshift(transaction);
        render(); renderChart(); renderRecurring();
        showToast(item.type === "receita" ? "Recebimento confirmado!" : "Pagamento confirmado!");
    } catch (error) {
        console.error("Erro ao confirmar lançamento fixo:", error);
        showToast("Não foi possível confirmar.", "error");
    } finally { hideLoading(); }
}

async function cancelRecurringConfirmation(recurringId, monthOverride = null) {
    const item = recurringData.find(function (entry) { return entry.id === recurringId; });
    const month = monthOverride || recurringMonth.value || currentMonth;
    const confirmedTransaction = item ? getConfirmedTransaction(item, month) : null;

    if (!item || !confirmedTransaction || !currentUserId) {
        showToast("Não encontramos essa confirmação.", "error");
        return;
    }

    const confirmed = window.confirm(
        `Cancelar a confirmação de "${item.description}" neste mês? O lançamento será retirado do saldo.`
    );

    if (!confirmed) return;

    showLoading("Cancelando confirmação...");
    try {
        await window.smartSaldoFirebase.deleteTransaction(currentUserId, confirmedTransaction.id);
        data = data.filter(function (transaction) {
            return transaction.id !== confirmedTransaction.id;
        });
        render();
        renderChart();
        renderRecurring();
        showToast("Confirmação cancelada e saldo atualizado!");
    } catch (error) {
        console.error("Erro ao cancelar confirmação:", error);
        showToast("Não foi possível cancelar a confirmação.", "error");
    } finally {
        hideLoading();
    }
}

async function toggleRecurring(recurringId) {
    const item = recurringData.find(function (entry) { return entry.id === recurringId; });
    if (!item || !currentUserId) return;
    const updated = { ...item, active: item.active === false };
    try {
        await window.smartSaldoFirebase.saveRecurring(currentUserId, updated);
        recurringData = recurringData.map(function (entry) { return entry.id === recurringId ? updated : entry; });
        renderRecurring(); render();
        showToast(updated.active ? "Lançamento reativado!" : "Lançamento pausado!");
    } catch (error) { showToast("Não foi possível alterar o lançamento.", "error"); }
}

async function deleteRecurringItem(recurringId) {
    if (!currentUserId || !window.confirm("Excluir este lançamento fixo? Os meses já confirmados serão preservados.")) return;
    try {
        await window.smartSaldoFirebase.deleteRecurring(currentUserId, recurringId);
        recurringData = recurringData.filter(function (entry) { return entry.id !== recurringId; });
        renderRecurring(); render(); showToast("Lançamento fixo excluído!");
    } catch (error) { showToast("Não foi possível excluir.", "error"); }
}

function occurrenceCard(item, month, compact = false) {
    const status = getOccurrenceStatus(item, month);
    const statusLabels = { confirmed: "Confirmado", late: "Atrasado", today: "Vence hoje", upcoming: "Próximo" };
    const actionLabel = item.type === "receita" ? "Confirmar recebimento" : "Confirmar pagamento";
    const actions = status === "confirmed"
        ? `<div class="reminder-actions"><button class="cancel-confirmation" type="button" onclick="cancelRecurringConfirmation(${Number(item.id)}, '${month}')">Cancelar confirmação</button></div>`
        : `<div class="reminder-actions"><button type="button" onclick="confirmRecurring(${Number(item.id)}, false, '${month}')">${actionLabel}</button><button class="text-button" type="button" onclick="confirmRecurring(${Number(item.id)}, true, '${month}')">Editar valor</button></div>`;
    return `<div class="reminder-item ${status} ${compact ? "compact" : ""}">
        <span class="reminder-icon">${item.type === "receita" ? "↗" : "↘"}</span>
        <div class="reminder-info"><strong>${escapeHTML(item.description)}</strong><span>${escapeHTML(item.category)} · dia ${Number(item.day)} · ${formatador.format(item.value)}</span></div>
        <span class="status-badge ${status}">${statusLabels[status]}</span>
        ${actions}
    </div>`;
}

function renderHomeReminders() {
    const dueItems = getRecurringForMonth(currentMonth).filter(function (item) {
        const status = getOccurrenceStatus(item, currentMonth);
        return status === "today" || status === "late";
    });
    homeReminders.innerHTML = dueItems.length
        ? dueItems.map(function (item) { return occurrenceCard(item, currentMonth, true); }).join("")
        : '<div class="empty reminder-empty">Nenhuma confirmação pendente para hoje.</div>';
}

function renderRecurring() {
    const month = recurringMonth.value || currentMonth;
    const monthItems = getRecurringForMonth(month);
    recurringIncome.textContent = formatador.format(sumByType(monthItems, "receita"));
    recurringExpense.textContent = formatador.format(sumByType(monthItems, "despesa"));
    recurringReminders.innerHTML = monthItems.length
        ? monthItems.map(function (item) { return occurrenceCard(item, month); }).join("")
        : '<div class="empty">Nenhum lançamento fixo previsto para este mês.</div>';

    recurringItems.innerHTML = recurringData.length ? recurringData.map(function (item) {
        const period = `${item.startMonth.split("-").reverse().join("/")} ${item.endMonth ? "até " + item.endMonth.split("-").reverse().join("/") : "em diante"}`;
        return `<div class="recurring-rule ${item.active === false ? "paused" : ""}">
            <span class="recurring-type ${item.type}">${item.type === "receita" ? "Receita" : "Despesa"}</span>
            <div><strong>${escapeHTML(item.description)}</strong><span>${escapeHTML(item.category)} · todo dia ${Number(item.day)} · ${period}</span></div>
            <strong class="${item.type === "receita" ? "green" : "red"}">${formatador.format(item.value)}</strong>
            <span class="rule-actions"><button type="button" onclick="openRecurringModal(${Number(item.id)})">Editar</button><button type="button" onclick="toggleRecurring(${Number(item.id)})">${item.active === false ? "Ativar" : "Pausar"}</button><button class="delete-rule" type="button" onclick="deleteRecurringItem(${Number(item.id)})">Excluir</button></span>
        </div>`;
    }).join("") : '<div class="empty">Você ainda não cadastrou lançamentos fixos.</div>';
}

function showRecurringFormMessage(message, type = "error") {
    recurringFormMessage.textContent = message;
    recurringFormMessage.classList.toggle("success-message", type === "success");
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
renderRecurring();
