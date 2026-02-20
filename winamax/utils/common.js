/** Generate a UUID v4 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}
function getCookieValue(cookieString, name) {
  const match = cookieString.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}
function makeSendMsgContent (route, requestId) {
  const payload = [];
  payload.push("m");
  payload.push({route: route, requestId: requestId});
  return `42${JSON.stringify(payload)}`;
}

module.exports = {
    generateUUID,
    getCookieValue,
    makeSendMsgContent,
};