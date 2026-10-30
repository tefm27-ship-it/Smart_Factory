// @ts-nocheck
import type { CampusSceneApi, CampusSceneOptions } from "./types";
import { getBuilding, getBuildingVM } from "../data/campus/buildings.source";

export function createCampusScene(opts: CampusSceneOptions): CampusSceneApi {
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
  var camera = new THREE.PerspectiveCamera(30, 1.4, 1, 2000);

  var hemi = new THREE.HemisphereLight(0xffffff, 0x9d9a8e, 0.46);
  scene.add(hemi);
  var sun = new THREE.DirectionalLight(0xfff7ea, 0.84);
  sun.position.set(-162, 112, 150);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -180;
  sun.shadow.camera.right = 180;
  sun.shadow.camera.top = 160;
  sun.shadow.camera.bottom = -160;
  sun.shadow.camera.near = 20;
  sun.shadow.camera.far = 520;
  sun.shadow.bias = -0.0012;
  sun.shadow.normalBias = 0.5;
  scene.add(sun);
  var fill = new THREE.DirectionalLight(0xdfe8ff, 0.12);
  fill.position.set(110, 70, -110);
  scene.add(fill);
  var rim = new THREE.DirectionalLight(0x6d7cff, 0.12);
  rim.position.set(110, 55, -120);
  scene.add(rim);


  /* ---------------- materials ---------------- */
  var MAT = {
    line: new THREE.LineBasicMaterial({ color: 0x8e8c80, transparent: true, opacity: 0.72 }),
    road: new THREE.MeshStandardMaterial({ color: 0xe2ded1, roughness: 0.98 }),
    grass: new THREE.MeshStandardMaterial({ color: 0x8ea476, roughness: 1 }),
    water: new THREE.MeshStandardMaterial({ color: 0x8fb3c4, roughness: 0.45, metalness: 0.1 }),
    yard: new THREE.MeshStandardMaterial({ color: 0xa7a28f, roughness: 1 }),
    plate: new THREE.MeshStandardMaterial({ color: 0x95917f, roughness: 0.95 }),
    roof: new THREE.MeshStandardMaterial({ color: 0xf7f6f1, roughness: 0.8 }),
    crown: new THREE.MeshStandardMaterial({ color: 0x9cb47f, roughness: 1 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x9a927e, roughness: 1 }),
    car: new THREE.MeshStandardMaterial({ color: 0xf8f8f6, roughness: 0.6, metalness: 0.05 }),
    rib: new THREE.MeshStandardMaterial({ color: 0xd8d6cd, roughness: 0.9 }),
    roofBlue: new THREE.MeshStandardMaterial({ color: 0xc3d3e4, roughness: 0.82 }),
    trim: new THREE.MeshStandardMaterial({ color: 0xfbfaf4, roughness: 0.85 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xa3bccb, roughness: 0.3, metalness: 0.1 }),
    frame: new THREE.MeshStandardMaterial({ color: 0xb8b4a6, roughness: 0.6 }),
    mark: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }),
    roadMark: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }),
    glassDark: new THREE.MeshStandardMaterial({ color: 0x5b6e78, roughness: 0.32, metalness: 0.25 }),
    apron: new THREE.MeshStandardMaterial({ color: 0xaba697, roughness: 0.92 }),
    metal: new THREE.MeshStandardMaterial({ color: 0xb5bfc8, roughness: 0.42, metalness: 0.35 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x4c5a66, roughness: 0.6 })
  };

  var glassBandTex = (function () {
    var c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    var x = c.getContext("2d");
    var g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, "#d3eafa");
    g.addColorStop(0.34, "#8fc3e6");
    g.addColorStop(0.78, "#5a9fcd");
    g.addColorStop(1, "#8dc0e1");
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 128);
    x.fillStyle = "rgba(255,255,255,.34)";
    x.fillRect(0, 8, 256, 10);
    x.fillStyle = "#f2f8fc";
    for (var i = 0; i < 4; i++) x.fillRect(i * 64, 0, 4, 128);
    x.fillRect(0, 0, 256, 6);
    x.fillRect(0, 122, 256, 6);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    if ("encoding" in t) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  })();
  MAT.glassBand = new THREE.MeshStandardMaterial({
    map: glassBandTex, color: 0xffffff, roughness: 0.12, metalness: 0.16
  });
  MAT.seam = new THREE.LineBasicMaterial({ color: 0xbcc7d1, transparent: true, opacity: 0.5 });

  /* ---------------- ground plate ---------------- */
  var SITE = [[-104, -50], [-96, -58], [-16, -62], [52, -58], [92, -48], [106, -26], [112, 4], [106, 36], [92, 56], [56, 66], [0, 66], [-48, 64], [-82, 54], [-100, 34], [-108, 0]];
  var PLATE = 3;

  function shapeFrom(pts) {
    var s = new THREE.Shape();
    pts.forEach(function (p, i) { i ? s.lineTo(p[0], -p[1]) : s.moveTo(p[0], -p[1]); });
    s.closePath();
    return s;
  }
  function pathFrom(pts) {
    var p = new THREE.Path();
    pts.forEach(function (q, i) { i ? p.lineTo(q[0], -q[1]) : p.moveTo(q[0], -q[1]); });
    p.closePath();
    return p;
  }
  function shrink(pts, d) {
    var cx = 0, cz = 0;
    pts.forEach(function (p) { cx += p[0]; cz += p[1]; });
    cx /= pts.length; cz /= pts.length;
    return pts.map(function (p) {
      var dx = p[0] - cx, dz = p[1] - cz, len = Math.hypot(dx, dz) || 1;
      return [p[0] - dx / len * d, p[1] - dz / len * d];
    });
  }
  function flat(geo, mat, y) {
    var m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }
  function glowTex(r, g, b) {
    var c = document.createElement("canvas");
    c.width = c.height = 256;
    var x = c.getContext("2d");
    var gr = x.createRadialGradient(128, 128, 0, 128, 128, 126);
    gr.addColorStop(0, "rgba(" + r + "," + g + "," + b + ",0.55)");
    gr.addColorStop(0.42, "rgba(" + r + "," + g + "," + b + ",0.16)");
    gr.addColorStop(1, "rgba(" + r + "," + g + "," + b + ",0)");
    x.fillStyle = gr;
    x.fillRect(0, 0, 256, 256);
    var t = new THREE.CanvasTexture(c);
    return t;
  }

  // shadow catcher under everything
  var catcher = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.ShadowMaterial({ opacity: 0.22 }));
  catcher.rotation.x = -Math.PI / 2;
  catcher.position.y = 0;
  catcher.receiveShadow = true;
  scene.add(catcher);

  var plate = new THREE.Mesh(new THREE.ExtrudeGeometry(shapeFrom(SITE), { depth: PLATE, bevelEnabled: false }), MAT.plate);
  plate.rotation.x = -Math.PI / 2;
  plate.castShadow = true;
  plate.receiveShadow = true;
  scene.add(plate);

  var groundGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(560, 430),
    new THREE.MeshBasicMaterial({ map: glowTex(236, 244, 251), transparent: true, opacity: 0.03, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  groundGlow.rotation.x = -Math.PI / 2;
  groundGlow.position.y = 0.25;
  groundGlow.material.fog = false;
  scene.add(groundGlow);

  /* ---------------- atmosphere: haze, sun glow, light shafts ---------------- */
  scene.fog = new THREE.Fog(0xf5f8fb, 900, 1800);

  var sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex(255, 255, 255), color: 0xffffff, transparent: true, opacity: 0.06,
    depthWrite: false, blending: THREE.AdditiveBlending, fog: false
  }));
  sunGlow.scale.set(470, 470, 1);
  sunGlow.position.set(-250, 300, -130);
  sunGlow.renderOrder = -3;
  scene.add(sunGlow);

  var plateAO = new THREE.Mesh(
    new THREE.PlaneGeometry(480, 340),
    new THREE.MeshBasicMaterial({ map: glowTex(24, 30, 24), transparent: true, opacity: 0.16, depthWrite: false, fog: false })
  );
  plateAO.rotation.x = -Math.PI / 2;
  plateAO.position.y = 0.14;
  scene.add(plateAO);

  function shaftTex() {
    var c = document.createElement("canvas");
    c.width = 128; c.height = 512;
    var x = c.getContext("2d");
    var g = x.createLinearGradient(0, 0, 128, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,.6)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, 128, 512);
    var v = x.createLinearGradient(0, 0, 0, 512);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(0.34, "rgba(0,0,0,1)");
    v.addColorStop(0.78, "rgba(0,0,0,.55)");
    v.addColorStop(1, "rgba(0,0,0,0)");
    x.globalCompositeOperation = "destination-in";
    x.fillStyle = v; x.fillRect(0, 0, 128, 512);
    return new THREE.CanvasTexture(c);
  }
  var shaftMap = shaftTex();
  var shafts = [];
  [[-168, 150, -128, 0.36, 300, 540, 0.9],
   [-58, 178, -168, 0.28, 230, 460, 1.0],
   [52, 196, -196, 0.2, 170, 380, 0.7]].forEach(function (s) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(s[4], s[5]), new THREE.MeshBasicMaterial({
      map: shaftMap, color: 0xffffff, transparent: true, opacity: 0.08,
      depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false
    }));
    m.position.set(s[0], s[1], s[2]);
    m.rotation.z = s[3];
    m.renderOrder = -2;
    m.userData = { base: 0.08, scale: s[6], phase: Math.random() * 6.28 };
    scene.add(m);
    shafts.push(m);
  });

  // perimeter curb
  (function () {
    var pts = shrink(SITE, 0.6).map(function (p) { return new THREE.Vector3(p[0], PLATE + 0.05, p[1]); });
    pts.push(pts[0].clone());
    var lg = new THREE.BufferGeometry().setFromPoints(pts);
    scene.add(new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xaebbc6, transparent: true, opacity: 0.8 })));
  })();

  // ring road inside the site boundary
  var ringShape = shapeFrom(shrink(SITE, 5));
  ringShape.holes.push(pathFrom(shrink(SITE, 13)));
  flat(new THREE.ShapeGeometry(ringShape), MAT.road, PLATE + 0.02);

  // internal roads (main grid traced from the aerial)
  var ROADS = [];
  function road(x, z, w, d, rot) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.24, d), MAT.road);
    m.position.set(x, PLATE - 0.1, z);
    if (rot) m.rotation.y = rot;
    m.receiveShadow = true;
    scene.add(m);
    ROADS.push({ x: x, z: z, w: w, d: d });
  }
  road(-34, 0, 9, 118);     // west arterial
  road(28, 0, 9, 118);      // centre-east arterial
  road(88, 4, 6, 108);      // east boundary road
  road(-8, -32, 208, 6);    // north access road
  road(-12, -14, 192, 8);   // central road
  road(-6, 14, 196, 8);     // south central road
  road(0, 54, 192, 7);      // south boundary road
  road(66, 28, 46, 4);      // garden north road
  road(47, 41, 4, 26);      // garden west link
  road(-70, 36, 48, 8);     // southwest truck lane

  // surface patches
  function patch(x, z, w, d, mat) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, PLATE + 0.015, z);
    m.receiveShadow = true;
    scene.add(m);
  }
  patch(-72, -40, 56, 24, MAT.grass);    // northwest cluster lawn
  patch(-84, -10, 46, 34, MAT.grass);    // west machining lawn
  patch(8, -8, 52, 26, MAT.grass);       // centre lawn
  patch(62, -36, 50, 26, MAT.grass);     // northeast lawn
  patch(66, 44, 52, 34, MAT.grass);      // southeast garden surround
  patch(-46, 44, 48, 20, MAT.grass);     // southwest verge
  patch(30, -48, 28, 16, MAT.grass);     // north verge
  patch(-98, 8, 18, 26, MAT.grass);      // west edge lawn
  patch(-6, -43, 62, 22, MAT.yard);      // north dirt field
  patch(40, -50, 34, 12, MAT.yard);      // northeast verge
  patch(-60, -14, 16, 12, MAT.yard);     // west service lot
  patch(41, -4, 22, 18, MAT.yard);       // centre-east dirt lot
  patch(82, -42, 22, 20, MAT.grass);     // northeast clearing
  patch(80, -12, 16, 16, MAT.grass);     // northeast woods base
  patch(-71, 38, 52, 14, MAT.apron);     // southwest truck apron
  patch(-4, 22, 46, 14, MAT.apron);      // central apron
  patch(89, 21, 14, 12, MAT.apron);      // southeast parking
  patch(66, 41, 36, 26, MAT.grass);      // garden base
  patch(-88, -33, 42, 8, MAT.road);      // west apron

  // formal garden: cross axes, circular plaza, four swirl beds
  var GX = 66, GZ = 41;
  (function () {
    var axis = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 25), MAT.road);
    axis.rotation.x = -Math.PI / 2;
    axis.position.set(GX, PLATE + 0.06, GZ);
    scene.add(axis);
    var cross = new THREE.Mesh(new THREE.PlaneGeometry(34, 2.6), MAT.road);
    cross.rotation.x = -Math.PI / 2;
    cross.position.set(GX, PLATE + 0.065, GZ);
    scene.add(cross);
    var plaza = new THREE.Mesh(new THREE.CircleGeometry(5.4, 40), MAT.road);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(GX, PLATE + 0.07, GZ);
    scene.add(plaza);
    var pondG = new THREE.Mesh(new THREE.CircleGeometry(2.0, 32), MAT.water);
    pondG.rotation.x = -Math.PI / 2;
    pondG.position.set(GX, PLATE + 0.085, GZ);
    scene.add(pondG);
    [[-8.6, -6.2, 0.6, 2.5], [-8.6, 6.2, -0.5, 2.3], [8.6, -6.2, 2.3, 2.3], [8.6, 6.2, 3.1, 2.5]].forEach(function (q) {
      var a = new THREE.Mesh(new THREE.RingGeometry(q[3], q[3] + 2.2, 34, 1, q[2], Math.PI * 1.6), MAT.road);
      a.rotation.x = -Math.PI / 2;
      a.position.set(GX + q[0], PLATE + 0.075, GZ + q[1]);
      scene.add(a);
    });
    var rim = new THREE.Mesh(new THREE.RingGeometry(17.4, 18.6, 4, 1), MAT.yard);
    rim.rotation.x = -Math.PI / 2;
    rim.rotation.z = Math.PI / 4;
    rim.position.set(GX, PLATE + 0.05, GZ);
    scene.add(rim);
  })();

  // transmission pylons along the north boundary
  (function () {
    var pm = new THREE.MeshStandardMaterial({ color: 0xd2d2ca, roughness: 0.85 });
    function pylon(px, pz) {
      var g = new THREE.Group();
      var h = 20;
      [[-1.8, -1.6], [1.8, -1.6], [0, 1.7]].forEach(function (o) {
        var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.36, h, 4), pm);
        leg.position.set(o[0], h / 2, o[1]);
        leg.rotation.z = -o[0] * 0.018;
        leg.rotation.x = o[1] * 0.02;
        leg.castShadow = true;
        g.add(leg);
      });
      for (var i = 1; i <= 3; i++) {
        var arm = new THREE.Mesh(new THREE.BoxGeometry(7.6 - i * 1.1, 0.18, 0.18), pm);
        arm.position.y = h * 0.5 + i * 3.5;
        arm.castShadow = true;
        g.add(arm);
      }
      g.position.set(px, PLATE, pz);
      scene.add(g);
    }
    [-80, -30, 20, 70].forEach(function (px) { pylon(px, -58); });
  })();

  /* ---------------- façade / roof detail ---------------- */
  function bandPlane(wm, hm, reps) {
    var geo = new THREE.PlaneGeometry(wm, hm);
    var uv = geo.attributes.uv;
    for (var i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * reps);
    uv.needsUpdate = true;
    return new THREE.Mesh(geo, MAT.glassBand);
  }

  function seamLines(w, d, h, y0, y1, step) {
    var pos = [], xx, zz;
    for (xx = -w / 2 + step; xx < w / 2 - 0.2; xx += step) {
      pos.push(xx, y0, d / 2 + 0.03, xx, y1, d / 2 + 0.03);
      pos.push(xx, y0, -d / 2 - 0.03, xx, y1, -d / 2 - 0.03);
    }
    for (zz = -d / 2 + step; zz < d / 2 - 0.2; zz += step) {
      pos.push(w / 2 + 0.03, y0, zz, w / 2 + 0.03, y1, zz);
      pos.push(-w / 2 - 0.03, y0, zz, -w / 2 - 0.03, y1, zz);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return new THREE.LineSegments(geo, MAT.seam);
  }

  function facadeDetails(g, cfg, idx) {
    var w = cfg.w, d = cfg.d, h = cfg.h;
    var long = w >= d;
    var L = long ? w : d;
    var r0 = Math.sin(idx * 12.9898 + 4.1) * 43758.5453;
    r0 -= Math.floor(r0);

    if (L >= 9 && h >= 4.4) {
      var gh = Math.min(2.5, Math.max(1.4, h * 0.34));
      var gy = Math.max(1.55, h * 0.54);
      if (gy + gh / 2 > h - 0.55) gy = h - 0.55 - gh / 2;
      var len = L * 0.9;
      var reps = Math.max(1, Math.round(len / 10.4));
      if (long) {
        var bf = bandPlane(len, gh, reps);
        bf.position.set(0, gy, d / 2 + 0.07);
        g.add(bf);
        var bb = bandPlane(len, gh, reps);
        bb.position.set(0, gy, -d / 2 - 0.07);
        bb.rotation.y = Math.PI;
        g.add(bb);
      } else {
        var br = bandPlane(len, gh, reps);
        br.position.set(w / 2 + 0.07, gy, 0);
        br.rotation.y = Math.PI / 2;
        g.add(br);
        var bl = bandPlane(len, gh, reps);
        bl.position.set(-w / 2 - 0.07, gy, 0);
        bl.rotation.y = -Math.PI / 2;
        g.add(bl);
      }
    } else if (w >= 4.5 && h >= 3.4) {
      var n = Math.max(2, Math.min(4, Math.round(w / 3.4)));
      for (var wi = 0; wi < n; wi++) {
        var pw = bandPlane(1.6, 1.35, 0.62);
        pw.position.set(-w / 2 + (wi + 0.5) * (w / n), Math.min(h - 1.15, 2.5), d / 2 + 0.06);
        g.add(pw);
      }
    }

    if (h >= 4.6) g.add(seamLines(w, d, h, 0.5, h - 0.45, 4.2));

    if (cfg.lines > 0 || /^(C|R|O|B|E)/.test(cfg.id)) {
      var door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.6, 0.16), MAT.dark);
      door.position.set(w * 0.18, 1.3, d / 2 + 0.09);
      g.add(door);
      var can = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.22, 2.0), MAT.trim);
      can.position.set(w * 0.18, 3.4, d / 2 + 0.9);
      can.castShadow = true;
      g.add(can);
      var post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.3, 8), MAT.metal);
      post1.position.set(w * 0.18 - 2.3, 1.65, d / 2 + 1.78);
      g.add(post1);
      var post2 = post1.clone();
      post2.position.x = w * 0.18 + 2.3;
      g.add(post2);
    }

    if (cfg.roof === "flat") {
      var ph = 0.5, pt = 0.32, py = h + ph / 2;
      [[0, d / 2 + 0.03, w + 0.7, pt], [0, -d / 2 - 0.03, w + 0.7, pt]].forEach(function (q) {
        var p = new THREE.Mesh(new THREE.BoxGeometry(q[2], ph, q[3]), MAT.trim);
        p.position.set(q[0], py, q[1]);
        p.castShadow = true;
        g.add(p);
      });
      [[w / 2 + 0.03, 0, pt, d + 0.7], [-w / 2 - 0.03, 0, pt, d + 0.7]].forEach(function (q) {
        var p = new THREE.Mesh(new THREE.BoxGeometry(q[2], ph, q[3]), MAT.trim);
        p.position.set(q[0], py, q[1]);
        p.castShadow = true;
        g.add(p);
      });
      if (w >= 9) {
        var sky = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w * 0.46, 11), Math.min(d * 0.2, 2.6)), MAT.glassBand);
        sky.rotation.x = -Math.PI / 2;
        sky.position.set(-w * 0.14, h + 0.54, d * 0.12);
        g.add(sky);
      }
      var ac = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.85, 1.7), MAT.metal);
      ac.position.set(w * 0.28, h + 0.66, -d * 0.16);
      ac.castShadow = true;
      g.add(ac);
      if (w >= 12) {
        var ac2 = ac.clone();
        ac2.position.set(w * 0.28 - 3.1, h + 0.6, -d * 0.16 + 2.6);
        g.add(ac2);
      }
      var vent = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 1.0, 10), MAT.metal);
      vent.position.set(w * 0.1, h + 0.72, -d * 0.3);
      g.add(vent);
    } else if (cfg.roof === "ribs") {
      var ra = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.8, 2.2), MAT.metal);
      ra.position.set(w * 0.24, h + 0.72, d * 0.14);
      ra.castShadow = true;
      g.add(ra);
      var rv = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 10), MAT.metal);
      rv.position.set(-w * 0.28, h + 0.8, -d * 0.1);
      g.add(rv);
    } else if (cfg.roof === "gable" && Math.max(w, d) > 10) {
      var span = Math.min(w, d);
      var rh = Math.min(span * 0.26, h * 0.5);
      var ch = new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.5, 0.86), MAT.metal);
      if (w > d) ch.position.set(w * 0.24, h + rh + 0.45, 0);
      else ch.position.set(0, h + rh + 0.45, d * 0.24);
      ch.castShadow = true;
      g.add(ch);
    }

    if (cfg.saw) {
      var mv = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 1.2), MAT.metal);
      mv.position.set(w * 0.3, h + 3.1, d * 0.34);
      mv.castShadow = true;
      g.add(mv);
      var mv2 = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 2.4, 10), MAT.metal);
      mv2.position.set(-w * 0.36, h + 3.7, -d * 0.3);
      g.add(mv2);
    }
  }

  /* ---------------- buildings ---------------- */
  var buildings = [];
  var pickables = [];

  function gableGeo(span, depth, h) {
    var s = new THREE.Shape();
    s.moveTo(-span / 2, 0); s.lineTo(span / 2, 0); s.lineTo(0, h); s.closePath();
    var g = new THREE.ExtrudeGeometry(s, { depth: depth, bevelEnabled: false });
    g.translate(0, 0, -depth / 2);
    return g;
  }

  /* soft contact shadow blobs */
  function blobTex() {
    var c = document.createElement("canvas");
    c.width = c.height = 128;
    var x = c.getContext("2d");
    var g = x.createRadialGradient(64, 64, 3, 64, 64, 62);
    g.addColorStop(0, "rgba(0,0,0,0.72)");
    g.addColorStop(0.5, "rgba(0,0,0,0.30)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    var t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  }
  var BLOB = blobTex();
  var BLOB_MAT = new THREE.MeshBasicMaterial({ map: BLOB, transparent: true, depthWrite: false, opacity: 0.72 });
  function contactShadow(w, d, x, z, rot) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.5, d * 1.5), BLOB_MAT);
    m.rotation.x = -Math.PI / 2;
    if (rot) m.rotation.z = rot;
    m.position.set(x + w * 0.14, PLATE + 0.07, z - d * 0.14);
    scene.add(m);
    return m;
  }

  function addBuilding(cfg) {
    contactShadow(cfg.w, cfg.d, cfg.x, cfg.z, cfg.rot || 0);
    var g = new THREE.Group();
    var tone = cfg.tone || 0xf1f0eb;
    var mat = new THREE.MeshStandardMaterial({ color: tone, roughness: 0.92, metalness: 0 });
    var body = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d), mat);
    body.position.y = cfg.h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    body.userData.b = cfg;
    g.add(body);

    var edges = new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry), MAT.line);
    edges.position.copy(body.position);
    g.add(edges);

    if (cfg.trim) {
      var fascia = new THREE.Mesh(new THREE.BoxGeometry(cfg.w + 0.5, 0.9, cfg.d + 0.5), MAT.trim);
      fascia.position.y = cfg.h - 0.3;
      fascia.castShadow = true;
      g.add(fascia);
    }

    if (cfg.roof === "gable") {
      var span = Math.min(cfg.w, cfg.d);
      var rh = Math.min(span * 0.26, cfg.h * 0.5);
      var long = Math.max(cfg.w, cfg.d);
      var rg = gableGeo(span, long, rh);
      var rm = new THREE.Mesh(rg, cfg.blue ? MAT.roofBlue : MAT.roof);
      if (cfg.w > cfg.d) rm.rotation.y = Math.PI / 2;
      rm.position.y = cfg.h;
      rm.castShadow = true;
      rm.receiveShadow = true;
      g.add(rm);
      var re = new THREE.LineSegments(new THREE.EdgesGeometry(rg), MAT.line);
      re.rotation.copy(rm.rotation);
      re.position.y = cfg.h;
      g.add(re);
    } else if (cfg.roof === "saw") {
      var n = cfg.saw || 6;
      var rh2 = Math.min(2.6, cfg.h * 0.24);
      var unit = (cfg.w * 0.97) / n;
      for (var si = 0; si < n; si++) {
        var sh = new THREE.Shape();
        sh.moveTo(-unit / 2, 0); sh.lineTo(unit / 2, 0); sh.lineTo(unit / 2, rh2); sh.closePath();
        var sg = new THREE.ExtrudeGeometry(sh, { depth: cfg.d * 0.95, bevelEnabled: false });
        sg.translate(0, 0, -cfg.d * 0.475);
        var sm = new THREE.Mesh(sg, MAT.rib);
        sm.position.set(-cfg.w * 0.485 + unit * (si + 0.5), cfg.h, 0);
        sm.castShadow = true;
        sm.receiveShadow = true;
        g.add(sm);
      }
      var slab = new THREE.Mesh(new THREE.BoxGeometry(cfg.w * 0.99, 1.1, cfg.d * 0.97), MAT.roof);
      slab.position.y = cfg.h - 0.55;
      slab.castShadow = true;
      g.add(slab);
    } else if (cfg.ribs) {
      var nr = Math.max(3, Math.round(cfg.w / 3.6));
      for (var i = 0; i < nr; i++) {
        var rib = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.16, cfg.d * 0.94), MAT.rib);
        rib.position.set(-cfg.w / 2 + 1.8 + i * ((cfg.w - 3.6) / (nr - 1)), cfg.h + 0.2, 0);
        rib.castShadow = true;
        g.add(rib);
      }
    } else {
      var cap = new THREE.Mesh(new THREE.BoxGeometry(cfg.w * 0.86, 0.5, cfg.d * 0.86), MAT.roof);
      cap.position.y = cfg.h + 0.25;
      cap.castShadow = true;
      g.add(cap);
    }

    if (cfg.docks) {
      for (var k = 0; k < cfg.docks; k++) {
        var dock = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.6, 1.4), MAT.roof);
        dock.position.set(-cfg.w / 2 + 4 + k * 4.4, 0.8, cfg.d / 2 + 0.7);
        dock.castShadow = true;
        g.add(dock);
      }
    }

    facadeDetails(g, cfg, buildings.length);

    if (cfg.rot) g.rotation.y = cfg.rot;
    g.position.set(cfg.x, PLATE, cfg.z);
    scene.add(g);

    cfg._body = body;
    cfg._mat = mat;
    cfg._tone = tone;
    cfg._top = new THREE.Vector3(cfg.x, PLATE + cfg.h + 2, cfg.z);
    buildings.push(cfg);
    pickables.push(body);
  }

  /* 三维几何：坐标 / 尺寸 / 屋顶造型集中写死在这里。
     业务数据（名称、类型、面积、负载、稼动率、工单、批次…）在 src/data/campus/buildings.mock.ts，
     两边按 id 关联：改数据不用动坐标，挪楼也不用碰业务数据。
     x / z  中心平面坐标（米），X 向东、Z 向南
     w / d  宽 / 深（米）；h 檐高（米）
     rot    绕 Y 轴旋转角（弧度，可选）
     roof   ribs 肋形 | gable 人字坡 | flat 平顶 | saw 锯齿采光带
     saw / docks / blue / trim  可选造型参数 */
  var BUILDING_GEOMETRY = [
    // ---- 西北：面料 / 裁剪簇 ----
    { id: "W-11", x: -96, z: -42, w: 7, d: 26, h: 7.4, roof: "ribs" },
    { id: "W-12", x: -85, z: -40, w: 9, d: 30, h: 7.8, roof: "ribs" },
    { id: "W-13", x: -73, z: -44, w: 7, d: 24, h: 7.2, roof: "ribs" },
    { id: "W-14", x: -42, z: -46, w: 5.5, d: 20, h: 6.2, roof: "ribs" },
    { id: "S-01", x: -57, z: -50, w: 24, d: 5.5, h: 5.0, roof: "gable", blue: true },
    { id: "S-02", x: -57, z: -42.5, w: 22, d: 5.5, h: 5.0, roof: "gable", blue: true },
    { id: "W-15", x: -54, z: -33, w: 26, d: 7, h: 6.4, roof: "ribs" },

    // ---- 西侧缝制带 ----
    { id: "W-21", x: -85, z: -27.5, w: 32, d: 7, h: 7.0, roof: "flat" },
    { id: "W-22", x: -85, z: -20.5, w: 30, d: 7, h: 6.8, roof: "flat" },
    { id: "W-23", x: -85, z: -7.5, w: 34, d: 8, h: 7.4, roof: "flat", blue: true },
    { id: "W-25", x: -60, z: -8, w: 11, d: 11, h: 8.0, roof: "gable" },
    { id: "W-26", x: -53, z: 5, w: 12, d: 9, h: 7.0, roof: "ribs" },
    { id: "W-27", x: -76, z: 26, w: 40, d: 12, h: 8.4, roof: "ribs", rot: -0.05 },

    // ---- 中央：缝制 / 后整 ----
    { id: "C-01", x: -20, z: -4, w: 14, d: 10, h: 8.2, roof: "gable", blue: true, trim: true },
    { id: "C-07", x: -36, z: -6, w: 12, d: 7, h: 6.0, roof: "flat" },
    { id: "C-08", x: -28, z: 3, w: 10, d: 6, h: 5.2, roof: "flat" },
    { id: "C-02", x: -48, z: -24, w: 12, d: 7, h: 6.0, roof: "ribs" },
    { id: "C-03", x: 2, z: -18, w: 10, d: 6, h: 5.0, roof: "flat" },
    { id: "C-04", x: -4, z: -4, w: 14, d: 9, h: 6.6, roof: "ribs" },
    { id: "C-05", x: 14, z: -24, w: 9, d: 12, h: 6.4, roof: "gable" },
    { id: "C-06", x: 18, z: -6, w: 12, d: 8, h: 5.8, roof: "flat" },
    { id: "C-09", x: 10, z: 5, w: 20, d: 9, h: 7.0, roof: "ribs" },

    // ---- 东北：智能裁剪 / 仓储 ----
    { id: "E-01", x: 46, z: -40, w: 16, d: 15, h: 7.4, roof: "gable", blue: true, trim: true },
    { id: "E-02", x: 64, z: -38, w: 16, d: 15, h: 7.6, roof: "gable", blue: true, trim: true },
    { id: "E-03", x: 37, z: -25, w: 9, d: 7, h: 5.4, roof: "gable", blue: true },
    { id: "E-04", x: 82, z: -44, w: 10, d: 14, h: 7.0, roof: "gable" },
    { id: "E-05", x: 78, z: -27, w: 12, d: 6, h: 4.8, roof: "flat" },
    { id: "E-06", x: 20, z: -34, w: 8, d: 5, h: 4.2, roof: "flat" },

    // ---- 南侧：成衣联合厂房 ----
    { id: "A-03", x: -12, z: 34, w: 66, d: 26, h: 12.4, roof: "saw", saw: 9, docks: 8 },

    // ---- 东南：物流 / 研发 / 办公 ----
    { id: "R-01", x: 52, z: 19.5, w: 26, d: 4.5, h: 4.8, roof: "flat" },
    { id: "R-02", x: 64, z: 24, w: 16, d: 4, h: 4.4, roof: "flat" },
    { id: "R-03", x: 44, z: 22, w: 10, d: 4, h: 4.2, roof: "flat" },
    { id: "B-01", x: 78, z: 22, w: 14, d: 8, h: 7.4, roof: "gable", blue: true, trim: true },
    { id: "O-01", x: 90, z: 22, w: 8, d: 16, h: 5.8, roof: "flat", rot: -0.1 },
    { id: "O-02", x: 95, z: 40, w: 8, d: 10, h: 5.6, roof: "flat", rot: -0.1 },
    { id: "R-06", x: 74, z: 4, w: 24, d: 8, h: 6.4, roof: "ribs" },
    { id: "R-07", x: 40, z: 40, w: 12, d: 10, h: 6.0, roof: "flat" },
    { id: "W-18", x: -36, z: -44, w: 10, d: 18, h: 6.6, roof: "ribs" },
    { id: "R-04", x: 100, z: -10, w: 7, d: 34, h: 6.4, roof: "flat", rot: -0.16 },
    { id: "R-05", x: 97, z: 10, w: 8, d: 14, h: 5.8, roof: "flat", rot: -0.16 }
  ];

  /* 几何 + 业务数据按 id 合并成建模 / 交互用的完整楼栋对象 */
  var LAYOUT = BUILDING_GEOMETRY.map(function (geo) {
    return Object.assign({}, geo, getBuilding(geo.id));
  });
  LAYOUT.forEach(addBuilding);

  /* ---------------- trees ---------------- */
  function inBuilding(x, z, pad) {
    pad = pad || 2.5;
    for (var i = 0; i < LAYOUT.length; i++) {
      var b = LAYOUT[i];
      var hw = b.w / 2, hd = b.d / 2;
      if (b.rot) {
        var c = Math.cos(b.rot), s = Math.sin(b.rot);
        var dx = x - b.x, dz = z - b.z;
        if (Math.abs(dx * c - dz * s) < hw + pad && Math.abs(dx * s + dz * c) < hd + pad) return true;
      } else if (Math.abs(x - b.x) < hw + pad && Math.abs(z - b.z) < hd + pad) return true;
    }
    return false;
  }
  function inRoad(x, z, pad) {
    pad = pad || 1.5;
    for (var i = 0; i < ROADS.length; i++) {
      var r = ROADS[i];
      if (Math.abs(x - r.x) < r.w / 2 + pad && Math.abs(z - r.z) < r.d / 2 + pad) return true;
    }
    return false;
  }
  function inSite(x, z) {
    var c = false;
    for (var i = 0, j = SITE.length - 1; i < SITE.length; j = i++) {
      var xi = SITE[i][0], zi = SITE[i][1], xj = SITE[j][0], zj = SITE[j][1];
      if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c;
    }
    return c;
  }

  var spots = [];
  // perimeter avenue (offset inward from the fence)
  (function () {
    var cx = 0, cz = 0;
    SITE.forEach(function (p) { cx += p[0]; cz += p[1]; });
    cx /= SITE.length; cz /= SITE.length;
    for (var e = 0; e < SITE.length; e++) {
      var a = SITE[e], b = SITE[(e + 1) % SITE.length];
      var len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      var n = Math.max(2, Math.round(len / 9));
      for (var i = 1; i < n; i++) {
        var t = i / n;
        var px = a[0] + (b[0] - a[0]) * t, pz = a[1] + (b[1] - a[1]) * t;
        var dx = cx - px, dz = cz - pz, dl = Math.hypot(dx, dz) || 1;
        spots.push([px + dx / dl * 6.5, pz + dz / dl * 6.5]);
      }
    }
  })();

  // road avenues
  for (var z1 = -54; z1 <= 52; z1 += 10) {
    spots.push([-40.8, z1]); spots.push([-27.2, z1]);
    spots.push([21.2, z1]); spots.push([34.8, z1]);
  }
  for (var x1 = -96; x1 <= 90; x1 += 10) {
    spots.push([x1, -36.6]); spots.push([x1, -27.4]);
    spots.push([x1, -19.6]); spots.push([x1, -8.4]);
    spots.push([x1, 8.4]); spots.push([x1, 19.6]);
  }

  // woods clusters (phyllotaxis discs)
  function clump(cx, cz, rx, rz, n) {
    for (var i = 0; i < n; i++) {
      var a = i * 2.399963, rr = Math.sqrt((i + 0.6) / n);
      spots.push([cx + Math.cos(a) * rr * rx, cz + Math.sin(a) * rr * rz]);
    }
  }
  clump(86, -18, 10, 9, 44);
  clump(76, -10, 7, 7, 22);
  clump(34, 2, 9, 10, 34);
  clump(20, -32, 8, 6, 20);
  clump(44, 60, 16, 6, 34);
  clump(-90, 46, 9, 7, 24);
  clump(-2, 59, 13, 6, 28);
  clump(-32, 57, 10, 6, 20);
  clump(-95, 26, 8, 12, 26);
  clump(-97, 6, 6, 10, 16);
  clump(60, 60, 10, 5, 20);
  clump(92, 44, 7, 8, 18);

  // garden perimeter
  for (var gz = 30; gz <= 52; gz += 5.5) {
    spots.push([49.5, gz]); spots.push([82.5, gz]);
  }
  for (var gx = 50; gx <= 82; gx += 5.5) {
    spots.push([gx, 29.8]); spots.push([gx, 52.2]);
  }

  spots = spots.filter(function (p) {
    var x = p[0], z = p[1];
    if (!inSite(x, z) || inBuilding(x, z, 3.0) || inRoad(x, z, 2.0)) return false;
    if (Math.abs(x - 66) < 15 && Math.abs(z - 41) < 9.5) return false;      // garden interior
    if (Math.abs(x + 71) < 25 && Math.abs(z - 38) < 8.5) return false;      // truck apron
    if (Math.abs(x - 89) < 9 && Math.abs(z - 21) < 8) return false;         // SE parking
    if (Math.abs(x - 41) < 13 && Math.abs(z + 4) < 11) return false;        // dirt lot
    return true;
  });

  var crownGeo = new THREE.SphereGeometry(1, 14, 10);
  var crown = new THREE.InstancedMesh(crownGeo, MAT.crown, spots.length);
  var trunkGeo = new THREE.CylinderGeometry(0.16, 0.22, 1, 5);
  var trunk = new THREE.InstancedMesh(trunkGeo, MAT.trunk, spots.length);
  crown.castShadow = trunk.castShadow = true;
  var dummy = new THREE.Object3D();
  spots.forEach(function (p, i) {
    var s = 1.55 + ((i * 37) % 11) / 12;
    dummy.position.set(p[0], PLATE + s * 0.9 + 1.3, p[1]);
    dummy.scale.set(s, s * 0.9, s);
    dummy.rotation.y = i * 1.7;
    dummy.updateMatrix();
    crown.setMatrixAt(i, dummy.matrix);
    dummy.position.set(p[0], PLATE + 0.9, p[1]);
    dummy.scale.set(1, 1.7, 1);
    dummy.updateMatrix();
    trunk.setMatrixAt(i, dummy.matrix);
  });
  scene.add(crown, trunk);

  /* ---------------- parking aprons / markings ---------------- */
  var westLot = new THREE.Mesh(new THREE.BoxGeometry(36, 0.24, 10.6), MAT.apron);
  westLot.position.set(-78, PLATE - 0.1, 35.9);
  westLot.receiveShadow = true;
  scene.add(westLot);

  var markGeo = new THREE.PlaneGeometry(1, 1);
  markGeo.rotateX(-Math.PI / 2);
  var STALLS = [];
  for (var sw = 0; sw < 12; sw++) STALLS.push([-95.6 + sw * 3.2, 35.9, 0.18, 9.3]);
  for (var sm = 0; sm < 11; sm++) STALLS.push([-27.8 + sm * 3.6, 20.6, 0.15, 4.4]);
  for (var se2 = 0; se2 < 7; se2++) STALLS.push([81.7 + se2 * 2.4, 21.1, 0.13, 9.4]);
  STALLS.push([-78, 31.05, 36, 0.16], [-78, 40.9, 36, 0.16]);
  STALLS.push([-9, 18.35, 39.6, 0.16], [-9, 22.85, 39.6, 0.16]);
  STALLS.push([89, 16.4, 14.4, 0.14], [89, 25.8, 14.4, 0.14]);
  var stallMesh = new THREE.InstancedMesh(markGeo, MAT.mark, STALLS.length);
  STALLS.forEach(function (q, i) {
    dummy.position.set(q[0], PLATE + 0.055, q[1]);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(q[2], 1, q[3]);
    dummy.updateMatrix();
    stallMesh.setMatrixAt(i, dummy.matrix);
  });
  scene.add(stallMesh);

  /* ---------------- road lane dashes ---------------- */
  var DASHES = [];
  function dashZ(x, z0, z1) {
    for (var z = z0; z <= z1; z += 6) {
      if (inSite(x, z) && !inBuilding(x, z, 1)) DASHES.push([x, z, 0.26, 2.6]);
    }
  }
  function dashX(z, x0, x1) {
    for (var x = x0; x <= x1; x += 6) {
      if (inSite(x, z) && !inBuilding(x, z, 1)) DASHES.push([x, z, 2.6, 0.26]);
    }
  }
  dashZ(-34, -52, 52);
  dashZ(28, -52, 52);
  dashZ(88, -46, 54);
  dashX(-32, -104, 88);
  dashX(-14, -100, 76);
  dashX(14, -100, 84);
  dashX(54, -94, 90);
  var dashMesh = new THREE.InstancedMesh(markGeo, MAT.roadMark, DASHES.length);
  DASHES.forEach(function (q, i) {
    dummy.position.set(q[0], PLATE + 0.05, q[1]);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(q[2], 1, q[3]);
    dummy.updateMatrix();
    dashMesh.setMatrixAt(i, dummy.matrix);
  });
  scene.add(dashMesh);

  /* ---------------- cars ---------------- */
  var CARPOS = [];
  for (var cc = 0; cc < 6; cc++) CARPOS.push([-92 + cc * 6.2, 33.4, Math.PI]);
  for (var cb = 0; cb < 4; cb++) CARPOS.push([-88 + cb * 7.4, 38.4, 0]);
  for (var cd = 0; cd < 5; cd++) CARPOS.push([-24 + cd * 7.6, 20.6, 0]);
  for (var ce = 0; ce < 4; ce++) CARPOS.push([83.4 + ce * 3.4, 20.6, Math.PI]);
  var bodyGeo = new THREE.BoxGeometry(1.86, 0.58, 4.3);
  var cabinGeo = new THREE.BoxGeometry(1.7, 0.5, 2.2);
  var wheelGeo = new THREE.CylinderGeometry(0.31, 0.31, 0.24, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  var carBodies = new THREE.InstancedMesh(bodyGeo, MAT.car, CARPOS.length);
  var carCabins = new THREE.InstancedMesh(cabinGeo, MAT.glassDark, CARPOS.length);
  var carWheels = new THREE.InstancedMesh(wheelGeo, MAT.dark, CARPOS.length * 4);
  carBodies.castShadow = carWheels.castShadow = true;
  var CAR_COL = new THREE.Color();
  CARPOS.forEach(function (q, i) {
    var rot = q[2] || 0, c = Math.cos(rot), sn = Math.sin(rot);
    dummy.rotation.set(0, rot, 0);
    dummy.scale.set(1, 1, 1);
    dummy.position.set(q[0], PLATE + 0.62, q[1]);
    dummy.updateMatrix();
    carBodies.setMatrixAt(i, dummy.matrix);
    CAR_COL.setHex(i % 5 === 2 ? 0x7fa8cd : (i % 7 === 3 ? 0xa9c6dc : 0xffffff));
    carBodies.setColorAt(i, CAR_COL);
    dummy.position.set(q[0] - sn * 0.28, PLATE + 1.16, q[1] - c * 0.28);
    dummy.updateMatrix();
    carCabins.setMatrixAt(i, dummy.matrix);
    for (var w = 0; w < 4; w++) {
      var lx = w % 2 ? 0.83 : -0.83, lz = w < 2 ? 1.34 : -1.34;
      dummy.position.set(q[0] + lx * c + lz * sn, PLATE + 0.31, q[1] - lx * sn + lz * c);
      dummy.updateMatrix();
      carWheels.setMatrixAt(i * 4 + w, dummy.matrix);
    }
  });
  if (carBodies.instanceColor) carBodies.instanceColor.needsUpdate = true;
  scene.add(carBodies, carCabins, carWheels);

  /* ---------------- lamp posts / bollards / signs ---------------- */
  var LAMPS = [];
  [-48, -30, -8, 18, 44].forEach(function (z) { LAMPS.push([-39.4, z, 0]); });
  [-48, -30, -8, 18, 44].forEach(function (z) { LAMPS.push([32.9, z, Math.PI]); });
  [-64, -2, 50].forEach(function (x) { LAMPS.push([x, -28.6, Math.PI / 2]); });
  [-70, -44, 34, 60].forEach(function (x) { LAMPS.push([x, 9.3, -Math.PI / 2]); });
  var poleMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.075, 0.1, 5.4, 8), MAT.metal, LAMPS.length);
  var baseMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.17, 0.21, 0.5, 8), MAT.frame, LAMPS.length);
  var armMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.25, 0.09, 0.13), MAT.metal, LAMPS.length);
  var headMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.52, 0.14, 0.3), MAT.trim, LAMPS.length);
  poleMesh.castShadow = true;
  LAMPS.forEach(function (q, i) {
    var c = Math.cos(q[2]), sn = Math.sin(q[2]);
    function put(mesh, ox, oy, oz) {
      dummy.position.set(q[0] + ox * c + oz * sn, PLATE + oy, q[1] - ox * sn + oz * c);
      dummy.rotation.set(0, q[2], 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    put(poleMesh, 0, 2.7, 0);
    put(baseMesh, 0, 0.26, 0);
    put(armMesh, 0.62, 5.32, 0);
    put(headMesh, 1.18, 5.2, 0);
  });
  scene.add(poleMesh, baseMesh, armMesh, headMesh);

  var BOL = [];
  for (var bx = 0; bx < 17; bx++) BOL.push([-42 + bx * 3.6, 48.1]);
  for (var bg = 0; bg < 5; bg++) BOL.push([16.5 + bg * 1.75, -30.4]);
  var bolMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.13, 0.72, 10), MAT.metal, BOL.length);
  BOL.forEach(function (q, i) {
    dummy.position.set(q[0], PLATE + 0.36, q[1]);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    bolMesh.setMatrixAt(i, dummy.matrix);
  });
  scene.add(bolMesh);

  function signboard(x, z, rot, w) {
    var g = new THREE.Group();
    var board = new THREE.Mesh(new THREE.BoxGeometry(w || 2.6, 1.5, 0.14), MAT.trim);
    board.position.y = PLATE + 2.05;
    board.castShadow = true;
    g.add(board);
    var strip = new THREE.Mesh(new THREE.PlaneGeometry((w || 2.6) - 0.36, 0.6), MAT.frame);
    strip.position.set(0, PLATE + 2.28, 0.078);
    g.add(strip);
    [-1, 1].forEach(function (sd) {
      var post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.4, 8), MAT.metal);
      post.position.set(sd * ((w || 2.6) / 2 - 0.3), PLATE + 0.7, 0);
      g.add(post);
    });
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    scene.add(g);
  }
  signboard(4.5, -28.4, 0.15);
  signboard(27.6, -28.3, -0.2, 2.2);

  /* ---------------- zone labels ---------------- */
  var ZONES = [
    { t: "面料 / 裁剪区", p: [-78, -40], b: "W-13" },
    { t: "缝制 / 整烫区", p: [-74, -6], b: "W-23" },
    { t: "中央成衣车间", p: [-12, 34], b: "A-03" },
    { t: "智能裁剪 / 仓储区", p: [58, -38], b: "E-02" },
    { t: "研发 / 展陈区", p: [66, 41], b: "R-03" }
  ];
  ZONES.forEach(function (z) {
    var d = document.createElement("div");
    d.className = "zlabel";
    d.textContent = z.t;
    d.style.opacity = "0";
    canvasEl.appendChild(d);
    z.el = d;
    d.title = "点击聚焦 · " + z.t;
    d.onclick = function () {
      if (auto) setAuto(false);
      var b = null;
      for (var i = 0; i < LAYOUT.length; i++) if (LAYOUT[i].id === z.b) b = LAYOUT[i];
      if (b) select(b, true);
      else focusOn(z.p[0], z.p[1], 200);
    };
    z.v = new THREE.Vector3(z.p[0], PLATE + 14, z.p[1]);
  });

  /* ---------------- selection ring ---------------- */
  var ring = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 1, 64),
    new THREE.MeshBasicMaterial({ color: 0x4a56d8, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  ring.position.y = PLATE + 0.2;
  scene.add(ring);

  var halo = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: glowTex(120, 134, 255), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = PLATE + 0.1;
  halo.material.fog = false;
  scene.add(halo);

  /* logistics route */
  var ROUTE_PTS = [[-88, -14], [-54, -14], [-36, -14], [-34, 0], [-34, 22], [-34, 42], [-26, 54], [0, 54], [24, 54], [28, 40], [28, 20], [28, 2], [28, -12], [34, -24], [38, -40], [46, -46]];
  var routeCurve = new THREE.CatmullRomCurve3(ROUTE_PTS.map(function (p) {
    return new THREE.Vector3(p[0], PLATE + 0.55, p[1]);
  }), false, "catmullrom", 0.15);
  var routeMat = new THREE.LineDashedMaterial({ color: 0x4a56d8, dashSize: 2.4, gapSize: 1.7, transparent: true, opacity: 0.92 });
  var routeLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(routeCurve.getPoints(240)), routeMat);
  routeLine.computeLineDistances();
  routeLine.visible = false;
  scene.add(routeLine);
  var routeDot = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 10), new THREE.MeshBasicMaterial({ color: 0x4a56d8 }));
  routeDot.visible = false;
  scene.add(routeDot);
  var routeRing = new THREE.Mesh(
    new THREE.RingGeometry(1.6, 2.0, 36),
    new THREE.MeshBasicMaterial({ color: 0x4a56d8, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  );
  routeRing.rotation.x = -Math.PI / 2;
  routeRing.visible = false;
  scene.add(routeRing);

  /* ---------------- camera control ---------------- */
  var cam = { theta: 0.34, phi: 0.78, r: 395, tx: 5, ty: 0, tz: 6 };
  var dst = { theta: 0.34, phi: 0.78, r: 395, tx: 5, ty: 0, tz: 6 };
  var HOME = { theta: 0.34, phi: 0.78, r: 395 };
  var FOCUS_PHI = 0.42;
  var auto = false;
  var dragging = false, btn = 0, lx = 0, ly = 0, moved = 0, idle = 0;
  var el = renderer.domElement;

  function clampDst() {
    dst.phi = Math.max(0.26, Math.min(1.24, dst.phi));
    dst.r = Math.max(85, Math.min(620, dst.r));
    dst.tx = Math.max(-100, Math.min(100, dst.tx));
    dst.tz = Math.max(-85, Math.min(85, dst.tz));
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
        dst.phi -= dy * 0.005;
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
    if (hovered) { hovered.userData.b._mat.color.setHex(hovered.userData.b._tone); hovered = null; }
  });
  el.addEventListener("wheel", function (e) {
    e.preventDefault();
    dst.r *= Math.exp(e.deltaY * 0.0012);
    userZoomed = true;
    clampDst();
    idle = 0;
  }, { passive: false });

  /* ---------------- picking ---------------- */
  var ray = new THREE.Raycaster();
  var mouse = new THREE.Vector2();
  var hovered = null;
  var selected = null;

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
    if (b === (hovered && hovered.userData.b)) {
      if (b) { tip.style.left = (x - r.left) + "px"; tip.style.top = (y - r.top) + "px"; }
      return;
    }
    if (hovered) hovered.userData.b._mat.color.setHex(hovered.userData.b._tone);
    hovered = null;
    if (b) {
      hovered = b._body;
      if (!selected || selected !== b) b._mat.color.setHex(TINT.hover);
      tip.innerHTML = b.name + "<i>" + b.type + "</i>" + (b.id === "A-03" ? '<b class="tipgo">进入车间 ›</b>' : "");
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
    if (!hit) return;
    var b = hit.object.userData.b;
    if (b.id === "A-03") { opts.onEnterWorkshop(); return; }
    select(b, true);
  }

  function focusOn(x, z, r, ty) {
    dst.tx = x;
    dst.tz = z;
    // 拉近时压低俯角（约 22°），取景更接近平视进入场景
    dst.r = r || 200;
    dst.phi = FOCUS_PHI;
    dst.ty = ty || 0;
    userZoomed = true;
    clampDst();
    idle = 0;
  }

  /* 面板 ViewModel 直接由数据源生成，这里只补上运行时状态（停线） */
  function vmOf(b) {
    var vm = getBuildingVM(b.id);
    vm.halted = !!b._halted;
    return vm;
  }
  function emitSel(meta) {
    opts.onSelect(selected ? vmOf(selected) : null, meta || { user: false });
  }

  function select(b, focus) {
    if (selected && selected !== b) selected._mat.color.setHex(selected._tone);
    selected = b;
    b._mat.color.setHex(TINT.sel);
    ring.visible = true;
    ring.position.set(b.x, PLATE + 0.2, b.z);
    var rad = Math.min(Math.max(b.w, b.d) * 0.62, 15);
    ring.scale.set(rad, rad, 1);
    popupTarget.set(b.x, PLATE + b.h + 8, b.z);
    halo.position.set(b.x, PLATE + 0.1, b.z);
    var hs = Math.min(Math.max(b.w, b.d) * 2.2, 44);
    halo.scale.set(hs, hs, 1);
    emitSel({ user: !!focus });
    if (focus) focusOn(b.x, b.z, Math.max(120, Math.min(200, Math.max(b.w, b.d) * 2.0)), Math.min(8, b.h * 0.55));
    idle = 0;
  }

  var popupTarget = new THREE.Vector3(0, 30, 0);

  /* ---------------- resize ---------------- */
  var userZoomed = false;
  function fitDistance() {
    var r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var aspect = r.width / r.height;
    var k = Math.max(1, Math.min(1.46, 1.26 / Math.max(aspect, 0.72)));
    HOME.r = 345 * k;
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

  /* ---------------- theme ---------------- */
  var TINT = { hover: 0xe9ecff, sel: 0xdfe4ff };
  var PAL = {
    light: {
      plate: 0x95917f, road: 0xe2ded1, yard: 0xa7a28f, grass: 0x8ea476, water: 0x8fb3c4,
      roof: 0xf7f6f1, roofBlue: 0xc3d3e4, trim: 0xfbfaf4, body: 0xf1f0eb, rib: 0xd8d6cd, crown: 0x9cb47f, trunk: 0x9a927e, car: 0xf8f8f6,
      glass: 0xa3bccb, glassDark: 0x5b6e78, frame: 0xb8b4a6, mark: 0xffffff,
      edge: 0x8e8c80, edgeOp: 0.72,
      hemiSky: 0xffffff, hemiGround: 0x9d9a8e, hemi: 0.46,
      sunColor: 0xfff7ea, sun: 0.84, fillColor: 0xdfe8ff, fill: 0.12, rimColor: 0x6d7cff, rim: 0.12,
      catchShadow: 0.22, aoOp: 0.16, blob: 0.72, glowColor: 0xfff0d6, glowOp: 0.3,
      fog: 0xeef1e8, fogNear: 340, fogFar: 900,
      sunGlow: 0xfff0d2, sunGlowOp: 0.34, shaft: 0xffffff, shaftOp: 0.05,
      ring: 0x4a56d8, route: 0x4a56d8, hover: 0xe9ecff, sel: 0xdfe4ff, halt: 0xe6d8d5
    },
    dark: {
      plate: 0x232a33, road: 0x39424e, yard: 0x272e38, grass: 0x1c2923, water: 0x13303e,
      roof: 0xeeeeea, roofBlue: 0x93a7c0, trim: 0xe6e7e4, body: 0xd4d4d1, rib: 0xb2b5bb, crown: 0x2c4636, trunk: 0x322f29, car: 0xd5d8dd,
      glass: 0x4d7fa3, glassDark: 0x27343f, frame: 0x6a7684, mark: 0xcfd8e6,
      edge: 0x67717f, edgeOp: 0.5,
      hemiSky: 0x4d5f7a, hemiGround: 0x090b0f, hemi: 0.7,
      sunColor: 0xdee7ff, sun: 0.95, fillColor: 0x3b5cff, fill: 0.15, rimColor: 0x6d7cff, rim: 0.32,
      catchShadow: 0.44, aoOp: 0.46, blob: 0.85, glowColor: 0x4a63ff, glowOp: 0.5,
      fog: 0x090e15, fogNear: 240, fogFar: 660,
      sunGlow: 0x6d7eff, sunGlowOp: 0.42, shaft: 0x8ea0ff, shaftOp: 0.12,
      ring: 0x8b95ff, route: 0x8b95ff, hover: 0xc9d0ff, sel: 0xa9b3ff, halt: 0xcaa9a4
    }
  };
  var THEME = { dark: false };

  function applyTheme(dark) {
    THEME.dark = dark;
    var p = PAL[dark ? "dark" : "light"];
    TINT.hover = p.hover;
    TINT.sel = p.sel;
    MAT.plate.color.setHex(p.plate);
    MAT.road.color.setHex(p.road);
    MAT.yard.color.setHex(p.yard);
    MAT.grass.color.setHex(p.grass);
    MAT.water.color.setHex(p.water);
    MAT.roof.color.setHex(p.roof);
    MAT.roofBlue.color.setHex(p.roofBlue);
    MAT.trim.color.setHex(p.trim);
    MAT.rib.color.setHex(p.rib);
    MAT.crown.color.setHex(p.crown);
    MAT.trunk.color.setHex(p.trunk);
    MAT.car.color.setHex(p.car);
    MAT.roadMark.color.setHex(p.mark);
    MAT.glassDark.color.setHex(p.glassDark);
    MAT.apron.color.setHex(dark ? 0x2b333d : 0xaba697);
    MAT.glass.color.setHex(p.glass);
    MAT.frame.color.setHex(p.frame);
    MAT.mark.color.setHex(p.mark);
    MAT.glassBand.color.setHex(dark ? 0x516779 : 0xffffff);
    MAT.seam.color.setHex(p.frame);
    MAT.seam.opacity = dark ? 0.35 : 0.5;
    MAT.line.color.setHex(p.edge);
    MAT.line.opacity = p.edgeOp;
    hemi.color.setHex(p.hemiSky);
    hemi.groundColor.setHex(p.hemiGround);
    hemi.intensity = p.hemi;
    sun.color.setHex(p.sunColor);
    sun.intensity = p.sun;
    fill.color.setHex(p.fillColor);
    fill.intensity = p.fill;
    rim.color.setHex(p.rimColor);
    rim.intensity = p.rim;
    catcher.material.opacity = p.catchShadow;
    BLOB_MAT.opacity = p.blob;
    groundGlow.material.opacity = p.glowOp;
    groundGlow.material.color.setHex(p.glowColor);
    scene.fog.color.setHex(p.fog);
    scene.fog.near = p.fogNear;
    scene.fog.far = p.fogFar;
    sunGlow.material.color.setHex(p.sunGlow);
    sunGlow.material.opacity = p.sunGlowOp;
    sunGlow.userData.base = p.sunGlowOp;
    plateAO.material.opacity = p.aoOp;
    shafts.forEach(function (m) {
      m.material.color.setHex(p.shaft);
      m.userData.base = p.shaftOp * m.userData.scale;
      m.material.opacity = m.userData.base;
    });
    scene.environment = null;
    scene.traverse(function (o) {
      var m = o.material;
      if (!m) return;
      var list = m.length !== undefined ? m : [m];
      for (var i = 0; i < list.length; i++) {
        if (list[i].isMeshStandardMaterial) list[i].envMapIntensity = 0;
      }
    });
    MAT.roof.roughness = 0.8;
    MAT.roofBlue.roughness = 0.82;
    MAT.trim.roughness = 0.85;
    MAT.car.roughness = 0.6;
    MAT.water.roughness = 0.45;
    MAT.road.roughness = 0.98;
    MAT.plate.roughness = 0.95;
    MAT.glass.roughness = dark ? 0.28 : 0.3;
    MAT.glassBand.roughness = dark ? 0.3 : 0.26;
    MAT.mark.opacity = dark ? 0.5 : 0.85;
    MAT.roadMark.opacity = dark ? 0.3 : 0.55;
    MAT.glassDark.roughness = dark ? 0.3 : 0.32;
    ring.material.color.setHex(p.ring);
    routeMat.color.setHex(p.route);
    routeDot.material.color.setHex(p.route);
    routeRing.material.color.setHex(p.route);
    halo.material.opacity = 0;
    hovered = null;
    tip.classList.remove("on");
    buildings.forEach(function (b) {
      b._tone = b._halted ? p.halt : p.body;
      b._mat.color.setHex(b === selected ? p.sel : b._tone);
    });
  }

  /* ---------------- auto tour ---------------- */
  var AUTO_LIST = LAYOUT.filter(function (b) { return b.lines > 0 && b.id !== "E-05"; });
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

  /* ---------------- actions ---------------- */
  var tracing = false, routeT = 0;

  function focusSelected() {
    if (!selected) return;
    dst.tx = selected.x;
    dst.tz = selected.z;
    dst.phi = Math.min(dst.phi, 0.78);
    dst.r = Math.min(dst.r, 185);
    userZoomed = true;
    setAuto(false);
  }

  function toggleHalt() {
    if (!selected) return null;
    var p = PAL[THEME.dark ? "dark" : "light"];
    selected._halted = !selected._halted;
    selected._tone = selected._halted ? p.halt : p.body;
    selected._mat.color.setHex(selected._tone);
    emitSel({ user: true });
    return vmOf(selected);
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
    if (selected) { var b = selected; selected = null; b._mat.color.setHex(b._tone); }
    if (hovered) { hovered.userData.b._mat.color.setHex(hovered.userData.b._tone); hovered = null; }
    tip.classList.remove("on");
    emitSel({ user: false });
  }

  function selectById(id, focus) {
    for (var i = 0; i < LAYOUT.length; i++) {
      if (LAYOUT[i].id === id) { select(LAYOUT[i], focus); return true; }
    }
    return false;
  }

  /* ---------------- loop ---------------- */
  var clock = new THREE.Clock();
  var projV = new THREE.Vector3();

  function frame() {
    var dt = Math.min(clock.getDelta(), 0.05);
    idle += dt;

    if (auto && !dragging) {
      dst.theta += dt * 0.11;
      autoSelT += dt;
      if (autoSelT >= 4.5) { autoSelT = 0; autoNext(); }
    }

    var k = Math.min(1, dt * 7);
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

    // selection ring pulse
    if (ring.visible) {
      var p = 1 + Math.sin(performance.now() / 420) * 0.035;
      ring.scale.x = ring.scale.y = selected ? Math.min(Math.max(selected.w, selected.d) * 0.62, 15) * p : 1;
      ring.material.opacity = 0.34 + Math.sin(performance.now() / 420) * 0.12;
    }

    if (tracing) {
      routeT = (routeT + dt * 0.05) % 1;
      var rp = routeCurve.getPointAt(routeT);
      routeDot.position.copy(rp);
      routeRing.position.set(rp.x, PLATE + 0.13, rp.z);
      routeRing.material.opacity = 0.3 + Math.sin(performance.now() / 320) * 0.16;
    }
    if (selected) {
      halo.material.opacity = (THEME.dark ? 0.3 : 0.16) + Math.sin(performance.now() / 640) * 0.05;
    }

    var tt = performance.now() / 1000;
    if (sunGlow.userData.base) sunGlow.material.opacity = sunGlow.userData.base * (0.9 + Math.sin(tt * 0.23) * 0.1);
    for (var si = 0; si < shafts.length; si++) {
      var sm = shafts[si];
      sm.material.opacity = sm.userData.base * (0.8 + Math.sin(tt * 0.45 + sm.userData.phase) * 0.2);
      sm.rotation.z += Math.sin(tt * 0.12 + si) * 0.0002;
    }

    // project popup + zone labels
    var cr = canvasEl.getBoundingClientRect();
    projV.copy(popupTarget).project(camera);
    var sx = (projV.x * 0.5 + 0.5) * cr.width;
    var sy = (-projV.y * 0.5 + 0.5) * cr.height;
    var pw = popup.offsetWidth || 292, ph = popup.offsetHeight || 127;
    var fx = sx < Math.max(pw + 46, cr.width * 0.46);
    var fy = sy < ph + 34;
    popup.style.transform = "translate(" + (fx ? "0%" : "-100%") + "," + (fy ? "0%" : "-100%") + ") translate(" + (fx ? "20px" : "-22px") + "," + (fy ? "16px" : "-10px") + ")";
    popup.classList.toggle("fr", fx);
    popup.classList.toggle("fd", fy);
    sx = Math.max(fx ? 10 : Math.min(pw + 40, cr.width - 12), Math.min(fx ? cr.width - pw - 30 : cr.width - 12, sx));
    sy = Math.max(fy ? 10 : Math.min(ph + 26, cr.height - 12), Math.min(fy ? cr.height - ph - 24 : cr.height - 12, sy));
    popup.style.left = sx.toFixed(1) + "px";
    popup.style.top = sy.toFixed(1) + "px";

    ZONES.forEach(function (z) {
      projV.copy(z.v).project(camera);
      var vis = projV.z < 1;
      z.el.style.opacity = vis ? "0.85" : "0";
      z.el.style.pointerEvents = vis ? "auto" : "none";
      z.el.style.left = ((projV.x * 0.5 + 0.5) * cr.width).toFixed(0) + "px";
      z.el.style.top = ((-projV.y * 0.5 + 0.5) * cr.height).toFixed(0) + "px";
    });

    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(frame);

  /* ---------------- public api ---------------- */
  applyTheme(opts.dark);
  var firstSel = null;
  for (var li = 0; li < LAYOUT.length; li++) if (LAYOUT[li].id === "A-03") firstSel = LAYOUT[li];
  var initialSelT = setTimeout(function () { if (firstSel) select(firstSel); }, 400);

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
      dst.tx = 0; dst.ty = 0; dst.tz = 0;
    },
    applyTheme: function (dark) { applyTheme(dark); },
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
