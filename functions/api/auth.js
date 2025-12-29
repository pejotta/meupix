export async function onRequestPost({ request, env }) {
  const { password } = await request.json();

  // Por enquanto, uma senha mestra. No futuro, buscamos no Banco de Dados (KV).
  const MASTER_PASSWORD = "igrejapix_admin"; 

  if (password === MASTER_PASSWORD) {
    // Geramos um token simples (em produção usaríamos algo mais robusto)
    return new Response(JSON.stringify({ token: "sessao_ativa_pejotta" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ error: "Senha incorreta" }), { status: 401 });
}
