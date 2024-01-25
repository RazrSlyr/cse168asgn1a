import { DirectionalLight, AmbientLight, PointLight } from "three";

function makeLights(){
    
const ambientColor = 0xFFFFFF;
const ambientIntensity = 0.3;
const ambientLight = new AmbientLight(ambientColor, ambientIntensity);
ambientLight.position.set(5,5,-5);

const color = 0xFFFFFF;
const intensity = 1;
const light = new PointLight(color, intensity);
light.castShadow = true;
let angle = 90;
light.position.set(-1, 7, 4);
//light.target.position.set(0,-2,0);

return {ambientLight, light};

}

export{makeLights}