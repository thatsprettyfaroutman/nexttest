import { FC, useRef } from "react"
import styled from "@emotion/styled"
import * as THREE from "three"
import { Canvas, useFrame } from "@react-three/fiber"
import { useGLTF, Instances, MeshDistortMaterial } from "@react-three/drei"
import { useControls } from "leva"

import { useKeepCameraScale } from "@/hooks/useKeepCameraScale"
import { useCursorsContext, CursorsProvider } from "@/hooks/useCursorsContext"
import { useCursorThreePosition } from "@/hooks/useCursorThreePosition"
import { SelfCursor, OtherCursor } from "./components/Cursor"
import { Character } from "./components/Character"

// TODO: mouse positions as refs from hook so they dont need to be passed everywhere as props
// TODO: blobby character that can be a instanced mesh
//       - Blob that can be cubey or round or rough maybe has some limbs
//       - Face made out of couple of spheres maybe
//       - HATS
// TODO: character chat, with quick commands like:
//       - Pressing H key makes the character say 'Hi'
//       - O: Omg
//       - W: Wow
//       - E: Help
//       - B: Bye
//       - T: This
//       - Y: Yes
//       - N: No
//       - etc
// TODO: Food for characters
// TODO: Battles?

const StyledCursors = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  pointer-events: none;
  z-index: 1001;
`

const ThreeCursors = () => {
  const { debugCursor } = useControls({
    debugCursor: false,
  })

  // Keep camera scale so objects stay the same size
  useKeepCameraScale()

  const { otherCursors, selfCursorId } = useCursorsContext()
  const { boundsRef } = useCursorThreePosition()

  const otherCursorsMeshRef = useRef<THREE.InstancedMesh | undefined>(undefined)
  const debugCursorMesh = useRef<THREE.InstancedMesh | undefined>(undefined)

  // @ts-ignore
  const { nodes } = useGLTF("/cursor.glb")

  useFrame(() => {
    if (!otherCursorsMeshRef.current) {
      return
    }
    otherCursorsMeshRef.current.position.y =
      window.scrollY * (boundsRef.current.vh / boundsRef.current.ch)

    if (debugCursorMesh.current) {
      debugCursorMesh.current.position.y =
        otherCursorsMeshRef.current.position.y
    }
  })

  const selfCursorRef = useRef()

  return (
    <>
      <Instances geometry={nodes.Cursor.geometry}>
        <meshStandardMaterial args={[{ color: "#fff" }]} />
        <SelfCursor ref={selfCursorRef} />
      </Instances>

      <Instances>
        <boxGeometry args={[2, 2, 2, 10, 10, 10]} />
        {/* <torusGeometry /> */}
        {/* <meshStandardMaterial args={[{ color: "#fff" }]} /> */}
        <MeshDistortMaterial
          color="#0ff"
          speed={5}
          distort={0.1}
          radius={0.25}
        />

        {/* @ts-ignore CBA types */}
        <Character linkRef={selfCursorRef} />
      </Instances>

      <Instances
        // @ts-ignore
        ref={otherCursorsMeshRef}
        geometry={nodes.Cursor.geometry}
        position-z={-0.25}
      >
        <meshStandardMaterial />
        {otherCursors
          .filter(([id]) => debugCursor || id !== selfCursorId)
          .map((cursor) => (
            <OtherCursor
              key={cursor[0]}
              cursor={cursor}
              label={cursor[0] === selfCursorId && cursor[0]}
              color={cursor[0] === selfCursorId ? "#20f" : "#f0f"}
            />
          ))}
      </Instances>
    </>
  )
}

export const Cursors: FC = ({ ...restProps }) => {
  return (
    <StyledCursors {...restProps}>
      <Canvas
        // flat
        // linear
        camera={{ fov: 20, position: [0, 0, 20] }}
      >
        <hemisphereLight intensity={0.8} />
        <spotLight
          angle={0.4}
          penumbra={1}
          position={[20, 30, 2.5]}
          castShadow
          shadow-bias={-0.00001}
        />
        <directionalLight
          color="#f0f"
          position={[-10, -10, 0]}
          intensity={1.5}
        />

        {/*
           `CursorsProvider` must be inside `Canvas` or it wont work, r3f reconcilier vs JSX reconcilier 
           https://github.com/pmndrs/react-three-fiber/issues/262
           
           Could prolly use `useContextBridge` from `react-three/drei`
        */}
        <CursorsProvider>
          <ThreeCursors />
        </CursorsProvider>
      </Canvas>
    </StyledCursors>
  )
}
