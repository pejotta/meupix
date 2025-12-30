const API_URL = "https://meupix-api.moneynanet-yt.workers.dev";

// --- 1. ESTADO GLOBAL E CONFIGURAÇÕES ---
let linksGlobais = [];
let paginaAtual = 1;
const linksPorPagina = 5;

// --- 2. FUNÇÕES DE NAVEGAÇÃO E IDENTIDADE ---

function injetarFavicon() {
    let fav = document.querySelector("link[rel~='icon']");
    if (!fav) {
        fav = document.createElement('link');
        fav.rel = 'icon';
        document.head.appendChild(fav);
    }
    fav.href = '/assets/meupix-logo.png'; 
}

function verificarSessao() {
    const token = localStorage.getItem('meupix_token');
    if (!token && window.location.pathname.includes('dashboard')) {
        window.location.href = '/login.html';
    }
    return token;
}

function logout() {
    localStorage.removeItem('meupix_token');
    window.location.href = '/login.html';
}

// --- 3. GESTÃO DE LINKS (TABELA E PAGINAÇÃO) ---

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

// --- 3. GESTÃO DE LINKS (TABELA E PAGINAÇÃO) ---

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

// Nova lógica de confirmação sem pop-up
function confirmarExclusao(slug) {
    const tdAcoes = document.getElementById(`acoes-${slug}`);
    if (!tdAcoes) return;

    // Transforma o botão em uma confirmação inline
    tdAcoes.innerHTML = `
        <div style="display:flex; gap:8px; align-items:center;">
            <span style="color:#ff4d4d; font-size:11px; font-weight:bold;">Apagar?</span>
            <button onclick="executarExclusao('${slug}')" style="background:#ff4d4d; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:11px;">Sim</button>
            <button onclick="renderizarTabela()" style="background:#333; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px;">Não</button>
        </div>
    `;
}

async function executarExclusao(slug) {
    const token = localStorage.getItem('meupix_token');
    const tdAcoes = document.getElementById(`acoes-${slug}`);
    
    if (tdAcoes) tdAcoes.innerHTML = `<span style="color:#888; font-size:11px;">Excluindo...</span>`;

    try {
        const res = await fetch(`${API_URL}/api/links?slug=${slug}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });

        if (res.ok) {
            // Remove do array local e re-renderiza
            linksGlobais = linksGlobais.filter(l => l.slug !== slug);
            renderizarTabela();
        } else {
            alert("Erro ao excluir do Banco de Dados.");
            renderizarTabela();
        }
    } catch (err) {
        console.error(err);
        renderizarTabela();
    }
}

function renderizarPaginacao() {
    let pagContainer = document.getElementById('paginacao');
    if (!pagContainer) {
        pagContainer = document.createElement('div');
        pagContainer.id = 'paginacao';
        pagContainer.style.cssText = "display:flex; justify-content:center; gap:10px; margin-top:20px;";
        document.querySelector('.links-section').appendChild(pagContainer);
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

// --- 4. CRIAÇÃO DE LINKS COM VALIDAÇÃO ---

// Bloqueia caracteres especiais enquanto o usuário digita
document.addEventListener('input', (e) => {
    if (e.target.id === 'novoSlug' || e.target.id === 'slug') {
        let val = e.target.value;
        val = val.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove acentos
        val = val.replace(/[çÇ]/g, "c"); // Remove cedilha
        val = val.replace(/[^a-zA-Z0-9-]/g, "-"); // Tudo que não for letra/número vira hífen
        val = val.replace(/-+/g, "-"); // Evita múltiplos hífens
        e.target.value = val.toLowerCase();
    }
});

async function criar(pixManual = null, slugManual = null) {
    const pix = pixManual || document.getElementById("pix")?.value;
    const customSlug = slugManual || document.getElementById("slug")?.value;
    const token = localStorage.getItem('meupix_token');
    const msgStatus = document.getElementById('msgStatus');
    
    if (!pix) return alert("Chave PIX obrigatória!");

    try {
        const res = await fetch(`${API_URL}/api/links`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": token || "" },
            body: JSON.stringify({ pix, customSlug })
        });

        const data = await res.json();

        if (res.ok) {
            if (token) {
                // Sucesso dentro do Modal
                if (msgStatus) {
                    msgStatus.innerText = "✅ Link criado com sucesso!";
                    msgStatus.style.color = "#00c896";
                    setTimeout(() => {
                        document.getElementById('modalNovoLink').style.display = 'none';
                        msgStatus.innerText = "";
                        carregarMeusLinks();
                    }, 1500);
                }
            } else {
                exibirResultadoHome(data.slug);
            }
        } else {
            if (msgStatus) {
                msgStatus.innerText = "❌ " + (data.error || "Erro ao criar");
                msgStatus.style.color = "#ff4d4d";
            } else { alert(data.error); }
        }
    } catch (err) { alert("Erro de conexão."); }
}

async function criarNovoLink() {
    const pix = document.getElementById('novoPix').value;
    const slug = document.getElementById('novoSlug').value;
    await criar(pix, slug);
    document.getElementById('novoPix').value = '';
    document.getElementById('novoSlug').value = '';
}

// --- 5. AUXILIARES ---

function exibirResultadoHome(slug) {
    const container = document.getElementById("container-resultado");
    const linkElem = document.getElementById("link-gerado");
    if (container && linkElem) {
        container.style.display = "block";
        const host = window.location.host; 
        linkElem.innerText = `${host}/${slug}`;
        linkElem.href = `https://${host}/${slug}`;
    }
}

async function deletarLink(slug) {
    const token = localStorage.getItem('meupix_token');
    if (!confirm(`Deseja excluir /${slug}?`)) return;
    await fetch(`${API_URL}/api/links?slug=${slug}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
    });
    carregarMeusLinks();
}

function copiarLink() {
    const link = document.getElementById('link-gerado').innerText;
    navigator.clipboard.writeText(link).then(() => {
        const btn = document.querySelector("#container-resultado button");
        btn.innerText = "Copiado!";
        setTimeout(() => btn.innerText = "Copiar", 2000);
    });
}

// Inicialização Única
window.addEventListener('DOMContentLoaded', () => {
    injetarFavicon();
    if (window.location.pathname.includes('dashboard')) {
        carregarMeusLinks();
    }
});

function trocarAba(aba) {
    // 1. Esconde todas as abas
    document.querySelectorAll('.aba-conteudo').forEach(div => div.style.display = 'none');
    
    // 2. Remove o 'active' de todos os itens do menu
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));

    // 3. Mostra a aba clicada e ativa o menu
    document.getElementById(`view-${aba}`).style.display = 'block';
    document.getElementById(`nav-${aba}`).classList.add('active');
}
