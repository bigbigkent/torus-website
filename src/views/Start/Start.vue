<template>
  <v-container fill-height text-center>
    <v-layout class="redirect-container" :class="$vuetify.breakpoint.xsOnly ? 'redirect-container--mobile' : ''" row wrap align-center>
      <v-flex text-center>
        <BoxLoader />
      </v-flex>
      <div class="footer">
        <div class="powered-by">{{ t('login.secured-by') }}</div>
        <img height="26" :src="require(`@/assets/images/web3auth.svg`)" alt="Web3Auth" />
      </div>
    </v-layout>
  </v-container>
</template>

<script>
import { safeatob } from '@toruslabs/openlogin-utils'
import log from 'loglevel'

import BoxLoader from '../../components/helpers/BoxLoader'
import { getOpenLoginInstance } from '../../openlogin'

export default {
  name: 'Start',
  components: { BoxLoader },
  async created() {
    try {
      const { loginProvider, state, skipTKey, ...rest } = this.$route.query
      const stateParams = JSON.parse(safeatob(state))
      log.info('logging in with', loginProvider, state, skipTKey, rest)
      const { whiteLabel, loginConfig = {} } = stateParams
      const openLogin = await getOpenLoginInstance(whiteLabel, loginConfig)
      await openLogin.login({
        loginProvider,
        getWalletKey: true,
        relogin: true,
        appState: state,
        skipTKey: skipTKey === 'true',
        extraLoginOptions: {
          ...rest,
        },
      })
    } catch (error) {
      log.info(error, 'something went wrong')
    }
  },
}
</script>

<style lang="scss" scoped>
@import 'Start.scss';
</style>
