import {
  useEffect,
  useState,
  useLayoutEffect,
  useCallback,
  useRef,
} from "react"
import { PerfectCursor } from "perfect-cursors"
import { isNil } from "ramda"
import * as THREE from "three"
import { useCursorThreePosition } from "@/hooks/useCursorThreePosition"
import { BaseCursor } from "../BaseCursor"

const usePerfectCursor = (cb: (point: number[]) => void, point?: number[]) => {
  const [pc] = useState(() => new PerfectCursor(cb))

  useLayoutEffect(() => {
    if (point) {
      pc.addPoint(point)
    }
    return () => {
      pc.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pc])

  const onPointChange = useCallback(
    (point: number[]) => pc.addPoint(point),
    [pc]
  )

  return onPointChange
}

export const OtherCursor = ({
  cursor,
  ...restProps
}: {
  cursor: [string, [number, number] | null]
  self?: boolean
}) => {
  const [id, xy] = cursor
  const visible = !!xy
  const ref = useRef<THREE.Group | undefined>()
  const { getCursorThreeX, getCursorThreeY } = useCursorThreePosition()

  const x = xy?.[0]
  const y = xy?.[1]

  const onPointChange = usePerfectCursor(
    useCallback(
      ([x, y]) => {
        if (!ref.current) {
          return
        }

        ref.current.position.x = getCursorThreeX(x)
        ref.current.position.y = getCursorThreeY(y)
      },
      [getCursorThreeX, getCursorThreeY]
    )
  )

  useEffect(() => {
    if (!visible || isNil(x) || isNil(y)) {
      return
    }
    onPointChange([x, y])
  }, [id, x, y, onPointChange, visible])

  return <BaseCursor {...restProps} ref={ref} visible={visible} />
}
