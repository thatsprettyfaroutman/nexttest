import { useEffect, useRef, useState, forwardRef } from "react"
import * as THREE from "three"
import { mergeRefs } from "react-merge-refs"
import throttle from "lodash.throttle"
import { useCursorsContext } from "@/hooks/useCursorsContext"
import { useCursorThreePosition } from "@/hooks/useCursorThreePosition"
import { BaseCursor } from "../BaseCursor"

export const SelfCursor = forwardRef(({ ...restProps }, forwardedRef) => {
  const { sendCursorPosition } = useCursorsContext()
  const ref = useRef<THREE.InstancedMesh | null>(null)
  const [visible, setVisible] = useState(false)

  const { getCursorThreeX, getCursorThreeY } = useCursorThreePosition()

  useEffect(() => {
    const throttledSendCursorPosition = throttle(sendCursorPosition, 100)

    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) {
        return
      }

      setVisible(true)

      ref.current.position.x = getCursorThreeX(e.x)
      ref.current.position.y = getCursorThreeY(e.y)

      throttledSendCursorPosition(e.x, e.y)
    }

    const handleMouseEnter = (e: MouseEvent) => {
      handleMouseMove(e)
      setVisible(true)
    }

    const handleMouseLeave = (e: MouseEvent) => {
      setVisible(false)
      throttledSendCursorPosition(null, null)
    }

    document.body.addEventListener("mousemove", handleMouseMove)
    document.body.addEventListener("mouseenter", handleMouseEnter)
    document.body.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      document.body.removeEventListener("mousemove", handleMouseMove)
      document.body.removeEventListener("mouseenter", handleMouseEnter)
      document.body.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [getCursorThreeX, getCursorThreeY, sendCursorPosition])

  return (
    <BaseCursor
      ref={mergeRefs([ref, forwardedRef])}
      color="#fff"
      visible={visible}
      {...restProps}
    />
  )
})

SelfCursor.displayName = "SelfCursor"
