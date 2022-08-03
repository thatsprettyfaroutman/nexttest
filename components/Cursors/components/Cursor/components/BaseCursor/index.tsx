import { useRef, forwardRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { Instance, Html } from "@react-three/drei"
import { useSpring, animated } from "@react-spring/three"
import { mergeRefs } from "react-merge-refs"
import { useCursorThreePosition } from "@/hooks/useCursorThreePosition"

const CURSOR_SCALE = 0.1

const AnimatedInstance = animated(Instance)

export const BaseCursor = forwardRef<
  unknown,
  {
    label?: string
    color?: string
    visible?: boolean
    edges?: string
  }
>(({ label, color, visible = true, edges, ...restProps }, forwardedRef) => {
  const ref = useRef<THREE.InstancedMesh | null>(null)
  const { boundsRef } = useCursorThreePosition()

  useFrame(() => {
    if (!ref.current) {
      return
    }

    const { vw, vh } = boundsRef.current
    const xp = ref.current.position.x / vw + 0.5
    ref.current.rotation.y = THREE.MathUtils.lerp(
      Math.PI * 0.65,
      Math.PI * 0.35,
      xp
    )

    const yp = ref.current.position.y / vh + 0.5
    ref.current.rotation.x = THREE.MathUtils.lerp(
      Math.PI * -0.45,
      Math.PI * -0.25,
      yp
    )
  })

  const spring = useSpring({
    from: { scale: 0 },
    scale: visible ? 1 : 0,
  })

  return (
    <AnimatedInstance
      ref={mergeRefs([forwardedRef, ref])}
      scale={spring.scale.to((scale: number) => scale * CURSOR_SCALE)}
      color={color || "#fff"}
      {...restProps}
    >
      {label && <Html>{label}</Html>}
    </AnimatedInstance>
  )
})

BaseCursor.displayName = "BaseCursor"
