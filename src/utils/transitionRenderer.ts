import { TransitionType } from '../types';

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  v_uv.y = 1.0 - v_uv.y; // Flip Y for WebGL texture orientation
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const SHADERS: Record<TransitionType, string> = {
  fade: `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_from;
    uniform sampler2D u_to;
    uniform float u_progress;
    void main() {
      vec4 f = texture2D(u_from, v_uv);
      vec4 t = texture2D(u_to, v_uv);
      gl_FragColor = mix(f, t, u_progress);
    }
  `,
  dissolve: `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_from;
    uniform sampler2D u_to;
    uniform float u_progress;
    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }
    void main() {
      vec4 f = texture2D(u_from, v_uv);
      vec4 t = texture2D(u_to, v_uv);
      float r = rand(v_uv);
      gl_FragColor = r < u_progress ? t : f;
    }
  `,
  'slide-left': `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_from;
    uniform sampler2D u_to;
    uniform float u_progress;
    void main() {
      vec2 p = v_uv;
      if (p.x < 1.0 - u_progress) {
        gl_FragColor = texture2D(u_from, p + vec2(u_progress, 0.0));
      } else {
        gl_FragColor = texture2D(u_to, p - vec2(1.0 - u_progress, 0.0));
      }
    }
  `,
  'slide-right': `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_from;
    uniform sampler2D u_to;
    uniform float u_progress;
    void main() {
      vec2 p = v_uv;
      if (p.x > u_progress) {
        gl_FragColor = texture2D(u_from, p - vec2(u_progress, 0.0));
      } else {
        gl_FragColor = texture2D(u_to, p + vec2(1.0 - u_progress, 0.0));
      }
    }
  `,
  'slide-up': `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_from;
    uniform sampler2D u_to;
    uniform float u_progress;
    void main() {
      vec2 p = v_uv;
      if (p.y < 1.0 - u_progress) {
        gl_FragColor = texture2D(u_from, p + vec2(0.0, u_progress));
      } else {
        gl_FragColor = texture2D(u_to, p - vec2(0.0, 1.0 - u_progress));
      }
    }
  `,
  'zoom-in': `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_from;
    uniform sampler2D u_to;
    uniform float u_progress;
    void main() {
      vec2 center = vec2(0.5, 0.5);
      vec2 uvFrom = (v_uv - center) * (1.0 + u_progress * 0.4) + center;
      vec2 uvTo = (v_uv - center) * (0.8 + u_progress * 0.2) + center;
      vec4 f = texture2D(u_from, clamp(uvFrom, 0.0, 1.0));
      vec4 t = texture2D(u_to, clamp(uvTo, 0.0, 1.0));
      gl_FragColor = mix(f, t, smoothstep(0.1, 0.9, u_progress));
    }
  `,
  'zoom-out': `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_from;
    uniform sampler2D u_to;
    uniform float u_progress;
    void main() {
      vec2 center = vec2(0.5, 0.5);
      vec2 uvFrom = (v_uv - center) * (1.0 - u_progress * 0.3) + center;
      vec2 uvTo = (v_uv - center) * (1.2 - u_progress * 0.2) + center;
      vec4 f = texture2D(u_from, clamp(uvFrom, 0.0, 1.0));
      vec4 t = texture2D(u_to, clamp(uvTo, 0.0, 1.0));
      gl_FragColor = mix(f, t, smoothstep(0.1, 0.9, u_progress));
    }
  `,
  'wipe-left': `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_from;
    uniform sampler2D u_to;
    uniform float u_progress;
    void main() {
      float edge = smoothstep(u_progress - 0.03, u_progress + 0.03, v_uv.x);
      vec4 f = texture2D(u_from, v_uv);
      vec4 t = texture2D(u_to, v_uv);
      gl_FragColor = mix(t, f, edge);
    }
  `,
  'circle-open': `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_from;
    uniform sampler2D u_to;
    uniform float u_progress;
    void main() {
      vec4 f = texture2D(u_from, v_uv);
      vec4 t = texture2D(u_to, v_uv);
      float dist = distance(v_uv, vec2(0.5, 0.5));
      float radius = u_progress * 0.75;
      float alpha = smoothstep(radius - 0.02, radius + 0.02, dist);
      gl_FragColor = mix(t, f, alpha);
    }
  `,
};

export class WebGLTransitionRenderer {
  private gl: WebGLRenderingContext | null = null;
  private programs: Map<TransitionType, WebGLProgram> = new Map();
  private textureFrom: WebGLTexture | null = null;
  private textureTo: WebGLTexture | null = null;
  private quadBuffer: WebGLBuffer | null = null;

  constructor(canvas: HTMLCanvasElement | OffscreenCanvas) {
    try {
      const gl = (canvas.getContext('webgl', { preserveDrawingBuffer: true }) ||
        (canvas as HTMLCanvasElement).getContext?.('experimental-webgl', { preserveDrawingBuffer: true })) as WebGLRenderingContext | null;

      if (!gl) {
        console.warn('WebGL not supported, falling back to 2D canvas transitions');
        return;
      }

      this.gl = gl;
      this.initBuffers();
      this.initTextures();
    } catch (err) {
      console.warn('WebGL context initialization error, using 2D fallback:', err);
      this.gl = null;
    }
  }

  public isReady(): boolean {
    return this.gl !== null && !this.gl.isContextLost();
  }

  private compileShader(src: string, type: number): WebGLShader | null {
    if (!this.gl) return null;
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    this.gl.shaderSource(shader, src);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private getProgram(type: TransitionType): WebGLProgram | null {
    if (!this.gl) return null;
    if (this.programs.has(type)) {
      return this.programs.get(type)!;
    }

    const fragmentSource = SHADERS[type] || SHADERS.fade;
    const vertexShader = this.compileShader(VERTEX_SHADER, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return null;

    const program = this.gl.createProgram();
    if (!program) return null;
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(program));
      return null;
    }

    this.programs.set(type, program);
    return program;
  }

  private initBuffers() {
    if (!this.gl) return;
    this.quadBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
    const vertices = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
  }

  private initTextures() {
    if (!this.gl) return;
    this.textureFrom = this.gl.createTexture();
    this.textureTo = this.gl.createTexture();

    [this.textureFrom, this.textureTo].forEach((tex) => {
      if (!this.gl || !tex) return;
      this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    });
  }

  /**
   * Renders the transition from one canvas/image to another onto the WebGL canvas
   */
  public render(
    fromSource: TexImageSource,
    toSource: TexImageSource,
    type: TransitionType,
    progress: number,
    width: number,
    height: number
  ) {
    if (!this.gl || !this.textureFrom || !this.textureTo || !this.quadBuffer) return;

    this.gl.viewport(0, 0, width, height);

    const program = this.getProgram(type);
    if (!program) return;
    this.gl.useProgram(program);

    // Upload Texture 0 (From)
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.textureFrom);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      fromSource
    );

    // Upload Texture 1 (To)
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.textureTo);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      toSource
    );

    // Set uniforms
    const uFromLoc = this.gl.getUniformLocation(program, 'u_from');
    const uToLoc = this.gl.getUniformLocation(program, 'u_to');
    const uProgressLoc = this.gl.getUniformLocation(program, 'u_progress');

    this.gl.uniform1i(uFromLoc, 0);
    this.gl.uniform1i(uToLoc, 1);
    this.gl.uniform1f(uProgressLoc, Math.max(0.0, Math.min(1.0, progress)));

    // Set vertex attributes
    const posLoc = this.gl.getAttribLocation(program, 'a_position');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
    this.gl.enableVertexAttribArray(posLoc);
    this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 0, 0);

    // Draw full-screen quad
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
}
