export async function onRequest(context) {
  const { request, env, next } = context;
  const path = new URL(request.url).pathname;

  // Se for o diretório raiz ou qualquer arquivo (com ponto), ignore o Worker
  if (path === "/" || path.includes(".")) {
    return next();
  }

  try {
    const response = await env.API_WORKER.fetch(request.clone());
    return response.status === 404 ? next() : response;
  } catch (e) {
    return next();
  }
}
