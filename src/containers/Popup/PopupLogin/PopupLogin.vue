<template>
  <v-layout>
    <v-flex xs12 text-center>
      <v-dialog class="login-dialog-modal" :value="loginDialog && showModal" :max-width="dialogMaxWidth" persistent>
        <v-card class="login-dialog-container">
          <div class="login-header">
            <v-btn class="close-btn" icon aria-label="Close Login Modal" @click="closeDialog">
              <v-icon :size="closeBtnSize">$vuetify.icons.close</v-icon>
            </v-btn>
            <div class="verifier-title1 text_2--text mb-2">
              <span>{{ t('dappLogin.signIn') }}</span>
            </div>
            <div class="verifier-title2 text_2--text">
              <LoginTitle :is-dapp="true" />
            </div>
          </div>
          <div class="buttons-holder">
            <LoginButtons :login-buttons-array="loginButtonsArray" :is-popup="true" :last-login-info="lastLoginInfo" @triggerLogin="startLogin" />
          </div>
          <div
            v-if="!canHideDisclaimer1 && !viewMoreOptions && thirdPartyAuthenticators.length > 0"
            class="text_3--text footer-notes"
            :class="$vuetify.breakpoint.xsOnly ? 'pb-13' : ''"
          >
            <span>{{ t('dappLogin.termsAuth01') }}</span>
            <br />
            <span>{{ thirdPartyAuthenticators }}.</span>
            <a
              class="privacy-learn-more text_3--text"
              href="https://docs.tor.us/key-infrastructure/role-of-torus-nodes/oauth2-vs-proxy-sign-in"
              target="_blank"
              rel="noreferrer noopener"
            >
              {{ t('dappLogin.termsLearnMore') }}
            </a>
          </div>
          <div class="d-flex justify-center footer-links pt-3 pb-4" :class="{ smallScreen: $vuetify.breakpoint.width < 385 }">
            <div>
              <a class="text-decoration-none text_2--text" :href="tncLink" target="_blank" rel="noreferrer noopener">
                {{ t('dappLogin.termsConditions') }}
              </a>
            </div>
            <v-spacer></v-spacer>
            <div>
              <a class="text-decoration-none text_2--text" :href="privacyPolicy" target="_blank" rel="noreferrer noopener">
                {{ t('dappLogin.privacyPolicy') }}
              </a>
            </div>
            <v-spacer></v-spacer>
            <div v-if="!whiteLabel.isActive">
              <div class="d-flex align-center mb-2">
                <span class="text_2--text mr-1">{{ t('dappLogin.poweredBy') }}</span>
                <img alt="Torus Logo" height="10" :src="getLogo.logo" />
              </div>
              <div class="caption text-right text_2--text font-italic">{{ t('dappLogin.version').replace(/\{version\}/gi, appVersion) }}</div>
            </div>
          </div>
        </v-card>
      </v-dialog>
    </v-flex>
  </v-layout>
</template>

<script>
import log from 'loglevel'
import { mapActions, mapGetters, mapState } from 'vuex'

import LoginButtons from '../../../components/Login/LoginButtons'
import LoginTitle from '../../../components/Login/LoginTitle'
import config from '../../../config'
import { GITHUB, GOOGLE_VERIFIER, TWITTER } from '../../../utils/enums'
import { thirdPartyAuthenticators } from '../../../utils/utils'

export default {
  name: 'PopupLogin',
  components: { LoginButtons, LoginTitle },
  props: {
    loginDialog: {
      type: Boolean,
      dafault: false,
    },
  },
  data() {
    return {
      GOOGLE_VERIFIER,
      showModal: true,
      viewMoreOptions: false,
    }
  },
  computed: {
    ...mapGetters(['loginButtonsArray', 'getLogo']),
    ...mapState({
      whiteLabel: 'whiteLabel',
      loginConfig: (state) => state.embedState.loginConfig,
      lastLoginInfo: 'lastLoginInfo',
    }),
    localeSelected() {
      return this.$i18n.locale
    },
    tncLink() {
      let finalLink = 'https://docs.tor.us/legal/terms-and-conditions'
      const { isActive, tncLink } = this.whiteLabel
      if (isActive && tncLink) {
        finalLink = tncLink[this.localeSelected] || tncLink[Object.keys(tncLink)[0]]
      }
      return finalLink
    },
    privacyPolicy() {
      let finalLink = 'https://docs.tor.us/legal/privacy-policy'
      const { isActive, privacyPolicy } = this.whiteLabel
      if (isActive && privacyPolicy) {
        finalLink = privacyPolicy[this.localeSelected] || privacyPolicy[Object.keys(privacyPolicy)[0]]
      }
      return finalLink
    },
    contactLink() {
      let finalLink = 'https://t.me/TorusLabs'
      const { isActive, contactLink } = this.whiteLabel
      if (isActive && contactLink) {
        finalLink = contactLink[this.localeSelected] || contactLink[Object.keys(contactLink)[0]]
      }
      return finalLink
    },
    canHideDisclaimer1() {
      const { isActive, disclaimerHide } = this.whiteLabel
      const isUsingSpecialLogin = this.loginButtonsArray.some((x) => x.jwtParameters && x.showOnModal)
      return disclaimerHide && !isUsingSpecialLogin && isActive
    },
    canHideDisclaimer2() {
      const { isActive, disclaimerHide } = this.whiteLabel
      const isUsingSpecialLogin = this.loginButtonsArray.some((x) => (x.typeOfLogin === GITHUB || x.typeOfLogin === TWITTER) && x.showOnModal)
      return disclaimerHide && !isUsingSpecialLogin && isActive
    },
    thirdPartyAuthenticators() {
      return thirdPartyAuthenticators(this.loginConfig)
    },
    dialogMaxWidth() {
      if (this.$vuetify.breakpoint.height >= 1440) return '35vh'
      if (this.$vuetify.breakpoint.height >= 1080) return '42vh'
      return '375px'
    },
    closeBtnSize() {
      if (this.$vuetify.breakpoint.height >= 1440) return '2.6vh'
      if (this.$vuetify.breakpoint.height >= 1080) return '2.6vh'
      return '24px'
    },
    appVersion() {
      return config.appVersion.replace('v', '')
    },
  },
  methods: {
    async startLogin(verifier, email) {
      try {
        this.showModal = false
        await this.triggerLogin({ verifier, calledFromEmbed: true, login_hint: email })
      } catch (error) {
        log.error(error)
        this.closeDialog()
      } finally {
        this.showModal = true
      }
    },
    closeDialog() {
      this.$emit('closeDialog')
    },
    ...mapActions({
      triggerLogin: 'triggerLogin',
    }),
  },
}
</script>

<style lang="scss" scoped>
@import 'PopupLogin.scss';
</style>
