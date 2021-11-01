function time_null(){
    return new Date().getMilliseconds();
}

function Random(seed){
    this.seed = seed;
    this.num = seed;
    this.set_seed = function (){
        this.seed = seed;
        this.prev = seed;
    }
    this.next = function(){
        this.num = this.num * 16807 % 2147483647;
        return this.num;
    }
}

export let main_rand = new Random(time_null());

export function max(a,b){
    if (a>b) return a;
    else return b;
}

export function min(a,b){
    if (a<b) return a;
    else return b;
}

export function Dot(x,y){
    this.x = x;
    this.y = y;

}

export function vector_len(x1,y1,x2,y2){
    return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
}
