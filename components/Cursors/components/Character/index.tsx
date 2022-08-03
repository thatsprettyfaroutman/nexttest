import { useRef, forwardRef, MutableRefObject } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { Instance } from "@react-three/drei"
import { useSpring, animated } from "@react-spring/three"
import { mergeRefs } from "react-merge-refs"
import { useCursorThreePosition } from "@/hooks/useCursorThreePosition"

import { Rope, ROPE_LENGTH, ROPE_END_OFFSET } from "../Rope"

const AnimatedInstance = animated(Instance)

export const Character = forwardRef<
  unknown,
  {
    visible?: boolean
    linkRef: MutableRefObject<THREE.InstancedMesh<
      THREE.BufferGeometry,
      THREE.Material | THREE.Material[]
    > | null>
  }
>(({ visible = true, linkRef, ...restProps }, forwardedRef) => {
  const ref = useRef<THREE.InstancedMesh | null>(null)
  const { scaleRatio } = useCursorThreePosition()
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0))
  const lastTime = useRef(0)
  useFrame((s) => {
    if (!ref.current || !linkRef.current) {
      return
    }
    const deltaTime = s.clock.elapsedTime - lastTime.current
    lastTime.current = s.clock.elapsedTime

    const pos = ref.current.position
    const linkPos = linkRef.current.position.clone().add(ROPE_END_OFFSET)
    const posDistance = pos.clone()
    posDistance.z = 0
    const distance = posDistance.distanceTo(linkPos)

    // Move towards cursor if too far away
    if (distance > ROPE_LENGTH * scaleRatio) {
      velocityRef.current.add(
        linkPos
          .clone()
          .sub(pos)
          .normalize()
          .multiplyScalar(distance * deltaTime * 0.2)
      )
    }

    // Move away from the cursor when too close
    if (distance < 0.5 * scaleRatio) {
      velocityRef.current
        .add(
          linkPos
            .clone()
            .sub(pos)
            .normalize()
            .multiplyScalar((1.5 - distance) * deltaTime * -1)
        )
        .add({ x: 0, y: deltaTime * -0.025, z: 0 } as unknown as THREE.Vector3)
    }

    velocityRef.current.multiplyScalar(0.95)
    pos.add(velocityRef.current)

    pos.z = -1
  })

  const spring = useSpring({
    from: { scale: 0 },
    scale: visible ? 1 * scaleRatio : 0,
  })

  return (
    <>
      <AnimatedInstance
        ref={mergeRefs([forwardedRef, ref])}
        rotation-x={Math.PI * -0.25}
        rotation-y={Math.PI * 0.25}
        scale={spring.scale}
        color="#fff"
        {...restProps}
      />
      <Rope startRef={ref} endRef={linkRef} />
    </>
  )
})

Character.displayName = "Character"
