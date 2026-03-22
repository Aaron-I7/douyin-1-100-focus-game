const { ok } = require('./_shared');
const { dySDK } = require('@open-dy/node-server-sdk');

module.exports = async function getOpenId(params, context) {
  let openId = '';
  try {
    const serviceContext = dySDK.context(context);
    const reqContext = serviceContext.getContext();
    openId = reqContext && reqContext.openId ? reqContext.openId : '';
  } catch (error) {
    openId = '';
  }

  return ok(openId);
};