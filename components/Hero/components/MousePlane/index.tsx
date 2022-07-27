import React, { FC, useRef, useState, useMemo, useEffect } from "react"
import * as THREE from "three"
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber"

const tempPos = new THREE.Vector2(0, 0)

export const MousePlane: FC<{
  width: number
  height: number
  onChange: (coords: THREE.Vector2) => void
}> = ({ width, height, onChange, ...restProps }) => (
  <mesh
    {...restProps}
    onPointerMove={(e) => {
      tempPos.set((e.uv.x - 0.5) * width, (e.uv.y - 0.5) * height)
      onChange && onChange(tempPos)
    }}
    onPointerOut={(e) => {
      onChange && onChange(undefined)
    }}
  >
    <planeGeometry args={[width, height]} />
    <meshBasicMaterial
      args={[{ color: 0xff00ff, transparent: true, opacity: 0 }]}
    />
  </mesh>
)
