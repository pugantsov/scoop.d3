var socket;
var sentMyData = false;

/**
 * @function fifoQueue
 * @description Simple first in, first out queue structure for Twitter Streaming panels.
 * @returns {Object[]} Returns a FIFO queue collection object.
 */
function fifoQueue(){
	collection = [];
	this.print = function() {
	    console.log(collection);
	};
	this.enqueue = function(element) {
	    collection.push(element);
	};
	this.dequeue = function() {
	    return collection.shift(); 
	};
	this.front = function() {
	    return collection[0];
	};
	this.size = function() {
	    return collection.length; 
	};
	this.isEmpty = function() {
	    return (collection.length === 0); 
	};
	this.contents = function() {
		return collection;
	};
}

var q = new fifoQueue();

$(document).ready(function() {
	// WebSocket connection to emit the cashtag for processing by the Twitter Streaming API handler in Flask.
	socket = io.connect('http://' + document.domain + ':' + location.port + '/tweets');
	socket.on('connect', function() {
		console.log(sentMyData);
		console.log('Connected (Twitter Stream). Streaming Keyword "'+data_prices[0]['symbol'].toString()+'"...');
	    if(!sentMyData) socket.emit('stream', {'track': data_prices[0]['symbol'].toString()});
	    sentMyData = true;
	});

	/**
	 * @function addStreamPanel
	 * @description Responsible for adding panels to the panelstream div in the left-hand section of the visualisation (Twitter Streaming).
	 * @param {Object[]} queue - Takes FIFO queue array as data for Streaming panels.
	 */
	function addStreamPanel(queue) {
		var tweetDivs = d3.select(".panelstream").selectAll("div.panelstream-body")
				.data(queue)
					.enter()
					.insert("div", "div")
					.attr("id", function(d,i){return "ps"+d['id_str']})
					.classed("panelstream-body", true);

		var headerBlock = tweetDivs.append("p")
						  .classed("panelstream-tweet-header", true);

			headerBlock.append("img")
				.attr("width", 20)
				.attr("height", 20)
				.attr("src", function(d){return d['user']['profile_image_url']})
				.classed("panelstream-tweet-img-profile", true);

			headerBlock.append("text")
				.text(function(d){
					var tweet_created_format = d3.timeFormat("%-I:%M:%S%p, %e %b %Y")(d3.timeParse("%a %b %d %H:%M:%S %Z %Y")(d['created_at']));
					return " @"+d['user']['screen_name']+"    ("+tweet_created_format+")";
				})
				.classed("panelstream-tweet-header-text", true);


		var bodyBlock = tweetDivs.append("p")
						.classed("panelstream-tweet-body", true);

			bodyBlock.append("text")
				.text(function(d){return d['text'];})
				.classed("panelstream-tweet-body-text", true);
	}

	/**
	 * @function removeStreamPanel
	 * @description Responsible for removing Twitter Streaming panels.
	 * @param {Object[]} queue - Takes FIFO queue array as data for D3 panels.
	 */
	function removeStreamPanel(queue) {
		var tweetDivs = d3.select(".panelstream").selectAll("div.panelstream-body").data(queue);
		tweetDivs.exit()
				.transition()
					.duration(600)
					.ease(d3.easeLinear)
					.style("opacity",0)
					.remove();
	}

	// Streaming response socket which enqueues to the FIFO queue structure and dequeues as the queue reaches its limit.
	socket.on('stream-response', function(data){
		console.log("Response!");
		if(q.size()<10) 
		{
			q.enqueue(data['data']);
			addStreamPanel(q.contents());
		} 
		else 
		{
			q.dequeue();
			removeStreamPanel(q.contents());
			q.enqueue(data['data']);
			addStreamPanel(q.contents());
		}
	});
});