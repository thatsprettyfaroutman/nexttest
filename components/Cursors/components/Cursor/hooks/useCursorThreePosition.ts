import { useRef, useCallback } from "react"
import { useThree } from "@react-three/fiber"

export const useCursorThreePosition = () => {
  const {
    size: { width: cw, height: ch },
    viewport: { width: vw, height: vh },
  } = useThree()

  const bounds = useRef({ cw, ch, vw, vh })
  bounds.current = { cw, ch, vw, vh }

  const getCursorThreeX = useCallback((x: number) => {
    const { cw, vw } = bounds.current
    return x * (vw / cw) - vw * 0.5
  }, [])

  const getCursorThreeY = useCallback((y: number) => {
    const { ch, vh } = bounds.current
    return vh - y * (vh / ch) - vh * 0.5
  }, [])

  return {
    cw,
    ch,
    vw,
    vh,
    getCursorThreeX,
    getCursorThreeY,
  }
}
