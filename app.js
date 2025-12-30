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

// 🏆 Função Única para criar links (Home ou Dashboard)
async function criar(pixManual = null, slugManual = null) {
    // Busca dados dos inputs (Home usa 'pix', Dashboard usa o que vem do modal)
    const pix = pixManual || document.getElementById("pix")?.value;
    const customSlug = slugManual || document.getElementById("novoSlug")?.value;
    const token = localStorage.getItem('meupix_token');
    
    if (!pix) return alert("Chave PIX obrigatória!");

    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = token;

    try {
        const res = await fetch(`${API_URL}/api/links`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ pix, customSlug })
        });

        const data = await res.json();

        // 🎨 Exibe o card de resultado igual ao seu print
        const container = document.getElementById("container-resultado");
        const linkElem = document.getElementById("link-gerado");
        
        if (container && linkElem) {
            container.style.display = "block";
            // Remove o protocolo para ficar limpo igual ao print
            const host = window.location.host; 
            linkElem.innerText = `${host}/${data.slug}`;
            linkElem.href = `/${data.slug}`;
            
            // Se estiver no dashboard, recarrega a lista
            if (token) carregarMeusLinks();
        }

    } catch (err) {
        alert("Erro ao criar link. Tente novamente.");
    }
}

// 👑 Função auxiliar para o Modal do Dashboard
async function criarNovoLink() {
    const pix = document.getElementById('novoPix').value;
    const slug = document.getElementById('novoSlug').value;
    
    if(!pix) return alert("Insira uma chave PIX!");
    
    await criar(pix, slug);
    
    // Limpa e fecha o modal
    document.getElementById('modalNovoLink').style.display = 'none';
    document.getElementById('novoPix').value = '';
    document.getElementById('novoSlug').value = '';
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
    const totalClicksElem = document.getElementById('totalClicks');
    if (!lista) return;

    // Soma todos os cliques para o Dashboard
    if (totalClicksElem) {
        const total = links.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
        totalClicksElem.innerText = total;
    }

    if (links.length === 0) {
        lista.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:#666;">Você ainda não tem links criados.</td></tr>`;
        return;
    }

    lista.innerHTML = links.map(l => `
        <tr>
            <td><a href="/${l.slug}" target="_blank" style="color:#00c896; font-weight:bold;">/${l.slug}</a></td>
            <td>${l.pix.substring(0, 15)}...</td>
            <td>📊 ${l.clicks || 0}</td>
            <td>
                <button onclick="deletarLink('${l.slug}')" class="btn-del">Excluir</button>
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
    const token = localStorage.getItem('meupix_token');
    const headerAction = document.getElementById('header-actions');
    
    if (headerAction) {
        if (token) {
            headerAction.innerHTML = `
                <a href="/dashboard.html" style="margin-right:15px; color:#fff; text-decoration:none; font-size:14px;">Painel</a>
                <button onclick="logout()" style="background:#222; color:#fff; border:none; padding:8px 15px; border-radius:8px; cursor:pointer;">Sair</button>
            `;
        } else {
            headerAction.innerHTML = `
                <a href="/login.html" style="margin-right:15px; color:#fff; text-decoration:none; font-size:14px;">Entrar</a>
                <a href="/login.html" style="background:#00c896; color:#000; border:none; padding:8px 15px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:14px;">Começar</a>
            `;
        }
    }
}

function copiarLink() {
    const link = document.getElementById('link-gerado').innerText;
    navigator.clipboard.writeText(link).then(() => {
        const btn = document.querySelector("#container-resultado button");
        const originalText = btn.innerText;
        btn.innerText = "Copiado!";
        btn.style.background = "#fff";
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = "#00c896";
        }, 2000);
    });
}

window.addEventListener('DOMContentLoaded', injetarElementosGlobais);
