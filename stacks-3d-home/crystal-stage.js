import * as THREE from './vendor/three.module.js';

export function lightCrystalStage(renderer, scene) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x101922);
  const panels = [
    [0xffffff, [0, 6, 1], [9, 3]],
    [0x79e8ff, [-5, 2, 1], [3, 7]],
    [0xbab0ff, [5, 3, -2], [2, 6]],
    [0xffffff, [1, 1, 6], [1, 5]],
  ];
  for (const [color, position, size] of panels) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(...size), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    panel.position.set(...position); panel.lookAt(0, 1, 0); studio.add(panel);
  }
  const generator = new THREE.PMREMGenerator(renderer);
  const environment = generator.fromScene(studio, .06);
  scene.environment = environment.texture;
  generator.dispose();
  studio.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x080b0e, roughness: .52, metalness: .3 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.84; ground.receiveShadow = true; scene.add(ground);
  scene.fog = new THREE.FogExp2(0x080c12, .035);
  const wash = new THREE.SpotLight(0x78c9df, 70, 20, Math.PI / 3, 1, 1.5);
  wash.position.set(0, 6, 1); wash.target.position.set(0, -.8, 0); scene.add(wash, wash.target);
}

export function crystalMaterials() {
  return [0x11bce3, 0x6659ef, 0xffbe44, 0xb43dff, 0xf43f3f].map(color => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x0b141d).lerp(new THREE.Color(color), .16), roughness: .16, metalness: .42,
    transmission: .38, thickness: .48, attenuationColor: color, attenuationDistance: 1.15,
    ior: 1.48, clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: 2.15,
    emissive: color, emissiveIntensity: .075, transparent: true, opacity: .72, depthWrite: false,
  }));
}

export function crystalDetails(block, index) {
  const core = new THREE.Mesh(new THREE.BoxGeometry(.29, .29, .29), new THREE.MeshPhysicalMaterial({
    color: 0x74eaff, emissive: 0x18cfff, emissiveIntensity: .85, metalness: .12,
    roughness: .08, transmission: .58, thickness: .35, transparent: true, opacity: .86,
    clearcoat: 1, clearcoatRoughness: .04,
  }));
  core.rotation.set(.34 + index * .07, .58 + index * .11, .24);
  core.renderOrder=3;
  const innerCore = new THREE.Mesh(new THREE.BoxGeometry(.115, .115, .115), new THREE.MeshPhysicalMaterial({
    color: 0xb783ff, emissive: 0x8d45ff, emissiveIntensity: 1.6, roughness: .12,
    metalness: .25, transmission: .25, transparent: true, opacity: .95,
  }));
  innerCore.rotation.set(.35, .62, .18);innerCore.renderOrder=4;core.add(innerCore);

  const windowMaterial=new THREE.MeshPhysicalMaterial({
    color: 0x07131c, emissive: 0x0a3c52, emissiveIntensity: .18, roughness: .08,
    metalness: .2, transmission: .72, thickness: .18, transparent: true, opacity: .48,
    side: THREE.DoubleSide, depthWrite: false,
  });

  const faceProjectionPoints=[];
  const outer=[[-.245,-.245],[.245,-.245],[.245,.245],[-.245,.245]];
  const inner=[[-.105,-.105],[.105,-.105],[.105,.105],[-.105,.105]];
  for(let i=0;i<4;i++){
    const next=(i+1)%4;
    faceProjectionPoints.push(new THREE.Vector3(...inner[i],.414),new THREE.Vector3(...inner[next],.414));
    faceProjectionPoints.push(new THREE.Vector3(...outer[i],.414),new THREE.Vector3(...inner[i],.414));
  }
  const projectionMaterial=new THREE.LineBasicMaterial({
    color:0x59e7ff,transparent:true,opacity:.72,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,
  });
  const channelMaterial=new THREE.MeshBasicMaterial({
    color:0x55e8ff,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,
  });
  const faceRotations=[[0,0,0],[0,Math.PI,0],[0,Math.PI/2,0],[0,-Math.PI/2,0],[-Math.PI/2,0,0],[Math.PI/2,0,0]];
  const windows=new THREE.InstancedMesh(new THREE.PlaneGeometry(.55,.55),windowMaterial,faceRotations.length);
  const channels=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),channelMaterial,faceRotations.length*8);
  const projectionPoints=[];
  const identity=new THREE.Quaternion(),matrix=new THREE.Matrix4(),localMatrix=new THREE.Matrix4();
  let channelIndex=0;
  faceRotations.forEach((rotation,faceIndex)=>{
    const faceMatrix=new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rotation));
    localMatrix.compose(new THREE.Vector3(0,0,.403),identity,new THREE.Vector3(1,1,1));
    windows.setMatrixAt(faceIndex,matrix.multiplyMatrices(faceMatrix,localMatrix));
    for(const point of faceProjectionPoints)projectionPoints.push(point.clone().applyMatrix4(faceMatrix));
    for(const sx of [-1,1])for(const sy of [-1,1]){
      localMatrix.compose(new THREE.Vector3(sx*.265,sy*.335,.432),identity,new THREE.Vector3(.15,.025,.026));
      channels.setMatrixAt(channelIndex++,matrix.multiplyMatrices(faceMatrix,localMatrix));
      localMatrix.compose(new THREE.Vector3(sx*.335,sy*.265,.432),identity,new THREE.Vector3(.025,.15,.026));
      channels.setMatrixAt(channelIndex++,matrix.multiplyMatrices(faceMatrix,localMatrix));
    }
  });
  windows.instanceMatrix.needsUpdate=true;windows.renderOrder=2;
  channels.instanceMatrix.needsUpdate=true;channels.renderOrder=6;
  const projection=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(projectionPoints),projectionMaterial);
  projection.renderOrder=5;

  const crack = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-.3, .38, .442), new THREE.Vector3(-.08, .12, .443),
    new THREE.Vector3(-.17, -.02, .443), new THREE.Vector3(.1, -.16, .443), new THREE.Vector3(.22, -.38, .443),
  ]), new THREE.LineBasicMaterial({ color: 0xffd5c1, transparent: true, opacity: 0 }));
  crack.renderOrder=7;
  block.add(windows,projection,channels,core,crack);
  block.userData.core=core;
  block.userData.innerCore=innerCore;
  block.userData.windowMaterial=windowMaterial;
  block.userData.projectionMaterial=projectionMaterial;
  block.userData.channelMaterial=channelMaterial;
  block.userData.crack=crack;
  block.userData.spinDirection=index%2?1:-1;
}

export function stageEffects(scene, turntable) {
  const bonusRings = new THREE.Group(); scene.add(bonusRings);
  for (let i = 0; i < 2; i++) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(1, .006, 6, 96, Math.PI * 1.5), new THREE.MeshBasicMaterial({ color: 0xffd46b, transparent: true, opacity: .6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    arc.rotation.set(Math.PI / 2 + (i ? -.16 : .16), .15, i * Math.PI); bonusRings.add(arc);
  }
  const inset = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, .014, 96), new THREE.MeshPhysicalMaterial({ color: 0x101b23, metalness: .75, roughness: .19, clearcoat: 1 }));
  inset.position.y = -.456; inset.receiveShadow = true; turntable.add(inset);
  const lowerRim = new THREE.Mesh(new THREE.TorusGeometry(3.89, .018, 8, 128), new THREE.MeshBasicMaterial({ color: 0x4ce4ff, transparent: true, opacity: .45 }));
  lowerRim.rotation.x = Math.PI / 2; lowerRim.position.y = -.68; turntable.add(lowerRim);
  const pulses = Array.from({ length: 6 }, () => {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(.94, 1, 96), new THREE.MeshBasicMaterial({ color: 0x73efff, side: THREE.DoubleSide, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    mesh.rotation.x = -Math.PI / 2; mesh.position.y = -.439; mesh.visible = false; scene.add(mesh);
    return { mesh, age: 2, duration: 1, bonus: false };
  });
  let cursor = 0;
  return {
    pulse(color, bonus = false) {
      const p = pulses[cursor++ % pulses.length]; p.age = 0; p.bonus = bonus; p.duration = bonus ? 1.5 : .85;
      p.mesh.material.color.set(color); p.mesh.visible = true;
    },
    update(dt, moving, color, bonus = 0, height = 3, running = false) {
      lowerRim.material.color.lerp(new THREE.Color(color), Math.min(1, dt * 4));
      bonusRings.visible = moving && running && bonus > 0;
      bonusRings.position.y = height * .48;
      bonusRings.scale.setScalar(Math.min(3.5, 1.2 + height * .35));
      if (moving) bonusRings.rotation.y += dt * .6;
      for (const arc of bonusRings.children) arc.material.color.set(color);
      for (const p of pulses) {
        p.age += dt; const t = p.age / p.duration; p.mesh.visible = moving && t < 1;
        p.mesh.scale.setScalar(.3 + Math.min(1, t) * 3.35);
        p.mesh.material.opacity = (1 - Math.min(1, t)) * (p.bonus ? .6 : .25);
      }
    },
  };
}

export function scoreBurst(stage) {
  const layer = document.createElement('div'); layer.className = 'score-burst'; layer.setAttribute('aria-hidden', 'true'); stage.append(layer);
  let animations = [];
  return {
    clear() { animations.forEach(a => a.cancel()); animations = []; layer.replaceChildren(); },
    play(multiplier, amount, moving) {
      this.clear(); if (!moving) return;
      for (let i = 0; i < 9; i++) {
        const node = document.createElement('span'); node.textContent = i % 3 === 0 ? amount : multiplier.toFixed(2) + 'x'; layer.append(node);
        const angle = -Math.PI + i / 8 * Math.PI;
        const x = Math.cos(angle) * Math.min(220, stage.clientWidth * .32), y = Math.sin(angle) * 125 - 30;
        const animation = node.animate([
          { transform: 'translate(-50%, 30px) scale(.35)', opacity: 0 },
          { transform: 'translate(-50%, -24px) scale(1)', opacity: 1, offset: .24 },
          { transform: `translate(calc(-50% + ${x}px), ${y}px) scale(.8)`, opacity: 1, offset: .66 },
          { transform: `translate(calc(-50% + ${x * 1.1}px), ${y + 50}px) scale(.35)`, opacity: 0 },
        ], { duration: 1500, delay: i * 45, easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'both' });
        animations.push(animation); animation.onfinish = () => node.remove();
      }
    },
  };
}
