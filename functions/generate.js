export async function onRequestPost({ request, env }) {
  try {
    const { pix, customSlug, userId, isPro } = await request.json();

    if (!pix) {
      return new Response(JSON.stringify({ error: "Chave PIX é obrigatória" }), { status: 400 });
    }

    let slug = customSlug ? customSlug.trim().toLowerCase() : "";

    // 1. Lógica de Link Personalizado (Slug)
    if (slug) {
      // Se não for PRO, você pode travar aqui ou no Front
      if (!isPro) {
        // Aqui daria para validar se ele já usou os 2 links gratuitos
        // Mas para simplificar agora, vamos focar na criação
      }

      const existe = await env.PIX_KV.get(slug);
      if (existe) {
        return new Response(JSON.stringify({ error: "Este atalho já existe. Escolha outro!" }), { status: 400 });
      }
    } else {
      // 2. Lógica de Link Aleatório
      slug = Math.random().toString(36).slice(2, 7);
    }

    // Salvamos no nosso Banco de Dados (KV)
    // Dica: podemos salvar um JSON como string para guardar mais infos (nome da igreja, cliques, etc)
    const dadosLink = JSON.stringify({
      pix: pix,
      owner: userId || "anonimo",
      createdAt: new Date().toISOString(),
      clicks: 0
    });

    await env.PIX_KV.put(slug, dadosLink);

    return new Response(
      JSON.stringify({
        link: `${new URL(request.url).origin}/${slug}`,
        slug: slug
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno no servidor" }), { status: 500 });
  }
}
