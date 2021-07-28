
var canvas = document.getElementById("watch");
var ctx = canvas.getContext("2d");


///////////////EVENTS////////////////////

//for web
canvas.addEventListener("mousedown", onMouseMove);
document.addEventListener("keydown", onKeyDown);
canvas.addEventListener("mousemove", onMouseMove);

//for mobile
canvas.addEventListener("touchmove", onTouchMove);
canvas.addEventListener('touchstart', onTouch);

//for watch
document.addEventListener('tizenhwkey', onHWKey);


function onHWKey(e) {
    if(e.keyName == "back") {
        nextStyle();
    }
}


function onTouch(e) {
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;    
    
    if(watch.insideInteractive(mouseX, mouseY) ) {
        //project our touch from the interactive area to the projected area
        projPoint = project(mouseX, mouseY);
    }
}

function onTouchMove(e) {
    e.preventDefault();
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
    
    if(watch.insideInteractive(mouseX, mouseY) ) {
        //project our touch from the interactive area to the projected area
        projPoint = project(mouseX, mouseY);
    }
}

function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    if(watch.insideInteractive(mouseX, mouseY) ) {
        //project our touch from the interactive area to the projected area
        projPoint = project(mouseX, mouseY);
    }

}


function onKeyDown(e) {
    var message = "";
    if ( e.key == 'd') {
        DEBUG = !DEBUG;
        message = "Debug Mode: " + DEBUG;
        draw();
    }else if (e.key == 'c') {
        draw();
        message = "Redrawing screen";
    } else if(e.key == 'r') { //reset graphs and indicators
        message = "resetting";
        reset();
    }else if (e.key == 'e') { //cycle interaction styles
        message = "Changing to next style"
        nextStyle();  
    } else {
        message = "Key not bound - press \"d\" to switch to DEBUG mode";
    }

    
    console.log(message);
}
/////////////////////////////


//defines the structure of the watch
class Watch {

    constructor(x, y, r, startAngle, stopAngle) {

        this.x = x; //center of the watch
        this.y = y;
        this.r = r; //radius

        this.calcInteractionLine(interactionStyles[currStyle].startAngle, interactionStyles[currStyle].stopAngle);
        
    }
    
    //draw the watch and everything on the screen
    draw() {



        this.drawInteractionArea();

        if(lineInteraction)
            this.drawLine();
        else
            this.drawCurve();

        this.drawWatch();

    }

    drawInteractionArea() {        
        //draw outer arc
        ctx.beginPath();
        ctx.fillStyle = outerArcColour;
        ctx.arc(this.x, this.y, this.r, (-interactionStyles[currStyle].stopAngle) * Math.PI/180 , (-interactionStyles[currStyle].startAngle) * Math.PI/180, true);
        ctx.fill();
        ctx.closePath();
        
        //draw the middle arc
        ctx.beginPath();
        ctx.fillStyle = middleArcColour;
        ctx.arc(this.x, this.y, interactionStyles[currStyle].r2, (-interactionStyles[currStyle].stopAngle- 6) * Math.PI/180 , (-interactionStyles[currStyle].startAngle+7) * Math.PI/180, true);
        ctx.fill();
        ctx.closePath();
        
        //draw inner arc
        ctx.beginPath();
        ctx.fillStyle = innerArcColour;
        ctx.arc(this.x, this.y, interactionStyles[currStyle].r1, (-interactionStyles[currStyle].stopAngle-19) * Math.PI/180, (-interactionStyles[currStyle].startAngle + 22) * Math.PI/180, true);
        ctx.fill();
        ctx.closePath();


        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "white";
        ctx.moveTo(this.u0, this.v0);
        ctx.quadraticCurveTo(this.cpX, this.cpY, this.u1, this.v1);
        ctx.stroke();
    }

    /*calculates where the interaction line starts and stops on the watch face
    @start - start angle on the watch face in degrees
    @stop - stop angle on the watch face in degrees
    */
    calcInteractionLine(start, stop) {                
   

        //line from u0, v0 to u1, v1 (these are the points for the interaction area)
        this.u0 = this.x + (this.r * Math.cos(start * (Math.PI/180)) );
        this.v0 = this.y + (this.r * -Math.sin(start * (Math.PI/180)) );
        //to
        this.u1 = this.x + (this.r * Math.cos(stop * (Math.PI/180)));
        this.v1 = this.y + (this.r * -Math.sin(stop * (Math.PI/180)));
        
        //control points for the quadratic line
        this.cpX = this.u0 + interactionStyles[currStyle].xCurve;
        this.cpY = this.v0 + interactionStyles[currStyle].yCurve;

        //this stuff is to draw behind the interaction line
        var offset = 18; //angle offset to place this line behind interaction line

        //line from u0, v0 to u1, v1 (these are the points for the interaction area)
        this.m0 = this.x + (this.r * Math.cos((start + offset) * (Math.PI/180)) );
        this.n0 = this.y + (this.r * -Math.sin((start + offset)* (Math.PI/180)) );
        //to
        this.m1 = this.x + (this.r * Math.cos((stop - offset)* (Math.PI/180)));
        this.n1 = this.y + (this.r * -Math.sin((stop - offset)* (Math.PI/180)));

        //slightly shifted control points for quadratic line covering (covers the coloured section
        this.cpX1 = this.m0 + interactionStyles[currStyle].xCurve + 16;
        this.cpY1 = this.n0 + interactionStyles[currStyle].yCurve +16;
    }

    //draw a bezier indicating the interaction area
    drawCurve() {
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "white";
        ctx.moveTo(this.u0, this.v0);
        ctx.quadraticCurveTo(this.cpX, this.cpY, this.u1, this.v1);
        ctx.stroke();

        //draw a line behind the interaction line so it looks nice
        ctx.beginPath();
        ctx.lineWidth = 80;
        ctx.strokeStyle = backgroundColour;
        ctx.moveTo(this.m0, this.n0);
        ctx.quadraticCurveTo(this.cpX1, this.cpY1, this.m1, this.n1);
        ctx.stroke();

        //draw draw another section to block off the interaction arcs
        ctx.beginPath();
        ctx.fillStyle = backgroundColour;
        ctx.arc(this.x, this.y, this.r/2, 0 , 2*Math.PI);
        ctx.fill();
        ctx.closePath();
    }

    //draw the line indicating the interaction area
    drawLine() {
        ctx.moveTo(this.u0, this.v0);
        ctx.lineTo(this.u1, this.v1);
        ctx.stroke();
    }

    //draw the watch
    drawWatch() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.closePath();
    }

    //if we are inside the interactive area on the watch, return true
    //must be inside the circle, and under the line
    insideInteractive(pX, pY) {
        var dist = Math.sqrt((pX - this.x) * (pX - this.x) + (pY - this.y) * (pY - this.y));
        if( dist < this.r) { //inside the circle

            if(this.lineInteraction) { 
                //check we are under the line

                //using standard slop form (y = mx + b)
                var m = (this.v1 - this.v0 ) / (this.u1 - this.u0); //slope
                var b = this.v0 - (m* this.u0) //offset

                if(pY > m*pX + b) // are we under the line
                    return true;

            } else { //TODO? do we need to check?
                //check we are under the quadratic line
                //using 
                //x(t)=(x0−2x1+x2)t2+(2x1−2x0)t+x0
                //y(t)=(y0−2y1+y2)t2+(2y1−2y0)t+y0
                // with P0 as start point P1 as control point, and P2 as end point
                //uses calculations from drawCurve function as well
                //var x1 = this.v0 - this.yCurve
               // if( pY > (this.u0 - (2* x1) + this.u1 )*Math.pow(pX, 2) + ((2* x1) + (2*this.u0)) * pX + this.u0  ) // are we under the line
                    return true;
            }
        }
        
        //either outside the circle, or not under the line
        return false;
    }

} //end of watch class


/* Graph class
Generates a basic line graph.
@x  - float: x coord to draw the graph
@y - float: y coord to draw the graph
@numPoints - int: number of points to generate

The graph will resize and select points (see draw function) based on input
*/
class Graph {

    constructor(x, y, width, height, numPoints, colour) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.padding = this.width / 20;

        this.pointSize = 3; //size of the points on the graph
        this.numPoints = numPoints;
        this.poi = 0; //point we want to select (generated in "generatePoints")
        this.generatePoints();

        this.idleColour = colour;
        this.colour = colour

        this.selectedPointSize = 5; //size of the point selection
        this.selected = false; //has the graph been selected
        this.selectedColour = "yellow";
        
        this.poiSelected = false; //is the poi being selected

        //animate the points
        this.animLength = 1;
        this.animIndex = 0;

    }

    /*draw
    draw the graph.
    @display - bool: should we display the graph or not - if true graph will resize
    @ratio - float: what ratio on the interaction area are we - selects individual points (display also must be true)
    */
    draw(display, ratio) {
        //check if we are already resized (prevents infinite growth/shrinkage)
        if(this.selected && !display || !this.selected && display) {
            this.resize();
        } 

        ctx.beginPath();
        ctx.fillStyle = this.colour;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = "white";
        ctx.fillRect(this.x + this.padding, this.y + this.padding, this.width - this.padding * 2, this.height - this.padding * 2);

        this.drawPoints(this.width);
        if(display)
            this.drawSelection(ratio);
    }


    //figure out which element is selected, and draw something to indicate we have selected it, along with displaying the relevant data
    //@ratio - the ratio along the interacton area: corresponds to where
    drawSelection( ratio ) {
        var inc = 1 / this.numPoints;
        var i;
        var sol;
        for( i = 1; i < this.numPoints; i ++) {
            if(ratio < inc*i) {
                sol = i-1;
                break;
            }
        }
        if(sol == null)
            sol = this.numPoints-1;
        //draw the point
        var min = this.y + this.padding;
        var max = this.y + this.height - this.padding;

        var xSpacing = ((this.x + this.width - this.padding) - (this.x + this.padding) )/ this.numPoints;
        
        var xPos =(this.x + this.padding + xSpacing * sol);
        var yPos = (this.points[sol] * (max - min)  + min);

        //draw the selection
        ctx.fillStyle = selectColour;
        ctx.beginPath();
        ctx.arc(xPos, yPos, this.selectedPointSize, 0, 2*Math.PI);
        ctx.fill();

        if(sol == this.poi) {
            this.poiSelected = true;
        } else {
            this.poiSelected = false;
        }

        if(this.poiSelected) { 
            indicator.update(this.poiSelected);
        }

        //display the value
        this.displayValue(sol, xPos, yPos);
    }   

    //displays the value of a point at index
    //x and y is where the point is being drawn at
    //we will display the value at a small offset from that
    displayValue(index, x, y) {
        var offset = 30; //the offset for our value to be displayed at
        var w = 40;
        var h = 20;
        var yPos;
        if(y - offset < this.y)
            yPos = y + offset/2;
        else 
            yPos = y - offset;

        ctx.fillStyle = "white";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(x, yPos, w, h);
        ctx.stroke();
        ctx.fill();

        ctx.font = "14px Arial";
        ctx.fillStyle = "black";
        var val = 1 - this.points[index];
        var text = Math.round( val*100) /100; //round to 2 decimal places
        ctx.fillText(text, x+4, yPos + offset/2);
    }


    drawPoints() {
        var i;
        var xSpacing = ((this.x + this.width - this.padding) - (this.x + this.padding) )/ this.numPoints;


        //minimum and maximum position on the grah
        var min = this.y + this.padding;
        var max = this.y + this.height - this.padding;

        
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        for(i = 0; i < this.numPoints; i ++ ) {
            var yPos = this.points[i] * (max - min)  + min;
            if( i+1 < this.numPoints) {
                var yPos2 = this.points[i+1] * (max - min)  + min //the next point
                //draw a line between point i and i+1
                ctx.beginPath();
                ctx.moveTo(this.x + this.padding + xSpacing * i, yPos);
                ctx.lineTo(this.x + this.padding + xSpacing * (i+1), yPos2);
                ctx.stroke();
            }
            //draw the point we want users to select a different colour
            if(i == this.poi)
                ctx.fillStyle = poiColour;
            else
                ctx.fillStyle = pointColour;

            ctx.beginPath();
            ctx.arc((this.x + this.padding + xSpacing * i ), yPos, this.pointSize, 0, 2* Math.PI);
            ctx.fill();
        }
    }

    generatePoints() {
        this.points = [];
        this.currPointY = [];
        var i;
        var min = 0.1;
        var max = 0.98;
        for(i = 0; i < this.numPoints; i++ ){
            this.points[i] = Math.random() * (max - min)  + min;
            this.currPointY[i] = 0;
        }
        this.poi = -1; //reset
    }

    generatePOI() {
        this.poi = Math.floor(Math.random() * this.numPoints); //point we want to select 
    }


    resize() {
        var factor = 1;
        this.selected = !this.selected;
        if(this.selected) { //make the graph big
            //increase the size
            this.width = this.width*factor;
            this.height = this.height *factor;
            this.colour = this.selectedColour;
            //reposition
            // this.x = this.x - this.width/4;
            // this.y = this.y - this.height /4;
        } else { //make it small
            //reposition
            // this.x = this.x + this.width/4;
            // this.y = this.y + this.height /4;
            //double the size
            this.width = this.width/factor;
            this.height = this.height /factor;
            this.colour = this.idleColour;
        }
    }//resize

    reset() {
        this.generatePoints();
    }
} //end of graph class


////////////////////////////////////////
//BarGraph
//create a bar graph

class BarGraph extends Graph {
    
    constructor(x, y, width, height, numPoints, colour) {
        super(x, y, width, height, numPoints, colour);
        this.barSpacing = 1; // how much should we space the bars out
    }

    //changed from original definition
    //instead of drawing points, draw bars
    drawPoints() {
        var i;
        var xSpacing = ((this.x + this.width - this.padding) - (this.x + this.padding) )/ this.numPoints;

        var min = this.y + this.padding;
        var max = this.y + this.height - this.padding;
        
        //decide how big the bars should be
        var barWidth = (this.width - (this.padding * 2) - (this.numPoints*this.barSpacing) ) /this.numPoints;

        ctx.lineWidth = 1;
        for(i = 0; i < this.numPoints; i ++ ) {
            //make the poi an interesting colour
            if(i == this.poi)
                ctx.fillStyle = poiColour;
             else
                ctx.fillStyle = pointColour;

            var yPos = this.points[i] * (max - min)  + min; //convert from %
            var xPos = (this.barSpacing/2 +this.x + this.padding + xSpacing * i );
            var barHeight = (this.y + this.height - this.padding) - yPos;
            ctx.fillRect(xPos, yPos - this.barSpacing/2, barWidth, barHeight);
        }//for
    }//drawPoints

    //draws the selection on the graph
    //will highlight an entire bar
    //decide based on the given ratio 0 - 1
    drawSelection(ratio) {
        //find out which bar we should select based on the ratio
        var inc = 1 / this.numPoints;
        var i;
        var sol;
        for( i = 1; i < this.numPoints; i ++) {
            if(ratio < inc*i) {
                sol = i-1;
                break;
            }
        }
        if(sol == null)
            sol = this.numPoints-1;


        //check if the point of interest is selected
        if(sol == this.poi) {
            this.poiSelected = true;
        } else {
            this.poiSelected = false;
        }

        if(this.poiSelected) { 
            indicator.update(this.poiSelected);
        }
    

        //draw the bar
        var min = this.y + this.padding;
        var max = this.y + this.height - this.padding;

        var xSpacing = ((this.x + this.width - this.padding) - (this.x + this.padding) )/ this.numPoints;
        ctx.fillStyle = selectColour;
        var xPos =(this.barSpacing/2 + this.x + this.padding + xSpacing * sol);
        var yPos = (this.points[sol] * (max - min)  + min);
        //determine the width and height
        var barWidth = (this.width - (this.padding * 2) - (this.numPoints*this.barSpacing) ) /this.numPoints;
        var barHeight = (this.y + this.height - this.padding) - yPos;
        ctx.fillRect(xPos, yPos- this.barSpacing/2, barWidth, barHeight);

        //display the value 
        this.displayValue(sol, xPos, yPos);
    }
}// end of BarGraph class

class PieGraph extends Graph {


    constructor(x, y, radius, numPoints, colour) {
        super(x, y, 0, 0, numPoints, colour);
        this.radius = radius;
    }

    draw(display, ratio) {        
        //check if we are already resized (prevents infinite growth/shrinkage)
        if(this.selected && !display || !this.selected && display) {
            this.resize();
        } 
        this.drawPoints();
        
        if(display)
            this.drawSelection(ratio);
    }


    //changed from original definition
    //instead of drawing points, draw pie slices
    //note that as there are more divisions, this method causes smaller and smaller slices to be drawn
    //could be fixed, but dont think its necessary at this point
    drawPoints() {

        var min = this.y + this.padding;
        var max = this.y + this.height - this.padding;
        
        ctx.fillStyle = pointColour;
        ctx.strokeStyle = this.colour;
        var colors = ["#3F7CAC", "#95AFBA", "#BDC4A7", "#D5E1A3", "#E2F89C"];
        if(this.selected)
            ctx.lineWidth = 4;
        else
            ctx.lineWidth = 1;

        var lastAngle = 0; //start at 0
        var total = 2* Math.PI;
        var i;
        for(i = 0; i < this.numPoints-1; i ++ ) {
            //draw the point we want users to select a different colour
            if(i == this.poi)
                ctx.fillStyle = poiColour;
            else
                ctx.fillStyle = colors[i];

            var angle = total * this.points[i];
            total = total - angle;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.arc(this.x, this.y, this.radius, lastAngle, lastAngle + angle);
            ctx.fill();
            ctx.stroke();

            lastAngle += angle;
        }//for

        
        if(i == this.poi)
            ctx.fillStyle = poiColour;
        else
            ctx.fillStyle = colors[i];

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.arc(this.x, this.y, this.radius, lastAngle, 2* Math.PI);
        ctx.moveTo(this.x,this.y);
        ctx.fill();
        ctx.stroke();
    }//drawPoints

    //slghtly altered from super
    //numbers generate in a range to eliminate the problem of strange looking pie charts when a really low or high number is generated
    generatePoints() {
        var min = 0.15;
        var max = 0.50;
        this.points = [];
        var i;
        for(i = 0; i < this.numPoints; i++ ){
            this.points[i] = Math.random() * (max - min) + min;
        }

        this.poi = -1; //reset
    }


    //draws the selection on the graph
    //will highlight an entire bar
    //decide based on the given ratio 0 - 1
    drawSelection(ratio) {

        //increase the radius when selected
        var selectedRadius = this.radius +8;

        //find out which bar we should select based on the ratio
        var inc = 1 / this.numPoints;
        var i;
        var sol;
        for( i = 1; i < this.numPoints; i ++) {
            if(ratio < inc*i) {
                sol = i-1;
                break;
            }
        }
        if(sol == null)
            sol = this.numPoints-1;
            

        //check if the point of interest is selected
        if(sol == this.poi) {
            this.poiSelected = true;
        } else {
            this.poiSelected = false;
        }

        
        if(this.poiSelected) { 
            indicator.update(this.poiSelected);
        }
    
    
        var lastAngle = 0; //start at 0
        var total = 2* Math.PI;
        var i;
        for(i = 0; i < sol; i ++ ) {
            var angle = total * this.points[i];
            total = total - angle;
            lastAngle += angle;
        }//for

        ctx.fillStyle = selectColour;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        if(sol == this.numPoints-1)
            ctx.arc(this.x, this.y, selectedRadius, lastAngle, 2* Math.PI);
        else {
            var angle = total * this.points[sol];
            total = total - angle;
            ctx.arc(this.x, this.y, selectedRadius, lastAngle, lastAngle +angle);
        }
        ctx.lineTo(this.x,this.y);
        ctx.fill();
        ctx.stroke();

        var displayAngle = 135;
        var xPos = this.x + (this.radius * Math.cos(displayAngle * (Math.PI/180)) );
        var yPos = this.y + (this.radius * -Math.sin(displayAngle * (Math.PI/180)) );

        //display the value 
        this.displayValue(sol, xPos, yPos);
    } //drawSelection

    //resize the graph if selected or not
    resize() {
        var factor = 1.5;
        this.selected = !this.selected;
        if(this.selected) { //make the graph big
            //double the size
            //this.radius = this.radius*factor;
            this.colour = this.selectedColour;
        } else { //make it small
            //this.radius = this.radius/factor;
            this.colour = this.idleColour;
        }
    }
}//end of PieGraphs

//holds the variables for the interaction area
//this is so we can have multiple styles to compare
//literally just holds values
class InteractionStyle {
    constructor(startAngle, stopAngle, xCurve, yCurve, r1, r1Start, r1Stop, r2, r2Start, r2Stop) {
        this.startAngle = startAngle;
        this.stopAngle = stopAngle;
        this.xCurve = xCurve;
        this.yCurve = yCurve;
        this.r1 = r1;
        this.r1Start = r1Start;
        this.r1Stop = r1Stop;
        this.r2 = r2;
        this.r2Start = r2Start;
        this.r2Stop = r2Stop;
    }
}

//indicate the selection status of each graph
//will start white then turn green when poi has been selected for timeToComplete seconds
class Indicator {
    constructor(x, y, label){
        this.x = x;
        this.y = y;
        this.label = label; //label for the indicator

        this.radius = 20; //radius of the indicator

        this.complete = false;

        this.timeToComplete = 0.5; //how many seconds to complete
        this.timeSelected = 0; //how long has it been selected

        this.completeLength = 0.4; //how long to hold on the complete
        this.completeElapsed = 0;

        this.colour = "white";
    }

    //draw the indicator
    draw() {
        
        ctx.fillStyle = this.colour;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        ctx.fill();

        //if its done have a yellow ring around the indicator
        if(this.complete) {
            if(this.completeElapsed < this.completeLength*1000) {

                this.completeElapsed += deltaTime;
                var ringSize = 4;
                ctx.fillStyle = "yellow";
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius +ringSize, 0, 2*Math.PI);
                ctx.fill();
            } else {
                this.completeElapsed = 0;
                this.onComplete();
            }
        } else if ( !G1.poiSelected && !G2.poiSelected && ! G3.poiSelected) {
            this.resetTimer();
        }

        //fill up a green circle based on how much progress we ahve to completion
        var progRadius = ((this.timeSelected/1000)/this.timeToComplete) * this.radius;

        //lock the progRadius to no larger than the radius
        if(progRadius > this.radius)
            progRadius = this.radius;

        ctx.fillStyle = "green";
        ctx.beginPath();
        ctx.arc(this.x, this.y, progRadius, 0, 2*Math.PI);
        ctx.fill();



        ctx.fillStyle = "black"
        ctx.fillText(this.label, this.x-6, this.y+3, 15);
    }//draw


    //update the indicator
    update(selected) {
        if(!this.complete) {
            this.updateComplete(selected);
            this.colour = "white";
        } else {
            this.colour = "green";
        }
    } 

    updateComplete(selected) {
        if(selected) {

            this.timeSelected += deltaTime;
            if(this.timeSelected >= this.timeToComplete*1000) {
                this.complete = true;
            }
        } else {
            this.timeSelected = 0;
        }
    } //updateComplete

    resetTimer() {
        this.timeSelected = 0;
    }


    //reset the indicator
    onComplete() {        
        //play animation -
        reset(); //reset the other graphs

        //reset the indicator
        this.timeSelected = 0;
        this.complete = false;
        this.colour = "white";
    }
}//end of class



/* Project
This is the driving function of this program. Tells us which part of the interaction area we are in, and updates the ratio within
the interaction area. As each interaction area is a different width, they each have their own ratio.

@x - posX of the mouse/touch
@y - posY of the mouse/touch
*/
function project(x , y ) {
    var v0x = (watch.x +100) - watch.x;
    var v1x = x - watch.x;
    var v1y = y - watch.y;
    var angle = (Math.atan2(-v1y, v1x) - Math.atan2(0, 1));
    //correct the angle to be within 2*PI
    if(angle < 0)
        angle += 2*Math.PI;

    //angle from the center of the watch to the mouse
    angle = angle * 180/ Math.PI; //convert to degrees

   
    //get the ratio between the stop and start angle
    //make the angle consistent (if we dont do this, angle jumps from 360 - 0 and ratio will be incorrect)
    if(angle < interactionStyles[currStyle].stopAngle)
        angle += 360;

    //the outer interaction area
    var delta = 360 + interactionStyles[currStyle].startAngle - interactionStyles[currStyle].stopAngle; // the change in angle from startangle to stopangle (useful for ratio)
    ratio = (angle - interactionStyles[currStyle].stopAngle) /delta; //ratio between start and stop angle - will be used in graphs
    //if mouse goes too far left, ratio is larger than 2 - should just display leftmost graph point (ratio 0)
    if(ratio > 1.5)
        ratio = 0;
    
    

    //middle interaction area
    var delta = interactionStyles[currStyle].r2Stop - interactionStyles[currStyle].r2Start; // the change in angle from startangle to stopangle (useful for ratio)
    midRatio = (angle - interactionStyles[currStyle].r2Stop) /delta; //ratio between start and stop angle - will be used in graphs
    midRatio = 1- (midRatio*-1);
    //if mouse goes too far left, ratio is larger than 2 - should just display leftmost graph point (ratio 0)
    if(midRatio > 2)
        midRatio = 0;
        
    //inner interaction area
    var delta = interactionStyles[currStyle].r1Stop - interactionStyles[currStyle].r1Start; // the change in angle from startangle to stopangle (useful for ratio)
    innerRatio = (angle - interactionStyles[currStyle].r1Stop) /delta; //ratio between start and stop angle - will be used in graphs 
    innerRatio = 1- (innerRatio*-1);
    if(innerRatio > 2)
    innerRatio = 0;
    

    //check the distance from the center
    var dist = Math.sqrt( Math.pow(x - watch.x, 2) + Math.pow(y - watch.y, 2) );
    
    //check which zone its in - tolerance allows for a small amount of error
    //check each case separately
    if(dist < interactionStyles[currStyle].r1 +tolerance ) {
        displayG1 = true;
    } else {
        displayG1 = false;
    }

    if(dist > interactionStyles[currStyle].r1 - tolerance && dist < interactionStyles[currStyle].r2 + tolerance) {
        displayG2 = true;
    } else {
        displayG2 = false;
    }

    if(dist > interactionStyles[currStyle].r2 - tolerance) {
        displayG3 = true;
    } else {
        displayG3 = false;
    }
    

} //end of project


function nextStyle() {
    currStyle = (currStyle +1) % interactionStyles.length;
    watch.calcInteractionLine(interactionStyles[currStyle].startAngle, interactionStyles[currStyle].stopAngle);
    console.log("currStyle is " + currStyle);
}

//reset all our objects
//graphs generate new points
//indicators reset their complete status
function reset() {
    console.log("resetting graphs and indicators");
    G1.reset();
    G2.reset();
    G3.reset();

    choosePOI();
}


function choosePOI() {
    var max = 3;
    var min = 0;
    var graphToSelect = Math.floor(Math.random() *(max - min) + min);
    console.log(graphToSelect);
    switch(graphToSelect) {
        case 0:
            G1.generatePOI();
            break;
        case 1: 
            G2.generatePOI();
            break;
        case 2:
            G3.generatePOI();
            break;
    }
}

function drawDebug() {
    
    //draw graph selection indicators
    if(false) {
        var xPos = 70;
        var yPos = 50;
        var size = 10;
        ctx.font = "10px Arial";
        ctx.fillStyle = "black";
        ctx.fillText("G1", xPos -8, yPos +20);
        if(displayG1) {
            ctx.fillStyle = "blue";
            ctx.beginPath();
            ctx.arc(xPos, yPos, size, 0, 2* Math.PI, true);
            ctx.fill();
            ctx.closePath();
        }
        ctx.fillStyle = "black";
        ctx.fillText("G2", xPos +12, yPos+20);
        if(displayG2) {
            ctx.fillStyle = "green";
            ctx.beginPath();
            ctx.arc(xPos + 20, yPos, size, 0, 2* Math.PI, true);
            ctx.fill();
            ctx.closePath();
        }

        ctx.fillStyle = "black";
        ctx.fillText("G3", xPos + 32, yPos+20);
        if(displayG3) {
            ctx.fillStyle = "yellow";
            ctx.beginPath();
            ctx.arc(xPos + 40, yPos, size, 0,2* Math.PI, true);
            ctx.fill();
            ctx.closePath();
        }
    }

    //draw small and middle ratio start stop lines (for interaction area)
    if(true) {

        //inner circle
        var x0 = watch.x + (watch.r * Math.cos(interactionStyles[currStyle].r1Start * (Math.PI/180)) );
        var y0 = watch.y + (watch.r * -Math.sin(interactionStyles[currStyle].r1Start * (Math.PI/180)) );

        var x1 = watch.x + (watch.r * Math.cos(interactionStyles[currStyle].r1Stop * (Math.PI/180)) );
        var y1 = watch.y + (watch.r * -Math.sin(interactionStyles[currStyle].r1Stop * (Math.PI/180)) );
        //inner interaciton
        ctx.lineWidth = 1;
        ctx.strokeStyle = "blue";
        ctx.moveTo(watch.x, watch.y);
        ctx.lineTo(x0, y0);
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.moveTo(watch.x, watch.y);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.closePath();
        
        //outer circle
        x0 = watch.x + (watch.r * Math.cos(interactionStyles[currStyle].r2Start * (Math.PI/180)) );
        y0 = watch.y + (watch.r * -Math.sin(interactionStyles[currStyle].r2Start * (Math.PI/180)) );

        x1 = watch.x + (watch.r * Math.cos(interactionStyles[currStyle].r2Stop * (Math.PI/180)) );
        y1 = watch.y + (watch.r * -Math.sin(interactionStyles[currStyle].r2Stop * (Math.PI/180)) );

        ctx.lineWidth = 1;
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.moveTo(watch.x, watch.y);
        ctx.lineTo(x0, y0);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(watch.x, watch.y);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.closePath();
    }

    //draw ratio %
    if(true) {
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";

        var text = "Ratio: " + ratio;
        ctx.fillText(text, 50, watch.y + 100);

        var text = "Mid Ratio: " + midRatio;
        ctx.fillText(text, 50, watch.y + 115);

        var text = "Inner Ratio: " + innerRatio;
        ctx.fillText(text, 50, watch.y + 130);
    }
}




var X = 0; //for readability
var Y = 1; //for readability

var DEBUG = false;

//watch parameters
var posX = canvas.width/2; //watch centre 
var posY = canvas.height/2;
var r = canvas.width/2;

const Mode = {"QUAD":1, "BUBBLE":3} //which interaction mode
var interactionMode = Mode.BUBBLE; 

//draw a line sectioning off the interaction area
var startAngle = 40;
var stopAngle = 220;

//how much to curve the quadratic line
var yCurve = 320;
var xCurve = 40;


//inner ring radius
var r1 = 150;
//middle ring radius
var r2 = 165;

//angles for the small and middle ratio start and stop points
//could use math to change these automatically, but curved line with circle intersection is hard
var smallRatioAngle = [247, 374];
var midRatioAngle = [25, 235];

//how much to tolerate finger innaccuracy
var tolerance = 17;


//if true, use a straight line for the interaction area
//false - we will use a quadratic curve
lineInteraction = false; 



var displayG1 = false;
var displayG2 = false;
var displayG3 = false;
var ratio = 0;
var midRatio = 0;
var innerRatio = 0;

//colors for the arcs
var innerArcColour = "#CDF7F6"; 
var middleArcColour = "#9A94BC "; 
var outerArcColour = "#9B5094";  

var pointColour = "#56CBF9";
var selectColour = "#ff051a";

var poiColour = "#ff08c5"; //point of interest colour - point we want users to select

var backgroundColour = "#1e1f26";

var currStyle = 0;
var interactionStyles = [];
interactionStyles.push(new InteractionStyle(33, 240, 10, 260, 150, 258, 360, 160, 270, 370) );
interactionStyles.push(new InteractionStyle(30, 240, 10, 260, 155, 258, 360, 162, 270, 370) );
interactionStyles.push(new InteractionStyle(20, 240, -20, 220, 155, 265, 345, 165, 255, 360) );
interactionStyles.push(new InteractionStyle(40, 220, 20, 280, 140, 250, 367, 160, 236, 383) );
interactionStyles.push(new InteractionStyle(40, 220, 40, 320, 150, 247, 374, 165, 235, 385) );

let watch = new Watch(posX, posY, r, startAngle, stopAngle);


let G1 = new PieGraph(87, 100, 60, 5, innerArcColour); //pie chart divided 
let G2 = new BarGraph(150, 50, 160, 100, 40, middleArcColour); //bar graph
let G3 = new Graph(40, 160, 200, 140, 40, outerArcColour); //line graph



var indicatorPosX = 130;
var indicatorPosY = 30;
var indicator = new Indicator(indicatorPosX, indicatorPosY, ""); 


choosePOI();

//draw
//draws to the screen of the watch
function draw() {
    updateTime();
    //render the frame
    ctx.fillStyle = backgroundColour;
    ctx.fillRect(0,0, 400, 400);
    watch.draw();
    G1.draw(displayG1, innerRatio);
    G2.draw(displayG2, midRatio);
    G3.draw(displayG3, ratio);

    //draw indicator
    indicator.draw();
}

var last;
var deltaTime; //change in time
function updateTime() {

    if(last == null){
        last = Date.now();
    }
    
    deltaTime = Date.now() - last;
    last = Date.now();
}

let framesPerSecond = 60;

/* update
calls update framesPerSecond times per second - renders to the screen
*/
function update() {
    setTimeout(function () {
        requestAnimationFrame(update);

        //draw here
        draw();
        if(DEBUG)
            drawDebug();

    }, 1000 / framesPerSecond);
}

requestAnimationFrame(update);
//draw();