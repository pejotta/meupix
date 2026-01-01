// PixPlus.pro - Script Principal (Versão Gold 🚀)
const API_URL = "https://meupix-api.moneynanet-yt.workers.dev";

// --- 1. ESTADO GLOBAL ---
let linksGlobais = [];
let paginaAtual = 1;
const linksPorPagina = 5;

// --- 2. FUNÇÕES DE NAVEGAÇÃO E SESSÃO ---

function injetarFavicon() {
    let fav = document.querySelector("link[rel~='icon']");
    if (!fav) {
        fav = document.createElement('link');
        fav.rel = 'icon';
        document.head.appendChild(fav);
    }
    fav.href = '/assets/pixplus-logo.png'; 
}

function verificarSessao() {
    const token = localStorage.getItem('meupix_token');
    if (!token && window.location.pathname.includes('dashboard')) {
        window.location.href = '/login.html';
    }
    return token;
}

function logout() {
    localStorage.clear();
    window.location.href = '/login.html';
}

// --- 3. GESTÃO DE LINKS ---

async function carregarMeusLinks() {
    const token = verificarSessao();
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/api/links`, {
            headers: { 'Authorization': token }
        });
        if (res.status === 401) return logout();
        linksGlobais = await res.json();
        renderizarTabela();
    } catch (err) {
        console.error("Erro ao carregar Banco de Dados:", err);
    }
}

function renderizarTabela() {
    const lista = document.getElementById('linksBody');
    const totalClicksElem = document.getElementById('totalClicks');
    if (!lista) return;

    const plano = (localStorage.getItem('meupix_user_plan') || 'free').toLowerCase();

    if (totalClicksElem) {
        const total = linksGlobais.reduce((acc, curr) => acc + (parseInt(curr.clicks) || 0), 0);
        totalClicksElem.innerText = total;
    }

    if (linksGlobais.length === 0) {
        lista.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:#666;">Nenhum link encontrado.</td></tr>`;
        return;
    }

    const inicio = (paginaAtual - 1) * linksPorPagina;
    const linksPaginados = linksGlobais.slice(inicio, inicio + linksPorPagina);

    lista.innerHTML = linksPaginados.map(l => {
        const podeEditar = ['ouro', 'diamante', 'admin'].includes(plano);
        return `
            <tr>
                <td><a href="/${l.slug}" target="_blank" style="color:#00c896; font-weight:bold; text-decoration:none;">/${l.slug}</a></td>
                <td style="font-family: monospace; font-size: 13px; color: #ccc;">${l.pix}</td>
                <td>📊 ${l.clicks || 0}</td>
                <td>
                    <div style="display:flex; gap:8px;">
                        <button onclick="copiarLink('${l.slug}')" title="Copiar Link" style="background:#222; border:none; cursor:pointer; padding:5px; border-radius:5px;">🔗</button>
                        ${podeEditar ? `<button onclick="abrirModalEdicao('${l.slug}')" title="Editar Slug" style="background:#222; border:none; cursor:pointer; padding:5px; border-radius:5px;">✏️</button>` : ''}
                        <button onclick="confirmarExclusao('${l.slug}')" class="btn-del" style="background:none; border:none; cursor:pointer; font-weight:bold;">🗑️</button>
                    </div>
                </td>
            </tr>`;
    }).join('');

    renderizarPaginacao();
}

// --- 4. ADMINISTRAÇÃO ---

function checarPrivilegiosAdmin() {
    const email = localStorage.getItem('meupix_user_email');
    const plano = (localStorage.getItem('meupix_user_plan') || "").toLowerCase();

    if (email === 'admin@meupix.com' || plano === 'admin') {
        const btnAdmin = document.getElementById('nav-admin');
        if (btnAdmin) btnAdmin.style.display = 'flex';
    }
}

async function carregarUsuariosAdmin() {
    const lista = document.getElementById('adminUsersBody');
    if(!lista) return;
    lista.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">Carregando usuários...</td></tr>`;

    try {
        const response = await fetch(`${API_URL}/api/admin/list-users`, {
            headers: { 'Authorization': localStorage.getItem('meupix_token') }
        });
        const usuarios = await response.json();

        lista.innerHTML = usuarios.map(u => `
            <tr>
                <td><b>${u.nome}</b><br><small>${u.email}</small></td>
                <td><span class="badge-plan">${u.plan || 'free'}</span></td>
                <td>
                    <select onchange="aplicarUpgrade('${u.email}', this.value)" style="background:#111; color:#00c896; border:1px solid #333; padding:5px; border-radius:5px;">
                        <option value="">Upgrade...</option>
                        <option value="free">Free</option>
                        <option value="bronze">Bronze</option>
                        <option value="prata">Prata</option>
                        <option value="ouro">Ouro</option>
                        <option value="diamante">Diamante</option>
                        <option value="admin">Admin</option>
                    </select>
                </td>
                <td><button onclick="deletarUsuario('${u.email}')" style="color:#ff4d4d; background:none; border:none; cursor:pointer;">Deletar</button></td>
            </tr>`).join('');
    } catch (e) {
        lista.innerHTML = `<tr><td colspan="4" style="color:red; text-align:center;">Erro ao carregar usuários.</td></tr>`;
    }
}

async function aplicarUpgrade(emailAlvo, novoPlano) {
    if (!novoPlano || !confirm(`Mudar ${emailAlvo} para ${novoPlano.toUpperCase()}?`)) return;
    try {
        const response = await fetch(`${API_URL}/api/admin/update-plan`, {
            method: 'POST',
            body: JSON.stringify({ email: emailAlvo, plan: novoPlano }),
            headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('meupix_token') }
        });
        if (response.ok) {
            alert('Plano atualizado!');
            carregarUsuariosAdmin();
        }
    } catch (e) { alert('Erro no upgrade.'); }
}

// --- 5. LOGIN E CADASTRO ---

async function logar() {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        const data = await res.json();
        
        if (res.ok) {
            localStorage.setItem('meupix_token', data.token);
            localStorage.setItem('meupix_user_name', data.nome);
            localStorage.setItem('meupix_user_email', email); // Importante para o checarPrivilegiosAdmin
            localStorage.setItem('meupix_user_plan', data.plan.toLowerCase()); 
            window.location.href = '/dashboard.html';
        } else {
            alert(data.error || "Erro no login.");
        }
    } catch (err) { alert("Erro de conexão."); }
}

// --- 6. INTERFACE E INICIALIZAÇÃO ---

function trocarAba(aba) {
    document.querySelectorAll('.aba-conteudo').forEach(div => div.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    
    document.getElementById(`view-${aba}`).style.display = 'block';
    document.getElementById(`nav-${aba}`).classList.add('active');

    if (aba === 'planos') gerenciarBotoesPlanos();
    if (aba === 'admin') carregarUsuariosAdmin();
}

function carregarBoasVindas() {
    const nome = localStorage.getItem('meupix_user_name') || "Usuário";
    const plano = (localStorage.getItem('meupix_user_plan') || "free").toLowerCase();
    
    const saudacaoElem = document.querySelector('#view-home h1');
    const badgePlano = document.querySelector('.badge-plan'); 
    
    if (saudacaoElem) saudacaoElem.innerText = `Bem-vindo, ${nome.split(' ')[0]}!`;
    if (badgePlano) {
        badgePlano.innerText = `Plano ${plano.toUpperCase()}`;
        badgePlano.style.color = (plano === 'free') ? '#888' : 'var(--primary)';
    }

    if (['bronze', 'prata', 'ouro', 'diamante', 'admin'].includes(plano)) {
        document.querySelectorAll('.lock-overlay').forEach(el => el.remove());
        document.querySelectorAll('.locked').forEach(el => el.classList.remove('locked'));
    }
}

// Inicializador
window.addEventListener('DOMContentLoaded', () => {
    injetarFavicon();
    if (window.location.pathname.includes('dashboard')) {
        carregarMeusLinks();
        carregarBoasVindas();
        checarPrivilegiosAdmin(); // ESSENCIAL PARA APARECER O MENU ADMIN
    }
});

// Modal de Edição
function abrirModalEdicao(slugAtual) {
    document.getElementById('editOldSlug').value = slugAtual;
    document.getElementById('editNewSlug').value = slugAtual;
    document.getElementById('modalEdicao').style.display = 'flex';
}

function fecharModalEdicao() {
    document.getElementById('modalEdicao').style.display = 'none';
}

async function salvarNovaSlug() {
    const oldSlug = document.getElementById('editOldSlug').value;
    const newSlug = document.getElementById('editNewSlug').value.trim().toLowerCase();
    if (!newSlug || newSlug === oldSlug) return fecharModalEdicao();

    try {
        const response = await fetch(`${API_URL}/api/links/edit`, {
            method: 'POST',
            body: JSON.stringify({ oldSlug, newSlug }),
            headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('meupix_token') }
        });
        if (response.ok) {
            fecharModalEdicao();
            carregarMeusLinks(); // Nome correto da função
        } else {
            const r = await response.json();
            alert(r.error);
        }
    } catch (e) { alert("Erro ao salvar."); }
}

// Funções de apoio (Paginacao e Exclusão omitidas aqui para brevidade, mas devem ser mantidas)
function mudarPagina(num) { paginaAtual = num; renderizarTabela(); }
function renderizarPaginacao() { /* ... sua lógica de paginação ... */ }

// 1. FILTRO DE BUSCA PARA O ADMIN
function filtrarUsuariosAdmin() {
    const termo = document.getElementById('buscaUsuario').value.toLowerCase();
    const linhas = document.querySelectorAll('#adminUsersBody tr');

    linhas.forEach(linha => {
        const textoLinha = linha.innerText.toLowerCase();
        linha.style.display = textoLinha.includes(termo) ? '' : 'none';
    });
}

// 2. CORREÇÃO DO BOTÃO "PLANO ATIVO"
function gerenciarBotoesPlanos() {
    const planoUsuario = (localStorage.getItem('meupix_user_plan') || 'free').toLowerCase();
    const cards = document.querySelectorAll('.plano-card');

    cards.forEach(card => {
        const h3 = card.querySelector('h3');
        if (!h3) return;
        
        // Remove emojis e espaços para comparar apenas o texto limpo
        const nomePlanoCard = h3.innerText.toLowerCase().replace(/[^\w]/g, '').trim();
        const btn = card.querySelector('.btn-upgrade, button');

        // Reset padrão
        if (btn) {
            btn.innerText = "Fazer Upgrade";
            btn.style.cssText = ""; 
            btn.removeAttribute('disabled');
        }

        // Se for o plano que o usuário tem no Banco de Dados
        if (nomePlanoCard === planoUsuario || (planoUsuario === 'free' && nomePlanoCard === 'gratis')) {
            if (btn) {
                btn.innerText = "Plano Ativo";
                btn.style.cssText = "background:#333 !important; color:#888 !important; pointer-events:none; cursor:default; border:none;";
                btn.setAttribute('disabled', 'true');
                card.style.borderColor = "var(--primary)";
                card.style.boxShadow = "0 0 20px rgba(0, 200, 150, 0.2)";
            }
        }
    });
}
