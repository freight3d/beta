THREE.DragControls = function ( _objects, _camera, _domElement ) {
    var _plane = new THREE.Plane();
    var _raycaster = new THREE.Raycaster();
    var _mouse = new THREE.Vector2();
    var _offset = new THREE.Vector3();
    var _intersection = new THREE.Vector3();
    var _worldPosition = new THREE.Vector3();
    var _inverseMatrix = new THREE.Matrix4();
    var _selected = null, _hovered = null;
    var _rotate = false; // To track rotation state
    var _prevMouseX = 0; // To track previous mouse X position
    var _prevMouseY = 0; // To track previous mouse Y position

    var scope = this;

    function activate() {
        _domElement.addEventListener('mousemove', onDocumentMouseMove, false);
        _domElement.addEventListener('mousedown', onDocumentMouseDown, false);
        _domElement.addEventListener('mouseup', onDocumentMouseCancel, false);
        _domElement.addEventListener('mouseleave', onDocumentMouseCancel, false);
        _domElement.addEventListener('touchmove', onDocumentTouchMove, false);
        _domElement.addEventListener('touchstart', onDocumentTouchStart, false);
        _domElement.addEventListener('touchend', onDocumentTouchEnd, false);
        _domElement.addEventListener('contextmenu', function(event) {
            event.preventDefault(); // Prevent default context menu
        });
    }

    function deactivate() {
        _domElement.removeEventListener('mousemove', onDocumentMouseMove, false);
        _domElement.removeEventListener('mousedown', onDocumentMouseDown, false);
        _domElement.removeEventListener('mouseup', onDocumentMouseCancel, false);
        _domElement.removeEventListener('mouseleave', onDocumentMouseCancel, false);
        _domElement.removeEventListener('touchmove', onDocumentTouchMove, false);
        _domElement.removeEventListener('touchstart', onDocumentTouchStart, false);
        _domElement.removeEventListener('touchend', onDocumentTouchEnd, false);
    }

    function dispose() {
        deactivate();
    }

    function onDocumentMouseMove(event) {
        event.preventDefault();
        var rect = _domElement.getBoundingClientRect();
        _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        _raycaster.setFromCamera(_mouse, _camera);
        var intersects = _raycaster.intersectObjects(_objects, true);

        if (_selected && scope.enabled) {
            if (_rotate) { // If the right mouse button is pressed
                const deltaX = event.clientX - _prevMouseX; // Calculate mouse movement
                const deltaY = event.clientY - _prevMouseY;

                // Rotate around Y axis (horizontal movement)
                _selected.rotation.y += deltaX * 0.01; // Adjust the multiplier for speed
                // Rotate around X axis (vertical movement)
                _selected.rotation.x += deltaY * 0.01; // Adjust the multiplier for speed

                _prevMouseX = event.clientX; // Update previous mouse positions
                _prevMouseY = event.clientY;
            } else { // Dragging with the left mouse button
                if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
                    _selected.position.copy(_intersection.sub(_offset).applyMatrix4(_inverseMatrix));
                }
            }

            scope.dispatchEvent({ type: 'drag', object: _selected });
            return;
        }

        if (intersects.length > 0) {
            var object = intersects[0].object;
            _plane.setFromNormalAndCoplanarPoint(_camera.getWorldDirection(_plane.normal), _worldPosition.setFromMatrixPosition(object.matrixWorld));

            if (_hovered !== object) {
                scope.dispatchEvent({ type: 'hoveron', object: object });
                _domElement.style.cursor = 'pointer';
                _hovered = object;
            }
        } else {
            if (_hovered !== null) {
                scope.dispatchEvent({ type: 'hoveroff', object: _hovered });
                _domElement.style.cursor = 'auto';
                _hovered = null;
            }
        }
    }

    function onDocumentMouseDown(event) {
        event.preventDefault();

        _raycaster.setFromCamera(_mouse, _camera);
        var intersects = _raycaster.intersectObjects(_objects, true);

        if (intersects.length > 0) {
            _selected = intersects[0].object;

            if (event.button === 0) { // Left click for drag
                if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
                    _inverseMatrix.getInverse(_selected.parent.matrixWorld);
                    _offset.copy(_intersection).sub(_worldPosition.setFromMatrixPosition(_selected.matrixWorld));
                }
                _domElement.style.cursor = 'move';
                scope.dispatchEvent({ type: 'dragstart', object: _selected });
            } else if (event.button === 2) { // Right click for rotation
                _rotate = true; // Enable rotation
                _prevMouseX = event.clientX; // Store current mouse position
                _prevMouseY = event.clientY;
            }
        }
    }

    function onDocumentMouseCancel(event) {
        event.preventDefault();

        if (_selected) {
            scope.dispatchEvent({ type: 'dragend', object: _selected });
            _selected = null;
        }

        _rotate = false; // Reset rotation state when mouse is released
        _domElement.style.cursor = _hovered ? 'pointer' : 'auto';
    }

    function onDocumentTouchMove(event) {
        event.preventDefault();
        event = event.changedTouches[0];

        var rect = _domElement.getBoundingClientRect();
        _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        _raycaster.setFromCamera(_mouse, _camera);

        if (_selected && scope.enabled) {
            if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
                _selected.position.copy(_intersection.sub(_offset).applyMatrix4(_inverseMatrix));
            }

            scope.dispatchEvent({ type: 'drag', object: _selected });
            return;
        }
    }

    function onDocumentTouchStart(event) {
        event.preventDefault();
        event = event.changedTouches[0];

        var rect = _domElement.getBoundingClientRect();
        _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        _raycaster.setFromCamera(_mouse, _camera);
        var intersects = _raycaster.intersectObjects(_objects, true);

        if (intersects.length > 0) {
            _selected = intersects[0].object;

            _plane.setFromNormalAndCoplanarPoint(_camera.getWorldDirection(_plane.normal), _worldPosition.setFromMatrixPosition(_selected.matrixWorld));

            if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
                _inverseMatrix.getInverse(_selected.parent.matrixWorld);
                _offset.copy(_intersection).sub(_worldPosition.setFromMatrixPosition(_selected.matrixWorld));
            }

            _domElement.style.cursor = 'move';
            scope.dispatchEvent({ type: 'dragstart', object: _selected });
        }
    }

    function onDocumentTouchEnd(event) {
        event.preventDefault();

        if (_selected) {
            scope.dispatchEvent({ type: 'dragend', object: _selected });
            _selected = null;
        }

        _domElement.style.cursor = 'auto';
    }

    activate();

    // API
    this.enabled = true;
    this.activate = activate;
    this.deactivate = deactivate;
    this.dispose = dispose;
};

THREE.DragControls.prototype = Object.create(THREE.EventDispatcher.prototype);
THREE.DragControls.prototype.constructor = THREE.DragControls;
