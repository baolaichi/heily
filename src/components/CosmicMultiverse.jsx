import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import {
  Sparkles, Heart, RotateCcw, Plus, X, Maximize2, Minimize2,
  Send, Compass, Stars, ArrowRight, Volume2, VolumeX, Eye
} from 'lucide-react';
import { useCouple } from '../context/CoupleContext';

// Danh sách ảnh của bạn đặt trong thư mục public/img kèm các từ khen ngợi dễ thương
const DEFAULT_PHOTOS = [
  {
    url: "dist/img/photo1.jpg",
    caption: "Xinh đẹp ✨"
  },
  {
    url: "dist/img/photo2.jpg",
    caption: "Đặc biệt 💕"
  },
  {
    url: "dist/img/photo3.jpg",
    caption: "Rấc iu 🥰"
  },
  {
    url: "dist/img/photo4.jpg",
    caption: "Rạng rỡ 🌸"
  },
  {
    url: "dist/img/photo5.jpg",
    caption: "Dịu dàng 🌷"
  }
];

// Lời chúc 20/10 chân thành, ngọt ngào, không sến
const DEFAULT_WISHES = [
  "Chúc cô gái của anh 20/10 thật nhiều niềm vui và luôn rạng rỡ thế này nhé! 🌸",
  "Hôm nay 20/10 chúc em luôn suôn sẻ trong công việc và bớt áp lực lại nha ✨",
  "Cảm ơn em vì luôn là hậu phương vững chắc và mang lại bình yên cho anh 💖",
  "Chúc người yêu của anh lúc nào cũng tự tin, xinh đẹp và đạt được điều mình muốn 🌷",
  "Mong rằng mỗi ngày bên nhau đều là một ngày nhẹ nhàng và vui vẻ như hôm nay 🥰",
  "20/10 chúc em luôn được yêu thương, chiều chuộng và luôn mỉm cười thật tươi 🍀",
  "Cố lên nhé cô bé, anh luôn ở đây ủng hộ và đồng hành cùng em mọi lúc 💪",
  "Chúc hai đứa mình lúc nào cũng thấu hiểu, nhường nhịn và đồng hành thật lâu nhé 💌",
  "Chúc em 20/10 ngập tràn năng lượng tích cực và luôn là chính mình 🌟",
  "Hôm nay 20/10 không cần chúc gì quá lớn lao, chỉ mong em luôn bình an và hạnh phúc 💕"
];

class SoundFX {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playChimes() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [1046.5, 1318.5, 1567.98, 1760.0, 2093.0];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.3);
    });
  }

  playPop() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.1);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }
}

const sfx = new SoundFX();

export default function CosmicMultiverse({ onBackToHome }) {
  const { coupleData, myRole } = useCouple();

  const [stage, setStage] = useState(1);
  const [isLetterOpened, setIsLetterOpened] = useState(false);
  const [isBouquetBloomed, setIsBouquetBloomed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [activeModalItem, setActiveModalItem] = useState(null);
  const [isAddWishModalOpen, setIsAddWishModalOpen] = useState(false);
  const [newWishText, setNewWishText] = useState('');

  const [customWishes, setCustomWishes] = useState(() => {
    try {
      const saved = localStorage.getItem('heily_custom_wishes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allWishes = [...DEFAULT_WISHES, ...customWishes];

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const threeStateRef = useRef({
    renderer: null,
    scene: null,
    camera: null,
    universeGroup: null,
    interactiveMeshes: [],
    petals: [],
    animId: null,
    isDragging: false,
    prevMousePos: { x: 0, y: 0 },
    targetRotX: 0,
    targetRotY: 0,
    currentRotX: 0,
    currentRotY: 0,
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
  });

  const toggleSound = () => {
    sfx.isMuted = !isMuted;
    setIsMuted(!isMuted);
  };

  const boyName = coupleData.boy?.nickname || coupleData.boy?.name || 'Anh';
  const girlName = coupleData.girl?.nickname || coupleData.girl?.name || 'Thúy Hương';
  const letterToName = myRole === 'girl' ? boyName : girlName;
  const letterFromName = myRole === 'girl' ? girlName : boyName;

  // Mở thư
  const handleOpenEnvelope = () => {
    if (isLetterOpened) return;
    sfx.playPop();
    setIsLetterOpened(true);

    const waxSeal = document.getElementById('cosmicWaxSeal');
    const flap = document.getElementById('cosmicFlap');
    const letter = document.getElementById('cosmicLetter');

    if (waxSeal) waxSeal.style.opacity = '0';
    if (flap) {
      flap.style.transform = 'rotateX(180deg)';
      flap.style.zIndex = '1';
    }

    setTimeout(() => {
      if (letter) {
        const isMobile = window.innerWidth < 640;
        letter.style.transform = isMobile ? 'translateY(-55px)' : 'translateY(-80px)';
        letter.style.zIndex = '5';
      }
    }, 300);

    setTimeout(() => {
      setStage(2);
      sfx.playChimes();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#f43f5e', '#ec4899', '#fbcfe8', '#ffd166']
      });
    }, 5000);
  };

  // Bó hoa nhô lên từ vòng tròn
  const handleBouquetClick = () => {
    if (stage !== 2) return;

    if (!isBouquetBloomed) {
      setIsBouquetBloomed(true);
      sfx.playChimes();

      const bouquetElem = document.getElementById('centralBouquetCore');
      if (bouquetElem) {
        gsap.fromTo(bouquetElem,
          { y: 80, scale: 0.2, opacity: 0 },
          { y: 0, scale: 1, opacity: 1, duration: 1.2, ease: "back.out(1.7)" }
        );
      }

      confetti({
        particleCount: 80,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#ff4d6d', '#ff758f', '#ffd700']
      });

      const isMobile = window.innerWidth < 640;
      const sproutPositions = [
        { id: 'sprout-polaroid-0', x: isMobile ? -52 : -115, y: isMobile ? -42 : -70, rot: -12, delay: 0.3 },
        { id: 'sprout-polaroid-1', x: isMobile ? 52 : 115, y: isMobile ? -42 : -70, rot: 12, delay: 0.45 },
        { id: 'sprout-polaroid-2', x: isMobile ? -52 : -115, y: isMobile ? 42 : 70, rot: -8, delay: 0.6 },
        { id: 'sprout-polaroid-3', x: isMobile ? 52 : 115, y: isMobile ? 42 : 70, rot: 8, delay: 0.75 }
      ];

      sproutPositions.forEach(cfg => {
        const el = document.getElementById(cfg.id);
        if (el) {
          el.style.left = '50%';
          el.style.top = '50%';
          el.style.pointerEvents = 'auto';

          gsap.to(el, {
            x: cfg.x,
            y: cfg.y,
            rotation: cfg.rot,
            scale: 1,
            opacity: 1,
            duration: 1.2,
            delay: cfg.delay,
            ease: "elastic.out(1, 0.65)"
          });
        }
      });
    } else {
      transitionToMultiverse();
    }
  };

  const transitionToMultiverse = () => {
    sfx.playChimes();

    const count = 200;
    const defaults = { origin: { y: 0.5 } };
    function fire(particleRatio, opts) {
      confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
    }
    fire(0.25, { spread: 35, startVelocity: 60, colors: ['#ff007f', '#ffffff'] });
    fire(0.2, { spread: 70, colors: ['#ffd700', '#ff85a1'] });
    fire(0.35, { spread: 110, decay: 0.91, scalar: 0.8 });
    fire(0.2, { spread: 130, startVelocity: 30, colors: ['#a2d2ff', '#e0aaff'] });

    setIsFullscreen(true);
    setStage(3);
  };

  useEffect(() => {
    if (stage !== 3 || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const state = threeStateRef.current;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const isMobileViewport = width < 640 || width < height;
    const targetCameraZ = isMobileViewport ? 450 : 380;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 3000);
    camera.position.z = targetCameraZ;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const universeGroup = new THREE.Group();
    scene.add(universeGroup);

    state.scene = scene;
    state.camera = camera;
    state.renderer = renderer;
    state.universeGroup = universeGroup;
    state.interactiveMeshes = [];
    state.petals = [];

    gsap.fromTo(camera.position, { z: 1000 }, { z: targetCameraZ, duration: 2.2, ease: "power3.out" });

    // Starfield
    const starCount = 1500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starPalette = [
      new THREE.Color('#ffb3c6'),
      new THREE.Color('#f72585'),
      new THREE.Color('#ffd166'),
      new THREE.Color('#ffffff'),
      new THREE.Color('#e0aaff')
    ];

    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 1400;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 1400;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 1400;

      const c = starPalette[Math.floor(Math.random() * starPalette.length)];
      starColors[i * 3] = c.r;
      starColors[i * 3 + 1] = c.g;
      starColors[i * 3 + 2] = c.b;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const sCanvas = document.createElement('canvas');
    sCanvas.width = 16;
    sCanvas.height = 16;
    const sctx = sCanvas.getContext('2d');
    const grad = sctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 200, 230, 0.7)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 16, 16);
    const starTex = new THREE.CanvasTexture(sCanvas);

    const starMat = new THREE.PointsMaterial({
      size: 5,
      map: starTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const starField = new THREE.Points(starGeo, starMat);
    universeGroup.add(starField);

    // Floating Photos (Vũ trụ 360 độ)
    DEFAULT_PHOTOS.forEach((photoData, idx) => {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 512;
      pCanvas.height = 620;
      const pCtx = pCanvas.getContext('2d');

      pCtx.fillStyle = '#ffffff';
      pCtx.fillRect(0, 0, 512, 620);
      pCtx.strokeStyle = '#e6ca85';
      pCtx.lineWidth = 6;
      pCtx.strokeRect(6, 6, 500, 608);

      pCtx.fillStyle = '#2b1020';
      pCtx.fillRect(24, 24, 464, 464);

      const pTex = new THREE.CanvasTexture(pCanvas);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = photoData.url;
      img.onload = () => {
        pCtx.drawImage(img, 24, 24, 464, 464);
        pCtx.fillStyle = '#5c102a';
        pCtx.font = 'bold 36px "Montserrat", sans-serif';
        pCtx.textAlign = 'center';
        pCtx.fillText(photoData.caption, 256, 555);
        pTex.needsUpdate = true;
      };

      const geo = new THREE.PlaneGeometry(48, 58);
      const mat = new THREE.MeshBasicMaterial({ map: pTex, transparent: true });
      const mesh = new THREE.Mesh(geo, mat);

      const phi = Math.acos(-1 + (2 * idx) / DEFAULT_PHOTOS.length);
      const theta = Math.sqrt(DEFAULT_PHOTOS.length * Math.PI) * phi;
      const radius = 180 + (idx % 2) * 30;

      mesh.position.set(
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(phi)
      );

      mesh.userData = { type: 'photo', data: photoData };
      state.interactiveMeshes.push(mesh);
      universeGroup.add(mesh);
    });

    // Floating Wishes
    const wishesToRender = allWishes;
    wishesToRender.forEach((wishText, idx) => {
      const wCanvas = document.createElement('canvas');
      wCanvas.width = 640;
      wCanvas.height = 220;
      const wCtx = wCanvas.getContext('2d');

      const bgGrad = wCtx.createLinearGradient(0, 0, 640, 220);
      bgGrad.addColorStop(0, '#ffffff');
      bgGrad.addColorStop(0.3, '#fce7f3');
      bgGrad.addColorStop(1, '#fbcfe8');
      wCtx.fillStyle = bgGrad;

      if (wCtx.roundRect) {
        wCtx.roundRect(10, 10, 620, 200, 30);
      } else {
        wCtx.fillRect(10, 10, 620, 200);
      }
      wCtx.fill();

      wCtx.strokeStyle = '#e6ca85';
      wCtx.lineWidth = 6;
      wCtx.stroke();

      wCtx.fillStyle = '#eab308';
      wCtx.font = '28px sans-serif';
      wCtx.fillText('★', 45, 60);
      wCtx.fillText('★', 595, 60);

      wCtx.fillStyle = '#4a0e2e';
      wCtx.font = 'bold 30px "Montserrat", sans-serif';
      wCtx.textAlign = 'center';

      let line1 = wishText;
      let line2 = "";
      if (wishText.length > 24) {
        const splitIdx = wishText.lastIndexOf(' ', 24);
        if (splitIdx !== -1) {
          line1 = wishText.substring(0, splitIdx);
          line2 = wishText.substring(splitIdx + 1);
        }
      }

      if (line2) {
        wCtx.fillText(line1, 320, 95);
        wCtx.font = 'bold 26px "Montserrat", sans-serif';
        wCtx.fillStyle = '#701a35';
        wCtx.fillText(line2, 320, 145);
      } else {
        wCtx.fillText(line1, 320, 120);
      }

      const wTex = new THREE.CanvasTexture(wCanvas);
      const geo = new THREE.PlaneGeometry(58, 20);
      const mat = new THREE.MeshBasicMaterial({ map: wTex, transparent: true, opacity: 0.95 });
      const mesh = new THREE.Mesh(geo, mat);

      const phi = Math.acos(-1 + (2 * (idx + 0.5)) / wishesToRender.length);
      const theta = Math.sqrt(wishesToRender.length * Math.PI) * phi + 1.2;
      const radius = 215 + (idx % 3) * 30;

      mesh.position.set(
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(phi)
      );

      mesh.userData = { type: 'wish', data: wishText };
      state.interactiveMeshes.push(mesh);
      universeGroup.add(mesh);
    });

    // Petals falling
    const petalShape = new THREE.Shape();
    petalShape.moveTo(0, 0);
    petalShape.bezierCurveTo(6, 10, 10, 18, 0, 26);
    petalShape.bezierCurveTo(-10, 18, -6, 10, 0, 0);

    const petalGeo = new THREE.ShapeGeometry(petalShape, 8);
    const petalMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#f472b6'),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });

    for (let i = 0; i < 35; i++) {
      const petal = new THREE.Mesh(petalGeo, petalMat.clone());
      const s = Math.random() * 0.25 + 0.2;
      petal.scale.set(s, s, s);

      petal.position.set(
        (Math.random() - 0.5) * 400,
        Math.random() * 400 - 200,
        (Math.random() - 0.5) * 250
      );

      petal.userData = {
        speedY: Math.random() * 0.8 + 0.3,
        rotX: (Math.random() - 0.5) * 0.02,
        rotY: (Math.random() - 0.5) * 0.02
      };

      state.petals.push(petal);
      scene.add(petal);
    }

    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let dragDistance = 0;

    const onStart = (clientX, clientY) => {
      isDragging = true;
      dragDistance = 0;
      prevMousePos = { x: clientX, y: clientY };
    };

    const onMove = (clientX, clientY) => {
      if (!isDragging) return;
      const deltaX = clientX - prevMousePos.x;
      const deltaY = clientY - prevMousePos.y;
      dragDistance += Math.abs(deltaX) + Math.abs(deltaY);

      state.targetRotY += deltaX * 0.005;
      state.targetRotX += deltaY * 0.005;

      prevMousePos = { x: clientX, y: clientY };
    };

    const onEnd = () => {
      isDragging = false;
    };

    const handleMouseDown = (e) => onStart(e.clientX, e.clientY);
    const handleMouseMove = (e) => onMove(e.clientX, e.clientY);
    const handleMouseUp = () => onEnd();

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        onStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => onEnd();

    const handleCanvasClick = (e) => {
      if (dragDistance > 10) return;

      const rect = canvas.getBoundingClientRect();
      state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      state.raycaster.setFromCamera(state.mouse, camera);
      const intersects = state.raycaster.intersectObjects(state.interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        sfx.playPop();
        setActiveModalItem(hit.userData);
      }
    };

    const handleWheel = (e) => {
      camera.position.z += e.deltaY * 0.25;
      camera.position.z = Math.max(140, Math.min(500, camera.position.z));
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('wheel', handleWheel, { passive: true });

    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      state.currentRotX += (state.targetRotX - state.currentRotX) * 0.08;
      state.currentRotY += (state.targetRotY - state.currentRotY) * 0.08;

      if (!isDragging) {
        state.targetRotY += 0.0012;
      }

      universeGroup.rotation.x = state.currentRotX;
      universeGroup.rotation.y = state.currentRotY;

      const invGroupQuat = universeGroup.quaternion.clone().invert();
      const billboardQuat = invGroupQuat.multiply(camera.quaternion);

      for (let mesh of state.interactiveMeshes) {
        mesh.quaternion.copy(billboardQuat);
      }

      for (let petal of state.petals) {
        petal.position.y -= petal.userData.speedY;
        petal.rotation.x += petal.userData.rotX;
        petal.rotation.y += petal.userData.rotY;

        if (petal.position.y < -220) {
          petal.position.y = 220;
          petal.position.x = (Math.random() - 0.5) * 400;
        }
      }

      renderer.render(scene, camera);
      state.animId = requestAnimationFrame(animate);
    };

    state.animId = requestAnimationFrame(animate);

    return () => {
      if (state.animId) cancelAnimationFrame(state.animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
      if (canvas) {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('click', handleCanvasClick);
        canvas.removeEventListener('wheel', handleWheel);
      }
      renderer.dispose();
    };
  }, [stage, allWishes.length]);

  const handleBurstMultiverse = () => {
    sfx.playChimes();
    confetti({
      particleCount: 90,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#ff4d6d', '#ff758f', '#ffb3c1', '#ffd700']
    });
  };

  const handleSaveCustomWish = (e) => {
    e.preventDefault();
    if (!newWishText.trim()) return;

    const trimmed = newWishText.trim();
    const updated = [...customWishes, trimmed];
    setCustomWishes(updated);
    try {
      localStorage.setItem('heily_custom_wishes', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setNewWishText('');
    setIsAddWishModalOpen(false);
    sfx.playChimes();

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#f43f5e', '#ec4899', '#fde047']
    });
  };

  const handleReplay = () => {
    setStage(1);
    setIsLetterOpened(false);
    setIsBouquetBloomed(false);
    setIsFullscreen(false);
  };

  const isActualFullscreen = isFullscreen || stage === 3;

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none transition-all duration-300 rounded-2xl sm:rounded-3xl ${isActualFullscreen
        ? 'fixed inset-0 z-50 bg-[#090207] min-h-[100dvh] w-screen h-[100dvh]'
        : 'h-[calc(100vh-140px)] sm:h-[480px] max-h-[520px] min-h-[350px] bg-gradient-to-b from-[#200517] via-[#12020e] to-[#080106] border border-pink-500/35 shadow-2xl my-1'
        }`}
      style={{
        background: 'radial-gradient(circle at center, #2e0921 0%, #150310 50%, #080106 100%)'
      }}
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full z-10 cursor-grab active:cursor-grabbing ${stage === 3 ? 'block' : 'hidden'
          }`}
      />

      {/* Top Header / Bar */}
      <div className="absolute top-0 left-0 right-0 z-40 px-3 py-1.5 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-pink-400/40 flex items-center justify-center bg-pink-950/60 backdrop-blur-md shadow-lg text-pink-300">
            <Sparkles className="w-3 h-3 text-pink-300" />
          </div>
          <div>
            <h2 className="text-[9px] sm:text-[11px] tracking-[0.15em] uppercase text-pink-200 font-cinzel font-bold">
              Vũ Trụ Lời Chúc 20/10
            </h2>
            <p className="text-[7px] sm:text-[8px] text-pink-300/70 tracking-wider">
              {stage === 1 ? 'Chương I: Lá Thư' : stage === 2 ? 'Chương II: Bó Hoa' : 'Chương III: 360°'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSound}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-950/60 border border-pink-400/30 hover:bg-white/15 transition shadow-lg text-[9px] sm:text-xs text-pink-200 cursor-pointer"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-2.5 h-2.5 text-pink-400" /> : <Volume2 className="w-2.5 h-2.5 text-yellow-300 animate-pulse" />}
            <span className="hidden sm:inline">{isMuted ? 'Tắt' : 'Bật'}</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isActualFullscreen)}
            className="p-1 rounded-full bg-pink-950/60 border border-pink-400/30 hover:bg-white/15 transition shadow-lg text-pink-200 cursor-pointer"
            title={isActualFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isActualFullscreen ? <Minimize2 className="w-2.5 h-2.5 text-pink-300" /> : <Maximize2 className="w-2.5 h-2.5 text-pink-300" />}
          </button>

          {onBackToHome && (
            <button
              onClick={() => {
                setIsFullscreen(false);
                onBackToHome();
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white border border-rose-300/60 shadow-lg text-[9px] sm:text-xs font-semibold transition active:scale-95 cursor-pointer"
              title="Thoát khỏi trang"
            >
              <X className="w-2.5 h-2.5" />
              <span>Thoát</span>
            </button>
          )}
        </div>
      </div>

      {/* STAGE 1: ENVELOPE */}
      {stage === 1 && (
        <div className="relative z-30 flex flex-col items-center justify-center h-full px-2 pt-6 pb-2 animate-in fade-in duration-700">
          <div className="text-center mb-1">
            <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.15em] text-pink-300 font-cinzel">
              Mừng Ngày Phụ Nữ Việt Nam 20/10
            </span>
            <h3 className="text-sm sm:text-xl font-serif-title italic gold-glow text-pink-100 mt-0.5">
              Gửi {letterToName} Yêu Thương
            </h3>
            <p className="text-[8px] sm:text-[10px] text-pink-200/80">
              Chúc em ngày 20/10 thật nhiều niềm vui, luôn rạng rỡ và luôn bình yên nhé! 💕
            </p>
          </div>

          <div
            onClick={handleOpenEnvelope}
            className="envelope-wrapper my-1 animate-float cursor-pointer hover:scale-105 transition-transform scale-[0.65] sm:scale-80"
          >
            <div className="cosmic-envelope" id="cosmicEnvelope">
              <div className="flap" id="cosmicFlap"></div>
              <div className="cosmic-wax-seal" id="cosmicWaxSeal">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-200 fill-current animate-pulse" />
              </div>
              <div className="pocket"></div>
              <div className="cosmic-letter flex flex-col justify-between" id="cosmicLetter">
                <div>
                  <div className="flex items-center justify-between border-b border-pink-200/50 pb-0.5 mb-0.5">
                    <span className="text-[8px] sm:text-[10px] tracking-widest text-pink-800 font-cinzel uppercase font-semibold">
                      Gửi {letterToName}
                    </span>
                    <span className="text-[8px] sm:text-[10px] text-pink-600 font-serif italic">
                      From {letterFromName}
                    </span>
                  </div>
                  <p className="font-handwriting text-xs sm:text-base text-pink-950 font-bold leading-snug">
                    "Chúc mừng 20/10 Thúy Hương của anh! Cảm ơn em vì đã luôn đồng hành, mang lại nụ cười và sự bình yên mỗi ngày. Mong mọi điều tuyệt vời nhất luôn đến với em..."
                  </p>
                </div>
                <div className="text-right text-[8px] sm:text-[10px] text-pink-700 italic font-medium flex items-center justify-end gap-1">
                  <span>
                    {isLetterOpened ? "Đang chuyển chương II..." : "Chạm để đọc lá thư"}
                  </span>
                  <ArrowRight className="w-2.5 h-2.5 inline ml-0.5" />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (isLetterOpened) setStage(2);
              else handleOpenEnvelope();
            }}
            className="mt-1 flex items-center gap-1 text-pink-300 text-[8px] sm:text-[11px] bg-pink-950/50 px-3 py-1 rounded-full border border-pink-400/30 backdrop-blur-md hover:bg-pink-900/60 transition cursor-pointer"
          >
            <Sparkles className="w-2.5 h-2.5 text-yellow-300 animate-spin" />
            <span>{isLetterOpened ? "Sang Chương II (Bó Hoa) ngay" : "Chạm vào phong bì để mở thư"}</span>
          </button>
        </div>
      )}

      {/* STAGE 2: BOUQUET SPROUTING FROM MAGIC CIRCLE */}
      {stage === 2 && (
        <div className="relative z-30 flex flex-col items-center justify-center h-full px-2 pt-6 pb-2 animate-in fade-in duration-700">
          <div className="text-center mb-1">
            <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.15em] text-pink-300 font-cinzel">
              Chương II: Bó Hoa Kỷ Niệm 20/10
            </span>
            <h3 className="text-sm sm:text-xl font-serif-title italic gold-glow text-pink-100 mt-0.5">
              {!isBouquetBloomed ? "Chạm Vòng Tròn Để Nở Bó Hoa" : "Bó Hoa Đang Nở Rạng Rỡ ✨"}
            </h3>
            <p className="text-[8px] sm:text-[10px] text-pink-200/80">
              Chạm vào vòng tròn ma thuật để bó hoa tươi thắm nhô lên cùng các bức hình kỷ niệm! 💐
            </p>
          </div>

          <div className="relative w-52 h-52 sm:w-68 sm:h-68 flex items-center justify-center my-1">
            {/* Các ảnh từ public/img kèm từ khen ngợi bung ra bọc quanh bó hoa */}
            {DEFAULT_PHOTOS.slice(0, 4).map((p, idx) => (
              <div
                key={idx}
                id={`sprout-polaroid-${idx}`}
                onClick={() => {
                  sfx.playPop();
                  setActiveModalItem({ type: 'photo', data: p });
                }}
                className="absolute w-20 sm:w-26 bg-white p-1 rounded-lg shadow-2xl border-2 border-pink-300 cursor-pointer hover:scale-110 transition-transform opacity-0 pointer-events-none z-30"
                style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%) scale(0.2)' }}
              >
                <div className="aspect-square bg-pink-950 overflow-hidden rounded-md mb-1">
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="text-[9px] text-pink-950 font-bold text-center truncate font-sans">
                  {p.caption}
                </p>
              </div>
            ))}

            {/* Vòng tròn ban đầu -> Chạm để bó hoa trồi lên */}
            <div
              onClick={handleBouquetClick}
              className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-rose-600 via-pink-500 to-amber-300 p-2 shadow-[0_0_40px_rgba(244,63,94,0.7)] cursor-pointer animate-pulse hover:scale-105 transition-transform z-20 flex items-center justify-center border-2 border-white/60"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-b from-[#250618] to-[#12020e] flex flex-col items-center justify-center p-2 text-center border border-pink-400/40">
                {!isBouquetBloomed ? (
                  /* Vòng tròn ma thuật ban đầu */
                  <div className="flex flex-col items-center justify-center">
                    <Stars className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300 animate-spin mb-1" />
                    <span className="text-[8px] sm:text-[10px] text-pink-200 font-cinzel font-bold leading-tight">
                      Chạm Để Nở Hoa
                    </span>
                  </div>
                ) : (
                  /* Bó hoa hồng nhô lên từ vòng tròn */
                  <div id="centralBouquetCore" className="flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <span className="text-2xl sm:text-3xl animate-bounce">💐</span>
                      <Heart className="w-4 h-4 text-pink-400 fill-pink-500 animate-pulse" />
                    </div>
                    <span className="text-[8px] sm:text-[10px] text-pink-200 font-cinzel font-bold leading-tight">
                      Vào Vũ Trụ 3D
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            {!isBouquetBloomed ? (
              <button
                onClick={handleBouquetClick}
                className="flex items-center gap-1 px-4 py-1 sm:px-5 sm:py-1.5 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-medium text-[11px] shadow-xl border border-pink-300/40 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <span>Nở Bó Hoa 20/10</span>
              </button>
            ) : (
              <button
                onClick={transitionToMultiverse}
                className="flex items-center gap-1 px-4 py-1 sm:px-5 sm:py-1.5 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-semibold text-[11px] shadow-2xl border border-yellow-300/60 cursor-pointer animate-pulse"
              >
                <Compass className="w-3 h-3 text-yellow-200" />
                <span>Khám Phá Vũ Trụ Đa Hình Ảnh 360°</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* STAGE 3: UI OVERLAYS FOR 3D MULTIVERSE */}
      {stage === 3 && (
        <div className="absolute bottom-2 left-0 right-0 z-30 flex flex-col items-center pointer-events-none px-3">
          <div className="bg-pink-950/75 backdrop-blur-md border border-pink-400/30 px-3 py-1 rounded-full shadow-2xl flex items-center gap-2 pointer-events-auto">
            <button
              onClick={handleBurstMultiverse}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white text-[9px] sm:text-xs font-semibold shadow transition cursor-pointer"
            >
              <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
              <span>Pháo Hoa ✨</span>
            </button>

            <button
              onClick={() => setIsAddWishModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-[9px] sm:text-xs font-semibold shadow transition cursor-pointer"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>Thêm Chúc 💌</span>
            </button>

            <button
              onClick={handleReplay}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-pink-200 text-[9px] sm:text-xs transition cursor-pointer"
              title="Xem lại từ đầu"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">Xem Lại</span>
            </button>
          </div>
          <p className="text-[7px] sm:text-[8px] text-pink-300/70 mt-1 text-center drop-shadow">
            💡 Vuốt xoay 360° • Cuộn phóng to/thu nhỏ • Chạm thẻ xem chi tiết
          </p>
        </div>
      )}

      {/* MODAL: VIEW PHOTO OR WISH DETAIL */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xs bg-gradient-to-b from-[#2b0c20] to-[#12020e] border border-pink-400/50 rounded-2xl p-3.5 shadow-2xl text-center">
            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute top-2.5 right-2.5 p-1 rounded-full bg-pink-950/80 hover:bg-pink-900 text-pink-200 border border-pink-400/35 transition cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>

            {activeModalItem.type === 'photo' ? (
              <div className="flex flex-col items-center">
                <div className="w-full bg-white p-2 rounded-xl shadow-2xl border border-pink-200 mb-2 transform rotate-1">
                  <div className="aspect-square bg-pink-950 rounded-lg overflow-hidden mb-1">
                    <img src={activeModalItem.data.url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <p className="font-sans text-sm sm:text-base text-pink-950 font-bold">
                    {activeModalItem.data.caption}
                  </p>
                </div>
                <p className="text-[9px] text-pink-300 italic">
                  Khoảnh khắc tuyệt vời trong hành trình của hai đứa 💕
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-2">
                <div className="w-8 h-8 rounded-full bg-pink-900/60 border border-pink-400/40 flex items-center justify-center mb-2">
                  <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-500 animate-pulse" />
                </div>
                <h4 className="text-[8px] uppercase tracking-[0.2em] text-pink-300 font-cinzel mb-1">
                  Lời Chúc 20/10
                </h4>
                <p className="text-xs sm:text-sm font-serif text-pink-100 leading-relaxed italic px-1 mb-2">
                  "{activeModalItem.data}"
                </p>
                <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent"></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM WISH */}
      {isAddWishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xs bg-gradient-to-b from-[#2b0c20] to-[#12020e] border border-pink-400/50 rounded-2xl p-3.5 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <h3 className="text-xs font-serif-title font-bold text-pink-100">
                  Thêm Lời Chúc Vào Vũ Trụ
                </h3>
              </div>
              <button
                onClick={() => setIsAddWishModalOpen(false)}
                className="p-1 rounded-full bg-pink-950/80 hover:bg-pink-900 text-pink-200 border border-pink-400/30 transition cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomWish}>
              <textarea
                value={newWishText}
                onChange={(e) => setNewWishText(e.target.value)}
                placeholder="Nhập lời chúc 20/10 ngọt ngào gửi người yêu..."
                rows={2}
                className="w-full bg-pink-950/50 border border-pink-400/30 rounded-xl p-2 text-pink-100 text-xs placeholder-pink-400/50 focus:outline-none focus:border-pink-400 resize-none mb-2"
                maxLength={120}
                required
              />
              <div className="flex items-center justify-between">
                <span className="text-[8px] text-pink-300/70">
                  {120 - newWishText.length} ký tự
                </span>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-3.5 py-1 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-[11px] font-semibold shadow-lg transition cursor-pointer"
                >
                  <Send className="w-2.5 h-2.5" />
                  <span>Gửi Vào Vũ Trụ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}