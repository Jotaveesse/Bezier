var curves = [];
var dragging = false;
var draggedPoint;

var displayControlPoint = true;
var displayControlPoly = true;
var displayCurves = true;
var selectedCurve = null;
var evaluationsSlider;
var evaluationsSpan;
var colorPicker;

const POINTSTROKE = 16;

class Curve{
  constructor(color, evaluations, points=[]) {
    this.color = color;
    this.evaluations = evaluations;
    this.points = points;
  }

  remove(){
    let index = curves.indexOf(this);
    if(index!=-1)
      curves.splice(index, 1);
  }

  removePoint(point){
    let index = this.points.indexOf(point);
    this.points.splice(index, 1);

    if(this.points.length == 0 && selectedCurve != this){
      let index = curves.indexOf(this);
      curves.splice(index, 1);
    }
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

  var addButton = document.getElementById("add-button")
  addButton.addEventListener("click", function(){
    newCurve();
  });

  var removeButton = document.getElementById("remove-button")
  removeButton.addEventListener("click", function(){
    selectedCurve.remove();
  });

  var clearButton = document.getElementById("clear-button")
  clearButton.addEventListener("click", function(){
    curves = [];
  });

  var pointCheckbox = document.getElementById("point-checkbox")
  pointCheckbox.addEventListener("change", function(){
    displayControlPoint = pointCheckbox.checked;
  });

  var polyCheckbox = document.getElementById("poly-checkbox")
  polyCheckbox.addEventListener("change", function(){
    displayControlPoly = polyCheckbox.checked;
  });

   curveCheckbox = document.getElementById("curve-checkbox")
  curveCheckbox.addEventListener("change", function(){
    displayCurves = curveCheckbox.checked;
  });

  evaluationsSpan = document.getElementById("evaluations-span")

  evaluationsSlider = document.getElementById("evaluations-slider")
  evaluationsSlider.addEventListener("input", function(){
    selectedCurve.evaluations = evaluationsSlider.value;
    updateUI();
  });

  colorPicker = document.getElementById("color-picker")
  colorPicker.addEventListener("input", function(){
    selectedCurve.color = color(colorPicker.value);
  });

  newCurve();
  selectedCurve.color = color(255, 255,255);
  updateUI()
}

function updateUI(){
  evaluationsSlider.value = selectedCurve.evaluations;
  evaluationsSpan.textContent = selectedCurve.evaluations;

  let hexValue = '#' + hex(red(selectedCurve.color), 2) +
    hex(green(selectedCurve.color), 2) +
    hex(blue(selectedCurve.color), 2);
  colorPicker.value = hexValue;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function newCurve(){
  curves.push(new Curve(color(colorPicker.value),10));
  selectedCurve = curves[curves.length-1];
  updateUI();
}

function mouseClicked(event){
  if(event.target.tagName != "CANVAS") return;

  console.log(curves);

  var {shortestDist} = closestCurvePoint(curves, mouseX, mouseY);

  //adiciona ponto se não estiver clicado em cima de outro ponto
  if(shortestDist > POINTSTROKE ** 2 && !dragging){
    var p = new Point(mouseX, mouseY);
    selectedCurve.points.push(p);
    updateUI();
  }
}

function mousePressed(event){
  if(event.target.tagName != "CANVAS") return;

  var {closestCurve, closestPoint, shortestDist} = closestCurvePoint(curves, mouseX, mouseY);

  //arrasta caso tenha apertado em cima de um ponto
  if(mouseButton === LEFT){
    if (shortestDist <= (POINTSTROKE / 2) ** 2) {
      dragging = true;
      draggedPoint = closestPoint;
      offsetX = closestPoint.x - mouseX;
      offsetY = closestPoint.y - mouseY;

      selectedCurve = closestCurve;
      updateUI();
    }
  }
  //remove ponto caso tenha apertado em cima de um
  else if(mouseButton === RIGHT){
    if (shortestDist <= (POINTSTROKE / 2) ** 2) {
      closestCurve.removePoint(closestPoint);
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
  background(50);

  curves.forEach(curve => {
    var interPoints = deCasteljau(curve.points, curve.evaluations);
    
    curve.color.setAlpha(128);
    if(displayControlPoly)
      drawLines(curve.points, curve.color);

    curve.color.setAlpha(255);
    if(displayCurves)
      drawLines(interPoints, curve.color);
    
    if(displayControlPoint){
      drawPoints(curve.points, curve.color);
    }

  });

function drawPoints(points, color){
  points.forEach(p => {
    color.setAlpha(255);
    stroke(color);
    strokeWeight(POINTSTROKE);

    point(p.x, p.y);
  });
}

function drawLines(points, color){
  var prevPoint = null;

  points.forEach(p => {
    if(prevPoint!=null){
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
  var u = 0;
  for (let t = 0; t <= nEvaluations; t += 1) {
    controls = points;

    while (controls.length > 1) {
      var aux = [];
      for (let i = 0; i < controls.length - 1; i++) {
        aux[i] = interpolate(t/nEvaluations, controls[i], controls[i + 1]);
      }
      
      controls = aux;
    }
    result.push(controls[0]);
  }
  return result;
}

}