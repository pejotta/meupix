// 1. Configuração Única da API
// Se o Worker e o Pages estão no mesmo domínio, deixe apenas ""
// Se forem domínios diferentes, use a URL completa: "https://meupix-api.moneynanet-yt.workers.dev"
const API_URL = "https://meupix-api.moneynanet-yt.workers.dev";

// --- 2. FUNÇÕES DE NAVEGAÇÃO E AUTH ---

function verificarSessao() {
    const token = localStorage.getItem('meupix_token');
    if (!token && window.location.pathname.includes('dashboard')) {
        window.location.href = '/login.html';
    }
    return token;
}

function salvarSessao(token) {
    localStorage.setItem('meupix_token', token);
    window.location.href = '/dashboard.html';
}

function logout() {
    localStorage.removeItem('meupix_token');
    window.location.href = '/login.html';
}

// --- 3. LÓGICA DE LOGIN E CADASTRO ---

async function autenticar(e, tipo) {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const endpoint = tipo === 'login' ? '/api/login' : '/api/register';

    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            if (tipo === 'login') {
                salvarSessao(data.token);
            } else {
                alert('Conta criada com sucesso! Agora é só fazer login.');
                // Se estiver no login.html, apenas alterna a visualização ou recarrega
                window.location.reload(); 
            }
        } else {
            alert(data.error || 'Erro na operação');
        }
    } catch (err) {
        alert('Erro ao conectar com o servidor.');
    }
}

// --- 4. GESTÃO DE LINKS ---

async function criar() {
    const pix = document.getElementById("pix").value;
    const token = localStorage.getItem('meupix_token');
    
    if (!pix) return alert("Chave PIX obrigatória!");

    // Se o cara estiver logado, enviamos o token para salvar no painel dele
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;

    const res = await fetch(`${API_URL}/api/links`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ pix })
    });

    const data = await res.json();
    document.getElementById("resultado").innerHTML = `
        <div class="success-box" style="margin-top:20px; padding:15px; background:#121212; border-radius:10px; border:1px solid #00c896;">
            <p>Link gerado com sucesso!</p>
            <a href="/${data.slug}" target="_blank" style="color:#00c896; font-weight:bold;">meupix.com/${data.slug}</a>
        </div>
    `;
}

async function carregarMeusLinks() {
    const token = verificarSessao();
    if (!token) return;

    const res = await fetch(`${API_URL}/api/links`, {
        headers: { 'Authorization': token }
    });

    if (res.status === 401) return logout();

    const links = await res.json();
    renderizarTabela(links);
}

function renderizarTabela(links) {
    const lista = document.getElementById('linksBody');
    if (!lista) return;

    if (links.length === 0) {
        lista.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:#666;">Você ainda não tem links criados.</td></tr>`;
        return;
    }

    lista.innerHTML = links.map(l => `
        <tr>
            <td><a href="/${l.slug}" target="_blank" style="color:#00c896;">/${l.slug}</a></td>
            <td>${l.pix.substring(0, 15)}...</td>
            <td>🔥 ${l.clicks || 0}</td>
            <td>
                <button onclick="deletarLink('${l.slug}')" class="btn-del" style="color:#ff4d4d; background:none; border:none; cursor:pointer;">Excluir</button>
            </td>
        </tr>
    `).join('');
}

async function deletarLink(slug) {
    const token = localStorage.getItem('meupix_token');
    if (!confirm("Tem certeza que deseja excluir?")) return;

    const res = await fetch(`${API_URL}/api/links?slug=${slug}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
    });

    if (res.ok) carregarMeusLinks();
}

// --- 5. ELEMENTOS GLOBAIS ---

function injetarElementosGlobais() {
    // 1. Injetar Favicon
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = '/assets/meupix-logo.png';

    // 2. Header Dinâmico
    const token = localStorage.getItem('meupix_token');
    const headerAction = document.getElementById('header-actions');
    
    if (headerAction) {
        if (token) {
            headerAction.innerHTML = `
                <a href="/dashboard.html" style="margin-right:15px; color:#fff; text-decoration:none;">Painel</a>
                <button onclick="logout()" style="background:#333; color:#fff; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">Sair</button>
            `;
        } else {
            headerAction.innerHTML = `
                <a href="/login.html" style="margin-right:15px; color:#fff; text-decoration:none;">Entrar</a>
                <a href="/login.html" style="background:#00c896; color:#000; border:none; padding:8px 15px; border-radius:5px; text-decoration:none; font-weight:bold;">Criar Conta</a>
            `;
        }
    }
}

window.addEventListener('DOMContentLoaded', injetarElementosGlobais);
