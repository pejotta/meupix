export async function onRequest(context) {
  const slug = context.params.slug;

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
          background: #0b0b0b;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-family: Arial, sans-serif;
        }
        .box {
          text-align: center;
        }
        input {
          width: 300px;
          padding: 10px;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="box">
        <h2>Chave PIX</h2>
        <input value="${pix}" readonly onclick="this.select()">
        <p>Clique para copiar</p>
      </div>
    </body>
    </html>
  `, {
    headers: { "Content-Type": "text/html" }
  });
}
