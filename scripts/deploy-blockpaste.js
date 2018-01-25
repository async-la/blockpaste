let exec = require('child_process').exec
let curl = `curl https://www.bitrise.io/app/d69fb12120c710f6/build/start.json --data '{"hook_info":{"type":"bitrise","api_token":"q04RgLEgC6F0D9GCBF8TyA"},"build_params":{"branch":"master","workflow_id":"deploy-blockpaste"},"triggered_by":"curl"}'`

exec(curl, function (err, stdout, stderr) {
  console.log('## Deployment result:', stdout, err)
})
