
const express = require('express')
const cors = require('cors')

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand
} = require('@aws-sdk/lib-dynamodb')

require('dotenv').config()

const app = express()

app.use(cors())
app.use(express.json())

// AWS SDK automatically uses the EC2 IAM role
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1'
})

const db = DynamoDBDocumentClient.from(client)

const TABLE_NAME = 'Certificates'
const PORT = process.env.PORT || 5000

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' })
})

// Generate certificate
app.post('/api/certificates', async (req, res) => {
  try {
    const { id, name, email, course, date } = req.body

    if (!id || !name || !email || !course || !date) {
      return res.status(400).json({
        message: 'All certificate fields are required'
      })
    }

    const item = {
      certificateId: id,
      name,
      email,
      course,
      date
    }

    await db.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ConditionExpression: 'attribute_not_exists(certificateId)'
    }))

    res.status(201).json({
      message: 'Certificate saved successfully',
      certificate: item
    })

  } catch (error) {
    console.error('Certificate save error:', error)

    res.status(500).json({
      message: 'Unable to save certificate'
    })
  }
})

// Verify certificate
app.get('/api/certificates/:id', async (req, res) => {
  try {
    const result = await db.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        certificateId: req.params.id
      }
    }))

    if (!result.Item) {
      return res.status(404).json({
        message: 'Certificate not found'
      })
    }

    res.json({
      valid: true,
      certificate: result.Item
    })

  } catch (error) {
    console.error('Certificate verification error:', error)

    res.status(500).json({
      message: 'Unable to verify certificate'
    })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`)
})
