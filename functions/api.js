export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Criar link aleatório (FREE anônimo)
  if (url.pathname === "/api/create" && request.method === "POST") {
    const { pixKey } = await request.json();

    if (!pixKey || pixKey.length < 10) {
      return new Response("Chave PIX inválida", { status: 400 });
    }

    const slug = Math.random().toString(36).substring(2, 7);

    await env.PIX_KV.put(
      `slug:${slug}`,
      JSON.stringify({
        pixKey,
        createdAt: new Date().toISOString(),
        type: "anonymous"
      }),
      { expirationTtl: 60 * 60 * 24 * 30 } // 30 dias
    );

    return Response.json({
      url: `${url.origin}/${slug}`
    });
  }

  // Resolver slug público
  if (url.pathname.length === 6) {
    const slug = url.pathname.replace("/", "");
    const data = await env.PIX_KV.get(`slug:${slug}`, { type: "json" });

    if (!data) {
      return new Response("PIX não encontrado", { status: 404 });
    }

    return Response.json({
      pixKey: data.pixKey
    });
  }

  return new Response("Not Found", { status: 404 });
}
