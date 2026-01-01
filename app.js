// PixPlus.pro - Script Principal (Versão Gold 🚀) - REVISADO
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

// --- 3. GESTÃO DE LINKS E ANALYTICS ---

async function carregarMeusLinks() {
    const token = verificarSessao();
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/api/links`, {
            headers: { 'Authorization': token }
        });
        if (res.status === 401) return logout();
        
        linksGlobais = await res.json();
        
        // Renderiza a tabela principal e a aba de Analytics
        renderizarTabela();
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

// --- NOVO: ANALYTICS TUNADO (CAIXAS E DISPOSITIVOS) ---
function renderizarAnalyticsDetalhado() {
    let totalClicks = 0, totalCopies = 0, totalReveals = 0;
    const tabelaBody = document.getElementById('analyticsBody');
    tabelaBody.innerHTML = '';

    linksGlobais.forEach(link => {
        const copies = parseInt(link.stats?.copies || 0);
        const reveals = parseInt(link.stats?.reveals || 0);
        const clicks = parseInt(link.clicks || 0);

        totalClicks += clicks;
        totalCopies += copies;
        totalReveals += reveals;

        const conversion = clicks > 0 ? Math.round(((copies + reveals) / clicks) * 100) : 0;

        tabelaBody.innerHTML += `
            <tr>
                <td><strong>/${link.slug}</strong></td>
                <td>${clicks}</td>
                <td>${reveals}</td>
                <td>${copies}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="engagement-bar"><div class="engagement-fill" style="width: ${conversion}%"></div></div>
                        <span>${conversion}%</span>
                    </div>
                </td>
            </tr>`;
    });

    // Atualiza os Cards Principais
    document.getElementById('totalAcessos').innerText = totalClicks;
    document.getElementById('totalRevelacoes').innerText = totalReveals;
    document.getElementById('totalCopias').innerText = totalCopies;

    // Simulação de Dados Geográficos e Dispositivos (Enquanto o Worker coleta)
    renderizarRankings();
}

function renderizarRankings() {
    const deviceList = document.getElementById('deviceList');
    const geoList = document.getElementById('geoList');

    if(deviceList) {
        deviceList.innerHTML = `
            <div class="rank-item main"><span class="name">Mobile</span><span class="value">78%</span></div>
            <div class="rank-item secondary"><span>Desktop</span><span>20%</span></div>
            <div class="rank-item secondary"><span>Tablet</span><span>2%</span></div>`;
    }
    if(geoList) {
        geoList.innerHTML = `
            <div class="rank-item main"><span class="name">Brasil 🇧🇷</span><span class="value">95%</span></div>
            <div class="rank-item secondary"><span>Portugal 🇵🇹</span><span>3%</span></div>
            <div class="rank-item secondary"><span>Outros</span><span>2%</span></div>`;
    }
}

// --- CONTINUAÇÃO DAS SUAS FUNÇÕES ORIGINAIS ---

function copiarLink(slug) {
    const url = `pixplus.pro/${slug}`;
    navigator.clipboard.writeText(url).then(() => { alert("Link copiado: " + url); });
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

// Inicializador
window.addEventListener('DOMContentLoaded', () => {
    injetarFavicon();
    if (window.location.pathname.includes('dashboard')) {
        carregarMeusLinks(); // Esta função agora chama o Analytics junto
        carregarBoasVindas();
        checarPrivilegiosAdmin();
    }
});

// [Mantenha suas funções de fecharModal, salvarNovaSlug e aplicarUpgrade conforme o original]
