import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
const euler = new THREE.Euler();

// =========================================================
// 1. CONFIGURAÇÃO GLOBAL
// =========================================================
// Objeto central para guardar variáveis que podem ser alteradas via painel (GUI)
const config = {
  wingZ: 0.2, // Posição Z das asas
  wingScale: 1.3365, // Envergadura das asas
  tailZ: 2.415, // Distância da cauda
  motorZ: -3.1, // Posição do motor
  coneZ: -0.029, // Ajuste fino do nariz
  enginePower: 50, // Potência do motor
  wireframe: false, // Modo de wireframe
};

// Dados de Telemetria
let pitchVal = 0;
let rollVal = 0;
let hdgVal = 0;

// Offsets para ajustar o pivot das peças móveis
const OFFSET_AILERON = 0.8;
const OFFSET_RUDDER = 0.6;
const PropTorqueFactor = 0.001;

// =========================================================
// 2. SETUP BÁSICO (BOILERPLATE THREE.JS)
// =========================================================
const scene = new THREE.Scene();

// Configuração da Câmara
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.01,
  5000
);
camera.position.set(0, 110, 20); // Posição inicial da camara

// Configuração do Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true }); // Suaviza as arestas
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Ativa sombras
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Melhora o realismo das cores
document.body.appendChild(renderer.domElement);

// Controlos da Câmara 3Person
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Movimento suave da câmara
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 100;

// Skybox (Ambiente e Fundo)
const loader = new THREE.CubeTextureLoader();
// Imagens da Skybox
const texture = loader.load([
  "./assets/sh_ft.png",
  "./assets/sh_bk.png",
  "./assets/sh_up.png",
  "./assets/sh_dn.png",
  "./assets/sh_rt.png",
  "./assets/sh_lf.png",
]);
scene.background = texture;
scene.environment = texture; // O céu reflete nos materiais metálicos

// Iluminação
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.8); // Sol (Simulação)
dirLight.position.set(50, 500, 50);
dirLight.castShadow = true;

// Configuração da área de sombra
dirLight.shadow.camera.top = 200;
dirLight.shadow.camera.bottom = -200;
dirLight.shadow.camera.left = -200;
dirLight.shadow.camera.right = 200;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// =========================================================
// 3. CONSTRUÇÃO DO AVIÃO
// =========================================================
const airplane = new THREE.Group(); // Grupo principal que contém todas as peças
airplane.position.set(0, 100, 0);

// Definição de Materiais
const matBody = new THREE.MeshStandardMaterial({
  color: 0xe74c3c,
  roughness: 0.4,
});
const matDark = new THREE.MeshStandardMaterial({
  color: 0x333333,
  roughness: 0.5,
});
const matOrange = new THREE.MeshStandardMaterial({ color: 0xffa500 }); // Cor das peças móveis
const matGrey = new THREE.MeshStandardMaterial({
  color: 0x999999,
  metalness: 0.5,
});
const matGlass = new THREE.MeshStandardMaterial({
  color: 0x111111,
  metalness: 0.9,
  roughness: 0.1,
  envMapIntensity: 1.5,
  transparent: true,
  opacity: 0.4,
  side: THREE.DoubleSide,
});

// --- Fuselagem (Corpo) ---
const fuselagePoints = [];
fuselagePoints.push(new THREE.Vector2(0.01, -3.1)); // Nariz
fuselagePoints.push(new THREE.Vector2(0.4, -2.9));
fuselagePoints.push(new THREE.Vector2(0.75, -1.5));
fuselagePoints.push(new THREE.Vector2(0.85, 0)); // Centro
fuselagePoints.push(new THREE.Vector2(0.75, 1.5));
fuselagePoints.push(new THREE.Vector2(0.4, 2.8));
fuselagePoints.push(new THREE.Vector2(0.05, 3.2)); // Cauda
const fuselage = new THREE.Mesh(
  new THREE.LatheGeometry(fuselagePoints, 32),
  matBody
);
fuselage.rotation.x = Math.PI / 2;
fuselage.castShadow = true;
airplane.add(fuselage);

// --- Cockpit (Vidro) ---
const cockpit = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.5, 1.1, 16, 32),
  matGlass
);
cockpit.rotation.x = Math.PI / 2;
cockpit.position.set(0, 0.65, -0.8);
cockpit.scale.set(0.95, 0.85, 1);
airplane.add(cockpit);

// --- Asas ---
const wingsGroup = new THREE.Group();
const wings = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 1.6), matBody);
wings.castShadow = true;
wingsGroup.add(wings);
wingsGroup.position.set(0, 0, config.wingZ);
wingsGroup.scale.set(config.wingScale, 1, 1);
airplane.add(wingsGroup);

// --- Cauda (Estabilizadores) ---
const tailGroup = new THREE.Group();
// Estabilizador Vertical
const vStab = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 1.2), matBody);
vStab.position.set(0, 0.8, 0);
vStab.castShadow = true;
// Estabilizador Horizontal
const hStab = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 1), matBody);
hStab.position.set(0, 0.2, 0.1);
hStab.castShadow = true;
tailGroup.add(vStab, hStab);
tailGroup.position.set(0, 0, config.tailZ);
airplane.add(tailGroup);

// Motor
const propellerGroup = new THREE.Group();
propellerGroup.position.set(0, 0, config.motorZ);
// Cone do nariz
const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 32), matGrey);
spinner.rotation.x = -Math.PI / 2;
spinner.position.z = config.coneZ;
propellerGroup.add(spinner);
// Lâminas da hélice
const blade1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.15, 0.05), matDark);
blade1.position.z = 0.15;
const blade2 = blade1.clone();
blade2.rotation.z = Math.PI / 2; // Segunda lâmina em cruz
propellerGroup.add(blade1, blade2);
airplane.add(propellerGroup);

// --- Peças Móveis ---
const aileronL = new THREE.Object3D();
const aileronR = new THREE.Object3D();
const rudder = new THREE.Object3D();
const elevator = new THREE.Object3D();

// Função para posicionar as peças móveis se mudarmos a geometria no menu
function updateDependentParts() {
  const cWX = 2.5 * config.wingScale;
  aileronL.position.set(-cWX, 0, config.wingZ + OFFSET_AILERON);
  aileronR.position.set(cWX, 0, config.wingZ + OFFSET_AILERON);
  rudder.position.set(0, 0.8, config.tailZ + OFFSET_RUDDER);
  elevator.position.set(0, 0.2, config.tailZ + OFFSET_RUDDER);
}

// Adiciona as malhas visuais aos objetos pivô e ajusta offset para rodar pela borda
aileronL.add(
  new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.4), matOrange).translateZ(
    0.2
  )
);
aileronR.add(
  new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.4), matOrange).translateZ(
    0.2
  )
);
rudder.add(
  new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.5), matOrange).translateZ(
    0.25
  )
);
elevator.add(
  new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.05, 0.5), matOrange).translateZ(
    0.25
  )
);

airplane.add(aileronL, aileronR, rudder, elevator);
updateDependentParts();
scene.add(airplane);

// =========================================================
// 4. SISTEMA DE TERRENO INFINITO
// =========================================================
const TERRAIN_SIZE = 1000;
const TERRAIN_SEGMENTS = 40;
const chunks = []; // Armazena os chunks de terreno

// Textura do chão
const texLoader = new THREE.TextureLoader();
const groundTexture = texLoader.load("./assets/sh_dn.png");
groundTexture.wrapS = THREE.RepeatWrapping; // Repetir textura
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(4, 4);

const terrainMat = new THREE.MeshStandardMaterial({
  map: groundTexture,
  color: 0xffffff,
  roughness: 0.9,
  flatShading: false,
});

// Função matemática para gerar a altura (Y) baseada na posição (X, Z)
function getTerrainHeight(x, z) {
  // Combinação de ondas seno e cosseno para criar colinas suaves
  let y = Math.sin(x / 150) * Math.cos(z / 150) * 30;
  y += Math.sin(x / 40 + z / 30) * 5; // Detalhes menores
  return y - 40; // Baixa o terreno para não bater no avião logo de início
}

// Cria um chunk de terreno
function createChunk(offsetX, offsetZ) {
  const geometry = new THREE.PlaneGeometry(
    TERRAIN_SIZE,
    TERRAIN_SIZE,
    TERRAIN_SEGMENTS,
    TERRAIN_SEGMENTS
  );
  geometry.rotateX(-Math.PI / 2);

  const mesh = new THREE.Mesh(geometry, terrainMat);
  mesh.userData = { offsetX, offsetZ }; // Guarda coordenadas originais
  updateChunkGeometry(mesh, offsetX, offsetZ);
  mesh.receiveShadow = true;
  scene.add(mesh);
  chunks.push(mesh);
  return mesh;
}

// Modifica os vértices do plano para criar as montanhas
function updateChunkGeometry(mesh, worldX, worldZ) {
  mesh.position.set(worldX, 0, worldZ);
  const pos = mesh.geometry.attributes.position;
  // Loop por todos os vértices
  for (let i = 0; i < pos.count; i++) {
    // Calcula a altura para cada ponto
    const h = getTerrainHeight(worldX + pos.getX(i), worldZ + pos.getZ(i));
    pos.setY(i, h);
  }
  mesh.geometry.computeVertexNormals(); // Recalcula iluminação
  mesh.geometry.attributes.position.needsUpdate = true;
}

// Inicializa o terreno criando uma grelha 3x3 de chunks ao redor do (0,0)
for (let x = -1; x <= 1; x++) {
  for (let z = -1; z <= 1; z++) {
    createChunk(x * TERRAIN_SIZE, z * TERRAIN_SIZE);
  }
}

// Função chamada a cada frame para reposicionar chunks distantes
function updateTerrain(planePos) {
  // Arredonda a posição do avião para a grelha
  const gridX = Math.round(planePos.x / TERRAIN_SIZE) * TERRAIN_SIZE;
  const gridZ = Math.round(planePos.z / TERRAIN_SIZE) * TERRAIN_SIZE;

  chunks.forEach((chunk) => {
    // Distância do chunk até ao centro da grelha atual
    const dx = chunk.position.x - gridX;
    const dz = chunk.position.z - gridZ;
    let newX = chunk.position.x;
    let newZ = chunk.position.z;
    let changed = false;

    // Se o chunk ficou muito longe, move-o para o outro lado (efeito passadeira)
    if (Math.abs(dx) > TERRAIN_SIZE * 1.1) {
      newX = gridX - Math.sign(dx) * TERRAIN_SIZE;
      changed = true;
    }
    if (Math.abs(dz) > TERRAIN_SIZE * 1.1) {
      newZ = gridZ - Math.sign(dz) * TERRAIN_SIZE;
      changed = true;
    }
    // Se moveu, recalcula as montanhas para a nova posição
    if (changed) {
      updateChunkGeometry(chunk, newX, newZ);
    }
  });
}

// =========================================================
// 5. INTERFACE (GUI)
// =========================================================
const gui = new GUI({ title: "Configurações" });
const fBuild = gui.addFolder("Montagem");
fBuild.add(config, "wingZ", -2, 2).onChange((v) => {
  wingsGroup.position.z = v;
  updateDependentParts();
});
fBuild.add(config, "wingScale", 0.8, 2).onChange((v) => {
  wingsGroup.scale.x = v;
  updateDependentParts();
});
const fCtrl = gui.addFolder("Voo");
fCtrl.add(config, "enginePower", 15, 100).name("Potência %");
fCtrl.add(config, "wireframe").onChange((v) => (matBody.wireframe = v));

// =========================================================
// 6. LÓGICA DE CONTROLO
// =========================================================
const keys = { q: false, e: false, a: false, d: false, w: false, s: false };
let isFirstPerson = false;
let previousPlanePosition = airplane.position.clone();

// Listeners de Teclado
window.addEventListener("keydown", (ev) => {
  if (keys.hasOwnProperty(ev.key.toLowerCase()))
    keys[ev.key.toLowerCase()] = true;
  if (ev.key.toLowerCase() === "c") {
    isFirstPerson = !isFirstPerson;
    controls.enabled = !isFirstPerson; // Desativa OrbitControls na primeira pessoa
  }
});
window.addEventListener("keyup", (ev) => {
  if (keys.hasOwnProperty(ev.key.toLowerCase()))
    keys[ev.key.toLowerCase()] = false;
});

// Variáveis de física
let roll = 0,
  pitch = 0,
  yaw = 0; // Rotações atuais do avião
let smoothAileron = 0,
  smoothRudder = 0,
  smoothElevator = 0; // Para animação suave das peças

// Redimensionamento da janela
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// =========================================================
// 7. LÓGICA DE COLISÃO ATUALIZADA
// =========================================================
// --- SISTEMA DE PARTÍCULAS (FOGO E FUMO) ---
const particles = [];
const particleGroup = new THREE.Group();
scene.add(particleGroup);

const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8);

let isCrashed = false;

function createExplosion(position) {
  const particleCount = 40;

  for (let i = 0; i < particleCount; i++) {
    // Escolher aleatoriamente se é fogo ou fumo
    const isFire = Math.random() > 0.4;
    const color = isFire
      ? Math.random() > 0.5
        ? 0xff4500
        : 0xffa500
      : 0x555555;

    const mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
    });

    const particle = new THREE.Mesh(particleGeometry, mat);

    // Posição inicial (onde o avião bateu)
    particle.position.copy(position);

    // Velocidade aleatória (explosão para cima e para os lados)
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,
      Math.random() * 0.5,
      (Math.random() - 0.5) * 0.5
    );

    particles.push({
      mesh: particle,
      velocity: velocity,
      life: 1.0,
      isFire: isFire,
      decay: 0.01 + Math.random() * 0.02,
    });

    particleGroup.add(particle);
  }
}

function checkCollision() {
  if (isCrashed) return;

  const currentTerrainHeight = getTerrainHeight(
    airplane.position.x,
    airplane.position.z
  );

  if (airplane.position.y < currentTerrainHeight + 0.5) {
    isCrashed = true;

    createExplosion(airplane.position);

    config.enginePower = 0;

    setTimeout(() => {
      resetPlane();
      particles.forEach((p) => particleGroup.remove(p.mesh));
      particles.length = 0;
    }, 2000);
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.life -= p.decay;

    // Mover a partícula
    p.mesh.position.add(p.velocity);

    if (p.isFire) {
      // Fogo encolhe
      p.mesh.scale.multiplyScalar(0.95);
    } else {
      // Fumo expande e fica transparente
      p.mesh.scale.multiplyScalar(1.02);
      p.mesh.material.opacity = p.life;
    }

    // Remover se a vida acabar
    if (p.life <= 0) {
      particleGroup.remove(p.mesh);
      particles.splice(i, 1);
    }
  }
}

function resetPlane() {
  airplane.position.y = 100;
  airplane.rotation.set(0, 0, 0);
  matBody.color.set(0xe74c3c);
  config.enginePower = 50;
  isCrashed = false;
  roll = pitch = yaw = 0;
}

// --- SISTEMA DE OBJETIVOS ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let currentGoal = null;

const goalMaterial = new THREE.MeshBasicMaterial({
  color: 0x01ff59,
  side: THREE.DoubleSide,
});
// Anel
const goalGeometry = new THREE.TorusGeometry(15, 0.8, 16, 100);

window.addEventListener("mousedown", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  //Atualizar o raio com a câmara e posição do rato
  raycaster.setFromCamera(mouse, camera);

  // Calcular interseções com os chunks gerados
  const intersects = raycaster.intersectObjects(chunks);

  if (intersects.length > 0) {
    const point = intersects[0].point;

    // Se já existe um objetivo, remove-o
    if (currentGoal) scene.remove(currentGoal);

    // Criar novo objetivo
    currentGoal = new THREE.Mesh(goalGeometry, goalMaterial);

    // Posicionar um pouco acima do chão
    currentGoal.position.set(point.x, point.y + 40, point.z);

    currentGoal.rotation.x = Math.PI;

    scene.add(currentGoal);
    console.log("Novo objetivo definido!");
  }
});

let objectiveCount = 0;
const objectiveLabel = document.getElementById("objectiveLabel");

function checkGoalCollection() {
  if (currentGoal) {
    currentGoal.lookAt(airplane.position);

    const distance = airplane.position.distanceTo(currentGoal.position);

    if (distance < 10) {
      objectiveCount += 1;

      // Atualiza o texto no HTML
      const label = document.getElementById("objectiveLabel");
      if (label) label.innerText = objectiveCount;

      console.log("Objetivo concluído!");

      // Feedback visual
      matBody.emissive.set(0x00ff00);
      setTimeout(() => matBody.emissive.set(0x000000), 500);

      // Remove o objetivo atual
      scene.remove(currentGoal);
      currentGoal = null;
    }
  }
}

const clock = new THREE.Clock();
let lastPos = new THREE.Vector3();

// Atualizar Telemetria (hud, data boxes e hdg tape)
function updateTelemetry() {
  const euler = new THREE.Euler().setFromQuaternion(airplane.quaternion, "YXZ");
  const pitchDeg = THREE.MathUtils.radToDeg(euler.x);
  const rollDeg = THREE.MathUtils.radToDeg(euler.z);
  const headingDeg = (THREE.MathUtils.radToDeg(euler.y) + 360) % 360;

  // Update dos valores
  document.getElementById("pitch-readout").innerText =
    Math.round(pitchDeg) + "°";
  document.getElementById("pitchVal").innerText = Math.round(pitchDeg);
  document.getElementById("rollVal").innerText = Math.round(rollDeg);
  document.getElementById("headingVal").innerText = Math.round(headingDeg);

  // Atualizar heading
  const hdgOffset = -(headingDeg * 6);
  document.getElementById(
    "heading-tape"
  ).style.transform = `translateX(${hdgOffset}px)`;

  // Atualizar o horizonte artificial
  const pitchMove = pitchDeg * 5;
  const disk = document.getElementById("horizon-disk");
  disk.style.transform = `rotate(${-rollDeg}deg) translateY(${pitchMove}px)`;

  // Atualizar Velocidade e altitude (Relativa ao chão)
  const dt = clock.getDelta();
  if (dt > 0) {
    const dist = airplane.position.distanceTo(lastPos);
    document.getElementById("speedVal").innerText =
      Math.round((dist / dt) * 2) + " kts";
  }
  lastPos.copy(airplane.position);
  document.getElementById("altVal").innerText =
    Math.round(
      airplane.position.y -
        getTerrainHeight(airplane.position.x, airplane.position.z)
    ) + " ft";
}

// Inicialização do HUD
function initHUD() {
  const hdgTape = document.getElementById("heading-tape");
  const pitchLadder = document.getElementById("pitch-ladder");

  // Gerar rumos para heading
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 36; i++) {
      const unit = document.createElement("div");
      unit.className = "hdg-unit";
      unit.innerText = i * 10;
      hdgTape.appendChild(unit);
    }
  }

  // Gerar números para pitch -90º a 90º
  for (let i = -90; i <= 90; i += 10) {
    if (i === 0) continue;
    const line = document.createElement("div");
    line.className = "pitch-line";

    line.style.top = `${500 - i * 5}px`;

    line.setAttribute("data-val", Math.abs(i));
    pitchLadder.appendChild(line);
  }
}

let gForceEffect = 0;

function animate() {
  requestAnimationFrame(animate);

  // Estas funções correm SEMPRE
  checkCollision();
  updateParticles();

  // Apenas processamos controlos e movimento se não houver crash
  if (!isCrashed) {
    checkGoalCollection();
    objectiveLabel.innerText = objectiveCount;
    // --- PROCESSAR INPUTS ---
    let tRoll = 0,
      tYaw = 0,
      tPitch = 0;
    if (keys.q) tRoll = 1.0; // Rodar esquerda
    if (keys.e) tRoll = -1.0; // Rodar direita
    if (keys.a) tYaw = 0.5; // Leme esquerda
    if (keys.d) tYaw = -0.5; // Leme direita
    if (keys.s) tPitch = 0.6; // Nariz cima
    if (keys.w) tPitch = -0.6; // Nariz baixo

    // --- FÍSICA E ROTAÇÃO DO AVIÃO ---
    // Lerp para suavizar o movimento
    roll = THREE.MathUtils.lerp(roll, tRoll, 0.04);
    yaw = THREE.MathUtils.lerp(yaw, tYaw, 0.04);
    pitch = THREE.MathUtils.lerp(pitch, tPitch, 0.04);
    // Aplica as rotações ao grupo do avião
    airplane.rotateY(yaw * 0.03);
    airplane.rotateX(pitch * 0.03);
    if (pitch > 0) {
      airplane.rotateZ(
        PropTorqueFactor + (pitch / 200) * (config.enginePower / 30)
      );
      airplane.rotateY(
        PropTorqueFactor / 10 + (pitch / 2000) * (config.enginePower / 30)
      );
    }
    if (pitch < 0) {
      airplane.rotateZ(
        -PropTorqueFactor + (pitch / 2000) * (config.enginePower / 30)
      );
      airplane.rotateY(
        -PropTorqueFactor / 40 + (pitch / 20000) * (config.enginePower / 30)
      );
    }

    // Roll Base devido ao efeito do torque factor
    airplane.rotateZ(
      ((roll * 0.03 * 2) / config.wingScale) * (config.enginePower / 30)
    ); // Consoante a potência e tamanho das asas, a autoridade dos ailerons muda

    // --- ANIMAÇÃO DAS PEÇAS MÓVEIS ---
    smoothAileron = THREE.MathUtils.lerp(smoothAileron, tRoll, 0.1);
    smoothRudder = THREE.MathUtils.lerp(smoothRudder, tYaw, 0.1);
    smoothElevator = THREE.MathUtils.lerp(smoothElevator, tPitch, 0.1);

    aileronL.rotation.x = -smoothAileron; // Ailerons movem-se em oposição
    aileronR.rotation.x = smoothAileron;
    rudder.rotation.y = -smoothRudder;
    elevator.rotation.x = -smoothElevator;

    // --- FÍSICA DE MOVIMENTO ---
    const power = config.enginePower / 100;
    propellerGroup.rotation.z += -0.2 - power; // Rodar hélice

    // Vetor do nariz
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(airplane.quaternion); // Aplica a rotação do avião ao vetor
    forward.normalize();

    const speed = 2.0 * power;
    if (speed > 0) {
      airplane.position.add(forward.multiplyScalar(speed)); // Move o avião nessa direção
    }

    // --- LÓGICA DE CÂMARA ---
    if (isFirstPerson) {
      const targetG = (config.enginePower / 100) * 0.5;

      // Suavizamos a transição para não ser instantâneo
      gForceEffect = THREE.MathUtils.lerp(gForceEffect, targetG, 0.1);

      // Posição base do cockpit
      // Cálculo para a posição (z) no cockpit não alterar consoante a potência
      const cockpitBasePos = new THREE.Vector3(
        0,
        1.06,
        -0.6 - gForceEffect * 4
      );

      const finalCameraPos = cockpitBasePos.applyMatrix4(airplane.matrixWorld);

      camera.position.copy(finalCameraPos);
      camera.quaternion.copy(airplane.quaternion);
    } else {
      // Câmara de perseguição (OrbitControls manual)
      const planeDelta = new THREE.Vector3().subVectors(
        airplane.position,
        previousPlanePosition
      );
      camera.position.add(planeDelta); // Move a câmara junto com o avião
      controls.target.copy(airplane.position); // Olha sempre para o avião
      controls.update();
    }

    // --- ATUALIZAÇÕES FINAIS ---
    previousPlanePosition.copy(airplane.position); // Guarda posição para o próximo frame
    updateTerrain(airplane.position);

    // Luz segue o avião
    dirLight.position.set(
      airplane.position.x + 50,
      airplane.position.y + 300,
      airplane.position.z + 50
    );
    dirLight.target.position.copy(airplane.position);

    dirLight.target.updateMatrixWorld();

    updateTelemetry();
  }
  previousPlanePosition.copy(airplane.position);
  renderer.render(scene, camera);
}

initHUD();
animate();
