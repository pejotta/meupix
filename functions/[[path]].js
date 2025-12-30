export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // 1. Se for a home, login, dashboard ou arquivos estáticos (.css, .js, .png), 
  // deixa o Pages carregar os arquivos normais do GitHub.
  if (path === "/" || path.includes(".") || path.startsWith("/api/")) {
    return next();
  }

  // 2. Para QUALQUER outra rota (os nossos slugs), 
  // ele chama o seu Worker através do Service Binding que você já criou.
  try {
    // A variável API_WORKER deve ser a mesma que você configurou no print 6
    return await env.API_WORKER.fetch(request.clone());
  } catch (e) {
    // Se der erro no Worker, carrega a página 404 que você criou
    return next();
  }
}
