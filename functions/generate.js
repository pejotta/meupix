export async function onRequestPost({ request, env }) {
  try {
    const { pix } = await request.json();

    if (!pix) {
      return new Response(
        JSON.stringify({ error: "PIX vazio" }),
        { status: 400 }
      );
    }

    const slug = Math.random().toString(36).slice(2, 7);

    await env.PIX_KV.put(slug, pix);

    return new Response(
      JSON.stringify({
        link: `https://meupix.pages.dev/${slug}`
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500 }
    );
  }
}
