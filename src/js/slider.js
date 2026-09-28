class Slider {
    constructor(root) {
        this.root = root;
        this.track = root.querySelector('.slider__row');
        this.slides = [...this.track.children];
        this.markers = [...root.querySelectorAll('.slider__marker')];

        this.total = this.slides.length - 2;
        this.index = 1;

        // NEW — состояние анимации и свайпа
        this.isAnimating = false;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.deltaX = 0;
        this.startTime = 0;
        this.pointerId = null;

        // NEW — порог свайпа: 30% ширины слайда или быстрый флик
        this.swipeThreshold = 0.3;
        this.velocityThreshold = 0.5; // px/ms

        this.setIndex(this.index, false);
        this.bind();
    }

    setIndex(i, animate = true) {
        this.track.style.transition = animate ? '' : 'none';
        this.track.style.setProperty('--i', i);
        this.index = i;

        this.track.offsetHeight;
        if (!animate) this.track.style.transition = '';

        this.updateMarkers();
    }

    // NEW — единая точка «анимация началась / закончилась»
    animateTo(i) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        this.setIndex(i);

        const onEnd = () => {
            this.isAnimating = false;
            this.track.removeEventListener('transitionend', onEnd);
            this.track.removeEventListener('transitioncancel', onEnd);
        };
        this.track.addEventListener('transitionend', onEnd, { once: true });
        this.track.addEventListener('transitioncancel', onEnd, { once: true });
    }

    next() {
        if (this.isAnimating) return;

        if (this.index === this.total) {
            this.animateTo(this.total + 1);
            this.track.addEventListener(
                'transitionend',
                () => {
                    this.setIndex(1, false);
                },
                { once: true }
            );
        } else {
            this.animateTo(this.index + 1);
        }
    }

    prev() {
        if (this.isAnimating) return;

        if (this.index === 1) {
            this.animateTo(0);
            this.track.addEventListener(
                'transitionend',
                () => {
                    this.setIndex(this.total, false);
                },
                { once: true }
            );
        } else {
            this.animateTo(this.index - 1);
        }
    }

    goTo(realIndex) {
        if (this.isAnimating) return;
        this.animateTo(realIndex + 1);
    }

    updateMarkers() {
        const real = (this.index - 1 + this.total) % this.total;
        this.markers.forEach((m, i) => {
            const isActive = i === real;
            m.classList.toggle('slider__marker--active', isActive);
            if (isActive) m.setAttribute('aria-current', 'true');
            else m.removeAttribute('aria-current');
        });
    }

    // ============================================================
    // NEW — Pointer Events
    // ============================================================

    onPointerDown(e) {
        // игнорируем мультитач и клики правой кнопкой
        if (!e.isPrimary) return;
        if (e.button !== undefined && e.button !== 0) return;
        // во время анимации не начинаем свайп
        if (this.isAnimating) return;

        this.pointerId = e.pointerId;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.deltaX = 0;
        this.isDragging = false; // ещё не решили, свайп это или нет
        this.startTime = performance.now();
    }

    onPointerMove(e) {
        if (e.pointerId !== this.pointerId) return;

        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;

        // ещё не решили, что это свайп
        if (!this.isDragging) {
            // вертикальный жест сильнее горизонтального → это скролл страницы, выходим
            if (Math.abs(dy) > Math.abs(dx)) {
                this.resetPointer();
                return;
            }
            // горизонтальный сдвиг больше 8px → это свайп
            if (Math.abs(dx) > 8) {
                this.isDragging = true;
                // захватываем указатель, чтобы события шли на трек даже за его пределами
                this.track.setPointerCapture(this.pointerId);
                // выключаем transition на время перетаскивания
                this.track.style.transition = 'none';
                this.track.style.willChange = 'transform';
            } else {
                return;
            }
        }

        // тянем трек за пальцем
        // формула: базовый сдвиг (--i * -100%) + смещение пальца в px
        this.deltaX = dx;
        this.track.style.setProperty('--drag', `${dx}px`);
        // для transform нужен отдельный стиль, потому что calc с px и % в одном transform
        this.track.style.transform = `translate3d(calc(${-this.index * 100}% + ${dx}px), 0, 0)`;
    }

    onPointerUp(e) {
        if (e.pointerId !== this.pointerId) return;
        if (!this.isDragging) {
            this.resetPointer();
            return;
        }

        const slideWidth = this.track.clientWidth;
        const elapsed = performance.now() - this.startTime;
        const velocity = this.deltaX / Math.max(elapsed, 1); // px/ms
        const threshold = slideWidth * this.swipeThreshold;

        // решаем: next / prev / возврат
        let target;

        if (this.deltaX < -threshold || velocity < -this.velocityThreshold) {
            // свайп влево → следующий
            target = 'next';
        } else if (this.deltaX > threshold || velocity > this.velocityThreshold) {
            // свайп вправо → предыдущий
            target = 'prev';
        } else {
            // недостаточно — возвращаемся к текущему
            target = 'back';
        }

        // возвращаем transition и сбрасываем inline-transform
        this.track.style.transform = '';
        this.track.style.transition = '';

        if (target === 'next') this.next();
        else if (target === 'prev') this.prev();
        else this.setIndex(this.index, true); // возврат к текущему

        this.resetPointer();
    }

    onPointerCancel(e) {
        if (e.pointerId !== this.pointerId) return;
        // жест отменён системой — возвращаемся к текущему слайду
        this.track.style.transform = '';
        this.track.style.transition = '';
        this.setIndex(this.index, true);
        this.resetPointer();
    }

    resetPointer() {
        this.isDragging = false;
        this.pointerId = null;
        this.deltaX = 0;
        this.track.style.willChange = '';
    }

    // ============================================================
    // bind
    // ============================================================

    bind() {
        this.root
            .querySelector('.slider__button-next')
            ?.addEventListener('click', () => this.next());
        this.root
            .querySelector('.slider__button-prev')
            ?.addEventListener('click', () => this.prev());
        this.markers.forEach((m, i) => {
            m.addEventListener('click', () => this.goTo(i));
        });

        // NEW — Pointer Events на трек
        this.track.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        this.track.addEventListener('pointermove', (e) => this.onPointerMove(e));
        this.track.addEventListener('pointerup', (e) => this.onPointerUp(e));
        this.track.addEventListener('pointercancel', (e) => this.onPointerCancel(e));

        // NEW — защита от клика после свайпа
        // если был свайп, подавляем click, чтобы случайно не сработали ссылки/кнопки
        this.track.addEventListener(
            'click',
            (e) => {
                if (this.suppressClick) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.suppressClick = false;
                }
            },
            true
        );
    }
}

document.querySelectorAll('.slider').forEach((el) => new Slider(el));
