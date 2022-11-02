(()=>{
	class GUIController{
		constructor(GUI,neo4jWithGraph,env){
			this.gui = GUI;
			this.env = env;
			this.neo4jWithGraph = neo4jWithGraph;
		}
		
		
		editNodePanel(settings){
			settings["apply"] = ()=>{
				delete settings.labels["add"];
				delete settings.properties["add"];
				delete settings["apply"];
				delete settings["delete"];
				this.neo4jWithGraph.setNode(settings);
				console.log("apply");
				};
			settings["delete"] = ()=>{
				this.neo4jWithGraph.delNode(settings);
				console.log("delete");
				};
			settings.labels["add"] = ()=>{
				var theResponse = window.prompt("label name");
				settings.labels.push(theResponse);
				settings = this.gui.applySettings(settings);
				};
			settings.properties["add"] = ()=>{
				var theResponse = window.prompt("prop name");
				settings.properties[theResponse] = "";
				settings = this.gui.applySettings(settings);
				};
			settings = this.gui.applySettings(settings);
			settings.onxChange = (e)=>{console.log(e);};
			
		}
	}
	
	this.GUIController = GUIController;
})();