const form = document.querySelector(".form");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (email === "" || password === "") {
    alert("Preencha todos os campos!");
    return;
  }

  alert("Login OK!");
});