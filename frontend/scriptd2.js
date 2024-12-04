// Fjern tidligere infoboks, hvis den findes
d3.select("#infoBoksMap").remove();

// Fjern tidligere kort, hvis det findes
d3.select("#my_dataviz").selectAll("*").remove();

// Opret farveskala til kortet
var totalMapColorScale = d3.scaleLog() // Brug logaritmisk skala til dataintervaller
    .domain([1, 10, 250, 1000, 10000, 400000, 1000000]) // Intervaller for affaldsmængder
    .range(["#F8FCFF", "#B2D5E7", "#71B1D9", "#538DC5", "#3E5A89", "#1E3A56", "#0A1C33"]); // Tilsvarende farver

// Hent SVG-element og dimensioner til kortet
var totalMapSvg = d3.select("#my_dataviz"), // Vælg SVG-elementet
    totalMapWidth = +totalMapSvg.attr("width"), // Få bredden fra SVG-elementet
    totalMapHeight = +totalMapSvg.attr("height"); // Få højden fra SVG-elementet

// Opret SVG til infoboks
var totalMapInfoBoksSvg = d3.select("#world-map") // Vælg container til infoboksen
    .append("svg") // Tilføj et SVG-element
    .attr("id", "infoBoksMap") // Giv SVG'en et ID
    .attr("width", 200) // Sæt bredden
    .attr("height", 300); // Sæt højden

// Data til infoboks (farver og labels)
var totalMapInfoBoksData = [
    { color: "grey", text: "No data" }, // Ingen data
    { color: "#F8FCFF", text: "0 - 10 Tons" }, // Første interval
    { color: "#B2D5E7", text: "10 - 250 Tons" },
    { color: "#71B1D9", text: "250 - 1.000 Tons" },
    { color: "#538DC5", text: "1.000 - 10.000 Tons" },
    { color: "#3E5A89", text: "10.000 - 400.000 Tons" },
    { color: "#0A1C33", text: "400.000 - 1.000.000 Tons" } // Højeste interval
];

// Tilføj farvebokse og labels til infoboksen
totalMapInfoBoksData.forEach(function(d, i) { // Gå igennem hvert dataelement
    totalMapInfoBoksSvg.append("rect") // Tilføj en farvet firkant
        .attr("x", 0) // Placér i venstre side
        .attr("y", 20 + i * 30) // Juster lodret position med mellemrum
        .attr("width", 20) // Sæt bredden på firkanten
        .attr("height", 20) // Sæt højden på firkanten
        .attr("fill", d.color) // Brug farven fra data
        .attr("stroke", "black"); // Tilføj sort kant

    totalMapInfoBoksSvg.append("text") // Tilføj tekst ved siden af firkanten
        .attr("x", 30) // Flyt teksten lidt til højre
        .attr("y", 35 + i * 30) // Juster lodret position
        .text(d.text) // Brug teksten fra data
        .style("font-size", "14px") // Sæt tekststørrelse
        .style("font-family", "Arial, sans-serif") // Vælg skrifttype
        .attr("alignment-baseline", "middle") // Centrer teksten lodret
        .attr("fill", "#ffffff"); // Sæt tekstfarve til hvid
});

// Opret kortprojektion
var totalMapProjection = d3.geoNaturalEarth1() // Brug Natural Earth-projektion
    .scale(totalMapWidth / 1.8 / Math.PI) // Skaler kortet til SVG's bredde
    .translate([totalMapWidth / 2, totalMapHeight / 1.8]); // Centrer kortet

// Funktion til at hente affaldsdata eller returnere "No data"
function totalMapWaste(countrydata) {
    if (countrydata.length === 0) // Hvis der ikke er data
        return "No data"; // Returner standardtekst
    else
        return countrydata[0].total_plastic_waste_mt + " metric tons"; // Returner affaldsmængde
}

// Funktion til at finde farve for et land
function totalMapGetCountryColor(countryId) {
    return new Promise((resolve) => { // Returner et løfte
        d3.json("/api/totalwaste?countryId=" + countryId) // Hent data for landet
            .then(function(countrydata) {
                if (countrydata.length === 0) { // Hvis der ikke er data
                    resolve("grey"); // Brug grå farve
                } else {
                    var plasticAmount = +countrydata[0].total_plastic_waste_mt; // Konverter affaldsmængde til tal
                    resolve(totalMapColorScale(plasticAmount)); // Brug farveskala til at finde farve
                }
            })
            .catch(function(error) { // Ved fejl
                console.error("Error fetching country data:", error); // Log fejl
                resolve("grey"); // Returner grå farve
            });
    });
}

// Hent GeoJSON-data og tegn kortet
d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson") // Hent data
    .then(function(data) {
        totalMapSvg.append("g") // Tilføj en gruppe til kortet
            .selectAll("path") // Forbered landene som paths
            .data(data.features) // Bind data til landene
            .enter().append("path") // Tegn landene
                .attr("d", d3.geoPath().projection(totalMapProjection)) // Brug projektionen
                .style("stroke", "#fff") // Tilføj hvid kant
                .each(function(d) {
                    totalMapGetCountryColor(d.id).then(color => { // Hent farve for landet
                        d3.select(this).attr("fill", color || "#ccc"); // Brug farve eller standardfarve
                    });
                })
                .on("click", function(event, d) { // Ved klik
                    d3.json("/api/totalwaste?countryId=" + d.id) // Hent data
                        .then(function(countrydata) {
                            console.log(countrydata); // Log data
                        });
                })
                .on("mouseover", function(event, d) { // Når musen er over landet
                    d3.select(this).classed("highlight", true); // Fremhæv landet
                    d3.selectAll("path").classed("dim", true); // Dæmp andre lande
                    d3.select(this).classed("dim", false); // Fjern dæmpning for aktuelt land
                    d3.json("/api/totalwaste?countryId=" + d.id) // Hent data for landet
                        .then(function(countrydata) {
                            d3.select(".tooltipmap").remove(); // Fjern tidligere tooltip

                            // Tilføj en tooltip med data
                            d3.select("body").append("div")
                                .attr("class", "tooltipmap") // Giv tooltip klasse
                                .style("position", "absolute") // Placér tooltip frit
                                .style("background", "#ffffff") // Hvid baggrund
                                .style("color", "#000000") // Sort tekst
                                .style("padding", "5px") // Indvendig afstand
                                .style("border", "1px solid #ccc") // Grå kant
                                .style("border-radius", "5px") // Runde hjørner
                                .style("pointer-events", "none") // Ingen mus-interaktion
                                .style("top", (event.pageY - 20) + "px") // Placér tooltip over mus
                                .style("left", (event.pageX + 20) + "px") // Placér tooltip til højre
                                .html(`
                                    <strong>Country:</strong> ${d.properties.name || "Ukendt land"}<br>
                                    <strong>Total waste:</strong> ${totalMapWaste(countrydata)}
                                `); // Indsæt tekst og data
                        });
                })
                .on("mouseout", function() { // Når musen forlader landet
                    d3.selectAll("path").classed("highlight", false).classed("dim", false); // Fjern fremhævning
                    d3.select(".tooltipmap").remove(); // Fjern tooltip
                });
    })
    .catch(function(error) { // Ved fejl
        console.error("Error loading GeoJSON data:", error); // Log fejlen
    });
