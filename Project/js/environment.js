import * as THREE from "three";

export function initEnvironment(scene, objects) {
  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Softer ambient light
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(0, 20, 10);
  scene.add(directionalLight);

  // Fog
  scene.fog = new THREE.FogExp2(0x000000, 0.02); // Exponential fog

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x808080 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Maze Walls
// Function to create a wall
// Function to create a wall
function createWall(width, height, depth, position, rotation) {
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    wallMaterial
  );

  wall.position.set(position.x, position.y, position.z); // Set the position of the wall
  wall.rotation.set(rotation.x, rotation.y, rotation.z); // Set the rotation of the wall
  
  scene.add(wall); // Add the wall to the scene
  objects.push(wall); // Add to collision objects (if needed)
  
  // Add a helper to visualize the collider
  const helper = new THREE.BoxHelper(wall, 0xffff00); // Yellow color for the helper
  scene.add(helper);

  return wall; // Return the wall in case you want to modify it later
}


  // Create multiple walls
  createWall(20, 6, 2, { x: 5, y: 3, z: 0 }, { x: 0, y: 0, z: 0 });  // Wall 1, rotated 45 degrees around Y-axis
  createWall(20, 6, 2, { x: -10, y: 3, z: 0 }, { x: 0, y: 0, z: 0 }); // Wall 2, rotated 90 degrees around Y-axis
  createWall(20, 6, 2, { x: 0, y: 3, z: -10 }, { x: 0, y: 0, z: 0 });  // Wall 3, rotated 45 degrees around X-axis
  createWall(20, 6, 2, { x: 0, y: 3, z: 10 }, { x: 0, y: Math.PI / 2, z: 0 });   // Wall 4, rotated 30 degrees around Y-axis


  // Trap Example
  const trapMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
  const trap = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), trapMaterial);
  trap.position.set(-5, 1, 0); // Adjust position for your maze layout
  trap.name = "Trap"; // Add a unique identifier for collision detection
  scene.add(trap);
  objects.push(trap);

  // Endpoint
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
