import '@/styles/style.css'

export default function PixPage() {
  return (
    <div className="pix-page">
      <div className="container">
        <h2>Oferta via PIX</h2>

        <div id="qrcode"></div>

        <input
          id="pixKey"
          value="CHAVE_PIX_AQUI"
          readOnly
        />

        <button onClick={copiar}>
          Copiar chave PIX
        </button>

        <p id="msg"></p>
      </div>
    </div>
  )
}

function copiar() {
  const input = document.getElementById('pixKey')
  input.select()
  document.execCommand('copy')

  document.getElementById('msg').innerText = 'Chave copiada!'
}
