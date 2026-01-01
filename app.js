// PixPlus.pro - Script Principal (Versão Full Gold 🚀)
const API_URL = "https://meupix-api.moneynanet-yt.workers.dev";

// --- 1. ESTADO GLOBAL ---
let linksGlobais = [];
let paginaAtual = 1;
const linksPorPagina = 5;

// --- ADMIN E LOGIN (SEM ALTERAÇÕES DE LÓGICA, APENAS FIX DE TOKEN) ---

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
            localStorage.setItem('meupix_user_email', email);
            localStorage.setItem('meupix_user_plan', data.plan.toLowerCase()); 
            window.location.href = '/dashboard.html';
        } else { alert(data.error || "Erro no login."); }
    } catch (err) { alert("Erro de conexão."); }
}

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

function trocarAba(aba) {
    document.querySelectorAll('.aba-conteudo').forEach(div => div.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    
    const view = document.getElementById(`view-${aba}`);
    const nav = document.getElementById(`nav-${aba}`);
    
    if (view) view.style.display = 'block';
    if (nav) nav.classList.add('active');

    if (aba === 'planos') gerenciarBotoesPlanos();
    if (aba === 'admin') carregarUsuariosAdmin();
    if (aba === 'analytics') renderizarAnalyticsDetalhado();
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
        
        // Se estiver na aba analytics, atualiza ela também
        if (document.getElementById('analyticsBody')) {
            renderizarAnalyticsDetalhado();
        }
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

async function confirmarExclusao(slug) {
    if (!confirm(`Pejotta, deletar o link /${slug}?`)) return;
    try {
        const res = await fetch(`${API_URL}/api/links/${slug}`, {
            method: 'DELETE',
            headers: { 'Authorization': localStorage.getItem('meupix_token') }
        });
        if (res.ok) carregarMeusLinks();
    } catch (e) { alert("Erro ao excluir."); }
}

// --- 4. MODAL E EDIÇÃO ---

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
            carregarMeusLinks();
        } else {
            const r = await response.json();
            alert(r.error);
        }
    } catch (e) { alert("Erro ao salvar."); }
}

// --- 5. ANALYTICS ---

function renderizarAnalyticsDetalhado() {
    let totalClicks = 0, totalCopies = 0, totalReveals = 0;
    const tabelaBody = document.getElementById('analyticsBody');
    if (!tabelaBody) return;

    tabelaBody.innerHTML = linksGlobais.map(link => {
        const copies = parseInt(link.stats?.copies || 0);
        const reveals = parseInt(link.stats?.reveals || 0);
        const clicks = parseInt(link.clicks || 0);
        totalClicks += clicks; totalCopies += copies; totalReveals += reveals;
        const conv = clicks > 0 ? Math.round(((copies + reveals) / clicks) * 100) : 0;

        return `
            <tr>
                <td><strong>/${link.slug}</strong></td>
                <td>${clicks}</td>
                <td>${reveals}</td>
                <td>${copies}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="engagement-bar"><div class="engagement-fill" style="width: ${conv}%"></div></div>
                        <span>${conv}%</span>
                    </div>
                </td>
            </tr>`;
    }).join('');

    document.getElementById('totalAcessos').innerText = totalClicks;
    document.getElementById('totalRevelacoes').innerText = totalReveals;
    document.getElementById('totalCopias').innerText = totalCopies;
    
    // Rankings fictícios (podemos automatizar depois)
    renderizarRankings();
}

function renderizarRankings() {
    const deviceList = document.getElementById('deviceList');
    const geoList = document.getElementById('geoList');
    if(deviceList) deviceList.innerHTML = `<div class="rank-item main"><span>Mobile</span><span>78%</span></div><div class="rank-item secondary"><span>Desktop</span><span>22%</span></div>`;
    if(geoList) geoList.innerHTML = `<div class="rank-item main"><span>Brasil 🇧🇷</span><span>95%</span></div><div class="rank-item secondary"><span>Outros</span><span>5%</span></div>`;
}

// --- 6. ADMIN E INTERFACE ---

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
}

async function carregarUsuariosAdmin() {
    const lista = document.getElementById('adminUsersBody');
    if(!lista) return;
    try {
        const response = await fetch(`${API_URL}/api/admin/list-users`, {
            headers: { 'Authorization': localStorage.getItem('meupix_token') }
        });
        const usuarios = await response.json();
        lista.innerHTML = usuarios.map(u => `
            <tr>
                <td><b>${u.nome}</b><br><small>${u.email}</small></td>
                <td><span class="badge-plan">${(u.plan || 'free').toUpperCase()}</span></td>
                <td>
                    <select onchange="aplicarUpgrade('${u.email}', this.value)" style="background:#111; color:#00c896; border:1px solid #333; padding:5px; border-radius:5px;">
                        <option value="">Upgrade...</option>
                        <option value="free">Free</option><option value="ouro">Ouro</option><option value="diamante">Diamante</option><option value="admin">Admin</option>
                    </select>
                </td>
                <td><button onclick="deletarUsuario('${u.email}')" style="color:#ff4d4d; background:none; border:none; cursor:pointer;">Deletar</button></td>
            </tr>`).join('');
    } catch (e) { console.error(e); }
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
            alert('Sucesso! 🚀');
            carregarUsuariosAdmin();
        }
    } catch (e) { alert('Erro.'); }
}

function copiarLink(slug) {
    const url = `pixplus.pro/${slug}`;
    navigator.clipboard.writeText(url).then(() => alert("Link copiado!"));
}

function renderizarPaginacao() {
    let pagContainer = document.getElementById('paginacao');
    if (!pagContainer) return;
    const totalPaginas = Math.ceil(linksGlobais.length / linksPorPagina);
    let html = '';
    for (let i = 1; i <= totalPaginas; i++) {
        const ativo = i === paginaAtual ? "background:#00c896; color:#000;" : "background:#222; color:#fff;";
        html += `<button onclick="mudarPagina(${i})" style="${ativo} border:none; padding:5px 12px; border-radius:5px; cursor:pointer; font-weight:bold; margin:0 2px;">${i}</button>`;
    }
    pagContainer.innerHTML = html;
}

function mudarPagina(num) { paginaAtual = num; renderizarTabela(); }

function checarPrivilegiosAdmin() {
    const plano = (localStorage.getItem('meupix_user_plan') || "").toLowerCase();
    if (plano === 'admin') {
        const btnAdmin = document.getElementById('nav-admin');
        if (btnAdmin) btnAdmin.style.display = 'flex';
    }
}

// --- INICIALIZAÇÃO ---
window.addEventListener('DOMContentLoaded', () => {
    injetarFavicon();
    if (window.location.pathname.includes('dashboard')) {
        carregarMeusLinks();
        carregarBoasVindas();
        checarPrivilegiosAdmin();
    }
});
