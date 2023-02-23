export default class PathSerializer { 
    constructor() { 

        this.paths = {};
        this.lis = [];
        this.Graph = window.GraphApp.Graph;
        this.serializeMode = false;
        let _this = this;
        this.Graph.graphData().nodes.forEach(node => {
            window.GraphApp.features.pulse.setNodeActivateFunc(node.id, (n) => {
                if (_this.paths[n.id]) {
                    _this.paths[n.id] += ` ${n.properties.name} `;
                    n.childLinks.forEach(l => { 
                        _this.paths[l.target.id] = _this.paths[l.source.id];
                    });
                    if(n.childLinks.length != 0) delete _this.paths[n.id];
                } else { 
                    n.childLinks.forEach(l => { 
                        _this.paths[l.target.id] = ` ${n.properties.name} `;
                    });
                    
                }
                
             })
        });

        window.GraphApp.features.pulse.setRoundFunc(this.refreshList);

        var list = document.createElement('ul');
        this.list = list;
        list.style.width = '300px';
        list.style.margin = '0 auto';
        list.style.border = '1px solid #ccc';
        list.style.fontSize = '16px';
        list.style.lineHeight = '30px';
        list.style.textAlign = 'center';
        list.style.top = '60%';
        list.style.position = 'fixed';
        list.style.left = '50%';
        list.style.transform = 'translate(-50%)';
        list.style.paddingLeft = '0';
        list.style.overflowX = 'hidden';
        list.style.display = "none";
        list.style.paddingRight = "20px";

        list.classList.add('list-box');

        

        var parent = document.querySelector('body');
        parent.appendChild(list);

        var closeBtn = document.createElement('span');
        closeBtn.innerHTML = 'x';
        closeBtn.style.position = "fixed";
        closeBtn.style.color = "red";
        closeBtn.style.background = "rgba(255,255,255,0.3)";
        closeBtn.style.right = "0";
        closeBtn.style.cursor = "pointer";
        closeBtn.id = 'closeBtn';
        closeBtn.addEventListener('click', () => list.style.display = 'none');
        list.appendChild(closeBtn);
        



        list = document.querySelector('.list-box');
        var isDown = false;
        var startX, scrollLeft;

        list.addEventListener('mousedown', function(e) {
        isDown = true;
        startX = e.pageX - list.offsetLeft;
        scrollLeft = list.scrollLeft;
        });

        list.addEventListener('mousemove', function(e) {
        if (!isDown) return;
        e.preventDefault();
        var x = e.pageX - list.offsetLeft;
        var walk = (x - startX) * 2; // 设置滚动速度
        list.scrollLeft = scrollLeft - walk;
        });

        list.addEventListener('mouseup', function() {
        isDown = false;
        });

        
        const closeButtons = document.getElementsByClassName('close-btn');

        // 添加关闭按钮点击事件监听器
        for (let i = 0; i < closeButtons.length; i++) {
        closeButtons[i].addEventListener('click', function() {
            // 获取当前 li 元素
            const li = this.parentNode;
            // 从列表中删除当前 li 元素
            list.removeChild(li);
        });
        }

        //press p to select active node and start pathSerializer

        document.addEventListener("keydown", function (event) {
            
            window.GraphApp.Graph.controls().enabled = false;//disable orbit control
            window.GraphApp.eventManager.focusMode = false;//disable focus
            //key press event
            if (event.code == "KeyP") { 
                _this.serializeMode = true;
            }
            
        });
        document.addEventListener("keyup", function (event) {
            
            window.GraphApp.Graph.controls().enabled = true;//disable orbit control
            window.GraphApp.eventManager.focusMode = true;//disable focus
            //key press event
            if (event.code == "KeyP") { 
                _this.serializeMode = false;
                _this.clearList();
                _this.paths = [];
                _this.list.style.display = "block";
                window.GraphApp.features.pulse.run();
            }
        });

        window.GraphApp.eventManager.nodeClickdispatchSlot.push(node => { 
            if (_this.serializeMode) { 
                window.GraphApp.features.pulse.activateNode(node.id);
            }
        });
    }

    refreshList() { 
        let pathSerializer = window.GraphApp.features.pathSerializer;
        let list = window.GraphApp.features.pathSerializer.list;
        pathSerializer.clearList();
        for (let k of Object.keys(pathSerializer.paths)) {
            var li = document.createElement('li');
            li.style.border = '1px solid transparent';
            li.style.transition = 'all 0.3s ease';
            li.style.color = 'white';
            li.style.paddingLeft = '0';
            li.style.whiteSpace = 'nowrap';
            
            li.style.width = 'fit-content';
            li.textContent = pathSerializer.paths[k];
            let button = document.createElement("button");
            button.textContent = "x";
            button.classList.add('close-btn');
            button.style.backgroundColor = "rgba(255,255,255,0.1)";
            button.style.color = "red";
            button.style.display = "none";
            button.setAttribute("id", k);
            button.addEventListener('click', function () { 
                window.GraphApp.features.pulse.deactivateNode(this.getAttribute("id"));
                delete pathSerializer.paths[this.getAttribute("id")];
                this.parentElement.parentElement.removeChild(this.parentElement);
            });
            li.appendChild(button);

            li.addEventListener('mouseover', function() {
                this.style.borderColor = '#ccc';
                this.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                var closeBtn = this.querySelector('.close-btn');
                closeBtn.style.display = "inline";
            });
              
              li.addEventListener('mouseout', function() {
                this.style.borderColor = 'transparent';
                this.style.backgroundColor = 'transparent';
                var closeBtn = this.querySelector('.close-btn');
                closeBtn.style.display = "none";
            });

            list.appendChild(li);
        }
    }

    clearList() { 
        let list = window.GraphApp.features.pathSerializer.list;
        list.childNodes.forEach((child) => {
            if (child.tagName === "LI") {
                child.remove();
            }
        });
    }
}