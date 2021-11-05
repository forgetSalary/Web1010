const loader = document.querySelector('.loader');
const main = document.querySelector('.main');

// Preloader //

let lso;
let lsd;
let msd;

function init() {
    setTimeout(() => {
        lso = loader.style.opacity;
        loader.style.opacity = 0;
        lsd = loader.style.display;
        loader.style.display = 'none';
        msd = main.style.display;
        main.style.display = 'block';
        setTimeout(() => (main.style.opacity = 1), 50);
    }, 500);
}

init();

function changeBackground(color) {
    document.body.style.background = color;
}

window.addEventListener("load",function() { changeBackground('#262626') });

function refreshPage(){
    window.location.reload();
}

export function layout_start_game(){
    loader.style.opacity = lso;
    loader.style.display = lsd;
    main.style.display = msd;
    init();
    document.getElementsByClassName("_back")[0].className = "back";
    document.getElementsByClassName("_game_header")[0].className = "game_header";
}