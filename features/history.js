export default class history { 
    constructor() { 

        //1.if node has label hide, label will be fold
        //2. add history node,if node&link has "history" label,when node change,initilize a new node
        //   copy node's prop&label to new node,get node's source&target, link them to new node,
        //   remove old node's link which has no fileHistory label , connect old -> new


        // this.historyClick = [];//also link click
        // this.arrowLeftCount = 0;//also link click
        // let _this = this;
        // window.GraphApp.eventManager.registerEvent("ArrowLeftUp", () => {
        //     _this.arrowLeftCount += 1;
        //     _this.historyClickPointer = _this.historyClick.length-_this.arrowLeftCount
        // });
        // document.addEventListener("keyup", function (event) {
            
        //     if (event.code == "ArrowLeftUp") window.GraphApp.eventManager.dispatchArrowLeftUp();
            
            
        // });
    }
}