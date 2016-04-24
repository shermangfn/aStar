var myApp = angular.module('myApp',[]);

myApp.controller('aStarController', ['$scope', function($scope) {
  // $scope.variables
  $scope.showRun = true;
  $scope.numRows = 35;
  $scope.numCols = 35;
  $scope.finishSquare = Math.floor($scope.numRows * $scope.numCols/2)+ Math.floor($scope.numCols/2) + 1;
  $scope.startSquare = Math.floor($scope.numRows * $scope.numCols/2)- Math.floor($scope.numCols/2) + 1;
  $scope.numbersArray = [];
  $scope.wallList = [];
  $scope.heuristic = 0;
  // variables
  var pNudge = 1/50;
  var pathExists = true;
  var squareSize = 15;
  var offset = squareSize / 10
  var openList = [];
  var closedList = [];
  var currentNode = {};
  var finalPath = [];
  var goalReached = false;
  var maxValue = ($scope.numRows * $scope.numCols) + 1;
  var fScore = [];
  var gScore = [];
  var hScore = [];
  var parent = [];
  var startNode = 0;
  var goalNode = 0;
  var squares= [];
  //             green      red        blue       grey       white    pink
  var colors =["#5cb85c", "#d9534f", "#428bca", "#545454", "#f9f9f9", "#EAADEA"];
  var selected = null;
  var squares = [];
  var visited = [];
  var stage = new createjs.Stage(document.getElementById("demoCanvas"));
  // setup
  for(var i = 1; i<($scope.numRows * $scope.numCols); ++i) {
      $scope.numbersArray.push(i);
  }
  for(var i = 228; i<($scope.numRows * $scope.numCols - 228); i += 35) {
    $scope.wallList.push(i);
  }
  //watch for changes
  $scope.$watch('heuristic', function (newValue) {
    $scope.run();
    $scope.showRun = false;
  });
  // $scope.$watch('numRows', function (newValue) {
  //   //if(newValue > 20) $scope.numRows = 20;
  //   $scope.finishSquare = Math.floor($scope.numRows * $scope.numCols/2)+ Math.floor($scope.numCols/2) + 1;
  //   $scope.startSquare = Math.floor($scope.numRows * $scope.numCols/2)- Math.floor($scope.numCols/2) + 1;
  //   $scope.wallList = [105];
  //   $scope.reset();
  //   $scope.refreshView();
  //   $scope.showRun = true;
  // });
  // $scope.$watch('numCols', function (newValue) {
  //   //if(newValue > 20) $scope.numCols = 20;
  //   $scope.startSquare = Math.floor($scope.numRows * $scope.numCols/2) - Math.floor($scope.numCols/2) + 1;
  //   $scope.finishSquare = Math.floor($scope.numRows * $scope.numCols/2)+ Math.floor($scope.numCols/2) + 1;
  //   $scope.wallList = [105];
  //   $scope.reset();
  //   $scope.refreshView();
  //   $scope.showRun = true;
  // });

  // $scope functions
  $scope.run = function () {
    $scope.reset();
    // put the start node on the open list
    startNode = $scope.startSquare;
    goalNode = $scope.finishSquare;
    var node = $scope.startSquare;
    openList.push(startNode);
    // make sure the closed list is empty
    closedList = [];
    // while the goal is not reached
    while(!goalReached){
      // current node = the lowest f score in open list
      var current = getLowestFScore();
      //console.log("current is " + current )
      if(angular.isUndefined(current)) {
        //console.log("4" + JSON.stringify(current));
        goalReached = true;
        pathExists = false;
      } else {
          //console.log("4" + JSON.stringify(current));
          // remove the curent from open and
          removeFromOpenList(current);
          // add current to the closed list
          closedList.push(current);
          if(checkStop(current)) goalReached = true;
          //console.log("4" + JSON.stringify(closedList));
          // get all the neighbors of current
          var neighbors = buildAdjacentList(current);
          for(var i in neighbors) {
            if(isWalkable(neighbors[i])){
              visited.push(neighbors[i]);
              //console.log("5" + JSON.stringify(neighbors));
              // calculate the scores for each one
              gScore[neighbors[i]] = calculateG(neighbors[i]);
              hScore[neighbors[i]] = calculateH(neighbors[i]);
              fScore[neighbors[i]] = calculateF(neighbors[i]);
              // if neighbor is in the open list and cost less than g(neighbor):
              if(onOpenList(neighbors[i]) && fScore[current] < gScore[neighbors[i]]){
                // remove neighbor from OPEN, because new path is better
                removeFromOpenList(neighbors[i]);
              }
              // if neighbor in CLOSED and cost less than g(neighbor):
              if(onClosedList(neighbors[i]) && fScore[current] < gScore[neighbors[i]]) {
                // remove neighbor from CLOSED
                removeFromClosedList(neighbors[i]);
              }
              // if neighbor not in OPEN and neighbor not in CLOSED:
              if(!onOpenList(neighbors[i]) && !onClosedList(neighbors[i])){
                // set g(neighbor) to cost
                gScore[neighbors[i]] = fScore[current];
                // add neighbor to OPEN
                openList.push(neighbors[i]);
                // set priority queue rank to g(neighbor) + h(neighbor)
                fScore[neighbors[i]] = calculateF(neighbors[i]);
                // set neighbor's parent to current
                parent[neighbors[i]] = current;
              } // end if
            }// end if walkable
            if(checkStop(current)) goalReached = true;
          } // end for loop
        } // end else
      } //end while
      if(pathExists == true) {
        finalPath = savePath(current);
        //console.log("*** final path is " + JSON.stringify(finalPath));
        // reconstruct reverse path from goal to start
      } else {
        pathExits = true;
      }
      $scope.refreshView();
  }
  $scope.toggleWall = function (node) {
    if(isWall(node.target.name)) {
      //console.log(node.target.name + " **** already a wall ");
      for(var i in $scope.wallList){
        if(node.target.name == $scope.wallList[i])
          $scope.wallList.splice(i,1);
      }
    } else if (node.target.name != $scope.startSquare && node.target.name != $scope.finishSquare){
      //console.log(node.target.name + " not a wall");
      node.target.graphics.beginStroke("black").beginFill("black");
      node.target.graphics.drawRect(node.target.x*squareSize,node.target.y*squareSize,squareSize,squareSize);
      stage.update(node);
      $scope.wallList.push(node.target.name);
      //console.log("*** walls " +JSON.stringify($scope.wallList))
      $scope.refreshView();
      //console.log("**** wall list is now " + JSON.stringify($scope.wallList));
    }
    //$scope.refreshView();
    $scope.run();
  }
  $scope.refreshView = function () {
    stage.removeAllChildren();
    stage.update();
    var square;
    var text;
    var squareNumber = 1;
    for (var y = 0; y < $scope.numRows; y++) {
      for (var x = 0; x < $scope.numCols; x++) {
        //console.log("***** looping in squares" );
        var color = colors[getColor(squareNumber)];
        square = new createjs.Shape();
        text = new createjs.Text(squareNumber);
        square.graphics.beginStroke("black").beginFill(color);
        square.graphics.drawRect(0, 0, squareSize, squareSize);
        square.x = x * squareSize;
        square.y = y * squareSize;
        square.name = squareNumber;
        square.on("click", function(evt) {
            $scope.toggleWall(evt);
        });
        text.x = x * squareSize + offset;
        text.y = y * squareSize + offset;
        square.id = squareNumber;
        stage.addChild(square);
        //stage.addChild(text);
        var id = square.x + "_" + square.y;
        squares[id] = square;
        ++squareNumber;
      }
    }
    stage.update();
  }
  // movement arrows
  $scope.greenUp = function () {
    if(!($scope.startSquare - $scope.numCols < 1)) $scope.startSquare -= $scope.numCols;
    while(isWall($scope.startSquare)){
      $scope.startSquare -= $scope.numCols;
      if($scope.startSquare < 1) {
        while(isWall($scope.startSquare) || $scope.startSquare < 1){
          $scope.startSquare += $scope.numCols;
        }
      }
    }
    $scope.run();
  };
  $scope.greenDown = function () {
    if(!($scope.startSquare + $scope.numCols > $scope.numCols*$scope.numRows)) $scope.startSquare += $scope.numCols;
    while(isWall($scope.startSquare)){
      $scope.startSquare += $scope.numCols;
      if($scope.startSquare > $scope.numCols*$scope.numRows) {
        while(isWall($scope.startSquare) || $scope.startSquare > $scope.numCols*$scope.numRows){
          $scope.startSquare -= $scope.numCols;
        }
      }
    }
    $scope.run();
  };
  $scope.greenLeft = function () {
    if(!($scope.startSquare - 1 < 1)) $scope.startSquare -= 1;
    while(isWall($scope.startSquare)){
      $scope.startSquare -= 1;
      if($scope.startSquare < 1) {
        while(isWall($scope.startSquare) || $scope.startSquare < 1){
          $scope.startSquare += 1;
        }
      }
    }
    $scope.run();
  };
  $scope.greenRight = function () {
    if(!($scope.startSquare + 1 > $scope.numCols*$scope.numRows)) $scope.startSquare += 1;
    while(isWall($scope.startSquare)){
      $scope.startSquare += 1;
      if($scope.startSquare > $scope.numCols*$scope.numRows) {
        while(isWall($scope.startSquare) || $scope.startSquare > $scope.numCols*$scope.numRows){
          $scope.startSquare -= 1;
        }
      }
    }
    $scope.run();
  };
  $scope.redUp = function () {
    if(!($scope.finishSquare - $scope.numCols < 1)) $scope.finishSquare -= $scope.numCols;
    while(isWall($scope.finishSquare)){
      $scope.finishSquare -= $scope.numCols;
      if($scope.finishSquare < 1) {
        while(isWall($scope.finishSquare) || $scope.finishSquare < 1){
          $scope.finishSquare += $scope.numCols;
        }
      }
    }
    $scope.run();
  };
  $scope.redDown = function () {
    if(!($scope.finishSquare + $scope.numCols > $scope.numCols*$scope.numRows)) $scope.finishSquare += $scope.numCols;
    while(isWall($scope.finishSquare)){
      $scope.finishSquare += $scope.numCols;
      if($scope.finishSquare > $scope.numCols*$scope.numRows) {
        while(isWall($scope.finishSquare) || $scope.finishSquare > $scope.numCols*$scope.numRows){
          $scope.finishSquare -= $scope.numCols;
        }
      }
    }
    $scope.run();
  };
  $scope.redLeft = function () {
    if(!($scope.finishSquare - 1 < 1)) $scope.finishSquare -= 1;
    while(isWall($scope.finishSquare)){
      $scope.finishSquare -= 1;
      if($scope.finishSquare < 1) {
        while(isWall($scope.finishSquare) || $scope.finishSquare < 1){
          $scope.finishSquare += 1;
        }
      }
    }
    $scope.run();
  };
  $scope.redRight = function () {
    if(!($scope.finishSquare + 1 > $scope.numCols*$scope.numRows)) $scope.finishSquare += 1;
    while(isWall($scope.finishSquare)){
      $scope.finishSquare += 1;
      if($scope.finishSquare > $scope.numCols*$scope.numRows) {
        while(isWall($scope.finishSquare) || $scope.finishSquare > $scope.numCols*$scope.numRows){
          $scope.finishSquare -= 1;
        }
      }
    }
    $scope.run();
  };
  $scope.clearWalls = function(){
    $scope.wallList = [];
    $scope.reset();
    $scope.refreshView();
    $scope.showRun = true;
  }
  $scope.randomSquares = function () {
    //console.log("*** called random squares ");
    for(var i = 1; i < 20; ++i){
      var random = Math.floor(Math.random() * ($scope.numRows * $scope.numCols)-1)
      if(random != $scope.startSquare || random != $scope.finishSquare)
        $scope.wallList.push(random);
    }
    $scope.refreshView();
  }
  // Pre mad scenes for demonstrations
  $scope.scenario1 = function () {
    $scope.reset();
    $scope.startSquare = 1;
    $scope.finishSquare = $scope.numCols * $scope.numRows;
    $scope.wallList = [];
    $scope.refreshView();
  }
  $scope.scenario2 = function () {
    $scope.reset();
    $scope.startSquare = 596;
    $scope.finishSquare = 630;
    $scope.wallList = [];
    $scope.refreshView();
  }
  $scope.scenario3 = function () {
    $scope.reset();
    $scope.startSquare = 500;
    $scope.finishSquare = 516;
    $scope.wallList = [];
    $scope.refreshView();
  }
  $scope.scenario4 = function () {
    $scope.reset();
    $scope.startSquare = 528;
    $scope.finishSquare = 136;
    $scope.wallList = [
      788,227,226,225,224,223,221,220,
      219,218,216,217,215,214,787,786,
      785,784,783,782,781,780,779,777,
      778,774,775,776,789,790,791,792,
      793,794,229,230,231,232,233,234,
      235,236,237,273,308,343,378,413,
      448,483,518,553,588,623,658,693,
      728,763,798,797,796,795,222,228,
      238
    ];
    $scope.refreshView();
  }
  $scope.scenario5 = function () {
    $scope.reset();
    $scope.startSquare = 143;
    $scope.finishSquare = 340;
    $scope.wallList = [
      263,298,333,368,403,438,473,508,543,
      578,613,648,683,718,753,788,823,858,
      893,928,963,163,198,268,233,303,338,
      373,408,443,478,513,1038,1003,968,933,
      898,863,828,793,758,723,688,653,618,
      583,548,998,1033,228,193,158
    ];
    $scope.refreshView();
  }
  $scope.scenario6 = function () {
    $scope.reset();
    $scope.startSquare = 596;
    $scope.finishSquare = 630;
    $scope.wallList = [
      206,556,174,911,332,543,378,887,205,251,325,997,623,468,100,830,750,
      615,959,937,418,510,830,649,419,355,383,1191,411,124,359,316,392,1117,
      1188,469,631,349,945,972,1218,231,311,270,897,271,934,258,92,639,802,
      1010,985,820,341,155,1196,788,381,155,96,198,674,768,1138,383,776,746,
      985,883,1057,569,532,158,1080,276,1134,76,1110,217,1200,784,1069,816,
      639,1213,865,909,1024,66,231,957,131,449,675,78,1002,827,962,550,1154,
      59,962,780,353,800,954,1080,1162,1180,1074,552,652,708,995,731,410,244,
      146,240,49,67,53,839,177,545,618,666,692,274,714,473,339,371,896,516,
      1028,952,895,12,359,801,878,1096,614,771,792,806,243,1061,477,412,959,
      442,956,1096,339,22,411,581,554,447,764,35,864,956,61,188,465,1031,517,
      1212,327,1137,451,775,753,713,467,859,680,813,1196,1130,420,432,848,
      1215,1136,1038,469,420,509,111,386,749,519,247,459,1102,780,414,855,
      454,160,1123,907,968,65,329,859,1007,764,790,942,202,1212,284,1200,1153,
      931,910,316,11,603,1039,268,1180,389,247,742,235,607,1105,1086,4,929,
      889,433,1114,208,62,495,400,380,767,715,461,184,996,89,459,61,222,1018,
      805,1100,55,235,883,1191,600,789,72,927,1050,736,1158,868,266,482,1075,
      585,81,631,620,933,956,787,718,529,464,170,633,282,482,981,99,996,474,
      223,869,871,1000,71,817,901,705,1085,810,704,701,265,890,827,269,1179,
      693,51,320,338,743,733,561,940,781,431,1156,923,655,399,351,914,201,724,
      271,1204,933,862,273,214,878,206,782,174,1068,28,164,548,1156,605,214,
      1069,61,1070,720,666,1034,439,408,154,242,1110,831,922,1072,1221,1033,
      355,707,711,742,688,978,733,1095,447,621,1047,263,406,1047,583,707,343,
      194,32,870,991,390,385,419,957,412,857,918,376,154,1101,11,987,509,1182,
      515,1201,559,892,533,607,1060,164,111,1088,404,369,725,760,795,1042,293,
      328,326,1045,975,50,39,74,77,7,42,46,159,127,128,129,252,253,254,394,299,
      264,306,229,262,261,260,225,157,192,122,120,48,117,79,44,249,179,144,219,
      497,462,427,492,493,494,1053,948,983,913,947,986,988,989,990,616,645,364,
      832,166,729,656,908,665,664,663,662,661,660,625,590,574,539,504,965
      ];
    $scope.refreshView();
  }
  $scope.reset = function () {
    //console.log("*** reset called ");
    fScore = [];
    gScore = [];
    hScore = [];
    parent = [];
    openList = [];
    closedList = [];
    finalPath = [];
    visited = [];
    goalReached = false;
    pathExists = true;
    startNode = 1;
    goalNode = $scope.numRows * $scope.numCols;
    $scope.refreshView();
  }
  //helper functions
  var getRandomNumber = function (){
      return Math.floor(Math.random() * $scope.numRows * $scope.numCols);
  }
  var buildAdjacentList = function (node) {
    var adjList = [];
    var adjNode = {};
    //north
    if(!(node <= $scope.numCols) && !(onClosedList(node-$scope.numCols)))
      adjList.push(node - $scope.numCols); //console.log("***north  build adj list " + JSON.stringify(adjList));
    //east
    //console.log("*** build adj list node " + JSON.stringify(node));
    if(!(node % $scope.numCols == 0) && !(onClosedList(node+1)))
      adjList.push(node + 1);
      //console.log("*** build adj list node " + JSON.stringify(node));
      //console.log("*** east build adj list " + JSON.stringify(adjList));
    //south
    if(!(node > ($scope.numCols * $scope.numRows) - $scope.numCols) && !(onClosedList(node+$scope.numCols)))
      adjList.push(node+$scope.numCols);
      //console.log("***south  build adj list " + JSON.stringify(adjList));
    //west
    if(!(node % $scope.numCols == 1) && !(onClosedList(node-1)))
      adjList.push(node-1);
      //console.log("*** west build adj list " + JSON.stringify(adjList));
    return adjList;
  }
  var calculateF = function (node) {
    var cost = 0;
    cost = calculateG(node) + calculateH(node);
    //console.log("*** calc f for "+node +" is " + JSON.stringify(cost));
    return cost;
  }
  var calculateG = function (node) {
    var cost = 0;
    var x = 0;
    var y = 0;
    if(node % $scope.numCols == 0) x = $scope.numCols;
    else x = node%$scope.numCols;
    y = Math.ceil(node/$scope.numCols);
    var startX = 0;
    var startY = 0;
    if(startNode%$scope.numCols == 0) startX = $scope.numCols;
    else startX = startNode%$scope.numCols;
    startY = Math.ceil(startNode/$scope.numCols);
    var dx = Math.abs(x - startX);
    var dy = Math.abs(y - startY);
    cost = (dx + dy);
    //console.log("*** calc g for "+node +" is " + JSON.stringify(cost));
    return cost;
  }
  var calculateH = function (node) {
    var cost = 0;
    var x = 0;
    var y = 0;
    if(node%$scope.numCols == 0) x = $scope.numCols;
    else x = node%$scope.numCols;
    y = Math.ceil(node/$scope.numCols);
    var goalX = 0;
    var goalY = 0;
    if(goalNode%$scope.numCols == 0) goalX = $scope.numCols;
    else goalX = goalNode%$scope.numCols;
    goalY = Math.ceil(goalNode/$scope.numCols);
    var dx = Math.abs(x -  goalX);
    var dy = Math.abs(y -  goalY);
    cost = (dx + dy);
    // **** p nudge
    pNudge = 1/50  * Math.sqrt(dx * dx + dy * dy)
    // *** end p nudge
    // **** cross
    var startX = 0;
    var startY = 0;
    if(startNode%$scope.numCols == 0) startX = $scope.numCols;
    else startX = startNode%$scope.numCols;
    startY = Math.ceil(startNode/$scope.numCols);
    var dx1 = x - goalX;
    var dy1 = y - goalY;
    var dx2 = startX - goalX;
    var dy2 = startY - goalY;
    var cross = Math.abs(dx1*dy2 - dx2*dy1);
    // **** end cross
    //console.log("*** calc h for "+node +" is " + JSON.stringify(cost));
    if($scope.heuristic == 0)
      return cost;
    if($scope.heuristic == 1)
    return cost *= (1.0 + pNudge);;
    if($scope.heuristic == 2)
    return cost += cross*0.001;
  }
  var onOpenList = function (node) {
    var response = false;
    for(var i in openList) {
      if(openList[i] == node)
        response = true;
    }
    //console.log("*** on open" + JSON.stringify(response));
    return response;
  }
  var onClosedList = function (node) {
    var response = false;
    for(var i in closedList) {
      if(closedList[i] == node)
        response = true;
    }
    //console.log("*** on closed " + JSON.stringify(response));
    return response;
  }
  var isSelected = function (node) {
    var response = false;
    for(var i in finalPath) {
      if(finalPath[i] == node)
        response = true;
    }
    //console.log("*** is selected " + JSON.stringify(response));
    return response;
  }
  var checkStop = function (node) {
    var response = false;
    for(var i in closedList) {
      if(closedList[i] == goalNode)
        response = true;
    }
    //console.log("*** check stop is " + JSON.stringify(response));
    return response;
  }
  var isWalkable = function (node) {
    if(node > 0 && node < maxValue && !isWall(node) )
      return true;
    else return false;
  }
  var isWall = function (node) {
    var response = false;
    for(var i in $scope.wallList) {
      if($scope.wallList[i] == node)
        response = true;
    }
    //console.log("*** is wall " + JSON.stringify(response));
    return response;
  }
  var savePath = function () {
    var path = [];
    var square = goalNode;
    // push parents into an array
    while(square!=startNode) {
      path.push(square);
      square = parent[square];
    }
    path.push(startNode);
    // then reverse the array and you have the path
    //console.log("*** Path following parents " + JSON.stringify(path));
    return path.reverse();
  }
  var removeFromOpenList = function (node) {
    //console.log("*** removing from open list" + JSON.stringify(node));
    for(var i in openList) {
      //console.log("*** openlist i " + openList[i] + " == " + node)
        if(openList[i] == node) {
          //console.log("*** match in open list, is " + JSON.stringify(openList));
          openList.splice(i , 1);
          //console.log("*** now it is " + openList);
        }
    }
  }
  var removeFromClosedList = function (node) {
    //console.log("*** removing from closed list" + JSON.stringify(node));
    for(var i in closedList) {
        if(openList[i] == node) {
          //console.log("*** match in closed list, is " + JSON.stringify(closedList));
          closedList.splice(i , 1);
          //console.log("*** now it is " + closedList);
        }
    }
  }
  var getLowestFScore = function () {
    //console.log("*** openlist is " + JSON.stringify(openList))
    var lowestFScore = openList[0];
    for(var i in openList) {
      if(fScore[openList[i]] < fScore[lowestFScore]) lowestFScore = openList[i];
    }
    return lowestFScore;
  }
  var isVisited = function (node){
    var response = false;
    for(var i in visited) {
      if(visited[i] == node)
        response = true;
    }
    //console.log("*** is wall " + JSON.stringify(response));
    return response;
  }
  var getColor = function (square) {
    if(square == $scope.startSquare) return 0;
    if(square == $scope.finishSquare) return 1;
    if (isSelected(square)) return 2;
    if(isWall(square)) return 3;
    if(isVisited(square)) return 5;
    return 4;
  }
  // call refresh view to build the stage intially
  $scope.refreshView();
}]);
