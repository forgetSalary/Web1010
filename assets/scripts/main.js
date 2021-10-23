const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const game_size = 10;

const field_size = 55*10;
const main_header_height = 80;
const field_segment_size = field_size/game_size - 5;
const field_segment_offset = field_segment_size/10;
const field_segment_space = field_segment_size+field_segment_offset;
const field_segments_start_x = (canvas.width - field_size)/2;

const pool_block_segment_size = 25;
const pool_block_segment_offset = pool_block_segment_size/6;
const pool_block_segment_space = pool_block_segment_size+pool_block_segment_offset;
const pool_blocks_offset = pool_block_segment_size/2;
const pool_blocks_start_x = (canvas.width - (pool_block_segment_space*5 + pool_blocks_offset)*3)/2;

const selected_segment_size = field_segment_size*.90;

const pool_header_height = (canvas.height + (main_header_height+field_size) - pool_block_segment_space*5)/2;

const stat_position = new Dot(canvas.width/2,main_header_height/2+10);

let stat_score = 0;
let stat_steps = 0;

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

let main_rand = new Random(228);

function draw_stat(){
    ctx.font = "30px Comic Sans MS";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText("Score: "+String(stat_score)+"             Steps: "+String(stat_steps), stat_position.x, stat_position.y);
}

function Dot(x,y){
    this.x = x;
    this.y = y;
}

function Segment(x,y,size){
    this.position = new Dot(x,y);
    this.size = size;
    this.path = null;
    this.color = "#ffffff";
    this.state = 1;
    this.draw = function (){
        this.path = new Path2D();
        ctx.beginPath();
        this.path.rect(this.position.x, this.position.y, this.size, this.size);
        ctx.fillStyle = this.color;
        ctx.fill(this.path);
        ctx.strokeStyle = "#000000";
        ctx.stroke(this.path);
    }
}

const colors = [
    "#74a417",
    "#ee4e1e",
    "#3db0bf",
    "#ffca00",
    "#911acf",
    "#e902dc"
]

const Forms = {
    VERTICAL_LINE_2:0,
    VERTICAL_LINE_3:1,
    VERTICAL_LINE_4:2,
    VERTICAL_LINE_5:3,
    HORIZONTAL_LINE_2:4,
    HORIZONTAL_LINE_3:5,
    HORIZONTAL_LINE_4:6,
    HORIZONTAL_LINE_5:7,
    SQUARE_2:8,
    SQUARE_3:9,
    SQUARE_ANGLE_LU_2:10,//L - left, R - right, U - up, D - down
    SQUARE_ANGLE_LD_2:11,
    SQUARE_ANGLE_RU_2:12,
    SQUARE_ANGLE_RD_2:13,
    SQUARE_ANGLE_LU_3:14,
    SQUARE_ANGLE_LD_3:15,
    SQUARE_ANGLE_RU_3:16,
    SQUARE_ANGLE_RD_3:17,
    DOT:18,

    RECT_HORIZONTAL_3_2:19,
    RECT_HORIZONTAL_4_2:20,
    RECT_VERTICAL_3_2:21,
    RECT_VERTICAL_4_2:22,
    RECT_ANGLE_VERTICAL_LU_3_2:23,
    RECT_ANGLE_VERTICAL_LD_3_2:24,
    RECT_ANGLE_VERTICAL_RU_3_2:25,
    RECT_ANGLE_VERTICAL_RD_3_2:26,
    RECT_ANGLE_HORIZONTAL_LU_3_2:27,
    RECT_ANGLE_HORIZONTAL_LD_3_2:28,
    RECT_ANGLE_HORIZONTAL_RU_3_2:29,
    RECT_ANGLE_HORIZONTAL_RD_3_2:30,
    PYRAMID_3_2_UP:31,
    PYRAMID_3_2_DOWN:32,
    PYRAMID_3_2_RIGHT:33,
    PYRAMID_3_2_LEFT:34
}

const forms_count = Object.keys(Forms).length;

function rand_int(max) {
    return main_rand.next()%max;
}

function random_form(){
    return rand_int(forms_count+1);
}

function random_color(){
    return colors[rand_int(colors.length)];
}

function Figure(form_id,color){
    this.form_id = form_id;
    this.color = color;
}

function random_figure(){
    return new Figure(random_form(),random_color());
}

let field_segments = [];

for (let i = 0; i < game_size; i++) {
    field_segments.push([]);
    for (let j = 0; j < game_size; j++) {
        field_segments[i].push(new Segment(
            i*field_segment_space+field_segments_start_x,
            j*field_segment_space+main_header_height,
            field_segment_size));
    }
}

function max(a,b){
    if (a>b) return a;
    else return b;
}

function min(a,b){
    if (a<b) return a;
    else return b;
}

function FigureShape(segments_matrix_pos){
    let max_i = -1;
    let min_i = 6;
    let max_j = -1;
    let min_j = 6;
    for (let s of segments_matrix_pos){
        max_i = max(max_i,s.x);
        max_j = max(max_j,s.y);
        min_i = min(min_i,s.x);
        min_j = min(min_j,s.y);
    }
    this.vector = segments_matrix_pos;
    this.width = max_i - min_i + 1;
    this.height = max_j - min_j + 1;
    this.to_centre_segments = function (segments){
        let figure_segments = [];
        for (let s of segments_matrix_pos){
            figure_segments.push(segments[Math.floor(s.x + (5-this.width)/2)][Math.floor(s.y + (5-this.height)/2)]);
        }
        return figure_segments;
    }
}

function PoolBlock(start_x){
    this.start_x = start_x;
    this.is_clear = 0;
    this.segments = [];
    this.figure = null;
    this.path = new Path2D();
    this.figure_shape = [];
    this.figure_segments = [];

    ctx.beginPath();
    this.path.rect(start_x, pool_header_height, pool_block_segment_space*5, pool_block_segment_space*5);
    for (let i = 0; i < 5; i++) {
        this.segments.push([]);
        for (let j = 0; j < 5; j++) {
            this.segments[i].push(new Segment(
                i*(pool_block_segment_space)+start_x,
                j*(pool_block_segment_space)+pool_header_height,
                pool_block_segment_size));
        }
    }
    this.clear = function (){
        this.state = 1;
        this.figure = null;
        this.field_segments = [];
    }
    this.process_figure = function (){
        if (this.figure){
            this.figure_segments = [];
            switch (this.figure.form_id){
                case Forms.VERTICAL_LINE_2:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0),
                        new Dot(0,1)
                    ]);
                    break;
                case Forms.VERTICAL_LINE_3:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0),
                        new Dot(0,1),
                        new Dot(0,2)
                    ]);
                    break;
                case Forms.VERTICAL_LINE_4:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0),
                        new Dot(0,1),
                        new Dot(0,2),
                        new Dot(0,3)
                    ]);
                    break;
                case Forms.VERTICAL_LINE_5:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0),
                        new Dot(0,1),
                        new Dot(0,2),
                        new Dot(0,3),
                        new Dot(0,4)
                    ]);
                    break;
                case Forms.HORIZONTAL_LINE_2:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0),new Dot(1,0)
                    ]);
                    break;
                case Forms.HORIZONTAL_LINE_3:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0), new Dot(1,0), new Dot(2,0)
                    ]);
                    break;
                case Forms.HORIZONTAL_LINE_4:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0), new Dot(1,0), new Dot(2,0),new Dot(3,0)
                    ]);
                    break;
                case Forms.HORIZONTAL_LINE_5:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0), new Dot(1,0), new Dot(2,0),new Dot(3,0),new Dot(4,0)
                    ]);
                    break;
                case Forms.SQUARE_2:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0), new Dot(1,0),
                        new Dot(0,1), new Dot(1,1)
                    ]);
                    break;
                case Forms.SQUARE_3:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0), new Dot(1,0),new Dot(2,0),
                        new  Dot(0,1), new Dot(1,1),new Dot(2,1),
                        new Dot(0,2), new Dot(1,2),new Dot(2,2)
                    ]);
                    break;
                case Forms.SQUARE_ANGLE_LU_2:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0), new Dot(1,0),
                        new Dot(0,1)
                    ]);
                    break;
                case Forms.SQUARE_ANGLE_LD_2:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0),
                        new Dot(0,1),new  Dot(1,1)
                    ]);
                    break;
                case Forms.SQUARE_ANGLE_RU_2:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0), new Dot(1,0),
                        new Dot(1,1)
                    ]);
                    break;
                case Forms.SQUARE_ANGLE_RD_2:
                    this.figure_shape = new FigureShape([
                                            new Dot(1,0),
                        new Dot(0,1), new Dot(1,1)
                    ]);
                    break;
                case Forms.SQUARE_ANGLE_LU_3:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0), new Dot(1,0),new Dot(2,0),
                        new Dot(0,1),
                        new Dot(0,2)
                    ]);
                    break;
                case Forms.SQUARE_ANGLE_LD_3:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0),
                        new Dot(0,1),
                        new Dot(0,2), new Dot(1,2),new Dot(2,2)
                    ]);
                    break;
                case Forms.SQUARE_ANGLE_RU_3:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0),new Dot(1,0),   new Dot(2,0),
                                                                new Dot(2,1),
                                                                new Dot(2,2)
                    ]);
                    break;
                case Forms.SQUARE_ANGLE_RD_3:
                    this.figure_shape = new FigureShape([
                                                                new Dot(2,0),
                                                                new Dot(2,1),
                        new Dot(0,2), new Dot(1,2), new Dot(2,2)
                    ]);
                    break;
                case Forms.DOT:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0)]
                    );
                    break;
                case Forms.RECT_HORIZONTAL_3_2:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0), new Dot(1,0), new Dot(2,0),
                        new Dot(0,1), new Dot(1,1), new Dot(2,1)
                    ]);
                    break;
                case Forms.RECT_HORIZONTAL_4_2:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0), new Dot(1,0), new Dot(2,0), new Dot(3,0),
                        new Dot(0,1), new Dot(1,1), new Dot(2,1), new Dot(3,1)
                    ]);
                    break;
                case Forms.RECT_VERTICAL_3_2:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0), new Dot(1,0),
                        new Dot(0,1), new Dot(1,1),
                        new Dot(0,2), new Dot(1,2),
                    ]);
                    break;
                case Forms.RECT_VERTICAL_4_2:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0), new Dot(1,0),
                        new Dot(0,1), new Dot(1,1),
                        new Dot(0,2), new Dot(1,2),
                        new Dot(0,3), new Dot(1,3),
                    ]);
                    break;
                case Forms.RECT_ANGLE_VERTICAL_LU_3_2:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0), new Dot(1,0),
                        new Dot(0,1),
                        new Dot(0,2),
                    ]);
                    break;
                case Forms.RECT_ANGLE_VERTICAL_LD_3_2:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0),
                        new Dot(0,1),
                        new Dot(0,2), new Dot(1,2),
                    ]);
                    break;
                case Forms.RECT_ANGLE_VERTICAL_RU_3_2:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0), new Dot(1,0),
                                            new Dot(1,1),
                                            new Dot(1,2),
                    ]);
                    break;
                case Forms.RECT_ANGLE_VERTICAL_RD_3_2:
                    this.figure_shape = new FigureShape([
                                            new Dot(1,0),
                                            new Dot(1,1),
                        new Dot(0,2), new Dot(1,2),
                    ]);
                    break;
                case Forms.RECT_ANGLE_HORIZONTAL_LU_3_2:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0), new Dot(1,0), new Dot(2,0),
                        new Dot(0,1)
                    ]);
                    break;
                case Forms.RECT_ANGLE_HORIZONTAL_LD_3_2:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0),
                        new Dot(0,1), new Dot(1,1), new Dot(2,1)
                    ]);
                    break;
                case Forms.RECT_ANGLE_HORIZONTAL_RU_3_2:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0), new Dot(1,0), new Dot(2,0),
                                                                new Dot(2,1)
                    ]);
                    break;
                case Forms.RECT_ANGLE_HORIZONTAL_RD_3_2:
                    this.figure_shape = new FigureShape([
                                                                new Dot(2,0),
                        new Dot(0,1), new Dot(1,1), new Dot(2,1)
                    ]);
                    break;
                case Forms.PYRAMID_3_2_UP:
                    this.figure_shape = new FigureShape([
                                            new Dot(1,0),
                        new Dot(0,1), new Dot(1,1), new Dot(2,1)
                    ]);
                    break;
                case Forms.PYRAMID_3_2_DOWN:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0), new Dot(1,0), new Dot(2,0),
                                            new Dot(1,1)
                    ]);
                    break;
                case Forms.PYRAMID_3_2_RIGHT:
                    this.figure_shape = new FigureShape([
                                            new Dot(1,0),
                        new Dot(0,1), new Dot(1,1),
                                            new Dot(1,2)
                    ]);
                    break;
                case Forms.PYRAMID_3_2_LEFT:
                    this.figure_shape = new FigureShape([
                        new Dot(0,0),
                        new Dot(0,1), new Dot(1,1),
                        new Dot(0,2)
                    ]);
                    break;

            }

            this.figure_segments = this.figure_shape.to_centre_segments(this.segments);
            for (let i = 0; i < this.figure_segments.length; i++) {
                this.figure_segments[i].state = 0;
                this.figure_segments[i].color = this.figure.color;
            }
        }
    }
    this.draw = function (){
        if (this.figure){
            for (let i = 0; i < this.figure_segments.length; i++) {
                this.figure_segments[i].draw();
            }
            // for (let i = 0; i < 5; i++) {
            //     for (let j = 0; j < 5; j++) {
            //         this.segments[i][j].draw();
            //     }
            // }
        }
    }
    const select_height_offset = 250;
    this.select_block = function (x,y){
        for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
            this.segments[i][j].size = selected_segment_size;
            this.segments[i][j].position = new Dot(
                i * (field_segment_space) + x - canvas.offsetLeft - field_segment_space*2,
                j * (field_segment_space) + y - select_height_offset);
        }
    }
    this.move_block = function (x,y){
        for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
            this.segments[i][j].position = new Dot(
                i * (field_segment_space) + x - canvas.offsetLeft - field_segment_space*2,
                j * (field_segment_space) + y - select_height_offset);
        }
    }
    this.unselect_block = function (){
        for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
            this.segments[i][j].size = pool_block_segment_size;
            this.segments[i][j].position = new Dot(
                i*(pool_block_segment_space)+this.start_x,
                j*(pool_block_segment_space)+pool_header_height);
        }
    }
    this.clear = function (){
        for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
            this.segments[i][j].state = 1;
            this.segments[i][j].color = "#ffffff";
        }
    }
}

let pool_blocks = [];
for (let i = 0; i < 3; i++) {
    pool_blocks.push(new PoolBlock(i*(pool_blocks_offset+pool_block_segment_space*5)+pool_blocks_start_x));
}

function draw_field(){
    for (let i = 0; i < game_size; i++) {
        for (let j = 0; j < game_size; j++) {
            field_segments[i][j].draw();
        }
    }
}

function update_pool(){
    for (let i = 0; i < 3; i++) {
        pool_blocks[i].is_clear = 0;
        pool_blocks[i].figure = random_figure();
        pool_blocks[i].process_figure();
    }
}

function draw_pool(){
    for (let i = 0; i < 3; i++) {
        pool_blocks[i].draw();
    }
}

function main_update(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw_stat();
    draw_field();
    draw_pool();
}

function vector_len(x1,y1,x2,y2){
    return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
}

function TargetFieldSegment(segment,fill_factor,i,j){
    this.segment = segment;
    this.fill_factor = fill_factor;
}

let i_indexes_set;
let j_indexes_set;

let searched_field_segments = [];

function target_segments(block){
    searched_field_segments = [];
    for (let i = 0; i < game_size; i++) {
        searched_field_segments.push([]);
        for (let j = 0; j < game_size; j++) {
            searched_field_segments[i][j] = 0;
        }
    }

    let targets = [];
    let new_target;
    i_indexes_set = [];
    j_indexes_set = [];
    for (let i = 0; i < block.figure_segments.length; i++) {
        for (let j = 0; j < game_size; j++) {
            for (let k = 0; k < game_size; k++) {
                if (!searched_field_segments[j][k]){
                    if (ctx.isPointInPath(
                        field_segments[j][k].path,
                        block.figure_segments[i].position.x,
                        block.figure_segments[i].position.y)) {
                        new_target = new TargetFieldSegment(field_segments[j][k], 1/vector_len(
                            field_segments[j][k].position.x,
                            field_segments[j][k].position.y,
                            block.figure_segments[i].position.x,
                            block.figure_segments[i].position.y));

                        if (targets[i]){
                            if (new_target.fill_factor > targets[i].fill_factor){
                                searched_field_segments[j][k] = 1;
                                targets[i] = new_target;
                            }
                        }else{
                            searched_field_segments[j][k] = 1;
                            targets.push(new_target);
                        }
                    }
                    else if (ctx.isPointInPath(
                        field_segments[j][k].path,
                        block.figure_segments[i].position.x + selected_segment_size,
                        block.figure_segments[i].position.y)){
                        new_target = new TargetFieldSegment(field_segments[j][k], 1/vector_len(
                            field_segments[j][k].position.x+field_segment_size,
                            field_segments[j][k].position.y,
                            block.figure_segments[i].position.x+selected_segment_size,
                            block.figure_segments[i].position.y));

                        if (targets[i]){
                            if (new_target.fill_factor > targets[i].fill_factor){
                                searched_field_segments[j][k] = 1;
                                targets[i] = new_target;
                            }
                        }else{
                            searched_field_segments[j][k] = 1;
                            targets.push(new_target);
                        }
                    }
                    else if (ctx.isPointInPath(
                        field_segments[j][k].path,
                        block.figure_segments[i].position.x,
                        block.figure_segments[i].position.y + selected_segment_size)){
                        new_target = new TargetFieldSegment(field_segments[j][k], 1/vector_len(
                            field_segments[j][k].position.x,
                            field_segments[j][k].position.y+field_segment_size,
                            block.figure_segments[i].position.x,
                            block.figure_segments[i].position.y+selected_segment_size));


                        if (targets[i]){
                            if (new_target.fill_factor > targets[i].fill_factor){
                                searched_field_segments[j][k] = 1;
                                targets[i] = new_target;
                            }
                        }else{
                            searched_field_segments[j][k] = 1;
                            targets.push(new_target);
                        }
                    }
                    else if (ctx.isPointInPath(
                        field_segments[j][k].path,
                        block.figure_segments[i].position.x + selected_segment_size,
                        block.figure_segments[i].position.y+ selected_segment_size)){
                        new_target = new TargetFieldSegment(field_segments[j][k], 1/vector_len(
                            field_segments[j][k].position.x,
                            field_segments[j][k].position.y+field_segment_size,
                            block.figure_segments[i].position.x,
                            block.figure_segments[i].position.y+selected_segment_size));

                        if (targets[i]){
                            if (new_target.fill_factor > targets[i].fill_factor){
                                searched_field_segments[j][k] = 1;
                                targets[i] = new_target;
                            }
                        }else{
                            searched_field_segments[j][k] = 1;
                            targets.push(new_target);
                        }
                    }
                }
            }
        }
    }

    return targets;
}

let targeted_field_segments = [];
let block_is_selected = false;
let hovered_block = null;

function game_is_over(){
    for (let b of pool_blocks){
        if (!b.is_clear){
            let fits = false;
            for (let i = 0; i < game_size - b.figure_shape.width + 1; i++) {
                for (let j = 0; j < game_size - b.figure_shape.height + 1; j++) {
                    let segments_count = 0;
                    for (let s of b.figure_shape.vector) {
                        if (field_segments[i+s.x][j+s.y].state === 0) break;
                        segments_count++;
                    }
                    if (segments_count === b.figure_segments.length){
                        fits = true;
                        break;
                    }
                }
                if (fits) break;
            }
            if (fits) return false;
        }
    }
    return true;
}

function game_over(){
    alert("Game over!");
    const url = canvas.toDataURL('image/png');
    let link = document.createElement("a");
    link.download = url.substring((url.lastIndexOf("/") + 1), url.length);
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

}

canvas.addEventListener("mousemove", (e) => {
    if (block_is_selected){
        hovered_block.move_block(e.clientX,e.clientY);
        main_update();
    }
});

canvas.addEventListener("touchmove", (e) => {
    if (block_is_selected){
        hovered_block.move_block(e.touches[0].clientX,e.touches[0].clientY);
        main_update();
    }
});

canvas.addEventListener("touchstart", (e)=>{
    let found = false;
    for (let i = 0;i < 3; i++) {
        if (ctx.isPointInPath(pool_blocks[i].path, e.touches[0].clientX, e.touches[0].clientY)) {
            if (!pool_blocks[i].is_clear){
                hovered_block = pool_blocks[i];
                found = true;
                break;
            }
        }
    }
    if (!found)
        hovered_block = null;
    if (hovered_block){
        hovered_block.select_block(e.touches[0].clientX,e.touches[0].clientY);
        block_is_selected = true;
    }
    main_update();
});
canvas.addEventListener("mousedown", e => {
    let found = false;
    for (let i = 0;i < 3; i++) {
        if (ctx.isPointInPath(pool_blocks[i].path, e.offsetX, e.offsetY)) {
            if (!pool_blocks[i].is_clear){
                hovered_block = pool_blocks[i];
                found = true;
                break;
            }
        }
    }
    if (!found)
        hovered_block = null;
    if (hovered_block){
        hovered_block.select_block(e.clientX,e.clientY);
        block_is_selected = true;
    }
    main_update();
});

let clear_pool_blocks_count = 0;

function clear_filled_lines(){
    let horizontal_count = 0;
    let vertical_count = 0;

    let horizontals = [];
    let verticals = [];

    for (let i = 0; i < game_size; i++) {
        for (let j = 0; j < game_size; j++) {
            if (field_segments[i][j].state === 0){
                //console.log("i:",i,j);
                horizontal_count++;
            }
            if (field_segments[j][i].state === 0){
                //console.log("j:",i,j);
                vertical_count++;
            }
        }
        if (horizontal_count === game_size){
            horizontals.push(i);
        }
        if (vertical_count === game_size){
            verticals.push(i);
        }
        horizontal_count = 0;
        vertical_count = 0;
    }
    for (let j of horizontals) {
        for (let i = 0; i < game_size; i++) {
            field_segments[j][i].state = 1;
            field_segments[j][i].color = "#ffffff";
        }
        stat_score+=game_size;
    }

    for (let j of verticals) {
        for (let i = 0; i < game_size; i++) {
            field_segments[i][j].state = 1;
            field_segments[i][j].color = "#ffffff";
        }
        stat_score+=game_size;
    }
}

function mouse_touch_up(e){
    if (hovered_block){
        targeted_field_segments = target_segments(hovered_block);
        if (targeted_field_segments){
            let block_can_be_placed = true;
            for (let i = 0; i < targeted_field_segments.length; i++) {
                if (!targeted_field_segments[i].segment.state){
                    block_can_be_placed = false;
                }
            }
            if(block_can_be_placed && targeted_field_segments.length === hovered_block.figure_segments.length){
                hovered_block.is_clear = 1;
                for (let i = 0; i < targeted_field_segments.length; i++) {
                    targeted_field_segments[i].segment.color = hovered_block.figure_segments[0].color;
                    targeted_field_segments[i].segment.state = 0;
                }
                hovered_block.figure = null;
                clear_filled_lines();
                stat_score+=targeted_field_segments.length;
                hovered_block.clear();
                hovered_block.unselect_block();
                clear_pool_blocks_count ++;
                if(clear_pool_blocks_count === 3){
                    clear_pool_blocks_count = 0;
                    update_pool();
                    stat_steps ++;
                }
                if (game_is_over()){
                    game_over();
                }
            }else{
                hovered_block.unselect_block();
            }
            block_is_selected = false;
        }
    }

    main_update();
}

canvas.addEventListener("touchend", mouse_touch_up);
canvas.addEventListener("mouseup", mouse_touch_up);

document.addEventListener("keydown", (e) => {
    switch (e.code){
        case "KeyM":
            let matrix = "";
            for (let i = 0; i < game_size; i++) {
                for (let j = 0; j < game_size; j++) {
                    matrix += (field_segments[i][j].state+',');
                }
                matrix += '\n';
            }
            console.log(matrix);
            break;
    }
});



update_pool();
main_update();