import * as THREE from 'three';

const fov = 75;
const aspect = 2;  // the canvas default
const near = 0.5;
const far = 100;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2;
export default camera;