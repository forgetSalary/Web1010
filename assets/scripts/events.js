import {canvas} from "./common.js";
import {get_game_state,GameStates} from "./common.js";
import {GameEvents} from "./gameplay.js";
import {MainMenuEvents} from "./main_menu.js";

const game_events = new GameEvents();
const main_menu_events = new MainMenuEvents();

canvas.addEventListener("mousemove", (e) => {
    switch (get_game_state()){
        case GameStates.MAIN_MENU:
            break;
        case GameStates.GAME:
            game_events.mouse_move(e);
            break;
        case GameStates.PAUSE:
            break;
    }
});

canvas.addEventListener("touchmove", (e) => {
    switch (get_game_state()){
        case GameStates.MAIN_MENU:
            break;
        case GameStates.GAME:
            game_events.touch_move(e);
            break;
        case GameStates.PAUSE:
            break;
    }
});

canvas.addEventListener("touchstart", (e)=>{
    switch (get_game_state()){
        case GameStates.MAIN_MENU:
            break;
        case GameStates.GAME:
            game_events.touch_start(e);
            break;
        case GameStates.PAUSE:
            break;
    }
});

canvas.addEventListener("mousedown",(e)=>{
    switch (get_game_state()){
        case GameStates.MAIN_MENU:
            main_menu_events.mouse_down(e);
            break;
        case GameStates.GAME:
            game_events.mouse_down(e);
            break;
        case GameStates.PAUSE:
            break;
    }
});

canvas.addEventListener("mouseup",(e)=>{
    switch (get_game_state()){
        case GameStates.MAIN_MENU:
            main_menu_events.mouse_up(e);
            break;
        case GameStates.GAME:
            game_events.mouse_up(e);
            break;
        case GameStates.PAUSE:
            break;
    }
});