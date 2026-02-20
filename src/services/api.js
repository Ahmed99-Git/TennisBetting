const axios = require('axios');

async function getTennisInfoByAxios(pinnacleUrl) {

    const response = await axios.get(pinnacleUrl)
  .then(function (response) {
    try {
        const tableInfo = response.data;
        return tableInfo;
      } catch (e) {
        console.log('Cannot get the Pinnacle Tennis Info:', e);
      }
      return null;
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  return response;
}

module.exports = {
    getTennisInfoByAxios
}


