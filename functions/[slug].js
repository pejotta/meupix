export async function onRequest(context) {
  const slug = context.params.slug;

  // 🔒 Ignora arquivos estáticos (css, js, png, etc)
  if (slug.includes(".")) {
    return context.next();
  }

  const pix = await context.env.PIX_KV.get(slug);

  if (!pix) {
    return new Response("Link PIX não encontrado", { status: 404 });
  }

  return new Response(`
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <title>Copiar PIX</title>
      <style>
        body {
          background:#0b0b0b;
          color:#fff;
          font-family:Arial,sans-serif;
          display:flex;
          align-items:center;
          justify-content:center;
          height:100vh;
        }
        input {
          width:320px;
          padding:14px;
          font-size:16px;
          text-align:center;
        }
      </style>
    </head>
    <body>
      <div>
        <h2>Chave PIX</h2>
        <input value="${pix}" readonly onclick="this.select()">
      </div>
    </body>
    </html>
  `, {
    headers: { "Content-Type": "text/html" }
  });
}
