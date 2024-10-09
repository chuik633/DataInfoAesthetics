import "./style.css";
import * as d3 from "d3";
// import * as dataSetup from "./data.js"

//set up the data
const RESOURCE_URL = 'https://data.cityofnewyork.us/resource/erm2-nwe9.json';
let data = await d3.json(RESOURCE_URL);

//roll up / group the data


function validDate(date){
  return date instanceof Date && !isNaN(date)

}

const validDateData = data.filter(d => {
  const startDate = new Date(d.created_date);
  const endDate = new Date(d.closed_date);
  return validDate(startDate) && validDate(endDate);
});

const complaintResolutionTime = d3.rollup(
  validDateData,
  (v) => v.length,
  (d) => {
    const startDate = new Date(d.created_date);
    const endDate = new Date(d.closed_date);
    if(validDate(startDate) && validDate(endDate)){
      const duration = endDate - startDate
      const durationHrs = Math.round(duration*10 /(60*60*1000))/10; //miliseconds to hours
      // console.log("DURATION", durationHrs)
      return durationHrs
      

    }
  },
  (d) => d.complaint_type
)




//create the visualizaiton
const body = d3.select("body").style("padding", "30px");

const title = body
  .append("h1")
  .style("font-size", "16px")
  .text("Week 6 - Code Lab - Bar Chart");

const width = 900
const height = 400 
const margin= {
  top: 70,
  bottom: 70,
  left: 50,
  right: 350

}



const svg = body
  .append("svg")
  .attr("viewBox",`${0} ${0} ${width} ${height}`)
  .attr("width", width)
  .attr("height", height)
  .style("background", "#F5F1E7")
  .style("box-shadow", "0px 1px 2px #DDDDDD");




const bars_layer = svg.append('g').attr("transform", `translate(${margin.left}, ${-margin.bottom})`);
const axes_layer = svg.append('g').attr("transform", `translate(${margin.left}, ${margin.top})`);
axes_layer.attr('class', 'axes')



//scales
console.log(Array.from(complaintResolutionTime.keys()))
const allTimes = Array.from(complaintResolutionTime.keys())
allTimes.sort()
console.log(allTimes)
const xScale = d3.scaleBand()
  .domain(allTimes)  // 24 hours
  .range([0, width - margin.left - margin.right])
  .padding(0.1);

const maxCount = d3.max(complaintResolutionTime, (d) => {
    const sumValues = Array.from(d[1].values()).reduce((sum, value) => sum + value, 0);
    return sumValues;
  });


// console.log(maxCount)
const yScale = d3.scaleLinear()
  .domain([0, maxCount])
  .range([0, height - margin.top - margin.bottom]);
  

const complaintTypes = Array.from(d3.group(data, (d) => d.complaint_type).keys());
console.log(complaintTypes, complaintTypes.length)
const colors = [
  "#FFFFFA",
  "#F1734B",
  "#D5C44E",
  "#3F5D7F",
  "#FEC7BB",
  "#CA2E2E",
  "#798753",
  "#D6A9AB",
]
const colorScale = d3.scaleOrdinal()
  .domain(complaintTypes)
  .range(colors);

/**
 * create the stack information
 * want data in the form resolutionTime: [{complaint type:#, start: #, height:#}, {...}]
 * where startY-endY corresponds to yScale(resolutionTime), but stacked intervals
 */
let stackedData = {}
for(const [resolutionTime, complaintToCountMap] of complaintResolutionTime){
  let startY = 0
  stackedData[resolutionTime] = []
  for(const [complaintType, count] of complaintToCountMap){
    stackedData[resolutionTime].push(
      {
      "complaint":complaintType,
      "start": parseFloat(startY),
      "count": count,
      "resolutionTime":resolutionTime,
      "height": yScale(count)
        }
      )
    startY += yScale(count)
  }
  // stackedData[resolutionTime].sort((a, b) => (a.complaint).localeCompare(b.complaint))
  // console.log(stackedData)
}


// 0: 0
// 1: {'Graffiti' => [start, end]}
const formatComplaintStr = (complaint) => `${complaint.replace(/[^a-zA-Z0-9]/g, '_')}` //I used chat gpt to help with this regex (I was struggling ><)
console.log(complaintResolutionTime)
console.log("stacked data")
console.log(stackedData)
bars_layer.selectAll('g')
  .data(Object.entries(stackedData))
  .join('g') //join a group for each of the outer groups
  .attr("transform", (d) => {
    // console.log("d0", d[0], xScale(d[0]))

    return `translate(${xScale(parseFloat(d[0]))} 0)`})
  .selectAll('rect')
    .append("g")
      .data((d) => d[1]) //data for each section, is the array  of complaints to start end Y coords
      .join('rect')
        .attr('fill', (d1) => colorScale(d1.complaint))
        .attr('width', xScale.bandwidth())
        .attr("class",(d1) => `bar ${formatComplaintStr(d1.complaint)}`) //save complaint type in the classname
        .attr('height', (d1) => {
          // console.log(d1)
          return d1.height}) //height relative to the count
        // .attr('x', (d1) => xScale(d1[0])) 
        .attr('y', (d1) => height - d1.start - d1.height)
        .on("mouseover", (e, d1) => {
          d3.selectAll(".bar").style("opacity", 0.2).attr('stroke', 'none');
          d3.selectAll(`.${formatComplaintStr(d1.complaint)}`).style("opacity", 0.75); //medium highlight other bars
          d3.select(e.target).style("opacity", 1.0).attr('stroke', 'black');
          
          const tooltipX = e.pageX + 30
          const tooltipY = height - d1.start - d1.height/2
          console.log(tooltipX)
          d3.select("#tooltip")
            .text(`${d1.complaint}`)
            .attr('class', 'shown') //show the tooltip
            .style('left', `${tooltipX}px`)
            .style('top', `${tooltipY}px `)
            .append('div').text(`${d1.count} reports`)
            .append('div').text(`${d1.resolutionTime} hrs to resolve`)
         
          d3.select("#category_title").text(`${d1.complaint}`)
          d3.select("#sideplot_plot").selectAll("*").remove()
          d3.select("#sideplot_svg").html("")
          showSidePlot(d1.complaint,  d1.resolutionTime)
          
          
        })
        .on("mouseout", () => {
          d3.selectAll(".bar").style("opacity", 1).attr('stroke', 'none');
          d3.select("#tooltip").attr('class', 'hidden')


        })

//axis bars
axes_layer.append("g")
  .attr("transform", `translate(0, ${height - margin.bottom - margin.top})`)  
  .call(d3.axisBottom(xScale)).selectAll('.tick line')
  .style('display', 'none');


axes_layer.append("g").attr('class', "x-axis")
  .style('font-size', "6px")
  .call(d3.axisLeft(yScale))
  .selectAll('.tick line')
  .style('display', 'none');

d3.select('.x-axis path')  
  .style('stroke-width', '.2px');

//axis labels
//left axis
body.append('div')
  .attr('class', "axes_title side")
  .text("count")
  .style('top',`${height + margin.top }px ` )
  .style('left',`${margin.left/2}px ` )
  .style('width',`${height}px ` )

//bottom axis
body.append('div')
  .attr('class', "axes_title")
  .text("Resolution Time (hrs)")
  .style('top',`${height + 20}px ` )
  .style('width',`${width - margin.left - margin.right}px ` )

//Title
body.append('div')
.attr('class', "title")
.text("How Long Does It Take To Resolve Different Complaints? ")
.style('top',`${-height + 10}px ` )
.style('width',`${width  - margin.right}px ` )


function getTimeCategory(hour){
  //get the time category for the hour
  const timeCategories = {
    "morning":[6, 12],
    "afternoon":[12,17],
    "night":[17, 24],
    "overnight":[0,6]
  }
  for(const [timeCategory, timeRange] of Object.entries(timeCategories)){
    const [rangeStart, rangeEnd] = timeRange
    //categorize it if it falls in the time range (return once found one)
    if(rangeStart <= hour && hour < rangeEnd){
        return timeCategory
    }
  }
}


//constants for the side plot sizing
const sWidth =  250
const sHeight = 280

const side_plot = d3.select("#sideplot")
  .style('width',`${sWidth + 30}px `)
  .style('height',`${height - margin.top}px `)
  .style('top',`${margin.top + 30}px`)
  .style('left',`${width - margin.right + 60}px ` )

const side_SVG  = d3.select("#sideplot_svg")
          .attr("viewBox",`${0} ${0} ${sWidth} ${sHeight + 50}`)
          .attr("width", sWidth)
          .attr("transform", "translate(0,0)")
          .attr("height", sHeight)
          .style("background", "inherit")


function showSidePlot(complaintType, resolutionTime){
  //filter since i just want the data with that same complaint
  const complaintData = validDateData.filter(d => {
    return d.complaint_type == complaintType;
  });
  
  let timeRangeComplaintData = []
  let maxTime = 0
  for(const d of complaintData){
    const start = new Date(d.created_date);
    const end = new Date(d.closed_date);

    //keep track of the max hour for the scale
    if(end > maxTime){
      maxTime = end
    }
    const duration = end - start
    const durationHrs = Math.round(duration*10 /(60*60*1000))/10; 

    timeRangeComplaintData.push({
      "start": start.getTime(),
      "end": end.getTime(),
      "length": durationHrs
    })
  }

  // console.log("time range data", timeRangeComplaintData)
  
  
  //x axis is time (start to end time ranges)

  const xSideScale = d3.scaleTime()
  .domain([d3.min(timeRangeComplaintData, d => d.start), maxTime])
  .range([0,sWidth])
  
  // add the scale
  side_SVG.select('.side-x-axis').remove();
  side_SVG.append('g')
    .attr('class', "side-x-axis")
    .attr("transform", `translate(0, ${sHeight})`)
    .call(d3.axisBottom(xSideScale)
            .ticks(4) 
            .tickFormat(d3.timeFormat("%I %p"))
          )

  d3.select('.side-x-axis path')  
          .style('stroke-width', '.2px');
        

  // y axis each entries in the data
  const ySideScale = d3.scaleBand()
    .domain(d3.range(timeRangeComplaintData.length))
    .range([0,sHeight])
    .padding(0.5);  

  side_SVG.selectAll('rect')
    .data(timeRangeComplaintData)
    .join('rect')
    .attr('width', (d) => {
      return xSideScale(d.end) - xSideScale(d.start)})
    .attr('height', ySideScale.bandwidth())
    .attr('x', (d) => xSideScale(d.start))
    .attr('y', (d,i) => ySideScale(i))
    .attr('stroke', (d) => {
      console.log(d.length, resolutionTime)
      if(d.length == resolutionTime){
        return "black"
      }
      else {return "none"}
    })
    .style("stroke-width", ".2px") 
    .attr('fill', colorScale(complaintType)); 
}

showSidePlot("Graffiti")