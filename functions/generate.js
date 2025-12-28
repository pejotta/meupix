export async function onRequestPost() {
  return new Response(
    JSON.stringify({ link: "FUNCIONOU AGORA" }),
    { headers: { "Content-Type": "application/json" } }
  );
}
