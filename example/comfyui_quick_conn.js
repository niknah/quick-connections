/* eslint camelcase:0 */
/* eslint import/extensions: [0, {  <js>: 'always'  }] */
/* eslint no-else-return:0 */
/* eslint max-classes-per-file:0 */

import {
	LGraphNode,
	LGraph,
	LiteGraph,
	LGraphCanvas,
// eslint-disable-next-line import/no-unresolved
} from './links/comfyui_litegraph.js';
import { QuickConnection } from './QuickConnection.js';
import { CircuitBoardLines } from './CircuitBoardLines.js';

window.LGraph = LGraph;
window.LiteGraph = LiteGraph;
window.LGraphCanvas = LGraphCanvas;

// LiteGraph.alt_drag_do_clone_nodes=true;
//
(function run() {
	// Watch a value in the editor
	class Watch extends LGraphNode {
		constructor() {
			super();
			this.size = [60, 30];
			this.addInput('value', 0, { label: '' });
			this.value = 0;
			this.title = 'Watch';
			this.desc = 'Show value of input';
		}

		onExecute() {
			if (this.inputs[0]) {
				this.value = this.getInputData(0);
			}
		}

		getTitle() {
			if (this.flags.collapsed) {
				return this.inputs[0].label;
			}
			return this.title;
		}

		toString(o) {
			if (o == null) {
				return 'null';
			} else if (o.constructor === Number) {
				return o.toFixed(3);
			} else if (o.constructor === Array) {
				let str = '[';
				// eslint-disable-next-line no-plusplus
				for (let i = 0; i < o.length; ++i) {
					str += this.toString(o[i]) + (i + 1 !== o.length ? ',' : '');
				}
				str += ']';
				return str;
			} else {
				return String(o);
			}
		}

		onDrawBackground(/* ctx */) {
			// show the current value
			this.inputs[0].label = this.toString(this.value);
		}
	}

	LiteGraph.registerNodeType('basic/watch', Watch);

	// Constant
	class ConstantNumber extends LGraphNode {
		constructor() {
			super();
			this.addOutput('value', 'number');
			this.addProperty('value', 1.0);
			this.widget = this.addWidget('number', 'value', 1, 'value');
			this.widgets_up = true;
			this.size = [180, 30];
			this.title = 'Const Number';
			this.desc = 'Constant number';
		}

		onExecute() {
			this.setOutputData(0, parseFloat(this.properties.value));
		}

		getTitle() {
			if (this.flags.collapsed) {
				return this.properties.value;
			}
			return this.title;
		}

		setValue(v) {
			this.setProperty('value', v);
		}

		onDrawBackground(/* ctx */) {
			// show the current value
			this.outputs[0].label = this.properties.value.toFixed(3);
		}
	}

	LiteGraph.registerNodeType('basic/const', ConstantNumber);
}());

const circuitBoardLines = new CircuitBoardLines();
circuitBoardLines.init();

const quickConnection = new QuickConnection();
quickConnection.init();
const graph = new LGraph();
const canvas = new LGraphCanvas('mycanvas', graph);
window.canvas = canvas;

quickConnection.initListeners(canvas);
circuitBoardLines.initOverrides(canvas);
circuitBoardLines.debug = true;
const node_const = LiteGraph.createNode('basic/const');
node_const.pos = [740, 100];
graph.add(node_const);
node_const.setValue(4.5);

const node_watch = LiteGraph.createNode('basic/watch');
node_watch.pos = [680, 200];
graph.add(node_watch);
node_const.connect(0, node_watch, 0);

graph.start();
