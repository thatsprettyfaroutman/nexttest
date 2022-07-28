import React, { FC } from "react"
import * as THREE from "three"

const tempPos = new THREE.Vector2(0, 0)

export const MousePlane: FC<{
  width: number
  height: number
  onChange: (coords?: THREE.Vector2) => void
}> = ({ width, height, onChange, ...restProps }) => {
  return (
    <mesh
      {...restProps}
      onPointerMove={(e) => {
        e.stopPropagation()

        if (!e.uv) {
          return
        }

        tempPos.set((e.uv.x - 0.5) * width, (e.uv.y - 0.5) * height)
        onChange && onChange(tempPos)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        onChange && onChange(undefined)
      }}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        args={[{ color: 0xff00ff, transparent: true, opacity: 0 }]}
      />
    </mesh>
  )
}
