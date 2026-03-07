<template>
  <div
    v-show="visible"
    class="
      absolute
      flex-none
      w-40
      text-black
      bg-gray-300
      cursor-pointer
      cls-context-menu
    "
    style="border: outset #EEE;"
    :style="{left: menuLeft, top: menuTop, bottom: menuBottom}"
    @mouseleave="$emit('close')"
  >
    <ul>
      <li
        class="
          p-1
          pl-3.5
          hover:text-white
          hover:bg-gray-500
          active:bg-gray-400
        "
        @click="$emit('close')"
      >
        Close Menu
      </li>
      <li style="border: inset #EEE 3px;"></li>
      <li
        v-show="menuGoTo"
        class="
          p-1
          pl-3.5
          hover:text-white
          hover:bg-gray-500
          active:bg-gray-400
        "
        @click="$emit('go-to-place')"
      >
        Go to
      </li>
      <li v-show="menuToggleRole" class="
        p-1
        pl-3.5
        hover:text-white
        hover:bg-gray-500
        active:bg-gray-400
      ">
        <input type="checkbox" id="role" :checked="showRole" @change="$emit('role-change', $event.target.checked)" />
        <label for="role"> Users Roles</label>
      </li>
      <li v-show="menuToggleXP || menuToggleXp" class="
        p-1
        pl-3.5
        hover:text-white
        hover:bg-gray-500
        active:bg-gray-400
      ">
        <input type="checkbox" id="XP" :checked="showXP || showXp" @change="$emit('xp-change', $event.target.checked)" />
        <label for="XP"> Users XP</label>
      </li>
      <li v-show="menuToggleSpeech" class="
        p-1
        pl-3.5
        hover:text-white
        hover:bg-gray-500
        active:bg-gray-400
      ">
        <input type="checkbox" id="speech" :checked="tts" @change="$emit('speech-change', $event.target.checked)" />
        <label for="speech"> Text To Speech</label>
      </li>
      <li
        v-show="menuBeamTo"
        class="
          p-1
          pl-3.5
          hover:text-white
          hover:bg-gray-500
          active:bg-gray-400
        "
        @click="$emit('beam-to')"
      >
        Beam to
      </li>
      <li
        v-show="menuWhisper"
        class="
          p-1
          pl-3.5
          text-gray-500
          hover:text-white
          hover:bg-gray-500
          active:bg-gray-400
        "
      >
        Start Whisper
      </li>
      <li
        v-show="menuInviteChat"
        class="
          p-1
          pl-3.5
          text-gray-500
          hover:text-white
          hover:bg-gray-500
          active:bg-gray-400
        "
      >
        Invite Chat
      </li>
      <li
        v-show="menuIgnore"
        class="
          p-1
          pl-3.5
          hover:text-white
          hover:bg-gray-500
          active:bg-gray-400
        "
        @click="$emit('ignore')"
      >
        Ignore
      </li>
      <li
        v-show="menuBuy"
        class="
          p-1
          pl-3.5
          hover:text-white
          hover:bg-gray-500
          active:bg-gray-400
        "
        @click="$emit('buy')"
      >
        Buy
      </li>
      <li
        v-show="menuMove"
        class="
          p-1
          pl-3.5
          hover:text-white
          hover:bg-gray-500
          active:bg-gray-400
        "
        @click="$emit('move-object')"
      >
        Move
      </li>
      <li
        v-show="menuTake"
        class="
          p-1
          pl-3.5
          hover:text-white
          hover:bg-gray-500
          active:bg-gray-400
        "
        @click="$emit('take-object')"
      >
        Take
      </li>
      <li
        v-show="menuDrop"
        class="
          p-1
          pl-3.5
          hover:text-white
          hover:bg-gray-500
          active:bg-gray-400
        "
        @click="$emit('drop-object')"
      >
        Drop
      </li>
      <li
        v-show="menuDestroy"
        class="
          p-1
          pl-3.5
          text-gray-500
          hover:text-white
          hover:bg-gray-500
          active:bg-gray-400
        "
      >
        Destroy
      </li>
      <li
        v-show="menuProperties"
        class="
          p-1
          pl-3.5
          hover:text-white
          hover:bg-gray-500
          active:bg-gray-400
        "
        @click="$emit('properties')"
      >
        Properties
      </li>
      <li v-if="menuRequestBackpack && activePanelUsers" style="border:inset #EEE 3px;"></li>
      <li
        v-show="menuRequestBackpack"
        class="
          p-1
          pl-3.5
          hover:text-white
          hover:bg-gray-500
          active:bg-gray-400
        "
        @click="$emit('request-backpack')"
      >
        Request Objects
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "UserMenu",
  props: {
    visible: { type: Boolean, default: false },
    menuLeft: [String, Number],
    menuTop: [String, Number],
    menuBottom: [String, Number],
    activePanelUsers: {
      type: Boolean,
      default: false,
    },
    menuGoTo: Boolean,
    menuToggleRole: Boolean,
    menuToggleXp: Boolean,
    menuToggleXP: Boolean,
    menuToggleSpeech: Boolean,
    menuBeamTo: Boolean,
    menuWhisper: Boolean,
    menuInviteChat: Boolean,
    menuIgnore: Boolean,
    menuDrop: Boolean,
    menuMove: Boolean,
    menuTake: Boolean,
    menuBuy: Boolean,
    menuDestroy: Boolean,
    menuProperties: Boolean,
    menuRequestBackpack: Boolean,
    showRole: Boolean,
    showXp: Boolean,
    showXP: Boolean,
    tts: Boolean,
  },
};
</script>
