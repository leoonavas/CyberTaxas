const form = document.querySelector(".form");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.querySelector('input[type="email"]').value;
  const password = document.querySelector('input[type="password"]').value;

  if (email === "" || password === "") {
    alert("Preencha todos os campos!");
    return;
  }

  alert("Login OK!");
});