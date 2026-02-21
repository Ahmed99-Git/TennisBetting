const baseURL = "https://guest.api.arcadia.pinnacle.com/0.1/sports/33";
const matchUrlInfo = {
  url: `${baseURL}/matchups`,
  method: 'get',
  params: {
    withSpecials: false,
    brandId: 0
  },
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Content-Type": "application/json",
    "referer": "https://www.pinnacle.bet/",
  }
};
const marketUrlInfo = {
  url: `${baseURL}/markets/straight`,
  method: 'get',
  params: {
    primaryOnly: false,
    withSpecials: false
  },
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Content-Type": "application/json",
    "referer": "https://www.pinnacle.bet/",
  }
};

module.exports = {
  matchUrlInfo,
  marketUrlInfo
};