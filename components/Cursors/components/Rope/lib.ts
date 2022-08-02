import * as THREE from "three"

//each rope part is one of these
//uses a high precison varient of Störmer–Verlet integration
//to keep the simulation consistant otherwise it would "explode"!
class RopePoint {
  pos: THREE.Vector3
  distanceToNextPoint: number
  isFixed: boolean
  oldPos: THREE.Vector3
  velocity: THREE.Vector3
  mass: number
  damping: number
  prev: RopePoint | null
  next: RopePoint | null

  //integrates motion equations per node without taking into account relationship
  //with other nodes...
  static integrate(
    point: RopePoint,
    gravity: THREE.Vector3,
    // deltaTime in seconds!!
    dts: number,
    previousFrameDts: number
  ) {
    // point.velocity = THREE.Vector3.sub(point.pos, point.oldPos)
    point.velocity = point.pos.clone().sub(point.oldPos)
    point.oldPos = point.pos.clone()

    //drastically improves stability
    let timeCorrection = previousFrameDts !== 0.0 ? dts / previousFrameDts : 0.0

    // let accel = THREE.Vector3.add(gravity, { x: 0, y: point.mass })
    // let accel = gravity.clone().add({
    //   x: 0,
    //   y: point.mass,
    //   z: 0,
    // } as unknown as THREE.Vector3)
    let accel = gravity.clone().addScalar(point.mass)

    const velCoef = timeCorrection * point.damping
    const accelCoef = Math.pow(dts, 2)

    // point.pos.x += point.velocity.x * velCoef + accel.x * accelCoef
    // point.pos.y += point.velocity.y * velCoef + accel.y * accelCoef
    // point.pos.z += point.velocity.z * velCoef + accel.z * accelCoef

    point.pos.add(
      point.velocity
        .multiplyScalar(velCoef)
        .add(accel.multiplyScalar(accelCoef))
    )
  }

  //apply constraints related to other nodes next to it
  //(keeps each node within distance)
  static constrain(point: RopePoint) {
    if (point.next) {
      //   const delta = THREE.Vector3.sub(point.next.pos, point.pos)
      const delta = point.next.pos.clone().sub(point.pos)
      //   const len = THREE.Vector3.mag(delta)
      const len = delta.length()
      const diff = len - point.distanceToNextPoint
      //   const normal = THREE.Vector3.normalized(delta)
      //   const normal = delta.clone().normalize()
      //   const normal2 = normal.clone().multiplyScalar(diff * 0.25)
      const normal = delta
        .clone()
        .normalize()
        .multiplyScalar(diff * 0.25)

      if (!point.isFixed) {
        // point.pos.x += normal.x * diff * 0.25
        // point.pos.y += normal.y * diff * 0.25
        point.pos.add(normal)
      }

      if (!point.next.isFixed) {
        point.pos.sub(normal)
        // point.next.pos.x -= normal.x * diff * 0.25
        // point.next.pos.y -= normal.y * diff * 0.25
      }
    }
    if (point.prev) {
      //   const delta = THREE.Vector3.sub(point.prev.pos, point.pos)
      const delta = point.prev.pos.clone().sub(point.pos)

      //   const len = THREE.Vector3.mag(delta)
      const len = delta.length()
      const diff = len - point.distanceToNextPoint
      //   const normal = THREE.Vector3.normalized(delta)
      //   const normal = delta.clone().normalize()
      //   const normal2 = normal.clone().multiplyScalar(diff * 0.25)
      const normal = delta
        .clone()
        .normalize()
        .multiplyScalar(diff * 0.25)

      if (!point.isFixed) {
        // point.pos.x += normal.x * diff * 0.25
        // point.pos.y += normal.y * diff * 0.25
        point.pos.add(normal)
      }

      if (!point.prev.isFixed) {
        // point.prev.pos.x -= normal.x * diff * 0.25
        // point.prev.pos.y -= normal.y * diff * 0.25
        point.prev.pos.sub(normal)
      }
    }
  }

  constructor(initialPos: THREE.Vector3, distanceToNextPoint: number) {
    this.pos = initialPos
    this.distanceToNextPoint = distanceToNextPoint
    this.isFixed = false
    this.oldPos = initialPos.clone()
    this.velocity = new THREE.Vector3(0, 0, 0)
    this.mass = 1.0
    this.damping = 1.0
    this.prev = null
    this.next = null
  }
}

//manages a collection of rope points and executes
//the integration
export class RopePhysics {
  _points: RopePoint[]
  _prevDts: number
  _solverIterations: number
  _gravity: THREE.Vector3

  //generate an array of points suitable for a dynamic
  //rope contour
  static generate(
    start: THREE.Vector3,
    end: THREE.Vector3,
    resolution: number,
    mass: number,
    damping: number
  ) {
    // const delta = THREE.Vector3.sub(end, start)
    const delta = end.clone().sub(start)
    // const len = THREE.Vector3.mag(delta)
    const len = delta.length()

    let points = []
    const pointsLen = len / resolution

    for (let i = 0; i < pointsLen; i++) {
      const percentage = i / (pointsLen - 1)

      //   const lerpX = Math.lerp(start.x, end.x, percentage)
      //   const lerpY = Math.lerp(start.y, end.y, percentage)

      points[i] = new RopePoint(
        //   { x: lerpX, y: lerpY },
        start.clone().lerp(end, percentage),
        resolution
      )
      points[i].mass = mass
      points[i].damping = damping
    }

    //Link nodes into a doubly linked list
    for (let i = 0; i < pointsLen; i++) {
      const prev = i != 0 ? points[i - 1] : null
      const curr = points[i]
      const next = i != pointsLen - 1 ? points[i + 1] : null

      curr.prev = prev
      curr.next = next
    }

    points[0].isFixed = points[points.length - 1].isFixed = true

    return points
  }

  constructor(
    points: RopePoint[],
    solverIterations: number,
    gravity: THREE.Vector3
  ) {
    this._points = points
    this._prevDts = 0
    this._solverIterations = solverIterations
    this._gravity = gravity

    this.update = this.update.bind(this)
    this.getPoint = this.getPoint.bind(this)
    this.getFirstPoint = this.getFirstPoint.bind(this)
    this.getLastPoint = this.getLastPoint.bind(this)
    this.getPoints = this.getPoints.bind(this)

    console.log(points)
  }

  getPoint(index: number) {
    return this._points[index]
  }

  getFirstPoint() {
    return this._points[0]
  }

  getLastPoint() {
    return this._points[this._points.length - 1]
  }

  getPoints() {
    return this._points
  }

  update(dts: number) {
    for (let i = 1; i < this._points.length - 1; i++) {
      let point = this._points[i]
      let accel = this._gravity.clone()
      RopePoint.integrate(point, accel, dts, this._prevDts)
    }

    for (let iteration = 0; iteration < this._solverIterations; iteration++)
      for (let i = 1; i < this._points.length - 1; i++) {
        let point = this._points[i]
        RopePoint.constrain(point)
      }

    this._prevDts = dts
  }
}

/*
  useEffect(() => {
    //APP SETUP!

    // const canvas = document.getElementById("canvas")
    const canvas = document.createElement("canvas")
    canvas.width = 800
    canvas.height = 600
    document.body.appendChild(canvas)
    const context = canvas.getContext("2d")

    const gradient = context?.createLinearGradient(0, 0, 500, 0)
    gradient?.addColorStop(0, "white")
    gradient?.addColorStop(0.25, "yellow")
    gradient?.addColorStop(0.5, "blue")
    gradient?.addColorStop(0.75, "red")
    gradient?.addColorStop(1.0, "white")

    const args = {
      //   start: { x: canvas.width / 2, y: canvas.height / 2 },
      start: new THREE.Vector3(canvas.width / 2 - 100, canvas.height / 2, 10),
      //   end: { x: canvas.width - 100, y: canvas.height / 2 },
      end: new THREE.Vector3(canvas.width / 2 + 100, canvas.height / 2, 20),
      resolution: 20,
      mass: 0.88,
      damping: 0.95,
      //   gravity: { x: 0, y: 10 },
      gravity: new THREE.Vector3(0, 10, -10),
      solverIterations: 500,
      ropeColour: gradient,
      ropeSize: 4,
    }

    const points = Rope.generate(
      args.start,
      args.end,
      args.resolution,
      args.mass,
      args.damping
    )

    let rope = new Rope(points, args.solverIterations)

    const drawRopePoints = (
      points: RopePoint[],
      colour: typeof gradient | string = "#f0f",
      width: number
    ) => {
      if (!context) {
        console.warn("NO CONTEXT BOII")
        return
      }

      context.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < points.length; i++) {
        let p = points[i]

        const prev = i > 0 ? points[i - 1] : null

        if (prev) {
          context.beginPath()
          context.moveTo(prev.pos.x, prev.pos.y)
          context.lineTo(p.pos.x, p.pos.y)
          context.lineWidth = Math.abs(p.pos.z)
          context.strokeStyle = colour
          context.stroke()
        }
      }
    }

    const startTime = Date.now()
    let lastTime = startTime
    let running = true
    const tock = () => {
      if (!running) {
        return
      }
      const now = Date.now()
      const elapsedTime = now - startTime
      const deltaTime = now - lastTime
      lastTime = now

      rope.update(args.gravity, deltaTime * 0.001)

      const pointA = rope.getFirstPoint()
      pointA.pos.x =
        Math.sin(elapsedTime * 0.005) * 120 + canvas.width * 0.5 - 200
      pointA.pos.y = Math.cos(elapsedTime * 0.0026) * 100 + canvas.height * 0.5
      //   pointA.pos.z = Math.cos(elapsedTime * 0.00126) * 100

      const pointB = rope.getLastPoint()
      pointB.pos.x =
        Math.sin(elapsedTime * 0.003) * -300 + canvas.width * 0.5 + 200
      pointB.pos.y = Math.cos(elapsedTime * 0.00262) * 200 + canvas.height * 0.5

      drawRopePoints(points, args.ropeColour, args.ropeSize)

      requestAnimationFrame(tock)
    }

    tock()

    return () => {
      running = false
      canvas.remove()
    }
  }, [])
  
  */
