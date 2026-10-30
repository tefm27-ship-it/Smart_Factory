// @ts-nocheck
import type { WorkshopSceneApi, WorkshopSceneOptions } from "./types";
import { getStation, getStationVM } from "../data/workshop/stations.source";

export function createWorkshopScene(opts: WorkshopSceneOptions): WorkshopSceneApi {
  /* three r150 默认关闭颜色管理：十六进制颜色（sRGB）会被当成线性值参与光照，
     输出时又做一次 sRGB 编码，结果整体提亮、去饱和，表现为发白、发灰、颜色淡。
     开启后颜色按 sRGB 正确解码，画面才会回到色板的设计值。 */
  if (THREE.ColorManagement) {
    THREE.ColorManagement.enabled = true;
    if ("legacyMode" in THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
  }
  var host = opts.host;
  var canvasEl = opts.canvasEl;
  var tip = opts.tip;
  var popup = opts.popup;

  /* ---------------- renderer / scene ---------------- */
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;
  if ("outputEncoding" in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
  /* 开发期 HMR 重建场景时，上一份 canvas 可能还没被 dispose 移除，
     两层画布叠在一起会让画面明显发白（颜色变浅）。建新画布前先清空容器。 */
  while (host.firstChild) host.removeChild(host.firstChild);
  host.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xecefe4, 300, 760);
  var camera = new THREE.PerspectiveCamera(30, 1.5, 0.5, 900);

  var hemi = new THREE.HemisphereLight(0xffffff, 0xa8a294, 0.62);
  scene.add(hemi);

  var sun = new THREE.DirectionalLight(0xfff7ea, 0.98);
  sun.position.set(-142, 118, 96);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -120;
  sun.shadow.camera.right = 120;
  sun.shadow.camera.top = 96;
  sun.shadow.camera.bottom = -96;
  sun.shadow.camera.near = 20;
  sun.shadow.camera.far = 420;
  sun.shadow.bias = -0.0009;
  sun.shadow.normalBias = 0.35;
  scene.add(sun);
  scene.add(sun.target);

  var fill = new THREE.DirectionalLight(0xdfe8ff, 0.18);
  fill.position.set(110, 82, -96);
  scene.add(fill);

  var rim = new THREE.DirectionalLight(0x8a97ff, 0.14);
  rim.position.set(70, 58, -130);
  scene.add(rim);

  /* morning sky used for daylight reflections */
  function morningEnvironment() {
    var c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    var x = c.getContext("2d");
    var g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, "#ffd7a4");
    g.addColorStop(0.4, "#eef1f2");
    g.addColorStop(0.62, "#d9dfe1");
    g.addColorStop(1, "#b8ab92");
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 128);
    var sg = x.createRadialGradient(54, 36, 0, 54, 36, 54);
    sg.addColorStop(0, "rgba(255,240,212,.95)");
    sg.addColorStop(0.34, "rgba(255,224,174,.32)");
    sg.addColorStop(1, "rgba(255,224,174,0)");
    x.fillStyle = sg;
    x.fillRect(0, 0, 256, 128);
    var t = new THREE.CanvasTexture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    if ("encoding" in t) t.encoding = THREE.sRGBEncoding;
    var pm = new THREE.PMREMGenerator(renderer);
    pm.compileEquirectangularShader();
    var rt = pm.fromEquirectangular(t);
    pm.dispose();
    t.dispose();
    return rt.texture;
  }
  var ENV_LIGHT = morningEnvironment();

  /* ---------------- materials ---------------- */
  var THEME_MATS = [];
  function M0(color, o) {
    o = o || {};
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: o.roughness === undefined ? 0.85 : o.roughness,
      metalness: o.metalness || 0,
      flatShading: !!o.flat
    });
  }
  function TM(m, key, opKey) {
    THEME_MATS.push({ m: m, key: key, opKey: opKey });
    return m;
  }

  var M = {
    plate: TM(M0(0xd6d2c4, { roughness: 0.96 }), "plate"),
    floor: TM(M0(0xb4afa2, { roughness: 0.8, metalness: 0.04 }), "floor"),
    lane: TM(new THREE.LineDashedMaterial({ color: 0x98a1b0, dashSize: 2.3, gapSize: 1.8, transparent: true, opacity: 0.95 }), "lane", "laneOp"),
    joint: TM(new THREE.LineBasicMaterial({ color: 0xbcb8aa, transparent: true, opacity: 0.5 }), "joint", "jointOp"),
    steel: TM(M0(0xbec4cc, { roughness: 0.55, metalness: 0.28 }), "steel"),
    steelDark: TM(M0(0x929aa5, { roughness: 0.6, metalness: 0.25 }), "steelDark"),
    body: TM(M0(0xf4f3ee, { roughness: 0.78 }), "body"),
    body2: TM(M0(0xe7e6df, { roughness: 0.82 }), "body2"),
    accent: TM(M0(0xbfd0e2, { roughness: 0.68, metalness: 0.05 }), "accent"),
    accent2: TM(M0(0xa9bccf, { roughness: 0.62, metalness: 0.08 }), "accent2"),
    belt: TM(M0(0x4c5158, { roughness: 0.92 }), "belt"),
    rail: TM(M0(0xc9cdd3, { roughness: 0.36, metalness: 0.5 }), "rail"),
    box: TM(M0(0xd9a45c, { roughness: 0.88 }), "box"),
    box2: TM(M0(0xe6b46f, { roughness: 0.88 }), "box2"),
    garmentA: TM(M0(0xd2a05c, { roughness: 0.92 }), "garmentA"),
    garmentB: TM(M0(0x4f566e, { roughness: 0.92 }), "garmentB"),
    hanger: TM(M0(0xcfd3d8, { roughness: 0.38, metalness: 0.48 }), "hanger"),
    truckBody: TM(M0(0xe9e8e2, { roughness: 0.74 }), "truckBody"),
    cab: TM(M0(0xb9c6d4, { roughness: 0.58, metalness: 0.16 }), "cab"),
    glass: TM(M0(0x8fa3b8, { roughness: 0.22, metalness: 0.42 }), "glass"),
    tire: TM(M0(0x3c3f45, { roughness: 0.96 }), "tire"),
    mannequin: TM(M0(0xe8e4da, { roughness: 0.92 }), "mannequin"),
    monitor: TM(M0(0x2f3540, { roughness: 0.5, metalness: 0.2 }), "monitor"),
    screen: TM(new THREE.MeshBasicMaterial({ color: 0x9fb6cf }), "screen"),
    led: TM(new THREE.MeshBasicMaterial({ color: 0x3f9f6a }), "led"),
    ledWarn: new THREE.MeshBasicMaterial({ color: 0xd79a3a }),
    ledStop: new THREE.MeshBasicMaterial({ color: 0xdd4b3e }),
    scan: TM(new THREE.MeshBasicMaterial({ color: 0x4a56d8, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }), "scan"),
    paper: TM(M0(0xfaf8f0, { roughness: 1 }), "paper"),
    darkPart: TM(M0(0x2c3038, { roughness: 0.9 }), "darkPart"),
    edge: TM(new THREE.LineBasicMaterial({ color: 0x8f8d80, transparent: true, opacity: 0.5 }), "edge", "edgeOp")
  };

  var pickMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

  /* ---------------- geometry helpers (cached) ---------------- */
  var geoCache = {};
  function boxGeo(w, h, d) {
    var k = "b" + w + "_" + h + "_" + d;
    return geoCache[k] || (geoCache[k] = new THREE.BoxGeometry(w, h, d));
  }
  function cylGeo(r, h, seg) {
    var k = "c" + r + "_" + h + "_" + seg;
    return geoCache[k] || (geoCache[k] = new THREE.CylinderGeometry(r, r, h, seg));
  }
  function coneGeo(rt, rb, h, seg) {
    var k = "k" + rt + "_" + rb + "_" + h + "_" + seg;
    return geoCache[k] || (geoCache[k] = new THREE.CylinderGeometry(rt, rb, h, seg));
  }
  function sphereGeo(r, seg) {
    var k = "s" + r + "_" + seg;
    return geoCache[k] || (geoCache[k] = new THREE.SphereGeometry(r, seg, Math.max(6, seg >> 1)));
  }
  function edgesOf(geo) {
    if (!geo.userData.eg) geo.userData.eg = new THREE.EdgesGeometry(geo, 32);
    return geo.userData.eg;
  }
  function mk(parent, geo, mat, x, y, z) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function bx(parent, w, h, d, mat, x, y, z, o) {
    var m = mk(parent, boxGeo(w, h, d), mat, x, y, z);
    if (o) {
      if (o.rx) m.rotation.x = o.rx;
      if (o.ry) m.rotation.y = o.ry;
      if (o.rz) m.rotation.z = o.rz;
      if (o.nocast) m.castShadow = false;
      if (o.norecv) m.receiveShadow = false;
    }
    if (o && o.edge) {
      var e = new THREE.LineSegments(edgesOf(m.geometry), M.edge);
      e.position.copy(m.position);
      e.rotation.copy(m.rotation);
      parent.add(e);
    }
    return m;
  }
  function cyl(parent, r, h, mat, x, y, z, o) {
    o = o || {};
    var m = mk(parent, cylGeo(r, h, o.seg || 16), mat, x, y, z);
    if (o.rx) m.rotation.x = o.rx;
    if (o.ry) m.rotation.y = o.ry;
    if (o.rz) m.rotation.z = o.rz;
    if (o.nocast) m.castShadow = false;
    return m;
  }
  function cone(parent, rt, rb, h, mat, x, y, z, o) {
    o = o || {};
    var m = mk(parent, coneGeo(rt, rb, h, o.seg || 14), mat, x, y, z);
    if (o.rx) m.rotation.x = o.rx;
    if (o.ry) m.rotation.y = o.ry;
    if (o.rz) m.rotation.z = o.rz;
    return m;
  }
  function ball(parent, r, mat, x, y, z, seg) {
    return mk(parent, sphereGeo(r, seg || 14), mat, x, y, z);
  }
  function group(parent, x, y, z, ry) {
    var g = new THREE.Group();
    g.position.set(x || 0, y || 0, z || 0);
    if (ry) g.rotation.y = ry;
    (parent || scene).add(g);
    return g;
  }

  /* ---------------- palettes ---------------- */
  var PAL = {
    light: {
      plate: 0xd7d1c0, floor: 0xb4afa2, lane: 0x8a93a1, laneOp: 0.95,
      joint: 0xb0ac9d, jointOp: 0.5,
      steel: 0x9aa4b0, steelDark: 0x7d8794, body: 0xf2f1ea, body2: 0xe5e4dc,
      accent: 0xa9c0d6, accent2: 0x8ea7c0, belt: 0x3a3f46, rail: 0xbcc2ca,
      box: 0xd9a45c, box2: 0xe6b46f, garmentA: 0xd2a05c, garmentB: 0x4f566e,
      hanger: 0xcfd3d8, truckBody: 0xeae9e3, cab: 0xb9c6d4, glass: 0x8fa3b8,
      tire: 0x3c3f45, mannequin: 0xe8e4da, monitor: 0x2f3540, screen: 0x9fb6cf,
      led: 0x3f9f6a, scan: 0x4a56d8, paper: 0xfcfaf3, darkPart: 0x2c3038,
      edge: 0x7c7a6e, edgeOp: 0.45,
      hemiSky: 0xe8f1ff, hemiGround: 0xc0ae92, hemi: 0.52,
      sunColor: 0xffe4bd, sun: 1.08, fillColor: 0xcfe2ff, fill: 0.2, rimColor: 0xffd6a8, rim: 0.22,
      fog: 0xf3eee3, fogNear: 320, fogFar: 820,
      glowColor: 0xffdfb2, glowOp: 0.22, blob: 0.46, shadow: 0.2,
      ring: 0x4a56d8, hover: 0xdfe7f3, sel: 0xc9d9ea, halt: 0xe8d9d4, route: 0x4a56d8
    },
    dark: {
      plate: 0x121820, floor: 0x1f262f, lane: 0xdde6f2, laneOp: 0.75,
      joint: 0x39475a, jointOp: 0.4,
      steel: 0x4a6280, steelDark: 0x2f4155, body: 0x2f3e52, body2: 0x3a4f68,
      accent: 0x517093, accent2: 0x3d5878, belt: 0x1a1f26, rail: 0xaeb9c7,
      box: 0xcf9140, box2: 0xdc9f4c, garmentA: 0xd6a45f, garmentB: 0x8b93a8,
      hanger: 0xb2bdcb, truckBody: 0x2c3a4c, cab: 0x3b5470, glass: 0x3c5a78,
      tire: 0x0e1116, mannequin: 0x394656, monitor: 0x0c1015, screen: 0x6d90b6,
      led: 0x57c78b, scan: 0x8b95ff, paper: 0xd8dbe0, darkPart: 0x070a0e,
      edge: 0x6b788a, edgeOp: 0.4,
      hemiSky: 0x506482, hemiGround: 0x070a0e, hemi: 0.68,
      sunColor: 0xdfe8ff, sun: 0.9, fillColor: 0x3358ff, fill: 0.18, rimColor: 0x6d7cff, rim: 0.5,
      fog: 0x080d13, fogNear: 210, fogFar: 560,
      glowColor: 0x3350e6, glowOp: 0.17, blob: 0.8, shadow: 0.42,
      ring: 0x8b95ff, hover: 0xcfd8ee, sel: 0xaebfe0, halt: 0xcaa9a4, route: 0x8b95ff
    }
  };
  var THEME = { dark: false };

  function applyMaterials(p) {
    for (var i = 0; i < THEME_MATS.length; i++) {
      var t = THEME_MATS[i];
      t.m.color.setHex(p[t.key]);
      if (t.opKey && p[t.opKey] !== undefined) t.m.opacity = p[t.opKey];
    }
  }
  /* ================= diatoma floor ================= */
  var FW = 84, FD = 50, PLATE = 2.8;

  function roundRect(w, d, r) {
    var s = new THREE.Shape();
    var x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + d - r);
    s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d);
    s.quadraticCurveTo(x, y + d, x, y + d - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  var slab = new THREE.Mesh(
    new THREE.ExtrudeGeometry(roundRect(FW * 2 + 0.8, FD * 2 + 0.8, 8), { depth: PLATE, bevelEnabled: false, curveSegments: 8 }),
    M.plate
  );
  slab.rotation.x = -Math.PI / 2;
  slab.position.y = -PLATE;
  slab.castShadow = true;
  slab.receiveShadow = true;
  scene.add(slab);

  var floorMesh = new THREE.Mesh(new THREE.ShapeGeometry(roundRect(FW * 2 - 0.8, FD * 2 - 0.8, 7.4), 20), M.floor);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = 0.03;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  (function floorRim() {
    var pts = roundRect(FW * 2 - 0.7, FD * 2 - 0.7, 7.4).getPoints(120).map(function (p) {
      return new THREE.Vector3(p.x, 0.05, -p.y);
    });
    scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), M.edge));
  })();

  /* ---------------- morning sheen ---------------- */
  var floorGlare = (function () {
    var c = document.createElement("canvas"); c.width = 512; c.height = 256;
    var x = c.getContext("2d");
    var g = x.createRadialGradient(256, 128, 0, 256, 128, 252);
    g.addColorStop(0, "rgba(255,247,229,.9)");
    g.addColorStop(0.34, "rgba(255,241,217,.52)");
    g.addColorStop(0.68, "rgba(255,236,207,.18)");
    g.addColorStop(1, "rgba(255,236,207,0)");
    x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    var t = new THREE.CanvasTexture(c);
    if ("encoding" in t) t.encoding = THREE.sRGBEncoding;
    var mat = new THREE.MeshBasicMaterial({
      map: t, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0.42
    });
    var m = new THREE.Mesh(new THREE.PlaneGeometry(96, 46), mat);
    m.rotation.x = -Math.PI / 2;
    var holder = new THREE.Group();
    holder.add(m);
    holder.position.set(-28, 0.08, 24);
    holder.rotation.y = 0.62;
    scene.add(holder);
    return m;
  })();

  (function joints() {
    var pts = [];
    for (var gx = -70; gx <= 70; gx += 14) {
      pts.push(new THREE.Vector3(gx, 0.06, -44), new THREE.Vector3(gx, 0.06, 44));
    }
    for (var gz = -42; gz <= 42; gz += 14) {
      pts.push(new THREE.Vector3(-72, 0.06, gz), new THREE.Vector3(72, 0.06, gz));
    }
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), M.joint));
  })();

  /* ---------------- dashed AGV lanes ---------------- */
  var LANES = [];
  function lane(pts, closed) {
    var v = pts.map(function (p) { return new THREE.Vector3(p[0], 0.1, p[1]); });
    var curve = new THREE.CatmullRomCurve3(v, !!closed, "catmullrom", 0.04);
    var geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(closed ? 460 : 260));
    var line = new THREE.Line(geo, M.lane);
    line.computeLineDistances();
    scene.add(line);
    LANES.push({ curve: curve, line: line });
    return curve;
  }

  var laneMain = lane([[-46, -8], [-46, 12], [-46, 30], [-20, 30], [10, 30], [39, 30], [39, 10], [39, -8], [10, -8], [-20, -8]], true);
  lane([[-54, -47.5], [-20, -47.5], [10, -47.5], [44, -47.5]], false);
  lane([[40, 26], [50, 26], [60, 26], [60, 4], [60, -6], [50, -6], [44, -6]], false);

  function stud(x, z) {
    var g = group(scene, x, 0, z);
    cyl(g, 1.2, 0.36, M.steelDark, 0, 0.18, 0, { seg: 22 });
    cyl(g, 0.92, 0.08, M.rail, 0, 0.4, 0, { seg: 22, nocast: true });
  }
  [[-46, -8], [-46, 30], [39, 30], [39, -8], [10, 30], [10, -8], [-54, -47.5], [44, -47.5], [60, 26], [40, 26], [60, -6], [44, -6]].forEach(function (p) { stud(p[0], p[1]); });

  /* ---------------- atmosphere ---------------- */
  function glowTex(r, g, b) {
    var c = document.createElement("canvas");
    c.width = c.height = 256;
    var x = c.getContext("2d");
    var gr = x.createRadialGradient(128, 128, 0, 128, 128, 126);
    gr.addColorStop(0, "rgba(" + r + "," + g + "," + b + ",0.5)");
    gr.addColorStop(0.42, "rgba(" + r + "," + g + "," + b + ",0.14)");
    gr.addColorStop(1, "rgba(" + r + "," + g + "," + b + ",0)");
    x.fillStyle = gr;
    x.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }

  var sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex(255, 255, 255), color: 0xfff0d2, transparent: true, opacity: 0.26,
    depthWrite: false, blending: THREE.AdditiveBlending, fog: false
  }));
  sunGlow.scale.set(300, 300, 1);
  sunGlow.position.set(-210, 190, -120);
  sunGlow.renderOrder = -3;
  scene.add(sunGlow);

  var groundGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 220),
    new THREE.MeshBasicMaterial({ map: glowTex(255, 243, 224), transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  groundGlow.rotation.x = -Math.PI / 2;
  groundGlow.position.y = 0.07;
  groundGlow.material.fog = false;
  scene.add(groundGlow);

  /* ---------------- soft contact shadows ---------------- */
  function blobTex() {
    var c = document.createElement("canvas");
    c.width = c.height = 128;
    var x = c.getContext("2d");
    var g = x.createRadialGradient(64, 64, 2, 64, 64, 62);
    g.addColorStop(0, "rgba(0,0,0,0.7)");
    g.addColorStop(0.52, "rgba(0,0,0,0.26)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    var t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }
  var blobMat = new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity: 0.5 });
  function blob(x, z, w, d, rot) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), blobMat);
    m.rotation.x = -Math.PI / 2;
    if (rot) m.rotation.z = rot;
    m.position.set(x + w * 0.05, 0.08, z - d * 0.05);
    scene.add(m);
    return m;
  }

  /* ---------------- zone labels ---------------- */
  var ZONES = [
    { t: "面料暂存 / FABRIC", p: [-63, 20], y: 1.4 },
    { t: "吊挂缝制区 / SEWING", p: [0, -29], y: 1.2 },
    { t: "智能裁剪 / CUTTING", p: [-2, 19.5], y: 1.2 },
    { t: "质检扫描 / QC", p: [31, 17], y: 1.6 },
    { t: "成品缓存 / FINISHED", p: [57, -37], y: 16.4 },
    { t: "后道包装 / PACKING", p: [46, 43], y: 1.2 }
  ];
  ZONES.forEach(function (z) {
    var d = document.createElement("div");
    d.className = "zlabel";
    d.textContent = z.t;
    d.style.opacity = "0";
    canvasEl.appendChild(d);
    z.el = d;
    z.v = new THREE.Vector3(z.p[0], z.y, z.p[1]);
  });

  /* ---------------- selection ring / halo ---------------- */
  var ring = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 1, 72),
    new THREE.MeshBasicMaterial({ color: 0x4a56d8, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  ring.position.y = 0.16;
  scene.add(ring);

  var halo = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: glowTex(120, 134, 255), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.12;
  halo.material.fog = false;
  scene.add(halo);

  /* ---------------- material-flow route ---------------- */
  var routeMat = new THREE.LineDashedMaterial({ color: 0x4a56d8, dashSize: 2.8, gapSize: 1.8, transparent: true, opacity: 0.95 });
  var routeLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(laneMain.getPoints(420)), routeMat);
  routeLine.computeLineDistances();
  routeLine.visible = false;
  routeLine.position.y = 0.22;
  scene.add(routeLine);

  var routeDot = new THREE.Mesh(sphereGeo(1.5, 14), new THREE.MeshBasicMaterial({ color: 0x4a56d8 }));
  routeDot.visible = false;
  routeDot.position.y = 1.6;
  scene.add(routeDot);

  var routeRing = new THREE.Mesh(
    new THREE.RingGeometry(2.6, 3.4, 40),
    new THREE.MeshBasicMaterial({ color: 0x4a56d8, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false })
  );
  routeRing.rotation.x = -Math.PI / 2;
  routeRing.visible = false;
  routeRing.position.y = 0.2;
  scene.add(routeRing);

  var popupTarget = new THREE.Vector3(0, 14, 0);
  /* ================= prop builders ================= */

  function garment(parent, mat, x, top, z, s, ry) {
    var g = group(parent, x, top, z, ry);
    var hook = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 5, 12, Math.PI), M.hanger);
    hook.position.y = -0.02;
    g.add(hook);
    bx(g, 2.9, 0.09, 0.09, M.hanger, 0, -0.4, 0, { nocast: true });
    bx(g, 2.4, 3.0, 0.82, mat, 0, -1.95, 0.02, { edge: true });
    bx(g, 3.4, 0.46, 0.92, mat, 0, -0.62, 0);
    bx(g, 0.7, 2.1, 0.74, mat, -1.52, -1.8, 0, { rz: 0.12 });
    bx(g, 0.7, 2.1, 0.74, mat, 1.52, -1.8, 0, { rz: -0.12 });
    bx(g, 0.86, 0.26, 0.86, mat, 0, -0.44, 0);
    if (s) g.scale.setScalar(s);
    return g;
  }

  function stationPad(parent, w, d, accMat) {
    bx(parent, w, 0.36, d, M.steelDark, 0, 0.18, 0, { edge: true });
    bx(parent, w - 0.9, 0.1, d - 0.9, accMat, 0, 0.4, 0);
  }

  /* ---------------- fabric roll racks ---------------- */
  function fabricRack(cx, cz) {
    var g = group(scene, cx, 0, cz);
    [-7.2, 7.2].forEach(function (mz) {
      [-1, 1].forEach(function (sx) {
        [-1, 1].forEach(function (sz) {
          bx(g, 0.44, 10.8, 0.44, M.accent2, sx * 4.7, 5.4, mz + sz * 6.4, { edge: true });
        });
      });
      bx(g, 0.36, 0.36, 13.2, M.accent2, 0, 10.6, mz, { nocast: true });
      for (var lvl = 0; lvl < 4; lvl++) {
        var y = 2.55 + lvl * 2.15;
        bx(g, 0.3, 0.3, 13.0, M.steel, -4.7, y - 1.38, mz, { nocast: true });
        bx(g, 0.3, 0.3, 13.0, M.steel, 4.7, y - 1.38, mz, { nocast: true });
        for (var k = -1; k <= 1; k++) {
          cyl(g, 1.4, 8.5, lvl % 2 ? M.box2 : M.box, 0, y, mz + k * 4.3, { rz: Math.PI / 2, seg: 18 });
        }
      }
    });
    var loose = group(g, 9.2, 0, -13.5, 0.5);
    cyl(loose, 1.4, 5.2, M.box, 0, 1.4, 0, { rz: Math.PI / 2, seg: 16 });
    cyl(loose, 1.4, 5.2, M.box2, 0, 1.4, 3.0, { rz: Math.PI / 2, seg: 16 });
    var pile = group(g, -8.6, 0, 12.6);
    bx(pile, 4.4, 0.7, 3.4, M.box, 0, 0.35, 0);
    bx(pile, 4.0, 0.6, 3.0, M.box2, 0.2, 1.0, 0.1);
    bx(pile, 3.4, 0.5, 2.6, M.box, -0.1, 1.55, 0);
    return g;
  }

  /* ---------------- hanging sewing line ---------------- */
  function loopPoints(w, d, y) {
    var x = w / 2, z = d / 2, r = Math.min(w, d) * 0.2;
    return [
      new THREE.Vector3(-x + r, y, -z), new THREE.Vector3(x - r, y, -z),
      new THREE.Vector3(x, y, -z + r), new THREE.Vector3(x, y, z - r),
      new THREE.Vector3(x - r, y, z), new THREE.Vector3(-x + r, y, z),
      new THREE.Vector3(-x, y, z - r), new THREE.Vector3(-x, y, -z + r)
    ];
  }

  function sewingLine(cx, cz, accMat) {
    var g = group(scene, cx, 0, cz);
    var needles = [], hangers = [];
    bx(g, 58.4, 0.5, 13.8, M.steelDark, 0, 0.25, 0, { edge: true });
    bx(g, 57.4, 0.12, 12.8, accMat, 0, 0.53, 0);

    for (var i = 0; i < 6; i++) {
      var sg = group(g, -20 + i * 8, 0, 0);
      [-1, 1].forEach(function (lx) {
        [-1, 1].forEach(function (lz) {
          bx(sg, 0.34, 3.0, 0.34, M.steel, lx * 2.8, 1.5, lz * 1.45);
        });
      });
      bx(sg, 6.4, 0.42, 3.6, M.body, 0, 3.12, 0, { edge: true });
      bx(sg, 5.4, 0.1, 2.8, M.body2, 0, 3.38, 0);
      bx(sg, 2.0, 1.15, 2.4, M.body, -0.7, 4.24, -0.15, { edge: true });
      bx(sg, 0.55, 0.55, 1.05, M.accent, 0.85, 4.36, -0.15);
      var nd = bx(sg, 0.12, 0.9, 0.12, M.rail, 0.5, 3.66, 0.55);
      needles.push({ m: nd, y0: 3.66, phase: i * 1.7 });
      cyl(sg, 0.5, 0.16, M.accent2, -1.78, 4.24, 0.2, { rz: Math.PI / 2, seg: 14 });
      cyl(sg, 0.2, 0.62, M.box, -0.25, 5.08, -0.72, { seg: 10 });
      cyl(sg, 0.2, 0.62, M.garmentB, 0.42, 5.08, -0.72, { seg: 10 });
      bx(sg, 2.3, 0.09, 1.5, M.paper, 1.15, 3.46, 0.55);
      bx(sg, 0.22, 0.22, 0.22, M.led, -0.7, 4.92, -0.35);

      if (i % 2 === 1) {
        var st = group(sg, 1.6, 0, -3.1);
        bx(st, 0.16, 6.3, 0.16, M.steel, 0, 3.15, 0);
        bx(st, 2.2, 0.14, 0.14, M.steel, 0.85, 6.2, 0);
        garment(st, i === 3 ? M.garmentB : M.garmentA, 1.6, 6.1, 0, 0.9, 0);
      }
    }

    var railY = 10.7;
    var railCurve = new THREE.CatmullRomCurve3(loopPoints(50, 11.6, railY), true, "catmullrom", 0.06);
    var tube = new THREE.Mesh(new THREE.TubeGeometry(railCurve, 200, 0.17, 6, true), M.rail);
    tube.castShadow = true;
    g.add(tube);

    [-1, 1].forEach(function (px) {
      [-1, 1].forEach(function (pz) {
        bx(g, 0.36, 12.2, 0.36, M.steel, px * 25.8, 6.1, pz * 6.2, { edge: true });
      });
    });
    bx(g, 0.42, 0.42, 13.0, M.steel, -25.8, 12.0, 0);
    bx(g, 0.42, 0.42, 13.0, M.steel, 25.8, 12.0, 0);
    bx(g, 52.2, 0.42, 0.42, M.steel, 0, 12.0, 6.2);
    bx(g, 52.2, 0.42, 0.42, M.steel, 0, 12.0, -6.2);
    for (var rx = -20; rx <= 20; rx += 10) {
      bx(g, 0.12, 1.1, 0.12, M.rail, rx, 11.25, 5.55, { nocast: true });
      bx(g, 0.12, 1.1, 0.12, M.rail, rx, 11.25, -5.55, { nocast: true });
    }

    for (var h = 0; h < 6; h++) {
      var hg = group(g, 0, 0, 0);
      garment(hg, h % 3 === 1 ? M.garmentB : M.garmentA, 0, 0, 0, 0.92, 0);
      hangers.push({ g: hg, t: h / 6, speed: 0.006 });
    }

    return { g: g, needles: needles, hangers: hangers, railCurve: railCurve };
  }

  /* ---------------- cutting table + robot ---------------- */
  function buildRobot(parent, x, y, z) {
    var g = group(parent, x, y, z);
    cyl(g, 1.5, 0.5, M.steelDark, 0, 0.25, 0, { seg: 20 });
    var base = group(g, 0, 0.5, 0);
    cyl(base, 1.15, 1.0, M.body, 0, 0.5, 0, { seg: 18 });
    var armA = group(base, 0, 1.0, 0);
    bx(armA, 0.9, 3.6, 0.9, M.accent, 0, 1.7, 0, { edge: true });
    var armB = group(armA, 0, 3.3, 0);
    armB.rotation.x = 0.9;
    bx(armB, 0.7, 3.2, 0.7, M.body, 0, 1.4, 0, { edge: true });
    var head = group(armB, 0, 2.9, 0);
    bx(head, 0.9, 0.8, 0.9, M.accent2, 0, 0.2, 0, { edge: true });
    bx(head, 0.14, 0.9, 0.14, M.rail, -0.35, -0.35, 0);
    bx(head, 0.14, 0.9, 0.14, M.rail, 0.35, -0.35, 0);
    return { g: g, base: base, armA: armA, armB: armB };
  }

  function cutTable(cx, cz, accMat, withRobot) {
    var g = group(scene, cx, 0, cz);
    bx(g, 10.4, 0.14, 24.6, accMat, 0, 0.07, 0);
    [-1, 1].forEach(function (lx) {
      [-1, 1].forEach(function (lz) {
        bx(g, 0.6, 3.2, 0.6, M.steel, lx * 4.35, 1.6, lz * 10.6, { edge: true });
      });
      bx(g, 0.42, 0.42, 22.4, M.steel, lx * 4.35, 0.85, 0);
      bx(g, 1.1, 0.5, 22.6, M.steelDark, lx * 4.35, 3.1, 0);
    });
    bx(g, 9.5, 0.7, 23.0, M.body, 0, 3.42, 0, { edge: true });
    bx(g, 8.7, 0.1, 21.8, M.belt, 0, 3.82, 0);
    bx(g, 0.5, 0.5, 22.6, M.rail, -4.7, 6.9, 0);
    bx(g, 0.5, 0.5, 22.6, M.rail, 4.7, 6.9, 0);

    var bridge = group(g, 0, 0, 0);
    bx(bridge, 10.4, 0.9, 1.5, M.accent2, 0, 7.3, 0, { edge: true });
    bx(bridge, 1.2, 1.3, 1.7, M.steel, -4.7, 7.3, 0);
    bx(bridge, 1.2, 1.3, 1.7, M.steel, 4.7, 7.3, 0);
    bx(bridge, 2.2, 1.7, 2.0, M.body, 0, 6.3, 0, { edge: true });
    bx(bridge, 0.16, 1.1, 0.6, M.rail, 0, 5.05, 0);
    bx(bridge, 0.6, 0.16, 2.2, M.scan, 0, 5.25, 0);

    /* 台面上是成叠的裁片，不是纸箱：多层布错位叠放 + 已裁切分条 */
    bx(g, 7.8, 0.07, 7.2, M.mannequin, 0, 3.89, 7.4);
    bx(g, 7.3, 0.06, 6.6, M.paper, 0.15, 3.95, 7.3);
    bx(g, 6.8, 0.05, 6.0, M.mannequin, -0.1, 4.0, 7.2);
    [-1, 0, 1].forEach(function (i) {
      bx(g, 1.7, 0.04, 5.4, M.paper, i * 1.9, 4.05, 7.2);
    });

    var cb = group(g, 6.2, 0, 7.8);
    bx(cb, 1.5, 3.6, 1.5, M.body, 0, 1.8, 0, { edge: true });
    bx(cb, 0.1, 1.2, 1.0, M.screen, -0.78, 2.9, 0);
    bx(cb, 0.24, 0.24, 0.24, M.led, 0.35, 3.72, 0.4);

    var robot = withRobot ? buildRobot(g, 0, 3.8, -8.6) : null;
    return { g: g, bridge: bridge, robot: robot };
  }

  /* ---------------- QC scanner ---------------- */
  function qcStation(cx, cz, accMat) {
    var g = group(scene, cx, 0, cz);
    stationPad(g, 9.6, 9.6, accMat);
    bx(g, 5.6, 0.36, 3.4, M.body, -0.8, 2.62, 0, { edge: true });
    [-1, 1].forEach(function (lx) {
      [-1, 1].forEach(function (lz) {
        bx(g, 0.26, 2.3, 0.26, M.steel, -0.8 + lx * 2.4, 1.15, lz * 1.3);
      });
    });
    bx(g, 4.4, 0.1, 2.4, M.paper, -0.8, 2.86, 0);
    bx(g, 3.6, 0.16, 2.0, M.garmentB, -0.9, 2.98, 0);
    bx(g, 0.16, 2.0, 0.16, M.steel, -0.9, 3.9, -1.55);

    bx(g, 2.4, 0.5, 2.4, M.steelDark, 3.1, 0.25, 0);
    bx(g, 1.1, 10.3, 1.1, M.body, 3.1, 5.4, 0, { edge: true });
    bx(g, 2.3, 0.6, 1.6, M.accent2, 3.1, 10.2, 0);
    bx(g, 5.0, 0.5, 0.6, M.steel, 0.9, 9.9, 0);
    bx(g, 1.6, 1.3, 1.9, M.body, -1.0, 9.0, 0, { edge: true });
    bx(g, 1.0, 0.18, 1.3, M.scan, -1.0, 8.28, 0);
    bx(g, 0.1, 1.5, 2.1, M.screen, 2.5, 6.4, 0);
    bx(g, 0.24, 0.24, 0.24, M.led, 3.6, 10.6, 0);

    var scan = group(g, -0.9, 5.7, 0);
    bx(scan, 0.08, 3.9, 3.3, M.scan, 0, 0, 0);
    return { g: g, scan: scan };
  }

  /* ---------------- conveyor + tunnel ---------------- */
  function slatTex() {
    var c = document.createElement("canvas");
    c.width = 64;
    c.height = 8;
    var x = c.getContext("2d");
    x.fillStyle = "#262a30";
    x.fillRect(0, 0, 64, 8);
    x.fillStyle = "#4d545c";
    x.fillRect(2, 0, 3, 8);
    x.fillRect(34, 0, 3, 8);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if ("encoding" in t) t.encoding = THREE.sRGBEncoding;
    return t;
  }
  var SLAT = slatTex();

  function conveyor(cx, cz, len, accMat) {
    var g = group(scene, cx, 0, cz);
    var legs = Math.max(2, Math.round(len / 6));
    for (var i = 0; i <= legs; i++) {
      var x = -len / 2 + (i / legs) * len;
      [-1, 1].forEach(function (s) {
        bx(g, 0.3, 2.2, 0.3, M.steel, x, 1.1, s * 1.95);
      });
    }
    bx(g, len, 0.3, 4.9, M.steelDark, 0, 2.35, 0, { edge: true });
    var bt = SLAT.clone();
    bt.needsUpdate = true;
    bt.wrapS = bt.wrapT = THREE.RepeatWrapping;
    bt.repeat.set(len / 2.4, 1);
    var bm = new THREE.MeshStandardMaterial({ map: bt, color: 0xffffff, roughness: 0.9 });
    bx(g, len - 0.6, 0.16, 3.8, bm, 0, 2.58, 0);
    bx(g, len, 0.34, 0.24, M.rail, 0, 2.86, -2.1);
    bx(g, len, 0.34, 0.24, M.rail, 0, 2.86, 2.1);
    bx(g, len, 0.2, 0.2, accMat, 0, 2.3, 2.62);

    var boxes = [];
    for (var b = 0; b < 6; b++) {
      var bg = group(g, 0, 2.7, 0);
      bx(bg, 3.4, 3.0, 3.4, b % 2 ? M.box2 : M.box, 0, 1.5, 0, { edge: true });
      bx(bg, 0.56, 0.05, 3.44, M.paper, 0, 3.03, 0, { nocast: true });
      boxes.push({ g: bg, off: b / 6 });
    }
    return { g: g, tex: bt, boxes: boxes, len: len, speed: 4.2 };
  }

  function tunnel(cx, cz) {
    var g = group(scene, cx, 0, cz);
    bx(g, 14.4, 0.6, 10.2, M.steelDark, 0, 0.3, 0, { edge: true });
    bx(g, 13.2, 8.0, 9.2, M.body, 0, 4.4, 0, { edge: true });
    bx(g, 13.4, 0.7, 9.3, M.accent, 0, 8.15, 0);
    bx(g, 1.3, 5.6, 9.26, M.accent2, -5.4, 4.0, 0);
    bx(g, 1.3, 5.6, 9.26, M.accent2, 5.4, 4.0, 0);
    bx(g, 0.14, 5.0, 5.2, M.darkPart, -6.62, 3.5, 0);
    bx(g, 0.14, 5.0, 5.2, M.darkPart, 6.62, 3.5, 0);
    bx(g, 2.4, 4.6, 2.6, M.body2, 3.4, 10.6, 0, { edge: true });
    for (var i = 0; i < 4; i++) bx(g, 2.5, 0.14, 0.1, M.steelDark, 3.4, 9.3 + i * 0.9, 1.34);
    bx(g, 11.4, 0.12, 0.12, M.led, 0, 8.6, 4.66);
    bx(g, 1.9, 1.2, 0.1, M.screen, -2.4, 5.6, 4.64);
    return g;
  }

  /* ---------------- trucks ---------------- */
  function truck(cx, cz, rotY) {
    var g = group(scene, cx, 0, cz, rotY || 0);
    [-7.2, 1.6, 5.8].forEach(function (x) {
      [-1, 1].forEach(function (s) {
        cyl(g, 1.35, 0.95, M.tire, x, 1.35, s * 3.3, { rx: Math.PI / 2, seg: 18 });
        cyl(g, 0.5, 1.02, M.steelDark, x, 1.35, s * 3.3, { rx: Math.PI / 2, seg: 12 });
      });
    });
    bx(g, 24, 0.7, 5.2, M.steelDark, 0.5, 2.45, 0, { edge: true });
    bx(g, 6.4, 5.8, 6.6, M.cab, -8.4, 5.7, 0, { edge: true });
    bx(g, 0.2, 3.0, 5.4, M.glass, -11.65, 7.2, 0);
    bx(g, 4.4, 2.2, 0.2, M.glass, -8.2, 7.3, 3.36);
    bx(g, 6.6, 0.8, 6.8, M.body2, -8.4, 8.9, 0);
    bx(g, 2.0, 1.2, 6.8, M.cab, -11.2, 2.9, 0);
    bx(g, 17.4, 8.0, 7.2, M.truckBody, 2.6, 7.0, 0, { edge: true });
    bx(g, 17.6, 0.5, 7.4, M.body2, 2.6, 11.25, 0);
    bx(g, 0.12, 6.6, 6.4, M.darkPart, 11.32, 6.2, 0);

    var d1 = group(g, 11.4, 6.5, 3.2);
    d1.rotation.y = 1.25;
    bx(d1, 0.24, 7.2, 3.5, M.truckBody, 0, 0, 1.75, { edge: true });
    var d2 = group(g, 11.4, 6.5, -3.2);
    d2.rotation.y = -1.25;
    bx(d2, 0.24, 7.2, 3.5, M.truckBody, 0, 0, -1.75, { edge: true });

    bx(g, 3.2, 2.8, 3.6, M.box, 7.6, 4.2, -1.2);
    bx(g, 3.2, 2.8, 3.6, M.box2, 7.6, 4.2, 2.0);

    var st = group(g, 14.0, 0, 2.0);
    bx(st, 3.0, 2.6, 3.0, M.box, 0, 1.3, 0, { edge: true });
    bx(st, 3.0, 2.6, 3.0, M.box2, 0.2, 3.9, 0.1, { edge: true });
    bx(st, 2.6, 2.2, 2.6, M.box, -0.1, 6.3, 0);
    return g;
  }

  /* ---------------- AGV ---------------- */
  function agv(cx, cz) {
    var g = group(scene, cx, 0, cz);
    [-1.85, 1.85].forEach(function (wx) {
      [-1.45, 1.45].forEach(function (wz) {
        cyl(g, 0.34, 0.3, M.tire, wx, 0.34, wz, { rz: Math.PI / 2, seg: 12, nocast: true });
      });
    });
    bx(g, 5.2, 0.62, 4.1, M.steelDark, 0, 0.66, 0);
    bx(g, 5.4, 1.0, 4.2, M.paper, 0, 1.5, 0, { edge: true });
    bx(g, 4.8, 0.16, 3.6, M.accent, 0, 2.05, 0);
    [-1, 1].forEach(function (sx) {
      [-1, 1].forEach(function (sz) {
        bx(g, 0.34, 0.2, 0.34, M.led, sx * 2.2, 1.68, sz * 1.75, { nocast: true });
      });
    });
    cyl(g, 0.16, 1.6, M.steel, -2.0, 2.75, 1.3, { seg: 8 });
    bx(g, 0.4, 0.3, 0.4, M.ledWarn, -2.0, 3.6, 1.3, { nocast: true });
    bx(g, 1.6, 0.7, 1.2, M.box, 2.2, 2.42, -1.2);
    return g;
  }

  /* ---------------- finished-goods rack ---------------- */
  function finishedRack(cx, cz, accMat) {
    var g = group(scene, cx, 0, cz);
    bx(g, 24.2, 0.14, 15.2, accMat, 0, 0.07, 0);
    bx(g, 22.8, 11.9, 0.4, M.accent2, 0, 6.1, -6.7, { edge: true });
    [-11, -1, 11].forEach(function (x) {
      [-6.5, 6.5].forEach(function (z) {
        bx(g, 0.42, 12.2, 0.42, M.accent2, x, 6.1, z, { edge: true });
      });
    });
    bx(g, 22.6, 0.4, 0.4, M.accent2, 0, 12.0, -6.5);
    bx(g, 22.6, 0.4, 0.4, M.accent2, 0, 12.0, 6.5);
    for (var lvl = 0; lvl < 3; lvl++) {
      var y = 1.75 + lvl * 2.95;
      bx(g, 10.2, 0.18, 12.8, M.body2, -6, y, 0);
      for (var cx1 = 0; cx1 < 3; cx1++) {
        for (var cz1 = 0; cz1 < 2; cz1++) {
          bx(g, 3.0, 2.4, 3.0, (lvl + cx1) % 2 ? M.box : M.box2, -9.4 + cx1 * 3.2, y + 1.3, -2.9 + cz1 * 5.8, { edge: true });
        }
      }
    }
    [6.6, 9.9].forEach(function (ry) {
      [-2.4, 2.4].forEach(function (rz, row) {
        bx(g, 9.6, 0.14, 0.14, M.rail, 5, ry, rz);
        for (var i = 0; i < 4; i++) {
          garment(g, (i + row) % 2 ? M.garmentB : M.garmentA, 1.6 + i * 2.3, ry - 0.05, rz, 0.94, 0);
        }
      });
    });
    return g;
  }

  /* ---------------- control room ---------------- */
  function controlDesk(cx, cz, accMat) {
    var g = group(scene, cx, 0, cz);
    bx(g, 18, 0.5, 11, M.steelDark, 0, 0.25, 0, { edge: true });
    bx(g, 17.2, 0.12, 10.2, accMat, 0, 0.53, 0);
    bx(g, 13.0, 0.4, 3.2, M.body, -1, 2.4, -1.8, { edge: true });
    bx(g, 13.0, 1.6, 0.3, M.body2, -1, 1.2, -3.2);
    bx(g, 0.4, 2.2, 2.6, M.steel, -7, 1.1, -1.8);
    bx(g, 0.4, 2.2, 2.6, M.steel, 5, 1.1, -1.8);
    for (var i = 0; i < 4; i++) {
      var mg = group(g, -6 + i * 3.1, 0, 0);
      bx(mg, 0.3, 0.7, 0.3, M.steelDark, 0, 3.0, -2.2);
      bx(mg, 2.3, 1.5, 0.14, M.monitor, 0, 3.8, -2.2, { edge: true });
      bx(mg, 2.1, 1.3, 0.04, M.screen, 0, 3.8, -2.11, { nocast: true });
      bx(mg, 1.4, 0.07, 0.7, M.paper, 0, 2.64, -0.8);
    }
    for (var c = 0; c < 3; c++) {
      var ch = group(g, -5 + c * 4, 0, -0.2);
      bx(ch, 1.3, 0.24, 1.3, M.accent, 0, 1.6, 0);
      bx(ch, 1.3, 1.4, 0.2, M.accent, 0, 2.35, 0.62);
      cyl(ch, 0.16, 1.5, M.steelDark, 0, 0.85, 0, { seg: 8 });
      cyl(ch, 0.7, 0.1, M.steelDark, 0, 0.12, 0, { seg: 14 });
    }
    return g;
  }

  function cabinets(cx, cz) {
    var g = group(scene, cx, 0, cz);
    bx(g, 11.4, 0.4, 6.0, M.steelDark, 0, 0.2, 0, { edge: true });
    for (var i = 0; i < 3; i++) {
      var cg = group(g, -3.7 + i * 3.7, 0.4, 0);
      bx(cg, 2.8, 6.6, 3.4, M.body, 0, 3.3, 0, { edge: true });
      for (var v = 0; v < 4; v++) bx(cg, 2.0, 0.12, 0.06, M.steelDark, 0, 5.5 - v * 0.5, 1.72, { nocast: true });
      bx(cg, 0.2, 0.2, 0.2, M.led, 0.9, 5.95, 1.72, { nocast: true });
      bx(cg, 0.16, 1.2, 0.08, M.steelDark, 0.9, 3.4, 1.72, { nocast: true });
    }
    return g;
  }

  /* ---------------- mannequin turntable ---------------- */
  function turntable(cx, cz) {
    var g = group(scene, cx, 0, cz);
    cyl(g, 5.4, 0.5, M.steelDark, 0, 0.25, 0, { seg: 40 });
    cyl(g, 4.9, 0.12, M.body, 0, 0.56, 0, { seg: 40 });
    cyl(g, 4.2, 0.1, M.accent, 0, 0.63, 0, { seg: 40 });
    var rot = group(g, 0, 0.6, 0);
    for (var i = 0; i < 3; i++) {
      var a = i * Math.PI * 2 / 3 + 0.4;
      var mat = i % 2 ? M.garmentB : M.garmentA;
      var mg = group(rot, Math.cos(a) * 2.3, 0, Math.sin(a) * 2.3, -a + Math.PI / 2);
      cyl(mg, 1.1, 0.14, M.accent2, 0, 0.07, 0, { seg: 22 });
      cyl(mg, 0.12, 1.5, M.steel, 0, 0.85, 0, { seg: 8 });
      cone(mg, 0.74, 1.42, 3.4, mat, 0, 2.85, 0, { seg: 16, nocast: true });
      bx(mg, 2.5, 0.44, 0.85, mat, 0, 4.75, 0, { edge: true });
      cyl(mg, 0.3, 0.44, M.mannequin, 0, 5.18, 0, { seg: 12 });
      ball(mg, 0.48, M.mannequin, 0, 5.58, 0, 14);
    }
    return { g: g, rot: rot };
  }

  /* ================= scene assembly ================= */
  var STATIONS = [];
  var ST = {};
  var pickables = [];
  var ACCENTS = [];
  var MOTION = { hangers: [], needles: [], gantries: [], robots: [], conveyors: [], agvs: [], spins: [], scans: [] };

  function accentMat() {
    var m = new THREE.MeshStandardMaterial({ color: 0xbfd0e2, roughness: 0.7, metalness: 0.05 });
    ACCENTS.push(m);
    return m;
  }

  function stationAccentColor() {
    var p = PAL[THEME.dark ? "dark" : "light"];
    return p.accent;
  }

  /* 几何（x/z/w/d/popY）写死在调用处，业务数据按 id 从数据源取，
     两边在 addStation 里合并成建模 / 交互用的完整对象 */
  function addStation(geo) {
    var cfg = Object.assign({}, geo, getStation(geo.id));
    cfg._halted = false;
    cfg._acc = accentMat();
    STATIONS.push(cfg);
    ST[cfg.id] = cfg;
    return cfg;
  }

  function finish(cfg, g, w, h, d, y) {
    cfg._g = g;
    var p = new THREE.Mesh(boxGeo(w, h, d), pickMat);
    p.position.set(0, (y || 0) + h / 2, 0);
    p.userData.b = cfg;
    g.add(p);
    pickables.push(p);
    return cfg;
  }

  /* ---- fabric warehouse ---- */
  var fb = addStation({ id: "FB-01", x: -60, z: 0, w: 24, d: 36, popY: 16.5 });
  var fbG = fabricRack(-60, 0);
  blob(-60, 0, 26, 40);
  finish(fb, fbG, 23, 12, 35, 0);

  /* ---- two hanging sewing lines ---- */
  function buildLine(id, z) {
    var s = addStation({ id: id, x: 0, z: z, w: 58, d: 15, popY: 14.2 });
    var ln = sewingLine(0, z, s._acc);
    s._line = ln;
    ln.hangers.forEach(function (h) { h.st = s; MOTION.hangers.push(h); });
    ln.needles.forEach(function (n) { n.st = s; MOTION.needles.push(n); });
    blob(0, z, 60, 17);
    finish(s, ln.g, 57, 15.6, 14.5, 0);
    return s;
  }
  var stA = buildLine("ST-01", -38);
  var stB = buildLine("ST-02", -20);

  /* ---- five cutting tables ---- */
  /* 只保留几何与机械特征，业务数值在 stations.mock.ts */
  var CT_DATA = [
    { id: "CT-01", x: -26, robot: true },
    { id: "CT-02", x: -14, robot: false },
    { id: "CT-03", x: -2, robot: false },
    { id: "CT-04", x: 10, robot: false },
    { id: "CT-05", x: 22, robot: false }
  ];
  CT_DATA.forEach(function (t, i) {
    var s = addStation({ id: t.id, x: t.x, z: 12, w: 11, d: 25, popY: 10.5 });
    var c = cutTable(t.x, 12, s._acc, t.robot);
    s._cut = c;
    MOTION.gantries.push({ m: c.bridge, st: s, phase: i * 1.3, amp: 7.2, speed: 0.26 });
    if (c.robot) MOTION.robots.push({ r: c.robot, st: s });
    blob(t.x, 12, 12, 26);
    finish(s, c.g, 10.8, 9.2, 25.2, 0);
  });

  /* ---- QC scanner ---- */
  var qc = addStation({ id: "QC-01", x: 31, z: 12, w: 10, d: 10, popY: 12.5 });
  var qcR = qcStation(31, 12, qc._acc);
  qc._qc = qcR;
  MOTION.scans.push({ m: qcR.scan, st: qc, phase: 0.6 });
  finish(qc, qcR.g, 10, 11.5, 10, 0);

  /* ---- packing conveyor + tunnel ---- */
  var pk = addStation({ id: "PK-01", x: 51, z: 36, w: 64, d: 12, popY: 13.5 });
  var pkG = group(scene, 51, 0, 36);
  var conv = conveyor(0, 0, 62, pk._acc);
  pkG.add(conv.g);
  conv.g.position.set(0, 0, 0);
  var tun = tunnel(68, 36);
  pkG.add(tun);
  tun.position.set(17, 0, 0);
  MOTION.conveyors.push({ c: conv, st: pk, t: 0 });
  blob(51, 36, 66, 13);
  finish(pk, pkG, 63, 13, 12, 0);

  /* ---- finished goods rack ---- */
  var fg = addStation({ id: "FG-01", x: 50, z: -24, w: 26, d: 17, popY: 15.5 });
  var fgG = finishedRack(50, -24, fg._acc);
  blob(50, -24, 28, 19);
  finish(fg, fgG, 25, 13.5, 16.5, 0);

  /* ---- control room + cabinets ---- */
  var cr = addStation({ id: "CR-01", x: -66, z: -40, w: 20, d: 12, popY: 10 });
  var crG = controlDesk(-66, -40, cr._acc);
  cabinets(-49, -38);
  finish(cr, crG, 19, 10, 11.5, 0);

  /* ---- loading dock ---- */
  var ld = addStation({ id: "LD-01", x: -40, z: 40, w: 74, d: 13, popY: 13 });
  var ldG = group(scene, -40, 0, 40);
  var t1 = truck(-58, 40);
  ldG.add(t1);
  t1.position.set(-18, 0, 0);
  var t2 = truck(-24, 41.5);
  ldG.add(t2);
  t2.position.set(16, 0, 1.5);
  blob(-58, 40, 30, 12);
  blob(-24, 41.5, 30, 12);
  finish(ld, ldG, 74, 13, 12.5, 0);

  /* ---- decorative: turntable, AGVs, pallets ---- */
  var tt = turntable(74, 13);
  MOTION.spins.push({ m: tt.rot, speed: 0.16 });

  var AGV_DEFS = [
    { curve: laneMain, t: 0.08, speed: 0.019, closed: true },
    { curve: laneMain, t: 0.55, speed: 0.015, closed: true },
    { curve: LANES[1].curve, t: 0.2, speed: 0.055, closed: false }
  ];
  AGV_DEFS.forEach(function (a) {
    var g = agv(0, 0);
    MOTION.agvs.push({ g: g, curve: a.curve, t: a.t, speed: a.speed, closed: a.closed, dir: 1 });
  });

  /* ================= camera ================= */
  var cam = { theta: 0.22, phi: 0.72, r: 248, tx: 0, ty: 2, tz: 2 };
  var dst = { theta: 0.22, phi: 0.72, r: 248, tx: 0, ty: 2, tz: 2 };
  var HOME = { theta: 0.22, phi: 0.72, r: 248, tx: 0, ty: 2, tz: 2 };
  var auto = false;
  var dragging = false, btn = 0, lx = 0, ly = 0, moved = 0, idle = 0;
  var el = renderer.domElement;

  function clampDst() {
    dst.phi = Math.max(0.24, Math.min(1.18, dst.phi));
    dst.r = Math.max(68, Math.min(420, dst.r));
    dst.tx = Math.max(-72, Math.min(72, dst.tx));
    dst.tz = Math.max(-44, Math.min(44, dst.tz));
  }

  el.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  el.addEventListener("pointerdown", function (e) {
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
    dragging = true; btn = e.button; lx = e.clientX; ly = e.clientY; moved = 0;
    if (auto) setAuto(false);
  });
  el.addEventListener("pointermove", function (e) {
    if (dragging) {
      var dx = e.clientX - lx, dy = e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      if (btn === 2 || e.shiftKey) {
        var k = dst.r * 0.0016;
        dst.tx -= (Math.cos(dst.theta) * dx - Math.sin(dst.theta) * -dy) * k;
        dst.tz -= (Math.sin(dst.theta) * -dx - Math.cos(dst.theta) * -dy) * k;
        clampDst();
      } else {
        dst.theta -= dx * 0.006;
        dst.phi -= dy * 0.0045;
        clampDst();
      }
      idle = 0;
    } else {
      hoverAt(e.clientX, e.clientY);
    }
  });
  el.addEventListener("pointerup", function (e) {
    dragging = false;
    if (moved < 6 && btn === 0) pickAt(e.clientX, e.clientY);
  });
  el.addEventListener("pointerleave", function () {
    tip.classList.remove("on");
    if (hovered) { var h = hovered; hovered = null; paintAcc(h); }
  });
  el.addEventListener("wheel", function (e) {
    e.preventDefault();
    dst.r *= Math.exp(e.deltaY * 0.0012);
    userZoomed = true;
    clampDst();
    idle = 0;
  }, { passive: false });

  /* ================= picking ================= */
  var ray = new THREE.Raycaster();
  var mouse = new THREE.Vector2();
  var hovered = null;
  var selected = null;

  function paintAcc(b) {
    var p = PAL[THEME.dark ? "dark" : "light"];
    var c = b._halted ? p.halt : (b === selected ? p.sel : (b === hovered ? p.hover : p.accent));
    b._acc.color.setHex(c);
  }

  function toNdc(x, y) {
    var r = el.getBoundingClientRect();
    mouse.x = ((x - r.left) / r.width) * 2 - 1;
    mouse.y = -((y - r.top) / r.height) * 2 + 1;
    return r;
  }
  function hoverAt(x, y) {
    var r = toNdc(x, y);
    ray.setFromCamera(mouse, camera);
    var hit = ray.intersectObjects(pickables, false)[0];
    var b = hit ? hit.object.userData.b : null;
    if (b === hovered) {
      if (b) { tip.style.left = (x - r.left) + "px"; tip.style.top = (y - r.top) + "px"; }
      return;
    }
    if (hovered) { var prev = hovered; hovered = null; paintAcc(prev); }
    if (b) {
      hovered = b;
      paintAcc(b);
      tip.innerHTML = b.id + " " + b.name + "<i>" + b.type + "</i>";
      tip.style.left = (x - r.left) + "px";
      tip.style.top = (y - r.top) + "px";
      tip.classList.add("on");
      el.style.cursor = "pointer";
    } else {
      tip.classList.remove("on");
      el.style.cursor = "grab";
    }
  }
  function pickAt(x, y) {
    toNdc(x, y);
    ray.setFromCamera(mouse, camera);
    var hit = ray.intersectObjects(pickables, false)[0];
    if (hit) select(hit.object.userData.b, true);
  }

  function vmOf(b) {
    var vm = getStationVM(b.id);
    vm.halted = !!b._halted;
    return vm;
  }
  function emitSel(meta) {
    opts.onSelect(selected ? vmOf(selected) : null, meta || { user: false });
  }

  function select(b, focus) {
    if (selected && selected !== b) { var prev = selected; selected = null; paintAcc(prev); }
    selected = b;
    paintAcc(b);
    ring.visible = true;
    ring.position.set(b.x, 0.18, b.z);
    var rad = Math.min(Math.max(b.w, b.d) * 0.54, 24);
    ring.scale.set(rad, rad, 1);
    halo.position.set(b.x, 0.14, b.z);
    var hs = Math.min(Math.max(b.w, b.d) * 1.75, 36);
    halo.scale.set(hs, hs, 1);
    popupTarget.set(b.x, b.popY, b.z);
    emitSel({ user: !!focus });
    if (focus) flyTo(b);
    idle = 0;
  }

  /* ================= resize ================= */
  var userZoomed = false;
  function fitDistance() {
    var r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var aspect = r.width / r.height;
    HOME.r = Math.max(205, Math.min(372, 248 * Math.max(1, 1.34 / aspect)));
    if (!userZoomed) dst.r = HOME.r;
  }
  function resize() {
    var r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    fitDistance();
  }
  var resizeObs = null;
  if (window.ResizeObserver) { resizeObs = new ResizeObserver(resize); resizeObs.observe(host); }
  window.addEventListener("resize", resize);
  resize();

  cam.r = HOME.r * 1.16;
  cam.theta = HOME.theta - 0.28;
  cam.phi = 0.56;
  dst.r = HOME.r;

  /* ================= theme ================= */
  function applyTheme(dark) {
    THEME.dark = dark;
    var p = PAL[dark ? "dark" : "light"];
    applyMaterials(p);
    hemi.color.setHex(p.hemiSky);
    hemi.groundColor.setHex(p.hemiGround);
    hemi.intensity = p.hemi;
    sun.color.setHex(p.sunColor);
    sun.intensity = p.sun;
    fill.color.setHex(p.fillColor);
    fill.intensity = p.fill;
    rim.color.setHex(p.rimColor);
    rim.intensity = p.rim;
    scene.fog.color.setHex(p.fog);
    scene.fog.near = p.fogNear;
    scene.fog.far = p.fogFar;
    sunGlow.material.color.setHex(p.glowColor);
    sunGlow.material.opacity = p.glowOp;
    sunGlow.userData.base = p.glowOp;
    groundGlow.material.color.setHex(p.glowColor);
    groundGlow.material.opacity = p.glowOp * 0.7;
    blobMat.opacity = p.blob;
    scene.environment = dark ? null : ENV_LIGHT;
    scene.traverse(function (o) {
      var m = o.material;
      if (!m) return;
      var list = m.length !== undefined ? m : [m];
      for (var i = 0; i < list.length; i++) {
        if (list[i].isMeshStandardMaterial) list[i].envMapIntensity = dark ? 0 : 0.52;
      }
    });
    M.floor.roughness = dark ? 0.8 : 0.34;
    M.floor.metalness = dark ? 0.04 : 0.14;
    M.plate.roughness = dark ? 0.96 : 0.8;
    M.body.roughness = dark ? 0.78 : 0.68;
    M.body2.roughness = dark ? 0.82 : 0.72;
    M.truckBody.roughness = dark ? 0.74 : 0.58;
    M.steel.roughness = dark ? 0.55 : 0.4;
    M.steelDark.roughness = dark ? 0.6 : 0.46;
    M.glass.roughness = dark ? 0.22 : 0.14;
    floorGlare.visible = !dark;
    floorGlare.material.opacity = dark ? 0 : 0.42;
    ring.material.color.setHex(p.ring);
    routeMat.color.setHex(p.route);
    routeDot.material.color.setHex(p.route);
    routeRing.material.color.setHex(p.route);
    halo.material.opacity = 0;
    STATIONS.forEach(paintAcc);
    hovered = null;
    tip.classList.remove("on");
  }

  /* ================= auto tour ================= */
  var AUTO_LIST = STATIONS.slice();
  var autoIdx = 0, autoSelT = 0;
  function autoNext() {
    autoIdx = (autoIdx + 1) % AUTO_LIST.length;
    select(AUTO_LIST[autoIdx]);
  }
  function setAuto(v) {
    auto = v;
    autoSelT = 0;
    if (v) autoIdx = Math.max(0, AUTO_LIST.indexOf(selected));
    opts.onAuto(v);
  }

  /* ================= actions ================= */
  var tracing = false, routeT = 0;

  function flyTo(b) {
    var maxd = Math.max(b.w || 10, b.d || 10);
    dst.tx = b.x; dst.tz = b.z;
    dst.ty = Math.min(5, maxd * 0.1);
    dst.phi = 0.38;
    dst.r = Math.max(70, maxd * 1.55 + 16);
    userZoomed = true;
    setAuto(false);
    clampDst();
  }

  function focusSelected() {
    if (selected) flyTo(selected);
  }

  function toggleHalt() {
    if (!selected) return null;
    var b = selected;
    b._halted = !b._halted;
    paintAcc(b);
    emitSel({ user: true });
    return vmOf(b);
  }

  function toggleRoute() {
    tracing = !tracing;
    routeLine.visible = tracing;
    routeDot.visible = tracing;
    routeRing.visible = tracing;
    if (tracing) routeT = 0;
    return tracing;
  }

  function clearSelection() {
    ring.visible = false;
    halo.material.opacity = 0;
    if (selected) { var b = selected; selected = null; paintAcc(b); }
    if (hovered) { var h = hovered; hovered = null; paintAcc(h); }
    tip.classList.remove("on");
    emitSel({ user: false });
  }

  function selectById(id, focus) {
    var b = ST[id];
    if (b) { select(b, focus); return true; }
    return false;
  }

  function getStations() {
    return STATIONS.map(function (s) {
      return { id: s.id, name: s.name, short: s.short, load: s.load, halted: !!s._halted };
    });
  }

  /* ================= loop ================= */
  var clock = new THREE.Clock();
  var projV = new THREE.Vector3();
  var tmpTan = new THREE.Vector3();

  function frame() {
    var dt = Math.min(clock.getDelta(), 0.05);
    var now = performance.now() / 1000;
    idle += dt;

    if (auto && !dragging) {
      dst.theta += dt * 0.065;
      autoSelT += dt;
      if (autoSelT >= 4.6) { autoSelT = 0; autoNext(); }
    }

    var k = Math.min(1, dt * (idle < 1.4 ? 3.2 : 7));
    cam.theta += (dst.theta - cam.theta) * k;
    cam.phi += (dst.phi - cam.phi) * k;
    cam.r += (dst.r - cam.r) * k;
    cam.tx += (dst.tx - cam.tx) * k;
    cam.ty += (dst.ty - cam.ty) * k;
    cam.tz += (dst.tz - cam.tz) * k;

    var cp = Math.cos(cam.phi);
    camera.position.set(
      cam.tx + cam.r * cp * Math.sin(cam.theta),
      cam.ty + cam.r * Math.sin(cam.phi),
      cam.tz + cam.r * cp * Math.cos(cam.theta)
    );
    camera.lookAt(cam.tx, cam.ty, cam.tz);

    /* hangers travelling on the rail loops */
    for (var i = 0; i < MOTION.hangers.length; i++) {
      var h = MOTION.hangers[i];
      if (!h.st._halted) h.t = (h.t + dt * h.speed) % 1;
      var hp = h.st._line.railCurve.getPointAt(h.t);
      h.g.position.set(hp.x, hp.y, hp.z);
    }

    /* sewing needles */
    for (var n = 0; n < MOTION.needles.length; n++) {
      var nd = MOTION.needles[n];
      nd.m.position.y = nd.st._halted ? nd.y0 : nd.y0 + Math.sin(now * 7 + nd.phase) * 0.13;
    }

    /* cutting gantries */
    for (var gI = 0; gI < MOTION.gantries.length; gI++) {
      var g = MOTION.gantries[gI];
      g.m.position.z = g.st._halted ? g.m.position.z : Math.sin(now * g.speed + g.phase) * g.amp;
    }

    /* robot arm */
    for (var rI = 0; rI < MOTION.robots.length; rI++) {
      var rb = MOTION.robots[rI];
      if (rb.st._halted) continue;
      rb.r.base.rotation.y = Math.sin(now * 0.45) * 0.7;
      rb.r.armB.rotation.x = 0.82 + Math.sin(now * 0.95) * 0.22;
    }

    /* conveyor slats + cartons */
    for (var cI = 0; cI < MOTION.conveyors.length; cI++) {
      var cvm = MOTION.conveyors[cI], cv = cvm.c, cst = cvm.st;
      if (!cst._halted) {
        cv.tex.offset.x -= dt * 0.42;
        cvm.t = (cvm.t + dt * cv.speed / cv.len) % 1;
        for (var bi = 0; bi < cv.boxes.length; bi++) {
          var box = cv.boxes[bi];
          box.g.position.x = -cv.len / 2 + ((box.off + cvm.t) % 1) * cv.len;
        }
      }
    }

    /* AGVs along dashed lanes */
    for (var aI = 0; aI < MOTION.agvs.length; aI++) {
      var a = MOTION.agvs[aI];
      if (a.closed) {
        a.t = (a.t + dt * a.speed) % 1;
      } else {
        a.t += dt * a.speed * a.dir;
        if (a.t > 1) { a.t = 1; a.dir = -1; }
        else if (a.t < 0) { a.t = 0; a.dir = 1; }
      }
      var ap = a.curve.getPointAt(a.t);
      a.curve.getTangentAt(a.t, tmpTan);
      a.g.position.set(ap.x, 0.02, ap.z);
      a.g.rotation.y = Math.atan2(tmpTan.x * a.dir, tmpTan.z * a.dir);
    }

    /* turntable + QC sweep */
    for (var sI = 0; sI < MOTION.spins.length; sI++) MOTION.spins[sI].m.rotation.y += dt * MOTION.spins[sI].speed;
    for (var qI = 0; qI < MOTION.scans.length; qI++) {
      var sc = MOTION.scans[qI];
      if (!sc.st._halted) sc.m.position.x = -0.9 + Math.sin(now * 1.5 + sc.phase) * 2.0;
    }

    if (ring.visible && selected) {
      var pulse = 1 + Math.sin(now * 2.2) * 0.03;
      var base = Math.min(Math.max(selected.w, selected.d) * 0.54, 24);
      ring.scale.x = ring.scale.y = base * pulse;
      ring.material.opacity = 0.34 + Math.sin(now * 2.2) * 0.1;
      halo.material.opacity = (THEME.dark ? 0.26 : 0.14) + Math.sin(now * 1.4) * 0.04;
    }

    if (tracing) {
      routeT = (routeT + dt * 0.045) % 1;
      var rp = laneMain.getPointAt(routeT);
      routeDot.position.set(rp.x, 1.6, rp.z);
      routeRing.position.set(rp.x, 0.22, rp.z);
      routeRing.material.opacity = 0.3 + Math.sin(now * 3) * 0.14;
    }

    if (sunGlow.userData.base) sunGlow.material.opacity = sunGlow.userData.base * (0.9 + Math.sin(now * 0.24) * 0.1);

    /* popup + zone labels */
    var cr2 = canvasEl.getBoundingClientRect();
    if (selected) {
      projV.copy(popupTarget).project(camera);
      var sx = (projV.x * 0.5 + 0.5) * cr2.width;
      var sy = (-projV.y * 0.5 + 0.5) * cr2.height;
      var pw = popup.offsetWidth || 292, ph = popup.offsetHeight || 130;
      var fx = sx < Math.max(pw + 46, cr2.width * 0.46);
      var fy = sy < ph + 34;
      popup.style.transform = "translate(" + (fx ? "0%" : "-100%") + "," + (fy ? "0%" : "-100%") + ") translate(" + (fx ? "20px" : "-22px") + "," + (fy ? "16px" : "-10px") + ")";
      popup.classList.toggle("fr", fx);
      popup.classList.toggle("fd", fy);
      sx = Math.max(fx ? 10 : Math.min(pw + 40, cr2.width - 12), Math.min(fx ? cr2.width - pw - 30 : cr2.width - 12, sx));
      sy = Math.max(fy ? 10 : Math.min(ph + 26, cr2.height - 12), Math.min(fy ? cr2.height - ph - 24 : cr2.height - 12, sy));
      popup.style.left = sx.toFixed(1) + "px";
      popup.style.top = sy.toFixed(1) + "px";
    }

    ZONES.forEach(function (z) {
      projV.copy(z.v).project(camera);
      z.el.style.opacity = projV.z < 1 ? "0.85" : "0";
      z.el.style.left = ((projV.x * 0.5 + 0.5) * cr2.width).toFixed(0) + "px";
      z.el.style.top = ((-projV.y * 0.5 + 0.5) * cr2.height).toFixed(0) + "px";
    });

    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(frame);

  /* ================= public api ================= */
  applyTheme(opts.dark);
  var initialSelT = setTimeout(function () { select(ST["ST-01"]); }, 420);

  return {
    selectById: selectById,
    clearSelection: clearSelection,
    focusSelected: focusSelected,
    toggleHalt: toggleHalt,
    toggleRoute: toggleRoute,
    setAuto: setAuto,
    zoom: function (f) { userZoomed = true; dst.r *= f; clampDst(); },
    reset: function () {
      userZoomed = false;
      dst.theta = HOME.theta; dst.phi = HOME.phi; dst.r = HOME.r;
      dst.tx = HOME.tx; dst.ty = HOME.ty; dst.tz = HOME.tz;
    },
    applyTheme: function (dark) { applyTheme(dark); },
    getStations: getStations,
    dispose: function () {
      renderer.setAnimationLoop(null);
      if (resizeObs) resizeObs.disconnect();
      window.removeEventListener("resize", resize);
      clearTimeout(initialSelT);
      ZONES.forEach(function (z) { if (z.el && z.el.parentNode) z.el.parentNode.removeChild(z.el); });
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };
}
