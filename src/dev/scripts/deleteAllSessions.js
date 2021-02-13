const { exec } = require('child_process')



exec(
  'redis-cli --scan --pattern tenjin:session:* | xargs redis-cli del',
  () =>  console.log('all sessions have been deleted')
)