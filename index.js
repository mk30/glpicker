var regl = require('regl')({
  extensions: ['OES_texture_float'],
  attributes: {preserveDrawingBuffer: true}
})
var camera = require('regl-camera')(regl,{
  distance: 7 
})
var anormals = require('angle-normals')
var mat4 = require('gl-mat4')
var glsl = require('glslify')
var catmug = require('./libraries/catmug.json')
var cmodel = []
var fb = regl.framebuffer({
  colorFormat: 'rgba',
  colorType: 'float32'
})
function getobjectid (draws, offsetx, offsety) {
  fb.resize(window.innerWidth, window.innerHeight)
  regl.clear({ color: [0,0,0,1], depth: true, framebuffer: fb })
  draws.forEach(function(draw){
    draw({ framebuffer: fb })
  })
  regl.draw(function () {
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
      return mat4.identity(cmodel)
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
var phone = require('./libraries/phone.json')
var pmodel = []
var phoneopts = { 
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
    position: phone.positions,
    normal: anormals(phone.cells, phone.positions)
  },
  uniforms: {
    model: function (context){
      mat4.identity(pmodel)
      mat4.translate(pmodel, pmodel, [0,1,0])
      mat4.scale(pmodel, pmodel, [0.01,0.01,0.01])
      return pmodel
    },
    time: regl.context('time')
  },
  primitive: "triangles",
  elements: phone.cells
}
function phonefg (regl) {
  return regl(Object.assign({
    frag: `
      precision mediump float;
      varying vec3 vnorm, vpos;
      void main (){
        gl_FragColor = vec4(vnorm,1);
      }
    `
  }, phoneopts))
}
function phonebg (regl) {
  return regl(Object.assign({
    framebuffer: regl.prop('framebuffer'), 
    frag: `
      precision mediump float;
      varying vec3 vnorm, vpos;
      void main (){
        gl_FragColor = vec4(0,1,0,1);
      }
    `
  }, phoneopts))
}
var draw = {
  catmugfg : catmugfg(regl),
  catmugbg : catmugbg(regl),
  phonefg: phonefg(regl),
  phonebg: phonebg(regl)
}
regl.frame(function(context){
  regl.clear({color: [0,0,0,1], depth:true})
  camera(function(){
    draw.catmugfg()
    draw.phonefg()
  })
})
window.addEventListener('click', function (ev){ 
  console.log(ev.offsetX + ' , ' + ev.offsetY)
  camera(function(){
    getobjectid([draw.catmugbg,draw.phonebg], ev.offsetX, ev.offsetY)
  })
})
