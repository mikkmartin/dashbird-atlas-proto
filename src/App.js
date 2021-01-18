import React, { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { Canvas, useThree } from 'react-three-fiber'
import { Text } from '@react-three/drei/Text'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useMotionValue, animate, transform } from 'framer-motion'

const staringZoom = 1
const defaultZoom = 3
const defaultFocal = 100000000
const config = { type: 'spring', stiffness: 500, damping: 60, mass: 0.1, restDelta: 0.001 }

function Controls({ focus, motionValue }) {
  const { gl, camera } = useThree()

  useEffect(() => {
    if (camera) {
      //console.log('intro animation')
      animate(motionValue, 0, {
        ...config,
        onUpdate: (v) => {
          console.log(v)
          camera.zoom = transform(v, [-1, 0], [staringZoom, defaultZoom])
          camera.updateProjectionMatrix()
        }
      })
    }
  }, [motionValue, camera, gl])

  useEffect(() => {
    if (!Boolean(focus)) animate(motionValue, 0, { ...config, onUpdate: transitionUpdate })
    else animate(motionValue, 1, { ...config, onUpdate: transitionUpdate })
    function transitionUpdate(v) {
      camera.zoom = transform(v, [0, 1], [defaultZoom, 20])
      camera.focal = transform(v, [0, 1], [defaultFocal, 10])
      camera.updateProjectionMatrix()
      camera.position.y = transform(v, [0, 1], [20, 10])
      camera.position.x = transform(v, [0, 1], [20, 30])
    }
  }, [motionValue, camera, focus])

  return <OrbitControls enabled={false} args={[camera, gl.domElement]} />
}

export default function App() {
  const [focus, setFocus] = useState(null)
  const motionValue = useMotionValue(-1)

  useEffect(() => {
    //const event = new CustomEvent('zoomed', { zoomed: Boolean(focus) })
    window.parent.postMessage(`${Boolean(focus)}`, '*')
  }, [focus])

  return (
    <Canvas
      pixelRatio={window.devicePixelRatio}
      camera={{
        zoom: staringZoom,
        focal: defaultFocal,
        position: [20, 20, 20]
      }}>
      <ambientLight intensity={0.8} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, 4, -10]} />
      <Controls motionValue={motionValue} focus={focus} />
      <Dots motionValue={motionValue} />
      <Box position={[0, 0, 0]} onClick={(e, mesh) => setFocus(mesh)} />
      <Box position={[0, 0, 1]} onClick={(e, mesh) => setFocus(mesh)} />
      <Text anchorX="start" position={[1, -0.5, 2]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} scale={[8, 8, 8]} color="black">
        Dashbird
      </Text>
      <Floor onClick={() => setFocus(null)} />
    </Canvas>
  )
}

function Floor({ onClick }) {
  return (
    <mesh onClick={onClick} position={[0, -0.501, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry attach="geometry" args={[100, 100]} />
      <meshBasicMaterial color="white" opacity={0} />
    </mesh>
  )
}

function Dots({ motionValue }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const transform = new THREE.Matrix4()
    for (let i = 0; i < 5000; ++i) {
      const x = (i % 100) - 25 + 0.5
      const y = Math.floor(i / 100) - 25 + 0.5
      transform.setPosition(x, y, 0)
      ref.current.setMatrixAt(i, transform)
    }
  }, [])
  return (
    <instancedMesh ref={ref} position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} args={[null, null, 5000]}>
      <circleBufferGeometry args={[0.05]} />
      <meshBasicMaterial />
    </instancedMesh>
  )
}

function Box({ position: _position, onClick }) {
  const mesh = useRef()
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)

  const position = _position.map((p, i) => {
    switch (i) {
      case 0:
        return p + 0.1
      case 2:
        return p + 0.1
      default:
        return p
    }
  })
  const hoveredPosition = [position[0], position[1] + 0.1, position[2]]
  return (
    <mesh
      position={hovered ? hoveredPosition : position}
      ref={mesh}
      scale={hovered ? [0.8, 1, 0.8] : [0.8, 0.8, 0.8]}
      onClick={(e) => {
        setActive(!active)
        e.stopPropagation()
        const { x, y, z } = mesh.current.position
        Boolean(onClick) && onClick(e, [x, y, z])
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
        setHover(true)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'auto'
        setHover(false)
      }}>
      <boxBufferGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? '#653EFF' : 'orange'} />
    </mesh>
  )
}
