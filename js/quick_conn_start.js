/* eslint quotes:0 */
/* eslint prefer-spread:0 */
/* global LiteGraph */
/* eslint operator-linebreak:0 */

import { app } from "../../scripts/app.js";
import { QuickConnection } from "./QuickConnection.js";
import { CircuitBoardLines } from './CircuitBoardLines.js';

const quickConnection = new QuickConnection();
quickConnection.init();

const quickConnectionId = "quick-connections";

const quickConnectionsExt = {
	name: "Quick Connections",
	settings: [
		{
			id: `${quickConnectionId}.enable`,
			name: "Quick connections enable",
			type: "boolean",
			defaultValue: true,
			onChange: (...args) => {
				[quickConnection.enabled] = args;
				if (app?.graph?.change) {
					return app.graph.change.apply(app.graph, args);
				}
				return null;
			},
		},
		{
			id: `${quickConnectionId}.connectDotOnly`,
			category: [quickConnectionId, "enable", "connectDotOnly"],
			name: "Connect with dot",
			tooltip: "Disable to connect with text too, a bigger area to release the mouse button",
			type: "boolean",
			defaultValue: true,
			onChange: (...args) => {
				[quickConnection.connectDotOnly] = args;
				if (app?.graph?.change) {
					return app.graph.change.apply(app.graph, args);
				}
				return null;
			},
		},
		{
			id: `${quickConnectionId}.maxSuggestions`,
			category: [quickConnectionId, "enable", "maxSuggestions"],
			name: "Maximum suggestions for connections",
			type: "number",
			defaultValue: 15,
			onChange: (...args) => {
				[quickConnection.maxSuggestions] = args;
				if (app?.graph?.change) {
					return app.graph.change.apply(app.graph, args);
				}
				return null;
			},
		},
	],

	init() {
		quickConnection.initListeners(app.canvas);
	},
};

const circuitBoardLines = new CircuitBoardLines();
const circuitBoardId = "circuit-board-lines";
const defaultConfig = {
	nodeSpace: [-8, -4, 12, 4],
	lineSpace: Math.floor(LiteGraph.NODE_SLOT_HEIGHT / 2),
};


const circuitBoardLinesExt = {
	name: "Circuit Board Lines",

	settings: [
		{
			id: `${circuitBoardId}.enable`,
			name: "Circuit Board lines",
			category: [circuitBoardId, "enable", "enable"],
			type: "combo",
			options: [
				{ value: 0, text: "Off" },
				{ value: 1, text: "Circuit board" },
				// On top doesn't place the wires on top of the text boxes
				{ value: 2, text: "On top (Does not work in nodes v2)" },
			],
			defaultValue: 1,

			onChange: (...args) => {
				const option = args[0];
				circuitBoardLines.enabled = (option === 1);
				if (app.graph) {
					app.graph.config.links_ontop = (option === 2);
					if (app.canvas?.graph?.config) {
						app.canvas.graph.config.links_ontop = (option === 2);
					}
					return app.graph.change.apply(app.graph, args);
				}
				console.error('app.graph not available');
				return null;
			},
		},
		{
			id: `${circuitBoardId}.spacing-left`,
			name: "Node spacing left",
			category: [circuitBoardId, "spacing","left"],
			tooltip: "Spacing between line and left of node",
			type: "number",
			// 8,4,12,4
			defaultValue: defaultConfig.nodeSpace[0],
			onChange: (...args) => {
				circuitBoardLines.config.nodeSpace[0] =
					CircuitBoardLines.cleanInteger(args[0], defaultConfig.nodeSpace[0]);

				if (app.graph) {
					return app.graph.change.apply(app.graph, args);
				}
				return null;
			},
		},
		{
			id: `${circuitBoardId}.spacing-top`,
			name: "Node spacing top",
			category: [circuitBoardId, "spacing","top"],
			tooltip: "Spacing between line and top of node",
			type: "number",
			// 8,4,12,4
			defaultValue: defaultConfig.nodeSpace[1],
			onChange: (...args) => {
				circuitBoardLines.config.nodeSpace[1] =
					CircuitBoardLines.cleanInteger(args[0], defaultConfig.nodeSpace[1]);

				if (app.graph) {
					return app.graph.change.apply(app.graph, args);
				}
				return null;
			},
		},
		{
			id: `${circuitBoardId}.spacing-right`,
			name: "Node spacing right",
			category: [circuitBoardId, "spacing","right"],
			tooltip: "Spacing between line and right of node",
			type: "number",
			defaultValue: defaultConfig.nodeSpace[2],
			onChange: (...args) => {
				circuitBoardLines.config.nodeSpace[2] =
					CircuitBoardLines.cleanInteger(args[0], defaultConfig.nodeSpace[2]);

				if (app.graph) {
					return app.graph.change.apply(app.graph, args);
				}
				return null;
			},
		},
		{
			id: `${circuitBoardId}.spacingbottom`,
			name: "Node spacing bottom",
			category: [circuitBoardId, "spacing","bottom"],
			tooltip: "Spacing between line and bottom of node",
			type: "number",
			defaultValue: defaultConfig.nodeSpace[3],
			onChange: (...args) => {
				circuitBoardLines.config.nodeSpace[3] =
					CircuitBoardLines.cleanInteger(args[0], defaultConfig.nodeSpace[3]);

				if (app.graph) {
					return app.graph.change.apply(app.graph, args);
				}
				return null;
			},
		},
		{
			id: `${circuitBoardId}.spacing-line`,
			name: "Line spacing",
			category: [circuitBoardId, "spacing", "lines"],
			tooltip: "Spacing between lines",
			type: "number",
			defaultValue: defaultConfig.lineSpace,
			onChange: (...args) => {
				circuitBoardLines.config.lineSpace =
						CircuitBoardLines.cleanInteger(args[0], defaultConfig.lineSpace)
				if (app.graph) {
					return app.graph.change.apply(app.graph, args);
				}
				return null;
			},
		},
		{
			id: `${circuitBoardId}.only90or45`,
			name: "Prefer 90 or 45 degree lines",
			category: [circuitBoardId, "enable", "only90or45"],
			tooltip: "Show mostly 90 or 45 degree lines, normally it'll link directly at any angle if the line if there are no nodes in the way",
			type: "boolean",
			defaultValue: true,
			onChange: (...args) => {
				circuitBoardLines.maxDirectLineDistance = args[0]
					? 20 : Number.MAX_SAFE_INTEGER;

				if (app.graph) {
					return app.graph.change.apply(app.graph, args);
				}
				return null;
			},
		},
	],

	init() {
		circuitBoardLines.init();
		circuitBoardLines.initOverrides(app.canvas);
	},
};

app.registerExtension(quickConnectionsExt);
app.registerExtension(circuitBoardLinesExt);
