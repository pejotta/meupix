export async function onRequest({ request, params, env }) {
  const slug = params.slug;

  // 1. TRAVA DE ARQUIVOS ESTÁTICOS
  // Se o navegador pedir style.css ou app.js, o Worker ignora e entrega o arquivo real
  if (slug.includes('.')) {
    return env.ASSETS.fetch(request);
  }

  // 2. BUSCA NO BANCO DE DADOS (KV)
  const dataRaw = await env.PIX_KV.get(slug);

  if (!dataRaw) {
    return new Response("Link PIX não encontrado ou expirado.", { status: 404 });
  }

  // 3. PROCESSAMENTO DOS DADOS
  let data;
  try {
    data = JSON.parse(dataRaw);
  } catch (e) {
    // Caso o dado no banco seja apenas a chave (versão antiga), tratamos aqui
    data = { pix: dataRaw };
  }

  // 4. RETORNO DO HTML DA PÁGINA DE PAGAMENTO
  const html = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagar via PIX</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body class="pix-page">
  <div class="container">
    <div class="header-pix">
       <h2>Fazer Oferta</h2>
       <p>Igreja / Beneficiário</p>
    </div>

    <div class="pix-box-area">
      <input id="pixKey" style="width: 100%; padding: 10px; text-align: center; margin-bottom: 10px;" value="${data.pix}" readonly>
      <button class="btn-copy" style="width: 100%; padding: 15px; background: #00c896; border: none; font-weight: bold; cursor: pointer;" onclick="copiar()">Copiar Chave PIX</button>
    </div>

    <div id="qrcode-area" style="margin: 20px auto; padding: 15px; background: white; width: fit-content; border-radius: 10px;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.pix)}" 
             alt="QR Code PIX" 
             style="display: block;">
        <p style="color: #333; font-size: 0.8rem; margin-top: 5px; font-weight: bold;">Aponte a câmera para pagar</p>
    </div>

  <script>
    function copiar() {
      const input = document.getElementById("pixKey");
      input.select();
      navigator.clipboard.writeText(input.value);
      document.getElementById("msg").innerText = "✅ Chave copiada com sucesso!";
    }
  </script>
</body>
</html>`;

  return new Response(html, { 
    headers: { "Content-Type": "text/html; charset=utf-8" } 
  });
}
