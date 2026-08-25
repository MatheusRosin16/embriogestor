/* ============================================================
   EmbrioGestor v2.5 - Login Administrador + Consulta por Cliente
   ============================================================ */

const EG_AUTH_KEY = "embriogestor_auth";
const EG_USUARIOS_KEY_ANTIGA = "embriogestor_usuarios";

function egUsuarios(){
  if(typeof db!=="undefined"){
    if(!Array.isArray(db.usuarios))db.usuarios=[];
    if(!db.usuarios.length){
      try{
        const antigos=JSON.parse(localStorage.getItem(EG_USUARIOS_KEY_ANTIGA)||"[]");
        if(Array.isArray(antigos)&&antigos.length){
          db.usuarios=antigos.map(u=>({
            ...u,
            perfil:u.perfil==="Administrador"?"Administrador":"Consulta",
            clienteId:u.clienteId||"",
            profissionalId:""
          }));
          egPersistirUsuarios();
        }
      }catch(e){console.warn("Falha ao migrar usuários antigos",e);}
    }
    db.usuarios.forEach(u=>{
      if(u.perfil!=="Administrador")u.perfil="Consulta";
      if(!("clienteId" in u))u.clienteId="";
    });
    return db.usuarios;
  }
  try{return JSON.parse(localStorage.getItem(EG_USUARIOS_KEY_ANTIGA))||[];}catch{return[];}
}
function egPersistirUsuarios(){
  if(typeof db!=="undefined"){
    db.versao=9;
    localStorage.setItem(typeof DB_KEY!=="undefined"?DB_KEY:"embriogestor_v9",JSON.stringify(db));
  }
}
function egSessaoAtiva(){try{return JSON.parse(sessionStorage.getItem(EG_AUTH_KEY))||null;}catch{return null;}}
function egSalvarSessao(usuario){
  sessionStorage.setItem(EG_AUTH_KEY,JSON.stringify({
    id:usuario.id,
    nome:usuario.nome,
    usuario:usuario.usuario,
    perfil:usuario.perfil||"Consulta",
    clienteId:usuario.clienteId||"",
    entrada:new Date().toISOString()
  }));
}
function egSair(){sessionStorage.removeItem(EG_AUTH_KEY);location.reload();}
async function egHash(texto){const bytes=new TextEncoder().encode(texto);const hash=await crypto.subtle.digest("SHA-256",bytes);return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");}
function egPrimeiroAcesso(){return egUsuarios().length===0;}
function egMensagem(texto){const el=document.getElementById("egLoginMensagem");if(!el)return;el.textContent=texto;el.hidden=false;}
function egMostrarSenha(id="egSenha"){const campo=document.getElementById(id);if(campo)campo.type=campo.type==="password"?"text":"password";}
function egFecharOverlay(){document.getElementById("egAuthOverlay")?.remove();document.documentElement.classList.remove("eg-auth-locked");document.body.classList.remove("eg-auth-locked");}
function egCriarOverlay(conteudo){document.getElementById("egAuthOverlay")?.remove();document.documentElement.classList.add("eg-auth-locked");document.body.classList.add("eg-auth-locked");const overlay=document.createElement("div");overlay.id="egAuthOverlay";overlay.className="eg-auth-overlay";overlay.innerHTML=conteudo;document.body.appendChild(overlay);}
function egMarcaLogin(){return `<div class="eg-login-brand"><img src="logo-seminna.png" alt="Sêminna"><h1>EmbrioGestor</h1><p>Sistema de Gestão de Produção de Embriões</p></div>`;}
function egRodapeLogin(){return `<footer class="eg-login-footer"><div><strong>Sêminna</strong><small>Biotecnologia em Reprodução Animal</small></div><div>🔒 Acesso protegido</div><div>EmbrioGestor</div></footer>`;}
function egTelaPrimeiroAcesso(){egCriarOverlay(`<div class="eg-login-page"><div class="eg-login-card">${egMarcaLogin()}<h2>Configuração inicial</h2><p class="eg-login-sub">Crie o primeiro usuário Administrador do sistema.</p><label>Nome</label><input id="egNovoNome" type="text" autocomplete="name" placeholder="Nome do administrador"><label>Usuário</label><input id="egNovoUsuario" type="text" autocomplete="username" placeholder="Escolha um usuário"><label>Senha</label><div class="eg-password-wrap"><input id="egNovaSenha" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres"><button type="button" class="eg-eye" onclick="egMostrarSenha('egNovaSenha')">👁</button></div><label>Confirmar senha</label><input id="egConfirmaSenha" type="password" autocomplete="new-password" placeholder="Digite novamente" onkeydown="if(event.key==='Enter')egCriarAdministrador()"><div id="egLoginMensagem" class="eg-login-error" hidden></div><button class="eg-login-button" onclick="egCriarAdministrador()">CRIAR ADMINISTRADOR</button><div class="eg-login-security"><strong>Administração centralizada</strong><span>Depois, o Administrador poderá criar um login de Consulta para cada cliente.</span></div></div>${egRodapeLogin()}</div>`);}
function egTelaLogin(){egCriarOverlay(`<div class="eg-login-page"><div class="eg-login-card">${egMarcaLogin()}<h2>Acesse sua conta</h2><p class="eg-login-sub">Administrador ou Cliente — Consulta</p><label>Usuário</label><input id="egUsuario" type="text" autocomplete="username" placeholder="Digite seu usuário"><label>Senha</label><div class="eg-password-wrap"><input id="egSenha" type="password" autocomplete="current-password" placeholder="Digite sua senha" onkeydown="if(event.key==='Enter')egEntrar()"><button type="button" class="eg-eye" onclick="egMostrarSenha('egSenha')">👁</button></div><div id="egLoginMensagem" class="eg-login-error" hidden></div><button class="eg-login-button" onclick="egEntrar()">ENTRAR</button><div class="eg-login-security"><strong>Acesso do cliente</strong><span>O Cliente visualiza somente os dados vinculados ao seu cadastro e não pode alterar informações.</span></div></div>${egRodapeLogin()}</div>`);}
async function egCriarAdministrador(){
  const nome=document.getElementById("egNovoNome")?.value.trim()||"",usuario=document.getElementById("egNovoUsuario")?.value.trim().toLowerCase()||"",senha=document.getElementById("egNovaSenha")?.value||"",confirma=document.getElementById("egConfirmaSenha")?.value||"";
  if(!nome||!usuario||!senha)return egMensagem("Preencha todos os campos.");
  if(senha.length<6)return egMensagem("A senha deve possuir pelo menos 6 caracteres.");
  if(senha!==confirma)return egMensagem("As senhas não conferem.");
  const novo={id:"USR"+String(Date.now()).slice(-8),nome,usuario,senhaHash:await egHash(senha),perfil:"Administrador",clienteId:"",profissionalId:"",ativo:true,criadoEm:new Date().toISOString()};
  if(typeof db!=="undefined"){if(!Array.isArray(db.usuarios))db.usuarios=[];db.usuarios.push(novo);egPersistirUsuarios();}else localStorage.setItem(EG_USUARIOS_KEY_ANTIGA,JSON.stringify([novo]));
  egSalvarSessao(novo);egFecharOverlay();if(typeof egAtualizarInterfacePerfil==="function")egAtualizarInterfacePerfil();if(typeof render==="function")render();
}
async function egEntrar(){
  const usuarioInformado=document.getElementById("egUsuario")?.value.trim().toLowerCase()||"",senha=document.getElementById("egSenha")?.value||"";
  if(!usuarioInformado||!senha)return egMensagem("Informe usuário e senha.");
  const usuario=egUsuarios().find(u=>u.ativo!==false&&String(u.usuario).toLowerCase()===usuarioInformado);
  if(!usuario)return egMensagem("Usuário não encontrado.");
  if((await egHash(senha))!==usuario.senhaHash)return egMensagem("Senha incorreta.");
  if(usuario.perfil!=="Administrador"){
    usuario.perfil="Consulta";
    if(!usuario.clienteId || !(db.clientes||[]).some(c=>c.id===usuario.clienteId))return egMensagem("Este acesso ainda não está vinculado a um cliente. Solicite ao Administrador.");
  }
  egSalvarSessao(usuario);egFecharOverlay();if(typeof egAtualizarInterfacePerfil==="function")egAtualizarInterfacePerfil();if(typeof render==="function")render();
}
function egInicializarLogin(){egUsuarios();if(egPrimeiroAcesso())egTelaPrimeiroAcesso();else if(!egSessaoAtiva())egTelaLogin();else{egFecharOverlay();if(typeof egAtualizarInterfacePerfil==="function")egAtualizarInterfacePerfil();}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",egInicializarLogin);else egInicializarLogin();
