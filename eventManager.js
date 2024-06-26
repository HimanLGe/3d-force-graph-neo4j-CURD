(() => {
  class EventManager {
    constructor(
      DomElem,
      Graph3d,
      guiController,
      neo4jWith3DGraph,
      basic,
      threeUtils,
      THREE
    ) {
      this.DomElem = DomElem;
      this.Graph3d = Graph3d;
      this.guiController = guiController;
      this.NWG = neo4jWith3DGraph;
      this.basic = basic;
      this.threeUtils = threeUtils;
      this.THREE = THREE;
      this.clickCountBg = 0;
      this.clickCountNode = 0;
      this.currentNode = null; //also link click
      this.historyClick = [];
      this.arrowLeftCount = 0;
      this.selectedNodes = new Set();
      this.selectedLinks = new Set();
      //background click->true;interval times up -> false
      this.bgInDoubleClickIntervalFlag = false;
      this.nodeInDoubleClickIntervalFlag = false;
      this.keyListener = {}; //if KeyA press, keyListener.keyA = true
      this.focusMode = true;

      this.selectionBox = new THREE.SelectionBox(
        this.Graph3d.camera(),
        this.Graph3d.scene()
      );
      this.helper = new THREE.SelectionHelper(
        this.Graph3d.renderer(),
        "selectBox"
      );
      //this.helper.dispose();

      this.nodeColorRule = [];
      this.linkColorRule = [];

      this.nodeThreeObjectRule = [];
      this.linkThreeObjectRule = [];

      this.Graph3d.nodeColor(this.executeNodeColorRules);
      this.Graph3d.linkColor(this.executeLinkColorRules);
      this.Graph3d.nodeThreeObject(this.executeNodeThreeObjectRules);
      this.Graph3d.linkThreeObject(this.executeLinkThreeObjectRules);

      //when graph event dispatched,run following Slot
      this.BackgroundClickdispatchSlot = [];
      this.nodeClickdispatchSlot = [];
      this.nodeDragdispatchSlot = [];
      this.nodeDragEnddispatchSlot = [];
      this.nodeHoverdispatchSlot = [];
      this.linkHoverdispatchSlot = [];
      this.linkClickdispatchSlot = [];

      this.initEventEnvironmentVaribles();

      this.registerEvents();

      //event list
      this.eventList = [
        "BackgroundDoubleClick",
        "AltKeyUpAndTwoNodesClicked",
        "HighLightNode",
        "HighLightLink",
        "Hover", //Node or Link
        "ClickNode",
        "DelKeyUp",
        "TabKeyUp",
        "KeyHUp",
        "AltKeyUpAndDoubleClicked",
        "KeyXPress",
        "MouseDrag",
        "NodeDoubleClick"
      ];

      this.events = {};
      // auto register onEvent and dispatchEvent
      this.eventList.forEach((eventName) => {
        let event = {
          todo: [], //
        };
        this.events[eventName] = event;

        this["dispatch" + eventName] = (e1, e2) => {
          this.events[eventName].todo.forEach((customFunc) => {
            customFunc(e1, e2);
          });
        };

        this["on" + eventName] = (customFunc) => {
          this.events[eventName].todo.push(customFunc);
        };
      });

      this.manageStyle();

      //register event handler
      this.registerHandlers();
    }

    initEventEnvironmentVaribles() {
      // highLight event //
      // cross-link node objects
      let gData = this.Graph3d.graphData();
      gData.links.forEach((link) => {
        const a = gData.nodes.filter((node) => {
          return node.id == link.source.id;
        })[0];
        const b = gData.nodes.filter((node) => {
          return node.id == link.target.id;
        })[0];
        !a["neighbors"] && (a["neighbors"] = []);
        !b["neighbors"] && (b["neighbors"] = []);
        a.neighbors.push(b);
        b.neighbors.push(a);

        !a.links && (a.links = []);
        !b.links && (b.links = []);
        a.links.push(link);
        b.links.push(link);
      });
      this.highlightNodes = new Set();
      this.highlightLinks = new Set();
      this.hoverNode = null;

      this.Graph3d.linkWidth((link) =>
        this.highlightLinks.has(link) || _this.selectedLinks.has(link) ? 3 : 2
      )
        .linkDirectionalParticles((link) =>
          this.highlightLinks.has(link) || _this.selectedLinks.has(link) ? 2 : 0
        )
        .linkDirectionalParticleWidth(1);

      //this.addNodeColorRule(node => this.highlightNodes.has(node) ? node === this.hoverNode ? 'rgb(255,0,0,1)' : 'rgba(255,160,0,0.8)' : 'default');

      this.updateHighlight = function () {
        // trigger update of highlighted objects in scene
        this.Graph3d.nodeColor(this.Graph3d.nodeColor())
          .nodeRelSize(5)
          .linkWidth(this.Graph3d.linkWidth())
          .linkDirectionalParticles(this.Graph3d.linkDirectionalParticles());
      };
      //-----------------//

      //key listener
      let _this = this;
      document.addEventListener("keydown", function (event) {
        _this.keyListener[event.code] = true;

        //key press event
        if (event.code == "ControlLeft") {
          _this.Graph3d.controls().enabled = false; //disable orbit control
          _this.helper.enablehelper();
        }
      });
      document.addEventListener("keyup", function (event) {
        _this.keyListener[event.code] = false;

        //key press event
        if (event.code == "ControlLeft") {
          _this.Graph3d.controls().enabled = true;
          _this.helper.disable();
        }

        if (event.code == "ArrowLeft" && !window.GraphApp.gui.inputMode) {
          if (_this.arrowLeftCount <= _this.historyClick.length) {
            _this.arrowLeftCount += 1;
            _this.currentNode =
              _this.historyClick[
                _this.historyClick.length - _this.arrowLeftCount
              ];
            _this.selectedNodes.clear();
            _this.selectedNodes.add(_this.currentNode);
            _this.guiController.editNodePanel(_this.currentNode);
            _this.Graph3d.nodeColor(_this.Graph3d.nodeColor()); //refresh color
          }
        }

        if (event.code == "ArrowRight" && !window.GraphApp.gui.inputMode) {
          if (_this.arrowLeftCount > 0) {
            _this.arrowLeftCount -= 1;
            _this.currentNode =
              _this.historyClick[
                _this.historyClick.length - _this.arrowLeftCount
              ];
            _this.selectedNodes.clear();
            _this.selectedNodes.add(_this.currentNode);
            _this.guiController.editNodePanel(_this.currentNode);
            _this.Graph3d.nodeColor(_this.Graph3d.nodeColor()); //refresh color
            _this.focusNode(_this.currentNode);
          }
        }
      });

      //multiply select
      document.addEventListener("pointerdown", function (event) {
        if (!_this.keyListener.ControlLeft) return; //ctrl toggle multiply select

        _this.selectedNodes.clear();
        _this.highlightLinks.clear();
        _this.selectedLinks.clear();

        for (const item of _this.selectionBox.collection) {
          if (item.material.type == "MeshLambertMaterial") {
            item.material.emissive.set(0x000000);
          }
        }
        _this.Graph3d.nodeColor(_this.Graph3d.nodeColor());
        _this.selectionBox.startPoint.set(
          (event.clientX / window.innerWidth) * 2 - 1,
          -(event.clientY / window.innerHeight) * 2 + 1,
          0.5
        );
      });

      document.addEventListener("pointermove", function (event) {
        if (!_this.keyListener.ControlLeft) return; //ctrl toggle multiply select

        if (_this.helper.isDown) {
          for (let i = 0; i < _this.selectionBox.collection.length; i++) {
            if (
              _this.selectionBox.collection[i].material.type ==
              "MeshLambertMaterial"
            ) {
              _this.selectionBox.collection[i].material.emissive.set(0x000000);
            }
          }
          _this.Graph3d.nodeColor(_this.Graph3d.nodeColor());

          _this.selectionBox.endPoint.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1,
            0.5
          );

          const allSelected = _this.selectionBox.select();
          for (let i = 0; i < allSelected.length; i++) {
            console.log(allSelected[i]);
            console.log(allSelected[i].material);
            if (allSelected[i].material.type == "MeshLambertMaterial") {
              allSelected[i].material = allSelected[i].material.clone();
              allSelected[i].material.emissive.set(0xffffff);
              _this.selectedNodes.add(allSelected[i].__data);
            }
          }
          _this.Graph3d.nodeColor(_this.Graph3d.nodeColor()); //refresh color
        }
      });

      document.addEventListener("pointerup", function (event) {
        if (!_this.keyListener.ControlLeft) return; //ctrl toggle multiply select

        _this.selectionBox.endPoint.set(
          (event.clientX / window.innerWidth) * 2 - 1,
          -(event.clientY / window.innerHeight) * 2 + 1,
          0.5
        );
        const allSelected = _this.selectionBox.select();
        for (let i = 0; i < allSelected.length; i++) {
          if (allSelected[i].material.type == "MeshLambertMaterial") {
            allSelected[i].material.emissive.set(0xffffff);
            _this.selectedNodes.add(allSelected[i].__data);
          }
        }
        _this.Graph3d.nodeColor(_this.Graph3d.nodeColor()); //refresh color
      });
    }

    registerEvent(evtname, customFunc) {
      this.eventList.push(evtname);
      let event = {
        todo: [], //
      };
      this.events[evtname] = event;
      this["dispatch" + evtname] = (e1, e2) => {
        this.events[evtname].todo.forEach((f) => {
          f(e1, e2);
        });
      };

      this.events[evtname].todo.push(customFunc);
    }

    registerEvents() {
      let _this = this;
      //register BackgroundDoubleClick
      this.Graph3d.onBackgroundClick((e) => {
        this.judgeBackgroundDoubleClick(e);
      });

      //register AltKeyUpAndTwoNodesClicked
      this.Graph3d.onNodeClick((node, event) => {
        for (let handler of this.nodeClickdispatchSlot) {
          handler(node, event);
        }
      });
      this.nodeClickdispatchSlot.push((node, event) => {
        this.guiController.editNodePanel(node);
        this.judgeAltKeyUpAndTwoNodesClicked(node, event);
        this.dispatchClickNode(node, event);
        this.fixNode(node, event);
        this.judgeNodeDoubleClick(node, event);
      });

      this.addNodeColorRule((node) =>
        _this.selectedNodes.has(node) ? "yellow" : "default"
      );

      this.addLinkColorRule((link) => {
        if (!_this.currentNode) return "default";
        return _this.currentNode.id == link.id && _this.currentNode.source
          ? "yellow"
          : "default";
      });

      this.Graph3d.onNodeHover((node) => {
        for (let handler of this.nodeHoverdispatchSlot) {
          handler(node);
        }
      });
      this.nodeHoverdispatchSlot.push((node) => {
        this.dispatchHighLightNode(node);
        this.dispatchHover(node);
      });

      this.Graph3d.onLinkClick((link, event) => {
        for (let handler of this.linkClickdispatchSlot) {
          handler(link, event);
        }
      });
      this.linkClickdispatchSlot.push((link, event) => {
        this.guiController.editLinkPanel(link);
        this.dispatchClickNode(link, event);
      });

      this.Graph3d.onLinkHover((link) => {
        for (let handler of this.linkHoverdispatchSlot) {
          handler(link);
        }
      });
      this.linkHoverdispatchSlot.push((link) => {
        this.dispatchHighLightLink(link);
        this.dispatchHover(link);
      });

      //drag selected node together
      this.Graph3d.onNodeDrag((n, t) => {
        for (let handler of this.nodeDragdispatchSlot) {
          handler(n, t);
        }
      }).onNodeDragEnd((node) => {
        for (let handler of this.nodeDragEnddispatchSlot) {
          handler(node);
        }
      });

      this.nodeDragdispatchSlot.push((n, t) => {
        this.Graph3d.controls().enabled = false; //disable orbit control
        this.selectedNodes.forEach((node) => {
          if (node == n) return;
          node.x += t.x;
          node.y += t.y;
          node.z += t.z;
        });
      });

      this.nodeDragEnddispatchSlot.push((n) => {
        this.Graph3d.controls().enabled = true; //disable orbit control
      });

      document.onkeyup = (e) => {
        console.log(e);
        if (e.key == "Delete") this.dispatchDelKeyUp(this.currentNode, e);

        if (e.key == "Tab" && !this.keyListener.AltLeft) {
          e.preventDefault();
          this.dispatchTabKeyUp(this.currentNode, e);
        }

        if (e.code == "KeyH") {
          e.preventDefault();
          this.dispatchKeyHUp(null, e);
        }
      };
    }

    registerEventHandler(evtname, fun) {
      this[`on${evtname}`](fun);
    }

    registerHandlers() {
      //system preset event
      this.backgroundDoubleClickHandeler();
      this.nodeDoubleClickHandeler();
      this.highLightHandler();
      this.hoverHandler();
      this.clickNodeHandler();
      this.delKeyUpHandler();
      this.tabKeyUpHandler();
      this.altKeyUpAndDoubleClickedHandler();
      this.highLightPathHandler();
      this.mouseDragHandler();
      this.KeyHUpHandler();
    }

    judgeBackgroundDoubleClick(e) {
      this.clickCountBg += 1;
      if (this.bgInDoubleClickIntervalFlag == false) {
        this.bgInDoubleClickIntervalFlag = true;
        setTimeout(() => {
          if (this.clickCountBg > 1) {
            this.dispatchBackgroundDoubleClick(e);
          }
          this.clickCountBg = 0;
          this.bgInDoubleClickIntervalFlag = false;
        }, 150);
      }
    }

    judgeNodeDoubleClick(node) {
      this.clickCountNode += 1;
      if (this.nodeInDoubleClickIntervalFlag == false) {
        this.nodeInDoubleClickIntervalFlag = true;
        setTimeout(() => {
          if (this.clickCountNode > 1) {
            this.dispatchNodeDoubleClick(node);
          }
          this.clickCountNode = 0;
          this.nodeInDoubleClickIntervalFlag = false;
        }, 150);
      }
    }

    judgeAltKeyUpAndTwoNodesClicked(node, e) {
      if (!e.altKey) {
        this.selectedNodes.clear();
        this.selectedNodes.add(node);
        this.Graph3d.nodeColor(this.Graph3d.nodeColor());
        return;
      } else {
        this.selectedNodes.has(node)
          ? this.selectedNodes.delete(node)
          : this.selectedNodes.add(node);
      }
      this.Graph3d.nodeColor(this.Graph3d.nodeColor());

      if (this.selectedNodes.size == 2) {
        let nodes = [];
        this.selectedNodes.forEach((val) => {
          //val.apply();
          nodes.push(val);
        });
        this.NWG.addRelationships(
          nodes[0],
          {name: "rel", labels: ["linkto"], properties: {name: "undefined"}},
          nodes[1]
        ); //no properties.name will cause bug
        this.selectedNodes.clear();
      }
    }

    backgroundDoubleClickHandeler() {
      // handle backgrounddoubleclick //

      // add cube //
      var geometry = new this.THREE.BoxBufferGeometry(2, 2, 2); //创建一个立方体
      var material = new this.THREE.MeshBasicMaterial({color: 0xff0000}); //填充的材质
      this.cube = new this.THREE.Mesh(geometry, material); //网格绘制
      this.Graph3d.scene().add(this.cube);
      //----------//
      this.onBackgroundDoubleClick(async (e) => {
        //judge alt clicked
        if (e.altKey == true) {
          this.dispatchAltKeyUpAndDoubleClicked(this.currentNode, e);
        } else {
          console.log("background double clicked");
          console.log(e);
          let pos = {x: e.clientX, y: e.clientY};
          let target = this.threeUtils.get3DPosByCanvasPos(
            pos,
            0.5,
            this.Graph3d.camera()
          );
          ["x", "y", "z"].forEach((axis) => {
            this.cube.position[axis] = target[axis];
          });
          //cube.position = target;
          console.log(target);
          let node = this.basic.initNode();
          //node.name = "new"; //this will let 3dgraph make a tooltip text a
          node.properties.name = "undefined";
          ["x", "y", "z"].forEach((axis) => {
            node[axis] = target[axis];
          });

          //update historyclick
          while (this.arrowLeftCount > 0) {
            this.historyClick.pop();
            this.arrowLeftCount--;
          }

          let nodeids = await this.NWG.addNodes([node]);
          this.currentNode = window.GraphApp.basic.getNodeObjectById(
            nodeids[0]
          );
          this.historyClick.push(this.currentNode);
          this.selectedNodes.clear();
          this.selectedNodes.add(this.currentNode);
          this.guiController.editLinkPanel(this.currentNode);
          //Do double click stuff
        }
      });
      //------------------------------//
    }

    nodeDoubleClickHandeler() {
      let _this = this;

      
      
      this.onNodeDoubleClick(async (node) => {
        console.log("nodeDoubleClick")
        if (!node.source) _this.selectedNodes.add(node);
        _this.currentNode = node;
        _this.focusNode(node);
      });
    }

    highLightHandler() {
      let _this = this;
      this.onHighLightNode((node) => {
        if (
          (!node && !_this.highlightNodes.size) ||
          (node && _this.hoverNode === node)
        )
          return;

        _this.highlightNodes.clear();
        _this.highlightLinks.clear();
        if (node) {
          _this.highlightNodes.add(node);
          node.neighbors &&
            node.neighbors.forEach((neighbor) =>
              _this.highlightNodes.add(neighbor)
            );
          node.neighbors &&
            node.links.forEach((link) => _this.highlightLinks.add(link));
        }

        _this.hoverNode = node || null;

        _this.updateHighlight();
      });

      _this.onHighLightLink((link) => {
        _this.highlightNodes.clear();
        _this.highlightLinks.clear();

        if (link) {
          _this.highlightLinks.add(link);
          _this.highlightNodes.add(link.source);
          _this.highlightNodes.add(link.target);
        }

        _this.updateHighlight();
      });
    }

    hoverHandler() {
      let _this = this;
      this.hoverActive = false; //active object can't be active again
      _this.addNodeThreeObjectRule((node) => {
        let sprite = null;
        if (_this.highlightNodes.has(node)) {
          //active to avoid flash bug
          if (node.active == undefined) {
            //console.log("active");
            //active hover
            node.active = true;
            setTimeout(() => {
              delete node.active;
            }, 100);

            let sprite = new _this.THREE.SpriteText(
              node.properties.name
                ? _this.strIntervalInsert(
                    _this.truncateString(node.properties.name, 50),
                    11
                  )
                : node.id
            );
            sprite.material.depthWrite = false; // make sprite background transparent
            sprite.color = node === _this.hoverNode ? "orange" : "green";
            sprite.textHeight = 20;

            return sprite;
          } else {
            if (node.active != undefined) {
              let sprite = new _this.THREE.SpriteText(
                node.properties.name
                  ? _this.strIntervalInsert(
                      _this.truncateString(node.properties.name, 50),
                      11
                    )
                  : node.id
              );
              sprite.material.depthWrite = false; // make sprite background transparent
              sprite.color = node === _this.hoverNode ? "orange" : "green";
              sprite.textHeight = 20;
              return sprite;
            } else {
              return false;
            }
          }
        } else {
          if (node.active != undefined) {
            let sprite = new _this.THREE.SpriteText(
              node.properties.name
                ? _this.strIntervalInsert(
                    _this.truncateString(node.properties.name, 50),
                    11
                  )
                : node.id
            );
            sprite.material.depthWrite = false; // make sprite background transparent
            sprite.color = node === _this.hoverNode ? "orange" : "green";
            sprite.textHeight = 20;
            return sprite;
          } else {
            return false;
          }
        }
      });
      _this.addLinkThreeObjectRule((link) => {
        let sprite = null;

        if (_this.highlightLinks.has(link) || _this.selectedLinks.has(link)) {
          console.log(link)
          if (link.active == undefined) {
            //console.log("active");
            //active hover
            link.active = true;
            setTimeout(() => {
              delete link.active;
            }, 100);
            //console.log(link);
            //extend link with text sprite
            sprite = new _this.THREE.SpriteText(
              `${_this.strIntervalInsert(link.properties.name, 11)}`
            );
            sprite.color = "lightgrey";
            sprite.textHeight = 16;
            //console.log(sprite);
            return sprite;
          } else {
            if (link.active != undefined) {
              sprite = new _this.THREE.SpriteText(
                `${_this.strIntervalInsert(link.properties.name, 11)}`
              );
              sprite.color = "lightgrey";
              sprite.textHeight = 16;
              return sprite;
            } else {
              return false;
            }
          }
        } else {
          if (link.active != undefined) {
            sprite = new _this.THREE.SpriteText(
              `${_this.strIntervalInsert(link.properties.name, 11)}`
            );
            sprite.color = "lightgrey";
            sprite.textHeight = 16;
            return sprite;
          } else {
            return false;
          }
        }
      });
      this.onHover(async (n) => {
        _this.Graph3d.nodeThreeObject(this.executeNodeThreeObjectRules);
        _this.Graph3d.linkThreeObject(this.executeLinkThreeObjectRules);
        _this.Graph3d.linkPositionUpdate((sprite, {start, end}) => {
          const middlePos = Object.assign(
            ...["x", "y", "z"].map((c) => ({
              [c]: start[c] + (end[c] - start[c]) / 2, // calc middle point
            }))
          );

          // Position sprite
          Object.assign(sprite.position, middlePos);
        });
        // _this.Graph3d.d3Force("link").distance((link) => {
        //   if (_this.highlightLinks.has(link) && n != link) {
        //     _this.Graph3d.d3Force("charge").strength((node) => {
        //       if (node.id == link.source.id || node.id == link.target.id)
        //         return -30;
        //       else return -1;
        //     });
        //     return 160;
        //   } else {
        //     return 100;
        //   }
        // });

        let highLightLinksChanged = false;
        if (
          !_this.preHighLightLinks ||
          _this.preHighLightLinks.length != _this.highlightLinks.size
        ) {
          highLightLinksChanged = true;
        } else {
          _this.preHighLightLinks.forEach((p) => {
            let hasSameLinkFlag = false;
            _this.highlightLinks.forEach((l) => {
              if (p == l) {
                hasSameLinkFlag = true;
              }
            });
            if (!hasSameLinkFlag) highLightLinksChanged = true;
          });
        }

        //fix flash bug
        if (highLightLinksChanged) {
          if (n && !(n.properties.fixed == "true")) {
            n.fx = n.x;
            n.fy = n.y;
            n.fz = n.z;
            setTimeout(() => {
              delete n.fx;
              delete n.fy;
              delete n.fz;
            }, 5000);
          }

          // if (!n.source) _this.Graph3d.numDimensions(3);
          _this.preHighLightLinks = [];
          _this.highlightLinks.forEach((l) => {
            _this.preHighLightLinks.push(l);
          });
        }
      });
    }

    clickNodeHandler() {
      let _this = this;
      this.onClickNode((node, event) => {

        _this.Graph3d.d3Force("link").distance((link) => {
          if (node.id == link.source.id || node.id == link.target.id) {
            
            return 500;
          } else {
            return 200;
          }
        });

        _this.Graph3d.d3Force("charge").strength((n) => {
          if (n.id == node.id || n.id == node.id)
            return -80;
          else return -30;
        });

        _this.Graph3d.numDimensions(3);

        this.preNode = {};
        if (!_this.currentNode) {
          this.preNode = {x: 1, y: 1, z: 1};
        } else if (!_this.currentNode.source) {
          this.preNode = _this.currentNode;
        } else if (_this.currentNode.__lineObj) {
          this.preNode = _this.currentNode.__lineObj.position;
        }
        if (_this.keyListener.KeyX == true) {
          _this.dispatchKeyXPress(node, event);
          return;
        }
        _this.highlightLinks.clear();
        _this.selectedLinks.clear();
        _this.selectedNodes.clear();

        _this.highlightNodes.add(node);

        
        //update historyclick
        while (_this.arrowLeftCount > 0) {
          _this.historyClick.pop();
          _this.arrowLeftCount--;
        }
        
        _this.historyClick.push(_this.currentNode);

        
      });

      //点击节点启动编辑器
      _this.addNodeThreeObjectRule((node) => {
        if (_this.currentNode == node) {
          var divElement = document.createElement("div");
          divElement.classList.add("custom-div");

          const nodeEl = document.createElement("textarea");
          nodeEl.innerText = node.properties.name;
          divElement.style.width = "10%";
          divElement.style.height = "10%";
          nodeEl.className = "node-label";
          nodeEl.addEventListener("input", function () {
            // 每次输入发生变化时更新输出
            console.log(nodeEl.value);
            _this.currentNode.properties.name = nodeEl.value;
            _this.currentNode.apply();
          });

          var closeButton = document.createElement("button");
          closeButton.textContent = "关闭";
          closeButton.onclick = function () {
            console.log("close");
            _this.currentNode = null;
            _this.Graph3d.nodeThreeObject(_this.Graph3d.nodeThreeObject()); //TODO 关闭按钮不能生效
          };
          divElement.appendChild(nodeEl);
          divElement.appendChild(closeButton);

          return new window.CSS3DSprite(divElement);
        } else {
          return false;
        }
      });
    }

    focusNode(node) {
      let distance = 500;
      let _this = this;
      // Only focus if focus mode is enabled
      if (!_this.focusMode) return;
    
      // Get the current camera position and rotation
      let cameraPosition = _this.Graph3d.cameraPosition();
      let cameraRotation = _this.Graph3d.camera().rotation;
    
      // Calculate the direction vector from camera to node based on the rotation
      let direction = {
        x: -Math.sin(cameraRotation._y) * Math.cos(cameraRotation._x),
        y: Math.sin(cameraRotation._x),
        z: -Math.cos(cameraRotation._y) * Math.cos(cameraRotation._x)
      };
    
      // Normalize the direction vector
      let length = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
      direction.x /= length;
      direction.y /= length;
      direction.z /= length;
    
      // Calculate the new camera position based on the direction vector and distance
      let newCameraPosition = {
        x: node.x - direction.x * distance,
        y: node.y - direction.y * distance,
        z: node.z - direction.z * distance
      };
    
      // Move the camera to the new position
      _this.Graph3d.cameraPosition(
        newCameraPosition, // new position
        node, // lookAt ({ x, y, z })
        1600 // ms transition duration
      );
    }
    

    delKeyUpHandler() {
      let _this = this;
      this.onDelKeyUp((node, event) => {
        _this.selectedNodes.forEach(async (snode) => {
          snode.hasOwnProperty("source")
            ? await _this.NWG.delLink(snode)
            : await _this.NWG.delNode(snode);
          console.log("delete");
        });
      });
    }

    tabKeyUpHandler() {
      let _this = this;
      this.onTabKeyUp(async (n2, event) => {
        let pos = {x: n2.x, y: n2.y, z: n2.z};
        let node = this.basic.initNode();
        //node.name = "new"; //this will let 3dgraph make a tooltip text a
        node.properties.name = "undefined";
        ["x", "y", "z"].forEach((axis) => {
          node[axis] = pos[axis];
        });

        await this.NWG.addNodes([node]);
        let links = await this.NWG.addRelationships(
          n2,
          {name: "rel", labels: ["linkto"], properties: {name: "undefined"}},
          node
        );
        let link = _this.basic.getLinkById(links[0].id);
        //update historyclick
        while (this.arrowLeftCount > 0) {
          this.historyClick.pop();
          this.arrowLeftCount--;
        }
        this.currentNode = link;
        this.historyClick.push(this.currentNode);

        this.selectedNodes.clear();
        this.selectedNodes.add(link);
        this.guiController.editLinkPanel(link);
      });
    }

    altKeyUpAndDoubleClickedHandler() {
      this.onAltKeyUpAndDoubleClicked(async (node, e) => {
        console.log(node);
        console.log(e);
        let pos = {x: e.clientX, y: e.clientY};
        let target = this.threeUtils.get3DPosByCanvasPos(
          pos,
          0.5,
          this.Graph3d.camera()
        );
        ["x", "y", "z"].forEach((axis) => {
          this.cube.position[axis] = target[axis];
        });
        //cube.position = target;
        console.log(target);
        let node2 = this.basic.initNode();
        let rel = this.NWG.Connector.initRelationship();
        //node2.name = "new"; //this will let 3dgraph make a tooltip text a
        node2.properties.name = "undefined";
        ["x", "y", "z"].forEach((axis) => {
          node2[axis] = target[axis];
        });
        let node2id = await this.NWG.concatNode(node.id, node2, rel);

        //update historyclick
        while (this.arrowLeftCount > 0) {
          this.historyClick.pop();
          this.arrowLeftCount--;
        }
        this.currentNode = window.GraphApp.basic.getLinkObjectById(node2id);
        this.historyClick.push(this.currentNode);

        this.selectedNodes.clear();
        this.selectedNodes.add(this.currentNode);
        this.guiController.editLinkPanel(this.currentNode);
      });
    }

    highLightPathHandler() {
      this.onKeyXPress(async (node, event) => {
        this.highlightLinks.clear();
        this.selectedLinks.clear();
        let r = await this.NWG.Connector.shortestPath2Node(
          this.currentNode.id,
          node.id
        );
        let nodeids = r.nodeids;
        let linkids = r.relids;
        nodeids.forEach((o) => {
          let node = this.basic.getNodeById(o);
          if (node != undefined) {
            this.selectedNodes.add(node);
          }
        });

        linkids.forEach((o) => {
          let link = this.basic.getLinkById(o);
          if (link != undefined) {
            this.highlightLinks.add(link);
            this.selectedLinks.add(link);
          }
        });
      });
      document.addEventListener("keydown", function (event) {
        window.GraphApp.guiController.autoFocusName = false;

        //key press event
        if (event.code == "KeyX") {
          window.GraphApp.guiController.autoFocusName = false;
        }
      });
      document.addEventListener("keyup", function (event) {
        window.GraphApp.guiController.autoFocusName = true;

        //key press event
        if (event.code == "KeyX") {
          window.GraphApp.guiController.autoFocusName = true;
        }
      });
    }

    mouseDragHandler() {
      this.onMouseDrag(() => {});
    }

    KeyHUpHandler() {
      this.onKeyHUp(() => {
        console.log("keyH Up");
        let settings = {};
        settings["apply"] = () => {};
        this.guiController.homePanel(settings);
      });
    }

    fixNode(node, event) {
      // console.log(node);
      // console.log(event);
      if (this.keyListener.ShiftLeft && this.keyListener.KeyP) {
        node.properties.fixed = "true";
        node.properties.fx = window.GraphApp.basic.getNodeObjectById(node.id).x;
        node.properties.fy = window.GraphApp.basic.getNodeObjectById(node.id).y;
        node.properties.fz = window.GraphApp.basic.getNodeObjectById(node.id).z;
        node.fx = window.GraphApp.basic.getNodeObjectById(node.id).x;
        node.fy = window.GraphApp.basic.getNodeObjectById(node.id).y;
        node.fz = window.GraphApp.basic.getNodeObjectById(node.id).z;
        node.apply();
      }
    }

    saveNodePosition() {
      let nodes = [];
      this.Graph3d.graphData().nodes.forEach((node) => {
        nodes.push({
          id: node.id,
          x: node.x,
          y: node.y,
          z: node.z,
          fx: node.fx,
          fy: node.fy,
          fz: node.fz,
        });
      });
      let cypherString =
        "UNWIND $nodes AS node MATCH (n) WHERE id(n) = node.id SET n.x = node.x,n.y = node.y,n.z = node.z,n.fx = node.fx,n.fy=node.fy,n.fz=node.fz";
      window.GraphApp.neo4jConnector.excuteCypher(cypherString, {nodes});
    }

    addNodeColorRule(fun) {
      this.nodeColorRule.push(fun);
    }

    addLinkColorRule(fun) {
      this.linkColorRule.push(fun);
    }

    addNodeThreeObjectRule(fun) {
      this.nodeThreeObjectRule.push(fun);
    }

    addLinkThreeObjectRule(fun) {
      this.linkThreeObjectRule.push(fun);
    }

    executeNodeColorRules = (node) => {
      let finalColor = "gray";
      let ruleColor = null;
      let _this = this;
      for (let r of _this.nodeColorRule) {
        ruleColor = r(node);
        if (!ruleColor || ruleColor != "default") {
          finalColor = ruleColor;
        }
      }
      return finalColor;
    };

    executeLinkColorRules = (link) => {
      let finalColor = "gray";
      let ruleColor = null;
      let _this = this;
      for (let r of _this.linkColorRule) {
        ruleColor = r(link);
        if (!ruleColor || ruleColor != "default") {
          finalColor = ruleColor;
        }
      }
      return finalColor;
    };

    executeNodeThreeObjectRules = (node) => {
      let finalObject = false;
      let ruleObject = null;
      let _this = this;
      for (let r of _this.nodeThreeObjectRule) {
        ruleObject = r(node);
        if (ruleObject) finalObject = ruleObject;
      }
      return finalObject;
    };

    executeLinkThreeObjectRules = (link) => {
      let finalObject = false;
      let ruleObject = null;
      let _this = this;
      for (let r of _this.linkThreeObjectRule) {
        ruleObject = r(link);
        if (ruleObject) finalObject = ruleObject;
      }
      return finalObject;
    };

    sleep(time) {
      return new Promise((resolve) => setTimeout(resolve, time));
    }

    manageStyle() {
      // node style //
      let _this = this;
      this.addNodeThreeObjectRule((node) => {
        if (!node || !node.properties.style) return false;
        let nodecolor = node.properties.color ? node.properties.color : "gray";
        nodecolor = _this.selectedNodes.has(node) ? "yellow" : nodecolor;
        if (node.properties.style == "Box") {
          return new THREE.Mesh(
            new THREE.BoxGeometry(10, 10, 10),
            new THREE.MeshLambertMaterial({
              color: nodecolor,
              transparent: true,
              opacity: 0.75,
            })
          );
        } else if (node.properties.style == "Cone") {
          return new THREE.Mesh(
            new THREE.ConeGeometry(10, 10),
            new THREE.MeshLambertMaterial({
              color: nodecolor,
              transparent: true,
              opacity: 0.75,
            })
          );
        } else if (node.properties.style == "Cylinder") {
          return new THREE.Mesh(
            new THREE.CylinderGeometry(10, 10, 10),
            new THREE.MeshLambertMaterial({
              color: nodecolor,
              transparent: true,
              opacity: 0.75,
            })
          );
        } else if (node.properties.style == "Dodecahedron") {
          return new THREE.Mesh(
            new THREE.DodecahedronGeometry(10),
            new THREE.MeshLambertMaterial({
              color: nodecolor,
              transparent: true,
              opacity: 0.75,
            })
          );
        } else if (node.properties.style == "Sphere") {
          return new THREE.Mesh(
            new THREE.SphereGeometry(10),
            new THREE.MeshLambertMaterial({
              color: nodecolor,
              transparent: true,
              opacity: 0.75,
            })
          );
        } else if (node.properties.style == "Trous") {
          return new THREE.Mesh(
            new THREE.TorusGeometry(10, 10),
            new THREE.MeshLambertMaterial({
              color: nodecolor,
              transparent: true,
              opacity: 0.75,
            })
          );
        } else if (node.properties.style == "TorusKnot") {
          return new THREE.Mesh(
            new THREE.TorusKnotGeometry(10, 10),
            new THREE.MeshLambertMaterial({
              color: nodecolor,
              transparent: true,
              opacity: 0.75,
            })
          );
        } else return false;
      });
      //------------//
    }

    strIntervalInsert(str, length) {
      let reg = new RegExp(".{1," + length + "}", "g");
      let ma = str.match(reg);
      return ma.join("\n");
    }

    // select part of string
    truncateString(str, maxLength) {
      if (str.length > maxLength) {
        return str.substring(0, maxLength) + "...";
      } else {
        return str;
      }
    }
  }

  this.EventManager = EventManager;
})();
