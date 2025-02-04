import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

function init() {
  // --- Scene Setup ---
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa0a0a0);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 2);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;

  document.body.appendChild(renderer.domElement);

  // --- Texture Loader and Textures ---
  const textureLoader = new THREE.TextureLoader();
  const floorTexture = textureLoader.load('textures/885.jpg');
  const wallTexture = textureLoader.load('textures/wall2.jpg');
  const ceilingTexture = textureLoader.load('textures/wall2.jpg');

  // Configure texture wrapping and repeat values
  [floorTexture, wallTexture, ceilingTexture].forEach(tex => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  });
  floorTexture.repeat.set(20, 20);
  wallTexture.repeat.set(7, 1);
  ceilingTexture.repeat.set(10, 10);

  // --- Classroom Room ---
  const roomMaterials = [
    new THREE.MeshStandardMaterial({ map: wallTexture, side: THREE.BackSide }),    // Left wall
    new THREE.MeshStandardMaterial({ map: wallTexture, side: THREE.BackSide }),    // Right wall
    new THREE.MeshStandardMaterial({ map: ceilingTexture, side: THREE.BackSide }),   // Ceiling
    new THREE.MeshStandardMaterial({ map: floorTexture, side: THREE.BackSide }),     // Floor
    new THREE.MeshStandardMaterial({ map: wallTexture, side: THREE.BackSide }),      // Back wall
    new THREE.MeshStandardMaterial({ map: wallTexture, side: THREE.BackSide })       // Front wall
  ];
  const roomGeometry = new THREE.BoxGeometry(1, 4, 1);
  const classroom = new THREE.Mesh(roomGeometry, roomMaterials);
  classroom.receiveShadow = true;
  scene.add(classroom);

  // --- Helper Function to Load GLTF Models ---
  /**
   * Loads a GLTF model and applies configuration options.
   * @param {string} url - The URL of the GLTF model.
   * @param {Object} options - Options for configuring the model.
   * @param {THREE.Vector3} [options.scale] - Scale of the model.
   * @param {THREE.Vector3} [options.position] - Position of the model.
   * @param {THREE.Vector3} [options.rotation] - Euler rotation (in radians).
   * @param {function} [options.onLoad] - Callback once the model is loaded.
   */
  function loadModel(url, { 
    scale = new THREE.Vector3(1, 1, 1), 
    position = new THREE.Vector3(), 
    rotation = new THREE.Vector3(), 
    onLoad = () => {} 
  } = {}) {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        model.scale.copy(scale);
        model.position.copy(position);
        model.rotation.set(rotation.x, rotation.y, rotation.z);
        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        scene.add(model);
        onLoad(model);
      },
      undefined,
      (error) => {
        console.error(`Error loading model from ${url}:`, error);
      }
    );
  }

  // --- Function to Spawn Furniture ---
  function spawnFurniture(offset) {
    loadModel('models/school_desk.glb', {
      scale: new THREE.Vector3(4, 3, 4),
      position: new THREE.Vector3(0, -2, -0.6).add(offset)
    });
    // Load two chairs with different positions relative to the offset
    loadModel('models/school_chair.glb', {
      scale: new THREE.Vector3(3, 3, 3),
      position: new THREE.Vector3(-1, -2, -0.5).add(offset),
      rotation: new THREE.Vector3(0, -Math.PI, 0)
    });
    loadModel('models/school_chair.glb', {
      scale: new THREE.Vector3(3, 3, 3),
      position: new THREE.Vector3(-1.8, -2, -0.5).add(offset),
      rotation: new THREE.Vector3(0, -Math.PI, 0)
    });
  }

  // --- Spawn Multiple Furniture Sets ---
  const furnitureOffsets = [
    new THREE.Vector3(2, 0, 2),
    new THREE.Vector3(-2, 0, 2),
    new THREE.Vector3(2, 0, 0),
    new THREE.Vector3(-2, 0, 0),
    new THREE.Vector3(2, 0, -2),
    new THREE.Vector3(-2, 0, -2),
    new THREE.Vector3(2, 0, -4),
    new THREE.Vector3(-2, 0, -4)
  ];
  furnitureOffsets.forEach(offset => spawnFurniture(offset));

  // --- Additional Desk and Chair ---
  loadModel('models/school_desk.glb', {
    scale: new THREE.Vector3(4, 3, 4),
    position: new THREE.Vector3(-2, -2, 4),
    rotation: new THREE.Vector3(0, -Math.PI, 0)
  });
  loadModel('models/school_chair.glb', {
    scale: new THREE.Vector3(3, 3, 3),
    position: new THREE.Vector3(-0.5, -2, 4.2),
    rotation: new THREE.Vector3(0, 20, 0)
  });

  // --- Door Model ---
  loadModel('models/door.glb', {
    scale: new THREE.Vector3(3, 3, 3),
    position: new THREE.Vector3(-2.5, -2, 7.3)
  });

  // --- Function to Add a Window Light ---
  /**
   * Adds a spotlight simulating sunlight coming through a window.
   * @param {THREE.Vector3} lightPos - The position of the spotlight.
   * @param {THREE.Vector3} targetPos - The target position the light is pointing to.
   */
  function addWindowLight(lightPos, targetPos) {
    const spotLight = new THREE.SpotLight(0xfdfbd3, 3, 50, Math.PI / 1, 0.5, 2);
    spotLight.position.copy(lightPos);
    spotLight.target.position.copy(targetPos);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    scene.add(spotLight);
    scene.add(spotLight.target);
  }

  // --- Function to Add a Skybox Cube Behind a Window ---
  function addSkyboxCube(position) {
    const skyboxTexture = textureLoader.load('textures/sky.jpg');
    const skyboxMaterial = new THREE.MeshBasicMaterial({ map: skyboxTexture, side: THREE.BackSide });
    const skyboxGeometry = new THREE.BoxGeometry(0.01, 1.2, 1.9);
    const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
    skybox.position.copy(position);
    scene.add(skybox);
  }

  // --- Windows Models with Skybox Cubes and Window Lights ---
  const windowPositions = [
    { modelPos: new THREE.Vector3(4.4, -1, 5), lightPos: new THREE.Vector3(4.4, 0, 5), targetPos: new THREE.Vector3(3, -2, 5) },
    { modelPos: new THREE.Vector3(4.4, -1, 2), lightPos: new THREE.Vector3(4.4, 0, 2), targetPos: new THREE.Vector3(3, -2, 2) },
    { modelPos: new THREE.Vector3(4.4, -1, -1), lightPos: new THREE.Vector3(4.4, 0, -1), targetPos: new THREE.Vector3(3, -2, -1) },
    { modelPos: new THREE.Vector3(4.4, -1, -4), lightPos: new THREE.Vector3(4.4, 0, -4), targetPos: new THREE.Vector3(3, -2, -4) },
  ];

  windowPositions.forEach(win => {
    loadModel('models/window.glb', {
      scale: new THREE.Vector3(0.07, 0.07, 0.07),
      rotation: new THREE.Vector3(0, -Math.PI / 2, 0),
      position: win.modelPos,
      onLoad: () => {
        // Modify skybox position to be 1 unit higher in Y
        const skyboxPos = win.modelPos.clone().setX(win.modelPos.x + 0.05).setY(win.modelPos.y + 0.9);
        addSkyboxCube(skyboxPos);
        // Add window light using the helper function
        addWindowLight(win.lightPos, win.targetPos);
      }
    });
  });

  // --- Bookcase Model ---
  loadModel('models/bookcase.glb', {
    scale: new THREE.Vector3(5, 3.5, 3.5),
    position: new THREE.Vector3(4, -2, 6.5)
  });

    // --- Bookcase Model ---
    loadModel('models/bookcase.glb', {
      scale: new THREE.Vector3(5, 3.5, 3.5),
      position: new THREE.Vector3(1.5, -2, 6.5)
    });


  // --- Function to Add a Flickering Candle Light ---
function addCandleLight(position) {
  const candleLight = new THREE.PointLight(0xffa500, 2, 5); // Warm orange light
  candleLight.position.copy(position);
  candleLight.castShadow = true;
  candleLight.shadow.mapSize.width = 512;
  candleLight.shadow.mapSize.height = 512;

  scene.add(candleLight);

  // Create a flickering effect
  function flickerLight() {
    candleLight.intensity = 1.5 + Math.random() * 0.5; // Random intensity between 1.5 and 2
    candleLight.position.y = position.y + Math.random() * 0.05; // Slight movement
    requestAnimationFrame(flickerLight);
  }
  flickerLight();
}

// --- Load Candle Model ---
loadModel('models/Candle.glb', {
  scale: new THREE.Vector3(0.5, 0.5, 0.5),
  position: new THREE.Vector3(-4, -0.8, -4), // Adjust as needed
  onLoad: (candle) => {
    // Add the flickering light slightly above the candle wick
    addCandleLight(new THREE.Vector3(candle.position.x, candle.position.y + 0.3, candle.position.z));
  }
});

loadModel('models/Candle.glb', {
  scale: new THREE.Vector3(0.5, 0.5, 0.5),
  position: new THREE.Vector3(-3, -0.8, -2), // Adjust as needed
  onLoad: (candle) => {
    // Add the flickering light slightly above the candle wick
    addCandleLight(new THREE.Vector3(candle.position.x, candle.position.y + 0.3, candle.position.z));
  }
});

loadModel('models/Candle.glb', {
  scale: new THREE.Vector3(0.5, 0.5, 0.5),
  position: new THREE.Vector3(-4, -0.8, -0.5), // Adjust as needed
  onLoad: (candle) => {
    // Add the flickering light slightly above the candle wick
    addCandleLight(new THREE.Vector3(candle.position.x, candle.position.y + 0.3, candle.position.z));
  }
});

loadModel('models/Candle.glb', {
  scale: new THREE.Vector3(0.5, 0.5, 0.5),
  position: new THREE.Vector3(-3.5, -0.8, 2), // Adjust as needed
  onLoad: (candle) => {
    // Add the flickering light slightly above the candle wick
    addCandleLight(new THREE.Vector3(candle.position.x, candle.position.y + 0.3, candle.position.z));
  }
});



loadModel('models/Candle.glb', {
  scale: new THREE.Vector3(0.5, 0.5, 0.5),
  position: new THREE.Vector3(0.9, -0.8, -4), // Adjust as needed
  onLoad: (candle) => {
    // Add the flickering light slightly above the candle wick
    addCandleLight(new THREE.Vector3(candle.position.x, candle.position.y + 0.3, candle.position.z));
  }
});

loadModel('models/Candle.glb', {
  scale: new THREE.Vector3(0.5, 0.5, 0.5),
  position: new THREE.Vector3(1.5, -0.8, -2), // Adjust as needed
  onLoad: (candle) => {
    // Add the flickering light slightly above the candle wick
    addCandleLight(new THREE.Vector3(candle.position.x, candle.position.y + 0.3, candle.position.z));
  }
});

loadModel('models/Candle.glb', {
  scale: new THREE.Vector3(0.5, 0.5, 0.5),
  position: new THREE.Vector3(1, -0.8, -0.5), // Adjust as needed
  onLoad: (candle) => {
    // Add the flickering light slightly above the candle wick
    addCandleLight(new THREE.Vector3(candle.position.x, candle.position.y + 0.3, candle.position.z));
  }
});

loadModel('models/Candle.glb', {
  scale: new THREE.Vector3(0.5, 0.5, 0.5),
  position: new THREE.Vector3(1, -0.8, 2), // Adjust as needed
  onLoad: (candle) => {
    // Add the flickering light slightly above the candle wick
    addCandleLight(new THREE.Vector3(candle.position.x, candle.position.y + 0.3, candle.position.z));
  }
});



  // --- Sky Setup ---
  const sky = new Sky();
  sky.scale.setScalar(450000);
  scene.add(sky);
  
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
  
  // --- Orbit Controls ---
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  // --- Animation Loop ---
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // --- Responsive Resize ---
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

init();
