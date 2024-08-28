/* eslint max-classes-per-file: 0 */
/* eslint no-tabs: 0 */
/* eslint no-underscore-dangle:0 */
/* eslint import/prefer-default-export:0 */
/* eslint prefer-rest-params:0 */
/* eslint curly:0 */
/* eslint no-plusplus:0 */
/* global LiteGraph */
/* global LGraphCanvas */

/**
 * @preserve
 * Fast, destructive implemetation of Liang-Barsky line clipping algorithm.
 * It clips a 2D segment by a rectangle.
 * @author Alexander Milevski <info@w8r.name>
 * @license MIT
 */
const EPSILON = 1e-6;
const INSIDE = 1;
const OUTSIDE = 0;
function clipT(num, denom, c) {
	/* eslint-disable one-var,no-param-reassign,prefer-destructuring,operator-linebreak */
	/* eslint-disable one-var-declaration-per-line,nonblock-statement-body-position,curly */
	const tE = c[0], tL = c[1];
	if (Math.abs(denom) < EPSILON)
		return num < 0;
	const t = num / denom;
	if (denom > 0) {
		if (t > tL)
			return 0;
		if (t > tE)
			c[0] = t;
	} else {
		if (t < tE)
			return 0;
		if (t < tL)
			c[1] = t;
	}
	return 1;
}
/**
 * @param  {Point} a
 * @param  {Point} b
 * @param  {BoundingBox} box [xmin, ymin, xmax, ymax]
 * @param  {Point?} [da]
 * @param  {Point?} [db]
 * @return {number}
 */
function liangBarsky(a, b, box, da, db) {
	/* eslint-disable one-var,no-param-reassign,prefer-destructuring,operator-linebreak */
	/* eslint-disable one-var-declaration-per-line */
	const x1 = a[0], y1 = a[1];
	const x2 = b[0], y2 = b[1];
	const dx = x2 - x1;
	const dy = y2 - y1;
	if (da === undefined || db === undefined) {
		da = a;
		db = b;
	} else {
		da[0] = a[0];
		da[1] = a[1];
		db[0] = b[0];
		db[1] = b[1];
	}
	if (Math.abs(dx) < EPSILON &&
		Math.abs(dy) < EPSILON &&
		x1 >= box[0] &&
		x1 <= box[2] &&
		y1 >= box[1] &&
		y1 <= box[3]) {
		return INSIDE;
	}
	const c = [0, 1];
	if (clipT(box[0] - x1, dx, c) &&
		clipT(x1 - box[2], -dx, c) &&
		clipT(box[1] - y1, dy, c) &&
		clipT(y1 - box[3], -dy, c)) {
		const tE = c[0], tL = c[1];
		if (tL < 1) {
			db[0] = x1 + tL * dx;
			db[1] = y1 + tL * dy;
		}
		if (tE > 0) {
			da[0] += tE * dx;
			da[1] += tE * dy;
		}
		return INSIDE;
	}
	return OUTSIDE;
}

class MapLinks {
	constructor(canvas) {
		this.canvas = canvas;
		this.nodesByRight = [];
		this.nodesById = [];
		this.lastPathId = 10000000;
		this.paths = [];
		this.lineSpace = Math.floor(LiteGraph.NODE_SLOT_HEIGHT / 2);
		this.debug = false;
	}

	isInsideNode(xy) {
		for (let i = 0; i < this.nodesByRight.length; ++i) {
			const nodeI = this.nodesByRight[i];
			if (nodeI.node.isPointInside(xy[0], xy[1])) {
				return nodeI.node;
			}
		}
		return null;
	}

	findClippedNode(outputXY, inputXY) {
		let closestDistance = Number.MAX_SAFE_INTEGER;
		let closest = null;

		for (let i = 0; i < this.nodesByRight.length; ++i) {
			const node = this.nodesByRight[i];
			const clipA = [-1, -1]; // outputXY.slice();
			const clipB = [-1, -1]; // inputXY.slice();
			const clipped = liangBarsky(
				outputXY,
				inputXY,
				node.area,
				clipA,
				clipB,
			);

			if (clipped === INSIDE) {
				const centerX = (node.area[0] + ((node.area[2] - node.area[0]) / 2));
				const centerY = (node.area[1] + ((node.area[3] - node.area[1]) / 2));
				const dist = Math.sqrt(((centerX - outputXY[0]) ** 2) + ((centerY - outputXY[1]) ** 2));
				if (dist < closestDistance) {
					closest = {
						start: clipA,
						end: clipB,
						node,
					};
					closestDistance = dist;
				}
			}
		}
		return closest;
	}

	testPath(path) {
		const len1 = (path.length - 1);
		for (let p = 0; p < len1; ++p) {
			const clipped = this.findClippedNode(path[p], path[p + 1]);
			if (clipped) {
				return clipped;
			}
		}
		return null;
	}

	mapFinalLink(outputXY, inputXY) {
		const clipped = this.findClippedNode(outputXY, inputXY);
		if (!clipped) {
			// direct, nothing blocking us
			return { path: [outputXY, inputXY] };
		}

		const horzDistance = inputXY[0] - outputXY[0];
		const vertDistance = inputXY[1] - outputXY[1];
		const horzDistanceAbs = Math.abs(horzDistance);
		const vertDistanceAbs = Math.abs(vertDistance);

		if (horzDistanceAbs > vertDistanceAbs) {
			// we should never go left anyway,
			// because input slot is always on left and output is always on right
			const goingLeft = inputXY[0] < outputXY[0];
			const pathStraight45 = [
				[outputXY[0], outputXY[1]],
				[inputXY[0] - (goingLeft ? -vertDistanceAbs : vertDistanceAbs), outputXY[1]],
				[inputXY[0], inputXY[1]],
			];
			// __/
			//
			// __
			//   \
			if (!this.testPath(pathStraight45)) {
				return { path: pathStraight45 };
			}

			const path45Straight = [
				[outputXY[0], outputXY[1]],
				[outputXY[0] + (goingLeft ? -vertDistanceAbs : vertDistanceAbs), inputXY[1]],
				[inputXY[0], inputXY[1]],
			];
			// \__
			//
			//  __
			// /
			if (!this.testPath(path45Straight)) {
				return { path: path45Straight };
			}
		} else {
			// move vert
			const goingUp = inputXY[1] < outputXY[1];
			const pathStraight45 = [
				[outputXY[0], outputXY[1]],
				[outputXY[0], inputXY[1] + (goingUp ? horzDistanceAbs : -horzDistanceAbs)],
				[inputXY[0], inputXY[1]],
			];
			// |
			// |
			//  \
			if (!this.testPath(pathStraight45)) {
				return { path: pathStraight45 };
			}

			const path45Straight = [
				[outputXY[0], outputXY[1]],
				[inputXY[0], outputXY[1] - (goingUp ? horzDistanceAbs : -horzDistanceAbs)],
				[inputXY[0], inputXY[1]],
			];
			// \
			//  |
			//  |
			if (!this.testPath(path45Straight)) {
				return { path: path45Straight };
			}
		}

		const path90Straight = [
			[outputXY[0], outputXY[1]],
			[outputXY[0], inputXY[1]],
			[inputXY[0], inputXY[1]],
		];
		// |_
		const clippedVert = this.testPath(path90Straight);
		if (!clippedVert) {
			return { path: path90Straight };
		}

		const pathStraight90 = [
			[outputXY[0], outputXY[1]],
			[inputXY[0], outputXY[1]],
			[inputXY[0], inputXY[1]],
		];
		// _
		//  |
		//
		// _|
		const clippedHorz = this.testPath(pathStraight90);
		if (!clippedHorz) {
			// add to lines area in destination node?
			// targetNodeInfo.linesArea[0] -= this.lineSpace;
			return { path: pathStraight90 };
		}
		return {
			clippedHorz,
			clippedVert,
		};
	}

	mapLink(outputXY, inputXY, targetNodeInfo, isBlocked, lastDirection) {
		const { clippedHorz, clippedVert, path } = this.mapFinalLink(outputXY, inputXY);
		if (path) {
			return path;
		}

		const horzDistance = inputXY[0] - outputXY[0];
		const vertDistance = inputXY[1] - outputXY[1];
		const horzDistanceAbs = Math.abs(horzDistance);
		const vertDistanceAbs = Math.abs(vertDistance);

		let blockedNodeId;
		// let blockedArea;
		let pathAvoidNode;
		let lastPathLocation;
		let linesArea;

		let thisDirection = null;
		if (lastDirection !== 'horz' && horzDistanceAbs > vertDistanceAbs) {
			// horz then vert to avoid blocking node
			blockedNodeId = clippedHorz.node.node.id;
			// blockedArea = clippedHorz.node.area;
			linesArea = clippedHorz.node.linesArea;
			const horzEdge = horzDistance <= 0
				? (linesArea[2])
				: (linesArea[0] - 1);
			pathAvoidNode = [
				[outputXY[0], outputXY[1]],
				[horzEdge, outputXY[1]],
			];

			if (horzDistance <= 0) {
				linesArea[2] += this.lineSpace;
			} else {
				linesArea[0] -= this.lineSpace;
			}

			const vertDistanceViaBlockTop =
				Math.abs(inputXY[1] - linesArea[1]) +
				Math.abs(linesArea[1] - outputXY[1]);
			const vertDistanceViaBlockBottom =
				Math.abs(inputXY[1] - linesArea[3]) +
				Math.abs(linesArea[3] - outputXY[1]);

			lastPathLocation = [
				horzEdge,
				vertDistanceViaBlockTop <= vertDistanceViaBlockBottom ?
					(linesArea[1])
					: (linesArea[3]),
			];
			const unblockNotPossible1 = this.testPath([...pathAvoidNode, lastPathLocation]);
			if (unblockNotPossible1) {
				lastPathLocation = [
					horzEdge,
					vertDistanceViaBlockTop > vertDistanceViaBlockBottom ?
						(linesArea[1])
						: (linesArea[3]),
				];
			}
			if (lastPathLocation[1] < outputXY[1]) {
				linesArea[1] -= this.lineSpace;
				lastPathLocation[1] -= 1;
			} else {
				linesArea[3] += this.lineSpace;
				lastPathLocation[1] += 1;
			}
			thisDirection = 'vert';
		} else if (lastDirection !== 'vert') {
			// vert then horz to avoid blocking node
			blockedNodeId = clippedVert.node.node.id;
			// blockedArea = clippedVert.node.area;
			linesArea = clippedVert.node.linesArea;
			// Special +/- 1 here because of the way it's calculated
			const vertEdge =
				vertDistance <= 0
					? (linesArea[3] + 1)
					: (linesArea[1] - 1);
			pathAvoidNode = [
				[outputXY[0], outputXY[1]],
				[outputXY[0], vertEdge],
			];
			if (vertDistance <= 0) {
				linesArea[3] += this.lineSpace;
			} else {
				linesArea[1] -= this.lineSpace;
			}

			const horzDistanceViaBlockLeft =
				Math.abs(inputXY[0] - linesArea[0]) +
				Math.abs(linesArea[0] - outputXY[0]);
			const horzDistanceViaBlockRight =
				Math.abs(inputXY[0] - linesArea[2]) +
				Math.abs(linesArea[2] - outputXY[0]);

			lastPathLocation = [
				horzDistanceViaBlockLeft <= horzDistanceViaBlockRight ?
					(linesArea[0])
					: (linesArea[2]),
				vertEdge,
			];
			const unblockNotPossible1 = this.testPath([...pathAvoidNode, lastPathLocation]);
			if (unblockNotPossible1) {
				lastPathLocation = [
					horzDistanceViaBlockLeft > horzDistanceViaBlockRight ?
						(linesArea[0])
						: (linesArea[2]),
					vertEdge,
				];
			}
			if (lastPathLocation[0] < outputXY[0]) {
				linesArea[0] -= this.lineSpace;
				// lastPathLocation[0] -= 1; //this.lineSpace;
			} else {
				linesArea[2] += this.lineSpace;
				// lastPathLocation[0] += 1; //this.lineSpace;
			}
			thisDirection = 'horz';
		} else {
			console.log('blocked will not go backwards', outputXY, inputXY); // eslint-disable-line no-console
			return [outputXY, inputXY];
		}

		// console.log('is blocked check',isBlocked, blockedNodeId);
		if (isBlocked[blockedNodeId] > 3) {
			// Blocked too many times, let's return the direct path
			console.log('Too many blocked', outputXY, inputXY); // eslint-disable-line no-console
			return [outputXY, inputXY];
		}
		if (isBlocked[blockedNodeId])
			++isBlocked[blockedNodeId];
		else
			isBlocked[blockedNodeId] = 1;
		// console.log('pathavoid', pathAvoidNode);
		const nextPath = this.mapLink(
			lastPathLocation,
			inputXY,
			targetNodeInfo,
			isBlocked,
			thisDirection,
		);
		return [...pathAvoidNode, lastPathLocation, ...nextPath.slice(1)];
	}

	expandSourceNodeLinesArea(sourceNodeInfo, path) {
		if (path.length < 3) {
			return false;
		}

		const linesArea = sourceNodeInfo.linesArea;
		if (path[1][0] === path[2][0]) {
			// first link is going vertical
			// while (path[1][0] > linesArea[2])
			linesArea[2] += this.lineSpace;
		}
		return true;
	}

	// expand left side of target node if we're going up there vertically.
	expandTargetNodeLinesArea(targetNodeInfo, path) {
		if (path.length < 2) {
			return false;
		}

		const linesArea = targetNodeInfo.linesArea;
		const path2Len = path.length - 2;
		if (path[path2Len - 1][0] === path[path2Len][0]) {
			// first link is going vertical
			// while (path[path2Len][0] < linesArea[0])
			linesArea[0] -= this.lineSpace;
		}
		return true;
	}

	mapLinks(nodesByExecution) {
		const startCalcTime = new Date().getTime();
		this.links = [];
		this.lastPathId = 1000000;
		this.nodesByRight = {};
		this.nodesById = {};
		this.nodesByRight = nodesByExecution.map((node) => {
			const radius = this.canvas.round_radius;
			const y = node.pos[1] - LiteGraph.NODE_TITLE_HEIGHT;
			const area = [
				node.pos[0] - radius / 2,
				y - radius / 2,
				node.pos[0] + node.size[0] + radius,
				node.pos[1] + node.size[1] + radius,
			];
			const linesArea = Array.from(area);
			linesArea[0] -= 5;
			// this.lineSpace;
			linesArea[2] += 1;
			const obj = {
				node,
				area,
				linesArea,
			};
			this.nodesById[node.id] = obj;
			return obj;
		});
		//
		//		this.nodesByRight.sort(
		//			(a, b) => (a.area[1]) - (b.area[1]),
		//		);

		this.nodesByRight.filter((nodeI) => {
			const { node } = nodeI;
			if (!node.outputs) {
				return false;
			}
			node.outputs.filter((output, slot) => {
				if (!output.links) {
					return false;
				}

				const linkPos = new Float32Array(2);
				const outputXYConnection = node.getConnectionPos(false, slot, linkPos);
				const outputNodeInfo = this.nodesById[node.id];
				const outputXY = Array.from(outputXYConnection);
				outputXY[0] = outputNodeInfo.linesArea[2];
				// LiteGraph.NODE_SLOT_HEIGHT;
				// outputXY[0] += this.lineSpace * 2;
				output.links.filter((linkId) => {
					const link = this.canvas.graph.links[linkId];
					if (link) {
						const targetNode = this.canvas.graph.getNodeById(link.target_id);
						const inputLinkPos = new Float32Array(2);
						const inputXYConnection = targetNode.getConnectionPos(
							true,
							link.target_slot,
							inputLinkPos,
						);
						const inputXY = Array.from(inputXYConnection);
						// inputXY[0] -= LiteGraph.NODE_SLOT_HEIGHT;
						const nodeInfo = this.nodesById[targetNode.id];
						inputXY[0] = nodeInfo.linesArea[0];

						// WARNING: getNodeOnPos does weird measurements.
						// It adds +4 / -4 on the left right margins.
						const inputBlockedByNode =
							this.canvas.graph.getNodeOnPos(
								inputXY[0],
								inputXY[1],
								this.canvas.visible_nodes,
								this.lineSpace / 2,
							);
						const outputBlockedByNode =
							this.canvas.graph.getNodeOnPos(
								outputXY[0],
								outputXY[1],
								this.canvas.visible_nodes,
								this.lineSpace / 2,
							);

						let path = null;
						// console.log('blocked', inputBlockedByNode, outputBlockedByNode, 'inputXY', inputXY);
						if (!inputBlockedByNode && !outputBlockedByNode) {
							const pathFound = this.mapLink(outputXY, inputXY, nodeInfo, {}, null);
							if (pathFound && pathFound.length > 2) {
								// mapLink() may have expanded the linesArea,
								// lets put it back into the inputXY so the line is straight
								// inputXY[0] = nodeInfo.linesArea[0];
								// this.addPathToNodes(pathFound);
								path = [outputXYConnection, ...pathFound, inputXYConnection];
								this.expandTargetNodeLinesArea(nodeInfo, path);
							}
						}
						if (!path) {
							path = [outputXYConnection, outputXY, inputXY, inputXYConnection];
						}
						this.expandSourceNodeLinesArea(nodeI, path);
						this.paths.push({
							path,
							node,
							targetNode,
							slot,
						});
					}
					return false;
				});
				return false;
			});
			return false;
		});
		this.lastCalculate = new Date().getTime();
		this.lastCalcTime = this.lastCalculate - startCalcTime;

		if (this.debug)
			console.log('last calc time', this.lastCalcTime); // eslint-disable-line no-console
		// console.log('nodesbyright', this.nodesByRight);
		// Uncomment this to test timeout on draws
		// this.lastCalcTime = 250;
	}

	drawLinks(ctx) {
		if (this.debug)
			console.log('paths', this.paths); // eslint-disable-line no-console

		ctx.save();
		const currentNodeId = this.canvas.current_node ? this.canvas.current_node.id : null;
		const corners = [];
		this.paths.filter((pathI) => {
			const path = pathI.path;
			const connection = pathI.node.outputs[pathI.slot];
			if (path.length <= 1) {
				return false;
			}
			ctx.beginPath();
			const slotColor =
				this.canvas.default_connection_color_byType[connection.type]
				|| this.canvas.default_connection_color.input_on;

			if (currentNodeId === pathI.node.id || currentNodeId === pathI.targetNode.id) {
				ctx.strokeStyle = 'white';
			} else {
				ctx.strokeStyle = slotColor;
			}
			ctx.lineWidth = 3;
			const cornerRadius = this.lineSpace;

			let isPrevDotRound = false;
			for (let p = 0; p < path.length; ++p) {
				const pos = path[p];

				if (p === 0) {
					ctx.moveTo(pos[0], pos[1]);
				}
				const prevPos = pos;
				const cornerPos = path[p + 1];
				const nextPos = path[p + 2];

				let drawn = false;
				if (nextPos) {
					const xDiffBefore = cornerPos[0] - prevPos[0];
					const yDiffBefore = cornerPos[1] - prevPos[1];
					const xDiffAfter = nextPos[0] - cornerPos[0];
					const yDiffAfter = nextPos[1] - cornerPos[1];
					const isBeforeStraight = xDiffBefore === 0 || yDiffBefore === 0;
					const isAfterStraight = xDiffAfter === 0 || yDiffAfter === 0;
					// const isBefore45 = Math.abs(xDiffBefore) === Math.abs(yDiffBefore);
					// const isAfter45 = Math.abs(xDiffAfter) === Math.abs(yDiffAfter);
					// && cornerPos[0] === prevPos[0] && nextPos[1] === cornerPos[1]) {
					// up/down -> left/right
					if (
						(isBeforeStraight || isAfterStraight)
						// (isBeforeStraight || isBefore45)
						// && (isAfterStraight || isAfter45)
					) {
						const beforePos = [
							cornerPos[0],
							cornerPos[1],
						];
						const afterPos = [
							cornerPos[0],
							cornerPos[1],
						];

						if (isBeforeStraight) {
							const xSignBefore = Math.sign(xDiffBefore);
							const ySignBefore = Math.sign(yDiffBefore);
							beforePos[0] = cornerPos[0] - cornerRadius * xSignBefore;
							beforePos[1] = cornerPos[1] - cornerRadius * ySignBefore;
						}
						if (isAfterStraight) {
							const xSignAfter = Math.sign(xDiffAfter);
							const ySignAfter = Math.sign(yDiffAfter);
							afterPos[0] = cornerPos[0] + cornerRadius * xSignAfter;
							afterPos[1] = cornerPos[1] + cornerRadius * ySignAfter;
						}

						// console.log('nnn', beforePos, cornerPos, afterPos);
						ctx.lineTo(beforePos[0], beforePos[1]);
						corners.push(cornerPos);
						// ctx.lineTo(cornerPos[0], cornerPos[1]);
						// ctx.lineTo(beforePos[0], beforePos[1]);
						ctx.quadraticCurveTo(cornerPos[0], cornerPos[1], afterPos[0], afterPos[1]);
						isPrevDotRound = true;
						drawn = true;
					}
				}
				if (p > 0 && !drawn) {
					if (!isPrevDotRound) {
						ctx.lineTo(pos[0], pos[1]);
					}
					isPrevDotRound = false;
				}
			}

			ctx.stroke();
			ctx.closePath();
			return false;
		});

		if (this.debug) {
			corners.filter((corn) => {
				ctx.strokeStyle = '#ff00ff';
				ctx.beginPath();
				ctx.arc(corn[0], corn[1], 1, 0, 2 * Math.PI);
				ctx.stroke();
				return false;
			});

			this.nodesByRight.filter((nodeI) => {
				ctx.lineWidth = 1;
				ctx.strokeStyle = '#000080';
				ctx.beginPath();
				ctx.rect(
					nodeI.area[0],
					nodeI.area[1],
					nodeI.area[2] - nodeI.area[0],
					nodeI.area[3] - nodeI.area[1],
				);
				ctx.stroke();
				ctx.closePath();

				ctx.strokeStyle = '#0000a0';
				ctx.beginPath();
				ctx.rect(
					nodeI.linesArea[0],
					nodeI.linesArea[1],
					nodeI.linesArea[2] - nodeI.linesArea[0],
					nodeI.linesArea[3] - nodeI.linesArea[1],
				);
				ctx.stroke();
				ctx.closePath();
				return false;
			});
		}

		ctx.restore();
	}
}

export class CircuitBoardLines {
	constructor() {
		this.canvas = null;
		this.mapLinks = null;
		this.enabled = true;
	}

	setEnabled(e) { this.enabled = e; }

	recalcMapLinksTimeout() {
		// calculate paths when user is idle...
		if (!this.skipNextRecalcTimeout) {
			if (this.recalcTimeout) {
				clearTimeout(this.recalcTimeout);
				this.recalcTimeout = null;
			}

			this.recalcTimeout = setTimeout(() => {
				this.recalcTimeout = null;
				this.recalcMapLinks();
				this.redraw();
			}, this.mapLinks.lastCalcTime * 2);
		}
		this.skipNextRecalcTimeout = false;
	}

	redraw() {
		if (this.lastDrawTimeout) {
			clearTimeout(this.lastDrawTimeout);
			this.lastDrawTimeout = null;
		}

		this.lastDrawTimeout = setTimeout(() => {
			this.lastDrawTimeout = null;
			window.requestAnimationFrame(() => {
				console.log('redraw timeout'); // eslint-disable-line no-console
				this.canvas.setDirty(true, true);
				this.skipNextRecalcTimeout = true;
				this.canvas.draw(true, true);
			});
		}, 0);
	}

	recalcMapLinksCheck() {
		if (this.mapLinks) {
			if (this.mapLinks.lastCalcTime > 100) {
				this.recalcMapLinksTimeout();
				return false;
			}
		}
		this.recalcMapLinks();
		return true;
	}

	recalcMapLinks() {
		this.mapLinks = new MapLinks(this.canvas);
		this.mapLinks.debug = this.debug;
		const nodesByExecution = this.canvas.graph.computeExecutionOrder();
		this.mapLinks.mapLinks(nodesByExecution);
	}

	drawConnections(
		ctx,
	) {
		if (!this.canvas || !this.canvas.graph) {
			return false;
		}

		this.recalcMapLinksCheck();

		this.mapLinks.drawLinks(ctx);
		this.lastDrawConnections = new Date().getTime();

		return true;
	}

	init() {
		const oldDrawConnections = LGraphCanvas.prototype.drawConnections;
		const t = this;
		LGraphCanvas.prototype.drawConnections = function drawConnections(
			ctx,
		) {
			if (t.canvas && t.enabled) {
				return t.drawConnections(
					ctx,
				);
			}
			return oldDrawConnections.apply(this, arguments);
		};
	}

	initOverrides(canvas) {
		this.canvas = canvas;
	}
}
