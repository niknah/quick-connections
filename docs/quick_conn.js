/* global LGraphCanvas */
/* global LGraph */
/* global LiteGraph */
/* eslint camelcase:0 */
/* eslint import/extensions: [0, {  <js>: "always"  }] */

import { QuickConnection } from './QuickConnection.js';
import { CircuitBoardLines } from './CircuitBoardLines.js';

// LiteGraph.alt_drag_do_clone_nodes=true;

const circuitBoardLines = new CircuitBoardLines();
circuitBoardLines.init();

const quickConnection = new QuickConnection();
quickConnection.init();
const graph = new LGraph();
const mycanvas = document.getElementById('mycanvas');
mycanvas.width = window.innerWidth;
mycanvas.height = window.innerHeight;
const canvas = new LGraphCanvas(mycanvas, graph);
window.canvas = canvas;
// canvas.links_render_mode = LiteGraph.CIRCUITBOARD_LINK;

quickConnection.initListeners(canvas);
circuitBoardLines.initOverrides(canvas);

const params = new URLSearchParams(window.location.search.substring(1));
if (!params.get('nodebug')) {
	circuitBoardLines.debug = true;
	document.querySelector('.test-info').style.display = 'block';
}

function addNodes() {
	const node_const = LiteGraph.createNode('basic/const');
	node_const.pos = [770, 200];
	graph.add(node_const);
	node_const.setValue(4.5);
	node_const.collapse();

	const node_watch = LiteGraph.createNode('basic/watch');
	node_watch.pos = [580, 500];
	graph.add(node_watch);
	node_const.connect(0, node_watch, 0);

	const node_mathCompare = LiteGraph.createNode('math/compare');
	node_mathCompare.pos = [800, 400];
	graph.add(node_mathCompare);
	node_const.connect(0, node_mathCompare, 0);

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

function addNodes2() {
	const node_const = LiteGraph.createNode('basic/const');
	node_const.pos = [1350, 80];
	graph.add(node_const);

	const node_watch = LiteGraph.createNode('basic/watch');
	node_watch.pos = [1450, 200];
	graph.add(node_watch);
	node_const.connect(0, node_watch, 0);

	const node_const2 = LiteGraph.createNode('basic/const');
	node_const2.pos = [1200, 180];
	graph.add(node_const2);

	const node_watch2 = LiteGraph.createNode('basic/watch');
	node_watch2.pos = [1700, 180];
	graph.add(node_watch2);
	node_const2.connect(0, node_watch2, 0);
}

addNodes();
addNodes2();

graph.start();
