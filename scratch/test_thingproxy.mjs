fetch('https://thingproxy.freeboard.io/fetch/' + encodeURIComponent('https://upload.wikimedia.org/wikipedia/commons/e/ea/Logo_Secretar%C3%ADa_de_Educaci%C3%B3n_Guerrero.png'))
  .then(r => console.log(r.status))
  .catch(console.error);
