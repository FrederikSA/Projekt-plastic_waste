// Fjern tidligere infoboks, hvis den findes
d3.select("#infoBoksMap").remove();

// Fjern tidligere kort, hvis det findes
d3.select("#my_dataviz").selectAll("*").remove();

// Opret farveskala for affaldsdata
var mapColorScale = d3.scaleLog() // Logaritmisk skala bruges til at afspejle datafordelingen
    .domain([0.000001, 0.0025, 0.0236, 0.1736, 1, 3.3, 10]) // Intervaller for affaldsmængde pr. person
    .range(["#FFFFEA", "#F2D6A2", "#F2A25C", "#D96E48", "#8C5642", "#5A2C2C", "#3E1A1A"]); // Farver til intervallerne

// Hent SVG-element og bestem dimensioner
var mapSvg = d3.select("#my_dataviz"), // Vælg SVG-elementet
    mapWidth = +mapSvg.attr("width"), // Hent bredden
    mapHeight = +mapSvg.attr("height"); // Hent højden

// Opret SVG til infoboks, der viser farveforklaringer
var mapInfoBoksSvg = d3.select("#world-map") // Vælg parent-elementet
    .append("svg") // Tilføj et SVG-element til infoboksen
    .attr("id", "infoBoksMap") // Tilføj ID til infoboksen
    .attr("width", 200) // Sæt bredden
    .attr("height", 300); // Sæt højden

// Data til infoboksen, med farver og labels
var mapInfoBoksData = [
    { color: "grey", text: "No data" }, // Ingen data
    { color: "#FFFFEA", text: "0 - 0.0025 kg" }, // Første dataområde
    { color: "#F2D6A2", text: "0.0025 - 0.0236 kg" },
    { color: "#F2A25C", text: "0.0236 - 0.1736 kg" },
    { color: "#D96E48", text: "0.1736 - 1 kg" },
    { color: "#8C5642", text: "1 - 3.3 kg" },
    { color: "#3E1A1A", text: "3.3 - 10 kg" } // Højeste dataområde
];

// Tilføj farvebokse og tekst til infoboksen
mapInfoBoksData.forEach(function(d, i) { // Iterér gennem hvert dataelement
    mapInfoBoksSvg.append("rect") // Tilføj en firkant
        .attr("x", 0) // Placér firkanten til venstre
        .attr("y", 20 + i * 30) // Placér firkanten lodret med afstand
        .attr("width", 20) // Sæt firkantens bredde
        .attr("height", 20) // Sæt firkantens højde
        .attr("fill", d.color) // Brug farven fra data
        .attr("stroke", "black"); // Tilføj sort kant

    mapInfoBoksSvg.append("text") // Tilføj tekst ved siden af firkanten
        .attr("x", 30) // Flyt teksten lidt til højre
        .attr("y", 35 + i * 30) // Placér teksten i midten af firkanten
        .text(d.text) // Brug teksten fra data
        .style("font-size", "14px") // Sæt tekstens størrelse
        .style("font-family", "Arial, sans-serif") // Vælg skrifttype
        .attr("alignment-baseline", "middle") // Centrer teksten lodret
        .attr("fill", "#ffffff"); // Sæt tekstfarven til hvid
});

// Opret kortprojektion
var mapProjection = d3.geoNaturalEarth1() // Brug Natural Earth-projektion
    .scale(mapWidth / 1.8 / Math.PI) // Skaler kortet til SVG's bredde
    .translate([mapWidth / 2, mapHeight / 1.8]); // Centrer kortet

// Funktion til at returnere affaldsdata eller "No data"
function mapWaste(countrydata) {
    if (countrydata.length === 0) // Hvis ingen data
        return "No data"; // Returner standardtekst
    else
        return countrydata[0].waste_kg_per_capita + " kg"; // Returner affaldsmængde
}

// Funktion til at finde farve for et land
function mapGetCountryColor(countryId) {
    return new Promise((resolve) => { // Returner et løfte
        d3.json("/api/percapita?countryId=" + countryId) // Hent data for landet
            .then(function(countrydata) {
                if (countrydata.length === 0) { // Hvis ingen data
                    resolve("grey"); // Brug grå farve
                } else {
                    var plasticAmount = +countrydata[0].waste_kg_per_capita; // Konverter affaldsmængde til tal
                    resolve(mapColorScale(plasticAmount)); // Brug farveskala til at finde farve
                }
            })
            .catch(function(error) { // Ved fejl
                console.error("Error fetching country data:", error); // Log fejlen
                resolve("grey"); // Returner grå som standard
            });
    });
}

// Hent GeoJSON-data og tegn kortet
d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson") // Hent data
    .then(function(data) {
        mapSvg.append("g") // Tilføj en gruppe til kortet
            .selectAll("path") // Forbered landene som paths
            .data(data.features) // Bind data til landene
            .enter().append("path") // Tegn hvert land
                .attr("d", d3.geoPath().projection(mapProjection)) // Brug projektionen
                .style("stroke", "#fff") // Tilføj hvid kant
                .each(function(d) {
                    mapGetCountryColor(d.id).then(color => { // Hent farve for landet
                        d3.select(this).attr("fill", color || "#ccc"); // Brug farven eller standardfarve
                    });
                })
                .on("click", function(event, d) { // Ved klik
                    d3.json("/api/percapita?countryId=" + d.id) // Hent data
                        .then(function(countrydata) {
                            console.log(countrydata); // Log data
                        });
                })
                .on("mouseover", function(event, d) { // Ved musover
                    d3.select(this).classed("highlight", true); // Fremhæv landet
                    d3.selectAll("path").classed("dim", true); // Dæmp andre lande
                    d3.select(this).classed("dim", false); // Fjern dæmpning fra aktuelt land
                    d3.json("/api/percapita?countryId=" + d.id) // Hent data
                        .then(function(countrydata) {
                            d3.select(".tooltipmap").remove(); // Fjern tidligere tooltip
                            d3.select("body").append("div") // Tilføj ny tooltip
                                .attr("class", "tooltipmap") // Sæt klasse
                                .style("position", "absolute") // Gør tooltip positionerbar
                                .style("background", "#ffffff") // Hvid baggrund
                                .style("color", "#000000") // Sort tekst
                                .style("padding", "5px") // Indvendig afstand
                                .style("border", "1px solid #ccc") // Grå kant
                                .style("border-radius", "5px") // Runde hjørner
                                .style("pointer-events", "none") // Deaktiver interaktion
                                .style("top", (event.pageY - 20) + "px") // Placér tooltip over musen
                                .style("left", (event.pageX + 20) + "px") // Placér tooltip til højre
                                .html(`
                                    <strong>Country:</strong> ${d.properties.name || "Ukendt land"}<br>
                                    <strong>Waste per capita:</strong> ${mapWaste(countrydata)}
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
