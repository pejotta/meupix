// PixPlus.pro - Script Principal (Revisado e Turbinado 🚀)
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
    localStorage.clear(); // Limpa tudo de uma vez
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

    lista.innerHTML = linksPaginados.map(l => `
        <tr>
            <td><a href="/${l.slug}" target="_blank" style="color:#00c896; font-weight:bold;">/${l.slug}</a></td>
            <td style="font-family: monospace; font-size: 13px; color: #ccc;">${l.pix}</td>
            <td>📊 ${l.clicks || 0}</td>
            <td id="acoes-${l.slug}">
                <button onclick="confirmarExclusao('${l.slug}')" class="btn-del">Excluir</button>
            </td>
        </tr>
    `).join('');

    renderizarPaginacao();
}

function confirmarExclusao(slug) {
    const tdAcoes = document.getElementById(`acoes-${slug}`);
    if (!tdAcoes) return;
    tdAcoes.innerHTML = `
        <div style="display:flex; gap:8px; align-items:center;">
            <button onclick="executarExclusao('${slug}')" style="background:#ff4d4d; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:11px;">Apagar?</button>
            <button onclick="renderizarTabela()" style="background:#333; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Não</button>
        </div>
    `;
}

async function executarExclusao(slug) {
    const token = localStorage.getItem('meupix_token');
    try {
        const res = await fetch(`${API_URL}/api/links?slug=${slug}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });
        if (res.ok) {
            linksGlobais = linksGlobais.filter(l => l.slug !== slug);
            renderizarTabela();
        }
    } catch (err) { console.error(err); }
}

function renderizarPaginacao() {
    let pagContainer = document.getElementById('paginacao');
    if (!pagContainer) {
        pagContainer = document.createElement('div');
        pagContainer.id = 'paginacao';
        pagContainer.style.cssText = "display:flex; justify-content:center; gap:10px; margin-top:20px;";
        document.querySelector('.links-section')?.appendChild(pagContainer);
    }
    const totalPaginas = Math.ceil(linksGlobais.length / linksPorPagina);
    let html = '';
    for (let i = 1; i <= totalPaginas; i++) {
        const ativo = i === paginaAtual ? "background:#00c896; color:#000;" : "background:#222; color:#fff;";
        html += `<button onclick="mudarPagina(${i})" style="${ativo} border:none; padding:5px 12px; border-radius:5px; cursor:pointer; font-weight:bold;">${i}</button>`;
    }
    pagContainer.innerHTML = html;
}

function mudarPagina(num) { paginaAtual = num; renderizarTabela(); }

// --- 4. ALERTA DE UPGRADE (TOAST) ---

function mostrarAlertaUpgrade(plano) {
    const toast = document.createElement('div');
    toast.innerHTML = `🚀 <b>Parabéns, Pejotta!</b><br>Seu upgrade para o plano ${plano} foi ativado!`;
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; background: #00c896; color: #000;
        padding: 15px 25px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        z-index: 9999; font-family: sans-serif; animation: slideIn 0.5s ease-out;
    `;
    document.body.appendChild(toast);
    
    // Keyframes dinâmicos para animação
    const style = document.createElement('style');
    style.innerHTML = `@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`;
    document.head.appendChild(style);

    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 4000);
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
            // CORREÇÃO AQUI: Salvando plano real vindo do Banco de Dados
            localStorage.setItem('meupix_user_plan', data.plano || 'free'); 
            localStorage.setItem('meupix_token', data.token);
            localStorage.setItem('meupix_user_name', data.nome);
            window.location.href = '/dashboard.html';
        } else {
            alert(data.error || "Erro no login.");
        }
    } catch (err) { alert("Erro de conexão."); }
}

async function criar() {
    const pix = document.getElementById("novoPix").value;
    const customSlug = document.getElementById("novoSlug").value;
    const tema = document.getElementById("temaSelect").value;
    const descricao = document.getElementById("novaDescricao").value;
    const msgStatus = document.getElementById('msgStatus');
    const token = localStorage.getItem('meupix_token');

    try {
        const res = await fetch(`${API_URL}/api/links`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": token },
            body: JSON.stringify({ pix, customSlug, tema, descricao })
        });
        const data = await res.json();
        if (res.ok) {
            msgStatus.innerText = "✅ Link criado!";
            msgStatus.style.color = "#00c896";
            setTimeout(() => { location.reload(); }, 1000);
        } else {
            msgStatus.innerText = "❌ " + (data.error || "Erro");
            msgStatus.style.color = "#ff4d4d";
        }
    } catch (err) { console.error(err); }
}

// --- 6. INTERFACE E ABAS ---

function trocarAba(aba) {
    document.querySelectorAll('.aba-conteudo').forEach(div => div.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    
    document.getElementById(`view-${aba}`).style.display = 'block';
    document.getElementById(`nav-${aba}`).classList.add('active');

    if (aba === 'planos') gerenciarBotoesPlanos();
}

// --- ATUALIZAÇÃO DA LOGICA DE INTERFACE ---

function carregarBoasVindas() {
    const nome = localStorage.getItem('meupix_user_name') || "Usuário";
    // Pegando 'plan' (como está no seu KV)
    const plano = (localStorage.getItem('meupix_user_plan') || "free").toLowerCase();
    
    const saudacaoElem = document.querySelector('#view-home h1');
    const badgePlano = document.querySelector('.badge-plan'); 
    
    if (saudacaoElem) saudacaoElem.innerText = `Bem-vindo, ${nome.split(' ')[0]}!`;
    
    if (badgePlano) {
        badgePlano.innerText = `Plano ${plano.toUpperCase()}`;
        // Se for diamante ou admin, brilha o verde!
        badgePlano.style.color = (plano === 'free') ? '#888' : 'var(--primary)';
    }

    // --- LIBERAR ANALYTICS SE FOR PLANO ALTO ---
    const planosPro = ['ouro', 'diamante', 'admin'];
    if (planosPro.includes(plano)) {
        // Remove os borrões e os cadeados
        document.querySelectorAll('.locked').forEach(el => el.classList.remove('locked'));
        document.querySelectorAll('.lock-overlay').forEach(el => el.style.display = 'none');
        
        // Se estiver na aba analytics, podemos até injetar um aviso de "Modo PRO Ativo"
        const areaAnalytics = document.querySelector('#view-analytics .stat-card');
        if (areaAnalytics && areaAnalytics.innerHTML.includes('🔒')) {
            areaAnalytics.innerHTML = `<h3>📊 Gráficos de Performance</h3><p>Seus dados estão sendo processados em tempo real.</p>`;
        }
    }
}

function gerenciarBotoesPlanos() {
    const planoAtual = (localStorage.getItem('meupix_user_plan') || 'free').toLowerCase();
    const cards = document.querySelectorAll('.plano-card');

    cards.forEach(card => {
        const h3 = card.querySelector('h3');
        if (!h3) return;
        
        const nomePlanoCard = h3.innerText.toLowerCase();
        const btn = card.querySelector('.btn-upgrade, button');

        // Resetar todos os botões primeiro para o estado padrão
        if (btn && nomePlanoCard !== planoAtual) {
             // Se não for o plano atual e for o grátis, ele não deve ter link, mas os outros sim
             if (nomePlanoCard !== 'grátis' && nomePlanoCard !== 'free') {
                 // Deixa o botão de assinar habilitado
                 btn.style.cssText = ""; 
                 btn.removeAttribute('disabled');
             }
        }

        // Marcar o plano ativo
        if (nomePlanoCard === planoAtual || (planoAtual === 'free' && nomePlanoCard === 'grátis')) {
            if (btn) {
                btn.innerText = "Plano Ativo";
                btn.style.cssText = "background:#333 !important; color:#888 !important; pointer-events:none; cursor:default;";
                btn.setAttribute('disabled', 'true');
                card.style.borderColor = "var(--primary)";
            }
        }
    });
}

// --- INICIALIZAÇÃO ---
window.addEventListener('DOMContentLoaded', () => {
    injetarFavicon();
    if (window.location.pathname.includes('dashboard')) {
        carregarMeusLinks();
        carregarBoasVindas();
    }
});
