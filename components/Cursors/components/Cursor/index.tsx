import { useRef, forwardRef } from "react"
import * as THREE from "three"
import { useThree, useFrame } from "@react-three/fiber"
import { Instance } from "@react-three/drei"
import { mergeRefs } from "react-merge-refs"

export * from "./hooks/useCursorThreePosition"

export const Cursor = forwardRef<unknown, { color: string }>(
  ({ color, ...restProps }, forwardedRef) => {
    const ref = useRef<THREE.InstancedMesh | null>(null)

    const {
      size: { width: cw, height: ch },
      viewport: { width: vw, height: vh },
    } = useThree()

    const bounds = useRef({ cw, ch, vw, vh })
    bounds.current = { cw, ch, vw, vh }

    useFrame(() => {
      if (!ref.current) {
        return
      }

      const { vw } = bounds.current
      const xp = ref.current.position.x / vw + 0.5
      ref.current.rotation.y = THREE.MathUtils.lerp(
        Math.PI * 0.25 + Math.PI * 0.5,
        Math.PI * 0.25,
        xp
      )
    })

    return (
      <Instance
        ref={mergeRefs([forwardedRef, ref])}
        scale={[0.025, 0.025, 0.025]}
        rotation-x={Math.PI * -0.5}
        rotation-z={Math.PI * 0.25}
        color={color || "#fff"}
        {...restProps}
      />
    )
  }
)

Cursor.displayName = "Cursor"
