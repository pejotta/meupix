export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // 1. Se for a raiz ou tiver ponto (arquivo), carrega o Pages direto
  if (path === "/" || path.includes(".")) {
    return next();
  }

  // 2. Para slugs, chama o Worker pela URL pública em vez da associação
  try {
    const workerUrl = `https://meupix-api.moneynanet-yt.workers.dev${path}`;
    
    const response = await fetch(workerUrl, {
      method: request.method,
      headers: request.headers,
      redirect: "follow"
    });

    // Se o Worker retornar 404, deixa o Pages mostrar o seu 404.html
    if (response.status === 404) return next();

    return response;
  } catch (e) {
    // Se tudo falhar, não trava o site, tenta carregar o próximo recurso
    return next();
  }
}
