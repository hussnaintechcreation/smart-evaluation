import React, { useRef, useMemo, forwardRef } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, DepthOfField, GodRays, Vignette } from '@react-three/postprocessing';
import { KernelSize } from 'postprocessing';
import { useTheme } from '../contexts/ThemeContext';

// FIX: The extend(THREE) call is no longer needed in modern versions of R3F,
// as core components are extended by default. Removing it resolves the type error.

const DigitalCore = forwardRef<THREE.Mesh>((props, ref) => {
  const groupRef = useRef<THREE.Group>(null!);
  const shellRef = useRef<THREE.Mesh>(null!);
  const innerShellRef = useRef<THREE.Mesh>(null!);
  const ring1Ref = useRef<THREE.Mesh>(null!);
  const ring2Ref = useRef<THREE.Mesh>(null!);
  const ring3Ref = useRef<THREE.Mesh>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  const { theme } = useTheme();

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (ref && 'current' in ref && ref.current) {
      ref.current.rotation.y += delta * 0.5;
      const scale = 1 + Math.sin(time * 2) * 0.05; // Gentle pulse
      ref.current.scale.set(scale, scale, scale);
    }
    if (lightRef.current) {
        lightRef.current.intensity = 2 + Math.sin(time * 2) * 0.5; // Pulse light
    }
    if (shellRef.current) {
      shellRef.current.rotation.x += delta * 0.1;
      shellRef.current.rotation.y -= delta * 0.15;
    }
    if (innerShellRef.current) {
        innerShellRef.current.rotation.y += delta * 0.25;
        innerShellRef.current.rotation.z -= delta * 0.2;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = Math.PI / 2;
      ring1Ref.current.rotation.y += delta * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = Math.PI / 2;
      ring2Ref.current.rotation.z += delta * -0.2;
    }
    if (ring3Ref.current) {
        ring3Ref.current.rotation.z = Math.PI / 2;
        ring3Ref.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Inner glowing core */}
      <mesh ref={ref}>
        <sphereGeometry args={[0.5, 32, 32]} />
        {/* Use theme gradient colors for inner glow */}
        <meshBasicMaterial color={new THREE.Color(theme.gradientFromHex).multiplyScalar(3)} toneMapped={false} />
        <pointLight ref={lightRef} color={theme.gradientFromHex} intensity={2} distance={10} />
      </mesh>
      
      {/* Outer crystalline shell */}
      <mesh ref={shellRef}>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshPhysicalMaterial
            roughness={0}
            transmission={1}
            thickness={0.5}
            color={theme.gradientFromHex}
            envMapIntensity={2}
        />
      </mesh>

      {/* New inner crystalline shell */}
      <mesh ref={innerShellRef}>
        <dodecahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial
            color={new THREE.Color(theme.gradientToHex).lerp(new THREE.Color(0xffffff), 0.5)}
            emissive={new THREE.Color(theme.gradientToHex)}
            emissiveIntensity={0.3}
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.4}
        />
      </mesh>
      
      {/* Rotating rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.8, 0.02, 16, 100]} />
        <meshBasicMaterial color={theme.gradientFromHex} toneMapped={false} />
      </mesh>
       <mesh ref={ring2Ref}>
        <torusGeometry args={[2.2, 0.02, 16, 100]} />
        <meshBasicMaterial color={theme.gradientToHex} toneMapped={false} />
      </mesh>
       <mesh ref={ring3Ref}>
        <torusGeometry args={[1.5, 0.015, 16, 100]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  );
});

const DataStream: React.FC = () => {
    const pointsRef = useRef<THREE.Points>(null!);
    const count = 5000;
    const { theme } = useTheme();
    
    const [positions, colors, originalParams] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const params = new Float32Array(count * 3); // radius, phi, theta
        const color = new THREE.Color();

        for (let i = 0; i < count; i++) {
            const radius = 3 + Math.random() * 2;
            const phi = Math.acos(2 * Math.random() - 1); // latitude
            const theta = Math.random() * Math.PI * 2; // longitude
            params.set([radius, phi, theta], i * 3);
            
            // Initial particle color based on theme
            color.set(theme.gradientFromHex).lerp(new THREE.Color(theme.gradientToHex), Math.random());
            col.set([color.r, color.g, color.b], i * 3);
        }
        return [pos, col, params];
    }, [theme]); // Re-memoize if theme changes

    const mouseVec = useMemo(() => new THREE.Vector3(1000,1000,1000), []);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;

        mouseVec.lerp(
          new THREE.Vector3(
            (state.pointer.x * state.viewport.width) / 2,
            (state.pointer.y * state.viewport.height) / 2,
            0
          ),
          0.1
        );

        const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
        const colors = pointsRef.current.geometry.attributes.color.array as Float32Array;
        const time = state.clock.getElapsedTime();
        const tempVec = new THREE.Vector3();
        const tempColor = new THREE.Color();

        const fromColor = new THREE.Color(theme.gradientFromHex);
        const toColor = new THREE.Color(theme.gradientToHex);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const radius = originalParams[i3];
            const phi = originalParams[i3 + 1];
            let theta = originalParams[i3 + 2] + time * 0.05;

            tempVec.setFromSphericalCoords(radius, phi, theta);
            
            const dist = tempVec.distanceTo(mouseVec);
            const repulsionRadius = 1.8;
            const repulsionStrength = 2.5;

            if (dist < repulsionRadius) {
                const repulsionForce = Math.pow(1 - dist / repulsionRadius, 2);
                const direction = tempVec.clone().sub(mouseVec).normalize();
                
                // Repulsion
                tempVec.add(direction.clone().multiplyScalar(repulsionForce * repulsionStrength));

                // Swirl
                const swirlStrength = 1.0;
                const tangent = direction.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
                tempVec.add(tangent.multiplyScalar(repulsionForce * swirlStrength));
            }

            positions[i3] = tempVec.x;
            positions[i3 + 1] = tempVec.y;
            positions[i3 + 2] = tempVec.z;

            // Animate particle color based on theme
            const colorFactor = (phi / Math.PI + time * 0.03) % 1;
            tempColor.copy(fromColor).lerp(toColor, colorFactor);
            colors[i3] = tempColor.r;
            colors[i3 + 1] = tempColor.g;
            colors[i3 + 2] = tempColor.b;
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;
        pointsRef.current.geometry.attributes.color.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={count}
                    array={colors}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.025}
                transparent
                opacity={0.8}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                vertexColors
            />
        </points>
    );
};


export const Hero3D: React.FC<{ interactive?: boolean }> = ({ interactive = true }) => {
  const sunRef = useRef<THREE.Mesh>(null!);
  const { theme } = useTheme();
  
  return (
    <Canvas camera={{ position: [0, 2, 9], fov: 50 }}>
      <color attach="background" args={[theme.primaryBgColorHex]} />
      <fog attach="fog" args={[theme.primaryBgColorHex, 10, 25]} />
      <ambientLight intensity={0.1} />
      
      <DigitalCore ref={sunRef} />
      <DataStream />
      
      {interactive && <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.2}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI * 2 / 3}
      />}
      
      {/* sunRef might be null on first render, EffectComposer and GodRays handle this gracefully */}
      <EffectComposer>
        <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
        <Bloom
            kernelSize={KernelSize.LARGE}
            luminanceThreshold={0.6}
            luminanceSmoothing={0.1}
            intensity={1.0}
        />
        {sunRef.current && <GodRays 
            sun={sunRef.current}
            kernelSize={KernelSize.SMALL}
            density={0.8}
            decay={0.95}
            weight={0.6}
            exposure={0.4}
            samples={60}
            clampMax={1}
        />}
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
};