const abrirLogin = () => {
  document.querySelector(".land-page").classList.add("fade-out");

  setTimeout(() => {
    window.location.href = "login.html";
  }, 800);
};
