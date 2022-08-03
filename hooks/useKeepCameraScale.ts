import { useEffect, useMemo } from "react"
import * as THREE from "three"
import { useThree } from "@react-three/fiber"

// Keep objects same size regardless of the viewport size
// Inspired by: https://jsfiddle.net/Q4Jpu/

// This works kinda like media queries in css. Pretty neat!
const getIdealHeight = (width: number) => {
  if (width >= 768) {
    return 800
  }

  return 400
}

export const useKeepCameraScale = ({ idealFov = 20 } = {}) => {
  const {
    setSize,
    camera,
    size: { width, height },
  } = useThree() as {
    setSize: (w: number, h: number) => void
    camera: THREE.PerspectiveCamera
    size: { width: number; height: number }
  }

  const tanFov = useMemo(
    () => Math.tan(((Math.PI / 180) * idealFov) / 2),
    [idealFov]
  )

  // Keep scale
  useEffect(() => {
    if (camera.type !== "PerspectiveCamera") {
      return
    }
    camera.aspect = width / height

    const idealHeight = getIdealHeight(width)

    // adjust the fov
    camera.fov = (360 / Math.PI) * Math.atan(tanFov * (height / idealHeight))

    camera.updateProjectionMatrix()

    // Make sure r3f can keep up
    setSize(width, height)
  }, [camera, tanFov, width, height, setSize])
}
