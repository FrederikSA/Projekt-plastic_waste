// WORLD MAP

// Fjern tidligere infoboks, hvis den findes
d3.select("#infoBoksMap").remove();

// Fjern tidligere kort (alle elementer inden for SVG'en), hvis det findes
d3.select("#my_dataviz").selectAll("*").remove();

// Definer farveskala til kortet
var mapColorScale = d3.scaleLog() // Brug logaritmisk skala til farveintervaller
  .domain([0.000001, 0.0025, 0.0236, 0.1736, 1, 3.3, 10]) // Intervaller for affaldsmængder
  .range(["#FFFFEA", "#F2D6A2", "#F2A25C", "#D96E48", "#8C5642", "#5A2C2C", "#3E1A1A"]); // Farver til intervallerne

// Hent SVG-elementet til kortet og dets dimensioner
var mapSvg = d3.select("#my_dataviz"), // Vælger SVG-elementet
  mapWidth = +mapSvg.attr("width"), // Får bredden fra SVG-elementets attribut
  mapHeight = +mapSvg.attr("height"); // Får højden fra SVG-elementets attribut

// Opret SVG til infoboks, der viser forklaringer
var mapInfoBoksSvg = d3.select("#world-map") // Vælg container til infoboksen
  .append("svg") // Tilføj en SVG til infoboksen
  .attr("id", "infoBoksMap") // Giv den et ID for nem adgang
  .attr("width", 200) // Sæt infoboksens bredde
  .attr("height", 300); // Sæt infoboksens højde

// Data til infoboksen, der indeholder farver og beskrivelser
var mapInfoBoksData = [
  { color: "grey", text: "No data" }, // Ingen data, så skal den være grå
  { color: "#FFFFEA", text: "0 - 0.0025 kg" }, // Farve og interval for lav affaldsmængde
  { color: "#F2D6A2", text: "0.0025 - 0.0236 kg" }, // Næste interval
  { color: "#F2A25C", text: "0.0236 - 0.1736 kg" },
  { color: "#D96E48", text: "0.1736 - 1 kg" },
  { color: "#8C5642", text: "1 - 3.3 kg" },
  { color: "#3E1A1A", text: "3.3 - 10 kg" } // Højeste affaldsniveau
];

// Tilføj farvebokse og tekst til infoboksen
mapInfoBoksData.forEach(function(d, i) { // Gennemløb hvert dataelement
  mapInfoBoksSvg.append("rect") // Tilføj en farvet firkant
    .attr("x", 0) // Placér firkanten i venstre side
    .attr("y", 20 + i * 30) // Juster vertikal placering for hver række
    .attr("width", 20) // Firkantens bredde
    .attr("height", 20) // Firkantens højde
    .attr("fill", d.color) // Firkantens farve fra data
    .attr("stroke", "black"); // Sort kant omkring firkanten

  mapInfoBoksSvg.append("text") // Tilføj forklarende tekst ved siden af firkanten
    .attr("x", 30) // Placér teksten lidt til højre for firkanten
    .attr("y", 35 + i * 30) // Juster vertikal placering for hver række
    .text(d.text) // Sæt teksten fra data
    .style("font-size", "14px") // Tekstens størrelse
    .style("font-family", "Arial, sans-serif") // Skrifttype
    .attr("alignment-baseline", "middle") // Justér teksten lodret i midten
    .attr("fill", "#ffffff"); // Hvid tekstfarve
});

// Opret kortprojektion
var mapProjection = d3.geoNaturalEarth1() // Brug Natural Earth-projektion
  .scale(mapWidth / 1.8 / Math.PI) // Skaler kortet til SVG's bredde
  .translate([mapWidth / 2, mapHeight / 1.8]); // Centrer kortet i SVG'en

// Funktion til at hente affaldsdata eller returnere "No data"
function mapWaste(countrydata) {
  if (countrydata.length === 0) // Hvis der ikke er data
      return "No data"; // Returner teksten "No data"
  else
      return countrydata[0].waste_kg_per_capita + " kg"; // Returner affaldsmængden
}

// Funktion til at finde farve for et land baseret på dets affaldsdata
function mapGetCountryColor(countryId) {
  return new Promise((resolve) => { // Returner et løfte for asynkron datahentning
    d3.json("/api/percapita?countryId=" + countryId) // Hent data for landet
        .then(function(countrydata) {
            if (countrydata.length === 0) { // Hvis der ikke er data
                resolve("grey"); // Returner grå farve
            } else {
                var plasticAmount = +countrydata[0].waste_kg_per_capita; // Konverter affaldsmængden til tal
                resolve(mapColorScale(plasticAmount)); // Brug farveskala til at finde farven
            }
        })
        .catch(function(error) { // Hvis der opstår en fejl
          console.error("Error fetching country data:", error); // Log fejlen
          resolve("grey"); // Returner grå farve som standard
        });
  });
}

// Hent GeoJSON-data og tegn kortet
d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson") // Hent data til kortet
    .then(function(data) {
      mapSvg.append("g") // Tilføj en gruppe til kortet
          .selectAll("path") // Forbered til at tegne lande
          .data(data.features) // Bind GeoJSON-data til landene
          .enter().append("path") // Tegn lande som stier
          .attr("d", d3.geoPath().projection(mapProjection)) // Brug projektionen til at tegne
          .style("stroke", "#fff") // Tilføj hvid kant til landene
          .each(function(d) {
            mapGetCountryColor(d.id).then(color => { // Hent farve for landet
              d3.select(this).attr("fill", color || "#ccc"); // Sæt farven eller standardfarve
              });
          })
          .on("click", function(event, d) { // Når et land klikkes
            d3.json("/api/percapita?countryId=" + d.id) // Hent data for landet
              .then(function(countrydata) {
                console.log(countrydata); // Log dataen
              });
          })
          .on("mouseover", function(event, d) { // Når musen er over et land
            d3.select(this).classed("highlight", true); // Fremhæv landet
            d3.selectAll("path").classed("dim", true); // Dæmp andre lande
            d3.select(this).classed("dim", false); // Fjern dæmpning fra aktuelt land
            d3.json("/api/percapita?countryId=" + d.id) // Hent data for landet
                .then(function(countrydata) {
                  d3.select(".tooltipmap").remove(); // Fjern tidligere tooltip
                  d3.select("body").append("div") // Tilføj ny tooltip
                    .attr("class", "tooltipmap") // Giv tooltip en klasse
                    .style("position", "absolute") // Placér tooltipen frit
                    .style("background", "#ffffff") // Hvid baggrund
                    .style("color", "#000000") // Sort tekst
                    .style("padding", "5px") // Indvendig afstand
                    .style("border", "1px solid #ccc") // Grå kant
                    .style("border-radius", "5px") // Runde hjørner
                    .style("pointer-events", "none") // Deaktiver mus på tooltip
                    .style("top", (event.pageY - 20) + "px") // Placér tooltip over musen
                    .style("left", (event.pageX + 20) + "px") // Placér tooltip til højre for musen
                    .html(`
                      <strong>Country:</strong> ${d.properties.name || "Ukendt land"}<br>
                      <strong>Waste per capita:</strong> ${mapWaste(countrydata)}
                      `); // Indhold til tooltip
                });
          })
          .on("mouseout", function() { // Når musen forlader landet
            d3.selectAll("path").classed("highlight", false).classed("dim", false); // Fjern fremhævning
            d3.select(".tooltipmap").remove(); // Fjern tooltip
          });
    })
    .catch(function(error) { // Hvis data ikke kan hentes
        console.error("Error loading GeoJSON data:", error); // Log fejl
    });






// linechart
// Her henter vi dataen inde fra server.js
fetch('/api/linechart')
  .then(response => response.json())
  .then(data => {
    // Konverter data
    data.forEach(d => {
      d.year = +d.year; // Gør år til tal
      d.plastic_production = +d.plastic_production; // Gør produktion til tal
    });

    // Dimensioner og marginer. Bestemmer hvor meget plads line charten har og hvor på siden den er placeret
    const width = 800;
    const height = 500;
    const margin = { top: 20, right: 30, bottom: 50, left: 70 };

    // Skaler. Her koder den ind hvor lang x aksen skal være. Den ranger derfor fra marging left til right
    const xScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.year), 2020]) // Udvid X-aksen til 2020
      .range([margin.left, width - margin.right]);

      // Her koder den ind hvordan y aksen skal folde sig ud
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.plastic_production)]) // Produktion max
      .range([height - margin.bottom, margin.top]);

    // SVG container. Tager i mod dataen fra d3. 
    const svg = d3.select("#combined-chart-b")
      .attr("width", width)
      .attr("height", height);

    // X-akse. g er en beholder som kan indeholde flere grafiske elementer.
    // .attr("transform", `translate(0,${height - margin.bottom})`) Denne del gør så x aksen bliver placeret rigtigt på siden. 
    //xScale skaber tallene nede på x-aksen
    // tickFormat(d3.format("d")) til sidst gør at det er hel tal og ikke med decimaltal
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")))

    // Y-akse. Denne kode gør lidt det samme som før bare for y aksen, altså aksen bliver så placeret rigtigt ude til venstre
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).tickFormat(d3.format(".2s")));

    // Linjegenerator. Den laver en linje og designer linjen udfra den data den får og placere den rigtigt på x og y aksen
    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.plastic_production));

    // Tegn linjen. Her designer man på linjen så den får fylde og tydelighed. Man giver den en class så man kan style den på css filen. Det er en styling til linjen. 
    svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke-width", 2);

    // Tooltip
    const graphTooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip graph-tooltip");

    // Cirkel til at følge musen. Laver en cirkel på line charten. den tydeliggøre størrelsen af cirklen, farven og gør cirklen usynlig til at starte med. 
    const circle = svg.append("circle")
      .attr("r", 5)
      .attr("fill", "red")
      .style("opacity", 0); // Start skjult

    // Interaktionslag. Det er for selv området omkring line charten, det gør så der interation mellem din mus og området. Den gør så området usynligt, så man ikke kan se området dette interaktions design fungere henne. 
    svg.append("rect")
      .attr("class", "hover-rect")
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mousemove", function (event) {
        const [mouseX, mouseY] = d3.pointer(event, svg.node());
        const invertedX = xScale.invert(mouseX);

        // Find nærmeste datapunkt. Den gør så nåpr du holder musen over line charten eller inden for rektanglen som er forklaret usynlig tidligere finder den det nærmeste datapunkt. Så den finder nærmeste punkt på y og x aksen. 
        const closestData = data.reduce((a, b) =>
          Math.abs(b.year - invertedX) < Math.abs(a.year - invertedX) ? b : a
        );

        if (closestData) {
          const x = xScale(closestData.year);
          const y = yScale(closestData.plastic_production);

          // Flyt cirklen og gør den synlig
          circle
            .attr("cx", x)
            .attr("cy", y)
            .style("opacity", 1); // Gør cirklen synlig

          // Tooltip vises
          // Den er med til at cirklen fungere indenfor rektanglen. viser dataen der bliver vist det gældende sted man holder musen. Den skjuler tooltip når musen ikke er over grafen. 
          graphTooltip
            .style("display", "block")
            .html(`
              <strong>Year:</strong> ${closestData.year}<br>
              <strong>Production:</strong> ${d3.format(",")(closestData.plastic_production)} tons
            `)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
        }
      })
      .on("mouseout", () => {
        graphTooltip.style("display", "none"); // Skjul tooltip
        circle.style("opacity", 0); // Skjul cirklen
      });
  })
  .catch(error => console.error("Fejl ved indlæsning af data:", error));





  // Comparison Visualisering

const width = 800; // Bredden af visualiseringsområdet
const height = 500; // Højden af visualiseringsområdet
const plasticPercentage = 0.0001; // // Andelen af plastikaffald
const totalParticles = Math.floor((width * height) * plasticPercentage); // Beregner det samlede antal plastikpartikler

// "container", som indeholder en reference til HTML-elementet med id "visualization" ved hjælp af D3.js
const container = d3.select("#visualization");

// Funktion til at generere en tilfældig position og størrelse for en partikel
function getRandomPosition() {
    const x = Math.random() * (width); // Tilfældig x-position inden for bredden
    const y = Math.random() * 100 + (height - 100); // Begrænser y til de nederste 300px
    const size = Math.random() * 5 + 2; // Tilfældig størrelse på partikel mellem 2 og 7 pixels
    return { x, y, size }; // Returnerer position og størrelse som et objekt
}

// Genererer de enkelte plastikpartikler og tilføjer dem til visualiseringen
for (let i = 0; i < totalParticles; i++) {
    const position = getRandomPosition(); // kalder funktionen getRandomPosition() og gemmer resultatet i variablen position

    container.append("div") // Tilføjer en ny div til containeren
        .attr("class", "plastic") // Giver div'en klassen "plastic"
        .style("width", `${position.size}px`) // Sætter bredden af partiklen
        .style("height", `${position.size}px`) // Sætter højden af partiklen
        .style("left", `${position.x}px`) // Sætter x-positionen af partiklen
        .style("top", `${position.y}px`); // Sætter y-positionen af partiklen
}

// Funktion til at skabe en fisk
function createFish(className, color, startX, startY, direction) {
    const fish = container.append("div") // Tilføjer en ny div for fisken
        .attr("class", `fish ${className}`) // Giver fisken en klasse
        .style("top", `${startY}px`) // Sætter start y-position
        .style("left", `${startX}px`); // Sætter start x-position

    const fishTail = fish.append("div") // Tilføjer et nyt ekstra div som repræsentere halen til fisken
        .attr("class", "fish-tail") // Giver halen klassen "fish-tail"
        .style("border-left-color", color); // Sætter farven på halen

    const fishBody = fish.append("div") // På samme måde tilføjes fiskens krop
        .attr("class", "fish-body") // Giver kroppen klassen "fish-body"
        .style("background-color", color); // Sætter farven på kroppen

    const fishEye = fishBody.append("div") // Tilføjer øjet til fisken på samme måde
        .attr("class", "fish-eye"); // Giver øjet klassen "fish-eye"

    animateFish(fish, direction); // Starter animationen af fisken
}

// Funktion til at animere fisken, så den svømmer kontinuerligt fra side til side
function animateFish(fish, direction) {
    const distance = direction === "right" ? width + 100 : -100; // Bestemmer hvor langt fisken skal svømme
    const duration = 8000; // Tiden det tager fisken at svømme (i millisekunder)
    const newStartX = direction === "right" ? -100 : width + 100; // Startpositionen når fisken vender

// Funktionen `swim()` håndterer animationen af fisken, så den kontinuerligt svømmer frem og tilbage.
    function swim() {
        fish.transition() // Starter en transition (animation) for at få fisken til at bevæge sig jævnt fra én position til en anden
            .duration(duration) // Indstiller, hvor lang tid det tager fisken at nå fra start til slutposition.
            .ease(d3.easeLinear) // Anvender en lineær animation for konstant hastighed
            .style("left", `${distance}px`) // Flytter fisken til slutpositionen
            .on("end", () => { // Animationen slutter
                fish.style("left", `${newStartX}px`); // Flytter fisken tilbage til startpositionen
                swim(); // Starter animationen igen
            });
    }
    swim(); // Starter svømningen
}

// Opretter to svømmende fisk
createFish("fish1", "orange", -100, 150, "right");
createFish("fish2", "blue", width + 100, 250, "left");

// Tilføj tooltip-element til body
const oceanTooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip ocean-tooltip")
    .style("opacity", 0); // Gør tooltip usynlig fra start

// Tilføj mouseover, mousemove og mouseout events til visualiseringen
d3.select("#visualization")

    // Vis tooltip
    .on("mouseover", function (event) {
        oceanTooltip.transition() // Starter en transition for tooltip
            .duration(200) // Varigheden af visningstransitionen
            .style("opacity", 1); // Gør tooltip synlig

        // Indsætter tekst i tooltip
        oceanTooltip
            .html("Around 0.5% of plastic waste ends up in the ocean")
            .style("left", (event.pageX + 10) + "px") // Positionerer tooltip ved musen
            .style("top", (event.pageY - 20) + "px"); 
    })

    // Vis tooltip, når musen kører over visualiseringen
    .on("mousemove", function (event) {
        oceanTooltip.style("left", (event.pageX + 10) + "px") // Opdaterer tooltipens x-position til 10 pixels til højre for musen
            .style("top", (event.pageY - 20) + "px"); // Opdaterer tooltipens y-position til 20 pixels over musen
    })

    // Skjul tooltip, når musen forlader visualiseringen
    .on("mouseout", function () {
        oceanTooltip.transition() // Starter en transition for at skjule tooltip
            .duration(200) // Varigheden af skjulningstransitionen
            .style("opacity", 0); // Gør tooltip usynlig
    });


// Stackbarchart Visualisering
// Dimensioner for SVG-elementet
const barWidth = 800; // Bredden på SVG-elementet
const barHeight = 500; // Højden på SVG-elementet
const margin = { top: 20, right: 30, bottom: 50, left: 0.1 }; // Marginer omkring diagrammet

// Opretter SVG-containeren til diagrammet
const svg = d3.select("#combined-chart-a") // Vælg HTML-elementet med ID "combined-chart-a"
  .attr("width", width + margin.left + margin.right) // Indstil den samlede bredde for SVG-elementet
  .attr("height", height + margin.top + margin.bottom) // Indstil den samlede højde for SVG-elementet
  .append("g") // Tilføj en gruppe (<g>) til SVG-elementet
  .attr("transform", `translate(${margin.left},${margin.top})`); // Flyt gruppen ind i diagrammets marginer

// Skalaer for X- og Y-akser
const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]); 
// Definer en lineær skala for X-aksen, med domænet 0-100 og rækkevidden fra venstre til højre i diagrammet

const yScale = d3.scaleBand()
  .domain(["Sources of plastic into the ocean", "Where plastic goes in the ocean"]) 
  // Definer Y-aksernes kategorier
  .range([0, height]) // Y-skalaens rækkevidde er fra top til bund
  .padding(0.3); // Tilføj lidt mellemrum mellem kategorierne på Y-aksen

// Tilføjer farver til de forskellige data
const colorScale = d3.scaleOrdinal()
  .domain(["Rivers", "Coasts", "Floating close to the shoreline", "Sinks to seabed", "Transported offshore on the surface"]) 
  // Subkategorierne, som skal have unikke farver
  .range(["#26709d", "#4f93b8", "#26709d", "#4f93b8", "#8c8c8c"]); 
  // De tilsvarende farver til subkategorierne

// Indlæs CSV-fil og generer grafen
d3.csv("ocean_plastic_data.csv").then(function(data) { 

  console.log(data); // Log dataene til konsollen for fejlsøgning

  let xPosition = 0; // Variabel til at holde styr på placeringen af de vandrette søjler

  // Del data i to kategorier
  const sources = data.filter(d => d.Category === "Sources of plastic into the ocean"); 
  // Filtrer data for "Sources of plastic into the ocean"
  const destinations = data.filter(d => d.Category === "Where plastic goes in the ocean"); 
  // Filtrer data for "Where plastic goes in the ocean"

  // Tilføj kategori-labels
  svg.append("text")
    .attr("x", width / 2) // Centrer teksten horisontalt
    .attr("y", yScale("Sources of plastic into the ocean") - 10) // Placér teksten over den første kategori
    .attr("text-anchor", "middle") // Centrer teksten
    .attr("font-size", "16px") // Sæt skriftstørrelsen
    .attr("font-weight", "bold") // Gør teksten fed
    .attr("fill", "#ffffff") // Sæt tekstfarven til hvid
    .text("Sources of plastic into the ocean"); // Teksten, der vises

  svg.append("text")
    .attr("x", width / 2) // Centrer teksten horisontalt
    .attr("y", yScale("Where plastic goes in the ocean") - 10) // Placér teksten over den anden kategori
    .attr("text-anchor", "middle") // Centrer teksten
    .attr("font-size", "16px") // Sæt skriftstørrelsen
    .attr("font-weight", "bold") // Gør teksten fed
    .attr("fill", "#ffffff") // Sæt tekstfarven til hvid
    .text("Where plastic goes in the ocean"); // Teksten, der vises

  // Tegn søjler for hver sektion
  sources.forEach(d => { // Iterér gennem dataene i "sources"
    svg.append("rect")
      .attr("x", xPosition) // Placér søjlen baseret på den aktuelle xPosition
      .attr("y", yScale("Sources of plastic into the ocean")) // Placér søjlen i den relevante kategori
      .attr("width", xScale(d.Percentage)) // Bredden af søjlen bestemmes af procentværdien
      .attr("height", yScale.bandwidth()) // Højden af søjlen svarer til båndbredden på Y-aksen
      .attr("fill", colorScale(d.Subcategory)) // Farven bestemmes af subkategorien
      .attr("stroke", "#b2e1f5") // Tilføj en kantfarve
      .attr("stroke-width", 1) // Sæt bredden af kanten
      .on("mouseover", function(event) { // Når musen holdes over søjlen
        d3.select("#barTooltip") 
          .style("opacity", 1) // Gør tooltip'et synligt
          .html(`<strong>Subcategory:</strong> ${d.Subcategory}<br><strong>Percentage:</strong> ${d.Percentage}%`); 
          // Indholdet af tooltip'et
      })
      .on("mouseout", function() { // Når musen fjernes fra søjlen
        d3.select("#barTooltip").style("opacity", 0); // Skjul tooltip'et
      });

    const fontSize = d.Percentage < 5 ? "10px" : "14px"; 
    // Hvis procentværdien er lav, bruges en mindre skriftstørrelse

    svg.append("text")
      .attr("x", xPosition + xScale(d.Percentage) / 2) // Placér teksten midt i søjlen
      .attr("y", yScale("Sources of plastic into the ocean") + yScale.bandwidth() / 2) // Placér teksten midt i højden
      .attr("dy", ".35em") // Justér tekstens placering vertikalt
      .attr("text-anchor", "middle") // Centrer teksten horisontalt
      .attr("fill", "#ffffff") // Sæt tekstfarven til hvid
      .attr("font-size", fontSize) // Brug den beregnede skriftstørrelse
      .attr("font-weight", "bold") // Gør teksten fed
      .text(`${d.Percentage}%`); // Teksten er procentværdien

    xPosition += xScale(d.Percentage); // Opdater xPosition til næste søjle
  });

  xPosition = 0; // Nulstil xPosition for "destinations"-sektionen

  destinations.forEach(d => { // Iterér gennem dataene i "destinations"
    svg.append("rect")
      .attr("x", xPosition)
      .attr("y", yScale("Where plastic goes in the ocean"))
      .attr("width", xScale(d.Percentage))
      .attr("height", yScale.bandwidth())
      .attr("fill", colorScale(d.Subcategory))
      .attr("stroke", "#b2e1f5")
      .attr("stroke-width", 1)
      .on("mouseover", function(event) {
        d3.select("#barTooltip")
          .style("opacity", 1)
          .html(`<strong>Subcategory:</strong> ${d.Subcategory}<br><strong>Percentage:</strong> ${d.Percentage}%`);
      })
      .on("mouseout", function() {
        d3.select("#barTooltip").style("opacity", 0);
      });

    const fontSizeDest = d.Percentage < 5 ? "10px" : "14px";

    svg.append("text")
      .attr("x", xPosition + xScale(d.Percentage) / 2)
      .attr("y", yScale("Where plastic goes in the ocean") + yScale.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", fontSizeDest)
      .attr("font-weight", "bold")
      .text(`${d.Percentage}%`);

    xPosition += xScale(d.Percentage);
  });

  // Tilføj tooltip-element
  d3.select("body").append("div")
    .attr("id", "barTooltip") // Definer ID'et for tooltip-elementet
    .attr("class", "tooltip") // Giv tooltip'et en CSS-klasse
    .style("opacity", 0); // Skjul tooltip'et ved oprettelsen

  // Opdater tooltip'ets position baseret på musens bevægelse
  svg.on("mousemove", function(event) {
    d3.select("#barTooltip")
      .style("left", `${event.pageX - 180}px`) // Justér tooltip'ets horisontale position
      .style("top", `${event.pageY - 28}px`); // Justér tooltip'ets vertikale position
  });
});








// Truck i bunden af hjemmesiden
(function () {
  // **Truck Animation Unique Variables**
  // Definerer konstanter, der bruges til at styre animationens dimensioner og udseende.
  const truckAnimationSvg = d3.select("#truckAnimationCanvas"); // Vælger SVG-elementet, hvor animationen tegnes.
  const truckAnimationWidth = 800; // Bredden på lærredet for animationen.
  const truckAnimationHeight = 160; // Højden på lærredet for animationen.
  const truckInitialX = -420; // Lastbilens startposition uden for synsfeltet til venstre.
  const truckY = 70; // Lastbilens lodrette position på lærredet.
  const roadHeight = 50; // Højden på vejen.
  const stripeWidth = 20; // Bredden af de hvide vejstriber.
  const stripeHeight = 5; // Højden af de hvide vejstriber.
  const stripeSpacing = 30; // Afstanden mellem striberne.

  // **Sætter dimensioner for SVG-elementet**
  truckAnimationSvg.attr("width", truckAnimationWidth).attr("height", truckAnimationHeight);

  // **Tegner vejen som en grå rektangel**
  truckAnimationSvg.append("rect")
    .attr("x", 0) // Starter ved venstre kant af SVG-elementet.
    .attr("y", truckAnimationHeight - roadHeight - 60) // Positionerer vejen nederst i SVG-elementet.
    .attr("width", truckAnimationWidth) // Bredden på vejen svarer til SVG-elementets bredde.
    .attr("height", roadHeight) // Højden på vejen.
    .attr("fill", "#4a4a4a"); // Grå farve til vejen.

  // **Tilføjer hvide striber til vejen**
  for (let i = 0; i < truckAnimationWidth; i += stripeWidth + stripeSpacing) {
    truckAnimationSvg.append("rect")
      .attr("x", i) // Starter hver stribe med en given afstand.
      .attr("y", truckAnimationHeight - roadHeight / 2 - stripeHeight / 2 - 60) // Centrerer striberne på vejen.
      .attr("width", stripeWidth) // Bredden på hver stribe.
      .attr("height", stripeHeight) // Højden på hver stribe.
      .attr("fill", "#ffffff"); // Stribernes farve er hvid.
  }

  // **Tegner lastbilen som en gruppe af grafiske elementer**
  const truck = truckAnimationSvg.append("g")
    .attr("class", "truck") // Tilføjer klassen "truck" for styling eller genkendelse.
    .attr("transform", `translate(${truckInitialX}, ${truckY})`); // Positionerer lastbilen på lærredet.

  // **Tilføjer rektangler og cirkler til at tegne lastbilens krop og hjul**
  truck.append("rect").attr("x", 0).attr("y", -50).attr("width", 120).attr("height", 60).attr("fill", "#2e7d32"); // Lastbilens trailer.
  truck.append("rect").attr("x", 120).attr("y", -30).attr("width", 60).attr("height", 40).attr("fill", "#4caf50"); // Lastbilens førerhus.
  truck.append("rect").attr("x", 130).attr("y", -25).attr("width", 20).attr("height", 15).attr("fill", "#cfd8dc"); // Lastbilens vindue.
  truck.append("circle").attr("cx", 20).attr("cy", 20).attr("r", 10).attr("fill", "#212121"); // Første hjul.
  truck.append("circle").attr("cx", 80).attr("cy", 20).attr("r", 10).attr("fill", "#212121"); // Andet hjul.
  truck.append("circle").attr("cx", 140).attr("cy", 20).attr("r", 10).attr("fill", "#212121"); // Tredje hjul.

  // **Funktion til at generere affald**
  function generateTrash() {
    const trash = truckAnimationSvg.append("g") // Opretter en gruppe til affald.
      .attr("class", "trash") // Tilføjer klassen "trash".
      .attr("transform", `translate(${truckInitialX + 880}, ${truckY - 10})`); // Positionerer affaldet bag lastbilen.

    for (let i = 0; i < 10; i++) { // Genererer 10 tilfældige affaldselementer.
      const x = Math.random() * 50 - 20; // Tilfældig vandret placering.
      const y = Math.random() * 40 - 20; // Tilfældig lodret placering.
      const size = Math.random() * 8 + 5; // Tilfældig størrelse på affaldselementet.

      trash.append("rect")
        .attr("x", x) // Vandret position.
        .attr("y", y) // Lodret position.
        .attr("width", size) // Bredden på affaldet.
        .attr("height", size) // Højden på affaldet.
        .attr("fill", `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`) // Tilfældig farve.
        .attr("opacity", 0.8); // Gennemsigtighed.
    }

    const roadCenterY = truckAnimationHeight - roadHeight + roadHeight / 2; // Vejenes midterlinje.
    trash.transition()
      .duration(1000) // Animationens varighed.
      .attr("transform", `translate(${truckInitialX + 860}, ${roadCenterY - 5})`) // Flytter affaldet til vejens midte.
      .on("end", function () {
        setTimeout(() => { trash.remove(); }, 34500); // Fjerner affaldet efter 34,5 sekunder.
      });
  }

  // **Funktion til lastbilens kørsel**
  function driveTruck() {
    truck.transition()
      .duration(9000) // Tid for lastbilens kørselsanimation.
      .attr("transform", `translate(${truckInitialX + 900}, ${truckY})`) // Flytter lastbilen hen til dump-punktet.
      .on("end", dumpTrash); // Starter affaldsdumpning.
  }

  // **Funktion til at dumpe affald fra lastbilen**
  function dumpTrash() {
    truck.transition()
      .duration(500) // Tid for lastbilens vippebevægelse.
      .attr("transform", `translate(${truckInitialX + 900}, ${truckY}) rotate(-10)`) // Vipper lastbilen bagud.
      .on("end", () => {
        generateTrash(); // Genererer affald.
        truck.transition()
          .duration(500) // Retter lastbilen op igen.
          .attr("transform", `translate(${truckInitialX + 900}, ${truckY}) rotate(0)`)
          .on("end", completeDrive); // Fortsætter kørslen.
      });
  }

  // **Funktion til at afslutte kørslen**
  function completeDrive() {
    truck.transition()
      .duration(1500) // Tid for lastbilen til at køre ud af billedet.
      .attr("transform", `translate(${truckAnimationWidth + 100}, ${truckY})`) // Flytter lastbilen ud af lærredet.
      .on("end", () => {
        truck.attr("transform", `translate(${truckInitialX}, ${truckY})`); // Sætter lastbilen tilbage til startpositionen.
        driveTruck(); // Starter animationen igen.
      });
  }

  // **Starter animationen**
  driveTruck(); // Kalder funktionen, der starter animationen.

})();
