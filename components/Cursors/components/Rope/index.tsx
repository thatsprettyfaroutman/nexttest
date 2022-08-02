import { MutableRefObject, useMemo, useRef, useState } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { Line } from "@react-three/drei"

import { RopePhysics } from "./lib"
import { Line2 } from "three-stdlib"

// TODO: use tube

const START_OFFSET = new THREE.Vector3(0, 0, -0.2)
const END_OFFSET = new THREE.Vector3(0, -0.4, 0)

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
    () => [new THREE.Vector3(-2, 0, 0), new THREE.Vector3(2, 0, 0)],
    []
  )

  const rope = useMemo(() => {
    const ropePoints = RopePhysics.generate(
      initPoints[0],
      initPoints[1],
      0.2,
      0.88,
      0.95
    )
    return new RopePhysics(ropePoints, 500, new THREE.Vector3(0, -1, -10))
  }, [initPoints])

  const lastTime = useRef(0)
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
      pointA.pos = start.position.clone().add(START_OFFSET)
      pointB.pos = end.position.clone().add(END_OFFSET)
      rope.update(deltaTime)
    }

    line.geometry.setPositions(
      rope
        .getPoints()
        .map((p) => p.pos.toArray())
        .flat()
    )
  })

  return <Line ref={ref} points={initPoints} color="#f0f" lineWidth={3} />
}
