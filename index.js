var regl = require('regl')()
var camera = require('regl-camera')(regl,{
  distance:  4
})
var anormals = require('angle-normals')
var mat4 = require('gl-mat4')

function catmug (regl) {
  var catmug = require('./libraries/catmug.json')
  var model = []
  return regl({
    frag: `
      precision mediump float;
      varying vec3 vnorm, vpos;
      void main (){
        gl_FragColor = vec4(vnorm - vpos,1);
      }
    `,
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
  })
}
var draw = {
  catmug : catmug(regl)
}
regl.frame(function(context){
  regl.clear({color: [0,0,0,1], depth:true})
  camera(function(){
    draw.catmug()
  })
})
window.addEventListener('click',
  function (ev){
    console.log(ev.offsetX + ' , ' + ev.offsetY)
  }
)
