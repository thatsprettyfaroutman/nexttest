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

export class RopeCurve extends THREE.Curve<THREE.Vector3> {
  _rope: RopePhysics

  constructor(rope: RopePhysics) {
    super()
    this._rope = rope
    this.getPoint = this.getPoint.bind(this)
  }

  getPoint(t: number, optionalTarget = new THREE.Vector3()) {
    const floatI = t * (this._rope._points.length - 1)
    // @ts-ignore just a faster Math.floor
    const i = parseInt(floatI, 10)

    const ropePoint = this._rope.getPoint(i)

    const pos = ropePoint?.pos?.clone()
    if (!pos) {
      console.log("DIS")
      return optionalTarget.set(0, 0, 0).multiplyScalar(1)
    }

    if (ropePoint.next) {
      pos.lerp(ropePoint.next.pos, floatI - i)
    }

    // console.log(i, this._rope._points[i], pos)
    return optionalTarget.set(...pos.toArray()).multiplyScalar(1)
  }
}
