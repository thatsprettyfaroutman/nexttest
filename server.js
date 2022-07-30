const { createServer } = require("http")
const express = require("express")
const next = require("next")
const WebSocket = require("ws")

// TODO: ts

// References:
// - https://nextjs.org/docs/advanced-features/custom-server
// - https://github.com/vercel/next.js/tree/canary/examples/custom-server-express
// - https://github.com/websockets/ws

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== "production"
const nextApp = next({ dev })
const nextHandler = nextApp.getRequestHandler()

nextApp.prepare().then(() => {
  // Express server - for handling incoming HTTP requests from Gravio
  const expressApp = express()

  // Node http server - added to for integrating WebSocket server
  const server = createServer(expressApp)

  // WebSocket server - for sending realtime updates to UI
  console.log("WSS init")
  const wss = new WebSocket.Server({ noServer: true })

  let cursorsNeedUpdate = true
  const cursorPositions = {}

  setInterval(() => {
    if (!wss.clients.size || !cursorsNeedUpdate) {
      return
    }

    const cursors = Object.entries(cursorPositions)

    wss.clients.forEach((ws) => {
      ws.send(JSON.stringify({ type: "cursors", cursors }))
    })
    cursorsNeedUpdate = false
  }, 100)

  wss.on("connection", async (ws) => {
    ws.id = Math.floor((1 + Math.random()) * 0xffffffff)
      .toString(32)
      .slice(-8)
    console.log("incoming connection", ws.id)
    ws.send(JSON.stringify({ type: "init", id: ws.id }))
    ws.onmessage = (m) => {
      cursorPositions[ws.id] = JSON.parse(m.data)
      cursorsNeedUpdate = true
    }
    ws.onclose = () => {
      delete cursorPositions[ws.id]
      console.log("connection closed", ws.id, wss.clients.size)
    }
  })

  server.on("upgrade", function (req, socket, head) {
    if (!req.url.includes("/_next/webpack-hmr")) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req)
      })
    }
  })

  // To handle Next.js routing
  expressApp.all("*", (req, res) => {
    return nextHandler(req, res)
  })

  // Start the server!
  server.listen(port, (err) => {
    if (err) throw err
    console.log(`Ready on http://127.0.0.1:${port}`)
  })
})
