export default class Pulse { 
    constructor() { 
        let _this = this;
        this.pulseMode = false;
        this.Graph = window.GraphApp.Graph;
        this.nodesById = Object.fromEntries(this.Graph.graphData().nodes.map(node => [node.id,
            {
                ...node, childLinks: [], parentLinks: [], strength: 0, active: false,
                activateFunc: (node) => { console.log(node)}
            }
        ]));// isolate add props to nodes
        this.Graph.graphData().links.forEach(link => {
            _this.nodesById[link.source.id].childLinks.push(link);
            _this.nodesById[link.target.id].parentLinks.push(link);
        });

        this.activeNodes = new Set();

        window.GraphApp.eventManager.addNodeColorRule(node => {
            if (_this.pulseMode) {
                return _this.nodesById[node.id].active ? "blue" : "default"
            } else { 
                return "default";
            }
        }
        );

        this.roundFunc = () => { };
    }

    NodeProcess() { 
        let size = this.activeNodes.size;
        let idx = 0;
        for(let [key,node] of this.activeNodes.entries()){
            
            if (idx > (size - 1)) continue;
            node.activateFunc(node);
            this.spreadSignal(node.id);
            idx++;
            
        }
        
        this.roundFunc();
        

    }

    spreadSignal(nodeid, type = "all") { 
        let node = this.nodesById[nodeid];
        let _this = this;
        node.active = false;
        this.activeNodes.delete(node);
        if (type == "all") {
            node.childLinks.forEach((l) => {
                this.activeNodes.add(_this.nodesById[l.target.id]);
                _this.nodesById[l.target.id].active = true;
            });
        }
        else if (type == "logic") {
            
        }
    }

    setNodeActivateFunc(nodeid, func) {
        this.nodesById[nodeid].activateFunc = func; 
    }

    activateNode(nodeid) {
        this.refreshData();
        let node = this.nodesById[nodeid];
        node.active = true;
        this.activeNodes.add(node);
        this.Graph.nodeColor(this.Graph.nodeColor());
    }

    deactivateNode(nodeid) {
        let node = this.nodesById[nodeid];
        node.active = false;
        this.activeNodes.delete(node);
        this.Graph.nodeColor(this.Graph.nodeColor());
    }

    //synth external node add
    refreshData() { 
        let newData = Object.fromEntries(this.Graph.graphData().nodes.map(node => [node.id, { ...node, childLinks: [], parentLinks: [], strength: 0, active: false, activateFunc: () => { } }]));// isolate add props to nodes
        this.Graph.graphData().links.forEach(link => {
            newData[link.source.id].childLinks.push(link);
            newData[link.target.id].parentLinks.push(link);
        });

        for (let id of Object.keys(newData)) {
            if (this.nodesById[id]) {
                this.nodesById[id].childLinks = newData[id].childLinks;
                this.nodesById[id].parentLinks = newData[id].parentLinks;
                continue;
            }

            this.nodesById[id] = newData[id];
            

        }
    }

    async run() { 
        let _this = this;
        this.pulseMode = true;
        this.Graph.nodeColor(this.Graph.nodeColor());
        await this.sleep(1000);
        while (this.activeNodes.size != 0) {
            this.NodeProcess();
            _this.Graph.nodeColor(_this.Graph.nodeColor());
            await this.sleep(1000);
        }
        this.pulseMode = false;
    }

    setRoundFunc(f) { 
        this.roundFunc = f;
    }

    sleep(time) {
		return new Promise(resolve =>
			setTimeout(resolve,time)
		) }
}