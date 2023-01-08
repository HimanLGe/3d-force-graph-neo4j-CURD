(()=>{
	class GUI{
		constructor(datGUI){
			this.gui = datGUI;
			
			
			this.settings = {
				
			};
			
			this.controllers = [];
			this.folders = [];
		}
		
		applySettings(settings){
			this.clear();
			let option = null;
			let folder = null;
			let folderStack = [this.gui];
			let optionStack = [settings];
			option = optionStack.pop();
			folder = folderStack.pop();
			
				
				
				
				
			while(option != undefined){
				for(let i = 0 ; i < Object.keys(option).length;i++){
					let key = Object.keys(option)[i];
					if(key.includes("on")||key.includes("__")||key.includes("neighbors")||key.includes("source")||key.includes("target")) continue;
					if(typeof(option[key])=='object'){
						if(option[key].guioption){
							let options = option[key].options;
							settings["on"+key+"Change"] = ()=>{};
							folder.add(option[key],"value",options);
							controller.onChange((val)=>{
							settings["on"+key+"Change"](val);
							settings["apply"]();
						});
						}
						else{
							optionStack.push(option[key]);
							let addedFolder = folder.addFolder(key);
							if(key=="properties"||key=="labels") addedFolder.open();
							folderStack.push(addedFolder);
							this.folders.push(addedFolder);
						}
					}else{
						settings["on"+key+"Change"] = ()=>{};
						let controller = folder.add(option, key);
						controller.onChange((val)=>{
							settings["on"+key+"Change"](val);
							settings["apply"]();//default upload to neo4j
						});
						this.controllers.push(controller);
					}
				}
				option = optionStack.pop();
				folder = folderStack.pop();
			}
			return settings;
		}
		
		clear(){
			for(let i = this.folders.length-1 ; i >= 0;i--){
				let folder = this.folders[i-1];
				let f = this.folders[i];
				try{
					f.parent.removeFolder(f);
				}catch{
					this.gui.removeFolder(f);
				}
			}

			this.folders = [];
			this.controllers.forEach((c)=>{
				try{
					this.gui.remove(c);
				}catch{}
			});
			this.controllers = [];
			
		}
	}
	
	this.GUI = GUI;
})();