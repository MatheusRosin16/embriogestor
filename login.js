/* ============================================================
   EmbrioGestor - Controle de acesso local
   ============================================================ */

const EG_AUTH_KEY = "embriogestor_auth";
const EG_USUARIOS_KEY = "embriogestor_usuarios";

function egUsuarios() {
  try { return JSON.parse(localStorage.getItem(EG_USUARIOS_KEY)) || []; }
  catch { return []; }
}

function egSalvarUsuarios(lista) {
  localStorage.setItem(EG_USUARIOS_KEY, JSON.stringify(lista));
}

function egSessaoAtiva() {
  try { return JSON.parse(sessionStorage.getItem(EG_AUTH_KEY)); }
  catch { return null; }
}

function egSalvarSessao(usuario) {
  sessionStorage.setItem(EG_AUTH_KEY, JSON.stringify({
    id: usuario.id,
    nome: usuario.nome,
    usuario: usuario.usuario,
    perfil: usuario.perfil,
    entrada: new Date().toISOString()
  }));
}

function egSair() {
  sessionStorage.removeItem(EG_AUTH_KEY);
  location.reload();
}

async function egHash(texto) {
  const bytes = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function egPrimeiroAcesso() { return egUsuarios().length === 0; }

function egMensagem(texto) {
  const el = document.getElementById("egLoginMensagem");
  if (!el) return;
  el.textContent = texto;
  el.hidden = false;
}

function egMostrarSenha(id="egSenha") {
  const campo = document.getElementById(id);
  if (campo) campo.type = campo.type === "password" ? "text" : "password";
}

function egFecharOverlay() {
  document.getElementById("egAuthOverlay")?.remove();
  document.documentElement.classList.remove("eg-auth-locked");
  document.body.classList.remove("eg-auth-locked");
}

function egCriarOverlay(conteudo) {
  document.getElementById("egAuthOverlay")?.remove();
  document.documentElement.classList.add("eg-auth-locked");
  document.body.classList.add("eg-auth-locked");
  const overlay = document.createElement("div");
  overlay.id = "egAuthOverlay";
  overlay.className = "eg-auth-overlay";
  overlay.innerHTML = conteudo;
  document.body.appendChild(overlay);
}

function egMarcaLogin() {
  return `
    <div class="eg-login-brand">
      <img src="logo-seminna.png" alt="Sêminna">
      <h1>EmbrioGestor</h1>
      <p>Sistema de Gestão de Produção de Embriões</p>
    </div>`;
}

function egRodapeLogin() {
  return `
    <footer class="eg-login-footer">
      <div><strong>Sêminna</strong><small>Biotecnologia em Reprodução Animal</small></div>
      <div>🔒 Sistema exclusivo para profissionais autorizados</div>
      <div>EmbrioGestor</div>
    </footer>`;
}

function egTelaPrimeiroAcesso() {
  egCriarOverlay(`
    <div class="eg-login-page">
      <div class="eg-login-card">
        ${egMarcaLogin()}
        <h2>Configuração inicial</h2>
        <p class="eg-login-sub">Crie o primeiro usuário administrador do sistema.</p>
        <label>Nome</label>
        <input id="egNovoNome" type="text" autocomplete="name" placeholder="Nome do administrador">
        <label>Usuário</label>
        <input id="egNovoUsuario" type="text" autocomplete="username" placeholder="Escolha um usuário">
        <label>Senha</label>
        <div class="eg-password-wrap">
          <input id="egNovaSenha" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres">
          <button type="button" class="eg-eye" onclick="egMostrarSenha('egNovaSenha')">👁</button>
        </div>
        <label>Confirmar senha</label>
        <input id="egConfirmaSenha" type="password" autocomplete="new-password" placeholder="Digite novamente" onkeydown="if(event.key==='Enter')egCriarAdministrador()">
        <div id="egLoginMensagem" class="eg-login-error" hidden></div>
        <button class="eg-login-button" onclick="egCriarAdministrador()">CRIAR ADMINISTRADOR</button>
        <div class="eg-login-security"><strong>Seus dados sempre protegidos</strong><span>Backup e sincronização disponíveis através do Google Drive.</span></div>
      </div>
      ${egRodapeLogin()}
    </div>`);
}

function egTelaLogin() {
  egCriarOverlay(`
    <div class="eg-login-page">
      <div class="eg-login-card">
        ${egMarcaLogin()}
        <h2>Acesse sua conta</h2>
        <p class="eg-login-sub">Entre no EmbrioGestor para gerenciar cadastros, produções e transferências.</p>
        <label>Usuário</label>
        <input id="egUsuario" type="text" autocomplete="username" placeholder="Digite seu usuário">
        <label>Senha</label>
        <div class="eg-password-wrap">
          <input id="egSenha" type="password" autocomplete="current-password" placeholder="Digite sua senha" onkeydown="if(event.key==='Enter')egEntrar()">
          <button type="button" class="eg-eye" onclick="egMostrarSenha('egSenha')">👁</button>
        </div>
        <div id="egLoginMensagem" class="eg-login-error" hidden></div>
        <button class="eg-login-button" onclick="egEntrar()">ENTRAR</button>
        <div class="eg-login-security"><strong>Seus dados sempre protegidos</strong><span>Backup e sincronização disponíveis através do Google Drive.</span></div>
      </div>
      ${egRodapeLogin()}
    </div>`);
}

async function egCriarAdministrador() {
  const nome = document.getElementById("egNovoNome")?.value.trim() || "";
  const usuario = document.getElementById("egNovoUsuario")?.value.trim() || "";
  const senha = document.getElementById("egNovaSenha")?.value || "";
  const confirma = document.getElementById("egConfirmaSenha")?.value || "";
  if (!nome || !usuario || !senha) return egMensagem("Preencha todos os campos.");
  if (senha.length < 6) return egMensagem("A senha deve possuir pelo menos 6 caracteres.");
  if (senha !== confirma) return egMensagem("As senhas não conferem.");
  const novo = {
    id: "USR" + String(Date.now()).slice(-8),
    nome,
    usuario: usuario.toLowerCase(),
    senhaHash: await egHash(senha),
    perfil: "Administrador",
    ativo: true,
    criadoEm: new Date().toISOString()
  };
  egSalvarUsuarios([novo]);
  egSalvarSessao(novo);
  egFecharOverlay();
  if (typeof render === "function") render();
}

async function egEntrar() {
  const usuarioInformado = document.getElementById("egUsuario")?.value.trim().toLowerCase() || "";
  const senha = document.getElementById("egSenha")?.value || "";
  if (!usuarioInformado || !senha) return egMensagem("Informe usuário e senha.");
  const usuario = egUsuarios().find(u => u.ativo !== false && String(u.usuario).toLowerCase() === usuarioInformado);
  if (!usuario) return egMensagem("Usuário não encontrado.");
  if ((await egHash(senha)) !== usuario.senhaHash) return egMensagem("Senha incorreta.");
  egSalvarSessao(usuario);
  egFecharOverlay();
  if (typeof render === "function") render();
}

function egInicializarLogin() {
  if (egPrimeiroAcesso()) egTelaPrimeiroAcesso();
  else if (!egSessaoAtiva()) egTelaLogin();
  else egFecharOverlay();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", egInicializarLogin);
} else {
  egInicializarLogin();
}
