async function criar() {
  const pix = document.getElementById("pix").value;

  if (!pix) {
    alert("Digite uma chave PIX");
    return;
  }

  const res = await fetch("/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pix })
  });

  const data = await res.json();
  document.getElementById("resultado").innerText = data.link;
}
