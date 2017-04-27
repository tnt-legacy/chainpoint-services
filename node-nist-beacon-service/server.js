const beacon = require('nist-randomness-beacon')
require('dotenv').config()

const REDIS_CONNECT_URI = process.env.REDIS_CONNECT_URI || 'redis://redis:6379'
const r = require('redis')
const redis = r.createClient(REDIS_CONNECT_URI)

const NIST_KEY_BASE = process.env.NIST_KEY_BASE || 'nist:'

let retrieveLatest = () => {
  beacon.last(function (err, res) {
    if (err) {
      console.error(err)
    } else {
      console.log(res)

      // The latest value we have will always be stored under
      // the 'last' key which can always be used if present.
      // It will be updated every minute if the service API
      // is available. If the service becomes unavailable this
      // key will become stale and eventually be removed so
      // clients watching this key should be prepared for it
      // to no longer be available.
      redis.set(NIST_KEY_BASE + 'last', JSON.stringify(res))
      redis.expire(NIST_KEY_BASE + 'last', 60 * 60 * 1) // 1 hour

      // Keep an historical chain of the keys we've retrieved
      // for a period of time, indexed by the timestamp.
      redis.set(NIST_KEY_BASE + res.timeStamp, JSON.stringify(res))
      redis.expire(NIST_KEY_BASE + res.timeStamp, 60 * 60 * 24 * 31) // 31 days

      // Keep a list of all timestamps we have stored
      redis.lpush(NIST_KEY_BASE + 'timestamps', res.timeStamp)
    }
  })
}

// run once when the service starts
retrieveLatest()

// Run every minute, at the top of the minute.
setInterval(function () {
  if (new Date().getSeconds() === 0) retrieveLatest()
}, 1000)
