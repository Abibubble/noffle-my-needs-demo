// The avatar carousel from the team's register and profile pages.
// It shows which avatar goes with which number.

import { AVATARS } from './data.js';

export function avatarSrc(number) {
  const n = Number(number);
  const valid = Number.isInteger(n) && n >= 1 && n <= AVATARS.length;
  return `img/avatar${valid ? n : 1}.svg`;
}

export function renderCarousel(container, headingTag = 'h4') {
  if (!container) return;
  const items = AVATARS.map(
    ({ number, description }, i) => `
                        <div class="carousel-item${i === 0 ? ' active' : ''}">
                            <img class="d-block w-50 ml-15" src="${avatarSrc(number)}" alt="${description}">
                            <div class="carousel-caption d-none d-md-block">
                                <${headingTag} class="card-heading-title">Avatar ${number}</${headingTag}>
                            </div>
                        </div>`,
  ).join('');

  container.innerHTML = `
            <div id="carouselControls" class="carousel slide" data-bs-ride="carousel">
                <div class="carousel-inner">
                    ${items}
                </div>
                <a class="carousel-control-prev" href="#carouselControls" role="button" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon tap-target" aria-hidden="true">
                        <i class="fas fa-chevron-left"></i>
                    </span>
                    <span class="sr-only">Previous</span>
                </a>
                <a class="carousel-control-next" href="#carouselControls" role="button" data-bs-slide="next">
                    <span class="carousel-control-next-icon tap-target" aria-hidden="true">
                        <i class="fas fa-chevron-right"></i>
                    </span>
                    <span class="sr-only">Next</span>
                </a>
            </div>`;
}
