const axios = require('axios');

async function getTennisInfoByAxios(urlInfo) {

    const response = await axios.get(urlInfo.url, { params: urlInfo.params, headers: urlInfo.headers })
    return response.data;
}

module.exports = {
    getTennisInfoByAxios
}


