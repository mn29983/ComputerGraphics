import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 10, 25);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);

// Sphere (Game Area)
const sphereGeometry = new THREE.SphereGeometry(15, 64, 64);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x0077ff });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

// Player Robot Model
const loader = new GLTFLoader();
let player;
loader.load(
  'models/RobotExpressive.glb',
  (gltf) => {
    player = gltf.scene;
    player.scale.set(0.1, 0.1, 0.1); // Scale the robot down
    player.position.set(0, 15, 0); // Place on the sphere
    scene.add(player);
  },
  undefined,
  (error) => {
    console.error('Error loading model:', error);
  }
);

// Walls (optional obstacles)
const walls = [];
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
for (let i = 0; i < 30; i++) {
  const wallGeometry = new THREE.BoxGeometry(1, 1.5, 0.5);
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);

  const phi = Math.random() * Math.PI * 2;
  const theta = Math.random() * Math.PI;
  const radius = 15.2;

  wall.position.set(
    radius * Math.sin(theta) * Math.cos(phi),
    radius * Math.sin(theta) * Math.sin(phi),
    radius * Math.cos(theta)
  );
  wall.lookAt(0, 0, 0);
  sphere.add(wall);
  walls.push(wall); // Optional: Keep track of walls for collision detection
}

// Endpoint
const endGeometry = new THREE.CylinderGeometry(1, 1, 2, 32);
const endMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000 });
const endPoint = new THREE.Mesh(endGeometry, endMaterial);
endPoint.position.set(0, -15.2, 0);
scene.add(endPoint);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const spotlight = new THREE.SpotLight(0xffffff, 1, 20, Math.PI / 10, 0.2);
scene.add(spotlight);

// Player Movement Parameters
let playerDirection = new THREE.Vector3(); // Direction for movement
const moveSpeed = 0.1; // Movement speed

// Keyboard Input
const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };

document.addEventListener('keydown', (event) => {
  keys[event.key] = true;
});

document.addEventListener('keyup', (event) => {
  keys[event.key] = false;
});

// Player Movement
function movePlayerWithKeys() {
  if (!player) return;

  const movement = new THREE.Vector3();

  // Calculate movement direction
  if (keys.w || keys.ArrowUp) movement.z -= 1;
  if (keys.s || keys.ArrowDown) movement.z += 1;
  if (keys.a || keys.ArrowLeft) movement.x -= 1;
  if (keys.d || keys.ArrowRight) movement.x += 1;

  // Apply movement
  if (movement.length() > 0) {
    movement.normalize().multiplyScalar(moveSpeed);
    playerDirection.add(movement);
  }

  // Keep the player on the sphere surface
  const newPosition = player.position.clone().add(playerDirection);
  newPosition.normalize().multiplyScalar(15); // Constrain to sphere surface
  player.position.copy(newPosition);

  // Orient player to face the camera
  player.lookAt(camera.position);
}

// Camera and Spotlight
function updateCameraPosition() {
  if (!player) return;

  const offset = new THREE.Vector3(0, 10, 10); // Offset for top-down view
  camera.position.copy(player.position.clone().add(offset));
  camera.lookAt(player.position);

  // Spotlight follows the camera
  spotlight.position.copy(camera.position);
  spotlight.target = player;
}

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  movePlayerWithKeys(); // Handle player movement
  updateCameraPosition(); // Update camera and spotlight
  renderer.render(scene, camera);
}

// Start Animation Loop
animate();
