class Pickup {
    
    constructor(x,y){
        
        this.sprite = createSprite(x,y);
        this.sprite.setDefaultCollider();
        this.sprite.addImage(pickupImage);
        this.sprite.immovable = true;
        
    }
    
    show(){
        drawSprite(this.sprite);
    }
    
    checkHit(player){
        
        if (this.sprite.collide(player)){
            this.sprite.remove();
            kaching.play();
            score = score + 1;
            return true;
        }
        
        return false;
        
    }
    
}