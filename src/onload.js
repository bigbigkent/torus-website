import NodeDetailManager from '@toruslabs/fetch-node-details'
import log from 'loglevel'
import LocalMessageDuplexStream from 'post-message-stream'
import Web3 from 'web3'

import TorusController from './controllers/TorusController'
import setupMultiplex from './controllers/utils/setupMultiplex'
import { BSC_MAINNET, BSC_MAINNET_CODE, BSC_MAINNET_DISPLAY_NAME, REQUEST_TKEY_SEED_PHRASE_INPUT, REQUREST_TKEY_INPUT } from './utils/enums'
import { getIFrameOrigin, isMain, isPwa, storageAvailable } from './utils/utils'
// import store from './store'
let storeReference
let deferredDispatch = []
function getStore() {
  return (
    storeReference || {
      dispatch(...arguments_) {
        deferredDispatch.push(() => {
          storeReference.dispatch(...arguments_)
        })
      },
    }
  )
}

export function injectStore(s) {
  storeReference = s
  deferredDispatch.forEach((fn) => fn())
  deferredDispatch = []
}

function triggerUi(type, payload, request) {
  log.info(`TRIGGERUI:${type}`, payload, request)
  getStore().dispatch('showPopup', { payload, request })
}

function triggerThresholdUi(type, payload) {
  log.info(`TRIGGER THRESHOLD UI:${type}`, payload)
  getStore().dispatch('showThresholdKeyUi', { type, data: payload })
}

function onloadTorus(torus) {
  let sessionData

  if (storageAvailable(!isPwa ? 'sessionStorage' : 'localStorage')) {
    const storage = isPwa ? localStorage : sessionStorage
    sessionData = storage.getItem('torus-app')
  }

  const sessionCachedNetwork = (sessionData && JSON.parse(sessionData).networkType) || {
    host: BSC_MAINNET,
    chainId: BSC_MAINNET_CODE,
    networkName: BSC_MAINNET_DISPLAY_NAME,
  }

  const torusController = new TorusController({
    sessionCachedNetwork,
    showUnconfirmedMessage: triggerUi.bind(window, 'showUnconfirmedMessage'),
    unlockAccountMessage: triggerUi.bind(window, 'unlockAccountMessage'),
    showUnapprovedTx: triggerUi.bind(window, 'showUnapprovedTx'),
    openPopup: triggerUi.bind(window, 'bindopenPopup'),
    requestTkeyInput: triggerThresholdUi.bind(window, REQUREST_TKEY_INPUT),
    requestTkeySeedPhraseInput: triggerThresholdUi.bind(window, REQUEST_TKEY_SEED_PHRASE_INPUT),
    storeProps: () => {
      const { state } = getStore()
      const { selectedAddress, wallet } = state || {}
      return { selectedAddress, wallet }
    },
    rehydrate() {
      getStore().dispatch('rehydrate')
    },
  })

  torus.torusController = torusController

  torusController.provider.setMaxListeners(100)
  torus.web3 = new Web3(torusController.provider)

  // update node details
  torus.nodeDetailManager = new NodeDetailManager({ network: process.env.VUE_APP_PROXY_NETWORK, proxyAddress: process.env.VUE_APP_PROXY_ADDRESS })
  torus.nodeDetailManager
    .getNodeDetails()
    .then((nodeDetails) => log.info(nodeDetails))
    .catch((error) => log.error(error))

  // we use this to start accounttracker balances
  torusController.setupControllerConnection()

  if (isMain) return torus

  const metamaskStream = new LocalMessageDuplexStream({
    name: 'iframe_metamask',
    target: 'embed_metamask',
    targetWindow: window.parent,
  })

  const communicationStream = new LocalMessageDuplexStream({
    name: 'iframe_comm',
    target: 'embed_comm',
    targetWindow: window.parent,
  })

  torus.metamaskMux = setupMultiplex(metamaskStream)
  torus.communicationMux = setupMultiplex(communicationStream)
  torus.communicationMux.setMaxListeners(50)

  const providerOutStream = torus.metamaskMux.getStream('provider')

  torusController.setupUntrustedCommunication(providerOutStream, getIFrameOrigin())

  return torus
}

export default onloadTorus
