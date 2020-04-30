// TODO make pretty, change x axis ticks on mobile

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

let state;
let country;

function responsivefy(svg) {
  console.log("responsivefy firing");
  const container = d3.select(svg.node().parentNode),
    width = parseInt(svg.style("width"), 10),
    height = parseInt(svg.style("height"), 10),
    aspect = width / height;

  // set viewBox attribute to the initial size
  // control scaling with preserveAspectRatio
  // resize svg on inital page load
  svg
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid")
    .call(resize);

  // add a listener so the chart will be resized
  // when the window resizes
  // multiple listeners for the same event type
  // requires a namespace, i.e., 'click.foo'
  // api docs: https://goo.gl/F3ZCFr
  d3.select(window).on("resize." + container.attr("id"), resize);

  // this is the code that resizes the chart
  // it will be called on load
  // and in response to window resizes
  // gets the width of the container
  // and resizes the svg to fill it
  // while maintaining a consistent aspect ratio
  function resize() {
    const w = parseInt(container.style("width"));
    svg.attr("width", w);
    svg.attr("height", Math.round(w / aspect));
  }
}

const generateStateChart = (state) => {
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

      //     add svg to svg wrapper
      const svg = d3.select("#svg-wrapper").append("svg").attr("id", "chart");
      let svgWidth = d3.select("#svg-wrapper").style("width");
      let svgHeight = d3.select("#svg-wrapper").style("height");
      svgWidth = parseInt(svgWidth.slice(0, -2));
      svgHeight = parseInt(svgHeight.slice(0, -2));
      svg.attr("width", svgWidth);
      svg.attr("height", svgHeight).call(responsivefy);

      //     set variables for dimensions and spacing
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

      //     add header
      document.getElementById(
        "graph-label"
      ).textContent = `${state} New Cases Daily`;
    });
};

const generateCountryChart = (country) => {
  //   get country data
  fetch(`https://api.thevirustracker.com/free-api?countryTimeline=${country}`)
    .then((response) => response.json())
    .then((dataset) => {
      dataset = dataset.timelineitems[0];
      delete dataset.stat;
      let data = [];
      for (let item in dataset) {
        let dateParts = item.split("/");
        let date = new Date(2020, dateParts[0] - 1, dateParts[1]);
        data.push({ date: date, increase: dataset[item].new_daily_cases });
      }

      //     add svg to svg wrapper
      const svg = d3.select("#svg-wrapper").append("svg").attr("id", "chart");
      let svgWidth = d3.select("#svg-wrapper").style("width");
      let svgHeight = d3.select("#svg-wrapper").style("height");
      svgWidth = parseInt(svgWidth.slice(0, -2));
      svgHeight = parseInt(svgHeight.slice(0, -2));
      svg.attr("width", svgWidth);
      svg.attr("height", svgHeight).call(responsivefy);

      //     set variables for dimensions and spacing
      const padding = 40;
      const chartWidth = svgWidth - padding * 2;
      const chartHeight = svgHeight - padding * 2;
      let barWidth = chartWidth / data.length;
      const barSpace = 0.1 * barWidth;
      barWidth = barWidth - barSpace;

      //    build y scale
      const yScale = d3.scaleLinear();
      yScale.domain([0, d3.max(data, (d) => d.increase)]);
      yScale.range([chartHeight, 0]);

      //     build y axis
      const yAxis = d3.axisLeft().scale(yScale);

      //     build x scale
      const xScale = d3.scaleTime();
      xScale.domain([d3.min(data, (d) => d.date), d3.max(data, (d) => d.date)]);
      xScale.range([0, chartWidth]);

      //     build x axis
      const xAxis = d3.axisBottom().scale(xScale);

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
        .attr("height", (d) => yScale(0) - yScale(d.increase))
        .attr("x", (d, i) => xScale(d.date) + padding)
        .attr("y", (d) => yScale(d.increase) + padding);

      //     add title to rects
      rect.append("title").text((d) => {
        return `${d.increase}, ${
          months[d.date.getMonth()]
        } ${d.date.getDate()}`;
      });

      //     add header
      document.getElementById(
        "graph-label"
      ).textContent = `${country} New Cases Daily`;
    });
};

// ***** STATES *****
// function fired when state is selected
document.getElementById("state-select").addEventListener("change", (e) => {
  // reset country selector
  document.getElementById("country-select").value = "DEFAULT";
  //   if there's already a chart, remove it
  let chart = document.getElementById("chart");
  if (chart) {
    chart.remove();
  }
  country = null;
  state = e.target.value;
  generateStateChart(state);
});

// ***** COUNTRIES *****
// function fired when country is selected
document.getElementById("country-select").addEventListener("change", (e) => {
  // reset state selector
  document.getElementById("state-select").value = "DEFAULT";
  //   if there's already a chart, remove it
  let chart = document.getElementById("chart");
  if (chart) {
    chart.remove();
  }
  state = null;
  country = e.target.value;
  generateCountryChart(country);
});

window.addEventListener("orientationchange", () => {
  console.log("orientation change");
  console.log(`state == ${state}, country == ${country}`);
  let chart = document.getElementById("chart");
  if (chart) {
    chart.remove();
  }
  if (state) {
    generateStateChart(state);
  } else if (country) {
    generateCountryChart(country);
  }
});
