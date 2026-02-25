declare module "three" {
  export const SRGBColorSpace: unknown;
  export const LinearFilter: number;
  export const GLSL3: unknown;

  export class Vector2 {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
    set(x: number, y: number): this;
    copy(v: Vector2): this;
    lerp(v: Vector2, alpha: number): this;
  }

  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): this;
    copy(v: Vector3): this;
  }

  export class Color {
    constructor(color?: string | number);
    set(color: string | number): this;
  }

  export class Texture {
    constructor(image?: unknown);
    minFilter: unknown;
    magFilter: unknown;
    generateMipmaps: boolean;
    needsUpdate: boolean;
  }

  export class Scene {
    add(object: unknown): this;
  }

  export class OrthographicCamera {
    constructor(
      left: number,
      right: number,
      top: number,
      bottom: number,
      near?: number,
      far?: number
    );
  }

  export class PlaneGeometry {
    constructor(width?: number, height?: number, widthSegments?: number, heightSegments?: number);
    dispose(): void;
  }

  export class Uniform<T = unknown> {
    constructor(value: T);
    value: T;
  }

  export type Uniforms = Record<string, Uniform>;

  export interface ShaderMaterialParameters {
    vertexShader?: string;
    fragmentShader?: string;
    uniforms?: Uniforms;
    premultipliedAlpha?: boolean;
    transparent?: boolean;
    depthTest?: boolean;
    depthWrite?: boolean;
    glslVersion?: unknown;
    [key: string]: unknown;
  }

  export class ShaderMaterial {
    constructor(parameters?: ShaderMaterialParameters);
    uniforms: Uniforms;
    dispose(): void;
  }

  export class Mesh<TGeometry = unknown, TMaterial = unknown> {
    constructor(geometry?: TGeometry, material?: TMaterial);
    geometry: TGeometry;
    material: TMaterial;
  }

  export interface WebGLRendererParameters {
    canvas?: HTMLCanvasElement;
    antialias?: boolean;
    powerPreference?: string;
    alpha?: boolean;
    [key: string]: unknown;
  }

  export class WebGLRenderer {
    constructor(parameters?: WebGLRendererParameters);
    domElement: HTMLCanvasElement;
    setPixelRatio(value: number): void;
    getPixelRatio(): number;
    setClearAlpha(alpha: number): void;
    setClearColor(color: number | string, alpha?: number): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;
    render(scene: Scene, camera: OrthographicCamera): void;
    dispose(): void;
  }

  export class Clock {
    constructor(autoStart?: boolean);
    readonly elapsedTime: number;
    getDelta(): number;
    getElapsedTime(): number;
  }
}
