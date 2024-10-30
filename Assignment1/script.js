// Basic Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 100, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Ground (Grass and Road)
const grassMaterial = new THREE.MeshBasicMaterial({ color: 0x2d4e48 });
const roadMaterial = new THREE.MeshBasicMaterial({ color: 0xb5adaa });

// Grass
const grass = new THREE.Mesh(new THREE.PlaneGeometry(95, 80), grassMaterial);
grass.rotation.x = - Math.PI / 2;
scene.add(grass);

// Road
const road = new THREE.Mesh(new THREE.PlaneGeometry(5, 100), roadMaterial);
road.rotation.x = - Math.PI / 2;
road.rotation.z = 120 * (Math.PI / 180);
road.position.set(0, 0.1, 0);
scene.add(road);

const road2 = new THREE.Mesh(new THREE.PlaneGeometry(5, 50), roadMaterial);
road2.rotation.x = - Math.PI / 2;
road2.rotation.z = 60 * (Math.PI / 180);
road2.position.set(-25, 0.1, 3);
scene.add(road2);

const road3 = new THREE.Mesh(new THREE.PlaneGeometry(5, 50), roadMaterial);
road3.rotation.x = - Math.PI / 2;
road3.rotation.z = 90 * (Math.PI / 180);
road3.position.set(20, 0.1, 15);
scene.add(road3);

const road4 = new THREE.Mesh(new THREE.PlaneGeometry(5, 60), roadMaterial);
road4.rotation.x = - Math.PI / 2;
road4.rotation.z = 155 * (Math.PI / 180);
road4.position.set(-20, 0.1, -8);
scene.add(road4);

const road5 = new THREE.Mesh(new THREE.PlaneGeometry(18, 45), roadMaterial);
road5.rotation.x = - Math.PI / 2;
road5.position.set(-28.5, 0.1, -9);
scene.add(road5);

const road6 = new THREE.Mesh(new THREE.PlaneGeometry(5, 30), roadMaterial);
road6.rotation.x = - Math.PI / 2;
road6.position.set(-35, 0.1, 25);
scene.add(road6);

// Buildings
const buildingMaterial = new THREE.MeshBasicMaterial({ color: 0xdedede });
const BursuaryBuilding = new THREE.Mesh(new THREE.BoxGeometry(30, 5, 5), buildingMaterial);
const building1 = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 5), buildingMaterial);
const building2 = building1.clone();
const building3 = building1.clone();
const TechnologyPark = new THREE.Mesh(new THREE.BoxGeometry(20, 5, 10), buildingMaterial);
const Restaurant = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 20), buildingMaterial);


BursuaryBuilding.position.set(-9, 2.5, -15);
BursuaryBuilding.rotation.y = 20;

building1.position.set(-18, 2.5, 20);
building1.rotation.y = 30 * (Math.PI / 180);

building2.position.set(8, 2.5, 5);
building2.rotation.y = 30 * (Math.PI / 180);

building3.position.set(30, 2.5, -7);
building3.rotation.y = 30 * (Math.PI / 180);

Restaurant.position.set(-28, 2.5, -20);

TechnologyPark.position.set(10, 2.5, 25);

scene.add(BursuaryBuilding);
scene.add(building1);
scene.add(building2);
scene.add(building3);
scene.add(Restaurant);
scene.add(TechnologyPark);


// Animated Sphere
const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 30, 30), sphereMaterial);
sphere.position.set(-35, 1, 35);
scene.add(sphere);

// Animation
gsap.to(sphere.position, {
    z: -30,
    duration: 5,
    repeat: -1,
    yoyo: true,
    ease: "power1.inOut",
    onUpdate: function() {
        controls.update();
    }
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();