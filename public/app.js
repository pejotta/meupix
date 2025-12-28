async function criar() {
  const pixKey = document.getElementById("pix").value;

  const res = await fetch("/api/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pixKey })
  });

  const data = await res.json();
  document.getElementById("resultado").innerHTML =
    `<a href="${data.url}" target="_blank">${data.url}</a>`;
}
