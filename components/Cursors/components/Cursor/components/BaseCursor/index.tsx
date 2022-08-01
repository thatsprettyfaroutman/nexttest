import { useRef, forwardRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { Instance, Edges } from "@react-three/drei"
import { useSpring, animated } from "@react-spring/three"
import { mergeRefs } from "react-merge-refs"

import { useCursorThreePosition } from "../../hooks/useCursorThreePosition"

const CURSOR_SCALE = 0.1

const AnimatedInstance = animated(Instance)
const AnimatedEdges = animated(Edges)

export const BaseCursor = forwardRef<
  unknown,
  { color?: string; visible?: boolean; edges?: string }
>(({ color, visible = true, edges, ...restProps }, forwardedRef) => {
  const ref = useRef<THREE.InstancedMesh | null>(null)
  const edgesRef = useRef<THREE.Mesh | null>(null)

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

    const edges = ref.current?.parent?.children?.[1]
    if (!edges) {
      return
    }
    edges.position.x = ref.current.position.x
    edges.position.y = ref.current.position.y
    edges.position.z = ref.current.position.z
    edges.rotation.x = ref.current.rotation.x
    edges.rotation.y = ref.current.rotation.y
    edges.rotation.z = ref.current.rotation.z
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
        scale={spring.scale.to((scale: number) => scale * CURSOR_SCALE)}
        color={color || "#fff"}
        {...restProps}
      />

      {edges && (
        <AnimatedEdges
          ref={edgesRef}
          color={edges}
          scale={spring.scale.to((scale: number) => scale * CURSOR_SCALE)}
        />
      )}
    </>
  )
})

BaseCursor.displayName = "BaseCursor"
