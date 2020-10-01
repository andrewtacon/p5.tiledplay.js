
let player;
let gravity = 0.3;
let score = 0;

let layer = [];     //this creates a list (array) that will store all the layers that were in the tiledmap
let layerImages = []; //this list holds all the image (drawing) information for the layers in the map.

var tiledmap;
var pickupImage;

//create the values of the different world layers
let BACKGROUND = 0;
let GROUND = 1;
let LADDERS = 2;
let DEATH = 3;
let FOREGROUND = 4;

let pickups = [];   //this is a list of the pickups

//sound variables
let kaching;
let music;
let soundOn = false;

//Preload runs once before Setup
function preload(){
    tiledmap = loadTiledMap("world", "images");
    pickupImage = loadImage("images/coin.png");
    kaching = loadSound("audio/coin.wav");
    music = loadSound("audio/gameloop.mp3");
    
}


//Setup function for the entire game. It runs once.
function setup(){
    createCanvas(720,360);
    
    //create the player
    player = createSprite(100,100);
    player.velocity.x=0;
    player.setDefaultCollider();
    player.alive = true;
    player.addAnimation('stand', 'anims/tile011.png');
    player.addAnimation('walk', 'anims/tile011.png', 'anims/tile008.png', 'anims/tile005.png');
    
    
    
    //these lines of code load up the layer and images data from the world map
    layer = getTilemapLayers(tiledmap);
    layerImages = getTilemapImages(tiledmap);
    
    //create the pickup
    for (let i=0; i<10; i = i +1){
        let pickup = new Pickup(100 + i * 30  ,  350);
        pickups.push(pickup);
    }
        
    
}


//This function runs for every frame of the game. Around 60 frames per second.
function draw(){
    background(72,72,150);
    checkInput();   
    checkWorldBounds(player, tiledmap);
    
    //this code draws the layers on the screen
    image(layerImages[BACKGROUND], 0, 0);
    image(layerImages[GROUND], 0, 0);
    image(layerImages[LADDERS], 0, 0);
    image(layerImages[DEATH], 0, 0);
    
    drawSprite(player);
    handlePickups();
    
    image(layerImages[FOREGROUND], 0, 0);
    

    
    //draw the scoreboard
    noStroke();
    fill('yellow');
    rect(screenLeft(), screenTop(), width, textAscent()+textDescent());
    fill('black');
    textSize(16);
    text("Score: "+score, screenLeft(), screenTop() + textAscent());
    
    
    focusCamera(player, tiledmap);
 
    
    
    //handling background music
    if (soundOn === true){
        if (music.isPlaying() === false){
            music.loop();
            music.setVolume(0.2);
        }
    }
    
    if (soundOn === false){
        if(keyIsDown){
            soundOn = true;
        }
    }
    
}

function handlePickups(){
  
    for (let i=pickups.length-1; i>=0; i = i-1){
        if (pickups[i].checkHit(player)){
            pickups.splice(i,1);
        } else {
            pickups[i].show();
        }    
    }
  
}


function die(){
    player.velocity.x = 0;
    player.velocity.y = -10;
    player.rotationSpeed = 20;
}


//this code checks for the user input and moves the player accordingly
function checkInput(){

    //checks if alive or dead 
    let isOnDeath = isInContact(player, layer[DEATH]);
    
    if (isOnDeath.any){
        player.alive = false;
        die();
    }
    
    if (player.alive === false){
        return;
    }

    //allowing movement
    let touchingGround = isInContact(player, layer[GROUND]);

    
    player.velocity.y = player.velocity.y + gravity;
    
    
    //moving left and right 
    if (keyIsDown(LEFT_ARROW)){
        player.changeAnimation('walk');
        player.mirrorX(-1);
        player.velocity.x = player.velocity.x - 1
        
    } else if (keyIsDown(RIGHT_ARROW)){
        player.changeAnimation('walk');
        player.mirrorX(1);
        player.velocity.x = player.velocity.x + 1;
    } 
        
    if (player.velocity.x < -5) {
        player.velocity.x = -5;
    }
    if (player.velocity.x > 5) {
        player.velocity.x = 5;
    }
    if (player.velocity.x > -1 && player.velocity.x <1){
        player.changeAnimation('stand');
        player.velocity.x = 0;
    }
    
    player.velocity.x = 0.9 * player.velocity.x;
    
    
    ///deal with vertical movemenct
    playerBrake(player, touchingGround);
    
    //jumping
    if ( keyIsDown(32) && touchingGround.below   ) {
        player.velocity.y = -5;
    }
    
    
    //climbing
    
    let onLadder = isInContact(player, layer[LADDERS]);
  
    if (onLadder.any){

        if (keyIsDown(UP_ARROW)){
            player.velocity.y=0;
            player.position.y = player.position.y -5;
        } else if (keyIsDown(DOWN_ARROW)) {
            player.velocity.y =0;
            
            if (touchingGround.below){
                player.position.y = player.position.y + touchingGround.belowDistance;
            } else {
                player.position.y = player.position.y + 5;
            }
            
                
        } else {
            player.velocity.y = 0;
        }
        
        if (keyIsDown(32)){
            player.velocity.y = -5;
        }
        
    }
    
}


