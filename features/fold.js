//DOLIST 尝试修复pnode和cnode为collapse

export default class Fold{

    constructor() { 
        let _this = this;
        this.Graph = window.GraphApp.Graph;
        this.foldMode = false;
        this.rawNodes = this.Graph.graphData().nodes;// isolate add props to nodes
        this.rawLinks = this.Graph.graphData().links;
        this.nodesById = Object.fromEntries(this.Graph.graphData().nodes.map(node => [node.id, { ...node,childLinks:[],parentLinks:[] }]));// isolate add props to nodes
        this.Graph.graphData().links.forEach(link => {
            _this.nodesById[link.source.id].childLinks.push(link);
            _this.nodesById[link.target.id].parentLinks.push(link);
        });

        
        window.GraphApp.eventManager.registerEvent("KeyCUp", () => {
            window.GraphApp.eventManager.focusMode = true;
        });
        document.addEventListener("keyup", function (event) {
            
            if (event.code == "KeyC") window.GraphApp.eventManager.dispatchKeyCUp();
            
            
        });
        //window.GraphApp.eventManager.onKeyFUp(window.GraphApp.eventManager.focusMode=true);
        window.GraphApp.eventManager.registerEvent("KeyCDown", () => {
            window.GraphApp.eventManager.focusMode = false
        });
        document.addEventListener("keydown", function (event) {
            
            if (event.code == "KeyC") window.GraphApp.eventManager.dispatchKeyCDown();
            
            
        });
        //window.GraphApp.eventManager.onKeyFDown(window.GraphApp.eventManager.focusMode=false);


        //window.GraphApp.eventManager.nodeHoverdispatchSlot.push(node => elem.style.cursor = node && node.childLinks.length ? 'pointer' : null);
        window.GraphApp.eventManager.nodeClickdispatchSlot.push(node => {
            if (window.GraphApp.eventManager.keyListener.KeyC) {
                if (_this.nodesById[node.id].childLinks.length) {
                    _this.nodesById[node.id].collapsed = !_this.nodesById[node.id].collapsed; // toggle collapse state
                    console.log(node);
                    _this.Graph.graphData(_this.getPrunedTree());
                }
            }
        });
        window.GraphApp.eventManager.linkClickdispatchSlot.push(link => {
            if (window.GraphApp.eventManager.keyListener.KeyC) {
                console.log("unfold");
                _this.unfoldLink(link);
            }
        });
        window.GraphApp.eventManager.nodeHoverdispatchSlot.push(n => {
                if (window.GraphApp.eventManager.keyListener.KeyC) {
                    console.log(n);
                }
        });

        //window.GraphApp.eventManager.addNodeColorRule(node => node.collapsed ? 'red' : 'default');
        //window.GraphApp.eventManager.addLinkColorRule(node => node.collapsed ? 'red' : 'default');

    }

   

    

    getPrunedTree() {
        const visibleNodes = [];
        const visibleLinks = [];
        const visitedNodes = new Set();

        // link parent/children
        let _this = this;
        

        (function traverseTree() {
            let stack = [];
            Object.keys(_this.nodesById).forEach(i => {
                stack.push(_this.nodesById[i]);
            });

            while (stack.length > 0) {
                let node = stack.pop();
                if (!visitedNodes.has(node.id) && !node.collapsed) {
                    visitedNodes.add(node.id);
                    visibleNodes.push(_this.getNodeById(node.id));
                    for (let i = 0; i < node.childLinks.length; i++) {
                        let link = node.childLinks[i];
                        let targetNode = _this.nodesById[_this.getNodeId(link.target)];
                        if (!_this.nodesById[targetNode.id].collapsed) {
                            link.collapsed = false;
                            visibleLinks.push(link);
                        } else if (_this.nodesById[link.target.id].childLinks.length > 0) {
                            let cnode = _this.nodesById[link.target.id].childLinks[0].target;
                            while (cnode.collapsed) {
                                if (cnode.childLinks.length > 0) {
                                    for (let l of cnode.childLinks) {
                                        cnode = _this.nodesById[_this.getNodeId(l.target)];
                                        if (!cnode.collapsed) break;
                                    }
                                }
                                else break;
                            }
                            if (!cnode.collapsed) {
                                link.target = cnode.id;
                                link.collapsed = false;
                                visibleLinks.push(link);
                            }
                        }
                        //stack.push(((typeof link.target) === 'object') ? link.target : _this.nodesById[link.target]);
                    }
                } else if (node.parentLinks.length > 0 && !visitedNodes.has(node.parentLinks[0].source)) {
                    for (let i = 0; i < node.childLinks.length; i++) {
                        let link = node.childLinks[i];
                        let visiblesource = null;
                        let pnode =  _this.nodesById[_this.getNodeId(node.parentLinks[0].source)];
                        while (pnode.collapsed) {
                            if (pnode.parentLinks.length > 0)
                                pnode = _this.nodesById[_this.getNodeId(pnode.parentLinks[0].source)];
                            else break;
                        }
                        while (pnode.collapsed) {
                            if (pnode.childLinks.length > 0) {
                                for (let l of pnode.childLinks) {
                                    let cnode = _this.nodesById[_this.getNodeId(l.target)];
                                    if (cnode.id == node.id) {
                                        if (pnode.childLinks.length == 1) {
                                            pnode = pnode.childLinks[0].target;
                                            continue;
                                        }
                                        else {
                                            continue;
                                        }
                                    }
                                    pnode = cnode;
                                }
                            }
                            else break;
                        }
                        let linkTargetNode = _this.nodesById[_this.getNodeId(link.target)];
                        if (!linkTargetNode.collapsed && !pnode.collapsed) {
                            link.source = pnode.id;
                            link.collapsed = true;
                            visibleLinks.push(link);
                        }
                        //stack.push(((typeof link.target) === 'object') ? link.target : _this.nodesById[link.target]);
                    }
                }
            }

        })(); // IIFE

        return { nodes: visibleNodes, links: visibleLinks };
    };

    unfoldLink(link) {
        let _this = this;
        let gdata = this.Graph.graphData();
        this.nodesById[link.source.id].childLinks.forEach(l => {
            _this.nodesById[l.target.id].collapsed = false;
            link.collapsed = false;
        });
        this.Graph.graphData(this.getPrunedTree());
    }

    foldNode(id) { 
        this.nodesById[id].collapsed = true;
        this.Graph.graphData(this.getPrunedTree());
    }

    unfoldNode(id) {
        this.nodesById[id].collapsed = false;
        this.Graph.graphData(this.getPrunedTree());
    }

    getNodeById(id) { 
        return this.rawNodes.find(n => { 
            return n.id == id;
        });
    }

    getLinkByIndex(index) { 
        return this.rawLinks.find(l => { 
            return l.index == index;
        });
    }

    getNodeId(node) { 
        let id = (typeof node === 'object') ? node.id : node;
        return id
    }

    
    
}