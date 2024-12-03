// Fjern tidligere infoboks
d3.select("#infoBoksMap").remove();

// Fjern tidligere kort (hvis det findes)
d3.select("#my_dataviz").selectAll("*").remove();

// Farveskala
var totalMapColorScale = d3.scaleLog()
    .domain([1, 10, 250, 1000, 10000, 400000, 1000000]) // Intervaller
    .range(["#F8FCFF", "#B2D5E7", "#71B1D9", "#538DC5", "#3E5A89", "#1E3A56", "#0A1C33"]); // Farver til intervaller

// The SVG
var totalMapSvg = d3.select("#my_dataviz"),
    totalMapWidth = +totalMapSvg.attr("width"),
    totalMapHeight = +totalMapSvg.attr("height");

// Opret SVG til infoboks til world map
var totalMapInfoBoksSvg = d3.select("#world-map")
    .append("svg")
    .attr("id", "infoBoksMap")
    .attr("width", 200)
    .attr("height", 300);

// Infoboks data
var totalMapInfoBoksData = [
    { color: "grey", text: "No data" },
    { color: "#F8FCFF", text: "0 - 10 Tons" },
    { color: "#B2D5E7", text: "10 - 250 Tons" },
    { color: "#71B1D9", text: "250 - 1.000 Tons" },
    { color: "#538DC5", text: "1.000 - 10.000 Tons" },
    { color: "#3E5A89", text: "10.000 - 400.000 Tons" },
    { color: "#0A1C33", text: "400.000 - 1.000.000 Tons" }
];

// Tilføj farvebokse
totalMapInfoBoksData.forEach(function(d, i) {
    totalMapInfoBoksSvg.append("rect")
        .attr("x", 0)
        .attr("y", 20 + i * 30)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", d.color)
        .attr("stroke", "black");

    // Teksten, som står til højre for farven
    totalMapInfoBoksSvg.append("text")
        .attr("x", 30)
        .attr("y", 35 + i * 30)
        .text(d.text)
        .style("font-size", "14px")
        .style("font-family", "Arial, sans-serif")
        .attr("alignment-baseline", "middle")
        .attr("fill", "#ffffff");
});

// Map and projection
var totalMapProjection = d3.geoNaturalEarth1()
    .scale(totalMapWidth / 1.8 / Math.PI)
    .translate([totalMapWidth / 2, totalMapHeight / 1.8]);

// Funktion til at give data hvis vi har data, og ellers give "No data"
function totalMapWaste(countrydata) {
    if (countrydata.length === 0)
        return "No data";
    else
        return countrydata[0].total_plastic_waste_mt + " metric tons";
}

// Funktion til at hente farve baseret på landets plastikdata
function totalMapGetCountryColor(countryId) {
    return new Promise((resolve) => {
        d3.json("/api/totalwaste?countryId=" + countryId)
            .then(function(countrydata) {
                if (countrydata.length === 0) {
                    resolve("grey"); // Standardfarve for lande uden data
                } else {
                    var plasticAmount = +countrydata[0].total_plastic_waste_mt;
                    resolve(totalMapColorScale(plasticAmount)); // Returner farven for lande med data
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
        totalMapSvg.append("g")
            .selectAll("path")
            .data(data.features)
            .enter().append("path")
                .attr("d", d3.geoPath().projection(totalMapProjection))
                .style("stroke", "#fff")
                .each(function(d) {
                    // Hent farve til hvert land og opdater
                    totalMapGetCountryColor(d.id).then(color => {
                        d3.select(this).attr("fill", color || "#ccc"); // Default farve, hvis der mangler data
                    });
                })
                .on("click", function(event, d) {
                    d3.json("/api/totalwaste?countryId=" + d.id)
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
                    d3.json("/api/totalwaste?countryId=" + d.id)
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
                                    <strong>Total waste:</strong> ${totalMapWaste(countrydata)}
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
