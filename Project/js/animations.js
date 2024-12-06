export function setupAnimations(animations, mixer, actions) {
  animations.forEach((clip) => {
    const action = mixer.clipAction(clip);
    actions[clip.name] = action;
  });
}
