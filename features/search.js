export default class search {
    constructor() { 
        window.GraphApp.eventManager.registerEvent("Search", () => {
            let settings = {};
            settings["name"] = "undefined";
            settings["Nodes"] = {};
            settings["Links"] = {};
            settings["search"] = () => { 
                settings.Nodes = {};
                settings.Links = {};
                let nodes = window.GraphApp.Graph.graphData().nodes.filter((n) => { 
                    if (!n.properties.name) return false;
                    return n.properties.name.includes(settings.name);
                });

                let links = window.GraphApp.Graph.graphData().links.filter((l) => { 
                    if (!l.properties.name) return false;
                    return l.properties.name.includes(settings.name);
                });

                nodes.forEach((n) => { 
                    settings.Nodes
                        [n.id]= () => { 
                            window.GraphApp.eventManager.currentNode = n;
                            window.GraphApp.eventManager.selectedNodes.clear();
                            window.GraphApp.eventManager.selectedNodes.add(n);
                            window.GraphApp.eventManager.Graph3d.nodeColor(window.GraphApp.eventManager.Graph3d.nodeColor());//refresh color
                            window.GraphApp.eventManager.focusNode(n);
                    }
                    
                });

                links.forEach((l) => { 
                    settings.Links
                        [l.id]= () => { 
                            window.GraphApp.eventManager.currentNode = l;
                            window.GraphApp.eventManager.selectedNodes.clear();
                            window.GraphApp.eventManager.selectedNodes.add(l);
                            window.GraphApp.eventManager.Graph3d.nodeColor(window.GraphApp.eventManager.Graph3d.nodeColor());//refresh color
                            window.GraphApp.eventManager.focusNode(l);
                    }
                    
                });
                window.GraphApp.gui.applySettings(settings);
            }
            settings["apply"] = () => { };
            window.GraphApp.gui.applySettings(settings);
            
        });

        document.addEventListener("keydown", function (event) {
            if (window.GraphApp.eventManager.keyListener["KeyF"] && event.shiftKey) {
                window.GraphApp.eventManager.dispatchSearch();
                
                    if ($(".property-name:contains('name')").next("div").children().val() == "undefined") {
                        $(".property-name:contains('name')").next("div").children().val("").focus();
                    } else {
                        $(".dg.main").on("keyup", (e) => { console.log(e) });
                        $(".property-name:contains('name')").next("div").children().focus();
                    }
                
            }
            
           
        });
    }
}