export default class Filter { 
    constructor() { 
        let _this = this;
        this.Graph = window.GraphApp.Graph;
        window.GraphApp.eventManager.registerEvent("KeyFDown", () => {
            
            window.GraphApp.gui.applySettings(_this.getLabelsAndProp());
        });
        document.addEventListener("keydown", function (event) {
            
            if (event.code == "KeyF") window.GraphApp.eventManager.dispatchKeyFDown();
            
            
        });
    }

    getLabelsAndProp() { 
        let settings = { props: {}, labels: {} };
        let propSet = new Set();
        let labelSet = new Set();

        let nodes = this.Graph.graphData().nodes;
        let links = this.Graph.graphData().links;

        nodes.forEach(n => {
            n.labels.forEach(l => {
                labelSet.add(n);
             });
            
        });
        
        return settings;
    }
}