import {canvas,ctx} from "./common.js";
import {Dot} from "./common.js";
import {GameStates,set_game_state} from "./common.js";
import {game_start} from "./gameplay.js";

const std_button_width = 300;
const std_button_height = 150;
const buttons_offset = 30;
const main_menu_start_x = (canvas.width - std_button_width)/2;
const header_height = 70;
const logo_offset_top = 35;
const logo_offset_bottom = logo_offset_top + 70;
const buttons_start_y = logo_offset_bottom + header_height;

const MenuButtonState = {
    BEFORE: 0,
    AFTER: 1
}

function MenuButton(x,y,
                    before_button_color,after_button_color,
                    before_text_color,after_text_color,
                    width,height,
                    text,
                    event){
    this.position = new Dot(x,y);
    this.width = width;
    this.height = height;
    this.path = null;
    this.text = text;
    this.state = MenuButtonState.BEFORE;
    this.before_button_color = before_button_color;
    this.after_button_color = after_button_color;
    this.before_text_color = before_text_color;
    this.after_text_color = after_text_color;
    this.event = event;

    this.draw = function (){
        this.path = new Path2D();
        ctx.beginPath();
        this.path.rect(this.position.x, this.position.y, this.width, this.height);
        if (this.state === MenuButtonState.BEFORE) ctx.fillStyle = this.before_button_color;
        else ctx.fillStyle = this.after_button_color;
        ctx.fill(this.path);
        ctx.strokeStyle = "#000000";
        ctx.stroke(this.path);

        ctx.font = "36px Arial";
        ctx.textAlign = "center";
        if (this.state === MenuButtonState.BEFORE) ctx.fillStyle = this.before_text_color;
        else ctx.fillStyle = this.after_text_color;
        ctx.fillText(this.text, this.position.x + this.width/2, this.position.y + this.height/2 + 8);
    }
}

const buttons = {
    PLAY: new MenuButton(
        main_menu_start_x,
        buttons_start_y,
        "#404040",
        "#a4a4a4",
        "#ffffff",
        "#ffffff",
        std_button_width,
        std_button_height,
        "PLAY",
        function (){
            set_game_state(GameStates.GAME);
            game_start();
        }
    ),
    SETTINGS: new MenuButton(
        main_menu_start_x,
        buttons_start_y + std_button_height + buttons_offset,
        "#404040",
        "#a4a4a4",
        "#ffffff",
        "#ffffff",
        std_button_width,
        std_button_height,
        "SETTINGS",
        function (){}
    ),
    SKINS: new MenuButton(
        main_menu_start_x,
        buttons_start_y + std_button_height*2 + buttons_offset*2,
        "#404040",
        "#a4a4a4",
        "#ffffff",
        "#ffffff",
        std_button_width,
        std_button_height,
        "SKINS",
        function (){}
    ),
}

export function MainMenuEvents(){
    this.mouse_down = function(e) {
        for (const b of Object.values(buttons)) {
            if (ctx.isPointInPath(
                b.path,
                e.clientX - canvas.offsetLeft ,
                e.clientY - canvas.offsetTop)){
                b.state = MenuButtonState.AFTER;
                main_menu_update();
                break;
            }
        }
    }
    this.mouse_up = function(e) {
        for (const b of Object.values(buttons)) {
            if (ctx.isPointInPath(
                b.path,
                e.clientX - canvas.offsetLeft ,
                e.clientY - canvas.offsetTop)){
                b.state = MenuButtonState.BEFORE;
                main_menu_update();
                b.event();
                break;
            }
        }
    }
}

function draw_logo(){
    ctx.font = "80px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("2020!", canvas.width/2, header_height + logo_offset_top);
}

export function main_menu_update(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw_logo();
    for (const b of Object.values(buttons)) {
        b.draw();
    }
}
