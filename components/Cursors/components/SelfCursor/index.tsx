import { useEffect, useRef } from "react"
import * as THREE from "three"
import throttle from "lodash.throttle"
import { useCursorsContext } from "../../hooks/useCursorsContext"
import { Cursor, useCursorThreePosition } from "../Cursor"

export const SelfCursor = ({ ...restProps }) => {
  const { sendCursorPosition } = useCursorsContext()
  const ref = useRef<THREE.InstancedMesh | null>(null)

  const { getCursorThreeX, getCursorThreeY } = useCursorThreePosition()

  useEffect(() => {
    const throttledSendCursorPosition = throttle(sendCursorPosition, 100)

    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) {
        return
      }

      ref.current.position.x = getCursorThreeX(e.x)
      ref.current.position.y = getCursorThreeY(e.y)

      throttledSendCursorPosition(e.x, e.y)
    }

    document.body.addEventListener("mousemove", handleMouseMove)

    return () => {
      document.body.removeEventListener("mousemove", handleMouseMove)
    }
  }, [getCursorThreeX, getCursorThreeY, sendCursorPosition])

  return <Cursor ref={ref} color="#fff" {...restProps} />
}
