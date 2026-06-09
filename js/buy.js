const copiarPix = () => {
  const pix = document.getElementById("pixKey");

  pix.select();
  pix.setSelectionRange(0, 99999);

  navigator.clipboard.writeText(pix.value);

  alert("Chave PIX copiada!");
};