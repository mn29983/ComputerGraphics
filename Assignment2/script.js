import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

// Scene and Camera Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0a0a0);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 2);

// Renderer Setup with High-DPI support and Shadow Mapping
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// Load Textures
const floorTexture = textureLoader.load('textures/floor2.jpg');
const wallTexture = textureLoader.load('textures/wall2.jpg');
const ceilingTexture = textureLoader.load('textures/floor2.jpg');

// Set textures to repeat instead of stretch
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
ceilingTexture.wrapS = ceilingTexture.wrapT = THREE.RepeatWrapping;

// Adjust repeat values based on face dimensions (tweak these as needed)
floorTexture.repeat.set(10, 10);      // For a floor face of size 30 x 20
wallTexture.repeat.set(100, 100);       // For wall faces (e.g., 30 x 5)
ceilingTexture.repeat.set(6, 1);    // For the ceiling

// Classroom Room (Cube) with Different Textures on Each Face
const materials = [
    new THREE.MeshStandardMaterial({ map: wallTexture, side: THREE.BackSide }),    // Left wall
    new THREE.MeshStandardMaterial({ map: wallTexture, side: THREE.BackSide }),    // Right wall
    new THREE.MeshStandardMaterial({ map: ceilingTexture, side: THREE.BackSide }),   // Ceiling
    new THREE.MeshStandardMaterial({ map: floorTexture, side: THREE.BackSide }),     // Floor
    new THREE.MeshStandardMaterial({ map: wallTexture, side: THREE.BackSide }),      // Back wall
    new THREE.MeshStandardMaterial({ map: wallTexture, side: THREE.BackSide })       // Front wall
];
const roomGeometry = new THREE.BoxGeometry(8, 3, 15);
const classroom = new THREE.Mesh(roomGeometry, materials);
classroom.receiveShadow = true;
scene.add(classroom);

// Add a Glass Window on the Back Wall
const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xaaaaff,
    transmission: 0.9,
    transparent: true,
    roughness: 0.1,
    metalness: 0,
});
const windowGeometry = new THREE.PlaneGeometry(4, 2);
const windowMesh = new THREE.Mesh(windowGeometry, glassMaterial);
windowMesh.position.set(0, 1, -9.9);
scene.add(windowMesh);

// Add Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const overheadLight = new THREE.PointLight(0xffffff, 1, 20);
overheadLight.position.set(0, 4, 0);
overheadLight.castShadow = true;
overheadLight.shadow.mapSize.width = 1024;
overheadLight.shadow.mapSize.height = 1024;
scene.add(overheadLight);

// Load Models (Desk and Chairs)
const loader = new GLTFLoader();

// Function to spawn a desk and two chairs with an offset
function spawnFurniture(offset) {
    // Use the same loader instance or create a new one
    const loader = new GLTFLoader();
  
    // Load the desk model
    loader.load(
      'models/school_desk.glb',
      (gltf) => {
        const desk = gltf.scene;
        desk.scale.set(2, 1, 1);
        // Original desk position is set to (0, -1.5, 0)
        desk.position.copy(new THREE.Vector3(0, -1.5, 0)).add(offset);
        desk.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        scene.add(desk);
      },
      undefined,
      (error) => {
        console.error('Error loading desk model:', error);
      }
    );
  
    // Load the chair model and spawn two chairs
    loader.load(
      'models/school_chair.glb',
      (gltf) => {
        const chair = gltf.scene;
        chair.scale.set(1, 1, 1);
        chair.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        // Clone to create two chairs
        const chair1 = chair.clone();
        const chair2 = chair.clone();
        // Original positions for chairs before offset:
        // chair1 at (-0.5, -1.5, -0.5) and chair2 at (0.5, -1.5, -0.5)
        chair1.position.copy(new THREE.Vector3(-0.5, -1.5, -0.5)).add(offset);
        chair2.position.copy(new THREE.Vector3(0.5, -1.5, -0.5)).add(offset);
        scene.add(chair1);
        scene.add(chair2);
      },
      undefined,
      (error) => {
        console.error('Error loading chair model:', error);
      }
    );
  }

spawnFurniture(new THREE.Vector3(2, 0, 2));
spawnFurniture(new THREE.Vector3(-2, 0, 2));

spawnFurniture(new THREE.Vector3(2, 0, 0));
spawnFurniture(new THREE.Vector3(-2, 0, 0));

spawnFurniture(new THREE.Vector3(2, 0, -2));
spawnFurniture(new THREE.Vector3(-2, 0, -2));

spawnFurniture(new THREE.Vector3(2, 0, -4));
spawnFurniture(new THREE.Vector3(-2, 0, -4));


loader.load(
    'models/school_desk.glb',
    (gltf) => {
      const desk = gltf.scene;
      desk.scale.set(2, 1, 1);
      desk.position.copy(new THREE.Vector3(2, -1.5, 4));
      desk.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(desk);
    },
    undefined,
    (error) => {
      console.error('Error loading desk model:', error);
    }
  );

  // Load the chair model and spawn two chairs
  loader.load(
    'models/school_chair.glb',
    (gltf) => {
      const chair = gltf.scene;
      chair.scale.set(1, 1, 1);
      chair.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      // Clone to create two chairs
      const chair1 = chair.clone();
      chair1.position.copy(new THREE.Vector3(2, -1.5, 4));
      scene.add(chair1);
    },
    undefined,
    (error) => {
      console.error('Error loading chair model:', error);
    }
  );

// Add a Sky using Three.js Sky Object
const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);

// Configure Sky Shader Uniforms for realistic atmosphere
const skyUniforms = sky.material.uniforms;
const sun = new THREE.Vector3();
const phi = THREE.MathUtils.degToRad(90);
const theta = THREE.MathUtils.degToRad(180);
sun.setFromSphericalCoords(1, phi, theta);
skyUniforms['sunPosition'].value.copy(sun);
skyUniforms['turbidity'].value = 10;
skyUniforms['rayleigh'].value = 2;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.8;

// OrbitControls with Damping
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Responsive Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
