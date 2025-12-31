// PixPlus.pro - Script Principal (Edição Temas PRO & Descrição 🚀)
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
    localStorage.removeItem('meupix_token');
    localStorage.removeItem('meupix_user_name');
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
        const linksSection = document.querySelector('.links-section');
        if (linksSection) linksSection.appendChild(pagContainer);
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

// --- 4. CRIAÇÃO DE LINKS COM VALIDAÇÃO E TEMA ---

document.addEventListener('input', (e) => {
    if (e.target.id === 'novoSlug' || e.target.id === 'slug') {
        let val = e.target.value;
        val = val.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        val = val.replace(/[çÇ]/g, "c");
        val = val.replace(/[^a-zA-Z0-9-]/g, "-");
        val = val.replace(/-+/g, "-");
        e.target.value = val.toLowerCase();
    }
});

// FUNÇÃO ÚNICA DE CRIAÇÃO (Corrigida e Unificada)
async function criar() {
    const pix = document.getElementById("novoPix").value;
    const customSlug = document.getElementById("novoSlug").value;
    const tema = document.getElementById("temaSelect").value;
    const descricao = document.getElementById("novaDescricao").value;
    const msgStatus = document.getElementById('msgStatus');
    const token = localStorage.getItem('meupix_token');

    if (!pix) {
        msgStatus.innerText = "❌ Informe sua chave PIX!";
        msgStatus.style.color = "#ff4d4d";
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/links`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": token },
            body: JSON.stringify({ pix, customSlug, tema, descricao })
        });

        const data = await res.json();

        if (res.ok) {
            msgStatus.innerText = "✅ Link criado com sucesso!";
            msgStatus.style.color = "#00c896";
            
            document.getElementById("novoPix").value = "";
            document.getElementById("novoSlug").value = "";
            document.getElementById("novaDescricao").value = "";
            
            setTimeout(() => {
                document.getElementById('modalNovoLink').style.display = 'none';
                msgStatus.innerText = "";
                carregarMeusLinks(); 
            }, 1500);
        } else {
            // AQUI ESTÁ A MÁGICA: Pega o erro do Worker (com o nome do usuário)
            msgStatus.innerText = "❌ " + (data.error || "Erro ao criar");
            msgStatus.style.color = "#ff4d4d";
            
            // Opcional: Se for erro de limite, você pode até mudar a cor do botão para incentivar o upgrade
        }
    } catch (err) { 
        console.error(err);
        alert("Erro ao conectar com o Banco de Dados."); 
    }
}

// --- 5. AUXILIARES E INICIALIZAÇÃO ---

function fecharModal() {
    const modal = document.getElementById('modalNovoLink');
    if (modal) modal.style.display = 'none';
}

window.addEventListener('DOMContentLoaded', () => {
    injetarFavicon();
    if (window.location.pathname.includes('dashboard')) {
        carregarMeusLinks();
        carregarBoasVindas();
    }
    atualizarMenuIndex();
});

function trocarAba(aba) {
    document.querySelectorAll('.aba-conteudo').forEach(div => div.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    
    const view = document.getElementById(`view-${aba}`);
    if (view) view.style.display = 'block';
    
    const navItem = document.getElementById(`nav-${aba}`);
    if (navItem) navItem.classList.add('active');
}

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
            localStorage.setItem('meupix_user_plan', , 'diamante');
            localStorage.setItem('meupix_token', data.token);
            localStorage.setItem('meupix_user_name', data.nome);
            window.location.href = '/dashboard.html';
        } else {
            alert(data.error || "E-mail ou senha incorretos.");
        }
    } catch (err) {
        alert("Erro ao conectar com o servidor.");
    }
}

async function cadastrar() {
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('password').value;
    const confirma = document.getElementById('confirmPassword').value;

    if (senha !== confirma) return alert("As senhas não conferem!");
    if (senha.length < 6) return alert("A senha precisa de pelo menos 6 caracteres.");

    try {
        const res = await fetch(`${API_URL}/api/cadastro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });
        if (res.ok) {
            alert("Sucesso! Conta criada.");
            window.location.href = '/login.html';
        } else {
            const data = await res.json();
            alert(data.error || "Houve um erro ao cadastrar.");
        }
    } catch (err) {
        alert("Erro de conexão.");
    }
}

function carregarBoasVindas() {
    const nome = localStorage.getItem('meupix_user_name') || "Usuário";
    const plano = localStorage.getItem('meupix_user_plan') || "Free"; // Pegando do login
    
    const saudacaoElem = document.querySelector('#view-home h1');
    const badgePlano = document.querySelector('.badge-free'); // Seleciona a badge
    
    if (saudacaoElem) {
        saudacaoElem.innerText = `Bem-vindo, ${nome.split(' ')[0]}!`;
    }
    
    if (badgePlano) {
        badgePlano.innerText = `Plano ${plano.charAt(0).toUpperCase() + plano.slice(1)}`;
        // Se quiser mudar a cor conforme o plano:
        if(plano !== 'free') badgePlano.style.color = 'var(--primary)';
    }
}

function gerenciarBotoesPlanos() {
    // Pega o plano do usuário (ex: 'free', 'bronze', 'prata'...)
    const planoAtual = (localStorage.getItem('meupix_user_plan') || 'free').toLowerCase();

    // Mapeia os cards de planos na dashboard
    const cards = document.querySelectorAll('.plano-card');

    cards.forEach(card => {
        // Pega o nome do plano dentro do h3 do card
        const nomePlanoCard = card.querySelector('h3').innerText.toLowerCase();
        const btn = card.querySelector('.btn-upgrade');

        if (nomePlanoCard === planoAtual) {
            if (btn) {
                btn.innerText = "Plano Ativo";
                btn.style.background = "#333";
                btn.style.color = "#888";
                btn.style.cursor = "default";
                btn.style.pointerEvents = "none"; // Desativa o link
                card.style.borderColor = "var(--primary)"; // Destaca o card atual
            }
        }
    });
}

// Chame essa função dentro da sua função trocarAba()
function trocarAba(aba) {
    // ... sua lógica de esconder/mostrar abas ...
    
    if (aba === 'planos') {
        gerenciarBotoesPlanos();
    }
}

function atualizarMenuIndex() {
    const token = localStorage.getItem('meupix_token');
    const headerActions = document.getElementById('header-actions');
    if (token && headerActions) {
        const nomeUsuario = localStorage.getItem('meupix_user_name') || 'Usuário';
        headerActions.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="color: #888; font-size: 14px;">Olá, ${nomeUsuario.split(' ')[0]}!</span>
                <a href="/dashboard.html" class="btn-login" style="background: var(--primary); color: #000; padding: 8px 15px; border-radius: 8px; text-decoration: none; font-weight: bold;">Painel</a>
            </div>
        `;
    }
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.menu-toggle-btn');
    const overlay = document.querySelector('.menu-overlay');
    const sidebar = document.querySelector('.sidebar');
    if (btn || e.target.classList.contains('menu-overlay')) {
        sidebar?.classList.toggle('active');
        overlay?.classList.toggle('active');
    }
});
