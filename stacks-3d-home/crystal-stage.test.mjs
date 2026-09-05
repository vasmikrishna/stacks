import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.js';
import { stageEffects } from './crystal-stage.js';

test('landing impact jolts the turntable and settles back to its origin', () => {
  const scene = new THREE.Scene();
  const turntable = new THREE.Group();
  scene.add(turntable);
  const effects = stageEffects(scene, turntable);

  effects.impact(1);
  effects.update(1 / 60, true, 0x73efff, 0, 3, true);
  assert(turntable.position.lengthSq() > 0);
  assert(Math.abs(turntable.rotation.x) + Math.abs(turntable.rotation.z) > 0);

  for (let frame = 0; frame < 48; frame++) {
    effects.update(1 / 60, true, 0x73efff, 0, 3, true);
  }
  assert(turntable.position.length() < .001);
  assert(Math.abs(turntable.rotation.x) + Math.abs(turntable.rotation.z) < .001);
});
