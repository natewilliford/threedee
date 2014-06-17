
var WIDTH = 500;
var HEIGHT = 500;
var ctx;
var camera;
var cube;

var zNear = 1;
var beta = 1;

var keys = [];
var last = -1;

Object3D = function(pos, rot) {
  this.position = pos || Vector.Zero(3);
  this.rotation = rot || Vector.Zero(3);
}

Camera = function() {
  Object3D.call(this);
};
Camera.prototype = Object3D.prototype;

LineSeg = function(start, end) {
  this.start = start || Vector.Zero(3);
  this.end = end || Vector.Zero(3);
};

LineSeg.buildLineSeg = function(sx, sy, sz, ex, ey, ez) {
  return new LineSeg(Vector.create([sx, sy, sz]), Vector.create([ex, ey, ez]));
};

Cube = function() {
  Object3D.call(this);

  this.lines = [];

  // front face
  this.lines.push(LineSeg.buildLineSeg(-0.5, 0.5, 1, 0.5, 0.5, 1));
  this.lines.push(LineSeg.buildLineSeg(-0.5, -0.5, 1, -0.5, 0.5, 1));
  this.lines.push(LineSeg.buildLineSeg(-0.5, -0.5, 1, 0.5, -0.5, 1));
  this.lines.push(LineSeg.buildLineSeg(0.5, 0.5, 1, 0.5, -0.5, 1));

  // back face
  this.lines.push(LineSeg.buildLineSeg(-0.5, 0.5, 2, 0.5, 0.5, 2));
  this.lines.push(LineSeg.buildLineSeg(-0.5, -0.5, 2, -0.5, 0.5, 2));
  this.lines.push(LineSeg.buildLineSeg(-0.5, -0.5, 2, 0.5, -0.5, 2));
  this.lines.push(LineSeg.buildLineSeg(0.5, 0.5, 2, 0.5, -0.5, 2));

  // connections
  this.lines.push(LineSeg.buildLineSeg(-0.5, 0.5, 1, -0.5, 0.5, 2));
  this.lines.push(LineSeg.buildLineSeg(-0.5, -0.5, 1, -0.5, -0.5, 2));
  this.lines.push(LineSeg.buildLineSeg(0.5, -0.5, 1, 0.5, -0.5, 2));
  this.lines.push(LineSeg.buildLineSeg(0.5, 0.5, 1, 0.5, 0.5, 2));
};
Cube.prototype = Object3D.prototype;

document.addEventListener('DOMContentLoaded', function(event) {
  var c = document.getElementById('canvas');
  ctx = c.getContext('2d');
  camera = new Camera();
  cube = new Cube();

  tick(ctx);
})

function tick(timestamp) {
  // console.log('tick');
  if (last < 0) {
    last = timestamp;
    window.requestAnimationFrame(tick);
    return;
  }
  var elapsed = timestamp - last;
  last = timestamp;
  if (elapsed) {
    // console.log(elapsed);
    update(elapsed);
    draw(ctx);
  }
  window.requestAnimationFrame(tick);
}

document.addEventListener('keydown', function(event) {
  keys[event.keyCode] = event;
});

document.addEventListener('keyup', function(event) {
  delete keys[event.keyCode];
});

function update(elapsed) {
  // console.log('update');
  var camVec = cameraDirectionUnitVector(camera);
  var rotateVal = elapsed * 0.0001
  var moveVal = elapsed * 0.0001
  var strafeVal = elapsed * 0.001
  if (keys[38] || keys[87]) { // forward
    for (var i = 0; i < cube.lines.length; i++) {
      camera.position = camera.position.add(camVec.multiply(moveVal));
    }
  } if (keys[40] || keys[83]) { // backward
    for (var i = 0; i < cube.lines.length; i++) {
      camera.position = camera.position.subtract(camVec.multiply(moveVal));
    }
  } if (keys[65]) { // strafe left
    camera.position = camera.position.add(camVec.rotate(-Math.PI/2, Line.Y).multiply(strafeVal));
  } if (keys[68]) { // strafe right
    camera.position = camera.position.add(camVec.rotate(Math.PI/2, Line.Y).multiply(strafeVal));
  } if (keys[39] || keys[69]) { // pan right
    for (var i = 0; i < cube.lines.length; i++) {
      camera.rotation.elements[1] += moveVal;
    }
  } if (keys[37] || keys[81]) { // pan left
    for (var i = 0; i < cube.lines.length; i++) {
      camera.rotation.elements[1] -= moveVal;
    }
  }
  draw(ctx);
}

function draw(ctx) {
  // console.log('draw');
  ctx.fillStyle = "rgba(255, 255, 255, 255)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (var i = 0; i < cube.lines.length; i++) {
    drawLineSeg(ctx, cube.lines[i]);
  }
}

function drawLineSeg(ctx, line) {
  var startPoint = to2DWindowPoint(projectCameraPoint(line.start, camera));
  var endPoint = to2DWindowPoint(projectCameraPoint(line.end, camera));

  ctx.beginPath();
  ctx.moveTo(startPoint.elements[0], startPoint.elements[1]);
  ctx.lineTo(endPoint.elements[0], endPoint.elements[1]);
  ctx.stroke();
}

function projectCameraPoint(point, camera) {
  // 4D vector with x, y, z, 1 to make the matrix transforms easier.
  var workingVec = Vector.create([point.elements[0], point.elements[1], point.elements[2], 1]);

  var viewSpaceTransform = Matrix.I(4);
  viewSpaceTransform = viewSpaceTransform.multiply(rotateYMatrix(camera.rotation.elements[1]));
  viewSpaceTransform = viewSpaceTransform.multiply(translationMatrix(camera.position));
  workingVec = viewSpaceTransform.multiply(workingVec);

  var perspectiveTransform = perspectiveProjectionMatrix(workingVec.elements[2], zNear);
  workingVec = perspectiveTransform.multiply(workingVec);

  return Vector.create([workingVec.elements[0], workingVec.elements[1]]);
}

function to2DWindowPoint(point) {
  return Vector.create(
      [(WIDTH/2) - (point.elements[0] * (WIDTH/2)),
      (HEIGHT/2) - (point.elements[1] * (HEIGHT/2))]);
}

function translationMatrix(vec) {
  return Matrix.create([
    [1, 0, 0, vec.elements[0]],
    [0, 1, 0, vec.elements[1]],
    [0, 0, 1, -vec.elements[2]],
    [0, 0, 0, 1],
  ]);
}

function rotateYMatrix(t) {
  return Matrix.create([
    [Math.cos(t), 0, Math.sin(t), 0],
    [0, 1, 0, 0],
    [-Math.sin(t), 0, Math.cos(t), 0],
    [0, 0, 0, 1],
  ]);
}

function perspectiveProjectionMatrix(z, zNear) {
  return Matrix.create([
    [zNear/z, 0, 0, 0],
    [0, zNear/z, 0, 0],
    [0, 0, 0, 1],
  ]);
}

// todo: do this smarter.
function cameraDirectionUnitVector(camera) {
  // Start with vector along z axis.
  var v = Vector.k;
  // only rotate around y axis for now.
  return v.rotate(camera.rotation.elements[1], Line.Y);
}
