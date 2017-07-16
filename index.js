var regl = require('regl')({
  extensions: ['OES_texture_float'],
  attributes: {preserveDrawingBuffer: true}
})
var camera = require('regl-camera')(regl,{
  distance:  4
})
var anormals = require('angle-normals')
var mat4 = require('gl-mat4')
var glsl = require('glslify')
var catmug = require('./libraries/catmug.json')
var model = []
var fb = regl.framebuffer({
  colorFormat: 'rgba',
  colorType: 'float32'
})
function getobjectid (draw, offsetx, offsety) {
  fb.resize(window.innerWidth, window.innerHeight)
  regl.clear({ color: [0,0,0,1], depth: true, framebuffer: fb })
  draw({ framebuffer: fb }, function () {
    regl.draw()
    var data = regl.read({
      x: offsetx,
      y: offsety,
      width: 1,
      height: 1
    })
    console.log(data)
  })
}
var catopts = { 
  vert: `
    precision mediump float;
    uniform mat4 projection, view, model;
    attribute vec3 position, normal;
    varying vec3 vnorm, vpos;
    void main (){
      vnorm = normal;
      vpos = position;
      gl_Position = projection * view * model *
      vec4(position, 1);
    }
  `,
  attributes: {
    position: catmug.positions,
    normal: anormals(catmug.cells, catmug.positions)
  },
  uniforms: {
    model: function (context){
      return mat4.identity(model)
    },
    time: regl.context('time')
  },
  primitive: "triangles",
  elements: catmug.cells
}
function catmugfg (regl) {
  return regl(Object.assign({
    frag: `
      precision mediump float;
      varying vec3 vnorm, vpos;
      void main (){
        gl_FragColor = vec4(vnorm - vpos,1);
      }
    `
  }, catopts))
}
function catmugbg (regl) {
  return regl(Object.assign({
    framebuffer: regl.prop('framebuffer'), 
    frag: `
      precision mediump float;
      varying vec3 vnorm, vpos;
      void main (){
        gl_FragColor = vec4(1,0,0,1);
      }
    `
  }, catopts))
}
var mesh = require('./libraries/phone.json')
var rmat = []
function phone (regl){
  return regl({
    frag: glsl`
      precision mediump float;
      #pragma glslify: snoise = require('glsl-noise/simplex/4d')
      varying vec3 vnormal, vpos;
      uniform float t;
      void main () {
        vec3 p = vnormal / snoise(vec4(vpos*0.01,sin(t)+20.5));
        float cross = abs(max(
          max(sin(p.z*10.0), sin(p.y*01.0)),
          sin(p.x*10.0)
          ));
        gl_FragColor = vec4(p, 1);
      }`,
    vert: glsl`
      precision mediump float;
      uniform mat4 model, projection, view;
      attribute vec3 position, normal;
      varying vec3 vnormal, vpos;
      uniform float t;
      void main () {
        vnormal = normal;
        vpos = position;
        gl_Position = projection * view * model *
        vec4(position, 1.0);
      }`,
    attributes: {
      position: mesh.positions,
      normal: anormals(mesh.cells, mesh.positions)
    },
    elements: mesh.cells,
    uniforms: {
      t: function(context, props){
           return context.time
         },
      model: function(context, props){
        var t = context.time
        mat4.identity(rmat)
        mat4.scale(rmat, rmat,[0.1,0.1,0.1])
        mat4.rotateY(rmat, rmat, t)
        return rmat
      }
    },
    primitive: "triangles",
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    cull: { enable: true }
  })
}
var draw = {
  catmugfg : catmugfg(regl),
  catmugbg : catmugbg(regl),
  phone: phone(regl)
}
regl.frame(function(context){
  regl.clear({color: [0,0,0,1], depth:true})
  camera(function(){
    draw.catmugfg()
    draw.phone()
  })
})
window.addEventListener('click', function (ev){ 
  console.log(ev.offsetX + ' , ' + ev.offsetY)
  camera(function(){
    getobjectid(draw.catmugbg, ev.offsetX, ev.offsetY)
  })
})
