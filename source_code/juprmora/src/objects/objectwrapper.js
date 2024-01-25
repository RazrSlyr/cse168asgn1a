import { MeshPhongMaterial, Mesh } from "three";

function makeInstance(geometry, material, scene) {
  
    const cube = new Mesh(geometry, material);
    return cube;
  }

export {makeInstance};