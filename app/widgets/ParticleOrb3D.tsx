"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  size?: number;
  particles?: number;
  intensity?: number;
  colorA?: string;
  colorB?: string;
  spin?: number;
  className?: string;
};

export default function ParticleOrb3D({
  size = 128,
  particles = 1800,
  intensity = 1.1,
  colorA = "#67e8f9",
  colorB = "#d8b4fe",
  spin = 1.1,
  className = "",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number>();

  useEffect(() => {
    const wrap = wrapRef.current!;
    const S = Math.min(150, Math.max(72, Math.floor(size)));

    // Renderer (โปร่งใสจริง)
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(S, S, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const cvs = renderer.domElement;
    Object.assign(cvs.style, {
      display: "block",
      width: `${S}px`,
      height: `${S}px`,
      borderRadius: "9999px",
      background: "transparent",
      // !! ไม่ใช้ mix-blend-mode แล้ว เพื่อกันทั้งผืนกลายเป็นสีขาว
      willChange: "transform, opacity",
    } as CSSStyleDeclaration);
    wrap.appendChild(cvs);

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    cam.position.z = 5;

    const root = new THREE.Group();
    scene.add(root);

    // จุดบนทรงกลม (Fibonacci)
    const N = Math.max(600, particles);
    const pos = new Float32Array(N * 3);
    const aSize = new Float32Array(N);
    const aSeed = new Float32Array(N);
    const PHI = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < N; i++) {
      const t = (i + 0.5) / N;
      const lat = Math.acos(1 - 2 * t);
      const lon = (2 * Math.PI * i) / PHI;
      const x = Math.sin(lat) * Math.cos(lon);
      const y = Math.cos(lat);
      const z = Math.sin(lat) * Math.sin(lon);
      pos[i * 3 + 0] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      aSize[i] = 1.4 + Math.random() * 2.8;
      aSeed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(aSize, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending, // แสงซ้อนเฉพาะพิกเซล ไม่ต้องพึ่ง CSS blend
      uniforms: {
        uTime: { value: 0 },
        uRadius: { value: 1.22 },
        uColorA: { value: new THREE.Color(colorA) },
        uColorB: { value: new THREE.Color(colorB) },
        uIntensity: { value: intensity },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aSeed;
        uniform float uTime;
        uniform float uRadius;
        varying float vSeed;
        varying float vNoise;

        float h(float n){ return fract(sin(n)*43758.5453123); }
        float noise(vec3 x){
          vec3 p=floor(x), f=fract(x);
          f=f*f*(3.0-2.0*f);
          float n=p.x+p.y*57.0+113.0*p.z;
          float res=mix(mix(mix(h(n+0.0),h(n+1.0),f.x),
                            mix(h(n+57.0),h(n+58.0),f.x),f.y),
                        mix(mix(h(n+113.0),h(n+114.0),f.x),
                            mix(h(n+170.0),h(n+171.0),f.x),f.y),f.z);
          return res;
        }

        void main(){
          vSeed=aSeed;
          float n=noise(normalize(position)*2.0 + vec3(uTime*0.45,uTime*0.27,uTime*0.31) + aSeed*6.0);
          vNoise=n;
          vec3 p=normalize(position)*(uRadius + (n-0.5)*0.32);
          vec4 mv=modelViewMatrix*vec4(p,1.0);
          gl_Position=projectionMatrix*mv;
          float ps=aSize*(1.0+(n-0.5)*0.8);
          gl_PointSize=ps*(300.0/-mv.z);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying float vSeed;
        varying float vNoise;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform float uIntensity;

        void main(){
          vec2 uv=gl_PointCoord*2.0-1.0;
          float r=length(uv);
          if(r>1.0) discard;
          float edge=smoothstep(1.0,0.18,r);
          float t=clamp(vNoise*0.7+vSeed*0.3,0.0,1.0);
          vec3 col=mix(uColorA,uColorB,t)*(0.7+vNoise*0.7);
          gl_FragColor=vec4(col*uIntensity, edge*0.95);
        }
      `,
    });

    const points = new THREE.Points(geo, mat);
    root.add(points);

    // แกนกลางจาง ๆ ให้รู้สึกเป็นทรงกลม
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.82, 32, 32),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorA).lerp(new THREE.Color(colorB), 0.35),
        transparent: true,
        opacity: 0.10,
      })
    );
    root.add(core);

    // Aura (วงกลม + mask)
    const aura = document.createElement("div");
    Object.assign(aura.style, {
      position: "absolute",
      inset: "0",
      borderRadius: "9999px",
      pointerEvents: "none",
      filter: "blur(12px)",
      background:
        "radial-gradient(40% 40% at 65% 70%, rgba(216,180,252,.22), rgba(0,0,0,0) 70%)," +
        "radial-gradient(35% 35% at 30% 30%, rgba(103,232,249,.20), rgba(0,0,0,0) 70%)",
      maskImage: "radial-gradient(circle at 50% 50%, #000 70%, transparent 88%)",
      WebkitMaskImage: "radial-gradient(circle at 50% 50%, #000 70%, transparent 88%)",
      backgroundClip: "padding-box",
    } as CSSStyleDeclaration);
    wrap.appendChild(aura);

    // โต้ตอบเมาส์
    let targetRX = 0, targetRY = 0;
    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRY = x * 0.9;
      targetRX = -y * 0.7;
    };
    wrap.addEventListener("pointermove", onMove);

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const t0 = performance.now();
    const tick = () => {
      raf.current = requestAnimationFrame(tick);
      const t = (performance.now() - t0) / 1000;
      (mat.uniforms.uTime as any).value = t;

      root.rotation.y += 0.012 * spin;
      root.rotation.x += 0.005 * spin;
      root.rotation.y += (targetRY - root.rotation.y) * 0.06;
      root.rotation.x += (targetRX - root.rotation.x) * 0.06;

      const s = 1 + (reduce ? 0 : Math.sin(t * 1.3) * 0.02);
      root.scale.setScalar(s);

      renderer.render(scene, cam);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf.current!);
      wrap.removeEventListener("pointermove", onMove);
      wrap.contains(aura) && wrap.removeChild(aura);
      wrap.contains(cvs) && wrap.removeChild(cvs);
      geo.dispose();
      (mat as any).dispose?.();
      renderer.dispose();
    };
  }, [size, particles, intensity, colorA, colorB, spin]);

  const S = Math.min(150, Math.max(72, Math.floor(size)));
  return (
    <div
      ref={wrapRef}
      className={["ai-orb", className].filter(Boolean).join(" ")}
      style={{
        width: S,
        height: S,
        borderRadius: "9999px",
        overflow: "visible",
        background: "transparent",
        isolation: "isolate", // 🔑 แยกชั้น blend กันกลายเป็นวงกลมขาว
        filter: "drop-shadow(0 8px 28px rgba(103,232,249,.35))",
      }}
      aria-label="AI energy orb"
    />
  );
}
