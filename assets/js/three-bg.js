/* Ambient Three.js particle background — shared across all pages.
   Renders a slowly drifting dust field in the site's cream/wine palette,
   with mouse parallax and scroll-linked motion. Skips itself entirely
   when THREE fails to load or the user prefers reduced motion. */
(() => {
  if (!window.THREE) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    zIndex: '-1',
    pointerEvents: 'none'
  });
  document.body.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0608, 0.012);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 400);
  camera.position.z = 70;

  // Soft round sprite so points render as glowing dots instead of squares
  function makeSprite() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }
  const sprite = makeSprite();

  const cream = new THREE.Color('#e8dcc4');
  const wine = new THREE.Color('#8a2033');
  const isMobile = window.innerWidth < 768;

  function makeCloud(count, spread, size, opacity) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 1.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread * 2;
      tmp.copy(cream).lerp(wine, Math.random() * 0.85);
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size,
      map: sprite,
      vertexColors: true,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    return new THREE.Points(geo, mat);
  }

  // Near cloud: brighter, faster. Far cloud: dim haze for depth.
  const near = makeCloud(isMobile ? 260 : 650, 70, 1.15, 0.85);
  const far = makeCloud(isMobile ? 180 : 450, 120, 2.4, 0.28);
  scene.add(near, far);

  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  let scrollY = window.scrollY;

  window.addEventListener('pointermove', e => {
    targetX = e.clientX / window.innerWidth - 0.5;
    targetY = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  renderer.setAnimationLoop(time => {
    // Ease the mouse influence so movement stays silky
    mouseX += (targetX - mouseX) * 0.04;
    mouseY += (targetY - mouseY) * 0.04;

    near.rotation.y = time * 0.000045 + mouseX * 0.22;
    near.rotation.x = mouseY * 0.14 + scrollY * 0.00008;
    far.rotation.y = -time * 0.00002 + mouseX * 0.1;
    far.rotation.x = mouseY * 0.06 + scrollY * 0.00004;

    camera.position.y = -scrollY * 0.006;

    renderer.render(scene, camera);
  });
})();
