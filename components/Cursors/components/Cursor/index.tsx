import { useRef, forwardRef } from "react"
import * as THREE from "three"
import { useThree, useFrame } from "@react-three/fiber"
import { Instance } from "@react-three/drei"
import { useSpring, animated } from "@react-spring/three"
import { mergeRefs } from "react-merge-refs"
import { useCursorThreePosition } from "./hooks/useCursorThreePosition"

export * from "./hooks/useCursorThreePosition"

const CURSOR_SCALE = 0.1

const AnimatedInstance = animated(Instance)

export const Cursor = forwardRef<
  unknown,
  { color?: string; visible?: boolean }
>(({ color, visible = true, ...restProps }, forwardedRef) => {
  const ref = useRef<THREE.InstancedMesh | null>(null)

  const { boundsRef } = useCursorThreePosition()

  useFrame(() => {
    if (!ref.current) {
      return
    }

    const { vw } = boundsRef.current
    const xp = ref.current.position.x / vw + 0.5
    ref.current.rotation.y = THREE.MathUtils.lerp(
      Math.PI * 0.25 + Math.PI * 0.5,
      Math.PI * 0.25,
      xp
    )
  })

  const spring = useSpring({
    from: { scale: 0 },
    scale: visible ? 1 : 0,
  })

  return (
    <AnimatedInstance
      ref={mergeRefs([forwardedRef, ref])}
      rotation-x={Math.PI * -0.25}
      scale={spring.scale.to((scale: number) => scale * CURSOR_SCALE)}
      color={color || "#fff"}
      {...restProps}
    />
  )
})

Cursor.displayName = "Cursor"
