fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://upload.wikimedia.org/wikipedia/commons/e/ea/Logo_Secretar%C3%ADa_de_Educaci%C3%B3n_Guerrero.png'))
  .then(r => r.json())
  .then(data => console.log(data.contents.substring(0, 50)))
  .catch(console.error);
