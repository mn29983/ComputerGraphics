import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { initEnvironment } from "./environment.js";
import { setupAnimations } from "./animations.js";
import { setupControls } from "./controls.js";

let scene, camera, renderer, clock, mixer, spotlight, player, actions = {};
let keys = { w: false, a: false, s: false, d: false, shift: false };
let gameStarted = false, gameOver = false, timer = 0, timerInterval;
const moveSpeed = 5, runMultiplier = 2;
const objects = [];

function init() {
  // Core elements
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    95,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 10, -10);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  // Environment setup
  initEnvironment(scene, objects);

  // Load Maze Model
  const mazeLoader = new GLTFLoader();
  mazeLoader.load("models/Maze.glb", (gltf) => {
    const maze = gltf.scene;
    maze.position.set(0, 3, 0); // Adjust position if necessary
    maze.scale.set(100, 50, 100); // Scale the maze 10 times bigger

    scene.add(maze);

    // Add walls from maze to objects for collision
    maze.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        objects.push(child); // Add each mesh in the maze to the objects array
      }
    });

    console.log("Maze loaded:", maze);
  });

  // Player setup
  const loader = new GLTFLoader();
  loader.load("models/RobotExpressive.glb", (gltf) => {
    console.log("Model loaded:", gltf);
    player = gltf.scene;
    player.position.set(0, 0, 0);
    scene.add(player);

    mixer = new THREE.AnimationMixer(player);
    setupAnimations(gltf.animations, mixer, actions);

    // Default animation
    actions["Idle"].play();

    // Spotlight
    spotlight = new THREE.SpotLight(0xffffff, 1);
    spotlight.position.set(0, 10, 0); // Initial position
    spotlight.angle = Math.PI / 6;
    spotlight.penumbra = 0.5;
    spotlight.target = player; // Spotlight focuses on the player
    scene.add(spotlight);
  });

  // UI setup
  initUI();

  // Controls setup
  setupControls(keys);

  // Window resize handling
  window.addEventListener("resize", onWindowResize);

  animate();
}


function initUI() {
  document.getElementById("start-button").addEventListener("click", () => {
    gameStarted = true;
    document.getElementById("start-screen").classList.add("hidden");
    timer = 0;
    timerInterval = setInterval(() => {
      timer++;
      document.getElementById("timer").textContent = `Time: ${timer}s`;
    }, 1000);
  });

  document.getElementById("restart-button").addEventListener("click", () => {
    window.location.reload();
  });
}

function checkCollisions() {
  if (!player) return;

  const playerBox = new THREE.Box3().setFromObject(player);

  for (const object of objects) {
    const objectBox = new THREE.Box3().setFromObject(object);

    if (playerBox.intersectsBox(objectBox)) {
      if (object.name === "Endpoint") {
        // Win condition
        gameOver = true;
        clearInterval(timerInterval);
        document.getElementById("end-message").textContent = "You Win!";
        document.getElementById("end-screen").classList.remove("hidden");
        return;
      } else if (object.name === "Trap") {
        // Trap condition
        gameOver = true;
        clearInterval(timerInterval);
        document.getElementById("end-message").textContent = "You Died!";
        document.getElementById("end-screen").classList.remove("hidden");
        return;
      }
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (gameStarted && !gameOver && player) {
    const velocity = new THREE.Vector3();
    if (keys.w) velocity.z = moveSpeed * delta;
    if (keys.s) velocity.z = -moveSpeed * delta;
    if (keys.a) velocity.x = moveSpeed * delta;
    if (keys.d) velocity.x = -moveSpeed * delta;

    if (keys.shift) velocity.multiplyScalar(runMultiplier);

    if (velocity.length() > 0) {
      player.position.add(velocity);
      player.lookAt(player.position.clone().add(velocity));

      // Handle animations
      if (keys.shift && actions["Running"]) {
        if (actions["Walking"] && actions["Walking"].isRunning()) actions["Walking"].stop();
        if (!actions["Running"].isRunning()) actions["Running"].play();
      } else if (actions["Walking"]) {
        if (actions["Running"] && actions["Running"].isRunning()) actions["Running"].stop();
        if (!actions["Walking"].isRunning()) actions["Walking"].play();
      }
    } else {
      if (actions["Walking"] && actions["Walking"].isRunning()) actions["Walking"].stop();
      if (actions["Running"] && actions["Running"].isRunning()) actions["Running"].stop();
      if (actions["Idle"] && !actions["Idle"].isRunning()) actions["Idle"].play();
    }

    spotlight.position.set(
      player.position.x,
      player.position.y + 10,
      player.position.z
    );

    spotlight.target.position.set(
      player.position.x,
      player.position.y,
      player.position.z
    );
    spotlight.target.updateMatrixWorld();



    // Update camera position to follow the player 
    const cameraOffset = new THREE.Vector3(0, 9, -9); // Adjust this for desired angle
    const targetPosition = player.position.clone().add(cameraOffset);
    camera.position.lerp(targetPosition, 0.1); // Smooth follow
    camera.lookAt(player.position);

    mixer.update(delta);
    checkCollisions();
  }

  renderer.render(scene, camera);
}



function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
