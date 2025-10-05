import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Model3DViewerProps {
  modelUrl: string;
  width?: number;
  height?: number;
  autoRotate?: boolean;
  enableControls?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export default function Model3DViewer({
  modelUrl,
  width = 300,
  height = 300,
  autoRotate = true,
  enableControls = false,
  onLoad,
  onError
}: Model3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Limpar cena anterior se existir
    cleanup();

    // Criar cena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa); // Fundo cinza muito claro para melhor contraste
    sceneRef.current = scene;

    // Criar câmera com configurações otimizadas
    const camera = new THREE.PerspectiveCamera(
      60, // FOV mais amplo para melhor visualização
      width / height,
      0.01, // Near plane mais próximo
      1000
    );
    // Posição inicial será ajustada após carregar o modelo
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Criar renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // Adicionar iluminação avançada otimizada para materiais cromados
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Aumentada para materiais reflexivos
    scene.add(ambientLight);

    // Luz principal com configurações avançadas
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.8); // Intensidade aumentada
    mainLight.position.set(5, 5, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.1;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.bias = -0.0001;
    scene.add(mainLight);

    // Luz de preenchimento suave
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8); // Intensidade aumentada
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    // Luz de contorno para destacar bordas
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.6); // Intensidade aumentada
    rimLight.position.set(0, -5, 0);
    scene.add(rimLight);

    // Luz adicional para realce
    const accentLight = new THREE.SpotLight(0xffffff, 1.0); // Intensidade aumentada
    accentLight.position.set(0, 8, 0);
    accentLight.angle = Math.PI / 6;
    accentLight.penumbra = 0.3;
    accentLight.decay = 2;
    accentLight.distance = 20;
    scene.add(accentLight);

    // Luz adicional lateral para materiais cromados
    const sideLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
    sideLight1.position.set(8, 2, 0);
    scene.add(sideLight1);

    const sideLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    sideLight2.position.set(-8, 2, 0);
    scene.add(sideLight2);

    // Marcador visual do foco da câmera (pequeno ponto no centro)
    const focusMarkerGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const focusMarkerMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff4444, 
      transparent: true, 
      opacity: 0.6 
    });
    const focusMarker = new THREE.Mesh(focusMarkerGeometry, focusMarkerMaterial);
    focusMarker.position.set(0, 0, 0);
    scene.add(focusMarker);

    // Adicionar anel sutil ao redor do ponto de foco
    const ringGeometry = new THREE.RingGeometry(0.05, 0.07, 16);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff4444, 
      transparent: true, 
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const focusRing = new THREE.Mesh(ringGeometry, ringMaterial);
    focusRing.position.set(0, 0, 0);
    focusRing.lookAt(camera.position);
    scene.add(focusRing);

    // Configurar controles se habilitados
    if (enableControls) {
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enableZoom = true;
      controls.enableRotate = true;
      controls.enablePan = false;
      controls.autoRotate = false; // Desabilitar auto-rotação da câmera
      controls.autoRotateSpeed = 0;
      controls.target.set(0, 0, 0);
      // Limites serão ajustados após carregar o modelo
      controlsRef.current = controls;
    }

    // Carregar modelo 3D
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;

        // Centralizar o modelo com maior precisão
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Criar um grupo para controlar a rotação no centro do modelo
        const modelGroup = new THREE.Group();
        scene.add(modelGroup);
        
        // Mover o modelo para o centro do grupo (origem local)
        model.position.set(-center.x, -center.y, -center.z);
        modelGroup.add(model);
        
        // O grupo permanece na origem (0,0,0) para rotação centralizada
        modelGroup.position.set(0, 0, 0);
        
        // Atualizar a referência para o grupo ao invés do modelo
        modelRef.current = modelGroup;
        
        // Calcular escala baseada no tamanho da viewport e tipo de visualização
        const maxDim = Math.max(size.x, size.y, size.z);
        const viewportSize = Math.min(width, height);
        
        // Lógica de escala diferenciada para blots vs modais
        let scale;
        if (maxDim > 0) {
          if (width <= 300 && height <= 300) {
            // Para blots pequenos - escala aumentada em 40%
            scale = (viewportSize * 0.98) / (maxDim * 100); // 0.7 * 1.4 = 0.98
            scale = Math.max(scale, 0.7); // 0.5 * 1.4 = 0.7
            scale = Math.min(scale, 11.2); // 8 * 1.4 = 11.2
          } else {
            // Para modais - escala aumentada em 40%
            scale = (viewportSize * 0.84) / (maxDim * 120); // 0.6 * 1.4 = 0.84
            scale = Math.max(scale, 1.12); // 0.8 * 1.4 = 1.12
            scale = Math.min(scale, 16.8); // 12 * 1.4 = 16.8
          }
        } else {
          scale = 1;
        }
        
        // Aplicar escala apenas ao grupo (não duplicar no modelo)
        modelGroup.scale.setScalar(scale);
        
        // Posicionar câmera baseado no tamanho do modelo escalado
        const scaledSize = maxDim * scale;
        let distance;
        
        if (width <= 300 && height <= 300) {
          // Para blots - câmera ainda mais próxima para maior zoom
          distance = Math.max(scaledSize * 1.4, 1.8);
        } else {
          // Para modais - câmera ainda mais próxima para maior zoom
          distance = Math.max(scaledSize * 1.6, 2.2);
        }
        
        camera.position.set(
          distance * 0.7,
          distance * 0.5,
          distance
        );
        camera.lookAt(0, 0, 0);
        
        // Configurar limites dos controles baseado no modelo
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.minDistance = distance * 0.3;
          controlsRef.current.maxDistance = distance * 3;
          controlsRef.current.update();
        }

        // Configurar sombras
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Não adicionar o modelo diretamente à cena, pois já foi adicionado ao grupo
        // scene.add(model); // Removido - o modelo já está no grupo que foi adicionado à cena
        setIsLoading(false);
        onLoad?.();
      },
      (progress) => {
        // Progresso do carregamento
        console.log('Carregando modelo 3D:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Erro ao carregar modelo 3D:', error);
        setError('Erro ao carregar modelo 3D');
        setIsLoading(false);
        onError?.(error as Error);
      }
    );

    // Adicionar renderer ao DOM
    mountRef.current.appendChild(renderer.domElement);

    // Função de animação
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // Rotação automática do modelo em torno de si mesmo (não da câmera) - reduzida em 85%
      if (autoRotate && modelRef.current) {
        modelRef.current.rotation.y += 0.00075; // Rotação muito mais lenta (era 0.005, agora 85% menor)
      }

      // Atualizar controles se habilitados
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup function
    return () => {
      cleanup();
    };
  }, [modelUrl, width, height, autoRotate, enableControls]);

  const cleanup = () => {
    // Parar animação
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }

    // Limpar controles
    if (controlsRef.current) {
      controlsRef.current.dispose();
      controlsRef.current = null;
    }

    // Limpar renderer
    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (mountRef.current && rendererRef.current.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current = null;
    }

    // Limpar geometrias e materiais
    if (sceneRef.current) {
      sceneRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material?.dispose();
          }
        }
      });
      sceneRef.current = null;
    }

    modelRef.current = null;
    cameraRef.current = null;
  };

  if (error) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 border border-gray-300 rounded"
        style={{ width, height }}
      >
        <div className="text-center text-gray-600">
          <div className="text-sm font-medium">Erro ao carregar modelo 3D</div>
          <div className="text-xs mt-1">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={mountRef} 
        className="border border-gray-200 rounded overflow-hidden"
        style={{ width, height }}
      />
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded"
          style={{ 
            width, 
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div className="text-center text-gray-600" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" style={{
              margin: '0 auto 8px auto'
            }}></div>
            <div className="text-sm" style={{ textAlign: 'center' }}>Carregando modelo 3D...</div>
          </div>
        </div>
      )}
    </div>
  );
}