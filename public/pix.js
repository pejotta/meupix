function copiarPix() {
  const input = document.getElementById("pixValue");
  const feedback = document.getElementById("feedback");

  input.select();
  input.setSelectionRange(0, 99999); // mobile

  navigator.clipboard.writeText(input.value).then(() => {
    feedback.innerText = "PIX copiado com sucesso ✅";
    feedback.style.color = "#16a34a";
  }).catch(() => {
    feedback.innerText = "Não foi possível copiar 😕";
    feedback.style.color = "#dc2626";
  });
}
