import {
  FC,
  useEffect,
  useState,
  useLayoutEffect,
  useCallback,
  useRef,
} from "react"
import styled from "@emotion/styled"
import { PerfectCursor } from "perfect-cursors"

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

const StyledCursor = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 1rem;
  height: 1rem;
  background-color: #00f;
`

const createListenToScroll = () => {
  let listening = false
  let listeners: Array<(scrollY: number) => void> = []

  const handleListen = () => {
    listeners.forEach((cb) => {
      if (typeof cb === "function") {
        cb(window.scrollY)
      }
    })
  }

  return (cb: (scrollY: number) => void) => {
    if (!listening) {
      window.addEventListener("scroll", handleListen)
      listening = true
    }

    listeners.push(cb)
    cb(window.scrollY)

    return () => {
      listeners = listeners.filter((x) => x !== cb)

      if (!listeners.length) {
        window.removeEventListener("scroll", handleListen)
        listening = false
      }
    }
  }
}

const listenToScroll = createListenToScroll()

export const Cursor: FC<{ xy: [number, number] }> = ({ xy, ...restProps }) => {
  const ref = useRef<HTMLDivElement | null>(null)

  const pos = useRef({ xy: [0, 0], scrollY: window.scrollY })

  const updatePosition = useCallback(() => {
    if (!ref.current) {
      return
    }

    const [x, y] = pos.current.xy
    const scrollY = pos.current.scrollY

    ref.current.style.transform = `translate3d(${x}px, ${y - scrollY}px, 0)`
  }, [])

  const onPointChange = usePerfectCursor(
    useCallback((xy: [number, number]) => {
      pos.current.xy = xy
      updatePosition()
    }, [])
  )

  useEffect(() => {
    onPointChange(xy)

    const unlisten = listenToScroll((scrollY) => {
      pos.current.scrollY = scrollY
      updatePosition()
    })

    return () => {
      unlisten()
    }
  }, [xy])

  return <StyledCursor ref={ref} />
}
