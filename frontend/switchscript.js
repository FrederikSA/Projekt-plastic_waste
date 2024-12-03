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
document.getElementById("PerCapita").addEventListener("click", function () {
    switchScript("scriptd1.js"); // Skift til Total waste per capita
});

document.getElementById("TotalWaste").addEventListener("click", function () {
    switchScript("scriptd2.js"); // Skift til Total waste emitted to the ocean
});

document.getElementById("Recycle").addEventListener("click", function () {
    switchScript("scriptd3.js"); // Skift til Recycle info
});
