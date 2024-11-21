import * as THREE from 'three';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x202020); // Set background color
document.body.appendChild(renderer.domElement);

// Add a blue sphere
const sphereGeometry = new THREE.SphereGeometry(5, 32, 32);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x0077ff });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

// Add a red ball
const ballGeometry = new THREE.SphereGeometry(0.2, 16, 16);
const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0, 5, 0); // Position on the sphere
scene.add(ball);

// Physics Variables
const gravity = 1;  // Increased gravity
const ballVelocity = new THREE.Vector3();
const ballBoundingSphere = new THREE.Sphere(ball.position, ball.geometry.parameters.radius);
const speedMultiplier = 5; // Increase this for faster movement

// Apply velocity to the ball's position with speed multiplier
ball.position.add(ballVelocity.multiplyScalar(speedMultiplier));

// Walls and Collision Boxes
const wallBoundingBoxes = [];
const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
for (let i = 0; i < 20; i++) {
  const wallGeometry = new THREE.BoxGeometry(2, 0.2, 0.5);
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);

  // Position walls randomly on the sphere
  const phi = Math.random() * Math.PI * 2;
  const theta = Math.random() * Math.PI;
  const radius = 5.1; // Slightly outside the sphere's surface
  wall.position.set(
    radius * Math.sin(theta) * Math.cos(phi),
    radius * Math.sin(theta) * Math.sin(phi),
    radius * Math.cos(theta)
  );

  // Align walls to the sphere's surface
  wall.lookAt(0, 0, 0);
  sphere.add(wall);

  // Create a bounding box for the wall and store it
  const box = new THREE.Box3().setFromObject(wall);
  wallBoundingBoxes.push({ wall, box });
}

// Apply damping to velocity
const dampingFactor = 0.99; // Damping factor to slow down the velocity slightly every frame

function updateBallPhysics() {
    // Calculate gravity direction based on the camera’s position
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
  
    // Gravity pulls opposite to the camera's view (toward the bottom of the screen)
    const gravityDirection = cameraDirection.negate(); // Inverse direction of camera's forward vector
  
    // Apply gravity force to the ball
    ballVelocity.add(gravityDirection.multiplyScalar(gravity));
  
    // Apply damping to velocity (friction effect)
    ballVelocity.multiplyScalar(dampingFactor);
  
    // Check for collisions with the walls
    for (let i = 0; i < wallBoundingBoxes.length; i++) {
      const wall = wallBoundingBoxes[i];
      if (ballBoundingSphere.intersectsBox(wall.box)) {
        // Wall normal points away from the center of the sphere
        const wallNormal = new THREE.Vector3().subVectors(wall.wall.position, ball.position).normalize();
  
        // Tangent direction along the wall
        const wallTangent = new THREE.Vector3();
        wallTangent.crossVectors(wallNormal, ball.position.clone().normalize()).normalize();
  
        // Project ball's velocity onto the wall's tangent
        const tangentVelocity = wallTangent.multiplyScalar(ballVelocity.dot(wallTangent));
        ballVelocity.copy(tangentVelocity); // Update ball's velocity to only move along the wall
  
        // Ensure ball remains at the correct radius
        ball.position.setLength(5); // Constrain to the sphere's surface
      }
    }
  
    // Apply velocity to the ball's position
    ball.position.add(ballVelocity);
  
    // Keep ball constrained to the sphere's surface
    const distanceFromCenter = ball.position.length();
    if (distanceFromCenter > 5) {
      ball.position.setLength(5); // Constrain to the sphere's surface
    }
  }
  
  // Update Ball Bounding Sphere Position
  function updateBallBoundingSphere() {
    ballBoundingSphere.center.copy(ball.position);
  }


// Add a light
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

// Camera Position
camera.position.set(0, 0, 12);
camera.lookAt(0, 0, 0);

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  // Update ball physics
  updateBallPhysics();
  updateBallBoundingSphere(); // Update the ball's bounding sphere position

  renderer.render(scene, camera);
}

animate();

// Mouse Interaction (for rotating the camera)
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

function onMouseDown() {
  isDragging = true;
}

function onMouseMove(event) {
  if (!isDragging) return;

  const deltaMove = { x: event.movementX, y: event.movementY };

  const rotationSpeed = 0.005;
  const spherical = new THREE.Spherical().setFromVector3(camera.position);

  spherical.theta -= deltaMove.x * rotationSpeed;
  spherical.phi -= deltaMove.y * rotationSpeed;
  spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi)); // Clamp vertical rotation

  camera.position.setFromSpherical(spherical);
  camera.lookAt(0, 0, 0);
}

function onMouseUp() {
  isDragging = false;
}

document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup', onMouseUp);
