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
    const svg = d3.select("svg")
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
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip");

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
          tooltip
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
        tooltip.style("display", "none"); // Skjul tooltip
        circle.style("opacity", 0); // Skjul cirklen
      });
  })
  .catch(error => console.error("Fejl ved indlæsning af data:", error));
