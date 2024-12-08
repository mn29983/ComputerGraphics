import * as THREE from 'three';

export function initEnvironment(scene, objects) {

  //  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Softer ambient light
   // scene.add(ambientLight);


  
  // Define the maze dimensions (bigger maze)
  const rows = 20; // Number of rows in the maze (increased size)
  const cols = 20; // Number of columns in the maze (increased size)
  const wallSpacing = 10; // Spacing between walls (size of each wall)
  const wallHeight = 5; // Height of the walls

  // Create a grid to represent the maze (true = wall, false = path)
  const mazeGrid = Array.from({ length: rows }, () => Array(cols).fill(true)); // All walls initially

  // Randomized directions for moving through the maze
  const directions = [
    { x: 0, z: -1 }, // Up
    { x: 1, z: 0 },  // Right
    { x: 0, z: 1 },  // Down
    { x: -1, z: 0 }, // Left
  ];

  // Function to shuffle directions (randomize movement order)
  function shuffleDirections() {
    for (let i = directions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [directions[i], directions[j]] = [directions[j], directions[i]];
    }
  }

  // Recursive Backtracking Maze Generator
  function carvePath(x, z) {
    mazeGrid[x][z] = false; // Mark the current cell as part of the path

    shuffleDirections(); // Randomize movement directions

    // Explore each direction
    for (let i = 0; i < directions.length; i++) {
      const dir = directions[i];
      const nx = x + dir.x * 2; // Move by 2 steps (to avoid revisiting cells)
      const nz = z + dir.z * 2;

      // Check if the next cell is within bounds and still a wall
      if (nx >= 0 && nz >= 0 && nx < rows && nz < cols && mazeGrid[nx][nz] === true) {
        // Carve a path to the next cell and mark it
        mazeGrid[x + dir.x][z + dir.z] = false; // Remove wall between current and next cell
        carvePath(nx, nz); // Recurse into the next cell
      }
    }
  }

  // Start the maze generation from a random position (usually at an odd position for best effect)
  carvePath(1, 1);

  // Create a texture loader for walls
  const textureLoader = new THREE.TextureLoader();
  const wallTexture = textureLoader.load('models/Brick.jpg'); // Replace with your wall texture
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(1, 1); // Adjust this for the texture scaling

  // Create geometry for walls
  const wallGeometry = new THREE.BoxGeometry(wallSpacing, wallHeight, wallSpacing); // Wall geometry

  // Material for walls
  const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallTexture,
  });

  // Number of walls (approximately half of the grid)
  const numWalls = (rows * cols) / 2; // Rough estimation of how many walls there could be

  // Instanced Mesh for efficient wall rendering
  const wallMesh = new THREE.InstancedMesh(wallGeometry, wallMaterial, numWalls);
  scene.add(wallMesh);

  let wallIndex = 0;

// Loop through the maze grid and add individual walls for collision handling
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    if (mazeGrid[row][col] === true) {
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);

      // Position the wall
      const x = col * wallSpacing;
      const z = row * wallSpacing;
      wall.position.set(x, wallHeight / 2, z);

      // Add the wall to the scene
      scene.add(wall);
      objects.push(wall); // Add to collision objects
    }
  }
}

  // Update the instance matrix to render the walls
  wallMesh.instanceMatrix.needsUpdate = true;

  // Add objects to the scene for collision or interaction handling
  objects.push(wallMesh);


  // Load the Grass texture
const groundTexture = textureLoader.load('models/Grass.jpg'); // Replace with your Grass texture path
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(50, 50); // Adjust texture tiling to cover the ground nicely

// Create the ground plane
const groundGeometry = new THREE.PlaneGeometry(500, 500, 500); // Plane size matches maze
const groundMaterial = new THREE.MeshStandardMaterial({
  map: groundTexture,
  side: THREE.DoubleSide, // Ensure texture is visible from both sides
});

const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
groundPlane.rotation.x = -Math.PI / 2; // Rotate to lay flat on the XZ plane
groundPlane.position.y = 0; // Position at ground level
groundPlane.position.x = 100; // Position at ground level
groundPlane.position.z = 100; // Position at ground level

scene.add(groundPlane);
objects.push(groundPlane); // Optional: Add for collision handling


  // Example Trap (for testing purposes)
  const trapMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
  const trap = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), trapMaterial);
  trap.position.set(-5, 1, 0); // Position the trap somewhere in the maze
  trap.name = "Trap"; // Add a unique identifier for collision detection
  scene.add(trap);
  objects.push(trap);

  // Example Endpoint (finish point)
  const endpointMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    emissive: 0x00ff00, // Glow effect
    emissiveIntensity: 30,
  });

  const endpointLight = new THREE.PointLight(0x00ff00, 1, 10);
  endpointLight.position.set(0, 5, 0); // Positioned near the endpoint
  scene.add(endpointLight);

  const endpoint = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 2, 32),
    endpointMaterial
  );
  endpoint.position.set(20, 1, 20);
  endpoint.name = "Endpoint"; // Unique identifier
  scene.add(endpoint);
  objects.push(endpoint);
}
