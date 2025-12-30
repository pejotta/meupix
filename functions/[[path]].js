export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // 1. LISTA NEGRA: Se for qualquer arquivo real do seu site, NÃO manda pro Worker
  // Adicionei explicitamente as suas páginas aqui
  const arquivosReais = [
    "/", 
    "/index.html", 
    "/login.html", 
    "/dashboard.html", 
    "/404.html",
    "/app.js",
    "/style.css"
  ];

  if (arquivosReais.includes(path) || path.includes(".") || path.startsWith("/api/")) {
    return next(); // "Passa a bola" pro Pages carregar o arquivo do GitHub
  }

  // 2. Se não for arquivo real, aí sim é um SLUG de PIX
  try {
    const response = await env.API_WORKER.fetch(request.clone());
    
    // Se o Worker devolver 404 (não achou o PIX), mostra a sua página 404 bonita
    if (response.status === 404) {
      return next();
    }
    
    return response;
  } catch (e) {
    return next();
  }
}
