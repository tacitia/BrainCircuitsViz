/*
 * Brain Circuits Viz
 * Authors: Hua and Arthur
 * Script 0: data declaration scripts
*/

/*******
    Data declaration section
*******/
// Raw connectivity data
var node_link_map; // Key: source node id - target node id. Value: an array of link id.
var link_map; // Key: link id. Value: link details.
var paper_map; // Key: paper id. Value: paper details.
var node_map;
var node_in_neighbor_map; // Key: node id; value: an array of neighbors
var node_out_neighbor_map;

// User specific data
var link_rating_map; // Key: link id. Value: user rating for the link.
var record_rating_map; // Key: record id. Value: user rating for the record.
var brodmann_map;
var dataset_list;
var uid;
var user_datasets = {};
var is_preloaded_data = true;

// State variables
var selected_source;
var selected_target;

// SVG data variables
// var data_nodes;
var active_data_nodes;
var active_data_links;
var active_data_nodes_force;
var active_data_links_force;
var active_node_map;
var active_node_link_map;
var active_node_in_neighbor_map;
var active_node_out_neighbor_map;
var active_link_map;

// SVG display variables
var svg_circular;
var svg_force;
var arcs;
var curves;
var links;
var force;

// SVG display parameters
var vis_width = 1000;
var vis_height = 1000;
var inner_radius = Math.min(vis_width, vis_height) * 0.32;
var outer_radius = inner_radius * 1.2;

// Enumerations
var directionType = {
    "in": 1,
    "out": 2,
    "bi": 3
};
var mode = {
    exploration: 1, //browsing
    search: 2,      //when search button is clicked
    fixation: 3     //when clicked on a node
};

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

// Misc program control variables
var mutex = 3;
var enable_piwik = false;
var enable_owa = false;
var enable_tracking = true;
var current_mode = mode.exploration;
var max_hop = 1;

// Action records
var actionData = [];
var generalData = [];
var startTime = null;
var endTime = null;
var sessionStartTime;
var sessionEndTime;
var currentActionData = {timeElapsed: -1, mouseTrace: "", actionBasic: "", actionDetail: "", time: -1};

/*******
    End of data declaration section
*******/
