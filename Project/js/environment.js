import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function initEnvironment(scene, objects) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0);
    const loader = new GLTFLoader();
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    const rows = 20;
    const cols = 20;
    const wallSpacing = 10;
    const wallHeight = 5;

    const mazeGrid = Array.from({ length: rows }, () => Array(cols).fill(true));

    const directions = [
        { x: 0, z: -1 },
        { x: 1, z: 0 },
        { x: 0, z: 1 },
        { x: -1, z: 0 },
    ];

    function shuffleDirections() {
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }
    }

    function carvePath(x, z) {
        mazeGrid[x][z] = false;
        shuffleDirections();
        for (let dir of directions) {
            const nx = x + dir.x * 2;
            const nz = z + dir.z * 2;
            if (nx >= 0 && nz >= 0 && nx < rows && nz < cols && mazeGrid[nx][nz] === true) {
                mazeGrid[x + dir.x][z + dir.z] = false;
                carvePath(nx, nz);
            }
        }
    }

    carvePath(1, 1);

    const textureLoader = new THREE.TextureLoader();
    const wallTexture = textureLoader.load('models/Brick.jpg');
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(1, 1);

    const wallGeometry = new THREE.BoxGeometry(wallSpacing, wallHeight, wallSpacing);
    const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture });

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (mazeGrid[row][col] === true) {
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                wall.position.set(col * wallSpacing, wallHeight / 2, row * wallSpacing);
                scene.add(wall);
                objects.push(wall);
            }
        }
    }

    const validPositions = [];
    for (let row = 1; row < rows - 1; row++) {
        for (let col = 1; col < cols - 1; col++) {
            if (!mazeGrid[row][col]) {
                validPositions.push({ x: col * wallSpacing, z: row * wallSpacing });
            }
        }
    }

    function getRandomValidPosition() {
        if (validPositions.length === 0) return { x: 0, z: 0 };
        const index = Math.floor(Math.random() * validPositions.length);
        return validPositions.splice(index, 1)[0];
    }

  //  Function to Load Trap Model
    function loadTrapModel(position) {
        loader.load('models/trap.glb', (gltf) => {
            const trap = gltf.scene;
            trap.position.set(position.x, 0.1, position.z);
            trap.scale.set(0.5, 1.5, 0.5);
            trap.name = "Trap";
            scene.add(trap);
            objects.push(trap);
        });
    }

  //   Place Traps
    const numTraps = 20;
    for (let i = 0; i < numTraps; i++) {
        const trapPos = getRandomValidPosition();
        loadTrapModel(trapPos);
    }

  //  Coin Model
    function loadCoinModel(position) {
      loader.load('models/coin.glb', (gltf) => {
        const coin = gltf.scene;
        coin.position.set(position.x, 1, position.z);
        coin.scale.set(2, 2, 2); 
        coin.name = "Coin";

        coin.rotationSpeed = Math.random() * 0.05 + 0.01;
      
        scene.add(coin);
        objects.push(coin);
    });
}

  // Place Coins
const numCoins = 10;
for (let i = 0; i < numCoins; i++) {
  const coinPos = getRandomValidPosition();
  loadCoinModel(coinPos);
}

  //   Endpoint Setup
    const endpointPos = getRandomValidPosition();

  //   Load the gate model
    loader.load('models/gate.glb', (gltf) => {
      const gate = gltf.scene;
      gate.position.set(endpointPos.x, 0, endpointPos.z);
      gate.scale.set(0.01  , 0.008, 0.01); 
      gate.name = "Endpoint";
      scene.add(gate);
      objects.push(gate);

      const endpointMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 1.5,
      });

      const triangle = new THREE.Mesh(new THREE.ConeGeometry(3, 2.2, 2), endpointMaterial);
      triangle.rotation.set(0, Math.PI / 2, 0);
      triangle.position.set(endpointPos.x, 4, endpointPos.z);
      triangle.name = "Endpoint";
      scene.add(triangle);
      objects.push(triangle);

      const endpoint = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 0.1), endpointMaterial);
      endpoint.position.set(endpointPos.x, 1, endpointPos.z);
      endpoint.name = "Endpoint";
      scene.add(endpoint);
      objects.push(endpoint);

    const endpointLight = new THREE.PointLight(0x00ff00, 100, 100);
    endpointLight.position.set(endpointPos.x, 3, endpointPos.z);
    scene.add(endpointLight);
    });

  //   Ground Setup
    const groundTexture = textureLoader.load('models/Grass.jpg');
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(50, 50);

    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshStandardMaterial({ map: groundTexture, side: THREE.DoubleSide });
    const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.set(100, 0, 100);
    scene.add(groundPlane);
    objects.push(groundPlane);

  //   Background Music
    const listener = new THREE.AudioListener();
    scene.add(listener);
    const backgroundMusic = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('models/music.mp3', function(buffer) {
        backgroundMusic.setBuffer(buffer);
        backgroundMusic.setLoop(true);
        backgroundMusic.setVolume(2);
        backgroundMusic.play();
    });

const colliders = [];


    function loadModel(path, position, rotation, scale) {
      loader.load(path, (gltf) => {
          const model = gltf.scene;
          
          model.position.set(position.x, position.y, position.z);
          model.rotation.set(rotation.x, rotation.y, rotation.z);
          model.scale.set(scale.x, scale.y, scale.z);
      
          scene.add(model);

        const box = new THREE.Box3().setFromObject(model);
        model.userData.collider = box;
        colliders.push(box);
      });
    }
    
    
    const defaultScale = { x: 10, y: 10, z: 10 };

    const buildingConfigs = [
      { xStart: -20, zStart: 0, step: 25, count: 9, rotation: Math.PI / 2, axis: 'z' },
      { xStart: 0, zStart: -20, step: 25, count: 9, rotation: 0, axis: 'x' },
      { xStart: 220, zStart: 0, step: 25, count: 9, rotation: -Math.PI / 2, axis: 'z' },
      { xStart: 0, zStart: 220, step: 25, count: 9, rotation: Math.PI, axis: 'x' }
  ];

    const buildingModels = [
        'models/building1.glb',
        'models/building2.glb',
        'models/building3.glb'
    ];
    
function generateBuildings(config) {
  for (let i = 0; i < config.count; i++) {
      const modelPath = buildingModels[i % buildingModels.length];
      const position = config.axis === 'x'
          ? { x: config.xStart + (config.step * i), y: 0, z: config.zStart }
          : { x: config.xStart, y: 0, z: config.zStart + (config.step * i) };

      const rotation = { x: 0, y: config.rotation, z: 0 };

      loadModel(modelPath, position, rotation, defaultScale);
  }
}

function addStreetLights(scene, objects, rotation = { x: 0, y: 0, z: 0 }) {
  const candidatePositions = [];
  const offsetFraction = 0.3;
  for (let row = 1; row < rows - 1; row++) {
    for (let col = 1; col < cols - 1; col++) {
      if (mazeGrid[row][col] === false) {
        const adjacentDirs = [];
        if (mazeGrid[row - 1][col] === true) adjacentDirs.push({ dx: 0, dz: -1 });
        if (mazeGrid[row + 1][col] === true) adjacentDirs.push({ dx: 0, dz: 1 });
        if (mazeGrid[row][col - 1] === true) adjacentDirs.push({ dx: -1, dz: 0 });
        if (mazeGrid[row][col + 1] === true) adjacentDirs.push({ dx: 1, dz: 0 });

        if (adjacentDirs.length > 0) {
          const randDir = adjacentDirs[Math.floor(Math.random() * adjacentDirs.length)];
          const offset = wallSpacing * offsetFraction;
          const posX = col * wallSpacing + randDir.dx * offset;
          const posZ = row * wallSpacing + randDir.dz * offset;
          candidatePositions.push({ x: posX, z: posZ });
        }
      }
    }
  }

  // Choose a set number of streetlights (if there are enough candidates)
  const numStreetLights = 10;
  const chosenPositions = [];
  const candidatesCopy = [...candidatePositions];
  for (let i = 0; i < numStreetLights && candidatesCopy.length > 0; i++) {
    const index = Math.floor(Math.random() * candidatesCopy.length);
    chosenPositions.push(candidatesCopy.splice(index, 1)[0]);
  }

  // Now load the streetlight model at each chosen position.
  const loader = new GLTFLoader();
  chosenPositions.forEach(pos => {
    loader.load('models/streetlamp.glb', (gltf) => {
      const streetLight = gltf.scene;
      streetLight.rotation.set(rotation.x, rotation.y, rotation.z);
      streetLight.position.set(pos.x, 0, pos.z);
      streetLight.scale.set(0.01, 0.01, 0.01);
      scene.add(streetLight);
      objects.push(streetLight);

      // Also add a SpotLight to simulate the lamp's light
      const spotLight = new THREE.SpotLight(0xffee88, 50, 100, Math.PI / 2, 0.5, 2);
      spotLight.position.set(pos.x, 10, pos.z); // Placed above the streetlight
      spotLight.castShadow = true;

      const target = new THREE.Object3D();
      target.position.set(pos.x, 0, pos.z);
      scene.add(target);
      spotLight.target = target;

      scene.add(spotLight);
      objects.push(spotLight);
    });
  });
}


addStreetLights(scene, objects);


    buildingConfigs.forEach(generateBuildings);
}
