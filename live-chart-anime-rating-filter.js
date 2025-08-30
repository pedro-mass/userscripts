// ==UserScript==
// @name         LiveChart.me Minimum Rating Filter with Themed UI
// @namespace    http://tampermonkey.net/
// @version      1.4
// @author       pedro-mass
// @copyright    2024, Pedro Mass (https://github.com/pedro-mass)
// @icon         https://www.google.com/s2/favicons?sz=64&domain=livechart.me
// @license      GNU GPLv3
// @description  Adds a minimum rating filter to anime list on LiveChart.me with visible count, alert if no anime match, reset button, and styled UI
// @author       Your Name
// @match        https://www.livechart.me/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    init();

    function init() {
        addFilterUI();
    }

    function addFilterUI() {
        const container = document.querySelector('.options-bar-v2');
        if (!container) return;

        const existingUI = document.querySelector('.pm-rating-filter');
        if (existingUI) existingUI.remove();

        const label = document.createElement("label");
        label.textContent = "Minimum Rating:";
        label.classList.add('pm-rating-filter', 'option-v2');
        Object.assign(label.style, {
            display: "flex",
            gap: "0.5em",
            alignItems: "center",
            fontFamily: "sans-serif",
            fontSize: "0.9em"
        });

        // Input field styled to match LiveChart
        const input = Object.assign(document.createElement("input"), {
            type: "number",
            placeholder: "7.6",
            min: "0",
            max: "10",
            step: "0.1",
            id: "pm-rating-input"
        });
        Object.assign(input.style, {
            width: "4em",
            padding: "0.25em 0.35em",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "0.9em",
            transition: "border-color 0.2s",
            backgroundColor: "#fff"
        });
        label.htmlFor = input.id;
        label.appendChild(input);

        // Add to page
        const filters = container.querySelectorAll('.option-v2.hide-for-small-only');
        const lastFilter = filters[filters.length - 1];
        if (!lastFilter) return console.error("Could NOT find the filters to add onto");
        lastFilter.after(label);

        // Input listener
        input.addEventListener("input", debounce((event) => {
            const value = toNumber(event.target.value, 0);
            filterAnimes(value);
        }, 300));
    }

    function filterAnimes(minRating = 0) {
        const animes = document.querySelectorAll('.anime');

        animes.forEach(anime => {
            const rating = parseFloat(anime.querySelector('.anime-avg-user-rating')?.innerText) || 0;
            if (rating < minRating) {
                hide(anime);
            } else {
                show(anime);
            }
        });
    }

    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    function toNumber(input, defaultValue = 0) {
        const number = parseFloat(input);
        return Number.isNaN(number) ? defaultValue : number;
    }

    function hide(element) { element.style.display = "none"; }
    function show(element) { element.style.display = ""; }

})();
