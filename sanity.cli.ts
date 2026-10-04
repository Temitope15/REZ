import {defineCliConfig} from 'sanity/cli'
import {config} from 'dotenv'
config({path: '.env.local'})

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production',
  },
})
