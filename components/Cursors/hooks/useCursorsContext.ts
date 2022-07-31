import { useEffect, useState, useRef, useCallback } from "react"
import constate from "constate"

// TODO: reconnect on disconnect somehow dunno

const getWebSocket = () => new WebSocket(`wss://${window.location.host}`)

const useCursors = () => {
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [otherCursors, setOtherCursors] = useState<
    Array<[string, [number, number]]>
  >([])

  const selfCursorIdRef = useRef()

  useEffect(() => {
    let mounted = true
    let socket: WebSocket = getWebSocket()
    const handleConnect = () => {
      socket = getWebSocket()
    }

    // TODO: track docheight on resize (only)
    // const docHeight = document.body.clientHeight

    const handleOpen = (e: Event) => {
      console.log("websocket connection open")
      if (mounted) {
        setSocket(socket)
        setLoading(false)
      }
    }
    socket.addEventListener("open", handleOpen)

    const handleMessage = (e: MessageEvent) => {
      const data = JSON.parse(e.data)

      if (!mounted) {
        return
      }

      switch (data.type) {
        case "init":
          console.log("WebSocket initted")
          selfCursorIdRef.current = data.id
          break

        case "cursors":
          setOtherCursors(
            data.cursors
              // @ts-ignore
              // .filter(([id]) => id !== selfCursorIdRef.current)
              // @ts-ignore
              .map(([id, [x, y]]) => [
                id,
                [
                  x * window.innerWidth,
                  // TODO: y relative to document.body.clientHeight
                  y, //* docHeight
                ],
              ])
          )
          break
      }
    }
    socket.addEventListener("message", handleMessage)

    const handleDisconnect = () => {
      socket.removeEventListener("open", handleOpen)
      socket.removeEventListener("error", handleClose)
      socket.removeEventListener("close", handleClose)
      socket.removeEventListener("message", handleMessage)
      if (mounted) {
        setLoading(true)
        setSocket(null)
      }
    }

    const handleClose = (e: Event) => {
      console.log("websocket connection closed", e)
      handleDisconnect()

      if (mounted) {
        setSocket(null)
        handleConnect()
      }
    }
    socket.addEventListener("close", handleClose)
    socket.addEventListener("error", handleClose)

    /*
      const sendCursorPosition = throttle(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          return
        }

        const [x, y] = selfCursorPositionRef.current

        socket.send(JSON.stringify([x / window.innerWidth, y / docHeight]))
      }, 100)

      const handleSendCursorPosition = (e: MouseEvent) => {
        selfCursorPositionRef.current = [e.x, e.y + scrollY]
        sendCursorPosition()
      }

      window.addEventListener("mousemove", handleSendCursorPosition)
    */

    return () => {
      mounted = false
      // window.removeEventListener("mousemove", handleSendCursorPosition)

      handleDisconnect()
    }
  }, [])

  const sendCursorPosition = useCallback(
    (x: number, y: number) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        return
      }

      // TODO: y relative to document.body.clientHeight
      socket.send(JSON.stringify([x / window.innerWidth, y + scrollY]))
    },
    [socket]
  )

  return { loading, otherCursors, sendCursorPosition }
}

export const [CursorsProvider, useCursorsContext] = constate(useCursors)
