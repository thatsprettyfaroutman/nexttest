import { FC, useRef } from "react"
import styled from "@emotion/styled"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useGLTF, Instances } from "@react-three/drei"
import { useControls } from "leva"

import { useCursorsContext, CursorsProvider } from "./hooks/useCursorsContext"
import { SelfCursor, OtherCursor } from "./components/Cursor"

// TODO: thether that drags the character
// TODO: blobby character that can be a instanced mesh
//       - Blob that can be cubey or round or rough maybe has some limbs
//       - Face made out of couple of spheres maybe
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
  const { otherCursors, selfCursorId } = useCursorsContext()
  const otherCursorsMeshRef = useRef<THREE.InstancedMesh | undefined>(undefined)
  const debugCursorMesh = useRef<THREE.InstancedMesh | undefined>(undefined)

  // @ts-ignore
  const { nodes } = useGLTF("/cursor.glb")

  const {
    size: { height: ch },
    viewport: { height: vh },
  } = useThree()

  useFrame((s) => {
    if (!otherCursorsMeshRef.current) {
      return
    }
    otherCursorsMeshRef.current.position.y = window.scrollY * (vh / ch)

    if (debugCursorMesh.current) {
      debugCursorMesh.current.position.y =
        otherCursorsMeshRef.current.position.y
    }
  })

  return (
    <>
      <Instances geometry={nodes.Cursor.geometry}>
        <meshStandardMaterial args={[{ color: "#fff" }]} />
        <SelfCursor />
      </Instances>

      {debugCursor && (
        <Instances
          // @ts-ignore
          ref={debugCursorMesh}
          geometry={nodes.Cursor.geometry}
        >
          <meshStandardMaterial
            args={[
              {
                color: "#000",
                transparent: true,
                opacity: 0,
              },
            ]}
          />

          {otherCursors
            .filter(([id]) => id === selfCursorId)
            .map((cursor) => (
              <OtherCursor
                key={cursor[0]}
                cursor={cursor}
                // @ts-ignore
                edges="#f0f"
              />
            ))}
        </Instances>
      )}

      <Instances
        // @ts-ignore
        ref={otherCursorsMeshRef}
        geometry={nodes.Cursor.geometry}
        position-z={-0.25}
      >
        <meshStandardMaterial args={[{ color: "#c0c" }]} />
        {otherCursors
          .filter(([id]) => id !== selfCursorId)
          .map((cursor) => (
            <OtherCursor key={cursor[0]} cursor={cursor} />
          ))}
      </Instances>
    </>
  )
}

export const Cursors: FC = ({ ...restProps }) => {
  return (
    <StyledCursors {...restProps}>
      <Canvas
        flat
        linear
        dpr={[1, 2]}
        camera={{ fov: 50, position: [0, 0, 10] }}
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
