import React, { FC, useRef, useMemo, MutableRefObject } from "react"
import styled from "@emotion/styled"
import { splitEvery } from "ramda"
import * as THREE from "three"
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber"
import { Effects } from "@react-three/drei"
import { SSAOPass, UnrealBloomPass } from "three-stdlib"
import { getCharacters } from "./characters"
import { MousePlane } from "./components/MousePlane"
import chroma from "chroma-js"
import { easeCubicIn } from "d3-ease"
import { useControls } from "leva"

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

const tempObject = new THREE.Object3D()
const tempColor = new THREE.Color()
const origin = new THREE.Vector3(0, 0, 0)

const BLOB_DEFAULT_POSITION = new THREE.Vector2(0, 1)
const BLOB = {
  position: BLOB_DEFAULT_POSITION.clone(),
  velocity: new THREE.Vector2(0, 0),
}

const Boxes = ({
  title,
  mouseRef,
  cols: BOX_COLS,
  rows: BOX_ROWS,
  size: BOX_SIZE,
  gap: BOX_GAP,
  fg,
  bgA,
  bgB,
  blobMode,
  blobMagic,
  blobSize,
  curvature,
  coneness,
  textScale,
}: {
  title?: string
  mouseRef: MutableRefObject<undefined | THREE.Vector2>
  cols: number
  rows: number
  size: number
  gap: number
  fg: string
  bgA: string
  bgB: string
  blobMode: string
  blobMagic: number
  blobSize: number
  curvature: number
  coneness: number
  textScale: number
}) => {
  const BOX_COUNT = (BOX_COLS + 1) * (BOX_ROWS + 1)

  const data = useMemo(() => {
    const TEXT = getCharacters(title || " ")
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

      const colorGrade =
        Math.abs((offsetX - BOX_COLS * 0.5) / BOX_COLS) +
        Math.abs((offsetY - BOX_ROWS * 0.5) / BOX_ROWS)

      const color = chroma.mix(bgA, bgB, easeCubicIn(colorGrade)).hex()

      return {
        color:
          // offsetX === 0 && offsetY === 0
          //   ? 0xffff00
          //   : offsetX === 0
          //   ? 0x0000ff
          //   : offsetY === 0
          //   ? 0x00ffff
          //   : x === 0
          //   ? 0x00ff00
          //   : y === 0
          //   ? 0xff00ff
          //   :
          isInCharacter ? chroma(fg).hex() : color,
        scale: isInCharacter ? textScale : 1,
      }
    })

    return data
  }, [title, BOX_COLS, BOX_ROWS, BOX_COUNT, fg, bgA, bgB, textScale])

  // const [hovered, set] = useState()
  const colorArray = useMemo(
    () =>
      Float32Array.from(
        new Array(BOX_COUNT)
          .fill(null)
          .flatMap((_, i) => tempColor.set(data[i].color).toArray())
      ),
    [data, BOX_COUNT]
  )
  const meshRef = useRef<THREE.Mesh | undefined>()
  // const prevRef = useRef<THREE.Mesh | undefined>()

  // useEffect(() => void (prevRef.current = hovered), [hovered])

  useFrame((state) => {
    if (!meshRef.current) {
      return
    }

    const time = state.clock.getElapsedTime()
    meshRef.current.rotation.x = -0.2 // Math.sin(time / 4)
    meshRef.current.rotation.y = 0 // Math.sin(time / 2)

    if (mouseRef.current) {
      const blobDistanceToMouse = BLOB.position
        .clone()
        .sub(mouseRef.current || BLOB_DEFAULT_POSITION)

      if (blobDistanceToMouse) {
        BLOB.velocity.x = -Math.sin(blobDistanceToMouse.x * 0.05)
        BLOB.velocity.y = -Math.sin(blobDistanceToMouse.y * 0.05)
      }
    }

    BLOB.position.x += BLOB.velocity.x
    BLOB.position.y += BLOB.velocity.y

    BLOB.velocity.multiplyScalar(0.97)

    // Tilt based on mouseRef
    // if (mouseRef.current && meshRef.current) {
    //   const distanceToMouse = mouseRef.current
    //     .clone()
    //     .sub(origin as unknown as THREE.Vector2)

    //   meshRef.current.rotation.x = distanceToMouse.y * -0.1
    //   meshRef.current.rotation.y = distanceToMouse.x * 0.01
    // }

    let i = 0
    for (let ix = 0; ix < BOX_COLS + 1; ix++)
      for (let iy = 0; iy < BOX_ROWS + 1; iy++) {
        const id = i++
        const y = iy * BOX_GAP
        const x = ix * BOX_GAP
        const z = 0

        const hw = BOX_GAP * BOX_COLS * 0.5
        const hh = BOX_GAP * BOX_ROWS * 0.5

        const xp = (x - hw) / hw
        const yp = y / hh / hh

        tempObject.position.set(
          x - hw,
          y - hh,
          z //y * -0.5 //5 - z
        )

        tempObject.position.z =
          tempObject.position.distanceTo(origin) *
          (curvature ? Math.abs(xp) * -curvature : 1) *
          (coneness ? Math.abs(yp) * coneness : 1)

        // if (mouseRef.current) {
        const blobDistanceToMouse =
          mouseRef.current?.distanceTo(BLOB.position) || 1

        const distanceToBlob = BLOB.position.distanceTo(
          tempObject.position as unknown as THREE.Vector2
        )

        // const zp = distanceToMouse < 0.5 ? 0.5 - distanceToMouse : 0
        // tempObject.position.z += Math.sin(zp * (id % 5)) * Math.PI * 0.25

        const zp =
          (distanceToBlob < blobSize ? blobSize - distanceToBlob : 0) / blobSize

        const blobMathFn = blobMode === "tan" ? Math.tan : Math.sin

        let zplus = blobMathFn(zp * blobMagic) * -0.5

        // if (zplus > 0) {
        //   zplus *= -0.5
        // }

        tempObject.position.z += zplus // (blobMagic ? id % blobMagic : 1)
        //  *
        // (id % 2 === 0 ? -1 : 1)

        // tempObject.rotation.y =
        //   Math.sin(x / 4.1 + time) +
        //   Math.sin(y / 2.3 + time) +
        //   Math.sin(z / 4 + time)
        tempObject.rotation.y =
          Math.sin(x / 4.1 + time) + Math.sin(y / 12.3 + time)
        tempObject.rotation.z = tempObject.rotation.y * 2

        // tempObject.position.x += Math.tan(tempObject.position.x / 10 + time)

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
      // onPointerMove={(e) => (e.stopPropagation(), set(e.instanceId))}
      // onPointerOut={(e) => set(undefined)}
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
      {/* <sSAOPass args={[scene, camera]} kernelRadius={0.5} maxDistance={0.1} /> */}
      {/* @ts-ignore */}
      <unrealBloomPass threshold={0.9} strength={0.75} radius={0.5} />
    </Effects>
  )
}

export const Hero: FC<{ title: string }> = ({
  title,
  children,
  ...restProps
}) => {
  const {
    cols,
    rows,
    size,
    gap,
    fg,
    bgA,
    bgB,
    blobMode,
    blobMagic,
    blobSize,
    curvature,
    coneness,
    textScale,
  } = useControls({
    cols: {
      value: 150, // 105, // 90, // 80,
      min: 1,
      max: 500,
    },
    rows: {
      value: 30, // 10, //25, // 60,
      min: 1,
      max: 500,
    },
    gap: {
      value: 0.08, // 0.16, // 0.2, //0.125 * 0.5,
      min: 0.0001,
      max: 1,
    },
    size: {
      value: 0.01, // 0.17, // 0.13, // 0.1,
      min: 0.0001,
      max: 0.2,
      step: 0.001,
    },
    fg: "#fff",
    bgA: "#f0f",
    bgB: "#00f",
    blobMode: {
      options: ["sin", "tan"],
    },
    blobMagic: {
      value: 27, // 6.5, // 6, // 5,
      min: -50,
      max: 50,
    },
    blobSize: {
      value: 10, // 0.9, // 1.2, // 1,
      min: 0.001,
      max: 30,
    },
    curvature: { value: 0.01, min: -4, max: 4, step: 0.001 },
    coneness: { value: 0, min: -10, max: 10, step: 0.001 },
    textScale: {
      value: 1.5,
      min: 0.01,
      max: 10,
      step: 0.001,
    },
  })

  const mouseRef = useRef<undefined | THREE.Vector2>()

  const boxesWidth = cols * gap + size
  const boxesHeight = rows * gap + size

  return (
    <StyledHero {...restProps}>
      <Canvas flat linear dpr={2}>
        {/* <ambientLight /> */}
        {/* <pointLight position={[1, 1, -1]} /> */}
        <Boxes
          title={title}
          mouseRef={mouseRef}
          cols={cols}
          rows={rows}
          size={size}
          gap={gap}
          fg={fg}
          bgA={bgA}
          bgB={bgB}
          blobMode={blobMode}
          blobMagic={blobMagic}
          blobSize={blobSize}
          curvature={curvature}
          coneness={coneness}
          textScale={textScale}
        />
        <MousePlane
          onChange={(pos) => {
            mouseRef.current = pos
          }}
          width={boxesWidth}
          height={boxesHeight}
        />
        {/* <Post /> */}
      </Canvas>
      <Content>{children}</Content>
    </StyledHero>
  )
}
