import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Core Elements
let scene, camera, renderer, clock, mixer, player;
let walls = [], endpoint, gameStarted = false, gameOver = false;
const moveSpeed = 2;
const keys = { w: false, s: false, a: false, d: false, c: false };

// UI Elements
const startScreen = document.getElementById("start-screen");
const gameUI = document.getElementById("game-ui");
const endScreen = document.getElementById("end-screen");
const timerText = document.getElementById("timer");
const endMessage = document.getElementById("end-message");
let timer = 0, timerInterval;

// Initialize Scene
function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, -10);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0, 10, 10);
  scene.add(directionalLight);

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x808080 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Load Player Model
  const loader = new GLTFLoader();
  loader.load("models/RobotExpressive.glb", (gltf) => {
    player = gltf.scene;
    mixer = new THREE.AnimationMixer(player);
    scene.add(player);
    player.position.y = 0.5;

    setupAnimations(gltf.animations);
  });

  // Walls and Endpoint
  createWalls();
  createEndpoint();

  // Clock
  clock = new THREE.Clock();

  // Event Listeners
  window.addEventListener("resize", onWindowResize);
  document.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
  document.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

  // Start Game Button
  document.getElementById("start-button").addEventListener("click", startGame);
  document.getElementById("restart-button").addEventListener("click", restartGame);

  animate();
}

// Setup Animations
let actions = {};
function setupAnimations(animations) {
  animations.forEach((clip) => {
    actions[clip.name] = mixer.clipAction(clip);
  });
  setActiveAnimation("Idle");
}

function setActiveAnimation(name) {
  Object.keys(actions).forEach((key) => actions[key].stop());
  actions[name].reset().play();
}

// Create Walls
function createWalls() {
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  for (let i = 0; i < 10; i++) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), wallMaterial);
    wall.position.set(Math.random() * 50 - 25, 1, Math.random() * 50 - 25);
    walls.push(wall);
    scene.add(wall);
  }
}

// Create Endpoint
function createEndpoint() {
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  endpoint = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 32), material);
  endpoint.position.set(20, 1, 20);
  scene.add(endpoint);
}

// Start Game
function startGame() {
  startScreen.classList.add("hidden");
  gameUI.classList.remove("hidden");
  gameStarted = true;
  timer = 0;
  timerInterval = setInterval(() => {
    timer++;
    timerText.textContent = `Time: ${timer}s`;
  }, 1000);
}

// Restart Game
function restartGame() {
  window.location.reload();
}

// Handle Player Movement
const velocity = new THREE.Vector3();
function movePlayer(delta) {
  if (!player || !gameStarted) return;

  velocity.set(0, 0, 0);
  const direction = new THREE.Vector3();

  if (keys.w) direction.z = 1;
  if (keys.s) direction.z = -1;
  if (keys.a) direction.x = 1;
  if (keys.d) direction.x = -1;

  if (keys.c) setActiveAnimation("Jump");

  direction.normalize().multiplyScalar(moveSpeed * delta);
  velocity.add(direction);

  player.position.add(velocity);
  player.lookAt(player.position.clone().add(direction));

  if (direction.length() > 0) setActiveAnimation("Walking");
  else setActiveAnimation("Idle");
}

// Check Collisions
function checkCollisions() {
  if (walls.some((wall) => wall.position.distanceTo(player.position) < 1.5)) {
    endGame(false);
  }

  if (endpoint.position.distanceTo(player.position) < 1.5) {
    endGame(true);
  }
}

// End Game
function endGame(won) {
  gameOver = true;
  gameStarted = false;
  clearInterval(timerInterval);
  gameUI.classList.add("hidden");
  endScreen.classList.remove("hidden");
  endMessage.textContent = won ? "You Won!" : "You Lost!";
}

// Handle Window Resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (gameStarted && !gameOver) {
    movePlayer(delta);
    checkCollisions();
  }

  if (mixer) mixer.update(delta);

  camera.position.lerp(
    player.position.clone().add(new THREE.Vector3(0, 8, -10)),
    0.1
  );
  camera.lookAt(player.position);

  renderer.render(scene, camera);
}

init();