import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './LightPillar.css';

export default function LightPillar({
  topColor = '#2563eb',
  bottomColor = '#38bdf8',
  intensity = 0.55,
  rotationSpeed = 0.18,
  interactive = false,
  className = '',
  glowAmount = 0.005,
  pillarWidth = 3,
  pillarHeight = 0.4,
  noiseIntensity = 0.35,
  mixBlendMode = 'screen',
  pillarRotation = 0,
  quality = 'medium',
}) {
  const containerRef = useRef(null);
  const speedRef = useRef(rotationSpeed);
  useEffect(() => { speedRef.current = rotationSpeed; }, [rotationSpeed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    const settings = quality === 'low' || mobile
      ? { iterations: 24, waves: 1, pixelRatio: 0.5, precision: 'mediump', step: 1.5 }
      : { iterations: 40, waves: 2, pixelRatio: Math.min(window.devicePixelRatio, 1.5), precision: 'mediump', step: 1.2 };
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power', precision: settings.precision, depth: false, stencil: false });
    renderer.setPixelRatio(settings.pixelRatio);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const parse = (color) => new THREE.Vector3(new THREE.Color(color).r, new THREE.Color(color).g, new THREE.Color(color).b);
    const rotation = (pillarRotation * Math.PI) / 180;
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 }, uResolution: { value: new THREE.Vector2(width, height) }, uTop: { value: parse(topColor) }, uBottom: { value: parse(bottomColor) },
        uIntensity: { value: intensity }, uGlow: { value: glowAmount }, uWidth: { value: pillarWidth }, uHeight: { value: pillarHeight },
        uNoise: { value: noiseIntensity }, uInteractive: { value: interactive }, uMouse: { value: new THREE.Vector2() },
        uRotCos: { value: Math.cos(rotation) }, uRotSin: { value: Math.sin(rotation) },
      },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.0);}',
      fragmentShader: `
        precision ${settings.precision} float;
        uniform float uTime,uIntensity,uGlow,uWidth,uHeight,uNoise,uRotCos,uRotSin;
        uniform vec2 uResolution,uMouse; uniform vec3 uTop,uBottom; uniform bool uInteractive; varying vec2 vUv;
        const int MAX_ITER=${settings.iterations}; const int WAVE_ITER=${settings.waves}; const float STEP=${settings.step.toFixed(1)};
        void main(){ vec2 uv=(vUv*2.0-1.0)*vec2(uResolution.x/uResolution.y,1.0);
          uv=vec2(uRotCos*uv.x-uRotSin*uv.y,uRotSin*uv.x+uRotCos*uv.y);
          vec3 ro=vec3(0.,0.,-10.),rd=normalize(vec3(uv,1.)); vec3 col=vec3(0.); float t=.1;
          for(int i=0;i<MAX_ITER;i++){vec3 p=ro+rd*t; p.xz=vec2(cos(uTime*.3)*p.x-sin(uTime*.3)*p.z,sin(uTime*.3)*p.x+cos(uTime*.3)*p.z);
            vec3 q=p; q.y=p.y*uHeight+uTime; float freq=1.,amp=1.;
            for(int j=0;j<WAVE_ITER;j++){q+=cos(q.zxy*freq-uTime*float(j)*2.)*amp;freq*=2.;amp*=.5;}
            float d=length(cos(q.xz))-.2; float bound=length(p.xz)-uWidth; float h=max(4.-abs(d-bound),0.);
            d=max(d,bound)+h*h*.015625; d=abs(d)*.15+.01; float grad=clamp((15.-p.y)/30.,0.,1.);
            col+=mix(uBottom,uTop,grad)/d; t+=d*STEP; if(t>50.)break;
          } col=tanh(col*uGlow/(uWidth/3.)); col-=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)/15.*uNoise;
          gl_FragColor=vec4(clamp(col*uIntensity,0.,1.),1.);
        }`,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);
    let raf = 0; let time = 0; let last = performance.now();
    const render = (now) => { const delta = Math.min((now - last) / 1000, .05); last = now; time += delta * speedRef.current; material.uniforms.uTime.value = time; renderer.render(scene, camera); raf = requestAnimationFrame(render); };
    raf = requestAnimationFrame(render);
    const resize = () => { const w = Math.max(container.clientWidth, 1); const h = Math.max(container.clientHeight, 1); renderer.setSize(w, h); material.uniforms.uResolution.value.set(w, h); };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); mesh.geometry.dispose(); material.dispose(); renderer.dispose(); renderer.forceContextLoss(); if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement); };
  }, [bottomColor, glowAmount, intensity, interactive, noiseIntensity, pillarHeight, pillarRotation, pillarWidth, quality, topColor]);

  return <div ref={containerRef} className={`light-pillar-container ${className}`} style={{ mixBlendMode }} aria-hidden="true" />;
}
