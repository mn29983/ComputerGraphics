import * as THREE from "three";

let helper;

export function setupCollisionHelpers(scene) {
  helper = new THREE.Box3Helper(new THREE.Box3(), 0xff0000);
  scene.add(helper);
}

export function updateCollisionHelpers(objects, player) {
  if (!helper || !player) return;

  const playerBox = new THREE.Box3().setFromObject(player);

  objects.forEach((object) => {
    if (!object) return;
    if (object.updateWorldMatrix) object.updateWorldMatrix();

    helper.setFromObject(object);
    const collision = playerBox.intersectsBox(helper);
    helper.material.color.set(collision ? 0x00ff00 : 0xff0000);
  });
}
