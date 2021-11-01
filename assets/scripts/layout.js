const loader = document.querySelector('.loader');
const main = document.querySelector('.main');

// Preloader //
function init() {
    setTimeout(() => {
        loader.style.opacity = 0;
        loader.style.display = 'none';
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
