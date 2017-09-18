var margin = { top: 20, right: 145, bottom: 0, left: 145 },
  width = 900
  height = 500;

var svg_scatter = d3.select("#scatter").append("svg")
  .attr("width", width)
  .attr("height", height + margin.top + margin.bottom);

//initiate player dropdown

var dropdown = d3.select("#player");

d3.csv("data/" + d3.select("#year").property("value") + "_closestdefender_3s.csv", function(data) {
	var data = data.filter(function(d) {
			if (d.dis == "0-4 Feet") {
				return d;
			}
		});
	data = data.sort(function(a,b){return d3.ascending(a.name, b.name)});
	dropdown.selectAll("option").data(data).enter().append("option")
		.text(function(d){return d.name;})
		.attr("value", function(d){return d.name;})
		.attr("selected", function(d){
			if (d.name == "JR Smith") {
				return "selected";
			}
		});
});

drawScatter()

// redraw scatter on dropdown change

d3.select('#year')
  .on('change', function() {
    refreshdropdown();
    drawScatter();
  });

d3.select('#player')
  .on('change', function() {
    drawScatter();
  });

function drawScatter() {

  // initiate placeholder

  d3.csv("data/" + d3.select("#year").property("value") + "_closestdefender_3s.csv", function(data) {
    data.forEach(function(d) {    
      d.freq = +d.freq //convert strings to numbers
      d.fga = +d.fga
      d.fgp = +d.fgp
      d.jrsmith1 = +d.jrsmith1
      d.jrsmith2 = +d.jrsmith2;
    });

    var padding = 40; 
    var label_padding = 2;

    // remove previous graph
    svg_scatter.selectAll("*").remove();
    d3.select(".tooltip").remove();

    // scales and axes
    var xScale = d3.scaleBand()
      .domain(["0-4 Feet", "4-6 Feet", "6+ Feet"])
      .range([padding, width - 50]);

    var yScale = d3.scaleLinear()
	  .domain([.10, 0.65])
	  .range([height - padding, 10]);

    var xAxis = d3.axisBottom(xScale);

    var yAxis = d3.axisLeft(yScale)
      .tickFormat(d3.format(".0%"));

    svg_scatter.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + (height - padding) + ')')
      .call(xAxis);

    svg_scatter.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(" + padding + ",0)")
      .call(yAxis);

    svg_scatter.append("text") //eFG label
      .text("3FG%")
      .attr("x", padding + 10)
      .attr("y", 20)
      .style("font-size", "20px")
      .attr("fill", "grey");

    svg_scatter.append("text") //Distance Label
      .text("Distance to Closest Defender (ft)")
      .attr("x", 590)
      .attr("y", 450)
      .style("font-size", "20px")
      .attr("fill", "grey");    

    // avg eFG
    svg_scatter.append("line")
      .attr("x1", padding)
      .attr("x2", width-50)
      .attr("y1", yScale(avgeFG(d3.select("#year").property("value"))))
      .attr("y2", yScale(avgeFG(d3.select("#year").property("value"))))
      .style("stroke-dasharray", ("3, 3"))
      .attr("stroke-width", 2)
      .style("opacity", 0.5)
      .attr("stroke", "black");

    // tooltips
    var div = d3.select("#scatter").append("div") 
      .attr("class", "tooltip")       
      .style("opacity", 0);

    // points

    var points = svg_scatter.selectAll().data(data);

    var player_coord = [0,0,0];

    points.enter().append("path")
      .attr("d", d3.symbol()
        .type(function(d){
          return symboltype(d.jrsmith1 + d.jrsmith2, d.name);
        })
        .size(function(d){
          return initialsize(d.jrsmith1 + d.jrsmith2, d.name);
        })
      )
      .style("fill", function(d){return symbolcolor(d.jrsmith1, d.jrsmith2, d.name);})
      .style("fill-opacity", function(d){return initialopacity(d.jrsmith1+d.jrsmith2, d.name);})
      .attr("id", function(d) {return nametoid(d.name);})
      .attr("class", "player")
      .attr("transform", function(d){
        var xval = xScale(d.dis) + 90 + (120 * (gaussianRand()));
        if (d.name == d3.select("#player").property("value")) {
          player_coord[2] = d.name;
          player_coord[0] = xval;
        }
        var yval = yScale(d.fgp);
        if (d.name == d3.select("#player").property("value")) {
          player_coord[1] = yval;
        }
        return "translate(" + xval + "," + yval + ")";
      })

      // tooltips
      .on("mouseover", function(d) { 
	      div.transition()    
	          .duration(200)    
	          .style("opacity", 0.9);    
	      coordinates = d3.mouse( d3.select("#graph-container").node() );
	      div.html(d.name)
	          .style("left", coordinates[0] + "px")
	          .style("top", coordinates[1] - 30 + "px"); 
	      svg_scatter.selectAll(".player").each(function(){
	      	var selpath = d3.select(this);
	      	if (selpath.attr("id") == nametoid(d.name)) {
	      		selpath.attr("d", d3.symbol()
                  .type(function(d){
                    return symboltype(d.jrsmith1 + d.jrsmith2, d.name);
                  })
                  .size(function(d){
                    return symbolsize((d.jrsmith1 + d.jrsmith2), d.name, 1);
                  })
                )
	      			.style("fill-opacity", 1)
	      			.raise();
	      	} else {
	      		selpath.attr("d", d3.symbol()
              .type(function(d){
                return symboltype(d.jrsmith1 + d.jrsmith2, d.name);
              })
              .size(function(d){
                return symbolsize(d.jrsmith1 + d.jrsmith2, d.name, 0);
              })
            )
	      	}
          })
          drawFrequencies(d.name);
	  	})

      .on("mouseout", function(d) {   
          div.transition()    
              .duration(500)    
              .style("opacity", 0); 
          svg_scatter.selectAll(".player").each(function(){
            var selpath = d3.select(this);
  		      selpath.attr("d", d3.symbol()
              .type(function(d){
                return symboltype(d.jrsmith1 + d.jrsmith2, d.name);
              })
              .size(function(d){
                return normalsize(d.jrsmith1 + d.jrsmith2, d.name);
              })
            )
            .style("fill-opacity", function(){return symbolopacity(selpath.attr("d"));});
          });
          svg_scatter.selectAll(".freq").remove();
        })

    // initial tooltip
    div.html(player_coord[2])
    	.style("left", player_coord[0] + "px")
    	.style("top", player_coord[1] + 154 + "px")
    	.style("opacity", 0.9);

    // key
    svg_scatter.append("line")
      .attr("x1", padding + 105)
      .attr("x2", padding + 130)
      .attr("y1", 13)
      .attr("y2", 13)
      .style("stroke-dasharray", ("3, 3"))
      .attr("stroke-width", 2)
      .style("opacity", 0.5)
      .attr("stroke", "black"); 

    svg_scatter.append("text")
      .text("League Avg 3FG%")
      .attr("x", padding + 140)
      .attr("y", 17)
      .style("font-size", "12px")
      .attr("fill", "black");  

    svg_scatter.append("path")
      .attr("d", d3.symbol()
        .type(d3.symbolSquare)
        .size(120))
      .style("fill", "red")
      .attr("transform", function(d){return "translate(" + (padding + 118) + "," + (38 + 0 * 20) + ")";});
    svg_scatter.append("text")
      .text("JR Smith Shot Selection")
      .attr("x", padding + 140)
      .attr("y", 43 + 0*20)
      .style("font-size", "12px")
      .attr("fill", "black");  

    svg_scatter.append("path")
      .attr("d", d3.symbol()
        .type(d3.symbolSquare)
        .size(120))
      .style("fill", "blue")
      .attr("transform", function(d){return "translate(" + (padding + 118) + "," + (38 + 25) + ")";});
    svg_scatter.append("text")
      .text("JR Smith Confidence")
      .attr("x", padding + 140)
      .attr("y", 43 + 25)
      .style("font-size", "12px")
      .attr("fill", "black");  

    svg_scatter.append("path")
      .attr("d", d3.symbol()
        .type(d3.symbolSquare)
        .size(120))
      .style("fill", "purple")
      .attr("transform", function(d){return "translate(" + (padding + 118) + "," + (38 + 50) + ")";});
    svg_scatter.append("text")
      .text("More JR than JR")
      .attr("x", padding + 140)
      .attr("y", 43 + 50)
      .style("font-size", "12px")
      .attr("fill", "black");  

    svg_scatter.append("path")
      .attr("d", d3.symbol()
        .type(d3.symbolStar)
        .size(120))
      .style("fill", "orange")
      .attr("transform", function(d){return "translate(" + (padding + 288) + "," + (38) + ")";});
    svg_scatter.append("text")
      .text("Real JR Smith")
      .attr("x", padding + 310)
      .attr("y", 43)
      .style("font-size", "12px")
      .attr("fill", "black");
  })
}

function drawFrequencies(name) {
  //remove old stack plot
  svg_scatter.selectAll(".freq").remove();

  //scaling
  var barScale = d3.scaleLinear()
    .domain([0, 1])
    .range([10, 460]);

  var yScale = d3.scaleLinear()
    .domain([0, 1])
    .range([460, 10]);

  var yAxis = d3.axisRight(yScale)
    .tickFormat(d3.format(".0%"));

  svg_scatter.append("g")
    .attr("class", "freq")
    .attr("transform", "translate(850," + 0 + ')')
    .call(yAxis);

  svg_scatter.append("text") //Frequency label
    .attr("class", "freq")
    .text("Frequency")
    .attr("x", 760)
    .attr("y", 20)
    .style("font-size", "20px")
    .attr("fill", "grey");

  // data
  d3.csv("data/" + d3.select("#year").property("value") + "_closestdefender_3s.csv", function(data) {
    var data = data.filter(function(d) {
      if (d.name == name) {
        return d;
      }
    });

    data.forEach(function(d) {       
      d.freq = +d.freq
      d.fga = +d.fga
    }); 

    var data = [data[0].freq, data[1].freq, data[2].freq];
    var colors = ["red", "grey", "green"];

    for (i = 0; i < 3; i++) { //bars
      svg_scatter.append("rect")
        .attr("class", "freq")
        .attr("x", 175 + i * 270)
        .attr("y", function() {
          return 460 - barScale(data[i]);
        })
        .attr("height", function() {
          return barScale(data[i]);
        })
        .attr("width", 100)
        .attr("fill-opacity", 0.7)
        .attr("fill", function() {
          return colors[i];
        });

      svg_scatter.append("text")//text
        .attr("class", "freq")
        .text(function(d) {
          return Math.round(data[i]*100).toString() + "%";
        })
        .attr("x", 175 + i * 270 + 50)
        .attr("y", function(d) {
          return 460 - barScale(data[i])/2;
        })
        .style("text-anchor", "middle")
        .style("alignment-baseline", "middle")
        .style("fill", "white")
        .style("font-size", "25px")
        .style("font-weight", "bold");
    }  
  });
}

// refresh dropdown
function refreshdropdown() {
  var dropdown = d3.select("#player");

  dropdown.selectAll("*").remove()

  d3.csv("data/" + d3.select("#year").property("value") + "_closestdefender_3s.csv", function(data) {
    var data = data.filter(function(d) {
        if (d.dis == "0-4 Feet") {
          return d;
        }
      });
    data = data.sort(function(a,b){return d3.ascending(a.name, b.name)});
    dropdown.selectAll("option").data(data).enter().append("option")
      .text(function(d){return d.name;})
      .attr("value", function(d){return d.name;})
      .attr("selected", function(d){
        if (d.name == "JR Smith") {
          return "selected";
        }
      });
  });
}

// Misc. FUnctions
function avgeFG(year) {
	if (year == "2016-17") {
		return 0.358;
	}
	else if (year == "2015-16") {
		return 0.354;
	}
	else if (year == "2014-15") {
		return 0.350;
	}
	else if (year == "2013-14") {
		return 0.360;
	}
}

function symboltype(val, name) {
  if (nametoid(name) == "JRSmith") {
    return d3.symbolStar
  }
  else if (val > 0) {
    return d3.symbolSquare;
  }
  else {
    return d3.symbolCircle;
  }
}

function symbolcolor(jrsmith1, jrsmith2, name) {
  if (nametoid(name) == "JRSmith") {
    return "orange"
  }
  else if (jrsmith1 && !jrsmith2) {
    return "blue";
  }
  else if (jrsmith2 && !jrsmith1) {
    return "red";
  }
  else if (jrsmith1 && jrsmith2) {
    return "purple";
  }
  else {
    return "black";
  }
}

function initialsize(val, name) {
  if (nametoid(name) == nametoid(d3.select("#player").property("value"))) {
    if (nametoid(name) == "JRSmith") {
      return 250;
    } else if (val > 0) {
      return 250;
    } else {
      return 180;
    }
  } else if (nametoid(name) == "JRSmith") {
    return 30;
  }
	else if (val > 0) {
    return 30;
  } else {
    return 5;
  }
}

function normalsize(val, name) {
  if (nametoid(name) == "JRSmith") {
    return 120;
  }
  else if (val > 0) {
    return 120;
  } else {
    return 20;
  }
}

function symbolsize(val, name, toggle) {
    if (nametoid(name) == "JRSmith" && toggle == 1) { //JR
        return 250;
    } else if (nametoid(name) == "JRSmith" && toggle == 0) {
        return 30;
    } else if (val > 0 && toggle == 1) { //Selected JR-like
      	return 250;
    } else if (val > 0 && toggle == 0) { //JR-like
      	return 30;
    } else if (val == 0 && toggle == 1) { //Selected non-JR-like
        return 180;
    } else if (val == 0 && toggle == 0) {
        return 5;
    }
}

function initialopacity(val, name) {
  if (nametoid(name) == nametoid(d3.select("#player").property("value"))) {
    return 1
	} else if (val > 0 || nametoid(name) == "JRSmith") {
    return 1;
  } else {
    return 0.5;
  }
}

function symbolopacity(d) {
  if (d.substring(0,2) == "M-" || d.substring(0,2) == "M0") {
    return 1;
  } else {
    return 0.5;
  }
}

function gaussianRand() {
  var rand = 0;

  for (var i = 0; i < 6; i += 1) {
    rand += Math.random();
  }

  return (rand / 6) - 0.5;
}

function nametoid(name) {
	return (name.replace(/\s+/g, '').replace('.', '').replace("'", ''));
}
