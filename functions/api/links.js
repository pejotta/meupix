export async function onRequestGet({ env }) {
  // O KV.list() pega as chaves criadas. 
  // Nota: No Free ele lista as primeiras 1000 chaves.
  const list = await env.PIX_KV.list();
  
  const results = await Promise.all(
    list.keys.map(async (k) => {
      const val = await env.PIX_KV.get(k.name);
      return { slug: k.name, ...JSON.parse(val) };
    })
  );

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" }
  });
}
