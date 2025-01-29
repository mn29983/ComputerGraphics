import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function initEnvironment(scene, objects) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const loader = new GLTFLoader();
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
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

    // Function to Load Trap Model
    function loadTrapModel(position) {
        loader.load('models/trap.glb', (gltf) => {
            const trap = gltf.scene;
            trap.position.set(position.x, 0.1, position.z);
            trap.scale.set(1.5, 1.5, 1.5);
            trap.name = "Trap";
            scene.add(trap);
            objects.push(trap);
        });
    }

    // Place Traps
    const numTraps = 20;
    for (let i = 0; i < numTraps; i++) {
        const trapPos = getRandomValidPosition();
        loadTrapModel(trapPos);
    }

    // Function to Load Coin Model
    function loadCoinModel(position) {
        loader.load('models/coin.glb', (gltf) => {
            const coin = gltf.scene;
            coin.position.set(position.x, 1, position.z); // Adjust height
            coin.scale.set(2, 2, 2); // Scale to fit
            coin.name = "Coin";
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

    // Endpoint Setup
    const endpointPos = getRandomValidPosition();
    const endpointMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 1.5,
    });
    const endpointLight = new THREE.PointLight(0x00ff00, 3, 20);
    endpointLight.position.set(endpointPos.x, 5, endpointPos.z);
    scene.add(endpointLight);

    const endpoint = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 32), endpointMaterial);
    endpoint.position.set(endpointPos.x, 1, endpointPos.z);
    endpoint.name = "Endpoint";
    scene.add(endpoint);
    objects.push(endpoint);

    // Ground Setup
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

    // Background Music
    const listener = new THREE.AudioListener();
    scene.add(listener);
    const backgroundMusic = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('models/music.mp3', function(buffer) {
        backgroundMusic.setBuffer(buffer);
        backgroundMusic.setLoop(true);
        backgroundMusic.setVolume(0.5);
        backgroundMusic.play();
    });

    // Mini-map setup (Placeholder)
    const miniMapCamera = new THREE.OrthographicCamera(-50, 50, 50, -50, 1, 1000);
    miniMapCamera.position.set(100, 100, 100);
    miniMapCamera.lookAt(new THREE.Vector3(100, 0, 100));
    scene.add(miniMapCamera);
}
