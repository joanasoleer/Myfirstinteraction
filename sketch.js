let font;
let tSize = 150; // Tamaño del texto
let pointCount = 0.8; // entre 0 y 1 para la cantidad de puntos

let speed = 10; // velocidad de las partículas
let comebackSpeed = 100; // mientras menor, menos tiempo para volver
let dia = 100; // diámetro de interacción
let randomPos = true; // punto de inicio aleatorio
let pointsDirection = "general"; // dirección general de puntos
let interactionDirection = -1; // cambia el comportamiento de la interacción

let textPoints = [];
let disperse = false; // Para dispersar las partículas
let regrouping = false; // Para indicar si deben reagruparse en nuevas palabras
let disperseTimer = 0; // Temporizador para controlar la dispersión
let halfWay = false; // Nueva variable para disparar transición a la mitad

let words = ["about", "works", "shop", "info"]; // Lista de palabras después de "menu"

function preload() {
  font = loadFont("AvenirNextLTPro-Demi.otf"); // Asegúrate de que el archivo de fuente está en la carpeta del proyecto
}

function setup() {
  createCanvas(1000, 1000);
  textAlign(CENTER, CENTER);

  // Configurar la palabra inicial "menu"
  loadWord("menu");
}

function loadWord(word) {
  textPoints = []; // Limpia puntos anteriores

  // Calcula el ancho de la palabra para centrarla en el canvas
  let bounds = font.textBounds(word, 0, 0, tSize);
  let posX = width / 2 - bounds.w / 2;
  let posY = height / 2 + bounds.h / 4;

  let points = font.textToPoints(word, posX, posY, tSize, {
    sampleFactor: pointCount,
  });

  for (let i = 0; i < points.length; i++) {
    let pt = points[i];
    let textPoint = new Interact(
      pt.x,
      pt.y,
      speed,
      dia,
      true, // Las partículas ahora inician en posiciones aleatorias en los bordes
      comebackSpeed,
      pointsDirection,
      interactionDirection
    );
    textPoints.push(textPoint);
  }
}

function loadWordsList() {
  textPoints = [];
  for (let i = 0; i < words.length; i++) {
    let word = words[i];

    // Calcula el ancho de la palabra y la posiciona centrada horizontalmente
    let bounds = font.textBounds(word, 0, 0, tSize);
    let tposX = width / 2 - bounds.w / 2;
    let tposY = height / 2 - (words.length * tSize) / 2 + i * (tSize + 50);

    let points = font.textToPoints(word, tposX, tposY, tSize, {
      sampleFactor: pointCount,
    });

    for (let j = 0; j < points.length; j++) {
      let pt = points[j];
      let textPoint = new Interact(
        pt.x,
        pt.y,
        speed,
        dia,
        true,
        comebackSpeed,
        pointsDirection,
        interactionDirection
      );
      textPoints.push(textPoint);
    }
  }
}

function draw() {
  background(0);

  // Transición en la mitad de la animación de "menu"
  if (disperse && frameCount - disperseTimer > 60) { // Inicia la transición tras 60 cuadros (~1 segundo)
    halfWay = true;
  }

  if (halfWay && frameCount - disperseTimer > 120) { // Espera 120 cuadros (~2 segundos) para cambiar completamente
    disperse = false;
    regrouping = true;
    halfWay = false;
    loadWordsList(); // Cargar las palabras en lista vertical
  }

  for (let i = 0; i < textPoints.length; i++) {
    let v = textPoints[i];
    v.update();
    v.show();

    if (!disperse && !regrouping) {
      v.behaviors(); // Interacción normal
    } else if (disperse) {
      v.disperse(); // Disipar partículas
    } else if (regrouping) {
      v.behaviors(); // Reagrupar en las nuevas posiciones
    }
  }
}

// Al iniciar, activa la dispersión de partículas
function mousePressed() {
  if (!disperse && !regrouping) {
    disperse = true;
    disperseTimer = frameCount; // Inicia el temporizador
  }
}

function Interact(x, y, m, d, t, s, di, p) {
  // Genera una posición inicial aleatoria en los bordes del canvas
  let edge = floor(random(4)); // Elegir uno de los cuatro bordes
  if (edge === 0) {
    // Borde superior
    this.home = createVector(random(width), -10);
  } else if (edge === 1) {
    // Borde inferior
    this.home = createVector(random(width), height + 10);
  } else if (edge === 2) {
    // Borde izquierdo
    this.home = createVector(-10, random(height));
  } else if (edge === 3) {
    // Borde derecho
    this.home = createVector(width + 10, random(height));
  }

  this.pos = this.home.copy();
  this.target = createVector(x, y);

  if (di == "general") {
    this.vel = createVector();
  } else if (di == "up") {
    this.vel = createVector(0, -y);
  } else if (di == "down") {
    this.vel = createVector(0, y);
  } else if (di == "left") {
    this.vel = createVector(-x, 0);
  } else if (di == "right") {
    this.vel = createVector(x, 0);
  }

  this.acc = createVector();
  this.r = 8;
  this.maxSpeed = m;
  this.maxforce = 1;
  this.dia = d;
  this.come = s;
  this.dir = p;
}

// Método de dispersión
Interact.prototype.disperse = function () {
  let disperseForce = p5.Vector.random2D(); // Dirección aleatoria para dispersión
  disperseForce.setMag(this.maxSpeed); // Aumentar magnitud para disipar
  this.applyForce(disperseForce);
};

Interact.prototype.behaviors = function () {
  let arrive = this.arrive(this.target);
  let mouse = createVector(mouseX, mouseY);
  let flee = this.flee(mouse);

  this.applyForce(arrive);
  this.applyForce(flee);
};

Interact.prototype.applyForce = function (f) {
  this.acc.add(f);
};

Interact.prototype.arrive = function (target) {
  let desired = p5.Vector.sub(target, this.pos);
  let d = desired.mag();
  let speed = this.maxSpeed;
  if (d < this.come) {
    speed = map(d, 0, this.come, 0, this.maxSpeed);
  }
  desired.setMag(speed);
  let steer = p5.Vector.sub(desired, this.vel);
  return steer;
};

Interact.prototype.flee = function (target) {
  let desired = p5.Vector.sub(target, this.pos);
  let d = desired.mag();

  if (d < this.dia) {
    desired.setMag(this.maxSpeed);
    desired.mult(this.dir);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  } else {
    return createVector(0, 0);
  }
};

Interact.prototype.update = function () {
  this.pos.add(this.vel);
  this.vel.add(this.acc);
  this.acc.mult(0);
};

Interact.prototype.show = function () {
  stroke(255);
  strokeWeight(4);
  point(this.pos.x, this.pos.y);
};
