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
}

function saveOrCheckCollision(mesh, isSaving = true) {
    const collisionBoolArray = [];
    let collisionBoolAll = false;
    const originPoint = mesh.position.clone();

    const vertices = mesh.geometry.vertices || []; // Fallback for non-Buffer geometries
    for (const localVertex of vertices) {
        const globalVertex = localVertex.clone().applyMatrix4(mesh.matrix);
        const directionVector = globalVertex.sub(mesh.position);
        const ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
        const collisionResults = ray.intersectObjects(collisionMesh);

        const collision = collisionResults.length > 0 && collisionResults[0].distance < directionVector.length();
        collisionBoolArray.push(collision);
    }

    collisionBoolAll = collisionBoolArray.some(collision => collision);
    if (isSaving) {
        mesh.userData.push([mesh.position.clone(), collisionBoolAll, collisionBoolArray]);
        if (mesh.userData.length > 50) mesh.userData.shift();
    }

    return [collisionBoolAll, collisionBoolArray];
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    controls.update();

    pieces.forEach(piece => saveOrCheckCollision(piece));
}

animate();


			
