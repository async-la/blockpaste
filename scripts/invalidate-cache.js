const AWS = require('aws-sdk')
const cloudfront = new AWS.CloudFront()

const CF_DISTRIBUTION_IDS = ['E2YBBDJWO5XCJ8', 'E3R71YWGO5K8U6']

CF_DISTRIBUTION_IDS.forEach(invalidateCache)

function invalidateCache(distributionId) {
  if (!distributionId) {
    console.log('No Cloudfront DistributionId. noop')
  } else {
    // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudFront.html#createInvalidation-property
    const params = {
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: Math.random().toString(),
        Paths: {
          Quantity: 1,
          Items: ['/*'],
        },
      },
    }

    cloudfront.createInvalidation(params, (err, data) => {
      if (err) {
        console.log('Cloudfront Invalidation creation error')
        throw err
      } else {
        console.log('Cloudfront Invalidation successfully created')
        console.log(data)
      }
    })
  }
}
