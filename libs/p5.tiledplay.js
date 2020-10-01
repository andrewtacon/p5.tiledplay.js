/*
	Written and published by Andrew Tacon 2020
	
*/

/* 

    getTilemapLayers function takes tilemap that has been created using the 'loadTiledMap' function
    from the p5.tiledmap.js librray.
    
    e.g. tmap = loadTiledMap("test", "data");

    It takes this map and splits it into layers contain sprites that can be used for collision detection.

*/


function getTilemapLayers(tmap){

    /*
        This internal function pulls all the individual boxes from the tile layer.
        It the aggregates (joins) them together to form big rectangles.
        Ths decreases the number of sprites SIGNIFICANTLY so it doesn't
        impact the game play if you have a large level with lots of big platforms.
    */
    
    
    function createLayerFromTiled(layerNumber,tmap){
    
        let newlayer = new Group();
        
        let boxData = []
        
        sizex = tmap.getTileSize().x
        sizey = tmap.getTileSize().y
        
        for (let x=0; x<tmap.getMapSize().x; x=x+1){
            
            //going to firstly split everything into column units
            let units = 0;
            
            for (let y=0; y<tmap.getMapSize().y; y=y+1){
                let index = tmap.getTileIndex(layerNumber,x,y);
                if (index===0 || y===tmap.getMapSize().y-1){
                    
                    if (units!==0){
                        
                        let yoffset=0;
                        if (index!==0 && y===tmap.getMapSize().y-1){
                            units++;
                            yoffset=1;
                        }
                        
                        //this data needs to be stored as an object and then processed to find horizontal matches
                        //to reduce the sprite count in a second pass
                        
                        let newBox = {};
                        newBox.x = (x+0.5)*sizex;
                        newBox.y=(y-units*.5+yoffset)*sizey;
                        newBox.width = sizex;
                        newBox.height = sizey*units;
                        
                        boxData.push(newBox);
                        
                    } 
                    units=0;                    
                    
                } else {
                    units++;
                }
            }
        }
    
        //sort the boxes by hieht, then y, then x
        boxData.sort(
            function(a,b){
                //sort on height
                if (a.height>b.height){return -1;}   
                if (a.height < b.height){return 1;}
                
                //heights equal, sort on y value
                if (a.y > b.y){return 1;}
                if (a.y<b.y){return -1;}
                
                //height equal, y equal, sort on x
                if (a.x > b.x){return 1;}
                if (a.x<b.x){return -1;}
                
                //default
                return 1;
            }
        )
    
        //now merge the boxes
        
        let rx,ry,rh,rw,rworiginal;
        for (let i=0; i<boxData.length; i++){
            if (rx===undefined){
                rx = boxData[i].x;
                ry = boxData[i].y;
                rh = boxData[i].height;
                rw = boxData[i].width;
                rworiginal = boxData[i].width;
                
                //this is here in case the layer only ends up with one box to collide with in it
                if (boxData.length===1) {
                    let newTile = createSprite( rx+rw/2-rworiginal/2, ry,   rw,rh);
                    newlayer.add(newTile);
                }
                continue;
            }
            
            if (boxData[i].height!==rh || boxData[i].y!==ry || boxData[i].x!==boxData[i-1].x+boxData[i-1].width){
                //not next to each other
                let newTile = createSprite( rx+rw/2-rworiginal/2, ry,   rw,rh);
                newlayer.add(newTile);
                rx = boxData[i].x;
                ry = boxData[i].y;
                rh = boxData[i].height;
                rw = boxData[i].width;
                rworiginal = boxData[i].width;
            } else {
                //next to each other
                rw = rw + boxData[i].width;
            }
            
            //make sure to process the last tile that is checked
            if (i===boxData.length-1){
                let newTile = createSprite( rx+rw/2-rworiginal/2, ry,   rw,rh);
                newlayer.add(newTile);
            }
            
        }
        
        return newlayer;
    }

    let layers = [];
    for (let l=0; l< TileMaps[Object.keys(TileMaps)[0]].layers.length; l++){
      let layerName = TileMaps[Object.keys(TileMaps)[0]].layers[l].name;
      layers[l] = createLayerFromTiled(l,tmap);
      console.log("Layer "+l+": "+layerName);
    }
    
    return layers;
}


/* 

    the getTilemapImages function creates images that match the layers imported into the project 
    using the 'loadTiledMap' function from the p5.tiledmap.js librray.
    
    e.g. 
        tiledmap = loadTiledImage("test", "data");
        layerImages = getTilemapImages(tiledmap);

*/


function getTilemapImages(tiledmap){
    
    let layers = [];
    for (let l=0; l< TileMaps[Object.keys(TileMaps)[0]].layers.length; l++){
        layers[l] =  createGraphics(tiledmap.getMapSize().x*tiledmap.getTileSize().x, tiledmap.getMapSize().y*tiledmap.getTileSize().x);
        tiledmap.drawLayer(l, 0,0, layers[l]);
    }

    return layers;

}


/* 
    This function takes the player and tiledmap imported and works out where the camera shoudl be.
    It prevents the camer showing areas outside of the tilemap.
    
    e.g.
        //focus the camera at the end
        focusCamera(player, tiledmap); 
        
    player here is a sprite
    tiledmap = loadTiledImage("test", "data");   (this is the import using the p5.tiledmap.js library)
    
*/

function focusCamera(player, tiledmap){
    let x = player.position.x;
    let y = player.position.y;
    
    
    if (player.position.x < width/2){
        x = width/2;
    }
    if (player.position.x > (tiledmap.getMapSize().x*tiledmap.getTileSize().x - width/2)){
        x = tiledmap.getMapSize().x*tiledmap.getTileSize().x - width/2;
    }

    if (player.position.y<height/2){
        y = height/2;
    }
    if (player.position.y > (tiledmap.getMapSize().y*tiledmap.getTileSize().y-height/2)){
        y = tiledmap.getMapSize().y*tiledmap.getTileSize().y - height/2;
    }

    camera.position.x = x;
    camera.position.y = y;
    camera.zoom = 1

}


/*
    This function prevents the player from moving beyond the edges of the map
    
    It s run like this:
    
    checkWorldBounds(player,tiledmap);
    
    It adjust the player velocity and position if required.
       
*/


function checkWorldBounds(player,tiledmap){
    
    if (player.position.x < player.width/2){
        player.velocity.x = 0;
        player.position.x = player.width/2;
    }
    
    if (player.position.x > ((tiledmap.getMapSize().x+1)*tiledmap.getTileSize().x) - player.width){
        player.velocity.x=0;
        player.position.x = ((tiledmap.getMapSize().x+1)*tiledmap.getTileSize().x) - player.width;
    }
   
    if (player.position.y<0){
        player.position.y=0;
    }
    
    if (player.position.y>  tiledmap.getMapSize().y*tiledmap.getTileSize().y - player.height){
        player.position.y= tiledmap.getMapSize().y*tiledmap.getTileSize().y - player.height;
    }
   
}


/*
    
    this function detects if the sprite sent is in contact with the layer(s) that are sent with it.
    
    It takes at least TWO values.
    
    Value 1 is the sprite that is being checked, values 2 through to whatever are layers to check against.
    
    It returns an object.
    
    The object has 9 values. Here we will call the object result`

    result.left  -> true/false -> is the sprite in contact with something to the left
    result.right  -> true/false -> is the sprite in contact with something to the right
    result.above  -> true/false -> is the sprite in contact with something above it
    result.below  -> true/false -> is the sprite in contact with something below it
    result.any  -> true/false -> is the sprite in contact with any of the above 4 options
    result.leftDistance -> number of pixels of object in contact to the left or 0
    result.rightDistance -> number of pixels of object in contact to the right or 0
    result.aboveDistance -> number of pixels of object in contact to the above or 0
    result.belowDistance -> number of pixels of object in contact to the below or 0

*/

let isInContactDebug = false;

function isInContact(...data) { //item, others){
    
    
    let item = data[0];
    let otherList = [];
    
    for (let i=1; i<data.length; i++){
        otherList.push(data[i]);
    }

    let results ={};
    results.left=false;
    results.right=false;
    results.above=false;
    results.below= false;
    results.leftDistance=0;
    results.rightDistance=0;
    results.aboveDistance=0;
    results.belowDistance=0;
   
 

    for (let k=0; k<otherList.length; k++){
        let others = otherList[k];
    
        for (let i=0; i< others.length; i++){
            strokeWeight(2);
            if (isInContactDebug){rect(others[i].position.x-others[i].width/2, others[i].position.y-others[i].height/2, others[i].width, others[i].height);}
    
            let targetx = item.position.x-item.width/2 + item.velocity.x;
            let targety = item.position.y;
    
            for (let targety = item.position.y - item.height/3; targety< item.position.y+item.height/3; targety += item.height/6){
                if ( others[i].position.x-others[i].width/2 < targetx && others[i].position.x+others[i].width/2>targetx){
                    if ( others[i].position.y-others[i].height/2 < targety && others[i].position.y+others[i].height/2>targety){
                        results.left = true;            
                        let tx = item.position.x-item.width/2;
                        let ox = others[i].position.x+others[i].width/2;
                        let dx = ox - tx;
                        results.leftDistance = Math.max(results.leftDistance, dx);
                        if (isInContactDebug){circle(targetx, targety,2);}

                    }
                }

            }
    
            targetx = item.position.x+item.width/2+item.velocity.x;
            for (let targety = item.position.y - item.height/3; targety< item.position.y+item.height/3; targety+=item.height/6){
            
                if ( others[i].position.x-others[i].width/2 < targetx && others[i].position.x+others[i].width/2>targetx){
                    if ( others[i].position.y-others[i].height/2 < targety && others[i].position.y+others[i].height/2>targety){
                        results.right = true; 
                        let tx = item.position.x+item.width/2;
                        let ox = others[i].position.x-others[i].width/2;
                        let dx = tx-ox;
                        results.rightDistance = Math.max(results.rightDistance, dx);
                        if (isInContactDebug){circle(targetx, targety,2)};

                    }
                }
            //       circle(targetx, targety,2)
          
            }
    
            targetx = item.position.x;
            targety = item.position.y - item.height/2 + item.velocity.y;
    
            for (let targetx = item.position.x - item.width/3; targetx< item.position.x+item.width/3; targetx+=item.width/6){
               
                if ( others[i].position.x-others[i].width/2 < targetx && others[i].position.x+others[i].width/2>targetx){
                    if ( others[i].position.y-others[i].height/2 < targety && others[i].position.y+others[i].height/2>targety){
                        results.above = true;   
                        let ty = item.position.y-item.height/2;
                        let oy = others[i].position.y+others[i].height/2;
                        let dy = ty - oy;
                        results.aboveDistance = Math.max(results.aboveDistance, dy);
                        if (isInContactDebug){circle(targetx, targety,2);}

                    }
                }
             //   circle(targetx, targety,2)

            }
            
             targety = item.position.y + item.height/2 + item.velocity.y;
    
            for (let targetx = item.position.x - item.width/3; targetx< item.position.x+item.width/3; targetx+=item.width/10){
                if ( others[i].position.x-others[i].width/2 < targetx && others[i].position.x+others[i].width/2>targetx){
                    if ( others[i].position.y-others[i].height/2 < targety && others[i].position.y+others[i].height/2>targety){
                        results.below = true;            
                        let ty = item.position.y+item.height/2;
                        let oy = others[i].position.y-others[i].height/2;
                        let dy = oy - ty;
                        results.belowDistance = Math.max(results.belowDistance, dy);
                        if (isInContactDebug){circle(targetx, targety,2);}

                    }
                }
          
            }
        }
    }
    
    
    results.any = results.left || results.right || results.above || results.below;
    
    return results;
}


/*
    This function stops the player walking partially through objects
    
    it should be run as
    playerBrake(player, blocked)

    where player is the sprite being tested
    
    blocked is the result of using the isInContact function with the same player and a layer
     let blocked = isInContact(player,layer[GROUND]);

*/

function playerBrake(playerx, blocked){
     if (blocked.below){
        player.velocity.y=0;
        player.position.y = player.position.y - blocked.belowDistance;
    } 
    
    if (blocked.left){
        if (player.velocity.x<0){
            player.velocity.x=0;
        }
        //player.position.x = player.position.x + blocked.leftDistance;
    }
    
    if (blocked.right){
        if (player.velocity.x>0){
            player.velocity.x=0;
        }
        //player.position.x = player.position.x - blocked.rightDistance;
    }
  
    if (blocked.above){
        if (player.velocity.y<0){
         player.velocity.y = 0.01 
        }
        //player.position.y = player.position.y + blocked.aboveDistance;
    }
    
  //  return player;
    
}


/* These function return the screen edges adjusted for camera position */

function screenLeft(){
    return camera.position.x-width/2;
}

function screenRight(){
    return camera.position.x+width/2;
}

function screenTop(){
    return camera.position.y-height/2;
}

function screenBottom(){
    return camera.position.y+height/2;
}





/*
function removeContacts(item, others){
    
       //put the other object into an array
    if (!Array.isArray(others)){
        let temp = [];
        temp.push(others);
        others = temp;
    }
    
    for (let i=others.length-1; i>=0; i--){
    
          let contact = contactIntersection(
            { x: item.position.x, y: item.position.y, width: item.width, height: item.height },
            { x: others[i].position.x, y: others[i].position.y, width: others[i].width, height: others[i].height }
          )
        
        if (contact){
            others.splice(i,1);
            console.log("removed");
        }
        console.log(contact)
    }
    
    return others;
    
}
*/

/*
function contactIntersection(rect1, rect2) {
  var x1 = rect2.x, y1 = rect2.y, x2 = x1+rect2.width, y2 = y1+rect2.height;
	if (rect1.x > x1) { x1 = rect1.x; }
	if (rect1.y > y1) { y1 = rect1.y; }
	if (rect1.x + rect1.width < x2) { x2 = rect1.x + rect1.width; }
	if (rect1.y + rect1.height < y2) { y2 = rect1.y + rect1.height; }
	return (x2 <= x1 || y2 <= y1) ? false : { x: x1, y: y1, width: x2-x1, height: y2-y1 };
}
*/
