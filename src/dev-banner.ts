// Production and preview share one Pages site, told apart by URL path only.
if (location.pathname.includes('/dev/')) {
  document.body.classList.add('is-dev');
}

export {};
