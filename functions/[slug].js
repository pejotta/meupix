export async function onRequest({ params, env }) {
  const slug = params.slug;
  const pix = await env.PIX_KV.get(slug);

  if (!pix) {
    return new Response("Link PIX não encontrado", { status: 404 });
  }

  const html = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <title>PIX</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="pix-page">
    <div class="container">
      <h2>Oferta via PIX</h2>

      <input id="pixKey" value="${pix}" readonly>

      <button onclick="copiar()">Copiar chave PIX</button>

      <p id="msg"></p>
    </div>
  </div>

  <script>
    function copiar() {
      const input = document.getElementById("pixKey");
      input.select();
      input.setSelectionRange(0, 99999);
      document.execCommand("copy");
      document.getElementById("msg").innerText = "Chave copiada!";
    }
  </script>
</body>
</html>
  `;

  return new Response(html, {
    headers: { "Content-Type": "text/html" }
  });
}
