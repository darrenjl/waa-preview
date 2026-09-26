(function () {
  const iso = d => d.toISOString().slice(0, 10)
  const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d }

  function defaultDates(root) {
    const arrival = root.querySelector('[name=arrival]')
    const departure = root.querySelector('[name=departure]')
    if (!arrival || !departure) return
    arrival.min = iso(addDays(0))
    arrival.value = arrival.value || iso(addDays(14))
    departure.value = departure.value || iso(addDays(16))
    arrival.addEventListener('change', () => {
      if (departure.value <= arrival.value) {
        const d = new Date(arrival.value); d.setDate(d.getDate() + 2); departure.value = iso(d)
      }
      departure.min = arrival.value
    })
  }

  // Search → location page carrying the stay details.
  document.querySelectorAll('[data-search]').forEach(form => {
    defaultDates(form)
    form.addEventListener('submit', e => {
      e.preventDefault()
      const data = new FormData(form)
      const params = new URLSearchParams({ arrival: data.get('arrival'), departure: data.get('departure'), guests: data.get('guests') })
      window.location.href = `${data.get('where')}?${params}`
    })
  })

  const incoming = new URLSearchParams(window.location.search)

  // Location page: filter cards by guests, carry dates through to property pages.
  const cards = document.querySelector('[data-cards]')
  const guestFilter = document.querySelector('[data-guest-filter]')
  if (cards && guestFilter) {
    const apply = () => {
      const n = Number(guestFilter.value)
      cards.querySelectorAll('.card').forEach(c => { c.hidden = n > 0 && Number(c.dataset.sleeps) < n })
    }
    const g = Number(incoming.get('guests') || 0)
    const opts = [...guestFilter.options].map(o => Number(o.value))
    guestFilter.value = String(opts.filter(v => v <= g).pop() || 0)
    guestFilter.addEventListener('change', apply)
    apply()
    if (incoming.toString()) cards.querySelectorAll('.card').forEach(c => { c.href += `?${incoming}` })
  }

  // Property page: booking card builds the Lodgify checkout link.
  const booking = document.querySelector('[data-booking]')
  if (booking) {
    ;['arrival', 'departure', 'guests'].forEach(k => {
      const v = incoming.get(k); if (v) booking.querySelector(`[name=${k}]`).value = v
    })
    defaultDates(booking)
    const link = booking.querySelector('[data-book]')
    const update = () => {
      const url = new URL(booking.dataset.checkout)
      url.searchParams.set('arrival', booking.querySelector('[name=arrival]').value)
      url.searchParams.set('departure', booking.querySelector('[name=departure]').value)
      url.searchParams.set('adults', booking.querySelector('[name=guests]').value)
      link.href = url.toString()
    }
    booking.addEventListener('input', update)
    booking.addEventListener('change', update)
    update()
  }

  // Gallery lightbox.
  const lb = document.querySelector('[data-lightbox]')
  if (lb) {
    const photos = JSON.parse(lb.dataset.photos)
    const img = lb.querySelector('img')
    let i = 0
    const show = n => { i = (n + photos.length) % photos.length; img.src = photos[i] }
    document.querySelectorAll('.g-item').forEach((b, n) => b.addEventListener('click', () => { show(n); lb.showModal() }))
    document.querySelector('[data-gallery-all]')?.addEventListener('click', () => { show(0); lb.showModal() })
    lb.querySelector('[data-lb-close]').addEventListener('click', () => lb.close())
    lb.querySelector('[data-lb-prev]').addEventListener('click', () => show(i - 1))
    lb.querySelector('[data-lb-next]').addEventListener('click', () => show(i + 1))
    lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1) })
  }

  // Maps: MapLibre with OpenFreeMap tiles (no key); default attribution left visible.
  document.querySelectorAll('[data-map]').forEach(el => {
    if (!window.maplibregl) return
    const points = JSON.parse(el.dataset.map).filter(p => p.lat)
    if (!points.length) return
    const map = new maplibregl.Map({
      container: el,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [points[0].lng, points[0].lat],
      zoom: Number(el.dataset.zoom || 12),
      cooperativeGestures: true,
    })
    const bounds = new maplibregl.LngLatBounds()
    points.forEach(p => {
      const label = document.createElement(p.href ? 'a' : 'span')
      label.textContent = p.name
      if (p.href) label.href = p.href
      const popup = new maplibregl.Popup({ offset: 18 }).setDOMContent(label)
      new maplibregl.Marker({ color: '#1d4e5f' }).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(map)
      bounds.extend([p.lng, p.lat])
    })
    if (points.length > 1) map.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 0 })
  })
})()
