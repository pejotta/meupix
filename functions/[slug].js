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
  <title>PIX para copiar</title>
  <link rel="stylesheet" href="/style.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
</head>
<body>
  <div class="container">
    <h2>Oferta via PIX</h2>

    <div id="qrcode"></div>

    <input id="pixKey" value="${pix}" readonly>

    <button onclick="copiar()">Copiar chave PIX</button>

    <p id="msg"></p>
  </div>

  <script>
    new QRCode(document.getElementById("qrcode"), {
      text: "${pix}",
      width: 180,
      height: 180
    });

    function copiar() {
      const input = document.getElementById("pixKey");
      input.select();
      input.setSelectionRange(0, 99999);
      navigator.clipboard.writeText(input.value);
      document.getElementById("msg").innerText = "PIX copiado com sucesso 🙌";
    }
  </script>
</body>
</html>
  `;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
