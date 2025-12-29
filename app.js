// Configuração da URL do seu Worker (Substitua pela sua URL real)
const API_URL = "https://meupix-api.seu-subdominio.workers.dev";

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
