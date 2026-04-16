/**
 * Three.js scene helper for sol structures.
 * White sculptures on a ground plane with soft shadows.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export { THREE };

export function createScene(container, opts = {}) {
  const w = container.clientWidth || 720;
  const h = container.clientHeight || 720;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(opts.bg || 0xffffff);

  // Camera
  const cam = new THREE.PerspectiveCamera(opts.fov || 30, w / h, 0.1, 200);
  const d = opts.distance || 20;
  const angle = (opts.angle || 45) * Math.PI / 180;
  const pitch = (opts.pitch || 30) * Math.PI / 180;
  cam.position.set(
    d * Math.cos(pitch) * Math.sin(angle),
    d * Math.sin(pitch),
    d * Math.cos(pitch) * Math.cos(angle),
  );
  cam.lookAt(opts.lookAt ? new THREE.Vector3(...opts.lookAt) : new THREE.Vector3(0, opts.lookY || 2, 0));

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;
  container.appendChild(renderer.domElement);

  // Lights — gallery feel: warm ambient, cool key
  const ambient = new THREE.AmbientLight(0xfff8f0, 1.0);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xf0e8e0, 0.6);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sun.position.set(8, 15, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.left = -15;
  sun.shadow.camera.right = 15;
  sun.shadow.camera.top = 15;
  sun.shadow.camera.bottom = -15;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 50;
  sun.shadow.bias = -0.001;
  sun.shadow.radius = 16;
  scene.add(sun);

  // Fill light from below-opposite
  const fill = new THREE.DirectionalLight(0xffffff, 0.3);
  fill.position.set(-5, 2, -5);
  scene.add(fill);

  // Ground plane
  if (opts.ground !== false) {
    const groundSize = opts.groundSize || 30;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(groundSize, groundSize),
      new THREE.ShadowMaterial({ opacity: 0.06 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = opts.groundY || 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid lines (off by default)
    if (opts.grid === true) {
      const grid = new THREE.GridHelper(groundSize, opts.gridDivisions || 20, 0xdddddd, 0xeeeeee);
      grid.position.y = (opts.groundY || 0) + 0.001;
      scene.add(grid);
    }
  }

  // Materials
  // Painted aluminum — warm off-white, distinct from background
  const whiteMat = new THREE.MeshStandardMaterial({
    color: opts.matColor || 0x888480,
    roughness: 0.6,
    metalness: 0,
  });

  // Orbit controls
  const controls = new OrbitControls(cam, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  const lookTarget = opts.lookAt || [0, opts.lookY || 2, 0];
  controls.target.set(...lookTarget);
  controls.update();

  // Helpers
  function addBar(x1, y1, z1, x2, y2, z2, thickness = 0.08, mat) {
    const dx = x2-x1, dy = y2-y1, dz = z2-z1;
    const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
    const geo = new THREE.BoxGeometry(thickness, len, thickness);
    const mesh = new THREE.Mesh(geo, mat || whiteMat);
    mesh.position.set((x1+x2)/2, (y1+y2)/2, (z1+z2)/2);
    // Orient bar along the direction
    if (Math.abs(dx) > 0.001) {
      mesh.rotation.z = Math.PI / 2;
    } else if (Math.abs(dz) > 0.001) {
      mesh.rotation.x = Math.PI / 2;
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function addOpenBox(ox, oy, oz, sx, sy, sz, thickness, mat) {
    const t = thickness || 0.08;
    const x0=ox, x1=ox+sx, y0=oy, y1=oy+sy, z0=oz, z1=oz+sz;
    const B = (a,b,c,d,e,f) => addBar(a,b,c,d,e,f,t,mat);
    // bottom
    B(x0,y0,z0,x1,y0,z0); B(x1,y0,z0,x1,y0,z1); B(x0,y0,z1,x1,y0,z1); B(x0,y0,z0,x0,y0,z1);
    // top
    B(x0,y1,z0,x1,y1,z0); B(x1,y1,z0,x1,y1,z1); B(x0,y1,z1,x1,y1,z1); B(x0,y1,z0,x0,y1,z1);
    // verticals
    B(x0,y0,z0,x0,y1,z0); B(x1,y0,z0,x1,y1,z0); B(x1,y0,z1,x1,y1,z1); B(x0,y0,z1,x0,y1,z1);
  }

  function addOpenCube(ox, oy, oz, s, thickness, mat) {
    addOpenBox(ox, oy, oz, s, s, s, thickness, mat);
  }

  function addClosedBox(ox, oy, oz, sx, sy, sz, mat) {
    const geo = new THREE.BoxGeometry(sx, sy, sz);
    const mesh = new THREE.Mesh(geo, mat || whiteMat);
    mesh.position.set(ox + sx/2, oy + sy/2, oz + sz/2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function addPanel(ox, oy, oz, sx, sy, sz, mat) {
    // Thin panel (one dimension very small)
    return addClosedBox(ox, oy, oz, sx, sy, sz, mat);
  }

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, cam);
  }
  animate();

  return {
    scene, cam, renderer, controls, whiteMat,
    addBar, addOpenBox, addOpenCube, addClosedBox, addPanel,
    THREE,
  };
}
