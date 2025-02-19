<template>
  <v-container class="dapp-parent d-flex flex-column justify-start align-center" :class="$vuetify.breakpoint.xsOnly ? 'xs-parent px-4' : ''">
    <div
      class="discover-header d-flex mt-3"
      :class="$vuetify.breakpoint.smAndDown ? 'flex-column justify-start align-start' : 'flex-row justify-space-between'"
    >
      <h3 class="discover-title font-weight-bold" :style="{ color: $vuetify.theme.isDark ? '#EEF2F4' : '#5C6C7F' }">
        {{ t('navBar.discover') }}
      </h3>

      <v-layout mx-n2 class="dapp-filters mt-5 mt-md-0">
        <v-flex xs6 px-sm-2 class="filter-width">
          <v-menu offset-y>
            <template #activator="{ on }">
              <v-btn
                block
                outlined
                height="42"
                class="d-flex align-center filter-selector pa-2"
                :class="{ 'theme--dark': $vuetify.theme.isDark }"
                v-on="on"
              >
                <v-icon x-small class="text_2--text">$vuetify.icons.activities</v-icon>
                <span class="ml-1 text_1--text" :class="$vuetify.breakpoint.xsOnly ? 'caption' : 'body-2'">{{ selectedCategory }}</span>
                <v-icon class="ml-auto text_2--text">$vuetify.icons.select</v-icon>
              </v-btn>
            </template>
            <v-card class="pa-3">
              <v-list min-width="190" dense>
                <v-list-item-group color="torusBrand1">
                  <v-list-item
                    v-for="category in categoryList"
                    :key="category"
                    :class="selectedCategory === category ? 'active' : ''"
                    @click="selectedCategory = category"
                  >
                    <v-list-item-content>
                      <v-list-item-title>{{ category }}</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-list-item-group>
              </v-list>
            </v-card>
          </v-menu>
        </v-flex>
        <v-flex xs6 px-sm-2 class="filter-width">
          <v-menu offset-y>
            <template #activator="{ on }">
              <v-btn
                block
                outlined
                height="42"
                class="d-flex align-center filter-selector pa-2"
                :class="{ 'theme--dark': $vuetify.theme.isDark }"
                v-on="on"
              >
                <v-icon class="text_2--text" small>$vuetify.icons.calendar</v-icon>
                <span class="ml-1 text_1--text" :class="$vuetify.breakpoint.xsOnly ? 'caption' : 'body-2'">
                  {{ getDisplayName(selectedNetwork) }}
                </span>
                <v-icon class="ml-auto text_2--text">$vuetify.icons.select</v-icon>
              </v-btn>
            </template>
            <v-card class="pa-3">
              <v-list min-width="190" dense>
                <v-list-item-group color="torusBrand1">
                  <v-list-item
                    v-for="network in networkList"
                    :key="network"
                    :class="selectedNetwork === network ? 'active' : ''"
                    @click="selectedNetwork = network"
                  >
                    <v-list-item-content>
                      <v-list-item-title>{{ getDisplayName(network) }}</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-list-item-group>
              </v-list>
            </v-card>
          </v-menu>
        </v-flex>
      </v-layout>
    </div>

    <v-container class="f-width">
      <v-data-iterator
        :disable-pagination="$vuetify.breakpoint.xsOnly"
        :items="filteredList"
        item-key="url"
        :items-per-page.sync="itemsPerPage"
        :page.sync="page"
        hide-default-footer
        :loading="isLoadingDapps || redirectUrl"
        :no-results-text="t('walletDiscover.noData')"
        :no-data-text="t('walletDiscover.noData')"
      >
        <template #loading>
          <div>
            <BoxLoader class="mt-5 mb-2" />
            <div>{{ redirectUrl ? t('walletDiscover.redirecting').replace(/\{url\}/gi, redirectUrl.href) : t('walletDiscover.loading') }}</div>
          </div>
        </template>
        <template #default="props">
          <v-row>
            <v-col v-for="dapp in props.items" :key="dapp.title + dapp.network" class="col-sm-6 col-md-4 col-lg-3 col-xl-3">
              <Dapp :dapp="dapp" :show-network="selectedNetwork === ALL_NETWORKS" />
            </v-col>
          </v-row>
        </template>
      </v-data-iterator>
    </v-container>

    <div v-if="!$vuetify.breakpoint.xsOnly && pageCount > 1" class="text-center pt-6">
      <v-pagination
        v-model="page"
        class="activity-pagination"
        prev-icon="$vuetify.icons.page_prev"
        next-icon="$vuetify.icons.page_next"
        :length="pageCount"
      ></v-pagination>
    </div>
  </v-container>
</template>
<script>
import log from 'loglevel'
import { mapState } from 'vuex'

import BoxLoader from '../../components/helpers/BoxLoader'
import Dapp from '../../components/WalletDiscover/Dapp'
import torus from '../../torus'
import { SUPPORTED_NETWORK_TYPES } from '../../utils/enums'

const ALL_CATEGORIES = 'All DApps'
const ALL_NETWORKS = 'All networks'
export default {
  name: 'WalletDiscover',
  components: { BoxLoader, Dapp },
  data() {
    return {
      isLoadingDapps: true,
      redirectUrl: undefined,
      dapps: [],
      selectedCategory: ALL_CATEGORIES,
      selectedNetwork: ALL_NETWORKS,
      page: 1,
      itemsPerPage: 20,
    }
  },
  computed: {
    ...mapState(['networkType', 'supportedNetworks']),
    networkList() {
      return [
        ALL_NETWORKS,
        ...new Set(
          this.dapps
            .reduce((networkList, dapp) => {
              if (dapp?.network?.length) {
                networkList.push(dapp.network)
              }
              return networkList
            }, [])
            ?.sort()
        ),
      ]
    },
    categoryList() {
      return [
        ALL_CATEGORIES,
        ...new Set(
          this.dapps
            .reduce((categoryList, dapp) => {
              if (dapp?.category?.length) {
                categoryList.push(dapp.category)
              }
              return categoryList
            }, [])
            ?.sort()
        ),
      ]
    },
    filteredList() {
      const filtered =
        this.dapps?.filter(
          (dapp) =>
            (this.selectedCategory === ALL_CATEGORIES || this.selectedCategory === dapp.category) &&
            (this.selectedNetwork === ALL_NETWORKS || this.selectedNetwork === dapp.network)
        ) || []

      return filtered
    },
    pageCount() {
      return Math.ceil(this.filteredList.length / this.itemsPerPage)
    },
  },
  async mounted() {
    this.$vuetify.goTo(0)
    try {
      if (this.$route.query.url) {
        this.redirectUrl = new URL(this.$route.query.url)
        window.location.href = this.redirectUrl.href
      }
    } catch (error) {
      log.error(error)
    } finally {
      // Fetch dapps if not redirecting
      if (!this.redirectUrl) {
        const dappRecords = await this.fetchDapps()
        this.dapps = dappRecords?.records || []
        this.isLoadingDapps = false
        this.selectedNetwork = this.$store?.state?.networkType?.host || ALL_NETWORKS // set default network as user's setting default
      }
    }
  },
  created() {
    this.ALL_NETWORKS = ALL_NETWORKS
  },
  methods: {
    async fetchDapps() {
      let data = {}
      try {
        data = await torus.torusController.prefsController.fetchDappList()
      } catch {
        this.isLoadingDapps = false
      }
      return data
    },
    getDisplayName(name) {
      return SUPPORTED_NETWORK_TYPES[name]?.networkName || name
    },
  },
}
</script>
<style lang="scss" scoped>
@import 'WalletDiscover.scss';
</style>
