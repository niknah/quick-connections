/* eslint quotes:0 */
/* eslint prefer-spread:0 */

// eslint-disable-next-line import/no-unresolved
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
	],

	init() {
		quickConnection.initListeners(app.canvas);
	},
};

const circuitBoardLines = new CircuitBoardLines();
const circuitBoardId = "circuit-board-lines";

const circuitBoardLinesExt = {
	name: "Circuit Board Lines",

	settings: [
		{
			id: `${circuitBoardId}.enable`,
			name: "Circuit Board lines",
			category: [circuitBoardId, "enable"],
			type: "combo",
			options: [
				{ value: 0, text: "Off" },
				{ value: 1, text: "Circuit board" },
				// On top doesn't place the wires on top of the text boxes
				{ value: 2, text: "On top" },
			],
			defaultValue: 1,

			onChange: (...args) => {
				const option = args[0];
				circuitBoardLines.enabled = (option === 1);
				if (app.graph) {
					app.graph.config.links_ontop = (option === 2);
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
