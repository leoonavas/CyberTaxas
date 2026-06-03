const form = document.querySelector("form");

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const inputs = form.querySelectorAll("input, textarea");

    let campoVazio = false;

    inputs.forEach((input) => {
        if (input.value.trim() === "") {
            campoVazio = true;
        }
    });

    if (campoVazio) {
        alert("Please fill in all fields.");
        return;
    }

    alert("Message sent successfully!");
});