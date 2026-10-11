import {t} from './language.js';
function call(method, ...args) {
  if (window.RADAR_PREVIEW) return window.RADAR_PREVIEW.call(method, ...args);
  return new Promise((resolve, reject) => google.script.run.withSuccessHandler(resolve).withFailureHandler(error=>reject(Error(t(error.message||String(error)))))[method](...args));
}
export {
  call
};
