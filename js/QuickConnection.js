/* eslint no-tabs: 0 */
/* eslint import/prefer-default-export:0 */
/* eslint no-underscore-dangle:0 */
/* eslint no-plusplus:0 */
/* eslint prefer-rest-params:0 */
/* eslint operator-linebreak:0 */
/* eslint no-unneeded-ternary:0 */
/* global LGraphCanvas */
/* global LiteGraph */

export class QuickConnection {
	constructor() {
		this.insideConnection = null;
		this.enabled = true;
		// use inputs that already have a link to them.
		this.useInputsWithLinks = false;
		this.release_link_on_empty_shows_menu = true;
	}

	init() {
		const origProcessMouseDown = LGraphCanvas.prototype.processMouseDown;
		const t = this;
		this.acceptingNodes = null;
		LGraphCanvas.prototype.processMouseDown = function mouseDown() {
			t.pointerDown();
			const ret = origProcessMouseDown.apply(this, arguments);
			return ret;
		};

		const origProcessMouseUp = LGraphCanvas.prototype.processMouseUp;
		LGraphCanvas.prototype.processMouseUp = function mouseUp() {
			if (!t.enabled) {
				return origProcessMouseUp.apply(this, arguments);
			}

			// Let's not popup the release on empty spot menu if we've released the mouse on a dot
			const origReleaseLink = LiteGraph.release_link_on_empty_shows_menu;
			if (t.pointerUp()) {
				LiteGraph.release_link_on_empty_shows_menu = false;
				t.release_link_on_empty_shows_menu = false;
			}
			const ret = origProcessMouseUp.apply(this, arguments);
			LiteGraph.release_link_on_empty_shows_menu = origReleaseLink;
			t.release_link_on_empty_shows_menu = true;
			return ret;
		};


		// ComfyUI has it's own version of litegraph.js
		// https://github.com/Comfy-Org/litegraph.js
	}

	initListeners(canvas) {
		this.graph = canvas.graph;
		this.canvas = canvas;
		this.canvas.canvas.addEventListener("litegraph:canvas",(e) => {
			const detail = e.detail;
			if(!this.release_link_on_empty_shows_menu
				&& detail && detail.subType == 'empty-release'
			) {
				e.stopPropagation();
			}
		});

		this.isComfyUI = this.canvas.connecting_links !== undefined ? true : false;

		this.addOnCanvas('onDrawOverlay', (ctx) => this.onDrawOverlay(ctx));
	}

	getCurrentConnection() {
		if (this.isComfyUI) {
			const connectingLink =
				(this.canvas.connecting_links
					&& this.canvas.connecting_links.length > 0
				) ?
					this.canvas.connecting_links[0] : null;
			if (connectingLink) {
				return {
					node: connectingLink.node,
					input: connectingLink.input,
					output: connectingLink.output,
				};
			}
		} else if (this.canvas.connecting_node) {
			return {
				node: this.canvas.connecting_node,
				input: this.canvas.connecting_input,
				output: this.canvas.connecting_output,
			};
		}
		return null;
	}

	pointerDown() {
		this.acceptingNodes = null;
		return false;
	}

	pointerUp() {
		this.acceptingNodes = null;
		const connectionInfo = this.getCurrentConnection();

		if (this.insideConnection && connectionInfo) {
			if (connectionInfo.input) {
				this.insideConnection.node.connect(
					this.insideConnection.connection_slot_index,
					connectionInfo.node,
					this.canvas.connecting_input.slot_index,
				);
			} else {
				connectionInfo.node.connect(
					connectionInfo.output.slot_index,
					this.insideConnection.node,
					this.insideConnection.connection_slot_index,
				);
			}
			return true;
		}
		return false;
	}

	findAcceptingNodes(fromConnection, fromNode, findInput) {
		const accepting = [];
		const addToAccepting = (arr, node) => {
			// eslint-disable-next-line eqeqeq
			if (node.mode == 4) {
				// bypassed
				return;
			}
			if (node.id === fromNode.id) {
				// Don't connect to myself
				return;
			}
			for (let c = 0; c < arr.length; ++c) {
				const input = arr[c];
				if (!input.link || this.useInputsWithLinks) {
					const accept = LiteGraph.isValidConnection(
						input.type,
						fromConnection.type,
					);
					if (accept) {
						accepting.push({
							node,
							connection: input,
							connection_slot_index: c,
						});
					}
				}
			}
		};

		const nodes = this.graph._nodes;
		for (let i = 0; i < nodes.length; ++i) {
			const node = nodes[i];
			if (node.inputs && findInput) {
				addToAccepting(node.inputs, node);
			}
			if (node.outputs && !findInput) {
				addToAccepting(node.outputs, node);
			}
		}

		accepting.sort((a, b) => a.node.pos[1] - b.node.pos[1]);
		return accepting;
	}

	addOnCanvas(name, func) {
		const obj = this.canvas;
		const oldFunc = obj[name];
		obj[name] = function callFunc() {
			if (oldFunc) {
				oldFunc.apply(obj, arguments);
			}
			return func.apply(obj, arguments);
		};
	}

	onDrawOverlay(ctx) {
		if (!this.enabled) {
			return;
		}

		ctx.save();
		this.canvas.ds.toCanvasContext(ctx);

		this.insideConnection = null;

		const connectionInfo = this.getCurrentConnection();

		if (connectionInfo) {
			const { node, input, output } = connectionInfo;
			const slotPos = new Float32Array(2);

			// const isInput = this.canvas.connecting_input ? true : false;
			// const connecting = isInput ? this.canvas.connecting_input : this.canvas.connecting_output;
			const isInput = input ? true : false;
			const connecting = isInput ? input : output;

			const pos = node.getConnectionPos(isInput, connecting.slot_index, slotPos);

			if (!this.acceptingNodes) {
				this.acceptingNodes = this.findAcceptingNodes(
					connecting,
					// this.canvas.connecting_node,
					node,
					!isInput,
				);
			}
			const mouseX = this.canvas.graph_mouse[0];
			const mouseY = this.canvas.graph_mouse[1];

			const buttonShift = [
				isInput ? -32 : +32,
				this.acceptingNodes.length === 1
					? 0
					: (-this.acceptingNodes.length / (2 * LiteGraph.NODE_SLOT_HEIGHT)),
			];

			const linkPos = [
				pos[0] + buttonShift[0],
				pos[1] + buttonShift[1],
			];

			const linkCloseArea = [
				linkPos[0] - LiteGraph.NODE_SLOT_HEIGHT * 2,
				linkPos[1] - LiteGraph.NODE_SLOT_HEIGHT,
			];

			const isInsideClosePosition = LiteGraph.isInsideRectangle(
				mouseX,
				mouseY,
				linkCloseArea[0],
				linkCloseArea[1],
				LiteGraph.NODE_SLOT_HEIGHT * 4,
				LiteGraph.NODE_SLOT_HEIGHT * (this.acceptingNodes.length + 1),
			);

			// const oldFillStyle = ctx.fillStyle;
			if (isInsideClosePosition) {
				// for (let acceptingNode of this.acceptingNodes) {
				this.acceptingNodes.filter((acceptingNode) => {
					const isInsideRect = LiteGraph.isInsideRectangle(
						mouseX,
						mouseY,
						linkPos[0] - 5,
						linkPos[1] - 10,
						10,
						20,
					);

					if (isInsideRect) {
						this.insideConnection = acceptingNode;
						ctx.fillStyle = LiteGraph.EVENT_LINK_COLOR; // "#ffcc00";
						// highlight destination if mouseover
						ctx.beginPath();
						ctx.arc(
							linkPos[0],
							linkPos[1],
							6,
							0,
							Math.PI * 2,
						);
						ctx.fill();
						ctx.closePath();

						ctx.beginPath();

						ctx.strokeStyle = '#6a6';
						ctx.setLineDash([5, 10]);
						ctx.lineWidth = 3;

						const aNode = acceptingNode.node;
						const destPos = new Float32Array(2);
						aNode.getConnectionPos(!isInput, acceptingNode.connection_slot_index, destPos);
						ctx.moveTo(pos[0], pos[1]);

						ctx.lineTo(destPos[0], destPos[1]);
						ctx.stroke();
						ctx.closePath();

						//					ctx.roundRect(
						//						aNode.pos[0], aNode.pos[1]-LiteGraph.NODE_TITLE_HEIGHT,
						//						aNode.size[0], aNode.size[1]+LiteGraph.NODE_TITLE_HEIGHT,
						//						5
						//					);
					} else {
						const slotColor =
							this.canvas.default_connection_color_byType[acceptingNode.connection.type]
							|| this.canvas.default_connection_color.input_on;

						ctx.fillStyle = slotColor || this.canvas.default_connection_color.input_on;
						ctx.beginPath();

						ctx.arc(linkPos[0], linkPos[1], 4, 0, Math.PI * 2);
						ctx.fill();
						ctx.closePath();
					}

					const textxy = [
						linkPos[0] + (isInput ? -LiteGraph.NODE_SLOT_HEIGHT : LiteGraph.NODE_SLOT_HEIGHT),
						linkPos[1],
					];

					const acceptingText = `${acceptingNode.connection.name} @${acceptingNode.node.title}`;
					const textBox = ctx.measureText(acceptingText);
					const box = [
						textxy[0],
						textxy[1] - textBox.fontBoundingBoxAscent,
						textBox.width,
						textBox.fontBoundingBoxAscent + textBox.fontBoundingBoxDescent,
					];

					if (!isInput) {
						ctx.textAlign = 'left';
					} else {
						box[0] -= textBox.width;
						ctx.textAlign = 'right';
					}

					ctx.beginPath();
					ctx.fillStyle = LiteGraph.NODE_DEFAULT_BGCOLOR;
					ctx.roundRect(
						box[0] - 8,
						box[1] - 4,
						box[2] + 16,
						box[3] + 8,
						5,
					);
					ctx.fill();
					ctx.closePath();

					ctx.fillStyle = LiteGraph.WIDGET_TEXT_COLOR;
					ctx.fillText(acceptingText, textxy[0], textxy[1]);

					linkPos[1] += LiteGraph.NODE_SLOT_HEIGHT;
					return false;
				});
			}
		}
		ctx.restore();
	}
}
