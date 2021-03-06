// noinspection JSUnresolvedFunction,JSUnresolvedVariable

const elasticsearch = require('elasticsearch')

// Instantiate an Elasticsearch client.
const elasticsearchUrl = process.env.ELASTICSEARCH_HOSTS || 'http://dockerhost:9200'
const client = new elasticsearch.Client({
	hosts: [elasticsearchUrl],
})

const index = process.env.BOOKS_INDEX || 'books-v3'

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const path = require('path')

app.use(bodyParser.json())
app.set('port', process.env.PORT || 3001)
app.use(express.static(path.join(__dirname, 'public')))
app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*')
	res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS')
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
	next()
})

app.get('/search', function (req, res) {
	client
		.search({
			index: index,
			body: {
				"size": 10,
				"from": 0,
				"query": {
					"function_score": {
						"query": {
							"multi_match": {
								"query": req.query['q'],
								"fields": ["title", "author", "description", "genres"],
								"fuzziness": "AUTO"
							}
						},
						"boost_mode": "multiply",
						"field_value_factor": {
							"field": "upVotes",
							"modifier": "sqrt",
							"missing": 0.75
						}
					}
				}
			},
			type: '_doc'
		})
		.then((results) => {
			res.send(results.hits.hits)
		})
		.catch((err) => {
			console.log(err)
			res.send([])
		})
})

async function setup () {

	await client.ping({
		requestTimeout: 30000,
	})

	console.log('Elasticsearch cluster is ready!')

	const indexExists = await client.indices.exists({index: index})

	if (!indexExists) {
		await client.indices.create({
			index: index,
			body: {
				mappings: {
					properties: {
						title: {type: 'text'},
						author: {type: 'text'},
						description: {type: 'text'},
						genres: {type: 'text'},
						thumbnail: {type: 'keyword'},
					}
				}
			}
		})

		console.log('Index created!')
	}
}

setup().catch(e => console.error('Setup failed with', e))

app.listen(app.get('port'), async function () {
	console.log('Running at port', app.get('port'))
})
