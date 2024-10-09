import * as d3 from "d3";

const initialTime = Date.now();



const color_seq = ['#D87A22',"#D5C44E",'#BECCD0']

//setting up
const body = d3.select('body');
const clock = body.append('div').attr('id', 'clock');
const svg = body.append('svg').attr('style', "height: 1000px").attr('id', 'clock-container')

function createMeshSection(numRows, numCols, rect_width, rect_height, rect_x, rect_y, totalLen, currRow, currLen, color){
    //clock strand configurations
    var gapWidth = Math.min(rect_width/(numCols**2), rect_height/(numRows**2))
    gapWidth = 5
    var verticalStrandWidth = (rect_width-gapWidth)/numCols - (gapWidth)
    var horizontalStrandWidth = (rect_height-gapWidth)/numRows - gapWidth

    console.log("STRAND WIDTHS", horizontalStrandWidth, verticalStrandWidth)
    console.log((horizontalStrandWidth+gapWidth)*numRows)
    //variables that change as the clocks length changes
    var horizontalCount = 0

    //helpful constants
    var odds = []
    var evens = []
    var all = []
    for(let i = 0; i<numCols; i++){
        all.push(i)
        if(i%2 == 0){
            evens.push(i)
        }else{
            odds.push(i)
        } 
    }
    function setUp(){
        // svg.selectAll("*").remove();
       
    
        const rect = svg.append('rect')
            .attr('x', rect_x)
            .attr('y', rect_y)
            .attr('width', rect_width)
            .attr('height', 0)
            .attr('fill', color)
    
        horizontalCount=1
        verticalStrands(svg,all)
    }

    function verticalStrands(base_svg, indexes){
        let start_y = rect_y + (horizontalCount-1)*(horizontalStrandWidth+gapWidth)
        for(let i =0;i<numCols;i++){
            if(indexes.includes(i)){
                base_svg.append('rect')
            .attr('x', gapWidth + rect_x + (verticalStrandWidth+gapWidth)*i)
            .attr('y',start_y)
        
            .attr('width', verticalStrandWidth)
            .attr('height', rect_height+rect_y-start_y)
            .attr('fill', color)    
            }
        }
        
    }

    function horizontalStrand(base_svg, lenVal){
        let width = lenVal*(rect_width/(totalLen))
        console.log(lenVal, totalLen)
        
        base_svg.append('rect')
        .attr('x', rect_x)
        .attr('y', rect_y + (horizontalCount)*(horizontalStrandWidth+gapWidth)+gapWidth)
        .attr('width', width)
        .attr('height', horizontalStrandWidth)
        .attr('fill', "#2D2C2F")
    
        horizontalCount++;
    
    }

    function draw_woven(currentRows, lenVal){
        console.log("RE", lenVal)
        horizontalCount=0
        for(let i = 0; i<currentRows-1; i++){
            horizontalStrand(svg, totalLen)
            if(i%2==0){
                verticalStrands(svg,evens)
            }else{
                verticalStrands(svg,odds)
            }
            
        }
        horizontalStrand(svg, lenVal)
        if(currentRows%2 == 0){
            verticalStrands(svg,odds)
        }
        else{
            verticalStrands(svg,evens)
        }
        
    }
    setUp()
    draw_woven(currRow,currLen)
    
}


function loop() {
    const background = svg.append('rect')
        .attr('x', 50)
        .attr('y', 50)
        .attr('width', 5000)
        .attr('height', 700)
        .attr('fill', "#F1ECE5")
        // .attr('fill', "#2D2C2F")
        
    const date = new Date();
    var hours = date.getHours()%12;
    const minutes = date.getMinutes()%60;
    const seconds = date.getSeconds()%60;
    const miliseconds = date.getMilliseconds()
    const delta = (Date.now() - initialTime);
    // clock.html(`${hours}:${minutes}:${seconds} `)

   
    console.log(seconds/10)
    createMeshSection(
        5, //numRows = each row represents 10 seconds wide
        10, //numCols = each column is 1 seconds
        350, //rect_width
        150, //rect_height
        100, //rect_x
        100, //rect_y
        10*1000, //totalLen = 1 minute or 60 seconds
        Math.floor(seconds/10), //currRow
        (seconds%10)*1000 + miliseconds, //currLen,
        color_seq[1]
    ) 
    createMeshSection(
        11, //numRows = each row is 60 minutes
        6, //numCols = each column is 10 minutes
        350, //rect_width
        400, //rect_height
        100, //rect_x
        300, //rect_y
        60*60, //totalLen of a row
        hours, //currRow
        minutes*60+seconds, //currLen
        color_seq[2]
    ) 
    

    //do everything you finished doing, and start it over again
    window.requestAnimationFrame(loop);
}

loop();














