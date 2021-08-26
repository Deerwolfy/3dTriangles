function Canvas(id,width,height) {
  let c = {};
  c.canvas = document.getElementById(id);
  c.width = 400;
  c.height = 300;
  c.canvas.width = width;
  c.canvas.height = height;
  c.canvas.style.width = width + 'px';
  c.canvas.style.height = height + 'px';
  c.ctx = c.canvas.getContext('2d');
  c.background = 'white';
  c.maxY = 0;
  c.maxX = 0;
  c.padding = 30;
  c.scaleX = 1;
  c.scaleY = 1;
  c.clear = function() {
    this.ctx.fillStyle = this.background;
    this.ctx.fillRect(0,0,this.width,this.height);
  }
  c.scale = function(x,y) {
    let s = {};
    s.x = x*this.scaleX;
    s.y = y*this.scaleY;
    return s;
  }
  c.updateScale = function() {
    this.scaleX = (this.width-this.padding)/this.maxX;
    this.scaleY = (this.height-this.padding)/this.maxY;
  }
  c.line = function(x1,y1,x2,y2,color) {
    let updateScale = false;
    if(this.maxX < x1) {this.maxX = x1; updateScale = true;}
    if(this.maxX < x2) {this.maxX = x2; updateScale = true;} 
    if(this.maxY < y1) {this.maxY = y1; updateScale = true;} 
    if(this.maxY < y2) {this.maxY = y2; updateScale = true;}
    if(updateScale) this.updateScale();
    this.ctx.strokeStyle = 'blue';
    this.ctx.beginPath();
    let p1 = this.scale(x1,y1);
    let p2 = this.scale(x2,y2);
    this.ctx.moveTo(p1.x,p1.y)
    this.ctx.lineTo(p2.x,p2.y);
    this.ctx.stroke();
  }
  return c;
}

let canvas1 = Canvas('canvasHidden',400,300);
let canvas2 = Canvas('canvasVisible',400,300);

let focal = 5000;
let padding = 30;

function Point2D(x,y) {
  let pt = {};
  pt.x = x;
  pt.y = y;
  pt.lineTo = function (canvas,end2) {
    canvas.line(this.x,this.y,end2.x,end2.y);
  }
  return pt;
}

function Point3D(x,y,z) {
  let pt = {};
  pt.x = x;
  pt.y = y;
  pt.z = z;
  pt.translate = function() {
    let scale = focal/(focal+this.z);
    return Point2D(this.x*scale, this.y*scale);
  }
  pt.rotateX = function(deg,center) {
    let rad = deg * Math.PI/180;
    let cos = Math.cos(rad);
    let sin = Math.sin(rad);
    let ry = this.y-center.y;
    let rz = this.z-center.z;
    let y = Math.floor(ry*cos - rz*sin);
    let z = Math.floor(ry*sin + rz*cos);
    return Point3D(this.x,y+center.y,z+center.z);
  }
  pt.rotateY = function(deg,center) {
    let rad = deg * Math.PI/180;
    let cos = Math.cos(rad);
    let sin = Math.sin(rad);
    let rx = this.x-center.x;
    let rz = this.z-center.z;
    let x = Math.floor(rx*cos + rz*sin);
    let z = Math.floor(-rx*sin + rz*cos);
    return Point3D(x+center.x,this.y,z+center.z);
  }
  pt.rotateZ = function(deg,center) {
    let rad = deg * Math.PI/180;
    let cos = Math.cos(rad);
    let sin = Math.sin(rad);
    let rx = this.x-center.x;
    let ry = this.y-center.y;
    let x = Math.floor(rx*cos - ry*sin);
    let y = Math.floor(rx*sin + ry*cos);
    return Point3D(x+center.x,y+center.y,this.z);
  }
  return pt;
}

function Vector3D(start,end,center = Point3D(0,0,0)) {
  let vt = {};
  vt.start = start;
  vt.end = end;
  vt.center = center;
  vt.draw = function(canvas) {
    this.start.translate().lineTo(canvas,this.end.translate());
  }
  vt.rotateX = function (deg, center = this.center) {
    return Vector3D(this.start.rotateX(deg,center),
    this.end.rotateX(deg,center),this.center);
  }
  vt.rotateY = function (deg, center = this.center) {
    return Vector3D(this.start.rotateY(deg,center),
    this.end.rotateY(deg,center),this.center);
  }
  vt.rotateZ = function (deg, center = this.center) {
    return Vector3D(this.start.rotateZ(deg,center),
    this.end.rotateZ(deg,center),this.center);
  }
  vt.centerToMass = function() {
    this.center.x = Math.floor((this.start.x+this.end.x)/2);
    this.center.y = Math.floor((this.start.y+this.end.y)/2);
    this.center.z = Math.floor((this.start.z+this.end.z)/2);
  }
  vt.cross = function(point) {
    let v1x = this.end.x - this.start.x;
    let v1y = this.end.y - this.start.y;
    let v1z = this.end.z - this.start.z;
    let v2x = point.x - this.start.x;
    let v2y = point.y - this.start.y;
    let v2z = point.z - this.start.z;
    let x = Math.floor(v1y*v2z-v2y*v1z);
    let y = Math.floor(v1x*v2z-v2x*v1z);
    let z = Math.floor(v1x*v2y-v2x*v1y);
    return Vector3D(this.start,Point3D(x,y,z),this.center);
  }
  vt.dot = function(v2) {
    return (this.end.x-this.start.x)*(v2.end.x-v2.start.x) +
    (this.end.y-this.start.y)*(v2.end.y-v2.start.y) +
    (this.end.z-this.start.z)*(v2.end.z-v2.start.z);
  }
  return vt;
}

function TriFace(vector,point,center = Point3D(0,0,0)) {
  let tf = {};
  tf.vector = vector;
  tf.point = point;
  tf.center = center;
  tf.draw = function(canvas) {
    this.vector.draw(canvas);
    Vector3D(this.vector.start,point).draw(canvas);
    Vector3D(point,this.vector.end).draw(canvas);
  }
  tf.centerToMass = function() {
    this.vector.centerToMass();
    this.center.x = Math.floor((this.vector.center.x + this.point.x)/2);
    this.center.y = Math.floor((this.vector.center.y + this.point.y)/2);
    this.center.z = Math.floor((this.vector.center.z + this.point.z)/2);
  }
  tf.rotateX = function(deg, center = this.center) {
    return TriFace(this.vector.rotateX(deg,center),
    this.point.rotateX(deg,center),this.center);
  }
  tf.rotateY = function(deg, center = this.center) {
    return TriFace(this.vector.rotateY(deg,center),
    this.point.rotateY(deg,center),this.center);
  }
  tf.rotateZ = function(deg, center = this.center) {
    return TriFace(this.vector.rotateZ(deg,center),
    this.point.rotateZ(deg,center),this.center);
  }
  tf.getNormal = function() {
    let cross = this.vector.cross(this.point);
    cross.center = this.center;
    cross.start = this.vector.start;
    return cross;
  }
  tf.isVisible = function(canvas) {
    return this.getNormal().dot(Vector3D(Point3D(Math.floor(canvas.width/2),Math.floor(canvas.height/2),focal),this.vector.start)) > 0;
  }
  return tf;
}

function Object3D(faces, center = Point3D(0,0,0)) {
  let obj = {};
  obj.faces = faces;
  obj.center = center;
  obj.draw = function(canvas,showHidden = true) {
    this.faces.forEach((face) => {
      if(showHidden || face.isVisible(canvas))
        face.draw(canvas);
    });
  }
  obj.centerToMass = function() {
    this.faces.forEach((face) => face.centerToMass());
    let x = [];
    let y = [];
    let z = [];
    this.faces.forEach((face) => {
      x.push(face.vector.start.x);
      x.push(face.vector.end.x);
      x.push(face.point.x);
      y.push(face.vector.start.y);
      y.push(face.vector.end.y);
      y.push(face.point.y);
      z.push(face.vector.start.z);
      z.push(face.vector.end.z);
      z.push(face.point.z);
    });
    this.center.x = Math.floor((Math.max.apply(null,x)+Math.min.apply(null,x))/2);
    this.center.y = Math.floor((Math.max.apply(null,y)+Math.min.apply(null,y))/2);
    this.center.z = Math.floor((Math.max.apply(null,z)+Math.min.apply(null,z))/2);
  }
  obj.rotateX = function(deg) {
    let rFaces = [];
    this.faces.forEach((face) => rFaces.push(face.rotateX(deg,this.center)));
    return Object3D(rFaces,this.center);
  }
  obj.rotateY = function(deg) {
    let rFaces = [];
    this.faces.forEach((face) => rFaces.push(face.rotateY(deg,this.center)));
    return Object3D(rFaces,this.center);
  }
  obj.rotateZ = function(deg) {
    let rFaces = [];
    this.faces.forEach((face) => rFaces.push(face.rotateZ(deg,this.center)));
    return Object3D(rFaces,this.center);
  }
  return obj;
}

let points = [Point3D(4,4,1),Point3D(9,2,10),Point3D(12,5,6), Point3D(7,13,4)]

let maxX = 0;
let maxY = 0;

points.forEach((p) => {
  if(maxX < p.x) maxX = p.x;
  if(maxY < p.y) maxY = p.y;
});

canvas1.maxX = maxX;
canvas1.maxY = maxY;
canvas1.updateScale();
canvas2.maxX = maxX;
canvas2.maxY = maxY;
canvas2.updateScale();


let scaleZ = (canvas1.scale(0,maxY).y/maxY + canvas1.scale(maxX,0).x/maxX)/2;

points.forEach((p) => {
  let s = canvas1.scale(p.x,maxY-p.y);
  p.x = Math.floor(s.x);
  p.y = Math.floor(s.y+padding);
  p.z = Math.floor(p.z*scaleZ);
});

let A = points[0];
let B = points[1];
let C = points[2];
let D = points[3];

let f1 = TriFace(Vector3D(A,B),D);
let f2 = TriFace(Vector3D(B,C),D);
let f3 = TriFace(Vector3D(C,A),D);
let f4 = TriFace(Vector3D(B,A),C);
let tri = Object3D([f1,f2,f3,f4]);
tri.centerToMass();


let deg = 0;
function draw() {
  if(deg >= 360) deg = 0;
  canvas1.clear();
  canvas2.clear();
  tri.rotateY(deg).draw(canvas1,false);
  tri.rotateY(deg).draw(canvas2,true);
  deg += 1;
}

setInterval(draw,10);
