fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://firebasestorage.googleapis.com/v0/b/web-tec-68.appspot.com/o/some-image.jpg?alt=media'))
  .then(r => console.log(r.status))
  .catch(console.error);
