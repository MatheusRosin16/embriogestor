/* ============================================================
   EmbrioGestor - Controle de acesso
   Primeira versão: login local por usuário e senha
   ============================================================ */

const EG_AUTH_KEY = "embriogestor_auth";
const EG_USUARIOS_KEY = "embriogestor_usuarios";

function egUsuarios() {
  try {
    return JSON.parse(localStorage.getItem(EG_USUARIOS_KEY)) || [];
  } catch {
    return [];
  }
}

function egSalvarUsuarios(lista) {
  localStorage.setItem(EG_USUARIOS_KEY, JSON.stringify(lista));
}

function egSessaoAtiva() {
  try {
    return JSON.parse(sessionStorage.getItem(EG_AUTH_KEY));
  } catch {
    return null;
  }
}

function egSalvarSessao(usuario) {
  sessionStorage.setItem(
    EG_AUTH_KEY,
    JSON.stringify({
      id: usuario.id,
      nome: usuario.nome,
      usuario: usuario.usuario,
      perfil: usuario.perfil,
      entrada: new Date().toISOString()
    })
  );
}

function egSair() {
  sessionStorage.removeItem(EG_AUTH_KEY);
  location.reload();
}

async function egHash(texto) {
  const bytes = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/* PRIMEIRO ACESSO */

function egPrimeiroAcesso() {
  return egUsuarios().length === 0;
}

async function egCriarAdministrador() {

  const nome = document.getElementById("egNovoNome").value.trim();
  const usuario = document.getElementById("egNovoUsuario").value.trim();
  const senha = document.getElementById("egNovaSenha").value;
  const confirma = document.getElementById("egConfirmaSenha").value;

  if (!nome || !usuario || !senha) {
    alert("Preencha todos os campos.");
    return;
  }

  if (senha.length < 6) {
    alert("A senha deve possuir pelo menos 6 caracteres.");
    return;
  }

  if (senha !== confirma) {
    alert("As senhas não conferem.");
    return;
  }

  const novo = {
    id: "USR00001",
    nome,
    usuario: usuario.toLowerCase(),
    senhaHash: await egHash(senha),
    perfil: "Administrador",
    ativo: true,
    criadoEm: new Date().toISOString()
  };

  egSalvarUsuarios([novo]);
  egSalvarSessao(novo);

  location.reload();
}

/* LOGIN */

async function egEntrar() {

  const usuarioInformado =
    document.getElementById("egUsuario").value.trim().toLowerCase();

  const senha =
    document.getElementById("egSenha").value;

  if (!usuarioInformado || !senha) {
    egMensagem("Informe usuário e senha.");
    return;
  }

  const usuarios = egUsuarios();

  const usuario = usuarios.find(
    u =>
      u.ativo !== false &&
      String(u.usuario).toLowerCase() === usuarioInformado
  );

  if (!usuario) {
    egMensagem("Usuário não encontrado.");
    return;
  }

  const senhaHash = await egHash(senha);

  if (senhaHash !== usuario.senhaHash) {
    egMensagem("Senha incorreta.");
    return;
  }

  egSalvarSessao(usuario);

  location.reload();
}

function egMensagem(texto) {
  const el = document.getElementById("egLoginMensagem");

  if (el) {
    el.textContent = texto;
    el.style.display = "block";
  }
}

/* MOSTRAR / ESCONDER SENHA */

function egMostrarSenha() {

  const campo = document.getElementById("egSenha");

  if (!campo) return;

  campo.type =
    campo.type === "password"
      ? "text"
      : "password";
}

/* TELA PRIMEIRO ADMIN */

function egTelaPrimeiroAcesso() {

  document.body.innerHTML = `
    <div class="eg-login-page">

      <div class="eg-login-card">

        <div class="eg-login-brand">
          <img src="logo-seminna.png" alt="Sêminna">
          <h1>EmbrioGestor</h1>
          <p>Sistema de Gestão de Produção de Embriões</p>
        </div>

        <h2>Configuração inicial</h2>

        <p class="eg-login-sub">
          Crie o primeiro usuário administrador do sistema.
        </p>

        <label>Nome</label>
        <input
          id="egNovoNome"
          type="text"
          placeholder="Nome do administrador"
        >

        <label>Usuário</label>
        <input
          id="egNovoUsuario"
          type="text"
          placeholder="Escolha um usuário"
        >

        <label>Senha</label>
        <input
          id="egNovaSenha"
          type="password"
          placeholder="Mínimo 6 caracteres"
        >

        <label>Confirmar senha</label>
        <input
          id="egConfirmaSenha"
          type="password"
          placeholder="Digite novamente"
        >

        <button
          class="eg-login-button"
          onclick="egCriarAdministrador()">
          CRIAR ADMINISTRADOR
        </button>

      </div>

    </div>
  `;
}

/* TELA DE LOGIN */

function egTelaLogin() {

  document.body.innerHTML = `
    <div class="eg-login-page">

      <div class="eg-login-card">

        <div class="eg-login-brand">

          <img
            src="logo-seminna.png"
            alt="Sêminna"
          >

          <h1>EmbrioGestor</h1>

          <p>
            Sistema de Gestão de Produção de Embriões
          </p>

        </div>

        <h2>Acesse sua conta</h2>

        <p class="eg-login-sub">
          Entre no EmbrioGestor para gerenciar
          cadastros, produções e transferências.
        </p>

        <label>USUÁRIO</label>

        <input
          id="egUsuario"
          type="text"
          autocomplete="username"
          placeholder="Digite seu usuário"
        >

        <label>SENHA</label>

        <div class="eg-password-wrap">

          <input
            id="egSenha"
            type="password"
            autocomplete="current-password"
            placeholder="Digite sua senha"
            onkeydown="
              if(event.key==='Enter'){
                egEntrar()
              }
            "
          >

          <button
            type="button"
            class="eg-eye"
            onclick="egMostrarSenha()">
            👁
          </button>

        </div>

        <div
          id="egLoginMensagem"
          class="eg-login-error">
        </div>

        <button
          class="eg-login-button"
          onclick="egEntrar()">
          ENTRAR
        </button>

        <div class="eg-login-security">

          <strong>
            Seus dados sempre protegidos
          </strong>

          <span>
            Backup e sincronização disponíveis
            através do Google Drive.
          </span>

        </div>

      </div>

      <footer class="eg-login-footer">

        <div>
          <strong>Sêminna</strong>
          <small>
            Biotecnologia em Reprodução Animal
          </small>
        </div>

        <div>
          🔒 Sistema exclusivo para profissionais autorizados
        </div>

        <div>
          EmbrioGestor
        </div>

      </footer>

    </div>
  `;
}

/* INICIALIZAÇÃO */

document.addEventListener("DOMContentLoaded", () => {

  if (egPrimeiroAcesso()) {
    egTelaPrimeiroAcesso();
    return;
  }

  if (!egSessaoAtiva()) {
    egTelaLogin();
    return;
  }

});
