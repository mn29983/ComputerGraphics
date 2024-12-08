import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { initEnvironment } from "./environment.js";
import { setupAnimations } from "./animations.js";
import { setupControls } from "./controls.js";

let scene, camera, renderer, clock, mixer, spotlight, player, actions = {};
let keys = { w: false, a: false, s: false, d: false, shift: false };
let gameStarted = false, gameOver = false, timer = 0, timerInterval;
const moveSpeed = 5, runMultiplier = 2;
const objects = [];
let freeCameraEnabled = false;
let freeCamera, freeCameraControls;
let playerBox, playerHelper; // Player collider and helper
let playerMesh;

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

  // Free camera
  freeCamera = new THREE.PerspectiveCamera(
    95,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  freeCamera.position.set(0, 20, 20);
  freeCameraControls = new OrbitControls(freeCamera, renderer.domElement);
  freeCameraControls.enabled = false;

  // Environment setup
  initEnvironment(scene, objects);

  // Load Maze Model
  const mazeLoader = new GLTFLoader();
  mazeLoader.load("models/Maze.glb", (gltf) => {
    const maze = gltf.scene;
    maze.position.set(0, 3, 0);
    maze.scale.set(1, 1, 1);
    scene.add(maze);

    // Add walls to collision objects
    maze.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        objects.push(child);
      }
    });
    console.log("Maze loaded:", maze);
  });

  // Load Player Model
  const loader = new GLTFLoader();
  loader.load("models/RobotExpressive.glb", (gltf) => {
    player = gltf.scene;
    player.position.set(10, 0.1, -90);
    scene.add(player);
  
    // Find the main mesh and compute the initial bounding box
    player.traverse((child) => {
      if (child.isMesh) {
        playerMesh = child; // Assume this is the main mesh
        playerMesh.geometry.computeBoundingBox(); // Compute the geometry's bounding box
      }
    });
  
    if (playerMesh) {
      const box = playerMesh.geometry.boundingBox.clone(); // Local bounding box
      playerBox = new THREE.Box3(
        box.min.clone().applyMatrix4(playerMesh.matrixWorld), // Transform to world space
        box.max.clone().applyMatrix4(playerMesh.matrixWorld)
      );
  
      // Create a helper to visualize the bounding box
      playerHelper = new THREE.Box3Helper(playerBox, 0x00ff00); // Green debug box
      scene.add(playerHelper);
    }
  
    mixer = new THREE.AnimationMixer(player);
    setupAnimations(gltf.animations, mixer, actions);
    actions["Idle"].play();
  
    // Spotlight setup
    spotlight = new THREE.SpotLight(0xffffff, 1, 50, Math.PI / 4, 0.5);
    spotlight.position.set(0, 20, 0);
    spotlight.target = player;
    scene.add(spotlight);
  });
  

  // UI setup
  initUI();

  // Controls setup
  setupControls(keys);

  // Window resize handling
  window.addEventListener("resize", onWindowResize);

  document.addEventListener("keydown", (event) => {
    if (event.key === "c") toggleFreeCamera();
  });

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

function toggleFreeCamera() {
  freeCameraEnabled = !freeCameraEnabled;
  freeCameraControls.enabled = freeCameraEnabled;
}

function updatePlayerCollider() {
  if (playerMesh) {
    // Get the player's bounding box from its geometry
    const boundingBox = playerMesh.geometry.boundingBox.clone();
    
    // Apply world transformations
    playerBox.set(
      boundingBox.min.clone().applyMatrix4(playerMesh.matrixWorld),
      boundingBox.max.clone().applyMatrix4(playerMesh.matrixWorld)
    );

    // Scale the bounding box if it doesn't fully encapsulate the model
    const sizeBuffer = new THREE.Vector3(0.5, 0.5, 0.5); // Adjust these values as needed
    playerBox.expandByVector(sizeBuffer);

    // Update the helper to match the updated bounding box
    playerHelper.box.copy(playerBox);
  }
}



function checkCollisions() {
  if (!player) return;

  for (const object of objects) {
    const objectBox = new THREE.Box3().setFromObject(object);

    if (playerBox.intersectsBox(objectBox)) {
      if (object.name === "Endpoint") {
        gameOver = true;
        clearInterval(timerInterval);
        document.getElementById("end-message").textContent = "You Win!";
        document.getElementById("end-screen").classList.remove("hidden");
        return;
      } else if (object.name === "Trap") {
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
  
  if (freeCameraEnabled) {
    freeCameraControls.update();
    renderer.render(scene, freeCamera);
  } else {
    if (gameStarted && !gameOver && player) {
      updatePlayerCollider();

      // Camera follow logic
      const cameraOffset = new THREE.Vector3(0, 9, -9);
      const targetPosition = player.position.clone().add(cameraOffset);
      camera.position.lerp(targetPosition, 0.1);
      camera.lookAt(player.position);

      // Player movement logic
      const velocity = new THREE.Vector3();
      if (keys.w) velocity.z = moveSpeed * delta;
      if (keys.s) velocity.z = -moveSpeed * delta;
      if (keys.a) velocity.x = moveSpeed * delta;
      if (keys.d) velocity.x = -moveSpeed * delta;
      if (keys.shift) velocity.multiplyScalar(runMultiplier);

      if (velocity.length() > 0) {
        const nextPosition = player.position.clone().add(velocity);
        
        // Create a temporary collider to simulate the player's next position
        const nextBox = playerBox.clone().translate(velocity);
  
        // Shrink the collider slightly to prevent getting stuck
        const shrinkVector = new THREE.Vector3(0.1, 0.1, 0.1); // Adjust as needed
        nextBox.expandByVector(shrinkVector.negate());
  
        // Check for collisions
        let canMove = true;
        for (const object of objects) {
          const objectBox = new THREE.Box3().setFromObject(object);
          if (nextBox.intersectsBox(objectBox)) {
            canMove = false;
            break;
          }
        }
  
        // Move the player if there's no collision
        if (canMove) {
          player.position.copy(nextPosition);
          player.lookAt(player.position.clone().add(velocity));
        }
      

        if (canMove) {
          player.position.copy(nextPosition);
          player.lookAt(player.position.clone().add(velocity));
        }

        // Animations
        if (keys.shift && actions["Running"]) {
          actions["Walking"]?.stop();
          actions["Running"]?.play();
        } else if (actions["Walking"]) {
          actions["Running"]?.stop();
          actions["Walking"]?.play();
        }
      } else {
        actions["Walking"]?.stop();
        actions["Running"]?.stop();
        actions["Idle"]?.play();
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
    }

    mixer?.update(delta);
    checkCollisions();
    renderer.render(scene, camera);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  freeCamera.aspect = window.innerWidth / window.innerHeight;
  freeCamera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
