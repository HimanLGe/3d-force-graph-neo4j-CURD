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

        window.GraphApp.eventManager.addLinkThreeObjectRule(link => {
            if (_this.pulseMode&&_this.nodesById[link.source.id].active) {
                let pointA = new THREE.Vector3(link.source.x,link.source.y,link.source.z);
					let pointB = new THREE.Vector3(link.target.x,link.target.y,link.target.z);
					const axisVector = new THREE.Vector3().subVectors(pointB, pointA);
					const axisLength = axisVector.length();
					let cylinderLength = 0;
					
					//cylinder.lookAt(axisVector);

					cylinderLength = axisLength; // 计算圆柱体的长度

					

					var cgeometry = new THREE.BoxGeometry(2, 2, 2);//创建一个立方体
					var cmaterial = new THREE.MeshBasicMaterial({
						color: "gray",
						onBeforeCompile: shader => {
							shader.uniforms.time = window.GraphApp.features.theme.globalUniforms.time;
							shader.uniforms.bloom = window.GraphApp.features.theme.globalUniforms.bloom;
							shader.uniforms.cylinderLength = cylinderLength;
							shader.fragmentShader = `
							  uniform float bloom;
							  uniform float time;
							  uniform float cylinderLength;
							  ${shader.fragmentShader}
							`.replace(
							  `if ( mod( cylinderLength, totalSize ) > dashSize ) {
								discard;
							}`,
							  ``
							)
							 .replace(
							  `#include <premultiplied_alpha_fragment>`,
							  `#include <premultiplied_alpha_fragment>
								vec3 col = diffuse;
								gl_FragColor.rgb = mix(col * 0.5, vec3(0), bloom);
								
								float sig = sin((cylinderLength * 2. + time * 20.) * 0.5) * 0.5 + 0.5;
								sig = pow(sig, 16.);
								gl_FragColor.rgb = mix(gl_FragColor.rgb, col * 0.75, sig);
							  `
							);
							//console.log(shader.fragmentShader);
						  }
					});//填充的材质
					var cube = new THREE.Mesh(cgeometry, cmaterial);//网格绘制
					

					return cube;
            } else { 
                return false;
            }
        }
        );

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