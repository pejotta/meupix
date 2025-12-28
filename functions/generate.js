export async function onRequestPost({ request, env }) {
  const body = await request.json();
  const pix = body.pix;

  if (!pix) {
    return new Response("PIX inválido", { status: 400 });
  }

  const slug = Math.random().toString(36).substring(2, 7);

  await env.PIX_KV.put(slug, pix);

  return new Response(JSON.stringify({
    link: `https://meupix.com/${slug}`
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
