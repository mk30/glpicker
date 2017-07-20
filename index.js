var regl = require('regl')({
  extensions: ['OES_texture_float', 'oes_element_index_uint'],
  attributes: {preserveDrawingBuffer: true}
})
var camera = require('regl-camera')(regl,{
  distance: 5
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
var selectedid = 0
function getselectedid (draws, offsetx, offsety) {
  fb.resize(window.innerWidth, window.innerHeight)
  regl.clear({ color: [0,0,0,1], depth: true, framebuffer: fb })
  draws.forEach(function(draw){
    draw({ framebuffer: fb })
  })
  regl.draw(function () {
    var data = regl.read({
      framebuffer: fb,
      x: offsetx, 
      y: offsety,
      width: 1,
      height: 1
    })
    console.log(offsetx + ' , ' + offsety)
    selectedid = data[0]
    console.log(selectedid)
  })
}
var catopts = { 
  vert: `
    precision mediump float;
    uniform mat4 projection, view, model;
    uniform float selectedid;
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
    time: regl.context('time'),
    modelid: regl.prop('modelid'),
    selectedid: regl.prop('selectedid')
  },
  primitive: "triangles",
  elements: catmug.cells
}
function catmugfg (regl) {
  return regl(Object.assign({
    frag: `
      precision mediump float;
      uniform float selectedid, modelid;
      varying vec3 vnorm, vpos;
      float x = clamp(1.0-abs(selectedid-modelid), 0.0, 1.0);
      void main (){
        gl_FragColor = vec4(vnorm.x + x, vnorm.y, vnorm.z,1);
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
      var t = context.time
      mat4.identity(pmodel)
      mat4.scale(pmodel, pmodel, [0.01,0.01,0.01])
      mat4.rotateY(pmodel, pmodel, t)
      return pmodel
    },
    time: regl.context('time'),
    modelid: regl.prop('modelid'),
    selectedid: regl.prop('selectedid')
  },
  primitive: "triangles",
  elements: phone.cells
}
function phonefg (regl) {
  return regl(Object.assign({
    frag: `
      precision mediump float;
      uniform float selectedid, modelid;
      varying vec3 vnorm, vpos;
      float x = clamp(1.0-abs(selectedid-modelid), 0.0, 1.0);
      void main (){
        gl_FragColor = vec4(vnorm.x + x, vnorm.y, vnorm.z, 1);
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
        gl_FragColor = vec4(2,0,0,1);
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
    draw.catmugfg({selectedid : selectedid, modelid: 1})
    draw.phonefg({selectedid : selectedid, modelid: 2})
  })
})
window.addEventListener('click', function (ev){ 
  var x = Math.min(window.innerWidth - 1,  Math.max(1, ev.offsetX))
  var y = Math.min(window.innerHeight - 1, Math.max(1, window.innerHeight - ev.offsetY))
  camera(function(){
    getselectedid([draw.catmugbg, draw.phonebg], x, y)
  })
})
