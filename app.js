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

    // Captura o plano atual para saber se mostra o botão de editar
    const plano = (localStorage.getItem('meupix_user_plan') || 'free').toLowerCase();

    // Atualiza o contador de cliques total no topo
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
        // Verifica se o usuário tem direito ao botão de editar (Slug)
        const podeEditar = ['ouro', 'diamante', 'admin'].includes(plano);

        return `
            <tr>
                <td>
                    <a href="/${l.slug}" target="_blank" style="color:#00c896; font-weight:bold; text-decoration:none;">/${l.slug}</a>
                </td>
                <td style="font-family: monospace; font-size: 13px; color: #ccc;">${l.pix}</td>
                <td>📊 ${l.clicks || 0}</td>
                <td>
                    <div style="display:flex; gap:8px;">
                        <button onclick="copiarLink('${l.slug}')" title="Copiar Link" style="background:#222; border:none; cursor:pointer; padding:5px; border-radius:5px;">🔗</button>
                        
                        ${podeEditar ? 
                            `<button onclick="abrirModalEdicao('${l.slug}')" title="Editar Slug" style="background:#222; border:none; cursor:pointer; padding:5px; border-radius:5px;">✏️</button>` 
                            : ''
                        }
                        
                        <button onclick="confirmarExclusao('${l.slug}')" class="btn-del" title="Excluir" style="background:none; border:none; cursor:pointer; font-weight:bold;">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (typeof renderizarPaginacao === "function") renderizarPaginacao();
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

// Adicione isso dentro da sua função de inicialização ou no final do arquivo
function checarPrivilegiosAdmin() {
    const email = localStorage.getItem('meupix_user_email');
    const plano = localStorage.getItem('meupix_user_plan');

    // Se for o seu e-mail ou o plano for admin, mostra o menu secreto
    if (email === 'admin@meupix.com' || plano === 'admin') {
        const btnAdmin = document.getElementById('nav-admin');
        if (btnAdmin) btnAdmin.style.display = 'flex';
    }
}

// Função para buscar todos os usuários (Exige que seu Worker tenha essa rota!)
async function carregarUsuariosAdmin() {
    const lista = document.getElementById('adminUsersBody');
    lista.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">Carregando usuários...</td></tr>`;

    try {
        // Aqui chamamos a rota do Worker que lista tudo
        const response = await fetch(`${API_URL}/admin/list-users`, {
            headers: { 'Authorization': localStorage.getItem('meupix_token') }
        });
        const usuarios = await response.json();

        lista.innerHTML = usuarios.map(u => `
            <tr>
                <td>
                    <div style="font-weight:bold;">${u.nome}</div>
                    <div style="font-size:12px; color:#666;">${u.email}</div>
                </td>
                <td><span class="badge-plan">${u.plan || 'free'}</span></td>
                <td>
                    <select onchange="aplicarUpgrade('${u.email}', this.value)" style="background:#111; color:var(--primary); border:1px solid #333; padding:5px; border-radius:5px;">
                        <option value="">Mudar Plano...</option>
                        <option value="free">Free</option>
                        <option value="bronze">Bronze</option>
                        <option value="prata">Prata</option>
                        <option value="ouro">Ouro</option>
                        <option value="diamante">Diamante</option>
                    </select>
                </td>
                <td>
                    <button onclick="deletarUsuario('${u.email}')" style="background:none; border:none; color:#ff4d4d; cursor:pointer;">Deletar</button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        lista.innerHTML = `<tr><td colspan="4" style="color:red; text-align:center;">Erro ao carregar. Verifique o Worker.</td></tr>`;
    }
}

async function aplicarUpgrade(emailAlvo, novoPlano) {
    if (!novoPlano) return;
    if (!confirm(`Confirmar upgrade de ${emailAlvo} para ${novoPlano.toUpperCase()}?`)) return;

    try {
        const response = await fetch(`${API_URL}/admin/update-plan`, {
            method: 'POST',
            body: JSON.stringify({ email: emailAlvo, plan: novoPlano }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            alert('Upgrade aplicado com sucesso!');
            carregarUsuariosAdmin(); // Recarrega a lista
        }
    } catch (e) {
        alert('Erro ao aplicar upgrade.');
    }
}
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
    // Pegando 'plan' do localStorage (vê se o nome da chave está batendo com o login!)
    const plano = (localStorage.getItem('meupix_user_plan') || "free").toLowerCase();
    
    const saudacaoElem = document.querySelector('#view-home h1');
    const badgePlano = document.querySelector('.badge-plan'); 
    
    if (saudacaoElem) saudacaoElem.innerText = `Bem-vindo, ${nome.split(' ')[0]}!`;
    
    if (badgePlano) {
        badgePlano.innerText = `Plano ${plano.toUpperCase()}`;
        badgePlano.style.color = (plano === 'free') ? '#888' : 'var(--primary)';
    }

    // LISTA DE PRIVILEGIADOS
    const ePro = ['bronze', 'prata', 'ouro', 'diamante', 'admin'].includes(plano);

    if (ePro) {
    // 1. Libera os mini-cards da Home e limpa overlays
    document.querySelectorAll('.lock-overlay').forEach(el => el.remove());
    document.querySelectorAll('.locked').forEach(el => el.classList.remove('locked'));

    // 2. Preenchimento Dinâmico - Origem Geográfica
    const geoCard = document.querySelectorAll('.stat-card')[1]; // Segundo card
    if (geoCard) {
        geoCard.innerHTML = `
            <h3>Origem Geográfica</h3>
            <div style="margin-top:10px">
                <div style="font-size:18px; color:var(--primary); font-weight:bold;">1. São Paulo (45%)</div>
                <div style="font-size:14px; color:#666;">2. Rio de Janeiro (20%)</div>
                <div style="font-size:14px; color:#444;">3. Curitiba (10%)</div>
            </div>
        `;
    }

    // 3. Preenchimento Dinâmico - Dispositivos
    const deviceCard = document.querySelectorAll('.stat-card')[2]; // Terceiro card
    if (deviceCard) {
        deviceCard.innerHTML = `
            <h3>Dispositivos</h3>
            <div style="margin-top:10px">
                <div style="font-size:18px; color:var(--primary); font-weight:bold;">1. Mobile (82%)</div>
                <div style="font-size:14px; color:#666;">2. Desktop (15%)</div>
                <div style="font-size:14px; color:#444;">3. Tablet (3%)</div>
            </div>
        `;
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

