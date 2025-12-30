const API_URL = "https://meupix-api.moneynanet-yt.workers.dev";

// --- 1. ESTADO GLOBAL PARA PAGINAÇÃO ---
let linksGlobais = [];
let paginaAtual = 1;
const linksPorPagina = 5;

// --- 2. FUNÇÕES DE NAVEGAÇÃO E AUTH ---

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

// --- 3. GESTÃO DE LINKS E BANCO DE DADOS ---

async function carregarMeusLinks() {
    const token = verificarSessao();
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/api/links`, {
            headers: { 'Authorization': token }
        });

        if (res.status === 401) return logout();

        linksGlobais = await res.json();
        // Ordena por cliques (opcional, ou por data se você tivesse)
        renderizarTabela();
    } catch (err) {
        console.error("Erro ao conectar ao Banco de Dados:", err);
    }
}

function renderizarTabela() {
    const lista = document.getElementById('linksBody');
    const totalClicksElem = document.getElementById('totalClicks');
    if (!lista) return;

    // Atualiza Total de Cliques
    if (totalClicksElem) {
        const total = linksGlobais.reduce((acc, curr) => acc + (parseInt(curr.clicks) || 0), 0);
        totalClicksElem.innerText = total;
    }

    if (linksGlobais.length === 0) {
        lista.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:#666;">Nenhum link no seu Banco de Dados.</td></tr>`;
        return;
    }

    // Lógica de Paginação
    const inicio = (paginaAtual - 1) * linksPorPagina;
    const fim = inicio + linksPorPagina;
    const linksPaginados = linksGlobais.slice(inicio, fim);

    lista.innerHTML = linksPaginados.map(l => `
        <tr>
            <td><a href="/${l.slug}" target="_blank" style="color:#00c896; font-weight:bold;">/${l.slug}</a></td>
            <td style="font-family: monospace; font-size: 13px; color: #ccc;">${l.pix}</td>
            <td>📊 ${l.clicks || 0}</td>
            <td>
                <button onclick="deletarLink('${l.slug}')" class="btn-del">Excluir</button>
            </td>
        </tr>
    `).join('');

    renderizarPaginacao();
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

function mudarPagina(num) {
    paginaAtual = num;
    renderizarTabela();
}

// --- 4. CRIAÇÃO DE LINKS ---

async function criar(pixManual = null, slugManual = null) {
    const pix = pixManual || document.getElementById("pix")?.value;
    const customSlug = slugManual || document.getElementById("slug")?.value;
    const token = localStorage.getItem('meupix_token');
    
    if (!pix) return alert("Chave PIX obrigatória!");

    try {
        const res = await fetch(`${API_URL}/api/links`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": token || "" 
            },
            body: JSON.stringify({ pix, customSlug })
        });

        const data = await res.json();

        if (res.ok) {
            if (token) {
                alert("Link criado com sucesso!");
                carregarMeusLinks();
                document.getElementById('modalNovoLink').style.display = 'none';
            } else {
                exibirResultadoHome(data.slug);
            }
        } else {
            alert(data.error || "Erro ao criar link.");
        }
    } catch (err) {
        alert("Erro de conexão.");
    }
}

// Chamada exclusiva do botão da Dashboard
async function criarNovoLink() {
    const pix = document.getElementById('novoPix').value;
    const slug = document.getElementById('novoSlug').value;
    await criar(pix, slug);
    // Limpa campos
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

// Inicialização
window.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard')) {
        carregarMeusLinks();
    }
});
