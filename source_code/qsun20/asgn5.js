import * as THREE from './lib/three.module.js';
import {OrbitControls} from './lib/OrbitControls.js';
import {OBJLoader} from './lib/OBJLoader.js';
import {MTLLoader} from './lib/MTLLoader.js';
import {GUI} from './lib/lil-gui.module.min.js';
import {VRButton} from './lib/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from './lib/jsm/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from './lib/jsm/webxr/XRHandModelFactory.js';
import { BoxLineGeometry } from './lib/jsm/geometries/BoxLineGeometry.js';


let camera, scene, raycaster, renderer;
let controller1, controller2,hand1, hand2;
let controllerGrip1, controllerGrip2;

let room, marker, floor, baseReferenceSpace;

const tmpVector1 = new THREE.Vector3();
const tmpVector2 = new THREE.Vector3();
let controls;
let grabbing = false;
const scaling = {
    active: false,
    initialDistance: 0,
    object: null,
    initialScale: 1
};
const spheres = [];
let container;
let INTERSECTION;
const tempMatrix = new THREE.Matrix4();
const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );


init();
animate();

function init() {
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    const textureLoader = new THREE.TextureLoader();

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x505050 );

    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set( 0, 1.6, 3 );

    controls = new OrbitControls( camera, container );
    controls.target.set( 0, 1.6, 0 );
    controls.update();

    room = new THREE.LineSegments(
        new BoxLineGeometry( 500, 500, 500, 10, 10, 10 ).translate( 0, 3, 0 ),
        new THREE.LineBasicMaterial( { color: 0xbcbcbc } )
    );
    scene.add( room );

    scene.add( new THREE.HemisphereLight( 0xa5a5a5, 0x898989, 3 ) );

    const light = new THREE.DirectionalLight( 0xffffff, 3 );
    light.position.set( 1, 1, 1 ).normalize();
    scene.add( light );

    marker = new THREE.Mesh(
        new THREE.CircleGeometry( 0.25, 32 ).rotateX( - Math.PI / 2 ),
        new THREE.MeshBasicMaterial( { color: 0xbcbcbc } )
    );
    scene.add( marker );

    // Load the grass texture
    const grassTexture = textureLoader.load('grass.jpg');
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(10, 10); // Adjust the repeat values as needed

    // Create a material with the grass texture
    const floorMaterial = new THREE.MeshBasicMaterial({
        map: grassTexture,
        transparent: true,
        opacity: 1.0,
    });

    floor = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 500, 2, 2).rotateX(-Math.PI / 2),
        floorMaterial
    );

    floor.receiveShadow = true;
    scene.add(floor);






    const mtlLoader = new MTLLoader();
    mtlLoader.load('./models/windmill/windmill_001.mtl', (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        mtl.materials.Material.side = THREE.DoubleSide;
        objLoader.setMaterials(mtl);
        objLoader.load('./models/windmill/windmill_001.obj', (root) => {
            scene.add(root);
        });
    });

    {
        const cubeSize = 1;
        const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const cubeMat = new THREE.MeshPhongMaterial({color: '#4076ac'});
        const mesh = new THREE.Mesh(cubeGeo, cubeMat);
        mesh.position.set(2, 0.5, 2);
        scene.add(mesh);
    }
    {
        const sphereRadius = 1;
        const sphereWidthDivisions = 32;
        const sphereHeightDivisions = 16;
        const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
        const sphereMat = new THREE.MeshPhongMaterial({color: '#8d5107'});
        const mesh = new THREE.Mesh(sphereGeo, sphereMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.set(5, 12, 5);
        scene.add(mesh);
    }

    //cone for tree
    const trunkRadius = .2;
    const trunkHeight = 1;
    // const trunkRadialSegments = 12;
    // const trunkGeometry = new THREE.CylinderGeometry(
    //     trunkRadius, trunkRadius, trunkHeight, trunkRadialSegments);

    const topRadius = trunkRadius * 5;
    const topHeight = trunkHeight * 5;
    const topSegments = 12;
    const topGeometry = new THREE.ConeGeometry(
        topRadius, topHeight, topSegments);

    //const trunkMaterial = new THREE.MeshPhongMaterial({color: 'brown'});
    const topMaterial = new THREE.MeshPhongMaterial({color: 'green'});

    function makeTree(x, z) {
        const root = new THREE.Object3D();
        //const trunk = new THREE.Mesh(trunkGeometry);
        //trunk.position.y = trunkHeight / 2;
        //root.add(trunk);

        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = trunkHeight + topHeight / 2 - 1;
        root.add(top);

        root.position.set(x, 0, z);
        scene.add(root);

        return root;
    }

    makeTree(10, 0);
    makeTree(15, 0);
    makeTree(0, 10);
    makeTree(0, 15);
    makeTree(-10, 0);
    makeTree(-15, 0);
    makeTree(0, -10);
    makeTree(0, -15);



    function makeInstance(geometry, color, x, y) {
        const loader = new THREE.TextureLoader();
        const material = new THREE.MeshPhongMaterial({map: loader.load('star.jpg'),});

        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        cube.position.x = x;
        cube.position.y = y;

        return cube;
    }
    const cubes = [
        makeInstance(geometry, 0x44aa88, 5, 5),
        makeInstance(geometry, 0x8844aa, 5, 5),
        makeInstance(geometry, 0xaa8844, 5, 5),

        makeInstance(geometry, 0x44aa88, -5, 5),
        makeInstance(geometry, 0x8844aa, -5, 5),
        makeInstance(geometry, 0xaa8844, -5, 5),

        makeInstance(geometry, 0xff0000, -10, 7),
        makeInstance(geometry, 0x00ff00, -10, 7),
        makeInstance(geometry, 0x0000ff, -10, 7),

        makeInstance(geometry, 0xff0000, 10, 7),
        makeInstance(geometry, 0x00ff00, 10, 7),
        makeInstance(geometry, 0x0000ff, 10, 7),

        makeInstance(geometry, 0x404040, -15, 10),
        makeInstance(geometry, 0x808080, -15, 10),
        makeInstance(geometry, 0x000000, -15, 10),

        makeInstance(geometry, 0x404040, 15, 10),
        makeInstance(geometry, 0x808080, 15, 10),
        makeInstance(geometry, 0x000000, 15, 10),


    ];

    {
        const loader = new THREE.TextureLoader();
        const texture = loader.load(
            'space.jpg',
            () => {
                const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
                rt.fromEquirectangularTexture(renderer, texture);
                scene.background = rt.texture;
            });
    }




    const bodyRadiusTop = .4;
    const bodyRadiusBottom = .2;
    const bodyHeight = 2;
    const bodyRadialSegments = 6;
    const bodyGeometry = new THREE.CylinderGeometry(
        bodyRadiusTop, bodyRadiusBottom, bodyHeight, bodyRadialSegments);

    const headRadius = bodyRadiusTop * 0.8;
    const headLonSegments = 12;
    const headLatSegments = 5;
    const headGeometry = new THREE.SphereGeometry(
        headRadius, headLonSegments, headLatSegments);

    function makeLabelCanvas(baseWidth, size, name) {
        const borderSize = 2;
        const ctx = document.createElement('canvas').getContext('2d');
        const font = `${size}px bold sans-serif`;
        ctx.font = font;
        // measure how long the name will be
        const textWidth = ctx.measureText(name).width;

        const doubleBorderSize = borderSize * 2;
        const width = baseWidth + doubleBorderSize;
        const height = size + doubleBorderSize;
        ctx.canvas.width = width;
        ctx.canvas.height = height;

        // need to set font again after resizing canvas
        ctx.font = font;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        ctx.fillStyle = 'grey';
        ctx.fillRect(0, 0, width, height);

        // scale to fit but don't stretch
        const scaleFactor = Math.min(1, baseWidth / textWidth);
        ctx.translate(width / 2, height / 2);
        ctx.scale(scaleFactor, 1);
        ctx.fillStyle = 'white';
        ctx.fillText(name, 0, 0);

        return ctx.canvas;
    }

    function makePerson(x, labelWidth, size, name, color) {
        const canvas = makeLabelCanvas(labelWidth, size, name);
        const texture = new THREE.CanvasTexture(canvas);
        // because our canvas is likely not a power of 2
        // in both dimensions set the filtering appropriately.
        texture.minFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        const labelMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
        });
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color,
            flatShading: true,
        });

        const root = new THREE.Object3D();
        root.position.x = x;
        root.position.y = 0;
        root.position.z = 2;
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        root.add(body);
        body.position.y = bodyHeight / 2;

        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        root.add(head);
        head.position.y = bodyHeight + headRadius * 1.1;

        // if units are meters then 0.01 here makes size
        // of the label into centimeters.
        const labelBaseScale = 0.01;
        const label = new THREE.Sprite(labelMaterial);
        root.add(label);
        label.position.y = head.position.y + headRadius + size * labelBaseScale;

        label.scale.x = canvas.width * labelBaseScale;
        label.scale.y = canvas.height * labelBaseScale;

        scene.add(root);
        return root;
    }

    makePerson(5, 100, 32, 'a farmer', 'purple');



    class ColorGUIHelper {
        constructor(object, prop) {
            this.object = object;
            this.prop = prop;
        }

        get value() {
            return `#${this.object[this.prop].getHexString()}`;
        }

        set value(hexString) {
            this.object[this.prop].set(hexString);
        }
    }


    {
        const color = 0x67167E;
        const intensity = 0.25;
        const light = new THREE.AmbientLight(color, intensity);
        scene.add(light);

        const gui = new GUI();
        gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color');
        gui.add(light, 'intensity', 0, 5, 0.01);
    }

    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(5, 10, 2);
        scene.add(light);
        scene.add(light.target);
    }

    {
        const color = 0x9A36A1;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(0, 10, 0);
        light.target.position.set(-5, 0, 0);
        scene.add(light);
        scene.add(light.target);

        const gui = new GUI();
        gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color');
        gui.add(light, 'intensity', 0, 2, 0.01);
        gui.add(light.target.position, 'x', -10, 10, .01);
        gui.add(light.target.position, 'z', -10, 10, .01);
        gui.add(light.target.position, 'y', 0, 10, .01);
    }

    class DegRadHelper {
        constructor(obj, prop) {
            this.obj = obj;
            this.prop = prop;
        }

        get value() {
            return THREE.MathUtils.radToDeg(this.obj[this.prop]);
        }

        set value(v) {
            this.obj[this.prop] = THREE.MathUtils.degToRad(v);
        }
    }

    function makeXYZGUI(gui, vector3, name, onChangeFn) {
        const folder = gui.addFolder(name);
        folder.add(vector3, 'x', -10, 10).onChange(onChangeFn);
        folder.add(vector3, 'y', 0, 10).onChange(onChangeFn);
        folder.add(vector3, 'z', -10, 10).onChange(onChangeFn);
        folder.open();
    }

    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.SpotLight(color, intensity);
        light.position.set(0, 10, 0);
        light.target.position.set(-5, 0, 0);
        scene.add(light);
        scene.add(light.target);

        const helper = new THREE.SpotLightHelper(light);
        scene.add(helper);

        function updateLight() {
            light.target.updateMatrixWorld();
            helper.update();
        }

        updateLight();

        const gui = new GUI();
        gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color');
        gui.add(light, 'intensity', 0, 2, 0.01);
        gui.add(light, 'distance', 0, 40).onChange(updateLight);
        gui.add(new DegRadHelper(light, 'angle'), 'value', 0, 90).name('angle').onChange(updateLight);
        gui.add(light, 'penumbra', 0, 1, 0.01);

        makeXYZGUI(gui, light.position, 'position', updateLight);
        makeXYZGUI(gui, light.target.position, 'target', updateLight);
    }







    raycaster = new THREE.Raycaster();

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.xr.addEventListener( 'sessionstart', () => baseReferenceSpace = renderer.xr.getReferenceSpace() );
    renderer.shadowMap.enabled = true;
    renderer.xr.enabled = true;

    container.appendChild( renderer.domElement );
    document.body.appendChild( renderer.domElement );
    document.body.appendChild( VRButton.createButton( renderer ) );

    // controllers

    function onSelectStart() {

        this.userData.isSelecting = true;

    }

    function onSelectEnd() {

        this.userData.isSelecting = false;

        if ( INTERSECTION ) {

            const offsetPosition = { x: - INTERSECTION.x, y: - INTERSECTION.y, z: - INTERSECTION.z, w: 1 };
            const offsetRotation = new THREE.Quaternion();
            const transform = new XRRigidTransform( offsetPosition, offsetRotation );
            const teleportSpaceOffset = baseReferenceSpace.getOffsetReferenceSpace( transform );

            renderer.xr.setReferenceSpace( teleportSpaceOffset );

        }

    }

    controller1 = renderer.xr.getController( 0 );
    controller1.addEventListener( 'selectstart', onSelectStart );
    controller1.addEventListener( 'selectend', onSelectEnd );
    controller1.addEventListener( 'connected', function ( event ) {

        this.add( buildController( event.data ) );

    } );
    controller1.addEventListener( 'disconnected', function () {

        this.remove( this.children[ 0 ] );

    } );
    scene.add( controller1 );

    controller2 = renderer.xr.getController( 1 );
    controller2.addEventListener( 'selectstart', onSelectStart );
    controller2.addEventListener( 'selectend', onSelectEnd );
    controller2.addEventListener( 'connected', function ( event ) {

        this.add( buildController( event.data ) );

    } );
    controller2.addEventListener( 'disconnected', function () {

        this.remove( this.children[ 0 ] );

    } );
    scene.add( controller2 );

    // The XRControllerModelFactory will automatically fetch controller models
    // that match what the user is holding as closely as possible. The models
    // should be attached to the object returned from getControllerGrip in
    // order to match the orientation of the held device.

    const controllerModelFactory = new XRControllerModelFactory();
    const handModelFactory = new XRHandModelFactory();


    //

    // Hand 1
    controllerGrip1 = renderer.xr.getControllerGrip( 0 );
    controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
    scene.add( controllerGrip1 );

    hand1 = renderer.xr.getHand( 0 );
    hand1.addEventListener( 'pinchstart', onPinchStartLeft );
    hand1.addEventListener( 'pinchend', () => {

        scaling.active = false;

    } );
    hand1.add( handModelFactory.createHandModel( hand1 ) );

    scene.add( hand1 );

    // Hand 2
    controllerGrip2 = renderer.xr.getControllerGrip( 1 );
    controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
    scene.add( controllerGrip2 );

    hand2 = renderer.xr.getHand( 1 );
    hand2.addEventListener( 'pinchstart', onPinchStartRight );
    hand2.addEventListener( 'pinchend', onPinchEndRight );
    hand2.add( handModelFactory.createHandModel( hand2 ) );
    scene.add( hand2 );

    //


    const line = new THREE.Line( geometry );
    line.name = 'line';
    line.scale.z = 5;

    controller1.add( line.clone() );
    controller2.add( line.clone() );

    //
    window.addEventListener( 'resize', onWindowResize );

}
const SphereRadius = 0.05;
function onPinchStartLeft( event ) {

    const controller = event.target;

    if ( grabbing ) {

        const indexTip = controller.joints[ 'index-finger-tip' ];
        const sphere = collideObject( indexTip );

        if ( sphere ) {

            const sphere2 = hand2.userData.selected;
            console.log( 'sphere1', sphere, 'sphere2', sphere2 );
            if ( sphere === sphere2 ) {

                scaling.active = true;
                scaling.object = sphere;
                scaling.initialScale = sphere.scale.x;
                scaling.initialDistance = indexTip.position.distanceTo( hand2.joints[ 'index-finger-tip' ].position );
                return;

            }

        }

    }

    const geometry = new THREE.BoxGeometry( SphereRadius, SphereRadius, SphereRadius );
    const material = new THREE.MeshStandardMaterial( {
        color: Math.random() * 0xffffff,
        roughness: 1.0,
        metalness: 0.0
    } );
    const spawn = new THREE.Mesh( geometry, material );
    spawn.geometry.computeBoundingSphere();

    const indexTip = controller.joints[ 'index-finger-tip' ];
    spawn.position.copy( indexTip.position );
    spawn.quaternion.copy( indexTip.quaternion );

    spheres.push( spawn );

    scene.add( spawn );

}

function collideObject( indexTip ) {

    for ( let i = 0; i < spheres.length; i ++ ) {

        const sphere = spheres[ i ];
        const distance = indexTip.getWorldPosition( tmpVector1 ).distanceTo( sphere.getWorldPosition( tmpVector2 ) );

        if ( distance < sphere.geometry.boundingSphere.radius * sphere.scale.x ) {

            return sphere;

        }

    }

    return null;

}


function onPinchStartRight( event ) {

    const controller = event.target;
    const indexTip = controller.joints[ 'index-finger-tip' ];
    const object = collideObject( indexTip );
    if ( object ) {

        grabbing = true;
        indexTip.attach( object );
        controller.userData.selected = object;
        console.log( 'Selected', object );

    }

}

function onPinchEndRight( event ) {

    const controller = event.target;

    if ( controller.userData.selected !== undefined ) {

        const object = controller.userData.selected;
        object.material.emissive.b = 0;
        scene.attach( object );

        controller.userData.selected = undefined;
        grabbing = false;

    }

    scaling.active = false;

}

function buildController( data ) {

    let geometry, material;

    switch ( data.targetRayMode ) {

        case 'tracked-pointer':

            geometry = new THREE.BufferGeometry();
            geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
            geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );

            material = new THREE.LineBasicMaterial( { vertexColors: true, blending: THREE.AdditiveBlending } );

            return new THREE.Line( geometry, material );

        case 'gaze':

            geometry = new THREE.RingGeometry( 0.02, 0.04, 32 ).translate( 0, 0, - 1 );
            material = new THREE.MeshBasicMaterial( { opacity: 0.5, transparent: true } );
            return new THREE.Mesh( geometry, material );

    }

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

    renderer.setAnimationLoop( render );

}

function render() {
    if ( scaling.active ) {

        const indexTip1Pos = hand1.joints[ 'index-finger-tip' ].position;
        const indexTip2Pos = hand2.joints[ 'index-finger-tip' ].position;
        const distance = indexTip1Pos.distanceTo( indexTip2Pos );
        const newScale = scaling.initialScale + distance / scaling.initialDistance - 1;
        scaling.object.scale.setScalar( newScale );

    }
    renderer.render( scene, camera );

    INTERSECTION = undefined;
    if ( controller1.userData.isSelecting === true ) {

        tempMatrix.identity().extractRotation( controller1.matrixWorld );

        raycaster.ray.origin.setFromMatrixPosition( controller1.matrixWorld );
        raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix );

        const intersects = raycaster.intersectObjects( [ floor ] );

        if ( intersects.length > 0 ) {

            INTERSECTION = intersects[ 0 ].point;

        }

    } else if ( controller2.userData.isSelecting === true ) {

        tempMatrix.identity().extractRotation( controller2.matrixWorld );

        raycaster.ray.origin.setFromMatrixPosition( controller2.matrixWorld );
        raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix );

        const intersects = raycaster.intersectObjects( [ floor ] );

        if ( intersects.length > 0 ) {

            INTERSECTION = intersects[ 0 ].point;

        }

    }

    if ( INTERSECTION ) marker.position.copy( INTERSECTION );

    marker.visible = INTERSECTION !== undefined;

    renderer.render( scene, camera );

}
