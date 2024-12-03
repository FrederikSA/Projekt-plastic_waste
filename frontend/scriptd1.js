// Fjern tidligere infoboks
d3.select("#infoBoksMap").remove();

// Fjern tidligere kort (hvis det findes)
d3.select("#my_dataviz").selectAll("*").remove();

// Farveskala
var mapColorScale = d3.scaleLog()
    .domain([0.000001, 0.0025, 0.0236, 0.1736, 1, 3.3, 10]) // Intervaller
    .range(["#FFFFEA", "#F2D6A2", "#F2A25C", "#D96E48", "#8C5642", "#5A2C2C", "#3E1A1A"]); // Farver til intervaller

// The SVG
var mapSvg = d3.select("#my_dataviz"),
    mapWidth = +mapSvg.attr("width"),
    mapHeight = +mapSvg.attr("height");

// Opret SVG til infoboks til world map
var mapInfoBoksSvg = d3.select("#world-map")
    .append("svg")
    .attr("id", "infoBoksMap")
    .attr("width", 200)
    .attr("height", 300);

// Infoboks data
var mapInfoBoksData = [
    { color: "grey", text: "No data" },
    { color: "#FFFFEA", text: "0 - 0.0025 kg" },
    { color: "#F2D6A2", text: "0.0025 - 0.0236 kg" },
    { color: "#F2A25C", text: "0.0236 - 0.1736 kg" },
    { color: "#D96E48", text: "0.1736 - 1 kg" },
    { color: "#8C5642", text: "1 - 3.3 kg" },
    { color: "#3E1A1A", text: "3.3 - 10 kg" }
];

// Tilføj farvebokse
mapInfoBoksData.forEach(function(d, i) {
    mapInfoBoksSvg.append("rect")
        .attr("x", 0)
        .attr("y", 20 + i * 30)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", d.color)
        .attr("stroke", "black");

    // Teksten, som står til højre for farven
    mapInfoBoksSvg.append("text")
        .attr("x", 30)
        .attr("y", 35 + i * 30)
        .text(d.text)
        .style("font-size", "14px")
        .style("font-family", "Arial, sans-serif")
        .attr("alignment-baseline", "middle")
        .attr("fill", "#ffffff");
});

// Map and projection
var mapProjection = d3.geoNaturalEarth1()
    .scale(mapWidth / 1.8 / Math.PI)
    .translate([mapWidth / 2, mapHeight / 1.8]);

// Funktion til at give mig data, hvis vi har data og ellers give mig "Data mangler"
function mapWaste(countrydata) {
    if (countrydata.length === 0)
        return "No data";
    else
        return countrydata[0].waste_kg_per_capita + " kg";
}

// Funktion til at hente farve baseret på landets plastikdata
function mapGetCountryColor(countryId) {
    return new Promise((resolve) => {
        d3.json("/api/percapita?countryId=" + countryId)
            .then(function(countrydata) {
                if (countrydata.length === 0) {
                    resolve("grey"); // Standardfarve for lande uden data
                } else {
                    var plasticAmount = +countrydata[0].waste_kg_per_capita;
                    resolve(mapColorScale(plasticAmount)); // Returner farven for lande med data
                }
            })
            .catch(function(error) {
                console.error("Error fetching country data:", error);
                resolve("grey");
            });
    });
}

// Load external data and boot
d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
    .then(function(data) {
        // Draw the map
        mapSvg.append("g")
            .selectAll("path")
            .data(data.features)
            .enter().append("path")
                .attr("d", d3.geoPath().projection(mapProjection))
                .style("stroke", "#fff")
                .each(function(d) {
                    // Hent farve til hvert land og opdater
                    mapGetCountryColor(d.id).then(color => {
                        d3.select(this).attr("fill", color || "#ccc"); // Default farve, hvis der mangler data
                    });
                })
                .on("click", function(event, d) {
                    d3.json("/api/percapita?countryId=" + d.id)
                        .then(function(countrydata) {
                            console.log(countrydata);
                        });
                })
                .on("mouseover", function(event, d) {
                    // Fjern dæmpning fra det aktuelle land
                    d3.select(this).classed("highlight", true);

                    // Tilføj dæmpning til alle andre lande
                    d3.selectAll("path").classed("dim", true);
                    d3.select(this).classed("dim", false);

                    // Hent data for landet
                    d3.json("/api/percapita?countryId=" + d.id)
                        .then(function(countrydata) {
                            d3.select(".tooltipmap").remove();
                            
                            // Tilføjer en simpel pop-up (tooltip) med data fra API'en
                            d3.select("body").append("div")
                                .attr("class", "tooltipmap")
                                .style("position", "absolute")
                                .style("background", "#ffffff")
                                .style("color", "#000000")
                                .style("padding", "5px")
                                .style("border", "1px solid #ccc")
                                .style("border-radius", "5px")
                                .style("pointer-events", "none")
                                .style("top", (event.pageY - 20) + "px")
                                .style("left", (event.pageX + 20) + "px")
                                .html(`
                                    <strong>Country:</strong> ${d.properties.name || "Ukendt land"}<br>
                                    <strong>Waste per capita:</strong> ${mapWaste(countrydata)}
                                `);
                        });
                })
                .on("mouseout", function() {
                    // Fjern highlight fra alle lande
                    d3.selectAll("path").classed("highlight", false).classed("dim", false);

                    // Fjern tooltip
                    d3.select(".tooltipmap").remove();
                });
    })
    .catch(function(error) {
        console.error("Error loading GeoJSON data:", error);
    });
