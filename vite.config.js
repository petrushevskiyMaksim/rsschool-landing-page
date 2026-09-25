import { defineConfig } from 'vite';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';
import path from 'path';

export default defineConfig({
    base: '/rsschool-landing-page/',
    css: {
        devSourcemap: true,
        preprocessorOptions: {
            scss: {
                sourceMap: true, // Обязательно для корректной работы карт в SCSS
                cssMinify: false,
            },
        },
    },

    plugins: [
        createSvgIconsPlugin({
            // Папка, в которой лежат иконки
            iconDirs: [path.resolve(process.cwd(), 'src/assets/icons/')],
            // Формат ID, который будет использоваться в <use>
            symbolId: 'icon-[name]',
        }),
    ],
});
