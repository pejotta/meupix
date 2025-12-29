export async function onRequest({ params, env }) {
  const pix = await env.PIX_KV.get(params.slug);

  if (!pix) {
    return new Response("PIX não encontrado", { status: 404 });
  }

  const html = `<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <title>Oferta via PIX</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- CSS GLOBAL -->
  <link rel="stylesheet" href="/style.css">

  <!-- QRCode lib -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
</head>

<body>
  <div class="pix-page">
    <div class="container">
      <h2>Oferta via PIX</h2>

      <div id="qrcode"></div>

      <input
        id="pixKey"
        type="text"
        value="CHAVE_PIX_AQUI"
        readonly
      >

      <button id="copyBtn">Copiar chave PIX</button>

      <p id="msg"></p>
    </div>
  </div>

  <script>
    // Gera QR Code
    new QRCode(document.getElementById("qrcode"), {
      text: document.getElementById("pixKey").value,
      width: 180,
      height: 180
    });

    // Copiar PIX
    document.getElementById("copyBtn").addEventListener("click", () => {
      const input = document.getElementById("pixKey");
      input.select();
      input.setSelectionRange(0, 99999);
      navigator.clipboard.writeText(input.value);

      document.getElementById("msg").innerText = "PIX copiado com sucesso 🙌";
    });
  </script>
</body>
</html>
`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" }
  });
}
