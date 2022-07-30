import { FC, useEffect, useState } from "react"
import styled from "@emotion/styled"
import throttle from "lodash.throttle"
import { Cursor } from "./components/Cursor"

// TODO: react three fiber - InstancedMesh Cursor

const StyledCursors = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  pointer-events: none;
`

let s: WebSocket

export const Cursors: FC = ({ ...restProps }) => {
  const [cursors, setCursors] = useState<Array<[string, [number, number]]>>([])

  useEffect(() => {
    if (!s || s.readyState === WebSocket.CLOSED) {
      s = new WebSocket(`wss://${window.location.host}`)
    }

    console.log(s.readyState)

    const docHeight = document.body.clientHeight

    const handleError = (m) => {
      console.log("error")
    }
    s.addEventListener("error", handleError)

    const handleOpen = (m) => {
      console.log("websocket connection open")
    }
    s.addEventListener("open", handleOpen)

    const handleMessage = (m) => {
      const data = JSON.parse(m.data)
      switch (data.type) {
        case "init":
          console.log("WebSocket initted")
          break

        case "cursors":
          setCursors(
            // @ts-ignore
            data.cursors.map(([id, [x, y]]) => [
              id,
              [x * window.innerWidth, y * docHeight],
            ])
          )
          break
      }
    }
    s.addEventListener("message", handleMessage)

    const handleSendCursorPosition = throttle((e: MouseEvent) => {
      if (s.readyState !== WebSocket.OPEN) {
        return
      }

      s.send(
        JSON.stringify([e.offsetX / window.innerWidth, e.offsetY / docHeight])
      )
    }, 100)

    window.addEventListener("mousemove", handleSendCursorPosition)

    return () => {
      s.removeEventListener("error", handleError)
      s.removeEventListener("open", handleOpen)
      s.removeEventListener("message", handleMessage)
      window.removeEventListener("mousemove", handleSendCursorPosition)
    }
  }, [])

  return (
    <StyledCursors {...restProps}>
      {cursors.map(([id, xy]) => (
        <Cursor key={id} xy={xy} />
      ))}
    </StyledCursors>
  )
}
