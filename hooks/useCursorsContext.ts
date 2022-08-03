import { useEffect, useState, useCallback } from "react"
import { isNil } from "ramda"
import constate from "constate"
import { useTrackBodySize } from "./useTrackBodySize"

const getWebSocket = () => new WebSocket(`wss://${window.location.host}`)

const useCursors = () => {
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [otherCursors, setOtherCursors] = useState<
    Array<[string, [number, number] | null]>
  >([])
  const bodySizeRef = useTrackBodySize()
  const [selfCursorId, setSelfCursorId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let socket: WebSocket

    const handleOpen = (e: Event) => {
      console.log("websocket connection open")
      if (mounted) {
        setSocket(socket)
        setLoading(false)
      }
    }

    const handleMessage = (e: MessageEvent) => {
      const data = JSON.parse(e.data)

      if (!mounted) {
        return
      }

      switch (data.type) {
        case "init":
          console.log("WebSocket initted")
          setSelfCursorId(data.id)
          break

        case "cursors":
          setOtherCursors(
            (data.cursors as [string, [number, number] | null][])
              // @ts-ignore
              // .filter(([id]) => id !== selfCursorIdRef.current)
              // @ts-ignore
              .map(([id, xy]) => {
                if (isNil(xy)) {
                  return [id, null]
                }

                const [x, y] = xy
                return [id, [x * window.innerWidth, y * bodySizeRef.current]]
              })
          )
          break
      }
    }

    const handleDisconnect = () => {
      socket.removeEventListener("open", handleOpen)
      socket.removeEventListener("error", handleClose)
      socket.removeEventListener("close", handleClose)
      socket.removeEventListener("message", handleMessage)
      socket.close()
      if (mounted) {
        setSelfCursorId(null)
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

    const handleConnect = () => {
      socket = getWebSocket()
      socket.addEventListener("open", handleOpen)
      socket.addEventListener("message", handleMessage)
      socket.addEventListener("close", handleClose)
      socket.addEventListener("error", handleClose)
    }

    handleConnect()

    return () => {
      mounted = false
      handleDisconnect()
    }
  }, [bodySizeRef])

  const sendCursorPosition = useCallback(
    (x: number | null, y: number | null) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        return
      }

      // This hides the cursor
      if (x === null || y === null) {
        socket.send(JSON.stringify(null))
        return
      }

      socket.send(
        JSON.stringify([
          x / window.innerWidth,
          (y + scrollY) / bodySizeRef.current,
        ])
      )
    },
    [socket, bodySizeRef]
  )

  return { loading, otherCursors, sendCursorPosition, selfCursorId }
}

export const [CursorsProvider, useCursorsContext] = constate(useCursors)
