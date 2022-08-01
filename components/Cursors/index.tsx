import { FC, useRef, useMemo } from "react"
import styled from "@emotion/styled"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useGLTF, Instances } from "@react-three/drei"

import { useCursorsContext, CursorsProvider } from "./hooks/useCursorsContext"
import { SelfCursor } from "./components/SelfCursor"
import { OtherCursor } from "./components/OtherCursor"

import { useTrackBodyHeight } from "./hooks/useTrackBodySize"

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
  const { otherCursors } = useCursorsContext()
  const otherCursorsMeshRef = useRef<THREE.InstancedMesh | undefined>(undefined)

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
  })

  return (
    <>
      <Instances geometry={nodes.Cursor.geometry}>
        <meshStandardMaterial
          args={[
            {
              color: "#fff",
            },
          ]}
        />
        <SelfCursor />
      </Instances>
      <Instances
        // @ts-ignore
        ref={otherCursorsMeshRef}
        geometry={nodes.Cursor.geometry}
        position-z={-0.125}
      >
        <meshStandardMaterial args={[{ color: "#c0c" }]} />
        {otherCursors.map((cursor) => {
          return <OtherCursor key={cursor[0]} cursor={cursor} />
        })}
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
