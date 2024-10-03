// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setClearColor(0xcccccc);
renderer.setPixelRatio(window.devicePixelRatio);

// Scene and camera setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf5f5f5);
scene.fog = new THREE.Fog(0xc0830, 0, 100);

const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(1, 1, 12);

// Get the container element
const container = document.getElementById('frame');
renderer.setSize(container.offsetWidth, container.offsetHeight);
container.appendChild(renderer.domElement);

// Object arrays
const collisionMesh = [];
const pieces = [];
const pieces2 = [];

// Orbit and Drag controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
const dragControls = new THREE.DragControls(pieces2, camera, renderer.domElement);

// Disable orbit controls while dragging
dragControls.addEventListener('dragstart', () => controls.enabled = false);
dragControls.addEventListener('dragend', () => controls.enabled = true);

// Clear the scene and free memory
function clearCanvas() {
    scene.traverse((obj) => {
        if (obj.isMesh) {
            obj.geometry.dispose();
            if (obj.material.map) obj.material.map.dispose(); // Dispose texture if exists
            obj.material.dispose();
            scene.remove(obj);
        }
    });
}

// Remove last added piece from the scene
function clearPieces() {
    const lastObjectIndex = scene.children.length - 1;
    if (lastObjectIndex >= 3) {
        const obj = scene.children[lastObjectIndex];
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
        scene.remove(obj);
    }
}

// Load a GLTF model into the scene
function loadModel(modelName) {
    const loader = new THREE.GLTFLoader();
    loader.load(modelName, (gltf) => {
        const obj = gltf.scene;
        scene.add(obj);

        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());

        // Center the object
        obj.position.sub(center);

        // Add lighting
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x43399d, 1);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
        dirLight.position.set(2, 2, 2);

        scene.add(hemiLight, dirLight);
    }, undefined, (error) => {
        console.error(error);
    });
}

// Create a new piece
function createPiece() {
    const loader = new THREE.TextureLoader();
    loader.load('images/box.jpg', (texture) => {
        const isMetric = document.getElementsByName("units")[0].checked;
        const factor = isMetric ? 100 : 39.37;

        const width = document.getElementsByName("width")[0].value / factor;
        const height = document.getElementsByName("height")[0].value / factor;
        const length = document.getElementsByName("length")[0].value / factor;

        const geometry = new THREE.BoxGeometry(width, height, length);
        const material = new THREE.MeshBasicMaterial({ map: texture });

        const cube = new THREE.Mesh(geometry, material);
        cube.userData = [];

        scene.add(cube);
        pieces.push(cube);
        pieces2.push(cube);
    });
}

// Handle collision checking and saving positions
function handleCollisions(mesh, checkOnly = false) {
    let collisionDetected = false;
    const collisionFlags = [];
    const originPoint = mesh.position.clone();

    const vertices = mesh.geometry.vertices || [];

    vertices.forEach((vertex) => {
        const localVertex = vertex.clone();
        const globalVertex = localVertex.applyMatrix4(mesh.matrix);
        const directionVector = globalVertex.sub(mesh.position);
        const ray = new THREE.Raycaster(originPoint, directionVector.normalize());
        const collisionResults = ray.intersectObjects(collisionMesh);

        const hasCollision = collisionResults.length > 0 && collisionResults[0].distance < directionVector.length();
        collisionDetected = collisionDetected || hasCollision;
        collisionFlags.push(hasCollision);
    });

    if (!checkOnly) {
        mesh.userData.push([mesh.position.clone(), collisionDetected, collisionFlags]);
        if (mesh.userData.length > 50) mesh.userData.shift();
    }

    return collisionDetected;
}

// Animate and render
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    controls.update();

    pieces.forEach((piece) => handleCollisions(piece));
}

// Start the animation loop
animate();
