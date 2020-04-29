let months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// function fired when state is selected
document.getElementById("state-select").addEventListener("change", (e) => {
  //   if there's already a chart, remove it
  let chart = document.getElementById("chart");
  if (chart) {
    chart.remove();
  }
  let state = e.target.value;
  //   get state data
  fetch(`https://covidtracking.com/api/v1/states/${state}/daily.json`)
    .then((response) => response.json())
    .then((data) => {
      //     sort data by date, chop off initial null value
      data.sort((a, b) => a.date - b.date);
      data = data.slice(1);
      //     turn data date strings into date objects
      data.forEach((item) => {
        if (item.positiveIncrease < 0) {
          item.positiveIncrease = 0;
        }
        let dateObject = new Date(item.dateChecked);
        let year = dateObject.getFullYear();
        let month = dateObject.getMonth();
        let day = dateObject.getDate();
        item.dateChecked = new Date(year, month, day);
      });

      console.log(`data.length == ${data.length}`);

      //     set variables for dimensions and spacing
      const svgWidth = window.innerWidth * 0.8;
      const svgHeight = window.innerHeight * 0.8;
      const padding = 40;
      const chartWidth = svgWidth - padding * 2;
      const chartHeight = svgHeight - padding * 2;
      let barWidth = chartWidth / data.length;
      const barSpace = 0.1 * barWidth;
      barWidth = barWidth - barSpace;

      //    build y scale
      const yScale = d3.scaleLinear();
      yScale.domain([0, d3.max(data, (d) => d.positiveIncrease)]);
      yScale.range([chartHeight, 0]);

      //     build y axis
      const yAxis = d3.axisLeft().scale(yScale);

      //     build x scale
      const xScale = d3.scaleTime();
      xScale.domain([
        d3.min(data, (d) => d.dateChecked),
        d3.max(data, (d) => d.dateChecked),
      ]);
      xScale.range([0, chartWidth]);

      //     build x axis
      const xAxis = d3.axisBottom().scale(xScale);

      //     add svg to svg wrapper
      const svg = d3
        .select("#svg-wrapper")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .attr("id", "chart");

      //      add axes
      svg
        .append("g")
        .attr("transform", `translate(${padding}, ${padding})`)
        .call(yAxis);
      svg
        .append("g")
        .attr("transform", `translate(${padding}, ${chartHeight + padding})`)
        .call(xAxis);

      //     add bars
      let rect = svg
        .selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("width", barWidth)
        .attr("height", (d) => yScale(0) - yScale(d.positiveIncrease))
        .attr("x", (d, i) => xScale(d.dateChecked) + padding)
        .attr("y", (d) => yScale(d.positiveIncrease) + padding);

      //     add title to rects
      rect.append("title").text((d) => {
        return `${d.positiveIncrease}, ${
          months[d.dateChecked.getMonth()]
        } ${d.dateChecked.getDate()}`;
      });

      //     add labels to rects
      svg
        .selectAll(".bar-label")
        .data(data)
        .enter()
        .append("text")
        .attr("x", (d, i) => {
          if (d.positiveIncrease > 999) {
            return xScale(d.dateChecked) + padding - 3;
          } else if (d.positiveIncrease > 99) {
            return xScale(d.dateChecked) + padding;
          } else if (d.positiveIncrease > 9) {
            return xScale(d.dateChecked) + padding + 3;
          } else {
            return xScale(d.dateChecked) + padding + 6;
          }
        })
        .attr("y", (d, i) => {
          return yScale(d.positiveIncrease) + padding - 20;
        })
        .text((d) => d.positiveIncrease)
        .style("font-size", "8px");

      //     add header
      svg
        .append("text")
        .attr("x", 50)
        .attr("y", 50)
        .text(state + " New Cases Daily")
        .style("font-size", "1.5rem")
        .style("font-weight", "bold");
    });
});
