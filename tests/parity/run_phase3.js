const { run } = require('./jest-lite');

require('./async-await.test.js');
require('./classes.test.js');
require('./destructuring.test.js');
require('./control-flow.test.js');
require('./template-literals.test.js');
require('./spread-rest.test.js');

run();
