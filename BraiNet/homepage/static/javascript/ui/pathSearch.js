// This module 
// TODO: change this module to require setting.js and amplifyJS.js using requireJS

ui.pathSearch = (function($, undefined) {

	var doms = {
		sourceList: $('#path-search #source-list'),
		targetList: $('#path-search #target-list'),
		maxHop: $('#path-search #max-hop'),
		maxHopValue: $('#path-search #max-hop-value'),
		searchButton: $('#path-search #search-button'),
		clearButton: $('#path-search #clear-button')
	};
	
	var setting = {
		maxHop: 3
		// TODO: add max hop slider
	};
	
	var state = {
		source: null,
		target: null,
		clearing: null,
		cleared: null
	};
	
	var init = function() {
		doms.sourceList.change(selectSource);
		doms.targetList.change(selectTarget);
		doms.maxHop.change(setMaxHop);
		doms.searchButton.click(searchButtonClick);
		doms.clearButton.click(clearButtonClick);
		state.cleared = false;
		state.clearing = false;
	};
	
	var selectSource = function() {
		var inputKey = this.value;
		processSelection(inputKey, 'source');
		util.action.add('select source in path search', {source: svg.model.maps().keyToNode[inputKey].fields.name);
	};
	
	var selectTarget = function() {
		var inputKey = this.value;
		processSelection(inputKey, 'target');
		util.action.add('select target in path search', {target: svg.model.maps().keyToNode[inputKey].fields.name});
	};
	
	var setMaxHop = function() {
		setting.maxHop = this.value;
		dom.maxHopValue.val(this.value);
		util.action.add('set max hop', {maxHop: this.value});
	};
	
	var processSelection = function(inputKey, id) {
		// If there exists an old selected_source, reset its status
		if (state[id] !== null) {
			cancelSelection(id, state[id]);
		}	
		if (inputKey === '') { 
			state[id] === null;
			svg.circular.setMode('exploration');
			return; 
		}
		var inputNode = svg.model.maps().keyToNode[inputKey];
		setSelection(id, inputNode);
	};
	
	var cancelSelection = function(id, node) {
		state[id].fixed = false;
		svg.circular.highlightNode(state[id], true);
		svg.highlightInput(id, node, true);
	};
	
	var setSelection = function(id, node) {
		state[id] = node;
		if (state.source !== null && state.target !== null) {
			svg.showRegionMulti([state.source.pk, state.target.pk]);
		}
		else {
			svg.showRegion(node.pk);
		}
		svg.highlightInput(id, node, false);
	};
	
	var searchButtonClick = function() {
		var paths = svg.model.calculatePaths(state.source, state.target, setting.maxHop);
		svg.displaySearchResult(state.source, state.target);
		util.action.add('perform path search', {
			source: state.source.fields.name,
			target: state.target.fields.name
		});
	};
	
	var clearButtonClick = function() {
		state.source = null;
		state.target = null;
		ui.loadingModal.message('Clearing search result...');
		ui.loadingModal.show();	
		state.clearing = true;
		setTimeout(function() {
			svg.clearSearchResult();
		}, 500);
		util.action.add('clear path search result', {
			source: state.source.fields.name,
			target: state.target.fields.name
		});
	};
	
	var resetComplete = function() {
		if (!state.clearing) { return; }
		ui.loadingModal.hide();
		state.clearing = false;
	};
	
	var render = function(regionList) {
		doms.sourceList.find('option').remove();
		doms.targetList.find('option').remove();
		for (i = 0; i < regionList.length; ++i) {
			var r = regionList[i];
			doms.sourceList.append(new Option(r.fields.name, r.pk));
			doms.targetList.append(new Option(r.fields.name, r.pk));
		}
		$('.chzn-select').chosen({allow_single_deselect: true});
		doms.sourceList.trigger('liszt:updated');	
		doms.targetList.trigger('liszt:updated');	
	};
	
	var reset = function() {
		state.source = null;
		state.target = null;
	};

	return {
		init: init,
		render: render,
		reset: reset,
		resetComplete: resetComplete
	};

}(jQuery));
