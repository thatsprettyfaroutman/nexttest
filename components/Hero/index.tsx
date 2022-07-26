import React, { FC, useRef, useState, useMemo, useEffect } from "react"
import styled from "@emotion/styled"
import { splitEvery } from "ramda"
import * as THREE from "three"
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber"
import { Effects } from "@react-three/drei"
import { SSAOPass, UnrealBloomPass } from "three-stdlib"
import { getCharacters } from "./characters"

extend({ SSAOPass, UnrealBloomPass })

const StyledHero = styled.div`
  position: relative;
  height: 100vh;
  overflow: hidden;
`

const Content = styled.div`
  position: absolute;
  top: calc(50% + 3rem);
  left: 50%;
  transform: translate(-50%, -50%);
`

const BOX_GAP = 0.125 * 0.5
const BOX_COLS = 90
const BOX_ROWS = 60
const BOX_SIZE = 0.125 // 0.0125
const BOX_COUNT = (BOX_COLS + 1) * (BOX_ROWS + 1)

const BOX_COLOR = 0xff0088
const BOX_TEXT_COLOR = 0xffffff

const tempObject = new THREE.Object3D()
const tempColor = new THREE.Color()

const Boxes = ({ title }: { title: string }) => {
  const data = useMemo(() => {
    const TEXT = getCharacters(title)
    const TEXT_ROWS = TEXT.reduce((rows: number[][], character, i) => {
      const characterRows = splitEvery(character.length / 5, character)
      characterRows.forEach((characterRow, row) => {
        if (!rows[row]) {
          rows[row] = []
        }
        if (i !== 0) {
          // Add space between characters
          rows[row].push(0)
        }
        rows[row].push(...characterRow)
      })
      return rows
    }, []).reverse()

    const data = Array.from({ length: BOX_COUNT }, (_, i) => {
      const midX = Math.round(BOX_COLS * -0.5)
      const midY = Math.round(BOX_ROWS * -0.5)
      const offsetX = Math.floor(i / (BOX_ROWS + 1))
      const offsetY = i % (BOX_ROWS + 1)
      const textHalfWidth = Math.floor(TEXT_ROWS[0].length * 0.5)
      const textHalfHeight = Math.floor(TEXT_ROWS.length * 0.5)

      const x = midX + offsetX + textHalfWidth
      const y = midY + offsetY + textHalfHeight

      const isInCharacter = !!TEXT_ROWS[y]?.[x]

      return {
        color: isInCharacter ? BOX_TEXT_COLOR : BOX_COLOR,
        scale: isInCharacter ? 1 : 1,
      }
    })

    return data
  }, [title])

  const [hovered, set] = useState()
  const colorArray = useMemo(
    () =>
      Float32Array.from(
        new Array(BOX_COUNT)
          .fill(null)
          .flatMap((_, i) => tempColor.set(data[i].color).toArray())
      ),
    []
  )
  const meshRef = useRef<THREE.Mesh | undefined>()
  const prevRef = useRef<THREE.Mesh | undefined>()

  useEffect(() => void (prevRef.current = hovered), [hovered])

  useFrame((state) => {
    if (!meshRef.current) {
      return
    }
    const time = state.clock.getElapsedTime()
    meshRef.current.rotation.x = 0 // Math.sin(time / 4)
    meshRef.current.rotation.y = 0 // Math.sin(time / 2)
    let i = 0
    for (let ix = 0; ix < BOX_COLS + 1; ix++)
      for (let iy = 0; iy < BOX_ROWS + 1; iy++) {
        const id = i++
        const y = iy * BOX_GAP
        const x = ix * BOX_GAP
        const z = 0
        tempObject.position.set(
          x - BOX_COLS * 0.5 * BOX_GAP,
          y - BOX_ROWS * 0.5 * BOX_GAP,
          0 //y * -0.5 //5 - z
        )
        tempObject.rotation.y =
          Math.sin(x / 4.1 + time / id) +
          Math.sin(y / 2.3 + time) +
          Math.sin(z / 4 + time)
        tempObject.rotation.z = tempObject.rotation.y * 2

        // if (hovered !== prevRef.current) {
        //   ;(id === hovered
        //     ? tempColor.setRGB(1, 0, 1)
        //     : tempColor.set(data[id].color)
        //   ).toArray(colorArray, id * 3)
        //   meshRef.current.geometry.attributes.color.needsUpdate = true
        // }
        // const scale = (data[id].scale = THREE.MathUtils.lerp(
        //   data[id].scale,
        //   id === hovered ? 2.5 : 1,
        //   1
        // ))
        tempObject.scale.setScalar(data[id].scale)
        tempObject.updateMatrix()
        // @ts-ignore
        meshRef.current.setMatrixAt(id, tempObject.matrix)
      }
    // @ts-ignore
    meshRef.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh
      // @ts-ignore
      ref={meshRef}
      // @ts-ignore
      args={[null, null, BOX_COUNT]}
      // @ts-ignore
      onPointerMove={(e) => (e.stopPropagation(), set(e.instanceId))}
      onPointerOut={(e) => set(undefined)}
    >
      <boxGeometry args={[BOX_SIZE, BOX_SIZE, BOX_SIZE]}>
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colorArray, 3]}
        />
      </boxGeometry>
      <meshBasicMaterial toneMapped={false} vertexColors />
    </instancedMesh>
  )
}

function Post() {
  const { scene, camera } = useThree()
  return (
    <Effects disableGamma>
      {/* @ts-ignore */}
      <sSAOPass args={[scene, camera]} kernelRadius={0.5} maxDistance={0.1} />
      {/* @ts-ignore */}
      <unrealBloomPass threshold={0.9} strength={0.75} radius={0.5} />
    </Effects>
  )
}

export const Hero: FC<{ title: string }> = ({
  title,
  children,
  ...restProps
}) => (
  <StyledHero {...restProps}>
    <Canvas flat linear dpr={2}>
      {/* <ambientLight /> */}
      {/* <pointLight position={[1, 1, -1]} /> */}
      {/* <Box position={[-1.2, 0, 0]} /> */}
      {/* <Box position={[1.2, 0, 0]} /> */}
      <Boxes title={title} />
      {/* <Post /> */}
    </Canvas>
    <Content>{children}</Content>
  </StyledHero>
)
