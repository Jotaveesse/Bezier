var curves = [];
var dragging = false;
var draggedPoint;

var displayControlPoint = true;
var displayControlPoly = true;
var displayCurves = true;

const POINTSTROKE = 20;

class Curve{
  constructor(color, evaluation, points=[]) {
    this.color = color;
    this.evaluation = evaluation;
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

function setup() {
  createCanvas(windowWidth, windowHeight);

  //desabilita a função default do botao direito
  for (let element of document.getElementsByClassName("p5Canvas")) {
    element.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  curves.push(new Curve(color(250,100,50),1));
}

function mouseClicked(){
  var dist;
  var shortestDist = 10000;
  var shortestPoint;

  //checa qual o ponto mais próximo
  curves.forEach(curve => {
    curve.points.forEach(p => {
      dist = p.distSqrd(mouseX, mouseY);
      if(dist < shortestDist){
        shortestDist = dist;
        shortestPoint = p;
      }
    });
  });

  //adiciona ponto se não estiver clicado em cima de outro ponto
  if(shortestDist>(POINTSTROKE ** 2) && !dragging){
    var p = new Point(mouseX, mouseY);
    curves[0].points.push(p);
  }
}

function mousePressed(event){  
  var dist;
  var shortestDist = 10000;
  var closestPoint;
  var closestCurve;

  //acha ponto mais proximo do clique
  curves.forEach(curve => {
    curve.points.forEach(p => {
      dist = p.distSqrd(mouseX, mouseY);
      if(dist < shortestDist){
        shortestDist = dist;
        closestPoint = p;
        closestCurve = curve;
      }
    });
  });

  //arrasta caso tenha apertado em cima de um ponto
  if(mouseButton === LEFT){
    if (shortestDist < (POINTSTROKE / 2) ** 2) {
      dragging = true;
      draggedPoint = closestPoint;
      offsetX = closestPoint.x - mouseX;
      offsetY = closestPoint.y - mouseY;
    }
  }
  //remove ponto caso tenha apertado em cima de um
  else if(mouseButton === RIGHT){
    if (shortestDist < (POINTSTROKE / 2) ** 2) {
      let index = closestCurve.points.indexOf(closestPoint);
      closestCurve.points.splice(index, 1);
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
    
    var prevPoint = null;

    curve.points.forEach(p => {
      //desenha pontos
      if(displayControlPoint){
        curve.color.setAlpha(256);
        stroke(curve.color);
        strokeWeight(POINTSTROKE);

        point(p.x, p.y);
      }

      //desenha linhas
      if(displayControlPoly && prevPoint!=null){
        curve.color.setAlpha(128);
        stroke(curve.color);
        strokeWeight(POINTSTROKE * 0.8);

        line(prevPoint.x, prevPoint.y, p.x, p.y);
      }

      prevPoint = p;
    });
  });
}