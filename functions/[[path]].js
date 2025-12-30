export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // 1. Libera arquivos estáticos e a página inicial
  if (path.includes(".") || path === "/") {
    return next();
  }

  // 2. Tenta chamar o Worker através da associação
  try {
    // IMPORTANTE: Clonamos a request para não perder o corpo (body) em POSTs
    return await env.API_WORKER.fetch(request.clone());
  } catch (e) {
    // Se o Worker falhar (Erro 1042), ele carrega o que estiver no Pages (404 ou Dashboard)
    return next();
  }
}
