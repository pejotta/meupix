export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;
  const url = new URL(request.url);

  // GET: Lista os links para o Dashboard
  if (method === "GET") {
    const list = await env.PIX_KV.list();
    const results = await Promise.all(
      list.keys.map(async (k) => {
        const val = await env.PIX_KV.get(k.name);
        try {
          return { slug: k.name, ...JSON.parse(val) };
        } catch (e) {
          return { slug: k.name, pix: val, clicks: 0 };
        }
      })
    );
    return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
  }

  // DELETE: Apaga um link via query string (?slug=xxx)
  if (method === "DELETE") {
    const slug = url.searchParams.get("slug");
    if (!slug) return new Response("Slug ausente", { status: 400 });
    await env.PIX_KV.delete(slug);
    return new Response(JSON.stringify({ success: true }));
  }

  return new Response("Método não permitido", { status: 405 });
}
