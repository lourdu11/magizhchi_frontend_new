import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Center } from '@react-three/drei';
import { Loader2 } from 'lucide-react';

function ProductModel({ color }) {
  const meshRef = useRef();

  return (
    <Center>
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[1.5, 2, 0.5]} />
        <meshStandardMaterial 
          color={color || "#C5A85A"} 
          metalness={0.6}
          roughness={0.2}
          envMapIntensity={1}
        />
      </mesh>
    </Center>
  );
}

export default function ProductViewer3D({ isVisible, onClose }) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-40 bg-white/90 backdrop-blur-md rounded-2xl md:rounded-[3rem] overflow-hidden flex flex-col animate-fade-in">
      <div className="absolute top-4 right-4 z-50">
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-charcoal text-white rounded-full text-xs font-bold shadow-lg hover:bg-premium-gold hover:text-charcoal transition-colors"
        >
          Close 3D View
        </button>
      </div>

      <div className="absolute bottom-4 left-0 right-0 z-50 text-center pointer-events-none">
        <p className="text-charcoal/50 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
          Drag to Rotate <span className="text-premium-gold">360°</span>
        </p>
      </div>

      <div className="flex-1 w-full h-full relative cursor-move">
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin text-premium-gold" size={32} />
          </div>
        }>
          <Canvas shadows camera={{ position: [0, 0, 4], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            
            <ProductModel />
            
            <Environment preset="studio" />
            <ContactShadows position={[0, -1.5, 0]} opacity={0.5} scale={10} blur={2} far={4} />
            
            <OrbitControls 
              enableZoom={true} 
              enablePan={false} 
              minPolarAngle={Math.PI / 4} 
              maxPolarAngle={Math.PI / 2}
              autoRotate
              autoRotateSpeed={1}
            />
          </Canvas>
        </Suspense>
      </div>
    </div>
  );
}
