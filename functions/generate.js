export async function onRequestPost(context) {
  try {
    const { pix } = await context.request.json();

    if (!pix) {
      return new Response("PIX vazio", { status: 400 });
    }

    const slug = Math.random().toString(36).substring(2, 7);

    await context.env.PIX_KV.put(slug, pix);

    return new Response(
      JSON.stringify({
        link: `https://meupix.pages.dev/${slug}`
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      "Erro interno: " + err.message,
      { status: 500 }
    );
  }
}
