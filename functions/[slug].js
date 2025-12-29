export async function onRequest({ request, params, env }) {
  const slug = params.slug;

  // TRAVA: Se o slug tiver ponto (ex: style.css, favicon.ico), 
  // deixa o Cloudflare entregar o arquivo real e não executa a função.
  if (slug.includes('.')) {
    return env.ASSETS.fetch(request);
  }
  
export async function onRequest({ params, env }) {
  const slug = params.slug;
  const dataRaw = await env.PIX_KV.get(slug);

  if (!dataRaw) {
    return new Response("Link PIX não encontrado ou expirado.", { status: 404 });
  }

  // Transformamos a string do Banco de Dados de volta em objeto
  const data = JSON.parse(dataRaw);

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
      <input id="pixKey" value="${data.pix}" readonly>
      <button class="btn-copy" onclick="copiar()">Copiar Chave PIX</button>
    </div>

    <div id="qrcode-area">
       </div>

    <p id="msg"></p>
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

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
