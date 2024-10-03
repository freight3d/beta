// Include Cannon.js library via script tag before the script execution:
// <script src="https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js"></script>

// Create a physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // Gravity is in m/s², in the Y-axis direction (down)

// Time step for physics simulation
const timeStep = 1 / 60;

// Initialize arrays to hold the Three.js meshes and their corresponding Cannon.js bodies
const meshes = [];
const bodies = [];

// Cache window and container size
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setClearColor(0xcccccc);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf5f5f5);
scene.fog = new THREE.Fog(0xc0830, 0, 100);

const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(1, 1, 12);

const container = document.getElementById('frame');
renderer.setSize(container.offsetWidth, container.offsetHeight);
document.body.appendChild(container);
container.appendChild(renderer.domElement);

const controls2 = new THREE.DragControls(pieces2, camera, renderer.domElement);
const controls = new THREE.OrbitControls(camera, renderer.domElement);

controls2.addEventListener('dragstart', (event) => {
    controls.enabled = false;
    event.object.userData.body.sleep(); // Disable physics while dragging
});

controls2.addEventListener('dragend', (event) => {
    controls.enabled = true;
    event.object.userData.body.wakeUp(); // Re-enable physics after dragging
});

// Create the floor (ground)
const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({ mass: 0 }); // Static body (mass = 0)
groundBody.addShape(groundShape);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Rotate to make it horizontal
world.addBody(groundBody);

// Create a Three.js plane for the ground
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
scene.add(groundMesh);

// Function to create a physics-enabled piece
function createPhysicsPiece(geometry, mass, position) {
    const material = new THREE.MeshStandardMaterial({ color: 0xFF5733 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    scene.add(mesh);

    const shape = new CANNON.Box(new CANNON.Vec3(geometry.parameters.width / 2, geometry.parameters.height / 2, geometry.parameters.depth / 2));
    const body = new CANNON.Body({ mass: mass });
    body.addShape(shape);
    body.position.copy(mesh.position);
    world.addBody(body);

    // Link Three.js mesh and Cannon.js body
    mesh.userData.body = body;
    meshes.push(mesh);
    bodies.push(body);
}

// Create a cube (box geometry with physics)
function create_piece() {
    const isMetric = document.getElementsByName("units")[0].checked;
    const factor = isMetric ? 100 : 39.37;

    const width = document.getElementsByName("width")[0].value / factor;
    const height = document.getElementsByName("height")[0].value / factor;
    const depth = document.getElementsByName("length")[0].value / factor;

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mass = 1; // Mass of the object
    const position = new THREE.Vector3(0, 5, 0); // Starting position

    createPhysicsPiece(geometry, mass, position);
}

// Function to create a cylinder with physics
function create_piece2() {
    const isMetric = document.getElementsByName("units")[0].checked;
    const factor = isMetric ? 100 : 39.37;

    const radius = document.getElementsByName("width")[0].value / factor;
    const height = document.getElementsByName("length")[0].value / factor;

    const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    const mass = 1; // Mass of the object
    const position = new THREE.Vector3(0, 5, 0); // Starting position

    createPhysicsPiece(geometry, mass, position);
}

// Update physics and render
function animate() {
    requestAnimationFrame(animate);

    // Step the physics world
    world.step(timeStep);

    // Update positions of Three.js meshes based on Cannon.js bodies
    meshes.forEach((mesh) => {
        mesh.position.copy(mesh.userData.body.position);
        mesh.quaternion.copy(mesh.userData.body.quaternion);
    });

    renderer.render(scene, camera);
    controls.update();
}

animate();
