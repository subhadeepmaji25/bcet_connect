// backend/src/shared/response/sendResponse.js
const sendResponse = (
  res,
  {
    statusCode = 200,
    success = true,
    message = "Success",
    data = null,
    meta = null
  } = {}
) => {
  const response = {
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  if (meta !== null) {
    response.meta = meta;
  }
  return res
    .status(statusCode)
    .json(response);
};
module.exports = sendResponse;