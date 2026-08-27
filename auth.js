import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

    import {
        getAuth,
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword,
        onAuthStateChanged,
        signOut,
    } from
        "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

/* Configuração do Smart Saldo no Firebase */
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

/* Elementos da tela */
const authScreen = document.getElementById("authScreen");
const appContent = document.getElementById("appContent");
const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const togglePassword =
    document.getElementById("togglePassword");
const authTitle = document.getElementById("authTitle");
const authSubmit = document.getElementById("authSubmit");
const authToggle = document.getElementById("authToggle");
const authMessage = document.getElementById("authMessage");
const logoutButton =
    document.getElementById("logoutButton");
let createAccountMode = false;
togglePassword.addEventListener("click", function () {
    const passwordIsHidden =
        authPassword.type === "password";

    authPassword.type =
        passwordIsHidden ? "text" : "password";

    togglePassword.textContent =
        passwordIsHidden ? "🙈" : "👁";

    togglePassword.setAttribute(
        "aria-label",
        passwordIsHidden ? "Ocultar senha" : "Mostrar senha"
    );

    togglePassword.title =
        passwordIsHidden ? "Ocultar senha" : "Mostrar senha";
});

/* Alterna entre entrar e criar conta */
authToggle.addEventListener("click", function () {
    createAccountMode = !createAccountMode;
    authMessage.textContent = "";

    if (createAccountMode) {
        authTitle.textContent = "Criar minha conta";
        authSubmit.textContent = "Criar conta";
        authToggle.textContent = "Já tenho uma conta";
        authPassword.autocomplete = "new-password";
    } else {
        authTitle.textContent = "Entrar na sua conta";
        authSubmit.textContent = "Entrar";
        authToggle.textContent = "Ainda não tenho uma conta";
        authPassword.autocomplete = "current-password";
    }
});

/* Cadastro ou login */
authForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = authEmail.value.trim();
    const password = authPassword.value;

    authMessage.textContent = "";
    authSubmit.disabled = true;
    authSubmit.textContent = "Aguarde...";

    try {
        if (createAccountMode) {
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
        } else {
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );
        }

        authForm.reset();
    } catch (error) {
        authMessage.textContent = getAuthErrorMessage(error.code);
    } finally {
        authSubmit.disabled = false;
        authSubmit.textContent =
            createAccountMode ? "Criar conta" : "Entrar";
    }
});

/* Mostra o app somente para usuários autenticados */
onAuthStateChanged(auth, function (user) {
    if (user) {
        authScreen.classList.add("hidden");
        appContent.classList.remove("hidden");
    } else {
        appContent.classList.add("hidden");
        authScreen.classList.remove("hidden");
    }
});

logoutButton.addEventListener("click", async function () {
    try {
        await signOut(auth);
    } catch (error) {
        alert("Não foi possível sair da conta. Tente novamente.");
    }
});


/* Mensagens em português */
function getAuthErrorMessage(errorCode) {
    const messages = {
        "auth/email-already-in-use":
            "Este e-mail já possui uma conta.",

        "auth/invalid-email":
            "Digite um endereço de e-mail válido.",

        "auth/weak-password":
            "A senha precisa ter pelo menos 6 caracteres.",

        "auth/invalid-credential":
            "E-mail ou senha incorretos.",

        "auth/too-many-requests":
            "Muitas tentativas. Aguarde e tente novamente.",

        "auth/network-request-failed":
            "Verifique sua conexão com a internet."
    };

    return messages[errorCode] ||
        "Não foi possível concluir. Tente novamente.";
}