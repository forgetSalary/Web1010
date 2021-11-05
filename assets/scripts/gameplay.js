import {canvas, ctx, GameStates, set_game_state} from "./common.js";
import {Dot,vector_len} from "./common.js";
import {pool_blocks,field_segments, update_pool,draw_field, draw_pool} from "./field.js";
import {game_size,selected_segment_size,field_segment_size} from "./field.js";

const score = document.getElementById("Score");
const step = document.getElementById("Step");
let stat_score = 0;
let stat_steps = 0;

function TargetFieldSegment(segment,fill_factor,j,k){
    this.j = j;
    this.k = k;
    this.segment = segment;
    this.fill_factor = fill_factor;
}

const DebugColors = [
    "#2deeaf",
    "#d255b0",
    "#000000",
    "#fbfb16",
    "#123c12",
    "#1635fb",
    "#53008a",
    "#f50000",
    "#123451"
]

function choose_best_target_segment(group){
    let best = new TargetFieldSegment(null,-1);
    if (group.length === 0) return null;
    for (let g of group){
        if (g.fill_factor > best.fill_factor){
            best = g;
        }
    }
    return best;
}

function SearchedOffsets(b_x,b_y,f_x,f_y){
    this.block_segment_x = b_x;
    this.block_segment_y = b_y;
    this.field_segment_x = f_x;
    this.field_segment_y = f_y;
}

const cor_offsets_by_angle =[
    new SearchedOffsets(0,0,0,0),
    new SearchedOffsets(selected_segment_size,0,field_segment_size,0),
    new SearchedOffsets(0,selected_segment_size,0,field_segment_size),
    new SearchedOffsets(selected_segment_size,selected_segment_size,field_segment_size,field_segment_size)
]

function get_target_segments(block){
    // for (let j = 0; j < game_size; j++) {
    //     for (let k = 0; k < game_size; k++) {
    //         field_segments[j][k].color = "gray";
    //     }
    // }
    let groups_of_target_segments = [];

    let searched_segments = [];
    for (let j = 0; j < game_size; j++) {
        searched_segments.push([]);
        for (let k = 0; k < game_size; k++) {
            searched_segments.push(0);
        }
    }

    let first_targets = [];
    let new_target;
    for (let i = 0; i < 4; i++){
        let first_target_found = false;
        for (let j = 0; j < game_size; j++) {
            for (let k = 0; k < game_size; k++) {
                if (ctx.isPointInPath(
                    field_segments[j][k].path,
                    block.figure_segments[0].position.x + cor_offsets_by_angle[i].block_segment_x,
                    block.figure_segments[0].position.y + cor_offsets_by_angle[i].block_segment_y)) {
                    new_target = new TargetFieldSegment(
                        field_segments[j][k],
                        1/vector_len(
                        field_segments[j][k].position.x + cor_offsets_by_angle[i].field_segment_x,
                        field_segments[j][k].position.y + cor_offsets_by_angle[i].field_segment_y,
                        block.figure_segments[0].position.x + cor_offsets_by_angle[i].block_segment_x,
                        block.figure_segments[0].position.y + cor_offsets_by_angle[i].block_segment_y),
                        j,k);
                    first_targets.push(new_target);
                    first_target_found = true;
                }
                if (first_target_found) break;
            }
            if (first_target_found) break;
        }
    }

    //console.log(first_targets);
    let first_target;
    switch (first_targets.length){
        case 0:
            return null;
        case 1:
            first_target = first_targets[0];
            break;
        case 2:case 4:
            first_target = choose_best_target_segment(first_targets);
            break;
    }
    //console.log(first_target);
    let j,k;
    let targets = [first_target.segment];
    for (let i = 1; i < block.figure_segments.length; i++){
        j = first_target.j + block.figure_shape.vector[i].x - block.figure_shape.vector[0].x;
        k = first_target.k + block.figure_shape.vector[i].y;
        if (j < game_size && k < game_size){
            if (field_segments[j][k].state){
                targets.push(field_segments[j][k]);
            }
        }else{
            return null;
        }
    }

    return targets;
}

let targeted_field_segments = [];
let block_is_selected = false;
let hovered_block = null;

function is_game_over(){
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
    // const url = canvas.toDataURL('image/png');
    let link = document.createElement("a");
    link.download = url.substring((url.lastIndexOf("/") + 1), url.length);
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function GameEvents(){
    this.mouse_move = function(e){
        if (block_is_selected){
            //get_target_segments(hovered_block);
            hovered_block.move_block(e.clientX,e.clientY);
        }
    }
    this.mouse_down = function (e){
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
    }
    this.mouse_up = function (){
        if (hovered_block){
            //targeted_field_segments = null;
            targeted_field_segments = get_target_segments(hovered_block);
            if (targeted_field_segments){
                let block_can_be_placed = true;
                for (let i = 0; i < targeted_field_segments.length; i++) {
                    if (!targeted_field_segments[i].state){
                        block_can_be_placed = false;
                    }
                }
                if(block_can_be_placed && targeted_field_segments.length === hovered_block.figure_segments.length){
                    hovered_block.is_clear = 1;
                    for (let i = 0; i < targeted_field_segments.length; i++) {
                        targeted_field_segments[i].color = hovered_block.figure_segments[0].color;
                        targeted_field_segments[i].state = 0;
                    }
                    hovered_block.figure = null;
                    stat_score+=targeted_field_segments.length;
                    hovered_block.clear();
                    hovered_block.unselect_block();
                    clear_pool_blocks_count ++;
                    if(clear_pool_blocks_count === 3){
                        clear_pool_blocks_count = 0;
                        update_pool();
                        stat_steps ++;
                    }
                    if (is_game_over()){
                        game_over();
                    }
                    clear_filled_lines();
                }else{
                    hovered_block.unselect_block();
                }
            }
            else{
                hovered_block.unselect_block();
            }
            block_is_selected = false;
        }
        step.innerHTML = stat_steps;
        score.innerHTML = stat_score;
    }
    this.touch_move = function(e){
        if (block_is_selected){
            hovered_block.move_block(e.touches[0].clientX,e.touches[0].clientY);
        }
    }
    this.touch_start = function(e){
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
    }
}

let clear_pool_blocks_count = 0;

function rgba_change_opacity(str,opacity_str){
    return str.slice(0,str.lastIndexOf(',')+1) + opacity_str + ")";
}

let horizontals;
let verticals;
let collisions;
let animate_deleting_raf;

const clearing_animation_time_s = 1.5;
const fps = 60;
let clearing_animation_opacity = 100;

function update_segments_for_animation(){
    for (let i = 0; i < game_size; i++) {
        for (let j of horizontals) {
            if (!collisions[j]){
                field_segments[j][i].color =
                    rgba_change_opacity(field_segments[j][i].color,"0."+clearing_animation_opacity);
            }
        }
        for (let j of verticals) {
            field_segments[i][j].color =
                rgba_change_opacity(field_segments[i][j].color,"0."+clearing_animation_opacity);
        }
    }
}

function set_default_colors(){
    for (let i = 0; i < game_size; i++) {
        for (let j of horizontals) {
            if (!collisions[j]){
                field_segments[j][i].set_default_color();
            }
        }
        for (let j of verticals) {
            field_segments[i][j].set_default_color();
        }
    }
}

function Animation(handler){
    this.do = false;
    this.handler = handler;
}

const GameAnimations = {
    LINES_CLEARING: new Animation(function (){
        clearing_animation_opacity -= 2;
        if (clearing_animation_opacity < 0){
            set_default_colors();
            GameAnimations.LINES_CLEARING.do = false;
        }else{
            update_segments_for_animation();
        }
    }),
}

function clear_filled_lines(){
    let horizontal_count = 0;
    let vertical_count = 0;

    horizontals = [];
    verticals = [];

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

    collisions = Array();
    collisions.length = game_size;
    for (let i = 0; i < collisions.length; i++) collisions[i] = false;

    if (verticals.length !== 0 && horizontals.length !== 0){
        for (let i of verticals){
            collisions[i] = true;
        }
    }else if(verticals.length === 0 && horizontals.length === 0){
        return;
    }

    for (let i = 0; i < game_size; i++) {
        for (let j of horizontals) {
            if (!collisions[j]){
                field_segments[j][i].state = 1;
                stat_score++;
            }
        }
        for (let j of verticals) {
            field_segments[i][j].state = 1;
            stat_score++;
        }
    }
    clearing_animation_opacity = 100;
    GameAnimations.LINES_CLEARING.do = true;
    score.innerHTML=stat_score;
}

export function game_draw(){
    ctx.fillStyle = 'rgba(255, 255, 255)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let a of Object.values(GameAnimations)){
        if (a.do){
            a.handler();
        }
    }
    draw_field();
    draw_pool();
}

export function game_start(){
    update_pool();
}

