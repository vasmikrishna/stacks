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
    color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), .35), roughness: .085, metalness: .02, transmission: .82, thickness: .65,
    attenuationColor: color, attenuationDistance: 1.6,
    ior: 1.46, clearcoat: 1, clearcoatRoughness: .06, envMapIntensity: 1.8,
    emissive: color, emissiveIntensity: .1,
  }));
}

export function crystalDetails(block, index) {
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(.27), new THREE.MeshPhysicalMaterial({
    color: 0x9df5ff, emissive: 0x21bdff, emissiveIntensity: .32, metalness: .4,
    roughness: .2,
  }));
  core.rotation.set(index * .8, .6, .3); block.add(core);
  const crack = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-.3, .38, .418), new THREE.Vector3(-.08, .12, .419),
    new THREE.Vector3(-.17, -.02, .419), new THREE.Vector3(.1, -.16, .419), new THREE.Vector3(.22, -.38, .419),
  ]), new THREE.LineBasicMaterial({ color: 0xffd5c1, transparent: true, opacity: 0 }));
  block.add(crack); block.userData.core = core; block.userData.crack = crack;
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
