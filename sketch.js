var curves = [];
var dragging = false;
var draggedPoint;

var displayControlPoint = true;
var displayControlPoly = true;
var displayCurves = true;
var selectedCurve = null;

const POINTSTROKE = 16;

class Curve{
  constructor(color, evaluations, points=[]) {
    this.color = color;
    this.evaluations = evaluations;
    this.points = points;
  }
}

class Point{
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  dist(x, y){
    return Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2);
  }

  distSqrd(x, y){
    return (this.x - x) ** 2 + (this.y - y) ** 2;
  }
}

function closestCurvePoint(c, x, y){
  var dist;
  var shortestDist = Infinity;
  var closestPoint = null;
  var closestCurve = null;

  c.forEach(curve => {
    curve.points.forEach(p => {
      dist = p.distSqrd(x, y);

      if(dist < shortestDist){
        shortestDist = dist;
        closestPoint = p;
        closestCurve = curve;
      }
    });
  });

  return {closestCurve, closestPoint, shortestDist};
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  //desabilita a função default do botao direito
  for (let element of document.getElementsByClassName("p5Canvas")) {
    element.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  curves.push(new Curve(color(250,100,50),10));
  selectedCurve = curves[0];
}

function mouseClicked(){
  var {shortestDist} = closestCurvePoint(curves, mouseX, mouseY);

  //adiciona ponto se não estiver clicado em cima de outro ponto
  if(shortestDist > POINTSTROKE ** 2 && !dragging){
    var p = new Point(mouseX, mouseY);
    selectedCurve.points.push(p);
  }
}

function mousePressed(){  
  var {closestCurve, closestPoint, shortestDist} = closestCurvePoint(curves, mouseX, mouseY);

  //arrasta caso tenha apertado em cima de um ponto
  if(mouseButton === LEFT){
    if (shortestDist <= (POINTSTROKE / 2) ** 2) {
      dragging = true;
      draggedPoint = closestPoint;
      offsetX = closestPoint.x - mouseX;
      offsetY = closestPoint.y - mouseY;
    }
  }
  //remove ponto caso tenha apertado em cima de um
  else if(mouseButton === RIGHT){
    if (shortestDist <= (POINTSTROKE / 2) ** 2) {
      let index = closestCurve.points.indexOf(closestPoint);
      closestCurve.points.splice(index, 1);
    }
  }

  else if(mouseButton === CENTER){
    if (shortestDist >= (POINTSTROKE / 2) ** 2) {
      curves.push(new Curve(color(250,0,50),10));
      selectedCurve = curves[curves.length-1];
    }
  }
}
function mouseDragged() {
  if (dragging) {
    draggedPoint.x = mouseX + offsetX;
    draggedPoint.y = mouseY + offsetY;
  }
}

function mouseReleased() {
  dragging = false;
}

function draw(){
  background(220);

  curves.forEach(curve => {
    var interPoints = deCasteljau(curve.points, curve.evaluations);

    curve.color.setAlpha(128);
    drawLines(curve.points, curve.color);

    curve.color.setAlpha(256);
    drawLines(interPoints, curve.color);
    drawPoints(curve.points, curve.color);

  });

function drawPoints(points, color){
  points.forEach(p => {
    color.setAlpha(256);
    stroke(color);
    strokeWeight(POINTSTROKE);

    point(p.x, p.y);
  });
}

function drawLines(points, color){
  var prevPoint = null;

  points.forEach(p => {
    if(displayControlPoly && prevPoint!=null){
      stroke(color);
      strokeWeight(POINTSTROKE * 0.6);

      line(prevPoint.x, prevPoint.y, p.x, p.y);
    }

    prevPoint = p;
  });
}

function interpolate(t, p0, p1) {
  return { x: (1 - t) * p0.x + t * p1.x, y: (1 - t) * p0.y + t * p1.y };
}
  
function deCasteljau(points, nEvaluations) {
  if (points == undefined || points.length <= 1) return [];
  var result = [];
  var controls;

  for (let t = 0; t <= 1; t += 1 / nEvaluations) {
    controls = points;
    while (controls.length > 1) {
      var aux = [];
      for (let i = 0; i < controls.length - 1; i++) {
        aux[i] = interpolate(t, controls[i], controls[i + 1]);
      }
      
      controls = aux;
    }
    result.push(controls[0]);
  }
  return result;
}

}