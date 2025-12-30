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

// 🏆 Função Inteligente (Home ou Dashboard)
async function criar(pixManual = null, slugManual = null) {
    // 🔍 Busca os valores. Prioriza o que vem por parâmetro (Dashboard) ou busca no HTML (Home)
    const pix = pixManual || document.getElementById("pix")?.value;
    const customSlug = slugManual || document.getElementById("slug")?.value;
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

        if (res.ok) {
            // Se estiver no Dashboard (tem token), atualiza a lista e avisa o sucesso
            if (token) {
                alert("Link criado com sucesso!");
                carregarMeusLinks(); // Atualiza a tabela no Banco de Dados
                
                // Limpa e fecha o modal se os IDs baterem com seu HTML
                if (document.getElementById('modalNovoLink')) {
                    document.getElementById('modalNovoLink').style.display = 'none';
                    document.getElementById('novoPix').value = '';
                    document.getElementById('novoSlug').value = '';
                }
            } else {
                // Se estiver na Home, mostra o card de resultado
                const container = document.getElementById("container-resultado");
                const linkElem = document.getElementById("link-gerado");
                if (container && linkElem) {
                    container.style.display = "block";
                    const host = window.location.host; 
                    linkElem.innerText = `${host}/${data.slug}`;
                    linkElem.href = `https://${host}/${data.slug}`;
                }
            }
        } else {
            alert(data.error || "Erro ao criar link.");
        }
    } catch (err) {
        alert("Erro ao conectar com o servidor.");
    }
}

// 👑 Função auxiliar para o Modal do Dashboard
async function criarNovoLink() {
    // Verifique se no seu dashboard.html os IDs do modal são exatamente esses:
    const pixInput = document.getElementById('novoPix');
    const slugInput = document.getElementById('novoSlug');
    
    if (!pixInput || !pixInput.value) return alert("Insira uma chave PIX!");
    
    // Passa os valores capturados para a função principal
    await criar(pixInput.value, slugInput.value);
}

async function carregarMeusLinks() {
    const token = verificarSessao();
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/api/links`, {
            headers: { 'Authorization': token }
        });

        if (res.status === 401) return logout();

        const links = await res.json();
        renderizarTabela(links);
    } catch (err) {
        console.error("Erro ao carregar links:", err);
    }
}

function renderizarTabela(links) {
    const lista = document.getElementById('linksBody');
    const totalClicksElem = document.getElementById('totalClicks');
    if (!lista) return;

    if (totalClicksElem) {
        const total = links.reduce((acc, curr) => acc + (parseInt(curr.clicks) || 0), 0);
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
                <button onclick="deletarLink('${l.slug}')" class="btn-del" style="color:#ff4d4d; background:none; border:none; cursor:pointer;">Excluir</button>
            </td>
        </tr>
    `).join('');
}

async function deletarLink(slug) {
    const token = localStorage.getItem('meupix_token');
    if (!token) return alert("Sessão expirada!");
    if (!confirm(`Deseja excluir o link /${slug}?`)) return;

    try {
        const res = await fetch(`${API_URL}/api/links?slug=${slug}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        });

        if (res.ok) {
            alert("Link removido!");
            carregarMeusLinks();
        } else {
            const data = await res.json();
            alert(data.error || "Erro ao excluir");
        }
    } catch (err) {
        alert("Erro de conexão ao excluir.");
    }
}

// --- 5. ELEMENTOS GLOBAIS E INICIALIZAÇÃO ---

function injetarElementosGlobais() {
    // Favicon
    let fav = document.querySelector("link[rel~='icon']");
    if (!fav) {
        fav = document.createElement('link');
        fav.rel = 'icon';
        document.head.appendChild(fav);
    }
    fav.href = '/assets/meupix-logo.png'; 

    // Header Dinâmico
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
        if (btn) {
            const originalText = btn.innerText;
            btn.innerText = "Copiado!";
            btn.style.background = "#fff";
            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.background = "#00c896";
            }, 2000);
        }
    });
}

// ✅ Inicializador Único
window.addEventListener('DOMContentLoaded', () => {
    injetarElementosGlobais();
    
    // Se estiver no dashboard, carrega os dados do Banco de Dados automaticamente
    if (window.location.pathname.includes('dashboard')) {
        carregarMeusLinks();
    }
});
