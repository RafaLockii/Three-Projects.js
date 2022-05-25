import gsap from 'gsap'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'

const gui = new dat.GUI()
const world = {
  plane:{
    width: 400,
    height: 400,
    widthSegments: 50,
    heightSegments: 50
  }
}

gui.add(world.plane, 'width', 1, world.plane.width * 2).onChange(generatePlane)
gui.add(world.plane, 'height', 1, world.plane.height * 2).onChange(generatePlane)
gui.add(world.plane, 'widthSegments', 1, world.plane.widthSegments * 2).onChange(generatePlane)
gui.add(world.plane, 'heightSegments', 1, world.plane.widthSegments * 2).onChange(generatePlane)

function generatePlane(){
  planeMesh.geometry.dispose()
  planeMesh.geometry = new THREE.PlaneGeometry(world.plane.width, world.plane.height, world.plane.widthSegments, world.plane.heightSegments)
  const {array} = planeMesh.geometry.attributes.position
  const randomValues = []
  for (let i = 0; i < array.length; i++){
    if (i % 3 === 0) {
      const x = array[i]
      const y = array[i + 1]
      const z = array[i + 2]

      array[i] = x + (Math.random() - 0.5) * 3
      array[i + 1] = y + (Math.random() - 0.5) * 3
      array[i + 2] = z + (Math.random() - 0.5) * 3
    }
    randomValues.push(Math.random() - 0.5)
  }
  const colors = []
  for (let i = 0; i < planeMesh.geometry.attributes.position.count; i++){
    colors.push(0, 0.3, 0.2)
  }

  planeMesh.geometry.setAttribute(
    'color', new THREE.BufferAttribute(new Float32Array(colors), 3)
  )

  planeMesh.geometry.attributes.position.originalPosition = planeMesh.geometry.attributes.position.array
  planeMesh.geometry.attributes.position.randomValues = randomValues
}

const raycaster = new THREE.Raycaster()
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  1000
)
const renderer = new THREE.WebGLRenderer()

renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(devicePixelRatio)
document.body.appendChild(renderer.domElement)

new OrbitControls(camera, renderer.domElement)
camera.position.z = 85

const plane = new THREE.PlaneGeometry(world.plane.width, world.plane.height, world.plane.widthSegments, world.plane.heightSegments)
const planeMaterial = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, flatShading: THREE.FlatShading, vertexColors: true })
const planeMesh = new THREE.Mesh(plane, planeMaterial)
scene.add(planeMesh)

generatePlane()

const colors = []
for (let i = 0; i < planeMesh.geometry.attributes.position.count; i++){
  colors.push(0, 0.3, 0.2)
}

planeMesh.geometry.setAttribute(
  'color', new THREE.BufferAttribute(new Float32Array(colors), 3)
)

const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(0, 1, 1)
scene.add(light)

const backlight = new THREE.DirectionalLight(0xffffff, 1)
backlight.position.set(0, 0, -1)
scene.add(backlight)

const mouse = {
  x: undefined,
  y: undefined
}

let frame = 0
function animate(){
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
  raycaster.setFromCamera(mouse, camera)

  frame += 0.01
  const { array, originalPosition, randomValues } = planeMesh.geometry.attributes.position
  for (let i = 0; i < array.length; i += 3) {
    array[i] = originalPosition[i] + Math.cos(frame + randomValues[i]) * 0.01
    array[i + 1] = originalPosition[i + 1] + Math.sin(frame + randomValues[i + 1]) * 0.01
  }
  planeMesh.geometry.attributes.position.needsUpdate = true

  const intersects = raycaster.intersectObject(planeMesh)
  if (intersects.length > 0){
    const {color} = intersects[0].object.geometry.attributes

    color.setXYZ(intersects[0].face.a, 0.1, 1, 0.5)
    color.setXYZ(intersects[0].face.b, 0.1, 1, 0.5)
    color.setXYZ(intersects[0].face.c, 0.1, 1, 0.5)
    color.needsUpdate = true

    const initialColor = {
      r: 0,
      g: 0.3,
      b: 0.2
    }
    const hoverColor = {
      r: 0.1,
      g: 1,
      b: 0.5
    }
    gsap.to(hoverColor, {
      r: initialColor.r,
      g: initialColor.g,
      b: initialColor.b,
      duration: 1,
      onUpdate: () => {
        color.setXYZ(intersects[0].face.a, hoverColor.r, hoverColor.g, hoverColor.b)
        color.setXYZ(intersects[0].face.b, hoverColor.r, hoverColor.g, hoverColor.b)
        color.setXYZ(intersects[0].face.c, hoverColor.r, hoverColor.g, hoverColor.b)
        color.needsUpdate = true
      }
    })
  }
}
animate()

addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / innerWidth) * 2 - 1
  mouse.y = -(event.clientY / innerHeight) * 2 + 1
})
