import React, { useEffect, useRef } from 'react';

/**
 * FluidFlow.tsx (Favorite Original Robust Version)
 * 사용자가 선호했던 초기 싱글 패스 유체 셰이더 버전으로 복구했습니다.
 * 배경의 생동감을 되찾으면서도, 라이트 리빌 효과와 자연스럽게 어우러집니다.
 */
export function FluidFlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
    if (!gl) return;

    const V_SHADER = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const F_SHADER = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_intensity;

      const vec3 deepGreen = vec3(0.106, 0.263, 0.196); // #1B4332
      const vec3 midGreen  = vec3(0.176, 0.416, 0.310); // #2D6A4F

      // Simplex Noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy - C.xxx;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.xy;
        p.x *= u_resolution.x / u_resolution.y;
        
        vec2 mouseP = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.y, u_resolution.x);
        float dist = distance(p, mouseP);
        
        float strength = 0.5 + 0.5 * u_intensity;
        float noise = snoise(vec3(p * 0.7, u_time * 0.2));
        
        float mouseEffect = smoothstep(0.4, 0.0, dist) * strength;
        vec2 flow = p + noise * 0.4 + mouseEffect * 0.2;
        
        float n1 = snoise(vec3(flow * 1.2, u_time * 0.1));
        float n2 = snoise(vec3(flow * 2.0 + 10.0, u_time * 0.08));
        float finalMask = smoothstep(-1.5, 1.5, n1 + n2 * 0.5 + mouseEffect * 0.2);
        
        vec3 color = mix(deepGreen, midGreen, finalMask);
        float vignette = 1.0 - smoothstep(0.8, 2.5, length(p));
        
        gl_FragColor = vec4(color, vignette * 0.9);
      }
    `;

    // Shader Setup
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, V_SHADER);
    gl.compileShader(vs);
    
    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, F_SHADER);
    gl.compileShader(fs);
    
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    
    const posLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const resLoc = gl.getUniformLocation(program, "u_resolution");
    const timeLoc = gl.getUniformLocation(program, "u_time");
    const mouseLoc = gl.getUniformLocation(program, "u_mouse");
    const intensityLoc = gl.getUniformLocation(program, "u_intensity");

    let mouse = { x: 0, y: 0, targetX: 0.5, targetY: 0.5 };
    let intensity = 0;
    let targetIntensity = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = window.innerHeight - e.clientY;
      targetIntensity = 1.0;
    };
    const onMouseLeave = () => { targetIntensity = 0; };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();

    let start = performance.now();
    const loop = () => {
      const time = (performance.now() - start) * 0.001;
      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;
      intensity += (targetIntensity - intensity) * 0.05;

      gl.clearColor(0.06, 0.1, 0.08, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, time);
      gl.uniform2f(mouseLoc, mouse.x, mouse.y);
      gl.uniform1f(intensityLoc, intensity);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
