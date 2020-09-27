
document.addEventListener('DOMContentLoaded', () => {
  var str = document.getElementById('bio').innerText
  const button = (url) => { return `<a href="${url}" title="Be careful when clicking on unknown links.">${url}</a>` }

  window.original = str
  const r = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi
  str = str.replace(r, (matched, index, original) => {
    matched = matched.split(' ').join('');
    matched = matched.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
    return button(' https://' + matched)
  })
  document.getElementById('bio').innerHTML = str
})
