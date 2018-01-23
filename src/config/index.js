import localConfig from './config.local'
import defaultConfig from './config.default'

export default {
  ...defaultConfig,
  ...localConfig,
}
