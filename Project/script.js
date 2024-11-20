// Import Three.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Camera controls
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(15, 15, 15);
controls.update();

// Big cube
const bigCubeSize = 10;
const bigCubeGeometry = new THREE.BoxGeometry(bigCubeSize, bigCubeSize, bigCubeSize);
const bigCubeMaterial = new THREE.MeshBasicMaterial({ color: 0x888888, wireframe: true });
const bigCube = new THREE.Mesh(bigCubeGeometry, bigCubeMaterial);
scene.add(bigCube);

// Smaller cube (Inside Cube)
const insideCubeGeometry = new THREE.BoxGeometry(1, 1, 1); // Smaller height
const insideCubeMaterial = new THREE.MeshBasicMaterial({ color: 0x279474 });
const insideCube = new THREE.Mesh(insideCubeGeometry, insideCubeMaterial);
insideCube.position.y = bigCubeSize / 2 - 2.5; // Position at the top edge of the Big Cube
scene.add(insideCube);

// Ball
const ballRadius = 0.5;
const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0, bigCubeSize / 2 - ballRadius, 0); // Start at the top
scene.add(ball);

// Spiral path creation
const spiralRadius = 4; // The radius of the spiral
const spiralHeight = 8; // The height of the spiral (adjusted for your requirement)
const turns = 3; // Number of full turns the spiral will make

const spiralPoints = [];
for (let i = 0; i <= turns * 100; i++) {
    const angle = (i / 100) * Math.PI * 2 * turns;
    const x = spiralRadius * Math.cos(angle);
    const z = spiralRadius * Math.sin(angle);
    const y = (i / 100) * spiralHeight + bigCubeSize / 2 - 1.5; // Starting at the top edge of the smaller cube
    spiralPoints.push(new THREE.Vector3(x, y, z));
}

// Create spiral path visualization
const spiralGeometry = new THREE.BufferGeometry().setFromPoints(spiralPoints);
const spiralMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
const spiralPath = new THREE.Line(spiralGeometry, spiralMaterial);
scene.add(spiralPath);

// Gravity and ball movement along the spiral
let velocityY = 0;
const gravity = -0.01;
let ballProgress = 0; // The progress along the spiral path (0 to 1)
let isFalling = true; // Ball starts falling

function updateBall() {
    if (isFalling && ball.position.y > bigCubeSize / 2 - ballRadius) {
        // Ball is stuck at the top, start moving it down
        velocityY += gravity;
        ball.position.y += velocityY;
    }

    if (ballProgress < 1 && ball.position.y <= bigCubeSize / 2 - 1.5) {
        // Once the ball reaches the top edge of the smaller cube, it starts spiraling
        const pathPoint = spiralPoints[Math.floor(ballProgress * spiralPoints.length)];
        ball.position.set(pathPoint.x, pathPoint.y, pathPoint.z);
        ballProgress += 0.01; // Move along the spiral
    }

    // When the ball reaches the end of the spiral, it starts falling
    if (ballProgress >= 1) {
        velocityY += gravity;
        ball.position.y += velocityY;

        // Check collisions with Big Cube boundaries
        if (ball.position.y - ballRadius < -bigCubeSize / 2) {
            ball.position.y = -bigCubeSize / 2 + ballRadius;
            velocityY = 0; // Stop the ball at the bottom
        }
    }
}

// Interactive cubes (smaller cubes inside the big cube)
const smallerCubes = [];
const smallCubeSize = 1;

for (let i = 0; i < 10; i++) {
    const smallCubeGeometry = new THREE.BoxGeometry(smallCubeSize, smallCubeSize, smallCubeSize);
    const smallCubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const smallCube = new THREE.Mesh(smallCubeGeometry, smallCubeMaterial);

    // Random position inside the Big Cube
    smallCube.position.set(
        (Math.random() - 0.5) * bigCubeSize,
        (Math.random() - 0.5) * bigCubeSize,
        (Math.random() - 0.5) * bigCubeSize
    );

    scene.add(smallCube);
    smallerCubes.push(smallCube);
}

// Interaction logic
function onCubeClick(event) {
    // Convert mouse click to 3D space
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(smallerCubes);

    if (intersects.length > 0) {
        // Example interaction: Change color on click
        intersects[0].object.material.color.set(0xff00ff);
    }
}

window.addEventListener('click', onCubeClick, false);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update controls
    controls.update();

    // Update ball position
    updateBall();

    // Render scene
    renderer.render(scene, camera);
}
animate();
