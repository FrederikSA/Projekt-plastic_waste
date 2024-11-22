fetch('/api/linechart')
  .then(response => response.json())
  .then(data => {
    // Konverter data
    data.forEach(d => {
      d.year = +d.year; // Gør år til tal
      d.plastic_production = +d.plastic_production; // Gør produktion til tal
    });

    // Dimensioner og marginer
    const width = 800;
    const height = 500;
    const margin = { top: 20, right: 30, bottom: 50, left: 70 };

    // Skaler
    const xScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.year), 2020]) // Udvid X-aksen til 2020
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.plastic_production)]) // Produktion max
      .range([height - margin.bottom, margin.top]);

    // SVG container
    const svg = d3.select("svg")
      .attr("width", width)
      .attr("height", height);

    // X-akse
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")))

    // Y-akse
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).tickFormat(d3.format(".2s")));

    // Linjegenerator
    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.plastic_production));

    // Tegn linjen
    svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2);

    // Tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip");

    // Cirkel til at følge musen
    const circle = svg.append("circle")
      .attr("r", 5)
      .attr("fill", "red")
      .style("opacity", 0); // Start skjult

    // Interaktionslag
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

        // Find nærmeste datapunkt
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
          tooltip
            .style("display", "block")
            .html(`
              <strong>År:</strong> ${closestData.year}<br>
              <strong>Produktion:</strong> ${d3.format(",")(closestData.plastic_production)} tons
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
