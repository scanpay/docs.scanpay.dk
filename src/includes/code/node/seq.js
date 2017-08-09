const apikey = 'Your scanpay API key';
const scanpay = require('scanpay')(apikey);

const options = {
    auth: apikey // You can also define it here (Optional)
};

scanpay.seq(0, options).then(res => {
    console.log(res);
});
