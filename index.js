const amqp = require('amqplib')
const express = require('express')
// const bodyParser = require('body-parser')

const generateId = () => Math.random().toString(16).slice(2)

const app = express()
// app.use(bodyParser.json())

const mapping = new Map()

app.get('/mapping', (req, res) => {
  res.json(Object.keys(mapping))
})

const producer = async (app) => {
  const connection = await amqp.connect(process.env.MESSAGE_QUEUE)
  console.log('creating channel & queues for producer')
  const channel = await connection.createChannel()
  await channel.assertQueue('responses')
  await channel.assertQueue('requests')

  const enqueueResult = (id, handler, data) => {
    mapping.set(id, {
      handler,
      data
    })
  }

  const dequeueResult = (id) => {
    mapping.delete(id)
  }

  channel.consume('responses', async message => {
    const {content, properties: {correlationId: id}} = message

    if (!mapping.has(id)) {
      return
    }

    const result = JSON.parse(content)
    const {handler, data} = mapping.get(id)

    handler.json({
      ...data,
      ...result
    })
    channel.ack(message)
    dequeueResult(id)
  })

  app.get('/', (req, res) => {
    const id = generateId()

    enqueueResult(id, res, {
      ok: true
    })

    channel.sendToQueue('requests', Buffer.from(JSON.stringify({
      int: Number(req.query.int),
      time: process.hrtime.bigint().toString()
    })), {
      correlationId: id,
      replyTo: 'responses'
    })
  })
}

const consumer = async () => {
  const connection = await amqp.connect(process.env.MESSAGE_QUEUE)
  console.log('creating channel & queues for consumer')
  const channel = await connection.createChannel()
  await channel.assertQueue('requests')
  // await channel.assertQueue('responses')

  console.log('setting up requests consumer')
  channel.consume('requests', async message => {
    const {content, properties: {correlationId, replyTo}} = message
    const {int, time} = JSON.parse(content)

    channel.sendToQueue(replyTo, Buffer.from(JSON.stringify({
      int: int ** 3,
      time: Number(process.hrtime.bigint() - BigInt(time)) / 1e6
    })), {
      correlationId
    })
    channel.ack(message)
  })
}

producer(app)
  .then(() => app.listen(3000, consumer))
