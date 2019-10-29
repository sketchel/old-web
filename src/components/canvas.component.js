import React from 'react';

class Canvas extends React.Component {

    componentDidMount() {
        const canvas = document.querySelector("#canvas");
        window.ctx = canvas.getContext("2d");
        window.canvasStore = {
            isPainting: false,
            brushWidth: 10,
            brushType: 'round'
        }
        
        window.ctx.temp = window.ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.height = window.innerHeight-100;
        canvas.width = window.innerWidth;
        window.ctx.putImageData(window.ctx.temp, 0, 0)
        
        window.ctx.fillRect(0, 0, 50, 50);
        
        const setStore = (key, value) => {
            window.canvasStore[key] = value;
        }
        
        const getStore = (key) => {
            return window.canvasStore[key];
        }
        
        window.ctx.draw = (e) => {
            window.ctx.lineWidth = getStore('brushWidth');
            window.ctx.lineCap = getStore('brushType');
            window.ctx.strokeStyle = getStore('color');
        
            console.log(e)
        
            window.ctx.lineTo(e.pageX, e.pageY);
            window.ctx.stroke();
            window.ctx.beginPath();
            window.ctx.moveTo(e.pageX, e.pageY);
        }
        
        window.ctx.rearrange = () => {
            window.ctx.temp = window.ctx.getImageData(0, 0, canvas.width, canvas.height);
            canvas.height = window.innerHeight-100;
            canvas.width = window.innerWidth;
            window.ctx.putImageData(window.ctx.temp, 0, 0)
        }
    
        window.ctx.post = (execute) => {
            if(execute == 'colorRed') {
                setStore('color', 'red');
            } else if (execute == 'colorYellow') {
                setStore('color', 'yellow');
            } else if (execute == 'colorGreen') {
                setStore('color', 'green');
            } else if (execute == 'colorBlue') {
                setStore('color', 'blue');
            } else if (execute == 'colorBlack') {
                setStore('color', 'black');
            } else if(execute.split("-")[0] == 'brush') {
                setStore('brushWidth', execute.split("-")[1]);
            } else if(execute.split("color")[1]) {
                setStore('color', execute.split("color")[1]);
            }
        }
    
        window.ctx.setBrushSize = () => {
            setStore('brushWidth', parseInt(document.getElementById("custom-brush-size").value));
        }
    
        window.ctx.setCustomColor = () => {
            setStore('color', document.getElementById("custom-color").value);
        }
        
        canvas.addEventListener('mousedown', (e) => {
            setStore('isPainting', true)
            window.ctx.draw(e);
        })
        
        canvas.addEventListener('mouseup', () => {
            setStore('isPainting', false)
            window.ctx.beginPath();
        })
        
        canvas.addEventListener('mousemove', (e) => {
            if(!getStore('isPainting')) return;
            window.ctx.draw(e);
        })
        
        window.addEventListener('resize', () => {
            window.ctx.rearrange()
        })
    
    }

    render() {
        return (
            <div className="canvas">
                <canvas id="canvas" width="1280" height="720">Uh oh! Your browser does not support the canvas API. Please upgrade to the latest version of any modern browser.</canvas>
            </div>
        )
    }
}

export default Canvas;