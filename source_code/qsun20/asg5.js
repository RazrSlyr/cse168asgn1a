import * as THREE from './lib/three.module.js';
import {OrbitControls} from './lib/OrbitControls.js';
import {OBJLoader} from './lib/OBJLoader.js';
import {MTLLoader} from './lib/MTLLoader.js';
import {GUI} from './lib/lil-gui.module.min.js';
import {VRButton} from './lib/jsm/webxr/VRButton.js';

function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;


  renderer.xr.enabled = true;
  document.body.appendChild(VRButton.createButton(renderer));

  const fov = 75;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 1000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(10, 10, 10);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0);
  controls.update();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('black');

  {
      const planeSize = 50;

      const loader = new THREE.TextureLoader();
      const texture = loader.load('grass.jpg');
      texture.encoding = THREE.sRGBEncoding;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.magFilter = THREE.NearestFilter;
      const repeats = planeSize / 2;
      texture.repeat.set(repeats, repeats);

      const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
      const planeMat = new THREE.MeshPhongMaterial({
          map: texture,
          side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(planeGeo, planeMat);
      mesh.rotation.x = Math.PI * -.5;
      scene.add(mesh);
  }


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

  }


  {
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
  }

  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

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


  {
      const color = 'grey';
      const density = 0.07;
      scene.fog = new THREE.FogExp2(color, density);
  }


  function resizeRendererToDisplaySize(renderer) {
      const canvas = renderer.domElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const needResize = canvas.width !== width || canvas.height !== height;
      if (needResize) {
          renderer.setSize(width, height, false);
      }
      return needResize;
  }

  function render(time) {
      time *= 0.001;

      if (resizeRendererToDisplaySize(renderer)) {
          const canvas = renderer.domElement;
          camera.aspect = canvas.clientWidth / canvas.clientHeight;
          camera.updateProjectionMatrix();
      }

      cubes.forEach((cube, ndx) => {
          const speed = 10 + ndx * .1;
          const rot = time * speed;
          cube.rotation.x = rot;
          cube.rotation.y = rot;
      });

      renderer.render(scene, camera);

      renderer.setAnimationLoop(function (time) {
          // Your animation and rendering logic here

          // You can still use the 'time' parameter for animations based on time
          time *= 0.001;

          if (resizeRendererToDisplaySize(renderer)) {
              const canvas = renderer.domElement;
              camera.aspect = canvas.clientWidth / canvas.clientHeight;
              camera.updateProjectionMatrix();
          }

          cubes.forEach((cube, ndx) => {
              const speed = 10 + ndx * 0.1;
              const rot = time * speed;
              cube.rotation.x = rot;
              cube.rotation.y = rot;
          });

          renderer.render(scene, camera);
      });
  }

    renderer.setAnimationLoop(function (time) {
        // Your animation and rendering logic here

        // You can still use the 'time' parameter for animations based on time
        time *= 0.001;

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        cubes.forEach((cube, ndx) => {
            const speed = 10 + ndx * 0.1;
            const rot = time * speed;
            cube.rotation.x = rot;
            cube.rotation.y = rot;
        });

        renderer.render(scene, camera);
    });
}

main();