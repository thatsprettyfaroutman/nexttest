import { MutableRefObject, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { Line2 } from "three-stdlib"
import { useCursorThreePosition } from "@/hooks/useCursorThreePosition"
import { RopePhysics, RopeCurve } from "./lib"

const ROPE_START_OFFSET = new THREE.Vector3(0, 0, -0.25)
export const ROPE_END_OFFSET = new THREE.Vector3(0, -0.1, 0)
export const ROPE_LENGTH = 2

export const Rope = ({
  startRef,
  endRef,
}: {
  startRef: MutableRefObject<THREE.InstancedMesh<
    THREE.BufferGeometry,
    THREE.Material | THREE.Material[]
  > | null>
  endRef: MutableRefObject<THREE.InstancedMesh<
    THREE.BufferGeometry,
    THREE.Material | THREE.Material[]
  > | null>
}) => {
  const ref = useRef<Line2 | null>(null)

  const initPoints = useMemo(
    () => [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -ROPE_LENGTH, 0)],
    []
  )

  const rope = useMemo(() => {
    const ropePoints = RopePhysics.generate(
      initPoints[0],
      initPoints[1],
      0.25,
      0.88,
      0.95
    )
    return new RopePhysics(ropePoints, 500, new THREE.Vector3(0, -5, -1))
  }, [initPoints])

  const lastTime = useRef(0)
  const ropeCurve = useMemo(() => new RopeCurve(rope), [rope])
  useFrame((s) => {
    const deltaTime = s.clock.elapsedTime - lastTime.current
    lastTime.current = s.clock.elapsedTime

    const line = ref.current
    const start = startRef.current
    const end = endRef.current
    if (!line || !start || !end) {
      return
    }

    if (rope) {
      const pointA = rope.getFirstPoint()
      const pointB = rope.getLastPoint()
      pointA.pos = start.position.clone().add(ROPE_START_OFFSET)
      pointB.pos = end.position.clone().add(ROPE_END_OFFSET)
      rope.update(deltaTime)
    }

    // line.geometry.setPositions(
    //   rope
    //     .getPoints()
    //     .map((p) => p.pos.toArray())
    //     .flat()
    // )

    if (rope) {
      // @ts-ignore
      line.geometry = new THREE.TubeGeometry(
        ropeCurve,
        rope.getPoints().length,
        0.025,
        8,
        false
      )
    }
  })

  // return <Line ref={ref} points={initPoints} color="#f0f" lineWidth={2} />

  return (
    <mesh ref={ref}>
      <tubeBufferGeometry
      // args={[ropeCurve, ropeCurve._rope._points.length, 0.1, 8, false]}
      />
      <meshStandardMaterial args={[{ color: "#f8f" }]} />
    </mesh>
  )
}
