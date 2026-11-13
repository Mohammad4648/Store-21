import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
  Camera,
  Check,
  Layers,
  RotateCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { FINISH_LABELS } from '../data/initialData';
import { Product, Product3DModelType, ProductFinish } from '../types/commerce';

interface Scene3DShowcaseProps {
  product: Product;
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
  selectedFinish: ProductFinish;
  onSelectFinish: (finish: ProductFinish) => void;
  onAddToCart: (product: Product, finish: ProductFinish) => void;
  onInstantBuy: (product: Product, finish: ProductFinish) => void;
}

type CameraPreset = 'hero' | 'top' | 'detail';

const CAMERA_PRESETS: Record<
  CameraPreset,
  { pos: [number, number, number]; target: [number, number, number]; label: string }
> = {
  hero: { pos: [3.2, 2.2, 4.1], target: [0, 0.35, 0], label: 'كامل' },
  top: { pos: [0.1, 4.8, 1.4], target: [0, 0.2, 0], label: 'علوي' },
  detail: { pos: [1.7, 1.35, 2.2], target: [0, 0.45, 0], label: 'مقرّب' },
};

const FINISH_COLORS: Record<ProductFinish, { metal: number; roughness: number; metalness: number }> = {
  gold: { metal: 0xd4af37, roughness: 0.2, metalness: 0.94 },
  titanium: { metal: 0x4b5563, roughness: 0.32, metalness: 0.88 },
  platinum: { metal: 0xdbe2ea, roughness: 0.16, metalness: 0.96 },
  copper: { metal: 0xb87333, roughness: 0.24, metalness: 0.92 },
};

const _camGoal = new THREE.Vector3();
const _targetGoal = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 124);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWatchDialTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const cx = 256;
  const cy = 256;

  const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 240);
  grad.addColorStop(0, '#1e2736');
  grad.addColorStop(1, '#0b0f17');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 250, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const r1 = isMajor ? 205 : 220;
    const r2 = 236;
    ctx.strokeStyle = isMajor ? '#E5B84B' : '#64748B';
    ctx.lineWidth = isMajor ? 5 : 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
    ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
    ctx.stroke();
  }

  const drawSubdial = (sx: number, sy: number, label: string) => {
    ctx.fillStyle = '#090c12';
    ctx.beginPath();
    ctx.arc(sx, sy, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let j = 0; j < 12; j++) {
      const a = (j / 12) * Math.PI * 2;
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * 40, sy + Math.sin(a) * 40);
      ctx.lineTo(sx + Math.cos(a) * 48, sy + Math.sin(a) * 48);
      ctx.stroke();
    }
    ctx.fillStyle = '#E5B84B';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, sx, sy + 24);
  };

  drawSubdial(cx - 72, cy, '60');
  drawSubdial(cx + 72, cy, '30');

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SOUQCHAIN', cx, cy - 84);
  ctx.fillStyle = '#E5B84B';
  ctx.font = '13px monospace';
  ctx.fillText('CHRONO · ON-CHAIN', cx, cy + 108);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createPlaqueTexture(title: string, subtitle: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#141923';
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, 484, 228);

  ctx.fillStyle = '#E5B84B';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 118);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '20px monospace';
  ctx.fillText(subtitle, 256, 168);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createVaultScreenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#070a10';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(229, 184, 75, 0.14)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 512; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  ctx.strokeStyle = '#E5B84B';
  ctx.lineWidth = 8;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const x = 256 + Math.cos(a) * 110;
    const y = 210 + Math.sin(a) * 110;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 26px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EAL6+ VERIFIED', 256, 385);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '20px monospace';
  ctx.fillText('0x94A2...3D12', 256, 425);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createMeshGrillTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#181e29';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#07090e';
  for (let y = 8; y < 256; y += 12) {
    for (let x = 8; x < 256; x += 12) {
      ctx.beginPath();
      ctx.arc(x + ((y / 12) % 2) * 6, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface ExplodablePart {
  mesh: THREE.Object3D;
  basePos: THREE.Vector3;
  explodeOffset: THREE.Vector3;
}

export const Scene3DShowcase: React.FC<Scene3DShowcaseProps> = ({
  product,
  allProducts,
  onSelectProduct,
  selectedFinish,
  onSelectFinish,
  onAddToCart,
  onInstantBuy,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [explodeAmount, setExplodeAmount] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('hero');
  const [webglError, setWebglError] = useState(false);

  const stateRef = useRef({
    modelType: product.model3d,
    finish: selectedFinish,
    explodeTarget: explodeAmount,
    autoRotate,
  });

  stateRef.current.modelType = product.model3d;
  stateRef.current.finish = selectedFinish;
  stateRef.current.explodeTarget = explodeAmount;
  stateRef.current.autoRotate = autoRotate;

  const rebuildModelRef = useRef<((type: Product3DModelType, finish: ProductFinish) => void) | null>(null);
  const updateFinishRef = useRef<((finish: ProductFinish) => void) | null>(null);
  const applyPresetRef = useRef<((preset: CameraPreset) => void) | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    const handleContextRestored = () => {
      setWebglError(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    const bgHex = 0x0d1119;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.045);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      60
    );
    camera.position.set(...CAMERA_PRESETS.hero.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.0;
    controls.maxDistance = 8.5;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.target.set(...CAMERA_PRESETS.hero.target);
    controls.autoRotate = !isSoftwareGl && stateRef.current.autoRotate;
    controls.autoRotateSpeed = 1.35;

    let cameraTransitionActive = false;
    controls.addEventListener('start', () => {
      cameraTransitionActive = false;
    });

    const hemiLight = new THREE.HemisphereLight(0xa5c4ff, 0x1a1410, 0.7);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.2);
    keyLight.position.set(4.5, 6.5, 4.0);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 18;
    keyLight.shadow.camera.left = -3.5;
    keyLight.shadow.camera.right = 3.5;
    keyLight.shadow.camera.top = 3.5;
    keyLight.shadow.camera.bottom = -3.5;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 1.15);
    rimLight.position.set(-4.5, 3.2, -4.0);
    scene.add(rimLight);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softbox = new THREE.RectAreaLight(0xfff7e6, 3.5, 3.5, 1.8);
      softbox.position.set(0, 4.8, 2.8);
      softbox.lookAt(0, 0.4, 0);
      scene.add(softbox);
    }

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const shadowTex = createContactShadowTexture();
    const dialTex = createWatchDialTexture();
    dialTex.anisotropy = maxAniso;
    const plaqueTex = createPlaqueTexture('AMBER SOVEREIGN', '35% EXTRAIT · 100ML');
    plaqueTex.anisotropy = maxAniso;
    const vaultTex = createVaultScreenTexture();
    vaultTex.anisotropy = maxAniso;
    const grillTex = createMeshGrillTexture();
    grillTex.anisotropy = maxAniso;

    const stageGroup = new THREE.Group();
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f141e,
      roughness: 0.85,
      metalness: 0.15,
    });
    const floorMesh = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.5, 0.08, 64), floorMat);
    floorMesh.position.y = -0.58;
    floorMesh.receiveShadow = true;
    stageGroup.add(floorMesh);

    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x161d2b,
      roughness: 0.45,
      metalness: 0.35,
    });
    const plinthBase = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.7, 0.24, 48), plinthMat);
    plinthBase.position.y = -0.42;
    plinthBase.receiveShadow = true;
    stageGroup.add(plinthBase);

    const plinthTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.22,
      metalness: 0.92,
    });
    const plinthRing = new THREE.Mesh(new THREE.TorusGeometry(1.56, 0.018, 16, 72), plinthTrimMat);
    plinthRing.rotation.x = Math.PI / 2;
    plinthRing.position.y = -0.3;
    stageGroup.add(plinthRing);

    const contactPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 2.6),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      })
    );
    contactPlane.rotation.x = -Math.PI / 2;
    contactPlane.position.y = -0.285;
    stageGroup.add(contactPlane);

    scene.add(stageGroup);

    const productRoot = new THREE.Group();
    scene.add(productRoot);

    let explodableParts: ExplodablePart[] = [];
    let primaryMetalMat: THREE.MeshPhysicalMaterial | null = null;
    let currentExplode = 0;

    function disposeGroup(group: THREE.Group) {
      group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else {
            m.material?.dispose();
          }
        }
      });
      while (group.children.length > 0) {
        group.remove(group.children[0]);
      }
    }

    function registerPart(mesh: THREE.Object3D, explodeOffset: THREE.Vector3) {
      explodableParts.push({
        mesh,
        basePos: mesh.position.clone(),
        explodeOffset,
      });
    }

    function buildProductModel(type: Product3DModelType, finish: ProductFinish) {
      disposeGroup(productRoot);
      explodableParts = [];
      const f = FINISH_COLORS[finish];

      const metalMat = new THREE.MeshPhysicalMaterial({
        color: f.metal,
        roughness: f.roughness,
        metalness: f.metalness,
        clearcoat: 0.35,
        clearcoatRoughness: 0.15,
      });
      primaryMetalMat = metalMat;

      const darkChassisMat = new THREE.MeshStandardMaterial({
        color: 0x1e2532,
        roughness: 0.52,
        metalness: 0.65,
      });

      const matteRubberMat = new THREE.MeshStandardMaterial({
        color: 0x151922,
        roughness: 0.88,
        metalness: 0.08,
      });

      const crystalMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.05,
        metalness: 0.0,
        transmission: isSoftwareGl ? 0 : 0.92,
        transparent: true,
        opacity: isSoftwareGl ? 0.32 : 1,
        ior: 1.75,
        thickness: 0.35,
        clearcoat: 1.0,
        depthWrite: false,
      });

      if (type === 'watch') {
        const watchGroup = new THREE.Group();
        watchGroup.position.set(0, 0.55, 0);
        watchGroup.rotation.x = -0.35;

        const caseBody = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.85, 0.28, 48), darkChassisMat);
        caseBody.castShadow = true;
        watchGroup.add(caseBody);
        registerPart(caseBody, new THREE.Vector3(0, -0.15, 0));

        const caseBack = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.7, 0.08, 48), metalMat);
        caseBack.position.y = -0.18;
        watchGroup.add(caseBack);
        registerPart(caseBack, new THREE.Vector3(0, -0.7, 0));

        const dialMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.7, 0.7, 0.02, 48),
          new THREE.MeshStandardMaterial({ map: dialTex, roughness: 0.4, metalness: 0.2 })
        );
        dialMesh.position.y = 0.14;
        watchGroup.add(dialMesh);
        registerPart(dialMesh, new THREE.Vector3(0, 0.22, 0));

        const handsGroup = new THREE.Group();
        handsGroup.position.y = 0.17;
        const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.015, 0.36), metalMat);
        hourHand.position.set(0.08, 0, -0.12);
        hourHand.rotation.y = -0.6;
        const minHand = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.015, 0.54), metalMat);
        minHand.position.set(-0.1, 0.01, -0.16);
        minHand.rotation.y = 0.5;
        const centerPin = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 16), metalMat);
        handsGroup.add(hourHand, minHand, centerPin);
        watchGroup.add(handsGroup);
        registerPart(handsGroup, new THREE.Vector3(0, 0.52, 0));

        const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.085, 20, 48), metalMat);
        bezel.rotation.x = Math.PI / 2;
        bezel.position.y = 0.16;
        bezel.castShadow = true;
        watchGroup.add(bezel);
        registerPart(bezel, new THREE.Vector3(0, 0.78, 0));

        const crystal = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.72, 0.04, 48), crystalMat);
        crystal.position.y = 0.22;
        crystal.renderOrder = 3;
        watchGroup.add(crystal);
        registerPart(crystal, new THREE.Vector3(0, 1.12, 0));

        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 16), metalMat);
        crown.rotation.z = Math.PI / 2;
        crown.position.set(0.91, 0, 0);
        watchGroup.add(crown);
        registerPart(crown, new THREE.Vector3(0.55, 0, 0));

        const pusherTop = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 16), metalMat);
        pusherTop.rotation.z = Math.PI / 2;
        pusherTop.position.set(0.86, 0, -0.34);
        watchGroup.add(pusherTop);
        registerPart(pusherTop, new THREE.Vector3(0.45, 0, -0.2));

        const pusherBot = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 16), metalMat);
        pusherBot.rotation.z = Math.PI / 2;
        pusherBot.position.set(0.86, 0, 0.34);
        watchGroup.add(pusherBot);
        registerPart(pusherBot, new THREE.Vector3(0.45, 0, 0.2));

        const strapTop = new THREE.Group();
        const strapBot = new THREE.Group();
        for (let i = 0; i < 4; i++) {
          const linkT = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.09, 0.22), i % 2 === 0 ? darkChassisMat : metalMat);
          linkT.position.set(0, -i * 0.11 - 0.08, -0.95 - i * 0.22);
          linkT.rotation.x = 0.45 * (i + 1) * 0.35;
          linkT.castShadow = true;
          strapTop.add(linkT);

          const linkB = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.09, 0.22), i % 2 === 0 ? darkChassisMat : metalMat);
          linkB.position.set(0, -i * 0.11 - 0.08, 0.95 + i * 0.22);
          linkB.rotation.x = -0.45 * (i + 1) * 0.35;
          linkB.castShadow = true;
          strapBot.add(linkB);
        }
        watchGroup.add(strapTop, strapBot);
        registerPart(strapTop, new THREE.Vector3(0, 0, -0.45));
        registerPart(strapBot, new THREE.Vector3(0, 0, 0.45));

        productRoot.add(watchGroup);
      } else if (type === 'perfume') {
        const bottleGroup = new THREE.Group();
        bottleGroup.position.set(0, 0.48, 0);

        const baseGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.58, 0.24, 8), crystalMat);
        baseGlass.position.y = -0.62;
        baseGlass.renderOrder = 2;
        bottleGroup.add(baseGlass);
        registerPart(baseGlass, new THREE.Vector3(0, -0.35, 0));

        const outerBody = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.66, 1.15, 8), crystalMat);
        outerBody.position.y = 0.05;
        outerBody.castShadow = true;
        outerBody.renderOrder = 3;
        bottleGroup.add(outerBody);
        registerPart(outerBody, new THREE.Vector3(0, 0, 0));

        const amberLiquidMat = new THREE.MeshPhysicalMaterial({
          color: 0xb45309,
          emissive: 0x451a03,
          emissiveIntensity: 0.35,
          roughness: 0.12,
          metalness: 0.05,
          clearcoat: 0.8,
        });
        const liquidCore = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.52, 0.92, 8), amberLiquidMat);
        liquidCore.position.y = 0.02;
        bottleGroup.add(liquidCore);
        registerPart(liquidCore, new THREE.Vector3(0, 0.15, 0));

        const plaque = new THREE.Mesh(
          new THREE.BoxGeometry(0.64, 0.42, 0.04),
          new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.28, metalness: 0.85 })
        );
        plaque.position.set(0, 0.06, 0.72);
        bottleGroup.add(plaque);
        registerPart(plaque, new THREE.Vector3(0, 0, 0.55));

        const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.2, 32), metalMat);
        collar.position.y = 0.72;
        bottleGroup.add(collar);
        registerPart(collar, new THREE.Vector3(0, 0.45, 0));

        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.16, 24), darkChassisMat);
        nozzle.position.y = 0.88;
        bottleGroup.add(nozzle);
        registerPart(nozzle, new THREE.Vector3(0, 0.72, 0));

        const capGroup = new THREE.Group();
        capGroup.position.y = 1.05;
        const capMain = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.36, 0.46, 32), metalMat);
        capMain.castShadow = true;
        const capRing = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.025, 16, 36), darkChassisMat);
        capRing.rotation.x = Math.PI / 2;
        capRing.position.y = -0.18;
        capGroup.add(capMain, capRing);
        bottleGroup.add(capGroup);
        registerPart(capGroup, new THREE.Vector3(0, 1.1, 0));

        productRoot.add(bottleGroup);
      } else if (type === 'headphones') {
        const hpGroup = new THREE.Group();
        hpGroup.position.set(0, 0.68, 0);

        const archCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.78, 0.05, 0),
          new THREE.Vector3(-0.62, 0.65, 0),
          new THREE.Vector3(0, 0.92, 0),
          new THREE.Vector3(0.62, 0.65, 0),
          new THREE.Vector3(0.78, 0.05, 0),
        ]);
        const headband = new THREE.Mesh(new THREE.TubeGeometry(archCurve, 40, 0.085, 16, false), matteRubberMat);
        headband.castShadow = true;
        hpGroup.add(headband);
        registerPart(headband, new THREE.Vector3(0, 0.55, 0));

        const trimBand = new THREE.Mesh(new THREE.TubeGeometry(archCurve, 40, 0.045, 12, false), metalMat);
        trimBand.position.y = 0.05;
        hpGroup.add(trimBand);
        registerPart(trimBand, new THREE.Vector3(0, 0.85, 0));

        const buildEarAssembly = (side: -1 | 1) => {
          const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.08), metalMat);
          yoke.position.set(side * 0.78, -0.15, 0);
          yoke.rotation.z = side * 0.14;
          hpGroup.add(yoke);
          registerPart(yoke, new THREE.Vector3(side * 0.35, 0.15, 0));

          const cupOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.22, 36), darkChassisMat);
          cupOuter.rotation.z = Math.PI / 2;
          cupOuter.position.set(side * 0.74, -0.42, 0);
          cupOuter.castShadow = true;
          hpGroup.add(cupOuter);
          registerPart(cupOuter, new THREE.Vector3(side * 0.65, -0.1, 0));

          const grill = new THREE.Mesh(
            new THREE.CylinderGeometry(0.32, 0.32, 0.03, 36),
            new THREE.MeshStandardMaterial({ map: grillTex, roughness: 0.45, metalness: 0.75 })
          );
          grill.rotation.z = Math.PI / 2;
          grill.position.set(side * 0.86, -0.42, 0);
          hpGroup.add(grill);
          registerPart(grill, new THREE.Vector3(side * 0.95, -0.1, 0));

          const cushion = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.11, 20, 40), matteRubberMat);
          cushion.rotation.y = Math.PI / 2;
          cushion.position.set(side * 0.58, -0.42, 0);
          hpGroup.add(cushion);
          registerPart(cushion, new THREE.Vector3(side * 0.25, -0.15, 0));

          const accentRing = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.022, 16, 40), metalMat);
          accentRing.rotation.y = Math.PI / 2;
          accentRing.position.set(side * 0.84, -0.42, 0);
          hpGroup.add(accentRing);
          registerPart(accentRing, new THREE.Vector3(side * 0.85, -0.1, 0));
        };

        buildEarAssembly(-1);
        buildEarAssembly(1);

        const volDial = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 20), metalMat);
        volDial.position.set(0.8, -0.62, 0.28);
        volDial.rotation.x = Math.PI / 2;
        hpGroup.add(volDial);
        registerPart(volDial, new THREE.Vector3(0.7, -0.25, 0.35));

        productRoot.add(hpGroup);
      } else {
        const vaultGroup = new THREE.Group();
        vaultGroup.position.set(0, 0.56, 0);

        const shape = new THREE.Shape();
        const w = 0.62;
        const h = 0.95;
        const r = 0.14;
        shape.moveTo(-w + r, -h);
        shape.lineTo(w - r, -h);
        shape.quadraticCurveTo(w, -h, w, -h + r);
        shape.lineTo(w, h - r);
        shape.quadraticCurveTo(w, h, w - r, h);
        shape.lineTo(-w + r, h);
        shape.quadraticCurveTo(-w, h, -w, h - r);
        shape.lineTo(-w, -h + r);
        shape.quadraticCurveTo(-w, -h, -w + r, -h);

        const chassisGeo = new THREE.ExtrudeGeometry(shape, {
          depth: 0.22,
          bevelEnabled: true,
          bevelThickness: 0.04,
          bevelSize: 0.04,
          bevelSegments: 4,
        });
        chassisGeo.center();
        const chassis = new THREE.Mesh(chassisGeo, darkChassisMat);
        chassis.rotation.x = -0.32;
        chassis.castShadow = true;
        vaultGroup.add(chassis);
        registerPart(chassis, new THREE.Vector3(0, 0, -0.35));

        const pcbMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.4, metalness: 0.5 });
        const pcbCore = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.55, 0.05), pcbMat);
        pcbCore.rotation.x = -0.32;
        vaultGroup.add(pcbCore);
        registerPart(pcbCore, new THREE.Vector3(0, 0, 0.08));

        const chip = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.05), metalMat);
        chip.rotation.x = -0.32;
        chip.position.set(0, 0.05, 0.06);
        vaultGroup.add(chip);
        registerPart(chip, new THREE.Vector3(0, 0.05, 0.35));

        const screen = new THREE.Mesh(
          new THREE.PlaneGeometry(0.95, 1.15),
          new THREE.MeshStandardMaterial({ map: vaultTex, roughness: 0.15, metalness: 0.2 })
        );
        screen.rotation.x = -0.32;
        screen.position.set(0, 0.14, 0.17);
        vaultGroup.add(screen);
        registerPart(screen, new THREE.Vector3(0, 0.1, 0.65));

        const shieldGlass = new THREE.Mesh(new THREE.BoxGeometry(1.04, 1.66, 0.04), crystalMat);
        shieldGlass.rotation.x = -0.32;
        shieldGlass.position.set(0, 0, 0.21);
        shieldGlass.renderOrder = 4;
        vaultGroup.add(shieldGlass);
        registerPart(shieldGlass, new THREE.Vector3(0, 0.18, 0.95));

        const bioRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 16, 32), metalMat);
        bioRing.rotation.x = -0.32;
        bioRing.position.set(0, -0.58, 0.37);
        vaultGroup.add(bioRing);
        registerPart(bioRing, new THREE.Vector3(0, -0.15, 0.8));

        const sideRailL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.25, 0.2), metalMat);
        sideRailL.rotation.x = -0.32;
        sideRailL.position.set(-0.68, 0, 0);
        vaultGroup.add(sideRailL);
        registerPart(sideRailL, new THREE.Vector3(-0.55, 0, 0));

        const sideRailR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.25, 0.2), metalMat);
        sideRailR.rotation.x = -0.32;
        sideRailR.position.set(0.68, 0, 0);
        vaultGroup.add(sideRailR);
        registerPart(sideRailR, new THREE.Vector3(0.55, 0, 0));

        const orbitRing = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.016, 16, 72), metalMat);
        orbitRing.rotation.x = Math.PI / 2.4;
        vaultGroup.add(orbitRing);
        registerPart(orbitRing, new THREE.Vector3(0, 0.45, 0));

        productRoot.add(vaultGroup);
      }
    }

    buildProductModel(stateRef.current.modelType, stateRef.current.finish);

    rebuildModelRef.current = (type, finish) => {
      buildProductModel(type, finish);
      currentExplode = 0;
    };

    updateFinishRef.current = (finish) => {
      if (!primaryMetalMat) return;
      const f = FINISH_COLORS[finish];
      primaryMetalMat.color.setHex(f.metal);
      primaryMetalMat.roughness = f.roughness;
      primaryMetalMat.metalness = f.metalness;
      plinthTrimMat.color.setHex(f.metal);
    };

    applyPresetRef.current = (preset) => {
      const p = CAMERA_PRESETS[preset];
      _camGoal.set(...p.pos);
      _targetGoal.set(...p.target);
      cameraTransitionActive = true;
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || !gl.fenceSync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      controls.autoRotate = !isSoftwareGl && stateRef.current.autoRotate;
      controls.update();

      if (cameraTransitionActive) {
        camera.position.lerp(_camGoal, 1 - Math.exp(-6 * delta));
        controls.target.lerp(_targetGoal, 1 - Math.exp(-6 * delta));
        if (camera.position.distanceTo(_camGoal) < 0.02) {
          camera.position.copy(_camGoal);
          controls.target.copy(_targetGoal);
          cameraTransitionActive = false;
        }
      }

      currentExplode = THREE.MathUtils.damp(
        currentExplode,
        stateRef.current.explodeTarget,
        7.5,
        delta
      );

      for (let i = 0; i < explodableParts.length; i++) {
        const part = explodableParts[i];
        part.mesh.position.set(
          part.basePos.x + part.explodeOffset.x * currentExplode,
          part.basePos.y + part.explodeOffset.y * currentExplode,
          part.basePos.z + part.explodeOffset.z * currentExplode
        );
      }

      productRoot.position.y = Math.sin(elapsed * 1.4) * 0.035;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth;
      const h = Math.max(container.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      disposeGroup(productRoot);
      disposeGroup(stageGroup);
      shadowTex.dispose();
      dialTex.dispose();
      plaqueTex.dispose();
      vaultTex.dispose();
      grillTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    rebuildModelRef.current?.(product.model3d, selectedFinish);
  }, [product.id, product.model3d]);

  useEffect(() => {
    updateFinishRef.current?.(selectedFinish);
  }, [selectedFinish]);

  const handlePresetClick = (preset: CameraPreset) => {
    setCameraPreset(preset);
    applyPresetRef.current?.(preset);
  };

  return (
    <section id="showcase" className="py-6 lg:py-10">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-8 rounded-2xl border border-[#E1E3E5] bg-white p-6 shadow-xs lg:grid-cols-12 lg:p-8">
          {/* Right Column: Clean Minimal Product Pitch & Quick Buy */}
          <div className="space-y-6 lg:col-span-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#008060]">
                <ShieldCheck className="h-4 w-4" />
                <span>تجارة لا مركزية · دفع مضمون بالعقد الذكي</span>
              </div>

              <h1 className="font-display text-2xl font-extrabold leading-tight text-[#202223] sm:text-3xl lg:text-4xl">
                متجرك ثلاثي الأبعاد مع الدفع بالبلوك تشين
              </h1>

              <p className="text-sm leading-relaxed text-[#6D7175]">
                أنشئ قناة تلغرام لمتجرك، اعرض منتجاتك بتقنية 3D، أطلق بث تيك توك مباشر داخل القناة،
                واربط متاجر سلة وزد وShopify بسهولة.
              </p>
            </div>

            {/* Clean 2x2 Product Selector */}
            <div className="grid grid-cols-2 gap-3">
              {allProducts.slice(0, 4).map((item) => {
                const isActive = item.id === product.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectProduct(item);
                      onSelectFinish(item.finish);
                    }}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-start transition-colors ${
                      isActive
                        ? 'border-[#008060] bg-[#EBF5F2]'
                        : 'border-[#E1E3E5] bg-[#FAFBFB] hover:border-[#C9CCCF] hover:bg-white'
                    }`}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="h-11 w-11 shrink-0 rounded-lg object-cover bg-[#F6F6F7]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-[#202223]">{item.title}</div>
                      <div className="mt-0.5 font-mono-data text-xs font-semibold text-[#008060]">
                        {item.priceUSDC.toLocaleString()} USDC
                      </div>
                    </div>
                    {isActive && <Check className="h-4 w-4 shrink-0 text-[#008060]" />}
                  </button>
                );
              })}
            </div>

            {/* Active Product Price & Simple Actions */}
            <div className="flex flex-col gap-4 border-t border-[#E1E3E5] pt-5">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <div className="text-xs text-[#6D7175]">
                    {product.category} · متوفر {product.stock}
                  </div>
                  <h2 className="mt-1 font-display text-lg font-bold text-[#202223]">
                    {product.title}
                  </h2>
                </div>
                <div className="shrink-0 font-mono-data text-2xl font-bold text-[#008060]">
                  {product.priceUSDC.toLocaleString()} USDC
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onInstantBuy(product, selectedFinish)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#008060] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#006E52] whitespace-nowrap"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>شراء بالبلوك تشين</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddToCart(product, selectedFinish)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#C9CCCF] bg-white px-5 py-3 text-sm font-semibold text-[#202223] transition-colors hover:bg-[#F6F6F7] whitespace-nowrap"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>للسلة</span>
                </button>
              </div>
            </div>
          </div>

          {/* Left Column: Unobstructed 3D Viewport + Clean Toolbar BELOW Canvas */}
          <div className="flex flex-col gap-3 lg:col-span-7">
            <div className="relative h-[400px] w-full overflow-hidden rounded-2xl border border-[#E1E3E5] bg-[#0D1119] sm:h-[460px]">
              {webglError ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center">
                  <img
                    src={product.image}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="max-h-64 rounded-xl object-cover"
                  />
                  <p className="text-xs text-[#94A3B8]">معاينة ثنائية الأبعاد عالية الدقة</p>
                </div>
              ) : (
                <div ref={mountRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
              )}
            </div>

            {/* Clean Single-Row Control Bar Outside/Below the 3D Canvas (Zero Overlap) */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#E1E3E5] bg-[#FAFBFB] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Layers className="h-4 w-4 text-[#008060]" />
                <label
                  htmlFor="explode-range"
                  className="text-xs font-semibold text-[#202223] whitespace-nowrap"
                >
                  تفكيك 3D
                </label>
                <input
                  id="explode-range"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={explodeAmount}
                  onChange={(e) => setExplodeAmount(parseFloat(e.target.value))}
                  className="h-1.5 w-24 cursor-pointer accent-[#008060]"
                />
              </div>

              <div className="flex items-center gap-2">
                {(Object.keys(FINISH_LABELS) as ProductFinish[]).map((fKey) => {
                  const active = selectedFinish === fKey;
                  return (
                    <button
                      key={fKey}
                      type="button"
                      title={FINISH_LABELS[fKey].label}
                      onClick={() => onSelectFinish(fKey)}
                      className={`h-5 w-5 rounded-full border-2 transition-transform ${
                        active
                          ? 'scale-110 border-[#202223] ring-2 ring-[#008060]/30'
                          : 'border-[#C9CCCF] hover:scale-105'
                      }`}
                      style={{ backgroundColor: FINISH_LABELS[fKey].hex }}
                      aria-label={FINISH_LABELS[fKey].label}
                    />
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5">
                <Camera className="me-1 h-4 w-4 text-[#6D7175]" />
                {(Object.keys(CAMERA_PRESETS) as CameraPreset[]).map((pKey) => (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => handlePresetClick(pKey)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                      cameraPreset === pKey
                        ? 'bg-[#008060] text-white'
                        : 'border border-[#E1E3E5] bg-white text-[#202223] hover:bg-[#F1F2F4]'
                    }`}
                  >
                    {CAMERA_PRESETS[pKey].label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAutoRotate((prev) => !prev)}
                  title="تدوير تلقائي"
                  className={`rounded-lg border p-1.5 transition-colors ${
                    autoRotate
                      ? 'border-[#008060] bg-[#EBF5F2] text-[#008060]'
                      : 'border-[#E1E3E5] bg-white text-[#6D7175]'
                  }`}
                  aria-label="تدوير تلقائي"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
