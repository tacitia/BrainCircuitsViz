(function(sd, $, undefined) {

	// Constants
	var colorPalette = [
		d3.rgb(141, 211, 199).toString(),
		d3.rgb(255, 255, 179).toString(),
		d3.rgb(190, 186, 218).toString(),
		d3.rgb(251, 128, 114).toString(),
		d3.rgb(128, 177, 211).toString(),
		d3.rgb(253, 180, 98).toString(),
		d3.rgb(179, 222, 105).toString(),
		d3.rgb(252, 205, 229).toString(),
		d3.rgb(217, 217, 217).toString(),
		d3.rgb(188, 128, 189).toString(),
		d3.rgb(204, 235, 197).toString(),
		d3.rgb(255, 237, 111).toString()
	];

	sd.circNodes = null;
	sd.circLinks = null;
	sd.forceNodes = null;
	sd.forceLinks = null;
	sd.matrix = null;
	
	sd.init = function(datasetKey) {
		var datasetMaps = user.datasets[datasetKey];
		sd.circNodes = [];
		sd.circLinks = [];
		sd.forceNodes = [];
		sd.forceLinks = [];
		console.log('1.1')
		initActiveNodes(datasetMaps);
		console.log('1.2')
		initActiveLinks(datasetMaps.link_map);
		initActiveMatrix();
		console.log('1.3')
		computeCircularNodesParameters();
	};

	function computeCircularNodesParameters() {
		var total_num = sd.circNodes.length;
		var delta = 2 * Math.PI  / total_num;
		for (var i = 0; i < total_num; ++i) {
			var datum = sd.circNodes[i];
			calculateArcPositions(datum, 0, delta, i);
		}
	}

	var findActiveParent = function(node) {
		var result = node;
		while (result !== undefined && result !== null) {
			if (result.isActive) {
				return result;
			}
			result = activeDataset.maps.node_map[result.parent];
		}
		return result;
	};

	var findActiveDescends = function(node) {
		var num_active_nodes = sd.circNodes.length;
		var node_map = activeDataset.maps.node_map;
		var results = [];
		for (var i = 0; i < num_active_nodes; ++i) {
			var curr_node = sd.circNodes[i];
			if (curr_node.parent === undefined || curr_node.parent === null) { continue; }
			// Check if the input node is a parent of the current active node
			var parent = node_map[curr_node.parent];
			while (parent !== undefined && parent !== null) {
				if (parent === node) {
					results.push(curr_node);
					break;
				}
				parent = node_map[parent.parent];
			}
		}
		return results;
	};

	var findDescAtDepth = function(node, depth) {
		var result = [node];
		while (result.length > 0 && result[0].depth < depth) {
			var curr_node = result[0];
			var children = curr_node.children;
			var child_num = children.length;
			for (var i = 0; i < child_num; ++i) {
				result.push(activeDataset.maps.node_map[children[i]]);
			}
			result.splice(0, 1);
		}
		return result;
	};
	
	var findAllDesc = function(node) {
		var result = [];
		var children = $.merge([], node.children);
		var node_map = activeDataset.maps.node_map;
		while (children.length > 0) {
			var child_num = children.length;
			for (var i = 0; i < child_num; ++i) {
				var child = node_map[children[i]];
				result.push(child);
				$.merge(children, child.children);
			}
			children.splice(0, child_num);
		}
		return result;
	}

	function initActiveNodes(maps) {
		for (var key in maps.node_map) {
			var curr_node = maps.node_map[key];
			if (curr_node.depth === 1) {
				curr_node.isActive = true;
				sd.circNodes.push(curr_node);
			}
			var num_links = 0;
			num_links += maps.node_in_neighbor_map[key].length;
			num_links += maps.node_out_neighbor_map[key].length;
		
		}
	}

	function initActiveLinks(link_map) {
		for (var key in link_map) {
			var curr_link = link_map[key];
			if (curr_link.source.depth === 1 && curr_link.target.depth === 1) {
				sd.circLinks.push(curr_link);
			}
		}
	}
	
	function initActiveMatrix() {
		var n = sd.circNodes.length;
		sd.matrix = [];
		var key_index_map = {};
		sd.circNodes.forEach(function(node, i) {
			sd.matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0, content: node}; });
			key_index_map[node.key] = i;
		});

		sd.circLinks.forEach(function(link) {
			var src_idx = key_index_map[link.source.key];
			var tgt_idx = key_index_map[link.target.key];
			sd.matrix[src_idx][tgt_idx].z = 1;
			sd.matrix[src_idx][tgt_idx].link = link;
		});
	}


	var calculatePaths = function(num_hop) {
		var maps = activeDataset.maps;
		
		var counter = 0;
		var paths = [];
		var results = [];
		paths[0] = [searchUI.selected_source];
		// Set the min / max depth
		var depth1 = searchUI.selected_source.depth;
		var depth2 = searchUI.selected_target.depth;
		var min_depth = Math.min(depth1, depth2);
		var max_depth = Math.max(depth1, depth2);

		while (paths.length > 0 && paths[0].length <= num_hop + 2) {
			var current_path = paths[0];
			paths.splice(0, 1);
			var anchor_node = current_path[current_path.length - 1];
			if (anchor_node.key === searchUI.selected_target.key) {
				results.push(current_path);
				continue;
			}
			// If already reaches the maximum length, don't continue counting neighbors
			if (current_path.length >= num_hop + 2) { continue; }
			var neighbors = maps.node_out_neighbor_map[anchor_node.key];
			var neighbor_num = neighbors.length;
			for (var i = 0; i < neighbor_num; ++i) {
				var neighbor_id = neighbors[i];
				var neighbor_node = maps.node_map[neighbor_id];
				if (neighbor_node.depth >= min_depth && neighbor_node.depth <= max_depth) {
					paths.push(current_path.concat(neighbor_node));
				}
			}
			counter++;
			if (counter > 5000) { 
				userAction.trackAction(null, 'Warning', 'Path size limit reached', selected_source.name + '-' + selected_target + '-' + max_hop);
				console.log("Reached path limit."); break;
			}
		}
		return results;
	};
	sd.calculatePaths = calculatePaths;

	var populateForceElements = function(paths) {
		var num_path = paths.length;
		sd.forceNodes = [];
		sd.forceLinks = [];
		console.log(paths);
		for (var i = 0; i < num_path; ++i) {
			var path = paths[i];
			var num_link = path.length - 1;
			for (var j = 0; j < num_link; ++j) {
				var current_source = path[j];
				var current_target = path[j+1];
				var key_pair = current_source.key + "-" + current_target.key;
				var link = activeDataset.maps.node_link_map[key_pair];
				if ($.inArray(link, sd.forceLinks) < 0) {
					sd.forceLinks.push(link);
				}
				if ($.inArray(current_source, sd.forceNodes) < 0) {
					sd.forceNodes.push(current_source);
				}
				if ($.inArray(current_target, sd.forceNodes) < 0) {
					sd.forceNodes.push(current_target);
				}
			}
		}
	};
	sd.populateForceElements = populateForceElements;

	/*
	 * This function is called before rendering the canvas to assign colors to the 
	 * top level nodes
	 * Also assigns group
	 * TODO: Assign the groups when formatting the data, and then assign the colors
	 * based on the group IDs
	 */
	sd.assignColors = function(node_map) {
		var num_level1_nodes = 0;
		var queue = [];
		for (var key in node_map) {
			var node = node_map[key];
			if (node.depth === 1) {
				num_level1_nodes += 1;
				node.group = node.key;
				queue.push(node);
			}
		}
		var currentPalette = [];
		for (var i = 0; i < num_level1_nodes; ++i) {
			currentPalette.push(colorPalette[i]);
		}
		var nodesFill = d3.scale.ordinal()
						  .domain(d3.range(num_level1_nodes))
						  .range(currentPalette);
		for (var i = 0; i < num_level1_nodes; ++i) {
			queue[i].color = currentPalette[i];
		}
		while (queue.length > 0) {
			var curr_node = queue[0];
			var children = curr_node.children;
			var child_num = children.length;
			for (var i = 0; i < child_num; ++i) {
				var child = node_map[children[i]];
				child.color = curr_node.color;
				child.group = curr_node.group;
				queue.push(child);
			}
			queue.splice(0, 1);
		}
	};

	var calculateArcPositions = function(datum, start_angle, delta, i) {
		datum.circ.start_angle = start_angle + delta * i;
		datum.circ.end_angle = start_angle + delta * (i+1);
		var angle = delta * (i + 0.5) + start_angle;
		var radius = svgRenderer.inner_radius + (svgRenderer.outer_radius - svgRenderer.inner_radius) / 2;
		datum.circ.x = radius * Math.cos(Math.PI / 2 - angle);
		datum.circ.y = -radius * Math.sin(Math.PI / 2 - angle);
	};

	function stash(d) {
		d.circ.old_start_angle = d.circ.start_angle;
		d.circ.old_end_angle = d.circ.end_angle;
	}
	
	/*
	 * This function gets called when the user clicks on a node. The corresponding
	 * object is passed in as d. The function does three things:
	 * 1) Add the children of d into active_data_nodes and the linkfs associated with 
	 * those children and the other existing nodes into active_data_links
	 * 2) Remove d and the associated links
	 * 3) Update the svg canvas to propagate the change in active_data_nodes and 
	 * active_data_links to the visual elements on the canvas
	 */
	 /*
	  * ! TODO: Need to think how to more efficiently add new links !
	 */
	var expandRegion = function(d, sub, svg) {
		// First check the children. If no children, do nothing and return.
		
		var nodes = sd.circNodes;
		var links = sd.circLinks;
		var maps = activeDataset.maps;
		
		var sub_num = sub.length;
		if (sub_num < 1) {return;}

		// Add the sub-regions of the original region that has been chosen to be expanded
		var start_angle = d.circ.start_angle;
		var end_angle = d.circ.end_angle;
		var delta = (end_angle - start_angle) / sub_num;

		// Record neighbors of the node being removed
		var in_neighbors = [];
		var out_neighbors = [];
		var link_length = links.length;
	
		// Iterate through all the ative links and locate those associated with d
		// Remove the expanded node from the data nodes and the corresponding 
		// links from the data links
		while (link_length--) {
			var curr_link = links[link_length];
			if (curr_link.source === d) {
				out_neighbors.push(curr_link.target);
				links.splice(link_length, 1);
			}
			else if (curr_link.target === d) {
				in_neighbors.push(curr_link.source);
				links.splice(link_length, 1);
			}
		}

		console.log(d);
		console.log(nodes);
		console.log(pos);

		var pos = $.inArray(d, nodes);
		nodes[pos].isActive = false;
	
		var in_neighbor_num = in_neighbors.length;
		var out_neighbor_num = out_neighbors.length;
		var old_num = nodes.length;
		var new_num = old_num + sub_num - 1;
		var new_delta = 2 * Math.PI / new_num;

		for (var i = new_num-1; i > pos; --i) {
			nodes[i] = nodes[i-sub_num+1];
		}

		for (var i = pos; i < pos + sub_num; ++i) {
			var datum = sub[i-pos];
			svgData.calculateArcPositions(datum, start_angle, delta, i-pos);
			datum.color = d.color;
			datum.isActive = true;
			nodes[i] = datum;
			for (var j = 0; j < in_neighbor_num; ++j) {
				var neighbor = in_neighbors[j];
				var key_pair = neighbor.key + "-" + datum.key;
				var link = maps.node_link_map[key_pair];
				if (link !== undefined) {
					links.push(link);
				}
			}
			for (var j = 0; j < out_neighbor_num; ++j) {
				var neighbor = out_neighbors[j];
				var key_pair = datum.key + "-" + neighbor.key;
				var link = maps.node_link_map[key_pair];
				if (link !== undefined) {
					links.push(link);
				}
			}
		}
		// Add new links between new nodes
		for (var i = 0; i < sub_num; ++i) {
			for (var j = i + 1; j < sub_num; ++j) {
				var key_pair = sub[i].key + '-' + sub[j].key;
				var link = maps.node_link_map[key_pair];
				if (link !== undefined) {
					links.push(link);
				}
				key_pair = sub[j].key + '-' + sub[i].key;
				link = maps.node_link_map[key_pair];
				if (link !== undefined) {
					links.push(link);
				}

			}
		}

		svgRenderer.updateCircularLayout(new_num, new_delta);
	};


	var combineRegions = function(new_node, nodes_to_remove) {
		// Iterate through all the active nodes and remove the links associated 
		// with the nodes to be removed
		var nodes = sd.circNodes;
		var links = sd.circLinks;
		
		var numToRemove = nodes_to_remove.length;
		var link_length = links.length;
		while (link_length--) {
			var curr_link = links[link_length];
			// Iterate through all the siblings and remove associated links
			for (var i = 0; i < numToRemove; ++i) {
				var d = nodes_to_remove[i];
				if (curr_link.source === d || curr_link.target === d) {
					links.splice(link_length, 1);
				}
			}
		}
		// Remove the nodes and add the parent node
		var first_pos = $.inArray(nodes_to_remove[0], nodes);
		var remove_first = nodes[first_pos];
		remove_first.isActive = false;
		new_node.circ = remove_first.circ;
		new_node.isActive = true;
		nodes[first_pos] = new_node;
		for (var i = 1; i < numToRemove; ++i) {
			var curr_node = nodes_to_remove[i];
			curr_node.isActive = false;
			var pos = $.inArray(curr_node, nodes);
			nodes.splice(pos, 1);
		}
		// Update the positions of the nodes
		var new_num = nodes.length;
		var new_delta = 2 * Math.PI / new_num;
		// Add in links for the parent
		var new_key = new_node.key;
		for (var i = 0; i < new_num; ++i) {
			var curr_key = nodes[i].key;
			var key_pair = new_key + '-' + curr_key;
			var link = activeDataset.maps.node_link_map[key_pair];
			if (link !== undefined) {
				links.push(link);
			}
			key_pair = curr_key + '-' + new_key;
			link = activeDataset.maps.node_link_map[key_pair];
			if (link !== undefined) {
				links.push(link);
			}
		}
		// Update the layout
		svgRenderer.updateCircularLayout(new_num, new_delta);
	};
	
	sd.displayInvisibleNode = function(input_node) {
		if (!input_node.isActive) {
			var parent = sd.findActiveParent(input_node);
			// In this case, the input is on a level higher than the visible nodes
			if (parent === undefined) {
				var activeDescs = sd.findActiveDescends(input_node);
				sd.combineRegions(input_node, activeDescs);
			}
			else {
				var siblings = sd.findDescAtDepth(parent, input_node.depth);
				sd.expandRegion(parent, siblings, svgRenderer.svg_circular);
			}
		}	
	};
	
	sd.calculateArcPositions = calculateArcPositions;
	sd.expandRegion = expandRegion;
	sd.combineRegions = combineRegions;
	sd.findActiveDescends = findActiveDescends;
	sd.findActiveParent = findActiveParent;
	sd.findDescAtDepth = findDescAtDepth;
	sd.findAllDesc = findAllDesc;
	
}(window.svgData = window.svgData || {}, jQuery));

(function(sr, $, undefined) {

	// SVG display parameters
	var vis_width = 800;
	var vis_height = 600;
	var inner_radius = Math.min(vis_width, vis_height) * 0.32;
	var outer_radius = inner_radius * 1.2;
	sr.inner_radius = inner_radius;
	sr.outer_radius = outer_radius;

	var svg_circular = null;
	var svg_force = null;
	var svg_matrix = null;
	var arcs = null;
	var curves = null;
	var links = null;
	var force = null;
	var prevClicked_linkKey = -1;
	sr.prevClicked_linkKey = prevClicked_linkKey; 
	
	/* Prepare the canvas before the data arrives */
	sr.prepareCanvas = function() {
		arcs = d3.svg.arc()
				 .innerRadius(inner_radius)
				 .outerRadius(outer_radius)
				 .startAngle(function(d) {return d.circ.start_angle;})
				 .endAngle(function(d) {return d.circ.end_angle;});

		curves = d3.svg.line()
				   .x(function(d) {return d.x;})
				   .y(function(d) {return d.y;})
				   .interpolate("basis");

		svg_circular = d3.select("#canvas-circular")
				.append("svg")
				.attr("width", vis_width)
				.attr("height", vis_height)
				.append('g')
				.attr("transform", "translate(" + (vis_width / 2) + "," + (vis_height / 2) + ")")
				.append('g');

		sr.svg_circular = svg_circular;	

		svg_force = d3.select("#canvas-force")
				.append("svg")
				.attr("width", vis_width)
				.attr("height", vis_height)
				.append('g');

		svg_matrix = d3.select("#canvas-matrix")
				.append("svg")
				.attr("width", vis_width)
				.attr("height", vis_height)
				.append('g');
	};

	sr.renderData = function(datasetKey) {
		svgData.init(datasetKey);
		clearCanvases();
		enterCircularLinks();
		enterCircularNodes();
		updateCircularTexts();
		enterMatrixElements();

		for (var i = 0; i < svgData.circNodes.length; ++i) {
			var node = svgData.circNodes[i];
			$('#circ-node-' + node.key).qtip({
				style: {
					classes: 'qtip-bootstrap'
				},
				position: {
					my: 'bottom right',
					at: 'top left',
					target: $('#circ-mark-' + node.key),
//					adjust: { x: -100, y: -50 },
	//				viewport: $(window)
				},
			});
		}
	}

	function clearCanvases() {
		svg_circular.selectAll('.circular').remove();
		svg_force.selectAll('.force').remove();
	}

	var updateCircularLayout = function(new_num, new_delta) {
		// Remove the nodes and links from canvas
		exitCircularNodes();
		exitCircularLinks();

		// Add the new links and new nodes resulted from the split
		enterCircularLinks();    
		enterCircularNodes();


		for (var i = 0; i < new_num; ++i) {
			var datum = svgData.circNodes[i];
			svgData.calculateArcPositions(datum, 0, new_delta, i);
		}

		updateCircularLinks();
		updateCircularNodes();
		updateCircularTexts();

		for (var i = 0; i < svgData.circNodes.length; ++i) {
			var node = svgData.circNodes[i];
			$('#circ-node-' + node.key).qtip({
				style: {
					classes: 'qtip-bootstrap'
				},
				position: {
					my: 'bottom right',
					at: 'top left',
					target: $('#circ-mark-' + node.key),
//					adjust: { x: -100, y: -50 },
	//				viewport: $(window)
				},
			});
		}
	};
	
	sr.updateCircularLayout = updateCircularLayout;

	var dimNonSearchResults = function() {
		svg_circular.selectAll('.circular.node')
			.classed('nofocus', function(d) {
				return ($.inArray(d, svgData.forceNodes) < 0);
			});
		svg_circular.selectAll('.circular.link')
			.classed('hidden', function(d) {
				return ($.inArray(d, svgData.forceLinks) < 0);
			});
		for (var i = 0; i < svgData.forceNodes.length; ++i) {
			$('#circ-node-' + svgData.forceNodes[i].key).qtip('show');
		}
/*		svg_circular.selectAll('.circular.text')
			.classed('visible', function(d) {
				return ($.inArray(d, svgData.forceNodes) >= 0);
			});   */ 
	};
	sr.dimNonSearchResults = dimNonSearchResults;


	function nodeClick(d) {
		var maps = activeDataset.maps;
	
		if (d3.event.shiftKey) {
			
			userAction.trackAction('Combine node in circular view', 'Viz', 'Combine circular node', d.name, 'Combine circular node', d.name);
			
			if (d.parent === undefined || d.parent === null) { return; } // Ignore top level nodes
			var parent = maps.node_map[d.parent]; 
			var nodes_to_remove = svgData.findActiveDescends(parent);
			svgData.combineRegions(parent, nodes_to_remove);
			if(ui.firstTime === true && ui.step === 2){
				ui.currStep = "step2";
				ui.showMessage();
				
			}
		}
		else if (d3.event.altKey) {
			// Fix on the clicked node
			if (state.currMode === customEnum.mode.exploration) {
				state.currMode = customEnum.mode.fixation;
				selectStructure(d.name, false);
			}
			else if (state.currMode === customEnum.mode.fixation) {
				state.currMode = customEnum.mode.exploration;
				selectStructure(d.name, true);
			}
			if(ui.firstTime === true && ui.step === 3){
				ui.currStep = "step3";
				ui.showMessage();
			}
		}
		else if (d3.event.metaKey) {
			// remove the selected node and associated links from svgData.circNodes/circLinks
			var nodes = svgData.circNodes;
			var links = svgData.circLinks;
			nodes.splice($.inArray(d, nodes), 1);
			var link_length = links.length;
			while (link_length--) {
				var curr_link = links[link_length];
				if (curr_link.source === d || curr_link.target === d) {
					links.splice(link_length, 1);
				}
			}
			var new_num = nodes.length;
			updateCircularLayout(new_num, 2 * Math.PI / new_num);
			// add the selected node to black list
			state.ignored_nodes.push(d);
			d.isIgnored = true;
		
			// Todo: have a list that displays the removed nodes, so that the user can 
			// add them back when needed
			if(ui.firstTime === true && ui.step === 4){
				ui.currStep = "step4";
				ui.showMessage();
			}
		}
		else {
			userAction.trackAction('Expand node in circular view', 'Viz', 'Expand circular node', d.name, 'Expand circular node', d.name);       
			var children = [];
			var ids = d.children;
			var length = ids.length;
			for (var i = 0; i < length; ++i) {
				children.push(maps.node_map[ids[i]]);
			}
			svgData.expandRegion(d, children, svg_circular);
			if(ui.firstTime === true && ui.step === 1){
				
				ui.currStep = "step1";
				ui.showMessage();
				
			}
		}
		
	}
	
	// When mousing over, highlight itself and the neighbors
	function nodeMouseOver(node, svg) {
		console.log(state.currMode);
		if (state.currMode === customEnum.mode.search || state.currMode === customEnum.mode.fixation) { return; }
  		var maps = activeDataset.maps;	
  		sr.highlightNode(node, svg, maps, false);	
	}
	
	

	function nodeMouseOut(node, svg) {
		if (state.currMode === customEnum.mode.search || state.currMode === customEnum.mode.fixation) { return; }
		sr.highlightNode(node, svg, null, true);
		updateCircularTexts();
	}

	function linkClick(link, svg) {
		userAction.trackAction('Click link in circular view', 'Viz', 'Click circular link', link.source.name + '-' + link.target.name, 'Click circular link', link.source.name + '-' + link.target.name);
		
		chosenLink.updateChosenLink(link);
		
		if(prevClicked_linkKey !== link.key){
			svg.selectAll('.circular.link')
				.classed('clicked', function(d){
					return d.key === link.key;
				});
		}
		else 
		{
			linkMouseOut(link, svg);
			svg.selectAll('.circular.link')
				.classed('unclicked', function(d){
					return d.key === link.key;
				});
		}
		prevClicked_linkKey = link.key;
	}

	function linkMouseOver(link, svg) {
		if (state.currMode === customEnum.mode.search || state.currMode === customEnum.mode.fixation) { return; }
		svg.selectAll('.circular.node')
			.classed('nofocus', function(d) {
				return d.key !== link.source.key && d.key !== link.target.key;
			});
		svg.selectAll('.circular.link')
			.classed('hidden', function(d) {
				return d.key !== link.key;
			}); 	
		$('#circ-node-' + link.source.key).qtip('show');
		$('#circ-node-' + link.target.key).qtip('show');
	}

	function linkMouseOut(link, svg) {
		
		if (state.currMode === customEnum.mode.search || state.currMode === customEnum.mode.fixation) { return; }
		svg.selectAll('.circular.node').classed('nofocus', false);
		svg.selectAll('.circular.link').classed('hidden', false);
		$('#circ-node-' + link.source.key).qtip('hide');
		$('#circ-node-' + link.target.key).qtip('hide');
	}

	function forceNodeClick(d) {
		userAction.trackAction('Click node in nodelink view', 'Viz', 'Click force node', d.name, 'Click force node', d.name);
	}

	function forceNodeMouseOver(node) {
		if (state.currMode === customEnum.mode.search) { return; }
		svg_force.selectAll('.nodelink.node')
			.classed('nofocus', function(d) {
				var dKey = d.key;
				var nodeKey = node.key;
				var inNeighbors = active_node_in_neighbor_map[nodeKey];
				var outNeighbors = active_node_out_neighbor_map[nodeKey];
				return dKey !== nodeKey && ($.inArray(dKey, inNeighbors) < 0) &&
					($.inArray(dKey, outNeighbors) < 0);
			});
		svg_force.selectAll('.nodelink.link')
			.classed('nofocus', function(d) {
				return d.source.key !== node.key && d.target.key !== node.key; 
			});
		svg_force.selectAll('.nodelink.text')
			.classed('visible', function(d) {
				var dKey = d.key;
				var nodeKey = node.key;
				var inNeighbors = active_node_in_neighbor_map[nodeKey];
				var outNeighbors = active_node_out_neighbor_map[nodeKey];
				return dKey === nodeKey || ($.inArray(dKey, inNeighbors) >= 0) ||
					($.inArray(dKey, outNeighbors) >= 0);
			});
	}

	function forceNodeMouseOut(d) {
		if (state.currMode === customEnum.mode.search) { return; }
		svg_force.selectAll('.circular.node').classed('nofocus', false);
		svg_force.selectAll('.circular.link').classed('nofocus', false);
		svg_force.selectAll('.nodelink.text').classed('visible', true);
	}

	function forceLinkClick(link) {		
//		userAction.trackAction('Click link in nodelink view', 'Viz', 'Click force link', d.source.name + '-' + d.target.name, 'Click force link',      d.source.name + '-' + d.target.name );   
		
		chosenLink.updateChosenLink(link);	
	}

	function forceLinkMouseOver(link) {
		svg_force.selectAll('.nodelink.node')
			.classed('nofocus', function(d) {
				return d.key !== link.source.key && d.key !== link.target.key;
			});
		svg_force.selectAll('.nodelink.link')
			.classed('nofocus', function(d) {
				return d.key !== link.key;
			});
		svg_force.selectAll('.nodelink.text')
			.classed('visible', function(d) {
				return d.key === link.source.key || d.key === link.target.key;
			});    
	}

	function forceLinkMouseOut(d) {
		svg_force.selectAll('.nodelink.node').classed('nofocus', false);
		svg_force.selectAll('.nodelink.link').classed('nofocus', false);
		svg_force.selectAll('.nodelink.text').classed('visible', true);
	}

	function enterCircularNodes() {
		svg_circular.selectAll(".circular.node")
			.data(svgData.circNodes, function(d) {return d.key;})
			.enter().append("svg:path")
			.style("fill", function(d) {return d.color;})
//			.style("stroke", 'gray')
			.attr('title', function(d) { return d.name; })
			.attr("d", arcs)
			.attr("class", "circular node")
			.attr("id", function(d) { return "circ-node-" + d.key; })
			.on("click", nodeClick)
			.on('mouseover', function(d) { nodeMouseOver(d, svg_circular); })
			.on('mouseout', function(d) { nodeMouseOut(d, svg_circular); });

		svg_circular.selectAll('.circular.mark')
			.data(svgData.circNodes, function(d) {return d.key;})
			.enter().append('circle')
			.attr('id', function(d) { return 'circ-mark-' + d.key; })
			.attr('class', 'circular mark')
			.attr('cx', function(d) { return d.circ.x; })
			.attr('cy', function(d) { return d.circ.y; })
			.attr('r', 1)
			.attr('fill', 'none')
			.attr('stroke', 'none');
	}
	
	function appendCell(row) {
		var mat_width = 600;
		var mat_height = 600;
		
		var domainFiller = [];
		for (var i = 0; i < svgData.matrix.length; ++i) {
			domainFiller.push(i);
		}
		
		var x = d3.scale.ordinal().rangeBands([0, mat_width]).domain(domainFiller);
		
		var valueArray = [];
		var countArray = [];

		var cell = d3.select(this).selectAll(".cell")
			.data(row.filter(function(d) { return d.z; }))
			.enter().append('g')
			.attr('width', x.rangeBand())
			.attr('height', x.rangeBand())
			.attr('transform', function(d) {
				return 'translate(' + x(d.x) + ',0)'
			});
			
		cell.append("rect")
			.attr("class", "cell")
			.style('fill', function(d) {
				var link = d.link;
				link.attrArray = [];
				for (var key in link.attrs) {
					var valueCounts = link.attrs[key];
					for (var value in valueCounts) {
						var count = valueCounts[value];
						link.attrArray.push({value: value, count: count});
						countArray.push(count);
						valueArray.push(value);
					}
				}	
				return 'white';
			})
			.attr("width", x.rangeBand())
			.attr("height", x.rangeBand());


		var minValue = Math.min.apply(Math, countArray);
		var maxValue = Math.max.apply(Math, countArray);
		var scale = d3.scale.log()
						.domain([minValue + 1, maxValue])
						.range([0, 80]);
						

		var colorPalette = d3.scale.category20().domain(valueArray);
			
		var barGroups = cell.append('g')
			.attr('transform', 'translate(10, 15)')
			.selectAll('.bar')
			.data(function(d) { return d.link.attrArray; })
			.enter()
			.append('svg:g')
			.attr('height', 16)
			.attr('width', 90)
			.attr('transform', function(d, i) {
				return 'translate(0, ' + i * 16 + ')';
			});	

		barGroups.append('rect')
			.attr('height', 14)
			.attr('width', function(d) {
				return scale(d.count + 1);
			})
			.attr('x', 0)
			.attr('fill-opacity', 0.8)
			.attr('fill', function(d) { 
				return colorPalette(d.value); 
			});			
			
														
/*		barGroups.append('text')
			.text(function(d) {
				return d.value.substring(0,1);
			})
			.attr("transform", function(d, i) {
				return 'translate(0,12)';
			}); */


    }
	
	function enterMatrixElements() {

		var mat_width = 600;
		var mat_height = 600;
		
		var domainFiller = [];
		for (var i = 0; i < svgData.matrix.length; ++i) {
			domainFiller.push(i);
		}
		
		var x = d3.scale.ordinal().rangeBands([0, mat_width]).domain(domainFiller);

		var main = svg_matrix.append('g')
			.attr('transform', 'translate(100, 0)');
		
		main.append("rect")
			.attr("width", mat_width)
			.attr("height", mat_height)
			.style('fill', 'rgba(0,0,0,0.02)')
			.style('stroke', 'white');
			
		var row = main.selectAll(".row")
			.data(svgData.matrix)
			.enter().append("g")
			.attr("class", "row")
			.attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
			.each(appendCell);

		row.append("line")
			.attr("x1", 0)
			.attr("x2", mat_width)
			.attr('class', 'grid');

		row.append("rect")
			.attr('width', 100)
			.attr('height', x.rangeBand() / 2)
			.attr("x", -100)
			.attr("y", 30)
			.attr('fill', function(d, i) {
				console.log(d);
				return d[i].content.color;
			});
			
		row.append("text")
			.attr("x", -6)
			.attr("y", x.rangeBand() / 2)
			.attr("dy", ".32em")
			.attr("text-anchor", "end")
			.text(function(d, i) {
				var name = d[i].content.name;
				if (name === 'Midbrain-Hindbrain') {
					name = 'Mid-Hindbrain';
				}
				return name; 
			});

		var column = main.selectAll(".column")
			.data(svgData.matrix)
			.enter().append("g")
			.attr("class", "column")
			.attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

		column.append("line")
			.attr("x1", -mat_width)
			.attr('class', 'grid');

/*		column.append("text")
			.attr("x", 6)
			.attr("y", x.rangeBand() / 2)
			.attr("dy", ".32em")
			.attr("text-anchor", "start")
			.attr("transform", "translate(50, 0) rotate(90)")
			.text(function(d, i) { return d[i].content.name; }); */

	}

	function enterCircularLinks() {
		svg_circular.selectAll(".circular.link")
			.data(svgData.circLinks, function(d) {return d.key;})
			.enter().append("svg:path")
			.attr("d", function(d) {
					var coors = [{x: d.source.circ.x, y:d.source.circ.y}, 
								 {x: 0, y: 0},
								 {x: d.target.circ.x, y:d.target.circ.y}];
					return curves(coors);
				})
			.attr("class", "circular link")
			.attr('stroke-width', function(d) { return Math.min(10, Math.max(1,  Math.ceil(d.base_children.length / 100))) + 'px'; })
	/*        .attr('opacity', function(d) {
				if (d.strength === "strong") {
					return 0.8;
				}
				else if (d.strength === "moderate") {
					return 0.4;
				}
				else {
					return 0.2;
				} 
			}) */
			.attr("id", function(d) { return "circ-link-" + d.key; })
			.attr('title', function(d) {
				$(this).data('attrStats', d.attrs);
				return '<p>Encapsulated connections: ' + d.base_children.length + '</p><p>Strength: ' + 
							'</p><svg id="attrStats-' + $(this).attr('id') + '"></svg>';
			})
			.on("mouseover", function(d) { linkMouseOver(d, svg_circular); })
			.on("mouseout", function(d) { linkMouseOut(d, svg_circular); })
			.on("click", function(d){linkClick(d, svg_circular); });

		$('.circular.link').qtip({
			style: {
				classes: 'qtip-bootstrap'
			},
			position: {
				my: 'top left',
				at: 'bottom right',
				target: $('.circular.link'),
//				adjust: { x: 5, y: 5 },
//				viewport: $(window)
			},
			events: {
				show: function(event, api) {
					var id = api.elements.target.attr('id');
					var attrData = api.elements.target.data('attrStats');
					var svg = d3.select('#attrStats-' + id);
					if (svg.attr('isSet')) { return; }
					svg.attr('isSet', true)
						.attr('width', 200)
						.attr('height', 100);
					for (var key in attrData) {
						var attrDatum = attrData[key];
						var attrArray = [];
						var countArray = [];
						var valueArray = [];
						for (var attrValue in attrDatum) {
							var attrCount = attrDatum[attrValue];
							attrArray.push({
								attrValue: attrValue,
								attrCount: attrCount
							});
							valueArray.push(attrValue);
							countArray.push(attrCount);
						} 
						var minValue = Math.min.apply(Math, countArray);
						var maxValue = Math.max.apply(Math, countArray);
						var scale = d3.scale.linear()
										.domain([minValue, maxValue])
										.range([0, 80]);
										
						var barGroups = svg.selectAll('g.bar')
							.data(attrArray)
							.enter()
							.append('svg:g')
							.attr('height', 15)
							.attr('width', 100)
							.attr('transform', function(d, i) {
								return 'translate(0, ' + i * 15 + ')';
							});		
							
						var colorPalette = d3.scale.category20().domain(valueArray);

						barGroups.append('rect')
							.attr('height', 12)
							.attr('width', function(d) {
								return scale(d.attrCount);
							})
							.attr('x', 0)
							.attr('fill-opacity', 0.8)
							.attr('fill', function(d) { return colorPalette(d.attrValue); });
														
						barGroups.append('text')
							.text(function(d) {
								return d.attrValue + ': ' + d.attrCount;
							})
							.attr("transform", function(d, i) {
								return 'translate(' + (scale(d.attrCount) + 5) + ',12)';
							});
					}
				},
				hide: function(event, api) {
					$('#attrStats').remove();					
				}
			}			
		});
	}

	function exitCircularNodes() {
		var nodes = svgData.circNodes;
		
		svg_circular.selectAll('.circular.node')
		   .data(nodes, function(d) {return d.key;})
		   .exit().remove();

		svg_circular.selectAll('.circular.mark')
		   .data(nodes, function(d) {return d.key;})
		   .exit().remove();

/*		svg_circular.selectAll('.circular.text')
		   .data(nodes, function(d) {return d.key;})
		   .exit().remove(); */
	}

	function exitCircularLinks() {
		svg_circular.selectAll('.circular.link')
		   .data(svgData.circLinks, function(d) {return d.key;})
		   .exit().remove();
	}

	function updateCircularNodes() {
	
		console.log('updateCircularNodes');
	
		var nodes = svgData.circNodes;
		svg_circular.selectAll(".circular.node")
			.data(nodes, function(d) {return d.key;})
			.transition()
			.duration(1000)
			.attr("d", arcs);
	//        .attrTween("d", arcTween);
	
		svg_circular.selectAll('.circular.mark')
			.data(nodes, function(d) {return d.key;})
			.transition()
			.duration(1000)
			.attr('cx', function(d) { return d.circ.x; })
			.attr('cy', function(d) { return d.circ.y; });

/*		svg_circular.selectAll(".circular.text")
			.data(nodes, function(d) {return d.key;})
			.transition()
			.duration(1000)
			.attr('x', function(d) {return d.circ.x;})
			.attr('y', function(d) {return d.circ.y;}); */
	}

	function updateCircularLinks() {
		var links = svg_circular.selectAll(".circular.link")
			.data(svgData.circLinks, function(d) {return d.key;});
		
		
		links.transition()
			.duration(1000)
			.attr("d", function(d) {
					var coors = [{x: d.source.circ.x, y:d.source.circ.y}, 
								 {x: 0, y: 0},
								 {x: d.target.circ.x, y:d.target.circ.y}];
					return curves(coors);
				});

	}

	// Update the visibility of the texts, depending on the current number of 
	// active arcs
	function updateCircularTexts() {
		svg_circular.selectAll(".circular.text")
			.classed('visible', function(d) {
				var circ = d.circ;
				return (circ.end_angle - circ.start_angle) > Math.PI / 12;
			});    
	}

	var updateForceLayout = function() {
		//this should be incorporated in the node data
		var num_groups = 0,
			group_count = {};
		svgData.forceNodes.forEach(function(d) {
			if (!group_count[d.group]) {
				++num_groups;
				group_count[d.group] = [num_groups, 1];
			} else {
				//increase group size
				group_count[d.group][1] += 1;
			}
		});

		// Set the selected source and selected target to have fixed positions, and 
		// set their locations
		searchUI.selected_source.fixed = true;
		searchUI.selected_target.fixed = true;
		searchUI.selected_source.x = 200;
		searchUI.selected_source.y = 400;
		searchUI.selected_target.x = 600;
		searchUI.selected_target.y = 400; 

		force = d3.layout.force()
				  .nodes(svgData.forceNodes)
				  .links(svgData.forceLinks)
				  //.links([])
				  .size([vis_width, vis_height])
				  //still needs work - link distance determined by group size and if
				  //connection are internal
				  .linkDistance(function(l) {
					  var s = group_count[l.source.group], t = group_count[l.target.group];
					  return 10 * Math.max(l.source.group != l.target.group ? s[1] : 2/s[1],
										   l.source.group != l.target.group ? t[1] : 2/t[1]) + 20;
				  })
				  .linkStrength(1)
	 //             .gravity(0)
				  .charge(-6000)
				  .friction(0.5)
				  .start();

		// Clear up visual elements from previous search
		svg_force.selectAll('.link').remove();
		svg_force.selectAll(".node").remove();
		svg_force.selectAll(".text").remove();
	
		var link = svg_force.selectAll(".nodelink.link")    
		   .data(svgData.forceLinks, function(d) { return d.key; })
		   .enter().append("svg:line")
		   .attr("class", "nodelink link")
		   .style("stroke-width", 3)
		   .on('click', forceLinkClick)
		   .on('mouseover', forceLinkMouseOver)
		   .on('mouseout', forceLinkMouseOut);


		var node = svg_force.selectAll(".nodelink.node")
		   .data(svgData.forceNodes, function(d) { return d.key; })
		   .enter().append("svg:circle")
		   .attr("class", "nodelink node")
		   .attr("cx", function(d) { return d.x; })
		   .attr("cy", function(d) { return d.y; })
		   .attr("r", function(d) { return (d === searchUI.selected_source || d === searchUI.selected_target) ? 20 : 10; })
		   .style("fill", function(d) {return d.color;})
		   .on('click', forceNodeClick)
		   .on('mouseover', forceNodeMouseOver)
		   .on('mouseout', forceNodeMouseOut)
		   .call(force.drag);

		var text = svg_force.append('svg:g')
			.selectAll('g')
			.data(force.nodes())
			.enter().append('g')
			.append("svg:text")
			.attr("x", 8)
			.attr("y", ".31em")
			.attr('class', 'nodelink text visible')
			.text(function(d) { return d.name; });
	
	/*    svg_force.selectAll(".nodelink.text")
		   .data(active_data_nodes, function(d) {return d.key;})
		   .enter().append("text")
		   .attr('x', function(d) {return d.circ.x;})
		   .attr('y', function(d) {return d.circ.y;})
		   .attr('class', 'nodelink text visible')
		   .text(function(d) {return d.name}); 
	*/   

	  force.on("tick", function(e) {
		  // To bundle nodes without links (useful)
		  /*
		  var k = 8 * e.alpha;

		  active_data_nodes_force.forEach(function(o) {
			  o.x += group_count[o.group][0] * k;
			  o.y += group_count[o.group][0] * -k;
		  });
		  */

		 link.attr("x1", function(d) { return d.source.x; })
			 .attr("y1", function(d) { return d.source.y; })
			 .attr("x2", function(d) { return d.target.x; })
			 .attr("y2", function(d) { return d.target.y; });

		  node.attr("cx", function(d) { return d.x; })
			  .attr("cy", function(d) { return d.y; });

		  text.attr("transform", function(d) {
			  return "translate(" + d.x + "," + d.y + ")";
		  });
	  });
	};
	
	sr.updateForceLayout = updateForceLayout;

	sr.highlightNode = function(node, svg, maps, isCancel) {
		if (isCancel) {
			svg.selectAll('.circular.node').classed('nofocus', false);
			svg.selectAll('.circular.node').classed('highlight', false);
			svg.selectAll('.circular.link').classed('hidden', false);
			svg.selectAll('.circular.link').classed('inLink', false);
			svg.selectAll('.circular.link').classed('outLink', false);
			svg.selectAll('.circular.link').classed('biLink', false);
			$('.circular.node').qtip('hide');
			return;
		}
		svg.selectAll('.circular.link')
			.classed('hidden', function(d) {
				return d.source.key !== node.key && d.target.key !== node.key; 
			});
		svg.selectAll('.circular.link')
			.classed('outLink', function(d) {
				var reverted_link = maps.node_link_map[d.target.key + '-' + d.source.key];
				return d.source.key === node.key && reverted_link === undefined;
			});
		svg.selectAll('.circular.link')
			.classed('inLink', function(d) {
				var reverted_link = maps.node_link_map[d.target.key + '-' + d.source.key];
				return d.target.key === node.key && reverted_link === undefined;
			});
		svg.selectAll('.circular.link')
			.classed('biLink', function(d) {
				var reverted_link = maps.node_link_map[d.target.key + '-' + d.source.key];
				return reverted_link !== undefined;
			});
		svg.selectAll('.circular.node')
			.classed('nofocus', function(d) {
				var dKey = d.key;
				var nodeKey = node.key;
				var inNeighbors = maps.node_in_neighbor_map[nodeKey];
				var outNeighbors = maps.node_out_neighbor_map[nodeKey];
				return dKey !== nodeKey && ($.inArray(dKey, inNeighbors) < 0) &&
					($.inArray(dKey, outNeighbors) < 0);
			});   	
		svg.selectAll('.circular.node')
			.classed('highlight', function(d) {
				return d.key === node.key;
			});  
/*		svg.selectAll('.circular.text')
			.classed('visible', function(d) {
				var dKey = d.key;
				var nodeKey = node.key;
				var inNeighbors = maps.node_in_neighbor_map[nodeKey];
				var outNeighbors = maps.node_out_neighbor_map[nodeKey];
				return dKey === nodeKey || ($.inArray(dKey, inNeighbors) >= 0) ||
					($.inArray(dKey, outNeighbors) >= 0);
			});		*/
		for (var i = 0; i < svgData.circNodes.length; ++i) {
			var n = svgData.circNodes[i];
			var nodeKey = node.key;
			var inNeighbors = maps.node_in_neighbor_map[nodeKey];
			var outNeighbors = maps.node_out_neighbor_map[nodeKey];
			if (n.key === nodeKey || ($.inArray(n.key, inNeighbors) >= 0) ||
					($.inArray(n.key, outNeighbors) >= 0)) {
				isCancel ? $('#circ-node-' + n.key).qtip('hide') : $('#circ-node-' + n.key).qtip('show');
			}
		}
	}

	function expandNode() {

	}

	function expandLink() {

	}

	function arcTween(a) {
	  var i = d3.interpolate({start_angle: a.circ.old_start_angle, end_angle: a.circ.old_end_angle}, a);
	  return function(t) {
		var b = i(t);
		console.log(b);
		a.circ.old_start_angle = b.start_angle;
		a.circ.old_end_angle = b.end_angle;
		b.circ.start_angle = b.start_angle;
		b.circ.end_angle = b.end_angle;
		return arcs(b);
	  };
	}

}(window.svgRenderer = window.svgRenderer || {}, jQuery));
