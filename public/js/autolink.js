const regex = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi;

const button = (url) => { return `<a href="${url}" title="Be careful when clicking on unknown links.">${url}</a>` }

document.addEventListener('DOMContentLoaded', () => {
  var str = document.getElementById("bio").innerText;
  
  window.original = str;

  str = str.replace(regex, (matched, index, original) => {
    matched = matched.split(" ").join("");
    matched = matched.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
    return button(' https://' + matched)
  });
  
  document.getElementById("bio").innerHTML = str;
})

