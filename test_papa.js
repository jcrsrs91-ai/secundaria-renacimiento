const Papa = require('papaparse');
const csv = " sep=,\\nname,age\\nJohn,30\;
const result = Papa.parse(csv, { header: true });
console.log(result.data);