// TODO fix "expected color but..." error in web dev console
//  make hand drag not work in YT mode??? think about how to alter hands

// Notes
//{{{
/*
NOTE: Since the bottle-necks for this code are in the drawing routines, it's pretty unoptimized.  There are a lot of redundant calculations, and routines that are done by brute-force.
 PUT THIS IN README OR IN CODE AFTER FACT
*/

// put xy yt views side by side????


// test out scrollable text on left with static canvas on right
// test out using buttons in text to load data in vis
// play with resizing browser

//MAYBE
// in top canvas, have tabs along top for different settings:
//  an animation tab with anim button, time bar, and animTime adjust field
//  a frequency/hand tab that lets you add/kill hands, adjust W, and change col and stuff
//  a settings tab that lets you enable/disable vis elements, set camAngVel, etc

// time bar and anim button
// way to adjust animTime
// way to adjust camAngVel
// options for traceline hands etc visibility
// options for hand visibility ...and add/removing hands?
// have samples flash as time approaches them

// Make it so when user touches time bar, it'll stop animation and leave v.time where it is

// Make it so when user touches screen, time resets to 0 so they can drag starting points

//}}}

// Enums????
//{{{
// Mouse state "enum" TODO equivalent of enum in javascript??
var MS_NONE = 0;
var MS_DRAGHAND = 1;
var MS_DRAGTIME = 2;
var DM_XY = 0;
var DM_XT = 1;
var DM_YT = 2;
//}}}

var metadata = new Object(); // contains meta data about canvas size, which buttons unlocked, etc

init(metadata)
BUTTON0(metadata);

// TEMP PUT THESE FUNCTIONS IN OTHER SECTIONS!!
//{{{

// make list of round buttons, and add functionality for rect buttons and time slider
// have some sort of thingy to show data, like "W = -1"

metadata.testcol = "#ffff00"
metadata.buttonList = new Array()
metadata.buttonList[0] = newButton(0.4,0.1,0.02,metadata.testcol,function(){
			metadata.buttonList[0].col = uiPrompt("Enter new color","#000000");
		});
metadata.buttonList[1] = newButton(0.6,0.1,0.02,"#0000ff",function(){
			var m = metadata;
			if(m.drawMode==DM_XY) m.drawMode = DM_YT;
			else m.drawMode = DM_XY;
			refreshMidCanvas(m);
		});
metadata.buttonListSize = 2; // TODO is there a length(array) thingy?? or "for each in list"?
// maybe just make an "add button" function that takes button list as an argument?


function newButton(x,y,rad,col,func)
{
	nb = new Object(); // new button!
	nb.x = x;
	nb.y = y;
	nb.rad = rad;
	nb.col = col;
	nb.func = func;

	return nb;
}

function refreshTopCanvas(m)
{
	var ctx = m.topCanvas.getContext("2d");
	var size = m.size;

	var list = m.buttonList;

	for(var i=0;i<m.buttonListSize;i++)
	{
		var tx = list[i].x*size;
		var ty = list[i].y*size;
		var trad = list[i].rad*size;
		ctx.fillStyle = list[i].col;
		ctx.beginPath();
		ctx.arc(tx,ty,trad,0,2*Math.PI);
		ctx.fill();
	}
}

function uiPrompt(promptText, defaultText)
{
	return prompt(promptText, defaultText); // TODO make so not using built in prompt behavior (in case blocked? assuming this is "bad form")
}

function processCLICK(m,mousex,mousey) //TODO rename
{
	var list = m.buttonList;

	for(var i=0;i<m.buttonListSize;i++)
	{
		var size = m.size;
		var tx = list[i].x*size;
		var ty = list[i].y*size;
		var trad = list[i].rad*size;

		var dx = mousex-tx;
		var dy = mousey-ty;
		if(dx*dx+dy*dy<=trad*trad)
		{
			list[i].func();
		}
	}

}
//}}}


// BUTTONTEMP
//{{{
function BUTTON0()
{
	metadata.visdata = newVisdata();
	v = metadata.visdata;

	v.samplecount = 8;
	v.mffreqs = new Array(v.samplecount); // mystery function frequencies
	v.usfreqs = new Array(v.samplecount); // user frequencies

	var i = 0;
	for(i=0;i<v.samplecount;i++)
	{
		v.mffreqs[i] = new Object();
		v.mffreqs[i].x = 0;
		v.mffreqs[i].y = 0;

		v.usfreqs[i] = new Object();
		v.usfreqs[i].x = 0;
		v.usfreqs[i].y = 0;
		v.usfreqs[i].freq = i;
		v.usfreqs[i].vis = false;
	}

	v.usfreqs[1].vis = true;
	v.usfreqs[0].vis = true;
	v.usfreqs[7].vis = true;
	v.usfreqs[7].freq = -1; // -4 and same vec give clover
	v.usfreqs[1].x = 3;
	v.usfreqs[1].y = 0;
	v.usfreqs[0].x = 0;
	v.usfreqs[0].y = 1;
	v.usfreqs[7].x = 1;
	v.usfreqs[7].y = 0;

	v.mffreqs[1].x = 3;
	v.mffreqs[1].y = 0;
	v.mffreqs[0].x = 0;
	v.mffreqs[0].y = 1;
	v.mffreqs[7].x = 1;
	v.mffreqs[7].y = 0;

	v.camAngVel = -1.0*2.0*Math.PI;

	refreshMidCanvas(metadata);

}
//}}}



// init
//{{{
function init(m)
{
	m.size = 600;
	m.timeBorder = .05; // percentage of screen shaved off when doing time renders
	createCanvases(m);
	m.pixelsPerUnit = m.size/10; // make not rely on m.size, in case m.size chagned? should that be possible??? TODO
	m.sampleRadius = 6;
	m.handWidth = 10;
	m.gridWidth = 1;
	m.gridBarCount = Math.floor(Math.sqrt(2)*m.size/m.pixelsPerUnit/2)*2;
	m.visdata = newVisdata();
	m.traceRes = 128; // number of points which make up traceline
	m.animTime = 10; // time in seconds it takes for vtime to go from 0 to 1
	m.drawMode = DM_XY;
	//m.drawMode = DM_YT;

	// Colors TODO put all attributes here, and kill "colors" object
	m.colors = new Object();
	c = m.colors;
	c.sampleStart = [0,255,0];
	c.sampleEnd = [0,50,255];
	c.sampleRelStart = [255,0,70];
	c.sampleRelEnd = [127,64,255];
	c.grid = "#c0c0c0";
	c.gridRel = "#ffd0d0";
	c.trace = "#a0c0a0";
	c.traceRel = "#f0b0f0";
}
//}}}

// newVisdata
//{{{
function newVisdata()
{
	var v = new Object();

	v.mouseState = MS_NONE;   // If mouse is draggin something, etc
	v.mouseData = 0;          // Data related to mouse state
	v.mousex = 0;
	v.mousey = 0;
	v.camAngVel = 0.0; // Camera's angular velocity
	v.time = 0.0;

	return v;
}
//}}}

// createCanvases
//{{{
function createCanvases(m)
{
	document.getElementById("DIV").innerHTML = 
	"<button onclick=\"startAnim()\">Animate</button></br>"+
	"<button onclick=\"changeView()\">Change View</button></br>"+
	//"<canvas id=\"TopCanvas\" width=\""+m.size+"\" height=\""+m.size/4+"\" style=\"border:1px solid #c3c3c3;\">Your browser does not support the canvas element.</canvas></br>"+
	"<canvas id=\"MidCanvas\" width=\""+m.size+"\" height=\""+m.size+"\" style=\"border:1px solid #c3c3c3;\">Your browser does not support the canvas element.</canvas>";
	//m.topCanvas = document.getElementById("TopCanvas");
	m.midCanvas = document.getElementById("MidCanvas");

	m.pixelOffsetx = m.size/2;
	m.pixelOffsety = m.size/2;

	m.midCanvas.addEventListener('mousemove',MCmouseMove,false);
	m.midCanvas.addEventListener('mousedown',MCmouseDown,false);
	m.midCanvas.addEventListener('mouseup',MCmouseUp,false);
	m.midCanvas.addEventListener('mouseout',MCmouseUp,false);
	//m.topCanvas.addEventListener('mousemove',TCmouseMove,false);
	//m.topCanvas.addEventListener('mousedown',TCmouseDown,false);
	//m.topCanvas.addEventListener('mouseup',TCmouseUp,false);
	//m.topCanvas.addEventListener('mouseout',TCmouseUp,false);
}
//}}}

// UI functions
//{{{


 // For Mid Canvas:

 // mouseMove
//{{{
function MCmouseMove(e)
{
	var m = metadata; // TODO figure out how to get passed as argument, and mod for all ui funcs
	var v = m.visdata;

	switch(v.mouseState)
	{

		case MS_NONE:
		break;

		case MS_DRAGHAND:
		{
			var r = m.midCanvas.getBoundingClientRect();
			var ox = m.pixelOffsetx;
			var oy = m.pixelOffsety;
			var mx = e.clientX - r.left - ox; // distance from center, in pixels
			var my = -e.clientY + r.top + oy;
			var u = m.pixelsPerUnit;

			var t = v.time;
			var ca = v.camAngVel*t;
			var vcos = Math.cos(ca);
			var vsin = Math.sin(ca);
			// Mouse coordinate change relative to vis x/y plane
			var dx = mx - v.mousex;
			var dy = my - v.mousey;
			var rdx = vcos*dx - vsin*dy;
			var rdy = vsin*dx + vcos*dy;

			v.usfreqs[v.mouseData].x+= rdx/u;
			v.usfreqs[v.mouseData].y+= rdy/u;
			v.mousex = mx;
			v.mousey = my;

			refreshMidCanvas(m);
		}
		break;


	}

}
//}}}

 // mouseDown
//{{{
function MCmouseDown(e)
{
	var m = metadata;
	var v = m.visdata;

	var r = m.midCanvas.getBoundingClientRect();
	var ox = m.pixelOffsetx;
	var oy = m.pixelOffsety;
	var mx = e.clientX - r.left - ox; // distance from center, in pixels
	var my = -e.clientY + r.top + oy;
	var u = m.pixelsPerUnit;

	// Collision check with samples
	var t = v.time;
	var ca = v.camAngVel*t;
	var vcos = Math.cos(ca);
	var vsin = Math.sin(ca);

	// Mouse coordinates relative to vis x/y plane
	var rmx = vcos*mx - vsin*my;
	var rmy = vsin*mx + vcos*my;

	for(var i=0;i<v.samplecount;i++)
	{
		if(v.usfreqs[i].vis)
		{
			var dx = rmx - v.usfreqs[i].x*u;
			var dy = rmy - v.usfreqs[i].y*u;
			if(dx*dx+dy*dy<m.handWidth*m.handWidth/4)
			{
				v.mouseState = MS_DRAGHAND;
				v.mouseData = i;
				v.mousex = mx;
				v.mousey = my;
				return;
			}
		}
	}
}
//}}}

 // mouseUp
//{{{
function MCmouseUp(e)
{
	var m = metadata;
	var v = m.visdata;
	v.mouseState = MS_NONE;
}
//}}}


 // For Top Canvas:

 // mouseMove
//{{{
function TCmouseMove(e)
{
	var m = metadata;
	var v = m.visdata;

	if(v.mouseState==MS_DRAGTIME)
	{
		var r = m.topCanvas.getBoundingClientRect();
		var mx = e.clientX - r.left;
		var dx = mx - v.mousex;
		v.time+= 2*dx/m.size;
		if(v.time>1) v.time = 1;
		if(v.time<0) v.time = 0;
		v.mousex = mx;

		refreshMidCanvas(m);
	}
}
//}}}

 // mouseDown
//{{{
function TCmouseDown(e)
{
	var m = metadata;
	var v = m.visdata;

	v.mouseState = MS_DRAGTIME;
	var r = m.topCanvas.getBoundingClientRect();
	v.mousex = e.clientX - r.left;
	v.mousey = e.clientY - r.top;

	processCLICK(m,v.mousex,v.mousey);

	refreshTopCanvas(m);
}
//}}}

 // mouseUp
//{{{
function TCmouseUp(e)
{
	var m = metadata;
	var v = m.visdata;
	v.mouseState = MS_NONE;
}
//}}}


 // change view
//{{{
function changeView()
{
	var m = metadata;
	if(m.drawMode==DM_XY) m.drawMode = DM_YT;
	else m.drawMode = DM_XY;
	refreshMidCanvas(m);
}
//}}}


//}}}

// Animation functions
//{{{

function startAnim()
{
	m = metadata;
	v = m.visdata;
	v.time = 0;
	v.animData = new Object(); // data for current animation
	ad = v.animData;
	ad.period = 50;       // milliseconds between animations
	ad.lag = 0;           // how late the last animframe was
	ad.buffer = 500;      // max lag
	ad.ltime = Date.now() - ad.period; // time of last update
	animFrame();
}

function animFrame()
{
	m = metadata;
	v = m.visdata;
	ad = v.animData;
	v.time+= ad.period/(1000*m.animTime);

	var dt = Date.now() - ad.ltime;
	ad.lag+= dt - ad.period;
	ad.ltime+= dt;
	if(ad.lag>ad.buffer) ad.lag = ad.buffer;

	if(v.time<1.0)
	{
		setTimeout(function(){requestAnimationFrame(animFrame)},ad.period - ad.lag);
	}
	else v.time = 1;

	refreshMidCanvas(metadata);

}

//}}}


// refreshMidCanvas
//{{{
function refreshMidCanvas(m)
{
	var ctx = m.midCanvas.getContext("2d");
	var v = m.visdata;
	//var lt = performance.now();

	// Clear canvas
	ctx.clearRect(0,0,m.midCanvas.width,m.midCanvas.height);

	// TODO put in options
	drawGrid(m);
	drawGridRel(m);
	drawTraceline(m);
	drawTracelineRel(m);
	drawHands(m);
	drawHandSum(m);
	drawSamples(m);
	drawSamplesRel(m);
	drawSum(m);

	//console.log(performance.now()-lt);
}
//}}}

// draw functions
//{{{


 // drawSamples
//{{{
function drawSamples(m)
{
	var ctx = m.midCanvas.getContext("2d");

	var u = m.pixelsPerUnit;
	var ox = m.pixelOffsetx;
	var oy = m.pixelOffsety;
	var rad = m.sampleRadius;

	var v = m.visdata;
	var sc = v.samplecount;
	var cols = m.colors.sampleStart;
	var cole = m.colors.sampleEnd;

	// Cos & Sin of angle to rotate all coords by (negative of cam angle)
	var vcos = Math.cos(v.time*v.camAngVel);
	var vsin = -Math.sin(v.time*v.camAngVel);

	var s = fft(v.mffreqs,sc,0);

	if(m.drawMode == DM_XY)
	{

		for(var i=0;i<sc;i++)
		{

			// Gradient from green to blue
			var end = 1.0*i/sc;
			var start = 1.0-end;
			ctx.fillStyle = "rgb("+
								Math.floor(cols[0]*start+cole[0]*end)+","+
								Math.floor(cols[1]*start+cole[1]*end)+","+
								Math.floor(cols[2]*start+cole[2]*end)+")";

			var tx = vcos*s[i].x - vsin*s[i].y;
			var ty = vsin*s[i].x + vcos*s[i].y;

			// Draw sample
			ctx.beginPath();
			ctx.arc(u*tx+ox,-u*ty+oy,rad,0,2*Math.PI);
			ctx.lineWidth = 2;
			ctx.strokeStyle = "#000000";
			ctx.stroke();
			ctx.fill();

		}

	}
	else // TODO YT XT yet again
	{
		var border = m.size*m.timeBorder;
		var timelen = m.size - 2*border;

		for(var i=0;i<sc;i++)
		{

			// Gradient from green to blue
			var start = (vcos*s[i].x - vsin*s[i].y)*(1.0*m.pixelsPerUnit/m.size)+0.5;
			if(start>1.0) start = 1.0;
			if(start<0.0) start = 0.0;
			var end = 1.0-start;
			ctx.fillStyle = "rgb("+
								Math.floor(cols[0]*start+cole[0]*end)+","+
								Math.floor(cols[1]*start+cole[1]*end)+","+
								Math.floor(cols[2]*start+cole[2]*end)+")";

			//var tx = vcos*s[i].x - vsin*s[i].y;
			var tx = border+1.0*i/sc*timelen;
			var ty = vsin*s[i].x + vcos*s[i].y;

			// Draw sample
			ctx.beginPath();
			ctx.arc(tx,-u*ty+oy,rad,0,2*Math.PI);
			ctx.lineWidth = 2;
			ctx.strokeStyle = "#000000";
			ctx.stroke();
			ctx.fill();

		}
	}


}
//}}}

 // drawSamplesRel
//{{{
function drawSamplesRel(m)
{
	var ctx = m.midCanvas.getContext("2d");

	var u = m.pixelsPerUnit;
	var ox = m.pixelOffsetx;
	var oy = m.pixelOffsety;
	var rad = m.sampleRadius;
	var cols = m.colors.sampleRelStart;
	var cole = m.colors.sampleRelEnd;

	var v = m.visdata;
	var sc = v.samplecount;

	var s = fft(v.mffreqs,sc,-v.camAngVel);

	if(m.drawMode==DM_XY)
	{
		for(var i=0;i<sc;i++)
		{

			// Gradient from red to purple
			var end = 1.0*i/sc;
			var start = 1.0-end;
			ctx.fillStyle = "rgb("+
								Math.floor(cols[0]*start+cole[0]*end)+","+
								Math.floor(cols[1]*start+cole[1]*end)+","+
								Math.floor(cols[2]*start+cole[2]*end)+")";

			var tx = s[i].x
			var ty = s[i].y

			// Draw sample
			ctx.beginPath();
			ctx.arc(u*tx+ox,-u*ty+oy,rad*0.7,0,2*Math.PI);
			ctx.lineWidth = 2;
			ctx.strokeStyle = "#000000";
			ctx.stroke();
			ctx.fill();

		}
	}
	else // TODO another XT YT
	{
		var border = m.size*m.timeBorder;
		var timelen = m.size - 2*border;

		for(var i=0;i<sc;i++)
		{

			// Gradient from red to purple
			var start = (s[i].x)*(1.0*m.pixelsPerUnit/m.size)+0.5;
			if(start>1.0) start = 1.0;
			if(start<0.0) start = 0.0;
			var end = 1.0-start;
			ctx.fillStyle = "rgb("+
								Math.floor(cols[0]*start+cole[0]*end)+","+
								Math.floor(cols[1]*start+cole[1]*end)+","+
								Math.floor(cols[2]*start+cole[2]*end)+")";

			var tx = border + 1.0*i/sc*timelen;
			var ty = s[i].y

			// Draw sample
			ctx.beginPath();
			ctx.arc(tx,-u*ty+oy,rad*0.7,0,2*Math.PI);
			ctx.lineWidth = 2;
			ctx.strokeStyle = "#000000";
			ctx.stroke();
			ctx.fill();

		}
	}


}
//}}}

 // drawTraceline
//{{{
function drawTraceline(m)
{
	var ctx = m.midCanvas.getContext("2d");

	var u = m.pixelsPerUnit;
	var ox = m.pixelOffsetx;
	var oy = m.pixelOffsety;
	var rad = m.sampleRadius;
	var res = m.traceRes;
	var col = m.colors.trace;

	var v = m.visdata;
	var f = v.usfreqs;
	var sc = v.samplecount;

	var s = fft2(v.usfreqs,sc,res,0);

	if(m.drawMode==DM_XY)
	{

		// Draw line
		var vcos = Math.cos(-v.time*v.camAngVel);
		var vsin = Math.sin(-v.time*v.camAngVel);
		var sx = vcos*s[0].x - vsin*s[0].y;
		var sy = vsin*s[0].x + vcos*s[0].y;
		ctx.beginPath();
		ctx.moveTo(u*sx+ox,-u*sy+oy);
		for(var i=1;i<res;i++)
		{
			var ex = vcos*s[i].x - vsin*s[i].y;
			var ey = vsin*s[i].x + vcos*s[i].y;
			ctx.lineTo(u*ex+ox,-u*ey+oy);

		}
		ctx.lineTo(u*sx+ox,-u*sy+oy);
		ctx.lineWidth = 3;
		ctx.strokeStyle = col;
		ctx.stroke();

		// Draw circles at sample points
		s = fft2(v.usfreqs,sc,sc,0);
		vcos = Math.cos(v.time*v.camAngVel);
		vsin = -Math.sin(v.time*v.camAngVel);
		for(var i=0;i<sc;i++)
		{

			// Gradient from green to red
			var col = Math.floor(i/sc*255);

			var tx = vcos*s[i].x - vsin*s[i].y;
			var ty = vsin*s[i].x + vcos*s[i].y;

			// Draw sample
			ctx.beginPath();
			ctx.arc(u*tx+ox,-u*ty+oy,rad*1.2,0,2*Math.PI);
			ctx.lineWidth = 2;
			ctx.strokeStyle = col;
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(u*tx+ox,-u*ty+oy,rad/2,0,2*Math.PI); // SOMETHING IS FUCKED HERE TODO its purple
			ctx.lineWidth = 2;
			ctx.fillStyle = col;
			ctx.fill();

		}
	}
	else // TODO check XT or YT.. or does it matter? just YT?
	{

		// Draw line
		var border = m.size*m.timeBorder;
		var timelen = m.size - border*2;
		var vcos = Math.cos(-v.time*v.camAngVel);// TODO don't have cam "rotate" in this view???
		var vsin = Math.sin(-v.time*v.camAngVel);
		var sx = border;
		var sy = vsin*s[0].x + vcos*s[0].y;
		ctx.beginPath();
		ctx.moveTo(sx,-u*sy+oy);
		for(var i=1;i<res;i++)
		{
			var ex = border+1.0*i/res*timelen
			var ey = vsin*s[i].x + vcos*s[i].y;
			ctx.lineTo(ex,-u*ey+oy);

		}
		ctx.lineTo(border+timelen,-u*sy+oy);
		ctx.lineWidth = 3;
		ctx.strokeStyle = col;
		ctx.stroke();

		// Draw circles at sample points
		s = fft2(v.usfreqs,sc,sc,0);
		vcos = Math.cos(v.time*v.camAngVel);
		vsin = -Math.sin(v.time*v.camAngVel);
		for(var i=0;i<sc;i++)
		{

			// Gradient from green to red
			var col = Math.floor(i/sc*255);

			var tx = border+1.0*i/sc*timelen
			var ty = vsin*s[i].x + vcos*s[i].y;

			// Draw sample
			ctx.beginPath();
			ctx.arc(tx,-u*ty+oy,rad*1.2,0,2*Math.PI);
			ctx.lineWidth = 2;
			ctx.strokeStyle = col;
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(tx,-u*ty+oy,rad/2,0,2*Math.PI);
			ctx.lineWidth = 2;
			ctx.fillStyle = col;
			ctx.fill();

		}
	}

}
//}}}

 // drawTracelineRel
//{{{
function drawTracelineRel(m)
{
	var ctx = m.midCanvas.getContext("2d");

	var u = m.pixelsPerUnit;
	var ox = m.pixelOffsetx;
	var oy = m.pixelOffsety;
	var rad = m.sampleRadius;
	var res = m.traceRes;
	var col = m.colors.traceRel;

	var v = m.visdata;
	var f = v.usfreqs;
	var sc = v.samplecount;

	var s = fft2(v.usfreqs,sc,res,-v.camAngVel);

	if(m.drawMode == DM_XY)
	{
		// Draw line
		ctx.beginPath();
		ctx.moveTo(u*s[0].x+ox,-u*s[0].y+oy);
		for(var i=1;i<res;i++)
		{
			var ex = s[i].x;
			var ey = s[i].y;
			ctx.lineTo(u*ex+ox,-u*ey+oy);

		}
		ctx.lineTo(u*s[0].x+ox,-u*s[0].y+oy);
		ctx.lineWidth = 2;
		ctx.strokeStyle = col;
		ctx.stroke();

		// Draw Circles at samplepoints
		s = fft2(v.usfreqs,sc,sc,-v.camAngVel); // redundant, could pull from above fft, but I'm lazy
		var vcos = 1.0;
		var vsin = 0.0;
		for(var i=0;i<sc;i++)
		{

			// Gradient from green to red
			var col = Math.floor(i/sc*255);

			var tx = vcos*s[i].x - vsin*s[i].y;
			var ty = vsin*s[i].x + vcos*s[i].y;

			// Draw sample
			ctx.beginPath();
			ctx.arc(u*tx+ox,-u*ty+oy,rad,0,2*Math.PI);
			ctx.lineWidth = 2;
			ctx.strokeStyle = col;
			ctx.stroke();

		}
	}
	else // TODO YT check??? or scratch...
	{

		// Draw line
		var border = m.size*m.timeBorder;
		var timelen = m.size - border*2;
		ctx.beginPath();
		var sy = s[0].y;
		ctx.moveTo(border,-u*s[0].y+oy);
		for(var i=1;i<res;i++)
		{
			var ey = s[i].y;
			ctx.lineTo(border+1.0*i/res*timelen,-u*ey+oy);

		}
		ctx.lineTo(border+timelen,-u*sy+oy);
		ctx.lineWidth = 2;
		ctx.strokeStyle = col;
		ctx.stroke();

		// Draw Circles at samplepoints
		s = fft2(v.usfreqs,sc,sc,-v.camAngVel); // redundant, could pull from above fft, but I'm lazy
		var vcos = 1.0;
		var vsin = 0.0;
		for(var i=0;i<sc;i++)
		{

			// Gradient from green to red
			var col = Math.floor(i/sc*255);

			var tx = border + 1.0*i/sc*timelen
			var ty = vsin*s[i].x + vcos*s[i].y;

			// Draw sample
			ctx.beginPath();
			ctx.arc(tx,-u*ty+oy,rad,0,2*Math.PI);
			ctx.lineWidth = 2;
			ctx.strokeStyle = col;
			ctx.stroke();

		}
	}

}
//}}}

 // drawHands
//{{{
function drawHands(m)
{
	if(m.drawMode!=DM_XY) return; // TODO ...nothing for x/t views?
	var ctx = m.midCanvas.getContext("2d");

	var u = m.pixelsPerUnit;
	var ox = m.pixelOffsetx;
	var oy = m.pixelOffsety;
	var w = m.handWidth;

	var v = m.visdata;
	var f = v.usfreqs;
	var sc = v.samplecount;

	var t = v.time;
	var ca = v.camAngVel*t;

	// Draw stems
	for(var i=0;i<sc;i++)
	{
		if(f[i].vis)
		{
			var fr = f[i].freq;
			var ang = fr*t*2.0*Math.PI-ca;
			var vcos = Math.cos(ang);
			var vsin = Math.sin(ang);

			var tx = vcos*f[i].x - vsin*f[i].y;
			var ty = vsin*f[i].x + vcos*f[i].y;

			ctx.beginPath();
			ctx.moveTo(ox,oy);
			ctx.lineTo(u*tx+ox,-u*ty+oy);
			ctx.lineWidth = w;
			ctx.strokeStyle = "rgb(200,0,0)";
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(ox,oy);
			ctx.lineTo(u*tx+ox,-u*ty+oy);
			ctx.lineWidth = w/2;
			ctx.strokeStyle = "rgb(200,90,70)";
			ctx.stroke();
		}
	}

	// Cap to pretty up center
	ctx.beginPath();
	ctx.arc(ox,oy,w/2,0,2*Math.PI);
	ctx.fillStyle = "rgb(200,0,0)";
	ctx.fill();

	// Buttons at ends of hands
	for(var i=0;i<sc;i++)
	{
		if(f[i].vis)
		{

			var fr = f[i].freq;
			var ang = fr*t*2.0*Math.PI-ca;
			var vcos = Math.cos(ang);
			var vsin = Math.sin(ang);

			var tx = vcos*f[i].x - vsin*f[i].y;
			var ty = vsin*f[i].x + vcos*f[i].y;

			var tw = 4;
			ctx.beginPath();
			ctx.arc(u*tx+ox,-u*ty+oy,w/2-tw/2,0,2*Math.PI);
			ctx.lineWidth = tw;
			ctx.strokeStyle = "rgb(200,0,0)";
			ctx.stroke();
			ctx.fillStyle = "rgb(200,180,130)";
			ctx.fill();
		}
	}

}
//}}}

 // drawHandSum
//{{{
function drawHandSum(m) // TODO better name
{
	if(m.drawMode!=DM_XY) return; // TODO ...nothing for x/t views?
	var ctx = m.midCanvas.getContext("2d");

	var u = m.pixelsPerUnit;
	var ox = m.pixelOffsetx;
	var oy = m.pixelOffsety;
	var w = m.handWidth;

	var v = m.visdata;
	var f = v.usfreqs;
	var sc = v.samplecount;

	var t = v.time;
	var ca = v.camAngVel*t;

	var sx = 0;
	var sy = 0;

	// Draw stems
	for(var i=0;i<sc;i++)
	{
		if(f[i].vis) //TODO should vis be here??
		{
			var fr = f[i].freq;
			var ang = fr*t*2.0*Math.PI-ca;
			var vcos = Math.cos(ang);
			var vsin = Math.sin(ang);

			var tx = vcos*f[i].x - vsin*f[i].y;
			var ty = vsin*f[i].x + vcos*f[i].y;
			tx+= sx;
			ty+= sy;

			ctx.beginPath();
			ctx.moveTo(u*sx+ox,-u*sy+oy);
			ctx.lineTo(u*tx+ox,-u*ty+oy);
			ctx.lineWidth = 3; // TODO determine from m var at some point
			ctx.strokeStyle = "rgb(0,0,200)"; // me too! TODO
			ctx.stroke();

			sx = tx;
			sy = ty;
		}
	}


}
//}}}

 // drawGrid
//{{{
function drawGrid(m)
{
	//TODO for x/t y/t views draw lines at samples?
	var ctx = m.midCanvas.getContext("2d");
	var v = m.visdata;
	var oy = m.pixelOffsety;

	if(m.drawMode == DM_XY)
	{
		var u = m.pixelsPerUnit;
		var ox = m.pixelOffsetx;
		var gw = m.gridWidth;
		var gcol = m.colors.grid;
		var bc = m.gridBarCount;

		var ge = bc/2; // grid edge distance from origin, in pixels

		// Cos & Sin of angle to rotate all coords by (negative of cam angle)
		var t = v.time;
		var ca = v.camAngVel*t;
		var vcos = Math.cos(ca);
		var vsin = -Math.sin(ca);

		for(var i=0;i<bc+1;i++)
		{
			// Draw vertical bar
			var nx = i-ge;
			var sx = vcos*nx - vsin*ge;
			var sy = vsin*nx + vcos*ge;
			var ex = vcos*nx + vsin*ge;
			var ey = vsin*nx - vcos*ge;
			ctx.beginPath();
			ctx.moveTo(u*sx+ox,-u*sy+oy);
			ctx.lineTo(u*ex+ox,-u*ey+oy);
			ctx.lineWidth = gw;
			ctx.strokeStyle = gcol;
			ctx.stroke();

			// Draw horizontal bar
			var ny = i-ge;
			var sx = vcos*ge - vsin*ny;
			var sy = vsin*ge + vcos*ny;
			var ex = -vcos*ge - vsin*ny;
			var ey = -vsin*ge + vcos*ny;
			ctx.beginPath();
			ctx.moveTo(u*sx+ox,-u*sy+oy);
			ctx.lineTo(u*ex+ox,-u*ey+oy);
			ctx.lineWidth = gw;
			ctx.strokeStyle = gcol;
			ctx.stroke();
			
		}
	}
	else //TODO XT needed if using
	{
		var border = m.size*m.timeBorder;
		var timelen = m.size - 2*border;
		var gcol = m.colors.grid;
		var gw = m.gridWidth;
		var sc = v.samplecount;

		ctx.beginPath();
		for(var i=0;i<sc+1;i++)
		{
			var x = border + 1.0*i/sc*timelen;
			ctx.moveTo(x,0);
			ctx.lineTo(x,m.size);
		}
		ctx.lineWidth = gw;
		ctx.strokeStyle = gcol;
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(0,oy);
		ctx.lineTo(m.size,oy);
		ctx.lineWidth = gw;
		ctx.strokeStyle = gcol;
		ctx.stroke();
	}

}
//}}}

 // drawGridRel
//{{{
function drawGridRel(m)
{
	if(m.drawMode!=DM_XY) return; // TODO ...nothing for x/t views?
	var ctx = m.midCanvas.getContext("2d");

	var u = m.pixelsPerUnit;
	var ox = m.pixelOffsetx;
	var oy = m.pixelOffsety;
	var gw = m.gridWidth;
	var gcol = m.colors.gridRel;
	var bc = m.gridBarCount;

	var ge = bc/2; // grid edge distance from origin, in pixels

	for(var i=0;i<bc+1;i++)
	{
		// Draw vertical bar
		var nx = i-ge;
		ctx.beginPath();
		ctx.moveTo(u*nx+ox,-u*ge+oy);
		ctx.lineTo(u*nx+ox,u*ge+oy);
		ctx.lineWidth = gw;
		ctx.strokeStyle = gcol;
		ctx.stroke();

		// Draw horizontal bar
		var ny = i-ge;
		ctx.beginPath();
		ctx.moveTo(-u*ge+ox,-u*ny+oy);
		ctx.lineTo(u*ge+ox,-u*ny+oy);
		ctx.lineWidth = gw;
		ctx.strokeStyle = gcol;
		ctx.stroke();
		
	}

}
//}}}

 // drawSum
//{{{
function drawSum(m)
{
	var ctx = m.midCanvas.getContext("2d");
	var v = m.visdata;

	if(m.drawMode == DM_XY)
	{
		var u = m.pixelsPerUnit;
		var ox = m.pixelOffsetx;
		var oy = m.pixelOffsety;

		var f = v.usfreqs;
		var sc = v.samplecount;

		var t = v.time;
		var ca = v.camAngVel*t;

		var tx = 0;
		var ty = 0;
		for(var i=0;i<sc;i++)
		{
			var fr = f[i].freq;
			var ang = fr*t*2.0*Math.PI-ca;
			var vcos = Math.cos(ang);
			var vsin = Math.sin(ang);

			tx+= vcos*f[i].x - vsin*f[i].y;
			ty+= vsin*f[i].x + vcos*f[i].y;

		}
		ctx.beginPath();
		arrowTo(ox,oy,u*tx+ox,-u*ty+oy,ctx);
		ctx.strokeStyle = "rgb(200,0,200)";
		ctx.stroke();
	}
	else //TODO moar XT XY silliness
	{
		var t = v.time;
		var border = m.size*m.timeBorder;
		var timelen = m.size - 2*border;

		var x = border + t*timelen;

		ctx.beginPath();
		ctx.moveTo(x,0);
		ctx.lineTo(x,m.size);
		ctx.lineWidth = 3; // TODO shit aaaah
		ctx.strokeStyle = "#ffff00";
		ctx.stroke();

	}
}
//}}}

 // arrowTo
//{{{
function arrowTo(startx,starty,endx,endy,ctx)
{

	// Determine unit vector from start to end
	var ux;
	var uy;
	var forklen = 15; // Length of prongs at end of arrow
	{
		var dx = endx-startx;
		var dy = endy-starty;
		var dt = Math.sqrt(dx*dx+dy*dy)+0.001;
		ux = dx/dt;
		uy = dy/dt;
		if(dt<forklen*2)
		{
			forklen = dt/2;
		}
	}
	var startspace = forklen; // distance between start point and arrow tail

	var cos = -0.866;
	var sin = 0.5;
	var fork1x = endx+cos*ux*forklen+sin*uy*forklen
	var fork1y = endy-sin*ux*forklen+cos*uy*forklen
	var cos = -0.866;
	var sin = -0.5;
	var fork2x = endx+cos*ux*forklen+sin*uy*forklen
	var fork2y = endy-sin*ux*forklen+cos*uy*forklen

	ctx.moveTo(startx+ux*startspace, starty+uy*startspace);
	ctx.lineTo(endx, endy);
	ctx.lineTo(fork1x, fork1y);
	ctx.moveTo(endx, endy);
	ctx.lineTo(fork2x, fork2y);
}
//}}}

//}}}


// fft (currently dft!!!) THESE ARE IDFT STUPID, RELABLE!!!!!!
//{{{
function fft(f,len,offset) // make version that uses freqs.freq values
{
	// offset alters all frequencies: to use in fft, cycle all values so f[i] = (f[i]+offset)%sc

	s = new Array(len);
	for(var i=0;i<len;i++)
	{
		s[i] = new Object();
		s[i].x = 0;
		s[i].y = 0;
	}

	for(var i=0;i<len;i++)
	{
		for(var j=0;j<len;j++)
		{
			var w = j+Math.round(offset/2.0/Math.PI);
			s[i].x+= f[j].x*Math.cos(1.0*w*i/len*2*Math.PI);
			s[i].y+= f[j].x*Math.sin(1.0*w*i/len*2*Math.PI);
			s[i].y+= f[j].y*Math.cos(1.0*w*i/len*2*Math.PI);
			s[i].x-= f[j].y*Math.sin(1.0*w*i/len*2*Math.PI);
		}
	}

	return s;
}
//}}}

// fft2 (currently dft!!!)
//{{{
function fft2(f,flen,res,offset) // make version that uses freqs.freq values RENAME TODO
{
	// offset alters all frequencies: to use in fft, cycle all values so f[i] = (f[i]+offset)%sc

	s = new Array(res);
	for(var i=0;i<res;i++)
	{
		s[i] = new Object();
		s[i].x = 0;
		s[i].y = 0;
	}

	for(var i=0;i<res;i++)
	{
		for(var j=0;j<flen;j++)
		{
			var w = f[j].freq+Math.round(offset/2.0/Math.PI);
			s[i].x+= f[j].x*Math.cos(1.0*w*i/res*2*Math.PI);
			s[i].y+= f[j].x*Math.sin(1.0*w*i/res*2*Math.PI);
			s[i].y+= f[j].y*Math.cos(1.0*w*i/res*2*Math.PI);
			s[i].x-= f[j].y*Math.sin(1.0*w*i/res*2*Math.PI);
		}
	}

	return s;
}
//}}}

// dft
//{{{
function dft(f,flen,slen) // TODO finish and put into traceline
{
	s = new Array(slen);
	for(var i=0;i<slen;i++)
	{
		s[i] = new Object();
		s[i].x = 0;
		s[i].y = 0;
	}

	for(var i=0;i<slen;i++)
	{
		for(var j=0;j<flen;j++)
		{
			var freq = f[f].freq;
			s[i].x+= f[j].x*Math.cos(1.0*freq*i/slen*2*Math.PI);
			s[i].y+= f[j].x*Math.sin(1.0*freq*i/slen*2*Math.PI);
			s[i].y+= f[j].y*Math.cos(1.0*freq*i/slen*2*Math.PI);
			s[i].x-= f[j].y*Math.sin(1.0*freq*i/slen*2*Math.PI);
		}
	}

	return s;
}
//}}}

// firstOne
//{{{
function firstOne(num,pow)
{
	var r = pow;
	// Returns place of first 1 bit in binary of 'num'
	for(i=0;i<pow;i++)
	{
		if((num>>i)&1)
		{
			r = i;
			i = samppow;
		}
	}
	return r;
}
//}}}


