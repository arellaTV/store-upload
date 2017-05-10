module.exports = {
  get: (filename) => {
    let uri = 'http://localhost:3000/api/v1/audios';
    if (filename) {
      uri = `${uri}?filename=${filename}`;
    }
    return fetch(uri)
      .then(response => response.json());
  }
};
