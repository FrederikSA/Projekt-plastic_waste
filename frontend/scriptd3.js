// Fjern tidligere infoboks, hvis den findes
d3.select("#infoBoksMap").remove();

// Fjern tidligere kort, hvis det findes
d3.select("#my_dataviz").selectAll("*").remove();

// Opret farveskala til kortet
var recycleMapColorScale = d3.scaleLog() // Brug logaritmisk skala for jævnt at håndtere data
    .domain([0.01, 5, 25, 45, 65, 85]) // Intervaller for genbrugsrater
    .range(["#eef9e0", "#C7E9C0", "#7FCDBB", "#41a891", "#317e6c", "#215448"]); // Farver til intervaller

// Hent SVG-element og dimensioner til kortet
var recycleMapSvg = d3.select("#my_dataviz"), // Vælg SVG-elementet
    recycleMapWidth = +recycleMapSvg.attr("width"), // Hent bredde fra SVG-element
    recycleMapHeight = +recycleMapSvg.attr("height"); // Hent højde fra SVG-element

// Opret SVG-element til infoboks
var recycleMapInfoBoksSvg = d3.select("#world-map") // Vælg containeren
    .append("svg") // Tilføj SVG til infoboksen
    .attr("id", "infoBoksMap") // Giv infoboksen et ID
    .attr("width", 200) // Sæt bredde
    .attr("height", 300); // Sæt højde

// Data til infoboks (farver og intervaller)
var recycleMapInfoBoksData = [
    { color: "grey", text: "No data" }, // Ingen data
    { color: "#eef9e0", text: "0% - 5%" }, // Laveste interval
    { color: "#C7E9C0", text: "5% - 25%" },
    { color: "#7FCDBB", text: "25% - 45%" },
    { color: "#41a891", text: "45% - 65%" },
    { color: "#317e6c", text: "65% - 85%" },
    { color: "#215448", text: "85% - 100%" } // Højeste interval
];

// Tilføj farvebokse og labels til infoboksen
recycleMapInfoBoksData.forEach(function(d, i) { // Iterér gennem data
    recycleMapInfoBoksSvg.append("rect") // Tilføj en farvet firkant
        .attr("x", 0) // Placér til venstre
        .attr("y", 20 + i * 30) // Juster lodret position
        .attr("width", 20) // Sæt bredde
        .attr("height", 20) // Sæt højde
        .attr("fill", d.color) // Brug farve fra data
        .attr("stroke", "black"); // Tilføj sort kant

    recycleMapInfoBoksSvg.append("text") // Tilføj tekst ved siden af firkanten
        .attr("x", 30) // Flyt tekst lidt til højre
        .attr("y", 35 + i * 30) // Juster lodret position
        .text(d.text) // Brug tekst fra data
        .style("font-size", "14px") // Sæt tekststørrelse
        .style("font-family", "Arial, sans-serif") // Brug Arial-skrifttype
        .attr("alignment-baseline", "middle") // Centrer teksten lodret
        .attr("fill", "#ffffff"); // Sæt tekstfarve til hvid
});

// Opret kortprojektion
var recycleMapProjection = d3.geoNaturalEarth1() // Brug Natural Earth-projektion
    .scale(recycleMapWidth / 1.8 / Math.PI) // Skaler kortet til SVG-bredde
    .translate([recycleMapWidth / 2, recycleMapHeight / 1.8]); // Centrer kortet

// Funktion til at returnere genbrugsdata eller "No data"
function recycleMapWaste(countrydata) {
    if (countrydata.length === 0) // Hvis ingen data
        return "No data"; // Returner standardtekst
    else
        return countrydata[0].recycling_rate + "%"; // Returner genbrugsrate
}

// Funktion til at finde farve for et land baseret på genbrugsdata
function recycleMapGetCountryColor(countryId) {
    return new Promise((resolve) => { // Returner et løfte
        d3.json("/api/recycleinfo?countryId=" + countryId) // Hent data for landet
            .then(function(countrydata) {
                if (countrydata.length === 0) { // Hvis ingen data
                    resolve("grey"); // Brug grå farve
                } else {
                    var recyclingRate = +countrydata[0].recycling_rate; // Konverter genbrugsrate til tal
                    resolve(recycleMapColorScale(recyclingRate)); // Brug farveskala til at finde farve
                }
            })
            .catch(function(error) { // Ved fejl
                console.error("Error fetching country data:", error); // Log fejl
                resolve("grey"); // Returner grå som standard
            });
    });
}

// Hent GeoJSON-data og tegn kortet
d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson") // Hent data
    .then(function(data) {
        recycleMapSvg.append("g") // Tilføj en gruppe til kortet
            .selectAll("path") // Forbered landene som paths
            .data(data.features) // Bind data til landene
            .enter().append("path") // Tegn hvert land
                .attr("d", d3.geoPath().projection(recycleMapProjection)) // Brug projektionen
                .style("stroke", "#fff") // Tilføj hvid kant
                .each(function(d) {
                    recycleMapGetCountryColor(d.id).then(color => { // Hent farve for landet
                        d3.select(this).attr("fill", color || "#ccc"); // Brug farve eller standardfarve
                    });
                })
                .on("click", function(event, d) { // Ved klik
                    d3.json("/api/recycleinfo?countryId=" + d.id) // Hent data for landet
                        .then(function(countrydata) {
                            console.log(countrydata); // Log data
                        });
                })
                .on("mouseover", function(event, d) { // Ved musover
                    d3.select(this).classed("highlight", true); // Fremhæv landet
                    d3.selectAll("path").classed("dim", true); // Dæmp andre lande
                    d3.select(this).classed("dim", false); // Fjern dæmpning for aktuelt land
                    d3.json("/api/recycleinfo?countryId=" + d.id) // Hent data
                        .then(function(countrydata) {
                            d3.select(".tooltipmap").remove(); // Fjern tidligere tooltip

                            // Tilføj en tooltip med data
                            d3.select("body").append("div")
                                .attr("class", "tooltipmap") // Giv tooltip klasse
                                .style("position", "absolute") // Placér tooltip frit
                                .style("background", "#ffffff") // Hvid baggrund
                                .style("color", "#000000") // Sort tekst
                                .style("padding", "5px") // Tilføj padding
                                .style("border", "1px solid #ccc") // Tilføj grå kant
                                .style("border-radius", "5px") // Runde hjørner
                                .style("pointer-events", "none") // Ingen mus-interaktion
                                .style("top", (event.pageY - 20) + "px") // Placér tooltip over mus
                                .style("left", (event.pageX + 20) + "px") // Placér tooltip til højre
                                .html(`
                                    <strong>Country:</strong> ${d.properties.name || "Ukendt land"}<br>
                                    <strong>Recycling rate:</strong> ${recycleMapWaste(countrydata)}
                                `); // Indsæt data
                        });
                })
                .on("mouseout", function() { // Ved mus ud af landet
                    d3.selectAll("path").classed("highlight", false).classed("dim", false); // Fjern fremhævning
                    d3.select(".tooltipmap").remove(); // Fjern tooltip
                });
    })
    .catch(function(error) { // Hvis der opstår fejl
        console.error("Error loading GeoJSON data:", error); // Log fejlen
    });
