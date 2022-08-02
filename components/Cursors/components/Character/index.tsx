import { useRef, forwardRef, MutableRefObject } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { Instance } from "@react-three/drei"
import { useSpring, animated } from "@react-spring/three"
import { mergeRefs } from "react-merge-refs"

import { Rope } from "../Rope"

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

  const velocityRef = useRef(new THREE.Vector3(0, 0, 0))

  useFrame(() => {
    if (!ref.current || !linkRef.current) {
      return
    }

    const pos = ref.current.position
    const linkPos = linkRef.current.position
    const distance = pos.distanceTo(linkPos)

    if (distance > 4) {
      velocityRef.current.add(
        linkPos
          .clone()
          .sub(pos)
          .normalize()
          .multiplyScalar(distance * 0.001)
      )
    }

    pos.add(velocityRef.current)
    pos.z = -1
    velocityRef.current.multiplyScalar(0.98)
  })

  const spring = useSpring({
    from: { scale: 0 },
    scale: visible ? 1 : 0,
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
