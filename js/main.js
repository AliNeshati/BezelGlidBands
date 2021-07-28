
var canvas = document.getElementById("watch");
var ctx = canvas.getContext("2d");


///////////////EVENTS////////////////////

//for web
canvas.addEventListener("mousedown", onMouseDown);
canvas.addEventListener("mouseup", onMouseUp);
document.addEventListener("keydown", onKeyDown);
canvas.addEventListener("mousemove", onMouseMove);

//for mobile
canvas.addEventListener("touchmove", onTouchMove);
canvas.addEventListener('touchstart', onTouch);
canvas.addEventListener('touchend', onTouchEnd);

//for watch
document.addEventListener('tizenhwkey', onHWKey);


function onHWKey(e) {
    if(e.keyName == "back") {
        nextStyle();
    }
}


function onTouch(e) {

    if(touchEnded && !enableTrial) {
        //make sure the user takes their finger off the screen (touchEnded)
        //and if we are inbetween trials, this touch will start the next trial

        if(e.clientY > yDivider) //disable touches that are above yDivider so we can press the force exit button
            onTrialStart();
    } else {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;    
        
        //check if we are inside the interactable area
        if(watch.insideInteractive(mouseX, mouseY) ) {
            //project our touch from the interactive area to the projected area
            projPoint = project(mouseX, mouseY);
        }
    }
}

function onTouchMove(e) {
    e.preventDefault(); //prevent swiping down
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
    
    if(watch.insideInteractive(mouseX, mouseY) ) {
        //project our touch from the interactive area to the projected area
        projPoint = project(mouseX, mouseY);
    }
}

function onTouchEnd() {
    touchEnded = true;
}

function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    if(watch.insideInteractive(mouseX, mouseY) ) {
        //project our touch from the interactive area to the projected area
        projPoint = project(mouseX, mouseY);
    }

}


var mouseDown = false;
function onMouseUp() {
    mouseDown = false;
}

var yDivider = 150; // disable resetting 
function onMouseDown(e) {
    mouseDown = true;
    if(!enableTrial) {
        if(e.clientY > yDivider) //disable touches that are above yDivider so we can press the force exit button
            onTrialStart();
    } else {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        if(watch.insideInteractive(mouseX, mouseY) ) {
            //project our touch from the interactive area to the projected area
            projPoint = project(mouseX, mouseY);
        }
    }
}


function onKeyDown(e) {
    var message = "";
    if ( e.key == 'd') { //enable debug mode - see debug
        DEBUG = !DEBUG;
        message = "Debug Mode: " + DEBUG;
        draw();
    }else if (e.key == 'c') { //depreciated after update implementation (screen is being redrawn 60x/s
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

//start the next trial - initialize the trial start time
function onTrialStart() {
    trialStartTime = Date.now();    
    enableTrial = true;
}

//a button - simple as that
class Button {
    /* constructor
    @x x pos
    @y y pos
    @label - string - a short descriptor for the button
    @action - function - what function will this button call
        note that this will call the function immediately
        - if you want the function to be called after holding,
            use it in tandem with a TimingIndicator.
    */
    constructor(x, y, label, action) {
        this.x = x;
        this.y = y;
        this.label = label;
        this.width = 100;
        this.height = 50;
        this.action = action;
        this.clickedColour = "green";
        this.notSelectedColour = "grey";

        this.clicked = false;
    }

    draw() {
        if(this.clicked) 
            ctx.fillStyle = this.clickedColour;
        else 
            ctx.fillStyle = this.notSelectedColour;
        ctx.beginPath();
        ctx.fillRect(this.x, this.y, this.width, this.height);

        
        ctx.fillStyle = "black";
        ctx.font = "24px Arial";
        ctx.fillText(this.label, this.x + 10, this.y + 30);

        //check if we clicked the button - not very elegant but works nicely
        //only issue i have observed is that functions may be called multiple times
        //using buttons&indicators solves this so i didnt bother fixing
        if(mouseDown) {
            if(mouseX > this.x && mouseX < this.x + this.width) {
                if(mouseY > this.y && mouseY < this.y + this.height) {
                    this.clicked = true;
                    this.performAction();
                } else {
                    this.clicked = false;
                }
            } else {
                this.clicked = false;
            }
        } else {
            this.clicked = false;
        }
    }

    //simply perform the action (if there is one)
    performAction () {
        if(this.action != null) 
            this.action();
    }
}

//defines the structure of the watch
class Watch {

    //startangle stopangle is the start and stop angle of the interaction area
    constructor(x, y, r, startAngle, stopAngle) {

        this.x = x; //center of the watch
        this.y = y;
        this.r = r; //radius

        this.calcInteractionLine(interactionStyles[currStyle].startAngle, interactionStyles[currStyle].stopAngle);
        
    }
    
    //draw the watch and everything on the screen
    draw() {

        this.drawInteractionArea();

        //somewhat depreciated - we only really draw the curve interaction but this isnt hurting anyone
        if(lineInteraction)
            this.drawLine();
        else
            this.drawCurve();

        this.drawWatch(); 

    }

    //draw a nice (ish) looking interaction area
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
    See the definition of canvas.quadraticCurveTo to better understand control points
    basically the position of the control points defines the curve of the line
    - further away the point the greater the curve
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
            //check we are under the line

            //using standard slop form (y = mx + b)
            var m = (this.v1 - this.v0 ) / (this.u1 - this.u0); //slope
            var b = this.v0 - (m* this.u0) //offset

            if(pY > m*pX + b) // are we under the line
                return true;

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
        this.padding = 10;

        this.pointSize = 3; //size of the points on the graph
        this.numPoints = numPoints;
        this.poi = -1; //point we want to select (generated in "generatePoints")
        this.generatePoints();

        this.idleColour = colour;
        this.colour = colour

        this.selectedPointSize = 5; //size of the point selection
        this.selected = false; //has the graph been selected
        this.selectedColour = "yellow";
        
        this.poiSelected = false; //is the poi being selected

        //variables for stop condition
        this.stopCondReached = false;
        this.stopCond = []

        //animate the points - unused (for now)
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
        ctx.fillRect(this.x, this.y, this.width, this.height); //draw the background of the graph
        // ctx.fillStyle = "white";
        // ctx.fillRect(this.x + this.padding, this.y + this.padding, this.width - this.padding * 2, this.height - this.padding * 2);

        this.drawPoints(this.width);

        //if the display flag is set - we should draw the selection
        if(display)
            this.drawSelection(ratio);
    }


    //figure out which element is selected, and draw something to indicate we have selected it, along with displaying the relevant data
    //@ratio - the ratio along the interacton area: corresponds to where
    drawSelection( ratio ) {
        var inc = 1 / this.numPoints; //how much ratio per point basically: 10 points - inc will be 0.1
        var i;
        var sol;
        //find the point we are selecting
        //if ratio is 30% and we have 10 points, inc*3 = 30 and that will be sol
        for( i = 1; i < this.numPoints; i ++) {
            if(ratio < inc*i) {
                sol = i-1;
                break;
            }
        }
        if(sol == null) // the solution was the last point
            sol = this.numPoints-1;
        //draw the point
        var min = this.y + this.padding; //minimum position for the point
        var max = this.y + this.height - this.padding; //maximum

        //how much are the points spaced on the x axis
        var xSpacing = ((this.x + this.width - this.padding) - (this.x + this.padding) )/ this.numPoints;
        
        var xPos =(this.x + this.padding + xSpacing * sol);
        var yPos = (this.points[sol] * (max - min)  + min);

        //draw the selection
        ctx.fillStyle = selectColour;
        ctx.beginPath();
        ctx.arc(xPos, yPos, this.selectedPointSize, 0, 2*Math.PI);
        ctx.fill();

        //just set a flag if the poi is selected or not
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

    //draw all the points in the graph
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
                ctx.moveTo(this.x + this.padding + (xSpacing * i), yPos);
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

    //generate a bunch of random points
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

    //generate a poi (only if we are told by another external function)
    generatePOI() {
        this.poi = Math.floor(Math.random() * this.numPoints); //point we want to select 
    }

    //on selection/deselection resize the graph - simply multiply by a factor
    //changed factor to 1 so as to not resize based on feedback, but keeping this function just in case we chang our minds
    resize() {
        var factor = 1; //multiply by one - so no resizing 
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
        this.poiSelected = false;
    }
} //end of graph class


//this is for this specific experiment
class DynamicGraph extends Graph {

    constructor(x, y, numPoints, colour) {
        super(x, y , 0, 0, numPoints, colour);
        this.width = 250;
        this.height = 50;
        this.graphHeight = this.height - (this.padding *2);

        this.incrementedNumPoints = false
    }

    reset() {
        this.generatePoints();
        
        this.incrementedNumPoints = false
    }

    draw(display, ratio) {
  
        ctx.fillStyle = this.colour;

        ctx.beginPath();
        if(this.poi >= 0)
            ctx.fillRect(this.x, this.y, this.width, this.height);
        

        this.drawPoints();

        if(display && enableTrial)
            this.drawSelection(ratio);
    }   

    drawPoints() {
        
        ctx.fillStyle = this.colour;
        ctx.lineWidth = 2;
        
        var xSpacing = ((this.x + this.width - this.padding) - (this.x + this.padding) )/ this.numPoints;

        var i;
        for( i = 0; i < this.numPoints; i ++ ) {
            let xPos = this.x + this.padding + (xSpacing * i);
            ctx.beginPath();
            //draw the point we want users to select a different colour
            if(i == this.poi) {
                ctx.fillStyle = poiColour;
                ctx.strokeStyle = poiColour;
            } else { 
                ctx.strokeStyle = "white";
                ctx.fillStyle = pointColour;
            }
            ctx.rect(xPos , this.y + this.padding, xSpacing, this.graphHeight);
            ctx.fill();
            ctx.stroke();
        }
    } //drawPoints

        //figure out which element is selected, and draw something to indicate we have selected it, along with displaying the relevant data
    //@ratio - the ratio along the interacton area: corresponds to where
    drawSelection( ratio ) {
        var inc = 1 / this.numPoints;
        var i;

        //determine the solution index
        var sol;
        for( i = 1; i < this.numPoints; i ++) {
            if(ratio < inc*i) {
                sol = i-1;
                break;
            }
        }
        if(sol == null)
            sol = this.numPoints-1;

        //highlight the point
        var min = this.y + this.padding;
        var max = this.y + this.height - this.padding;

        var xSpacing = ((this.x + this.width - this.padding) - (this.x + this.padding) )/ this.numPoints;
        
        var xPos =(this.x + this.padding + xSpacing * sol);
        var yPos = this.y + this.padding;



        if(sol == this.poi) {
            this.poiSelected = true;
            ctx.fillStyle = "green"
        } else {
            this.poiSelected = false;
            ctx.fillStyle = selectColour;
        }


        //draw the selection
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.rect(xPos, yPos, xSpacing, this.graphHeight);
        ctx.fill();
        ctx.stroke();
        if(this.poiSelected) { 
            var complete = indicator.update(this.poiSelected);

            //edit the number of points in the graph
            if(complete && !this.incrementedNumPoints) {
                if(timingIndicator.complete) {
                    if(this.numPoints > 2) //a minimum of 2 points
                        this.numPoints --;

                        //stop condition stuff
                        if(this.stopCond[this.numPoints] == undefined) {
                            console.log("initializing stopcond at " + this.numPoints);
                            this.stopCond[this.numPoints] = 1;
                        } else {
                            this.stopCond[this.numPoints] ++;
                            console.log("Stop condition at pos " + this.numPoints + " has increased to " + this.stopCond[this.numPoints] );
                        }

                        //if we have reached the maximum number of decreasing revisits - set a flag (and disable graph from getting pois - see choosePoi())
                        if(this.stopCond[this.numPoints] >= this.stopCondMax) {
                            this.stopCondReached = true;
                            console.log("Stop condition reached for " + this.label);
                        }

                } else {
                    this.numPoints ++;
                }
                this.incrementedNumPoints = true; //prevents number of points changing rapidly after selection
            }
        }

        //display the value 
        //this.displayValue(sol, xPos, yPos);
    } 
} //Dynamic Graph

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
    //@x, y : position
    //@timeToComplete: the time it takes for the indicator to fill
    //@label: string label
    constructor(x, y, timeToComplete, label){
        this.x = x;
        this.y = y;
        this.label = label; //label for the indicator

        this.radius = 20; //radius of the indicator

        this.complete = false; //MUST CALL RESET TIMER to reset this

        this.timeToComplete = timeToComplete; //how many seconds to complete
        this.timeSelected = 0; //how long has it been selected

        this.completeLength = 0.4; //how long to hold on the complete
        this.completeElapsed = 0;

        this.colour = "white";
    }

    //draw the indicator
    draw() {
        
        ctx.fillStyle = this.colour;
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        ctx.stroke();
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
                this.onComplete();
            }
        } 
        // else if ( !G1.poiSelected && !G2.poiSelected && ! G3.poiSelected) {
        //     this.resetTimer();
        // }

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
    //return whether or not the indicator is complete or not
    //if it is selected, it will update the time to complete
    update(selected) {
        if(!this.complete) {
            this.updateComplete(selected);
            this.colour = "white";
            return false;
        } else {
            this.colour = "green";
            return true;
        }
    } 

    //perhaps a flaw in my design - should be moved to draw
    //in this current implementation we must use draw to actually draw the indicator
    //and this function to update whether it is selected or not
    //both must be called in a higher level draw function (drawTrial or similar)
    updateComplete(selected) {
        if(selected) {

            this.timeSelected += deltaTime;
            if(this.timeSelected >= this.timeToComplete*1000) {
                this.complete = true;
            }
        } else {
            this.resetTimer();
        }
    } //updateComplete

    //reset this timer
    resetTimer() {
        this.timeSelected = 0;
        this.completeElapsed = 0;
        this.complete = false;
    }


    //reset the indicator
    onComplete() {        
        //play animation -
        reset(); //reset the other graphs
        timingIndicator.resetTimer();

        //reset the indicator
        this.completeElapsed = 0;
        this.timeSelected = 0;
        this.complete = false;
        this.colour = "white";
    }
}//end of class


//this class will help us time how long between graph selection completions
//small changes to functionality
//on complete we will call a function (if there is one set)
class TimingIndicator extends Indicator {
    constructor(x, y, timeToComplete, label, func){
        super(x, y, timeToComplete, label);
        this.func = func;
        this.completeLength = 0.5; //how long to hold on the complete 
        this.completeElapsed = 0;
    }

    onComplete() {
        if(this.func != null) {
            this.func();
        }
    }
}


//makes the logging of touchPoints more readable and understandable
class TouchPoint {
    constructor(x, y, trialNum) {
        this.x = x;
        this.y = y;
        
        this.trialNum = trialNum;
        this.r = 3;

        //calculate which ring we are currently in
        this.calculateRingPos();
    }

    //in case we ever want to draw the touchpoint?
    draw() {
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI *2);
        ctx.fill();
    }


    //calculate which bands are active with this touchPoint, and which band this touchPoint is in
    calculateRingPos() {

        //check the distance from the center
        var dist = Math.sqrt( Math.pow(this.x - watch.x, 2) + Math.pow(this.y - watch.y, 2) );

        /////
        //check which bands are active (Needs a bit of work - but this could be used to show which bands are active with this x, y)
        if(dist < interactionStyles[currStyle].r1 +tolerance ) {
            this.G1Active = true;
        } else {
            this.G1Active = false;
        }

        if(dist > interactionStyles[currStyle].r1 - tolerance && dist < interactionStyles[currStyle].r2 + tolerance) {
            this.G2Active = true;
        } else {
            this.G2Active = false;
        }

        if(dist > interactionStyles[currStyle].r2 - tolerance) {
            this.G3Active = true;
        } else {
            this.G3Active = false;
        }
        ////

        //check where the touchPoint is ( in which band)
        if(dist < interactionStyles[currStyle].r1) {
            this.ringPos = 1; //in r1 (innermost)
        } else if(dist > interactionStyles[currStyle].r1 && dist < interactionStyles[currStyle].r2) {
            this.ringPos = 2; //r2 (middle)
        } else if(dist > interactionStyles[currStyle].r2 - tolerance) {
            this.ringPos = 3; //r3 (outermost)
        }
    }
}

//information on the specific trial
class TrialInfo {
    constructor(trialNum, trialTime, G1Points, G2Points, G3Points) {
        this.trialNum = trialNum;
        this.trialTime = trialTime;
        this.G1Points = G1Points;
        this.G2Points = G2Points;
        this.G3Points = G3Points;
    }  
}

var saved = false;
function save() {
    if(!saved) {
        console.log("Beginning save.... ");

        //construct the json object for this participant
        var touchPointX = [];
        var touchPointY = [];
        var ringPos = []; //which ring is the point in
        var trialNum = [];

        var i;
        //convert our objects into array format
        for(i = 0; i < savedTouchPoints.length; i++ ) {
            touchPointX.push(savedTouchPoints[i].x);
            touchPointY.push(savedTouchPoints[i].y);
            ringPos.push(savedTouchPoints[i].ringPos);
            trialNum.push(savedTouchPoints[i].trialNum);
        }

        trialNum = [];
        var trialTime = [];
        var G1Points = [];
        var G2Points = [];
        var G3Points = [];

        for(i = 0; i < trialData.length; i++) {
            trialNum.push(trialData[i].trialNum);
            trialTime.push(trialData[i].trialTime);
            G1Points.push(trialData[i].G1Points);
            G2Points.push(trialData[i].G2Points);
            G3Points.push(trialData[i].G2Points);
        }

        //throw it all into a json
        var trialJson = {
            participant:{
                "PID":participantID,
                "touchPoints":{
                    "touchPointX":touchPointX,
                    "touchPointY":touchPointY,
                    "ringPos":ringPos,
                    "trialNum":trialNum
                },
                "trialInfo":{
                    "trialNum":trialNum,
                    "trialTime":trialTime,
                    "G1Points":G1Points,
                    "G2Points":G2Points,
                    "G3Points":G3Points,
                }
            }
        }
        console.log(trialJson);
        jsonString = JSON.stringify(trialJson);
        //TO DO: SEND TO A FILE
        saved = true;
        console.log("Save complete. Results:\n\n");
        //console.log(trialJson);
    } //if
} //save

function writeData(jsonString) {
    tizen.filesystem.resolve("documents", function(dir) {
        dataFile = dir.createFile('Participant_' + PID +  '.json');
        // https://stackoverflow.com/questions/47848248/how-to-write-new-info-to-json-file-in-tizen-studio  -- this will finish the saving
    });
}

/*
* @name setupFile 
* @desc Asks for permission from the user to create a file
* @param none 
* @return none
*/
function setupFile() {
    console.log("setting up file");
    try {
        tizen.ppm.requestPermission("http://tizen.org/privilege/mediastorage",
                onsuccessPermission, onErrorPermission);
    } catch(err) {
        console.log(err.message);
    }
} // end setupFile

/*
* @name onErrorPermission 
* @desc Writes to the console when there is an error in permission granted 
* @param e - error event 
* @return none
*/
function onErrorPermission(e) {
    console.log('onErrorPermission' + e);
} // end onErrorPermission

/*
* @name onsuccessPermission 
* @desc creates the file and adds header row when permission is granted 
* @param none 
* @return none
*/
function onsuccessPermission() {
    console.log("1: ");

    tizen.filesystem.resolve('documents',function(dir) {
        // create new data json and name it
        dataFile = dir.createFile('Experiment_' + PID +  '.json');
        console.log("dataFile: " + dataFile);

    }, function(e) {
        console.log("Error" + e.message);
    }, "rw");
} // end onsuccessPermission

/* Project
This is the driving function of this program. Tells us which part of the interaction area we are in, and updates the ratio within
the interaction area. As each interaction area is a different width, they each have their own ratio.

@x - posX of the mouse/touch
@y - posY of the mouse/touch
*/
function project(x , y ) {
    if(watch.insideInteractive(x, y) ) {

        //save the touchpoint if enought time has passed
        if(Date.now() - lastTouchPointLog > sampleRate && enableTrial && !experimentComplete) {
            savedTouchPoints.push(new TouchPoint(x, y, numTrialsCompleted) );
            lastTouchPointLog = Date.now();
            console.log("touch logged");
        }

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
    } //if inside interactive

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


    var trialTime = Date.now() - trialStartTime;
    console.log(trialTime);
    trialData.push(new TrialInfo(numTrialsCompleted, trialTime, G1.numPoints, G2.numPoints, G3.numPoints) );

    touchEnded = false;
    enableTrial = false;
    numTrialsCompleted ++;

    G1.poiSelected = false;
    G2.poiSelected = false;
    G3.poiSelected = false;

    displayG1 = false;
    displayG2 = false;
    displayG3 = false;

    if(G1.stopCondReached && G2.stopCondReached && G3.stopCondReached) {
        experimentComplete = true;
    } else 
        choosePOI();
}


//choose a point of interest
function choosePOI() {
    var max = 3;
    var min = 0;
    var selectedPoint = false;

    //prevent infinite loop & just end the experiment - should be caught somewhere else, but double check here
    if(G1.stopCondReached && G2.stopCondReached && G3.stopCondReached) {
        experimentComplete = true;
        return;
    }

    while(!selectedPoint) {
        var graphToSelect = Math.floor(Math.random() *(max - min) + min);
        switch(graphToSelect) {
            case 0:
                if(!G1.stopCondReached) {
                    G1.generatePOI();
                    selectedPoint = true;
                }
                break;
            case 1: 
                if(!G2.stopCondReached) {
                    G2.generatePOI();
                    selectedPoint = true;
                }
                break;
            case 2:
                if(!G3.stopCondReached) {
                    G3.generatePOI();
                    selectedPoint = true;
                }
                break;
        } //switch
    }//while
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

//write the results to console
function logResults() {
    console.log("Experiment Complete!!" );
    
    console.log("\nFinal number of points in graphs:");
    console.log("G1: " + G1.numPoints);
    console.log("G2: " + G2.numPoints);
    console.log("G3: " + G3.numPoints);
}

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}


var trialStartTime;
var trialData = [];
var savedTouchPoints = [];
var sampleRate = 1000/20; //how much time should we have between touchPoint captures
var lastTouchPointLog = -1000000000;
var participantID = "P0_" + makeid(5);

var numTrials = 1000000000;
var stopCondMax = 1; //how many times we can increase the stopCond at a number of points before disabling this graph

var X = 0; //for readability
var Y = 1; //for readability
var mouseX = 0;
var mouseY = 0;

var DEBUG = false; //press d to toggle (on browser)

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



//angles for the small and middle ratio start and stop points
//could use math to change these automatically, but curved line with circle intersection is hard
var smallRatioAngle = [247, 374];
var midRatioAngle = [25, 235];

//how much to tolerate finger innaccuracy
var tolerance = 10;


//if true, use a straight line for the interaction area
//false - we will use a quadratic curve
lineInteraction = false; 
experimentComplete = false;



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
var selectColour = "yellow";

var poiColour = "red"; //point of interest colour - point we want users to select

var backgroundColour = "#1e1f26";


//For reference: constructor(startAngle, stopAngle, xCurve, yCurve, r1, r1Start, r1Stop, r2, r2Start, r2Stop) {
var currStyle = 0;
var interactionStyles = [];
interactionStyles.push(new InteractionStyle(40, 220, 20, 280, 135, 250, 367, 155, 236, 383) );
interactionStyles.push(new InteractionStyle(40, 220, 40, 320, 150, 247, 374, 160, 235, 385) );
interactionStyles.push(new InteractionStyle(33, 240, 10, 260, 150, 258, 360, 160, 270, 370) );
interactionStyles.push(new InteractionStyle(30, 240, 10, 260, 155, 258, 360, 162, 270, 370) );
interactionStyles.push(new InteractionStyle(20, 240, -20, 220, 155, 265, 345, 165, 255, 360) );

let watch = new Watch(posX, posY, r, startAngle, stopAngle);

var xPos = 30;
var yPos = 80;
var ySpacing = 60;

var startingNumPoints = 10;

let G1 = new DynamicGraph(xPos, yPos, startingNumPoints, innerArcColour); //pie chart divided 
let G2 = new DynamicGraph(xPos, yPos + ySpacing, startingNumPoints, middleArcColour); //bar graph
let G3 = new DynamicGraph(xPos, yPos + (ySpacing *2) , startingNumPoints, outerArcColour); //line graph



var indicatorPosX = 130;
var indicatorPosY = 30;
var indicator = new Indicator(indicatorPosX, indicatorPosY, 0.5, ""); 

var lastCompleteTime;
var timeToComplete = 3;
var timingIndicator = new TimingIndicator(indicatorPosX + 70, indicatorPosY, timeToComplete, "", null); 

choosePOI();

//draw
//draws to the screen of the watch
function drawTrial() {
    //render the frame
    ctx.fillStyle = backgroundColour;
    ctx.fillRect(0,0, 400, 400); //clear the background

    watch.draw(); //draw the watch (+ interaction area)
    G1.draw(displayG1, innerRatio);
    G2.draw(displayG2, midRatio);
    G3.draw(displayG3, ratio);

    //draw indicator
    indicator.draw();
    var isSelected = G1.poiSelected || G2.poiSelected || G3.poiSelected;
    indicator.update(isSelected);

    timingIndicator.draw();
    timingIndicator.update(true);
}



//DrawInBetweenTrials
//draw this in between trials. Trial timing starts after this screen goes away.
var numTrialsCompleted = 0;
var enableTrial = false; //are we enabling the trial screen - also reenables recording of touchpoints
function drawInBetweenTrials() {
    //Depreciated - numTrials no longer is the stop condition
    // if(numTrialsCompleted >= numTrials)
    //     experimentComplete = true;


    ctx.fillStyle = "white";
    ctx.fillRect(0,0, 400, 400); //clear the background

    ctx.fillStyle = "yellow";
    ctx.fillRect(0,0, 400, yDivider); //clear the background
    
    ctx.fillStyle = "black";
    ctx.font = "24px Arial";

    var xPos = watch.x - 150;
    var text = "Touch to start next trial...";
    ctx.fillText(text, xPos, watch.y);

    ctx.font = "18px Arial";

    text = "Number of trials completed: " + numTrialsCompleted;
    ctx.fillText(text, xPos, watch.y + 30);

    if(trialData.length > 0) {
        var text = "Last Trial Took: " + trialData[trialData.length-1].trialTime +"ms";
        ctx.fillText(text, xPos, watch.y + 60);
    }

    
    ctx.font = "12px Arial";
    text = "PID: " + participantID;
    ctx.fillText(text, xPos, watch.y + 90);


    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.arc(watch.x, watch.y, watch.r, 0, 2*Math.PI);
    ctx.stroke();
    ctx.closePath();    
    
    //draw a button to force quit this experiment
    endExperiementButton.draw();
    endExperimentIndicator.draw();
    endExperimentIndicator.update(endExperiementButton.clicked);

}



function restartExperiment() {
    console.log("Restarting experiment.... ");
    numTrialsCompleted = 0;
    enableTrial = false;
    restartIndicator.resetTimer();
    drawSettingsMenu = false;
    endExperiementIndicator.resetTimer();
    experimentComplete = false;

    participantIDNum = parseInt(participantID.charAt(1) ) + 1;
    console.log(participantIDNum);
    participantID = "P" + participantIDNum + "_" + makeid(5);

    //just reinstantiate the graphs
    G1 = new DynamicGraph(xPos, yPos, startingNumPoints, innerArcColour); //pie chart divided 
    G2 = new DynamicGraph(xPos, yPos + ySpacing, startingNumPoints, middleArcColour); //bar graph
    G3 = new DynamicGraph(xPos, yPos + (ySpacing *2) , startingNumPoints, outerArcColour); //line graph

    //reset the data arrays
    trialData = [];
    savedTouchPoints = [];
    saved = false;
}



var resultsPrinted = false;
function drawExperimentComplete() {
    if(drawSettingsMenu) {
        drawSettingsPage();
    } else {
        ctx.fillStyle = "white";
        ctx.fillRect(0,0, 400, 400); //clear the background
        saveButton.draw();
        enableSettingsButton.draw();

        
        var xPos = watch.x - 150;

        ctx.fillStyle = "black";
        ctx.font = "24px Arial";

        var text = "Experiment Complete!";
        ctx.fillText(text, xPos, watch.y);

        //calculate the average trial time
        var totalTime = 0;
        var i;
        for( i = 0; i < trialData.length; i ++ ) { //add them
            totalTime += trialData[i].trialTime;
        }
        var avgTrialTime = totalTime/numTrials;

    
        ctx.font = "18px Arial";
        var text = "Avg Trial Time: " + avgTrialTime.toFixed(2) + "ms";
        ctx.fillText(text, xPos, watch.y + 30);

        ctx.font = "12px Arial";
        text = "PID: " + participantID;
        ctx.fillText(text, xPos, watch.y + 90);
        
        if(!resultsPrinted) {
            logResults();
            resultsPrinted = true;
        }

        if(saved) {
            ctx.font = "18px Arial";
            var text = "Saved Results!";
            ctx.fillText(text, xPos, watch.y + 60);
        }
    }

    //draw a circle around the watch (totally unneeded, just easier to position things during programming)
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.arc(watch.x, watch.y, watch.r, 0, 2*Math.PI);
    ctx.stroke();
    ctx.closePath();  
}//drawExperimentComplete


function enableSettingsMenu() {
    drawSettingsMenu = true;
}

function disableSettingsMenu() {
    drawSettingsMenu = false;
}



function increaseStopCond() {
    stopCondMax++;
    console.log(stopCondMax);
    increaseStopCondIndicator.resetTimer();
}
function decreaseStopCond() { 
    if(stopCondMax > 1) {
        stopCondMax--;
    }
    decreaseStopCondIndicator.resetTimer();
    console.log(stopCondMax);
}

function endExperiment() {
    experimentComplete = true;
}

//some variables for page drawing
var drawSettingsMenu = false;
var enableSettingsButton = new Button(190, 100, "Settings", enableSettingsMenu);
var disableSettingsButton = new Button(190, 270, "Back", disableSettingsMenu);
var saveButton = new Button(60, 100, "Save", save);

var restartButtonPosX = 190;
var restartButtonPosY = 100;
var restartButton = new Button(restartButtonPosX, restartButtonPosY, "Restart", null);
var restartIndicator = new TimingIndicator(restartButtonPosX + 60, restartButtonPosY-20, 3, "R", restartExperiment);
var timeToRestart = 3;

var numTrialsButtonPosX = 30;
var numTrialsButtonPosY = 200;
var changeNumTrialsTime = 0.2;

//a button to increase the stop condition
var increaseStopCondButton = new Button(numTrialsButtonPosX, numTrialsButtonPosY, "", null);
var increaseStopCondIndicator = new TimingIndicator(numTrialsButtonPosX+ increaseStopCondButton.width/2, numTrialsButtonPosY+ increaseStopCondButton.height/2, changeNumTrialsTime, "+", increaseStopCond);

var numTrialsButtonSpacing = 210;
//a button to decrease the stop condition
var decreaseStopCondButton = new Button(numTrialsButtonPosX + numTrialsButtonSpacing, numTrialsButtonPosY, "", null);
var decreaseStopCondIndicator = new TimingIndicator(numTrialsButtonPosX +numTrialsButtonSpacing+ increaseStopCondButton.width/2, numTrialsButtonPosY +increaseStopCondButton.height/2, changeNumTrialsTime, "-", decreaseStopCond);


var endExperiementButton = new Button(100, 80, "Quit", null);
var endExperimentIndicator = new TimingIndicator(100 + 60, 80-20, 3, "", endExperiment);



//draw the page some some settings and a reset experiment button
function drawSettingsPage() {
    ctx.fillStyle = "white";
    ctx.fillRect(0,0, 400, 400); //clear the background
    restartButton.draw();
    restartIndicator.update(restartButton.clicked);
    restartIndicator.draw();

    disableSettingsButton.draw();

    increaseStopCondButton.draw();
    increaseStopCondIndicator.draw();
    increaseStopCondIndicator.update(increaseStopCondButton.clicked);
    decreaseStopCondButton.draw();
    decreaseStopCondIndicator.draw();
    decreaseStopCondIndicator.update(decreaseStopCondButton.clicked);

    ctx.font = "18px Arial";
    var text = "# revisit for stop condition: " + stopCondMax;
    ctx.fillText(text, numTrialsButtonPosX +decreaseStopCondButton.width + 5, numTrialsButtonPosY);
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
        updateTime();

        //draw here
        if(experimentComplete) { //done all our trials
            drawExperimentComplete();
        } else if(enableTrial) {
            drawTrial();
        } else
            drawInBetweenTrials();

        if(DEBUG)
            drawDebug();

    }, 1000 / framesPerSecond);
}
setupFile();
requestAnimationFrame(update);
//draw();