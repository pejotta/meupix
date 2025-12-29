// Configuração da URL do seu Worker (Substitua pela sua URL real)
const API_URL = "https://meupix-api.moneynanet-yt.workers.dev/";

// Função para gerar link na Home
async function criar() {
    const pix = document.getElementById("pix").value;
    if (!pix) return alert("Chave PIX obrigatória!");

    const res = await fetch(`${API_URL}/api/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pix })
    });

    const data = await res.json();
    document.getElementById("resultado").innerHTML = `
        <div class="success-box">
            Link gerado: <a href="/${data.slug}" target="_blank">meupix.com/${data.slug}</a>
        </div>
    `;
}

// Função de Login (para o Dashboard)
async function realizarLogin(senha) {
    const res = await fetch(`${API_URL}/api/auth`, {
        method: "POST",
        body: JSON.stringify({ password: senha })
    });
    
    if (res.ok) {
        const data = await res.json();
        localStorage.setItem("meupix_token", data.token);
        window.location.href = "/dashboard";
    } else {
        alert("Senha incorreta!");
    }
}

// Configurações Globais
const API_URL = ""; // Como estamos usando o Worker no mesmo domínio, pode deixar vazio ou colocar a URL do Worker

// --- 1. FUNÇÕES DE NAVEGAÇÃO E AUTH ---

// Verifica se o usuário está logado ao abrir o Dashboard
function verificarSessao() {
    const token = localStorage.getItem('meupix_token');
    if (!token && window.location.pathname.includes('dashboard')) {
        window.location.href = '/login.html';
    }
    return token;
}

// Salva o token e manda para o Dashboard
function salvarSessao(token) {
    localStorage.setItem('meupix_token', token);
    window.location.href = '/dashboard.html';
}

// Desloga o usuário
function logout() {
    localStorage.removeItem('meupix_token');
    window.location.href = '/login.html';
}

// --- 2. LÓGICA DE LOGIN E CADASTRO ---

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
                window.location.reload(); // Volta para tela de login
            }
        } else {
            alert(data.error || 'Erro na operação');
        }
    } catch (err) {
        alert('Erro ao conectar com o servidor.');
    }
}

// --- 3. GESTÃO DE LINKS (NO DASHBOARD) ---

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

    lista.innerHTML = links.map(l => `
        <tr>
            <td><a href="/${l.slug}" target="_blank">/${l.slug}</a></td>
            <td>${l.pix.substring(0, 10)}...</td>
            <td>${l.clicks || 0}</td>
            <td>
                <button onclick="deletarLink('${l.slug}')" class="btn-del">Excluir</button>
            </td>
        </tr>
    `).join('');
}
