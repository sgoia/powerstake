const moment = require('moment');
const accounting  = require('accounting');
const dayjs = require('dayjs');
const BigNumber  = require('bignumber.js');

function noExponents(value) {
  const number = Number(value);
  const data = String(number).split(/[eE]/);
  if (data.length === 1) {
    return data[0];
  }

  let z = '';
  const sign = number < 0 ? '-' : '';
  const str = data[0].replace('.', '');
  let mag = Number(data[1]) + 1;

  if (mag < 0) {
    z = `${sign}0.`;
    // eslint-disable-next-line no-plusplus
    while (mag++) {
      z += '0';
    }
    return z + str.replace(/^-/, '');
  }
  mag -= str.length;
  // eslint-disable-next-line no-plusplus
  while (mag--) {
    z += '0';
  }
  return str + z;
};

function toSmartContractDecimals(value, decimals) {
	const numberWithNoExponents = noExponents((Number(value) * 10 ** decimals).toFixed(0));
	return numberWithNoExponents;
};

function timeToSmartContractTime(time) {
	return parseInt(new Date(time).getTime() / 1000, 10);
};

function fromSmartContractTimeToMinutes(time) {
	return dayjs.unix(time).toDate();
};

function fromExponential(x) {
	let ret = x;
	if (Math.abs(x) < 1.0) {
		const e = parseInt(x.toString().split('e-')[1], 10);
		if (e) {
			ret *= 10 ** (e - 1);
			ret = `0.${new Array(e).join('0')}${ret.toString().substring(2)}`;
		}
	}
	else {
		let e = parseInt(x.toString().split('+')[1], 10);
		if (e > 20) {
			e -= 20;
			ret /= 10 ** e;
			ret += new Array(e + 1).join('0');
		}
	}
	return ret;
};

//export default Numbers;
module.exports = { toSmartContractDecimals, timeToSmartContractTime, fromSmartContractTimeToMinutes, noExponents, fromExponential };
