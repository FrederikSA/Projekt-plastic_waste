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


    // Niclas Visualisering
    // Dimensioner for SVG-elementet
// Definer marginer for grafen
const barWidth = 800; // Bredde for grafen, fratrukket marginer
const barHeight = 500; // Højde for grafen, fratrukket marginer
const margin = { top: 20, right: 30, bottom: 50, left: 70 };

// Opretter SVG-containeren til diagrammet
const svg = d3.select("#combined-chart-a")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Skalaer for X- og Y-akser
const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
const yScale = d3.scaleBand()
  .domain(["Sources of plastic into the ocean", "Where plastic goes in the ocean"])
  .range([0, height])
  .padding(0.3);

const colorScale = d3.scaleOrdinal()
  .domain(["Rivers", "Coasts", "Floating close to the shoreline", "Sinks to seabed", "Transported offshore on the surface"])
  .range(["#26709d", "#4f93b8", "#26709d", "#4f93b8", "#8c8c8c"]);

// Indlæs CSV-fil og generer grafen
d3.csv("ocean_plastic_data.csv").then(function(data) {
  console.log(data);

  let xPosition = 0;

  // Del data i to kategorier
  const sources = data.filter(d => d.Category === "Sources of plastic into the ocean");
  const destinations = data.filter(d => d.Category === "Where plastic goes in the ocean");

  // Tilføj kategori-labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", yScale("Sources of plastic into the ocean") - 10)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .attr("fill", "#ffffff")
    .text("Sources of plastic into the ocean");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", yScale("Where plastic goes in the ocean") - 10)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .attr("fill", "#ffffff")
    .text("Where plastic goes in the ocean");

  // Tegn søjler for hver sektion
  sources.forEach(d => {
    svg.append("rect")
      .attr("x", xPosition)
      .attr("y", yScale("Sources of plastic into the ocean"))
      .attr("width", xScale(d.Percentage))
      .attr("height", yScale.bandwidth())
      .attr("fill", colorScale(d.Subcategory))
      .attr("stroke", "#b2e1f5")
      .attr("stroke-width", 1)
      .on("mouseover", function(event) {
        d3.select("#barTooltip")
          .style("opacity", 1)
          .html(`Subcategory: ${d.Subcategory}<br>Percentage: ${d.Percentage}%`);
      })
      .on("mouseout", function() {
        d3.select("#barTooltip").style("opacity", 0);
      });

    const fontSize = d.Percentage < 5 ? "10px" : "14px";

    svg.append("text")
      .attr("x", xPosition + xScale(d.Percentage) / 2)
      .attr("y", yScale("Sources of plastic into the ocean") + yScale.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", fontSize)
      .attr("font-weight", "bold")
      .text(`${d.Percentage}%`);

    xPosition += xScale(d.Percentage);
  });

  xPosition = 0;

  destinations.forEach(d => {
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
          .html(`Subcategory: ${d.Subcategory}<br>Percentage: ${d.Percentage}%`);
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

  // Tilføj X-akse
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale).ticks(5));

  // Tilføj tooltip-element
  d3.select("body").append("div")
    .attr("id", "barTooltip")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Opdater tooltip'ets position baseret på musens bevægelse
  svg.on("mousemove", function(event) {
    d3.select("#barTooltip")
      .style("left", `${event.pageX + 5}px`)
      .style("top", `${event.pageY - 28}px`);
  });
});
