import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import './styles.css';
import {
  ALGORITHMS,
  DAISY_SEQUENCE,
  FACE_COLORS,
  FACE_NAMES,
  FACES,
  MOVE_DEFS,
  WHITE_CROSS_SEQUENCE,
  axisValue,
  inverseMove,
  inverseSequence,
  makeScramble,
  moveAmount,
  moveQuarterAngle,
  parseMoves,
  rotateVectorArray,
  snap
} from './cube.js';

const CUBIE_SPACING = 1.08;
const TURN_DURATION = 360;
const plasticMaterial = new THREE.MeshStandardMaterial({
  color: 0x111816,
  roughness: 0.54,
  metalness: 0.08
});
const internalMaterial = new THREE.MeshStandardMaterial({
  color: 0x18201e,
  roughness: 0.72,
  metalness: 0.02
});
const stickerMaterials = Object.fromEntries(
  Object.entries(FACE_COLORS).map(([face, color]) => [
    face,
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.42,
      metalness: 0.02
    })
  ])
);

const faceTransforms = {
  U: { position: [0, 0.512, 0], rotation: [-Math.PI / 2, 0, 0] },
  D: { position: [0, -0.512, 0], rotation: [Math.PI / 2, 0, 0] },
  R: { position: [0.512, 0, 0], rotation: [0, Math.PI / 2, 0] },
  L: { position: [-0.512, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  F: { position: [0, 0, 0.512], rotation: [0, 0, 0] },
  B: { position: [0, 0, -0.512], rotation: [0, Math.PI, 0] }
};

class CherryCubeApp {
  constructor() {
    this.queue = [];
    this.history = [];
    this.redoStack = [];
    this.cubies = [];
    this.animating = false;
    this.currentScramble = [];
    this.isPaused = false;

    this.mount();
    this.createScene();
    this.createCube();
    this.bindUi();
    this.bindKeyboard();
    this.animate();
    this.setStatus('Solved cube ready');
    this.updateLog();
    this.exposeDebug();
  }

  mount() {
    document.querySelector('#app').innerHTML = `
      <main class="app-shell">
        <section class="scene-wrap" aria-label="Interactive 3D Rubik's cube">
          <svg class="tree" viewBox="0 0 900 520" aria-hidden="true" focusable="false">
            <path class="tree-trunk" d="M83 520 C117 430 133 334 123 235 C119 184 132 129 171 82" />
            <path class="tree-limb main" d="M133 245 C230 180 374 126 563 102 C674 88 792 65 900 24" />
            <path class="tree-limb" d="M238 176 C279 118 342 78 430 50" />
            <path class="tree-limb" d="M354 137 C418 163 469 201 508 252" />
            <path class="tree-limb" d="M522 106 C572 145 615 190 650 243" />
            <path class="tree-limb" d="M632 84 C694 106 757 143 821 196" />
            <g class="tree-blossoms">
              <circle cx="224" cy="168" r="10" />
              <circle cx="257" cy="151" r="7" />
              <circle cx="304" cy="126" r="9" />
              <circle cx="385" cy="82" r="8" />
              <circle cx="472" cy="118" r="10" />
              <circle cx="535" cy="102" r="7" />
              <circle cx="603" cy="145" r="9" />
              <circle cx="681" cy="95" r="8" />
              <circle cx="742" cy="128" r="10" />
              <circle cx="806" cy="181" r="7" />
            </g>
          </svg>
          <div id="blossoms" aria-hidden="true"></div>
          <canvas id="scene" data-testid="cube-canvas"></canvas>
          <div class="hud">
            <span class="status-light"></span>
            <span id="status" data-testid="status">Loading</span>
          </div>
        </section>
        <aside class="panel" aria-label="Cube controls">
          <header class="brand">
            <h1>Cherry Cube</h1>
            <p>Physical 3x3 layer turns with standard Rubik's notation.</p>
          </header>

          <section class="section">
            <h2>Face Moves</h2>
            <div class="button-grid" id="faceMoves"></div>
            <p class="hint">Keys U D L R F B turn faces. Hold Shift for inverse.</p>
          </section>

          <section class="section">
            <h2>State</h2>
            <div class="button-row">
              <button class="btn primary" id="scramble" data-testid="scramble">Scramble</button>
              <button class="btn" id="reset" data-testid="reset">Solved reset</button>
              <button class="btn" id="daisy" data-testid="daisy">Daisy</button>
              <button class="btn" id="whiteCross" data-testid="white-cross">White cross</button>
            </div>
            <div class="button-row">
              <button class="btn" id="undo" data-testid="undo">Undo</button>
              <button class="btn" id="redo" data-testid="redo">Redo</button>
              <button class="btn danger" id="clearLog">Clear log</button>
            </div>
          </section>

          <section class="section">
            <h2>Camera</h2>
            <div class="button-row">
              <button class="btn" id="viewIso" data-testid="view-iso">Iso</button>
              <button class="btn" id="viewFront">Front</button>
              <button class="btn" id="viewTop">Top</button>
              <button class="btn" id="viewRight">Right</button>
              <button class="btn" id="zoomIn">Zoom +</button>
              <button class="btn" id="zoomOut">Zoom -</button>
            </div>
          </section>

          <section class="section">
            <h2>Algorithms</h2>
            <div class="algorithms" id="algorithms"></div>
          </section>

          <section class="section">
            <h2>Move Log</h2>
            <div class="move-log" id="moveLog" data-testid="move-log"></div>
          </section>

          <section class="section">
            <h2>Shortcuts</h2>
            <div class="shortcuts">
              <span><kbd>U</kbd> <kbd>D</kbd> <kbd>L</kbd> faces</span>
              <span><kbd>R</kbd> <kbd>F</kbd> <kbd>B</kbd> faces</span>
              <span><kbd>Shift</kbd> inverse</span>
              <span><kbd>2</kbd> repeat last</span>
              <span><kbd>S</kbd> scramble</span>
              <span><kbd>Esc</kbd> reset view</span>
            </div>
          </section>
        </aside>
      </main>
    `;

    this.canvas = document.querySelector('#scene');
    this.statusEl = document.querySelector('#status');
    this.moveLogEl = document.querySelector('#moveLog');
    this.createBlossoms();
  }

  createBlossoms() {
    const root = document.querySelector('#blossoms');
    for (let i = 0; i < 34; i += 1) {
      const petal = document.createElement('span');
      petal.className = 'blossom';
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.animationDelay = `${Math.random() * -12}s`;
      petal.style.animationDuration = `${10 + Math.random() * 10}s`;
      petal.style.opacity = `${0.32 + Math.random() * 0.42}`;
      petal.style.transform = `scale(${0.72 + Math.random() * 0.8})`;
      root.appendChild(petal);
    }
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    this.camera.position.set(5.8, 4.7, 6.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 4.4;
    this.controls.maxDistance = 12;
    this.controls.target.set(0, 0, 0);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x6f756e, 2.1);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 4.8);
    key.position.set(4.5, 8, 5.5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0xf3bfd0, 1.25);
    rim.position.set(-5, 3, -4);
    this.scene.add(rim);

    const bottomFill = new THREE.DirectionalLight(0xffffff, 1.3);
    bottomFill.position.set(1.5, -5, 3);
    this.scene.add(bottomFill);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(4.3, 96),
      new THREE.MeshStandardMaterial({ color: 0xf8faf6, roughness: 0.82, transparent: true, opacity: 0.54 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.18;
    floor.receiveShadow = true;
    this.scene.add(floor);

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  createCube() {
    this.cubeRoot = new THREE.Group();
    this.scene.add(this.cubeRoot);
    this.cubies = [];

    const bodyGeometry = new RoundedBoxGeometry(1, 1, 1, 5, 0.075);
    const stickerGeometry = new RoundedBoxGeometry(0.72, 0.72, 0.035, 3, 0.035);

    let id = 0;
    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        for (let z = -1; z <= 1; z += 1) {
          const group = new THREE.Group();
          group.position.set(x * CUBIE_SPACING, y * CUBIE_SPACING, z * CUBIE_SPACING);
          group.userData.cubieId = id;

          const body = new THREE.Mesh(bodyGeometry, x === 0 && y === 0 && z === 0 ? internalMaterial : plasticMaterial);
          body.castShadow = true;
          body.receiveShadow = true;
          group.add(body);

          this.addSticker(group, stickerGeometry, x, y, z, 'U', y === 1);
          this.addSticker(group, stickerGeometry, x, y, z, 'D', y === -1);
          this.addSticker(group, stickerGeometry, x, y, z, 'R', x === 1);
          this.addSticker(group, stickerGeometry, x, y, z, 'L', x === -1);
          this.addSticker(group, stickerGeometry, x, y, z, 'F', z === 1);
          this.addSticker(group, stickerGeometry, x, y, z, 'B', z === -1);

          this.cubeRoot.add(group);
          this.cubies.push({ id, home: [x, y, z], position: [x, y, z], group });
          id += 1;
        }
      }
    }
  }

  addSticker(group, geometry, x, y, z, face, visible) {
    if (!visible) return;
    const mesh = new THREE.Mesh(geometry, stickerMaterials[face]);
    const transform = faceTransforms[face];
    mesh.position.set(...transform.position);
    mesh.rotation.set(...transform.rotation);
    mesh.userData.face = face;
    mesh.userData.color = face;
    mesh.castShadow = true;
    group.add(mesh);
  }

  bindUi() {
    const faceMoves = document.querySelector('#faceMoves');
    FACES.forEach((face) => {
      ['', "'", '2'].forEach((suffix) => {
        const button = document.createElement('button');
        button.className = 'btn';
        button.dataset.move = `${face}${suffix}`;
        button.dataset.testid = `move-${face}${suffix || 'cw'}`.replace("'", 'prime');
        button.textContent = `${face}${suffix}`;
        button.title = `${FACE_NAMES[face]} ${suffix === "'" ? 'counter-clockwise' : suffix === '2' ? '180 degrees' : 'clockwise'}`;
        button.addEventListener('click', () => this.enqueue(`${face}${suffix}`));
        faceMoves.appendChild(button);
      });
    });

    document.querySelector('#scramble').addEventListener('click', () => this.scramble());
    document.querySelector('#reset').addEventListener('click', () => this.resetSolved());
    document.querySelector('#daisy').addEventListener('click', () => this.loadPreset('Daisy', DAISY_SEQUENCE));
    document.querySelector('#whiteCross').addEventListener('click', () => this.loadPreset('White cross', WHITE_CROSS_SEQUENCE));
    document.querySelector('#undo').addEventListener('click', () => this.undo());
    document.querySelector('#redo').addEventListener('click', () => this.redo());
    document.querySelector('#clearLog').addEventListener('click', () => {
      this.history = [];
      this.redoStack = [];
      this.updateLog();
      this.setStatus('Move log cleared');
    });

    document.querySelector('#viewIso').addEventListener('click', () => this.setCamera('iso'));
    document.querySelector('#viewFront').addEventListener('click', () => this.setCamera('front'));
    document.querySelector('#viewTop').addEventListener('click', () => this.setCamera('top'));
    document.querySelector('#viewRight').addEventListener('click', () => this.setCamera('right'));
    document.querySelector('#zoomIn').addEventListener('click', () => this.zoom(0.82));
    document.querySelector('#zoomOut').addEventListener('click', () => this.zoom(1.18));

    const algorithmsRoot = document.querySelector('#algorithms');
    Object.entries(ALGORITHMS).forEach(([level, algorithms]) => {
      const group = document.createElement('div');
      group.className = 'algorithm-group';
      group.innerHTML = `<h3>${level[0].toUpperCase()}${level.slice(1)}</h3>`;
      algorithms.forEach((algorithm) => {
        const supported = parseMoves(algorithm.notation).length === algorithm.notation.trim().split(/\s+/).length;
        const button = document.createElement('button');
        button.className = 'btn algorithm';
        button.dataset.testid = `algorithm-${level}-${algorithm.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        button.innerHTML = `<span>${algorithm.label}<br><code>${algorithm.notation}</code></span><span>${supported ? 'Run' : 'View'}</span>`;
        button.title = algorithm.note;
        button.addEventListener('click', () => {
          const moves = parseMoves(algorithm.notation);
          if (!supported) {
            this.setStatus(`${algorithm.label} includes slice notation; basic face-turn engine skipped unsupported tokens`);
          }
          this.enqueueMany(moves, { source: algorithm.label });
        });
        group.appendChild(button);
      });
      algorithmsRoot.appendChild(group);
    });
  }

  bindKeyboard() {
    window.addEventListener('keydown', (event) => {
      const tag = event.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || event.repeat) return;
      const key = event.key.toUpperCase();
      if (FACES.includes(key)) {
        event.preventDefault();
        this.enqueue(event.shiftKey ? `${key}'` : key);
      } else if (event.key === '2' && this.history.length) {
        event.preventDefault();
        this.enqueue(`${this.history.at(-1)[0]}2`);
      } else if (key === 'S') {
        event.preventDefault();
        this.scramble();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.setCamera('iso');
      }
    });
  }

  enqueue(move, options = {}) {
    if (!move || !MOVE_DEFS[move[0]]) return;
    this.queue.push({ move, options });
    this.setStatus(`Queued ${move}`);
    if (!this.animating) this.nextMove();
  }

  enqueueMany(moves, options = {}) {
    moves.forEach((move) => this.queue.push({ move, options }));
    this.setStatus(`Queued ${moves.length} moves${options.source ? ` from ${options.source}` : ''}`);
    if (!this.animating) this.nextMove();
  }

  nextMove() {
    if (this.animating || !this.queue.length) return;
    const item = this.queue.shift();
    this.turn(item.move, item.options);
  }

  turn(move, options = {}) {
    const def = MOVE_DEFS[move[0]];
    const selected = this.cubies.filter((cubie) => axisValue(cubie.position, def.axis) === def.layer);
    const pivot = new THREE.Group();
    this.scene.add(pivot);
    selected.forEach((cubie) => pivot.attach(cubie.group));

    const targetAngle = moveQuarterAngle(move);
    const duration = window.__CHERRY_CUBE_FAST ? 1 : TURN_DURATION;
    const startTime = performance.now();
    this.animating = true;
    this.setStatus(`Turning ${move}`);

    const animateTurn = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      pivot.rotation[def.axis] = targetAngle * eased;
      if (progress < 1) {
        requestAnimationFrame(animateTurn);
        return;
      }
      pivot.rotation[def.axis] = targetAngle;
      selected.forEach((cubie) => {
        this.cubeRoot.attach(cubie.group);
        const turns = Math.abs(moveAmount(move));
        let next = cubie.position;
        for (let i = 0; i < turns; i += 1) {
          next = rotateVectorArray(next, def.axis, Math.sign(targetAngle));
        }
        cubie.position = next.map(snap);
        cubie.group.position.set(
          cubie.position[0] * CUBIE_SPACING,
          cubie.position[1] * CUBIE_SPACING,
          cubie.position[2] * CUBIE_SPACING
        );
        cubie.group.updateMatrixWorld(true);
      });
      this.scene.remove(pivot);
      if (!options.silent) {
        this.history.push(move);
        this.redoStack = [];
        this.updateLog();
      }
      this.animating = false;
      this.setStatus(this.queue.length ? `${this.queue.length} moves queued` : `Completed ${move}`);
      this.nextMove();
    };
    requestAnimationFrame(animateTurn);
  }

  resetSolved({ keepLog = false } = {}) {
    this.queue = [];
    this.animating = false;
    this.scene.remove(this.cubeRoot);
    this.createCube();
    if (!keepLog) {
      this.history = [];
      this.redoStack = [];
      this.updateLog();
    }
    this.setStatus('Solved reset complete');
  }

  scramble() {
    this.resetSolved({ keepLog: true });
    const moves = makeScramble(24);
    this.currentScramble = moves;
    this.history.push('Scramble');
    this.enqueueMany(moves, { source: 'scramble' });
    this.setStatus(`Scramble generated: ${moves.join(' ')}`);
    this.updateLog();
  }

  loadPreset(label, moves) {
    this.resetSolved({ keepLog: true });
    this.history.push(label);
    this.enqueueMany(moves, { source: label });
    if (label === 'Daisy') {
      this.camera.position.set(5.8, -4.7, 6.2);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    } else if (label === 'White cross') {
      this.camera.position.set(4.2, 7.2, 4.2);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
    this.setStatus(`${label} preset uses legal moves: ${moves.join(' ')}`);
    this.updateLog();
  }

  undo() {
    const last = this.history.pop();
    if (!last || !normalizeHistoryMove(last)) {
      this.updateLog();
      this.setStatus('No reversible face move available');
      return;
    }
    this.redoStack.push(last);
    this.enqueue(inverseMove(last), { silent: true });
    this.updateLog();
  }

  redo() {
    const move = this.redoStack.pop();
    if (!move) {
      this.setStatus('Nothing to redo');
      return;
    }
    this.enqueue(move);
  }

  updateLog() {
    if (!this.history.length) {
      this.moveLogEl.innerHTML = '<span class="note">No moves yet.</span>';
      return;
    }
    this.moveLogEl.innerHTML = this.history
      .slice(-90)
      .map((move) => `<span class="move-chip">${move}</span>`)
      .join('');
  }

  setStatus(message) {
    this.statusEl.textContent = message;
  }

  setCamera(view) {
    const positions = {
      iso: [5.8, 4.7, 6.2],
      front: [0, 0.4, 8],
      top: [0, 8.2, 0.1],
      right: [8, 0.4, 0]
    };
    this.camera.position.set(...positions[view]);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.setStatus(`${view} camera view`);
  }

  zoom(factor) {
    this.camera.position.multiplyScalar(factor);
    this.camera.position.clampLength(this.controls.minDistance, this.controls.maxDistance);
    this.controls.update();
    this.setStatus(factor < 1 ? 'Zoomed in' : 'Zoomed out');
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  stateSignature() {
    return this.cubies
      .map((cubie) => `${cubie.id}:${cubie.position.join(',')}`)
      .sort()
      .join('|');
  }

  isSolved() {
    return this.cubies.every((cubie) => cubie.position.every((value, index) => value === cubie.home[index]));
  }

  async waitForIdle() {
    while (this.animating || this.queue.length) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return true;
  }

  exposeDebug() {
    window.__cherryCube = {
      enqueue: (move) => this.enqueue(move),
      enqueueMany: (notation) => this.enqueueMany(parseMoves(notation)),
      reset: () => this.resetSolved(),
      scramble: () => this.scramble(),
      daisy: () => this.loadPreset('Daisy', DAISY_SEQUENCE),
      whiteCross: () => this.loadPreset('White cross', WHITE_CROSS_SEQUENCE),
      waitForIdle: () => this.waitForIdle(),
      isSolved: () => this.isSolved(),
      signature: () => this.stateSignature(),
      history: () => [...this.history],
      pending: () => this.queue.length,
      debugState: () => ({
        animating: this.animating,
        pending: this.queue.length,
        status: this.statusEl.textContent,
        cubies: this.cubies.length,
        solved: this.isSolved()
      }),
      inverseSequence
    };
  }
}

function normalizeHistoryMove(value) {
  return typeof value === 'string' && /^[UDLRFB][2']?$/.test(value);
}

new CherryCubeApp();
