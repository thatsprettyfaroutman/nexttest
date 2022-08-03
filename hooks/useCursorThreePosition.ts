// TODO: move this file to root hooks dir

import { useRef, useCallback, useMemo } from "react"
import { useThree } from "@react-three/fiber"

export const useCursorThreePosition = () => {
  const {
    size: { width: cw, height: ch },
    viewport: { width: vw, height: vh },
  } = useThree()

  const boundsRef = useRef({ cw, ch, vw, vh })
  boundsRef.current = { cw, ch, vw, vh }

  const scaleRatio = useMemo(() => (vh / ch) * 100, [vh, ch])

  const getCursorThreeX = useCallback((x: number) => {
    const { cw, vw } = boundsRef.current
    return x * (vw / cw) - vw * 0.5
  }, [])

  const getCursorThreeY = useCallback((y: number) => {
    const { ch, vh } = boundsRef.current
    return vh - y * (vh / ch) - vh * 0.5
  }, [])

  return {
    boundsRef,
    scaleRatio,
    getCursorThreeX,
    getCursorThreeY,
  }
}
