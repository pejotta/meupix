export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Se não for um arquivo estático (css, js, png), manda pro seu Worker de API
    if (!url.pathname.includes(".") && url.pathname !== "/") {
      return fetch(`https://meupix-api.moneynanet-yt.workers.dev${url.pathname}`);
    }
    
    // Caso contrário, carrega o site normal do Pages
    return env.ASSETS.fetch(request);
  }
};
