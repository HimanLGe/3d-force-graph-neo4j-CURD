export default class Filter { 
    constructor() { 
        let _this = this;
        this.Graph = window.GraphApp.Graph;
        this.hideNodes = new Set();
        window.GraphApp.eventManager.registerEvent("KeyFDown", () => {
            
            window.GraphApp.gui.applySettings(_this.getLabelsAndProp());
        });
        document.addEventListener("keydown", function (event) {
            
            if (event.code == "KeyF"&&!window.GraphApp.gui.inputMode&&!event.ctrlKey&&!event.shiftKey) window.GraphApp.eventManager.dispatchKeyFDown();
            
            
        });
        window.GraphApp.eventManager.addNodeColorRule(node =>
            _this.hideNodes.has(node) ? 'rgba(100,100,100,0.3)' : 'default'
        );
        this.registerHideNodesKey()
    }

    getLabelsAndProp() { 
        let _this = this;
        let settings = { propsKeys: {}, propsVal: {}, labels: {} };
        let propKeySet = new Set();
        let propSet = new Set();
        let labelSet = new Set();

        let nodes = this.Graph.graphData().nodes;
        let links = this.Graph.graphData().links;

        nodes.forEach(n => {
            n.labels.forEach(l => {
                labelSet.add(l);
            });

            for (let p of Object.keys(n.properties)) { 
                if (p == "key") return;
                propKeySet.add(p);
            }

            propSet.add(n.properties);
            
        });

        labelSet.forEach(l => { 
            settings.labels[l] = true;
            settings[`on${l}Change`] = async (val) => { 
                if (val == false) {
                    let cypherString = `match (n:\`${l}\`) return id(n)`;
                    let records = await window.GraphApp.neo4jConnector.excuteCypher(cypherString);
                    records.forEach(element => {
                        let id = element.get("id(n)").toNumber();
                        _this.hideNodes.add(_this.getNodeById(id));
                    });
                    
                } else { 
                    let cypherString = `match (n:\`${l}\`) return id(n)`;
                    let records = await window.GraphApp.neo4jConnector.excuteCypher(cypherString);
                    records.forEach(element => {
                        let id = element.get("id(n)").toNumber();
                        _this.hideNodes.delete(_this.getNodeById(id));
                    });
                }

                window.GraphApp.Graph.nodeColor(window.GraphApp.Graph.nodeColor());
            }
        });

        propSet.forEach(props => { 
            for (let key of Object.keys(props)) {
                settings.propsVal[`${key}_${props[key]}`] = true;
                settings[`on${key}_${props[key]}Change`] = async (val) => { 
                    if (val == false) {
                        let cypherString = `match (n) where n.${key} = "${props[key]}" return id(n)`;
                        let records = await window.GraphApp.neo4jConnector.excuteCypher(cypherString);
                        records.forEach(element => {
                            let id = element.get("id(n)").toNumber();
                            _this.hideNodes.add(_this.getNodeById(id));
                        });
                        
                    } else { 
                        let cypherString = `match (n) where n.${key} = "${props[key]}" return id(n)`;
                        let records = await window.GraphApp.neo4jConnector.excuteCypher(cypherString);
                        records.forEach(element => {
                            let id = element.get("id(n)").toNumber();
                            _this.hideNodes.delete(_this.getNodeById(id));
                        });
                    }
    
                    window.GraphApp.Graph.nodeColor(window.GraphApp.Graph.nodeColor());
                }
            }
            
            propKeySet.forEach(key => { 
                settings.propsKeys[key] = true;
                settings[`on${key}Change`] = async (val) => { 
                    if (val == false) {
                        let cypherString = `match (n) where n.${key} is not null return id(n)`;
                        let records = await window.GraphApp.neo4jConnector.excuteCypher(cypherString);
                        records.forEach(element => {
                            let id = element.get("id(n)").toNumber();
                            _this.hideNodes.add(_this.getNodeById(id));
                        });
                        
                    } else { 
                        let cypherString = `match (n) where n.${key} is not null return id(n)`;
                        let records = await window.GraphApp.neo4jConnector.excuteCypher(cypherString);
                        records.forEach(element => {
                            let id = element.get("id(n)").toNumber();
                            _this.hideNodes.delete(_this.getNodeById(id));
                        });
                    }
    
                    window.GraphApp.Graph.nodeColor(window.GraphApp.Graph.nodeColor());
                }
            });
            
        });
        
        settings.apply = () => { 

        }

        return settings;
    }

    getNodeById(id) { 
        return this.Graph.graphData().nodes.find(n => { 
            return n.id == id;
        });
    }

    getLinkByIndex(index) { 
        return this.Graph.graphData().links.find(l => { 
            return l.index == index;
        });
    }

    registerHideNodesKey() {
        let _this = this;
        window.GraphApp.eventManager.registerEvent("HideNode", (event) => {
            console.log("hidenode");
            if (event.shiftKey) {
                // 隐藏除选中节点以外的所有节点
                const selectedNodes = window.GraphApp.eventManager.selectedNodes;
                
    
                // 将未选中的节点加入隐藏集合
                _this.Graph.graphData().nodes.forEach(node => {
                    if (!selectedNodes.has(node)) {
                        if (_this.hideNodes.has(node)) {
                            _this.hideNodes.delete(node);
                        }
                        else {
                            _this.hideNodes.add(node);
                        }
                    }
                });
            } else {
                // 隐藏选中的节点
                window.GraphApp.eventManager.selectedNodes.forEach(node => {
                    if (_this.hideNodes.has(node)) {
                        _this.hideNodes.delete(node); // 如果节点已经隐藏，取消隐藏
                    } else {
                        _this.hideNodes.add(node); // 如果节点没有隐藏，隐藏它
                    }
                });
            }
            window.GraphApp.Graph.nodeColor(window.GraphApp.Graph.nodeColor());
        })

        document.addEventListener("keydown", function (event) { 
            if (event.code == "KeyI") {
                window.GraphApp.eventManager.dispatchHideNode(event);
            }
        })
    }
}