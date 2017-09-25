/* Copyright (C) 2017 Tierion
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const restify = require('restify')
const env = require('../parse-env.js')('api')
const async = require('async')
const uuidValidate = require('uuid-validate')
const uuidTime = require('uuid-time')
const chpBinary = require('chainpoint-binary')
const _ = require('lodash')

// The redis connection used for all redis communication
// This value is set once the connection has been established
let redis = null

// The custom MIME type for JSON proof array results containing Base64 encoded proof data
const BASE64_MIME_TYPE = 'application/vnd.chainpoint.json+base64'

// The custom MIME type for JSON proof array results containing Base64 encoded proof data
const JSONLD_MIME_TYPE = 'application/vnd.chainpoint.ld+json'

/**
 * GET /proofs/:hash_id handler
 *
 * Expects a path parameter 'hash_id' in the form of a Version 1 UUID
 *
 * Returns a chainpoint proof for the requested Hash ID
 */
async function getProofsByIDV1Async (req, res, next) {
  let hashIdResults = []

  // check if hash_id parameter was included
  if (req.params && req.params.hash_id) {
    // a hash_id was specified in the url, so use that hash_id only

    if (!uuidValidate(req.params.hash_id, 1)) {
      return next(new restify.InvalidArgumentError('invalid request: bad hash_id'))
    }

    hashIdResults.push(req.params.hash_id)
  } else if (req.headers && req.headers.hashids) {
    // no hash_id was specified in url, read from headers.hashids
    hashIdResults = req.headers.hashids.split(',')
  }

  // ensure at least one hash_id was submitted
  if (hashIdResults.length === 0) {
    return next(new restify.InvalidArgumentError('invalid request: at least one hash id required'))
  }

  // ensure that the request count does not exceed the maximum setting
  if (hashIdResults.length > env.GET_PROOFS_MAX_REST) {
    return next(new restify.InvalidArgumentError('invalid request: too many hash ids (' + env.GET_PROOFS_MAX_REST + ' max)'))
  }

  // prepare results array to hold proof results
  hashIdResults = hashIdResults.map((hashId) => {
    let dummy = {
      '@context': 'https://w3id.org/chainpoint/v3',
      'type': 'Chainpoint',
      'hash': '2e75eaf17b8345c67234dfa92e867541ef41dda08baa6f8d5464fac432950794',
      'hash_id_node': hashId.trim(),
      'hash_submitted_node_at': '2017-09-13T19:39:14Z',
      'hash_id_core': hashId.trim(),
      'hash_submitted_core_at': '2017-09-13T19:39:14Z',
      'branches': [
        {
          'label': 'cal_anchor_branch',
          'ops': [
            {
              'l': 'node_id:38c43ae0-98bb-11e7-b797-01d8792cb1c1'
            },
            {
              'op': 'sha-256'
            },
            {
              'l': 'core_id:3984a4b0-98bb-11e7-84e2-0100b26c7d12'
            },
            {
              'op': 'sha-256'
            },
            {
              'l': 'nist:1505331480:be15727665537cfe7f76d5322009adcfbb5e41492b2ba5cabb32dfd221c16e5c2b9265b06271a7fd22644cf8182ffaa83d2ec1560f61b6b1f32555280eeb1982'
            },
            {
              'op': 'sha-256'
            },
            {
              'l': '8e8aef627e7d2d5839d482e788a75e513ce065c7f6057937260d632797d1f460'
            },
            {
              'op': 'sha-256'
            },
            {
              'r': 'b8b87b86286fc735b9f18130077abe342bffc11069f22db4010d27a8c21ddf7b'
            },
            {
              'op': 'sha-256'
            },
            {
              'l': '7d41b0dc2d690d155c30a99cedfd0bd616aaffebb09e040b66d73496a60acc6c'
            },
            {
              'op': 'sha-256'
            },
            {
              'l': '591:1505331557:1:https://b.chainpoint.org:cal:591'
            },
            {
              'r': '33afa4e067674743222bcbf7d43d5143e4512a3be202ca3b2f04f2215c6587aa'
            },
            {
              'op': 'sha-256'
            },
            {
              'anchors': [
                {
                  'type': 'cal',
                  'anchor_id': '591',
                  'uris': [
                    'https://b.chainpoint.org/calendar/591/hash'
                  ]
                }
              ]
            }
          ],
          'branches': [
            {
              'label': 'btc_anchor_branch',
              'ops': [
                {
                  'l': '33afa4e067674743222bcbf7d43d5143e4512a3be202ca3b2f04f2215c6587aa'
                },
                {
                  'op': 'sha-256'
                },
                {
                  'l': 'a88d4dc5051a1668db1534beb5956aaaf1883892af618aec34cd92184987a7a2'
                },
                {
                  'op': 'sha-256'
                },
                {
                  'l': '4e37d3310941bc9fcaeee1476ee3971cdbd73964e5928a1e23148c540aeefd39'
                },
                {
                  'op': 'sha-256'
                },
                {
                  'r': '1c520a1bbac8fb40810b9bc11b29e6628ac41a45771bc73884dbd8167910e8fe'
                },
                {
                  'op': 'sha-256'
                },
                {
                  'r': '6bffd2f130c357082ea629b77436df039abeedbb911f848d0bf18ce41c89aea0'
                },
                {
                  'op': 'sha-256'
                },
                {
                  'l': '010000000166970e159b0d5c41f9023e9265f160061ba0db4fb93abb9862049fdc3bbe9b19010000006a473044022052651258908a534d6cf2ba0fda47a67ee007ec24bf2a57947b0da365033029860220381380cd1b5e31c1e7d1505efb390321286720d8773a0f8542bbbfbeddd64f8f0121032695ca0d3c0f7f8082a6ef66e7127e48d4eb99bef86be99432b897c485962fa8ffffffff020000000000000000226a20'
                },
                {
                  'r': 'dc317800000000001976a9149f1f4038857beedd34cc5ba9f26ac7a20c04d51988ac00000000'
                },
                {
                  'op': 'sha-256-x2'
                },
                {
                  'r': '0ccde01ee0d86f0c838925d0dd2242f052e5c25250bfb611fbb528ce79330738'
                },
                {
                  'op': 'sha-256-x2'
                },
                {
                  'l': 'fd7a8e5e5d1badb3c5223c8ee46e30f13af6631c97657c5e0d66cb2b7ba6e569'
                },
                {
                  'op': 'sha-256-x2'
                },
                {
                  'r': 'f09acf524dfdf864b65206aeb251505d05ff22601b5ac621351157c0a1acd44b'
                },
                {
                  'op': 'sha-256-x2'
                },
                {
                  'l': '99f6f73da68f212e732434c8948cd788ade387233032053283666581fe29dc40'
                },
                {
                  'op': 'sha-256-x2'
                },
                {
                  'r': '8e738efd27645e8a8dc6abd2e041c34e2c2aae5e244d7c4c1fdff00b78e0f487'
                },
                {
                  'op': 'sha-256-x2'
                },
                {
                  'r': '8ab30e09a40186124fbf8fe59246991c573f366e63739ba88eb6e5b96c7ede91'
                },
                {
                  'op': 'sha-256-x2'
                },
                {
                  'l': 'dfdd9a4cb386820b9ffac390b0e339a8aefbf11f5d9515f410240d297ec6ca72'
                },
                {
                  'op': 'sha-256-x2'
                },
                {
                  'l': '8fc3b3e4297292af2701d6ce4835b232c1725ce82bad910de163f3d62629ff85'
                },
                {
                  'op': 'sha-256-x2'
                },
                {
                  'r': 'a6674ea9a11ec9abd43d9ea7342dbd6bf35f32fd9e60437cc809457f72f0e131'
                },
                {
                  'op': 'sha-256-x2'
                },
                {
                  'r': '8a678c207470becf64a37397adecb8b8961f30d3ac40b65bd7b66900731266f9'
                },
                {
                  'op': 'sha-256-x2'
                },
                {
                  'r': '9384c24d79ad908e60c4e7f03ac8e9c5e13108573039affe7a1628a378859b70'
                },
                {
                  'op': 'sha-256-x2'
                },
                {
                  'anchors': [
                    {
                      'type': 'btc',
                      'anchor_id': '485090',
                      'uris': [
                        'https://b.chainpoint.org/calendar/638/data'
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
    return { hash_id: hashId.trim(), proof: dummy }
  })

  res.contentType = 'application/json'
  // res.cache('public', { maxAge: 5 })
  res.send(hashIdResults)
  return next()

  /*
  async.eachLimit(hashIdResults, 50, (hashIdResult, callback) => {
    // validate id param is proper UUIDv1
    if (!uuidValidate(hashIdResult.hash_id, 1)) return callback(null)
    // validate uuid time is in in valid range
    let uuidEpoch = parseInt(uuidTime.v1(hashIdResult.hash_id))
    var nowEpoch = new Date().getTime()
    let uuidDiff = nowEpoch - uuidEpoch
    let maxDiff = env.PROOF_EXPIRE_MINUTES * 60 * 1000
    if (uuidDiff > maxDiff) return callback(null)
    // retrieve proof from storage
    redis.get(hashIdResult.hash_id, (err, proofBase64) => {
      if (err) return callback(null)
      if (requestedType === BASE64_MIME_TYPE) {
        hashIdResult.proof = proofBase64
        return callback(null)
      } else {
        chpBinary.binaryToObject(proofBase64, (err, proofObj) => {
          if (err) return callback(null)
          hashIdResult.proof = proofObj
          return callback(null)
        })
      }
    })
  }, (err) => {
    if (err) return next(new restify.InternalError(err))
    res.contentType = 'application/json'
    res.cache('public', {maxAge: 5})
    res.send(hashIdResults)
    return next()
  })

  */
}

module.exports = {
  getProofsByIDV1Async: getProofsByIDV1Async,
  setRedis: (redisClient) => { redis = redisClient }
}
