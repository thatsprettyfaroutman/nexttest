import {
  useEffect,
  useState,
  useLayoutEffect,
  useCallback,
  useRef,
} from "react"
import { PerfectCursor } from "perfect-cursors"
import * as THREE from "three"
import { Cursor, useCursorThreePosition } from "../Cursor"

const usePerfectCursor = (cb: (point: number[]) => void, point?: number[]) => {
  const [pc] = useState(() => new PerfectCursor(cb))

  useLayoutEffect(() => {
    if (point) pc.addPoint(point)
    return () => pc.dispose()
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
  cursor: [string, [number, number]]
}) => {
  const [id, xy] = cursor
  const ref = useRef<THREE.Mesh | undefined>()

  const { getCursorThreeX, getCursorThreeY } = useCursorThreePosition()

  /*
  const updatePosition = useCallback(() => {
    if (!ref.current) {
      return
    }

    const [x, y] = isSelf ? selfCursorPositionRef.current : pos.current.xy

    const xp = x / window.innerWidth

    const scrollY = pos.current.scrollY
    ref.current.position.x = (x / window.innerWidth) * width - width * 0.5
    ref.current.position.y =
      (y /
        //+ -scrollY
        document.body.clientHeight) *
        -h +
      height * 0.5
    ref.current.rotation.y = THREE.MathUtils.lerp(
      Math.PI * 0.25 + Math.PI * 0.5,
      Math.PI * 0.25,
      xp
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelf, width, h, height])

*/

  const onPointChange = usePerfectCursor(
    useCallback(
      (xy: number[]) => {
        if (!ref.current) {
          return
        }

        const [x, y] = xy
        ref.current.position.x = getCursorThreeX(x)
        ref.current.position.y = getCursorThreeY(y)
      },
      [getCursorThreeX, getCursorThreeY]
    )
  )

  useEffect(() => {
    onPointChange(xy)
  }, [xy, onPointChange])

  return <Cursor {...restProps} ref={ref} color="#f0f" position-z={-0.1} />
}
