import { FC, useRef, useMemo } from "react"
import styled from "@emotion/styled"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useGLTF, Instances } from "@react-three/drei"

import { useCursorsContext, CursorsProvider } from "./hooks/useCursorsContext"
import { SelfCursor } from "./components/SelfCursor"
import { OtherCursor } from "./components/OtherCursor"

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
        <meshBasicMaterial args={[{ color: "#fff" }]} />
        <SelfCursor />
      </Instances>
      <Instances
        // @ts-ignore
        ref={otherCursorsMeshRef}
        geometry={nodes.Cursor.geometry}
      >
        <meshBasicMaterial args={[{ color: "#fff" }]} />
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
        camera={{ fov: 40, position: [0, 0, 5] }}
      >
        {/*
           `CursorsProvider` must be inside `Canvas` or it wont work, r3f reconcilier vs JSX reconcilier 
           https://github.com/pmndrs/react-three-fiber/issues/262
        */}
        <CursorsProvider>
          <ThreeCursors />
        </CursorsProvider>
      </Canvas>
    </StyledCursors>
  )
}
