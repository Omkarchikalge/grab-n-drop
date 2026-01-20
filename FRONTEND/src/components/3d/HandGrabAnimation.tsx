import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

function Hand() {
  const handRef = useRef<THREE.Group>(null);
  const [phase, setPhase] = useState(0);

  useFrame((state) => {
    if (!handRef.current) return;
    
    const t = state.clock.elapsedTime;
    
    // Move hand in a grabbing motion
    const cycleTime = t % 4;
    
    if (cycleTime < 1) {
      // Approach
      handRef.current.position.x = -2 + cycleTime * 2;
      handRef.current.position.z = 0;
      setPhase(0);
    } else if (cycleTime < 2) {
      // Grab (close fingers)
      handRef.current.position.x = 0;
      setPhase(1);
    } else if (cycleTime < 3) {
      // Pull back
      handRef.current.position.x = (cycleTime - 2) * 2;
      handRef.current.position.z = (cycleTime - 2) * -1;
      setPhase(2);
    } else {
      // Reset
      handRef.current.position.x = 2 - (cycleTime - 3) * 4;
      handRef.current.position.z = -1 + (cycleTime - 3);
      setPhase(0);
    }

    // Gentle floating
    handRef.current.position.y = Math.sin(t * 2) * 0.1;
    handRef.current.rotation.z = Math.sin(t * 1.5) * 0.05;
  });

  const fingerCurl = phase === 1 ? 0.8 : 0.2;

  return (
    <group ref={handRef} position={[-2, 0, 0]} rotation={[0, 0, 0]}>
      {/* Palm */}
      <RoundedBox args={[0.8, 1, 0.3]} radius={0.1} position={[0, 0, 0]}>
        <meshStandardMaterial color="#00d4ff" metalness={0.5} roughness={0.3} />
      </RoundedBox>
      
      {/* Fingers */}
      {[-0.25, -0.08, 0.08, 0.25].map((x, i) => (
        <group key={i} position={[x, 0.6, 0]} rotation={[fingerCurl, 0, 0]}>
          <RoundedBox args={[0.12, 0.5, 0.15]} radius={0.05} position={[0, 0.2, 0]}>
            <meshStandardMaterial color="#00d4ff" metalness={0.5} roughness={0.3} />
          </RoundedBox>
          <group position={[0, 0.5, 0]} rotation={[fingerCurl * 0.5, 0, 0]}>
            <RoundedBox args={[0.1, 0.35, 0.12]} radius={0.04} position={[0, 0.15, 0]}>
              <meshStandardMaterial color="#00d4ff" metalness={0.5} roughness={0.3} />
            </RoundedBox>
          </group>
        </group>
      ))}
      
      {/* Thumb */}
      <group position={[-0.45, 0.1, 0.1]} rotation={[0, 0, phase === 1 ? 0.8 : 0.3]}>
        <RoundedBox args={[0.15, 0.4, 0.15]} radius={0.05} position={[-0.15, 0, 0]}>
          <meshStandardMaterial color="#00d4ff" metalness={0.5} roughness={0.3} />
        </RoundedBox>
      </group>

      {/* Glow effect */}
      <Sphere args={[0.6, 16, 16]} position={[0, 0.3, 0]}>
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.1} />
      </Sphere>
    </group>
  );
}

function FloatingFile() {
  const fileRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!fileRef.current) return;
    
    const t = state.clock.elapsedTime;
    const cycleTime = t % 4;
    
    if (cycleTime >= 2 && cycleTime < 3) {
      // Move with hand
      fileRef.current.position.x = (cycleTime - 2) * 2;
      fileRef.current.position.z = (cycleTime - 2) * -1;
    } else if (cycleTime >= 3) {
      // Return to center
      const progress = cycleTime - 3;
      fileRef.current.position.x = 2 - progress * 2;
      fileRef.current.position.z = -1 + progress;
    } else {
      fileRef.current.position.x = 0;
      fileRef.current.position.z = 0;
    }
    
    fileRef.current.position.y = Math.sin(t * 1.5) * 0.1;
    fileRef.current.rotation.y = t * 0.2;
  });

  return (
    <group>
      <RoundedBox ref={fileRef} args={[0.8, 1, 0.1]} radius={0.08} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#a855f7"
          metalness={0.4}
          roughness={0.3}
          transparent
          opacity={0.9}
        />
      </RoundedBox>
      
      {/* File glow */}
      <Sphere args={[0.8, 16, 16]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#a855f7" transparent opacity={0.08} />
      </Sphere>
    </group>
  );
}

interface HandGrabAnimationProps {
  className?: string;
}

export default function HandGrabAnimation({ className }: HandGrabAnimationProps) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 1, 6], fov: 40 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1} color="#00d4ff" />
        <pointLight position={[-5, 5, 5]} intensity={0.8} color="#a855f7" />
        <spotLight position={[0, 10, 0]} intensity={0.5} angle={0.5} penumbra={1} />
        <Hand />
        <FloatingFile />
      </Canvas>
    </div>
  );
}
