d3.dsv(";", "../db/global-plastics-production.csv")
  .then(data => {
    // Konverter data
    data.forEach(d => {
      d.Year = +d.Year; // Konverter år til tal
      d.Annual_plastic_production = +d.Annual_plastic_production; // Konverter produktion til tal
    });

    // Dimensioner og marginer
    const width = 800;
    const height = 500;
    const margin = { top: 20, right: 30, bottom: 70, left: 70 };

    // Skaler
    const xScale = d3.scaleLinear()
      .domain([
        d3.min(data, d => d.Year),
        d3.max(data, d => d.Year) + 1
      ])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.Annual_plastic_production)])
      .range([height - margin.bottom, margin.top]);

    // SVG container
    const svg = d3.select("svg")
      .attr("width", width)
      .attr("height", height);

    // Tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip");

    // Akser
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.format("d"))
      .ticks(Math.floor((width - margin.left - margin.right) / 70));

    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => d3.format(".2s")(d));

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .attr("font-size", "12px")
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .attr("font-size", "12px");

    // Linjegenerator
    const line = d3.line()
      .x(d => xScale(d.Year))
      .y(d => yScale(d.Annual_plastic_production));

    // Tegn linjen
    svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line);

    // Cirkel for hover-effekt
    const focus = svg.append("circle")
      .attr("r", 5)
      .attr("fill", "steelblue")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("opacity", 0);

    // Interaktionslag
    svg.append("rect")
      .attr("class", "hover-rect")
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mousemove", function (event) {
        const [mouseX] = d3.pointer(event, svg.node());
        const invertedX = xScale.invert(mouseX);

        const closestData = data.reduce((a, b) =>
          Math.abs(b.Year - invertedX) < Math.abs(a.Year - invertedX) ? b : a
        );

        if (closestData) {
          const x = xScale(closestData.Year);
          const y = yScale(closestData.Annual_plastic_production);

          focus
            .style("opacity", 1)
            .attr("cx", x)
            .attr("cy", y);

          tooltip
            .style("display", "block")
            .html(`
              <strong>År:</strong> ${closestData.Year}<br>
              <strong>Produktion:</strong> ${d3.format(",")(closestData.Annual_plastic_production)} tons
            `)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
        }
      })
      .on("mouseout", () => {
        focus.style("opacity", 0);
        tooltip.style("display", "none");
      });
  })
  .catch(error => {
    console.error("Fejl ved indlæsning af filen:", error);
  });
