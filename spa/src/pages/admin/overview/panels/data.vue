<template>
  <div class="flex flex-wrap gap-10 p-5" v-if="accessLevel && accessLevel.includes('security')">
    <div class="px-5 pt-2 border rounded-lg w-96" v-if="accessLevel.includes('admin')">
      <div class="text-2xl font-bold text-green">Activity Data</div>
      <div class="p-2">
        <table class="w-full">
          <tr>
            <td>Daily Users: </td>
            <td>{{ Number(dailyUsers).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Weekly Users: </td>
            <td>{{ Number(weeklyUsers).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Monthly Users: </td>
            <td>{{ Number(monthlyUsers).toLocaleString() }}</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="px-5 py-2 border rounded-lg w-96" v-if="accessLevel.includes('admin')">
      <div class="text-2xl font-bold text-green">Member Data</div>
      <div class="p-2">
        <table class="w-full">
          <tr>
            <td>Total Members: </td>
            <td>{{ Number(totalUsers).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>New Members Past Week: </td>
            <td>{{ Number(newMembersLastWeek).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>New Members Past Month: </td>
            <td>{{ Number(newMembersLastMonth).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>New Members Past Year: </td>
            <td>{{ Number(newMembersLastYear).toLocaleString() }}</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="px-5 pt-2 border rounded-lg w-96">
      <div class="text-2xl font-bold text-green">Newest Members</div>
      <div class="p-2">
        <table class="w-full">
          <tr>
            <td v-if="wealthiestUsers.length !== 0">
              <table class="w-full">
                <tr v-for="user in newestUsers" :key="user.id">
                  <td>
                    <div class="grid grid-cols-2">
                      <div>{{ user.username }}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
            <td class="py-5 px-10" v-else>No users found</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="px-5 pt-2 border rounded-lg w-96" v-if="accessLevel.includes('admin')">
      <div class="text-2xl font-bold text-green">Recently Hired</div>
      <div class="p-2">
        <table class="w-full">
          <tr>
            <td v-if="latestHires.length !== 0">
              <table class="w-full">
                <tr v-for="user in latestHires" :key="user.id">
                  <td>
                    <div class="flex">
                      <div>{{ user.username }} as {{ user.roleName }}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
            <td class="py-5 px-10" v-else>No users found</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="px-5 pt-2 border rounded-lg w-96" v-if="accessLevel.includes('admin')">
      <div class="text-2xl font-bold text-green">Money Data</div>
      <div class="p-2">
        <table class="w-full">
          <tr>
            <td>Average Balance: </td>
            <td>{{ Number(averageMoney).toLocaleString() }} cc</td>
          </tr>
          <tr>
            <td>Highest Balance: </td>
            <td>{{ Number(highestMoney).toLocaleString() }} cc</td>
          </tr>
          <tr>
            <td>Community Balance: </td>
            <td>{{ Number(totalMoney).toLocaleString() }} cc</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="px-5 pt-2 border rounded-lg w-96" v-if="accessLevel.includes('admin')">
      <div class="text-2xl font-bold text-green">Wealthiest Members</div>
      <div class="p-2">
        <table class="w-full">
          <tr>
            <td v-if="wealthiestUsers.length !== 0">
              <table class="w-full">
                <tr v-for="user in wealthiestUsers" :key="user.id">
                  <td>
                    <div class="grid grid-cols-2">
                      <div>{{ user.username }} </div>
                      <div>{{ Number(user.balance).toLocaleString() }} cc</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
            <td class="py-5 px-10" v-else>No users found</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="px-5 pt-2 border rounded-lg w-96">
      <div class="text-2xl font-bold text-green">Security Data</div>
      <div class="p-2">
        <table class="w-full">
          <tr>
            <td>Banned Last 7 Days: </td>
            <td>{{ Number(recentlyBanned.length).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Jailed Last 7 Days: </td>
            <td>{{ Number(recentlyJailed.length).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Bans Ending Soon: </td>
            <td>{{ Number(bansEndingSoon.length).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Total Jailed Members: </td>
            <td>{{ Number(totalJailedUsers).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Total Banned Members: </td>
            <td>{{ Number(totalBannedUsers).toLocaleString() }}</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="px-5 pt-2 border rounded-lg w-96" v-if="accessLevel.includes('admin')">
      <div class="text-2xl font-bold text-green">Place Data</div>
      <div class="p-2">
        <table class="w-full">
          <tr>
            <td>Total Colonies: </td>
            <td>{{ Number(totalColonies).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Total Neighborhoods: </td>
            <td>{{ Number(totalNeighborhoods).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Total Blocks: </td>
            <td>{{ Number(totalBlocks).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Total Free Spots: </td>
            <td>{{ Number(totalFreeSpots - totalHomes).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Total Homes: </td>
            <td>{{ Number(totalHomes).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Total Storage Areas: </td>
            <td>{{ Number(totalStorageAreas).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Total Clubs: </td>
            <td>{{ Number(totalClubs).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Total Private: </td>
            <td>{{ Number(totalPrivate).toLocaleString() }}</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="px-5 pt-2 border rounded-lg w-96" v-if="accessLevel.includes('admin')">
      <div class="text-2xl font-bold text-green">Object Data</div>
      <div class="p-2">
        <table class="w-full">
          <tr>
            <td>Average Objects Owned: </td>
            <td>{{ Number(averageObjects).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Total Owned Objects: </td>
            <td>{{ Number(totalObjects).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Total For Sale: </td>
            <td>{{ Number(totalObjectsForSale).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Average Price: </td>
            <td>{{ Number(averagePriceForSale).toLocaleString() }} cc</td>
          </tr>
          <tr>
            <td>Highest Price: </td>
            <td>{{ Number(highestPriceForSale).toLocaleString() }} cc</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="px-5 pt-2 border rounded-lg w-96" v-if="accessLevel.includes('admin')">
      <div class="text-2xl font-bold text-green">Mall Object Data</div>
      <div class="p-2">
        <table class="w-full">
          <tr>
            <td>Average Mall Object Price: </td>
            <td>{{ Number(averageMallPrice).toLocaleString() }} cc</td>
          </tr>
          <tr>
            <td>Highest Mall Object Price: </td>
            <td>{{ Number(highestMallPrice).toLocaleString() }} cc</td>
          </tr>
          <tr>
            <td>Total Pending Objects: </td>
            <td>{{ Number(totalPending).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Total Accepted Objects: </td>
            <td>{{ Number(totalAccepted).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Total Rejected Objects: </td>
            <td>{{ Number(totalRejected).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Total Stocked Objects: </td>
            <td>{{ Number(totalStocked).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Total Destocked Objects: </td>
            <td>{{ Number(totalDestocked).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Total Mall Objects: </td>
            <td>{{ Number(totalDestocked).toLocaleString() }}</td>
          </tr>
          <tr>
            <td>Total Uploads: </td>
            <td>{{ Number(totalUploads).toLocaleString() }}</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="w-full">
      <div class="text-3xl p-2 font-bold">Activity</div>
      <hr />
    </div>
    <div class="px-5 pt-2 border rounded-lg w-96">
      <div class="text-2xl font-bold text-green">Top 5 Active Places</div>
      <div class="p-2">
        <table class="w-full">
          <tr>
            <td v-if="activePlaces.length !== 0">
              <ul>
                <li v-for="activeChat in activePlaces" :key="activeChat.id">
                  {{ activeChat.name }}
                </li>
              </ul>
            </td>
            <td class="py-5 px-10" v-else>No recent activity found</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="px-5 pt-2 border rounded-lg w-96">
      <div class="text-2xl font-bold text-green">Top 5 Active Messageboards</div>
      <div class="p-2">
        <table class="w-full">
          <tr>
            <td v-if="activeMB.length !== 0">
              <ul>
                <li v-for="activeBoard in activeMB" :key="activeBoard.id">
                  {{ activeBoard.name }}
                </li>
              </ul>
            </td>
            <td class="py-5 px-10" v-else>No recent activity found</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="px-5 pt-2 border rounded-lg w-full">
      <div class="text-2xl font-bold text-green">Bans Ending Soon</div>
      <div class="p-2">
        <table class="w-full">
          <tr>
            <td v-if="bansEndingSoon.length !== 0">
              <table>
                <tr v-for="unbanned in bansEndingSoon" :key="unbanned.id">
                  <td>
                    <div class="grid grid-cols-2 w-96 pb-2">
                      <div>Username:</div>
                      <div class="text-green">{{ unbanned.username }}</div>
                      <div>Ending:</div>
                      <div>{{ new Date(unbanned.end_date).toDateString() }}</div>
                      <hr /><hr />
                    </div>
                  </td>
                </tr>
              </table>
            </td>
            <td class="py-5 px-10" v-else>There are no bans ending soon</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="px-5 pt-2 border rounded-lg w-full">
      <div class="text-2xl font-bold text-green">Recent Jail Ban Issued</div>
      <div class="p-2">
        <table class="w-full">
          <tr>
            <td v-if="recentlyJailed.length !== 0">
              <table>
                <tr v-for="jailed in recentlyJailed" :key="jailed.id">
                  <td>
                    <div class="grid grid-cols-2 w-96 pb-2">
                      <div>Username:</div>
                      <div class="text-green">{{ jailed.username }}</div>
                      <div>Until:</div>
                      <div>{{ new Date(jailed.end_date).toDateString() }}</div>
                      <hr /><hr />
                    </div>
                  </td>
                </tr>
              </table>
            </td>
            <td class="py-5 px-10" v-else>No recently jailed users found</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="px-5 pt-2 border rounded-lg w-full">
      <div class="text-2xl font-bold text-green">Recent Full Ban Issued</div>
      <div class="p-2">
        <table class="w-full">
          <tr>
            <td v-if="recentlyBanned.length !== 0">
              <table>
                <tr v-for="banned in recentlyBanned" :key="banned.id">
                  <td>
                    <div class="grid grid-cols-2 w-96 pb-2">
                      <div>Username:</div>
                      <div class="text-green">{{ banned.username }}</div>
                      <div>Until:</div>
                      <div>{{ new Date(banned.end_date).toDateString() }}</div>
                      <hr /><hr />
                    </div>
                  </td>
                </tr>
              </table>
            </td>
            <td class="py-5 px-10" v-else>No recently banned users found</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="px-5 pt-2 border rounded-lg w-full">
      <div class="text-2xl font-bold text-green">Transactions in the Last Hour</div>
      <div class="p-2">
        <table class="w-full">
          <tr>
            <td v-if="latestTransactions.length !== 0">
              <table>
                <tr v-for="transaction in latestTransactions" :key="transaction.id">
                  <td>
                    <div class="flex ">
                      <div class="p-2">{{ Number(transaction.amount).toLocaleString() }} cc was sent from 
                        <span class="text-green">{{ transaction.sender_username[0].username }}</span>
                         to
                        <span class="text-green">{{ transaction.recipient_username[0].username }}</span>
                         for {{ transaction.reason }} 
                         on
                        {{ new Date(transaction.created_at).toDateString() }}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
            <td class="py-5 px-10" v-else>No recent transactions found</td>
          </tr>
        </table>
      </div>
    </div>
  </div>
  <div v-else>
    <div class="text-5xl p-5">Access Denied</div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "EconomicPanel",
  data: () => {
    return {
      averageMoney: 0,
      averageObjects: 0,
      averageMallPrice: 0,
      averagePriceForSale: 0,
      highestMoney: 0,
      highestPriceForSale: 0,
      highestMallPrice: 0,
      totalUsers: 0,
      totalMoney: 0,
      totalUploads: 0,
      totalMallObjects: 0,
      totalPending: 0,
      totalAccepted: 0,
      totalRejected: 0,
      totalStocked: 0,
      totalDestocked: 0,
      totalObjects: 0,
      totalObjectsForSale: 0,
      totalBannedUsers: 0,
      totalJailedUsers: 0,
      totalColonies: 0,
      totalNeighborhoods: 0,
      totalBlocks: 0,
      totalFreeSpots: 0,
      totalHomes: 0,
      totalStorageAreas: 0,
      totalClubs: 0,
      totalPrivate: 0,
      activePlaces: [],
      activeMB: [],
      recentlyBanned: [],
      recentlyJailed: [],
      bansEndingSoon: [],
      latestTransactions: [],
      wealthiestUsers: [],
      newestUsers: [],
      latestHires: [],
      dailyUsers: 0,
      weeklyUsers: 0,
      monthlyUsers: 0,
      newMembersLastWeek: 0,
      newMembersLastMonth: 0,
      newMembersLastYear: 0,
    };
  },
  props: [
    "accessLevel",
  ],
  methods: {
    async getCommunityData() {
      const communityData = await this.$http.get('/admin/get-community-data');
      const path = communityData.data.results;
      // Activity Data
      if(!Number.isNaN(path.activity.totalDaily)){
        this.dailyUsers = path.activity.totalDaily[0].count;
      }
      if(!Number.isNaN(path.activity.totalWeekly)){
        this.weeklyUsers = path.activity.totalWeekly[0].count;
      }
      if(!Number.isNaN(path.activity.totalMonthly)){
        this.monthlyUsers = path.activity.totalMonthly[0].count;
      }
      if(!Number.isNaN(path.activity.newWeekly)){
        this.newMembersLastWeek = path.activity.newWeekly[0].count;
      }
      if(!Number.isNaN(path.activity.newMonthly)){
        this.newMembersLastMonth = path.activity.newMonthly[0].count;
      }
      if(!Number.isNaN(path.activity.newYearly)){
        this.newMembersLastYear = path.activity.newYearly[0].count;
      }
      
      // Security Data
      this.recentlyBanned = path.security.recentBan;
      this.recentlyJailed = path.security.recentJail;
      this.bansEndingSoon = path.security.banEnding;
      if(!Number.isNaN(path.security.totalBanned)){
        this.totalBannedUsers = path.security.totalBanned[0].count;
      }
      
      if(!Number.isNaN(path.security.totalJailed)) {
        this.totalJailedUsers = path.security.totalJailed[0].count;
      }

      // Place Data
      if(!Number.isNaN(path.place.totalColonies)){
        this.totalColonies = path.place.totalColonies[0].count;
      }
      if(!Number.isNaN(path.place.totalHoods)){
        this.totalNeighborhoods = path.place.totalHoods[0].count;
      }
      if(!Number.isNaN(path.place.totalBlocks)){
        this.totalBlocks = path.place.totalBlocks[0].count;
      }
      if(!Number.isNaN(path.place.totalFreeSpots)){
        this.totalFreeSpots = path.place.totalFreeSpots[0].count;
      }
      if(!Number.isNaN(path.place.totalHomes)){
        this.totalHomes = path.place.totalHomes[0].count;
      }
      if(!Number.isNaN(path.place.totalStorages)){
        this.totalStorageAreas = path.place.totalStorages[0].count;
      }
      if(!Number.isNaN(path.place.totalClubs)){
        this.totalClubs = path.place.totalClubs[0].count;
      }
      if(!Number.isNaN(path.place.totalPrivate)){
        this.totalPrivate = path.place.totalPrivate[0].count;
      }

      // Member Data
      if(!Number.isNaN(path.member.totalMembers)){
        this.totalUsers = path.member.totalMembers[0].count;
      }
      this.newestUsers = path.member.newestMembers;

      // Money Data
      this.averageMoney = path.money.averageBalance[0].balance;
      this.highestMoney = path.money.topBalance;
      this.totalMoney = path.money.totalBalance[0].balance;
      this.wealthiestUsers = path.money.wealthiestUsers;
      this.latestTransactions = path.money.latestTransactions;

      // Object Data
      this.totalObjects = path.object.instances.totalUserObjects;
      this.averageObjects = Math.round(this.totalObjects / this.totalUsers);
      if(!Number.isNaN(path.object.instances.totalForSale)){
        this.totalObjectsForSale = path.object.instances.totalForSale[0].count;
      }
      if(!Number.isNaN(path.object.instances.highestUserPrice)){
        this.highestPriceForSale = path.object.instances.highestUserPrice[0].price;
      }
      if(!Number.isNaN(path.object.instances.averageUserPrice)){
        this.averagePriceForSale = path.object.instances.averageUserPrice[0].price;
      }
      if(!Number.isNaN(path.object.mall.averagePrice)){
        this.averageMallPrice = Math.round(path.object.mall.averagePrice[0].price);
      }
      if(!Number.isNaN(path.object.mall.highestPrice)){
        this.highestMallPrice = Math.round(path.object.mall.highestPrice[0].price);
      }
      if(!Number.isNaN(path.object.mall.totalApproved)){
        this.totalAccepted = Math.round(path.object.mall.totalApproved[0].count);
      }
      if(!Number.isNaN(path.object.mall.totalDestocked)){
        this.totalDestocked = Math.round(path.object.mall.totalDestocked[0].count);
      }
      if(!Number.isNaN(path.object.mall.totalMallObjects)){
        this.totalMallObjects = Math.round(path.object.mall.totalMallObjects[0].count);
      }
      if(!Number.isNaN(path.object.mall.totalPendinig)){
        this.totalPending = Math.round(path.object.mall.totalPending[0].count);
      }
      if(!Number.isNaN(path.object.mall.totalRejected)){
        this.totalRejected = Math.round(path.object.mall.totalRejected[0].count);
      }
      if(!Number.isNaN(path.object.mall.totalStocked)){
        this.totalStocked = Math.round(path.object.mall.totalStocked[0].count);
      }
      if(!Number.isNaN(path.object.mall.totalUploaded)){
        this.totalUploads = Math.round(path.object.mall.totalUploaded[0].count);
      }

      // Active places
      this.activePlaces = path.messages.chat;
      this.activeMB = path.messages.messageboard;

      // New Hires
      this.latestHires = path.hiring.latestRoleHire
    },
  },
  created() {
    this.getCommunityData();
  },
  mounted() {
  },
});
</script>
