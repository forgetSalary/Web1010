import {game_draw} from "./gameplay.js";
import {main_menu_draw} from "./main_menu.js";
import "./events.js"
import {GameStates, get_game_state} from "./common.js";

function main_draw(){
    switch (get_game_state()){
        case GameStates.MAIN_MENU:
            main_menu_draw();
            break;
        case GameStates.GAME:
            game_draw();
            break;
        case GameStates.PAUSE:
            break;
    }
    window.requestAnimationFrame(main_draw);
}

main_draw();