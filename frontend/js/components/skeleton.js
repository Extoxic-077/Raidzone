export function createProductSkeleton() {
  const card = document.createElement('div');
  card.className = 'skeleton-card';

  const img = document.createElement('div');
  img.className = 'skeleton-img';

  const body = document.createElement('div');
  body.className = 'skeleton-body';

  const line1 = document.createElement('div');
  line1.className = 'skeleton-line w-80';

  const line2 = document.createElement('div');
  line2.className = 'skeleton-line w-60';

  const line3 = document.createElement('div');
  line3.className = 'skeleton-line w-40';

  const footer = document.createElement('div');
  footer.className = 'skeleton-footer';

  const price = document.createElement('div');
  price.className = 'skeleton-price';

  const btn = document.createElement('div');
  btn.className = 'skeleton-btn';

  footer.appendChild(price);
  footer.appendChild(btn);

  body.appendChild(line1);
  body.appendChild(line2);
  body.appendChild(line3);
  body.appendChild(footer);

  card.appendChild(img);
  card.appendChild(body);

  return card;
}

export function createDetailSkeleton() {
  const wrap = document.createElement('div');
  wrap.className = 'detail-skeleton';

  const imgSkel = document.createElement('div');
  imgSkel.className = 'skeleton-detail-img';

  const infoSkel = document.createElement('div');
  infoSkel.className = 'skeleton-detail-info';

  const sizes = [
    { w: '40%', h: '14px' },
    { w: '85%', h: '36px' },
    { w: '60%', h: '18px' },
    { w: '100%', h: '90px' },
    { w: '70%', h: '50px' },
    { w: '100%', h: '48px' },
  ];

  for (const s of sizes) {
    const b = document.createElement('div');
    b.className = 'skeleton-block';
    b.style.width = s.w;
    b.style.height = s.h;
    infoSkel.appendChild(b);
  }

  wrap.appendChild(imgSkel);
  wrap.appendChild(infoSkel);

  return wrap;
}
