/* global LGraphCanvas */
/* global LGraph */
/* global LiteGraph */
/* eslint camelcase:0 */
/* eslint import/extensions: [0, {  <js>: "always"  }] */

import { LGraph, LiteGraph, LGraphCanvas } from './links/comfyui_litegraph.js';
window.LGraph = LGraph;
window.LiteGraph = LiteGraph;
window.LGraphCanvas = LGraphCanvas;


import { QuickConnection } from '../js/QuickConnection.js';
import { CircuitBoardLines } from '../js/CircuitBoardLines.js';

// LiteGraph.alt_drag_do_clone_nodes=true;
//
(function() {
    //Watch a value in the editor
    function Watch() {
        this.size = [60, 30];
        this.addInput("value", 0, { label: "" });
        this.value = 0;
    }

    Watch.title = "Watch";
    Watch.desc = "Show value of input";

    Watch.prototype.onExecute = function() {
        if (this.inputs[0]) {
            this.value = this.getInputData(0);
        }
    };

    Watch.prototype.getTitle = function() {
        if (this.flags.collapsed) {
            return this.inputs[0].label;
        }
        return this.title;
    };

    Watch.toString = function(o) {
        if (o == null) {
            return "null";
        } else if (o.constructor === Number) {
            return o.toFixed(3);
        } else if (o.constructor === Array) {
            var str = "[";
            for (var i = 0; i < o.length; ++i) {
                str += Watch.toString(o[i]) + (i + 1 != o.length ? "," : "");
            }
            str += "]";
            return str;
        } else {
            return String(o);
        }
    };

    Watch.prototype.onDrawBackground = function(ctx) {
        //show the current value
        this.inputs[0].label = Watch.toString(this.value);
    };

    LiteGraph.registerNodeType("basic/watch", Watch);

    //Constant
    function ConstantNumber() {
        this.addOutput("value", "number");
        this.addProperty("value", 1.0);
        this.widget = this.addWidget("number","value",1,"value");
        this.widgets_up = true;
        this.size = [180, 30];
    }

    ConstantNumber.title = "Const Number";
    ConstantNumber.desc = "Constant number";

    ConstantNumber.prototype.onExecute = function() {
        this.setOutputData(0, parseFloat(this.properties["value"]));
    };

    ConstantNumber.prototype.getTitle = function() {
        if (this.flags.collapsed) {
            return this.properties.value;
        }
        return this.title;
    };

	ConstantNumber.prototype.setValue = function(v)
	{
		this.setProperty("value",v);
	}

    ConstantNumber.prototype.onDrawBackground = function(ctx) {
        //show the current value
        this.outputs[0].label = this.properties["value"].toFixed(3);
    };

    LiteGraph.registerNodeType("basic/const", ConstantNumber);
})();

const circuitBoardLines = new CircuitBoardLines();
circuitBoardLines.init();

const quickConnection = new QuickConnection();
quickConnection.init();
const graph = new LGraph();
const canvas = new LGraphCanvas('#mycanvas', graph);
window.canvas = canvas;
// canvas.links_render_mode = LiteGraph.CIRCUITBOARD_LINK;


quickConnection.initListeners(canvas);
circuitBoardLines.initOverrides(canvas);
circuitBoardLines.debug = true;
if (true) {

const node_const = LiteGraph.createNode('basic/const');
node_const.pos = [740, 100];
graph.add(node_const);
node_const.setValue(4.5);

const node_watch = LiteGraph.createNode('basic/watch');
node_watch.pos = [680, 200];
graph.add(node_watch);
node_const.connect(0, node_watch, 0);
}

if (false) {
	const node_string = LiteGraph.createNode('basic/string');
	node_string.pos = [200, 230];
	graph.add(node_string);

	const node_panel = LiteGraph.createNode('widget/panel');
	node_panel.pos = [440, 150];
	node_panel.size = [200, 240];
	graph.add(node_panel);

	const node_compare = LiteGraph.createNode('string/compare');
	node_compare.pos = [700, 300];
	graph.add(node_compare);
	node_string.connect(0, node_compare, 0);

	const node_combo1 = LiteGraph.createNode('widget/combo');
	node_combo1.pos = [100, 400];
	graph.add(node_combo1);

	const node_combo2 = LiteGraph.createNode('widget/combo');
	node_combo2.pos = [90, 500];
	graph.add(node_combo2);

	const node_concat = LiteGraph.createNode('string/concatenate');
	node_concat.pos = [150, 620];
	graph.add(node_concat);
	node_combo1.connect(0, node_concat, 0);
	node_combo2.connect(0, node_concat, 1);

	const node_bypass = LiteGraph.createNode('math/bypass');
	node_bypass.pos = [780, 500];
	graph.add(node_bypass);

	const node_noise = LiteGraph.createNode('math/noise');
	node_noise.pos = [720, 600];
	graph.add(node_noise);

	const node_array = LiteGraph.createNode('basic/array');
	node_array.pos = [600, 700];
	graph.add(node_array);
	node_array.connect(0, node_bypass, 0);
	node_array.connect(1, node_noise, 0);
}

graph.start();
