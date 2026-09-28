const burger_button = document.querySelector('.burger-button');
const burger_menu = document.querySelector('.burger-menu');
const menu_link = document.querySelector('.burger-link');
const nav_list = document.querySelectorAll('.navigation__list');

const openMenuBurger = () => {
    burger_menu.classList.add('is_open');
    burger_button.classList.add('active-burger');
    document.body.classList.add('is_open');
    menu_link.classList.add('is_open');
};

const closeMenuBurger = () => {
    burger_menu.classList.remove('is_open');
    burger_button.classList.remove('active-burger');
    document.body.classList.remove('is_open');
    menu_link.classList.remove('is_open');
};

burger_button.addEventListener('click', () => {
    burger_menu.classList.contains('is_open') ? closeMenuBurger() : openMenuBurger();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && burger_menu.classList.contains('is_open')) {
        closeMenuBurger();
    }
});

nav_list.forEach((link) => {
    link.addEventListener('click', closeMenuBurger);
});

menu_link.addEventListener('click', closeMenuBurger);
