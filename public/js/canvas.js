function download (filename, data) {
  var element = document.createElement('a')
  element.setAttribute('href', data)
  element.setAttribute('download', filename)
  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

window.onload = () => {
  bulmaSlider.attach()
  function preventBehavior (e) {
    e.preventDefault()
  };
  if (!window.SketchelAuth) {
    Swal.fire(
      'Uh oh!',
      'You aren\'t signed it. Please sign in before drawing, otherwise you won\'t be able to upload it to Sketchel!',
      'warning'
    )
  }

  document.addEventListener('touchmove', preventBehavior, { passive: false })
  window.Sketchel = new Object()
  window.Sketchel.Settings = {
    BrushWidth: 10,
    Color: '#FF0000'
  }
  document.getElementsByClassName('Export')[0].addEventListener('click', (e) => {
    if (Sketchel.History.length > 0) {
      download('Sketchel_Export.png', Sketchel.canvas.toDataURL())
    } else {
      alert("You might want to actually draw something before exporting your drawing... Just sayin'")
    }
  })
  document.getElementsByClassName('Save')[0].addEventListener('click', (e) => {
    document.getElementsByClassName('Save')[0].style.backgroundImage = 'url(../assets/svg/upload.svg)'
    document.getElementsByClassName('Save')[0].style.backgroundSize = 'contain'
    if (Sketchel.History.length > 0) {
      const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
          confirmButton: ' -success',
          cancelButton: ' -danger'
        },
        buttonsStyling: false
      })
      swalWithBootstrapButtons.fire({
        title: 'What should the drawing be called?',
        html: '<input class="input" type="text" id="SketchelTitle" name="title" placeholder="Rocky terrain"></input>',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Upload',
        cancelButtonText: 'No, cancel!',
        reverseButtons: true
      }).then((result) => {
        const postData = {
          width: window.Sketchel.canvas.width,
          height: window.Sketchel.canvas.height,
          history: window.Sketchel.History,
          title: document.getElementById('SketchelTitle').value
        }

        if (result.value) {
          console.log(postData)
          $.ajax({
            type: 'POST',
            url: 'localhost:8000/api/post',
            processData: false,
            data: JSON.stringify(postData),
            success: function (msg) {
              window.Sketchel.isSaving = false;
              document.getElementsByClassName('Save')[0].style.backgroundImage = 'url(../assets/svg/upload.svg)'
              document.getElementsByClassName('Save')[0].style.backgroundSize = 'auto'
              Swal.fire({
                title: 'Sweet!',
                html: 'You just uploaded your drawing!<br/><br/><div class="field has-addons" style="margin-left:10%;margin-right:10%;"><div class="control" style="width:100%"><input class="input sketchelLink" type="text" placeholder="" readonly></div><div class="control"><a class="button is-info" onclick="window.Sketchel.copyLink()">Copy</a></div></div>',
                imageUrl: 'localhost:8000/cdn/' + msg + '.png',
                imageAlt: 'Your uploaded drawing!'
              })
              document.getElementsByClassName('sketchelLink')[0].value = 'localhost:8000/post/' + msg
            },
            error: function (msg) {
              Swal.fire({
                title: 'Oof!',
                html: 'Something went wrong <code>' + JSON.stringify(msg) + '</code>',
                icon: 'error'
              })
              console.log(msg)
            },
            fail: function (msg) {
              Swal.fire({
                title: 'Oof!',
                html: 'Something wen\'t wrong <code>' + JSON.stringify(msg) + '</code>',
                icon: 'error'
              })
            }
          })
        } else if (
          result.dismiss === Swal.DismissReason.cancel
        ) {
          swalWithBootstrapButtons.fire(
            'Cancelled',
            'Your drawing wasn\'t uploaded',
            'error'
          )
        }
      })
      if (window.Sketchel.isSaving) return;
      window.Sketchel.isSaving = true;
    } else {
      alert('You might want to actually draw something before saving your drawing... Just sayin...')
    }
  })
  window.Sketchel.copyLink = () => {
    navigator.clipboard.writeText(document.getElementsByClassName('sketchelLink')[0].value);
  }
  document.getElementsByClassName('Pencil')[0].addEventListener('click', (e) => {
    window.Sketchel.canvas.style.cursor = 'url(../assets/svg/pencil.svg) 5 5, auto'
    window.Sketchel.pickr.applyColor()
  })
  document.getElementsByClassName('Eraser')[0].addEventListener('click', (e) => {
    window.Sketchel.canvas.style.cursor = 'url(../assets/svg/eraser.svg) 5 5, auto'
    window.Sketchel.Settings.Color = '#ffffff'
  })
  window.Sketchel.Redraw = () => {
    window.Sketchel.Clear();
    window.Sketchel.History.forEach((el) => {
      if (el.type === 'brush_draw') {
        window.Sketchel.ctx.beginPath()
        window.Sketchel.ctx.lineCap = 'round'
        window.Sketchel.ctx.strokeStyle = el.color
        window.Sketchel.ctx.lineWidth = el.width
        window.Sketchel.ctx.moveTo(el.from.x, el.from.y)
        window.Sketchel.ctx.lineTo(el.to.x, el.to.y)
        window.Sketchel.ctx.stroke()
      } else {

      }
    })
  }
  document.onkeydown = (e) => {
    var evtobj = window.event ? event : e
    if (evtobj.keyCode === 90 && evtobj.ctrlKey) document.getElementsByClassName('Undo')[0].click()
    if (evtobj.keyCode === 89 && evtobj.ctrlKey) document.getElementsByClassName('Redo')[0].click()
  }
  document.getElementsByClassName('Undo')[0].addEventListener('click', (e) => {
    if (window.Sketchel.isDrawing) return
    if (window.Sketchel.History.length === 0) return
    while (true) {
      window.Sketchel.Redo.push(window.Sketchel.History[window.Sketchel.History.length - 1])
      window.Sketchel.History.splice(-1, 1)
      if ((!window.Sketchel.History[window.Sketchel.History.length - 1]) || window.Sketchel.History[window.Sketchel.History.length-1].final) return window.Sketchel.Redraw()
    }
  })
  document.getElementsByClassName('Redo')[0].addEventListener('click', (e) => {
    if (window.Sketchel.isDrawing) return
    if (window.Sketchel.Redo.length === 0) return
    var final = false
    while (true) {
      window.Sketchel.Redo[window.Sketchel.Redo.length - 1].final = false;
      window.Sketchel.History.push(window.Sketchel.Redo[window.Sketchel.Redo.length - 1])
      window.Sketchel.Redo.splice(-1, 1)
      if ((!window.Sketchel.Redo[window.Sketchel.Redo.length - 1]) || final) return window.Sketchel.Redraw()
      if (window.Sketchel.Redo[window.Sketchel.Redo.length - 1].final) final = true
    }
  });
  document.getElementsByClassName('Clear')[0].addEventListener('click', (e) => {
    window.Sketchel.Redo = []
    window.Sketchel.Clear()
    window.Sketchel.History.push({
      type: 'brush_draw',
      from: {
        x: 1,
        y: 1
      },
      to: {
        x: window.Sketchel.canvas.height,
        y: window.Sketchel.canvas.width
      },
      color: '#ffffff',
      width: 10000,
      final: true
    })
  })
  document.getElementById('sliderWithValue').onmousemove = (e) => {
    window.Sketchel.Settings.BrushWidth = e.target.value
    document.getElementsByClassName('BrushSize')[0].innerHTML = e.target.value
  }
  document.getElementById('sliderWithValue').onchange = (e) => {
    window.Sketchel.Settings.BrushWidth = e.target.value
    document.getElementsByClassName('BrushSize')[0].innerHTML = e.target.value
  }
  window.Sketchel.pickr = Pickr.create({
    el: '.pickr',
    theme: 'nano',

    swatches: [
      'rgba(244, 67, 54, 1)',
      'rgba(233, 30, 99, 1)',
      'rgba(156, 39, 176, 1)',
      'rgba(103, 58, 183, 1)',
      'rgba(63, 81, 181, 1)',
      'rgba(33, 150, 243, 1)',
      'rgba(3, 169, 244, 1)',
      'rgba(0, 188, 212, 1)',
      'rgba(0, 150, 136, 1)',
      'rgba(76, 175, 80, 1)',
      'rgba(139, 195, 74, 1)',
      'rgba(205, 220, 57, 1)',
      'rgba(255, 235, 59, 1)',
      'rgba(255, 193, 7, 1)'
    ],
    default: '#000',

    components: {

      // Main components
      preview: true,
      hue: true,
      // Input / output Options
      interaction: {
        input: true,
        save: true
      }
    }
  })
  document.getElementsByClassName('pcr-button')[0].style.height = '1%'
  document.getElementsByClassName('pcr-button')[0].style.width = '2%'
  window.Sketchel.canvas = document.getElementsByClassName('SketchelCanvas')[0]
  window.Sketchel.ctx = window.Sketchel.canvas.getContext('2d')

  window.Sketchel.canvas.width = window.Sketchel.canvas.clientWidth
  window.Sketchel.canvas.height = window.Sketchel.canvas.clientHeight
  window.Sketchel.History = []
  window.Sketchel.Settings.Color = window.Sketchel.pickr.getColor().toHEXA().join('')
  window.Sketchel.Redo = []
  window.Sketchel.Clear = (e) => {
    window.Sketchel.ctx.beginPath()
    window.Sketchel.ctx.lineCap = 'round'
    window.Sketchel.ctx.strokeStyle = '#ffffff'
    window.Sketchel.ctx.lineWidth = 10000
    window.Sketchel.ctx.moveTo(1, 1)
    window.Sketchel.ctx.lineTo(window.Sketchel.canvas.height, window.Sketchel.canvas.width)
    window.Sketchel.ctx.stroke()
    window.Sketchel.pickr.applyColor()
  }
  window.Sketchel.pickr.on('save', (e) => {
    if (e.toHEXA().join('').length > 6) {
      window.Sketchel.pickr.setColor('#' + e.toHEXA().join('').substring(0, 6))
      window.Sketchel.pickr.applyColor()
    } else {
      window.Sketchel.Settings.Color = '#' + e.toHEXA().join('')
    }
  })
  window.Sketchel.canvas.onmousedown = (e) => {
    window.Sketchel.StartDraw(e)
  }
  window.Sketchel.canvas.onmousemove = (e) => {
    window.Sketchel.ContinueDraw(e)
  }
  window.Sketchel.canvas.onmouseup = (e) => {
    window.Sketchel.StopDraw(e)
  }
  setTimeout(() => {
    window.Sketchel.Clear()
  }, 100)
  window.Sketchel.canvas.addEventListener('touchstart', function (e) {
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    })
    window.Sketchel.canvas.dispatchEvent(mouseEvent)
  }, false)
  window.Sketchel.canvas.addEventListener('touchend', function (e) {
    var mouseEvent = new MouseEvent('mouseup', {})
    window.Sketchel.canvas.dispatchEvent(mouseEvent)
  }, false)
  window.Sketchel.canvas.addEventListener('touchmove', function (e) {
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      buttons: 1
    })
    window.Sketchel.canvas.dispatchEvent(mouseEvent)
  }, false)

  // Get the position of a touch relative to the canvas
  function getTouchPos (canvasDom, touchEvent) {
    const rect = canvasDom.getBoundingClientRect()
    return {
      x: touchEvent.touches[0].clientX,
      y: touchEvent.touches[0].clientY
    }
  }
  window.Sketchel.StartDraw = (e) => {
    if (e.buttons) {
      if (e.buttons === 2) return
    }
    if (window.Sketchel.Redo.length > 0) window.Sketchel.Redo = []

    window.Sketchel.isDrawing = true
    const rect = window.Sketchel.canvas.getBoundingClientRect()
    window.Sketchel.Settings.LastPos = {
      x: e.x - rect.x,
      y: e.y - rect.y
    }
    window.Sketchel.ctx.beginPath()
    window.Sketchel.ctx.lineCap = 'round'
    window.Sketchel.ctx.strokeStyle = window.Sketchel.Settings.Color
    window.Sketchel.ctx.lineWidth = window.Sketchel.Settings.BrushWidth
    const LastPos = window.Sketchel.Settings.LastPos
    window.Sketchel.ctx.moveTo(LastPos.x, LastPos.y)
    window.Sketchel.ctx.lineTo(e.x - rect.x, e.y - rect.y)
    window.Sketchel.ctx.stroke()
    window.Sketchel.History.push({
      type: 'brush_draw',
      from: {
        x: LastPos.x,
        y: LastPos.y
      },
      to: {
        x: e.x - rect.x,
        y: e.y - rect.y
      },
      color: window.Sketchel.Settings.Color,
      width: window.Sketchel.Settings.BrushWidth + ''
    })
    window.Sketchel.Settings.LastPos = {
      x: e.x - rect.x,
      y: e.y - rect.y
    }
  }
  window.Sketchel.StopDraw = (e) => {
    if (e.buttons) {
      if (e.buttons === 1) return
      if (e.buttons === 3) return
    }
    window.Sketchel.isDrawing = false
    window.Sketchel.History[window.Sketchel.History.length - 1].final = true
  }
  window.Sketchel.ContinueDraw = (e) => {
    if (window.Sketchel.isDrawing) {
      const rect = window.Sketchel.canvas.getBoundingClientRect()
      if (e.buttons === 0 || e.buttons === 2) {
        window.Sketchel.isDrawing = false
        return
      }
      window.Sketchel.ctx.beginPath()
      window.Sketchel.ctx.lineCap = 'round'
      window.Sketchel.ctx.fillStyle = window.Sketchel.Settings.Color
      window.Sketchel.ctx.lineWidth = window.Sketchel.Settings.BrushWidth
      const LastPos = window.Sketchel.Settings.LastPos
      window.Sketchel.ctx.moveTo(LastPos.x, LastPos.y)
      window.Sketchel.ctx.lineTo(e.x - rect.x, e.y - rect.y)
      window.Sketchel.ctx.stroke()
      window.Sketchel.History.push({
        type: 'brush_draw',
        from: {
          x: LastPos.x,
          y: LastPos.y
        },
        to: {
          x: e.x - rect.x,
          y: e.y - rect.y
        },
        color: window.Sketchel.Settings.Color,
        width: window.Sketchel.Settings.BrushWidth + ''
      })
      window.Sketchel.Settings.LastPos = {
        x: e.x - rect.x,
        y: e.y - rect.y
      }
    }
  }
}
