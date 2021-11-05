import {canvas,ctx} from "./common.js";
import {Dot,main_rand,max,min} from "./common.js";

const field_size = 55*10;
export const game_size = 10;
export const main_header_height = 70;
export const field_segment_size = field_size/game_size - 5;
const field_segment_offset = field_segment_size/10;
const field_segment_space = field_segment_size+field_segment_offset;
const field_segments_start_x = (canvas.width - field_size)/2;

const pool_block_segment_size = 25;
const pool_block_segment_offset = pool_block_segment_size/6;
const pool_block_segment_space = pool_block_segment_size+pool_block_segment_offset;
const pool_blocks_offset = pool_block_segment_size/2;
const pool_blocks_start_x = (canvas.width - (pool_block_segment_space*5 + pool_blocks_offset)*3)/2;

export const selected_segment_size = field_segment_size*.90;

const pool_header_height = (canvas.height + (main_header_height+field_size) - pool_block_segment_space*5)/2;

function Segment(x,y,size){
    this.position = new Dot(x,y);
    this.size = size;
    this.path = null;
    this.color = "rgba(164,164,164,1)";

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

const field_segment_default_color = "rgba(164,164,164,1)";
function FieldSegment(x,y,size){
    Segment.call(this,x,y,size);
    this.state = 1;
    this.animation_speed = 0;

    this.set_default_color = function (){
        this.color = "rgba(164,164,164,1)";
    }
    this.draw = function (){
        this.path = new Path2D();
        ctx.beginPath();
        this.path.rect(this.position.x, this.position.y, this.size, this.size);
        ctx.fillStyle = field_segment_default_color;
        ctx.fill(this.path);
        ctx.fillStyle = this.color;
        ctx.fill(this.path);
        ctx.strokeStyle = "#000000";
        ctx.stroke(this.path);
    }
}

function PoolSegment(x,y,size){
    Segment.call(this,x,y,size);
}

const colors = [
    // "#74a417",
    // "#ee4e1e",
    // "#3db0bf",
    // "#ffca00",
    // "#911acf",
    // "#e902dc"
    "rgba(9,4,14,1)"
]

const Forms = {
    //standart
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

    //extended
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
const use_extended = false;
let forms_count;

if (use_extended){
    forms_count= Object.keys(Forms).length;
}else{
    forms_count = 18;
}

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

export let field_segments = [];

for (let i = 0; i < game_size; i++) {
    field_segments.push([]);
    for (let j = 0; j < game_size; j++) {
        field_segments[i].push(new FieldSegment(
            i*field_segment_space+field_segments_start_x,
            j*field_segment_space+main_header_height,
            field_segment_size));
    }
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
            this.segments[i].push(new PoolSegment(
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
    const select_height_offset =260;
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
            this.segments[i][j].color = "grey";
        }
    }
}

export let pool_blocks = [];
for (let i = 0; i < 3; i++) {
    pool_blocks.push(new PoolBlock(i*(pool_blocks_offset+pool_block_segment_space*5)+pool_blocks_start_x));
}

export function draw_field(){
    for (let i = 0; i < game_size; i++) {
        for (let j = 0; j < game_size; j++) {
            field_segments[i][j].draw();
        }
    }
}

export function update_pool(){
    for (let i = 0; i < 3; i++) {
        pool_blocks[i].is_clear = 0;
        pool_blocks[i].figure = random_figure();
        pool_blocks[i].process_figure();
    }
}

export function draw_pool(){
    for (let i = 0; i < 3; i++) {
        pool_blocks[i].draw();
    }
}
