// Funktion til at skifte mellem scripts
function switchScript(scriptName) {
    // Fjern det eksisterende script
    const oldScript = document.getElementById("dynamic-script");
    if (oldScript) oldScript.remove();

    // Tilføj det nye script
    const newScript = document.createElement("script");
    newScript.src = scriptName; // Indlæser det ønskede script
    newScript.id = "dynamic-script"; // Giver scriptet et ID for lettere styring
    document.body.appendChild(newScript);
}

// Event listeners til knapperne
document.getElementById("button1").addEventListener("click", function () {
    switchScript("scriptd1.js"); // Skift til Dataset 1
});

document.getElementById("button2").addEventListener("click", function () {
    switchScript("scriptd2.js"); // Skift til Dataset 2
});

document.getElementById("button3").addEventListener("click", function () {
    switchScript("scriptd3.js"); // Skift til Dataset 3 (hvis nødvendigt)
});
