const redis = require('redis')
const session = require('express-session')

const RedisStore = require('connect-redis')(session)

const { REDIS_SESSION_PREFIX } = process.env



let redisClient = redis.createClient()

let store = new RedisStore({ client: redisClient, prefix: REDIS_SESSION_PREFIX})



module.exports = store