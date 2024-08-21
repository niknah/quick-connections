/* eslint quotes:0 */
/* eslint prefer-spread:0 */

// eslint-disable-next-line import/no-unresolved
import { app } from "../../scripts/app.js";
import { QuickConnection } from "./QuickConnection.js";
import { CircuitBoardLines } from './CircuitBoardLines.js';

const quickConnection = new QuickConnection();
quickConnection.init();

const circuitBoardLines = new CircuitBoardLines();
circuitBoardLines.init();

const ext = {
	name: "Quick Connections",

	init() {
		quickConnection.initListeners(app.canvas);
		circuitBoardLines.initOverrides(app.canvas);

		const quickConnectionId = "quick-connections.enable";
		app.ui.settings.addSetting({
			id: quickConnectionId,
			name: "Quick connections enable",
			type: "boolean",
			defaultValue: true,
			onChange: (...args) => {
				quickConnection.enabled = app.ui.settings.getSettingValue(quickConnectionId, true);
				return app.graph.change.apply(app.graph, args);
			},
		});

		const circuitBoardId = "circuit-board-lines.enable";
		app.ui.settings.addSetting({
			id: circuitBoardId,
			name: "Circuit Board lines",
			type: "combo",
			options: [
				{ value: 0, text: "Off" },
				{ value: 1, text: "Circuit board" },
				// On top doesn't place the wires on top of the text boxes
				{ value: 2, text: "On top" },
			],
			defaultValue: 1,

			onChange: (...args) => {
				const option = parseInt(app.ui.settings.getSettingValue(circuitBoardId, 1), 10);
				circuitBoardLines.enabled = (option === 1);
				app.graph.config.links_ontop = (option === 2);
				return app.graph.change.apply(app.graph, args);
			},
		});
	},
};

app.registerExtension(ext);
