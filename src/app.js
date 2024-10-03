// Import Cannon.js
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);  // Set gravity along Y-axis
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

// Create the physics material for objects
const groundMaterial = new CANNON.Material("groundMaterial");
const pieceMaterial = new CANNON.Material("pieceMaterial");

// Setup collision response between the materials
const groundPieceContact = new CANNON.ContactMaterial(groundMaterial, pieceMaterial, {
    friction: 0.4,
    restitution: 0.6,
});
world.addContactMaterial(groundPieceContact);

// Setup the ground plane (invisible, but acts as a floor)
const groundBody = new CANNON.Body({
    mass: 0,  // Ground should be static
    material: groundMaterial,
});
const groundShape = new CANNON.Plane();
groundBody.addShape(groundShape);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);  // Rotate to be flat
world.addBody(groundBody);

// Array to store physics bodies
const pieceBodies = [];

// Cache window and container size
const renderer = new THREE.WebGLRenderer({antialias: true});
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

const collisionMesh = [];
const pieces = [];
const pieces2 = [];

const controls2 = new THREE.DragControls(pieces2, camera, renderer.domElement);
const controls = new THREE.OrbitControls(camera, renderer.domElement);

controls2.addEventListener('dragstart', () => controls.enabled = false);
controls2.addEventListener('dragend', () => controls.enabled = true);

function clear_canvas() {
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
}

function clear_pieces() {
    const i = scene.children.length - 1;
    if (i >= 3) {
        scene.remove(scene.children[i]);
    }
}

// Function to add physics to a Three.js mesh
function addPhysicsToPiece(geometry, position, mass) {
    const shape = new CANNON.Box(new CANNON.Vec3(geometry.parameters.width / 2, geometry.parameters.height / 2, geometry.parameters.depth / 2));

    const body = new CANNON.Body({
        mass: mass,
        position: new CANNON.Vec3(position.x, position.y, position.z),
        shape: shape,
        material: pieceMaterial
    });

    world.addBody(body);
    pieceBodies.push(body);

    return body;
}

function uld(model_name) {
    const loader = new THREE.GLTFLoader();
    loader.load(model_name, (gltf) => {
        const obj = gltf.scene;
        scene.add(obj);

        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        
        const light = new THREE.HemisphereLight(0xffffff, 0x43399d, 1);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight.position.set(2, 2, 2);
        scene.add(light, directionalLight);

        obj.position.sub(center);  // Adjust position
    }, undefined, (error) => console.error(error));
}

function create_piece() {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('images/metal.jpg', (texture) => {
        const isMetric = document.getElementsByName("units")[0].checked;
        const factor = isMetric ? 100 : 39.37;
        const geometry = new THREE.BoxGeometry(
            document.getElementsByName("width")[0].value / factor,
            document.getElementsByName("height")[0].value / factor,
            document.getElementsByName("length")[0].value / factor
        );
        const material = new THREE.MeshBasicMaterial({map: texture});
        const cube = new THREE.Mesh(geometry, material);

        scene.add(cube);
        pieces.push(cube);
        pieces2.push(cube);

        // Add physics
        const position = cube.position.clone();
        const body = addPhysicsToPiece(geometry, position, 1);  // Set mass to 1 for dynamic object
        cube.userData.physicsBody = body;
    });
}

function create_piece2() {
    const isMetric = document.getElementsByName("units")[0].checked;
    const factor = isMetric ? 200 : 78.74;
    const geometry = new THREE.CylinderGeometry(
        document.getElementsByName("width")[0].value / factor,
        document.getElementsByName("width")[0].value / factor,
        document.getElementsByName("length")[0].value / factor,
        32
    );
    const material = new THREE.MeshPhongMaterial({color: 0xFFD966, shininess: 100});
    const cylinder = new THREE.Mesh(geometry, material);

    cylinder.rotateX(Math.PI / 2);
    scene.add(cylinder);
    pieces.push(cylinder);
    pieces2.push(cylinder);

    // Add physics
    const position = cylinder.position.clone();
    const body = addPhysicsToPiece(geometry, position, 1);  // Set mass to 1 for dynamic object
    cylinder.userData.physicsBody = body;
}

function animate() {
    requestAnimationFrame(animate);

    // Step physics simulation forward
    world.step(1 / 60);

    // Update Three.js mesh positions based on Cannon.js bodies
    pieces.forEach((piece) => {
        const body = piece.userData.physicsBody;
        if (body) {
            piece.position.copy(body.position);
            piece.quaternion.copy(body.quaternion);
        }
    });

    renderer.render(scene, camera);
    controls.update();
}

animate();


