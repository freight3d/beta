const renderer =  new THREE.WebGLRenderer({antialias: true});
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setClearColor( 0xcccccc );
renderer.setPixelRatio( window.devicePixelRatio );

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf5f5f5);
scene.fog = new THREE.Fog(0xc0830, 0, 100);

const camera = new THREE.PerspectiveCamera( 25, window.innerWidth/window.innerHeight, 0.1, 1000 );
camera.position.set( 1, 1, 12 );

container = document.getElementById('frame');
renderer.setSize(container.offsetWidth, container.offsetHeight);
document.body.appendChild( container );
container.appendChild(renderer.domElement);

//object array
var collisionMesh = [];
var pieces=[];
var pieces2=[];

//CONTROLS
var controls2 = new THREE.DragControls( pieces2, camera, renderer.domElement );
var controls = new THREE.OrbitControls( camera, renderer.domElement );	

// add event listener to highlight dragged objects
controls2.addEventListener( 'dragstart', function ( event ) {
    controls.enabled = false;
} );

controls2.addEventListener( 'dragend', function ( event ) {
    controls.enabled = true;
} );

//
function clear_canvas(){
    for(var i = scene.children.length - 1; i >= 0; i--) { 
        obj = scene.children[i];
        scene.remove(obj); 
    }
}

//
function clear_pieces(){
    var i = scene.children.length - 1;
    if(i >= 3){
        obj = scene.children[i];
        scene.remove(obj);
    } 
}

//
function uld(model_name){
    // Instantiate a loader
    var loader = new THREE.GLTFLoader();		
    // Load a glTF resource
    loader.load(model_name, function ( gltf ) {
        scene.add( gltf.scene );
        obj = scene.children[0];
        const box = new THREE.Box3().setFromObject(obj);
        const size = box.getSize(new THREE.Vector3()).length();
        const center = box.getCenter(new THREE.Vector3());
        // Light parameters
        const light = new THREE.HemisphereLight(0xffffff, 0x43399d, 1);
        scene.add( light );
        const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.4 );
        directionalLight.position.set( 2, 2, 2);
        scene.add( directionalLight );	

        obj.position.x += (obj.position.x - center.x);
        obj.position.y += (obj.position.y - center.y);
        obj.position.z += (obj.position.z - center.z);	
    }, undefined, function ( error ) {
        console.error( error );
    });
}

//
function create_piece(){
    const loaderTexture = new THREE.TextureLoader();
    loaderTexture.load('images/box.jpg', (texture) => {
        const material = new THREE.MeshBasicMaterial({
            map: texture,
        });
        let geometry;
        if(document.getElementsByName("units")[0].checked){
            geometry = new THREE.BoxGeometry(document.getElementsByName("width")[0].value/100, document.getElementsByName("height")[0].value/100, document.getElementsByName("length")[0].value/100);
        } else if (document.getElementsByName("units")[1].checked) {
            geometry = new THREE.BoxGeometry(document.getElementsByName("width")[0].value/39.37, document.getElementsByName("height")[0].value/39.37, document.getElementsByName("length")[0].value/39.37);
        } 

        var cube = new THREE.Mesh(geometry, material);
        cube.userData = { velocity: new THREE.Vector3(0, 0, 0) };  // Initialize velocity for gravity
        scene.add(cube);
        pieces.push(cube);	
        pieces2.push(cube);
    });
}

function savePos(_mesh) {
    // Existing collision detection code unchanged
    // ...
}

function checkCollision2(_mesh) {
    // Existing collision detection code unchanged
    // ...
}

// Gravity settings
const GRAVITY = -9.8;  // Gravity constant (m/s^2)
const deltaTime = 0.016;  // Approximate frame time (for 60fps)

// Add gravity to pieces during animation
var animate = function () {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    controls.update();

    for (var i = 0; i < pieces.length; i++) {
        var _mesh = pieces[i];

        // Apply gravity to the y-velocity
        _mesh.userData.velocity.y += GRAVITY * deltaTime;

        // Update position based on velocity
        _mesh.position.y += _mesh.userData.velocity.y * deltaTime;

        // Collision with ground (assuming ground is at y=0)
        if (_mesh.position.y <= 0) {
            _mesh.position.y = 0;  // Stop at the ground
            _mesh.userData.velocity.y = 0;  // Stop velocity when it hits the ground
        }

        // Optional: handle collision with other objects (same as existing code)
        var [collision, collisionPoint] = checkCollision2(_mesh);
        if (collision) {
            _mesh.position.y = collisionPoint.y;  // Stop at collision point
            _mesh.userData.velocity.y = 0;  // Reset velocity on collision
        }
    }
};

animate();

