import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updateProfile,
    sendPasswordResetEmail,
    sendEmailVerification,
    reload,
    reauthenticateWithCredential,
    EmailAuthProvider,
    deleteUser
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
    initializeAppCheck,
    ReCaptchaEnterpriseProvider
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app-check.js";

/* ==================================================
   CONFIGURAÇÃO DO FIREBASE
================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyDF0MtvMYb-NigaGDnQq3FLvr6K5e4iP7Q",
    authDomain: "smart-saldo.firebaseapp.com",
    projectId: "smart-saldo",
    storageBucket: "smart-saldo.firebasestorage.app",
    messagingSenderId: "725454529168",
    appId: "1:725454529168:web:8d2485884d6a4b08d76e15"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

/*
   APP CHECK
   Depois de criar a chave reCAPTCHA v3 no Firebase, cole-a abaixo.
   Enquanto estiver vazio, o App Check permanece desativado.
*/
const APP_CHECK_SITE_KEY = "6LfHsJstAAAAAHE9iJYZYtabXneaCCsNBnlxjI4w";

if (APP_CHECK_SITE_KEY) {
    initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
        isTokenAutoRefreshEnabled: true
    });
}

/* ==================================================
   ACESSO AO FIRESTORE PELO SCRIPT PRINCIPAL
================================================== */

window.smartSaldoFirebase = {
    async loadTransactions(userId) {
        const reference = collection(db, "users", userId, "transactions");
        const snapshot = await getDocs(reference);

        return snapshot.docs
            .map(function (transactionDocument) {
                return transactionDocument.data();
            })
            .sort(function (first, second) {
                return second.id - first.id;
            });
    },

    async saveTransaction(userId, transaction) {
        const reference = doc(
            db,
            "users",
            userId,
            "transactions",
            String(transaction.id)
        );

        await setDoc(reference, transaction);
    },

    async deleteTransaction(userId, transactionId) {
        const reference = doc(
            db,
            "users",
            userId,
            "transactions",
            String(transactionId)
        );

        await deleteDoc(reference);
    },

    async deleteAllTransactions(userId) {
        const reference = collection(db, "users", userId, "transactions");
        const snapshot = await getDocs(reference);

        await Promise.all(
            snapshot.docs.map(function (transactionDocument) {
                return deleteDoc(transactionDocument.ref);
            })
        );
    }
};

/* ==================================================
   ELEMENTOS DA INTERFACE
================================================== */

const authScreen = document.getElementById("authScreen");
const verificationScreen = document.getElementById("verificationScreen");
const appContent = document.getElementById("appContent");
const authForm = document.getElementById("authForm");
const authNameLabel = document.getElementById("authNameLabel");
const authName = document.getElementById("authName");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const togglePassword = document.getElementById("togglePassword");
const authTitle = document.getElementById("authTitle");
const authSubmit = document.getElementById("authSubmit");
const authToggle = document.getElementById("authToggle");
const authMessage = document.getElementById("authMessage");
const resetPasswordButton = document.getElementById("resetPassword");
const logoutButton = document.getElementById("logoutButton");

const verificationEmail = document.getElementById("verificationEmail");
const verificationMessage = document.getElementById("verificationMessage");
const checkVerificationButton = document.getElementById("checkVerification");
const resendVerificationButton = document.getElementById("resendVerification");
const verificationLogoutButton = document.getElementById("verificationLogout");

const profileButton = document.getElementById("profileButton");
const profileModal = document.getElementById("profileModal");
const profileForm = document.getElementById("profileForm");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileMessage = document.getElementById("profileMessage");
const deleteAccountPassword = document.getElementById("deleteAccountPassword");
const deleteAccountButton = document.getElementById("deleteAccountButton");

let createAccountMode = false;

/* ==================================================
   LOGIN, CADASTRO E RECUPERAÇÃO DE SENHA
================================================== */

togglePassword.addEventListener("click", function () {
    const isHidden = authPassword.type === "password";

    authPassword.type = isHidden ? "text" : "password";
    togglePassword.textContent = isHidden ? "🙈" : "👁";
    togglePassword.setAttribute(
        "aria-label",
        isHidden ? "Ocultar senha" : "Mostrar senha"
    );
});

authToggle.addEventListener("click", function () {
    createAccountMode = !createAccountMode;
    showAuthMessage("");

    authNameLabel.classList.toggle("hidden", !createAccountMode);
    authName.required = createAccountMode;
    resetPasswordButton.classList.toggle("hidden", createAccountMode);

    authTitle.textContent = createAccountMode
        ? "Criar minha conta"
        : "Entrar na sua conta";

    authSubmit.textContent = createAccountMode ? "Criar conta" : "Entrar";
    authToggle.textContent = createAccountMode
        ? "Já tenho uma conta"
        : "Ainda não tenho uma conta";

    authPassword.autocomplete = createAccountMode
        ? "new-password"
        : "current-password";

    if (!createAccountMode) {
        authName.value = "";
    }
});

authForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = authEmail.value.trim().toLowerCase();
    const password = authPassword.value;
    const name = normalizeName(authName.value);

    if (createAccountMode && !isValidName(name)) {
        showAuthMessage("Digite um nome com pelo menos 2 caracteres.");
        return;
    }

    setAuthLoading(true);
    showAuthMessage("");

    try {
        if (createAccountMode) {
            const credential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            await updateProfile(credential.user, { displayName: name });
            await sendEmailVerification(credential.user);
            authForm.reset();
        } else {
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );
        }
    } catch (error) {
        showAuthMessage(getAuthErrorMessage(error.code));
    } finally {
        setAuthLoading(false);
    }
});

resetPasswordButton.addEventListener("click", async function () {
    const email = authEmail.value.trim().toLowerCase();

    if (!email) {
        showAuthMessage("Digite seu e-mail antes de solicitar uma nova senha.");
        authEmail.focus();
        return;
    }

    resetPasswordButton.disabled = true;
    showAuthMessage("Enviando e-mail...", "success");

    try {
        await sendPasswordResetEmail(auth, email);
        showAuthMessage(
            "E-mail enviado! Verifique sua caixa de entrada e a pasta de spam.",
            "success"
        );
    } catch (error) {
        showAuthMessage(getAuthErrorMessage(error.code));
    } finally {
        resetPasswordButton.disabled = false;
    }
});

/* ==================================================
   VERIFICAÇÃO OBRIGATÓRIA DO E-MAIL
================================================== */

onAuthStateChanged(auth, async function (user) {
    await handleAuthenticatedUser(user);
});

async function handleAuthenticatedUser(user) {
    if (!user) {
        showOnlyScreen("auth");
        dispatchAuthChange(null);
        return;
    }

    await reload(user);

    if (!user.emailVerified) {
        verificationEmail.textContent = user.email || "seu e-mail";
        showOnlyScreen("verification");
        dispatchAuthChange(null);
        return;
    }

    let userName = normalizeName(user.displayName || "");

    if (!isValidName(userName)) {
        const informedName = window.prompt("Digite seu nome para continuar:");
        userName = normalizeName(informedName || "");

        if (!isValidName(userName)) {
            await signOut(auth);
            showAuthMessage("Digite um nome válido para continuar.");
            return;
        }

        await updateProfile(user, { displayName: userName });
    }

    showOnlyScreen("app");
    dispatchAuthChange(user, userName);
}

checkVerificationButton.addEventListener("click", async function () {
    const user = auth.currentUser;

    if (!user) {
        showOnlyScreen("auth");
        return;
    }

    checkVerificationButton.disabled = true;
    showVerificationMessage("Verificando...", "success");

    try {
        await reload(user);

        if (!user.emailVerified) {
            showVerificationMessage(
                "O e-mail ainda não foi confirmado. Abra o link recebido e tente novamente."
            );
            return;
        }

        showVerificationMessage("E-mail confirmado!", "success");
        await handleAuthenticatedUser(user);
    } catch (error) {
        showVerificationMessage(getAuthErrorMessage(error.code));
    } finally {
        checkVerificationButton.disabled = false;
    }
});

resendVerificationButton.addEventListener("click", async function () {
    const user = auth.currentUser;

    if (!user) {
        showOnlyScreen("auth");
        return;
    }

    resendVerificationButton.disabled = true;

    try {
        await sendEmailVerification(user);
        showVerificationMessage(
            "Novo e-mail enviado. Verifique também a pasta de spam.",
            "success"
        );
    } catch (error) {
        showVerificationMessage(getAuthErrorMessage(error.code));
    } finally {
        resendVerificationButton.disabled = false;
    }
});

verificationLogoutButton.addEventListener("click", function () {
    signOut(auth);
});

logoutButton.addEventListener("click", async function () {
    try {
        await signOut(auth);
    } catch (error) {
        alert("Não foi possível sair da conta. Tente novamente.");
    }
});

/* ==================================================
   PERFIL E EXCLUSÃO DA CONTA
================================================== */

profileButton.addEventListener("click", function () {
    const user = auth.currentUser;

    if (!user) {
        return;
    }

    profileName.value = user.displayName || "";
    profileEmail.value = user.email || "";
    deleteAccountPassword.value = "";
    showProfileMessage("");
    profileModal.classList.remove("hidden");
});

window.closeProfileModal = function (event) {
    if (event && event.target !== profileModal) {
        return;
    }

    profileModal.classList.add("hidden");
};

profileForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const user = auth.currentUser;
    const newName = normalizeName(profileName.value);

    if (!user || !isValidName(newName)) {
        showProfileMessage("Digite um nome com pelo menos 2 caracteres.");
        return;
    }

    try {
        await updateProfile(user, { displayName: newName });
        dispatchAuthChange(user, newName);
        showProfileMessage("Nome atualizado com sucesso.", "success");
    } catch (error) {
        showProfileMessage(getAuthErrorMessage(error.code));
    }
});

deleteAccountButton.addEventListener("click", async function () {
    const user = auth.currentUser;
    const password = deleteAccountPassword.value;

    if (!user || !user.email) {
        return;
    }

    if (!password) {
        showProfileMessage("Digite sua senha atual para excluir a conta.");
        return;
    }

    const confirmed = window.confirm(
        "Deseja excluir permanentemente sua conta e todos os lançamentos?"
    );

    if (!confirmed) {
        return;
    }

    deleteAccountButton.disabled = true;
    showProfileMessage("Excluindo conta e lançamentos...", "success");

    try {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        await window.smartSaldoFirebase.deleteAllTransactions(user.uid);
        await deleteUser(user);
        profileModal.classList.add("hidden");
        alert("Sua conta e seus lançamentos foram excluídos.");
    } catch (error) {
        showProfileMessage(getAuthErrorMessage(error.code));
    } finally {
        deleteAccountButton.disabled = false;
    }
});

/* ==================================================
   FUNÇÕES AUXILIARES
================================================== */

function showOnlyScreen(screen) {
    authScreen.classList.toggle("hidden", screen !== "auth");
    verificationScreen.classList.toggle("hidden", screen !== "verification");
    appContent.classList.toggle("hidden", screen !== "app");
}

function dispatchAuthChange(user, userName = "") {
    window.dispatchEvent(
        new CustomEvent("smart-saldo-auth-changed", {
            detail: {
                userId: user ? user.uid : null,
                userName,
                userEmail: user ? user.email : ""
            }
        })
    );
}

function normalizeName(name) {
    return name.trim().replace(/\s+/g, " ");
}

function isValidName(name) {
    return name.length >= 2 && name.length <= 50;
}

function setAuthLoading(isLoading) {
    authSubmit.disabled = isLoading;
    authSubmit.textContent = isLoading
        ? "Aguarde..."
        : createAccountMode ? "Criar conta" : "Entrar";
}

function showAuthMessage(message, type = "error") {
    authMessage.textContent = message;
    authMessage.classList.toggle("success-message", type === "success");
}

function showVerificationMessage(message, type = "error") {
    verificationMessage.textContent = message;
    verificationMessage.classList.toggle("success-message", type === "success");
}

function showProfileMessage(message, type = "error") {
    profileMessage.textContent = message;
    profileMessage.classList.toggle("success-message", type === "success");
}

function getAuthErrorMessage(errorCode) {
    const messages = {
        "auth/email-already-in-use": "Este e-mail já possui uma conta.",
        "auth/invalid-email": "Digite um endereço de e-mail válido.",
        "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
        "auth/invalid-credential": "E-mail ou senha incorretos.",
        "auth/wrong-password": "A senha atual está incorreta.",
        "auth/too-many-requests": "Muitas tentativas. Aguarde e tente novamente.",
        "auth/network-request-failed": "Verifique sua conexão com a internet.",
        "auth/requires-recent-login": "Saia, entre novamente e repita esta ação.",
        "auth/user-token-expired": "Sua sessão expirou. Entre novamente.",
        "auth/invalid-action-code": "Este link expirou ou já foi utilizado."
    };

    return messages[errorCode] || "Não foi possível concluir. Tente novamente.";
}
