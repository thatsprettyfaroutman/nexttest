import { useEffect, useRef } from "react"

let listeners: ((size: number) => void)[] = []

let resizeObserver: ResizeObserver | undefined

export const useTrackBodySize = () => {
  const bodySizeRef = useRef(document.body.clientHeight)

  useEffect(() => {
    if (!resizeObserver) {
      resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.contentBoxSize) {
            // Firefox implements `contentBoxSize` as a single content rect, rather than an array
            const prettySureThisIsMostlyHeight = (
              Array.isArray(entry.contentBoxSize)
                ? entry.contentBoxSize[0]
                : entry.contentBoxSize
            ).blockSize
            listeners.forEach((cb) => cb(prettySureThisIsMostlyHeight))
          }
        }
      })
      resizeObserver.observe(document.body)
    }

    const listener = (size: number) => {
      if (!bodySizeRef) {
        return
      }
      console.log("incoming size", size)
      bodySizeRef.current = size
    }

    listeners.push(listener)

    return () => {
      listeners = listeners.filter((x) => x !== listener)
    }
  }, [])

  return bodySizeRef
}
