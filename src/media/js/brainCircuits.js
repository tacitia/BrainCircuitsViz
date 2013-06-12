var node_link_map,link_map,paper_map,node_map,node_in_neighbor_map,node_out_neighbor_map,link_rating_map,record_rating_map,brodmann_map,dataset_list,uid,user_datasets={},is_preloaded_data=!0,selected_source,selected_target,active_data_nodes,active_data_links,active_data_nodes_force,active_data_links_force,active_node_map,active_node_link_map,active_node_in_neighbor_map,active_node_out_neighbor_map,active_link_map,ignored_nodes=[],svg_circular,svg_force,arcs,curves,links,force,vis_width=800,vis_height=
600,inner_radius=0.32*Math.min(vis_width,vis_height),outer_radius=1.2*inner_radius,directionType={"in":1,out:2,bi:3},mode={exploration:1,search:2,fixation:3},colorPalette=[d3.rgb(141,211,199).toString(),d3.rgb(255,255,179).toString(),d3.rgb(190,186,218).toString(),d3.rgb(251,128,114).toString(),d3.rgb(128,177,211).toString(),d3.rgb(253,180,98).toString(),d3.rgb(179,222,105).toString(),d3.rgb(252,205,229).toString(),d3.rgb(217,217,217).toString(),d3.rgb(188,128,189).toString(),d3.rgb(204,235,197).toString(),
d3.rgb(255,237,111).toString()],mutex=3,enable_piwik=!1,enable_owa=!1,enable_tracking=!0,current_mode=mode.exploration,max_hop=1,actionData=[],generalData=[],startTime=null,endTime=null,sessionStartTime,sessionEndTime,currentActionData={timeElapsed:-1,mouseTrace:"",actionBasic:"",actionDetail:"",time:-1};var pre_nodes,pre_links;d3.json("media/data/test_node.json",function(a){pre_nodes=a;mutex-=1});d3.json("media/data/test_paper.json",function(a){paper_map={};for(var b=a.length,c=0;c<b;++c){var d=a[c];paper_map[d.key]=d}mutex-=1});d3.json("media/data/test_link.json",function(a){pre_links=a;mutex-=1});database.populateUserId();database.getBrodmannAreas();waitForDataLoading();d3.select("#bt-search").on("click",searchButtonClick);d3.select("#bt-clear").on("click",clearButtonClick);
d3.select("#bt-createDatasets").on("click",createDatasetButtonClick);d3.select("#bt-manageDatasets").on("click",manageDatasetButtonClick);d3.select("#bt-cloneDatasets").on("click",cloneDatasetButtonClick);d3.select("#bt-applyDataset").on("click",applyDatasetButtonClick);d3.select("#maxHop").on("change",setMaxHop);$("#sourceSelect").change(sourceSearchInput);$("#targetSelect").change(targetSearchInput);$("#dataSelect").change(datasetSelect);$(".map").maphilight();window.onbeforeunload=saveSessionData;
window.onload=startSession;
function renderCanvas(){assignColors(active_node_map);initActiveNodes(active_node_map);computeCircularNodesParameters(active_data_nodes);initActiveLinks(active_link_map);arcs=d3.svg.arc().innerRadius(inner_radius).outerRadius(outer_radius).startAngle(function(a){return a.circ.start_angle}).endAngle(function(a){return a.circ.end_angle});curves=d3.svg.line().x(function(a){return a.x}).y(function(a){return a.y}).interpolate("basis");svg_circular=d3.select("#canvas-circular").append("svg").attr("width",vis_width).attr("height",
vis_height).append("g").attr("transform","translate("+vis_width/2+","+vis_height/2+")").append("g");svg_force=d3.select("#canvas-force").append("svg").attr("width",vis_width).attr("height",vis_height).append("g");enterCircularLinks();enterCircularNodes();updateCircularTexts()}function setupUIElements(){appendNodesAsOptions(active_node_map);d3.selectAll("area").attr("data-map-highlight",'{"stroke":false,"fillColor":"ff0000","fillOpacity":0.6}')}
function waitForDataLoading(){0<mutex?setTimeout(function(){waitForDataLoading()},1E3):(user_datasets.pre_1={},constructUserNodesMaps("pre_1",pre_nodes),constructUserLinksMaps("pre_1",pre_links),constructLinkHierarchy("pre_1",pre_links),active_node_map=user_datasets.pre_1.node_map,active_node_link_map=user_datasets.pre_1.node_link_map,active_node_in_neighbor_map=user_datasets.pre_1.node_in_neighbor_map,active_node_out_neighbor_map=user_datasets.pre_1.node_out_neighbor_map,active_link_map=user_datasets.pre_1.link_map,
console.log(active_link_map),renderCanvas(),setupUIElements())};function expandRegion(a,b){var c=b.length;if(!(1>c)){for(var d=a.circ.start_angle,f=(a.circ.end_angle-d)/c,e=[],i=[],j=active_data_links.length;j--;){var n=active_data_links[j];n.source===a?(i.push(n.target),active_data_links.splice(j,1)):n.target===a&&(e.push(n.source),active_data_links.splice(j,1))}j=$.inArray(a,active_data_nodes);active_data_nodes[j].isActive=!1;for(var n=e.length,m=i.length,q=active_data_nodes.length+c-1,p=2*Math.PI/q,h=q-1;h>j;--h)active_data_nodes[h]=active_data_nodes[h-c+1];
console.log(active_node_link_map);for(h=j;h<j+c;++h){var k=b[h-j];calculateArcPositions(k,d,f,h-j);k.color=a.color;k.isActive=!0;active_data_nodes[h]=k;for(var l=0;l<n;++l){var g=e[l],g=g.key+"-"+k.key;console.log(g);g=active_node_link_map[g];void 0!==g&&active_data_links.push(g)}for(l=0;l<m;++l)g=i[l],g=k.key+"-"+g.key,console.log(g),g=active_node_link_map[g],void 0!==g&&active_data_links.push(g)}for(h=0;h<c;++h)for(l=h+1;l<c;++l)g=b[h].key+"-"+b[l].key,console.log(g),g=active_node_link_map[g],void 0!==
g&&active_data_links.push(g),g=b[l].key+"-"+b[h].key,g=active_node_link_map[g],void 0!==g&&active_data_links.push(g);updateCircularLayout(q,p)}}function updateCircularLayout(a,b){exitCircularNodes();exitCircularLinks();enterCircularLinks();enterCircularNodes();for(var c=0;c<a;++c)calculateArcPositions(active_data_nodes[c],0,b,c);updateCircularLinks();updateCircularNodes();updateCircularTexts()}
function dimNonSearchResults(){svg_circular.selectAll(".circular.node").classed("nofocus",function(a){return 0>$.inArray(a,active_data_nodes_force)});svg_circular.selectAll(".circular.link").classed("hidden",function(a){return 0>$.inArray(a,active_data_links_force)});svg_circular.selectAll(".circular.text").classed("visible",function(a){return 0<=$.inArray(a,active_data_nodes_force)})}
function nodeClick(a){console.log(d3.event);if(d3.event.shiftKey){if(enable_piwik&&piwikTracker.trackPageView("Combine node in circular view"),enable_owa&&OWATracker.trackAction("Viz","Combine circular node",a.name),enable_tracking&&trackAction("Combine circular node",a.name),!(void 0===a.parent||null===a.parent)){var a=active_node_map[a.parent],b=findActiveDescends(a);combineRegions(a,b)}}else if(d3.event.altKey)current_mode===mode.exploration?(current_mode=mode.fixation,selectStructure(a.name,!1)):
current_mode===mode.fixation&&(current_mode=mode.exploration,selectStructure(a.name,!0));else if(d3.event.metaKey){active_data_nodes.splice($.inArray(a,active_data_nodes),1);for(b=active_data_links.length;b--;){var c=active_data_links[b];(c.source===a||c.target===a)&&active_data_links.splice(b,1)}b=active_data_nodes.length;updateCircularLayout(b,2*Math.PI/b);ignored_nodes.push(a);a.isIgnored=!0}else{enable_piwik&&piwikTracker.trackPageView("Expand node in circular view");enable_owa&&OWATracker.trackAction("Viz",
"Expand circular node",a.name);enable_tracking&&trackAction("Expand circular node",a.name);for(var b=[],c=a.children,d=c.length,f=0;f<d;++f)b.push(active_node_map[c[f]]);expandRegion(a,b,svg_circular)}}
function nodeMouseOver(a,b){console.log(a);if(!(current_mode===mode.search||current_mode===mode.fixation)){var c=brodmann_map[a.brodmannKey];console.log('[title="'+c+'"]');$('[title="'+c+'"]').mouseover();current_mode!==mode.search&&(b.selectAll(".circular.link").classed("hidden",function(b){return b.source.key!==a.key&&b.target.key!==a.key}),b.selectAll(".circular.link").classed("outLink",function(b){var c=active_node_link_map[b.target.key+"-"+b.source.key];return b.source.key===a.key&&void 0===
c}),b.selectAll(".circular.link").classed("inLink",function(b){var c=active_node_link_map[b.target.key+"-"+b.source.key];return b.target.key===a.key&&void 0===c}),b.selectAll(".circular.link").classed("biLink",function(a){return void 0!==active_node_link_map[a.target.key+"-"+a.source.key]}),b.selectAll(".circular.node").classed("nofocus",function(b){var b=b.key,c=a.key,e=active_node_in_neighbor_map[c],i=active_node_out_neighbor_map[c];return b!==c&&0>$.inArray(b,e)&&0>$.inArray(b,i)}),b.selectAll(".circular.text").classed("visible",
function(b){var b=b.key,c=a.key,e=active_node_in_neighbor_map[c],i=active_node_out_neighbor_map[c];return b===c||0<=$.inArray(b,e)||0<=$.inArray(b,i)}))}}
function nodeMouseOut(a,b){current_mode===mode.search||current_mode===mode.fixation||($('[title="Areas 3, 1 & 2 - Primary Somatosensory Cortex"]').mouseout(),current_mode!==mode.search&&(b.selectAll(".circular.node").classed("nofocus",!1),b.selectAll(".circular.link").classed("hidden",!1),b.selectAll(".circular.link").classed("inLink",!1),b.selectAll(".circular.link").classed("outLink",!1),b.selectAll(".circular.link").classed("biLink",!1),updateCircularTexts()))}
function linkClick(a){enable_piwik&&piwikTracker.trackPageView("Click link in circular view");enable_owa&&OWATracker.trackAction("Viz","Click circular link",a.source.name+"-"+a.target.name);enable_tracking&&trackAction("Click circular link",a.source.name+"-"+a.target.name);displayConnectionInfo(a)}
function linkMouseOver(a,b){current_mode===mode.search||current_mode===mode.fixation||(b.selectAll(".circular.node").classed("nofocus",function(b){return b.key!==a.source.key&&b.key!==a.target.key}),b.selectAll(".circular.link").classed("hidden",function(b){return b.key!==a.key}),b.selectAll(".circular.text").classed("visible",function(b){return b.key===a.source.key||b.key===a.target.key}))}
function linkMouseOut(a,b){current_mode===mode.search||current_mode===mode.fixation||(b.selectAll(".circular.node").classed("nofocus",!1),b.selectAll(".circular.link").classed("hidden",!1),updateCircularTexts())}function forceNodeClick(a){enable_piwik&&piwikTracker.trackPageView("Click link in nodelink view");enable_owa&&OWATracker.trackAction("Viz","Click force node",a.name);enable_tracking&&trackAction("Click force node",a.name)}
function forceNodeMouseOver(a){current_mode!==mode.search&&(svg_force.selectAll(".nodelink.node").classed("nofocus",function(b){var b=b.key,c=a.key,d=active_node_in_neighbor_map[c],f=active_node_out_neighbor_map[c];return b!==c&&0>$.inArray(b,d)&&0>$.inArray(b,f)}),svg_force.selectAll(".nodelink.link").classed("nofocus",function(b){return b.source.key!==a.key&&b.target.key!==a.key}),svg_force.selectAll(".nodelink.text").classed("visible",function(b){var b=b.key,c=a.key,d=active_node_in_neighbor_map[c],
f=active_node_out_neighbor_map[c];return b===c||0<=$.inArray(b,d)||0<=$.inArray(b,f)}))}function forceNodeMouseOut(){current_mode!==mode.search&&(svg_force.selectAll(".circular.node").classed("nofocus",!1),svg_force.selectAll(".circular.link").classed("nofocus",!1),svg_force.selectAll(".nodelink.text").classed("visible",!0))}
function forceLinkClick(a){enable_piwik&&piwikTracker.trackPageView("Click link in nodelink view");enable_owa&&OWATracker.trackAction("Viz","Click force link",a.source.name+"-"+a.target.name);enable_tracking&&trackAction("Click force link",a.source.name+"-"+a.target.name);displayConnectionInfo(a)}
function forceLinkMouseOver(a){svg_force.selectAll(".nodelink.node").classed("nofocus",function(b){return b.key!==a.source.key&&b.key!==a.target.key});svg_force.selectAll(".nodelink.link").classed("nofocus",function(b){return b.key!==a.key});svg_force.selectAll(".nodelink.text").classed("visible",function(b){return b.key===a.source.key||b.key===a.target.key})}
function forceLinkMouseOut(){svg_force.selectAll(".nodelink.node").classed("nofocus",!1);svg_force.selectAll(".nodelink.link").classed("nofocus",!1);svg_force.selectAll(".nodelink.text").classed("visible",!0)}
function enterCircularNodes(){svg_circular.selectAll(".circular.node").data(active_data_nodes,function(a){return a.key}).enter().append("svg:path").style("fill",function(a){return a.color}).style("stroke","gray").attr("d",arcs).attr("class","circular node").attr("id",function(a){return"circ-node-"+a.key}).on("click",nodeClick).on("mouseover",function(a){nodeMouseOver(a,svg_circular)}).on("mouseout",function(a){nodeMouseOut(a,svg_circular)});svg_circular.selectAll(".circular.text").data(active_data_nodes,
function(a){return a.key}).enter().append("svg:text").attr("x",function(a){return a.circ.x}).attr("y",function(a){return a.circ.y}).attr("class","circular text").attr("id",function(a){return"text-"+a.key}).text(function(a){return a.name})}
function enterCircularLinks(){svg_circular.selectAll(".circular.link").data(active_data_links,function(a){return a.key}).enter().append("svg:path").attr("d",function(a){return curves([{x:a.source.circ.x,y:a.source.circ.y},{x:0,y:0},{x:a.target.circ.x,y:a.target.circ.y}])}).attr("class","circular link").attr("stroke-width",function(a){return Math.min(10,Math.max(1,Math.ceil(a.base_children.length/100)))+"px"}).attr("id",function(a){return"circ-link-"+a.key}).on("mouseover",function(a){linkMouseOver(a,
svg_circular)}).on("mouseout",function(a){linkMouseOut(a,svg_circular)}).on("click",linkClick)}function exitCircularNodes(){svg_circular.selectAll(".circular.node").data(active_data_nodes,function(a){return a.key}).exit().remove();svg_circular.selectAll(".circular.text").data(active_data_nodes,function(a){return a.key}).exit().remove()}function exitCircularLinks(){svg_circular.selectAll(".circular.link").data(active_data_links,function(a){return a.key}).exit().remove()}
function updateCircularNodes(){svg_circular.selectAll(".circular.node").data(active_data_nodes,function(a){return a.key}).transition().duration(1E3).attr("d",arcs);svg_circular.selectAll(".circular.text").data(active_data_nodes,function(a){return a.key}).transition().duration(1E3).attr("x",function(a){return a.circ.x}).attr("y",function(a){return a.circ.y})}
function updateCircularLinks(){svg_circular.selectAll(".circular.link").data(active_data_links,function(a){return a.key}).transition().duration(1E3).attr("d",function(a){return curves([{x:a.source.circ.x,y:a.source.circ.y},{x:0,y:0},{x:a.target.circ.x,y:a.target.circ.y}])})}function updateCircularTexts(){svg_circular.selectAll(".circular.text").classed("visible",function(a){a=a.circ;return a.end_angle-a.start_angle>Math.PI/12})}
function updateForceLayout(){var a=0,b={};active_data_nodes_force.forEach(function(c){b[c.group]?b[c.group][1]+=1:(++a,b[c.group]=[a,1])});selected_source.fixed=!0;selected_target.fixed=!0;selected_source.x=200;selected_source.y=400;selected_target.x=600;selected_target.y=400;force=d3.layout.force().nodes(active_data_nodes_force).links(active_data_links_force).size([vis_width,vis_height]).linkDistance(function(a){var c=b[a.source.group],d=b[a.target.group];return 10*Math.max(a.source.group!=a.target.group?
c[1]:2/c[1],a.source.group!=a.target.group?d[1]:2/d[1])+20}).linkStrength(1).charge(-6E3).friction(0.5).start();svg_force.selectAll(".link").remove();svg_force.selectAll(".node").remove();svg_force.selectAll(".text").remove();var c=svg_force.selectAll(".nodelink.link").data(active_data_links_force,function(a){return a.key}).enter().append("svg:line").attr("class","nodelink link").style("stroke-width",3).on("click",forceLinkClick).on("mouseover",forceLinkMouseOver).on("mouseout",forceLinkMouseOut),
d=svg_force.selectAll(".nodelink.node").data(active_data_nodes_force,function(a){return a.key}).enter().append("svg:circle").attr("class","nodelink node").attr("cx",function(a){return a.x}).attr("cy",function(a){return a.y}).attr("r",function(a){return a===selected_source||a===selected_target?20:10}).style("fill",function(a){return a.color}).on("click",forceNodeClick).on("mouseover",forceNodeMouseOver).on("mouseout",forceNodeMouseOut).call(force.drag),f=svg_force.append("svg:g").selectAll("g").data(force.nodes()).enter().append("g").append("svg:text").attr("x",
8).attr("y",".31em").attr("class","nodelink text visible").text(function(a){return a.name});force.on("tick",function(){c.attr("x1",function(a){return a.source.x}).attr("y1",function(a){return a.source.y}).attr("x2",function(a){return a.target.x}).attr("y2",function(a){return a.target.y});d.attr("cx",function(a){return a.x}).attr("cy",function(a){return a.y});f.attr("transform",function(a){return"translate("+a.x+","+a.y+")"})})}
function highlightNode(a,b,c,d,f){void 0!==a&&(f.selectAll(".circular.node").classed(b,function(b){return b.key===a.key}),d&&f.select("#text-"+a.key).classed("visible",c))}function expandNode(){}function expandLink(){}
function arcTween(a){var b=d3.interpolate({start_angle:a.circ.old_start_angle,end_angle:a.circ.old_end_angle},a);return function(c){c=b(c);console.log(c);a.circ.old_start_angle=c.start_angle;a.circ.old_end_angle=c.end_angle;c.circ.start_angle=c.start_angle;c.circ.end_angle=c.end_angle;return arcs(c)}};function appendNodesAsOptions(a){for(var b in a){var c=a[b];$("#sourceSelect").append(new Option(c.name,b,!1,!1));$("#targetSelect").append(new Option(c.name,b,!1,!1))}$(".chzn-select").chosen({allow_single_deselect:!0});$("#sourceSelect").trigger("liszt:updated");$("#targetSelect").trigger("liszt:updated")}
function updateOptions(){$("#sourceSelect").find("option").remove();$("#targetSelect").find("option").remove();$("#sourceSelect").trigger("liszt:updated");$("#targetSelect").trigger("liszt:updated");appendNodesAsOptions(active_node_map)}function populateDatasetUI(){$("#dataSelect").append(new Option("BAMS (public)",2130));$("#dataSelect").append(new Option("Pubmed (public)",1000002));for(var a=dataset_list.length,b=0;b<a;++b){var c=dataset_list[b];$("#dataSelect").append(new Option(c[1],c[0]))}}
function createDatasetButtonClick(){database.createDataset($('[name="datasetName"]').val(),uid,0)}function manageDatasetButtonClick(){var a=$("#dataSelect :selected").text(),b=$("#dataSelect").val(),c=endsWith(a,"(personal copy)")?1:0;console.log(c);console.log("media/php/manageDataset.php?datasetName="+a+"&datasetID="+b+"&isClone="+c)}
function cloneDatasetButtonClick(){var a=$("#dataSelect :selected").text().replace("(public)","(personal copy)"),b=$("#dataSelect").val();database.cloneDataset(a,uid,b)}function applyDatasetButtonClick(){var a=parseInt($("#dataSelect").val());""!==a&&void 0===user_datasets[a]&&database.getBrainData(a,uid)}
function searchButtonClick(){enable_piwik&&piwikTracker.trackPageView("Search:"+selected_source.name+"-"+selected_target.name);enable_owa&&OWATracker.trackAction("UI","Search",selected_source.name+"-"+selected_target.name);enable_tracking&&trackAction("Search",selected_source.name+"-"+selected_target.name);current_mode=mode.search;var a=calculatePaths(max_hop);populateForceElements(a);updateForceLayout();dimNonSearchResults()}
function clearButtonClick(){enable_piwik&&piwikTracker.trackPageView("Click clear button");current_mode=mode.exploration;svg_circular.selectAll(".circular.node").classed("nofocus",!1);svg_circular.selectAll(".circular.link").classed("hidden",!1);updateCircularTexts()}
function sourceSearchInput(){enable_piwik&&piwikTracker.trackPageView("Set search source");void 0!=selected_source&&(selected_source.fixed=!1,highlightNode(selected_source,"focus",!1,!0,svg_circular),clearSearchResult());var a=active_node_map[this.value];selected_source=a;if(!a.isActive){var b=findActiveParent(a);void 0===b?(b=findActiveDescends(a),combineRegions(a,b)):(a=findDescAtDepth(b,a.depth),expandRegion(b,a,svg_circular))}svg_circular.selectAll(".circular.node").classed("nofocus",function(a){return a!==
selected_source&&a!==selected_target});svg_circular.selectAll(".circular.text").classed("visible",function(a){return a===selected_source||a===selected_target});enable_owa&&OWATracker.trackAction("UI","Set source",selected_source.name);enable_tracking&&trackAction("Set source",selected_source.name)}
function targetSearchInput(){enable_piwik&&piwikTracker.trackPageView("Set search target");void 0!=selected_target&&(selected_target.fixed=!1,highlightNode(selected_target,"focus",!1,!0,svg_circular),clearSearchResult());var a=active_node_map[this.value];selected_target=a;if(!a.isActive){var b=findActiveParent(a);void 0===b?(b=findActiveDescends(a),combineRegions(a,b)):(a=findDescAtDepth(b,a.depth),expandRegion(b,a,svg_circular))}svg_circular.selectAll(".circular.link").classed("hidden",function(a){return a.source.key!==
selected_source.key&&a.target.key!==selected_target.key});svg_circular.selectAll(".circular.node").classed("nofocus",function(a){return a!==selected_source&&a!==selected_target});svg_circular.selectAll(".circular.text").classed("visible",function(a){return a===selected_source||a===selected_target});enable_owa&&OWATracker.trackAction("UI","Set target",selected_target.name);enable_tracking&&trackAction("Set target",selected_target.name)}
function datasetSelect(){var a=$("#dataSelect :selected").text();endsWith(a,"(public)")?($("#bt-cloneDatasets").css("display","block"),$("#bt-manageDatasets").css("display","none")):($("#bt-cloneDatasets").css("display","none"),$("#bt-manageDatasets").css("display","block"))}function clearSearchResult(){}
function setMaxHop(){enable_piwik&&piwikTracker.trackPageView("Set max hop");enable_owa&&OWATracker.trackAction("UI","Set max hop",this.value);enable_tracking&&trackAction("Set max hop",this.value);max_hop=this.value;document.getElementById("maxHopValue").innerHTML=max_hop}
function displayConnectionInfo(a){d3.selectAll("#conn-info .exp").remove();d3.select("#conn-info #src-name").html("Source: "+a.source.name);d3.select("#conn-info #tgt-name").html("Target: "+a.target.name);var b=active_node_link_map[a.target.key+"-"+a.source.key];if(!is_preloaded_data){var c=d3.select("#notes");c.selectAll("div").remove();c.selectAll("p").remove();for(var c=c.append("div"),d="<p>Current link: "+a.source.name+"-"+a.target.name+"</p>",d=a.isDerived?d+"<p>This is a meta link. See the derived connections for user entered notes.</p>":
d+("<p>"+a.notes+"</p>"),d=d+'<p>Children links:</p><table class="table table-bordered table-striped table-condensed"><tr class="tableTitle"><td>Source</td><td>Target</td><td>Notes</td></tr>',f=a.base_children.length,e=0;e<f;++e)var i=active_link_map[a.base_children[e]],d=d+("<tr><td>"+i.source.name+"</td><td>"+i.target.name+"</td><td>"+i.notes+"</td></tr>");d+="</table>";if(void 0!==b){d+="<p>Current link: "+a.target.name+"-"+a.source.name+"</p>";d=b.isDerived?d+"<p>This is a meta link. See the derived connections for user entered notes.</p>":
d+("<p>"+b.notes+"</p>");d+="<p>Children links:</p>";d+='<table class="table table-bordered table-striped table-condensed"><tr class="tableTitle"><td>Source</td><td>Target</td><td>Notes</td></tr>';f=b.base_children.length;for(e=0;e<f;++e)i=active_link_map[b.base_children[e]],d+="<tr><td>"+i.source.name+"</td><td>"+i.target.name+"</td><td>"+i.notes+"</td></tr>";d+="</table>"}c.html(d)}if(is_preloaded_data){f=a.paper;c=d3.select("#paper-list");c.selectAll("div").remove();c.selectAll("p").remove();c=
c.append("div");d="<p>Current link: "+a.source.name+"-"+a.target.name+"</p>";if(a.isDerived)d+="<p>This is a meta link. See the derived connections for more information.</p>";else{d+='<table class="table table-bordered table-striped table-condensed"><tr class="tableTitle"><td>Publication</td></tr>';b=f.length;for(e=0;e<b;++e)var j=paper_map[f[e]],d=d+('<tr><td><a href="'+j.url+'" target="_blank" class="paperLink">'+j.title+"</a></td></tr>")}d+="</table>";d+="<p>Children links:</p>";d+='<table class="table table-bordered table-striped table-condensed"><tr class="tableTitle"><td>Source</td><td>Target</td><td>Publication</td></tr>';
f=a.base_children.length;for(e=0;e<f;++e)for(var i=active_link_map[a.base_children[e]],n=i.paper,b=n.length,m=0;m<b;++m)j=paper_map[n[m]],d+="<tr><td>"+i.source.name+"</td><td>"+i.target.name+'</td><td><a href="'+j.url+'" target="_blank" class="paperLink">'+j.title+"</a></td></tr>";d+="</table>";c.html(d);d3.selectAll(".paperLink").on("click",paperClick);c=d3.select("#bams-list");c.selectAll("p").remove();c=c.append("p");c.html("Links to BAMS records will be added in future updates")}a=a.children;
c=d3.select("#sub-con-list");c.selectAll("p").remove();c=c.append("p");1>a.length?c.html("There are no sub-connections for this link."):c.selectAll("p").data(a).enter().append("p").html(function(a){a=active_link_map[a];return"Source: "+a.source.name+"; Target: "+a.target.name})};function visualizeUserData(a){a=user_datasets[a];initActiveNodes(a.node_map);computeCircularNodesParameters(active_data_nodes);initActiveLinks(a.link_map);clearCanvases();enterCircularLinks();enterCircularNodes();updateCircularTexts()}function clearCanvases(){svg_circular.selectAll(".circular").remove();svg_force.selectAll(".force").remove()}
function combineRegions(a,b){for(var c=b.length,d=active_data_links.length;d--;)for(var f=active_data_links[d],e=0;e<c;++e){var i=b[e];(f.source===i||f.target===i)&&active_data_links.splice(d,1)}e=$.inArray(b[0],active_data_nodes);d=active_data_nodes[e];d.isActive=!1;a.circ=d.circ;a.isActive=!0;active_data_nodes[e]=a;for(e=1;e<c;++e)d=b[e],d.isActive=!1,d=$.inArray(d,active_data_nodes),active_data_nodes.splice(d,1);c=active_data_nodes.length;d=2*Math.PI/c;f=a.key;for(e=0;e<c;++e){var i=active_data_nodes[e].key,
j=f+"-"+i,j=active_node_link_map[j];void 0!==j&&active_data_links.push(j);j=i+"-"+f;j=active_node_link_map[j];void 0!==j&&active_data_links.push(j)}updateCircularLayout(c,d)}
function assignColors(a){var b=0,c=[],d;for(d in a){var f=a[d];1===f.depth&&(b+=1,f.group=f.key,c.push(f))}f=[];for(d=0;d<b;++d)f.push(colorPalette[d]);d3.scale.ordinal().domain(d3.range(b)).range(f);for(d=0;d<b;++d)c[d].color=f[d];for(;0<c.length;){var b=c[0],f=b.children,e=f.length;for(d=0;d<e;++d){var i=a[f[d]];i.color=b.color;i.group=b.group;c.push(i)}c.splice(0,1)}}function computeCircularNodesParameters(a){for(var b=a.length,c=2*Math.PI/b,d=0;d<b;++d)calculateArcPositions(a[d],0,c,d)}
function calculateArcPositions(a,b,c,d){a.circ.start_angle=b+c*d;a.circ.end_angle=b+c*(d+1);b=c*(d+0.5)+b;c=inner_radius+(outer_radius-inner_radius)/2;a.circ.x=c*Math.cos(Math.PI/2-b);a.circ.y=-c*Math.sin(Math.PI/2-b)}function stash(a){a.circ.old_start_angle=a.circ.start_angle;a.circ.old_end_angle=a.circ.end_angle}
(function(a,b,c){a.constructUserDataMaps=function(a,f,e,i,j){user_datasets[a]={};for(var n={},m={},q={},p=f.length,h=0;h<p;++h){var k=f[h];k.key=parseInt(k.key);k.depth=parseInt(k.depth);k.parent=null===k.parentKey?null:parseInt(k.parentKey);k.circ={};k.children=[];n[k.key]=k;m[k.key]=[];q[k.key]=[]}for(var l in n)k=n[l],null!==k.parent&&(p=n[k.parent],p!==c?p.children.push(k.key):k.parent=null);user_datasets[a].node_map=n;user_datasets[a].node_in_neighbor_map=m;user_datasets[a].node_out_neighbor_map=
q;n={};m={};q=user_datasets[a];k=e.length;for(l=0;l<k;++l){var g=e[l],p=parseInt(g.sourceKey),h=parseInt(g.targetKey),g={key:parseInt(g.key),source:q.node_map[p],target:q.node_map[h],notes:g.notes,paper:g.paper,children:[],isDerived:!1,base_children:[]};n[g.key]=g;m[g.source.key+"-"+g.target.key]=g;q.node_in_neighbor_map[h].push(p);q.node_out_neighbor_map[p].push(h)}q.link_map=n;q.node_link_map=m;n=e.length;for(q=m=0;q<n;++q)k=parseInt(e[q].key),k>m&&(m=k);l=user_datasets[a];for(q=0;q<n;++q){for(var k=
parseInt(e[q].key),t=l.link_map[k],p=t.source,h=t.target,u=l.node_map[p.parent],w=l.node_map[h.parent],g=[],v=t.base_children.length,r=0;r<v;++r)g.push(t.base_children[r]);t.isDerived||(g.push(t.key),v+=1);if(null!==p.parent&&p.parent!==h.key&&0>b.inArray(h.key,u.children)){var r=p.parent+"-"+h.key,s=l.node_link_map[r];if(s===c)m+=1,s={key:m,source:l.node_map[parseInt(p.parent)],target:h,notes:"Meta link",children:[k],isDerived:!0,base_children:g,paper:[]},l.link_map[m]=s,l.node_link_map[r]=s,l.node_in_neighbor_map[h.key].push(p.parent),
l.node_out_neighbor_map[p.parent].push(h.key),e.push(s),n+=1;else{0>b.inArray(k,s.children)&&s.children.push(k);for(r=0;r<v;++r)t=g[r],0>b.inArray(t,s.base_children)&&s.base_children.push(t)}}if(null!==h.parent&&h.parent!==p.key&&0>b.inArray(p.key,w.children))if(r=p.key+"-"+h.parent,s=l.node_link_map[r],s===c)m+=1,s={key:m,source:p,target:l.node_map[parseInt(h.parent)],notes:"Meta link",children:[k],isDerived:!0,base_children:g,paper:[]},l.link_map[m]=s,l.node_link_map[r]=s,l.node_in_neighbor_map[h.parent].push(p.key),
l.node_out_neighbor_map[p.key].push(h.parent),e.push(s),n+=1;else{0>b.inArray(k,s.children)&&s.children.push(k);for(r=0;r<v;++r)t=g[r],0>b.inArray(t,s.base_children)&&s.base_children.push(t)}if(null!==p.parent&&null!==h.parent&&p.parent!==h.parent&&0>b.inArray(h.key,u.children)&&0>b.inArray(p.key,w.children))if(r=p.parent+"-"+h.parent,u=l.node_link_map[r],u===c)m+=1,u={key:m,source:l.node_map[parseInt(p.parent)],target:l.node_map[parseInt(h.parent)],notes:"Meta link",children:[k],isDerived:!0,base_children:g,
paper:[]},l.link_map[m]=u,l.node_link_map[r]=u,l.node_in_neighbor_map[h.parent].push(p.parent),l.node_out_neighbor_map[p.parent].push(h.parent),e.push(u),n+=1;else{0>b.inArray(k,u.children)&&u.children.push(k);for(r=0;r<v;++r)t=g[r],0>b.inArray(t,u.base_children)&&u.base_children.push(t)}}if(0<i.length||0<j.length){console.log(i);console.log(j);e=user_datasets[a].node_map;n=user_datasets[a].link_map;for(m=0;m<i.length;++m)switch(diff_entry=i[m],diff_entry.diff){case "AddNode":q={key:diff_entry.nodeKey,
name:null,depth:0,parent:null,notes:null};f.push(q);e[q.key]=q;break;case "Rename":e[diff_entry.nodeKey].name=diff_entry.content;break;case "ChangeNote":e[diff_entry.nodeKey].notes=diff_entry.content}for(m=0;m<j.length;++m)switch(diff_entry=j[m],diff_entry.diff){case "ChangeNode":n[diff_entry.linkKey].notes=diff_entry.content}}assignColors(user_datasets[a].node_map)}})(window.dataModel=window.dataModel||{},jQuery);
function findActiveParent(a){for(;void 0!==a&&null!==a&&!a.isActive;)a=active_node_map[a.parent];return a}function findActiveDescends(a){for(var b=active_data_nodes.length,c=[],d=0;d<b;++d){var f=active_data_nodes[d];if(!(void 0===f.parent||null===f.parent))for(var e=active_node_map[f.parent];void 0!==e&&null!==e;){if(e===a){c.push(f);break}e=active_node_map[e.parent]}}return c}
function findDescAtDepth(a,b){for(var c=[a];0<c.length&&c[0].depth<b;){for(var d=c[0].children,f=d.length,e=0;e<f;++e)c.push(active_node_map[d[e]]);c.splice(0,1)}return c}function initActiveNodes(a){active_data_nodes=[];for(var b in a){var c=a[b];1===c.depth&&(c.isActive=!0,active_data_nodes.push(c))}}
function initActiveLinks(a){active_data_links=[];for(var b in a){var c=a[b];1===c.source.depth&&1===c.target.depth&&(c.strength=20<c.base_children.length?"strong":1<c.base_children.length?"moderate":"weak",active_data_links.push(c))}}
function calculatePaths(a){var b=0,c=[],d=[];c[0]=[selected_source];var f=selected_source.depth,e=selected_target.depth,i=Math.min(f,e),f=Math.max(f,e);console.log("map");for(console.log(active_node_out_neighbor_map);0<c.length&&c[0].length<=a+2;){e=c[0];c.splice(0,1);var j=e[e.length-1];if(j.key===selected_target.key)d.push(e);else if(!(e.length>=a+2)){for(var j=active_node_out_neighbor_map[j.key],n=j.length,m=0;m<n;++m){var q=active_node_map[j[m]];q.depth>=i&&q.depth<=f&&c.push(e.concat(q))}b++;
if(5E3<b){enable_owa&&(console.log(selected_source),console.log(selected_target),OWATracker.trackAction("Warning","Path size limit reached",selected_source.name+"-"+selected_target+"-"+max_hop));console.log("Reached path limit.");break}}}return d}
function populateForceElements(a){var b=a.length;active_data_nodes_force=[];active_data_links_force=[];console.log(a);for(var c=0;c<b;++c){console.log(c);for(var d=a[c],f=d.length-1,e=0;e<f;++e){var i=d[e],j=d[e+1],n=active_node_link_map[i.key+"-"+j.key];0>$.inArray(n,active_data_links_force)&&active_data_links_force.push(n);0>$.inArray(i,active_data_nodes_force)&&active_data_nodes_force.push(i);0>$.inArray(j,active_data_nodes_force)&&active_data_nodes_force.push(j)}}}
function startSession(){sessionStartTime=new Date;startTime=new Date;document.onmousemove=recordMouseMovement}function recordActionData(){actionData.push({timeElapsed:currentActionData.timeElapsed,mouseTrace:currentActionData.mouseTrace,actionBasic:currentActionData.actionBasic,actionDetail:currentActionData.actionDetail,time:currentActionData.time});startTime=new Date;currentActionData={timeElapsed:-1,mouseTrace:"",actionBasic:"",actionDetail:"",time:-1}}
function recordMouseMovement(a){2950<currentActionData.mouseTrace.length||(currentActionData.mouseTrace+="x:"+a.pageX+",y:"+a.pageY+",time:"+(new Date-startTime)+";")}function trackAction(a,b){currentActionData.actionBasic=a;currentActionData.actionDetail=b;endTime=new Date;currentActionData.timeElapsed=(endTime-startTime)/1E3;currentActionData.time=endTime.toString();recordActionData()}
function paperClick(){var a=$(this).text();enable_owa&&OWATracker.trackAction("UI","Click paper",a);enable_tracking&&(console.log("tracking paper click"),trackAction("Click paper",a))}
(function(a,b){var c=function(a,c,e,i){b.ajax({type:"POST",url:"media/php/"+a,data:c,error:function(b){console.log("Failed when calling "+a);console.log(b)},success:function(b){console.log("Successfully called "+a);e&&e(b)},async:i})};a.createDataset=function(a,f,e){c("addDataset.php",{datasetName:a,userID:f,isClone:!1,origDatasetID:e},function(c){b("#dataSelect").append(new Option(a,c));b("#dataSelect").trigger("liszt:updated");b("#createDatasetSuccessAlert").show()},!0)};a.cloneDataset=function(a,
f,e){c("addDataset.php",{datasetName:a,userID:f,isClone:!0,origDatasetID:e},function(c){b("#dataSelect").append(new Option(a,c));b("#dataSelect").trigger("liszt:updated");b("#createDatasetSuccessAlert").show()},!0)};a.saveSessionData=function(){sessionEndTime=new Date;var a=sessionEndTime-sessionStartTime;c("writeActionData.php",{actionDataArray:actionData,sessionLength:a/1E3,userID:uid},null,!1)};a.populateUserId=function(){c("getUserID.php",null,function(b){uid=b;a.populateDatasets(uid)},!1)};a.populateDatasets=
function(a){c("getDatasetByUserID.php",{userID:a},function(a){dataset_list=b.parseJSON(a);populateDatasetUI()},!1)};a.getBrainData=function(a,c){phpToPhp("getBrainData.php",{datasetKey:a,userID:c},function(c){c=b.parseJSON(c);dataModel.constructUserDataMaps(a,c.nodes,c.links,c.diff_nodes,c.diff_links);c=user_datasets[a];active_node_map=c.node_map;active_node_link_map=c.node_link_map;active_node_in_neighbor_map=c.node_in_neighbor_map;active_node_out_neighbor_map=c.node_out_neighbor_map;active_link_map=
c.link_map;updateOptions();visualizeUserData(a);is_preloaded_data=!1},!1)};a.getBrodmannAreas=function(){var a=function(a){a=b.parseJSON(a);constructBrodmannMap(a)};b.ajax({type:"GET",url:"media/php/getBrodmannAreas.php",error:function(a){console.log("Failed when calling getBrodmannAreas.php");console.log(a)},success:function(b){console.log("Successfully called getBrodmannAreas.php");a&&a(b)},async:!0})}})(window.database=window.database||{},jQuery);
function contains(a,b){for(var c=a.length,d=0;d<c;++d)if(b.key===a[d].key)return d;return-1}function constructBrodmannMap(a){brodmann_map={};for(var b=a.length,c=0;c<b;++c){var d=a[c];brodmann_map[d.id]=d.name}}function endsWith(a,b){return-1!==a.indexOf(b,a.length-b.length)}function findMaxElement(a,b){for(var c=0,d=a.length,f=0;f<d;++f){var e=a[f][b];console.log(e);c=e>c?e:c}return c};var API_PATH="http://api.brain-map.org/api/v2/",SVG_DOWNLOAD_PATH=API_PATH+"svg/",IMG_DOWNLOAD_PATH=API_PATH+"section_image_download/",STRUCTURES_URL=API_PATH+"data/Structure/query.json?criteria=[graph_id$eq1]&num_rows=all",curr_image_id=100960224,DOWNSAMPLE=5,urlVars=getUrlVars();"id"in urlVars&&(curr_image_id=urlVars.id);"downsample"in urlVars&&(DOWNSAMPLE=urlVars.downsample);var _structures={},struct_img_map={},tempSelPath=null;
function format_url(a,b,c){return a+b+"?"+$.map(c,function(a,b){return b+"="+a}).join("&")}function download_structures(a){$.getJSON(STRUCTURES_URL,function(b){for(var c=0;c<b.msg.length;c++){var d=b.msg[c];_structures[d.id]=d}a()})}
function download_svg(a){$("#anatomy-map #svg").load(a,function(){$("#anatomy-map path").attr("title",function(){var a=$(this).attr("structure_id");return _structures[a].name});$("#anatomy-map path").qtip();$("#anatomy-map path").hover(function(){$(this).attr("class","hover")},function(){$(this).attr("class","")});null!==tempSelPath&&($(tempSelPath).attr("class","hover"),$(tempSelPath).qtip("toggle",!0),tempSelPath=null)})}
function download_img(a){var b=new Image;b.onload=function(){$("#anatomy-map #img").empty();$("#anatomy-map #img").append(b)};b.src=a}function getUrlVars(){for(var a=[],b,c=window.location.href.slice(window.location.href.indexOf("?")+1).split("&"),d=0;d<c.length;d++)b=c[d].split("="),a.push(b[0]),a[b[0]]=b[1];return a}
function selectStructure(a,b){console.log("selectStructure");console.log(a);var c="path[oldtitle='"+a+"']";if(b)$(c).attr("class",""),$(c).qtip("toggle",!1);else{var d=null,f;for(f in _structures)if(_structures[f].name===a){d=f;break}struct_img_map[d]!==curr_image_id?(curr_image_id=struct_img_map[d],tempSelPath=c,updateImages()):($(c).attr("class","hover"),$(c).qtip("toggle",!0))}}
function retrieveStructImageMap(){$.ajax({type:"GET",url:"media/php/getStructImgMap.php",error:function(a){console.log("Failed");console.log(a)},success:function(a){console.log("Success");a=$.parseJSON(a);console.log(a);for(var b=0;b<a.length;++b){var c=a[b];struct_img_map[c.structKey]=c.imageKey}}})}function updateImages(){download_svg(format_url(SVG_DOWNLOAD_PATH,curr_image_id,args));download_img(format_url(IMG_DOWNLOAD_PATH,curr_image_id,args))}
$(function(){$("#anatomy-map").css("background",'no-repeat center url("media//img/loading.gif")');retrieveStructImageMap();download_structures(function(){$("#anatomy-map").css("background","");args={downsample:DOWNSAMPLE};updateImages()})});
