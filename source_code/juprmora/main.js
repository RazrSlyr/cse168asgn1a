import * as THREE from 'three';
import {makeInstance} from "./objects/objectwrapper.js";
import { resizeRendererToDisplaySize } from './context.js';
import camera from './camera.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {canvas, renderer} from './context.js';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {MTLLoader} from 'three/addons/loaders/MTLLoader.js';
import { makeLights } from './lights.js';
import {VRButton} from 'three/addons/webxr/VRButton.js';

const scene = new THREE.Scene();

const fogColor = 'lightblue';
const dayTimeColor = 0xFFFFFF;

scene.fog = new THREE.FogExp2(fogColor, 0.0);

let {ambientLight, light} = makeLights();

const skygeom = new THREE.SphereGeometry(50, 50, 50);
//skygeom.computeFaceNormals();
skygeom.applyMatrix4(new THREE.Matrix4().makeScale(1, -1, 1));
skygeom.computeVertexNormals();
const loader = new THREE.TextureLoader();



let skymat;
let foo;
const texture = loader.load('./src/textures/background.png', ()=>{
	const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
	texture.flipY = true;
	rt.fromEquirectangularTexture(renderer, texture);
	//rt.texture.flipY = true;
	skymat = new THREE.MeshBasicMaterial({envMap: rt.texture});
	
	skymat.side = THREE.FrontSide;
	//skymat.flipY = true;
	const sky = new THREE.Mesh(skygeom, skymat);
	//sky.rotateY(90);
	console.log(sky);
	scene.add(sky);

});


//console.log(texture);

const boxWidth = 1;
const boxHeight = 1;
const boxDepth = 1;
const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);


const planeGeometry = new THREE.BoxGeometry(20, 0.001, 20);
//planeGeometry.rotateX(-Math.PI/2);
planeGeometry.translate(0,-0.5,0);

//const material = new THREE.MeshBasicMaterial({color: 0x44aa88});
const material = new THREE.MeshPhongMaterial({color: 0x044aa88});

const t = loader.load('./src/textures/grass.png');
t.wrapS = THREE.RepeatWrapping;
t.wrapT = THREE.RepeatWrapping;
t.minFilter = THREE.NearestFilter;
t.repeat.set(5,5);
const planeMaterial = new THREE.MeshPhongMaterial({
	map: t,
});

const stonetex = loader.load('./src/textures/stone.png');
t.maxFilter = THREE.NearestFilter;
const stoneMaterial = new THREE.MeshPhongMaterial({map:stonetex,});


function placeBlocks(vertices){
	for (const pos of vertices){
		//console.log(pos);
		let block = makeInstance(geometry, stoneMaterial);
		block.translateOnAxis(pos, 1);
		//console.log(block);
		scene.add(block);
	}
}

let vs = [new THREE.Vector3(0,0,0),
		  new THREE.Vector3(0,0,1),
		  new THREE.Vector3(0,0,2),
		  new THREE.Vector3(0,0,3),
		  new THREE.Vector3(0,0,4),
		  new THREE.Vector3(1,0,0),
		  new THREE.Vector3(2,0,0),
		  new THREE.Vector3(3,0,0),
		  new THREE.Vector3(4,0,0),
		  new THREE.Vector3(1,0,4),
		  new THREE.Vector3(2,0,4),
		  new THREE.Vector3(3,0,4),
		  new THREE.Vector3(4,0,4),
		  new THREE.Vector3(4,0,0),
		  new THREE.Vector3(4,0,1),
		  new THREE.Vector3(4,0,2),
		  new THREE.Vector3(4,0,3),
		  new THREE.Vector3(4,0,4)
		];


material.shininess = 0.0;
const cube = new THREE.Mesh(geometry, material);
cube.castShadow=true;
scene.add(cube);

planeMaterial.shininess = 0.3;
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.receiveShadow = true;
//plane.castShadow = true;
scene.add(plane);


const test = new THREE.Mesh(geometry, planeMaterial);
test.position.set(3,0,3);
scene.add(test);
placeBlocks(vs);

for (let block of vs){
	block.add(new THREE.Vector3(0,1,0));
}
placeBlocks(vs);

//const helper = new THREE.DirectionalLightHelper(light);
//scene.add(helper);

const lightCube = new THREE.Mesh(geometry, material);

function updateLight(time) {
	let lightPos = Math.sin(time*0.5) * 20;
	light.position.y = lightPos;
	light.position.z = Math.cos(time *0.5) * 20;
	if (light.position.y < 0){
		//console.log(light.position.y)
		//console.log("fogLevel:", 10 + lightPos);
		scene.fog.density = Math.sin(time*0.5) / 2;
		const color = new THREE.Color();
		const color1 = new THREE.Color(fogColor);
		const color2 = new THREE.Color(dayTimeColor);
		color.lerpColors(color1, color2, Math.sin(time * 0.5));
		//console.log(color);
		ambientLight.color = color;

	}
	else{
		scene.fog.near = 100;
		scene.fog.far = 100;
	}
	lightCube.position.y = lightPos + Math.sin(time * 0.5);
	lightCube.position.z = Math.cos(time *0.5) * 11;
	lightCube.lookAt(0,0,0);
	lightCube.updateMatrix();
	//light.target.updateMatrixWorld();
	//helper.update();
  }
scene.add(lightCube);
updateLight();
scene.add(light);
scene.add(ambientLight);


const spriteTex = loader.load('./src/textures/baron.png');
spriteTex.maxFilter = THREE.NearestFilter;
const spriteMat = new THREE.SpriteMaterial({map: spriteTex, side: THREE.DoubleSide});
//const spriteGeo = THREE.BoxGeometry(5, 5, 0);

const sprite = new THREE.Sprite(spriteMat);
sprite.position.set(-5, 0, -5);
sprite.scale.setScalar(50.0);
sprite.translateY(-0.5);
scene.add(sprite);


{
	const objLoader = new OBJLoader();
	const mtlLoader = new MTLLoader();
	mtlLoader.load('./src/objects/Lowpoly_tree_sample.mtl', (mtl) => {
	  	mtl.preload();
		mtl.shininess = 0.0;
	  	objLoader.setMaterials(mtl);
		objLoader.load('./src/objects/Lowpoly_tree_sample.obj', (root) => {
		root.scale.setScalar(0.25);
		let test = root.clone();
		//test.castShadow = true;
		test.traverse(function(child) {
			child.castShadow = true;
		});
		root.traverse(function(child) {
			child.castShadow = true;
		});

		root.castShadow = true;
		test.translateX(8.0);
		root.translateZ(8.0);
		test.translateY(-0.5);
		root.translateY(-0.5);

		scene.add(test);
	 	scene.add(root);
		});
	});
}

const controls = new OrbitControls(camera, canvas);
document.body.appendChild( VRButton.createButton( renderer ) );
renderer.xr.enabled = true;

function render(time){
	let seconds = time * 0.001;
	

	updateLight(seconds);
	//updateLight(seconds)
	controls.update();


	renderer.render(scene, camera);
	
	if (resizeRendererToDisplaySize(renderer)) {
		const canvas = renderer.domElement;
		camera.aspect = canvas.clientWidth / canvas.clientHeight;
		//controls.handleResize();
		camera.updateProjectionMatrix();
		controls.update();
	}
	// requestAnimationFrame(render);

}
console.log(scene);
//requestAnimationFrame(render);
renderer.setAnimationLoop(render);