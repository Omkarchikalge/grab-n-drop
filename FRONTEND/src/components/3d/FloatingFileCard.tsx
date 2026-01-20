import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';

interface FileCardMeshProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

function FileCardMesh({ position = [0, 0, 0], rotation = [0, 0, 0] }: FileCardMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current || !glowRef.current) return;
    
    // Floating animation
    const t = state.clock.elapsedTime;
    meshRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.15;
    meshRef.current.rotation.y = rotation[1] + Math.sin(t * 0.5) * 0.1;
    
    glowRef.current.position.y = meshRef.current.position.y;
    glowRef.current.rotation.y = meshRef.current.rotation.y;
    
    // Pulse glow
    const scale = 1 + Math.sin(t * 2) * 0.05;
    glowRef.current.scale.set(scale, scale, scale);
  });

  return (
    <group position={position} rotation={rotation as [number, number, number]}>
      {/* Glow effect */}
      <mesh ref={glowRef} position={[0, 0, -0.1]}>
        <planeGeometry args={[2.2, 2.8]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Main card */}
      <RoundedBox
        ref={meshRef}
        args={[2, 2.5, 0.15]}
        radius={0.15}
        smoothness={4}
      >
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.3}
          roughness={0.4}
          transparent
          opacity={0.9}
        />
      </RoundedBox>

      {/* File icon area */}
      <mesh position={[0, 0.3, 0.1]}>
        <planeGeometry args={[1.2, 1.2]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.2} />
      </mesh>

      {/* Text label */}
      <Text
        position={[0, -0.8, 0.1]}
        fontSize={0.18}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-medium.woff"
      >
        document.pdf
      </Text>
      
      {/* File size */}
      <Text
        position={[0, -1.05, 0.1]}
        fontSize={0.12}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
      >
        2.4 MB
      </Text>
    </group>
  );
}

interface FloatingFileCardProps {
  className?: string;
}

export default function FloatingFileCard({ className }: FloatingFileCardProps) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={0.8} color="#00d4ff" />
        <pointLight position={[-5, -5, 5]} intensity={0.5} color="#a855f7" />
        <FileCardMesh position={[0, 0, 0]} rotation={[0.1, -0.2, 0]} />
      </Canvas>
    </div>
  );
}
