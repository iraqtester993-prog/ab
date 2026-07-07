function openModal() {
  document.getElementById('modalOverlay').classList.add('active')
  document.getElementById('modal').classList.add('active')
  document.body.classList.add('no-scroll')
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active')
  document.getElementById('modal').classList.remove('active')
  document.body.classList.remove('no-scroll')
}

function showToast(msg, type = 'info', duration = 3000) {
  const t = document.getElementById('toast')
  if (!t) return
  t.textContent = msg
  t.className = 'toast show ' + type
  t.style.display = 'block'
  t.style.animation = 'none'
  requestAnimationFrame(() => { t.style.animation = '' })
  setTimeout(() => {
    t.classList.remove('show')
    setTimeout(() => { t.style.display = '' }, 300)
  }, duration)
}

function setModalBody(html) {
  document.getElementById('modalBody').innerHTML = html
}

function setModalTitle(text) {
  document.getElementById('modalTitle').textContent = text
}

window.openModal = openModal
window.closeModal = closeModal
window.showToast = showToast

export { openModal, closeModal, showToast, setModalBody, setModalTitle }
