var world = new CANNON.World();
world.gravity.set(0, -5, 0); // Set gravity (Y-axis)

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

//Rotation and Drag movement
let isRightMouseDown = false;
let lastMousePosition = new THREE.Vector2();
let selectedPiece = null;

//boton derecho mouse 
renderer.domElement.addEventListener('mousedown', (event) => {
    if (event.button === 2) { // Right mouse button for rotation
        isRightMouseDown = true;
        lastMousePosition.set(event.clientX, event.clientY);
        
        // Raycast to find the piece under the mouse for rotation
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(pieces);

        if (intersects.length > 0) {
            selectedPiece = intersects[0].object;

            // Disable gravity for the selected piece by setting its mass to 0
            if (selectedPiece.userData.physicsBody) {
                selectedPiece.userData.physicsBody.mass = 0;
                selectedPiece.userData.physicsBody.updateMassProperties();

                // Lift the piece by a small amount (e.g., 0.2 units)
                selectedPiece.position.y += 0.5;
                selectedPiece.userData.physicsBody.position.y += 0.5;
            }
        }

        // Prevent default context menu behavior
        event.preventDefault();
    }
});

renderer.domElement.addEventListener('mouseup', (event) => {
    if (event.button === 2 && selectedPiece) { // Right mouse button
        // Restore the mass of the piece to its original value (e.g., 10)
        if (selectedPiece.userData.physicsBody) {
            selectedPiece.userData.physicsBody.mass = 10;
            selectedPiece.userData.physicsBody.updateMassProperties();
        }

        // Re-enable OrbitControls
        controls.enabled = true;
        isRightMouseDown = false;
        selectedPiece = null;
    }
});

renderer.domElement.addEventListener('mousemove', (event) => {
    if (isRightMouseDown && selectedPiece) {
        const deltaX = event.clientX - lastMousePosition.x;
        const rotationSpeed = 0.01; // Adjust this value for faster/slower rotation
        controls.enabled = false;
        // Apply rotation around the Y-axis (vertical rotation)
        selectedPiece.rotation.y += deltaX * rotationSpeed;

        // Update the associated Cannon.js body rotation
        if (selectedPiece.userData.physicsBody) {
            selectedPiece.userData.physicsBody.quaternion.copy(selectedPiece.quaternion);
        }
        lastMousePosition.set(event.clientX, event.clientY);
    }
});

// Mouse interaction to prevent pieces from falling
let isMouseDown = false;

//boton izquierdo mouse 
// Listen for mouse down and mouse up events
renderer.domElement.addEventListener('mousedown', function (event) {
    if (event.button === 0) { // Left mouse button
        isMouseDown = true;
        preventPiecesFalling(true); // Disable falling
    }
});

renderer.domElement.addEventListener('mouseup', function (event) {
    if (event.button === 0) { // Left mouse button
        isMouseDown = false;
        preventPiecesFalling(false); // Re-enable falling
    }
});

// Function to prevent pieces from falling
function preventPiecesFalling(disable) {
    for (let i = 0; i < pieces.length; i++) {
        let body = pieces[i].userData.physicsBody; // Get the associated physics body
        if (body) {
            if (disable) {
                body.mass = 0; // Set mass to 0 to prevent falling
                body.velocity.set(0, 0, 0); // Stop any movement
            } else {
                body.mass = 1; // Restore mass to original value
                body.updateMassProperties(); // Update mass properties
            }
        }
    }
}

// Add event listener to highlight dragged objects
controls2.addEventListener( 'dragstart', function ( event ) {		
controls.enabled = false;
} );    

controls2.addEventListener( 'dragend', function ( event ) {
controls.enabled = true;
} );

// Update the physics body position during dragging
controls2.addEventListener('drag', function (event) {
const draggedObject = event.object; // Get the object being dragged
const body = draggedObject.userData.physicsBody; // Get the associated physics body

// Update the position of the physics body to match the dragged position
if (body) {
    body.position.copy(draggedObject.position); // Sync physics body position with mesh
    }
});

// Reset all meshes and physics bodies
function resetAllMeshes() {
    // Remove all meshes in `pieces` from the scene and their associated physics bodies
    pieces.forEach(piece => {
        let body = piece.userData.physicsBody;
        if (body) {
            // Remove the physics body from the Cannon.js world
            world.removeBody(body);
        }
        // Remove the mesh from the Three.js scene
        scene.remove(piece);
    });

    // Clear the pieces array
    pieces.length = 0;

    // Remove all meshes in `pieces2` from the scene
    pieces2.forEach(piece => {
        scene.remove(piece);
    });

    // Clear the pieces2 array
    pieces2.length = 0;

    // Remove all meshes in `collisionMesh` from the scene
    collisionMesh.forEach(mesh => {
        scene.remove(mesh);
    });

    // Clear the collisionMesh array
    collisionMesh.length = 0;

    // Optionally log for confirmation
    console.log('All meshes, physics bodies, and arrays have been reset.');
}

//
function clear_canvas(){
    for(var i = scene.children.length - 1; i >= 0; i--) { 
		obj = scene.children[i];
		scene.remove(obj); 
        resetAllMeshes();
   }
}

//
function clear_pieces() {
    if (pieces.length > 0) {
        // Get the last piece added
        let piece = pieces.pop(); // Remove the piece from the `pieces` array
        let body = piece.userData.physicsBody; // Get the associated physics body

        // Remove the physics body from the Cannon.js world
        if (body) {
            world.removeBody(body);
        }

        // Remove the mesh from the scene and update other arrays
        scene.remove(piece);

        // Remove the piece from `pieces2` and `collisionMesh` arrays if it exists there
        let index2 = pieces2.indexOf(piece);
        if (index2 !== -1) {
            pieces2.splice(index2, 1);
        }

        let collisionIndex = collisionMesh.indexOf(piece);
        if (collisionIndex !== -1) {
            collisionMesh.splice(collisionIndex, 1);
        }

        // Optionally reinitialize DragControls to reflect updated draggable objects
        controls2 = new THREE.DragControls(pieces2, camera, renderer.domElement);
        controls2.addEventListener('dragstart', function (event) {
            controls.enabled = false;
        });
        controls2.addEventListener('dragend', function (event) {
            controls.enabled = true;
        });
    }
}

//
function uld(model_name) {
    resetAllMeshes();
    // Instantiate a loader
    var loader = new THREE.GLTFLoader();
    
    // Load a glTF resource
    loader.load(model_name, function (gltf) {
        scene.add(gltf.scene);
        var obj = gltf.scene;

        // Get the bounding box to find the floor level
        const box = new THREE.Box3().setFromObject(obj);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // Light parameters (optional)
        const light = new THREE.HemisphereLight(0xffffff, 0x43399d, 1);
        scene.add(light);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight.position.set(2, 2, 2);
        scene.add(directionalLight);

        // Adjust object position to center it
        obj.position.x += (obj.position.x - center.x);
        obj.position.y += (obj.position.y - center.y);
        obj.position.z += (obj.position.z - center.z);
        // // Add a plane at the floor level (visualmente)
        // const planeGeometry = new THREE.PlaneGeometry(10, 10);
        // const planeMaterial = new THREE.MeshStandardMaterial({ 
        //     color: 0x808080, 
        //     transparent: true, 
        //     opacity: 0.1,  // Adjust opacity as needed (0 is fully transparent, 1 is fully opaque)
        //     side: THREE.DoubleSide 
        // });
        // const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        // // Rotate the plane to lie flat (XZ plane) and position it at the floor level
        // plane.rotation.x = -Math.PI / 2; // Rotate 90 degrees to make it horizontal
        // plane.position.y = obj.position.y;
        // scene.add(plane);
    
        // Add a physics body for the floor (imaginario)
        var planeShape = new CANNON.Plane();
        var planeBody = new CANNON.Body({
            mass: 0 // Static object
        });
        planeBody.addShape(planeShape);
        planeBody.position.set(0, obj.position.y+0.001, 0);
        planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        world.addBody(planeBody);
 //       collisionMesh.push(plane);    
               
    }, undefined, function (error) {
        console.error('Error loading the model:', error);
    });
}

//
function create_piece() {
    const loaderTexture = new THREE.TextureLoader();
    loaderTexture.load('images/box.jpg', (texture) => {
        const material = new THREE.MeshBasicMaterial({ map: texture });
        let geometry;
        let width, height, length;

        if (document.getElementsByName("units")[0].checked) {
            width = document.getElementsByName("width")[0].value / 100;
            height = document.getElementsByName("height")[0].value / 100;
            length = document.getElementsByName("length")[0].value / 100;
            geometry = new THREE.BoxGeometry(width, height, length);
        } 
        else if (document.getElementsByName("units")[1].checked) {
            width = document.getElementsByName("width")[0].value / 39.37;
            height = document.getElementsByName("height")[0].value / 39.37;
            length = document.getElementsByName("length")[0].value / 39.37;
            geometry = new THREE.BoxGeometry(width, height, length);
        }

        // Create Three.js Mesh
        var cube = new THREE.Mesh(geometry, material);
        cube.userData = [];
        scene.add(cube);
        pieces.push(cube);
        pieces2.push(cube);

        // Create a Cannon.js body
        var softMaterial = new CANNON.Material({
            friction: 0.9,   // High friction
            restitution: 0  // Low restitution for low bounciness
            });   
        var shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, length / 2));
        var body = new CANNON.Body({
            mass: 10, // Set to 0 for static objects (no gravity)
            position: new CANNON.Vec3(cube.position.x-4, cube.position.y+5, cube.position.z),
            material: softMaterial
        });
        body.addShape(shape);
        world.addBody(body);
        collisionMesh.push(cube);

        // Link the Cannon.js body with the Three.js mesh
        cube.userData.physicsBody = body;
    });
}

function savePos(_mesh) {
	var collisionBool=false;
	var collisionBoolAll=false;
	var collisionPoint;
	let collisionBoolArray=[];
		
	var originPoint = _mesh.position.clone();

    for (var vertexIndex = 0; vertexIndex < _mesh.geometry.vertices.length; vertexIndex++) {
            
        var localVertex = _mesh.geometry.vertices[vertexIndex].clone();       
        var globalVertex = localVertex.applyMatrix4(_mesh.matrix);
        var directionVector = globalVertex.sub(_mesh.position);
        var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
        var collisionResults = ray.intersectObjects(collisionMesh);

        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
          
            collisionBool=true;
            collisionBoolArray.push(collisionBool);
            collisionPoint=collisionResults[0].point;
             
            controls2.enabled=false;    
        }
        else{
        	controls2.enabled=true;
        	collisionBool=false;
        	collisionBoolArray.push(collisionBool);
        }    
    }
        
	let contadorTrue=0;
	for (var i = 0; i< collisionBoolArray.length;i++) {
    	if(collisionBoolArray[i]===true){
    		contadorTrue+=1;
    	}
	}

	if(contadorTrue>0){
    	collisionBoolAll=true;
	}

	let posVector = _mesh.position.clone();
	_mesh.userData.push([posVector,collisionBoolAll,collisionBoolArray]);

	if(_mesh.userData.length>50){
    	_mesh.userData.shift();
	}            	
}

function checkCollision2(_mesh) {
	var collisionBool=false;
	var collisionBoolAll=false;
	var collisionPoint;
	let collisionBoolArray=[];
		
    var originPoint = _mesh.position.clone();

    for (var vertexIndex = 0; vertexIndex < _mesh.geometry.vertices.length; vertexIndex++) {
            
        var localVertex = _mesh.geometry.vertices[vertexIndex].clone();    
        var globalVertex = localVertex.applyMatrix4(_mesh.matrix);
        var directionVector = globalVertex.sub(_mesh.position);
        var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
        var collisionResults = ray.intersectObjects(collisionMesh);
           
        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
          
            collisionBool=true;
            collisionBoolArray.push(collisionBool);
            collisionPoint=collisionResults[0].point;   
            controls2.enabled=false;
           
        }
        else{
        	controls2.enabled=true;
        	collisionBool=false;
        	collisionBoolArray.push(collisionBool);
        }
    }
    let contadorTrue=0;
    for (var i = 0; i< collisionBoolArray.length;i++) {
    	if(collisionBoolArray[i]===true){
    		contadorTrue+=1;
    	}
    }

    if(contadorTrue>0){
    	collisionBoolAll=true;
    }
             	
    return [collisionBoolAll,collisionPoint];
}
  
var animate = function () {
    requestAnimationFrame(animate);
    
    // Step the physics world forward
    world.step(1 / 60); // Time step (60 FPS)

    // Sync Three.js meshes with Cannon.js bodies
    for (var i = 0; i < pieces.length; i++) {
        let piece = pieces[i];
        let body = piece.userData.physicsBody;
        if (body) {
            piece.position.copy(body.position);
            piece.quaternion.copy(body.quaternion);
        }
    }
    renderer.render(scene, camera);
    controls.update();
};

animate();